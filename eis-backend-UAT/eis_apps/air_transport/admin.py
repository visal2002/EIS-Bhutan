from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import AircraftActivity, AviationFuelConsumption

@admin.register(AircraftActivity)
class AircraftActivityAdmin(ModelAdmin):
    list_display = ["airlines", "aircraft_type", "year", "no_of_flights_operating_per_day", "is_active"]
    list_filter = ["year", "airlines", "aircraft_type", "is_active"]
    search_fields = ["airlines", "aircraft_type", "remarks"]

@admin.register(AviationFuelConsumption)
class AviationFuelConsumptionAdmin(ModelAdmin):
    list_display = ["airlines", "aircraft_type", "year", "domestic_fuel_consumption", "international_fuel_consumption", "is_active"]
    list_filter = ["year", "airlines", "aircraft_type", "is_active"]
    search_fields = ["airlines", "aircraft_type", "remarks"]

