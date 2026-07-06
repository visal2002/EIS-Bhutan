from django.core.management.base import BaseCommand
from django.db import transaction
from eis_apps.master_data.models import FuelType, MeasurementUnit
from eis_apps.ghg.models import EmissionFactor
from datetime import date

class Command(BaseCommand):
    help = "Seed IPCC 2006/2019 Default Emission Factors for common fuels."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n🌿 Seeding IPCC Emission Factors..."))

        with transaction.atomic():
            # Ensure Measurement Unit TJ exists (already checked, but safety first)
            tj_unit, _ = MeasurementUnit.objects.get_or_create(
                unit_code="TJ", 
                defaults={"unit_name": "Terajoule", "description": "10^12 Joules"}
            )

            # Factors based on IPCC 2006 Guidelines (kg per TJ)
            # Format: (fuel_code, co2, ch4, n2o)
            factors_data = [
                ("MGS-GAS", 69300, 3, 0.6),    # Motor Gasoline (Petrol)
                ("DIE-OIL", 74100, 3, 0.6),    # Gas/Diesel Oil
                ("OTB-BIT", 94600, 1, 1.5),    # Other Bituminous Coal
                ("WOD-WAS", 112000, 30, 4),    # Wood / Wood Waste (Biogenic)
                ("LPG-GEN", 63100, 1, 0.1),    # LPG
                ("JTK-KER", 71500, 3, 0.6),    # Jet Kerosene
                ("CHA-COA", 112000, 200, 1),   # Charcoal
                ("BIO-GAS", 70800, 1, 0.1),    # Biogasoline
                ("ANT-COA", 98300, 1, 1.5),    # Anthracite (if exists)
            ]

            for code, co2, ch4, n2o in factors_data:
                try:
                    fuel = FuelType.objects.get(fuel_code=code)
                    EmissionFactor.objects.update_or_create(
                        fuel_type=fuel,
                        defaults={
                            "co2_factor": co2,
                            "ch4_factor": ch4,
                            "n2o_factor": n2o,
                            "unit": tj_unit,
                            "source": "IPCC 2006",
                            "effective_date": date(2020, 1, 1),
                            "is_active": True
                        }
                    )
                    self.stdout.write(f"  ✅ {fuel.fuel_name} factor seeded.")
                except FuelType.DoesNotExist:
                    self.stdout.write(self.style.WARNING(f"  ⚠️ Skipping {code}: Fuel type not found."))

        self.stdout.write(self.style.SUCCESS("\n✅ Emission Factors Seeding Completed!"))
