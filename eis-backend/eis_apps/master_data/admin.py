# backend/eis_apps/master_data/admin.py
from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import (
    EnergySupply, ConversionFactor, Sector, ElectricityCategory,
    VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
)


@admin.register(EnergySupply)
class EnergySupplyAdmin(ModelAdmin):
    list_display    = ["supply_code", "supply_name", "is_active", "created_at"]
    list_filter     = ["is_active"]
    search_fields   = ["supply_name", "supply_code"]
    ordering        = ["supply_name"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(ConversionFactor)
class ConversionFactorAdmin(ModelAdmin):
    list_display    = ["energy_supply", "conversion_factor", "unit", "effective_date", "is_active"]
    list_filter     = ["is_active", "unit", "energy_supply"]
    search_fields   = ["energy_supply__supply_name", "unit"]
    ordering        = ["energy_supply", "-effective_date"]
    readonly_fields = ["created_at", "updated_at"]


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
    list_display    = ["vehicle_type_code", "vehicle_type_name", "vehicle_category", "is_active"]
    list_filter     = ["is_active", "vehicle_category"]
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
    list_display    = ["size_category", "capacity_kwp", "energy_kwh", "panel_type", "is_active"]
    list_filter     = ["is_active"]
    search_fields   = ["size_category", "panel_type"]
    ordering        = ["size_category"]
    readonly_fields = ["created_at", "updated_at"]


@admin.register(IndustryClassification)
class IndustryClassificationAdmin(ModelAdmin):
    list_display    = ["classification_code", "classification_name", "category", "isic_code", "is_active"]
    list_filter     = ["is_active", "category"]
    search_fields   = ["classification_name", "classification_code", "isic_code"]
    ordering        = ["classification_name"]
    readonly_fields = ["created_at", "updated_at"]