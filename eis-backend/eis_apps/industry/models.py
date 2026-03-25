from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import IndustryClassification


class IndustryConsumption(EnergyDataModel):
    CONSUMPTION_TYPE_CHOICES = [
        ("ELECTRICITY", "Electricity"), ("FUEL", "Fuel"),
        ("COAL", "Coal"), ("OTHER", "Other"),
    ]
    classification = models.ForeignKey(IndustryClassification, on_delete=models.PROTECT)
    industry_category = models.CharField(max_length=100, blank=True)
    consumption_type = models.CharField(max_length=20, choices=CONSUMPTION_TYPE_CHOICES)
    energy_consumption = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.CharField(max_length=20)

    class Meta:
        app_label = "industry"
        db_table = "industry_consumption"