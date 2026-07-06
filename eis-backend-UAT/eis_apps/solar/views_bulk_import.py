from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import SolarEnergySize, ElectricityType, Dzongkhag
from .models import SolarEnergy
from .serializers import SolarEnergySerializer

class SolarBulkImportView(BaseBulkImportView):
    model = SolarEnergy
    serializer_class = SolarEnergySerializer
    column_mapping = {
        "Year": "year",
        "Month": "month",
        "Solar Size Class": "solar_size",
        "Solar Type": "solar_type",
        "Dzongkhag": "dzongkhag",
        "Generation kWh": "energy_kwh",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Resolve Solar Size
        size_label = str(row.get("Solar Size Class", "")).strip()
        if size_label:
            size_obj = SolarEnergySize.objects.filter(size_category__iexact=size_label).first()
            if not size_obj: raise ValueError(f"Solar Size Class '{size_label}' not found")
            data["solar_size"] = size_obj.id

        # Resolve Solar Type (ElectricityType)
        type_label = str(row.get("Solar Type", "")).strip()
        if type_label:
            type_obj = ElectricityType.objects.filter(type_name__iexact=type_label).first()
            if not type_obj: raise ValueError(f"Solar Type '{type_label}' not found")
            data["solar_type"] = type_obj.id

        # Resolve Dzongkhag
        dz_name = str(row.get("Dzongkhag", "")).strip()
        if dz_name:
            dz_obj = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz_obj: raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz_obj.id

        return data

    def lookup_existing(self, data):
        return SolarEnergy.objects.filter(
            year=data.get("year"),
            month=data.get("month"),
            solar_size_id=data.get("solar_size"),
            solar_type_id=data.get("solar_type"),
            dzongkhag_id=data.get("dzongkhag")
        ).first()
