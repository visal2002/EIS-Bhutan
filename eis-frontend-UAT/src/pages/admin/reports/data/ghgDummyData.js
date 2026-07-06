// Dummy GHG Inventory data — Bhutan, IPCC 2006 GL format
// Unit: Gg CO2-equivalent (GWP-AR5)

export const GHG_YEARS = [2018, 2019, 2020, 2021, 2022, 2023];

export const GAS_COLORS = {
    CO2:  '#ef4444',
    CH4:  '#f97316',
    N2O:  '#eab308',
    HFCs: '#8b5cf6',
    PFCs: '#06b6d4',
    SF6:  '#10b981',
};

// Summary table: total GHG by sector × gas (Gg CO2e)
export const GHG_SECTORS = [
    'Energy',
    'IPPU',
    'AFOLU',
    'Waste',
    'LULUCF',
];

export const GHG_SUMMARY_DATA = {
    2022: {
        Energy:  { CO2: 3820, CH4: 42,  N2O: 12,  HFCs: 0,  PFCs: 0,  SF6: 0.4  },
        IPPU:    { CO2: 1240, CH4: 0,   N2O: 0,   HFCs: 18, PFCs: 2,  SF6: 0.8  },
        AFOLU:   { CO2: -180, CH4: 560, N2O: 98,  HFCs: 0,  PFCs: 0,  SF6: 0    },
        Waste:   { CO2: 0,    CH4: 64,  N2O: 14,  HFCs: 0,  PFCs: 0,  SF6: 0    },
        LULUCF:  { CO2: -14200, CH4: 0, N2O: 0,  HFCs: 0,  PFCs: 0,  SF6: 0    },
    },
    2021: {
        Energy:  { CO2: 3520, CH4: 40,  N2O: 11,  HFCs: 0,   PFCs: 0,  SF6: 0.3  },
        IPPU:    { CO2: 1180, CH4: 0,   N2O: 0,   HFCs: 16,  PFCs: 1.8,SF6: 0.7  },
        AFOLU:   { CO2: -160, CH4: 540, N2O: 96,  HFCs: 0,   PFCs: 0,  SF6: 0    },
        Waste:   { CO2: 0,    CH4: 60,  N2O: 12,  HFCs: 0,   PFCs: 0,  SF6: 0    },
        LULUCF:  { CO2: -13800, CH4: 0, N2O: 0,  HFCs: 0,   PFCs: 0,  SF6: 0    },
    },
};

// Energy sector sub-categories (Gg CO2e)
export const ENERGY_SUBCATEGORIES = [
    { code: '1.A.1', label: 'Energy Industries',        value: 1820, change: +5.2 },
    { code: '1.A.2', label: 'Manufacturing & Mining',   value: 1240, change: +3.8 },
    { code: '1.A.3', label: 'Transport',                value: 620,  change: +9.4 },
    { code: '1.A.4', label: 'Other Sectors',            value: 140,  change: -1.2 },
    { code: '1.B',   label: 'Fugitive Emissions',       value: 0,    change:  0   },
];

// Trend — total GHG (excluding LULUCF) vs Net (including LULUCF) in Gg CO2e
export const GHG_TREND = [
    { year: 2018, gross: 5540, net: -8200, Energy: 3100, IPPU: 1020, AFOLU: 620, Waste: 120 },
    { year: 2019, gross: 5720, net: -8600, Energy: 3280, IPPU: 1080, AFOLU: 640, Waste: 130 },
    { year: 2020, gross: 5380, net: -8900, Energy: 3120, IPPU: 1020, AFOLU: 620, Waste: 118 },
    { year: 2021, gross: 5596, net: -9200, Energy: 3571, IPPU: 1196, AFOLU: 700, Waste: 129 },
    { year: 2022, gross: 5874, net: -9452, Energy: 3874, IPPU: 1261, AFOLU: 722, Waste: 142 },
    { year: 2023, gross: 6020, net: -9600, Energy: 3920, IPPU: 1310, AFOLU: 650, Waste: 140 },
];

// Pie breakdown gross (2022)
export const GHG_BY_SECTOR_PIE = [
    { name: 'Energy',  value: 3874,  fill: '#3b82f6' },
    { name: 'IPPU',    value: 1261,  fill: '#f59e0b' },
    { name: 'AFOLU',   value: 722,   fill: '#10b981' },
    { name: 'Waste',   value: 142,   fill: '#8b5cf6' },
];

export const GHG_KEY_INDICATORS = [
    { label: 'Gross Emissions (excl. LULUCF)', value: '5,874 Gg CO₂e', change: +4.9,  icon: 'flame'  },
    { label: 'Net Emissions (incl. LULUCF)',   value: '−9,452 Gg CO₂e', change: -2.7, icon: 'leaf'   },
    { label: 'Carbon Sink Strength',           value: '14,200 Gg CO₂e', change: +2.9, icon: 'tree'   },
    { label: 'Energy Sector Share',            value: '65.9%',           change: +0.4, icon: 'zap'    },
    { label: 'CH₄ Emissions',                  value: '666 Gg CO₂e',    change: +3.1, icon: 'gas'    },
    { label: 'N₂O Emissions',                  value: '124 Gg CO₂e',    change: +1.8, icon: 'wind'   },
];

// Full IPCC Annex table rows
export const IPCC_ROWS = [
    { code: '1',      label: 'ENERGY',                              level: 0, bold: true },
    { code: '1.A',    label: 'Fuel Combustion Activities',          level: 1 },
    { code: '1.A.1',  label: 'Energy Industries',                   level: 2, values: { CO2: 1820, CH4: 4, N2O: 1 } },
    { code: '1.A.2',  label: 'Manufacturing Industries & Mining',   level: 2, values: { CO2: 1240, CH4: 6, N2O: 2 } },
    { code: '1.A.3',  label: 'Transport',                           level: 2, values: { CO2: 620, CH4: 16, N2O: 6 } },
    { code: '1.A.4',  label: 'Other Sectors',                       level: 2, values: { CO2: 140, CH4: 16, N2O: 3 } },
    { code: '1.B',    label: 'Fugitive Emissions',                  level: 1, values: { CO2: 0, CH4: 0, N2O: 0 } },
    { code: '2',      label: 'INDUSTRIAL PROCESSES & PRODUCT USE',  level: 0, bold: true },
    { code: '2.A',    label: 'Mineral Industry',                    level: 1, values: { CO2: 1240, CH4: 0, N2O: 0 } },
    { code: '2.F',    label: 'Product Uses as Substitutes for ODS', level: 1, values: { CO2: 0, CH4: 0, N2O: 0 } },
    { code: '3',      label: 'AGRICULTURE, FORESTRY & OTHER LAND',  level: 0, bold: true },
    { code: '3.A',    label: 'Livestock',                           level: 1, values: { CO2: 0, CH4: 380, N2O: 48 } },
    { code: '3.C',    label: 'Aggregate sources — Agriculture',     level: 1, values: { CO2: 0, CH4: 180, N2O: 50 } },
    { code: '4',      label: 'WASTE',                               level: 0, bold: true },
    { code: '4.A',    label: 'Solid Waste Disposal',                level: 1, values: { CO2: 0, CH4: 44, N2O: 0 } },
    { code: '4.D',    label: 'Wastewater Treatment',                level: 1, values: { CO2: 0, CH4: 20, N2O: 14 } },
    { code: '5',      label: 'LULUCF',                              level: 0, bold: true, note: 'Carbon sink' },
    { code: '5.A',    label: 'Forest Land',                         level: 1, values: { CO2: -14200, CH4: 0, N2O: 0 } },
];
