import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Send, Share2, Box, Power } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../data-collection/DataCollectionEngine';
import { cn } from '../../../utils/cn';

const TABS = [
    { key: 'transmission', label: 'Transmission Lines', icon: Send },
    { key: 'distribution', label: 'Distribution Lines', icon: Share2 },
    { key: 'transformers', label: 'Distribution Transformers', icon: Box },
];

const transmissionConfig = {
    title: 'Transmission Line Data',
    singular: 'Transmission Line',
    moduleKey: 'electricity_data',
    api: '/electricity/infra/transmission/',
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'status', label: 'Status', type: 'text', half: true },
        { key: 'line_from', label: 'From', type: 'text', required: true, half: true },
        { key: 'line_to', label: 'To', type: 'text', required: true, half: true },
        { key: 'line_category', label: 'Line Category', type: 'text', half: true },
        { key: 'voltage_level', label: 'Voltage Level (kV)', type: 'text', required: true, half: true },
        { key: 'circuit', label: 'Circuit', type: 'text', half: true },
        { key: 'conductor_type', label: 'Conductor Type', type: 'text', half: true },
        { key: 'configuration', label: 'Configuration', type: 'text', half: true },
        { key: 'ampacity_75', label: 'Ampacity 75°C', type: 'number', half: true },
        { key: 'ampacity_85', label: 'Ampacity 85°C', type: 'number', half: true },
        { key: 'mw_75', label: 'MW 75°C', type: 'number', half: true },
        { key: 'mw_85', label: 'MW 85°C', type: 'number', half: true },
        { key: 'sil', label: 'SIL (MW)', type: 'number', half: true },
        { key: 'line_length', label: 'Line Length (km)', type: 'number', required: true, half: true },
        { key: 'tower_a', label: 'Tower A', type: 'number', half: true },
        { key: 'tower_b', label: 'Tower B', type: 'number', half: true },
        { key: 'tower_c', label: 'Tower C', type: 'number', half: true },
        { key: 'tower_d', label: 'Tower D', type: 'number', half: true },
        { key: 'tower_spl', label: 'Tower SPL', type: 'number', half: true },
        { key: 'tower_q', label: 'Tower Q', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'line_from', label: 'From' },
        { key: 'line_to', label: 'To' },
        { key: 'voltage_level', label: 'Voltage (kV)' },
        { key: 'line_length', label: 'Length (km)' },
        { key: 'status', label: 'Status' },
        { key: 'conductor_type', label: 'Conductor' },
    ],
    templateHeaders: [
        'date', 'status', 'line_from', 'line_to', 'line_category', 
        'voltage_level', 'circuit', 'conductor_type', 'configuration', 
        'ampacity_75', 'ampacity_85', 'mw_75', 'mw_85', 'sil', 
        'line_length', 'tower_a', 'tower_b', 'tower_c', 'tower_d', 
        'tower_spl', 'tower_q', 'remarks'
    ],
};

const distributionConfig = {
    title: 'Distribution Line Data',
    singular: 'Distribution Line',
    moduleKey: 'electricity_data',
    api: '/electricity/infra/distribution/',
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'dzongkhag', label: 'Dzongkhag', type: 'api-select', apiUrl: '/master-data/settings/dzongkhags/dropdown/', apiLabel: 'dzongkhag_name', apiValue: 'id', required: true, half: true },
        { key: 'kv33', label: '33kV Line (km)', type: 'number', required: true, half: true },
        { key: 'kv11', label: '11kV Line (km)', type: 'number', required: true, half: true },
        { key: 'kv6_6', label: '6.6kV Line (km)', type: 'number', required: true, half: true },
        { key: 'lv_line', label: 'LV Line (km)', type: 'number', required: true, half: true },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'dzongkhag_name', label: 'Dzongkhag' },
        { key: 'kv33', label: '33kV (km)' },
        { key: 'kv11', label: '11kV (km)' },
        { key: 'kv6_6', label: '6.6kV (km)' },
        { key: 'lv_line', label: 'LV Line (km)' },
    ],
    templateHeaders: ['date', 'dzongkhag', 'kv33', 'kv11', 'kv6_6', 'lv_line', 'remarks'],
};

const transformerConfig = {
    title: 'Distribution Transformers',
    singular: 'Transformer Record',
    moduleKey: 'electricity_data',
    api: '/electricity/infra/dist-transformer/',
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'dzongkhag', label: 'Dzongkhag', type: 'api-select', apiUrl: '/master-data/settings/dzongkhags/dropdown/', apiLabel: 'dzongkhag_name', apiValue: 'id', required: true, half: true },
        { key: 'voltage_ratio', label: 'Voltage Ratio', type: 'text', placeholder: 'e.g. 66/11kV', half: true },
        { key: 'transformer_type', label: 'Transformer Type', type: 'text', placeholder: 'e.g. BPC, Private', half: true },
        { key: 'no_of_transformers_bpc', label: 'No. of Transformers (BPC)', type: 'number', half: true },
        { key: 'capacity_bpc', label: 'Capacity BPC (kVA)', type: 'number', half: true },
        { key: 'no_of_transformers', label: 'No. of Transformers', type: 'number', half: true },
        { key: 'capacity', label: 'Capacity (kVA)', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'dzongkhag_name', label: 'Dzongkhag' },
        { key: 'voltage_ratio', label: 'Voltage Ratio' },
        { key: 'transformer_type', label: 'Transformer Type' },
        { key: 'no_of_transformers_bpc', label: 'No. (BPC)' },
        { key: 'capacity_bpc', label: 'Capacity BPC' },
        { key: 'no_of_transformers', label: 'No. of Transformers' },
        { key: 'capacity', label: 'Capacity' },
    ],
    templateHeaders: [
        'date', 'dzongkhag', 'voltage_ratio', 'transformer_type',
        'no_of_transformers_bpc', 'capacity_bpc', 'no_of_transformers', 'capacity', 'remarks'
    ],
};

export default function InfrastructurePage({ defaultTab = 'transmission' }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || localStorage.getItem('infrastructure_active_tab') || defaultTab;

    const setTab = (newTab) => {
        setSearchParams({ tab: newTab });
        localStorage.setItem('infrastructure_active_tab', newTab);
    };

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab) {
            localStorage.setItem('infrastructure_active_tab', queryTab);
        } else {
            setSearchParams({ tab: tab }, { replace: true });
        }
    }, [searchParams, setSearchParams, tab]);


    return (
        <DashboardLayout title="Lines Transfomer">
            <DataCollectionBanner 
                title="Lines Transfomer" 
                description="Manage data for transmission lines, distribution lines, and distribution transformers." 
                icon={Power} 
                parentTitle="Electricity Data"
            />
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-900/50 rounded-2xl w-fit mb-4">
                {TABS.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={cn(
                            'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all',
                            tab === t.key 
                                ? 'bg-white dark:bg-slate-800 text-primary-600 shadow-sm'
                                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        )}>
                        <t.icon className="h-3.5 w-3.5" />
                        {t.label}
                    </button>
                ))}
            </div>

            {tab === 'transmission' && <DataCollectionEngine config={transmissionConfig} standalone={false} hideBanner={true} />}
            {tab === 'distribution' && <DataCollectionEngine config={distributionConfig} standalone={false} hideBanner={true} />}
            {tab === 'transformers' && <DataCollectionEngine config={transformerConfig} standalone={false} hideBanner={true} />}
        </DashboardLayout>
    );
}
