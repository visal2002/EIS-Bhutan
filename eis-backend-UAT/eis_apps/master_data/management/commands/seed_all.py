# backend/eis_apps/master_data/management/commands/seed_all.py
#
# Seeds ALL data — master_data + electricity settings — in one command.
#
# Usage:
#   python manage.py seed_all                    ← seed everything
#   python manage.py seed_all --check            ← show counts only
#   python manage.py seed_all --only master      ← only master data
#   python manage.py seed_all --only electricity ← only electricity settings

from django.core.management.base import BaseCommand
from django.db import transaction


# ══════════════════════════════════════════════════════════════════
# MASTER DATA — LOOKUP TABLES
# ══════════════════════════════════════════════════════════════════

CONVERSION_UNITS = [
    ("TJ/Gg",   "TJ per Gigagram",            "IPCC standard for solid fuel calorific values", "IPCC_STD"),
    ("GJ/t",    "Gigajoule per tonne",         "Calorific value per metric tonne",             "IPCC_STD"),
    ("MJ/L",    "Megajoule per litre",         "Calorific value per litre of liquid fuel",     "IPCC_STD"),
    ("MJ/m3",   "Megajoule per cubic metre",   "Calorific value per cubic metre of gas",       "IPCC_STD"),
    ("TOE/t",   "TOE per tonne",               "Tonnes of oil equivalent per tonne",           "IEA_STD"),
    ("TOE/kl",  "TOE per kilolitre",           "Tonnes of oil equivalent per kilolitre",       "IEA_STD"),
    ("TJ/GWh",  "Terajoule per GWh",           "3.6 TJ per GWh — electricity conversion",      "IPCC_STD"),
    ("GJ/GWh",  "Gigajoule per GWh",           "3600 GJ per GWh — electricity conversion",     "IPCC_STD"),
    ("TJ/kl",   "Terajoule per Kilolitre",     "Net calorific value for liquid petroleum",     "IPCC_STD"),
    ("TJ/MT",   "Terajoule per Metric Tonne",  "Net calorific value for solid fuels",          "IPCC_STD"),
    ("TOE/GWh", "TOE per Gigawatt-Hour",       "Tonnes of oil equivalent per GWh",             "IEA_STD"),
    ("TOE/MT",  "TOE per Metric Tonne",        "Tonnes of oil equivalent per tonne of solid fuel", "IEA_STD"),
]
ELECTRICITY_TYPES = [
    ("RES","Residential","Household and domestic electricity consumers", "1.A.4.b"),
    ("COM","Commercial","Shops, offices, hotels and commercial consumers", "1.A.4.a"),
    ("IND","Industrial","Manufacturing and industrial electricity consumers", "1.A.2"),
    ("PUB","Public","Government buildings, street lighting, public facilities", "1.A.4.a"),
    ("AGR","Agriculture","Farms, irrigation and agricultural consumers", "1.A.4.c"),
]
# Parent vehicle type groups (seeded with parent=None, become top-level types)
VEHICLE_CATEGORIES = [
    # (code, name, ipcc_code)
    ("OFF_LOAD",  "Off-Load",                    "1A3eii"),
    ("CARS",      "Cars",                         "1A3bi"),
    ("LDT",       "Light Duty Trucks",            "1A3bii"),
    ("HDT_BUS",   "Heavy Duty Trucks and Buses",  "1A3biii"),
    ("MC",        "Motorcycles",                  "1A3biv"),
]
# ── Fuel Types ────────────────────────────────────────────────────
# Format: (code, name, parent_code, category, description)
# parent_code=None means root level
FUEL_TYPES = [
    # ── ROOT CATEGORIES ──────────────────────────────────────────
    ("LIQ-F",   "Liquid Fuels",         None, "PETROLEUM", "Liquid fossil fuels", "1.A"),
    ("SOL-F",   "Solid Fuels",          None, "COAL",      "Solid fossil fuels", "1.A"),
    ("GAS-F",   "Gaseous Fuels",        None, "OTHERS",    "Gaseous fuels", "1.A"),
    ("FOS-F",   "Other Fossil Fuels",   None, "OTHERS",    "Other non-renewable fuels", "1.A"),
    ("PEAT-F",  "Peat",                 None, "OTHERS",    "Peat and peat products", "1.A"),
    ("BIO-S",   "Biomass - solid",      None, "BIOMASS",   "Solid biomass and waste", "1.A"),
    ("BIO-L",   "Biomass - liquid",     None, "BIOMASS",   "Liquid biofuels", "1.A"),
    ("BIO-G",   "Biomass - gas",        None, "BIOMASS",   "Biogas from various sources", "1.A"),
    ("BIO-O",   "Biomass - other",      None, "BIOMASS",   "Other biomass and waste", "1.A"),

    # ── VIRTUAL FUELS (FOR ELECTRICITY) ──────────────────────────
    ("ELECTRICITY","Electricity",       None, "ELECTRICITY","Grid electricity", "1.A.1.a"),
    ("HYDRO",      "Hydro",             None, "ELECTRICITY","Hydro power", "1.A.1.a"),
    ("SOLAR",      "Solar",             None, "ELECTRICITY","Solar power", "1.A.1.a"),
    ("WIND",       "Wind",              None, "ELECTRICITY","Wind power", "1.A.1.a"),
    ("BESS",       "BESS",              None, "ELECTRICITY","Battery storage", "1.A.1.a"),
    ("IMPORT",     "Imported Power",    None, "ELECTRICITY","Imported electricity", "1.A.1.a"),
    ("PETROLEUM",  "Petroleum Products",None, "PETROLEUM",  "Generic petroleum", "1.A.3"),
    ("COAL",       "Coal Products",     None, "COAL",       "Generic coal", "1.A.1.a"),
    ("BIOMASS",    "Biomass Products",  None, "BIOMASS",    "Generic biomass", "1.A.4.b"),

    # ── LIQUID FUELS ──────────────────────────────────────────────
    ("AVG",     "Aviation Gasoline",    "LIQ-F", "PETROLEUM", "", "1.A.3.a"),
    ("BIT",     "Bitumen",              "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("CRU",     "Crude Oil",            "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("ETH",     "Ethane",               "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("DIE-OIL", "Gas/Diesel Oil",       "LIQ-F", "PETROLEUM", "", "1.A.3.b"),
    ("JTL-GAS", "Jet Gasoline",         "LIQ-F", "PETROLEUM", "", "1.A.3.a"),
    ("JTK-KER", "Jet Kerosene",         "LIQ-F", "PETROLEUM", "", "1.A.3.a"),
    ("LPG-GEN", "Liquefied Petroleum Gases", "LIQ-F", "PETROLEUM", "", "1.A.4.b"),
    ("LUB",     "Lubricants",           "LIQ-F", "PETROLEUM", "", "2.D.1"),
    ("MGS-GAS", "Motor Gasoline",       "LIQ-F", "PETROLEUM", "", "1.A.3.b"),
    ("NAP",     "Naphtha",              "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("NGL",     "Natural Gas Liquids",  "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("ORI",     "Orimulsion",           "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("OTK-KER", "Other Kerosene",       "LIQ-F", "PETROLEUM", "", "1.A.4.b"),
    ("OPP",     "Other Petroleum Products", "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("PAW-WAX", "Paraffin Waxes",       "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("PCK-COK", "Petroleum Coke",       "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("RFD-FED", "Refinery Feedstocks",  "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("RFG-GAS", "Refinery Gas",         "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("RFO-OIL", "Residual Fuel Oil",    "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("SHA-OIL", "Shale Oil",            "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("WSB-SPR", "White Spirit and SBP", "LIQ-F", "PETROLEUM", "", "1.A.1.a"),

    # ── SOLID FUELS ───────────────────────────────────────────────
    ("ANT-COAL","Anthracite",           "SOL-F", "COAL", "", "1.A.1.a"),
    ("BLS-GAS", "Blast Furnace Gas",    "SOL-F", "COAL", "", "1.A.2.a"),
    ("BRN-BRQ", "Brown Coal Briquettes","SOL-F", "COAL", "", "1.A.4.b"),
    ("COA-TAR", "Coal Tar",             "SOL-F", "COAL", "", "1.A.1.c"),
    ("COK-COK", "Coke Oven Coke / Lignite Coke", "SOL-F", "COAL", "", "1.A.1.c"),
    ("COK-GAS", "Coke Oven Gas",        "SOL-F", "COAL", "", "1.A.1.c"),
    ("COK-COA", "Coking Coal",          "SOL-F", "COAL", "", "1.A.1.c"),
    ("GAS-COK", "Gas Coke",             "SOL-F", "COAL", "", "1.A.1.c"),
    ("GAS-WRK", "Gas Works Gas",        "SOL-F", "COAL", "", "1.A.1.c"),
    ("LIG-COA", "Lignite",              "SOL-F", "COAL", "", "1.A.4.b"),
    ("OIL-SHA", "Oil Shale / Tar Sands","SOL-F", "COAL", "", "1.A.1.a"),
    ("OTB-BIT", "Other Bituminous Coal","SOL-F", "COAL", "", "1.A.1.a"),
    ("OXY-GAS", "Oxygen Steel Furnace Gas", "SOL-F", "COAL", "", "1.A.2.a"),
    ("PAT-FUL", "Patent Fuel",          "SOL-F", "COAL", "", "1.A.1.a"),
    ("SUB-BIT", "Sub-Bituminous Coal",  "SOL-F", "COAL", "", "1.A.1.a"),

    # ── GASEOUS FUELS ─────────────────────────────────────────────
    ("NAT-GAS", "Natural Gas (Dry)",    "GAS-F", "OTHERS", "", "1.A.4.b"),

    # ── OTHER FOSSIL FUELS ───────────────────────────────────────
    ("IND-WAS", "Industrial Wastes",    "FOS-F", "OTHERS", "", "1.A.1.a"),
    ("MUN-WAS", "Municipal Wastes (nonbiomass)", "FOS-F", "OTHERS", "", "1.A.1.a"),
    ("WAS-OIL", "Waste Oils",           "FOS-F", "OTHERS", "", "1.A.1.a"),

    # ── PEAT ──────────────────────────────────────────────────────
    ("PEAT-P",  "Peat",                 "PEAT-F", "OTHERS", "", "1.A.4.b"),

    # ── BIOMASS - SOLID ──────────────────────────────────────────
    ("CHA-COA", "Charcoal",             "BIO-S", "BIOMASS", "", "1.A.4.b"),
    ("OTB-BIO", "Other Primary Solid Biomass", "BIO-S", "BIOMASS", "", "1.A.4.b"),
    ("WOD-WAS", "Wood/Wood Waste",      "BIO-S", "BIOMASS", "", "1.A.4.b"),

    # ── BIOMASS - LIQUID ─────────────────────────────────────────
    ("BIO-DIE", "Biodiesels",           "BIO-L", "BIOMASS", "", "1.A.3.b"),
    ("BIO-GAS", "Biogasoline",          "BIO-L", "BIOMASS", "", "1.A.3.b"),
    ("OTB-LIQ", "Other Liquid Biofuels","BIO-L", "BIOMASS", "", "1.A.1.a"),
    ("SUL-LYE", "Sulphite lyes (Black Liquor)", "BIO-L", "BIOMASS", "", "1.A.2.d"),

    # ── BIOMASS - GAS ────────────────────────────────────────────
    ("LAN-GAS", "Landfill Gas",         "BIO-G", "BIOMASS", "", "1.A.1.a"),
    ("OTB-BGS", "Other Biogas",          "BIO-G", "BIOMASS", "", "1.A.4.b"),
    ("SLU-GAS", "Sludge Gas",           "BIO-G", "BIOMASS", "", "1.A.1.a"),

    # ── MAPPED FUELS (FOR ENERGY SUPPLY) ─────────────────────────
    ("DIESEL",  "Diesel (Gas Diesel Oil)",  "LIQ-F", "PETROLEUM", "", "1.A.3.b"),
    ("PETROL",  "Petrol (Motor Gasoline)",  "LIQ-F", "PETROLEUM", "", "1.A.3.b"),
    ("KEROSENE","Kerosene",                 "LIQ-F", "PETROLEUM", "", "1.A.4.b"),
    ("ATF",     "ATF (Jet Kerosene)",       "LIQ-F", "PETROLEUM", "", "1.A.3.a"),
    ("LDO",     "Light Diesel Oil (LDO)",   "LIQ-F", "PETROLEUM", "", "1.A.1.a"),
    ("LPG",     "Liquefied Petroleum Gas",  "LIQ-F", "PETROLEUM", "", "1.A.4.b"),
    ("COKE",    "Coke Oven Coke",           "SOL-F", "COAL",      "", "1.A.1.c"),
    ("FUELWOOD","Fuelwood",                 "BIO-S", "BIOMASS",   "", "1.A.4.b"),
    ("BRIQUETTE","Briquettes & Charcoal",  "BIO-S", "BIOMASS",   "", "1.A.4.b"),
    ("BIOGAS",  "Biogas",                  "BIO-G", "BIOMASS",   "", "1.A.4.b"),

    # ── BIOMASS - OTHER ──────────────────────────────────────────
    ("MUN-BIO", "Municipal Wastes (biomass)", "BIO-O", "BIOMASS", "", "1.A.1.a"),
]

# ── Vehicle Fuel Types (Transport) ────────────────────────────────
VEHICLE_FUEL_TYPES = [
    ("DIESEL",      "Diesel",   "High speed diesel for transport", "1.A.3.b"),
    ("PETROL",      "Petrol",   "Premium motor gasoline", "1.A.3.b"),
    ("ELECTRIC",    "Electric", "Battery electric vehicles", "1.A.3.b"),
    ("HYBRID",      "Hybrid",   "Petrol/Electric hybrid vehicles", "1.A.3.b"),
]
PRODUCTION_TYPES = [
    ("DOM","Domestic","Small household biogas plants", "1.A.4.b"),
    ("INST","Institutional","Medium institutional plants", "1.A.4.a"),
    ("IND","Industrial","Large-scale industrial plants", "1.A.2"),
    ("COM","Commercial","Commercial biogas plants", "1.A.4.a"),
]
PANEL_TYPES = [
    ("MCR","Monocrystalline","High efficiency single-crystal silicon", "SOLAR_PV"),
    ("PCR","Polycrystalline","Multi-crystal silicon panels", "SOLAR_PV"),
    ("TF","Thin Film","Amorphous silicon or CdTe panels", "SOLAR_PV"),
    ("BIF","Bifacial","Dual-sided panels", "SOLAR_PV"),
    ("HJT","HJT","Heterojunction technology — highest efficiency", "SOLAR_PV"),
]
INDUSTRY_CATEGORIES = [
    ("MFG","Manufacturing","Ferro-alloy, cement and other manufacturing", "1.A.2"),
    ("MIN","Mining","Coal mining and mineral extraction", "1.A.2.i"),
    ("CON","Construction","Building and civil engineering", "1.A.2.g"),
    ("UTIL","Utilities","Electricity generation, water and waste", "1.A.1.a"),
    ("WOOD","Wood & Paper","Sawmills and paper manufacturing", "1.A.2.d"),
    ("FOOD","Food & Beverage","Food processing and distilleries", "1.A.2.e"),
    ("OTHERS","Others","Other unclassified industrial activities", "1.A.2"),
]
MEASUREMENT_UNITS = [
    ("GWh","Gigawatt-Hour","Large-scale electricity measurement", "SI_STD"),
    ("kWh","Kilowatt-Hour","Small-scale electricity measurement", "SI_STD"),
    ("MWh","Megawatt-Hour","Medium-scale electricity measurement", "SI_STD"),
    ("kl","Kilolitre","Liquid petroleum products", "SI_STD"),
    ("KL","Kilolitre (caps)","Alternative kilolitre notation", "SI_STD"),
    ("MT","Metric Tonne","Solid fuels — coal, biomass, LPG", "SI_STD"),
    ("TJ","Terajoule","Energy conversion calculations", "SI_STD"),
    ("GJ","Gigajoule","Energy conversion calculations", "SI_STD"),
    ("TOE","Tonnes of Oil Equivalent","Standard energy balance unit", "IEA_STD"),
]
ENERGY_CATEGORIES = [
    ("ELECTRICITY","Electricity","Grid electricity including hydropower", "1.A.1.a"),
    ("PETROLEUM","Petroleum Fuels","Diesel, petrol, LPG, kerosene, ATF, LDO", "1.A.3"),
    ("COAL","Coal","Anthracite, sub-bituminous, lignite, coke", "1.A.1.a"),
    ("BIOMASS","Biomass & Fuelwood","Fuelwood, briquettes, biogas", "1.A.4.b"),
    ("RENEWABLES","Renewables","Solar PV, wind and other renewables", "1.A.1.a"),
    ("OTHERS","Others","Any carrier not covered above", "1.A.4"),
]
# ── Energy Supply Hierarchy ───────────────────────────────────────
# Format: (code, name, unit, category, fuel_type, parent_code, level, sort)
# parent_code=None means root node (level 0)
# ─────────────────────────────────────────────────────────────────
ENERGY_SUPPLIES = [
    # ── ELECTRICITY ──────────────────────────────────────────────
    # (code,            name,                      unit,   category,      fuel_type,     parent, lv, sort, ipcc)
    ("ELC",             "Electricity",              "MWh",  "ELECTRICITY", "ELECTRICITY", None,    0,  1, "1.A.1.a"),
    #   └── Hydro
    ("ELC-HYD",         "Hydro",                   "MWh",  "ELECTRICITY", "HYDRO",       "ELC",   1,  1, "1.A.1.a"),
    ("ELC-HYD-LRG",     "Large Hydro",             "MWh",  "ELECTRICITY", "HYDRO",       "ELC-HYD",2, 1, "1.A.1.a"),
    ("ELC-HYD-PMP",     "Pumped Hydro",            "MWh",  "ELECTRICITY", "HYDRO",       "ELC-HYD",2, 2, "1.A.1.a"),
    ("ELC-HYD-EMB",     "Embedded Hydro",          "MWh",  "ELECTRICITY", "HYDRO",       "ELC-HYD",2, 3, "1.A.1.a"),
    #   └── Solar
    ("ELC-SOL",         "Solar",                   "MWh",  "ELECTRICITY", "SOLAR",       "ELC",   1,  2, "1.A.1.a"),
    ("ELC-SOL-PV",      "Solar PV",                "MWh",  "ELECTRICITY", "SOLAR",       "ELC-SOL",2, 1, "1.A.1.a"),
    ("ELC-SOL-SWHS",    "Solar Water Heater (SWHS)","MWh", "ELECTRICITY", "SOLAR",       "ELC-SOL",2, 2, "1.A.4"),
    ("ELC-SOL-SLIS",    "Solar Lighting (SLIS)",   "MWh",  "ELECTRICITY", "SOLAR",       "ELC-SOL",2, 3, "1.A.4"),
    ("ELC-SOL-SHLS",    "Solar Home Lighting (SHLS)","MWh","ELECTRICITY", "SOLAR",       "ELC-SOL",2, 4, "1.A.4"),
    #   └── Wind
    ("ELC-WND",         "Wind",                    "MWh",  "ELECTRICITY", "WIND",        "ELC",   1,  3, "1.A.1.a"),
    #   └── BESS
    ("ELC-BESS",        "BESS",                    "MWh",  "ELECTRICITY", "BESS",        "ELC",   1,  4, "1.A.1.a"),
    #   └── Import
    ("ELC-IMP",         "Import",                  "MWh",  "ELECTRICITY", "IMPORT",      "ELC",   1,  5, "1.A.1.a"),

    # ── PETROLEUM ────────────────────────────────────────────────
    ("POL",             "Petroleum",               "kl",   "PETROLEUM",   "PETROLEUM",   None,    0,  2, "1.A.3"),
    ("POL-DSL",         "Diesel (Gas Diesel Oil)",  "kl",   "PETROLEUM",   "DIESEL",      "POL",   1,  1, "1.A.3.b"),
    ("POL-PTL",         "Petrol (Motor Gasoline)",  "kl",   "PETROLEUM",   "PETROL",      "POL",   1,  2, "1.A.3.b"),
    ("POL-KRS",         "Kerosene",                 "kl",   "PETROLEUM",   "KEROSENE",    "POL",   1,  3, "1.A.4.b"),
    ("POL-ATF",         "ATF (Jet Kerosene)",       "kl",   "PETROLEUM",   "ATF",         "POL",   1,  4, "1.A.3.a"),
    ("POL-LDO",         "Light Diesel Oil (LDO)",   "kl",   "PETROLEUM",   "LDO",         "POL",   1,  5, "1.A.1.a"),
    ("POL-LPG",         "LPG",                      "MT",   "PETROLEUM",   "LPG",         "POL",   1,  6, "1.A.4.b"),

    # ── COAL ─────────────────────────────────────────────────────
    ("COAL",            "Coal",                    "MT",   "COAL",        "COAL",        None,    0,  3, "1.A.1.a"),
    ("COAL-ANT",        "Coal (Anthracite)",        "MT",   "COAL",        "COAL",        "COAL",  1,  1, "1.A.1.a"),
    ("COAL-SUB",        "Coal (Sub-Bituminous)",    "MT",   "COAL",        "COAL",        "COAL",  1,  2, "1.A.1.a"),
    ("COAL-LIG",        "Other Coal (Lignite)",     "MT",   "COAL",        "COAL",        "COAL",  1,  3, "1.A.1.a"),
    ("COAL-COK",        "Coke of Coal",             "MT",   "COAL",        "COKE",        "COAL",  1,  4, "1.A.1.c"),

    # ── BIOMASS ──────────────────────────────────────────────────
    ("BIO",             "Biomass & Fuelwood",      "MT",   "BIOMASS",     "BIOMASS",     None,    0,  4, "1.A.4.b"),
    ("BIO-FWD",         "Fuelwood",                "MT",   "BIOMASS",     "FUELWOOD",    "BIO",   1,  1, "1.A.4.b"),
    ("BIO-BRQ",         "Briquettes & Charcoal",   "MT",   "BIOMASS",     "BRIQUETTE",   "BIO",   1,  2, "1.A.4.b"),
    ("BIO-BGS",         "Biogas",                  "MT",   "BIOMASS",     "BIOGAS",      "BIO",   1,  3, "1.A.4.b"),
    ("BIO-BGS-DOM",     "Biogas — Domestic",       "MT",   "BIOMASS",     "BIOGAS",      "BIO-BGS",2, 1, "1.A.4.b"),
    ("BIO-BGS-INST",    "Biogas — Institutional",  "MT",   "BIOMASS",     "BIOGAS",      "BIO-BGS",2, 2, "1.A.4.a"),
    ("BIO-BGS-IND",     "Biogas — Industrial",     "MT",   "BIOMASS",     "BIOGAS",      "BIO-BGS",2, 3, "1.A.2"),
]
EFFECTIVE_DATE = "2022-01-01"
# Conversion factors reference supply_code — updated to new hierarchy codes
TJ_FACTORS = [
    ("ELC",          "TJ/GWh", 3.60),
    ("ELC-HYD",      "TJ/GWh", 3.60),
    ("ELC-HYD-LRG",  "TJ/GWh", 3.60),
    ("ELC-HYD-PMP",  "TJ/GWh", 3.60),
    ("ELC-HYD-EMB",  "TJ/GWh", 3.60),
    ("ELC-SOL",      "TJ/GWh", 3.60),
    ("ELC-SOL-PV",   "TJ/GWh", 3.60),
    ("ELC-WND",      "TJ/GWh", 3.60),
    ("ELC-IMP",      "TJ/GWh", 3.60),
    ("POL-ATF",      "TJ/kl",  0.03561075),
    ("POL-DSL",      "TJ/kl",  0.03741),
    ("POL-KRS",      "TJ/kl",  0.035916),
    ("POL-PTL",      "TJ/kl",  0.034111),
    ("POL-LDO",      "TJ/kl",  0.03655),
    ("POL-LPG",      "TJ/MT",  0.0473),
    ("COAL-ANT",     "TJ/MT",  0.0267),
    ("COAL-SUB",     "TJ/MT",  0.0189),
    ("COAL-LIG",     "TJ/MT",  0.0119),
    ("BIO-FWD",      "TJ/MT",  0.0156),
    ("BIO-BGS",      "TJ/MT",  0.0504),
]
TOE_FACTORS = [
    ("ELC",          "TOE/GWh", 85.98),
    ("ELC-HYD",      "TOE/GWh", 85.98),
    ("ELC-HYD-LRG",  "TOE/GWh", 85.98),
    ("ELC-HYD-PMP",  "TOE/GWh", 85.98),
    ("ELC-HYD-EMB",  "TOE/GWh", 85.98),
    ("ELC-SOL",      "TOE/GWh", 85.98),
    ("ELC-SOL-PV",   "TOE/GWh", 85.98),
    ("ELC-WND",      "TOE/GWh", 85.98),
    ("ELC-IMP",      "TOE/GWh", 85.98),
    ("POL-ATF",      "TOE/kl",  0.8505),
    ("POL-DSL",      "TOE/kl",  0.8935),
    ("POL-KRS",      "TOE/kl",  0.8578),
    ("POL-PTL",      "TOE/kl",  0.8147),
    ("POL-LDO",      "TOE/kl",  0.8730),
    ("POL-LPG",      "TOE/MT",  1.1297),
    ("COAL-ANT",     "TOE/MT",  0.6377),
    ("COAL-SUB",     "TOE/MT",  0.4514),
    ("COAL-LIG",     "TOE/MT",  0.2842),
    ("BIO-FWD",      "TOE/MT",  0.3726),
    ("BIO-BGS",      "TOE/MT",  1.2038),
]
SECTORS = [
    ("BLD","Building",None,"1.A.4"),("BLD-R","Residential","BLD","1.A.4.b"),
    ("BLD-I","Institutional","BLD","1.A.4.a"),("BLD-C","Commercial","BLD","1.A.4.a"),
    ("IND","Industry",None,"1.A.2"),("IND-F","Ferro-Alloy","IND","1.A.2.a"),
    ("IND-C","Cement & Minerals","IND","1.A.2.f"),("IND-M","Manufacturing","IND","1.A.2"),
    ("IND-P","Pulp & Paper","IND","1.A.2.d"),("IND-FD","Food & Beverage","IND","1.A.2.e"),
    ("TRN","Transport",None,"1.A.3"),("TRN-R","Road Transport","TRN","1.A.3.b"),
    ("TRN-A","Aviation","TRN","1.A.3.a"),("OTH","Others",None,"1.A.4"),
    ("OTH-AG","Agriculture","OTH","1.A.4.c"),
]
ELECTRICITY_CATEGORIES = [
    ("RES-GEN","Residential (General)","BLD","RES","1.A.4.b"),
    ("INST-SM","Institutional (Small)","BLD","PUB","1.A.4.a"),
    ("INST-LG","Institutional (Large)","BLD","PUB","1.A.4.a"),
    ("COM-GEN","Commercial (General)","BLD","COM","1.A.4.a"),
    ("COM-LG","Commercial (Large)","BLD","COM","1.A.4.a"),
    ("IND-HV","Industrial (High Voltage)","IND","IND","1.A.2"),
    ("IND-MV","Industrial (Med Voltage)","IND","IND","1.A.2"),
    ("TRN-EV","Transport (Electric)","TRN","COM","1.A.3"),
    ("AGR-GEN","Agriculture (General)","OTH","AGR","1.A.4.c"),
]
# Child vehicle types — (code, name, parent_code, weight_min, weight_max, ipcc)
VEHICLE_TYPES = [
    # Off-Load children
    ("TRC",  "Tractor",               "OFF_LOAD", None, None, "1.A.4.c"),
    ("EME",  "Earth Moving Equipment","OFF_LOAD", None, None, "1.A.2.g"),
    ("PTL",  "Power Tiller",          "OFF_LOAD", None, None, "1.A.4.c"),
    # Cars children
    ("TAXI", "Taxi",                  "CARS",     None, None, "1.A.3.b"),
    ("LV",   "Light Vehicle",         "CARS",     None, None, "1.A.3.b"),
    # Light Duty Trucks children
    ("MV",   "Medium Vehicle",        "LDT",      None, None, "1.A.3.b"),
    ("MBUS", "Medium Bus",            "LDT",      None, None, "1.A.3.b"),
    # Heavy Duty Trucks and Buses children
    ("HV",   "Heavy Vehicle",         "HDT_BUS",  None, None, "1.A.3.b"),
    ("HBUS", "Heavy Bus",             "HDT_BUS",  None, None, "1.A.3.b"),
    # Motorcycles children
    ("TW",   "Two Wheeler",           "MC",        None, None, "1.A.3.b"),
]
MILEAGE = [
    # (vehicle_type_code, fuel_code, kmpl, year, ipcc)
    ("TW",  "PETROL", 45.0, 2022, "1.A.3.b"),
    ("TAXI","PETROL", 14.0, 2022, "1.A.3.b"),
    ("TAXI","DIESEL", 16.0, 2022, "1.A.3.b"),
    ("LV",  "PETROL", 14.0, 2022, "1.A.3.b"),
    ("LV",  "DIESEL", 16.0, 2022, "1.A.3.b"),
    ("MV",  "DIESEL", 12.0, 2022, "1.A.3.b"),
    ("MBUS","DIESEL",  8.0, 2022, "1.A.3.b"),
    ("HV",  "DIESEL",  5.0, 2022, "1.A.3.b"),
    ("HBUS","DIESEL",  5.5, 2022, "1.A.3.b"),
    ("TRC", "DIESEL",  3.5, 2022, "1.A.4.c"),
    ("EME", "DIESEL",  3.0, 2022, "1.A.2.g"),
    ("PTL", "DIESEL",  4.0, 2022, "1.A.4.c"),
]
BIOGAS_SIZES = [
    ("Small (4 m3)","DOM",4.0,1.214,8760,"1.A.4.b"),
    ("Small (6 m3)","DOM",6.0,1.214,8760,"1.A.4.b"),
    ("Small (8 m3)","DOM",8.0,1.214,8760,"1.A.4.b"),
    ("Small (10 m3)","DOM",10.0,1.214,8760,"1.A.4.b"),
    ("Medium (30 m3)","INST",30.0,1.214,8760,"1.A.4.a"),
    ("Medium (50 m3)","INST",50.0,1.214,8760,"1.A.4.a"),
    ("Large (63 m3)","IND",63.0,1.214,8760,"1.A.2"),
    ("Large (70 m3)","IND",70.0,1.214,8760,"1.A.2"),
]
SOLAR_SIZES = [
    ("Solar roof top", 10.0, "BLD", 12000.0, "1.A.4.a"),
    ("Solar water heating systems", 5.0, "BLD-R", 6000.0, "1.A.4.b"),
    ("Solar lift irrigation system", 15.0, "OTH-AG", 18000.0, "1.A.4.c"),
    ("Solar car park", 50.0, "TRN-R", 60000.0, "1.A.3.b"),
    ("Solar EV charging system", 30.0, "TRN-R", 36000.0, "1.A.3.b"),
    ("Dummy Solar Large", 100.0, "IND", 120000.0, "1.A.2"),
]
# (code, name, cat_code, ipcc, description)
INDUSTRY_CLASSIFICATIONS = [
    ("FERRO","Ferro-Alloy Industry","MFG","C24","Ferro-silicon and ferro-chrome manufacturing"),
    ("CEM","Cement & Lime","MFG","C235","Cement, lime and plaster manufacturing"),
    ("MIN","Minerals & Quarrying","MIN","B08","Quarrying of stone, dolomite, sand and clay"),
    ("FOOD","Food Processing","FOOD","C10","Food and beverage including distilleries"),
    ("WOOD","Wood & Timber","WOOD","C16","Sawmilling and wood products"),
    ("PAPER","Pulp & Paper","WOOD","C17","Pulp, paper and paper products"),
    ("CHEM","Chemical & Fertilizer","MFG","C20","Chemical and fertilizer manufacturing"),
    ("CONST","Construction Materials","CON","C239","Bricks, tiles and construction materials"),
    ("UTIL-E","Electricity Generation","UTIL","D35","Hydropower and electricity utilities"),
    ("UTIL-W","Water Supply & Waste","UTIL","E36","Water collection, treatment and supply"),
    ("OTH-IND","Other Industries","OTHERS","C33","Other unclassified manufacturing"),
]


# ══════════════════════════════════════════════════════════════════
# ELECTRICITY SETTINGS
# ══════════════════════════════════════════════════════════════════

DC_DZONGKHAGS = [
    ("BUM","Bumthang","Central","BTN.BUM"),("CHH","Chhukha","Western","BTN.CHH"),
    ("DAG","Dagana","Southern","BTN.DAG"),("GAS","Gasa","Western","BTN.GAS"),
    ("HAA","Haa","Western","BTN.HAA"),("LHU","Lhuentse","Eastern","BTN.LHU"),
    ("MON","Mongar","Eastern","BTN.MON"),("PAR","Paro","Western","BTN.PAR"),
    ("PEM","Pemagatshel","Eastern","BTN.PEM"),("PUN","Punakha","Western","BTN.PUN"),
    ("SJK","Samdrup Jongkhar","Eastern","BTN.SJK"),("SAM","Samtse","Southern","BTN.SAM"),
    ("SAR","Sarpang","Southern","BTN.SAR"),("THI","Thimphu","Western","BTN.THI"),
    ("TRG","Trashigang","Eastern","BTN.TRG"),("TRY","Trashiyangtse","Eastern","BTN.TRY"),
    ("TRO","Trongsa","Central","BTN.TRO"),("TSI","Tsirang","Southern","BTN.TSI"),
    ("WAN","Wangdue Phodrang","Western","BTN.WAN"),("ZHE","Zhemgang","Central","BTN.ZHE"),
]
DC_YEARS = list(range(2005, 2031))
DC_DATA_SOURCES = [
    ("BPC-ANN",  "BPC Annual Energy Data Report",   "REPORT","BPC","BPC_DOC/2006"),
    ("DGPC-MON", "DGPC Monthly Generation Return",  "REPORT","DGPC","DGPC_DOC/2006"),
    ("DGPC-IMP", "DGPC Import/Export Monthly Data", "REPORT","DGPC","DGPC_DOC/2006"),
    ("DOE-SUR",  "DoE Energy Survey",               "SURVEY","DoE","DOE_SUR/2006"),
    ("BPC-MON",  "BPC Monthly Billing Data",        "REPORT","BPC","BPC_BILL/2006"),
    ("MANUAL",   "Manual Entry",                    "MANUAL","","MANUAL/2006"),
    ("EXCEL",    "Excel Upload",                    "EXCEL","","EXCEL/2006"),
    ("API",      "System API Feed",                 "API","","API/2006"),
]
DC_BPC_CATEGORIES = [
    ("LV-RR","Rural Residential","LV",1,"1.A.4.b"),
    ("LV-RC","Rural Cooperatives","LV",2,"1.A.4.b"),
    ("LV-RM","Rural Micro Trade","LV",3,"1.A.4.a"),
    ("LV-CL","Rural Community Lhakhangs","LV",4,"1.A.4.a"),
    ("LV-HL","Highlanders","LV",5,"1.A.4.b"),
    ("LV-UR","Urban","LV",6,"1.A.4.b"),
    ("LV-RI","Religious Institutions","LV",7,"1.A.4.a"),
    ("LV-CS","Cottage & Small Scale Industries","LV",8,"1.A.2"),
    ("LV-CO","Commercial","LV",9,"1.A.4.a"),
    ("LV-IN","Industrial (LV)","LV",10,"1.A.2"),
    ("LV-AG","Agriculture","LV",11,"1.A.4.c"),
    ("LV-IS","Institutions","LV",12,"1.A.4.a"),
    ("LV-SL","Street Lighting","LV",13,"1.A.4.a"),
    ("LV-PH","Power House Auxiliaries","LV",14,"1.A.1.a"),
    ("LV-TC","Temporary Connections","LV",15,"1.A.4.a"),
    ("LV-BLK","LV Bulk","LV_BULK",16,"1.A.4.a"),
    ("MV-TOT","MV Total (Medium Voltage)","MV",17,"1.A.2"),
    ("HV-TOT","HV Total (High Voltage)","HV",18,"1.A.2"),
]
DC_PLANTS = [
    ("DAGACHHU", "Dagachhu Hydropower Plant", "LARGE_HYDRO", "DAG", 126, "DGPC", "1.A.1.a"),
    ("CHUKHA", "Chukha Hydropower Plant", "LARGE_HYDRO", "CHH", 336, "DGPC", "1.A.1.a"),
    ("KURICHHU", "Kurichhu Hydroelectric Plant", "LARGE_HYDRO", "MON", 60, "DGPC", "1.A.1.a"),
    ("TALA", "Tala Hydropower Plant", "LARGE_HYDRO", "CHH", 1020, "DGPC", "1.A.1.a"),
    ("MANGDECHHU", "Mangdechhu Hydroelectric Plant", "LARGE_HYDRO", "TRO", 720, "DGPC", "1.A.1.a"),
    ("BASOCHHU", "Basochhu Hydropower Plant", "LARGE_HYDRO", "WAN", 64, "DGPC", "1.A.1.a"),
    ("NIKACHHU", "Nikachhu Hydropower Plant", "LARGE_HYDRO", "TRO", 118, "DGPC", "1.A.1.a"),
]
DC_COUNTRIES = [
    ("IND","India","BHU.IND"),("CHN","China","BHU.CHN"),("BGD","Bangladesh","BHU.BGD"),("NPL","Nepal","BHU.NPL"),
]


# ══════════════════════════════════════════════════════════════════
# COMMAND
# ══════════════════════════════════════════════════════════════════

class Command(BaseCommand):
    help = "Seed ALL data — master_data + electricity settings. Safe to re-run."

    def add_arguments(self, parser):
        parser.add_argument("--check", action="store_true",
                            help="Show record counts only, don't seed")
        parser.add_argument("--only", type=str,
                            choices=["master", "electricity"],
                            help="Seed only: master | electricity")
        parser.add_argument("--reset-supply", action="store_true",
                            help="Delete all EnergySupply + FuelType records and re-seed")

    def handle(self, *args, **options):
        check  = options["check"]
        only   = options.get("only")
        reset  = options.get("reset_supply", False)

        if check:
            self._show_counts()
            return

        # --reset-supply: wipe EnergySupply and FuelType for clean re-seed
        if reset:
            from eis_apps.master_data.models import EnergySupply, FuelType
            self.stdout.write(self.style.WARNING(
                "  ⚠  --reset-supply: deleting EnergySupply and FuelType records..."
            ))
            EnergySupply.objects.all().delete()
            FuelType.objects.all().delete()
            self.stdout.write(self.style.SUCCESS("  ✓  Cleared. Re-seeding...\n"))

        totals = {}

        # Get or create a system user for audit fields
        from django.contrib.auth import get_user_model
        User = get_user_model()
        system_user, _ = User.objects.get_or_create(
            username="system",
            defaults={
                "first_name": "System", 
                "last_name": "Seeder", 
                "status": "ACTIVE",
                "email": "system@eis-jdms.gov.bt"
            }
        )
        self.system_user = system_user

        if only != "electricity":
            self.stdout.write(self.style.MIGRATE_HEADING(
                "\n  ── Master Data ─────────────────────────────────"))
            totals.update(self._seed_master())

        if only != "master":
            self.stdout.write(self.style.MIGRATE_HEADING(
                "\n  ── Electricity Settings ────────────────────────"))
            totals.update(self._seed_electricity())

        # Grand summary
        self.stdout.write("\n" + " " + "═"*46)
        grand = 0
        for model, count in totals.items():
            status = self.style.SUCCESS(f"+{count}") if count else "  (already seeded)"
            self.stdout.write(f"  {model:<30} {status}")
            grand += count
        self.stdout.write(self.style.SUCCESS(
            f"\n  Grand Total: {grand} new records created\n"
        ))

    # ─────────────────────────────────────────────────────────────
    def _show_counts(self):
        from django.apps import apps

        sections = {
            "── Master Data ──────────────────────────────────────": {
                "master_data": [
                    "ConversionUnit","ElectricityType",
                    "FuelType","ProductionType","PanelType","IndustryCategory",
                    "MeasurementUnit","EnergyCategory",
                    "Sector","ElectricityCategory",
                    "VehicleType","Mileage","BiogasSize",
                    "SolarEnergySize","IndustryClassification",
                    "EnergySupply", "ConversionFactor",
                ]
            },
            "── Shared Data Collection Settings ──────────────────": {
                "master_data": [
                    "Dzongkhag","DataCollectionYear","DataSource","Country",
                ]
            },
            "── Electricity Lookup Tables ──────────────────────────": {
                "master_data": [
                    "BPCCategory","GenerationPlant",
                ],
            },
        }
        for heading, apps_dict in sections.items():
            self.stdout.write(self.style.MIGRATE_HEADING(f"\n  {heading}"))
            for app_label, models in apps_dict.items():
                for name in models:
                    try:
                        count = apps.get_model(app_label, name).objects.count()
                        status = self.style.SUCCESS(str(count)) if count > 0 \
                                 else self.style.WARNING("0 — needs seeding")
                        self.stdout.write(f"    {name:<30} {status}")
                    except Exception as e:
                        self.stdout.write(
                            f"    {name:<30} "
                            + self.style.ERROR(f"ERROR — {e}")
                        )

    # ─────────────────────────────────────────────────────────────
    def _seed_master(self):
        from django.apps import apps
        def M(n):
            return apps.get_model("master_data", n)

        def gc(model, lookup, defaults):
            # Add audit fields to defaults
            defaults.update({
                "created_by": self.system_user,
                "updated_by": self.system_user,
            })
            obj, created = model.objects.update_or_create(**lookup, defaults=defaults)
            return created

        totals = {}

        with transaction.atomic():

            # ── BASE LOOKUP TABLES ────────────────────────────────
            totals["ConversionUnit"] = sum(
                gc(M("ConversionUnit"), {"unit_code": r[0]},
                   {"unit_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in CONVERSION_UNITS)

            totals["MeasurementUnit"] = sum(
                gc(M("MeasurementUnit"), {"unit_code": r[0]},
                   {"unit_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in MEASUREMENT_UNITS)

            totals["EnergyCategory"] = sum(
                gc(M("EnergyCategory"), {"category_code": r[0]},
                   {"category_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in ENERGY_CATEGORIES)

            totals["ElectricityType"] = sum(
                gc(M("ElectricityType"), {"type_code": r[0]},
                   {"type_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in ELECTRICITY_TYPES)

            # VehicleCategory was removed — parent VehicleTypes are seeded
            # from VEHICLE_CATEGORIES below during the VehicleType block

            # Pre-fetch maps for ForeignKeys
            ecat_map = {c.category_code: c for c in M("EnergyCategory").objects.all()}

            # FuelType — hierarchical, insert parent before child
            fuel_code_map = {}
            c = 0
            for code, name, parent_code, cat_code, desc, ipcc in FUEL_TYPES:
                parent_obj = fuel_code_map.get(parent_code) if parent_code else None
                cat_obj = ecat_map.get(cat_code)
                obj, created = M("FuelType").objects.update_or_create(
                    fuel_code=code,
                    defaults={
                        "fuel_name": name, 
                        "fuel_category": cat_obj,
                        "parent_fuel": parent_obj, 
                        "description": desc,
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                fuel_code_map[code] = obj
                if created: c += 1
            totals["FuelType"] = c

            totals["VehicleFuelType"] = sum(
                gc(M("VehicleFuelType"), {"fuel_code": r[0]},
                   {"fuel_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in VEHICLE_FUEL_TYPES)

            totals["ProductionType"] = sum(
                gc(M("ProductionType"), {"type_code": r[0]},
                   {"type_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in PRODUCTION_TYPES)

            totals["PanelType"] = sum(
                gc(M("PanelType"), {"type_code": r[0]},
                   {"type_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in PANEL_TYPES)

            totals["IndustryCategory"] = sum(
                gc(M("IndustryCategory"), {"category_code": r[0]},
                   {"category_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in INDUSTRY_CATEGORIES)

            totals["MeasurementUnit"] = sum(
                gc(M("MeasurementUnit"), {"unit_code": r[0]},
                   {"unit_name": r[1], "description": r[2], "ipcc_code": r[3], "is_active": True})
                for r in MEASUREMENT_UNITS)

            # 1. FuelType — hierarchical
            fuel_code_map = {}
            c = 0
            for code, name, parent_code, cat_code, desc, ipcc in FUEL_TYPES:
                parent_obj = fuel_code_map.get(parent_code) if parent_code else None
                cat_obj = ecat_map.get(cat_code)
                obj, created = M("FuelType").objects.update_or_create(
                    fuel_code=code,
                    defaults={
                        "fuel_name": name, 
                        "fuel_category": cat_obj,
                        "parent_fuel": parent_obj, 
                        "description": desc,
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                fuel_code_map[code] = obj
                if created: c += 1
            totals["FuelType"] = c

            # 2. EnergySupply Hierarchy
            unit_map = {u.unit_code: u for u in M("MeasurementUnit").objects.all()}
            ftype_map = {f.fuel_code: f for f in M("FuelType").objects.all()}
            sup_code_map = {}
            c = 0
            for code, name, unit_code, cat_code, ftype_code, parent_code, level, sort, ipcc in ENERGY_SUPPLIES:
                parent_obj = sup_code_map.get(parent_code) if parent_code else None
                unit_obj = unit_map.get(unit_code)
                cat_obj = ecat_map.get(cat_code)
                ftype_obj = ftype_map.get(ftype_code)
                
                obj, created = M("EnergySupply").objects.update_or_create(
                    supply_code=code,
                    defaults={
                        "supply_name": name,
                        "measurement_unit": unit_obj,
                        "energy_category": cat_obj,
                        "fuel_type": ftype_obj,
                        "parent_supply": parent_obj,
                        "level": level,
                        "sort_order": sort,
                        "ipcc_code": ipcc,
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                sup_code_map[code] = obj
                if created: c += 1
            totals["EnergySupply"] = c

            # Conversion Factors
            sup_map  = {s.supply_code: s for s in M("EnergySupply").objects.all()}
            unit_map = {u.unit_code: u   for u in M("ConversionUnit").objects.all()}
            cf = 0
            for sc, uc, fv in (TJ_FACTORS + TOE_FACTORS):
                s = sup_map.get(sc); u = unit_map.get(uc)
                if s and u:
                    _, created = M("ConversionFactor").objects.update_or_create(
                        energy_supply=s, unit=u, effective_date=EFFECTIVE_DATE,
                        defaults={
                            "conversion_factor": fv, 
                            "is_active": True,
                            "created_by": self.system_user,
                            "updated_by": self.system_user,
                        },
                    )
                    if created: cf += 1
            totals["ConversionFactor"] = cf

            # Sectors (must be inserted in parent-before-child order)
            sec_map = {}; c = 0
            for code, name, parent_code, ipcc in SECTORS:
                parent = sec_map.get(parent_code)
                obj, created = M("Sector").objects.update_or_create(
                    sector_code=code,
                    defaults={
                        "sector_name": name, 
                        "parent_sector": parent, 
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                sec_map[code] = obj
                if created: c += 1
            totals["Sector"] = c

            # Electricity Categories
            etype_map = {t.type_code: t for t in M("ElectricityType").objects.all()}
            c = 0
            for cc, cn, sc, tc, ipcc in ELECTRICITY_CATEGORIES:
                sector_obj = sec_map.get(sc)
                etype_obj  = etype_map.get(tc)
                if sector_obj:
                    _, created = M("ElectricityCategory").objects.update_or_create(
                        category_code=cc,
                        defaults={
                            "category_name": cn, 
                            "sector": sector_obj,
                            "category_type": etype_obj, 
                            "ipcc_code": ipcc,
                            "is_active": True,
                            "created_by": self.system_user,
                            "updated_by": self.system_user,
                        },
                    )
                    if created: c += 1
            totals["ElectricityCategory"] = c

            # Vehicle Types — seed parent categories first, then children
            # Step 1: seed parent-level VehicleType records from VEHICLE_CATEGORIES
            veh_map = {}; c = 0
            for cat_code, cat_name, ipcc in VEHICLE_CATEGORIES:
                obj, created = M("VehicleType").objects.update_or_create(
                    vehicle_type_code=cat_code,
                    defaults={
                        "vehicle_type_name": cat_name,
                        "parent": None,
                        "gross_weight_min": None,
                        "gross_weight_max": None,
                        "ipcc_code": ipcc,
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                veh_map[cat_code] = obj
                if created: c += 1

            # Step 2: seed child VehicleType records, parented to the group above
            for code, name, cat_code, wmin, wmax, ipcc in VEHICLE_TYPES:
                parent_obj = veh_map.get(cat_code)
                obj, created = M("VehicleType").objects.update_or_create(
                    vehicle_type_code=code,
                    defaults={
                        "vehicle_type_name": name,
                        "parent": parent_obj,
                        "gross_weight_min": wmin,
                        "gross_weight_max": wmax,
                        "ipcc_code": ipcc,
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                veh_map[code] = obj
                if created: c += 1
            totals["VehicleType"] = c

            # Mileage
            fuel_map = {f.fuel_code: f for f in M("VehicleFuelType").objects.all()}
            c = 0
            for vc, fc, kmpl, year, ipcc in MILEAGE:
                veh_obj = veh_map.get(vc)
                fuel_obj = fuel_map.get(fc)
                if veh_obj and fuel_obj:
                    _, created = M("Mileage").objects.update_or_create(
                        vehicle_type=veh_obj, fuel_type=fuel_obj, effective_year=year,
                        defaults={
                            "mileage_kmpl": kmpl, 
                            "ipcc_code": ipcc, 
                            "is_active": True,
                            "created_by": self.system_user,
                            "updated_by": self.system_user,
                        },
                    )
                    if created: c += 1
            totals["Mileage"] = c

            # Biogas Sizes
            prod_map = {p.type_code: p for p in M("ProductionType").objects.all()}
            c = 0
            for sc, pc, cap, dens, hrs, ipcc in BIOGAS_SIZES:
                prod_obj = prod_map.get(pc)
                _, created = M("BiogasSize").objects.update_or_create(
                    size_category=sc,
                    defaults={
                        "production_type": prod_obj, 
                        "capacity_m3": cap,
                        "density": dens, 
                        "annual_operating_hours": hrs,
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["BiogasSize"] = c

            # Solar Sizes
            sec_map_all = {s.sector_code: s for s in M("Sector").objects.all()}
            c = 0
            for cat, kwp, sec_code, kwh, ipcc in SOLAR_SIZES:
                sec_obj = sec_map_all.get(sec_code)
                _, created = M("SolarEnergySize").objects.update_or_create(
                    category=cat,
                    defaults={
                        "installed_capacity_kwp": kwp, 
                        "sector": sec_obj,
                        "energy_generation_kwh": kwh,
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["SolarEnergySize"] = c

            # Industry Classifications
            icat_map = {i.category_code: i for i in M("IndustryCategory").objects.all()}
            c = 0
            for code, name, cat_code, ipcc, desc in INDUSTRY_CLASSIFICATIONS:
                cat_obj = icat_map.get(cat_code)
                _, created = M("IndustryClassification").objects.update_or_create(
                    classification_code=code,
                    defaults={
                        "classification_name": name, 
                        "category": cat_obj,
                        "ipcc_code": ipcc, 
                        "description": desc,
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["IndustryClassification"] = c

        return totals

    # ─────────────────────────────────────────────────────────────
    def _seed_electricity(self):
        from django.apps import apps
        from decimal import Decimal
        def E(n): return apps.get_model("electricity", n)
        def M(n):
            ds_models = {"Dzongkhag", "DataCollectionYear", "DataSource", "Country", "BPCCategory", "GenerationPlant", "Substation", "SubstationTransformer"}
            return apps.get_model("master_data", n) if n in ds_models else apps.get_model("master_data", n)


        totals = {}

        with transaction.atomic():

            c = 0
            for code, name, region, ipcc in DC_DZONGKHAGS:
                _, created = M("Dzongkhag").objects.update_or_create(
                    dzongkhag_code=code,
                    defaults={
                        "dzongkhag": name, 
                        "region": region, 
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["Dzongkhag"] = c

            # Years
            c = 0
            for y in DC_YEARS:
                _, created = M("DataCollectionYear").objects.get_or_create(
                    year=y, 
                    defaults={
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    }
                )
                if created: c += 1
            totals["DataCollectionYear"] = c

            # Data Sources
            c = 0
            for code, name, stype, org, ipcc in DC_DATA_SOURCES:
                _, created = M("DataSource").objects.update_or_create(
                    source_code=code,
                    defaults={
                        "source_name": name, 
                        "source_type": stype,
                        "organization": org, 
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["DataSource"] = c

            # BPC Categories
            c = 0
            for code, name, vtier, sort, ipcc in DC_BPC_CATEGORIES:
                _, created = M("BPCCategory").objects.update_or_create(
                    category_code=code,
                    defaults={
                        "category_name": name, 
                        "voltage_tier": vtier,
                        "sort_order": sort, 
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["BPCCategory"] = c

            # Generation Plants (seeding directly from Excel /Users/lepchaz/Downloads/ref_power_plant.xls)
            self.stdout.write("Seeding Generation Plants from /Users/lepchaz/Downloads/ref_power_plant.xls...")
            import pandas as pd
            import datetime
            def coerce_date(v):
                if not v or str(v).strip() == "" or str(v).lower() == "nan":
                    return None
                if hasattr(v, "date"):
                    return v.date()
                if isinstance(v, (datetime.date, datetime.datetime)):
                    return v if isinstance(v, datetime.date) else v.date()
                try:
                    val_float = float(v)
                    base_date = datetime.date(1899, 12, 30)
                    return base_date + datetime.timedelta(days=val_float)
                except (ValueError, TypeError):
                    pass
                v_str = str(v).strip()
                for fmt in ("%Y-%m-%d", "%Y/%m/%d", "%d-%m-%Y", "%d/%m/%Y", "%Y"):
                    try:
                        dt = datetime.datetime.strptime(v_str, fmt).date()
                        if fmt == "%Y":
                            dt = datetime.date(dt.year, 12, 31)
                        return dt
                    except ValueError:
                        pass
                return None

            def coerce_decimal(v):
                if not v or str(v).strip() == "" or str(v).lower() == "nan":
                    return None
                try:
                    return Decimal(str(v).strip())
                except:
                    return None

            def coerce_int(v):
                if not v or str(v).strip() == "" or str(v).lower() == "nan":
                    return None
                try:
                    return int(float(str(v).strip()))
                except:
                    return None

            try:
                df = pd.read_excel('/Users/lepchaz/Downloads/ref_power_plant.xls')
            except FileNotFoundError:
                self.stdout.write(self.style.WARNING("  ⚠ Skipping power plants seed: ref_power_plant.xls not found in container"))
                return totals
            
            df = df.fillna("")
            
            dzongkhags = list(M("Dzongkhag").objects.all())
            
            c = 0
            for _, row in df.iterrows():
                pcode = str(row.get('plant_code', '')).strip()
                pname = str(row.get('plant_name', '')).strip()
                if not pcode or not pname:
                    continue
                
                # Resolve dzongkhag by name
                dz_name = str(row.get('dzongkhag', '')).strip().upper()
                dzong_obj = None
                if dz_name:
                    for dz in dzongkhags:
                        if dz.dzongkhag.upper() == dz_name or dz.dzongkhag_code.upper() == dz_name:
                            dzong_obj = dz
                            break
                
                obj, created = M("GenerationPlant").objects.update_or_create(
                    plant_code=pcode,
                    defaults={
                        "plant_name": pname,
                        "plant_status": str(row.get('plant_status', '')).strip() or None,
                        "acronym": str(row.get('acronym', '')).strip() or None,
                        "plant_type": str(row.get('plant_type', '')).strip() or None,
                        "dzongkhag": dzong_obj,
                        "gewog": str(row.get('gewog', '')).strip() or None,
                        "village": str(row.get('village', '')).strip() or None,
                        "installed_capacity": coerce_decimal(row.get('installed_capacity')),
                        "existing_energy_generation": coerce_decimal(row.get('existing_energy_generation')),
                        "year_of_operation": coerce_date(row.get('year_of_operation')),
                        "firm_power": coerce_decimal(row.get('firm_power')),
                        "ppa_signed": coerce_date(row.get('ppa_signed')),
                        "scheduled_delivery_date": coerce_date(row.get('scheduled_delivery_date')),
                        "actual_delivery_date": coerce_date(row.get('actual_delivery_date')),
                        "delay": str(row.get('delay', '')).strip() or None,
                        "dpr_cost": coerce_decimal(row.get('dpr_cost')),
                        "actual_cost_btn": coerce_decimal(row.get('actual_cost_btn')),
                        "actual_cost_usd": coerce_decimal(row.get('actual_cost_usd')),
                        "idc": coerce_decimal(row.get('idc')),
                        "emission_reductions_pa": coerce_decimal(row.get('emission_reductions_pa')),
                        "remarks": str(row.get('remarks', '')).strip() or None,
                        "owner": str(row.get('owner', '')).strip() or None,
                        "no_of_units": coerce_int(row.get('no_of_units')),
                        "grid_type": str(row.get('grid_type', '')).strip() or None,
                        "generator_type": str(row.get('generator_type', '')).strip() or None,
                        "construction_type": str(row.get('construction_type', '')).strip() or None,
                        "storage_size": coerce_decimal(row.get('storage_size')),
                        "system_type": str(row.get('system_type', '')).strip() or None,
                        "set_numbers": coerce_decimal(row.get('set_numbers')),
                        "energy": coerce_decimal(row.get('energy')),
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    }
                )
                if created: c += 1
            totals["GenerationPlant"] = c

            # Countries
            c = 0
            for code, name, ipcc in DC_COUNTRIES:
                _, created = M("Country").objects.update_or_create(
                    country_code=code,
                    defaults={
                        "country_name": name, 
                        "ipcc_code": ipcc, 
                        "is_active": True,
                        "created_by": self.system_user,
                        "updated_by": self.system_user,
                    },
                )
                if created: c += 1
            totals["Country"] = c

            # Substations (seeding directly from Excel /Users/lepchaz/Downloads/data[new]/ref_substation.xls)
            self.stdout.write("Wiping existing Substations and Transformers...")
            M("SubstationTransformer").objects.all().delete()
            M("Substation").objects.all().delete()
            
            self.stdout.write("Seeding Substations from /Users/lepchaz/Downloads/data[new]/ref_substation.xls...")
            import pandas as pd
            import datetime
            
            df = pd.read_excel('/Users/lepchaz/Downloads/data[new]/ref_substation.xls')
            df = df.fillna("")
            
            dzongkhags = list(M("Dzongkhag").objects.all())
            
            c = 0
            for _, row in df.iterrows():
                scode = str(row.get('plant_code', '')).strip()
                sname = str(row.get('plant_name', '')).strip()
                if not scode or not sname:
                    # try alternative headers
                    scode = str(row.get('substation_code', '')).strip()
                    sname = str(row.get('substation_name', '')).strip()
                    if not scode or not sname:
                        continue
                
                # Resolve dzongkhag by name
                dz_name = str(row.get('dzongkhag', '')).strip().upper()
                dzong_obj = None
                if dz_name:
                    for dz in dzongkhags:
                        if dz.dzongkhag.upper() == dz_name or dz.dzongkhag_code.upper() == dz_name:
                            dzong_obj = dz
                            break
                            
                is_active = str(row.get('plant_status', '')).strip().upper() == 'OPERATIONAL'
                
                obj = M("Substation").objects.create(
                    substation_code=scode,
                    substation_name=sname,
                    acronym=str(row.get('acronym', '')).strip() or scode,
                    dzongkhag=dzong_obj,
                    gewog=str(row.get('gewog', '')).strip() or "",
                    region=str(row.get('region', '')).strip() or "",
                    substation_type=str(row.get('substation_type', '')).strip() or "",
                    commissioned_date=coerce_date(row.get('year_of_operation')),
                    remarks=str(row.get('remarks', '')).strip() or "",
                    is_active=is_active,
                    plant_status=str(row.get('plant_status', '')).strip() or None,
                    plant_type=str(row.get('plant_type', '')).strip() or None,
                    dzongkhag_code=str(row.get('dzongkhag_code', '')).strip() or None,
                    dzo_iso_code=str(row.get('dzo_iso_code', '')).strip() or None,
                    region_code=str(row.get('region_code', '')).strip() or None,
                    gewog_code=str(row.get('gewog_code', '')).strip() or None,
                    plant_type_code=coerce_int(row.get('plant_type_code')),
                    plant_status_code=coerce_int(row.get('plant_status_code')),
                    substation_type_code=coerce_int(row.get('substation_type_code')),
                    created_by=self.system_user,
                    updated_by=self.system_user,
                )
                c += 1
            totals["Substation"] = c

            # Substation Transformers (seeding directly from Excel /Users/lepchaz/Downloads/data[new]/ref_transformer.xls)
            import os
            ref_trans_path = '/Users/lepchaz/Downloads/data[new]/ref_transformer.xls'
            if os.path.exists(ref_trans_path):
                self.stdout.write("Seeding Substation Transformers from /Users/lepchaz/Downloads/data[new]/ref_transformer.xls...")
                df_trans = pd.read_excel(ref_trans_path)
                df_trans = df_trans.fillna("")
                
                c_trans = 0
                sub_counts = {}
                
                for _, row in df_trans.iterrows():
                    scode = str(row.get('plant_code', '')).strip()
                    if not scode:
                        continue
                    
                    try:
                        sub_obj = M("Substation").objects.get(substation_code=scode)
                    except M("Substation").DoesNotExist:
                        continue
                        
                    voltage_ratio = str(row.get('voltage_ratio', '')).strip()
                    capacity_mva = coerce_decimal(row.get('max_capacity_mva'))
                    pf_rate = coerce_decimal(row.get('pf_rate')) or Decimal("0.9")
                    capacity_mw = coerce_decimal(row.get('max_capacity_mw'))
                    is_active = str(row.get('status', '')).strip().upper() == 'OPERATIONAL'
                    
                    sub_counts[scode] = sub_counts.get(scode, 0) + 1
                    tcode = f"{scode}-TR{sub_counts[scode]}"
                    
                    _, created = M("SubstationTransformer").objects.update_or_create(
                        transformer_code=tcode,
                        defaults={
                            "substation": sub_obj,
                            "voltage_ratio": voltage_ratio,
                            "max_capacity_mva": capacity_mva,
                            "max_capacity_mw": capacity_mw,
                            "pf_rate": pf_rate,
                            "commissioned_date": coerce_date(row.get('year_of_operation')),
                            "is_active": is_active,
                            "status_name": str(row.get('status', '')).strip() or None,
                            "plant_status_code": coerce_int(row.get('plant_status_code')),
                            "substation_name": str(row.get('substation_name', '')).strip() or None,
                            "plant_type": str(row.get('plant_type', '')).strip() or None,
                            "plant_type_code": coerce_int(row.get('plant_type_code')),
                            "acronym": str(row.get('acronym', '')).strip() or None,
                            "dzongkhag": str(row.get('dzongkhag', '')).strip() or None,
                            "dzongkhag_code": str(row.get('dzongkhag_code', '')).strip() or None,
                            "gewog": str(row.get('gewog', '')).strip() or None,
                            "gewog_code": str(row.get('gewog_code', '')).strip() or None,
                            "dzo_iso_code": str(row.get('dzo_iso_code', '')).strip() or None,
                            "region": str(row.get('region', '')).strip() or None,
                            "region_code": str(row.get('region_code', '')).strip() or None,
                            "substation_type": str(row.get('substation_type', '')).strip() or None,
                            "substation_type_code": coerce_int(row.get('substation_type_code')),
                            "no_of_transformers": coerce_int(row.get('no_of_transformers')),
                            "transformer_capacity": str(row.get('transformer_capacity', '')).strip() or None,
                            "created_by": self.system_user,
                            "updated_by": self.system_user,
                        }
                    )
                    if created: c_trans += 1
                totals["SubstationTransformer"] = c_trans


        return totals