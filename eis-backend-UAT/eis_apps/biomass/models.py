from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import BiogasSize, Sector, Dzongkhag, MeasurementUnit, FuelType


class BiogasData(EnergyDataModel):
    date = models.DateField(blank=True, null=True, db_column="date")
    biogas_size = models.ForeignKey(BiogasSize, on_delete=models.PROTECT, related_name="biogas_records")
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="biogas_data")
    number_of_plants = models.PositiveIntegerField()
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
        super().save(*args, **kwargs)

    class Meta:
        app_label = "biomass"
        db_table = "biomass_biogas"


class BriquetteCharcoal(EnergyDataModel):
    date = models.DateField(blank=True, null=True, db_column="date")
    type = models.ForeignKey(FuelType, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.ForeignKey(MeasurementUnit, on_delete=models.PROTECT)

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
        super().save(*args, **kwargs)

    class Meta:
        app_label = "biomass"
        db_table = "biomass_briquette_charcoal"