from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import FuelType, MeasurementUnit, Dzongkhag, Sector


class CoalData(EnergyDataModel):
    DATA_TYPE_CHOICES = [
        ("PRODUCTION", "Production"), ("IMPORT", "Import"),
        ("EXPORT", "Export"), ("CONSUMPTION", "Consumption"),
    ]
    data_type = models.CharField(max_length=20, choices=DATA_TYPE_CHOICES)
    
    date = models.DateField(blank=True, null=True, db_column="date")
    source = models.CharField(max_length=255, blank=True, null=True, db_column="source")
    quantity_mt = models.DecimalField(max_digits=18, decimal_places=4, blank=True, null=True, db_column="quantity_mt")
    destination = models.CharField(max_length=50, blank=True, null=True, db_column="destination")
    mineral_type = models.CharField(max_length=100, default="Coal", blank=True, null=True, db_column="mineral_type")
    coal_type = models.ForeignKey(FuelType, on_delete=models.PROTECT, null=True, blank=True, db_column="coal_type")

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
        super().save(*args, **kwargs)

    class Meta:
        app_label = "coal"
        db_table = "coal_data"