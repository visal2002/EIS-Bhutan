from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    ConversionUnit, ElectricityType,

    FuelType, VehicleFuelType, ProductionType, PanelType, IndustryCategory,
    MeasurementUnit, EnergyCategory,
    Dzongkhag, DataCollectionYear, DataSource, Country,
    BPCCategory, GenerationPlant, Substation, SubstationTransformer,
    Sector, ElectricityCategory, VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
    ConsumerType, VoltageType, ConsumerGroup, Location, ConductorType,
    UnitType, ConnectionType, PlantSize, GridType, ConfigurationType,
    LineCategory, CircuitType, SubsidyType, TowerType, TransformerType,
    VoltageLevel, ConsumerSubtype
)

@admin.register(ConversionUnit)
class ConversionUnitAdmin(ModelAdmin):
    list_display = ["unit_code", "unit_name", "ipcc_code", "is_active"]
    search_fields = ["unit_code", "unit_name"]

@admin.register(ElectricityType)
class ElectricityTypeAdmin(ModelAdmin):
    list_display = ["type_code", "type_name", "ipcc_code", "is_active"]
    search_fields = ["type_code", "type_name"]

@admin.register(FuelType)
class FuelTypeAdmin(ModelAdmin):
    list_display = ["fuel_code", "fuel_name", "fuel_category", "parent_fuel", "is_active"]
    list_filter = ["fuel_category", "is_active"]
    search_fields = ["fuel_code", "fuel_name"]

@admin.register(VehicleFuelType)
class VehicleFuelTypeAdmin(ModelAdmin):
    list_display = ["fuel_code", "fuel_name", "ipcc_code", "is_active"]
    search_fields = ["fuel_code", "fuel_name"]

@admin.register(ProductionType)
class ProductionTypeAdmin(ModelAdmin):
    list_display = ["type_code", "type_name", "ipcc_code", "is_active"]
    search_fields = ["type_code", "type_name"]

@admin.register(PanelType)
class PanelTypeAdmin(ModelAdmin):
    list_display = ["type_code", "type_name", "ipcc_code", "is_active"]
    search_fields = ["type_code", "type_name"]

@admin.register(IndustryCategory)
class IndustryCategoryAdmin(ModelAdmin):
    list_display = ["category_code", "category_name", "ipcc_code", "is_active"]
    search_fields = ["category_code", "category_name"]

@admin.register(MeasurementUnit)
class MeasurementUnitAdmin(ModelAdmin):
    list_display = ["unit_code", "unit_name", "ipcc_code", "is_active"]
    search_fields = ["unit_code", "unit_name"]

@admin.register(EnergyCategory)
class EnergyCategoryAdmin(ModelAdmin):
    list_display = ["category_code", "category_name", "ipcc_code", "is_active"]
    search_fields = ["category_code", "category_name"]

@admin.register(Dzongkhag)
class DzongkhagAdmin(ModelAdmin):
    list_display = ["dzongkhag_code", "dzongkhag", "region", "region_code", "iso_code", "ipcc_code", "is_active"]
    list_filter = ["region", "is_active"]
    search_fields = ["dzongkhag_code", "dzongkhag", "region_code", "iso_code", "ipcc_code"]

@admin.register(DataCollectionYear)
class DataCollectionYearAdmin(ModelAdmin):
    list_display = ["year", "is_active"]
    list_filter = ["is_active"]

@admin.register(DataSource)
class DataSourceAdmin(ModelAdmin):
    list_display = ["source_code", "source_name", "source_type", "organization", "is_active"]
    list_filter = ["source_type", "is_active"]
    search_fields = ["source_code", "source_name", "organization"]

@admin.register(Country)
class CountryAdmin(ModelAdmin):
    list_display = ["country_code", "country_name", "is_active"]
    search_fields = ["country_code", "country_name"]

@admin.register(BPCCategory)
class BPCCategoryAdmin(ModelAdmin):
    list_display = ["category_code", "category_name", "voltage_tier", "sector", "is_active"]
    list_filter = ["voltage_tier", "sector", "is_active"]
    search_fields = ["category_code", "category_name"]

@admin.register(GenerationPlant)
class GenerationPlantAdmin(ModelAdmin):
    list_display = ["plant_code", "plant_name", "plant_type", "dzongkhag", "plant_status", "is_active"]
    list_filter = ["plant_type", "dzongkhag", "plant_status", "is_active"]
    search_fields = ["plant_code", "plant_name", "acronym"]

@admin.register(Substation)
class SubstationAdmin(ModelAdmin):
    list_display = ["substation_code", "substation_name", "dzongkhag", "is_active"]
    list_filter = ["dzongkhag", "is_active"]
    search_fields = ["substation_code", "substation_name"]

@admin.register(SubstationTransformer)
class SubstationTransformerAdmin(ModelAdmin):
    list_display = ["transformer_code", "substation", "max_capacity_mva", "is_active"]
    list_filter = ["substation", "is_active"]
    search_fields = ["transformer_code"]

@admin.register(Sector)
class SectorAdmin(ModelAdmin):
    list_display    = ["sector_code", "sector_name", "parent_sector", "is_active"]
    list_filter     = ["is_active", "parent_sector"]
    search_fields   = ["sector_name", "sector_code"]
    ordering        = ["sector_name"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(ElectricityCategory)
class ElectricityCategoryAdmin(ModelAdmin):
    list_display    = ["category_code", "category_name", "sector", "category_type", "is_active"]
    list_filter     = ["is_active", "category_type", "sector"]
    search_fields   = ["category_name", "category_code"]
    ordering        = ["category_name"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(VehicleType)
class VehicleTypeAdmin(ModelAdmin):
    list_display    = ["vehicle_type_code", "vehicle_type_name", "is_active"]
    list_filter     = ["is_active"]
    search_fields   = ["vehicle_type_name", "vehicle_type_code"]
    ordering        = ["vehicle_type_name"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(Mileage)
class MileageAdmin(ModelAdmin):
    list_display    = ["vehicle_type", "fuel_type", "mileage_kmpl", "effective_year", "is_active"]
    list_filter     = ["is_active", "fuel_type", "vehicle_type"]
    search_fields   = ["vehicle_type__vehicle_type_name"]
    ordering        = ["vehicle_type", "fuel_type", "-effective_year"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(BiogasSize)
class BiogasSizeAdmin(ModelAdmin):
    list_display    = ["size_category", "production_type", "capacity_m3", "annual_operating_hours", "is_active"]
    list_filter     = ["is_active", "production_type"]
    search_fields   = ["size_category"]
    ordering        = ["size_category"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(SolarEnergySize)
class SolarEnergySizeAdmin(ModelAdmin):
    list_display    = ["category", "installed_capacity_kwp", "sector", "energy_generation_kwh", "is_active"]
    list_filter     = ["is_active", "sector"]
    search_fields   = ["category", "sector__sector_name"]
    ordering        = ["category"]
    readonly_fields = ["created_at", "updated_at"]

@admin.register(IndustryClassification)
class IndustryClassificationAdmin(ModelAdmin):
    list_display    = ["classification_code", "classification_name", "category", "ipcc_code", "is_active"]
    list_filter     = ["is_active", "category"]
    search_fields   = ["classification_name", "classification_code", "ipcc_code"]
    ordering        = ["classification_name"]
    readonly_fields = ["created_at", "updated_at"]

# ═══════════════════════════════════════════════════════════════════
# NEW MASTER DATA ADMIN CLASSES
# ═══════════════════════════════════════════════════════════════════

@admin.register(ConsumerType)
class ConsumerTypeAdmin(ModelAdmin):
    list_display = ["code", "consumer_type", "ipcc_code", "is_active"]
    search_fields = ["code", "consumer_type", "ipcc_code"]

@admin.register(VoltageType)
class VoltageTypeAdmin(ModelAdmin):
    list_display = ["code", "voltage_type", "ipcc_code", "is_active"]
    search_fields = ["code", "voltage_type", "ipcc_code"]

@admin.register(ConsumerGroup)
class ConsumerGroupAdmin(ModelAdmin):
    list_display = ["code", "consumer_group", "ipcc_code", "is_active"]
    search_fields = ["code", "consumer_group", "ipcc_code"]

@admin.register(Location)
class LocationAdmin(ModelAdmin):
    list_display = ["code", "location", "ipcc_code", "is_active"]
    search_fields = ["code", "location", "ipcc_code"]

@admin.register(ConductorType)
class ConductorTypeAdmin(ModelAdmin):
    list_display = ["code", "conductor_type", "ipcc_code", "is_active"]
    search_fields = ["code", "conductor_type", "ipcc_code"]

@admin.register(UnitType)
class UnitTypeAdmin(ModelAdmin):
    list_display = ["code", "unit_type", "ipcc_code", "is_active"]
    search_fields = ["code", "unit_type", "ipcc_code"]

@admin.register(ConnectionType)
class ConnectionTypeAdmin(ModelAdmin):
    list_display = ["code", "connection_type", "ipcc_code", "is_active"]
    search_fields = ["code", "connection_type", "ipcc_code"]

@admin.register(PlantSize)
class PlantSizeAdmin(ModelAdmin):
    list_display = ["code", "plant_size", "ipcc_code", "is_active"]
    search_fields = ["code", "plant_size", "ipcc_code"]

@admin.register(GridType)
class GridTypeAdmin(ModelAdmin):
    list_display = ["code", "grid_type", "ipcc_code", "is_active"]
    search_fields = ["code", "grid_type", "ipcc_code"]

@admin.register(ConfigurationType)
class ConfigurationTypeAdmin(ModelAdmin):
    list_display = ["code", "configuration_type", "ipcc_code", "is_active"]
    search_fields = ["code", "configuration_type", "ipcc_code"]

@admin.register(LineCategory)
class LineCategoryAdmin(ModelAdmin):
    list_display = ["code", "line_category", "ipcc_code", "is_active"]
    search_fields = ["code", "line_category", "ipcc_code"]

@admin.register(CircuitType)
class CircuitTypeAdmin(ModelAdmin):
    list_display = ["code", "circuit_type", "ipcc_code", "is_active"]
    search_fields = ["code", "circuit_type", "ipcc_code"]

@admin.register(SubsidyType)
class SubsidyTypeAdmin(ModelAdmin):
    list_display = ["code", "subsidy_type", "ipcc_code", "is_active"]
    search_fields = ["code", "subsidy_type", "ipcc_code"]

@admin.register(TowerType)
class TowerTypeAdmin(ModelAdmin):
    list_display = ["code", "tower_type", "ipcc_code", "is_active"]
    search_fields = ["code", "tower_type", "ipcc_code"]

@admin.register(TransformerType)
class TransformerTypeAdmin(ModelAdmin):
    list_display = ["code", "transformer_type", "ipcc_code", "is_active"]
    search_fields = ["code", "transformer_type", "ipcc_code"]

@admin.register(VoltageLevel)
class VoltageLevelAdmin(ModelAdmin):
    list_display = ["code", "voltage_level", "voltage_type", "ipcc_code", "is_active"]
    list_filter = ["voltage_type", "is_active"]
    search_fields = ["code", "voltage_level", "ipcc_code"]

@admin.register(ConsumerSubtype)
class ConsumerSubtypeAdmin(ModelAdmin):
    list_display = ["code", "consumer_subtype", "consumer_type", "location", "voltage_type", "ipcc_code", "is_active"]
    list_filter = ["consumer_type", "location", "voltage_type", "is_active"]
    search_fields = ["code", "consumer_subtype", "ipcc_code"]
