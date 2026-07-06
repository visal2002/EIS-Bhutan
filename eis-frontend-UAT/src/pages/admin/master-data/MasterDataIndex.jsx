import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap, Hash, LayoutGrid, Plug, Car, Fuel,
    Gauge, Flame, Sun, Factory, MapPin,
    ArrowUpRight, Database, ChevronRight, Settings2,
    Sparkles, ArrowRight, ShieldCheck, Globe, Clock, History,
    Ruler, Tag, Calendar
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { formatDistanceToNow } from 'date-fns';

const MODULES = [
    // ── Primary Resource Modules ─────────────────────────────
    {
        slug:        'energy_supplies',
        label:       'Energy Supply',
        description: 'Primary energy carriers used across all data collection modules.',
        path:        '/admin/master-data/energy-supply',
        icon:        Zap,
        accent:      '#3b82f6', // blue-500
        gradient:    'from-blue-500/20 to-blue-600/10',
        tag:         'Core',
        tagColor:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        group:       'primary',
    },
    {
        slug:        'conversion_factors',
        label:       'Conversion Factors',
        description: 'TOE / GJ / TJ conversion factors for GHG and energy balance calculations.',
        path:        '/admin/master-data/conversion-factors',
        icon:        Hash,
        accent:      '#8b5cf6', // violet-500
        gradient:    'from-violet-500/20 to-violet-600/10',
        tag:         'Calculations',
        tagColor:    'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        group:       'primary',
    },
    {
        slug:        'sectors',
        label:       'Sectors & Sub-sectors',
        description: 'Hierarchical definition of economic sectors used for data aggregation.',
        path:        '/admin/master-data/sectors',
        icon:        LayoutGrid,
        accent:      '#10b981', // emerald-500
        gradient:    'from-emerald-500/20 to-emerald-600/10',
        tag:         'Environment',
        tagColor:    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        group:       'primary',
    },
    {
        slug:        'electricity_categories',
        label:       'Electricity Categories',
        description: 'BPC tariff and consumer categories for electricity mapping.',
        path:        '/admin/master-data/electricity-categories',
        icon:        Plug,
        accent:      '#0ea5e9', // sky-500
        gradient:    'from-sky-500/20 to-sky-600/10',
        tag:         'Power',
        tagColor:    'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        group:       'primary',
    },
    {
        slug:        'vehicle_types',
        label:       'Vehicle Types',
        description: 'Classification of transport vehicles for mileage and emission monitoring.',
        path:        '/admin/master-data/vehicle-types',
        icon:        Car,
        accent:      '#f59e0b', // amber-500
        gradient:    'from-amber-500/20 to-amber-600/10',
        tag:         'Transport',
        tagColor:    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        group:       'primary',
    },
    {
        slug:        'mileage',
        label:       'Mileage Config',
        description: 'Standardized transport vehicle mileage coefficients and fuel efficiency data.',
        path:        '/admin/master-data/mileage',
        icon:        Gauge,
        accent:      '#06b6d4', // cyan-500
        gradient:    'from-cyan-500/20 to-cyan-600/10',
        tag:         'Transport',
        tagColor:    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        group:       'primary',
    },
    {
        slug:        'substations',
        label:       'Substations',
        description: 'Electrical grid substations and primary infrastructure mapping.',
        path:        '/admin/master-data/substations',
        icon:        MapPin,
        accent:      '#84cc16', // lime-500
        gradient:    'from-lime-500/20 to-lime-600/10',
        tag:         'Infrastructure',
        tagColor:    'bg-lime-500/10 text-lime-600 dark:text-lime-400',
        group:       'primary',
    },
    {
        slug:        'substation_transformers',
        label:       'Transformers',
        description: 'Inventory and technical specifications of transformers within substations.',
        path:        '/admin/master-data/substation-transformers',
        icon:        Zap,
        accent:      '#f59e0b', // amber-500
        gradient:    'from-amber-500/20 to-amber-600/10',
        tag:         'Infrastructure',
        tagColor:    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        group:       'primary',
    },
    {
        slug:        'generation_plants',
        label:       'Generation Plants',
        description: 'Electricity generation facilities across Bhutan including hydro and solar.',
        path:        '/admin/master-data/plants',
        icon:        Zap,
        accent:      '#6366f1', // indigo-500
        gradient:    'from-indigo-500/20 to-indigo-600/10',
        tag:         'Power',
        tagColor:    'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
        group:       'primary',
    },
    {
        slug:        'solar_sizes',
        label:       'Solar Energy Sizes',
        description: 'Standardized capacity ratings and panel types for solar installations.',
        path:        '/admin/master-data/solar-sizes',
        icon:        Sun,
        accent:      '#eab308', // yellow-500
        gradient:    'from-yellow-500/20 to-yellow-600/10',
        tag:         'Renewables',
        tagColor:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        group:       'primary',
    },
    {
        slug:        'biogas_sizes',
        label:       'Biogas Sizes',
        description: 'Standardized capacity ratings for biogas production systems.',
        path:        '/admin/master-data/biogas-sizes',
        icon:        Flame,
        accent:      '#f97316', // orange-500
        gradient:    'from-orange-500/20 to-orange-600/10',
        tag:         'Renewables',
        tagColor:    'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        group:       'primary',
    },
    {
        slug:        'industry_classifications',
        label:       'Industry Classification',
        description: 'National and international industry classification standards.',
        path:        '/admin/master-data/industry-classification',
        icon:        Factory,
        accent:      '#64748b', // slate-500
        gradient:    'from-slate-500/20 to-slate-600/10',
        tag:         'Industrial',
        tagColor:    'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        group:       'primary',
    },

    // ── Reference Lookups & Settings ─────────────────────────
    {
        slug:        'conversion_units',
        label:       'Conversion Units',
        description: 'Units of measurement used in conversion factor records (e.g. TJ/Gg, GJ/tonne, MJ/litre).',
        path:        '/admin/master-data/conversion-units',
        icon:        Hash,
        accent:      '#7c3aed',
        gradient:    'from-violet-500/20 to-violet-600/10',
        tag:         'Calculations',
        tagColor:    'bg-violet-500/10 text-violet-600 dark:text-violet-400',
        group:       'lookup',
    },
    {
        slug:        'electricity_types',
        label:       'Electricity Types',
        description: 'Consumer type categories for electricity data (e.g. Residential, Commercial, Industrial).',
        path:        '/admin/master-data/electricity-types',
        icon:        Plug,
        accent:      '#0891b2',
        gradient:    'from-cyan-500/20 to-cyan-600/10',
        tag:         'Power',
        tagColor:    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        group:       'lookup',
    },
    {
        slug:        'fuel_types',
        label:       'Fuel Types (Energy Carrier)',
        description: 'Hierarchical fuel classifications used in Energy Supply and energy balances (e.g., Solid Fuels > Anthracite).',
        path:        '/admin/master-data/fuel-types',
        icon:        Fuel,
        accent:      '#ea580c',
        gradient:    'from-orange-500/20 to-orange-600/10',
        tag:         'Energy Supply',
        tagColor:    'bg-orange-500/10 text-orange-600 dark:text-orange-400',
        group:       'lookup',
    },
    {
        slug:        'vehicle_fuel_types',
        label:       'Vehicle Fuel Types',
        description: 'Fuel type options specific to transport vehicle mileage records (e.g., Petrol, Diesel, Hybrid).',
        path:        '/admin/master-data/vehicle-fuel-types',
        icon:        Fuel,
        accent:      '#dc2626',
        gradient:    'from-red-500/20 to-red-600/10',
        tag:         'Transport',
        tagColor:    'bg-red-500/10 text-red-600 dark:text-red-400',
        group:       'lookup',
    },
    {
        slug:        'production_types',
        label:       'Production Types',
        description: 'Biogas production type classifications (e.g. Domestic, Industrial, Commercial).',
        path:        '/admin/master-data/production-types',
        icon:        Flame,
        accent:      '#16a34a',
        gradient:    'from-green-500/20 to-green-600/10',
        tag:         'Biomass',
        tagColor:    'bg-green-500/10 text-green-600 dark:text-green-400',
        group:       'lookup',
    },
    {
        slug:        'panel_types',
        label:       'Panel Types',
        description: 'Solar panel technology types (e.g. Monocrystalline, Polycrystalline, Thin Film).',
        path:        '/admin/master-data/panel-types',
        icon:        Sun,
        accent:      '#ca8a04',
        gradient:    'from-yellow-500/20 to-yellow-600/10',
        tag:         'Solar',
        tagColor:    'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
        group:       'lookup',
    },
    {
        slug:        'industry_categories',
        label:       'Industry Categories',
        description: 'Industry classification categories aligned with ISIC (e.g. Manufacturing, Mining).',
        path:        '/admin/master-data/industry-categories',
        icon:        Factory,
        accent:      '#64748b',
        gradient:    'from-slate-500/20 to-slate-600/10',
        tag:         'Industry',
        tagColor:    'bg-slate-500/10 text-slate-600 dark:text-slate-400',
        group:       'lookup',
    },
    {
        slug:        'measurement_units',
        label:       'Measurement Units',
        description: 'Physical units for energy data collection (e.g. GWh, kl, MT, kWh, TOE).',
        path:        '/admin/master-data/measurement-units',
        icon:        Ruler,
        accent:      '#0284c7',
        gradient:    'from-sky-500/20 to-sky-600/10',
        tag:         'Energy Supply',
        tagColor:    'bg-sky-500/10 text-sky-600 dark:text-sky-400',
        group:       'lookup',
    },
    {
        slug:        'energy_categories',
        label:       'Energy Categories',
        description: 'Energy category groups for balance table reporting (e.g. Electricity, Petroleum, Coal).',
        path:        '/admin/master-data/energy-categories',
        icon:        Tag,
        accent:      '#be185d',
        gradient:    'from-pink-500/20 to-pink-600/10',
        tag:         'Energy Supply',
        tagColor:    'bg-pink-500/10 text-pink-600 dark:text-pink-400',
        group:       'lookup',
    },
    {
        slug:        'dzongkhags',
        label:       'Dzongkhags',
        description: 'District classifications for regional data analysis and consumption mapping.',
        path:        '/admin/master-data/dzongkhags',
        icon:        MapPin,
        accent:      '#84cc16',
        gradient:    'from-lime-500/20 to-lime-600/10',
        tag:         'Regional',
        tagColor:    'bg-lime-500/10 text-lime-600 dark:text-lime-400',
        group:       'lookup',
    },
    {
        slug:        'years',
        label:       'Data Years',
        description: 'Calendar years available for energy data collection and historical reporting.',
        path:        '/admin/master-data/years',
        icon:        Calendar,
        accent:      '#10b981',
        gradient:    'from-emerald-500/20 to-emerald-600/10',
        tag:         'System',
        tagColor:    'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
        group:       'lookup',
    },
    {
        slug:        'data_sources',
        label:       'Data Sources',
        description: 'Entities and methods used to obtain energy data (e.g. BPC, Surveys).',
        path:        '/admin/master-data/data-sources',
        icon:        Database,
        accent:      '#3b82f6',
        gradient:    'from-blue-500/20 to-blue-600/10',
        tag:         'System',
        tagColor:    'bg-blue-500/10 text-blue-600 dark:text-blue-400',
        group:       'lookup',
    },
    {
        slug:        'bpc_categories',
        label:       'Electricity Categories',
        description: 'BPC consumer categories for electricity billing and tariff mapping.',
        path:        '/admin/master-data/bpc-categories',
        icon:        Zap,
        accent:      '#f59e0b',
        gradient:    'from-amber-500/20 to-amber-600/10',
        tag:         'Electricity',
        tagColor:    'bg-amber-500/10 text-amber-600 dark:text-amber-400',
        group:       'lookup',
    },
    {
        slug:        'countries',
        label:       'Countries',
        description: 'International entities for trade, import/export analysis and country of origin.',
        path:        '/admin/master-data/countries',
        icon:        Globe,
        accent:      '#06b6d4',
        gradient:    'from-cyan-500/20 to-cyan-600/10',
        tag:         'Global',
        tagColor:    'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
        group:       'lookup',
    },
];


const breadcrumbs = [
    { label: 'Administration', href: '/admin/dashboard' },
];

export default function MasterDataIndex() {
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: {
            y: 0,
            opacity: 1,
            transition: { type: 'spring', stiffness: 300, damping: 24 }
        }
    };

    const renderFreshness = (slug) => {
        const data = stats[slug];
        if (!data || loading) return null;

        const date = data.last_updated ? new Date(data.last_updated) : null;
        const timeAgo = date ? formatDistanceToNow(date, { addSuffix: true }) : 'Never';
        const isStale = date && (new Date() - date > 90 * 24 * 60 * 60 * 1000); // 90 days

        return (
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${date ? (isStale ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 pulse-dot') : 'bg-slate-300'}`} />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-tight">
                        {date ? `Updated ${timeAgo}` : 'No data yet'}
                    </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-widest pl-3">
                    <History className="h-2.5 w-2.5" />
                    {data.count || 0} Records
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="Master Data">
            <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
                
                {/* ── Enhanced Hero Section ─────────────────────────── */}
                <div className="relative group rounded-[2.5rem] overflow-hidden p-[1px]
                    bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-transparent">
                    
                    <div className="relative rounded-[2.5rem] overflow-hidden
                        bg-[#0f172a] dark:bg-slate-950 min-h-[320px]">
                        
                        {/* Dynamic Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[140%] 
                                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] 
                                from-emerald-500/20 via-transparent to-transparent blur-[120px] 
                                animate-pulse" />
                            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[140%] 
                                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] 
                                from-blue-500/20 via-transparent to-transparent blur-[120px] 
                                animate-pulse" style={{ animationDelay: '2s' }} />
                            
                            {/* Animated Grid */}
                            <div className="absolute inset-0 opacity-[0.1]"
                                style={{
                                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                    backgroundSize: '50px 50px',
                                    maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                                }} />
                        </div>

                        <div className="relative h-full px-10 py-12 flex flex-col lg:flex-row items-center justify-between gap-12">
                            {/* Hero Content */}
                            <div className="flex-1 space-y-6 text-center lg:text-left">
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full
                                        bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Sparkles className="h-4 w-4 text-emerald-400" />
                                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-300/90">
                                        Centralized Control Center
                                    </span>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}>
                                    <h1 className="text-4xl lg:text-6xl font-black text-white leading-tight tracking-tight">
                                        Precision <br />
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-500">
                                            Master Data
                                        </span>
                                    </h1>
                                    <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed">
                                        Architecting the foundation of energy intelligence. Manage global parameters, conversion formulas, and sector hierarchies with real-time propagation across all systems.
                                    </p>
                                </motion.div>

                                <motion.div 
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.2 }}
                                    className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                    <button 
                                        onClick={() => navigate('/admin/master-data/settings')}
                                        className="group flex items-center gap-3 px-6 py-3 rounded-2xl
                                            bg-white text-slate-950 font-bold text-sm
                                            hover:bg-emerald-50 transition-all duration-300">
                                        <Settings2 className="h-4 w-4 group-hover:rotate-45 transition-transform" />
                                        System Configuration
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                    <div className="flex -space-x-3 overflow-hidden p-1">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-slate-950
                                                bg-gradient-to-br from-emerald-500 to-blue-600 border border-white/20" />
                                        ))}
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full 
                                            ring-2 ring-slate-950 bg-slate-800 text-[10px] font-bold text-white uppercase">
                                            +4
                                        </div>
                                    </div>
                                    <span className="text-xs font-semibold text-slate-500 ml-2 italic">Active core agents</span>
                                </motion.div>
                            </div>

                            {/* Hero Visualized Stats */}
                            <motion.div 
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="grid grid-cols-2 gap-4 flex-shrink-0 w-full lg:w-auto max-w-sm">
                                {[
                                    { label: 'Active Modules', val: MODULES.length, icon: Globe, color: 'text-blue-400' },
                                    { label: 'Energy Supply', val: '12', icon: Zap, color: 'text-emerald-400' },
                                    { label: 'Security Level', val: 'V3', icon: ShieldCheck, color: 'text-purple-400' },
                                    { label: 'Data Source', val: 'API', icon: Database, color: 'text-amber-400' },
                                ].map((stat, i) => (
                                    <div key={stat.label} 
                                        className="p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl
                                            hover:bg-white/10 transition-colors group">
                                        <stat.icon className={`h-5 w-5 ${stat.color} mb-3 group-hover:scale-110 transition-transform`} />
                                        <p className="text-2xl font-black text-white">{stat.val}</p>
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* ── Modern Navigation Pills ───────────────────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <LayoutGrid className="h-6 w-6 text-emerald-500" />
                            Primary Resource Modules
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Configure core energy categories, capacities, and structures</p>
                    </div>

                    <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {MODULES.filter(m => m.group === 'primary').slice(0, 5).map(mod => (
                            <button
                                key={mod.path}
                                onClick={() => navigate(mod.path)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400
                                    hover:bg-white dark:hover:bg-slate-800 hover:text-emerald-500
                                    hover:shadow-sm transition-all duration-200"
                            >
                                {mod.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Primary Bento Grid ───────────────────────────── */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                    {MODULES.filter(m => m.group === 'primary').map((mod, idx) => {
                        const Icon = mod.icon;
                        return (
                            <motion.button
                                key={mod.path}
                                variants={itemVariants}
                                onClick={() => navigate(mod.path)}
                                className="group relative text-left rounded-[2rem] p-6
                                    bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                                    hover:border-transparent transition-all duration-500 
                                    focus:outline-none overflow-hidden"
                            >
                                {/* Hover background effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${mod.gradient}`} />
                                
                                {/* Animated border on hover */}
                                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" 
                                    style={{ color: mod.accent }} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center
                                            bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-500
                                            border border-slate-100 dark:border-slate-700 shadow-sm"
                                            style={{ backgroundColor: `${mod.accent}08` }}>
                                            <Icon className="h-7 w-7" style={{ color: mod.accent }} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${mod.tagColor}`}>
                                                {mod.tag}
                                            </span>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center
                                                bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700
                                                transition-colors shadow-sm">
                                                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-all group-hover:rotate-45" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {mod.label}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {mod.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-8 flex items-center justify-between">
                                        {renderFreshness(mod.slug)}
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
                                            Execute <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* ── Reference Lookups & Settings Heading ─────────── */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4 pt-14 border-t border-slate-200 dark:border-slate-800/80">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                            <Settings2 className="h-6 w-6 text-indigo-500" />
                            Reference Lookups & Settings
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">Manage standardized units, types, classifications, and regional lookup options</p>
                    </div>

                    <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {MODULES.filter(m => m.group === 'lookup').slice(0, 5).map(mod => (
                            <button
                                key={mod.path}
                                onClick={() => navigate(mod.path)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400
                                    hover:bg-white dark:hover:bg-slate-800 hover:text-indigo-500
                                    hover:shadow-sm transition-all duration-200"
                            >
                                {mod.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Reference Bento Grid ───────────────────────────── */}
                <motion.div 
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                    {MODULES.filter(m => m.group === 'lookup').map((mod, idx) => {
                        const Icon = mod.icon;
                        return (
                            <motion.button
                                key={mod.path}
                                variants={itemVariants}
                                onClick={() => navigate(mod.path)}
                                className="group relative text-left rounded-[2rem] p-6
                                    bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                                    hover:border-transparent transition-all duration-500 
                                    focus:outline-none overflow-hidden"
                            >
                                {/* Hover background effect */}
                                <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${mod.gradient}`} />
                                
                                {/* Animated border on hover */}
                                <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-all duration-700" 
                                    style={{ color: mod.accent }} />

                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex items-start justify-between mb-8">
                                        <div className="h-14 w-14 rounded-2xl flex items-center justify-center
                                            bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-500
                                            border border-slate-100 dark:border-slate-700 shadow-sm"
                                            style={{ backgroundColor: `${mod.accent}08` }}>
                                            <Icon className="h-7 w-7" style={{ color: mod.accent }} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${mod.tagColor}`}>
                                                {mod.tag}
                                            </span>
                                            <div className="h-8 w-8 rounded-full flex items-center justify-center
                                                bg-slate-100 dark:bg-slate-800 group-hover:bg-white dark:group-hover:bg-slate-700
                                                transition-colors shadow-sm">
                                                <ArrowUpRight className="h-4 w-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-all group-hover:rotate-45" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                            {mod.label}
                                        </h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {mod.description}
                                        </p>
                                    </div>

                                    <div className="mt-auto pt-8 flex items-center justify-between">
                                        {renderFreshness(mod.slug)}
                                        <div className="text-[11px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors flex items-center gap-1">
                                            Execute <ChevronRight className="h-3 w-3" />
                                        </div>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </motion.div>

                {/* ── Enhanced Master Settings Call-to-Action ────────── */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="relative group p-1 rounded-[2.5rem] bg-gradient-to-r from-indigo-500 to-purple-600
                    hover:scale-[1.01] transition-transform duration-500"
                >
                    <div className="relative rounded-[2.4rem] bg-white dark:bg-slate-950 px-8 py-8 flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden">
                        {/* Background Decor */}
                        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-indigo-500/5 to-transparent skew-x-12" />
                        
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="h-16 w-16 rounded-[1.5rem] bg-indigo-50 dark:bg-indigo-900/20
                                flex items-center justify-center flex-shrink-0 animate-bounce" style={{ animationDuration: '3s' }}>
                                <Settings2 className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                    Global Master Configuration
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg">
                                    Manage global taxonomies, measurement units, and technical specifications used across the entire energy architecture.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => navigate('/admin/master-data/settings')}
                            className="group flex items-center gap-4 px-8 py-4 rounded-2xl
                                bg-indigo-600 hover:bg-slate-900 dark:hover:bg-white 
                                dark:hover:text-slate-950 text-white
                                font-black text-sm tracking-widest transition-all duration-300 shadow-xl shadow-indigo-500/20 active:scale-95"
                        >
                            ADVANCED SETTINGS
                            <Settings2 className="h-4 w-4 group-hover:rotate-180 transition-transform duration-700" />
                        </button>
                    </div>
                </motion.div>

                {/* ── Refined Footer ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 gap-4 px-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">System Ready</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                            {MODULES.length} ACTIVE MODULES · LATENCY 14MS
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-[1px] bg-slate-200 dark:bg-slate-800 hidden sm:block mx-2" />
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
                            EIS INTEGRAL SYSTEM v2.0
                        </span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}