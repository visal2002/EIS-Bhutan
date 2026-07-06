// src/pages/admin/master-data/pages.jsx
// All 9 master-data modules powered by MasterDataEngine.jsx
import MasterDataPage from './MasterDataEngine';
import { Zap, MapPin } from 'lucide-react';

// ── Shared columns ────────────────────────────────────────────────
const statusCol = { key: 'is_active', label: 'Status', type: 'status', width: '10%' };

// ═══════════════════════════════════════════════════════════════════
// ENERGY SUPPLY  — redirects to standalone page with tree UI
// ═══════════════════════════════════════════════════════════════════
export { default as EnergySupply } from './EnergySupplyPage';

// ═══════════════════════════════════════════════════════════════════
// CONVERSION FACTORS
// ═══════════════════════════════════════════════════════════════════
export function ConversionFactors() {
    return <MasterDataPage config={{
        title:       'Conversion Factors',
        singular:    'Factor',
        description: 'Energy conversion factors used in GHG and TOE calculations — TJ and TOE per physical unit',
        api:         '/master-data/conversion-factors/',
        nameKey:     'energy_supply_name',
        columns: [
            { key: 'energy_supply_name', label: 'Energy Supply',     width: '24%' },
            { key: 'conversion_factor',  label: 'Factor Value',      width: '16%',
              render: item => (
                  <span className="font-mono text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {Number(item.conversion_factor).toFixed(4)}
                  </span>
              )},
            { key: 'unit_code',          label: 'Unit',              width: '14%',
              render: item => item.unit_code ? (
                  <span className="font-mono text-xs font-bold bg-violet-50 dark:bg-violet-900/20
                      text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded-md border
                      border-violet-200 dark:border-violet-700">
                      {item.unit_code}
                  </span>
              ) : <span className="text-slate-300">—</span> },
            { key: 'unit_name',          label: 'Unit Description',  width: '22%', muted: true },
            { key: 'effective_date',     label: 'Effective Date',    width: '14%', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'energy_supply', label: 'Energy Supply',
                type: 'api-select', required: true,
                apiUrl:   '/master-data/energy-supply/dropdown/',
                apiLabel: 'supply_name',
                apiValue: 'id',
                hint: 'The energy carrier this factor applies to',
            },
            {
                key: 'unit', label: 'Conversion Unit',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/conversion-units/dropdown/',
                apiLabel: 'unit_name',
                apiValue: 'id',
                hint: 'e.g. TJ/GWh, TOE/kl — manage in Master Settings',
            },
            {
                key: 'conversion_factor', label: 'Factor Value',
                type: 'number', placeholder: '0.0000', step: '0.0001',
                required: true, half: true,
                hint: 'The numeric conversion factor value (up to 4 decimals)',
            },
            {
                key: 'effective_date', label: 'Effective Date',
                type: 'date', required: true, half: true,
                hint: 'Date from which this factor is valid',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// SECTORS
// ═══════════════════════════════════════════════════════════════════
export function Sectors() {
    return <MasterDataPage config={{
        title:       'Sectors',
        singular:    'Sector',
        description: 'Hierarchical energy sectors and sub-sectors for comprehensive data classification',
        api:         '/master-data/sectors/',
        nameKey:     'sector_name',
        isTree:      true,
        parentKey:   'parent_sector',
        columns: [
            { key: 'sector_code',  label: 'Code',         type: 'code',  width: '120px' },
            { key: 'sector_name',  label: 'Sector Name' },
            { key: 'ipcc_code',    label: 'IPCC Code',    width: '130px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'sector_code', label: 'Sector Code', type: 'code',
                autoCode: 'sector_name',
                placeholder: 'e.g. BLD', required: true, half: true,
                hint: 'Auto-generated from name',
            },
            {
                key: 'sector_name', label: 'Sector Name',
                placeholder: 'e.g. Building', required: true, half: true,
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.4', half: true,
                hint: 'IPCC 2006 GL sector classification code',
            },
            {
                key: 'parent_sector', label: 'Parent Sector (optional)',
                type: 'api-select', half: true,
                apiUrl:   '/master-data/sectors/dropdown/',
                apiLabel: 'sector_name',
                apiValue: 'id',
                hint: 'Leave blank for top-level sectors',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// ELECTRICITY CATEGORIES
// ═══════════════════════════════════════════════════════════════════
export function ElectricityCategories() {
    return <MasterDataPage config={{
        title:       'Electricity Categories',
        singular:    'Category',
        description: 'Consumer categories for electricity data collection',
        api:         '/master-data/electricity-categories/',
        nameKey:     'category_name',
        columns: [
            { key: 'category_code',      label: 'Code',    type: 'code', width: '110px' },
            { key: 'category_name',      label: 'Category',              width: '200px' },
            { key: 'sector_name',        label: 'Sector',                width: '150px', muted: true },
            { key: 'category_type_name', label: 'Type',                  width: '140px',
              render: item => item.category_type_name ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                      bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300
                      border border-blue-200 dark:border-blue-700">
                      {item.category_type_name}
                  </span>
              ) : <span className="text-slate-300">—</span> },
            { key: 'ipcc_code',    label: 'IPCC Code',    width: '120px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'category_code', label: 'Category Code', type: 'code',
                autoCode: 'category_name',
                placeholder: 'e.g. RES-GEN', required: true, half: true,
            },
            {
                key: 'category_name', label: 'Category Name',
                placeholder: 'e.g. Residential', required: true, half: true,
            },
            {
                key: 'category_type', label: 'Consumer Type',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/electricity-types/dropdown/',
                apiLabel: 'type_name',
                apiValue: 'id',
                hint: 'Manage types in Master Settings',
            },
            {
                key: 'sector', label: 'Sector',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/sectors/dropdown/',
                apiLabel: 'sector_name',
                apiValue: 'id',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.4', half: true,
                hint: 'IPCC 2006 GL classification code',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// VEHICLE TYPES
// ═══════════════════════════════════════════════════════════════════
export function VehicleTypes() {
    return <MasterDataPage config={{
        title:       'Vehicle Types',
        singular:    'Vehicle Type',
        description: 'Vehicle classifications for transport fuel data collection',
        api:         '/master-data/vehicle-types/',
        nameKey:     'vehicle_type_name',
        isTree:      true,
        parentKey:   'parent',
        columns: [
            { key: 'vehicle_type_code', label: 'Code',           type: 'code',   width: '110px' },
            { key: 'vehicle_type_name', label: 'Vehicle Type',                   width: '240px' },
            { key: 'parent_name',       label: 'Parent',                         width: '180px', muted: true },
            { key: 'ipcc_code',         label: 'IPCC Code',                      width: '120px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'vehicle_type_code', label: 'Type Code', type: 'code',
                autoCode: 'vehicle_type_name',
                placeholder: 'e.g. TRC', required: true, half: true,
            },
            {
                key: 'vehicle_type_name', label: 'Type Name',
                placeholder: 'e.g. Tractor', required: true, half: true,
            },
            {
                key: 'parent', label: 'Parent Type (leave blank for top-level)',
                type: 'api-select',
                apiUrl:   '/master-data/vehicle-types/dropdown/',
                apiLabel: 'vehicle_type_name',
                apiValue: 'id',
                hint: 'Select a parent to make this a child type (e.g. Off-Load → Tractor)',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.3', half: true,
                hint: 'IPCC 2006 GL classification code for transport',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// MILEAGE
// ═══════════════════════════════════════════════════════════════════
export function Mileage() {
    return <MasterDataPage config={{
        title:       'Mileage',
        singular:    'Mileage Record',
        description: 'Vehicle mileage rates by fuel type and year',
        api:         '/master-data/mileage/',
        nameKey:     'vehicle_type_name',
        columns: [
            { key: 'vehicle_type_name', label: 'Vehicle Type',   width: '220px' },
            { key: 'fuel_type_name',    label: 'Fuel Type',      width: '130px',
              render: item => item.fuel_type_name ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                      bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300
                      border border-orange-200 dark:border-orange-700">
                      {item.fuel_type_name}
                  </span>
              ) : <span className="text-slate-300">—</span> },
            { key: 'mileage_kmpl',   label: 'Mileage (km/L)', width: '130px' },
            { key: 'effective_year', label: 'Year',            width: '90px', muted: true },
            { key: 'ipcc_code',    label: 'IPCC Code',    width: '120px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'vehicle_type', label: 'Vehicle Type',
                type: 'api-select', required: true,
                apiUrl:   '/master-data/vehicle-types/dropdown/',
                apiLabel: 'vehicle_type_name',
                apiValue: 'id',
            },
            {
                key: 'fuel_type', label: 'Fuel Type',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/vehicle-fuel-types/dropdown/',
                apiLabel: 'fuel_name',
                apiValue: 'id',
                hint: 'Manage transport-specific fuel types in Master Settings',
            },
            {
                key: 'mileage_kmpl', label: 'Mileage (km/L)',
                type: 'number', placeholder: '15.0', required: true, half: true,
                hint: 'Average km per litre for this vehicle-fuel combination',
            },
            {
                key: 'effective_year', label: 'Effective Year',
                type: 'number', placeholder: '2022', required: true, half: true,
                hint: 'Year this mileage rate applies from',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.3', half: true,
                hint: 'IPCC 2006 GL classification code for mileage/transport',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// BIOGAS SIZES
// ═══════════════════════════════════════════════════════════════════
export function BiogasSizes() {
    return <MasterDataPage config={{
        title:       'Biogas Sizes',
        singular:    'Biogas Size',
        description: 'Biogas plant size categories for biomass data collection',
        api:         '/master-data/biogas-sizes/',
        nameKey:     'size_category',
        columns: [
            { key: 'size_category',          label: 'Size Category',   width: '200px' },
            { key: 'production_type_name',    label: 'Production Type', width: '150px',
              render: item => item.production_type_name ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                      bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300
                      border border-green-200 dark:border-green-700">
                      {item.production_type_name}
                  </span>
              ) : <span className="text-slate-300">—</span> },
            { key: 'capacity_m3',            label: 'Capacity (m³)',  width: '120px' },
            { key: 'annual_operating_hours', label: 'Annual Hrs',     width: '100px', muted: true },
            { key: 'ipcc_code',    label: 'IPCC Code',    width: '120px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'size_category', label: 'Size Category',
                placeholder: 'e.g. Small (4 m3)', required: true,
                hint: 'Descriptive name for this plant size category',
            },
            {
                key: 'production_type', label: 'Production Type',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/production-types/dropdown/',
                apiLabel: 'type_name',
                apiValue: 'id',
                hint: 'Manage types in Master Settings',
            },
            {
                key: 'capacity_m3', label: 'Capacity (m³)',
                type: 'number', placeholder: '4.0', required: true, half: true,
                hint: 'Biogas plant volume in cubic metres',
            },
            {
                key: 'density', label: 'Biogas Density (kg/m³)',
                type: 'number', placeholder: '1.214', half: true,
                hint: 'Default: 1.214 kg/m³ (source: BRD Biogas sheet)',
            },
            {
                key: 'annual_operating_hours', label: 'Annual Operating Hours',
                type: 'number', placeholder: '8760', required: true, half: true,
                hint: '8760 = full year (24h × 365 days)',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.4', half: true,
                hint: 'IPCC 2006 GL classification code for biogas/biomass',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// SOLAR SIZES
// ═══════════════════════════════════════════════════════════════════
export function SolarEnergy() {
    return <MasterDataPage config={{
        title:       'Solar Energy',
        singular:    'Solar Energy',
        description: 'Solar PV system categories, capacity, sector classification, and estimated annual energy generation.',
        api:         '/master-data/solar-sizes/',
        nameKey:     'category',
        columns: [
            { key: 'category',               label: 'Category',                 width: '200px' },
            { key: 'installed_capacity_kwp', label: 'Installed Capacity (kWp)',  width: '150px' },
            { key: 'sector_name',            label: 'Sector',                   width: '140px', muted: true },
            { key: 'energy_generation_kwh',  label: 'Energy Gen (kWh/yr)',       width: '140px' },
            { key: 'ipcc_code',              label: 'IPCC Code',                width: '120px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'category', label: 'Category',
                placeholder: 'e.g. Solar roof top', required: true,
                hint: 'Descriptive category for this solar system',
            },
            {
                key: 'installed_capacity_kwp', label: 'Installed Capacity (kWp)',
                type: 'number', placeholder: '10.0', required: true, half: true,
                hint: 'Peak power capacity in kilowatt-peak',
            },
            {
                key: 'sector', label: 'Sector',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/sectors/dropdown/',
                apiLabel: 'sector_name',
                apiValue: 'id',
                hint: 'Select the economic/energy sector for this classification',
            },
            {
                key: 'energy_generation_kwh', label: 'Energy Generation (kWh)',
                type: 'number', placeholder: '12000', required: true, half: true,
                hint: 'Estimated annual generation in kWh',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.4.a', half: true,
                hint: 'IPCC 2006 GL classification code for solar/renewables',
            },
        ],
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// INDUSTRY CLASSIFICATION
// ═══════════════════════════════════════════════════════════════════
export function IndustryClassification() {
    return <MasterDataPage config={{
        title:       'Industry Classification',
        singular:    'Classification',
        description: 'Industrial sector classifications for energy data collection',
        api:         '/master-data/industry-classifications/',
        nameKey:     'classification_name',
        columns: [
            { key: 'classification_code', label: 'Code',          type: 'code', width: '100px' },
            { key: 'classification_name', label: 'Classification',               width: '220px' },
            { key: 'category_name',       label: 'Category',                     width: '150px',
              render: item => item.category_name ? (
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold
                      bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300
                      border border-indigo-200 dark:border-indigo-700">
                      {item.category_name}
                  </span>
              ) : <span className="text-slate-300">—</span> },
            { key: 'ipcc_code',  label: 'IPCC Code', width: '100px', muted: true },
            statusCol,
        ],
        fields: [
            {
                key: 'classification_code', label: 'Code', type: 'code',
                autoCode: 'classification_name',
                placeholder: 'e.g. FERRO', required: true, half: true,
            },
            {
                key: 'classification_name', label: 'Classification Name',
                placeholder: 'e.g. Ferro-Alloy Industry', required: true, half: true,
            },
            {
                key: 'category', label: 'Industry Category',
                type: 'api-select', required: true, half: true,
                apiUrl:   '/master-data/settings/industry-categories/dropdown/',
                apiLabel: 'category_name',
                apiValue: 'id',
                hint: 'Manage categories in Master Settings',
            },
            {
                key: 'ipcc_code', label: 'IPCC Code',
                placeholder: 'e.g. 1.A.2', half: true,
                hint: 'IPCC 2006 GL classification code',
            },
            {
                key: 'description', label: 'Description',
                type: 'textarea', placeholder: 'Brief description of this classification...',
            },
        ],
    }} />;
}
// ── Re-export settings pages so App.jsx can import everything from one place ──
export {
    ConversionUnits, ElectricityTypes,
    FuelTypes, VehicleFuelTypes, ProductionTypes, PanelTypes, IndustryCategories,
    MeasurementUnits, EnergyCategories,
    Dzongkhags, DataYears, DataSources, BPCCategories,
    GenerationPlants, Countries,
    ConsumerTypes, VoltageTypes, ConsumerGroups, Locations, ConductorTypes, UnitTypes, ConnectionTypes, PlantSizes, GridTypes, ConfigurationTypes, LineCategories, CircuitTypes, SubsidyTypes, TowerTypes, TransformerTypes, VoltageLevels, ConsumerSubtypes,
} from './pages_settings';

// ═══════════════════════════════════════════════════════════════════
// SUBSTATIONS
// ═══════════════════════════════════════════════════════════════════
export function Substations() {
    return <MasterDataPage config={{
        title:       'Substations',
        singular:    'Substation',
        description: 'Managing electrical grid substations and primary infrastructure',
        icon:        MapPin,
        api:         '/master-data/substations/',
        nameKey:     'substation_name',
        accent:      '#84cc16',
        columns: [
            { key: 'substation_code', label: 'Code', type: 'code', width: '120px' },
            { key: 'substation_name', label: 'Substation Name' },
            { key: 'acronym',         label: 'Acronym', width: '90px' },
            { key: 'region',          label: 'Region', width: '110px', muted: true },
            { key: 'dzongkhag_name',  label: 'Dzongkhag', width: '120px' },
            { key: 'gewog',           label: 'Gewog', width: '110px', muted: true },
            { key: 'substation_type', label: 'Type', width: '90px', muted: true },
            { key: 'plant_status',    label: 'Plant Status', width: '110px', muted: true },
            { key: 'plant_type',      label: 'Plant Type', width: '110px', muted: true },
            statusCol
        ],
        fields: [
            {
                key: 'substation_code', label: 'Substation Code', type: 'code',
                autoCode: 'substation_name',
                placeholder: 'e.g. ABC', required: true, half: true,
                hint: 'Auto-generated from name',
            },
            { key: 'substation_name', label: 'Substation Name', required: true, half: true },
            { key: 'acronym', label: 'Acronym', half: true },
            { key: 'region', label: 'Region', half: true },
            { 
                key: 'dzongkhag', label: 'Dzongkhag', type: 'api-select', required: true, half: true,
                apiUrl: '/master-data/settings/dzongkhags/dropdown/', apiLabel: 'dzongkhag_name', apiValue: 'id'
            },
            { key: 'gewog', label: 'Gewog', half: true },
            { key: 'substation_type', label: 'Substation Type', half: true },
            { key: 'commissioned_date', label: 'Date Commissioned', type: 'date', half: true },
            { key: 'plant_status', label: 'Plant Status', placeholder: 'OPERATIONAL', half: true },
            { key: 'plant_type', label: 'Plant Type', placeholder: 'BPC SUBSTATION', half: true },
            { key: 'dzongkhag_code', label: 'Dzongkhag Code', half: true },
            { key: 'dzo_iso_code', label: 'Dzongkhag ISO Code', half: true },
            { key: 'region_code', label: 'Region Code', half: true },
            { key: 'gewog_code', label: 'Gewog Code', half: true },
            { key: 'plant_type_code', label: 'Plant Type Code', type: 'number', half: true },
            { key: 'plant_status_code', label: 'Plant Status Code', type: 'number', half: true },
            { key: 'substation_type_code', label: 'Substation Type Code', type: 'number', half: true },
            { key: 'ipcc_code', label: 'IPCC Code', half: true },
            { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ]
    }} />;
}

// ═══════════════════════════════════════════════════════════════════
// SUBSTATION TRANSFORMERS
// ═══════════════════════════════════════════════════════════════════
export function SubstationTransformers() {
    return <MasterDataPage config={{
        title:       'Transformers',
        singular:    'Transformer',
        description: 'Inventory of transformers within substations',
        icon:        Zap,
        api:         '/master-data/substation-transformers/',
        nameKey:     'transformer_code',
        accent:      '#f59e0b',
        columns: [
            { key: 'substation_name',  label: 'Substation Name' },
            { key: 'voltage_ratio',    label: 'Voltage', width: '120px' },
            { key: 'no_of_transformers', label: 'No of Transformers', width: '150px' },
            { key: 'transformer_capacity', label: 'Capacity', width: '120px' },
            { key: 'max_capacity_mva',  label: 'MVA', width: '90px' },
            { key: 'max_capacity_mw',  label: 'MW', width: '90px' },
            { key: 'status_name',      label: 'Status', width: '120px' },
            statusCol
        ],
        fields: [
            { 
                key: 'substation', label: 'Substation (Plant Code)', type: 'api-select', required: true, half: true,
                apiUrl: '/master-data/substations/dropdown/', apiLabel: 'substation_name', apiValue: 'id'
            },
            { key: 'status_name', label: 'Status', half: true },
            { key: 'plant_status_code', label: 'Plant Status Code', type: 'number', half: true },
            { key: 'substation_name', label: 'Substation Name', half: true },
            { key: 'plant_type', label: 'Plant Type', half: true },
            { key: 'plant_type_code', label: 'Plant Type Code', type: 'number', half: true },
            { key: 'acronym', label: 'Acronym', half: true },
            { key: 'dzongkhag', label: 'Dzongkhag', half: true },
            { key: 'dzongkhag_code', label: 'Dzongkhag Code', half: true },
            { key: 'gewog', label: 'Gewog', half: true },
            { key: 'gewog_code', label: 'Gewog Code', half: true },
            { key: 'dzo_iso_code', label: 'Dzongkhag ISO Code', half: true },
            { key: 'region', label: 'Region', half: true },
            { key: 'region_code', label: 'Region Code', half: true },
            { key: 'commissioned_date', label: 'Year of Operation / Commissioned Date', type: 'date', half: true },
            { key: 'substation_type', label: 'Substation Type', half: true },
            { key: 'substation_type_code', label: 'Substation Type Code', type: 'number', half: true },
            { key: 'voltage_ratio', label: 'Voltage Ratio', half: true },
            { key: 'no_of_transformers', label: 'No. of Transformers', type: 'number', half: true },
            { key: 'transformer_capacity', label: 'Transformer Capacity', half: true },
            { key: 'max_capacity_mva', label: 'Capacity (MVA)', type: 'number', half: true },
            { key: 'pf_rate', label: 'PF Rate', type: 'number', half: true, defaultValue: 0.9 },
            { key: 'max_capacity_mw', label: 'Capacity (MW)', type: 'number', half: true, hint: 'At 0.9 PF' },
            { key: 'ipcc_code', label: 'IPCC Code', half: true },
        ]
    }} />;
}

