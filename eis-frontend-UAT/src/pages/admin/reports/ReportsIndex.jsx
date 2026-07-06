// src/pages/admin/reports/ReportsIndex.jsx
import { Link } from 'react-router-dom';
import { BarChart3, Flame, TrendingUp, FileText, ArrowRight, Zap, Leaf } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';

const REPORT_CARDS = [
    {
        title:       'Energy Balance Report',
        description: 'Comprehensive national energy balance table following IEA/IPCC methodology — TPES, transformation, and final consumption by energy carrier and sector.',
        icon:        Zap,
        href:        '/reports/energy',
        color:       'from-blue-600 to-indigo-700',
        badge:       'IEA Format',
        badgeColor:  'bg-blue-500/20 text-blue-300',
        stats:       [
            { label: 'TPES 2022',    value: '48,922 TJ' },
            { label: 'Net Exports',   value: '39,800 TJ' },
            { label: 'Renewables',    value: '46.8%' },
        ],
    },
    {
        title:       'GHG Inventory Report',
        description: 'National Greenhouse Gas Inventory following IPCC 2006 Guidelines — emissions by sector, gas type, and IPCC category code, with LULUCF carbon sink accounting.',
        icon:        Flame,
        href:        '/reports/ghg',
        color:       'from-rose-600 to-orange-700',
        badge:       'IPCC 2006 GL',
        badgeColor:  'bg-rose-500/20 text-rose-300',
        stats:       [
            { label: 'Gross 2022',   value: '5,874 Gg CO₂e' },
            { label: 'Net (LULUCF)', value: '−9,452 Gg CO₂e' },
            { label: 'Carbon Sink',  value: '14,200 Gg CO₂e' },
        ],
    },
];

export default function ReportsIndex() {
    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Reports & GHG' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
            <div className="space-y-6">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e293b 55%,#334155 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '32px 32px' }} />
                    <div className="relative px-8 py-8 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <BarChart3 className="h-7 w-7 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-400/80 mb-1">Bhutan EIS</p>
                                <h1 className="text-2xl font-bold text-white uppercase tracking-tight">Reports & GHG Inventory</h1>
                                <p className="text-sm text-white/50 mt-0.5">National energy statistics and greenhouse gas reporting — IEA / IPCC 2006 guidelines</p>
                            </div>
                        </div>
                        <div className="sm:ml-auto flex items-center gap-3">
                            {[{ label: 'Ref. Year', val: '2022' }, { label: 'Standard', val: 'IPCC 2006' }, { label: 'Format', val: 'IEA Balance' }].map(s => (
                                <div key={s.label} className="rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-center hidden sm:block">
                                    <p className="text-[9px] text-white/40 font-semibold uppercase tracking-widest mb-0.5">{s.label}</p>
                                    <p className="text-sm font-bold text-white">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Report cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {REPORT_CARDS.map(card => {
                        const Icon = card.icon;
                        return (
                            <Link key={card.href} to={card.href}
                                className="group relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                                {/* Top gradient accent */}
                                <div className={`h-1.5 w-full bg-gradient-to-r ${card.color}`} />

                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-md`}>
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${card.badgeColor} border border-current/20`}>
                                            {card.badge}
                                        </span>
                                    </div>

                                    <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                                        {card.title}
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5">
                                        {card.description}
                                    </p>

                                    {/* Stats row */}
                                    <div className="grid grid-cols-3 gap-3 mb-5">
                                        {card.stats.map(s => (
                                            <div key={s.label} className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3 text-center">
                                                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wide mb-0.5">{s.label}</p>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{s.value}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`flex items-center justify-end gap-2 text-sm font-semibold bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>
                                        View Report
                                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform text-slate-400 dark:text-slate-500" />
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Info strip */}
                <div className="rounded-xl border border-blue-100 dark:border-blue-900/30 bg-blue-50 dark:bg-blue-900/10 px-5 py-4 flex items-start gap-3">
                    <FileText className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-0.5">Department of Energy — Bhutan</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">
                            Data presented follows IEA Energy Balance methodology and IPCC 2006 Guidelines for National GHG Inventories.
                            Figures are in Terajoules (TJ) for energy and Gigagrams CO₂-equivalent (Gg CO₂e) for GHG, using AR5 GWP values.
                        </p>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}
