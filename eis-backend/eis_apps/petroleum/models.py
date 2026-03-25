from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import Sector, VehicleType


class POLImportExport(EnergyDataModel):
    TRANSACTION_CHOICES = [("IMPORT", "Import"), ("EXPORT", "Export")]
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_CHOICES)
    main_category = models.CharField(max_length=100)
    sub_category = models.CharField(max_length=100, blank=True)
    quantity_kl = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.CharField(max_length=20, default="KL")

    class Meta:
        app_label = "petroleum"
        db_table = "petroleum_import_export"


class POLAviation(EnergyDataModel):
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="aviation_consumption")
    quantity_kl = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.CharField(max_length=20, default="KL")

    class Meta:
        app_label = "petroleum"
        db_table = "petroleum_aviation"


class TransportConsumption(EnergyDataModel):
    FUEL_TYPE_CHOICES = [("PETROL", "Petrol"), ("DIESEL", "Diesel"), ("OTHER", "Other")]
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.PROTECT)
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES)
    odometer_reading = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    fuel_consumed_calculated = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    original_vehicle_type = models.CharField(max_length=100, blank=True)
    gross_weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        app_label = "petroleum"
        db_table = "transport_consumption"