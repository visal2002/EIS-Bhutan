import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
    ArrowDownToLine, ArrowUpFromLine, Plane, Activity,
    Database, Filter, Calendar, Droplet, Zap, Fuel
} from 'lucide-react';
import DataCollectionEngine from '../DataCollectionEngine';
import DashboardLayout from '../../../../components/layout/DashboardLayout';

const TABS = [
    { key: 'import',      label: 'Import',      icon: ArrowDownToLine, color: 'text-emerald-500' },
    { key: 'export',      label: 'Export',      icon: ArrowUpFromLine, color: 'text-orange-500' },
    { key: 'consumption', label: 'Consumption', icon: Activity,        color: 'text-violet-500' },
];

const CONFIGS = {
    'import': {
        title: 'POL Import Data',
        singular: 'Import Record',
        moduleKey: 'pol',
        description: 'Records of petroleum, oil, and lubricant products imported into Bhutan.',
        icon: ArrowDownToLine,
        api: '/pol/import-export/',
        hasApi: true,
        hideDateFields: true,
        apiEndpoint: '/pol/import-export/fetch/',
        params: { transaction_type: 'IMPORT' },
        templateHeaders: [
            "RRCOOffice", "CustomsOffice", "DeclarationNumber", "DeclarationDate", 
            "ImporterTPN", "ImporterName", "ExporterName", "CountryofExportation", 
            "Countryoforigin", "Vehicle_Number", "InvoiceNumber", "InvoiceDate", 
            "BtcChapter", "Btccode", "FullDescrp", "StandardUnitId", 
            "Quantity", "CustomsValue_Nu", "Remarks"
        ],
        columns: [
            { key: 'rrco_office', label: 'RRCO Office' },
            { key: 'customs_office', label: 'Customs Office' },
            { key: 'declaration_date', label: 'Declaration Date', render: (item) => item.declaration_date ? new Date(item.declaration_date).toLocaleString() : '—' },
            { key: 'importer_name', label: 'Importer Name' },
            { key: 'country_of_exportation', label: 'Country of Export' },
            { key: 'country_of_origin', label: 'Country of Origin' },
            { key: 'btc_code', label: 'BTC Code' },
            { key: 'full_description', label: 'Description' },
            { key: 'standard_unit_id', label: 'Unit' },
            { key: 'quantity', label: 'Quantity', render: (item) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.quantity ? parseFloat(item.quantity).toLocaleString() : '—'}</span> },
            { key: 'customs_value_nu', label: 'Customs Value (Nu)', render: (item) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.customs_value_nu ? parseFloat(item.customs_value_nu).toLocaleString() : '—'}</span> },
        ],
        fields: [
            { key: 'transaction_type', label: 'Type', type: 'text', default: 'IMPORT', hidden: true },
            { key: 'rrco_office', label: 'RRCO Office', type: 'text', half: true, required: true },
            { key: 'customs_office', label: 'Customs Office', type: 'text', half: true, required: true },
            { key: 'declaration_number', label: 'Declaration Number', type: 'text', half: true },
            { key: 'declaration_date', label: 'Declaration Date', type: 'datetime-local', half: true, required: true },
            { key: 'importer_tpn', label: 'Importer TPN', type: 'text', half: true },
            { key: 'importer_name', label: 'Importer Name', type: 'text', half: true, required: true },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', half: true },
            { key: 'country_of_exportation', label: 'Country of Exportation', type: 'text', half: true, required: true },
            { key: 'country_of_origin', label: 'Country of Origin', type: 'text', half: true, required: true },
            { key: 'vehicle_number', label: 'Vehicle Number', type: 'text', half: true },
            { key: 'invoice_number', label: 'Invoice Number', type: 'text', half: true },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', half: true },
            { key: 'btc_chapter', label: 'BTC Chapter', type: 'text', half: true },
            { key: 'btc_code', label: 'BTC Code', type: 'text', half: true, required: true },
            { key: 'full_description', label: 'Full Description', type: 'textarea', required: true },
            { key: 'standard_unit_id', label: 'Standard Unit ID', type: 'text', half: true, required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', half: true, required: true },
            { key: 'customs_value_nu', label: 'Customs Value (Nu)', type: 'number', half: true, required: true },
            { key: 'data_source', label: 'Data Source', type: 'select', default: 'EXCEL', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}, {value:'API', label:'API'}], half: true },
        ]
    },
    'export': {
        title: 'POL Export Data',
        singular: 'Export Record',
        moduleKey: 'pol',
        description: 'Records of petroleum, oil, and lubricant products exported from Bhutan.',
        icon: ArrowUpFromLine,
        api: '/pol/import-export/',
        hasApi: true,
        hideDateFields: true,
        apiEndpoint: '/pol/import-export/fetch/',
        params: { transaction_type: 'EXPORT' },
        templateHeaders: [
            "RRCOOffice", "CustomsOffice", "DeclarationNumber", "DeclarationDate", 
            "ImporterTPN", "ImporterName", "ExporterName", "CountryofExportation", 
            "Countryoforigin", "Vehicle_Number", "InvoiceNumber", "InvoiceDate", 
            "BtcChapter", "Btccode", "FullDescrp", "StandardUnitId", 
            "Quantity", "CustomsValue_Nu", "Remarks"
        ],
        columns: [
            { key: 'rrco_office', label: 'RRCO Office' },
            { key: 'customs_office', label: 'Customs Office' },
            { key: 'declaration_date', label: 'Declaration Date', render: (item) => item.declaration_date ? new Date(item.declaration_date).toLocaleString() : '—' },
            { key: 'importer_name', label: 'Importer Name' },
            { key: 'country_of_exportation', label: 'Country of Export' },
            { key: 'country_of_origin', label: 'Country of Origin' },
            { key: 'btc_code', label: 'BTC Code' },
            { key: 'full_description', label: 'Description' },
            { key: 'standard_unit_id', label: 'Unit' },
            { key: 'quantity', label: 'Quantity', render: (item) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.quantity ? parseFloat(item.quantity).toLocaleString() : '—'}</span> },
            { key: 'customs_value_nu', label: 'Customs Value (Nu)', render: (item) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.customs_value_nu ? parseFloat(item.customs_value_nu).toLocaleString() : '—'}</span> },
        ],
        fields: [
            { key: 'transaction_type', label: 'Type', type: 'text', default: 'EXPORT', hidden: true },
            { key: 'rrco_office', label: 'RRCO Office', type: 'text', half: true, required: true },
            { key: 'customs_office', label: 'Customs Office', type: 'text', half: true, required: true },
            { key: 'declaration_number', label: 'Declaration Number', type: 'text', half: true },
            { key: 'declaration_date', label: 'Declaration Date', type: 'datetime-local', half: true, required: true },
            { key: 'importer_tpn', label: 'Importer TPN', type: 'text', half: true },
            { key: 'importer_name', label: 'Importer Name', type: 'text', half: true, required: true },
            { key: 'exporter_name', label: 'Exporter Name', type: 'text', half: true },
            { key: 'country_of_exportation', label: 'Country of Exportation', type: 'text', half: true, required: true },
            { key: 'country_of_origin', label: 'Country of Origin', type: 'text', half: true, required: true },
            { key: 'vehicle_number', label: 'Vehicle Number', type: 'text', half: true },
            { key: 'invoice_number', label: 'Invoice Number', type: 'text', half: true },
            { key: 'invoice_date', label: 'Invoice Date', type: 'date', half: true },
            { key: 'btc_chapter', label: 'BTC Chapter', type: 'text', half: true },
            { key: 'btc_code', label: 'BTC Code', type: 'text', half: true, required: true },
            { key: 'full_description', label: 'Full Description', type: 'textarea', required: true },
            { key: 'standard_unit_id', label: 'Standard Unit ID', type: 'text', half: true, required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', half: true, required: true },
            { key: 'customs_value_nu', label: 'Customs Value (Nu)', type: 'number', half: true, required: true },
            { key: 'data_source', label: 'Data Source', type: 'select', default: 'EXCEL', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}, {value:'API', label:'API'}], half: true },
        ]
    },
    'consumption': {
        title: 'POL Transport Consumption',
        singular: 'Consumption Record',
        moduleKey: 'surface_transport',
        description: 'Fuel consumption breakdown by vehicle types and fuel categories.',
        icon: Activity,
        api: '/surface-transport/consumption/',
        columns: [
            { key: 'vehicle_type_name', label: 'Vehicle Type' },
            { key: 'fuel_type', label: 'Fuel' },
            { key: 'fuel_consumed_calculated', label: 'Consumed (KL)', render: (item) => <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{item.fuel_consumed_calculated ? parseFloat(item.fuel_consumed_calculated).toLocaleString() : '—'}</span> },
            { key: 'gross_weight', label: 'Weight (MT)' },
            { key: 'data_source', label: 'Source' },
        ],
        fields: [
            { key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', apiUrl: '/master-data/vehicle-types/', apiLabel: 'vehicle_type_name', required: true },
            { key: 'fuel_type', label: 'Fuel Type', type: 'select', options: [{value:'PETROL', label:'Petrol'}, {value:'DIESEL', label:'Diesel'}, {value:'OTHER', label:'Other'}], required: true },
            { key: 'odometer_reading', label: 'Odometer Reading', type: 'number' },
            { key: 'fuel_consumed_calculated', label: 'Fuel Consumed (KL)', type: 'number' },
            { key: 'original_vehicle_type', label: 'Original Category (from Source)', type: 'text' },
            { key: 'gross_weight', label: 'Gross Weight (MT)', type: 'number' },
            { key: 'data_source', label: 'Data Source', type: 'select', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}] },
        ]
    }
};

export default function PolPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'import';

    const setActiveTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'POL' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
            <div className="space-y-5">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Droplet className="h-6 w-6 text-blue-300" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-400/80 mb-0.5">Petroleum, Oil & Lubricants</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">POL Data Collection</h1>
                                <p className="text-xs text-white/50 mt-0.5">Import/Export records · Aviation fuel · Transport consumption</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {[{label:'Unit',val:'KL / MT'},{label:'Source',val:'DPA / MoENR'},{label:'Frequency',val:'Monthly'}].map(s => (
                                <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-center hidden sm:block">
                                    <p className="text-[9px] text-white/40 font-semibold uppercase tracking-widest mb-0.5">{s.label}</p>
                                    <p className="text-xs font-bold text-white">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.key;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                                    ${isActive 
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                <Icon className={`h-4 w-4 ${isActive ? tab.color : 'opacity-40'}`} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Content Area */}
                <DataCollectionEngine key={activeTab} config={CONFIGS[activeTab]} standalone={false} />
            </div>
        </DashboardLayout>
    );
}
