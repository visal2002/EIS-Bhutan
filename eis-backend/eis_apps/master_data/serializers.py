# backend/eis_apps/master_data/serializers.py
from rest_framework import serializers
from .models import (
    EnergySupply, ConversionFactor, Sector, ElectricityCategory,
    VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
)


# ── Energy Supply ──────────────────────────────────────────────────
class EnergySupplySerializer(serializers.ModelSerializer):
    class Meta:
        model  = EnergySupply
        fields = ["id", "supply_name", "supply_code", "description", "is_active", "created_at", "updated_at"]
        read_only_fields = ["id", "created_at", "updated_at"]


class EnergySupplyDropdownSerializer(serializers.ModelSerializer):
    """Minimal serializer for dropdowns in other modules."""
    class Meta:
        model  = EnergySupply
        fields = ["id", "supply_name", "supply_code"]


# ── Conversion Factor ──────────────────────────────────────────────
class ConversionFactorSerializer(serializers.ModelSerializer):
    energy_supply_name = serializers.CharField(source="energy_supply.supply_name", read_only=True)
    energy_supply_code = serializers.CharField(source="energy_supply.supply_code", read_only=True)

    class Meta:
        model  = ConversionFactor
        fields = [
            "id", "energy_supply", "energy_supply_name", "energy_supply_code",
            "conversion_factor", "unit", "effective_date",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Sector ─────────────────────────────────────────────────────────
class SectorSerializer(serializers.ModelSerializer):
    parent_sector_name = serializers.CharField(source="parent_sector.sector_name", read_only=True, allow_null=True)
    sub_sector_count   = serializers.IntegerField(source="sub_sectors.count", read_only=True)

    class Meta:
        model  = Sector
        fields = [
            "id", "sector_code", "sector_name", "parent_sector", "parent_sector_name",
            "sub_sector_count", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class SectorDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Sector
        fields = ["id", "sector_code", "sector_name", "parent_sector"]


# ── Electricity Category ───────────────────────────────────────────
class ElectricityCategorySerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source="sector.sector_name", read_only=True)

    class Meta:
        model  = ElectricityCategory
        fields = [
            "id", "sector", "sector_name", "category_code", "category_name",
            "category_type", "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ElectricityCategoryDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = ElectricityCategory
        fields = ["id", "category_code", "category_name", "category_type", "sector"]


# ── Vehicle Type ───────────────────────────────────────────────────
class VehicleTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VehicleType
        fields = [
            "id", "vehicle_type_code", "vehicle_type_name", "vehicle_category",
            "gross_weight_min", "gross_weight_max",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class VehicleTypeDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = VehicleType
        fields = ["id", "vehicle_type_code", "vehicle_type_name", "vehicle_category"]


# ── Mileage ────────────────────────────────────────────────────────
class MileageSerializer(serializers.ModelSerializer):
    vehicle_type_name = serializers.CharField(source="vehicle_type.vehicle_type_name", read_only=True)

    class Meta:
        model  = Mileage
        fields = [
            "id", "vehicle_type", "vehicle_type_name", "fuel_type",
            "mileage_kmpl", "effective_year",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Biogas Size ────────────────────────────────────────────────────
class BiogasSizeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = BiogasSize
        fields = [
            "id", "size_category", "production_type", "capacity_m3",
            "density", "annual_operating_hours",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Solar Energy Size ──────────────────────────────────────────────
class SolarEnergySizeSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SolarEnergySize
        fields = [
            "id", "size_category", "capacity_kwp", "energy_kwh",
            "panel_type", "efficiency",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


# ── Industry Classification ────────────────────────────────────────
class IndustryClassificationSerializer(serializers.ModelSerializer):
    class Meta:
        model  = IndustryClassification
        fields = [
            "id", "classification_code", "classification_name", "category",
            "isic_code", "description",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class IndustryClassificationDropdownSerializer(serializers.ModelSerializer):
    class Meta:
        model  = IndustryClassification
        fields = ["id", "classification_code", "classification_name", "category"]