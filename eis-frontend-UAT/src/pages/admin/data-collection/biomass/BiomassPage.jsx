import { useSearchParams } from 'react-router-dom';
import { Leaf, Pipette, Box, Flame } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine from '../DataCollectionEngine';

const TABS = [
    { key: 'biogas',    label: 'Biogas',    icon: Pipette, color: 'text-emerald-500' },
    { key: 'briquette', label: 'Briquette', icon: Box,     color: 'text-amber-700' },
    { key: 'charcoal',  label: 'Charcoal',  icon: Flame,   color: 'text-orange-500' },
];

const CONFIGS = {
    'biogas': {
        title: 'Biogas Data',
        singular: 'Biogas Record',
        moduleKey: 'biomass',
        description: 'Track biogas plant installations across different sectors and dzongkhags.',
        icon: Pipette,
        api: '/biomass/biogas/',
        hasApi: true,
        hideDateFields: true,
        templateHeaders: ['Date', 'Biogas Size Class', 'Sector', 'Dzongkhag', 'Number of Plants', 'Remarks'],
        templateExample: '2024-05-15,10m3,INDUSTRY,Sarpang,15,Biogas survey',
        exportFields: ['date', 'biogas_size_name', 'sector_name', 'number_of_plants', 'dzongkhag_display', 'data_source', 'remarks'],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'biogas_size_name', label: 'Plant Size' },
            { key: 'sector_name', label: 'Sector' },
            { key: 'dzongkhag_display', label: 'Dzongkhag' },
            { key: 'number_of_plants', label: 'Total Plants', render: (item) => <span className="font-bold text-slate-700">{item.number_of_plants}</span> },
            { key: 'data_source', label: 'Source'  },
        ],
        fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'biogas_size', label: 'Biogas Size Category', type: 'api-select', apiUrl: '/master-data/biogas-sizes/', apiLabel: 'size_category', required: true },
            { key: 'sector', label: 'Sector', type: 'api-select', apiUrl: '/master-data/sectors/', apiLabel: 'sector_name', required: true },
            { key: 'number_of_plants', label: 'Number of Plants', type: 'number', required: true },
            { key: 'dzongkhag', label: 'Dzongkhag', type: 'select', options: [
                {value:'thimphu', label:'Thimphu'}, {value:'paro', label:'Paro'}, {value:'punakha', label:'Punakha'},
                {value:'wangdue', label:'Wangdue'}, {value:'tsirang', label:'Tsirang'}, {value:'dagana', label:'Dagana'},
                {value:'chuukha', label:'Chukha'}, {value:'haa', label:'Haa'}, {value:'samtse', label:'Samtse'},
                {value:'sarpang', label:'Sarpang'}, {value:'zhemgang', label:'Zhemgang'}, {value:'trongsa', label:'Trongsa'},
                {value:'bumthang', label:'Bumthang'}, {value:'mongar', label:'Mongar'}, {value:'lhuentse', label:'Lhuentse'},
                {value:'trashigang', label:'Trashigang'}, {value:'trashiyangtse', label:'Trashi Yangtse'},
                {value:'pemagatshel', label:'Pema Gatshel'}, {value:'samdrupjongkhar', label:'Samdrup Jongkhar'}
            ], required: true },
            { key: 'data_source', label: 'Data Source', type: 'select', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}] },
        ]
    },
    'briquette': {
        title: 'Briquette Data',
        singular: 'Briquette Record',
        moduleKey: 'biomass',
        description: 'Track production and consumption records for biomass briquettes.',
        icon: Box,
        api: '/biomass/briquette/',
        hasApi: true,
        hideDateFields: true,
        templateHeaders: ['Date', 'Quantity', 'Unit', 'Remarks'],
        templateExample: '2024-05-15,500.5,KG,Monthly production',
        exportFields: ['date', 'quantity', 'unit', 'data_source', 'remarks'],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'quantity', label: 'Quantity', render: (item) => <span className="font-mono font-bold text-slate-700">{parseFloat(item.quantity).toLocaleString()}</span> },
            { key: 'unit', label: 'Unit' },
            { key: 'data_source', label: 'Source' },
        ],
        fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'unit', label: 'Unit', type: 'api-select', apiUrl: '/master-data/settings/measurement-units/dropdown/', apiLabel: 'unit_code', apiValue: 'unit_code', required: true },
            { key: 'data_source', label: 'Data Source', type: 'select', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}] },
        ]
    },
    'charcoal': {
        title: 'Charcoal Data',
        singular: 'Charcoal Record',
        moduleKey: 'biomass',
        description: 'Track production and consumption records for biomass charcoal.',
        icon: Flame,
        api: '/biomass/charcoal/',
        hasApi: true,
        hideDateFields: true,
        templateHeaders: ['Date', 'Quantity', 'Unit', 'Remarks'],
        templateExample: '2024-05-15,350.2,KG,Charcoal production note',
        exportFields: ['date', 'quantity', 'unit', 'data_source', 'remarks'],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'quantity', label: 'Quantity', render: (item) => <span className="font-mono font-bold text-slate-700">{parseFloat(item.quantity).toLocaleString()}</span> },
            { key: 'unit', label: 'Unit' },
            { key: 'data_source', label: 'Source' },
        ],
        fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'quantity', label: 'Quantity', type: 'number', required: true },
            { key: 'unit', label: 'Unit', type: 'api-select', apiUrl: '/master-data/settings/measurement-units/dropdown/', apiLabel: 'unit_code', apiValue: 'unit_code', required: true },
            { key: 'data_source', label: 'Data Source', type: 'select', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}] },
        ]
    }
};

export default function BiomassPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'biogas';

    const setActiveTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Biomass' },
    ];

    return (
        <DashboardLayout breadcrumbs={breadcrumbs} title="Biomass Management">
            <div className="space-y-5">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#064e3b 0%,#065f46 55%,#047857 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.05]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Leaf className="h-6 w-6 text-emerald-300" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-400/80 mb-0.5">Primary Energy</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">Biomass & Biogas Data</h1>
                                <p className="text-xs text-white/50 mt-0.5">Biogas plant installations · Briquette & Charcoal production</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {[{label:'Unit',val:'Plants / KG'},{label:'Source',val:'DRE / DoE'},{label:'Frequency',val:'Annual'}].map(s => (
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
