// src/pages/admin/electricity/ForecastingPage.jsx
import DataCollectionEngine from '../data-collection/DataCollectionEngine';
import { TrendingUp } from 'lucide-react';

const config = {
    title: 'Supply & Demand Forecasting',
    description: 'Manage supply and demand forecasting records.',
    icon: TrendingUp,
    singular: 'Forecasting Record',
    moduleKey: 'electricity_data',
    api: '/electricity/forecast/',
    fields: [
        { key: 'year', label: 'Year', type: 'date', required: true, half: true },
        { key: 'generation_gwh', label: 'Generation (GWh)', type: 'number', required: true, half: true },
        { key: 'load_gwh', label: 'Load (GWh)', type: 'number', required: true, half: true },
        { key: 'export_gwh', label: 'Export (GWh)', type: 'number', half: true },
        { key: 'import_gwh', label: 'Import (GWh)', type: 'number', half: true },
        { key: 'peakload_mw', label: 'Peak Load (MW)', type: 'number', required: true, half: true },
        { key: 'firm_power', label: 'Firm Power (MW)', type: 'number', half: true },
        { key: 'installed_capacity_mw', label: 'Installed Capacity (MW)', type: 'number', half: true },
    ],
    columns: [
        { key: 'year', label: 'Year' },
        { key: 'generation_gwh', label: 'Gen (GWh)' },
        { key: 'load_gwh', label: 'Load (GWh)' },
        { key: 'peakload_mw', label: 'Peak (MW)' },
    ],
    templateHeaders: [
        'year', 'generation_gwh', 'load_gwh', 'export_gwh', 'import_gwh',
        'peakload_mw', 'firm_power', 'installed_capacity_mw', 'remarks'
    ],
};

export default function ForecastingPage() {
    return <DataCollectionEngine config={config} />;
}
