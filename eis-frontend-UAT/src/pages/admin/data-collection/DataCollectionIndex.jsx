// src/pages/admin/data-collection/DataCollectionIndex.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    Zap, Flame, Mountain, TreePine, Leaf, Sun,
    Truck, Factory, ArrowRight, CheckCircle2,
    Clock, BarChart3, Globe, ShieldCheck, Database,
    Sparkles, Layers, Activity, Plane
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';

const MODULES = [
    {
        key:         'electricity',
        label:       'Electricity',
        description: 'BPC grid consumption, hydropower generation, and cross-border import/export',
        icon:        Zap,
        path:        '/admin/data-collection/electricity',
        color:       '#3b82f6', // blue-500
        gradient:    'from-blue-500/20 to-blue-600/10',
        unit:        'GWh',
        source:      'BPC / DGPC',
        status:      'active',
        subModules:  ['Consumption', 'Generation', 'Import / Export'],
    },
    {
        key:         'pol',
        label:       'POL',
        description: 'Diesel, petrol, LPG, kerosene, ATF and LDO consumption by sector',
        icon:        Flame,
        path:        '/admin/data-collection/pol',
        color:       '#f97316', // orange-500
        gradient:    'from-orange-500/20 to-orange-600/10',
        unit:        'KL / MT',
        source:      'POL / BPCL',
        status:      'active',
        subModules:  ['Import', 'Export', 'Aviation', 'Transport'],
    },
    {
        key:         'coal',
        label:       'Coal',
        description: 'Anthracite, sub-bituminous, lignite and coke production, import and consumption',
        icon:        Mountain,
        path:        '/admin/data-collection/coal',
        color:       '#64748b', // slate-500
        gradient:    'from-slate-500/20 to-slate-600/10',
        unit:        'MT',
        source:      'DoM / DGPC',
        status:      'active',
        subModules:  ['Production', 'Import', 'Consumption'],
    },
    {
        key:         'fuelwood',
        label:       'Fuelwood',
        description: 'Residential and institutional fuelwood consumption — cooking, heating and others',
        icon:        TreePine,
        path:        '/admin/data-collection/fuelwood',
        color:       '#22c55e', // green-500
        gradient:    'from-green-500/20 to-green-600/10',
        unit:        'MT',
        source:      'Energy Survey',
        status:      'active',
        subModules:  ['Residential', 'Institutional', 'Supply'],
    },
    {
        key:         'biomass',
        label:       'Biomass & Biogas',
        description: 'Biogas plant production by size category, briquettes and charcoal',
        icon:        Leaf,
        path:        '/admin/data-collection/biomass',
        color:       '#10b981', // emerald-500
        gradient:    'from-emerald-500/20 to-emerald-600/10',
        unit:        'MT',
        source:      'DoA / Survey',
        status:      'active',
        subModules:  ['Biogas', 'Briquettes', 'Charcoal'],
    },
    {
        key:         'solar',
        label:       'Solar & Renewables',
        description: 'Solar home lighting, institutional grid-tied systems and off-grid installations',
        icon:        Sun,
        path:        '/admin/data-collection/solar',
        color:       '#eab308', // yellow-500
        gradient:    'from-yellow-500/20 to-yellow-600/10',
        unit:        'GWh / kWp',
        source:      'DoE / BPC',
        status:      'active',
        subModules:  ['Home Lighting', 'Institutional', 'Grid-Tied'],
    },
    {
        key:         'surface_transport',
        label:       'Surface Transport',
        description: 'Fuel consumption by vehicle type and sector — diesel, petrol, EV and ATF',
        icon:        Truck,
        path:        '/admin/data-collection/surface-transport',
        color:       '#8b5cf6', // violet-500
        gradient:    'from-violet-500/20 to-violet-600/10',
        unit:        'KL',
        source:      'RSTA / POL',
        status:      'active',
        subModules:  ['Road Transport', 'Aviation', 'EVs'],
    },
    {
        key:         'air_transport',
        label:       'Air Transport',
        description: 'Aviation fuel consumption, aircraft type, flights, landings and take-offs',
        icon:        Plane,
        path:        '/admin/data-collection/air-transport',
        color:       '#0284c7', // sky-600
        gradient:    'from-sky-500/20 to-sky-600/10',
        unit:        'KL',
        source:      'Airlines / DCA',
        status:      'active',
        subModules:  ['Airlines', 'Fuel Consumption', 'Landings & Take-offs'],
    },
    {
        key:         'industry',
        label:       'Industry',
        description: 'Fuel consumption by HV and MV industries — ferro-alloy, cement, food, wood',
        icon:        Factory,
        path:        '/admin/data-collection/industry',
        color:       '#f43f5e', // rose-500
        gradient:    'from-rose-500/20 to-rose-600/10',
        unit:        'Mixed',
        source:      'DoI / Survey',
        status:      'active',
        subModules:  ['HV Category', 'MV Category', 'SMEs'],
    },
];

export default function DataCollectionIndex() {
    const navigate = useNavigate();

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection' },
    ];

    const activeModules = MODULES.filter(m => m.status === 'active');
    const soonModules   = MODULES.filter(m => m.status === 'soon');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.05 }
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

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="Data Collection">
            <div className="max-w-[1600px] mx-auto space-y-10 pb-20">

                {/* ── Enhanced Hero Section ─────────────────────────── */}
                <div className="relative group rounded-[2.5rem] overflow-hidden p-[1px]
                    bg-gradient-to-br from-white/20 to-white/5 dark:from-white/10 dark:to-transparent">
                    
                    <div className="relative rounded-[2.5rem] overflow-hidden
                        bg-[#0f172a] dark:bg-slate-950 min-h-[300px]">
                        
                        {/* Dynamic Background Elements */}
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[140%] 
                                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] 
                                from-blue-500/20 via-transparent to-transparent blur-[120px] 
                                animate-pulse" />
                            <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[140%] 
                                bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] 
                                from-indigo-500/20 via-transparent to-transparent blur-[120px] 
                                animate-pulse" style={{ animationDelay: '2s' }} />
                            
                            {/* Animated Grid */}
                            <div className="absolute inset-0 opacity-[0.05]"
                                style={{
                                    backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
                                    backgroundSize: '40px 40px',
                                    maskImage: 'radial-gradient(ellipse at center, black, transparent 80%)'
                                }} />
                        </div>

                        <div className="relative h-full px-8 py-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                            {/* Hero Content */}
                            <div className="flex-1 space-y-5 text-center lg:text-left">
                                <motion.div 
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
                                        bg-white/5 border border-white/10 backdrop-blur-md">
                                    <Activity className="h-4 w-4 text-blue-400" />
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-300/90">
                                        Live Data Acquisition
                                    </span>
                                </motion.div>

                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.1 }}>
                                    <h1 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                                        Data <br />
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 font-black">
                                            Collection Engine
                                        </span>
                                    </h1>
                                    <p className="mt-4 text-base text-slate-400 max-w-lg leading-relaxed font-medium">
                                        Systematically capturing Bhutan&apos;s energy footprint. Validate, synchronize, and architecturalize data from primary sources across all conversion layers.
                                    </p>
                                </motion.div>
                            </div>

                            {/* Hero Stats */}
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: 'spring', damping: 20 }}
                                className="flex items-center gap-4 flex-shrink-0">
                                {[
                                    { label: 'Active Modules', val: activeModules.length, icon: CheckCircle2, color: 'text-emerald-400' },
                                    { label: 'Coming Soon', val: soonModules.length, icon: Clock, color: 'text-slate-400' },
                                    { label: 'Data Points', val: '24k', icon: Database, color: 'text-blue-400' },
                                ].map((stat) => (
                                    <div key={stat.label} 
                                        className="px-6 py-5 rounded-[2rem] bg-white/5 border border-white/10 backdrop-blur-xl
                                            min-w-[120px] text-center group hover:bg-white/10 transition-all duration-300">
                                        <stat.icon className={`h-5 w-5 ${stat.color} mx-auto mb-2 group-hover:scale-110 transition-transform`} />
                                        <p className="text-3xl font-black text-white leading-none">{stat.val}</p>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-500 mt-2">
                                            {stat.label}
                                        </p>
                                    </div>
                                ))}
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* ── Active Modules Section ────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
                                <Layers className="h-6 w-6 text-blue-500" />
                                Collection Gateways
                            </h2>
                            <p className="text-sm text-slate-500 font-medium italic">Authorized energy data entry portals</p>
                        </div>
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <Globe className="h-4 w-4 text-emerald-500" />
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-400 tracking-tight">All systems operational</span>
                        </div>
                    </div>

                    <motion.div 
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2">
                        {activeModules.map((mod) => {
                            const Icon = mod.icon;
                            return (
                                <motion.button
                                    key={mod.key}
                                    variants={itemVariants}
                                    onClick={() => navigate(mod.path)}
                                    className="group relative text-left rounded-[2.5rem] p-7
                                        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800
                                        hover:border-transparent transition-all duration-500 
                                        focus:outline-none overflow-hidden min-h-[280px] flex flex-col"
                                >
                                    {/* Hover background effect */}
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${mod.gradient}`} />
                                    
                                    {/* Top indicator stripe */}
                                    <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-10 group-hover:opacity-100 transition-all duration-700" 
                                        style={{ color: mod.color }} />

                                    <div className="relative z-10 flex flex-col h-full">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center
                                                bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform duration-500
                                                border border-slate-100 dark:border-slate-700 shadow-sm"
                                                style={{ backgroundColor: `${mod.color}08` }}>
                                                <Icon className="h-7 w-7" style={{ color: mod.color }} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                    <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-3 flex-1">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                                                {mod.label}
                                            </h3>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium line-clamp-2">
                                                {mod.description}
                                            </p>
                                        </div>

                                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Primary Unit</p>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200">{mod.unit}</p>
                                            </div>
                                            <div className="text-right space-y-1">
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Data Source</p>
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200">{mod.source}</p>
                                            </div>
                                        </div>

                                        <div className="mt-6 flex items-center gap-1
                                            text-[11px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100
                                            transition-all duration-300 translate-y-2 group-hover:translate-y-0"
                                            style={{ color: mod.color }}>
                                            Access Portal <ArrowRight className="h-3.5 w-3.5 ml-1 animate-bounce" style={{ animationOrientation: 'horizontal', animationDuration: '2s' }} />
                                        </div>
                                    </div>
                                </motion.button>
                            );
                        })}
                    </motion.div>
                </div>

                {/* ── Coming Soon Section ───────────────────────────── */}
                {soonModules.length > 0 && (
                    <div className="space-y-6 pt-6">
                        <div className="flex items-center gap-2 px-4">
                            <Clock className="h-5 w-5 text-slate-400" />
                            <h2 className="text-xl font-black text-slate-500 dark:text-slate-400">
                                Future Protocols
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-2 opacity-60 grayscale-[0.5]">
                            {soonModules.map((mod) => {
                                const Icon = mod.icon;
                                return (
                                    <div key={mod.key} 
                                        className="relative rounded-[2.5rem] p-7
                                            bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/50
                                            overflow-hidden border-dashed">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className="h-14 w-14 rounded-2xl flex items-center justify-center
                                                bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700">
                                                <Icon className="h-7 w-7 opacity-50" />
                                            </div>
                                            <span className="px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                                In Pipeline
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-400 dark:text-slate-600 tracking-tight mb-2">
                                            {mod.label}
                                        </h3>
                                        <p className="text-sm text-slate-400 dark:text-slate-600 font-medium leading-relaxed">
                                            {mod.description}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* ── Refined Footer ─────────────────────────────────── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-8 gap-4 px-4">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Gateway active</span>
                        </div>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-tighter">
                            AUTHENTICATED SESSION · ACCESS LEVEL: ADMINISTRATOR
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/50">
                            <ShieldCheck className="h-3 w-3 text-emerald-500" />
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Secure</span>
                        </div>
                        <span className="text-[10px] font-black text-slate-300 dark:text-slate-700 uppercase tracking-[0.3em]">
                            BHUTAN ENERGY INFORMATION SYSTEM
                        </span>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}