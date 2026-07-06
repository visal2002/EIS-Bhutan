// src/pages/admin/master-data/EnergySupplyPage.jsx
import MasterDataEngine from './MasterDataEngine';
import { GitBranch } from 'lucide-react';

/**
 * ── ENERGY SUPPLY MODULE ──────────────────────────────────────────
 * High-density hierarchical registry for all energy carriers.
 * Powered by MasterDataEngine.
 * ──────────────────────────────────────────────────────────────────
 */
export default function EnergySupplyPage() {
    return (
        <MasterDataEngine 
            config={{
                title:       'Energy Supply',
                singular:    'Register',
                description: 'Hierarchical energy carrier registry — Root → Sub-type → Detail',
                icon:        GitBranch,
                api:         '/master-data/energy-supply/',
                nameKey:     'supply_name',
                isTree:      true,
                parentKey:   'parent_supply',
                columns: [
                    { key: 'supply_code',      label: 'Code',            type: 'code' },
                    { key: 'supply_name',      label: 'Supply Name' },
                    { 
                        key: 'energy_category_display', 
                        label: 'Category',        
                        type: 'badge',
                        badgeMap: {
                            'Electricity':        'bg-cyan-50 text-cyan-700 border-cyan-200',
                            'POL':                'bg-orange-50 text-orange-700 border-orange-200',
                            'Coal':               'bg-slate-100 text-slate-700 border-slate-300',
                            'Biomass & Fuelwood': 'bg-green-50 text-green-700 border-green-200',
                            'Renewables':         'bg-yellow-50 text-yellow-700 border-yellow-200',
                            'Others':             'bg-violet-50 text-violet-700 border-violet-200',
                        }
                    },
                    { key: 'measurement_unit', label: 'Unit',            type: 'code' },
                    { key: 'fuel_type',         label: 'Fuel Type',       type: 'code' },
                    { key: 'ipcc_code',         label: 'IPCC Code' },
                    { key: 'is_active',         label: 'Status',          type: 'status' },
                ],
                fields: [
                    { 
                        key: 'supply_code', label: 'Supply Code', type: 'code', 
                        required: true, half: true, placeholder: 'e.g. ELC-HYD',
                        hint: 'Unique system identifier' 
                    },
                    { 
                        key: 'supply_name', label: 'Supply Name', 
                        required: true, half: true, placeholder: 'e.g. Hydropower' 
                    },
                    {
                        key: 'parent_supply', label: 'Parent Supply', 
                        type: 'api-select',
                        apiUrl:   '/master-data/energy-supply/dropdown/', 
                        apiLabel: 'supply_name', 
                        apiValue: 'id',
                        hint: 'Leave blank for root level carriers',
                    },
                    { 
                        key: 'measurement_unit', label: 'Measurement Unit', 
                        type: 'api-select',
                        apiUrl:   '/master-data/settings/measurement-units/dropdown/', 
                        apiLabel: 'unit_name', 
                        apiValue: 'unit_code',
                        required: true, half: true,
                        hint: 'Base unit for data collection' 
                    },
                    { 
                        key: 'energy_category', label: 'Energy Category', 
                        type: 'api-select', required: true, half: true,
                        apiUrl:   '/master-data/settings/energy-categories/dropdown/',
                        apiLabel: 'category_name',
                        apiValue: 'id',
                        hint: 'Manage categories in Master Settings',
                    },
                    { 
                        key: 'fuel_type', label: 'Fuel Type Mapping', 
                        type: 'api-select',
                        apiUrl:   '/master-data/settings/fuel-types/dropdown/', 
                        apiLabel: 'fuel_name', 
                        apiValue: 'fuel_code',
                        half: true,
                        hint: 'Link to global fuel type classification' 
                    },
                    { 
                        key: 'ipcc_code', label: 'IPCC Code', 
                        type: 'text', half: true,
                        placeholder: 'e.g. 1.A.1, 2.B.4',
                        hint: 'IPCC 2006 GL classification code'
                    },
                    { 
                        key: 'description', label: 'Technical Description', 
                        type: 'textarea', placeholder: 'Specifications, scope, and exclusions…' 
                    },
                    { key: 'is_active', label: 'Active', type: 'checkbox', default: true },
                ],
            }} 
        />
    );
}
