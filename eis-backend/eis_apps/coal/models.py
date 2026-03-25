from django.db import models
from eis_core.models import EnergyDataModel


class CoalData(EnergyDataModel):
    DATA_TYPE_CHOICES = [
        ("PRODUCTION", "Production"), ("IMPORT", "Import"),
        ("EXPORT", "Export"), ("CONSUMPTION", "Consumption"),
    ]
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES)
    category = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.CharField(max_length=20)

    class Meta:
        app_label = "coal"
        db_table = "coal_data"