from django.core.management.base import BaseCommand
from eis_apps.analytics.models import WidgetLibrary

class Command(BaseCommand):
    help = "Seed the initial Widget Library for the Analytics Dashboard"

    def handle(self, *args, **kwargs):
        widgets = [
            # ── STAT TICKERS (3/12 = 25%) ──────────────────────
            {
                "widget_code": "total_ghg_stat",
                "title": "Total GHG Emissions",
                "description": "Total CO2e emissions for the selected year",
                "chart_type": "STAT",
                "data_endpoint": "/reporting/dashboard/summary/",
                "default_w": 3, "default_h": 1
            },
            {
                "widget_code": "energy_intensity_stat",
                "title": "Energy Intensity",
                "description": "Energy consumption per unit of GDP",
                "chart_type": "STAT",
                "data_endpoint": "/reporting/dashboard/summary/",
                "default_w": 3, "default_h": 1
            },
            
            # ── PREMIUM ANALYTICS (NEW TYPES) ──────────────────
            {
                "widget_code": "dzongkhag_electricity_map",
                "title": "Electricity by Dzongkhag",
                "description": "Interactive Bhutan GIS Map showing generation intensity by district",
                "chart_type": "MAP",
                "data_endpoint": "/analytics/query/?model=electricity.ElectricityGeneration&metric=quantity_gwh&group_by=dzongkhag",
                "default_w": 12, "default_h": 4
            },
            {
                "widget_code": "sector_mix_radar",
                "title": "Sectoral Energy Mix",
                "description": "Radar comparison of energy use across different economic sectors",
                "chart_type": "RADAR",
                "data_endpoint": "/analytics/query/?model=electricity.ElectricityConsumption&metric=quantity_kwh&group_by=sector",
                "default_w": 4, "default_h": 3
            },
            {
                "widget_code": "fuel_transition_area",
                "title": "Fuel Transition Trends",
                "description": "Area chart showing the shift between different fuel types over time",
                "chart_type": "AREA",
                "data_endpoint": "/analytics/query/?model=pol.POLImportExport&metric=quantity_kl&group_by=fuel_type",
                "default_w": 8, "default_h": 3
            },

            # ── MODULE SPECIFIC TEMPLATES ──────────────────────
            {
                "widget_code": "coal_import_bar",
                "title": "Coal Import Analysis",
                "description": "Bar chart tracking coal imports by grade and volume",
                "chart_type": "BAR",
                "data_endpoint": "/analytics/query/?model=coal.CoalData&metric=quantity_mt&group_by=coal_type",
                "default_w": 6, "default_h": 3
            },
            {
                "widget_code": "vehicle_reg_line",
                "title": "Vehicle Registration Growth",
                "description": "Trend line showing new vehicle registrations in Bhutan",
                "chart_type": "LINE",
                "data_endpoint": "/analytics/query/?model=surface_transport.VehicleRegistration&metric=quantity&group_by=vehicle_category",
                "default_w": 6, "default_h": 3
            },
        ]

        for w_data in widgets:
            obj, created = WidgetLibrary.objects.update_or_create(
                widget_code=w_data["widget_code"],
                defaults=w_data
            )
            status = "Created" if created else "Updated"
            self.stdout.write(self.style.SUCCESS(f"{status} widget: {obj.title}"))
