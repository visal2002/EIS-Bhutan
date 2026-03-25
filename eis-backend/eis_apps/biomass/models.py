from django.db import models

# Create your models here.
from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import BiogasSize, Sector
from eis_apps.electricity.models import DZONGKHAG_CHOICES


class BiogasData(EnergyDataModel):
    biogas_size = models.ForeignKey(BiogasSize, on_delete=models.PROTECT, related_name="biogas_records")
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="biogas_data")
    number_of_plants = models.PositiveIntegerField()
    dzongkhag = models.CharField(max_length=50, choices=DZONGKHAG_CHOICES)

    class Meta:
        app_label = "biomass"
        db_table = "biomass_biogas"


class BriquetteCharcoal(EnergyDataModel):
    TYPE_CHOICES = [("BRIQUETTE", "Briquette"), ("CHARCOAL", "Charcoal")]
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.CharField(max_length=20)

    class Meta:
        app_label = "biomass"
        db_table = "biomass_briquette_charcoal"