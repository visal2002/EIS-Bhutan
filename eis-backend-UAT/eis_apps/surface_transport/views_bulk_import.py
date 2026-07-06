from rest_framework.permissions import IsAuthenticated
from eis_apps.authentication.permissions import IsDataFocalOrAbove
from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import VehicleType, VehicleFuelType
from .models import TransportConsumption, VehicleRegistration
from .serializers import TransportConsumptionSerializer, VehicleRegistrationSerializer

class TransportConsumptionBulkImportView(BaseBulkImportView):
    permission_classes = [IsAuthenticated, IsDataFocalOrAbove]
    model = TransportConsumption
    serializer_class = TransportConsumptionSerializer
    column_mapping = {
        "Year": "year",
        "Month": "month",
        "Vehicle Type": "vehicle_type",
        "Fuel Type": "fuel_type",
        "Odometer": "odometer_reading",
        "Fuel Consumed": "fuel_consumed_calculated",
        "Original Type": "original_vehicle_type",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        v_name = str(row.get("Vehicle Type", "")).strip()
        if v_name:
            vt = VehicleType.objects.filter(vehicle_type_name__iexact=v_name).first()
            if not vt:
                clean_name = v_name.lower().replace(" ", "").replace("-", "")
                all_vts = list(VehicleType.objects.all())
                for v in all_vts:
                    if v.vehicle_type_name.lower().replace(" ", "").replace("-", "") == clean_name:
                        vt = v
                        break
                # Fuzzy matching fallback
                if not vt:
                    import difflib
                    names = [v.vehicle_type_name for v in all_vts]
                    matches = difflib.get_close_matches(v_name, names, n=1, cutoff=0.6)
                    if matches:
                        vt = next((v for v in all_vts if v.vehicle_type_name == matches[0]), None)
            if not vt: raise ValueError(f"Vehicle Type '{v_name}' not found in master data")
            data["vehicle_type"] = vt.id

        f_name = str(row.get("Fuel Type", "")).strip()
        if f_name:
            vf = VehicleFuelType.objects.filter(fuel_name__iexact=f_name).first()
            if not vf:
                clean_fname = f_name.lower().replace(" ", "").replace("-", "")
                all_vfs = list(VehicleFuelType.objects.all())
                for f in all_vfs:
                    if f.fuel_name.lower().replace(" ", "").replace("-", "") == clean_fname:
                        vf = f
                        break
                # Fuzzy matching fallback
                if not vf:
                    import difflib
                    names = [f.fuel_name for f in all_vfs]
                    matches = difflib.get_close_matches(f_name, names, n=1, cutoff=0.6)
                    if matches:
                        vf = next((f for f in all_vfs if f.fuel_name == matches[0]), None)
            if not vf: raise ValueError(f"Vehicle Fuel Type '{f_name}' not found in master data")
            data["fuel_type"] = vf.id

        return data

    def lookup_existing(self, data):
        return TransportConsumption.objects.filter(
            year=data.get("year"),
            month=data.get("month"),
            day=data.get("day"),
            vehicle_type_id=data.get("vehicle_type"),
            fuel_type_id=data.get("fuel_type")
        ).first()


class VehicleRegistrationBulkImportView(BaseBulkImportView):
    permission_classes = [IsAuthenticated, IsDataFocalOrAbove]
    model = VehicleRegistration
    serializer_class = VehicleRegistrationSerializer
    column_mapping = {
        "Registration No":      "registration_no",
        "Registration Date":    "initial_registration_date",
        "Owner Type":           "owner_type",
        "Vehicle Type":         "vehicle_type",
        "Model Name":           "model_name",
        "Seating Capacity":     "seating_capacity",
        "Engine CC":            "engine_cc",
        "Horse Power":          "horse_power",
        "Kilo Watt Hour":       "kilo_watt_hour",
        "Gross Vehicle Weight": "gross_vehicle_weight",
        "Fuel Type":            "fuel_type",
        "Status":               "status",
        "Remarks":              "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # Robust Date Parsing for Registration Date (DD/MM/YYYY -> YYYY-MM-DD)
        if "initial_registration_date" in data and data["initial_registration_date"]:
            raw_date = str(data["initial_registration_date"]).strip()
            # If it comes as DD/MM/YYYY or DD-MM-YYYY
            if "/" in raw_date or "-" in raw_date:
                import re
                from datetime import datetime
                # Matches DD/MM/YYYY or DD-MM-YYYY
                if re.match(r"^\d{1,2}[/\-]\d{1,2}[/\-]\d{4}$", raw_date):
                    parts = raw_date.replace("-", "/").split("/")
                    # Convert to YYYY-MM-DD (assuming DD/MM/YYYY)
                    # Note: Pandas might have auto-converted to YYYY-MM-DD HH:MM:SS string, we handle various forms.
                    try:
                        dt = datetime.strptime(raw_date, "%d/%m/%Y")
                        data["initial_registration_date"] = dt.strftime("%Y-%m-%d")
                    except:
                        pass
                elif len(raw_date) > 10:
                    # Might be a full timestamp string from pandas (YYYY-MM-DD HH:MM:SS)
                    data["initial_registration_date"] = raw_date[:10]

        # Resolve Vehicle Type by name (robust matching)
        v_name = str(row.get("Vehicle Type", "")).strip()
        if v_name:
            # First try exact/case-insensitive match
            vt = VehicleType.objects.filter(vehicle_type_name__iexact=v_name).first()
            if not vt:
                clean_name = v_name.lower().replace(" ", "").replace("-", "")
                all_vts = list(VehicleType.objects.all())
                for v in all_vts:
                    if v.vehicle_type_name.lower().replace(" ", "").replace("-", "") == clean_name:
                        vt = v
                        break
                # Fuzzy match fallback
                if not vt:
                    import difflib
                    names = [v.vehicle_type_name for v in all_vts]
                    matches = difflib.get_close_matches(v_name, names, n=1, cutoff=0.6)
                    if matches:
                        vt = next((v for v in all_vts if v.vehicle_type_name == matches[0]), None)
            if not vt:
                raise ValueError(f"Vehicle Type '{v_name}' not found in master data")
            data["vehicle_type"] = vt.id

        # Resolve Fuel Type by name (robust matching)
        f_name = str(row.get("Fuel Type", "")).strip()
        if f_name:
            vf = VehicleFuelType.objects.filter(fuel_name__iexact=f_name).first()
            if not vf:
                clean_fname = f_name.lower().replace(" ", "").replace("-", "")
                all_vfs = list(VehicleFuelType.objects.all())
                for f in all_vfs:
                    if f.fuel_name.lower().replace(" ", "").replace("-", "") == clean_fname:
                        vf = f
                        break
                # Fuzzy match fallback
                if not vf:
                    import difflib
                    names = [f.fuel_name for f in all_vfs]
                    matches = difflib.get_close_matches(f_name, names, n=1, cutoff=0.6)
                    if matches:
                        vf = next((f for f in all_vfs if f.fuel_name == matches[0]), None)
            if not vf:
                raise ValueError(f"Vehicle Fuel Type '{f_name}' not found in master data")
            data["fuel_type"] = vf.id

        # Normalize status to uppercase
        if "status" in data and data["status"]:
            data["status"] = str(data["status"]).upper().strip()

        # Normalize owner_type
        owner_type_raw = str(row.get("Owner Type", "")).strip().lower()
        if owner_type_raw:
            if "individual" in owner_type_raw:
                data["owner_type"] = "Individual"
            elif "org" in owner_type_raw:
                data["owner_type"] = "Organization"
            else:
                data["owner_type"] = "Individual" # Fallback or keep as is? Let's just set what we found or None
                
        return data

    def lookup_existing(self, data):
        # No unique constraint — each import creates a new record
        return None

