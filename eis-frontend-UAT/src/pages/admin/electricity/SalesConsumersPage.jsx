import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShoppingCart, Users } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../data-collection/DataCollectionEngine';
import { cn } from '../../../utils/cn';

const TABS = [
    { key: 'sales', label: 'Electricity Sales', icon: ShoppingCart },
    { key: 'consumers', label: 'Consumer Statistics', icon: Users },
];

const salesConfig = {
    title: 'Electricity Sales Data',
    singular: 'Sales Record',
    moduleKey: 'electricity_data',
    api: '/electricity/sales/',
    fields: [
        { key: 'date',                      label: 'Date',                         type: 'date',   required: true, half: true },
        { key: 'dzongkhag',                 label: 'Dzongkhag',                    type: 'text',   required: true, half: true },
        { key: 'rural_residents',           label: 'Rural Residents',              type: 'number', half: true },
        { key: 'rural_cooperatives',        label: 'Rural Cooperatives',           type: 'number', half: true },
        { key: 'rural_microtrades',         label: 'Rural Microtrades',            type: 'number', half: true },
        { key: 'rural_community_lhakhangs', label: 'Rural Community Lhakhangs',   type: 'number', half: true },
        { key: 'highlands',                 label: 'Highlands',                    type: 'number', half: true },
        { key: 'urban_residents',           label: 'Urban Residents',              type: 'number', half: true },
        { key: 'religious_institutions',    label: 'Religious Institutions',       type: 'number', half: true },
        { key: 'cottage_small_industries',  label: 'Cottage & Small Industries',   type: 'number', half: true },
        { key: 'commercial',                label: 'Commercial',                   type: 'number', half: true },
        { key: 'industries',                label: 'Industries',                   type: 'number', half: true },
        { key: 'agriculture',               label: 'Agriculture',                  type: 'number', half: true },
        { key: 'institutions',              label: 'Institutions',                 type: 'number', half: true },
        { key: 'street_lighting',           label: 'Street Lighting',             type: 'number', half: true },
        { key: 'power_house_auxiliaries',   label: 'Power House Auxiliaries',     type: 'number', half: true },
        { key: 'temporary_connections',     label: 'Temporary Connections',       type: 'number', half: true },
        { key: 'lv_bulk',                   label: 'LV Bulk',                      type: 'number', half: true },
        { key: 'mv_industries',             label: 'MV Industries',               type: 'number', half: true },
        { key: 'hv_industries',             label: 'HV Industries',               type: 'number', half: true },
        { key: 'electric_vehicles',         label: 'Electric Vehicles',           type: 'number', half: true },
    ],
    columns: [
        { key: 'date',               label: 'Date' },
        { key: 'dzongkhag',          label: 'Dzongkhag' },
        { key: 'rural_residents',    label: 'Rural Residents' },
        { key: 'urban_residents',    label: 'Urban Residents' },
        { key: 'commercial',         label: 'Commercial' },
        { key: 'industries',         label: 'Industries' },
        { key: 'electric_vehicles',  label: 'EV' },
    ],
    templateHeaders: [
        'date', 'dzongkhag',
        'rural_residents', 'rural_cooperatives', 'rural_microtrades', 'rural_community_lhakhangs',
        'highlands', 'urban_residents', 'religious_institutions', 'cottage_small_industries',
        'commercial', 'industries', 'agriculture', 'institutions', 'street_lighting',
        'power_house_auxiliaries', 'temporary_connections', 'lv_bulk',
        'mv_industries', 'hv_industries', 'electric_vehicles', 'remarks'
    ],
};



const consumersConfig = {
    title: 'Consumer Statistics',
    singular: 'Consumer Record',
    moduleKey: 'electricity_data',
    api: '/electricity/consumers/',
    fields: [
        { key: 'date',                      label: 'Date',                         type: 'date',   required: true, half: true },
        { key: 'dzongkhag',                 label: 'Dzongkhag',                    type: 'text',   required: true, half: true },
        { key: 'rural_residents',           label: 'Rural Residents',              type: 'number', half: true },
        { key: 'rural_cooperatives',        label: 'Rural Cooperatives',           type: 'number', half: true },
        { key: 'rural_microtrades',         label: 'Rural Microtrades',            type: 'number', half: true },
        { key: 'rural_community_lhakhangs', label: 'Rural Community Lhakhangs',   type: 'number', half: true },
        { key: 'highlands',                 label: 'Highlands',                    type: 'number', half: true },
        { key: 'urban_residents',           label: 'Urban Residents',              type: 'number', half: true },
        { key: 'religious_institutions',    label: 'Religious Institutions',       type: 'number', half: true },
        { key: 'cottage_small_industries',  label: 'Cottage & Small Industries',   type: 'number', half: true },
        { key: 'commercial',                label: 'Commercial',                   type: 'number', half: true },
        { key: 'industries',                label: 'Industries',                   type: 'number', half: true },
        { key: 'agriculture',               label: 'Agriculture',                  type: 'number', half: true },
        { key: 'institutions',              label: 'Institutions',                 type: 'number', half: true },
        { key: 'street_lighting',           label: 'Street Lighting',             type: 'number', half: true },
        { key: 'power_house_auxiliaries',   label: 'Power House Auxiliaries',     type: 'number', half: true },
        { key: 'temporary_connections',     label: 'Temporary Connections',       type: 'number', half: true },
        { key: 'lv_bulk',                   label: 'LV Bulk',                      type: 'number', half: true },
        { key: 'mv_industries',             label: 'MV Industries',               type: 'number', half: true },
        { key: 'hv_industries',             label: 'HV Industries',               type: 'number', half: true },
        { key: 'electric_vehicles',         label: 'Electric Vehicles',           type: 'number', half: true },
    ],
    columns: [
        { key: 'date',               label: 'Date' },
        { key: 'dzongkhag',          label: 'Dzongkhag' },
        { key: 'rural_residents',    label: 'Rural Residents' },
        { key: 'urban_residents',    label: 'Urban Residents' },
        { key: 'commercial',         label: 'Commercial' },
        { key: 'industries',         label: 'Industries' },
        { key: 'electric_vehicles',  label: 'EV' },
    ],
    templateHeaders: [
        'date', 'dzongkhag',
        'rural_residents', 'rural_cooperatives', 'rural_microtrades', 'rural_community_lhakhangs',
        'highlands', 'urban_residents', 'religious_institutions', 'cottage_small_industries',
        'commercial', 'industries', 'agriculture', 'institutions', 'street_lighting',
        'power_house_auxiliaries', 'temporary_connections', 'lv_bulk',
        'mv_industries', 'hv_industries', 'electric_vehicles', 'remarks'
    ],
};


export default function SalesConsumersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || localStorage.getItem('sales_consumers_active_tab') || 'sales';

    const setTab = (newTab) => {
        setSearchParams({ tab: newTab });
        localStorage.setItem('sales_consumers_active_tab', newTab);
    };

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab) {
            localStorage.setItem('sales_consumers_active_tab', queryTab);
        } else {
            setSearchParams({ tab: tab }, { replace: true });
        }
    }, [searchParams, setSearchParams, tab]);

    return (
        <DashboardLayout title="Sales & Consumers Portal">
            <DataCollectionBanner title="Sales & Consumers Portal" description="Manage electricity sales data and consumer statistics." icon={ShoppingCart} />
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

            {tab === 'sales' && <DataCollectionEngine config={salesConfig} standalone={false} />}
            {tab === 'consumers' && <DataCollectionEngine config={consumersConfig} standalone={false} />}
        </DashboardLayout>
    );
}
