// Dummy Energy Balance data (TJ) — Bhutan Reference Year 2022
// Structure follows IPCC/IEA energy balance format

export const YEARS = [2018, 2019, 2020, 2021, 2022, 2023];

export const ENERGY_CATEGORIES = [
    'Electricity',
    'POL',
    'Coal',
    'Fuelwood',
    'Biomass',
    'Solar',
    'Others',
];

// Energy supply & consumption table (TJ) — rows are flows, cols are carriers
export const ENERGY_BALANCE_ROWS = [
    // ── SUPPLY ────────────────────────────────────────────────────
    { id: 'indigenous', label: 'Indigenous Production', group: 'supply', bold: true },
    { id: 'imports',    label: 'Imports',               group: 'supply' },
    { id: 'exports',    label: 'Exports (−)',            group: 'supply', negative: true },
    { id: 'bunkers',    label: 'International Bunkers (−)', group: 'supply', negative: true },
    { id: 'stock',      label: 'Stock Changes',          group: 'supply' },
    { id: 'tpes',       label: 'Total Primary Energy Supply (TPES)', group: 'tpes', bold: true, divider: true },
    // ── TRANSFORMATION ────────────────────────────────────────────
    { id: 'elec_plants',label: 'Electricity Plants',    group: 'transform' },
    { id: 'heat_plants', label: 'CHP / Heat Plants',    group: 'transform' },
    { id: 'oil_ref',     label: 'Oil Refineries',       group: 'transform' },
    { id: 'coal_tf',     label: 'Coal Transfer / Coke', group: 'transform' },
    { id: 'losses',      label: 'Losses / Own Use',     group: 'transform' },
    // ── FINAL CONSUMPTION ─────────────────────────────────────────
    { id: 'tfc',         label: 'Total Final Consumption (TFC)', group: 'tfc', bold: true, divider: true },
    { id: 'industry',    label: 'Industry',             group: 'final' },
    { id: 'transport',   label: 'Transport',             group: 'final' },
    { id: 'residential', label: 'Residential',          group: 'final' },
    { id: 'commercial',  label: 'Commercial',            group: 'final' },
    { id: 'agriculture', label: 'Agriculture',           group: 'final' },
    { id: 'others_fc',   label: 'Others',                group: 'final' },
];

// Value matrix [rowId][category] in TJ
export const ENERGY_BALANCE_DATA = {
    2022: {
        indigenous: { Electricity: 52340, POL: 0,     Coal: 1800,  Fuelwood: 8500,  Biomass: 430,  Solar: 42,   Others: 0    },
        imports:    { Electricity: 1240,  POL: 18500,  Coal: 6200,  Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 120  },
        exports:    { Electricity: 39800, POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        bunkers:    { Electricity: 0,     POL: 280,    Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        stock:      { Electricity: 0,     POL: -320,   Coal: 150,   Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        tpes:       { Electricity: 13780, POL: 17900,  Coal: 8150,  Fuelwood: 8500,  Biomass: 430,  Solar: 42,   Others: 120  },
        elec_plants:{ Electricity: 0,     POL: 0,     Coal: -1200, Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        heat_plants:{ Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: -420,  Biomass: -180, Solar: 0,    Others: 0    },
        oil_ref:    { Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        coal_tf:    { Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        losses:     { Electricity: -1200, POL: -420,  Coal: -80,   Fuelwood: -200,  Biomass: -30,  Solar: -8,   Others: -20  },
        tfc:        { Electricity: 12580, POL: 17480,  Coal: 6870,  Fuelwood: 7880,  Biomass: 220,  Solar: 34,   Others: 100  },
        industry:   { Electricity: 6800,  POL: 1200,  Coal: 6200,  Fuelwood: 400,   Biomass: 0,    Solar: 0,    Others: 60   },
        transport:  { Electricity: 80,    POL: 13600,  Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        residential:{ Electricity: 2400,  POL: 480,   Coal: 480,   Fuelwood: 6000,  Biomass: 160,  Solar: 34,   Others: 20   },
        commercial: { Electricity: 2100,  POL: 900,   Coal: 190,   Fuelwood: 1200,  Biomass: 60,   Solar: 0,    Others: 20   },
        agriculture:{ Electricity: 580,   POL: 800,   Coal: 0,     Fuelwood: 180,   Biomass: 0,    Solar: 0,    Others: 0    },
        others_fc:  { Electricity: 620,   POL: 500,   Coal: 0,     Fuelwood: 100,   Biomass: 0,    Solar: 0,    Others: 0    },
    },
    2021: {
        indigenous: { Electricity: 48200, POL: 0,     Coal: 1650,  Fuelwood: 8700,  Biomass: 410,  Solar: 38,   Others: 0    },
        imports:    { Electricity: 1100,  POL: 16800,  Coal: 5900,  Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 100  },
        exports:    { Electricity: 36400, POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        bunkers:    { Electricity: 0,     POL: 200,    Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        stock:      { Electricity: 0,     POL: -200,   Coal: 100,   Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        tpes:       { Electricity: 12900, POL: 16400,  Coal: 7650,  Fuelwood: 8700,  Biomass: 410,  Solar: 38,   Others: 100  },
        elec_plants:{ Electricity: 0,     POL: 0,     Coal: -1100, Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        heat_plants:{ Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: -400,  Biomass: -160, Solar: 0,    Others: 0    },
        oil_ref:    { Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        coal_tf:    { Electricity: 0,     POL: 0,     Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        losses:     { Electricity: -1100, POL: -380,  Coal: -70,   Fuelwood: -190,  Biomass: -25,  Solar: -6,   Others: -18  },
        tfc:        { Electricity: 11800, POL: 16020,  Coal: 6480,  Fuelwood: 8110,  Biomass: 225,  Solar: 32,   Others: 82   },
        industry:   { Electricity: 6200,  POL: 1100,  Coal: 5900,  Fuelwood: 380,   Biomass: 0,    Solar: 0,    Others: 50   },
        transport:  { Electricity: 60,    POL: 12400,  Coal: 0,     Fuelwood: 0,     Biomass: 0,    Solar: 0,    Others: 0    },
        residential:{ Electricity: 2300,  POL: 460,   Coal: 390,   Fuelwood: 6200,  Biomass: 165,  Solar: 32,   Others: 18   },
        commercial: { Electricity: 1980,  POL: 860,   Coal: 190,   Fuelwood: 1280,  Biomass: 60,   Solar: 0,    Others: 14   },
        agriculture:{ Electricity: 560,   POL: 720,   Coal: 0,     Fuelwood: 150,   Biomass: 0,    Solar: 0,    Others: 0    },
        others_fc:  { Electricity: 700,   POL: 480,   Coal: 0,     Fuelwood: 100,   Biomass: 0,    Solar: 0,    Others: 0    },
    },
};

// Trend data for charts (TPES over years, TJ)
export const TPES_TREND = [
    { year: 2018, Electricity: 11200, POL: 14200, Coal: 6800,  Fuelwood: 9200,  Biomass: 380,  Solar: 22,   Others: 90   },
    { year: 2019, Electricity: 11800, POL: 15000, Coal: 7100,  Fuelwood: 9000,  Biomass: 390,  Solar: 28,   Others: 95   },
    { year: 2020, Electricity: 11400, POL: 12800, Coal: 6500,  Fuelwood: 8800,  Biomass: 400,  Solar: 32,   Others: 85   },
    { year: 2021, Electricity: 12900, POL: 16400, Coal: 7650,  Fuelwood: 8700,  Biomass: 410,  Solar: 38,   Others: 100  },
    { year: 2022, Electricity: 13780, POL: 17900, Coal: 8150,  Fuelwood: 8500,  Biomass: 430,  Solar: 42,   Others: 120  },
    { year: 2023, Electricity: 14200, POL: 18400, Coal: 8300,  Fuelwood: 8300,  Biomass: 450,  Solar: 58,   Others: 130  },
];

// Key indicators
export const KEY_INDICATORS = [
    { label: 'Total Primary Energy Supply', value: '48,922 TJ', change: +4.2, unit: 'TJ', icon: 'zap' },
    { label: 'Electricity Generation',      value: '52,340 TJ', change: +8.6, unit: 'TJ', icon: 'bolt' },
    { label: 'Electricity Exports',         value: '39,800 TJ', change: +7.4, unit: 'TJ', icon: 'export' },
    { label: 'POL Consumption (TPES)',      value: '17,900 TJ', change: +9.1, unit: 'TJ', icon: 'droplet' },
    { label: 'Fuelwood TPES',               value: '8,500 TJ',  change: -2.3, unit: 'TJ', icon: 'tree' },
    { label: 'Renewable Share (TPES)',       value: '46.8%',     change: +1.1, unit: '%',  icon: 'leaf' },
];

// Electricity generation breakdown
export const GENERATION_BREAKDOWN = [
    { name: 'Large Hydro',  value: 48200, color: '#3b82f6' },
    { name: 'Small Hydro',  value: 3100,  color: '#60a5fa' },
    { name: 'Solar PV',     value: 42,    color: '#f59e0b' },
    { name: 'Wind',         value: 0,     color: '#a3e635' },
    { name: 'DG Sets',      value: 8,     color: '#94a3b8' },
];

// Final consumption by sector (TJ)
export const TFC_BY_SECTOR = [
    { sector: 'Industry',    value: 14660, fill: '#6366f1' },
    { sector: 'Transport',   value: 13680, fill: '#f59e0b' },
    { sector: 'Residential', value: 9094,  fill: '#10b981' },
    { sector: 'Commercial',  value: 3210,  fill: '#06b6d4' },
    { sector: 'Agriculture', value: 1560,  fill: '#84cc16' },
    { sector: 'Others',      value: 1220,  fill: '#8b5cf6' },
];
