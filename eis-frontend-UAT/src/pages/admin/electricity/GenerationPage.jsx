import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Clock, Calendar, Zap } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../data-collection/DataCollectionEngine';
import { cn } from '../../../utils/cn';

const TABS = [
    { key: 'monthly', label: 'Monthly Generation', icon: BarChart3 },
    { key: 'daily',   label: 'Daily Generation',   icon: Calendar },
    { key: 'hourly',  label: 'Hourly Generation',  icon: Clock },
];

const monthlyConfig = {
    title: 'Monthly Generation',
    singular: 'Monthly Record',
    moduleKey: 'electricity_data',
    api: '/electricity/generation/',
    hideDateFields: true,
    templateHeaders: [
        'acronym', 'date', 'internal_consumption', 'target_generation',
        'generation', 'export_generation', 'domestic_sales_generation',
        'domestic_sales_amount', 'export_amount', 'export_tariff', 'remarks'
    ],
    filters: [
        { 
            key: 'acronym', 
            label: 'All Plants', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/', 
            apiLabel: 'plant_name', 
            apiValue: 'acronym' 
        }
    ],
    fields: [
        { 
            key: 'acronym', 
            label: 'Plant Acronym', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/', 
            apiLabel: 'plant_name', 
            apiValue: 'acronym',
            required: true, 
            half: true 
        },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'internal_consumption', label: 'Internal Consumption', type: 'number', half: true },
        { key: 'target_generation', label: 'Target Generation', type: 'number', half: true },
        { key: 'generation', label: 'Generation', type: 'number', half: true },
        { key: 'export_generation', label: 'Export Generation', type: 'number', half: true },
        { key: 'domestic_sales_generation', label: 'Domestic Sales Generation', type: 'number', half: true },
        { key: 'domestic_sales_amount', label: 'Domestic Sales Amount', type: 'number', half: true },
        { key: 'export_amount', label: 'Export Amount', type: 'number', half: true },
        { key: 'export_tariff', label: 'Export Tariff', type: 'number', half: true },
    ],
    columns: [
        { 
            key: 'period', 
            label: 'Period',
            sortKey: 'date',
            render: (item) => {
                const months = [
                    'January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'
                ];
                const mLabel = item.month_val ? months[item.month_val - 1] : 'Annual';
                return (
                    <div className="flex flex-col">
                        <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">{item.year_val || '—'}</span>
                        <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight mt-0.5">
                            {mLabel}
                        </span>
                    </div>
                );
            }
        },
        { key: 'acronym', label: 'Acronym' },
        { key: 'date', label: 'Date' },
        { key: 'internal_consumption', label: 'Internal Consumption' },
        { key: 'target_generation', label: 'Target Generation' },
        { key: 'generation', label: 'Generation' },
        { key: 'export_generation', label: 'Export Generation' },
        { key: 'domestic_sales_generation', label: 'Domestic Sales Gen' },
        { key: 'domestic_sales_amount', label: 'Domestic Sales Amt' },
        { key: 'export_amount', label: 'Export Amt' },
        { key: 'export_tariff', label: 'Export Tariff' },
        { 
            key: 'created_at', 
            label: 'Uploaded At', 
            sortKey: 'created_at',
            render: (item) => item.created_at ? new Date(item.created_at).toLocaleString() : '—'
        },
        { 
            key: 'updated_at', 
            label: 'Modified At', 
            sortKey: 'updated_at',
            render: (item) => item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'
        },
    ],
};

const dailyConfig = {
    title: 'Daily Generation',
    singular: 'Daily Record',
    moduleKey: 'electricity_data',
    api: '/electricity/generation-daily/',
    hideDateFields: true,
    templateHeaders: [
        'date', 'generation_bhp', 'generation_chp', 'export_chp',
        'generation_khp', 'export_khp', 'generation_thp', 'export_thp',
        'generation_mhp', 'export_mhp', 'generation_dhp', 'export_dhp',
        'generation_nhp', 'export_nhp', 'remarks'
    ],
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'generation_bhp', label: 'Basochhu Gen', type: 'number', half: true },
        { key: 'generation_chp', label: 'Chhukha Gen', type: 'number', half: true },
        { key: 'export_chp', label: 'Chhukha Exp', type: 'number', half: true },
        { key: 'generation_khp', label: 'Kurichhu Gen', type: 'number', half: true },
        { key: 'export_khp', label: 'Kurichhu Exp', type: 'number', half: true },
        { key: 'generation_thp', label: 'Tala Gen', type: 'number', half: true },
        { key: 'export_thp', label: 'Tala Exp', type: 'number', half: true },
        { key: 'generation_mhp', label: 'Mangdechhu Gen', type: 'number', half: true },
        { key: 'export_mhp', label: 'Mangdechhu Exp', type: 'number', half: true },
        { key: 'generation_dhp', label: 'Dagachhu Gen', type: 'number', half: true },
        { key: 'export_dhp', label: 'Dagachhu Exp', type: 'number', half: true },
        { key: 'generation_nhp', label: 'Nikachhu Gen', type: 'number', half: true },
        { key: 'export_nhp', label: 'Nikachhu Exp', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'generation_bhp', label: 'BHP Gen' },
        { key: 'generation_chp', label: 'CHP Gen' },
        { key: 'export_chp', label: 'CHP Exp' },
        { key: 'generation_khp', label: 'KHP Gen' },
        { key: 'export_khp', label: 'KHP Exp' },
        { key: 'generation_thp', label: 'THP Gen' },
        { key: 'export_thp', label: 'THP Exp' },
        { key: 'generation_mhp', label: 'MHP Gen' },
        { key: 'export_mhp', label: 'MHP Exp' },
        { key: 'generation_dhp', label: 'DHP Gen' },
        { key: 'export_dhp', label: 'DHP Exp' },
        { key: 'generation_nhp', label: 'NHP Gen' },
        { key: 'export_nhp', label: 'NHP Exp' },
        { 
            key: 'created_at', 
            label: 'Uploaded At', 
            sortKey: 'created_at',
            render: (item) => item.created_at ? new Date(item.created_at).toLocaleString() : '—'
        },
        { 
            key: 'updated_at', 
            label: 'Modified At', 
            sortKey: 'updated_at',
            render: (item) => item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'
        },
    ],
};

const hourlyConfig = {
    title: 'Hourly Generation',
    singular: 'Hourly Record',
    moduleKey: 'electricity_data',
    api: '/electricity/generation-hourly/',
    hideDateFields: true,
    templateHeaders: ['plant', 'timestamp', 'date', 'hour', 'unit1', 'unit2', 'unit3', 'unit4', 'unit5', 'unit6', 'remarks'],
    filters: [
        { 
            key: 'plant', 
            label: 'All Plants', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/dropdown/', 
            apiLabel: 'plant_name', 
            apiValue: 'id' 
        }
    ],
    fields: [
        { 
            key: 'plant', 
            label: 'Generation Plant', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/dropdown/', 
            apiLabel: 'plant_name', 
            required: true, 
            half: true 
        },
        { key: 'date',      label: 'Date',            type: 'date',   required: true,  half: true },
        { key: 'timestamp', label: 'Timestamp',        type: 'text',   required: false, half: true },
        { key: 'hour',      label: 'Hour (00–23)',     type: 'text',   required: true,  half: true },
        { key: 'unit1',     label: 'Unit 1',           type: 'number', half: true },
        { key: 'unit2',     label: 'Unit 2',           type: 'number', half: true },
        { key: 'unit3',     label: 'Unit 3',           type: 'number', half: true },
        { key: 'unit4',     label: 'Unit 4',           type: 'number', half: true },
        { key: 'unit5',     label: 'Unit 5',           type: 'number', half: true },
        { key: 'unit6',     label: 'Unit 6',           type: 'number', half: true },
    ],
    columns: [
        { key: 'plant_name', label: 'Plant',     sortKey: 'plant__plant_name' },
        { key: 'date',       label: 'Date',      sortKey: 'date' },
        { key: 'hour',       label: 'Hour',      sortKey: 'hour' },
        { key: 'unit1',      label: 'U1',        sortKey: 'unit1' },
        { key: 'unit2',      label: 'U2',        sortKey: 'unit2' },
        { key: 'unit3',      label: 'U3',        sortKey: 'unit3' },
        { key: 'unit4',      label: 'U4',        sortKey: 'unit4' },
        { key: 'unit5',      label: 'U5',        sortKey: 'unit5' },
        { key: 'unit6',      label: 'U6',        sortKey: 'unit6' },
        { 
            key: 'created_at', 
            label: 'Uploaded At', 
            sortKey: 'created_at',
            render: (item) => item.created_at ? new Date(item.created_at).toLocaleString() : '—'
        },
        { 
            key: 'updated_at', 
            label: 'Modified At', 
            sortKey: 'updated_at',
            render: (item) => item.updated_at ? new Date(item.updated_at).toLocaleString() : '—'
        },
    ],
};



export default function GenerationPage({ fixedType, fixedSubtype, customTitle }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const type = fixedType || searchParams.get('type');
    const subtype = fixedSubtype || searchParams.get('subtype');
    
    // Default to monthly tab if daily/hourly tabs are not relevant for non-hydro
    const isHydro = !type || type.toUpperCase() === 'HYDROPOWER';
    const defaultTab = isHydro ? 'monthly' : 'monthly';
    const tab = searchParams.get('tab') || localStorage.getItem('generation_active_tab') || defaultTab;

    const setTab = (newTab) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('tab', newTab);
        setSearchParams(newParams);
        localStorage.setItem('generation_active_tab', newTab);
    };

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab) {
            localStorage.setItem('generation_active_tab', queryTab);
        } else {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('tab', tab);
            setSearchParams(newParams, { replace: true });
        }
    }, [searchParams, setSearchParams, tab]);

    // Restrict tabs if generation type is not hydropower
    const filteredTabs = TABS.filter(t => {
        if (!isHydro) {
            return t.key === 'monthly';
        }
        return true;
    });

    const activeTab = filteredTabs.some(t => t.key === tab) ? tab : 'monthly';

    // Helper to append type/subtype to API URLs
    const getFilteredApiUrl = (baseApi) => {
        const params = new URLSearchParams();
        if (type) params.set('plant_type', type);
        if (subtype) params.set('plant_subtype', subtype);
        const queryStr = params.toString();
        return queryStr ? `${baseApi}?${queryStr}` : baseApi;
    };

    // Dynamically build configurations based on query parameters
    const activeMonthlyConfig = {
        ...monthlyConfig,
        api: getFilteredApiUrl('/electricity/generation/'),
        filters: monthlyConfig.filters.map(f => {
            if (f.key === 'acronym') {
                return { ...f, apiUrl: getFilteredApiUrl('/master-data/settings/generation-plants/') };
            }
            return f;
        }),
        fields: monthlyConfig.fields.map(f => {
            if (f.key === 'acronym') {
                return { ...f, apiUrl: getFilteredApiUrl('/master-data/settings/generation-plants/') };
            }
            return f;
        })
    };

    const activeHourlyConfig = {
        ...hourlyConfig,
        api: getFilteredApiUrl('/electricity/generation-hourly/'),
        filters: hourlyConfig.filters.map(f => {
            if (f.key === 'plant') {
                return { ...f, apiUrl: getFilteredApiUrl('/master-data/settings/generation-plants/dropdown/') };
            }
            return f;
        }),
        fields: hourlyConfig.fields.map(f => {
            if (f.key === 'plant') {
                return { ...f, apiUrl: getFilteredApiUrl('/master-data/settings/generation-plants/dropdown/') };
            }
            return f;
        })
    };

    const formatTitle = () => {
        if (customTitle) return customTitle;
        if (!type) return "Generation Portal";
        const formatWord = (str) => str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
        const typeStr = formatWord(type);
        const subStr = subtype ? ` - ${formatWord(subtype)}` : '';
        return `${typeStr} Generation${subStr}`;
    };

    return (
        <DashboardLayout title={formatTitle()}>
            <DataCollectionBanner 
                title={formatTitle()} 
                description="Manage electricity generation data from plants." 
                icon={Zap} 
                parentTitle="Electricity Data"
            />
            {filteredTabs.length > 1 && (
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit mb-4">
                    {filteredTabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={cn(
                                'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                                activeTab === t.key 
                                    ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            )}>
                            <t.icon className="h-3.5 w-3.5" />
                            {t.label}
                        </button>
                    ))}
                </div>
            )}

            {activeTab === 'monthly' && <DataCollectionEngine config={activeMonthlyConfig} standalone={false} hideBanner={true} />}
            {activeTab === 'daily'   && <DataCollectionEngine config={dailyConfig}         standalone={false} hideBanner={true} />}
            {activeTab === 'hourly'  && <DataCollectionEngine config={activeHourlyConfig}   standalone={false} hideBanner={true} />}
        </DashboardLayout>
    );
}
