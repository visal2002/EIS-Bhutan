from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import BiogasSize, Sector, Dzongkhag, FuelType, MeasurementUnit
from .models import BiogasData, BriquetteCharcoal
from .serializers import BiogasDataSerializer, BriquetteCharcoalSerializer

def robust_parse_date(val):
    if not val:
        return None
    val_str = str(val).strip()
    if val_str.lower() in ["", "none", "nan", "nat", "null"]:
        return None
        
    try:
        if val_str.replace('.', '', 1).isdigit():
            excel_date = float(val_str)
            if excel_date > 1000:
                import pandas as pd
                dt = pd.to_datetime(excel_date, unit='D', origin='1899-12-30')
                return dt.date().strftime("%Y-%m-%d")
    except Exception:
        pass

    try:
        import dateutil.parser
        dt = dateutil.parser.parse(val_str, dayfirst=True)
        return dt.date().strftime("%Y-%m-%d")
    except Exception:
        pass
        
    return val_str


class BiogasBulkImportView(BaseBulkImportView):
    model = BiogasData
    serializer_class = BiogasDataSerializer
    column_mapping = {
        "Date": "date",
        "Biogas Size Class": "biogas_size",
        "Sector": "sector",
        "Dzongkhag": "dzongkhag",
        "Number of Plants": "number_of_plants",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Parse date robustly
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])

        # Resolve Biogas Size
        size_label = str(row.get("Biogas Size Class", "")).strip()
        if size_label:
            size_obj = BiogasSize.objects.filter(size_category__iexact=size_label).first()
            if not size_obj: raise ValueError(f"Biogas Size Class '{size_label}' not found")
            data["biogas_size"] = size_obj.id

        # Resolve Sector
        s_name = str(row.get("Sector", "")).strip()
        if s_name:
            sector = Sector.objects.filter(sector_name__iexact=s_name).first()
            if not sector: raise ValueError(f"Sector '{s_name}' not found")
            data["sector"] = sector.id

        # Resolve Dzongkhag
        dz_name = str(row.get("Dzongkhag", "")).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz: raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        return data

    def lookup_existing(self, data):
        return BiogasData.objects.filter(
            date=data.get("date"),
            biogas_size_id=data.get("biogas_size"),
            sector_id=data.get("sector"),
            dzongkhag_id=data.get("dzongkhag")
        ).first()


class BriquetteBulkImportView(BaseBulkImportView):
    model = BriquetteCharcoal
    serializer_class = BriquetteCharcoalSerializer
    column_mapping = {
        "Date": "date",
        "Quantity": "quantity",
        "Unit": "unit",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Parse date robustly
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])

        # Hardcode fuel type to Briquette
        fuel = FuelType.objects.filter(fuel_code="BRIQUETTE").first()
        data["type"] = fuel.id

        # Resolve Unit
        unit_name = str(row.get("Unit", "")).strip()
        if unit_name:
            unit = MeasurementUnit.objects.filter(unit_code__iexact=unit_name).first()
            if not unit:
                unit = MeasurementUnit.objects.filter(unit_name__iexact=unit_name).first()
            if not unit: raise ValueError(f"Measurement Unit '{unit_name}' not found")
            data["unit"] = unit.unit_code

        return data

    def lookup_existing(self, data):
        return BriquetteCharcoal.objects.filter(
            date=data.get("date"),
            type_id=data.get("type")
        ).first()


class CharcoalBulkImportView(BaseBulkImportView):
    model = BriquetteCharcoal
    serializer_class = BriquetteCharcoalSerializer
    column_mapping = {
        "Date": "date",
        "Quantity": "quantity",
        "Unit": "unit",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Parse date robustly
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])

        # Hardcode fuel type to Charcoal
        fuel = FuelType.objects.filter(fuel_code="CHA-COA").first()
        data["type"] = fuel.id

        # Resolve Unit
        unit_name = str(row.get("Unit", "")).strip()
        if unit_name:
            unit = MeasurementUnit.objects.filter(unit_code__iexact=unit_name).first()
            if not unit:
                unit = MeasurementUnit.objects.filter(unit_name__iexact=unit_name).first()
            if not unit: raise ValueError(f"Measurement Unit '{unit_name}' not found")
            data["unit"] = unit.unit_code

        return data

    def lookup_existing(self, data):
        return BriquetteCharcoal.objects.filter(
            date=data.get("date"),
            type_id=data.get("type")
        ).first()
