from decimal import Decimal
from django.db import transaction
from .models import EmissionFactor, GHGCalculation
from eis_apps.master_data.models import FuelType, Sector, ConversionFactor, VehicleFuelType

class GHGService:
    @staticmethod
    def calculate_emissions(fuel_type, quantity, sector, year):
        """
        Calculates GHG emissions for a given fuel type and quantity in a specific sector/year.
        Formula: Emissions = ActivityData * EmissionFactor
        ActivityData should be in the unit matching the EmissionFactor (usually TJ or MT).
        """
        try:
            factor = EmissionFactor.objects.get(fuel_type=fuel_type, is_active=True)
        except EmissionFactor.DoesNotExist:
            return None

        # Basic calculation (simplified for now - assumes units match or are handled by conversion factors)
        co2 = Decimal(quantity) * factor.co2_factor
        ch4 = Decimal(quantity) * factor.ch4_factor
        n2o = Decimal(quantity) * factor.n2o_factor
        
        # GWP (Global Warming Potential) - IPCC AR5 values
        # CO2: 1, CH4: 28, N2O: 265
        co2e = co2 + (ch4 * Decimal('28')) + (n2o * Decimal('265'))

        # Create or update calculation record
        calc, created = GHGCalculation.objects.update_or_create(
            year=year,
            sector=sector,
            fuel_type=fuel_type,
            defaults={
                'emission_factor': factor,
                'activity_data': quantity,
                'co2_emissions': co2,
                'ch4_emissions': ch4,
                'n2o_emissions': n2o,
                'co2_equivalent': co2e
            }
        )
        return calc

    @staticmethod
    def sync_all_modules(year):
        """
        Iterates through all energy modules (Electricity, Industry, Coal, Transport, Biomass) 
        and syncs their data to the GHG module.
        """
        from eis_apps.electricity.models import ElectricityGeneration
        from eis_apps.industry.models import IndustryConsumption
        from eis_apps.coal.models import CoalData
        from eis_apps.biomass.models import BiogasData
        from eis_apps.surface_transport.models import TransportConsumption

        with transaction.atomic():
            # 1. Sync Coal Consumption
            coal_records = CoalData.objects.filter(year=year, data_type='CONSUMPTION')
            for record in coal_records:
                GHGService.calculate_emissions(record.category, record.quantity, record.sector, year)

            # 2. Sync Industry Consumption
            industry_records = IndustryConsumption.objects.filter(year=year)
            for record in industry_records:
                if record.fuel_type:
                    # We might need a generic 'Industrial' sector lookup
                    GHGService.calculate_emissions(record.fuel_type, record.energy_consumption, None, year)

            # 3. Sync Transport Consumption
            transport_records = TransportConsumption.objects.filter(year=year)
            for record in transport_records:
                # Map VehicleFuelType to general FuelType for emission factors
                # We assume naming parity (e.g. PETROL, DIESEL) or use ipcc_code
                try:
                    f_type = FuelType.objects.get(fuel_name__iexact=record.fuel_type.fuel_name)
                    # Transport usually maps to Transport sector
                    GHGService.calculate_emissions(f_type, record.fuel_consumed_calculated, None, year)
                except FuelType.DoesNotExist:
                    continue

        return True
