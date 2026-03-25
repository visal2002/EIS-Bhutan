from django.db import models

# Create your models here.
from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import SolarEnergySize
from eis_apps.electricity.models import DZONGKHAG_CHOICES


class SolarEnergy(EnergyDataModel):
    SOLAR_TYPE_CHOICES = [
        ("THERMAL", "Solar Thermal"), ("UTILITY", "Utility Scale"), ("OFF_GRID", "Off-Grid"),
    ]
    solar_size = models.ForeignKey(SolarEnergySize, on_delete=models.PROTECT, related_name="solar_records")
    solar_type = models.CharField(max_length=20, choices=SOLAR_TYPE_CHOICES)
    dzongkhag = models.CharField(max_length=50, choices=DZONGKHAG_CHOICES)
    energy_kwh = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "solar"
        db_table = "solar_energy"