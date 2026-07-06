from django.contrib import admin
from unfold.admin import ModelAdmin
from .models import FuelwoodSupply, FuelwoodConsumption

@admin.register(FuelwoodSupply)
class FuelwoodSupplyAdmin(ModelAdmin):
    list_display = ["permit_date", "office", "dzongkhag", "quantity_m3", "is_active"]
    list_filter = ["permit_date", "dzongkhag", "is_active"]
    search_fields = ["office", "dzongkhag__dzongkhag", "purpose", "remarks"]

@admin.register(FuelwoodConsumption)
class FuelwoodConsumptionAdmin(ModelAdmin):
    list_display = ["permit_date", "office", "dzongkhag", "purpose_group", "quantity_m3", "is_active"]
    list_filter = ["permit_date", "dzongkhag", "is_active"]
    search_fields = ["office", "dzongkhag__dzongkhag", "purpose", "purpose_group", "remarks"]

