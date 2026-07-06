import { useSearchParams } from 'react-router-dom';
import { Plane, Flame, FileText } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../DataCollectionEngine';
import { cn } from '../../../../utils/cn';

const TABS = [
    { key: 'aviation', label: 'Aviation', icon: FileText },
    { key: 'consumption', label: 'Aviation Fuel Consumption', icon: Flame },
];


const activityConfig = {
    title: 'Aircraft Activity',
    singular: 'Activity Record',
    moduleKey: 'air_transport',
    api: '/air-transport/activity/',
    hasApi: true,
    hideDateFields: true,
    templateHeaders: [
        'Date', 'Airlines', 'Aircraft Type', 'No. of Flights per Day', 
        'Domestic Landings', 'International Landings', 'Domestic Take-offs', 'International Take-offs', 'Remarks'
    ],
    templateExample: '2024-01-15,Drukair,Airbus A319,2,10,25,10,25,Sample activity',
    exportFields: [
        'date', 'airlines', 'aircraft_type', 'no_of_flights_operating_per_day', 
        'domestic_landings', 'international_landings', 'domestic_takeoffs', 'international_takeoffs', 'remarks'
    ],
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'airlines', label: 'Airlines', type: 'text', placeholder: 'e.g. Drukair, Bhutan Airlines', required: true, half: true },
        { key: 'aircraft_type', label: 'Aircraft Type', type: 'text', placeholder: 'e.g. Airbus A319, ATR 42', required: true, half: true },
        { key: 'no_of_flights_operating_per_day', label: 'Flights Operating / Day', type: 'number', half: true },
        { key: 'domestic_landings', label: 'Domestic Landings', type: 'number', half: true },
        { key: 'international_landings', label: 'International Landings', type: 'number', half: true },
        { key: 'domestic_takeoffs', label: 'Domestic Take-offs', type: 'number', half: true },
        { key: 'international_takeoffs', label: 'International Take-offs', type: 'number', half: true },
    ],
    filters: [
        { key: 'airlines', label: 'Airlines', type: 'text' },
        { key: 'aircraft_type', label: 'Aircraft Type', type: 'text' }
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'airlines', label: 'Airlines' },
        { key: 'aircraft_type', label: 'Aircraft Type' },
        { key: 'no_of_flights_operating_per_day', label: 'Flights/Day' },
        { key: 'domestic_landings', label: 'Domestic Landings' },
        { key: 'international_landings', label: 'Intl Landings' },
    ],
};

const consumptionConfig = {
    title: 'Aviation Fuel Consumption',
    singular: 'Consumption Record',
    moduleKey: 'air_transport',
    api: '/air-transport/consumption/',
    hasApi: true,
    hideDateFields: true,
    templateHeaders: ['Date', 'Airlines', 'Aircraft Type', 'Domestic Fuel Consumption', 'International Fuel Consumption', 'Remarks'],
    templateExample: '2024-01-15,Drukair,Airbus A319,150.5,350.2,Sample fuel usage',
    exportFields: ['date', 'airlines', 'aircraft_type', 'domestic_fuel_consumption', 'international_fuel_consumption', 'remarks'],
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'airlines', label: 'Airlines', type: 'text', placeholder: 'e.g. Drukair, Bhutan Airlines', required: true, half: true },
        { key: 'aircraft_type', label: 'Aircraft Type', type: 'text', placeholder: 'e.g. Airbus A319, ATR 42', required: true, half: true },
        { key: 'domestic_fuel_consumption', label: 'Domestic Fuel Consumption (KL)', type: 'number', half: true },
        { key: 'international_fuel_consumption', label: 'International Fuel Consumption (KL)', type: 'number', half: true },
    ],
    filters: [
        { key: 'airlines', label: 'Airlines', type: 'text' },
        { key: 'aircraft_type', label: 'Aircraft Type', type: 'text' }
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'airlines', label: 'Airlines' },
        { key: 'aircraft_type', label: 'Aircraft Type' },
        { key: 'domestic_fuel_consumption', label: 'Domestic Fuel (KL)' },
        { key: 'international_fuel_consumption', label: 'Intl Fuel (KL)' },
    ],
};


const CONFIGS = {
    'aviation': activityConfig,
    'consumption': consumptionConfig
};

export default function AirTransportPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'aviation';


    const setTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Air Transport' },
    ];

    return (
        <DashboardLayout breadcrumbs={breadcrumbs} title="Air Transport Data Management">
            <DataCollectionBanner 
                title="Air Transport Data Management" 
                description="Manage airlines activity, flights, take-offs, landings, and aviation fuel consumption." 
                icon={Plane} 
                parentTitle="Air Transport Sector"
                gradient="#0f172a 0%,#1e293b 55%,#334155 100%"
            />

            <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 mb-4">
                {TABS.map(t => {
                    const Icon = t.icon;
                    const isActive = tab === t.key;
                    return (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                                ${isActive 
                                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                            <Icon className={`h-4 w-4 ${isActive ? 'text-primary-500' : 'opacity-40'}`} />
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <DataCollectionEngine key={tab} config={CONFIGS[tab]} standalone={false} />
        </DashboardLayout>
    );
}


