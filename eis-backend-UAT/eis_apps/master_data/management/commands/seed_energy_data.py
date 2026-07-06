import random
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from eis_apps.master_data.models import (
    Dzongkhag, ElectricityCategory, GenerationPlant, FuelType, MeasurementUnit, Sector
)
from eis_apps.electricity.models import ElectricityConsumption, ElectricityGeneration, HydrologyData
from eis_apps.pol.models import POLImportExport

class Command(BaseCommand):
    help = "Seeds realistic historical data for Bhutan Energy Information System (2010-2024)"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Starting smart seeder engine..."))
        
        with transaction.atomic():
            self.seed_electricity_consumption()
            self.seed_electricity_generation()
            self.seed_hydrology()
            self.seed_pol_imports()
            self.seed_fuelwood()
            
        self.stdout.write(self.style.SUCCESS("Successfully seeded 15 years of energy history!"))

    def seed_electricity_consumption(self):
        self.stdout.write("Seeding Electricity Consumption...")
        dzongkhags = Dzongkhag.objects.all()
        categories = ElectricityCategory.objects.all()
        
        if not categories.exists():
            self.stdout.write(self.style.WARNING("No Electricity Categories found. Skipping."))
            return

        # Seed from 2010 to 2024
        from eis_apps.master_data.models import DataCollectionYear, DataSource
        manual_source, _ = DataSource.objects.get_or_create(source_code="MANUAL", defaults={"source_name": "Manual Entry", "source_type": "MANUAL"})
        
        for year_val in range(2010, 2025):
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            for category in categories:
                # Higher consumption in Thimphu, Phuntsholing, Paro
                base_val = 1.0 # GWh default
                if category.category_name == "Industrial": base_val = 50.0
                elif category.category_name == "Domestic": base_val = 10.0
                
                # Growth factor (approx 5% per year)
                growth = (1.05 ** (year_val - 2010))
                
                for dz in dzongkhags:
                    # Regional weight
                    weight = 1.0
                    if dz.dzongkhag in ["Thimphu", "Chukha", "Paro"]: weight = 3.5
                    
                    val = Decimal(base_val * growth * weight * random.uniform(0.85, 1.15))
                    
                    ElectricityConsumption.objects.get_or_create(
                        year=year_obj,
                        month=None, # Annual records
                        electricity_category=category,
                        dzongkhag=dz,
                        data_source=manual_source,
                        defaults={'consumption_gwh': val.quantize(Decimal('0.000001'))}
                    )
            self.stdout.write(f"  Processed Year {year_val}...")

    def seed_electricity_generation(self):
        self.stdout.write("Seeding Electricity Generation (Row Based)...")
        from eis_apps.master_data.models import DataCollectionYear, DataSource
        from datetime import date
        manual_source, _ = DataSource.objects.get_or_create(source_code="MANUAL", defaults={"source_name": "Manual Entry", "source_type": "MANUAL"})

        plants = ["CHP", "KHP", "THP", "MHP", "DHP", "BHP"]
        for year_val in range(2020, 2025):
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            for month in range(1, 13):
                d = date(year_val, month, 15)
                # Seasonality factor for hydro
                if month in [6, 7, 8, 9]:
                    season = 1.5
                elif month in [12, 1, 2]:
                    season = 0.3
                else:
                    season = 0.7

                for plant in plants:
                    ElectricityGeneration.objects.get_or_create(
                        date=d,
                        acronym=plant,
                        defaults={
                            'year': year_obj,
                            'month': month,
                            'data_source': manual_source,
                            'generation': Decimal(random.uniform(50, 500) * season).quantize(Decimal('0.000001')),
                            'export_generation': Decimal(random.uniform(40, 450) * season).quantize(Decimal('0.000001')),
                            'domestic_sales_generation': Decimal(random.uniform(10, 50) * season).quantize(Decimal('0.000001')),
                        }
                    )
        self.stdout.write("  Done seeding electricity generation.")

    def seed_pol_imports(self):
        self.stdout.write("Seeding POL Import Data...")
        from eis_apps.master_data.models import DataCollectionYear, DataSource
        fuels = FuelType.objects.all()
        unit_kl, _  = MeasurementUnit.objects.get_or_create(unit_name="kL", defaults={'description': 'Kiloliters'})
        manual_source, _ = DataSource.objects.get_or_create(source_code="MANUAL", defaults={"source_name": "Manual Entry", "source_type": "MANUAL"})
        
        for year_val in range(2015, 2025): # POL records often shorter history
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            for fuel in fuels:
                if fuel.fuel_name in ["Petrol", "Diesel", "LPG", "Kerosene"]:
                    base_kl = 5000.0
                    if fuel.fuel_name == "Diesel": base_kl = 15000.0
                    
                    growth = (1.08 ** (year_val - 2015)) # Strong POL growth
                    
                    for month in range(1, 13):
                        val = Decimal(base_kl * growth * random.uniform(0.9, 1.1))
                        POLImportExport.objects.get_or_create(
                            year=year_obj,
                            month=month,
                            transaction_type="IMPORT",
                            main_category=fuel,
                            unit=unit_kl,
                            data_source=manual_source,
                            defaults={'quantity_kl': val.quantize(Decimal('0.0000'))}
                        )

    def seed_hydrology(self):
        self.stdout.write("Seeding Hydrology Data (Inflow cumecs)...")
        from eis_apps.master_data.models import DataCollectionYear, DataSource
        plants = GenerationPlant.objects.filter(plant_type__icontains="HYDRO")
        manual_source, _ = DataSource.objects.get_or_create(source_code="MANUAL", defaults={"source_name": "Manual Entry", "source_type": "MANUAL"})
        
        if not plants.exists():
            self.stdout.write(self.style.WARNING("No Hydro Plants found. Skipping Hydrology."))
            return

        # Seed 2 years of daily-ish hydrology data (2023-2024)
        from datetime import date, timedelta
        for year_val in [2023, 2024]:
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            for plant in plants:
                base_inflow = 100.0 if "Large" in plant.plant_name else 10.0
                
                # Monthly loops for better control
                for month in range(1, 13):
                    # Seasonality
                    if month in [6, 7, 8, 9]: season_factor = 2.5
                    elif month in [12, 1, 2]: season_factor = 0.4
                    else: season_factor = 0.8
                    
                    # Seed one record per month for simplicity in the seeder, 
                    # but model can handle daily if needed.
                    val = Decimal(base_inflow * season_factor * random.uniform(0.8, 1.2))
                    
                    # For hydrology, usually we use dates. Let's use 15th of each month.
                    d = date(year_val, month, 15)
                    
                    HydrologyData.objects.get_or_create(
                        year=year_obj,
                        acronym=plant.acronym,
                        date=d,
                        defaults={
                            'inflow': val.quantize(Decimal('0.00')),
                            'data_source': manual_source
                        }
                    )

    def seed_fuelwood(self):
        self.stdout.write("Seeding Fuelwood Supply and Consumption...")
        from eis_apps.fuelwood.models import FuelwoodSupply, FuelwoodConsumption
        from eis_apps.master_data.models import DataSource, Dzongkhag
        from datetime import date
        
        dzongkhags = list(Dzongkhag.objects.all())
        if not dzongkhags:
            self.stdout.write(self.style.WARNING("No Dzongkhags found. Skipping Fuelwood."))
            return

        manual_source, _ = DataSource.objects.get_or_create(
            source_code="MANUAL", 
            defaults={"source_name": "Manual Entry", "source_type": "MANUAL"}
        )

        offices = ["Thimphu Divisional Forest Office", "Paro Divisional Forest Office", "Wangdue Divisional Forest Office", "Sarpang Divisional Forest Office"]
        purposes = ["Rural Domestic Fuelwood", "Commercial Use", "Religious/Cremation", "Industrial Use"]
        purpose_groups = ["Domestic", "Commercial", "Religious", "Industrial"]

        for year_val in range(2020, 2025):
            for i in range(15):
                dz = random.choice(dzongkhags)
                office = random.choice(offices)
                purpose = random.choice(purposes)
                p_date = date(year_val, random.randint(1, 12), random.randint(1, 28))
                qty_m3 = Decimal(random.uniform(10.0, 300.0))

                FuelwoodSupply.objects.get_or_create(
                    permit_date=p_date,
                    office=office,
                    dzongkhag=dz,
                    purpose=purpose,
                    data_source=manual_source,
                    defaults={'quantity_m3': qty_m3.quantize(Decimal('0.0000'))}
                )

                p_group = random.choice(purpose_groups)
                qty_m3_c = Decimal(random.uniform(5.0, 150.0))
                FuelwoodConsumption.objects.get_or_create(
                    permit_date=p_date,
                    office=office,
                    dzongkhag=dz,
                    purpose=purpose,
                    purpose_group=p_group,
                    data_source=manual_source,
                    defaults={'quantity_m3': qty_m3_c.quantize(Decimal('0.0000'))}
                )

