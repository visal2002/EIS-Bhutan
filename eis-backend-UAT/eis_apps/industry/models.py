from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import IndustryClassification, FuelType, MeasurementUnit


class IndustryConsumption(EnergyDataModel):
    date = models.DateField(blank=True, null=True, db_column="date")
    classification = models.ForeignKey(IndustryClassification, on_delete=models.PROTECT, null=True, blank=True)
    name_industry = models.CharField(max_length=255, blank=True)
    type_industry = models.CharField(max_length=255, blank=True)
    
    # Wide format fuel columns
    coal_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    diesel_lt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    electricity_kWh = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    kerosene_lt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    semicoke_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    furnace_oil_lt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    lubricants_lt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    woodchips_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    charcoal_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    coke_lamc_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    bamboo_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    limestone_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    dolomite_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    sawdust_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    briquettes_mt = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
            self.day = self.date.day
        super().save(*args, **kwargs)

    class Meta:
        app_label = "industry"
        db_table = "industry_consumption"
        ordering = ["-date", "name_industry"]