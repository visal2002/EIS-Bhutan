from django.contrib import admin
from .models import TransportConsumption, VehicleRegistration

@admin.register(TransportConsumption)
class TransportConsumptionAdmin(admin.ModelAdmin):
    list_display = ("year", "month", "vehicle_type", "fuel_type", "fuel_consumed_calculated")
    list_filter = ("year", "vehicle_type", "fuel_type")
    search_fields = ("original_vehicle_type", "remarks")

@admin.register(VehicleRegistration)
class VehicleRegistrationAdmin(admin.ModelAdmin):
    list_display = ("initial_registration_date", "vehicle_type", "model_name", "fuel_type", "status")
    list_filter = ("status", "vehicle_type", "fuel_type")
    search_fields = ("model_name", "remarks")

