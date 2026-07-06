from django.db import models
from eis_core.models import AuditedModel, SoftDeleteModel

# ═══════════════════════════════════════════════════════════════════
# LOOKUP TABLES  (Data Settings)
# ═══════════════════════════════════════════════════════════════════

class ConversionUnit(AuditedModel, SoftDeleteModel):
    unit_code   = models.CharField(max_length=20, unique=True)
    unit_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_conversion_unit"
        ordering  = ["unit_name"]

    def __str__(self):
        return f"{self.unit_code} — {self.unit_name}"


class ElectricityType(AuditedModel, SoftDeleteModel):
    type_code   = models.CharField(max_length=20, unique=True)
    type_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_electricity_type"
        ordering  = ["type_name"]

    def __str__(self):
        return self.type_name





class FuelType(AuditedModel, SoftDeleteModel):
    CATEGORY_CHOICES = [
        ("ELECTRICITY", "Electricity"),
        ("PETROLEUM",   "Petroleum"),
        ("COAL",        "Coal"),
        ("BIOMASS",     "Biomass"),
        ("RENEWABLES",  "Renewables"),
        ("OTHERS",      "Others"),
    ]

    fuel_code     = models.CharField(max_length=20, unique=True)
    fuel_name     = models.CharField(max_length=100)
    parent_fuel   = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="children"
    )
    fuel_category = models.ForeignKey(
        "EnergyCategory", on_delete=models.SET_NULL, null=True, blank=True, related_name="fuel_types"
    )
    description   = models.TextField(blank=True)
    ipcc_code     = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_fuel_type"
        ordering  = ["parent_fuel__fuel_name", "fuel_name"]

    def __str__(self):
        return self.fuel_name


class VehicleFuelType(AuditedModel, SoftDeleteModel):
    fuel_code   = models.CharField(max_length=20, unique=True)
    fuel_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_vehicle_fuel_type"
        ordering  = ["fuel_name"]

    def __str__(self):
        return self.fuel_name


class ProductionType(AuditedModel, SoftDeleteModel):
    type_code   = models.CharField(max_length=20, unique=True)
    type_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_production_type"
        ordering  = ["type_name"]

    def __str__(self):
        return self.type_name


class PanelType(AuditedModel, SoftDeleteModel):
    type_code   = models.CharField(max_length=20, unique=True)
    type_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_panel_type"
        ordering  = ["type_name"]

    def __str__(self):
        return self.type_name


class IndustryCategory(AuditedModel, SoftDeleteModel):
    category_code = models.CharField(max_length=20, unique=True)
    category_name = models.CharField(max_length=100)
    description   = models.TextField(blank=True)
    ipcc_code     = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_industry_category"
        ordering  = ["category_name"]

    def __str__(self):
        return self.category_name


class MeasurementUnit(AuditedModel, SoftDeleteModel):
    unit_code   = models.CharField(max_length=20, unique=True)
    unit_name   = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    ipcc_code   = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_measurement_unit"
        ordering  = ["unit_name"]

    def __str__(self):
        return f"{self.unit_code} — {self.unit_name}"


class EnergyCategory(AuditedModel, SoftDeleteModel):
    category_code = models.CharField(max_length=20, unique=True)
    category_name = models.CharField(max_length=100)
    description   = models.TextField(blank=True)
    ipcc_code     = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_energy_category"
        ordering  = ["category_name"]

    def __str__(self):
        return self.category_name


# ═══════════════════════════════════════════════════════════════════
# DATA COLLECTION CORE SETTINGS (Shared across modules)
# ═══════════════════════════════════════════════════════════════════

DZONGKHAG_CHOICES = [
    ("bumthang",          "Bumthang"),
    ("chhukha",           "Chhukha"),
    ("dagana",            "Dagana"),
    ("gasa",              "Gasa"),
    ("haa",               "Haa"),
    ("lhuentse",          "Lhuentse"),
    ("mongar",            "Mongar"),
    ("paro",              "Paro"),
    ("pemagatshel",       "Pemagatshel"),
    ("punakha",           "Punakha"),
    ("samdrup_jongkhar",  "Samdrup Jongkhar"),
    ("samtse",            "Samtse"),
    ("sarpang",           "Sarpang"),
    ("thimphu",           "Thimphu"),
    ("trashigang",        "Trashigang"),
    ("trashiyangtse",     "Trashiyangtse"),
    ("trongsa",           "Trongsa"),
    ("tsirang",           "Tsirang"),
    ("wangdue_phodrang",  "Wangdue Phodrang"),
    ("zhemgang",          "Zhemgang"),
]

class Dzongkhag(AuditedModel):
    REGION_CHOICES = [
        ('Eastern region', 'Eastern region'),
        ('Western region', 'Western region'),
        ('Unknown', 'Unknown'),
    ]

    dzongkhag_code = models.CharField(max_length=10, unique=True)
    dzongkhag      = models.CharField(max_length=100)
    region_code    = models.CharField(max_length=20, blank=True, null=True)
    region         = models.CharField(max_length=50, choices=REGION_CHOICES, default='Unknown')
    iso_code       = models.CharField(max_length=10, blank=True, null=True)
    
    is_active      = models.BooleanField(default=True)
    ipcc_code      = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_dzongkhag"
        ordering  = ["dzongkhag"]

    def __str__(self):
        return self.dzongkhag


class DataCollectionYear(AuditedModel):
    year      = models.PositiveSmallIntegerField(unique=True)
    is_active = models.BooleanField(default=True)
    notes     = models.CharField(max_length=200, blank=True)

    class Meta:
        db_table  = "master_data_year"
        ordering  = ["-year"]

    def __str__(self):
        return str(self.year)


class DataSource(AuditedModel):
    SOURCE_TYPE_CHOICES = [
        ("MANUAL",  "Manual Entry"),
        ("REPORT",  "Annual Report / Document"),
        ("API",     "API / System Feed"),
        ("EXCEL",   "Excel Upload"),
        ("SURVEY",  "Survey / Field Data"),
    ]
    source_code  = models.CharField(max_length=20, unique=True)
    source_name  = models.CharField(max_length=200)
    source_type  = models.CharField(max_length=20, choices=SOURCE_TYPE_CHOICES, default="MANUAL")
    organization = models.CharField(max_length=200, blank=True)
    is_active    = models.BooleanField(default=True)
    ipcc_code    = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_data_source"
        ordering  = ["source_name"]

    def __str__(self):
        return f"{self.source_name} ({self.source_code})"


class Country(AuditedModel):
    country_code = models.CharField(max_length=5, unique=True)
    country_name = models.CharField(max_length=100)
    is_active    = models.BooleanField(default=True)
    ipcc_code    = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_country"
        ordering  = ["country_name"]

    def __str__(self):
        return self.country_name


class BPCCategory(AuditedModel):
    VOLTAGE_CHOICES = [
        ("LV",      "Low Voltage (LV)"),
        ("LV_BULK", "LV Bulk"),
        ("MV",      "Medium Voltage (MV)"),
        ("HV",      "High Voltage (HV)"),
    ]
    category_code        = models.CharField(max_length=20, unique=True)
    category_name        = models.CharField(max_length=150)
    voltage_tier         = models.CharField(max_length=10, choices=VOLTAGE_CHOICES)
    sort_order           = models.PositiveSmallIntegerField(default=0)
    sector               = models.ForeignKey(
        "Sector", on_delete=models.SET_NULL, null=True, blank=True,
    )
    electricity_category = models.ForeignKey(
        "ElectricityCategory", on_delete=models.SET_NULL, null=True, blank=True,
    )
    is_active            = models.BooleanField(default=True)
    ipcc_code            = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_bpc_category"
        ordering  = ["sort_order"]

    def __str__(self):
        return f"{self.category_name} ({self.voltage_tier})"


class GenerationPlant(AuditedModel):
    plant_code                 = models.CharField(max_length=50, unique=True)
    plant_name                 = models.CharField(max_length=250)
    plant_status               = models.CharField(max_length=100, blank=True, null=True)
    acronym                    = models.CharField(max_length=100, blank=True, null=True)
    plant_type                 = models.CharField(max_length=100, blank=True, null=True)
    plant_subtype              = models.CharField(max_length=100, blank=True, null=True)
    dzongkhag                  = models.ForeignKey(Dzongkhag, on_delete=models.SET_NULL, null=True, blank=True)
    gewog                      = models.CharField(max_length=100, blank=True, null=True)
    village                    = models.CharField(max_length=250, blank=True, null=True)
    installed_capacity         = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    existing_energy_generation = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    year_of_operation          = models.DateField(null=True, blank=True)
    firm_power                 = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    ppa_signed                 = models.DateField(null=True, blank=True)
    scheduled_delivery_date    = models.DateField(null=True, blank=True)
    actual_delivery_date       = models.DateField(null=True, blank=True)
    delay                      = models.CharField(max_length=100, blank=True, null=True)
    dpr_cost                   = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    actual_cost_btn            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    actual_cost_usd            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    idc                        = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    emission_reductions_pa     = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    remarks                    = models.TextField(blank=True, null=True)
    owner                      = models.CharField(max_length=250, blank=True, null=True)
    no_of_units                = models.IntegerField(null=True, blank=True)
    grid_type                  = models.CharField(max_length=100, blank=True, null=True)
    generator_type             = models.CharField(max_length=100, blank=True, null=True)
    construction_type          = models.CharField(max_length=100, blank=True, null=True)
    storage_size               = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    system_type                = models.CharField(max_length=100, blank=True, null=True)
    set_numbers                = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    energy                     = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    is_active                  = models.BooleanField(default=True)
    ipcc_code                  = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_generation_plant"
        ordering  = ["plant_type", "plant_name"]

    def __str__(self):
        return f"{self.plant_name} ({self.plant_type or 'Unknown'})"


class Substation(AuditedModel, SoftDeleteModel):
    substation_code   = models.CharField(max_length=20, unique=True)
    substation_name   = models.CharField(max_length=200)
    acronym           = models.CharField(max_length=20, blank=True)
    dzongkhag         = models.ForeignKey(Dzongkhag, on_delete=models.SET_NULL, null=True, blank=True)
    gewog             = models.CharField(max_length=100, blank=True)
    region            = models.CharField(max_length=100, blank=True)
    voltage_level     = models.CharField(max_length=50, blank=True)
    substation_type   = models.CharField(max_length=100, blank=True)
    commissioned_date = models.DateField(null=True, blank=True)
    remarks           = models.TextField(blank=True)
    is_active         = models.BooleanField(default=True)
    ipcc_code         = models.CharField(max_length=50, blank=True, null=True)
    
    # Extended fields matching ref_substation.xls
    plant_status      = models.CharField(max_length=50, blank=True, null=True)
    plant_type        = models.CharField(max_length=100, blank=True, null=True)
    dzongkhag_code    = models.CharField(max_length=20, blank=True, null=True)
    dzo_iso_code      = models.CharField(max_length=20, blank=True, null=True)
    region_code       = models.CharField(max_length=20, blank=True, null=True)
    gewog_code        = models.CharField(max_length=20, blank=True, null=True)
    plant_type_code   = models.IntegerField(null=True, blank=True)
    plant_status_code = models.IntegerField(null=True, blank=True)
    substation_type_code = models.IntegerField(null=True, blank=True)


    class Meta:
        db_table  = "master_data_substation"
        ordering  = ["substation_name"]

    def __str__(self):
        return self.substation_name


class SubstationTransformer(AuditedModel, SoftDeleteModel):
    substation       = models.ForeignKey(Substation, on_delete=models.CASCADE, related_name="transformers")
    transformer_code = models.CharField(max_length=50, unique=True, blank=True)
    voltage_ratio    = models.CharField(max_length=100, blank=True)

    def save(self, *args, **kwargs):
        if not self.transformer_code and self.substation:
            sub_code = self.substation.substation_code
            count = SubstationTransformer.objects.filter(substation=self.substation).count() + 1
            self.transformer_code = f"{sub_code}-TR{count}"
        super().save(*args, **kwargs)
    max_capacity_mva = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    max_capacity_mw  = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True, help_text="Capacity in MW at 0.9 PF rate")
    pf_rate          = models.DecimalField(max_digits=5, decimal_places=3, default=0.9)
    bay_count        = models.IntegerField(null=True, blank=True)
    incoming_feeders = models.IntegerField(null=True, blank=True)
    outgoing_feeders = models.IntegerField(null=True, blank=True)
    commissioned_date = models.DateField(null=True, blank=True)
    is_active        = models.BooleanField(default=True)
    ipcc_code        = models.CharField(max_length=50, blank=True, null=True)
    # Extended fields matching ref_transformer.xls


    status_name       = models.CharField(max_length=50, blank=True, null=True)
    plant_status_code = models.IntegerField(null=True, blank=True)
    substation_name   = models.CharField(max_length=200, blank=True, null=True)
    plant_type        = models.CharField(max_length=100, blank=True, null=True)
    plant_type_code   = models.IntegerField(null=True, blank=True)
    acronym           = models.CharField(max_length=50, blank=True, null=True)
    dzongkhag         = models.CharField(max_length=100, blank=True, null=True)
    dzongkhag_code    = models.CharField(max_length=20, blank=True, null=True)
    gewog             = models.CharField(max_length=100, blank=True, null=True)
    gewog_code        = models.CharField(max_length=20, blank=True, null=True)
    dzo_iso_code      = models.CharField(max_length=20, blank=True, null=True)
    region            = models.CharField(max_length=100, blank=True, null=True)
    region_code       = models.CharField(max_length=20, blank=True, null=True)
    substation_type   = models.CharField(max_length=100, blank=True, null=True)
    substation_type_code = models.IntegerField(null=True, blank=True)
    no_of_transformers = models.IntegerField(null=True, blank=True)
    transformer_capacity = models.CharField(max_length=100, blank=True, null=True)


    class Meta:
        db_table  = "master_data_substation_transformer"
        ordering  = ["substation__substation_name", "transformer_code"]

    def __str__(self):
        return f"{self.substation.acronym or self.substation.substation_name} — {self.transformer_code}"


# ═══════════════════════════════════════════════════════════════════
# MIGRATED LOOKUP TABLES (From Master Data)
# ═══════════════════════════════════════════════════════════════════

class Sector(AuditedModel, SoftDeleteModel):
    sector_code   = models.CharField(max_length=20, unique=True)
    sector_name   = models.CharField(max_length=100, unique=True)
    ipcc_code     = models.CharField(max_length=50, blank=True, null=True)
    parent_sector = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="sub_sectors"
    )

    class Meta:
        db_table  = "master_data_sector"
        ordering  = ["sector_name"]

    def __str__(self):
        return self.sector_name


class ElectricityCategory(AuditedModel, SoftDeleteModel):
    sector        = models.ForeignKey(
        Sector, on_delete=models.PROTECT, related_name="electricity_categories"
    )
    category_code = models.CharField(max_length=20, unique=True)
    category_name = models.CharField(max_length=100)
    category_type = models.ForeignKey(
        "ElectricityType", on_delete=models.PROTECT,
        related_name="electricity_categories", null=True, blank=True
    )
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table        = "master_data_electricity_category"
        unique_together = ("category_name", "sector")

    def __str__(self):
        return self.category_name


class VehicleType(AuditedModel, SoftDeleteModel):
    vehicle_type_code = models.CharField(max_length=20, unique=True)
    vehicle_type_name = models.CharField(max_length=100, unique=True)
    gross_weight_min  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    gross_weight_max  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)
    # New self‑referencing parent field for hierarchical vehicle types
    parent = models.ForeignKey('self', null=True, blank=True, on_delete=models.PROTECT, related_name='children')

    class Meta:
        db_table  = "master_data_vehicle_type"
        ordering  = ["parent__vehicle_type_name", "vehicle_type_name"]

    def __str__(self):
        return f"{self.vehicle_type_name}" if not self.parent else f"{self.parent.vehicle_type_name} > {self.vehicle_type_name}"


class Mileage(AuditedModel, SoftDeleteModel):
    vehicle_type   = models.ForeignKey(
        VehicleType, on_delete=models.PROTECT, related_name="mileages"
    )
    fuel_type      = models.ForeignKey(
        "VehicleFuelType", on_delete=models.PROTECT,
        related_name="mileages", null=True, blank=True
    )
    mileage_kmpl   = models.DecimalField(max_digits=8, decimal_places=3)
    effective_year = models.PositiveSmallIntegerField()
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table        = "master_data_mileage"
        unique_together = ("vehicle_type", "fuel_type", "effective_year")


class BiogasSize(AuditedModel, SoftDeleteModel):
    size_category          = models.CharField(max_length=50)
    production_type        = models.ForeignKey(
        "ProductionType", on_delete=models.PROTECT,
        related_name="biogas_sizes", null=True, blank=True
    )
    capacity_m3            = models.DecimalField(max_digits=12, decimal_places=4)
    density                = models.DecimalField(max_digits=10, decimal_places=6, null=True, blank=True)
    annual_operating_hours = models.PositiveIntegerField(default=8760)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_biogas_size"
        ordering  = ["size_category"]


class SolarEnergySize(AuditedModel, SoftDeleteModel):
    category = models.CharField(max_length=100)
    installed_capacity_kwp = models.DecimalField(max_digits=12, decimal_places=4)
    sector = models.ForeignKey(
        "Sector", on_delete=models.PROTECT,
        related_name="solar_sizes", null=True, blank=True
    )
    energy_generation_kwh = models.DecimalField(max_digits=12, decimal_places=4, null=True, blank=True)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table  = "master_data_solar_size"
        ordering  = ["category"]

    def __str__(self):
        return self.category


class IndustryClassification(AuditedModel, SoftDeleteModel):
    classification_code = models.CharField(max_length=20, unique=True)
    classification_name = models.CharField(max_length=100, unique=True)
    category            = models.ForeignKey(
        "IndustryCategory", on_delete=models.PROTECT,
        related_name="industry_classifications", null=True, blank=True
    )
    ipcc_code           = models.CharField(max_length=50, blank=True, null=True)
    description         = models.TextField(blank=True)

    class Meta:
        db_table  = "master_data_industry_classification"
        ordering  = ["classification_name"]

    def __str__(self):
        return self.classification_name


# ═══════════════════════════════════════════════════════════════════
# CORE MASTER DATA TABLES (Migrated)
# ═══════════════════════════════════════════════════════════════════

class EnergySupply(AuditedModel, SoftDeleteModel):
    LEVEL_CHOICES = [
        (0, "Root / Category"),
        (1, "Sub-type"),
        (2, "Detail / Leaf"),
    ]

    supply_code      = models.CharField(max_length=20, unique=True)
    supply_name      = models.CharField(max_length=100)
    parent_supply    = models.ForeignKey(
        "self", null=True, blank=True,
        on_delete=models.PROTECT,
        related_name="children",
    )
    level            = models.PositiveSmallIntegerField(
        default=0, choices=LEVEL_CHOICES,
    )
    sort_order       = models.PositiveSmallIntegerField(default=0)
    measurement_unit = models.CharField(max_length=20, blank=True)
    energy_category  = models.ForeignKey(
        "master_data.EnergyCategory", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="energy_supplies",
    )
    fuel_type        = models.CharField(max_length=50, blank=True)
    ipcc_code        = models.CharField(max_length=50, blank=True, null=True)
    description      = models.TextField(blank=True)

    class Meta:
        db_table  = "master_data_energy_supply"
        ordering  = ["sort_order", "supply_name"]
        unique_together = [["supply_name", "parent_supply"]]

    def __str__(self):
        return self.supply_name

    def clean(self):
        super().clean()
        if self.parent_supply_id and self.parent_supply_id == self.id:
            from django.core.exceptions import ValidationError
            raise ValidationError("An energy supply cannot be its own parent.")

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    @property
    def full_path(self):
        parts = [self.supply_name]
        node  = self.parent_supply
        while node:
            parts.insert(0, node.supply_name)
            node = node.parent_supply
        return " > ".join(parts)

    def get_descendants(self):
        result = []
        for child in self.children.filter(is_active=True):
            result.append(child)
            result.extend(child.get_descendants())
        return result


class ConversionFactor(AuditedModel, SoftDeleteModel):
    energy_supply     = models.ForeignKey(
        EnergySupply, on_delete=models.PROTECT, related_name="conversion_factors"
    )
    conversion_factor = models.DecimalField(max_digits=18, decimal_places=8)
    unit              = models.ForeignKey(
        "master_data.ConversionUnit", on_delete=models.PROTECT,
        related_name="conversion_factors", null=True, blank=True
    )
    effective_date    = models.DateField()

    class Meta:
        db_table        = "master_data_conversion_factor"
        unique_together = ("energy_supply", "unit", "effective_date")

# ═══════════════════════════════════════════════════════════════════
# NEW MASTER DATA TABLES FROM EXCEL
# ═══════════════════════════════════════════════════════════════════

class ConsumerType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    consumer_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_consumer_type"

    def __str__(self):
        return self.consumer_type

class VoltageType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    voltage_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_voltage_type"

    def __str__(self):
        return self.voltage_type

class ConsumerGroup(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    consumer_group = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_consumer_group"

    def __str__(self):
        return self.consumer_group

class Location(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    location = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_location"

    def __str__(self):
        return self.location

class ConductorType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    conductor_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_conductor_type"

    def __str__(self):
        return self.conductor_type

class UnitType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    unit_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_unit_type"

    def __str__(self):
        return self.unit_type

class ConnectionType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    connection_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_connection_type"

    def __str__(self):
        return self.connection_type

class PlantSize(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    plant_size = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_plant_size"

    def __str__(self):
        return self.plant_size

class GridType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    grid_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_grid_type"

    def __str__(self):
        return self.grid_type

class ConfigurationType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    configuration_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_configuration_type"

    def __str__(self):
        return self.configuration_type

class LineCategory(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    line_category = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_line_category"

    def __str__(self):
        return self.line_category

class CircuitType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    circuit_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_circuit_type"

    def __str__(self):
        return self.circuit_type

class SubsidyType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    subsidy_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_subsidy_type"

    def __str__(self):
        return self.subsidy_type

class TowerType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    tower_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_tower_type"

    def __str__(self):
        return self.tower_type

class TransformerType(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    transformer_type = models.CharField(max_length=255)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_transformer_type"

    def __str__(self):
        return self.transformer_type


# Relational Mapping Tables

class VoltageLevel(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    voltage_level = models.CharField(max_length=255)
    voltage_type = models.ForeignKey(VoltageType, on_delete=models.PROTECT, related_name="voltage_levels", null=True, blank=True)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_voltage_level"

    def __str__(self):
        return self.voltage_level


class ConsumerSubtype(AuditedModel, SoftDeleteModel):
    code = models.CharField(max_length=20, unique=True)
    consumer_subtype = models.CharField(max_length=255)
    consumer_type = models.ForeignKey(ConsumerType, on_delete=models.PROTECT, related_name="subtypes", null=True, blank=True)
    location = models.ForeignKey(Location, on_delete=models.PROTECT, related_name="consumer_subtypes", null=True, blank=True)
    voltage_type = models.ForeignKey(VoltageType, on_delete=models.PROTECT, related_name="consumer_subtypes", null=True, blank=True)
    ipcc_code = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        db_table = "master_data_consumer_subtype"

    def __str__(self):
        return self.consumer_subtype
