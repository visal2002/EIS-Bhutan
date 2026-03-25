from django.db import models

# Create your models here.
from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.electricity.models import DZONGKHAG_CHOICES


class FuelwoodSupply(EnergyDataModel):
    product_type = models.CharField(max_length=100)
    dzongkhag = models.CharField(max_length=50, choices=DZONGKHAG_CHOICES)
    quantity_tonnes = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "fuelwood"
        db_table = "fuelwood_supply"


class FuelwoodConsumption(EnergyDataModel):
    product_type = models.CharField(max_length=100)
    dzongkhag = models.CharField(max_length=50, choices=DZONGKHAG_CHOICES)
    quantity_tonnes = models.DecimalField(max_digits=18, decimal_places=4)
    sector = models.ForeignKey("master_data.Sector", on_delete=models.PROTECT, null=True, blank=True)

    class Meta:
        app_label = "fuelwood"
        db_table = "fuelwood_consumption"