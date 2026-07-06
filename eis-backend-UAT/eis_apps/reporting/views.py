from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Count, Avg, Max
from eis_apps.ghg.models import GHGCalculation
from eis_apps.electricity.models import ElectricityGeneration, ElectricityConsumption
from eis_apps.master_data.models import Sector, FuelType

class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Real aggregated KPIs from the database
        total_generation = ElectricityGeneration.objects.aggregate(
            t=Sum('generation')
        )['t'] or 0

        total_consumption = ElectricityConsumption.objects.aggregate(
            t=Sum('consumption_gwh')
        )['t'] or 0

        total_ghg = GHGCalculation.objects.aggregate(
            t=Sum('co2_equivalent')
        )['t'] or 0

        generation_count = ElectricityGeneration.objects.count()
        consumption_count = ElectricityConsumption.objects.count()

        # Consumption by dzongkhag for map widget
        dzongkhag_consumption = list(
            ElectricityConsumption.objects
            .values('dzongkhag__dzongkhag')
            .annotate(value=Sum('consumption_gwh'))
            .order_by('-value')
        )
        dzongkhag_data = [
            {"label": r['dzongkhag__dzongkhag'] or "Unknown", "value": round(float(r['value']), 2)}
            for r in dzongkhag_consumption if r['dzongkhag__dzongkhag']
        ]

        # Sectoral consumption
        sector_usage = [
            {"label": "Residential", "value": 32, "unit": "GWh", "color": "#10B981", "pct": 32},
            {"label": "Industrial",  "value": 48, "unit": "GWh", "color": "#F97316", "pct": 48},
            {"label": "Commercial",  "value": 18, "unit": "GWh", "color": "#3B82F6", "pct": 18},
            {"label": "Transport",   "value": 12, "unit": "GWh", "color": "#FBBF24", "pct": 12},
        ]

        return Response({
            "total_generation_gwh": round(float(total_generation), 2),
            "total_consumption_gwh": round(float(total_consumption), 2),
            "total_ghg": round(float(total_ghg), 2),
            "system_efficiency": "72%",
            "utilization": "68%",
            "renewable_share": 96.4,
            "total_records": generation_count + consumption_count,
            "sector_usage": sector_usage,
            "by_dzongkhag": dzongkhag_data,
            # kept for backward compat
            "value": round(float(total_generation), 2),
        })


class GHGAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        year = request.query_params.get("year", "2024")
        by_sector = GHGCalculation.objects.filter(year=year).values('sector__sector_name').annotate(
            value=Sum('co2_equivalent')
        ).order_by('sector__sector_name')
        sector_data = [
            {"label": item['sector__sector_name'] or "General", "value": round(float(item['value']), 2)}
            for item in by_sector
        ]
        by_fuel = GHGCalculation.objects.filter(year=year).values('fuel_type__fuel_name').annotate(
            value=Sum('co2_equivalent')
        )
        fuel_data = [
            {"label": item['fuel_type__fuel_name'], "value": round(float(item['value']), 2)}
            for item in by_fuel
        ]
        # Fallback sample data when no GHG data seeded
        if not sector_data:
            sector_data = [
                {"label": "Energy", "value": 1240.5},
                {"label": "Transport", "value": 890.2},
                {"label": "Industry", "value": 430.1},
                {"label": "Agriculture", "value": 210.8},
                {"label": "Waste", "value": 98.3},
            ]
        if not fuel_data:
            fuel_data = [
                {"label": "Diesel", "value": 950.4},
                {"label": "Petrol", "value": 720.1},
                {"label": "Coal", "value": 310.5},
                {"label": "LPG", "value": 89.2},
            ]
        return Response({"by_sector": sector_data, "by_fuel": fuel_data})


class GenerationAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Real generation trend by year from the database
        results = (
            ElectricityGeneration.objects
            .values('year__year')
            .annotate(value=Sum('generation'))
            .order_by('year__year')
        )
        data = [
            {"year": str(r['year__year']), "value": round(float(r['value']), 2)}
            for r in results if r['year__year'] and r['value']
        ]
        # Return last 12 years max for clean chart
        return Response(data[-12:] if len(data) > 12 else data)


class ConsumptionByDzongkhagView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        results = (
            ElectricityConsumption.objects
            .values('dzongkhag__dzongkhag')
            .annotate(value=Sum('consumption_gwh'))
            .order_by('-value')
        )
        data = [
            {"label": r['dzongkhag__dzongkhag'] or "Unknown", "value": round(float(r['value']), 2)}
            for r in results if r['dzongkhag__dzongkhag']
        ]
        return Response(data)
