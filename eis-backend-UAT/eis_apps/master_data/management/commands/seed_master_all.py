from django.core.management.base import BaseCommand
from django.db import transaction
from eis_apps.master_data.models import (
    Dzongkhag, Country, MeasurementUnit, ElectricityCategory, 
    Sector, ElectricityType, Substation, SubstationTransformer,
    BPCCategory, FuelType, VehicleFuelType,
    ProductionType, PanelType, IndustryCategory, VehicleType
)
import random
from datetime import date

class Command(BaseCommand):
    help = "Professionally seed all Master Data lookup tables with high-fidelity parity records."

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("\n🚀 Starting Professional Master Data Seeding...\n"))

        with transaction.atomic():
            self.seed_geography()
            self.seed_units()
            self.seed_energy_types()
            self.seed_electricity_categories()
            self.seed_infrastructure()
            self.seed_transport_and_industry()

        self.stdout.write(self.style.SUCCESS("\n✅ Master Data Seeding Completed Successfully!"))

    def seed_geography(self):
        self.stdout.write("🌍 Seeding Countries...")
        countries = [
            ("BT", "Bhutan"),
            ("IN", "India"),
            ("BD", "Bangladesh"),
            ("NP", "Nepal"),
            ("SG", "Singapore"),
            ("TH", "Thailand"),
            ("LK", "Sri Lanka"),
            ("MV", "Maldives"),
        ]
        for code, name in countries:
            Country.objects.get_or_create(country_code=code, defaults={"country_name": name})

    def seed_units(self):
        self.stdout.write("📏 Seeding Measurement Units...")
        units = [
            ("MU", "Million Units (MU)", "Standard electricity unit (1 MU = 1 GWh)"),
            ("GWH", "Gigawatt Hour (GWh)", "Standard energy unit"),
            ("MW", "Megawatt (MW)", "Power capacity unit"),
            ("MVA", "Megavolt-Ampere (MVA)", "Transformer capacity unit"),
            ("KL", "Kilolitre (kL)", "Liquid fuel unit"),
            ("MT", "Metric Tonne (MT)", "Solid fuel unit"),
            ("KG", "Kilogram (kg)", "Weight unit"),
            ("CUM", "Cubic Metre (m3)", "Volume unit"),
            ("KWP", "Kilowatt Peak (kWp)", "Solar capacity unit"),
            ("KWH", "Kilowatt Hour (kWh)", "Energy unit"),
        ]
        for code, name, desc in units:
            MeasurementUnit.objects.get_or_create(unit_code=code, defaults={"unit_name": name, "description": desc})

    def seed_energy_types(self):
        self.stdout.write("⚡ Seeding Energy & Production Types...")
        # Electricity Types
        e_types = [
            ("HYDRO", "Hydroelectricity"),
            ("SOLAR", "Solar Energy"),
            ("WIND",  "Wind Energy"),
            ("THERMAL", "Thermal Energy"),
            ("DIESEL", "Diesel Generation"),
        ]
        for code, name in e_types:
            ElectricityType.objects.get_or_create(type_code=code, defaults={"type_name": name})

        # Production Types
        p_types = [("BIOGAS", "Biogas production"), ("SOLAR_PV", "Solar Photo-Voltaic")]
        for code, name in p_types:
            ProductionType.objects.get_or_create(type_code=code, defaults={"type_name": name})

    def seed_electricity_categories(self):
        self.stdout.write("💡 Seeding Electricity Consumption Categories (Legacy Parity)...")
        # Ensure base sectors exist (Updated to match existing BLD-R, IND, etc.)
        sectors = {
            "RESIDENTIAL": Sector.objects.get_or_create(sector_code="BLD-R", defaults={"sector_name": "Residential"})[0],
            "INDUSTRIAL":  Sector.objects.get_or_create(sector_code="IND",   defaults={"sector_name": "Industry"})[0],
            "COMMERCIAL":  Sector.objects.get_or_create(sector_code="BLD-C", defaults={"sector_name": "Commercial"})[0],
            "AGRICULTURE": Sector.objects.get_or_create(sector_code="OTH-AG", defaults={"sector_name": "Agriculture"})[0],
            "PUBLIC":      Sector.objects.get_or_create(sector_code="BLD-I", defaults={"sector_name": "Institutional"})[0],
            "TRANSPORT":   Sector.objects.get_or_create(sector_code="TRN",   defaults={"sector_name": "Transport"})[0],
        }

        # Legacy 18 categories mapping to sectors
        categories = [
            ("RURAL_RES", "Rural Residents", "RESIDENTIAL"),
            ("URBAN_RES", "Urban Residents", "RESIDENTIAL"),
            ("RELIGIOUS", "Religious Institutions", "RESIDENTIAL"),
            ("HIGHLANDS", "Highlands", "RESIDENTIAL"),
            ("COMMERCIAL", "Commercial", "COMMERCIAL"),
            ("IND_LV", "Industries (LV)", "INDUSTRIAL"),
            ("IND_MV", "Industries (MV)", "INDUSTRIAL"),
            ("IND_HV", "Industries (HV)", "INDUSTRIAL"),
            ("AGR", "Agriculture", "AGRICULTURE"),
            ("INSTITUTIONS", "Institutions", "PUBLIC"),
            ("STREET_LIGHT", "Street Lighting", "PUBLIC"),
            ("EV", "Electric Vehicles", "TRANSPORT"),
            ("LV_BULK", "LV Bulk", "COMMERCIAL"),
            ("POWER_HOUSE_AUX", "Power House Auxiliaries", "INDUSTRIAL"),
            ("TEMP_CONN", "Temporary Connections", "COMMERCIAL"),
        ]

        for code, name, s_key in categories:
            ElectricityCategory.objects.get_or_create(
                category_code=code, 
                sector=sectors[s_key],
                defaults={"category_name": name}
            )

    def seed_infrastructure(self):
        self.stdout.write("🏗️ Seeding Substation Transformers (Infrastructure Depth)...")
        substations = Substation.objects.all()
        if not substations.exists():
            self.stdout.write(self.style.WARNING("⚠️ No substations found. Skipping transformer seeding."))
            return

        for sub in substations:
            # Create 1-2 transformers per substation if none exist
            if not sub.transformers.exists():
                for i in range(1, random.randint(2, 3)):
                    t_code = f"{sub.acronym or sub.substation_code}-TR{i}"
                    capacity = random.choice([5, 10, 20, 50, 63, 100])
                    SubstationTransformer.objects.create(
                        substation=sub,
                        transformer_code=t_code,
                        voltage_ratio="220/132 kV" if capacity > 50 else "132/33 kV",
                        max_capacity_mva=capacity,
                        max_capacity_mw=capacity * 0.9,
                        commissioned_date=date(2010 + random.randint(0, 10), 1, 1)
                    )

    def seed_transport_and_industry(self):
        self.stdout.write("🚗 Seeding Transport & Industry Lookups...")
        # Parent-level Vehicle Types (replaces deleted VehicleCategory)
        v_parents = [
            ("CARS",     "Cars",                         "1A3bi"),
            ("LDT",      "Light Duty Trucks",            "1A3bii"),
            ("HDT_BUS",  "Heavy Duty Trucks and Buses",  "1A3biii"),
            ("MC",       "Motorcycles",                  "1A3biv"),
            ("PIPELINE", "Pipeline Transport",           "1Aei"),
            ("OFF_ROAD", "Off-road",                     "1A3eii"),
        ]
        parent_map = {}
        for code, name, ipcc in v_parents:
            obj, _ = VehicleType.objects.get_or_create(
                vehicle_type_code=code,
                defaults={"vehicle_type_name": name, "parent": None, "ipcc_code": ipcc}
            )
            parent_map[code] = obj

        # Child Vehicle Types
        v_types = [
            ("MC",   "Motorcycle & Scooter",     "MC",       None,    None,    "1.A.3.b"),
            ("CAR",  "Car / Taxi / Jeep",        "CARS",     None,    3500.0,  "1.A.3.b"),
            ("VAN",  "Van / Pick-up",            "LDT",      None,    3500.0,  "1.A.3.b"),
            ("LCV",  "Light Commercial Vehicle", "LDT",      3500.0,  7500.0,  "1.A.3.b"),
            ("MCV",  "Medium Commercial Vehicle","HDT_BUS",  7500.0,  12000.0, "1.A.3.b"),
            ("BUS",  "Bus (Small / Mini)",       "HDT_BUS",  7500.0,  12000.0, "1.A.3.b"),
            ("HCV",  "Heavy Commercial Vehicle", "HDT_BUS",  12000.0, None,    "1.A.3.b"),
            ("HBUS", "Heavy Bus / Coach",        "HDT_BUS",  12000.0, None,    "1.A.3.b"),
            ("TRK",  "Truck / Tipper / Trailer", "HDT_BUS",  12000.0, None,    "1.A.3.b"),
            ("TRC",  "Tractor / Farm Equipment", "OFF_ROAD", None,    None,    "1.A.4.c"),
            ("CON",  "Construction Equipment",   "OFF_ROAD", None,    None,    "1.A.2.g"),
        ]
        for code, name, cat_code, wmin, wmax, ipcc in v_types:
            parent_obj = parent_map.get(cat_code)
            VehicleType.objects.get_or_create(
                vehicle_type_code=code,
                defaults={
                    "vehicle_type_name": name,
                    "parent": parent_obj,
                    "gross_weight_min": wmin,
                    "gross_weight_max": wmax,
                    "ipcc_code": ipcc,
                }
            )

        # Vehicle Fuel Types
        vf_types = [("PETROL", "Petrol"), ("DIESEL", "Diesel"), ("ELECTRIC", "Electricity"), ("LPG", "LPG")]
        for code, name in vf_types:
            VehicleFuelType.objects.get_or_create(fuel_code=code, defaults={"fuel_name": name})

        # Industry Categories
        i_cats = [
            ("MANUFACTURING", "Manufacturing"), ("MINING", "Mining & Quarrying"), 
            ("CONSTRUCTION", "Construction"), ("ENERGY", "Energy Production")
        ]
        for code, name in i_cats:
            IndustryCategory.objects.get_or_create(category_code=code, defaults={"category_name": name})
