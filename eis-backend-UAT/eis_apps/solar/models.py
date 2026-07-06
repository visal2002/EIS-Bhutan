from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import SolarEnergySize, Dzongkhag, ElectricityType


class SolarEnergy(EnergyDataModel):
    solar_size = models.ForeignKey(SolarEnergySize, on_delete=models.PROTECT, related_name="solar_records")
    solar_type = models.ForeignKey(ElectricityType, on_delete=models.PROTECT, null=True, blank=True)
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)
    energy_kwh = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "solar"
        db_table = "solar_energy"