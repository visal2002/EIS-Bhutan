import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Globe, FileCheck, Landmark } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../data-collection/DataCollectionEngine';
import { cn } from '../../../utils/cn';

const TABS = [
    { key: 'export',     label: 'Export DAM',          icon: Globe },
    { key: 'import',     label: 'Import DAM',          icon: Globe },
    { key: 'import_rtm', label: 'Import RTM',          icon: Globe },
    { key: 'rea',        label: 'Export REA',          icon: FileCheck },
    { key: 'royalty',    label: 'Royalty Energy',      icon: Landmark },
];

const exportConfig = {
    title: 'Export DAM Data',
    singular: 'Export DAM Record',
    moduleKey: 'electricity_data',
    api: '/electricity/trade/market-export/',
    fields: [
        { 
            key: 'plant', 
            label: 'Generation Plant', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/dropdown/', 
            apiLabel: 'plant_name', 
            apiValue: 'acronym', 
            required: true, 
            half: true 
        },
        { key: 'timestamp', label: 'Timestamp', type: 'datetime-local', half: true },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'block', label: 'Block', type: 'text', half: true },
        { key: 'qty_mw', label: 'Qty (MW)', type: 'number', required: true, half: true },
        { key: 'rate_per_mwh', label: 'Rate per MWh (Nu)', type: 'number', half: true },
        { key: 'iex_margin_rate', label: 'IEX Margin Rate', type: 'number', half: true },
        { key: 'igst_rate', label: 'IGST Rate', type: 'number', half: true },
        { key: 'trader_margin_rate', label: 'Trader Margin Rate', type: 'number', half: true },
        { key: 'nldc_app_fee', label: 'NLDC App Fee (Nu)', type: 'number', half: true },
        { key: 'successful_portfolios', label: 'Successful Portfolios', type: 'number', half: true },
    ],
    columns: [
        { key: 'acronym', label: 'Plant', sortKey: 'acronym' },
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'block', label: 'Block' },
        { key: 'qty_mw', label: 'Qty (MW)' },
        { key: 'rate_per_mwh', label: 'Rate' },
    ],
    templateHeaders: [
        'plant', 'timestamp', 'date', 'block', 'qty_mw', 'rate_per_mwh',
        'iex_margin_rate', 'igst_rate', 'trader_margin_rate', 'nldc_app_fee', 'successful_portfolios', 'remarks'
    ],
};

const importDamConfig = {
    title: 'Import DAM Data',
    singular: 'Import DAM Record',
    moduleKey: 'electricity_data',
    api: '/electricity/trade/market-import/',
    fields: [
        { key: 'timestamp', label: 'Timestamp', type: 'datetime-local', half: true },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'block', label: 'Block', type: 'text', half: true },
        { key: 'qty_mw', label: 'Qty (MW)', type: 'number', required: true, half: true },
        { key: 'rate_per_mwh', label: 'Rate per MWh (Nu)', type: 'number', half: true },
        { key: 'india_trans_loss', label: 'India Trans Loss', type: 'number', half: true },
        { key: 'ctu_charge_rate', label: 'CTU Charge Rate', type: 'number', half: true },
        { key: 'iex_margin_rate', label: 'IEX Margin Rate', type: 'number', half: true },
        { key: 'igst_rate', label: 'IGST Rate', type: 'number', half: true },
        { key: 'trader_margin_rate', label: 'Trader Margin Rate', type: 'number', half: true },
        { key: 'nldc_app_fee', label: 'NLDC App Fee (Nu)', type: 'number', half: true },
        { key: 'successful_portfolios', label: 'Successful Portfolios', type: 'number', half: true },
        { key: 'nldc_op_charge', label: 'NLDC Op Charge (Nu)', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'block', label: 'Block' },
        { key: 'qty_mw', label: 'Qty (MW)' },
        { key: 'rate_per_mwh', label: 'Rate' },
    ],
    templateHeaders: [
        'timestamp', 'date', 'block', 'qty_mw', 'rate_per_mwh',
        'india_trans_loss', 'ctu_charge_rate', 'iex_margin_rate', 'igst_rate',
        'trader_margin_rate', 'nldc_app_fee', 'successful_portfolios', 'nldc_op_charge', 'remarks'
    ],
};

const importRtmConfig = {
    title: 'Import RTM Data',
    singular: 'Import RTM Record',
    moduleKey: 'electricity_data',
    api: '/electricity/trade/market-import-rtm/',
    fields: [
        { key: 'timestamp', label: 'Timestamp', type: 'datetime-local', half: true },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'block', label: 'Block', type: 'text', half: true },
        { key: 'qty_mw', label: 'Qty (MW)', type: 'number', required: true, half: true },
        { key: 'rate_per_mwh', label: 'Rate per MWh (Nu)', type: 'number', half: true },
        { key: 'india_trans_loss', label: 'India Trans Loss', type: 'number', half: true },
        { key: 'ctu_charge_rate', label: 'CTU Charge Rate', type: 'number', half: true },
        { key: 'iex_margin_rate', label: 'IEX Margin Rate', type: 'number', half: true },
        { key: 'igst_rate', label: 'IGST Rate', type: 'number', half: true },
        { key: 'trader_margin_rate', label: 'Trader Margin Rate', type: 'number', half: true },
        { key: 'nldc_app_fee', label: 'NLDC App Fee (Nu)', type: 'number', half: true },
        { key: 'successful_portfolios', label: 'Successful Portfolios', type: 'number', half: true },
        { key: 'nldc_op_charge', label: 'NLDC Op Charge (Nu)', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'block', label: 'Block' },
        { key: 'qty_mw', label: 'Qty (MW)' },
        { key: 'rate_per_mwh', label: 'Rate' },
    ],
    templateHeaders: [
        'timestamp', 'date', 'block', 'qty_mw', 'rate_per_mwh',
        'india_trans_loss', 'ctu_charge_rate', 'iex_margin_rate', 'igst_rate',
        'trader_margin_rate', 'nldc_app_fee', 'successful_portfolios', 'nldc_op_charge', 'remarks'
    ],
};

const reaConfig = {
    title: 'Export REA Data',
    singular: 'REA Record',
    moduleKey: 'electricity_data',
    api: '/electricity/trade/rea/',
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'chp_energy', label: 'CHP Energy', type: 'number', half: true },
        { key: 'chp_tariff', label: 'CHP Tariff', type: 'number', half: true },
        { key: 'khp_energy', label: 'KHP Energy', type: 'number', half: true },
        { key: 'khp_tariff', label: 'KHP Tariff', type: 'number', half: true },
        { key: 'mhp_energy', label: 'MHP Energy', type: 'number', half: true },
        { key: 'mhp_tariff', label: 'MHP Tariff', type: 'number', half: true },
        { key: 'thp_energy', label: 'THP Energy', type: 'number', half: true },
        { key: 'thp_tariff', label: 'THP Tariff', type: 'number', half: true },
        { key: 'dhp_energy', label: 'DHP Energy', type: 'number', half: true },
        { key: 'dhp_tariff', label: 'DHP Tariff', type: 'number', half: true },
        { key: 'nhp_energy', label: 'NHP Energy', type: 'number', half: true },
        { key: 'nhp_tariff', label: 'NHP Tariff', type: 'number', half: true },
    ],
    columns: [
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'chp_energy', label: 'CHP Energy' },
        { key: 'chp_tariff', label: 'CHP Tariff' },
        { key: 'khp_energy', label: 'KHP Energy' },
        { key: 'khp_tariff', label: 'KHP Tariff' },
        { key: 'mhp_energy', label: 'MHP Energy' },
        { key: 'mhp_tariff', label: 'MHP Tariff' },
        { key: 'thp_energy', label: 'THP Energy' },
        { key: 'thp_tariff', label: 'THP Tariff' },
        { key: 'dhp_energy', label: 'DHP Energy' },
        { key: 'dhp_tariff', label: 'DHP Tariff' },
        { key: 'nhp_energy', label: 'NHP Energy' },
        { key: 'nhp_tariff', label: 'NHP Tariff' },
    ],
    templateHeaders: [
        'date',
        'chp_energy', 'chp_tariff',
        'khp_energy', 'khp_tariff',
        'mhp_energy', 'mhp_tariff',
        'thp_energy', 'thp_tariff',
        'dhp_energy', 'dhp_tariff',
        'nhp_energy', 'nhp_tariff',
        'remarks'
    ],
};

const royaltyConfig = {
    title: 'Royalty Energy Data',
    singular: 'Royalty Record',
    moduleKey: 'electricity_data',
    api: '/electricity/royalty/',
    fields: [
        { 
            key: 'acronym', 
            label: 'Generation Plant', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/dropdown/', 
            apiLabel: 'plant_name', 
            apiValue: 'acronym', 
            required: true, 
            half: true 
        },
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'generation', label: 'Generation (GWh)', type: 'text', half: true },
        { key: 'gen_royalty_rate', label: 'Royalty Rate (%)', type: 'number', half: true },
        { key: 'aux_rate', label: 'Auxiliary Rate (%)', type: 'number', half: true },
        { key: 'line_losses_rate', label: 'Line Losses (%)', type: 'number', half: true },
        { key: 'export_tariff', label: 'Export Tariff (Nu)', type: 'number', half: true },
        { key: 'wheeling_rate', label: 'Wheeling Rate (Nu)', type: 'number', half: true },
        { key: 'schedule_export', label: 'Schedule Export (GWh)', type: 'text', half: true },
        { key: 'domestic_tariff', label: 'Domestic Tariff (Nu)', type: 'number', half: true },
        { key: 'rebate', label: 'Rebate (Nu)', type: 'number', half: true },
        { key: 'export_tariff_iex', label: 'Export Tariff IEX (Nu)', type: 'number', half: true, hint: 'NHP only' },
        { key: 'export_tariff_ptc', label: 'Export Tariff PTC (Nu)', type: 'number', half: true, hint: 'NHP only' },
        { key: 'schedule_export_iex', label: 'Schedule Export IEX (GWh)', type: 'text', half: true, hint: 'NHP only' },
        { key: 'schedule_export_ptc', label: 'Schedule Export PTC (GWh)', type: 'text', half: true, hint: 'NHP only' },
    ],
    columns: [
        { key: 'acronym', label: 'Plant', sortKey: 'acronym' },
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'generation', label: 'Generation (GWh)' },
        { key: 'schedule_export', label: 'Schedule Export (GWh)' },
        { key: 'gen_royalty_rate', label: 'Royalty %' },
        { key: 'export_tariff', label: 'Export Tariff' },
    ],
    templateHeaders: [
        'acronym', 'date', 'generation', 'gen_royalty_rate', 'aux_rate', 'line_losses_rate',
        'export_tariff', 'wheeling_rate', 'schedule_export', 'domestic_tariff', 'rebate',
        'export_tariff_iex', 'export_tariff_ptc', 'schedule_export_iex', 'schedule_export_ptc', 'remarks'
    ],
};

export default function TradePage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || localStorage.getItem('trade_active_tab') || 'export';

    const setTab = (newTab) => {
        setSearchParams({ tab: newTab });
        localStorage.setItem('trade_active_tab', newTab);
    };

    useEffect(() => {
        const queryTab = searchParams.get('tab');
        if (queryTab) {
            localStorage.setItem('trade_active_tab', queryTab);
        } else {
            setSearchParams({ tab: tab }, { replace: true });
        }
    }, [searchParams, setSearchParams, tab]);

    return (
        <DashboardLayout title="Trade & REA Portal">
            <DataCollectionBanner title="Trade & REA Portal" description="Manage trade market data, export REA, and royalty energy." icon={Globe} />
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

            {tab === 'export'     && <DataCollectionEngine config={exportConfig}    standalone={false} />}
            {tab === 'import'     && <DataCollectionEngine config={importDamConfig} standalone={false} />}
            {tab === 'import_rtm' && <DataCollectionEngine config={importRtmConfig} standalone={false} />}
            {tab === 'rea'        && <DataCollectionEngine config={reaConfig}       standalone={false} />}
            {tab === 'royalty'    && <DataCollectionEngine config={royaltyConfig}   standalone={false} />}
        </DashboardLayout>
    );
}
