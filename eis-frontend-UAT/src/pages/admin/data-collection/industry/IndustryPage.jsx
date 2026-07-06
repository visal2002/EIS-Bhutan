import { Factory } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine, { DataCollectionBanner } from '../DataCollectionEngine';


const CONFIG = {
    title: 'Industry Energy Consumption',
    singular: 'Industry Record',
    moduleKey: 'industry',
    description: 'Track energy consumption (electricity, fuel, coal, etc.) by industry classification and category.',
    icon: Factory,
    api: '/industry/',
    hasApi: true,
    hideDateFields: true,
    templateHeaders: [
        'Date', 'Classification', 'name_industry', 'type_industry', 
        'coal_mt', 'diesel_lt', 'electricity_kWh', 'kerosene_lt', 
        'semicoke_mt', 'furnace_oil_lt', 'lubricants_lt', 'woodchips_mt', 
        'charcoal_mt', 'coke_lamc_mt', 'bamboo_mt', 'limestone_mt', 
        'dolomite_mt', 'sawdust_mt', 'briquettes_mt', 'Remarks'
    ],
    templateExample: '2024-01-15,MINING,Dungsam Cement,Cement,500.5,1000.0,50000,0,0,0,0,0,0,0,0,0,0,0,0,Annual consumption',
    exportFields: [
        'date', 'classification_name', 'name_industry', 'type_industry',
        'coal_mt', 'diesel_lt', 'electricity_kWh', 'kerosene_lt',
        'semicoke_mt', 'furnace_oil_lt', 'lubricants_lt', 'woodchips_mt',
        'charcoal_mt', 'coke_lamc_mt', 'bamboo_mt', 'limestone_mt',
        'dolomite_mt', 'sawdust_mt', 'briquettes_mt', 'data_source_name', 'remarks'
    ],
    columns: [
        { key: 'date', label: 'Date' },
        { key: 'classification_name', label: 'Classification' },
        { key: 'name_industry', label: 'Industry Name' },
        { key: 'type_industry', label: 'Type' },
        { key: 'coal_mt', label: 'Coal (MT)', render: (item) => <span className="font-mono text-slate-700">{item.coal_mt ? parseFloat(item.coal_mt).toLocaleString() : '-'}</span> },
        { key: 'electricity_kWh', label: 'Electricity (kWh)', render: (item) => <span className="font-mono text-slate-700">{item.electricity_kWh ? parseFloat(item.electricity_kWh).toLocaleString() : '-'}</span> },
    ],
    fields: [
        { key: 'date', label: 'Date', type: 'date', required: true, half: true },
        { key: 'classification', label: 'Industry Classification', type: 'api-select', apiUrl: '/master-data/industry-classifications/dropdown/', apiLabel: 'classification_name', required: false },
        { key: 'name_industry', label: 'Industry Name', type: 'text', placeholder: 'e.g. Dungsam Cement', required: true },
        { key: 'type_industry', label: 'Industry Type', type: 'text', placeholder: 'e.g. Cement', required: false },
        
        { key: 'coal_mt', label: 'Coal (MT)', type: 'number', half: true },
        { key: 'diesel_lt', label: 'Diesel (LT)', type: 'number', half: true },
        { key: 'electricity_kWh', label: 'Electricity (kWh)', type: 'number', half: true },
        { key: 'kerosene_lt', label: 'Kerosene (LT)', type: 'number', half: true },
        { key: 'semicoke_mt', label: 'Semicoke (MT)', type: 'number', half: true },
        { key: 'furnace_oil_lt', label: 'Furnace Oil (LT)', type: 'number', half: true },
        { key: 'lubricants_lt', label: 'Lubricants (LT)', type: 'number', half: true },
        { key: 'woodchips_mt', label: 'Woodchips (MT)', type: 'number', half: true },
        { key: 'charcoal_mt', label: 'Charcoal (MT)', type: 'number', half: true },
        { key: 'coke_lamc_mt', label: 'Coke/LAMC (MT)', type: 'number', half: true },
        { key: 'bamboo_mt', label: 'Bamboo (MT)', type: 'number', half: true },
        { key: 'limestone_mt', label: 'Limestone (MT)', type: 'number', half: true },
        { key: 'dolomite_mt', label: 'Dolomite (MT)', type: 'number', half: true },
        { key: 'sawdust_mt', label: 'Sawdust (MT)', type: 'number', half: true },
        { key: 'briquettes_mt', label: 'Briquettes (MT)', type: 'number', half: true },
        
        { key: 'data_source', label: 'Data Source', type: 'api-select', apiUrl: '/master-data/settings/data-sources/dropdown/', apiLabel: 'source_name', required: false },
    ],
    filters: [
        { key: 'classification', label: 'Classification', type: 'api-select', apiUrl: '/master-data/industry-classifications/dropdown/', apiLabel: 'classification_name' }
    ]
};





export default function IndustryPage() {
    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Industry' },
    ];

    return (
        <DashboardLayout breadcrumbs={breadcrumbs} title="Industry Energy Data Management">
            <div className="space-y-5">
                <DataCollectionBanner 
                    title="Industrial Energy Data" 
                    description="Consumption records (electricity, fuel, coal, etc.) for Manufacturing & Mining sectors." 
                    icon={Factory} 
                    parentTitle="Industry Sector"
                    gradient="#374151 0%,#1f2937 55%,#111827 100%"
                />


                <DataCollectionEngine config={CONFIG} standalone={false} />
            </div>
        </DashboardLayout>
    );
}

