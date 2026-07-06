// src/pages/admin/electricity/HydrologyPage.jsx
import DataCollectionEngine from '../data-collection/DataCollectionEngine';
import { Droplet } from 'lucide-react';

const config = {
    title: 'Hydrology Data',
    description: 'Manage daily inflow records for hydrology generation plants.',
    icon: Droplet,
    singular: 'Hydrology Record',
    moduleKey: 'electricity_data',
    api: '/electricity/hydrology/',
    hideDateFields: true,
    fields: [
        { 
            key: 'acronym', 
            label: 'Generation Plant', 
            type: 'api-select', 
            apiUrl: '/master-data/settings/generation-plants/dropdown/', 
            apiLabel: 'plant_name', 
            apiValue: 'acronym', 
            required: true 
        },
        { key: 'date', label: 'Date', type: 'date', required: true },
        { key: 'inflow', label: 'Inflow', type: 'number', required: true },
    ],
    columns: [
        { key: 'acronym', label: 'Plant', sortKey: 'acronym' },
        { key: 'date', label: 'Date', sortKey: 'date' },
        { key: 'inflow', label: 'Inflow', sortKey: 'inflow' },
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
    templateHeaders: ['acronym', 'date', 'inflow', 'remarks'],
};

export default function HydrologyPage() {
    return <DataCollectionEngine config={config} />;
}
