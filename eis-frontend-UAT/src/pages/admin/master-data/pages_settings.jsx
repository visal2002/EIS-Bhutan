// src/pages/admin/master-data/pages_settings.jsx
// All 15 Master Settings modules — each powered by MasterDataEngine.jsx
// Auto-code generation: first letters of each word in the name field.

import { 
    Hash, Plug, Car, Fuel, Flame, Sun, Factory, Ruler, Tag, 
    MapPin, Calendar, Database, Zap, Globe 
} from 'lucide-react';
import { generateCode } from '../../../utils/string';
import MasterDataPage from './MasterDataEngine';

// ── Shared column for status ──────────────────────────────────────
const STATUS_COL = { key: 'is_active', label: 'Status', type: 'status', width: '110px' };

// ── Shared code field with auto-generate hint ─────────────────────
const codeField = (key, label, nameKey) => ({
    key,
    label,
    type:      'code',
    required:  true,
    half:      true,
    hint:      `Auto-generated from ${nameKey} — or type your own`,
    autoCode:  nameKey,   // tells the engine which field to derive code from
    placeholder: 'e.g. ABC',
});

// Shared breadcrumbs for all settings modules
const SETTINGS_BREADCRUMBS = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Data Setting',    href: '/admin/master-data' },
    { label: 'Settings',       href: '/admin/master-data/settings' },
];

// ═══════════════════════════════════════════════════════════════════
// 1. CONVERSION UNITS
// ═══════════════════════════════════════════════════════════════════
export function ConversionUnits() {
    return <MasterDataPage config={{
        title:       'Conversion Units',
        singular:    'Unit',
        description: 'Units of measurement for energy conversion factors',
        icon:        Hash,
        api:         '/master-data/settings/conversion-units/',
        nameKey:     'unit_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'unit_code', label: 'Code',        type: 'code' },
            { key: 'unit_name', label: 'Unit Name' },
            { key: 'ipcc_code', label: 'IPCC Code',   muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('unit_code', 'Unit Code', 'unit_name'),
            {
                key: 'unit_name', label: 'Unit Name',
                placeholder: 'e.g. TJ/Gg', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A', required: false, half: true,
                hint: 'IPCC 2006 GL classification code',
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description of this unit…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 2. ELECTRICITY TYPES
// ═══════════════════════════════════════════════════════════════════
export function ElectricityTypes() {
    return <MasterDataPage config={{
        title:       'Electricity Types',
        singular:    'Type',
        description: 'Consumer type categories for electricity data collection',
        icon:        Plug,
        api:         '/master-data/settings/electricity-types/',
        nameKey:     'type_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'type_code', label: 'Code',      type: 'code' },
            { key: 'type_name', label: 'Type Name' },
            { key: 'ipcc_code', label: 'IPCC Code',   muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('type_code', 'Type Code', 'type_name'),
            {
                key: 'type_name', label: 'Type Name',
                placeholder: 'e.g. Residential', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A4b', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description…',
            },
        ],
    }} />;
}



// ═══════════════════════════════════════════════════════════════════
// 4. FUEL TYPES
// ═══════════════════════════════════════════════════════════════════
export function FuelTypes() {
    return <MasterDataPage config={{
        title:       'Fuel Types',
        singular:    'Fuel Type',
        description: 'Hierarchical energy supply types and sub-types used for data collection and reporting',
        icon:        Fuel,
        api:         '/master-data/settings/fuel-types/',
        nameKey:     'fuel_name',
        isTree:      true,
        parentKey:   'parent_fuel',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'fuel_code',     label: 'Code',          type: 'code',  width: '120px' },
            { key: 'fuel_name',     label: 'Fuel Name' },
            { key: 'fuel_category_display', label: 'Category',      type: 'badge', 
              badgeMap: {
                'Electricity':        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
                'POL':                'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
                'Coal':               'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
                'Biomass & Fuelwood': 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
                'Renewables':         'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
                'Others':             'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
              }
            },
            STATUS_COL,
        ],
        fields: [
            codeField('fuel_code', 'Fuel Code', 'fuel_name'),
            {
                key: 'fuel_name', label: 'Fuel Name',
                placeholder: 'e.g. Liquid Fuels', required: true, half: true,
            },
            {
                key: 'parent_fuel', label: 'Parent Category',
                type: 'api-select',
                apiUrl:   '/master-data/settings/fuel-types/dropdown/',
                apiLabel: 'fuel_name',
                apiValue: 'id',
                hint: 'Leave blank for top-level categories',
            },
            {
                key: 'fuel_category', label: 'Energy Category',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/energy-categories/dropdown/',
                apiLabel: 'category_name',
                apiValue: 'id',
                hint: 'Master group for reporting',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 5. VEHICLE FUEL TYPES
// ═══════════════════════════════════════════════════════════════════
export function VehicleFuelTypes() {
    return <MasterDataPage config={{
        title:       'Vehicle Fuel Types',
        singular:    'Vehicle Fuel Type',
        description: 'Fuel type options specific to transport vehicle mileage records',
        icon:        Fuel,
        api:         '/master-data/settings/vehicle-fuel-types/',
        nameKey:     'fuel_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'fuel_code',     label: 'Code',     type: 'code', width: '110px' },
            { key: 'fuel_name',     label: 'Fuel Name', width: '200px' },
            { key: 'ipcc_code',     label: 'IPCC Code', muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('fuel_code', 'Fuel Code', 'fuel_name'),
            {
                key: 'fuel_name', label: 'Fuel Name',
                placeholder: 'e.g. Petrol', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A3bi', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description of this transport fuel type…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 6. PRODUCTION TYPES
// ═══════════════════════════════════════════════════════════════════
export function ProductionTypes() {
    return <MasterDataPage config={{
        title:       'Production Types',
        singular:    'Production Type',
        description: 'Biogas production type classifications',
        icon:        Flame,
        api:         '/master-data/settings/production-types/',
        nameKey:     'type_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'type_code', label: 'Code',      type: 'code' },
            { key: 'type_name', label: 'Type Name' },
            { key: 'ipcc_code', label: 'IPCC Code',   muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('type_code', 'Type Code', 'type_name'),
            {
                key: 'type_name', label: 'Type Name',
                placeholder: 'e.g. Domestic', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A4b', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 7. PANEL TYPES
// ═══════════════════════════════════════════════════════════════════
export function PanelTypes() {
    return <MasterDataPage config={{
        title:       'Panel Types',
        singular:    'Panel Type',
        description: 'Solar panel technology types for solar energy size records',
        icon:        Sun,
        api:         '/master-data/settings/panel-types/',
        nameKey:     'type_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'type_code', label: 'Code',      type: 'code' },
            { key: 'type_name', label: 'Type Name' },
            { key: 'ipcc_code', label: 'IPCC Code',   muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('type_code', 'Type Code', 'type_name'),
            {
                key: 'type_name', label: 'Type Name',
                placeholder: 'e.g. Monocrystalline', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'e.g. High efficiency single-crystal silicon panels…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 8. INDUSTRY CATEGORIES
// ═══════════════════════════════════════════════════════════════════
export function IndustryCategories() {
    return <MasterDataPage config={{
        title:       'Industry Categories',
        singular:    'Category',
        description: 'Industry classification categories aligned with ISIC standards',
        icon:        Factory,
        api:         '/master-data/settings/industry-categories/',
        nameKey:     'category_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'category_code', label: 'Code',          type: 'code' },
            { key: 'category_name', label: 'Category Name' },
            { key: 'ipcc_code',     label: 'IPCC Code',     muted: true },
            { key: 'description',   label: 'Description',    muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('category_code', 'Category Code', 'category_name'),
            {
                key: 'category_name', label: 'Category Name',
                placeholder: 'e.g. Manufacturing', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A2', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'Brief description…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 9. MEASUREMENT UNITS
// ═══════════════════════════════════════════════════════════════════
export function MeasurementUnits() {
    return <MasterDataPage config={{
        title:       'Measurement Units',
        singular:    'Unit',
        description: 'Physical units for energy data collection used in Energy Supply carriers',
        icon:        Ruler,
        api:         '/master-data/settings/measurement-units/',
        nameKey:     'unit_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'unit_code', label: 'Code',      type: 'code' },
            { key: 'unit_name', label: 'Unit Name' },
            { key: 'ipcc_code', label: 'IPCC Code',   muted: true },
            { key: 'description', label: 'Description', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('unit_code', 'Unit Code', 'unit_name'),
            {
                key: 'unit_name', label: 'Unit Name',
                placeholder: 'e.g. Gigawatt-Hour', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'e.g. Unit for large-scale electricity measurement…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 10. ENERGY CATEGORIES
// ═══════════════════════════════════════════════════════════════════
export function EnergyCategories() {
    return <MasterDataPage config={{
        title:       'Energy Categories',
        singular:    'Category',
        description: 'Energy category groups for balance table and reports',
        icon:        Tag,
        api:         '/master-data/settings/energy-categories/',
        nameKey:     'category_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'category_code', label: 'Code',          type: 'code' },
            { key: 'category_name', label: 'Category Name' },
            { key: 'ipcc_code',     label: 'IPCC Code',     muted: true },
            { key: 'description',   label: 'Description',    muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('category_code', 'Category Code', 'category_name'),
            {
                key: 'category_name', label: 'Category Name',
                placeholder: 'e.g. Electricity', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A4b', required: false, half: true,
            },
            {
                key: 'description', label: 'Description', type: 'textarea',
                placeholder: 'e.g. Grid electricity including hydropower generation…',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 11. DZONGKHAGS
// ═══════════════════════════════════════════════════════════════════
export function Dzongkhags() {
    return <MasterDataPage config={{
        title:       'Dzongkhags',
        singular:    'Dzongkhag',
        description: 'District classifications for regional data analysis',
        icon:        MapPin,
        api:         '/master-data/settings/dzongkhags/',
        nameKey:     'dzongkhag',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        templateHeaders: ['dzongkhag_code', 'region_code', 'region', 'dzongkhag', 'iso_code', 'ipcc_code'],
        templateExample: '14,2,Western region,Thimphu,BT-15,BHU.THI',
        exportFields: ['dzongkhag_code', 'region_code', 'region', 'dzongkhag', 'iso_code', 'ipcc_code'],
        columns: [
            { key: 'dzongkhag_code', label: 'Code', type: 'code' },
            { key: 'region_code',    label: 'Region Code' },
            { key: 'region',         label: 'Region' },
            { key: 'dzongkhag',      label: 'Dzongkhag' },
            { key: 'iso_code',       label: 'ISO Code' },
            { key: 'ipcc_code',      label: 'IPCC Code', muted: true },
            STATUS_COL,
        ],
        fields: [
            {
                key: 'dzongkhag_code', label: 'Dzongkhag Code',
                type: 'text', placeholder: 'e.g. 14', required: true, half: true,
            },
            {
                key: 'dzongkhag', label: 'Dzongkhag Name',
                placeholder: 'e.g. Thimphu', required: true, half: true,
            },
            {
                key: 'region_code', label: 'Region Code',
                placeholder: 'e.g. 2', required: false, half: true,
            },
            {
                key: 'region', label: 'Region', type: 'select',
                options: [
                    { value: 'Eastern region', label: 'Eastern region' },
                    { value: 'Western region', label: 'Western region' },
                    { value: 'Unknown', label: 'Unknown' },
                ],
                required: false, half: true,
            },
            {
                key: 'iso_code', label: 'ISO Code',
                placeholder: 'e.g. BT-15', required: false, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. BHU.THI', required: false, half: true,
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 12. DATA YEARS
// ═══════════════════════════════════════════════════════════════════
export function DataYears() {
    return <MasterDataPage config={{
        title:       'Data Years',
        singular:    'Year',
        description: 'Calendar years available for data collection and reporting',
        icon:        Calendar,
        api:         '/master-data/settings/data-years/',
        nameKey:     'year',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'year',      label: 'Year', font: 'mono', weight: 'bold' },
            STATUS_COL,
        ],
        fields: [
            {
                key: 'year', label: 'Year', type: 'number',
                placeholder: 'e.g. 2026', required: true,
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 13. DATA SOURCES
// ═══════════════════════════════════════════════════════════════════
export function DataSources() {
    return <MasterDataPage config={{
        title:       'Data Sources',
        singular:    'Source',
        description: 'Entities and methods used to obtain energy data',
        icon:        Database,
        api:         '/master-data/settings/data-sources/',
        nameKey:     'source_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'source_code', label: 'Code', type: 'code' },
            { key: 'source_name', label: 'Source Name' },
            { key: 'source_type', label: 'Type' },
            { key: 'ipcc_code',   label: 'IPCC Code', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('source_code', 'Source Code', 'source_name'),
            {
                key: 'source_name', label: 'Source Name',
                placeholder: 'e.g. BPC Billing System', required: true, half: true,
            },
            {
                key: 'source_type', label: 'Source Type',
                placeholder: 'e.g. REPORT, API, SURVEY', required: true, half: true,
            },
            {
                key: 'organization', label: 'Organization',
                placeholder: 'e.g. Bhutan Power Corporation', required: false, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. BPC_BILL', required: false, half: true,
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 14. BPC CATEGORIES
// ═══════════════════════════════════════════════════════════════════
export function BPCCategories() {
    return <MasterDataPage config={{
        title:       'BPC Categories',
        singular:    'Category',
        description: 'BPC consumer categories for electricity billing mapping',
        icon:        Zap,
        api:         '/master-data/settings/bpc-categories/',
        nameKey:     'category_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'category_code', label: 'Code', type: 'code' },
            { key: 'category_name', label: 'Category Name' },
            { key: 'voltage_tier',  label: 'Voltage Tier' },
            { key: 'ipcc_code',     label: 'IPCC Code', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('category_code', 'Category Code', 'category_name'),
            {
                key: 'category_name', label: 'Category Name',
                placeholder: 'e.g. Urban Residential', required: true, half: true,
            },
            {
                key: 'voltage_tier', label: 'Voltage Tier',
                placeholder: 'e.g. LV, MV, HV', required: true, half: true,
            },
            {
                key: 'sort_order', label: 'Sort Order', type: 'number',
                placeholder: 'e.g. 1', required: false, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A4b', required: false, half: true,
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 15. GENERATION PLANTS
// ═══════════════════════════════════════════════════════════════════
export function GenerationPlants() {
    return <MasterDataPage config={{
        title:       'Generation Plants',
        singular:    'Plant',
        description: 'Electricity generation facilities across Bhutan',
        icon:        Factory,
        api:         '/master-data/settings/generation-plants/',
        nameKey:     'plant_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'plant_code', label: 'Code', type: 'code' },
            { key: 'plant_name', label: 'Plant Name' },
            { key: 'acronym', label: 'Acronym' },
            { key: 'plant_type', label: 'Plant Type' },
            { key: 'plant_subtype', label: 'Plant Subtype' },
            { key: 'plant_status', label: 'Plant Status' },
            { key: 'installed_capacity', label: 'Capacity', font: 'mono', width: '90px' },
            { key: 'owner', label: 'Owner', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('plant_code', 'Plant Code', 'plant_name'),
            {
                key: 'plant_name', label: 'Plant Name',
                placeholder: 'e.g. Chhukha Hydropower Plant', required: true, half: true,
            },
            {
                key: 'plant_status', label: 'Plant Status',
                placeholder: 'e.g. OPERATIONAL, PLANNED', required: false, half: true,
            },
            {
                key: 'acronym', label: 'Acronym',
                placeholder: 'e.g. CHP', required: false, half: true,
            },
            {
                key: 'plant_type', label: 'Plant Type',
                placeholder: 'e.g. HYDROPOWER', required: false, half: true,
            },
            {
                key: 'plant_subtype', label: 'Plant Subtype',
                placeholder: 'e.g. MEGA_HYDRO, SOLAR_GROUND', required: false, half: true,
            },
            {
                key: 'dzongkhag', label: 'Location (Dzongkhag)',
                type: 'api-select', required: false, half: true,
                apiUrl:   '/master-data/settings/dzongkhags/dropdown/',
                apiLabel: 'dzongkhag_name',
                apiValue: 'id',
            },
            {
                key: 'gewog', label: 'Gewog',
                placeholder: 'e.g. BJACHHO', required: false, half: true,
            },
            {
                key: 'village', label: 'Village',
                placeholder: 'e.g. Chapcha', required: false, half: true,
            },
            {
                key: 'installed_capacity', label: 'Installed Capacity', type: 'number',
                placeholder: 'e.g. 336.00', required: false, half: true,
            },
            {
                key: 'existing_energy_generation', label: 'Existing Energy Gen', type: 'number',
                placeholder: 'e.g. 1800.000', half: true,
            },
            {
                key: 'year_of_operation', label: 'Year of Operation', type: 'date', half: true,
            },
            {
                key: 'firm_power', label: 'Firm Power', type: 'number',
                placeholder: 'e.g. 120.000', half: true,
            },
            {
                key: 'ppa_signed', label: 'PPA Signed On', type: 'date', half: true,
            },
            {
                key: 'scheduled_delivery_date', label: 'Scheduled Delivery Date', type: 'date', half: true,
            },
            {
                key: 'actual_delivery_date', label: 'Actual Delivery Date', type: 'date', half: true,
            },
            {
                key: 'delay', label: 'Delay',
                placeholder: 'e.g. 6 YEARS', required: false, half: true,
            },
            {
                key: 'dpr_cost', label: 'DPR Cost', type: 'number', half: true,
            },
            {
                key: 'actual_cost_btn', label: 'Actual Cost (BTN)', type: 'number', half: true,
            },
            {
                key: 'actual_cost_usd', label: 'Actual Cost (USD)', type: 'number', half: true,
            },
            {
                key: 'idc', label: 'IDC', type: 'number', half: true,
            },
            {
                key: 'emission_reductions_pa', label: 'Emission Reductions PA', type: 'number', half: true,
            },
            {
                key: 'owner', label: 'Owner / Operator',
                placeholder: 'e.g. DGPC, BPC', required: false, half: true,
            },
            {
                key: 'no_of_units', label: 'Number of Units', type: 'number', half: true,
            },
            {
                key: 'grid_type', label: 'Grid Type', half: true,
            },
            {
                key: 'generator_type', label: 'Generator Type', half: true,
            },
            {
                key: 'construction_type', label: 'Construction Type', half: true,
            },
            {
                key: 'storage_size', label: 'Storage Size', type: 'number', half: true,
            },
            {
                key: 'system_type', label: 'System Type', half: true,
            },
            {
                key: 'set_numbers', label: 'Set Numbers', type: 'number', half: true,
            },
            {
                key: 'energy', label: 'Energy', type: 'number', half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1A1ai', required: false, half: true,
            },
            {
                key: 'remarks', label: 'Remarks', type: 'textarea',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// 16. COUNTRIES
// ═══════════════════════════════════════════════════════════════════
export function Countries() {
    return <MasterDataPage config={{
        title:       'Countries',
        singular:    'Country',
        description: 'International entities for trade and import/export analysis',
        icon:        Globe,
        api:         '/master-data/settings/countries/',
        nameKey:     'country_name',
        breadcrumbs: SETTINGS_BREADCRUMBS,
        columns: [
            { key: 'country_code', label: 'Code', type: 'code' },
            { key: 'country_name', label: 'Country Name' },
            { key: 'region',       label: 'Region' },
            { key: 'ipcc_code',    label: 'IPCC Code', muted: true },
            STATUS_COL,
        ],
        fields: [
            codeField('country_code', 'Country Code', 'country_name'),
            {
                key: 'country_name', label: 'Country Name',
                placeholder: 'e.g. India', required: true, half: true,
            },
            {
                key: 'region', label: 'Region',
                placeholder: 'e.g. SAARC', required: false, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. BHU.IND', required: false, half: true,
            },
            {
                key: 'is_import_source', label: 'Is Import Source?', type: 'checkbox',
                half: true,
            },
        ],
    }} />;
}
// ── Migrated Standard Master Data (17 Models) ─────────────────────────

export function ConsumerTypes() {
    const config = {
        title: 'Consumer Types',
        endpoint: '/master-data/settings/consumer-types/',
        templateHeaders: ['code', 'consumer_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Consumer Type Example,IPCC-123,true',
        exportFields: ['code', 'consumer_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Consumer Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'consumer_type', label: 'Consumer Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'consumer_type', label: 'Consumer Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function VoltageTypes() {
    const config = {
        title: 'Voltage Types',
        endpoint: '/master-data/settings/voltage-types/',
        templateHeaders: ['code', 'voltage_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Voltage Type Example,IPCC-123,true',
        exportFields: ['code', 'voltage_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Voltage Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'voltage_type', label: 'Voltage Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'voltage_type', label: 'Voltage Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function ConsumerGroups() {
    const config = {
        title: 'Consumer Groups',
        endpoint: '/master-data/settings/consumer-groups/',
        templateHeaders: ['code', 'consumer_group', 'ipcc_code', 'is_active'],
        templateExample: '1,Consumer Group Example,IPCC-123,true',
        exportFields: ['code', 'consumer_group', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Consumer Group', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'consumer_group', label: 'Consumer Group', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'consumer_group', label: 'Consumer Group', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function Locations() {
    const config = {
        title: 'Locations',
        endpoint: '/master-data/settings/locations/',
        templateHeaders: ['code', 'location', 'ipcc_code', 'is_active'],
        templateExample: '1,Location Example,IPCC-123,true',
        exportFields: ['code', 'location', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Location', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'location', label: 'Location', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'location', label: 'Location', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function ConductorTypes() {
    const config = {
        title: 'Conductor Types',
        endpoint: '/master-data/settings/conductor-types/',
        templateHeaders: ['code', 'conductor_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Conductor Type Example,IPCC-123,true',
        exportFields: ['code', 'conductor_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Conductor Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'conductor_type', label: 'Conductor Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'conductor_type', label: 'Conductor Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function UnitTypes() {
    const config = {
        title: 'Unit Types',
        endpoint: '/master-data/settings/unit-types/',
        templateHeaders: ['code', 'unit_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Unit Type Example,IPCC-123,true',
        exportFields: ['code', 'unit_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Unit Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'unit_type', label: 'Unit Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'unit_type', label: 'Unit Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function ConnectionTypes() {
    const config = {
        title: 'Connection Types',
        endpoint: '/master-data/settings/connection-types/',
        templateHeaders: ['code', 'connection_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Connection Type Example,IPCC-123,true',
        exportFields: ['code', 'connection_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Connection Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'connection_type', label: 'Connection Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'connection_type', label: 'Connection Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function PlantSizes() {
    const config = {
        title: 'Plant Sizes',
        endpoint: '/master-data/settings/plant-sizes/',
        templateHeaders: ['code', 'plant_size', 'ipcc_code', 'is_active'],
        templateExample: '1,Plant Size Example,IPCC-123,true',
        exportFields: ['code', 'plant_size', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Plant Size', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'plant_size', label: 'Plant Size', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'plant_size', label: 'Plant Size', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function GridTypes() {
    const config = {
        title: 'Grid Types',
        endpoint: '/master-data/settings/grid-types/',
        templateHeaders: ['code', 'grid_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Grid Type Example,IPCC-123,true',
        exportFields: ['code', 'grid_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Grid Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'grid_type', label: 'Grid Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'grid_type', label: 'Grid Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function ConfigurationTypes() {
    const config = {
        title: 'Configuration Types',
        endpoint: '/master-data/settings/configuration-types/',
        templateHeaders: ['code', 'configuration_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Configuration Type Example,IPCC-123,true',
        exportFields: ['code', 'configuration_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Configuration Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'configuration_type', label: 'Configuration Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'configuration_type', label: 'Configuration Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function LineCategories() {
    const config = {
        title: 'Line Categories',
        endpoint: '/master-data/settings/line-categories/',
        templateHeaders: ['code', 'line_category', 'ipcc_code', 'is_active'],
        templateExample: '1,Line Category Example,IPCC-123,true',
        exportFields: ['code', 'line_category', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Line Category', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'line_category', label: 'Line Category', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'line_category', label: 'Line Category', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function CircuitTypes() {
    const config = {
        title: 'Circuit Types',
        endpoint: '/master-data/settings/circuit-types/',
        templateHeaders: ['code', 'circuit_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Circuit Type Example,IPCC-123,true',
        exportFields: ['code', 'circuit_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Circuit Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'circuit_type', label: 'Circuit Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'circuit_type', label: 'Circuit Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function SubsidyTypes() {
    const config = {
        title: 'Subsidy Types',
        endpoint: '/master-data/settings/subsidy-types/',
        templateHeaders: ['code', 'subsidy_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Subsidy Type Example,IPCC-123,true',
        exportFields: ['code', 'subsidy_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Subsidy Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'subsidy_type', label: 'Subsidy Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'subsidy_type', label: 'Subsidy Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function TowerTypes() {
    const config = {
        title: 'Tower Types',
        endpoint: '/master-data/settings/tower-types/',
        templateHeaders: ['code', 'tower_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Tower Type Example,IPCC-123,true',
        exportFields: ['code', 'tower_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Tower Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'tower_type', label: 'Tower Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'tower_type', label: 'Tower Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function TransformerTypes() {
    const config = {
        title: 'Transformer Types',
        endpoint: '/master-data/settings/transformer-types/',
        templateHeaders: ['code', 'transformer_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Transformer Type Example,IPCC-123,true',
        exportFields: ['code', 'transformer_type', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Transformer Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'transformer_type', label: 'Transformer Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'transformer_type', label: 'Transformer Type', type: 'text', required: true },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function VoltageLevels() {
    const config = {
        title: 'Voltage Levels',
        endpoint: '/master-data/settings/voltage-levels/',
        templateHeaders: ['code', 'voltage_level', 'voltage_type', 'ipcc_code', 'is_active'],
        templateExample: '1,High Voltage,1,IPCC-123,true',
        exportFields: ['code', 'voltage_level', 'voltage_type_name', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Voltage Level', 'Voltage Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'voltage_level', label: 'Voltage Level', sortable: true },
            { key: 'voltage_type_name', label: 'Voltage Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'voltage_level', label: 'Voltage Level', type: 'text', required: true },
            { name: 'voltage_type', label: 'Voltage Type', type: 'select', endpoint: '/master-data/settings/voltage-types/dropdown/', required: false },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}

export function ConsumerSubtypes() {
    const config = {
        title: 'Consumer Subtypes',
        endpoint: '/master-data/settings/consumer-subtypes/',
        templateHeaders: ['code', 'consumer_subtype', 'consumer_type', 'location', 'voltage_type', 'ipcc_code', 'is_active'],
        templateExample: '1,Residential Subtype,1,1,1,IPCC-123,true',
        exportFields: ['code', 'consumer_subtype', 'consumer_type_name', 'location_name', 'voltage_type_name', 'ipcc_code', 'is_active'],
        exportHeaders: ['Code', 'Consumer Subtype', 'Consumer Type', 'Location', 'Voltage Type', 'IPCC Code', 'Is Active'],
        columns: [
            { key: 'code', label: 'Code', sortable: true },
            { key: 'consumer_subtype', label: 'Consumer Subtype', sortable: true },
            { key: 'consumer_type_name', label: 'Consumer Type', sortable: true },
            { key: 'location_name', label: 'Location', sortable: true },
            { key: 'voltage_type_name', label: 'Voltage Type', sortable: true },
            { key: 'ipcc_code', label: 'IPCC Code', sortable: true },
            { key: 'is_active', label: 'Status', type: 'boolean' }
        ],
        fields: [
            { name: 'code', label: 'Code', type: 'text', required: true },
            { name: 'consumer_subtype', label: 'Consumer Subtype', type: 'text', required: true },
            { name: 'consumer_type', label: 'Consumer Type', type: 'select', endpoint: '/master-data/settings/consumer-types/dropdown/', required: false },
            { name: 'location', label: 'Location', type: 'select', endpoint: '/master-data/settings/locations/dropdown/', required: false },
            { name: 'voltage_type', label: 'Voltage Type', type: 'select', endpoint: '/master-data/settings/voltage-types/dropdown/', required: false },
            { name: 'ipcc_code', label: 'IPCC Code', type: 'text' },
            { name: 'is_active', label: 'Is Active', type: 'checkbox', defaultValue: true }
        ]
    };
    return <MasterDataPage config={config} />;
}
