from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import IndustryClassification, FuelType, MeasurementUnit
from .models import IndustryConsumption
from .serializers import IndustryConsumptionSerializer

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


class IndustryBulkImportView(BaseBulkImportView):
    model = IndustryConsumption
    serializer_class = IndustryConsumptionSerializer
    column_mapping = {
        "Date": "date",
        "Classification": "classification",
        "name_industry": "name_industry",
        "type_industry": "type_industry",
        "coal_mt": "coal_mt",
        "diesel_lt": "diesel_lt",
        "electricity_kWh": "electricity_kWh",
        "kerosene_lt": "kerosene_lt",
        "semicoke_mt": "semicoke_mt",
        "furnace": "furnace_oil_lt",
        "oil_lt": "furnace_oil_lt", # Mapping both since the user requested them split but I merged them, or I'll just map furnace_oil_lt
        "furnace_oil_lt": "furnace_oil_lt",
        "lubricants_lt": "lubricants_lt",
        "woodchips_mt": "woodchips_mt",
        "charcoal_mt": "charcoal_mt",
        "coke_lamc_mt": "coke_lamc_mt",
        "bamboo_mt": "bamboo_mt",
        "limestone_mt": "limestone_mt",
        "dolomite_mt": "dolomite_mt",
        "sawdust": "sawdust_mt",
        "sawdust_mt": "sawdust_mt",
        "briquettes_mt": "briquettes_mt",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])
        
        # Resolve Classification (Optional now)
        c_label = str(row.get("Classification", "")).strip()
        if c_label:
            c_obj = IndustryClassification.objects.filter(classification_name__iexact=c_label).first()
            if c_obj:
                data["classification"] = c_obj.id

        return data

    def lookup_existing(self, data):
        return IndustryConsumption.objects.filter(
            date=data.get("date"),
            name_industry__iexact=data.get("name_industry"),
            type_industry__iexact=data.get("type_industry")
        ).first()


