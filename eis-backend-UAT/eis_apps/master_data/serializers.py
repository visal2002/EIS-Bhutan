from rest_framework import serializers
from .models import ConsumerType, VoltageType, ConsumerGroup, Location, ConductorType, UnitType, ConnectionType, PlantSize, GridType, ConfigurationType, LineCategory, CircuitType, SubsidyType, TowerType, TransformerType, VoltageLevel, ConsumerSubtype
from .models import (
    ConversionUnit, ElectricityType,
    FuelType, VehicleFuelType, ProductionType, PanelType, IndustryCategory,
    MeasurementUnit, EnergyCategory,
    Dzongkhag, DataCollectionYear, DataSource, Country,
    BPCCategory, GenerationPlant, Substation, SubstationTransformer,
    Sector, ElectricityCategory, VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
    EnergySupply, ConversionFactor
)

# ═══════════════════════════════════════════════════════════════════
# SETTINGS / LOOKUP SERIALIZERS
# ═══════════════════════════════════════════════════════════════════

class ConversionUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConversionUnit
        fields = ["id", "unit_code", "unit_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ConversionUnitDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ConversionUnit
        fields = ["id", "unit_code", "unit_name"]


class ElectricityTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ElectricityType
        fields = ["id", "type_code", "type_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ElectricityTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ElectricityType
        fields = ["id", "type_code", "type_name"]





class FuelTypeSerializer(serializers.ModelSerializer):
    fuel_category_display = serializers.CharField(
        source="fuel_category.category_name", read_only=True, allow_null=True
    )
    parent_fuel_name = serializers.CharField(
        source="parent_fuel.fuel_name", read_only=True, allow_null=True
    )
    children_count   = serializers.IntegerField(
        source="children.count", read_only=True, default=0
    )

    class Meta:
        model  = FuelType
        fields = ["id", "fuel_code", "fuel_name", "parent_fuel", "parent_fuel_name",
                  "fuel_category", "fuel_category_display", "description", "ipcc_code", "children_count",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class FuelTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FuelType
        fields = ["id", "fuel_code", "fuel_name", "fuel_category"]


class VehicleFuelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VehicleFuelType
        fields = ["id", "fuel_code", "fuel_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class VehicleFuelTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VehicleFuelType
        fields = ["id", "fuel_code", "fuel_name"]


class ProductionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductionType
        fields = ["id", "type_code", "type_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class ProductionTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ProductionType
        fields = ["id", "type_code", "type_name"]


class PanelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PanelType
        fields = ["id", "type_code", "type_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class PanelTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PanelType
        fields = ["id", "type_code", "type_name"]


class IndustryCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = IndustryCategory
        fields = ["id", "category_code", "category_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class IndustryCategoryDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = IndustryCategory
        fields = ["id", "category_code", "category_name"]


class MeasurementUnitSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MeasurementUnit
        fields = ["id", "unit_code", "unit_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class MeasurementUnitDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = MeasurementUnit
        fields = ["id", "unit_code", "unit_name"]


class EnergyCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model  = EnergyCategory
        fields = ["id", "category_code", "category_name", "description", "ipcc_code",
                  "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]

class EnergyCategoryDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = EnergyCategory
        fields = ["id", "category_code", "category_name"]


class BPCCategorySerializer(serializers.ModelSerializer):
    sector_name        = serializers.CharField(source="sector.sector_name", read_only=True, allow_null=True)
    voltage_tier_display = serializers.CharField(source="get_voltage_tier_display", read_only=True)
    electricity_category_name = serializers.CharField(source="electricity_category.category_name", read_only=True, allow_null=True)

    class Meta:
        model  = BPCCategory
        fields = [
            "id", "category_code", "category_name", "voltage_tier", "voltage_tier_display",
            "sort_order", "sector", "sector_name", "electricity_category", "electricity_category_name",
            "ipcc_code", "created_at", "updated_at"
        ]

class BPCCategoryDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='category_name', read_only=True)
    voltage_tier_display = serializers.CharField(source="get_voltage_tier_display", read_only=True)
    class Meta:
        model  = BPCCategory
        fields = ["id", "category_code", "name", "voltage_tier", "voltage_tier_display"]


class DzongkhagSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Dzongkhag
        fields = ["id", "dzongkhag_code", "dzongkhag", "region_code", "region", "iso_code", "ipcc_code",
                  "is_active", "created_at", "updated_at"]

class DzongkhagDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='dzongkhag', read_only=True)
    class Meta:
        model  = Dzongkhag
        fields = ["id", "dzongkhag_code", "name", "region"]


class DataCollectionYearSerializer(serializers.ModelSerializer):
    class Meta:
        model  = DataCollectionYear
        fields = ["id", "year", "notes", "created_at", "updated_at"]

class DataCollectionYearDropdownSerializer(serializers.ModelSerializer):
    name = serializers.IntegerField(source='year', read_only=True)
    class Meta:
        model  = DataCollectionYear
        fields = ["id", "name"]


class DataSourceSerializer(serializers.ModelSerializer):
    source_type_display = serializers.CharField(
        source="get_source_type_display", read_only=True
    )
    class Meta:
        model  = DataSource
        fields = ["id", "source_code", "source_name", "source_type",
                  "source_type_display", "organization", "ipcc_code",
                  "is_active", "created_at", "updated_at"]

class DataSourceDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='source_name', read_only=True)
    class Meta:
        model  = DataSource
        fields = ["id", "source_code", "name", "source_type", "organization"]


class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model  = Country
        fields = ["id", "country_code", "country_name", "ipcc_code",
                  "is_active", "created_at", "updated_at"]

class CountryDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='country_name', read_only=True)
    class Meta:
        model  = Country
        fields = ["id", "country_code", "name"]


class BPCCategorySerializer(serializers.ModelSerializer):
    sector_name        = serializers.CharField(source="sector.sector_name", read_only=True, allow_null=True)
    voltage_tier_display = serializers.CharField(source="get_voltage_tier_display", read_only=True)
    electricity_category_name = serializers.CharField(source="electricity_category.category_name", read_only=True, allow_null=True)

    class Meta:
        model  = BPCCategory
        fields = [
            "id", "category_code", "category_name", "voltage_tier", "voltage_tier_display",
            "sort_order", "sector", "sector_name", "electricity_category", "electricity_category_name",
            "ipcc_code", "created_at", "updated_at"
        ]

class BPCCategoryDropdownSerializer(serializers.ModelSerializer):
    voltage_tier_display = serializers.CharField(source="get_voltage_tier_display", read_only=True)
    class Meta:
        model  = BPCCategory
        fields = ["id", "category_code", "category_name", "voltage_tier", "voltage_tier_display"]


class GenerationPlantSerializer(serializers.ModelSerializer):
    dzongkhag_name = serializers.CharField(source="dzongkhag.dzongkhag", read_only=True, allow_null=True)

    class Meta:
        model  = GenerationPlant
        fields = [
            "id", "plant_code", "plant_name", "plant_status", "acronym", "plant_type", "plant_subtype",
            "dzongkhag", "dzongkhag_name", "gewog", "village",
            "installed_capacity", "existing_energy_generation", "year_of_operation",
            "firm_power", "ppa_signed", "scheduled_delivery_date", "actual_delivery_date",
            "delay", "dpr_cost", "actual_cost_btn", "actual_cost_usd", "idc",
            "emission_reductions_pa", "remarks", "owner", "no_of_units",
            "grid_type", "generator_type", "construction_type", "storage_size",
            "system_type", "set_numbers", "energy",
            "is_active", "ipcc_code", "created_at", "updated_at"
        ]

class GenerationPlantDropdownSerializer(serializers.ModelSerializer):
    dzongkhag_name = serializers.CharField(source="dzongkhag.dzongkhag", read_only=True, allow_null=True)

    class Meta:
        model  = GenerationPlant
        fields = ["id", "plant_code", "plant_name", "acronym", "plant_type", "plant_subtype", "plant_status", "dzongkhag", "dzongkhag_name", "ipcc_code"]


class SubstationSerializer(serializers.ModelSerializer):
    dzongkhag_name = serializers.CharField(source="dzongkhag.dzongkhag", read_only=True, allow_null=True)
    
    class Meta:
        model  = Substation
        fields = [
            "id", "substation_code", "substation_name", "acronym", "gewog", "voltage_level",
            "dzongkhag", "dzongkhag_name", "region", "substation_type", "commissioned_date",
            "remarks", "ipcc_code", "is_active", "created_at", "updated_at",
            "plant_status", "plant_type", "dzongkhag_code", "dzo_iso_code",
            "region_code", "gewog_code", "plant_type_code", "plant_status_code",
            "substation_type_code"
        ]


class SubstationDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Substation
        fields = ["id", "substation_code", "substation_name", "acronym", "ipcc_code"]


class SubstationTransformerSerializer(serializers.ModelSerializer):
    substation_name = serializers.CharField(source="substation.substation_name", read_only=True, allow_null=True)
    transformer_code = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    
    class Meta:
        model  = SubstationTransformer
        fields = [
            "id", "substation", "substation_name", "transformer_code", "voltage_ratio",
            "max_capacity_mva", "max_capacity_mw", "pf_rate", "bay_count",
            "incoming_feeders", "outgoing_feeders", "commissioned_date", "ipcc_code",
            "is_active", "created_at", "updated_at",
            "status_name", "plant_status_code", "plant_type", "plant_type_code",
            "acronym", "dzongkhag", "dzongkhag_code", "gewog", "gewog_code",
            "dzo_iso_code", "region", "region_code", "substation_type",
            "substation_type_code", "no_of_transformers", "transformer_capacity"
        ]


class SubstationTransformerDropdownSerializer(serializers.ModelSerializer):
    substation_name = serializers.CharField(source="substation.substation_name", read_only=True, allow_null=True)
    
    class Meta:
        model  = SubstationTransformer
        fields = ["id", "transformer_code", "substation", "substation_name"]


# ═══════════════════════════════════════════════════════════════════
# MIGRATED LOOKUP SERIALIZERS (From Master Data)
# ═══════════════════════════════════════════════════════════════════

# ── Sector ─────────────────────────────────────────────────────────
class SectorSerializer(serializers.ModelSerializer):
    parent_sector_name = serializers.CharField(
        source="parent_sector.sector_name", read_only=True, allow_null=True
    )
    sub_sector_count = serializers.IntegerField(source="sub_sectors.count", read_only=True)

    class Meta:
        model  = Sector
        fields = [
            "id", "sector_code", "sector_name", "ipcc_code",
            "parent_sector", "parent_sector_name",
            "sub_sector_count", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SectorDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sector
        fields = ["id", "sector_code", "sector_name", "ipcc_code", "parent_sector"]


# ── Electricity Category ───────────────────────────────────────────
class ElectricityCategorySerializer(serializers.ModelSerializer):
    sector_name        = serializers.CharField(source="sector.sector_name", read_only=True)
    category_type_name = serializers.CharField(
        source="category_type.type_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = ElectricityCategory
        fields = [
            "id", "sector", "sector_name", "category_code", "category_name",
            "category_type", "category_type_name", "ipcc_code",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ElectricityCategoryDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ElectricityCategory
        fields = ["id", "category_code", "category_name", "category_type", "sector", "ipcc_code"]


# ── Vehicle Type ───────────────────────────────────────────────────
class VehicleTypeSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(
        source="parent.vehicle_type_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = VehicleType
        fields = [
            "id", "vehicle_type_code", "vehicle_type_name",
            "parent", "parent_name",
            "gross_weight_min", "gross_weight_max", "ipcc_code",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VehicleTypeDropdownSerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(
        source="parent.vehicle_type_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = VehicleType
        fields = ["id", "vehicle_type_code", "vehicle_type_name", "parent", "parent_name", "ipcc_code"]


# ── Mileage ────────────────────────────────────────────────────────
class MileageSerializer(serializers.ModelSerializer):
    vehicle_type_name = serializers.CharField(
        source="vehicle_type.vehicle_type_name", read_only=True
    )
    fuel_type_name = serializers.CharField(
        source="fuel_type.fuel_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = Mileage
        fields = [
            "id", "vehicle_type", "vehicle_type_name",
            "fuel_type", "fuel_type_name",
            "mileage_kmpl", "effective_year", "ipcc_code",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Biogas Size ────────────────────────────────────────────────────
class BiogasSizeSerializer(serializers.ModelSerializer):
    production_type_name = serializers.CharField(
        source="production_type.type_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = BiogasSize
        fields = [
            "id", "size_category",
            "production_type", "production_type_name",
            "capacity_m3", "density", "annual_operating_hours", "ipcc_code",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Solar Energy Size ──────────────────────────────────────────────
class SolarEnergySizeSerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(
        source="sector.sector_name", read_only=True, allow_null=True
    )
    # Compatibility mappings for other dashboards/components
    size_name = serializers.CharField(source="category", read_only=True)
    size_category = serializers.CharField(source="category", read_only=True)

    class Meta:
        model  = SolarEnergySize
        fields = [
            "id", "category", "installed_capacity_kwp", "sector", "sector_name",
            "energy_generation_kwh", "ipcc_code", "size_name", "size_category",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Industry Classification ────────────────────────────────────────
class IndustryClassificationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(
        source="category.category_name", read_only=True, allow_null=True
    )

    class Meta:
        model  = IndustryClassification
        fields = [
            "id", "classification_code", "classification_name",
            "category", "category_name",
            "ipcc_code", "description",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class IndustryClassificationDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = IndustryClassification
        fields = ["id", "classification_code", "classification_name", "category"]


# ── Energy Supply ──────────────────────────────────────────────────
class EnergySupplySerializer(serializers.ModelSerializer):
    energy_category_display = serializers.CharField(
        source="energy_category.category_name", read_only=True, allow_null=True
    )
    level_display = serializers.CharField(
        source="get_level_display", read_only=True
    )
    parent_name = serializers.SerializerMethodField()
    full_path   = serializers.SerializerMethodField()
    has_children = serializers.SerializerMethodField()

    def get_parent_name(self, obj):
        return obj.parent_supply.supply_name if obj.parent_supply else None

    def get_full_path(self, obj):
        return obj.full_path

    def get_has_children(self, obj):
        return obj.children.filter(is_active=True).exists()

    class Meta:
        model  = EnergySupply
        fields = [
            "id", "supply_code", "supply_name",
            "parent_supply", "parent_name", "level", "level_display",
            "sort_order", "full_path", "has_children",
            "measurement_unit", "energy_category", "energy_category_display",
            "fuel_type", "ipcc_code", "description",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class EnergySupplyTreeSerializer(serializers.ModelSerializer):
    """Nested tree serializer — returns root nodes with children/grandchildren inline."""
    energy_category_display = serializers.CharField(
        source="energy_category.category_name", read_only=True, allow_null=True
    )
    children = serializers.SerializerMethodField()

    def get_children(self, obj):
        qs = obj.children.filter(is_active=True).order_by("sort_order", "supply_name")
        return EnergySupplyTreeSerializer(qs, many=True).data

    class Meta:
        model  = EnergySupply
        fields = [
            "id", "supply_code", "supply_name",
            "level", "sort_order", "measurement_unit",
            "energy_category", "energy_category_display",
            "fuel_type", "ipcc_code", "description", "children",
        ]


class EnergySupplyDropdownSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    def get_label(self, obj):
        indent = "  " * obj.level
        return f"{indent}{obj.supply_name}"

    class Meta:
        model  = EnergySupply
        fields = ["id", "supply_code", "supply_name", "label",
                  "level", "parent_supply", "measurement_unit", "energy_category"]


# ── Conversion Factor ──────────────────────────────────────────────
class ConversionFactorSerializer(serializers.ModelSerializer):
    energy_supply_name = serializers.CharField(source="energy_supply.supply_name", read_only=True)
    energy_supply_code      = serializers.CharField(source="energy_supply.supply_code", read_only=True)
    energy_supply_ipcc_code = serializers.CharField(source="energy_supply.ipcc_code", read_only=True)
    unit_name               = serializers.CharField(source="unit.unit_name", read_only=True, allow_null=True)
    unit_code               = serializers.CharField(source="unit.unit_code", read_only=True, allow_null=True)

    class Meta:
        model  = ConversionFactor
        fields = [
            "id", "energy_supply", "energy_supply_name", "energy_supply_code", "energy_supply_ipcc_code",
            "conversion_factor", "unit", "unit_name", "unit_code",
            "effective_date", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Migrated Standard Master Data (15 Models) ─────────────────────────

class ConsumerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumerType
        fields = ['id', 'code', 'consumer_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConsumerTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='consumer_type')
    class Meta:
        model = ConsumerType
        fields = ['id', 'code', 'name']

class VoltageTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = VoltageType
        fields = ['id', 'code', 'voltage_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class VoltageTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='voltage_type')
    class Meta:
        model = VoltageType
        fields = ['id', 'code', 'name']

class ConsumerGroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConsumerGroup
        fields = ['id', 'code', 'consumer_group', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConsumerGroupDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='consumer_group')
    class Meta:
        model = ConsumerGroup
        fields = ['id', 'code', 'name']

class LocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Location
        fields = ['id', 'code', 'location', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LocationDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='location')
    class Meta:
        model = Location
        fields = ['id', 'code', 'name']

class ConductorTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConductorType
        fields = ['id', 'code', 'conductor_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConductorTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='conductor_type')
    class Meta:
        model = ConductorType
        fields = ['id', 'code', 'name']

class UnitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitType
        fields = ['id', 'code', 'unit_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class UnitTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='unit_type')
    class Meta:
        model = UnitType
        fields = ['id', 'code', 'name']

class ConnectionTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConnectionType
        fields = ['id', 'code', 'connection_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConnectionTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='connection_type')
    class Meta:
        model = ConnectionType
        fields = ['id', 'code', 'name']

class PlantSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlantSize
        fields = ['id', 'code', 'plant_size', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class PlantSizeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='plant_size')
    class Meta:
        model = PlantSize
        fields = ['id', 'code', 'name']

class GridTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GridType
        fields = ['id', 'code', 'grid_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class GridTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='grid_type')
    class Meta:
        model = GridType
        fields = ['id', 'code', 'name']

class ConfigurationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ConfigurationType
        fields = ['id', 'code', 'configuration_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConfigurationTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='configuration_type')
    class Meta:
        model = ConfigurationType
        fields = ['id', 'code', 'name']

class LineCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = LineCategory
        fields = ['id', 'code', 'line_category', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class LineCategoryDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='line_category')
    class Meta:
        model = LineCategory
        fields = ['id', 'code', 'name']

class CircuitTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = CircuitType
        fields = ['id', 'code', 'circuit_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class CircuitTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='circuit_type')
    class Meta:
        model = CircuitType
        fields = ['id', 'code', 'name']

class SubsidyTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubsidyType
        fields = ['id', 'code', 'subsidy_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class SubsidyTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='subsidy_type')
    class Meta:
        model = SubsidyType
        fields = ['id', 'code', 'name']

class TowerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TowerType
        fields = ['id', 'code', 'tower_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class TowerTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='tower_type')
    class Meta:
        model = TowerType
        fields = ['id', 'code', 'name']

class TransformerTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = TransformerType
        fields = ['id', 'code', 'transformer_type', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class TransformerTypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='transformer_type')
    class Meta:
        model = TransformerType
        fields = ['id', 'code', 'name']

# ── Migrated Relational Master Data ───────────────────────────────

class VoltageLevelSerializer(serializers.ModelSerializer):
    voltage_type_name = serializers.CharField(source='voltage_type.voltage_type', read_only=True)
    
    class Meta:
        model = VoltageLevel
        fields = ['id', 'code', 'voltage_level', 'voltage_type', 'voltage_type_name', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class VoltageLevelDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='voltage_level')
    class Meta:
        model = VoltageLevel
        fields = ['id', 'code', 'name']


class ConsumerSubtypeSerializer(serializers.ModelSerializer):
    consumer_type_name = serializers.CharField(source='consumer_type.consumer_type', read_only=True)
    location_name = serializers.CharField(source='location.location', read_only=True)
    voltage_type_name = serializers.CharField(source='voltage_type.voltage_type', read_only=True)
    
    class Meta:
        model = ConsumerSubtype
        fields = ['id', 'code', 'consumer_subtype', 'consumer_type', 'consumer_type_name', 'location', 'location_name', 'voltage_type', 'voltage_type_name', 'ipcc_code', 'is_active', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

class ConsumerSubtypeDropdownSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='consumer_subtype')
    class Meta:
        model = ConsumerSubtype
        fields = ['id', 'code', 'name']
