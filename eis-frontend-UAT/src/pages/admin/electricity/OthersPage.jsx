import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Leaf, Factory, ZapOff, Blocks } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../data-collection/DataCollectionEngine';
import { cn } from '../../../utils/cn';

const TABS = [
    { key: 'biogas', label: 'Biogas Generation', icon: Leaf },
    { key: 'industry',label: 'Industry Power', icon: Factory },
    { key: 'load',    label: 'Substation Load', icon: ZapOff },
];

const biogasConfig = {
    title: 'Biogas Generation Data',
    singular: 'Biogas Record',
    moduleKey: 'electricity_data',
    api: '/electricity/biogas/',
    fields: [
        { key: 'fiscal_year', label: 'Fiscal Year', type: 'text', required: true, half: true },
        { key: 'date', label: 'Date', type: 'date', half: true },
        { key: 'dzongkhag', label: 'Dzongkhag', type: 'text', required: true, half: true },
        { key: 'small_4m3', label: 'Small 4m³', type: 'number', half: true },
        { key: 'small_6m3', label: 'Small 6m³', type: 'number', half: true },
        { key: 'small_8m3', label: 'Small 8m³', type: 'number', half: true },
        { key: 'small_10m3', label: 'Small 10m³', type: 'number', half: true },
        { key: 'unspecified', label: 'Unspecified', type: 'number', half: true },
        { key: 'medium', label: 'Medium', type: 'number', half: true },
        { key: 'plant_type', label: 'Plant Type', type: 'text', half: true },
    ],
    columns: [
        { key: 'fiscal_year', label: 'Fiscal Year' },
        { key: 'date', label: 'Date' },
        { key: 'dzongkhag', label: 'Dzongkhag' },
        { key: 'small_4m3', label: 'Small 4m³' },
        { key: 'small_6m3', label: 'Small 6m³' },
        { key: 'small_8m3', label: 'Small 8m³' },
        { key: 'small_10m3', label: 'Small 10m³' },
        { key: 'unspecified', label: 'Unspecified' },
        { key: 'medium', label: 'Medium' },
        { key: 'plant_type', label: 'Plant Type' },
    ],
    templateHeaders: [
        'fiscal_year', 'date', 'dzongkhag', 'small_4m3', 'small_6m3',
        'small_8m3', 'small_10m3', 'unspecified', 'medium', 'plant_type', 'remarks'
    ],
};

const industryConfig = {
    title: 'Industry Power Data',
    singular: 'Industry Record',
    moduleKey: 'electricity_data',
    api: '/electricity/industry/',
    fields: [
        { key: 'business_name', label: 'Business Name', type: 'text', required: true, half: true },
        { key: 'activity', label: 'Activity', type: 'text', half: true },
        { key: 'industry_category', label: 'Industry Category', type: 'text', half: true },
        { key: 'max_power', label: 'Max Power (MW)', type: 'number', half: true },
        { key: 'location', label: 'Location', type: 'text', half: true },
        { key: 'dzongkhag', label: 'Dzongkhag', type: 'text', half: true },
        { key: 'cod', label: 'COD', type: 'text', half: true },
        { key: 'app_status', label: 'App Status', type: 'text', half: true },
        { key: 'voltage_type', label: 'Voltage Type', type: 'text', half: true },
        { key: 'validity_status', label: 'Validity Status', type: 'text', half: true },
        { key: 'feeding_substation', label: 'Feeding Substation', type: 'text', half: true },
        { key: 'feeder_name', label: 'Feeder Name', type: 'text', half: true },
    ],
    columns: [
        { key: 'business_name', label: 'Business Name' },
        { key: 'dzongkhag', label: 'Dzongkhag' },
        { key: 'industry_category', label: 'Category' },
        { key: 'max_power', label: 'Max Power (MW)' },
        { key: 'app_status', label: 'Status' },
    ],
    templateHeaders: [
        'business_name', 'activity', 'industry_category', 'max_power', 'location',
        'dzongkhag', 'cod', 'app_status', 'voltage_type', 'validity_status',
        'feeding_substation', 'feeder_name', 'remarks'
    ],
};

const loadConfig = {
    title: 'Substation Load Data',
    singular: 'Load Record',
    moduleKey: 'electricity_data',
    api: '/electricity/substation-load/',
    fields: [
        { key: 'timestamp', label: 'Timestamp', type: 'datetime-local', required: true, half: true },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'hour', label: 'Hour', type: 'number', required: true, half: true },
        // Substations
        { key: 'tsi_mw', label: 'TSI MW', type: 'number', half: true }, { key: 'tsi_mvar', label: 'TSI MVAR', type: 'number', half: true },
        { key: 'bhp_mw', label: 'BHP MW', type: 'number', half: true }, { key: 'bhp_mvar', label: 'BHP MVAR', type: 'number', half: true },
        { key: 'chp_mw', label: 'CHP MW', type: 'number', half: true }, { key: 'chp_mvar', label: 'CHP MVAR', type: 'number', half: true },
        { key: 'gwa_mw', label: 'GWA MW', type: 'number', half: true }, { key: 'gwa_mvar', label: 'GWA MVAR', type: 'number', half: true },
        { key: 'lsa_mw', label: 'LSA MW', type: 'number', half: true }, { key: 'lsa_mvar', label: 'LSA MVAR', type: 'number', half: true },
        { key: 'sem_mw', label: 'SEM MW', type: 'number', half: true }, { key: 'sem_mvar', label: 'SEM MVAR', type: 'number', half: true },
        { key: 'den_mw', label: 'DEN MW', type: 'number', half: true }, { key: 'den_mvar', label: 'DEN MVAR', type: 'number', half: true },
        { key: 'ola_mw', label: 'OLA MW', type: 'number', half: true }, { key: 'ola_mvar', label: 'OLA MVAR', type: 'number', half: true },
        { key: 'jem_mw', label: 'JEM MW', type: 'number', half: true }, { key: 'jem_mvar', label: 'JEM MVAR', type: 'number', half: true },
        { key: 'pro_mw', label: 'PRO MW', type: 'number', half: true }, { key: 'pro_mvar', label: 'PRO MVAR', type: 'number', half: true },
        { key: 'haa_mw', label: 'HAA MW', type: 'number', half: true }, { key: 'haa_mvar', label: 'HAA MVAR', type: 'number', half: true },
        { key: 'dhp_mw', label: 'DHP MW', type: 'number', half: true }, { key: 'dhp_mvar', label: 'DHP MVAR', type: 'number', half: true },
        { key: 'ged_mw', label: 'GED MW', type: 'number', half: true }, { key: 'ged_mvar', label: 'GED MVAR', type: 'number', half: true },
        { key: 'plg_mw', label: 'PLG MW', type: 'number', half: true }, { key: 'plg_mvar', label: 'PLG MVAR', type: 'number', half: true },
        { key: 'gom_mw', label: 'GOM MW', type: 'number', half: true }, { key: 'gom_mvar', label: 'GOM MVAR', type: 'number', half: true },
        { key: 'mal_mw', label: 'MAL MW', type: 'number', half: true }, { key: 'mal_mvar', label: 'MAL MVAR', type: 'number', half: true },
        { key: 'sgo_mw', label: 'SGO MW', type: 'number', half: true }, { key: 'sgo_mvar', label: 'SGO MVAR', type: 'number', half: true },
        { key: 'dam_mw', label: 'DAM MW', type: 'number', half: true }, { key: 'dam_mvar', label: 'DAM MVAR', type: 'number', half: true },
        { key: 'cha_mw', label: 'CHA MW', type: 'number', half: true }, { key: 'cha_mvar', label: 'CHA MVAR', type: 'number', half: true },
        { key: 'damji_mw', label: 'DAMJI MW', type: 'number', half: true }, { key: 'damji_mvar', label: 'DAMJI MVAR', type: 'number', half: true },
        { key: 'pan_mw', label: 'PAN MW', type: 'number', half: true }, { key: 'pan_mvar', label: 'PAN MVAR', type: 'number', half: true },
        { key: 'doc_mw', label: 'DOC MW', type: 'number', half: true }, { key: 'doc_mvar', label: 'DOC MVAR', type: 'number', half: true },
        { key: 'jamjee_mw', label: 'JAMJEE MW', type: 'number', half: true }, { key: 'jamjee_mvar', label: 'JAMJEE MVAR', type: 'number', half: true },
        { key: 'ged220_mw', label: 'GED220 MW', type: 'number', half: true }, { key: 'ged220_mvar', label: 'GED220 MVAR', type: 'number', half: true },
        { key: 'kan_mw', label: 'KAN MW', type: 'number', half: true }, { key: 'kan_mvar', label: 'KAN MVAR', type: 'number', half: true },
        { key: 'kil_mw', label: 'KIL MW', type: 'number', half: true }, { key: 'kil_mvar', label: 'KIL MVAR', type: 'number', half: true },
        { key: 'khp_mw', label: 'KHP MW', type: 'number', half: true }, { key: 'khp_mvar', label: 'KHP MVAR', type: 'number', half: true },
        { key: 'nko_mw', label: 'NKO MW', type: 'number', half: true }, { key: 'nko_mvar', label: 'NKO MVAR', type: 'number', half: true },
        { key: 'deo_mw', label: 'DEO MW', type: 'number', half: true }, { key: 'deo_mvar', label: 'DEO MVAR', type: 'number', half: true },
        { key: 'mga_mw', label: 'MGA MW', type: 'number', half: true }, { key: 'mga_mvar', label: 'MGA MVAR', type: 'number', half: true },
        { key: 'nga_mw', label: 'NGA MW', type: 'number', half: true }, { key: 'nga_mvar', label: 'NGA MVAR', type: 'number', half: true },
        { key: 'dccl_mw', label: 'DCCL MW', type: 'number', half: true }, { key: 'dccl_mvar', label: 'DCCL MVAR', type: 'number', half: true },
        { key: 'tin_mw', label: 'TIN MW', type: 'number', half: true }, { key: 'tin_mvar', label: 'TIN MVAR', type: 'number', half: true },
        { key: 'yur_mw', label: 'YUR MW', type: 'number', half: true }, { key: 'yur_mvar', label: 'YUR MVAR', type: 'number', half: true },
        { key: 'jlg_mw', label: 'JLG MW', type: 'number', half: true }, { key: 'jlg_mvar', label: 'JLG MVAR', type: 'number', half: true },
        { key: 'gel_mw', label: 'GEL MW', type: 'number', half: true }, { key: 'gel_mvar', label: 'GEL MVAR', type: 'number', half: true },
        { key: 'cor_mw', label: 'COR MW', type: 'number', half: true }, { key: 'cor_mvar', label: 'COR MVAR', type: 'number', half: true },
        { key: 'phu_mw', label: 'PHU MW', type: 'number', half: true }, { key: 'phu_mvar', label: 'PHU MVAR', type: 'number', half: true },
        { key: 'dag_mw', label: 'DAG MW', type: 'number', half: true }, { key: 'dag_mvar', label: 'DAG MVAR', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'hour', label: 'Hour' },
        { key: 'timestamp', label: 'Timestamp' },
    ],
    templateHeaders: [
        'timestamp', 'date', 'hour',
        'tsi_mw', 'tsi_mvar', 'bhp_mw', 'bhp_mvar', 'chp_mw', 'chp_mvar', 'gwa_mw', 'gwa_mvar',
        'lsa_mw', 'lsa_mvar', 'sem_mw', 'sem_mvar', 'den_mw', 'den_mvar', 'ola_mw', 'ola_mvar',
        'jem_mw', 'jem_mvar', 'pro_mw', 'pro_mvar', 'haa_mw', 'haa_mvar', 'dhp_mw', 'dhp_mvar',
        'ged_mw', 'ged_mvar', 'plg_mw', 'plg_mvar', 'gom_mw', 'gom_mvar', 'mal_mw', 'mal_mvar',
        'sgo_mw', 'sgo_mvar', 'dam_mw', 'dam_mvar', 'cha_mw', 'cha_mvar', 'damji_mw', 'damji_mvar',
        'pan_mw', 'pan_mvar', 'doc_mw', 'doc_mvar', 'jamjee_mw', 'jamjee_mvar', 'ged220_mw', 'ged220_mvar',
        'kan_mw', 'kan_mvar', 'kil_mw', 'kil_mvar', 'khp_mw', 'khp_mvar', 'nko_mw', 'nko_mvar',
        'deo_mw', 'deo_mvar', 'mga_mw', 'mga_mvar', 'nga_mw', 'nga_mvar', 'dccl_mw', 'dccl_mvar',
        'tin_mw', 'tin_mvar', 'yur_mw', 'yur_mvar', 'jlg_mw', 'jlg_mvar', 'gel_mw', 'gel_mvar',
        'cor_mw', 'cor_mvar', 'phu_mw', 'phu_mvar', 'dag_mw', 'dag_mvar', 'remarks'
    ],
};

export default function OthersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || localStorage.getItem('others_active_tab') || 'biogas';

    const setTab = (newTab) => {
        setSearchParams({ tab: newTab });
        localStorage.setItem('others_active_tab', newTab);
    };

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab) {
            localStorage.setItem('others_active_tab', queryTab);
        } else {
            setSearchParams({ tab: tab }, { replace: true });
        }
    }, [searchParams, setSearchParams, tab]);

    return (
        <DashboardLayout title="Other Electricity Modules">
            <DataCollectionBanner title="Other Electricity Modules" description="Manage biogas generation, industry power, and substation load records." icon={Blocks} />
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

            {tab === 'biogas'   && <DataCollectionEngine config={biogasConfig} standalone={false} />}
            {tab === 'industry' && <DataCollectionEngine config={industryConfig} standalone={false} />}
            {tab === 'load'     && <DataCollectionEngine config={loadConfig} standalone={false} />}
        </DashboardLayout>
    );
}
