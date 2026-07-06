from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import FuelType, MeasurementUnit, Sector
from .models import POLImportExport, POLAviation
from .serializers import POLImportExportSerializer, POLAviationSerializer

def robust_parse_datetime(val):
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
                return dt.strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        pass

    try:
        import dateutil.parser
        dt = dateutil.parser.parse(val_str, dayfirst=True)
        return dt.strftime("%Y-%m-%dT%H:%M:%S")
    except Exception:
        pass
        
    return val_str

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


class POLImportExportBulkImportView(BaseBulkImportView):
    model = POLImportExport
    serializer_class = POLImportExportSerializer
    column_mapping = {
        "RRCOOffice": "rrco_office",
        "CustomsOffice": "customs_office",
        "DeclarationNumber": "declaration_number",
        "DeclarationDate": "declaration_date",
        "ImporterTPN": "importer_tpn",
        "ImporterName": "importer_name",
        "ExporterName": "exporter_name",
        "CountryofExportation": "country_of_exportation",
        "Countryoforigin": "country_of_origin",
        "Vehicle_Number": "vehicle_number",
        "InvoiceNumber": "invoice_number",
        "InvoiceDate": "invoice_date",
        "BtcChapter": "btc_chapter",
        "Btccode": "btc_code",
        "FullDescrp": "full_description",
        "StandardUnitId": "standard_unit_id",
        "Quantity": "quantity",
        "CustomsValue_Nu": "customs_value_nu",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        # Standard transaction type detection if not explicit
        tt = getattr(request, 'data', {}).get("transaction_type") or "IMPORT"
        data["transaction_type"] = tt.upper()
            
        # Robust Date Parsing
        if "declaration_date" in data and data["declaration_date"]:
            data["declaration_date"] = robust_parse_datetime(data["declaration_date"])
        if "invoice_date" in data and data["invoice_date"]:
            data["invoice_date"] = robust_parse_date(data["invoice_date"])
            
        return data

    def lookup_existing(self, data):
        dec_num = data.get("declaration_number")
        btc_code = data.get("btc_code")
        if dec_num and btc_code:
            return POLImportExport.objects.filter(
                declaration_number=dec_num,
                btc_code=btc_code
            ).first()
        return None


class POLAviationBulkImportView(BaseBulkImportView):
    model = POLAviation
    serializer_class = POLAviationSerializer
    column_mapping = {
        "Year": "year",
        "Month": "month",
        "Sector": "sector",
        "Quantity KL": "quantity_kl",
        "Unit": "unit",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Resolve Sector
        s_name = str(row.get("Sector", "")).strip()
        if s_name:
            sector = Sector.objects.filter(sector_name__iexact=s_name).first()
            if not sector: raise ValueError(f"Sector '{s_name}' not found")
            data["sector"] = sector.id

        # Resolve Unit
        unit_name = str(row.get("Unit", "KL")).strip()
        if unit_name:
            unit = MeasurementUnit.objects.filter(unit_name__iexact=unit_name).first()
            if not unit: raise ValueError(f"Measurement Unit '{unit_name}' not found")
            data["unit"] = unit.id

        return data

    def lookup_existing(self, data):
        return POLAviation.objects.filter(
            year=data.get("year"),
            month=data.get("month"),
            sector_id=data.get("sector")
        ).first()
