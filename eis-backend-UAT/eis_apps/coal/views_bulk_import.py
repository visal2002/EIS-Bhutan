from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import FuelType
from .models import CoalData
from .serializers import CoalDataSerializer

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


class CoalBulkImportView(BaseBulkImportView):
    model = CoalData
    serializer_class = CoalDataSerializer
    column_mapping = {
        "Date": "date",
        "Source": "source",
        "Quantity MT": "quantity_mt",
        "Destination": "destination",
        "Mineral Type": "mineral_type",
        "Coal Type": "coal_type",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Determine data_type dynamically from request params/data/path
        dt = getattr(request, 'data', {}).get("data_type") or getattr(request, 'query_params', {}).get("data_type")
        if not dt:
            path = getattr(request, 'path', '').lower()
            if 'trade' in path or 'export' in path:
                dt = 'EXPORT'
            elif 'import' in path:
                dt = 'IMPORT'
            elif 'consumption' in path:
                dt = 'CONSUMPTION'
            else:
                dt = 'PRODUCTION'
        data["data_type"] = dt.upper()
        
        # Parse date robustly
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])
            
        # Resolve Coal Type (coal_type ForeignKey)
        ct_name = str(row.get("Coal Type", "")).strip()
        if ct_name:
            fuel = FuelType.objects.filter(fuel_name__iexact=ct_name, fuel_category__category_code="COAL").first()
            if not fuel:
                # Try adding ' Coal' suffix
                if not ct_name.lower().endswith("coal"):
                    fuel = FuelType.objects.filter(fuel_name__iexact=f"{ct_name} Coal", fuel_category__category_code="COAL").first()
            
            if not fuel:
                # Search using normalized names (remove hyphens, spaces, and lowercase)
                norm_ct = ct_name.lower().replace(" ", "").replace("-", "")
                all_fuels = list(FuelType.objects.filter(fuel_category__category_code="COAL"))
                
                # Check for direct contains/contained matching
                for f in all_fuels:
                    norm_f = f.fuel_name.lower().replace(" ", "").replace("-", "")
                    if norm_ct in norm_f or norm_f in norm_ct:
                        fuel = f
                        break
                
                # Special mapping for common synonyms
                if not fuel:
                    if "sub" in norm_ct and "bituminous" in norm_ct:
                        fuel = next((f for f in all_fuels if "sub" in f.fuel_name.lower() and "bituminous" in f.fuel_name.lower()), None)
                    elif "bituminous" in norm_ct:
                        fuel = next((f for f in all_fuels if "bituminous" in f.fuel_name.lower() and "other" in f.fuel_name.lower()), None)

            if not fuel:
                raise ValueError(f"Coal Type '{ct_name}' not found under COAL category")
            data["coal_type"] = fuel.id
            
        return data

    def lookup_existing(self, data):
        return CoalData.objects.filter(
            date=data.get("date"),
            source=data.get("source"),
            coal_type_id=data.get("coal_type"),
            data_type=data.get("data_type")
        ).first()
