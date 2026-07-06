from django.db import models
from eis_core.models import AuditedModel
from eis_apps.master_data.models import FuelType, Sector, MeasurementUnit


class EmissionFactor(AuditedModel):
    fuel_type = models.ForeignKey(FuelType, on_delete=models.PROTECT, related_name="emission_factors")
    co2_factor = models.DecimalField(max_digits=18, decimal_places=8)
    ch4_factor = models.DecimalField(max_digits=18, decimal_places=8)
    n2o_factor = models.DecimalField(max_digits=18, decimal_places=8)
    unit = models.ForeignKey(MeasurementUnit, on_delete=models.PROTECT)
    source = models.CharField(max_length=100, default="IPCC_DEFAULT")
    applicability = models.CharField(max_length=200, blank=True)
    effective_date = models.DateField()
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = "ghg"
        db_table = "ghg_emission_factor"


class GHGCalculation(AuditedModel):
    emission_factor = models.ForeignKey(EmissionFactor, on_delete=models.PROTECT)
    year = models.PositiveSmallIntegerField()
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT)
    fuel_type = models.ForeignKey(FuelType, on_delete=models.PROTECT)
    activity_data = models.DecimalField(max_digits=18, decimal_places=6)
    co2_emissions = models.DecimalField(max_digits=18, decimal_places=6)
    ch4_emissions = models.DecimalField(max_digits=18, decimal_places=6)
    n2o_emissions = models.DecimalField(max_digits=18, decimal_places=6)
    co2_equivalent = models.DecimalField(max_digits=18, decimal_places=6)

    class Meta:
        app_label = "ghg"
        db_table = "ghg_calculation"