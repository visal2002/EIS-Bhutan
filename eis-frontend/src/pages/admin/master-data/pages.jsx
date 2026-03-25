// src/pages/admin/master-data/pages.jsx
//
// All 9 master-data modules — each is ONE config object + ONE export line.
// All UI is in MasterDataEngine.jsx. Nothing here needs to change for UI fixes.
//
// HOW TO ADD A NEW MODULE:
//   1. Add a config object below
//   2. Add: export const MyModule = () => <MasterDataPage config={myConfig} />;
//   3. Add the route in App.jsx
//   4. Add backend url + view (copy the pattern from views.py)
//
// HOW TO ADD A FIELD TO AN EXISTING MODULE:
//   1. Find the module's config
//   2. Add one entry to fields[]  — see FieldDef types at top of MasterDataEngine.jsx
//   3. Optionally add to columns[] if you want it visible in the table

import {
    Zap, Hash, LayoutGrid, Plug, Car,
    Gauge, Flame, Sun, Factory,
} from 'lucide-react';
import MasterDataPage from './MasterDataEngine';
import SectorsPage     from './SectorsPage';

// ─── Reusable badge colour maps ───────────────────────────────────
// key = API enum value  |  value = Tailwind classes for the badge pill

const BADGE = {
    // Electricity category types
    RESIDENTIAL: 'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/20   dark:text-blue-300   dark:border-blue-700',
    COMMERCIAL:  'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-700',
    INDUSTRIAL:  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
    PUBLIC:      'bg-teal-50   text-teal-700   border-teal-200   dark:bg-teal-900/20   dark:text-teal-300   dark:border-teal-700',

    // Vehicle categories
    LIGHT:   'bg-green-50  text-green-700  border-green-200  dark:bg-green-900/20  dark:text-green-300  dark:border-green-700',
    MEDIUM:  'bg-amber-50  text-amber-700  border-amber-200  dark:bg-amber-900/20  dark:text-amber-300  dark:border-amber-700',
    HEAVY:   'bg-red-50    text-red-700    border-red-200    dark:bg-red-900/20    dark:text-red-300    dark:border-red-700',
    SPECIAL: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-700',

    // Fuel types
    PETROL:   'bg-red-50    text-red-700    border-red-200    dark:bg-red-900/20    dark:text-red-300    dark:border-red-700',
    DIESEL:   'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
    CNG:      'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/20   dark:text-blue-300   dark:border-blue-700',
    ELECTRIC: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-700',

    // Biogas production types
    DOMESTIC:   'bg-green-50  text-green-700  border-green-200  dark:bg-green-900/20  dark:text-green-300  dark:border-green-700',
    // INDUSTRIAL and COMMERCIAL already defined above

    // Industry categories
    MANUFACTURING: 'bg-blue-50   text-blue-700   border-blue-200   dark:bg-blue-900/20   dark:text-blue-300   dark:border-blue-700',
    MINING:        'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-700',
    CONSTRUCTION:  'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-700',
    OTHERS:        'bg-slate-100 text-slate-600  border-slate-200  dark:bg-slate-700    dark:text-slate-300  dark:border-slate-600',
};

// Shared status column (same for every module)
const STATUS_COL = { key: 'is_active', label: 'Status', type: 'status', width: '110px' };


// ═══════════════════════════════════════════════════════════════════
// 1. ENERGY SUPPLY
//    Model: EnergySupply
//    API:   /api/master-data/energy-supply/
// ═══════════════════════════════════════════════════════════════════
const energySupplyConfig = {
    title:       'Energy Supply',
    singular:    'Carrier',
    description: 'Primary energy carriers used across all data collection modules',
    icon:        Zap,
    api:         '/master-data/energy-supply/',
    nameKey:     'supply_name',
    columns: [
        { key: 'supply_code', label: 'Code',        type: 'code',  width: '110px' },
        { key: 'supply_name', label: 'Supply Name' },
        { key: 'description', label: 'Description', muted: true },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'supply_code', label: 'Supply Code', type: 'code',
            placeholder: 'e.g. ELC', required: true, half: true,
            hint: '2–10 uppercase letters or numbers',
        },
        {
            key: 'supply_name', label: 'Supply Name',
            placeholder: 'e.g. Electricity', required: true, half: true,
        },
        {
            key: 'description', label: 'Description', type: 'textarea',
            placeholder: 'Brief description of this energy carrier…',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 2. CONVERSION FACTORS
//    Model: ConversionFactor  (FK → EnergySupply)
//    API:   /api/master-data/conversion-factors/
// ═══════════════════════════════════════════════════════════════════
const conversionFactorsConfig = {
    title:       'Conversion Factors',
    singular:    'Factor',
    description: 'Energy conversion factors (TOE / GJ / TJ) used in GHG and balance calculations',
    icon:        Hash,
    api:         '/master-data/conversion-factors/',
    nameKey:     'unit',
    columns: [
        { key: 'energy_supply_name', label: 'Energy Supply' },
        {
            key: 'conversion_factor', label: 'Factor', width: '130px',
            render: item => (
                <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {item.conversion_factor}
                </span>
            ),
        },
        {
            key: 'unit', label: 'Unit', width: '120px',
            render: item => (
                <span className="font-mono text-xs font-medium px-2.5 py-0.5 rounded-md
                    bg-blue-50 text-blue-700 border border-blue-200
                    dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-700">
                    {item.unit}
                </span>
            ),
        },
        { key: 'effective_date', label: 'Effective Date', type: 'date', width: '130px' },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'energy_supply', label: 'Energy Supply', type: 'api-select', required: true,
            apiUrl:   '/master-data/energy-supply/dropdown/',
            apiLabel: 'supply_name',
            apiValue: 'id',
            hint: 'Select the energy carrier this factor applies to',
        },
        {
            key: 'unit', label: 'Unit', required: true, half: true,
            placeholder: 'e.g. TJ/Gg',
            hint: 'e.g. TJ/Gg · GJ/tonne · MJ/litre',
        },
        {
            key: 'conversion_factor', label: 'Factor Value', type: 'number',
            placeholder: '0.00000000', required: true, half: true,
        },
        {
            key: 'effective_date', label: 'Effective Date', type: 'date',
            required: true, half: true,
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 3. SECTORS
//    Model: Sector  (self-FK → parent_sector)
//    API:   /api/master-data/sectors/
// ═══════════════════════════════════════════════════════════════════
const sectorsConfig = {
    title:       'Sectors',
    singular:    'Sector',
    description: 'Energy sectors and sub-sectors for data classification across all modules',
    icon:        LayoutGrid,
    api:         '/master-data/sectors/',
    nameKey:     'sector_name',
    columns: [
        { key: 'sector_code',        label: 'Code',         type: 'code', width: '110px' },
        { key: 'sector_name',        label: 'Sector Name' },
        { key: 'parent_sector_name', label: 'Parent Sector', muted: true },
        {
            key: 'sub_sector_count', label: 'Sub-sectors', width: '100px',
            render: item => (
                <span className="inline-block text-xs font-bold px-2.5 py-1 rounded-full
                    bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {item.sub_sector_count ?? 0}
                </span>
            ),
        },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'sector_code', label: 'Sector Code', type: 'code',
            placeholder: 'e.g. ELEC', required: true, half: true,
        },
        {
            key: 'sector_name', label: 'Sector Name',
            placeholder: 'e.g. Electricity', required: true, half: true,
        },
        {
            key: 'parent_sector', label: 'Parent Sector', type: 'api-select',
            apiUrl:   '/master-data/sectors/dropdown/',
            apiLabel: 'sector_name',
            apiValue: 'id',
            hint: 'Leave blank to create a top-level sector',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 4. ELECTRICITY CATEGORIES
//    Model: ElectricityCategory  (FK → Sector)
//    API:   /api/master-data/electricity-categories/
// ═══════════════════════════════════════════════════════════════════
const electricityCategoriesConfig = {
    title:       'Electricity Categories',
    singular:    'Category',
    description: 'Consumer categories for electricity data collection and reporting',
    icon:        Plug,
    api:         '/master-data/electricity-categories/',
    nameKey:     'category_name',
    columns: [
        { key: 'category_code', label: 'Code',     type: 'code',  width: '100px' },
        { key: 'category_name', label: 'Category' },
        { key: 'sector_name',   label: 'Sector',   muted: true },
        { key: 'category_type', label: 'Type',     type: 'badge', width: '130px', badgeMap: BADGE },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'category_code', label: 'Category Code', type: 'code',
            placeholder: 'e.g. RES', required: true, half: true,
        },
        {
            key: 'category_name', label: 'Category Name',
            placeholder: 'e.g. Residential', required: true, half: true,
        },
        {
            key: 'category_type', label: 'Category Type', type: 'select', required: true,
            options: [
                { value: '',             label: 'Select type…' },
                { value: 'RESIDENTIAL',  label: 'Residential' },
                { value: 'COMMERCIAL',   label: 'Commercial' },
                { value: 'INDUSTRIAL',   label: 'Industrial' },
                { value: 'PUBLIC',       label: 'Public' },
            ],
        },
        {
            key: 'sector', label: 'Sector', type: 'api-select', required: true,
            apiUrl:   '/master-data/sectors/dropdown/',
            apiLabel: 'sector_name',
            apiValue: 'id',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 5. VEHICLE TYPES
//    Model: VehicleType
//    API:   /api/master-data/vehicle-types/
// ═══════════════════════════════════════════════════════════════════
const vehicleTypesConfig = {
    title:       'Vehicle Types',
    singular:    'Vehicle Type',
    description: 'Vehicle classifications for transport fuel data collection',
    icon:        Car,
    api:         '/master-data/vehicle-types/',
    nameKey:     'vehicle_type_name',
    columns: [
        { key: 'vehicle_type_code', label: 'Code',          type: 'code',  width: '100px' },
        { key: 'vehicle_type_name', label: 'Vehicle Type' },
        { key: 'vehicle_category',  label: 'Category',      type: 'badge', width: '100px', badgeMap: BADGE },
        { key: 'gross_weight_min',  label: 'Min Wt (kg)',   muted: true,   width: '110px' },
        { key: 'gross_weight_max',  label: 'Max Wt (kg)',   muted: true,   width: '110px' },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'vehicle_type_code', label: 'Type Code', type: 'code',
            placeholder: 'e.g. LCV', required: true, half: true,
        },
        {
            key: 'vehicle_type_name', label: 'Type Name',
            placeholder: 'e.g. Light Commercial Vehicle', required: true, half: true,
        },
        {
            key: 'vehicle_category', label: 'Category', type: 'select', required: true,
            options: [
                { value: '',        label: 'Select category…' },
                { value: 'LIGHT',   label: 'Light' },
                { value: 'MEDIUM',  label: 'Medium' },
                { value: 'HEAVY',   label: 'Heavy' },
                { value: 'SPECIAL', label: 'Special' },
            ],
        },
        {
            key: 'gross_weight_min', label: 'Min Weight (kg)', type: 'number',
            placeholder: '0',    half: true,
        },
        {
            key: 'gross_weight_max', label: 'Max Weight (kg)', type: 'number',
            placeholder: '3500', half: true,
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 6. MILEAGE
//    Model: Mileage  (FK → VehicleType)
//    API:   /api/master-data/mileage/
// ═══════════════════════════════════════════════════════════════════
const mileageConfig = {
    title:       'Mileage',
    singular:    'Mileage Record',
    description: 'Vehicle mileage rates by vehicle type, fuel type, and effective year',
    icon:        Gauge,
    api:         '/master-data/mileage/',
    nameKey:     'vehicle_type_name',
    columns: [
        { key: 'vehicle_type_name', label: 'Vehicle Type' },
        { key: 'fuel_type',         label: 'Fuel Type',      type: 'badge',  width: '100px', badgeMap: BADGE },
        { key: 'mileage_kmpl',      label: 'Mileage (km/L)', type: 'number', width: '130px' },
        { key: 'effective_year',    label: 'Year',            muted: true,    width: '80px'  },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', required: true,
            apiUrl:   '/master-data/vehicle-types/dropdown/',
            apiLabel: 'vehicle_type_name',
            apiValue: 'id',
        },
        {
            key: 'fuel_type', label: 'Fuel Type', type: 'select', required: true,
            options: [
                { value: '',         label: 'Select fuel type…' },
                { value: 'PETROL',   label: 'Petrol' },
                { value: 'DIESEL',   label: 'Diesel' },
                { value: 'CNG',      label: 'CNG' },
                { value: 'ELECTRIC', label: 'Electric' },
            ],
        },
        {
            key: 'mileage_kmpl', label: 'Mileage (km/L)', type: 'number',
            placeholder: '15.0', required: true, half: true,
            hint: 'Kilometres per litre',
        },
        {
            key: 'effective_year', label: 'Effective Year', type: 'number',
            placeholder: String(new Date().getFullYear()), required: true, half: true,
            hint: '4-digit year e.g. 2025',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 7. BIOGAS SIZES
//    Model: BiogasSize
//    API:   /api/master-data/biogas-sizes/
// ═══════════════════════════════════════════════════════════════════
const biogasSizesConfig = {
    title:       'Biogas Sizes',
    singular:    'Biogas Size',
    description: 'Biogas plant size categories and specifications for biomass data collection',
    icon:        Flame,
    api:         '/master-data/biogas-sizes/',
    nameKey:     'size_category',
    columns: [
        { key: 'size_category',          label: 'Size Category' },
        { key: 'production_type',         label: 'Production Type', type: 'badge',  width: '120px', badgeMap: BADGE },
        { key: 'capacity_m3',             label: 'Capacity (m³)',   type: 'number', width: '120px' },
        { key: 'annual_operating_hours',  label: 'Annual Hrs',      muted: true,    width: '100px' },
        { key: 'density',                 label: 'Density',         muted: true,    width: '90px'  },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'size_category', label: 'Size Category',
            placeholder: 'e.g. Small (1–5 m³)', required: true,
        },
        {
            key: 'production_type', label: 'Production Type', type: 'select', required: true,
            options: [
                { value: '',           label: 'Select type…' },
                { value: 'DOMESTIC',   label: 'Domestic' },
                { value: 'INDUSTRIAL', label: 'Industrial' },
                { value: 'COMMERCIAL', label: 'Commercial' },
            ],
        },
        {
            key: 'capacity_m3', label: 'Capacity (m³)', type: 'number',
            placeholder: '2.5', required: true, half: true,
        },
        {
            key: 'density', label: 'Density (kg/m³)', type: 'number',
            placeholder: '0.717', half: true,
            hint: 'Gas density at standard conditions',
        },
        {
            key: 'annual_operating_hours', label: 'Annual Operating Hours', type: 'number',
            placeholder: '8760', required: true,
            hint: 'Max 8760 hours per year',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 8. SOLAR ENERGY SIZES
//    Model: SolarEnergySize
//    API:   /api/master-data/solar-sizes/
// ═══════════════════════════════════════════════════════════════════
const solarSizesConfig = {
    title:       'Solar Energy Sizes',
    singular:    'Solar Size',
    description: 'Solar PV system size categories and performance specifications',
    icon:        Sun,
    api:         '/master-data/solar-sizes/',
    nameKey:     'size_category',
    columns: [
        { key: 'size_category', label: 'Size Category' },
        { key: 'capacity_kwp',  label: 'Capacity (kWp)',   type: 'number', width: '130px' },
        { key: 'energy_kwh',    label: 'Energy (kWh/yr)',  type: 'number', width: '130px' },
        { key: 'panel_type',    label: 'Panel Type',       muted: true },
        {
            key: 'efficiency', label: 'Efficiency', width: '100px',
            render: item => (
                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                    {item.efficiency
                        ? `${(parseFloat(item.efficiency) * 100).toFixed(1)}%`
                        : '—'}
                </span>
            ),
        },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'size_category', label: 'Size Category',
            placeholder: 'e.g. Small (<5 kWp)', required: true,
        },
        {
            key: 'capacity_kwp', label: 'Capacity (kWp)', type: 'number',
            placeholder: '5.0', required: true, half: true,
            hint: 'Peak power output in kilowatts',
        },
        {
            key: 'energy_kwh', label: 'Annual Energy (kWh)', type: 'number',
            placeholder: '7000', half: true,
            hint: 'Expected annual generation',
        },
        {
            key: 'panel_type', label: 'Panel Type',
            placeholder: 'e.g. Monocrystalline', half: true,
        },
        {
            key: 'efficiency', label: 'Efficiency (0–1)', type: 'number',
            placeholder: '0.185', half: true,
            hint: 'Enter as decimal: 0.185 = 18.5%',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// 9. INDUSTRY CLASSIFICATION
//    Model: IndustryClassification
//    API:   /api/master-data/industry-classifications/
// ═══════════════════════════════════════════════════════════════════
const industryClassificationConfig = {
    title:       'Industry Classification',
    singular:    'Classification',
    description: 'Industrial sector classifications aligned with ISIC standards',
    icon:        Factory,
    api:         '/master-data/industry-classifications/',
    nameKey:     'classification_name',
    columns: [
        { key: 'classification_code', label: 'Code',           type: 'code',  width: '100px' },
        { key: 'classification_name', label: 'Classification' },
        { key: 'category',            label: 'Category',       type: 'badge', width: '130px', badgeMap: BADGE },
        { key: 'isic_code',           label: 'ISIC Code',      muted: true,   width: '100px' },
        STATUS_COL,
    ],
    fields: [
        {
            key: 'classification_code', label: 'Code', type: 'code',
            placeholder: 'e.g. MFG', required: true, half: true,
        },
        {
            key: 'classification_name', label: 'Classification Name',
            placeholder: 'e.g. Manufacturing', required: true, half: true,
        },
        {
            key: 'category', label: 'Category', type: 'select', required: true,
            options: [
                { value: '',              label: 'Select category…' },
                { value: 'MANUFACTURING', label: 'Manufacturing' },
                { value: 'MINING',        label: 'Mining' },
                { value: 'CONSTRUCTION',  label: 'Construction' },
                { value: 'OTHERS',        label: 'Others' },
            ],
        },
        {
            key: 'isic_code', label: 'ISIC Code',
            placeholder: 'e.g. C10', half: true,
            hint: 'International Standard Industrial Classification code',
        },
        {
            key: 'description', label: 'Description', type: 'textarea',
            placeholder: 'Brief description of this classification…',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// EXPORTS — one line each, names must match App.jsx imports exactly
// ═══════════════════════════════════════════════════════════════════
export const EnergySupply           = () => <MasterDataPage config={energySupplyConfig} />;
export const ConversionFactors      = () => <MasterDataPage config={conversionFactorsConfig} />;
export const Sectors                = () => <SectorsPage />;
export const ElectricityCategories  = () => <MasterDataPage config={electricityCategoriesConfig} />;
export const VehicleTypes           = () => <MasterDataPage config={vehicleTypesConfig} />;
export const Mileage                = () => <MasterDataPage config={mileageConfig} />;
export const BiogasSizes            = () => <MasterDataPage config={biogasSizesConfig} />;
export const SolarSizes             = () => <MasterDataPage config={solarSizesConfig} />;
export const IndustryClassification = () => <MasterDataPage config={industryClassificationConfig} />;