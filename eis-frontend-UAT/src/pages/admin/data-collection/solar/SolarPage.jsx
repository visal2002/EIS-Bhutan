import { Sun } from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import DataCollectionEngine from '../DataCollectionEngine';

const CONFIG = {
    title: 'Solar Energy Data',
    singular: 'Energy Record',
    moduleKey: 'solar',
    description: 'Track energy generation from solar thermal, utility-scale, and off-grid solar systems across dzongkhags.',
    icon: Sun,
    api: '/solar/',
    hasApi: true,
    templateHeaders: ['year', 'month', 'solar_size', 'solar_type', 'dzongkhag', 'energy_kwh', 'data_source', 'remarks'],
    templateExample: '2024,1,10kW,OFF_GRID,wangdue,150.5,EXCEL,Offgrid install',
    exportFields: ['year', 'month', 'solar_size', 'solar_type', 'dzongkhag', 'energy_kwh', 'data_source', 'remarks'],
    columns: [
        { key: 'solar_size_name', label: 'Size Category' },
        { key: 'solar_type', label: 'Type' },
        { key: 'dzongkhag_display', label: 'Dzongkhag' },
        { key: 'energy_kwh', label: 'Gen (kWh)', render: (item) => <span className="font-mono font-bold text-slate-700">{parseFloat(item.energy_kwh).toLocaleString()}</span> },
        { key: 'data_source', label: 'Source' },
    ],
    fields: [
        { key: 'solar_size', label: 'Size Category', type: 'api-select', apiUrl: '/master-data/solar-sizes/', apiLabel: 'size_name', required: true },
        { key: 'solar_type', label: 'Solar Type', type: 'select', options: [{value:'UTILITY', label:'Utility Scale'}, {value:'THERMAL', label:'Solar Thermal'}, {value:'OFF_GRID', label:'Off-Grid'}], required: true },
        { key: 'dzongkhag', label: 'Dzongkhag', type: 'select', options: [
            {value:'thimphu', label:'Thimphu'}, {value:'paro', label:'Paro'}, {value:'punakha', label:'Punakha'},
            {value:'wangdue', label:'Wangdue'}, {value:'tsirang', label:'Tsirang'}, {value:'dagana', label:'Dagana'},
            {value:'chuukha', label:'Chukha'}, {value:'hsaa', label:'Haa'}, {value:'samtse', label:'Samtse'},
            {value:'sarpang', label:'Sarpang'}, {value:'zhemgang', label:'Zhemgang'}, {value:'trongsa', label:'Trongsa'},
            {value:'bumthang', label:'Bumthang'}, {value:'mongar', label:'Mongar'}, {value:'lhuentse', label:'Lhuentse'},
            {value:'trashigang', label:'Trashigang'}, {value:'trashiyangtse', label:'Trashi Yangtse'},
            {value:'pemagatshel', label:'Pema Gatshel'}, {value:'samdrupjongkhar', label:'Samdrup Jongkhar'}, {value:'punakha', label:'Punakha'}
            // Add other dzongkhags as per DZONGKHAG_CHOICES in models.py
        ], required: true },
        { key: 'energy_kwh', label: 'Energy Generation (kWh)', type: 'number', required: true },
        { key: 'data_source', label: 'Data Source', type: 'select', options: [{value:'EXCEL', label:'Excel Upload'}, {value:'MANUAL', label:'Manual Entry'}] },
    ]
};



export default function SolarPage() {
    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Solar' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
            <div className="space-y-5">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#f59e0b 0%,#d97706 55%,#b45309 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.1]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                                <Sun className="h-6 w-6 text-yellow-100" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-yellow-200/90 mb-0.5">Renewable Energy</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">Solar Energy Data</h1>
                                <p className="text-xs text-white/70 mt-0.5">Solar Home Systems (SHS) · Institutional PV · Utility Scale</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {[{label:'Unit',val:'kWp / Nos'},{label:'Source',val:'BPC / DRE'},{label:'Frequency',val:'Annual'}].map(s => (
                                <div key={s.label} className="rounded-xl bg-white/10 border border-white/20 px-3 py-2 text-center hidden sm:block">
                                    <p className="text-[9px] text-white/50 font-semibold uppercase tracking-widest mb-0.5">{s.label}</p>
                                    <p className="text-xs font-bold text-white">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Content Area */}
                <DataCollectionEngine config={CONFIG} standalone={false} />
            </div>
        </DashboardLayout>
    );
}
