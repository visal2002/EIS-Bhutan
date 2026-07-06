import { useState } from 'react';
import { TreePine, ShoppingCart, Users } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine from '../DataCollectionEngine';

const TABS = [
    { key: 'supply',      label: 'Fuelwood Supply', icon: ShoppingCart, color: 'text-green-500' },
    { key: 'consumption', label: 'Fuelwood Consumption', icon: Users,       color: 'text-blue-500' },
];

const CONFIGS = {
    'supply': {
        title: 'Fuelwood Supply Data',
        singular: 'Supply Record',
        moduleKey: 'fuelwood',
        description: 'Records of fuelwood supplied by various sources in different dzongkhags.',
        icon: ShoppingCart,
        api: '/fuelwood/supply/',
        hasApi: true,
        templateHeaders: ['permit_date', 'office', 'dzongkhag', 'purpose', 'quantity_m3', 'remarks'],
        templateExample: '2024-05-15,Thimphu Divisional Forest Office,thimphu,Rural Domestic Fuelwood,150.5,DoFPS report',
        exportFields: ['permit_date', 'office', 'dzongkhag', 'purpose', 'quantity_m3', 'remarks'],
        columns: [
            { key: 'permit_date', label: 'Permit Date' },
            { key: 'office', label: 'Office' },
            { key: 'dzongkhag_display', label: 'Dzongkhag' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'quantity_m3', label: 'Qty (m³)', render: (item) => <span className="font-mono font-bold text-slate-700">{parseFloat(item.quantity_m3).toLocaleString()}</span> },
        ],
        fields: [
            { key: 'permit_date', label: 'Permit Date', type: 'date', required: true, half: true },
            { key: 'office', label: 'Office', type: 'text', placeholder: 'e.g. Thimphu Divisional Forest Office', required: true, half: true },
            { key: 'dzongkhag', label: 'Dzongkhag', type: 'select', options: [
                {value:'thimphu', label:'Thimphu'}, {value:'paro', label:'Paro'}, {value:'punakha', label:'Punakha'},
                {value:'wangdue', label:'Wangdue'}, {value:'tsirang', label:'Tsirang'}, {value:'dagana', label:'Dagana'},
                {value:'chuukha', label:'Chukha'}, {value:'haa', label:'Haa'}, {value:'samtse', label:'Samtse'},
                {value:'sarpang', label:'Sarpang'}, {value:'zhemgang', label:'Zhemgang'}, {value:'trongsa', label:'Trongsa'},
                {value:'bumthang', label:'Bumthang'}, {value:'mongar', label:'Mongar'}, {value:'lhuentse', label:'Lhuentse'},
                {value:'trashigang', label:'Trashigang'}, {value:'trashiyangtse', label:'Trashi Yangtse'},
                {value:'pemagatshel', label:'Pema Gatshel'}, {value:'samdrupjongkhar', label:'Samdrup Jongkhar'}
            ], required: true, half: true },
            { key: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g. Rural Domestic Fuelwood', required: false, half: true },
            { key: 'quantity_m3', label: 'Quantity (m³)', type: 'number', required: true, half: true },
            { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'e.g. DoFPS permit report', half: true },
        ]
    },
    'consumption': {
        title: 'Fuelwood Consumption Data',
        singular: 'Consumption Record',
        moduleKey: 'fuelwood',
        description: 'Track fuelwood consumption breakdown by sector and dzongkhag.',
        icon: Users,
        api: '/fuelwood/consumption/',
        hasApi: true,
        templateHeaders: ['permit_date', 'office', 'dzongkhag', 'purpose', 'purpose_group', 'quantity_m3', 'remarks'],
        templateExample: '2024-05-15,Paro Divisional Forest Office,wangdue,Rural Domestic Fuelwood,Domestic,500.25,Industry survey',
        exportFields: ['permit_date', 'office', 'dzongkhag', 'purpose', 'purpose_group', 'quantity_m3', 'remarks'],
        columns: [
            { key: 'permit_date', label: 'Permit Date' },
            { key: 'office', label: 'Office' },
            { key: 'dzongkhag_display', label: 'Dzongkhag' },
            { key: 'purpose', label: 'Purpose' },
            { key: 'purpose_group', label: 'Purpose Group' },
            { key: 'quantity_m3', label: 'Qty (m³)', render: (item) => <span className="font-mono font-bold text-slate-700">{parseFloat(item.quantity_m3).toLocaleString()}</span> },
        ],
        fields: [
            { key: 'permit_date', label: 'Permit Date', type: 'date', required: true, half: true },
            { key: 'office', label: 'Office', type: 'text', placeholder: 'e.g. Paro Divisional Forest Office', required: true, half: true },
            { key: 'dzongkhag', label: 'Dzongkhag', type: 'select', options: [
                {value:'thimphu', label:'Thimphu'}, {value:'paro', label:'Paro'}, {value:'punakha', label:'Punakha'},
                {value:'wangdue', label:'Wangdue'}, {value:'tsirang', label:'Tsirang'}, {value:'dagana', label:'Dagana'},
                {value:'chuukha', label:'Chukha'}, {value:'haa', label:'Haa'}, {value:'samtse', label:'Samtse'},
                {value:'sarpang', label:'Sarpang'}, {value:'zhemgang', label:'Zhemgang'}, {value:'trongsa', label:'Trongsa'},
                {value:'bumthang', label:'Bumthang'}, {value:'mongar', label:'Mongar'}, {value:'lhuentse', label:'Lhuentse'},
                {value:'trashigang', label:'Trashigang'}, {value:'trashiyangtse', label:'Trashi Yangtse'},
                {value:'pemagatshel', label:'Pema Gatshel'}, {value:'samdrupjongkhar', label:'Samdrup Jongkhar'}
            ], required: true, half: true },
            { key: 'purpose', label: 'Purpose', type: 'text', placeholder: 'e.g. Rural Domestic Fuelwood', required: false, half: true },
            { key: 'purpose_group', label: 'Purpose Group', type: 'text', placeholder: 'e.g. Domestic', required: false, half: true },
            { key: 'quantity_m3', label: 'Quantity (m³)', type: 'number', required: true, half: true },
            { key: 'remarks', label: 'Remarks', type: 'text', placeholder: 'e.g. DoFPS report', half: true },
        ]
    }
};

export default function FuelwoodPage() {
    const [activeTab, setActiveTab] = useState('supply');

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Fuelwood' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
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
                                <TreePine className="h-6 w-6 text-emerald-300" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-400/80 mb-0.5">Primary Energy</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">Fuelwood Data Collection</h1>
                                <p className="text-xs text-white/50 mt-0.5">Forestry supply · Household & Industrial consumption</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {[{label:'Unit',val:'MT / m³'},{label:'Source',val:'DoFPS'},{label:'Frequency',val:'Annual'}].map(s => (
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
