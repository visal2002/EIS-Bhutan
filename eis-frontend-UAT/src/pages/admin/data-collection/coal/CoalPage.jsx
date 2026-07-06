import { useSearchParams } from 'react-router-dom';
import { Mountain, ArrowRightLeft, Factory } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../DataCollectionEngine';
import { cn } from '../../../../utils/cn';

const TABS = [
    { key: 'production', label: 'Production', icon: Factory },
    { key: 'export', label: 'Export', icon: ArrowRightLeft },
];

const CONFIGS = {
    'production': {
        title: 'Coal Production Data',
        singular: 'Production Record',
        moduleKey: 'coal',
        description: 'Records of coal products produced in Bhutan.',
        icon: Factory,
        api: '/coal/production/',
        hasApi: true,
        hideDateFields: true,
        params: { data_type: 'PRODUCTION' },
        templateHeaders: ['Date', 'Source', 'Quantity MT', 'Destination', 'Mineral Type', 'Coal Type', 'Remarks'],
        templateExample: '2024-05-15,DPA,500.5,Export,Coal,Bituminous,Production note',
        exportFields: ['date', 'source', 'quantity_mt', 'destination', 'mineral_type', 'coal_type_name', 'remarks'],
        fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'source', label: 'Source', type: 'text', required: true },
            { key: 'quantity_mt', label: 'Quantity MT', type: 'number', required: true },
            { key: 'destination', label: 'Destination', type: 'select', options: [
                { value: 'Domestic', label: 'Domestic' },
                { value: 'Export', label: 'Export' }
            ], required: true },
            { key: 'mineral_type', label: 'Mineral Type', type: 'text', default: 'Coal', hidden: true },
            { key: 'coal_type', label: 'Coal Type', type: 'api-select', apiUrl: '/master-data/settings/fuel-types/dropdown/?category=COAL', apiLabel: 'fuel_name', required: true },
        ],
        filters: [
            { key: 'coal_type', label: 'Coal Type', type: 'api-select', apiUrl: '/master-data/settings/fuel-types/dropdown/?category=COAL', apiLabel: 'fuel_name', apiValue: 'id' }
        ],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'source', label: 'Source' },
            { key: 'quantity_mt', label: 'Quantity (MT)', render: (item) => <span className="font-mono font-bold text-slate-700">{item.quantity_mt ? parseFloat(item.quantity_mt).toLocaleString() : '—'}</span> },
            { key: 'destination', label: 'Destination' },
            { key: 'coal_type_name', label: 'Coal Type', sortKey: 'coal_type__fuel_name' },
        ],
    },
    'export': {
        title: 'Coal Export Data',
        singular: 'Export Record',
        moduleKey: 'coal',
        description: 'Records of coal products exported from Bhutan.',
        icon: ArrowRightLeft,
        api: '/coal/trade/',
        hasApi: true,
        hideDateFields: true,
        params: { data_type: 'EXPORT' },
        templateHeaders: ['Date', 'Source', 'Quantity MT', 'Destination', 'Mineral Type', 'Coal Type', 'Remarks'],
        templateExample: '2024-05-15,DPA,500.5,Export,Coal,Bituminous,Export note',
        exportFields: ['date', 'source', 'quantity_mt', 'destination', 'mineral_type', 'coal_type_name', 'remarks'],
        fields: [
            { key: 'date', label: 'Date', type: 'date', required: true },
            { key: 'source', label: 'Source', type: 'text', required: true },
            { key: 'quantity_mt', label: 'Quantity MT', type: 'number', required: true },
            { key: 'destination', label: 'Destination', type: 'select', options: [
                { value: 'Domestic', label: 'Domestic' },
                { value: 'Export', label: 'Export' }
            ], required: true },
            { key: 'mineral_type', label: 'Mineral Type', type: 'text', default: 'Coal', hidden: true },
            { key: 'coal_type', label: 'Coal Type', type: 'api-select', apiUrl: '/master-data/settings/fuel-types/dropdown/?category=COAL', apiLabel: 'fuel_name', required: true },
        ],
        filters: [
            { key: 'coal_type', label: 'Coal Type', type: 'api-select', apiUrl: '/master-data/settings/fuel-types/dropdown/?category=COAL', apiLabel: 'fuel_name', apiValue: 'id' }
        ],
        columns: [
            { key: 'date', label: 'Date' },
            { key: 'source', label: 'Source' },
            { key: 'quantity_mt', label: 'Quantity (MT)', render: (item) => <span className="font-mono font-bold text-slate-700">{item.quantity_mt ? parseFloat(item.quantity_mt).toLocaleString() : '—'}</span> },
            { key: 'destination', label: 'Destination' },
            { key: 'coal_type_name', label: 'Coal Type', sortKey: 'coal_type__fuel_name' },
        ],
    }
};

export default function CoalPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'production';

    const setTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Coal' },
    ];

    return (
        <DashboardLayout breadcrumbs={breadcrumbs} title="Coal Management">
            <div className="space-y-5">
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1e293b 0%,#334155 55%,#475569 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Mountain className="h-6 w-6 text-slate-300" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-slate-400/80 mb-0.5">Primary Energy</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">Coal Management</h1>
                                <p className="text-xs text-white/50 mt-0.5">Manage coal production and export records.</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                    {TABS.map(t => {
                        const Icon = t.icon;
                        const isActive = tab === t.key;
                        return (
                            <button key={t.key} onClick={() => setTab(t.key)}
                                className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                                    ${isActive 
                                        ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                                        : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                <Icon className={`h-4 w-4 ${isActive ? t.color : 'opacity-40'}`} />
                                {t.label}
                            </button>
                        );
                    })}
                </div>

                <DataCollectionEngine key={tab} config={CONFIGS[tab]} standalone={false} />
            </div>
        </DashboardLayout>
    );
}
