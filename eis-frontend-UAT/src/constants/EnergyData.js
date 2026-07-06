/**
 * Bhutan Energy Data in Tonnes of Oil Equivalent (TOE)
 * Sources:
 *   - 2022: EDD Calculation 2022 Master file.xlsx » TOE (Number format)
 *   - 2016: EDD Calculation July 2016 Master File.xlsx » 20. Energy Balance (TOE)
 *
 * Sankey flow: Primary Sources → Energy Carriers → Consumption Sectors
 */

export const energyData = {
    2022: {
        nodes: [
            // --- Stage 1: Origin (Supply) ---
            { id: 'Domestic Production', category: 'supply' },
            { id: 'Imports', category: 'supply' },

            // --- Stage 2: Primary Sources ---
            { id: 'Hydro', category: 'source' },
            { id: 'Coal', category: 'source' },
            { id: 'Solar/Renewables', category: 'source' },
            { id: 'Biomass', category: 'source' },
            { id: 'Petroleum (Imported)', category: 'source' },

            // --- Stage 3: Transformation / Grid ---
            { id: 'Electricity Grid', category: 'transformation' },
            { id: 'Coal Processing', category: 'transformation' },
            { id: 'Petroleum Distribution', category: 'transformation' },
            { id: 'Biomass Processing', category: 'transformation' },

            // --- Stage 4: Final Consumption & Exports ---
            { id: 'Residential', category: 'consumption' },
            { id: 'Commercial', category: 'consumption' },
            { id: 'Industry', category: 'consumption' },
            { id: 'Transport', category: 'consumption' },
            { id: 'Other Sectors', category: 'consumption' },
            { id: 'Exports', category: 'consumption' },
            { id: 'Losses / Stock Adj.', category: 'consumption' },
        ],
        links: [
            // Stage 1 -> Stage 2 (Origin -> Primary Source)
            { source: 'Domestic Production', target: 'Hydro', value: 296252 },
            { source: 'Domestic Production', target: 'Coal', value: 60262 },
            { source: 'Domestic Production', target: 'Solar/Renewables', value: 44 },
            { source: 'Domestic Production', target: 'Biomass', value: 100617 },
            { source: 'Imports', target: 'Coal', value: 17780 },
            { source: 'Imports', target: 'Petroleum (Imported)', value: 130000 },
            { source: 'Imports', target: 'Hydro', value: 5600 }, // Import from grid

            // Stage 2 -> Stage 3 (Primary Source -> Transformation)
            { source: 'Hydro', target: 'Electricity Grid', value: 301852 },
            { source: 'Solar/Renewables', target: 'Electricity Grid', value: 44 },
            { source: 'Coal', target: 'Coal Processing', value: 78042 },
            { source: 'Biomass', target: 'Biomass Processing', value: 100617 },
            { source: 'Petroleum (Imported)', target: 'Petroleum Distribution', value: 130000 },

            // Stage 3 -> Stage 4 (Transformation -> Final Use/Export)
            // Electricity Grid
            { source: 'Electricity Grid', target: 'Exports', value: 200452 }, // Hydro export
            { source: 'Electricity Grid', target: 'Residential', value: 28498 },
            { source: 'Electricity Grid', target: 'Commercial', value: 12937 },
            { source: 'Electricity Grid', target: 'Industry', value: 20452 }, // Adjusted for balancing
            { source: 'Electricity Grid', target: 'Transport', value: 490 },
            { source: 'Electricity Grid', target: 'Other Sectors', value: 16500 },
            { source: 'Electricity Grid', target: 'Losses / Stock Adj.', value: 22523 },

            // Coal Processing
            { source: 'Coal Processing', target: 'Industry', value: 65026 },
            { source: 'Coal Processing', target: 'Commercial', value: 13000 },
            { source: 'Coal Processing', target: 'Losses / Stock Adj.', value: 16 },

            // Petroleum Distribution
            { source: 'Petroleum Distribution', target: 'Transport', value: 33266 },
            { source: 'Petroleum Distribution', target: 'Industry', value: 4169 },
            { source: 'Petroleum Distribution', target: 'Residential', value: 14393 },
            { source: 'Petroleum Distribution', target: 'Commercial', value: 5100 },
            { source: 'Petroleum Distribution', target: 'Losses / Stock Adj.', value: 73072 },

            // Biomass Processing
            { source: 'Biomass Processing', target: 'Residential', value: 82172 },
            { source: 'Biomass Processing', target: 'Commercial', value: 15878 },
            { source: 'Biomass Processing', target: 'Industry', value: 2567 },
        ],
        energyMix: [
            { name: 'Hydro', value: 301852, color: '#3e6c7e' },
            { name: 'Coal', value: 78042, color: '#374151' },
            { name: 'Biomass', value: 100617, color: '#8c7746' },
            { name: 'Petroleum', value: 130000, color: '#b45309' },
            { name: 'Solar/Renewables', value: 44, color: '#eab308' },
        ],
        consumptionMix: [
            { name: 'Industry', value: 92214, color: '#7c3aed' },
            { name: 'Residential', value: 125063, color: '#6366f1' },
            { name: 'Commercial', value: 46915, color: '#8b5cf6' },
            { name: 'Transport', value: 33756, color: '#b45309' },
            { name: 'Other Sectors', value: 16500, color: '#94a3b8' },
            { name: 'Exports', value: 200452, color: '#f43f5e' },
            { name: 'Losses / Stock Adj.', value: 95611, color: '#cbd5e1' },
        ],
    },

    2016: {
        nodes: [
            // --- Stage 1: Origin (Supply) ---
            { id: 'Domestic Production', category: 'supply' },
            { id: 'Imports', category: 'supply' },

            // --- Stage 2: Primary Sources ---
            { id: 'Hydro', category: 'source' },
            { id: 'Coal', category: 'source' },
            { id: 'Solar/Renewables', category: 'source' },
            { id: 'Biomass', category: 'source' },
            { id: 'Petroleum (Imported)', category: 'source' },

            // --- Stage 3: Transformation / Grid ---
            { id: 'Electricity Grid', category: 'transformation' },
            { id: 'Coal Processing', category: 'transformation' },
            { id: 'Petroleum Distribution', category: 'transformation' },
            { id: 'Biomass Processing', category: 'transformation' },

            // --- Stage 4: Final Consumption & Exports ---
            { id: 'Residential', category: 'consumption' },
            { id: 'Commercial', category: 'consumption' },
            { id: 'Industry', category: 'consumption' },
            { id: 'Transport', category: 'consumption' },
            { id: 'Other Sectors', category: 'consumption' },
            { id: 'Exports', category: 'consumption' },
            { id: 'Losses / Stock Adj.', category: 'consumption' },
        ],
        links: [
            // Stage 1 -> Stage 2 (Origin -> Primary Source)
            { source: 'Domestic Production', target: 'Hydro', value: 218000 },
            { source: 'Domestic Production', target: 'Coal', value: 47200 },
            { source: 'Domestic Production', target: 'Solar/Renewables', value: 8 },
            { source: 'Domestic Production', target: 'Biomass', value: 84693 },
            { source: 'Imports', target: 'Coal', value: 102030 },
            { source: 'Imports', target: 'Petroleum (Imported)', value: 97500 },
            { source: 'Imports', target: 'Hydro', value: 4500 },

            // Stage 2 -> Stage 3 (Primary Source -> Transformation)
            { source: 'Hydro', target: 'Electricity Grid', value: 222500 },
            { source: 'Solar/Renewables', target: 'Electricity Grid', value: 8 },
            { source: 'Coal', target: 'Coal Processing', value: 149230 },
            { source: 'Biomass', target: 'Biomass Processing', value: 84693 },
            { source: 'Petroleum (Imported)', target: 'Petroleum Distribution', value: 97500 },

            // Stage 3 -> Stage 4 (Transformation -> Final Use/Export)
            // Electricity Grid
            { source: 'Electricity Grid', target: 'Exports', value: 161979 },
            { source: 'Electricity Grid', target: 'Residential', value: 18800 },
            { source: 'Electricity Grid', target: 'Commercial', value: 9227 },
            { source: 'Electricity Grid', target: 'Industry', value: 15390 },
            { source: 'Electricity Grid', target: 'Transport', value: 52 },
            { source: 'Electricity Grid', target: 'Other Sectors', value: 10000 },
            { source: 'Electricity Grid', target: 'Losses / Stock Adj.', value: 7060 },

            // Coal Processing
            { source: 'Coal Processing', target: 'Industry', value: 74200 },
            { source: 'Coal Processing', target: 'Commercial', value: 10000 },
            { source: 'Coal Processing', target: 'Losses / Stock Adj.', value: 65030 },

            // Petroleum Distribution
            { source: 'Petroleum Distribution', target: 'Transport', value: 28900 },
            { source: 'Petroleum Distribution', target: 'Industry', value: 3200 },
            { source: 'Petroleum Distribution', target: 'Residential', value: 10300 },
            { source: 'Petroleum Distribution', target: 'Commercial', value: 4100 },
            { source: 'Petroleum Distribution', target: 'Losses / Stock Adj.', value: 51000 },

            // Biomass Processing
            { source: 'Biomass Processing', target: 'Residential', value: 66500 },
            { source: 'Biomass Processing', target: 'Commercial', value: 11200 },
            { source: 'Biomass Processing', target: 'Industry', value: 6993 },
        ],
        energyMix: [
            { name: 'Hydro', value: 222500, color: '#3e6c7e' },
            { name: 'Coal', value: 149230, color: '#374151' },
            { name: 'Biomass', value: 84693, color: '#8c7746' },
            { name: 'Petroleum', value: 97500, color: '#b45309' },
            { name: 'Solar/Renewables', value: 8, color: '#eab308' },
        ],
        consumptionMix: [
            { name: 'Industry', value: 99783, color: '#7c3aed' },
            { name: 'Residential', value: 95600, color: '#6366f1' },
            { name: 'Commercial', value: 34527, color: '#8b5cf6' },
            { name: 'Transport', value: 28952, color: '#b45309' },
            { name: 'Other Sectors', value: 10000, color: '#94a3b8' },
            { name: 'Exports', value: 161979, color: '#f43f5e' },
            { name: 'Losses / Stock Adj.', value: 123090, color: '#cbd5e1' },
        ],
    },
};

export const availableYears = Object.keys(energyData).map(Number).sort();