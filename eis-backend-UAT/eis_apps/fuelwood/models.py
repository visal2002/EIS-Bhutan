from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import Dzongkhag, DataCollectionYear


class FuelwoodSupply(EnergyDataModel):
    permit_date = models.DateField(help_text="Permit Date")
    office = models.CharField(max_length=150, help_text="Office Name")
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)
    purpose = models.CharField(max_length=250, null=True, blank=True, help_text="Purpose")
    quantity_m3 = models.DecimalField(max_digits=18, decimal_places=4, help_text="Quantity in Metre Cube (m3)")

    class Meta:
        app_label = "fuelwood"
        db_table  = "fuelwood_supply"
        ordering  = ["-permit_date", "office"]
        verbose_name = "Fuelwood Supply Record"
        verbose_name_plural = "Fuelwood Supply Records"

    def save(self, *args, **kwargs):
        if self.permit_date:
            self.day = self.permit_date.day
            self.month = self.permit_date.month
            year_val = self.permit_date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.office} ({self.permit_date})"


class FuelwoodConsumption(EnergyDataModel):
    permit_date = models.DateField(help_text="Permit Date")
    office = models.CharField(max_length=150, help_text="Office Name")
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)
    purpose = models.CharField(max_length=250, null=True, blank=True, help_text="Purpose")
    purpose_group = models.CharField(max_length=100, null=True, blank=True, help_text="Purpose Group")
    quantity_m3 = models.DecimalField(max_digits=18, decimal_places=4, help_text="Quantity in Metre Cube (m3)")

    class Meta:
        app_label = "fuelwood"
        db_table  = "fuelwood_consumption"
        ordering  = ["-permit_date", "office"]
        verbose_name = "Fuelwood Consumption Record"
        verbose_name_plural = "Fuelwood Consumption Records"

    def save(self, *args, **kwargs):
        if self.permit_date:
            self.day = self.permit_date.day
            self.month = self.permit_date.month
            year_val = self.permit_date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.office} ({self.permit_date})"