from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import Dzongkhag
from .models import FuelwoodSupply, FuelwoodConsumption
from .serializers import FuelwoodSupplySerializer, FuelwoodConsumptionSerializer

class FuelwoodSupplyBulkImportView(BaseBulkImportView):
    model = FuelwoodSupply
    serializer_class = FuelwoodSupplySerializer
    column_mapping = {
        "Permit Date": "permit_date",
        "Office": "office",
        "Dzongkhag": "dzongkhag",
        "Purpose": "purpose",
        "Metre Cube (m3)": "quantity_m3",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Resolve Dzongkhag
        dz_name = str(row.get("Dzongkhag", "")).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz: raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        return data

    def lookup_existing(self, data):
        return FuelwoodSupply.objects.filter(
            permit_date=data.get("permit_date"),
            office__iexact=data.get("office"),
            dzongkhag_id=data.get("dzongkhag"),
            purpose__iexact=data.get("purpose")
        ).first()


class FuelwoodConsumptionBulkImportView(BaseBulkImportView):
    model = FuelwoodConsumption
    serializer_class = FuelwoodConsumptionSerializer
    column_mapping = {
        "Permit Date": "permit_date",
        "Office": "office",
        "Dzongkhag": "dzongkhag",
        "Purpose": "purpose",
        "Purpose Group": "purpose_group",
        "Metre Cube (m3)": "quantity_m3",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Resolve Dzongkhag
        dz_name = str(row.get("Dzongkhag", "")).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz: raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        return data

    def lookup_existing(self, data):
        return FuelwoodConsumption.objects.filter(
            permit_date=data.get("permit_date"),
            office__iexact=data.get("office"),
            dzongkhag_id=data.get("dzongkhag"),
            purpose__iexact=data.get("purpose")
        ).first()

