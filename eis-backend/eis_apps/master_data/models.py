from django.db import models
from eis_core.models import AuditedModel, SoftDeleteModel


class EnergySupply(AuditedModel, SoftDeleteModel):
    supply_name = models.CharField(max_length=100, unique=True)
    supply_code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        app_label = "master_data"
        db_table = "master_energy_supply"

    def __str__(self):
        return self.supply_name


class ConversionFactor(AuditedModel, SoftDeleteModel):
    energy_supply = models.ForeignKey(EnergySupply, on_delete=models.PROTECT, related_name="conversion_factors")
    conversion_factor = models.DecimalField(max_digits=18, decimal_places=8)
    unit = models.CharField(max_length=50)
    effective_date = models.DateField()

    class Meta:
        app_label = "master_data"
        db_table = "master_conversion_factor"
        unique_together = ("energy_supply", "effective_date")


class Sector(AuditedModel, SoftDeleteModel):
    sector_code = models.CharField(max_length=20, unique=True)
    sector_name = models.CharField(max_length=100, unique=True)
    parent_sector = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="sub_sectors")

    class Meta:
        app_label = "master_data"
        db_table = "master_sector"

    def __str__(self):
        return self.sector_name


class ElectricityCategory(AuditedModel, SoftDeleteModel):
    CATEGORY_TYPE_CHOICES = [
        ("RESIDENTIAL", "Residential"), ("COMMERCIAL", "Commercial"),
        ("INDUSTRIAL", "Industrial"), ("PUBLIC", "Public"),
    ]
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="electricity_categories")
    category_code = models.CharField(max_length=20, unique=True)
    category_name = models.CharField(max_length=100)
    category_type = models.CharField(max_length=20, choices=CATEGORY_TYPE_CHOICES)

    class Meta:
        app_label = "master_data"
        db_table = "master_electricity_category"
        unique_together = ("category_name", "sector")


class VehicleType(AuditedModel, SoftDeleteModel):
    VEHICLE_CATEGORY_CHOICES = [
        ("LIGHT", "Light"), ("MEDIUM", "Medium"), ("HEAVY", "Heavy"), ("SPECIAL", "Special"),
    ]
    vehicle_type_code = models.CharField(max_length=20, unique=True)
    vehicle_type_name = models.CharField(max_length=100, unique=True)
    vehicle_category = models.CharField(max_length=20, choices=VEHICLE_CATEGORY_CHOICES)
    gross_weight_min = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gross_weight_max = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        app_label = "master_data"
        db_table = "master_vehicle_type"


class Mileage(AuditedModel, SoftDeleteModel):
    FUEL_TYPE_CHOICES = [
        ("PETROL", "Petrol"), ("DIESEL", "Diesel"), ("CNG", "CNG"), ("ELECTRIC", "Electric"),
    ]
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.PROTECT, related_name="mileages")
    fuel_type = models.CharField(max_length=20, choices=FUEL_TYPE_CHOICES)
    mileage_kmpl = models.DecimalField(max_digits=8, decimal_places=3)
    effective_year = models.PositiveSmallIntegerField()

    class Meta:
        app_label = "master_data"
        db_table = "master_mileage"
        unique_together = ("vehicle_type", "fuel_type", "effective_year")


class BiogasSize(AuditedModel, SoftDeleteModel):
    PRODUCTION_TYPE_CHOICES = [
        ("DOMESTIC", "Domestic"), ("INDUSTRIAL", "Industrial"), ("COMMERCIAL", "Commercial"),
    ]
    size_category = models.CharField(max_length=50)
    production_type = models.CharField(max_length=20, choices=PRODUCTION_TYPE_CHOICES)
    capacity_m3 = models.DecimalField(max_digits=12, decimal_places=4)
    density = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    annual_operating_hours = models.PositiveIntegerField(default=8760)

    class Meta:
        app_label = "master_data"
        db_table = "master_biogas_size"


class SolarEnergySize(AuditedModel, SoftDeleteModel):
    size_category = models.CharField(max_length=50)
    capacity_kwp = models.DecimalField(max_digits=12, decimal_places=4)
    energy_kwh = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    panel_type = models.CharField(max_length=100, blank=True)
    efficiency = models.DecimalField(max_digits=6, decimal_places=4, null=True, blank=True)

    class Meta:
        app_label = "master_data"
        db_table = "master_solar_size"


class IndustryClassification(AuditedModel, SoftDeleteModel):
    CATEGORY_CHOICES = [
        ("MANUFACTURING", "Manufacturing"), ("MINING", "Mining"),
        ("CONSTRUCTION", "Construction"), ("OTHERS", "Others"),
    ]
    classification_code = models.CharField(max_length=20, unique=True)
    classification_name = models.CharField(max_length=100, unique=True)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    isic_code = models.CharField(max_length=20, blank=True)
    description = models.TextField(blank=True)

    class Meta:
        app_label = "master_data"
        db_table = "master_industry_classification"