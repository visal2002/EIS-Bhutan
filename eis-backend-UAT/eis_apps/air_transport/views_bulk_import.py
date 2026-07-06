from rest_framework.permissions import IsAuthenticated
from eis_apps.authentication.permissions import IsDataFocalOrAbove
from eis_core.utils.import_engine import BaseBulkImportView
from .models import AircraftActivity, AviationFuelConsumption
from .serializers import AircraftActivitySerializer, AviationFuelConsumptionSerializer

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


class AircraftActivityBulkImportView(BaseBulkImportView):
    permission_classes = [IsAuthenticated, IsDataFocalOrAbove]
    model = AircraftActivity
    serializer_class = AircraftActivitySerializer
    column_mapping = {
        "Date": "date",
        "Airlines": "airlines",
        "Aircraft Type": "aircraft_type",
        "No. of Flights per Day": "no_of_flights_operating_per_day",
        "Domestic Landings": "domestic_landings",
        "International Landings": "international_landings",
        "Domestic Take-offs": "domestic_takeoffs",
        "International Take-offs": "international_takeoffs",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])
        return data

    def lookup_existing(self, data):
        return AircraftActivity.objects.filter(
            date=data.get("date"),
            airlines__iexact=data.get("airlines"),
            aircraft_type__iexact=data.get("aircraft_type")
        ).first()


class AviationFuelConsumptionBulkImportView(BaseBulkImportView):
    permission_classes = [IsAuthenticated, IsDataFocalOrAbove]
    model = AviationFuelConsumption
    serializer_class = AviationFuelConsumptionSerializer
    column_mapping = {
        "Date": "date",
        "Airlines": "airlines",
        "Aircraft Type": "aircraft_type",
        "Domestic Fuel Consumption": "domestic_fuel_consumption",
        "International Fuel Consumption": "international_fuel_consumption",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        if "date" in data and data["date"]:
            data["date"] = robust_parse_date(data["date"])
        return data

    def lookup_existing(self, data):
        return AviationFuelConsumption.objects.filter(
            date=data.get("date"),
            airlines__iexact=data.get("airlines"),
            aircraft_type__iexact=data.get("aircraft_type")
        ).first()


