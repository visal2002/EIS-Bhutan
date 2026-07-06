import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Hash, Plug, Car, Fuel, Flame, Sun, Factory, Ruler, Tag,
    ArrowUpRight, Settings2, ChevronRight, Database,
    MapPin, Calendar, Zap, Globe, Clock, History
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';

const SETTINGS = [
    {
        slug:        'conversion_units',
        label:       'Conversion Units',
        description: 'Units of measurement used in conversion factor records (e.g. TJ/Gg, GJ/tonne, MJ/litre).',
        path:        '/admin/master-data/settings/conversion-units',
        icon:        Hash,
        accent:      '#7c3aed',
        tag:         'Conversion Factors',
        tagColor:    'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300',
        usedIn:      'Conversion Factors',
    },
    {
        slug:        'electricity_types',
        label:       'Electricity Types',
        description: 'Consumer type categories for electricity data (e.g. Residential, Commercial, Industrial).',
        path:        '/admin/master-data/settings/electricity-types',
        icon:        Plug,
        accent:      '#0891b2',
        tag:         'Electricity',
        tagColor:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        usedIn:      'Electricity Categories',
    },

    {
        slug:        'fuel_types',
        label:       'Fuel Types (Energy Carrier)',
        description: 'Hierarchical fuel classifications used in Energy Supply and energy balances (e.g., Solid Fuels > Anthracite).',
        path:        '/admin/master-data/settings/fuel-types',
        icon:        Fuel,
        accent:      '#ea580c',
        tag:         'Energy Supply',
        tagColor:    'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
        usedIn:      'Energy Supply',
    },
    {
        slug:        'vehicle_fuel_types',
        label:       'Vehicle Fuel Types',
        description: 'Fuel type options specific to transport vehicle mileage records (e.g., Petrol, Diesel, Hybrid).',
        path:        '/admin/master-data/settings/vehicle-fuel-types',
        icon:        Fuel,
        accent:      '#dc2626',
        tag:         'Transport',
        tagColor:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
        usedIn:      'Mileage',
    },
    {
        slug:        'production_types',
        label:       'Production Types',
        description: 'Biogas production type classifications (e.g. Domestic, Industrial, Commercial).',
        path:        '/admin/master-data/settings/production-types',
        icon:        Flame,
        accent:      '#16a34a',
        tag:         'Biomass',
        tagColor:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
        usedIn:      'Biogas Sizes',
    },
    {
        slug:        'panel_types',
        label:       'Panel Types',
        description: 'Solar panel technology types (e.g. Monocrystalline, Polycrystalline, Thin Film).',
        path:        '/admin/master-data/settings/panel-types',
        icon:        Sun,
        accent:      '#ca8a04',
        tag:         'Solar',
        tagColor:    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
        usedIn:      'Solar Energy Sizes',
    },
    {
        slug:        'industry_categories',
        label:       'Industry Categories',
        description: 'Industry classification categories aligned with ISIC (e.g. Manufacturing, Mining).',
        path:        '/admin/master-data/settings/industry-categories',
        icon:        Factory,
        accent:      '#64748b',
        tag:         'Industry',
        tagColor:    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
        usedIn:      'Industry Classification',
    },
    {
        slug:        'measurement_units',
        label:       'Measurement Units',
        description: 'Physical units for energy data collection (e.g. GWh, kl, MT, kWh, TOE).',
        path:        '/admin/master-data/settings/measurement-units',
        icon:        Ruler,
        accent:      '#0284c7',
        tag:         'Energy Supply',
        tagColor:    'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300',
        usedIn:      'Energy Supply',
    },
    {
        slug:        'energy_categories',
        label:       'Energy Categories',
        description: 'Energy category groups for balance table reporting (e.g. Electricity, Petroleum, Coal).',
        path:        '/admin/master-data/settings/energy-categories',
        icon:        Tag,
        accent:      '#be185d',
        tag:         'Energy Supply',
        tagColor:    'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300',
        usedIn:      'Energy Supply',
    },
    {
        slug:        'dzongkhags',
        label:       'Dzongkhags',
        description: 'District classifications for regional data analysis and consumption mapping.',
        path:        '/admin/master-data/settings/dzongkhags',
        icon:        MapPin,
        accent:      '#84cc16',
        tag:         'Regional',
        tagColor:    'bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-300',
        usedIn:      'Data Collection',
    },
    {
        slug:        'years',
        label:       'Data Years',
        description: 'Calendar years available for energy data collection and historical reporting.',
        path:        '/admin/master-data/settings/years',
        icon:        Calendar,
        accent:      '#10b981',
        tag:         'System',
        tagColor:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
        usedIn:      'All Modules',
    },
    {
        slug:        'data_sources',
        label:       'Data Sources',
        description: 'Entities and methods used to obtain energy data (e.g. BPC, Surveys).',
        path:        '/admin/master-data/settings/data-sources',
        icon:        Database,
        accent:      '#3b82f6',
        tag:         'System',
        tagColor:    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
        usedIn:      'All Modules',
    },
    {
        slug:        'bpc_categories',
        label:       'Electricity Categories',
        description: 'BPC consumer categories for electricity billing and tariff mapping.',
        path:        '/admin/master-data/settings/bpc-categories',
        icon:        Zap,
        accent:      '#f59e0b',
        tag:         'Electricity',
        tagColor:    'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
        usedIn:      'Electricity DC',
    },
    {
        slug:        'generation_plants',
        label:       'Generation Plants',
        description: 'Electricity generation facilities across Bhutan including hydro and solar.',
        path:        '/admin/master-data/settings/plants',
        icon:        Factory,
        accent:      '#6366f1',
        tag:         'Electricity',
        tagColor:    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
        usedIn:      'Electricity DC',
    },
    {
        slug:        'countries',
        label:       'Countries',
        description: 'International entities for trade, import/export analysis and country of origin.',
        path:        '/admin/master-data/settings/countries',
        icon:        Globe,
        accent:      '#06b6d4',
        tag:         'Global',
        tagColor:    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
        usedIn:      'Trade & Sales',
    },
];

const breadcrumbs = [
    { label: 'Administration', href: '/admin/dashboard' },
    { label: 'Master Data',    href: '/admin/master-data' },
    // 'Settings' is current page — no href needed
];

export default function MasterSettingsIndex() {
    const navigate = useNavigate();
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/master-data/summary/stats/');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (err) {
                console.error('Failed to fetch stats:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const renderFreshness = (slug) => {
        const data = stats[slug];
        if (!data || loading) return null;

        const date = data.last_updated ? new Date(data.last_updated) : null;
        const timeAgo = date ? formatDistanceToNow(date, { addSuffix: true }) : 'Never';
        const isStale = date && (new Date() - date > 90 * 24 * 60 * 60 * 1000); // 90 days

        return (
            <div className="flex flex-col gap-1 mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                    <div className={`h-1.5 w-1.5 rounded-full ${date ? (isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500') : 'bg-slate-300'}`} />
                    {date ? `Updated ${timeAgo}` : 'No data yet'}
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-3">
                    <History className="h-2.5 w-2.5" />
                    {data.count || 0} Records
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="Master Settings">
            <div className="space-y-8">

                {/* ── Hero banner ──────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' }}>

                    <div className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `radial-gradient(circle at 20% 50%, #818cf8 0%, transparent 50%),
                                              radial-gradient(circle at 80% 20%, #a5b4fc 0%, transparent 40%)`,
                        }} />
                    <div className="absolute inset-0 opacity-5"
                        style={{
                            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                              linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }} />

                    <div className="relative px-8 py-10 flex flex-col lg:flex-row lg:items-center gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20
                                    flex items-center justify-center backdrop-blur-sm">
                                    <Settings2 className="h-6 w-6 text-indigo-300" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[.2em] text-indigo-400/80">
                                        Reference Lookups
                                    </p>
                                    <h1 className="text-2xl font-bold text-white leading-tight">
                                        Master Settings
                                    </h1>
                                </div>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
                                Manage the dropdown options that appear in Master Data forms. Changes here
                                automatically reflect in all related data collection modules.
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="rounded-2xl bg-white/8 border border-white/12
                                backdrop-blur-sm px-5 py-4 text-center min-w-[80px]">
                                <p className="text-3xl font-extrabold text-white leading-none">{SETTINGS.length}</p>
                                <p className="text-[10px] text-white/50 font-medium uppercase tracking-widest mt-1.5">
                                    Lookup Tables
                                </p>
                            </div>
                            <button onClick={() => navigate('/admin/master-data')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl
                                    bg-white/10 border border-white/20 hover:bg-white/15
                                    text-white text-sm font-semibold transition-all">
                                <Database className="h-4 w-4" />
                                Master Data
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Info banner ───────────────────────────────── */}
                <div className="flex items-start gap-3 px-4 py-3.5 rounded-2xl
                    bg-indigo-50 dark:bg-indigo-900/20
                    border border-indigo-100 dark:border-indigo-800">
                    <Settings2 className="h-4 w-4 text-indigo-500 dark:text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">
                        These tables provide the dropdown options for Master Data forms. For example, adding a new
                        <strong> Fuel Type</strong> here will immediately make it available in the Mileage module's
                        fuel type selector.
                    </p>
                </div>

                {/* ── Settings grid ─────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {SETTINGS.map((mod, idx) => {
                        const Icon = mod.icon;
                        return (
                            <button
                                key={mod.path}
                                onClick={() => navigate(mod.path)}
                                className="group relative text-left rounded-2xl border
                                    border-slate-200 dark:border-slate-700/80
                                    bg-white dark:bg-slate-800
                                    hover:border-slate-300 dark:hover:border-slate-600
                                    hover:shadow-lg hover:-translate-y-1
                                    transition-all duration-200
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                                    overflow-hidden">

                                {/* Top accent strip */}
                                <div className="h-1 w-full"
                                    style={{ background: `linear-gradient(90deg, ${mod.accent}60, ${mod.accent}20)` }} />

                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                                                style={{ backgroundColor: `${mod.accent}15` }}>
                                                <Icon className="h-5 w-5" style={{ color: mod.accent }} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                                                    {mod.label}
                                                </p>
                                                <span className={`inline-block mt-1 text-[10px] font-semibold
                                                    uppercase tracking-wider px-2 py-0.5 rounded-full
                                                    ${mod.tagColor}`}>
                                                    {mod.tag}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0
                                            bg-slate-100 dark:bg-slate-700
                                            group-hover:bg-slate-200 dark:group-hover:bg-slate-600
                                            transition-colors mt-0.5">
                                            <ArrowUpRight className="h-3.5 w-3.5 text-slate-400
                                                group-hover:text-slate-600 dark:group-hover:text-slate-300
                                                transition-all group-hover:scale-110" />
                                        </div>
                                    </div>

                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                                        {mod.description}
                                    </p>

                                    {/* Used in badge */}
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] text-slate-400 dark:text-slate-500">Used in:</span>
                                        <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300
                                            bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">
                                            {mod.usedIn}
                                        </span>
                                    </div>

                                    {renderFreshness(mod.slug)}

                                    <div className="mt-3 flex items-center gap-1
                                        text-[11px] font-semibold opacity-0 group-hover:opacity-100
                                        transition-opacity duration-150"
                                        style={{ color: mod.accent }}>
                                        <span>Manage options</span>
                                        <ChevronRight className="h-3 w-3" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* ── Footer ───────────────────────────────────── */}
                <div className="flex items-center justify-between py-3 border-t
                    border-slate-100 dark:border-slate-800">
                    <p className="text-xs text-slate-400 dark:text-slate-600">
                        {SETTINGS.length} lookup tables · Options auto-populate in Master Data forms
                    </p>
                    <button onClick={() => navigate('/admin/master-data')}
                        className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium">
                        ← Back to Master Data
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}