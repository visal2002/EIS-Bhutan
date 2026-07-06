import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Zap, DropletIcon, Leaf, Globe, Database } from 'lucide-react';
import { apiFetch } from '../../../../services/api';

const KPICard = ({ label, value, unit, icon: Icon, gradient, trend, trendVal, loading, index }) => (
    <div
        className="relative flex-1 min-w-[180px] rounded-2xl overflow-hidden shadow-lg"
        style={{ animationDelay: `${index * 80}ms` }}
    >
        {/* Background gradient */}
        <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-100`} />
        {/* Decorative circle */}
        <div className="absolute -right-6 -top-6 w-28 h-28 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-4 w-16 h-16 rounded-full bg-white/10" />

        <div className="relative p-4 flex flex-col gap-1">
            <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.18em] leading-tight">{label}</p>
                <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                    <Icon className="h-3.5 w-3.5 text-white" />
                </div>
            </div>
            {loading ? (
                <div className="h-8 w-24 bg-white/20 rounded-lg animate-pulse" />
            ) : (
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white leading-none tabular-nums">{value}</span>
                    {unit && <span className="text-[10px] font-bold text-white/60 uppercase">{unit}</span>}
                </div>
            )}
            <div className="flex items-center gap-1 mt-0.5">
                {trend === 'up'
                    ? <TrendingUp className="h-3 w-3 text-white/80" />
                    : <TrendingDown className="h-3 w-3 text-white/60" />
                }
                <span className="text-[9px] font-bold text-white/70">{trendVal}</span>
            </div>
        </div>
    </div>
);

export default function DashboardKPIBar() {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiFetch('/reporting/dashboard/summary/')
            .then(r => r.json())
            .then(d => { setSummary(d); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const fmt = (n, dec = 0) => n != null ? parseFloat(n).toLocaleString(undefined, { maximumFractionDigits: dec }) : '—';

    const cards = [
        {
            label: 'Total Generation',
            value: fmt(summary?.total_generation_gwh),
            unit: 'GWh',
            icon: Zap,
            gradient: 'from-indigo-600 to-violet-700',
            trend: 'up',
            trendVal: 'Since 1986',
        },
        {
            label: 'Total Consumption',
            value: fmt(summary?.total_consumption_gwh),
            unit: 'GWh',
            icon: DropletIcon,
            gradient: 'from-sky-500 to-blue-700',
            trend: 'up',
            trendVal: 'All Dzongkhags',
        },
        {
            label: 'Renewable Share',
            value: fmt(summary?.renewable_share, 1),
            unit: '%',
            icon: Leaf,
            gradient: 'from-emerald-500 to-teal-700',
            trend: 'up',
            trendVal: 'Hydropower-led',
        },
        {
            label: 'GHG Emissions',
            value: summary?.total_ghg > 0 ? fmt(summary.total_ghg, 1) : '—',
            unit: summary?.total_ghg > 0 ? 'kt' : '',
            icon: Globe,
            gradient: 'from-rose-500 to-pink-700',
            trend: 'down',
            trendVal: 'Carbon neutral goal',
        },
        {
            label: 'Data Records',
            value: fmt(summary?.total_records),
            unit: 'rows',
            icon: Database,
            gradient: 'from-amber-500 to-orange-600',
            trend: 'up',
            trendVal: 'Across all modules',
        },
    ];

    return (
        <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-slate-200">
            {cards.map((card, i) => (
                <KPICard key={card.label} {...card} loading={loading} index={i} />
            ))}
        </div>
    );
}
