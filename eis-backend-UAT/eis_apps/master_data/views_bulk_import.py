# backend/eis_apps/master_data/views_bulk_import.py
#
# Generic bulk CSV import — processes large files in batches of 500.
# Uses direct field-level validation instead of DRF serializers to avoid
# failures from read-only/computed/FK fields that don't appear in CSV.
#
# POST /api/data-settings/{model}/bulk-import/
# Body: multipart/form-data  file=<csv_file>  mode=create_only|create_and_update
#
# Returns: { total, created, updated, skipped, failed, errors[], duration_ms }

import csv, io, time, codecs

from django.db import transaction, IntegrityError
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove

BATCH_SIZE = 500
MAX_ROWS   = 50000

from .models import ConsumerType, VoltageType, ConsumerGroup, Location, ConductorType, UnitType, ConnectionType, PlantSize, GridType, ConfigurationType, LineCategory, CircuitType, SubsidyType, TowerType, TransformerType, VoltageLevel, ConsumerSubtype

def coerce_value(value, field_type):
    """Convert a CSV string to the correct Python type."""
    v = str(value or "").strip()
    if field_type == "boolean":
        return v.lower() in ("true", "1", "yes", "active", "")
    if field_type == "integer":
        try: return int(v)
        except: return None
    if field_type == "decimal":
        try: return float(v)
        except: return None
    return v if v != "" else None


def parse_file(file_obj, filename):
    """
    Parse uploaded file — supports CSV, TSV, XLS (TSV), XLSX (TSV), JSON.
    Returns list of dicts with _row key for error reporting.
    """
    import json as _json

    raw = file_obj.read()
    # Strip BOM if present
    if raw.startswith(codecs.BOM_UTF8):
        raw = raw[len(codecs.BOM_UTF8):]
    text = raw.decode("utf-8-sig", errors="replace")
    name = filename.lower()

    # ── JSON ───────────────────────────────────────────────────────
    if name.endswith(".json"):
        try:
            parsed = _json.loads(text)
            arr = parsed if isinstance(parsed, list) else parsed.get("results", [])
            rows = []
            for i, obj in enumerate(arr, start=2):
                cleaned = {str(k).strip(): str(v).strip() if v is not None else ""
                           for k, v in obj.items() if k}
                cleaned["_row"] = i
                rows.append(cleaned)
            return rows
        except Exception as e:
            raise ValueError(f"Invalid JSON: {e}")

    # ── TSV / XLS / XLSX (exported as TSV with BOM) ────────────────
    if name.endswith((".tsv", ".xls", ".xlsx")):
        delimiter = "\t"
        reader = csv.DictReader(io.StringIO(text), delimiter=delimiter)
        rows = []
        for i, row in enumerate(reader, start=2):
            cleaned = {
                k.strip().replace("\ufeff", "").replace("\r", ""): str(v).strip() if v else ""
                for k, v in row.items() if k and k.strip()
            }
            cleaned["_row"] = i
            rows.append(cleaned)
        return rows

    # ── CSV (default) ──────────────────────────────────────────────
    reader = csv.DictReader(io.StringIO(text))
    rows = []
    for i, row in enumerate(reader, start=2):
        cleaned = {
            k.strip().replace("\ufeff", "").replace("\r", ""): str(v).strip() if v else ""
            for k, v in row.items() if k and k.strip()
        }
        cleaned["_row"] = i
        rows.append(cleaned)
    return rows


def map_headers_to_fields(rows, writable_fields):
    """
    Remap row keys from export column labels back to field keys.
    e.g. "Supply Code" -> "supply_code"
    Falls back to snake_case conversion if no direct match.
    """
    if not rows:
        return rows

    # Build a label->key map from writable_fields
    field_names = {name for name, _, _ in writable_fields}
    first_row_keys = set(rows[0].keys()) - {"_row"}

    # If keys already match field names, no remapping needed
    if first_row_keys & field_names:
        return rows

    # Try to map label -> key via simple normalisation
    def normalise(s):
        return s.lower().strip().replace(" ", "_").replace("-", "_").replace("(", "").replace(")", "")

    field_norm = {normalise(name): name for name, _, _ in writable_fields}
    header_map = {}
    for key in first_row_keys:
        norm = normalise(key)
        if norm in field_norm:
            header_map[key] = field_norm[norm]

    if not header_map:
        return rows  # can't remap — let validation report missing fields

    remapped = []
    for row in rows:
        new_row = {"_row": row.get("_row")}
        for k, v in row.items():
            if k == "_row":
                continue
            new_row[header_map.get(k, k)] = v
        remapped.append(new_row)
    return remapped


class BulkImportMixin(APIView):
    """
    Generic bulk CSV import. Subclasses set:
        model           — Django model class
        writable_fields — [(name, type, required), ...]
                          type: text | code | integer | decimal | boolean
        unique_fields   — field names for duplicate detection
        update_fields   — fields to update in create_and_update mode
    """
    parser_classes  = [MultiPartParser, FormParser]
    model           = None
    writable_fields = []   # [(name, type, required)]
    unique_fields   = []
    update_fields   = []
    foreign_keys    = {}   # {'field_name': (ModelClass, 'lookup_field')}

    def get_permissions(self):
        return [IsAuthenticated(), IsDataFocalOrAbove()]

    def post(self, request, *args, **kwargs):
        t_start = time.time()

        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response(
                {"detail": "No file provided. Send file= as multipart/form-data."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        allowed_ext = (".csv", ".tsv", ".xls", ".xlsx", ".json")
        fname = file_obj.name.lower()
        if not any(fname.endswith(ext) for ext in allowed_ext):
            return Response(
                {"detail": "Accepted formats: CSV, TSV, XLS, XLSX, JSON."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        mode = request.data.get("mode", "create_only")

        try:
            all_rows = parse_file(file_obj, file_obj.name)
            
            # Map headers using custom header_mapping if provided, else fallback to auto mapping
            header_mapping = request.data.get("header_mapping")
            if header_mapping:
                try:
                    import json as _json
                    mapping = _json.loads(header_mapping)
                    # mapping: {"model_field": "csv_column"}
                    # invert to mapping: {"csv_column": "model_field"}
                    inv_map = {str(v).strip(): str(k).strip() for k, v in mapping.items() if v}
                    remapped = []
                    for row in all_rows:
                        new_row = {"_row": row.get("_row")}
                        for k, v in row.items():
                            if k == "_row":
                                continue
                            new_row[inv_map.get(k, k)] = v
                        remapped.append(new_row)
                    all_rows = remapped
                except Exception:
                    all_rows = map_headers_to_fields(all_rows, self.writable_fields)
            else:
                all_rows = map_headers_to_fields(all_rows, self.writable_fields)

            if hasattr(self, "preprocess_rows"):
                all_rows = self.preprocess_rows(all_rows, request)
        except Exception as e:
            return Response(
                {"detail": f"Failed to read file: {e}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not all_rows:
            return Response(
                {"detail": "CSV is empty or has no data rows after the header."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if len(all_rows) > MAX_ROWS:
            return Response(
                {"detail": f"File has {len(all_rows):,} rows. Maximum is {MAX_ROWS:,}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Build duplicate lookup: "field:VALUE" -> pk
        exist_lookup = {}
        if self.unique_fields and self.model:
            for rec in self.model.objects.values("pk", *self.unique_fields):
                for uf in self.unique_fields:
                    val = str(rec.get(uf) or "").strip().upper()
                    if val:
                        exist_lookup[f"{uf}:{val}"] = rec["pk"]

        results = {
            "total": len(all_rows),
            "created": 0, "updated": 0,
            "skipped": 0, "failed": 0,
            "errors": [],
        }

        # FK Resolution Cache
        fk_cache = {} # {(model, lookup_field, value): id}

        for batch_start in range(0, len(all_rows), BATCH_SIZE):
            batch = all_rows[batch_start: batch_start + BATCH_SIZE]
            self._process_batch(batch, exist_lookup, fk_cache, mode, results, request)

        results["duration_ms"] = int((time.time() - t_start) * 1000)
        return Response(results, status=status.HTTP_200_OK)

    def _process_batch(self, batch, exist_lookup, fk_cache, mode, results, request):
        to_create = []   # [(row_num, payload)]
        to_update = []   # [(pk, payload)]

        for raw_row in batch:
            row_num  = raw_row.pop("_row", "?")
            raw_data = dict(raw_row)
            payload  = {}
            errors   = {}

            for field_name, field_type, required in self.writable_fields:
                raw_val = raw_data.get(field_name, "").strip()
                if field_type == "code":
                    raw_val = raw_val.upper()
                if required and not raw_val:
                    errors[field_name] = f'"{field_name}" is required'
                    continue
                # ── Foreign Key Resolution ─────────────────────
                if field_type == "fk":
                    if not raw_val:
                        coerced = None
                    else:
                        conf = self.foreign_keys.get(field_name)
                        if not conf:
                            errors[field_name] = f"No FK configuration for {field_name}"
                            continue
                        
                        model_cls, lookup_field = conf
                        cache_key = (model_cls, lookup_field, raw_val.upper())
                        
                        if cache_key in fk_cache:
                            coerced = fk_cache[cache_key]
                        else:
                            try:
                                # First, try UUID if it looks like one
                                import uuid
                                try:
                                    uuid.UUID(raw_val)
                                    obj = model_cls.objects.get(pk=raw_val)
                                except (ValueError, model_cls.DoesNotExist):
                                    # Fallback to lookup field
                                    obj = model_cls.objects.get(**{lookup_field: raw_val})
                                
                                coerced = obj.pk
                                fk_cache[cache_key] = coerced
                            except model_cls.DoesNotExist:
                                errors[field_name] = f"Could not find {model_cls.__name__} with {lookup_field}='{raw_val}'"
                                continue
                            except Exception as e:
                                errors[field_name] = f"Lookup error: {str(e)}"
                                continue
                else:
                    coerced = coerce_value(raw_val, field_type)

                if required and coerced is None:
                    errors[field_name] = f'"{field_name}" could not be parsed as {field_type}'
                    continue
                payload[field_name] = coerced

            # Default is_active
            if "is_active" not in payload:
                raw_ia = raw_data.get("is_active", "true").strip().lower()
                payload["is_active"] = raw_ia in ("true", "1", "yes", "active", "")

            if errors:
                results["failed"] += 1
                results["errors"].append({"row": row_num, "data": raw_data, "errors": errors})
                continue

            # Duplicate detection
            existing_pk = None
            for uf in self.unique_fields:
                val = str(payload.get(uf) or "").strip().upper()
                if val:
                    existing_pk = exist_lookup.get(f"{uf}:{val}")
                    if existing_pk:
                        break

            if existing_pk:
                if mode == "create_and_update":
                    to_update.append((existing_pk, payload))
                else:
                    results["skipped"] += 1
                continue

            to_create.append((row_num, payload))

        # ── Bulk create ────────────────────────────────────────────
        if to_create:
            objs = []
            for row_num, payload in to_create:
                try:
                    obj = self.model(**payload)
                    if request.user.is_authenticated:
                        if hasattr(obj, "created_by_id") and not obj.created_by_id:
                            obj.created_by = request.user
                        if hasattr(obj, "updated_by_id"):
                            obj.updated_by = request.user
                    objs.append((row_num, obj))
                except Exception as e:
                    results["failed"] += 1
                    results["errors"].append({"row": row_num, "data": payload, "errors": {"_server": str(e)[:200]}})

            if objs:
                try:
                    with transaction.atomic():
                        self.model.objects.bulk_create([o for _, o in objs], ignore_conflicts=False)
                        results["created"] += len(objs)
                        for _, obj in objs:
                            for uf in self.unique_fields:
                                val = str(getattr(obj, uf, "") or "").strip().upper()
                                if val:
                                    exist_lookup[f"{uf}:{val}"] = -1
                except Exception:
                    # Fallback: one by one to isolate failures
                    for row_num, obj in objs:
                        try:
                            with transaction.atomic():
                                obj.save()
                            results["created"] += 1
                            for uf in self.unique_fields:
                                val = str(getattr(obj, uf, "") or "").strip().upper()
                                if val:
                                    exist_lookup[f"{uf}:{val}"] = obj.pk
                        except Exception as e:
                            results["failed"] += 1
                            results["errors"].append({
                                "row": row_num,
                                "data": {k: str(getattr(obj, k, "")) for k, _, _ in self.writable_fields},
                                "errors": {"_server": str(e)[:200]},
                            })

        # ── Bulk update ────────────────────────────────────────────
        for existing_pk, payload in to_update:
            try:
                upd = {k: v for k, v in payload.items() if k in self.update_fields}
                if request.user.is_authenticated:
                    try:
                        self.model._meta.get_field("updated_by")
                        upd["updated_by"] = request.user
                    except Exception:
                        pass
                with transaction.atomic():
                    self.model.objects.filter(pk=existing_pk).update(**upd)
                results["updated"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({"row": "?", "data": payload, "errors": {"_server": str(e)[:200]}})


# ══════════════════════════════════════════════════════════════════
# CONCRETE VIEWS (Lookup Tables)
# ══════════════════════════════════════════════════════════════════

class SectorBulkImportView(BulkImportMixin):
    from .models import Sector as _M
    model           = _M
    unique_fields   = ["sector_code", "sector_name"]
    update_fields   = ["sector_name", "is_active"]
    writable_fields = [
        ("sector_code", "code",    True),
        ("sector_name", "text",    True),
        ("is_active",   "boolean", False),
    ]


class ElectricityCategoryBulkImportView(BulkImportMixin):
    from .models import ElectricityCategory as _M, Sector, ElectricityType
    model           = _M
    unique_fields   = ["category_code"]
    update_fields   = ["category_name", "sector", "category_type", "ipcc_code", "is_active"]
    foreign_keys    = {
        "sector": (Sector, "sector_name"),
        "category_type": (ElectricityType, "type_name")
    }
    writable_fields = [
        ("category_code", "code",    True),
        ("category_name", "text",    True),
        ("sector",        "fk",      True),
        ("category_type", "fk",      False),
        ("ipcc_code",     "text",    False),
        ("is_active",     "boolean", False),
    ]


class VehicleTypeBulkImportView(BulkImportMixin):
    from .models import VehicleType as _M
    model           = _M
    unique_fields   = ["vehicle_type_code", "vehicle_type_name"]
    update_fields   = ["vehicle_type_name", "gross_weight_min", "gross_weight_max", "ipcc_code", "is_active"]
    foreign_keys    = {}
    writable_fields = [
        ("vehicle_type_code", "code",    True),
        ("vehicle_type_name", "text",    True),

        ("gross_weight_min",  "decimal", False),
        ("gross_weight_max",  "decimal", False),
        ("ipcc_code",         "text",    False),
        ("is_active",         "boolean", False),
    ]


class MileageBulkImportView(BulkImportMixin):
    from .models import Mileage as _M, VehicleType, VehicleFuelType
    model           = _M
    unique_fields   = []
    update_fields   = ["mileage_kmpl", "ipcc_code", "is_active"]
    foreign_keys    = {
        "vehicle_type": (VehicleType, "vehicle_type_name"),
        "fuel_type": (VehicleFuelType, "fuel_name")
    }
    writable_fields = [
        ("vehicle_type",   "fk",      True),
        ("fuel_type",      "fk",      True),
        ("effective_year", "integer", True),
        ("mileage_kmpl",   "decimal", True),
        ("ipcc_code",      "text",    False),
        ("is_active",      "boolean", False),
    ]


class FuelTypeBulkImportView(BulkImportMixin):
    from .models import FuelType as _M, EnergyCategory
    model           = _M
    unique_fields   = ["fuel_code"]
    update_fields   = ["fuel_name", "parent_fuel", "fuel_category", "description", "ipcc_code", "is_active"]
    foreign_keys    = {
        "parent_fuel": (_M, "fuel_name"),
        "fuel_category": (EnergyCategory, "category_name")
    }
    writable_fields = [
        ("fuel_code",     "code",    True),
        ("fuel_name",     "text",    True),
        ("parent_fuel",   "fk",      False),
        ("fuel_category", "fk",      False),
        ("description",   "text",    False),
        ("ipcc_code",     "text",    False),
        ("is_active",     "boolean", False),
    ]


class BiogasSizeBulkImportView(BulkImportMixin):
    from .models import BiogasSize as _M, ProductionType
    model           = _M
    unique_fields   = ["size_category"]
    update_fields   = ["capacity_m3", "production_type", "density", "annual_operating_hours", "ipcc_code", "is_active"]
    foreign_keys    = {
        "production_type": (ProductionType, "type_name")
    }
    writable_fields = [
        ("size_category",          "text",    True),
        ("production_type",        "fk",      False),
        ("capacity_m3",            "decimal", True),
        ("density",                "decimal", False),
        ("annual_operating_hours", "integer", False),
        ("ipcc_code",              "text",    False),
        ("is_active",              "boolean", False),
    ]


class SolarEnergySizeBulkImportView(BulkImportMixin):
    from .models import SolarEnergySize as _M, Sector
    model           = _M
    unique_fields   = ["category"]
    update_fields   = ["installed_capacity_kwp", "sector", "energy_generation_kwh", "ipcc_code", "is_active"]
    foreign_keys    = {
        "sector": (Sector, "sector_name")
    }
    writable_fields = [
        ("category",               "text",    True),
        ("installed_capacity_kwp", "decimal", True),
        ("sector",                 "fk",      False),
        ("energy_generation_kwh",  "decimal", False),
        ("ipcc_code",              "text",    False),
        ("is_active",              "boolean", False),
    ]


class IndustryClassificationBulkImportView(BulkImportMixin):
    from .models import IndustryClassification as _M
    model           = _M
    unique_fields   = ["classification_code", "classification_name"]
    update_fields   = ["classification_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("classification_code", "code",    True),
        ("classification_name", "text",    True),
        ("ipcc_code",           "text",    False),
        ("description",         "text",    False),
        ("is_active",           "boolean", False),
    ]


class EnergySupplyBulkImportView(BulkImportMixin):
    """
    Bulk CSV import for hierarchical Energy Supply.
    CSV columns: supply_code, supply_name, measurement_unit, energy_category,
                 fuel_type, parent_code, level, sort_order, description, is_active
    """
    from .models import EnergySupply as _M
    model           = _M
    unique_fields   = ["supply_code"]
    update_fields   = [
        "supply_name", "measurement_unit", "energy_category",
        "fuel_type", "level", "sort_order", "description", "is_active",
    ]
    writable_fields = [
        ("supply_code",      "code",    True),
        ("supply_name",      "text",    True),
        ("measurement_unit", "text",    False),
        ("energy_category",  "text",    False),
        ("fuel_type",        "code",    False),
        ("level",            "integer", False),
        ("sort_order",       "integer", False),
        ("description",      "text",    False),
        ("is_active",        "boolean", False),
    ]

    def post(self, request, *args, **kwargs):
        from .models import EnergySupply, EnergyCategory
        
        t_start = time.time()
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided."}, status=400)

        mode = request.data.get("mode", "create_only")

        # Parse CSV
        try:
            from .views_bulk_import import parse_file
            reader = parse_file(file_obj, file_obj.name)
        except Exception as e:
            return Response({"detail": f"Failed to read file: {e}"}, status=400)

        results = {"total": len(reader), "created": 0, "updated": 0,
                   "skipped": 0, "failed": 0, "errors": []}

        # Build a code→obj map for parent resolution
        code_map = {s.supply_code: s for s in EnergySupply.objects.all()}
        # Build category map
        cat_map = {str(c.id): c for c in EnergyCategory.objects.all()}
        cat_map.update({c.category_code: c for c in EnergyCategory.objects.all()})

        for i, row in enumerate(reader, start=2):
            try:
                code        = str(row.get("supply_code", "")).strip().upper()
                name        = str(row.get("supply_name", "")).strip()
                unit        = str(row.get("measurement_unit", "")).strip()
                cat         = str(row.get("energy_category", "")).strip().upper()
                ftype       = str(row.get("fuel_type", "")).strip().upper()
                parent_code = str(row.get("parent_code", "")).strip().upper()
                level_raw   = str(row.get("level", "")).strip()
                sort_raw    = str(row.get("sort_order", "0")).strip()
                desc        = str(row.get("description", "")).strip()
                active_raw  = str(row.get("is_active", "true")).strip().lower()

                if not code:
                    raise ValueError("supply_code is required")
                if not name:
                    raise ValueError("supply_name is required")

                existing   = code_map.get(code)
                parent_obj = code_map.get(parent_code) if parent_code else None
                level_val  = int(level_raw) if level_raw.isdigit() else (
                    (parent_obj.level + 1) if parent_obj else 0
                )
                sort_val   = int(sort_raw) if sort_raw.isdigit() else 0
                is_active  = active_raw in ("true", "1", "yes", "active", "")

                cat_obj = cat_map.get(cat)

                if existing:
                    if mode == "create_and_update":
                        existing.supply_name      = name
                        existing.measurement_unit = unit
                        existing.energy_category  = cat_obj
                        existing.fuel_type        = ftype
                        existing.level            = level_val
                        existing.sort_order       = sort_val
                        existing.description      = desc
                        existing.is_active        = is_active
                        existing.parent_supply    = parent_obj
                        if request.user.is_authenticated:
                            existing.updated_by = request.user
                        existing.save()
                        results["updated"] += 1
                    else:
                        results["skipped"] += 1
                else:
                    obj = EnergySupply(
                        supply_code=code, supply_name=name,
                        measurement_unit=unit, energy_category=cat_obj,
                        fuel_type=ftype, parent_supply=parent_obj,
                        level=level_val, sort_order=sort_val,
                        description=desc, is_active=is_active,
                    )
                    if request.user.is_authenticated:
                        obj.created_by = request.user
                        obj.updated_by = request.user
                    obj.save()
                    code_map[code] = obj
                    results["created"] += 1

            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "row": i,
                    "data": dict(row),
                    "errors": {"_error": str(e)[:200]},
                })

        results["duration_ms"] = int((time.time() - t_start) * 1000)
        return Response(results, status=200)


class ConversionFactorBulkImportView(BulkImportMixin):
    from .models import ConversionFactor as _M, EnergySupply, ConversionUnit
    model           = _M
    unique_fields   = []
    update_fields   = ["conversion_factor", "effective_date", "is_active"]
    foreign_keys    = {
        "energy_supply": (EnergySupply, "supply_code"),
        "conversion_unit": (ConversionUnit, "unit_name")
    }
    writable_fields = [
        ("energy_supply",   "fk",      True),
        ("conversion_unit", "fk",      True),
        ("conversion_factor", "decimal", True),
        ("effective_date",    "text",    True),
        ("is_active",         "boolean", False),
    ]


# ── New Bulk Import Views ──────────────────────────────────────────

class ConversionUnitBulkImportView(BulkImportMixin):
    from .models import ConversionUnit as _M
    model           = _M
    unique_fields   = ["unit_code"]
    update_fields   = ["unit_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("unit_code",   "code",    True),
        ("unit_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]


class ElectricityTypeBulkImportView(BulkImportMixin):
    from .models import ElectricityType as _M
    model           = _M
    unique_fields   = ["type_code"]
    update_fields   = ["type_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("type_code",   "code",    True),
        ("type_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]





class VehicleFuelTypeBulkImportView(BulkImportMixin):
    from .models import VehicleFuelType as _M
    model           = _M
    unique_fields   = ["fuel_code"]
    update_fields   = ["fuel_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("fuel_code",   "code",    True),
        ("fuel_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]


class ProductionTypeBulkImportView(BulkImportMixin):
    from .models import ProductionType as _M
    model           = _M
    unique_fields   = ["type_code"]
    update_fields   = ["type_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("type_code",   "code",    True),
        ("type_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]


class PanelTypeBulkImportView(BulkImportMixin):
    from .models import PanelType as _M
    model           = _M
    unique_fields   = ["type_code"]
    update_fields   = ["type_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("type_code",   "code",    True),
        ("type_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]


class IndustryCategoryBulkImportView(BulkImportMixin):
    from .models import IndustryCategory as _M
    model           = _M
    unique_fields   = ["category_code"]
    update_fields   = ["category_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("category_code", "code",    True),
        ("category_name", "text",    True),
        ("ipcc_code",     "text",    False),
        ("description",   "text",    False),
        ("is_active",     "boolean", False),
    ]


class MeasurementUnitBulkImportView(BulkImportMixin):
    from .models import MeasurementUnit as _M
    model           = _M
    unique_fields   = ["unit_code"]
    update_fields   = ["unit_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("unit_code",   "code",    True),
        ("unit_name",   "text",    True),
        ("ipcc_code",   "text",    False),
        ("description", "text",    False),
        ("is_active",   "boolean", False),
    ]


class EnergyCategoryBulkImportView(BulkImportMixin):
    from .models import EnergyCategory as _M
    model           = _M
    unique_fields   = ["category_code"]
    update_fields   = ["category_name", "ipcc_code", "description", "is_active"]
    writable_fields = [
        ("category_code", "code",    True),
        ("category_name", "text",    True),
        ("ipcc_code",     "text",    False),
        ("description",   "text",    False),
        ("is_active",     "boolean", False),
    ]


class DzongkhagBulkImportView(BulkImportMixin):
    from .models import Dzongkhag as _M
    model           = _M
    unique_fields   = ["dzongkhag_code"]
    update_fields   = ["dzongkhag", "region", "ipcc_code", "is_active"]
    writable_fields = [
        ("dzongkhag_code", "code",    True),
        ("dzongkhag", "text",    True),
        ("region",         "text",    False),
        ("ipcc_code",      "text",    False),
        ("is_active",      "boolean", False),
    ]


class DataYearBulkImportView(BulkImportMixin):
    from .models import DataCollectionYear as _M
    model           = _M
    unique_fields   = ["year"]
    update_fields   = ["is_active", "notes"]
    writable_fields = [
        ("year",      "integer", True),
        ("is_active", "boolean", False),
        ("notes",     "text",    False),
    ]


class DataSourceBulkImportView(BulkImportMixin):
    from .models import DataSource as _M
    model           = _M
    unique_fields   = ["source_code"]
    update_fields   = ["source_name", "source_type", "organization", "ipcc_code", "is_active"]
    writable_fields = [
        ("source_code",  "code",    True),
        ("source_name",  "text",    True),
        ("source_type",  "text",    True),
        ("organization", "text",    False),
        ("ipcc_code",    "text",    False),
        ("is_active",    "boolean", False),
    ]


class CountryBulkImportView(BulkImportMixin):
    from .models import Country as _M
    model           = _M
    unique_fields   = ["country_code"]
    update_fields   = ["country_name", "region", "ipcc_code", "is_active"]
    writable_fields = [
        ("country_code", "code",    True),
        ("country_name", "text",    True),
        ("region",        "text",    False),
        ("ipcc_code",     "text",    False),
        ("is_active",     "boolean", False),
    ]


class BPCCategoryBulkImportView(BulkImportMixin):
    from .models import BPCCategory as _M, Sector, ElectricityCategory
    model           = _M
    unique_fields   = ["category_code"]
    update_fields   = ["category_name", "voltage_tier", "sector", "electricity_category", "sort_order", "ipcc_code", "is_active"]
    foreign_keys    = {
        "sector": (Sector, "sector_name"),
        "electricity_category": (ElectricityCategory, "category_name")
    }
    writable_fields = [
        ("category_code", "code",    True),
        ("category_name", "text",    True),
        ("voltage_tier",  "text",    True),
        ("sector",        "fk",      False),
        ("electricity_category", "fk", False),
        ("sort_order",    "integer", False),
        ("ipcc_code",     "text",    False),
        ("is_active",     "boolean", False),
    ]


class GenerationPlantBulkImportView(BulkImportMixin):
    from .models import GenerationPlant as _M, Dzongkhag
    model           = _M
    unique_fields   = ["plant_code"]
    update_fields   = ["plant_name", "source_type", "dzongkhag", "installed_capacity_kw", "commissioned_year", "operator", "ipcc_code", "is_active"]
    foreign_keys    = {
        "dzongkhag": (Dzongkhag, "dzongkhag")
    }
    writable_fields = [
        ("plant_code",            "code",    True),
        ("plant_name",            "text",    True),
        ("source_type",           "text",    True),
        ("dzongkhag",             "fk",      False),
        ("installed_capacity_kw", "decimal", False),
        ("commissioned_year",     "integer", False),
        ("operator",              "text",    False),
        ("ipcc_code",             "text",    False),
        ("is_active",             "boolean", False),
    ]


class SubstationBulkImportView(BulkImportMixin):
    from .models import Substation as _M, Dzongkhag
    model           = _M
    unique_fields   = ["substation_code"]
    update_fields   = [
        "substation_name", "acronym", "dzongkhag", "gewog", "region", 
        "voltage_level", "substation_type", "commissioned_date", "remarks", 
        "ipcc_code", "is_active", "plant_status", "plant_type", "dzongkhag_code",
        "dzo_iso_code", "region_code", "gewog_code", "plant_type_code",
        "plant_status_code", "substation_type_code"
    ]
    foreign_keys    = {
        "dzongkhag": (Dzongkhag, "dzongkhag")
    }
    writable_fields = [
        ("substation_code", "code",    True),
        ("substation_name", "text",    True),
        ("acronym",         "text",    False),
        ("dzongkhag",       "fk",      False),
        ("gewog",           "text",    False),
        ("region",          "text",    False),
        ("voltage_level",   "text",    False),
        ("substation_type", "text",    False),
        ("commissioned_date","date",   False),
        ("remarks",         "text",    False),
        ("ipcc_code",       "text",    False),
        ("is_active",       "boolean", False),
        ("plant_status",    "text",    False),
        ("plant_type",      "text",    False),
        ("dzongkhag_code",  "text",    False),
        ("dzo_iso_code",    "text",    False),
        ("region_code",     "text",    False),
        ("gewog_code",      "text",    False),
        ("plant_type_code", "integer", False),
        ("plant_status_code","integer", False),
        ("substation_type_code","integer",False),
    ]

    def preprocess_rows(self, rows, request):
        for row in rows:
            # Map plant_code to substation_code if present
            if not row.get("substation_code") and row.get("plant_code"):
                row["substation_code"] = row["plant_code"]
            
            # 1. Fallback for year_of_operation / commissioned_date
            if "commissioned_date" not in row and "year_of_operation" in row:
                row["commissioned_date"] = row["year_of_operation"]
            
            # 2. Coerce is_active
            status_val = row.get("plant_status") or row.get("is_active") or row.get("status")
            if status_val:
                row["is_active"] = "true" if str(status_val).strip().upper() in ("OPERATIONAL", "ACTIVE", "TRUE", "1") else "false"
            else:
                row["is_active"] = "true"
        return rows


class SubstationTransformerBulkImportView(BulkImportMixin):
    from .models import SubstationTransformer as _M, Substation
    model           = _M
    unique_fields   = ["transformer_code"]
    update_fields   = [
        "substation", "voltage_ratio", "max_capacity_mva", "max_capacity_mw", 
        "pf_rate", "bay_count", "incoming_feeders", "outgoing_feeders", 
        "commissioned_date", "ipcc_code", "is_active", "status_name",
        "plant_status_code", "substation_name", "plant_type", "plant_type_code",
        "acronym", "dzongkhag", "dzongkhag_code", "gewog", "gewog_code",
        "dzo_iso_code", "region", "region_code", "substation_type",
        "substation_type_code", "no_of_transformers", "transformer_capacity"
    ]
    foreign_keys    = {
        "substation": (Substation, "substation_code")
    }
    writable_fields = [
        ("substation",       "fk",      True),
        ("transformer_code", "code",    False),
        ("voltage_ratio",    "text",    False),
        ("max_capacity_mva", "decimal", False),
        ("max_capacity_mw",  "decimal", False),
        ("pf_rate",          "decimal", False),
        ("bay_count",        "integer", False),
        ("incoming_feeders", "integer", False),
        ("outgoing_feeders", "integer", False),
        ("commissioned_date","date",   False),
        ("ipcc_code",        "text",    False),
        ("is_active",        "boolean", False),
        ("status_name",      "text",    False),
        ("plant_status_code","integer", False),
        ("substation_name",  "text",    False),
        ("plant_type",      "text",    False),
        ("plant_type_code",  "integer", False),
        ("acronym",         "text",    False),
        ("dzongkhag",       "text",    False),
        ("dzongkhag_code",  "text",    False),
        ("gewog",           "text",    False),
        ("gewog_code",      "text",    False),
        ("dzo_iso_code",    "text",    False),
        ("region",          "text",    False),
        ("region_code",     "text",    False),
        ("substation_type", "text",    False),
        ("substation_type_code","integer",False),
        ("no_of_transformers","integer",False),
        ("transformer_capacity","text",  False),
    ]

    def preprocess_rows(self, rows, request):
        sub_counts = {}
        for row in rows:
            # 1. Fallback for year_of_operation
            if "commissioned_date" not in row and "year_of_operation" in row:
                row["commissioned_date"] = row["year_of_operation"]
            
            # 2. Substation (Plant Code)
            if not row.get("substation") and row.get("plant_code"):
                row["substation"] = row["plant_code"]
            sub_code = str(row.get("substation", "")).strip()
            
            # 3. Generate transformer_code if not present
            if not row.get("transformer_code"):
                sub_counts[sub_code] = sub_counts.get(sub_code, 0) + 1
                row["transformer_code"] = f"{sub_code}-TR{sub_counts[sub_code]}"
                
            # 4. Populate is_active coerced from status_name
            status_val = row.get("status_name") or row.get("is_active") or row.get("status")
            if status_val:
                row["is_active"] = "true" if str(status_val).strip().upper() in ("OPERATIONAL", "ACTIVE", "TRUE", "1") else "false"
            else:
                row["is_active"] = "true"
        return rows


# ── Migrated Standard Master Data (17 Models) Bulk Import Views ───────────────────────

class ConsumerTypeBulkImportView(BulkImportMixin):
    model_class = ConsumerType
    fields_mapping = {
        'code': 'code',
        'consumer_type': 'consumer_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class VoltageTypeBulkImportView(BulkImportMixin):
    model_class = VoltageType
    fields_mapping = {
        'code': 'code',
        'voltage_type': 'voltage_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class ConsumerGroupBulkImportView(BulkImportMixin):
    model_class = ConsumerGroup
    fields_mapping = {
        'code': 'code',
        'consumer_group': 'consumer_group',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class LocationBulkImportView(BulkImportMixin):
    model_class = Location
    fields_mapping = {
        'code': 'code',
        'location': 'location',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class ConductorTypeBulkImportView(BulkImportMixin):
    model_class = ConductorType
    fields_mapping = {
        'code': 'code',
        'conductor_type': 'conductor_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class UnitTypeBulkImportView(BulkImportMixin):
    model_class = UnitType
    fields_mapping = {
        'code': 'code',
        'unit_type': 'unit_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class ConnectionTypeBulkImportView(BulkImportMixin):
    model_class = ConnectionType
    fields_mapping = {
        'code': 'code',
        'connection_type': 'connection_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class PlantSizeBulkImportView(BulkImportMixin):
    model_class = PlantSize
    fields_mapping = {
        'code': 'code',
        'plant_size': 'plant_size',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class GridTypeBulkImportView(BulkImportMixin):
    model_class = GridType
    fields_mapping = {
        'code': 'code',
        'grid_type': 'grid_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class ConfigurationTypeBulkImportView(BulkImportMixin):
    model_class = ConfigurationType
    fields_mapping = {
        'code': 'code',
        'configuration_type': 'configuration_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class LineCategoryBulkImportView(BulkImportMixin):
    model_class = LineCategory
    fields_mapping = {
        'code': 'code',
        'line_category': 'line_category',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class CircuitTypeBulkImportView(BulkImportMixin):
    model_class = CircuitType
    fields_mapping = {
        'code': 'code',
        'circuit_type': 'circuit_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class SubsidyTypeBulkImportView(BulkImportMixin):
    model_class = SubsidyType
    fields_mapping = {
        'code': 'code',
        'subsidy_type': 'subsidy_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class TowerTypeBulkImportView(BulkImportMixin):
    model_class = TowerType
    fields_mapping = {
        'code': 'code',
        'tower_type': 'tower_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class TransformerTypeBulkImportView(BulkImportMixin):
    model_class = TransformerType
    fields_mapping = {
        'code': 'code',
        'transformer_type': 'transformer_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

class VoltageLevelBulkImportView(BulkImportMixin):
    model_class = VoltageLevel
    fields_mapping = {
        'code': 'code',
        'voltage_level': 'voltage_level',
        'voltage_type_code': 'voltage_type',  # Handled in process_row if needed
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

    def process_row(self, row, mapping):
        data = super().process_row(row, mapping)
        if 'voltage_type' in data:
            vt_code = data.pop('voltage_type')
            if vt_code:
                try:
                    vt = VoltageType.objects.get(code=vt_code)
                    data['voltage_type'] = vt
                except VoltageType.DoesNotExist:
                    raise ValidationError(f"VoltageType with code {vt_code} not found")
        return data

class ConsumerSubtypeBulkImportView(BulkImportMixin):
    model_class = ConsumerSubtype
    fields_mapping = {
        'code': 'code',
        'consumer_subtype': 'consumer_subtype',
        'consumer_type_code': 'consumer_type',
        'location_code': 'location',
        'voltage_type_code': 'voltage_type',
        'ipcc_code': 'ipcc_code',
        'is_active': 'is_active',
    }
    unique_field = 'code'

    def process_row(self, row, mapping):
        data = super().process_row(row, mapping)
        if 'consumer_type' in data:
            val = data.pop('consumer_type')
            if val:
                try:
                    data['consumer_type'] = ConsumerType.objects.get(code=val)
                except ConsumerType.DoesNotExist:
                    raise ValidationError(f"ConsumerType with code {val} not found")
                    
        if 'location' in data:
            val = data.pop('location')
            if val:
                try:
                    data['location'] = Location.objects.get(code=val)
                except Location.DoesNotExist:
                    raise ValidationError(f"Location with code {val} not found")
                    
        if 'voltage_type' in data:
            val = data.pop('voltage_type')
            if val:
                try:
                    data['voltage_type'] = VoltageType.objects.get(code=val)
                except VoltageType.DoesNotExist:
                    raise ValidationError(f"VoltageType with code {val} not found")
                    
        return data
