import { useSearchParams } from 'react-router-dom';
import { Car, Flame, FileText } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../DataCollectionEngine';
import { cn } from '../../../../utils/cn';

const TABS = [
    { key: 'registration', label: 'Vehicle Registration', icon: FileText },
    { key: 'consumption', label: 'Fuel Consumption', icon: Flame },
];

const consumptionConfig = {
    title: 'Surface Transport Fuel Consumption',
    singular: 'Consumption Record',
    moduleKey: 'surface_transport',
    api: '/surface-transport/consumption/',
    hasApi: true,
    templateHeaders: ['Year', 'Month', 'Vehicle Type', 'Fuel Type', 'Odometer', 'Fuel Consumed', 'Original Type', 'Remarks'],
    templateExample: '2024,1,Tractor,Diesel,45000,500.5,Tractor,Survey note',
    exportFields: ['year', 'month', 'vehicle_type_name', 'fuel_type_name', 'odometer_reading', 'fuel_consumed_calculated', 'original_vehicle_type', 'remarks'],
    fields: [
        { key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', apiUrl: '/master-data/vehicle-types/dropdown/', apiLabel: 'vehicle_type_name', required: true, half: true },
        { key: 'fuel_type', label: 'Fuel Type', type: 'api-select', apiUrl: '/master-data/settings/vehicle-fuel-types/dropdown/', apiLabel: 'fuel_name', required: true, half: true },
        { key: 'odometer_reading', label: 'Odometer Reading', type: 'number', half: true },
        { key: 'fuel_consumed_calculated', label: 'Fuel Consumed (Calc)', type: 'number', half: true },
        { key: 'original_vehicle_type', label: 'Original Vehicle Type', type: 'text', half: true },
        { key: 'gross_weight', label: 'Gross Weight', type: 'number', half: true },
    ],
    filters: [
        { key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', apiUrl: '/master-data/vehicle-types/dropdown/', apiLabel: 'vehicle_type_name' },
        { key: 'fuel_type', label: 'Fuel Type', type: 'api-select', apiUrl: '/master-data/settings/vehicle-fuel-types/dropdown/', apiLabel: 'fuel_name' }
    ],
    columns: [
        { key: 'vehicle_type_name', label: 'Vehicle Type', render: (item) => item.vehicle_type_name || item.vehicle_type },
        { key: 'fuel_type_name', label: 'Fuel Type', render: (item) => item.fuel_type_name || item.fuel_type },
        { key: 'odometer_reading', label: 'Odometer' },
        { key: 'fuel_consumed_calculated', label: 'Fuel Consumed' },
    ],
};

const registrationConfig = {
    title: 'Vehicle Registration',
    singular: 'Registration Record',
    moduleKey: 'surface_transport',
    api: '/surface-transport/registration/',
    hasApi: true,
    hideDateFields: true,
    templateHeaders: [
        'Registration No', 'Registration Date', 'Owner Type', 'Vehicle Type', 'Model Name', 'Fuel Type', 
        'Seating Capacity', 'Engine CC', 'Horse Power', 'Kilo Watt Hour', 
        'Gross Vehicle Weight', 'Status', 'Remarks'
    ],
    templateExample: 'BP-1-A1234,2024-01-15,Individual,Tractor,Mahindra,Diesel,2,2500,45,,2000,ACTIVE,Sample',
    exportFields: [
        'registration_no', 'initial_registration_date', 'owner_type', 'vehicle_type_name', 'model_name', 
        'fuel_type_name', 'seating_capacity', 'engine_cc', 'horse_power', 'kilo_watt_hour', 
        'gross_vehicle_weight', 'status', 'remarks'
    ],
    fields: [
        { key: 'registration_no', label: 'Registration No', type: 'text', required: true, half: true },
        { key: 'initial_registration_date', label: 'Registration Date', type: 'date', required: true, half: true },
        { key: 'owner_type', label: 'Owner Type', type: 'select', 
          options: [
              { value: 'Individual', label: 'Individual' },
              { value: 'Organization', label: 'Organization' },
          ], 
          required: false, half: true },
        { key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', apiUrl: '/master-data/vehicle-types/dropdown/', apiLabel: 'vehicle_type_name', required: true, half: true },
        { key: 'model_name', label: 'Model Name', type: 'text', half: true },
        { key: 'fuel_type', label: 'Fuel Type', type: 'api-select', apiUrl: '/master-data/settings/vehicle-fuel-types/dropdown/', apiLabel: 'fuel_name', required: true, half: true },
        { key: 'seating_capacity', label: 'Seating Capacity', type: 'number', half: true },
        { key: 'engine_cc', label: 'Engine CC', type: 'number', half: true },
        { key: 'horse_power', label: 'Horse Power', type: 'number', half: true },
        { key: 'kilo_watt_hour', label: 'Kilo Watt Hour (kWh)', type: 'number', half: true },
        { key: 'gross_vehicle_weight', label: 'Gross Weight (kg)', type: 'number', half: true },
        { key: 'status', label: 'Status', type: 'select', 
          options: [
              { value: 'ACTIVE', label: 'Active' },
              { value: 'OUTSTANDING', label: 'Outstanding' },
              { value: 'CANCELLED', label: 'Cancelled' },
          ], 
          required: false, half: true },
    ],
    filters: [
        { key: 'owner_type', label: 'Owner Type', type: 'select', 
          options: [
              { value: 'Individual', label: 'Individual' },
              { value: 'Organization', label: 'Organization' },
          ]
        },
        { key: 'vehicle_type', label: 'Vehicle Type', type: 'api-select', apiUrl: '/master-data/vehicle-types/dropdown/', apiLabel: 'vehicle_type_name' },
        { key: 'fuel_type', label: 'Fuel Type', type: 'api-select', apiUrl: '/master-data/settings/vehicle-fuel-types/dropdown/', apiLabel: 'fuel_name' }
    ],
    columns: [
        { key: 'registration_no', label: 'Reg No' },
        { key: 'initial_registration_date', label: 'Reg Date' },
        { key: 'owner_type', label: 'Owner Type' },
        { key: 'vehicle_type_name', label: 'Vehicle Type', render: (item) => item.vehicle_type_name || item.vehicle_type },
        { key: 'model_name', label: 'Model Name' },
        { key: 'fuel_type_name', label: 'Fuel Type', render: (item) => item.fuel_type_name || item.fuel_type },
        { key: 'status_display', label: 'Status', render: (item) => item.status_display || item.status },
    ],
};

const CONFIGS = {
    'registration': registrationConfig,
    'consumption': consumptionConfig
};

export default function SurfaceTransportPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const tab = searchParams.get('tab') || 'registration';

    const setTab = (tabKey) => {
        setSearchParams({ tab: tabKey });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Surface Transport' },
    ];

    return (
        <DashboardLayout breadcrumbs={breadcrumbs} title="Surface Transport Data Management">
            <DataCollectionBanner 
                title="Surface Transport Data Management" 
                description="Manage vehicle registrations and fuel consumption records." 
                icon={Car} 
                parentTitle="Surface Transport Sector"
                gradient="#1e293b 0%,#334155 55%,#475569 100%"
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

