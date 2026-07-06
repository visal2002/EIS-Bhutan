import React, { useState, useEffect, useCallback } from 'react';
import { Trash2, RefreshCw, Edit2, GripVertical, Maximize2, TrendingUp, BarChart2, PieChart, Activity, Map, Hash, Radar, Share2 } from 'lucide-react';
import { apiFetch } from '../../../../services/api';
import { StatWidget, BarChartWidget, PieChartWidget, LineChartWidget, AreaChartWidget, RadarChartWidget, BhutanChoropleth } from './AnalyticWidgets';
import SankeyWidget from './SankeyWidget';

// Chart type accent colours
const TYPE_META = {
    STAT:   { color: '#6366f1', bg: 'from-indigo-500 to-violet-600',   label: 'KPI',    Icon: Hash },
    BAR:    { color: '#10b981', bg: 'from-emerald-500 to-teal-600',    label: 'Bar',    Icon: BarChart2 },
    PIE:    { color: '#f59e0b', bg: 'from-amber-500 to-orange-500',    label: 'Pie',    Icon: PieChart },
    LINE:   { color: '#6366f1', bg: 'from-indigo-500 to-blue-600',     label: 'Line',   Icon: Activity },
    AREA:   { color: '#10b981', bg: 'from-emerald-400 to-cyan-500',    label: 'Area',   Icon: TrendingUp },
    RADAR:  { color: '#8b5cf6', bg: 'from-violet-500 to-fuchsia-600',  label: 'Radar',  Icon: Radar },
    MAP:    { color: '#0ea5e9', bg: 'from-sky-500 to-blue-600',        label: 'Map',    Icon: Map },
    SANKEY: { color: '#2d8a5e', bg: 'from-emerald-700 to-teal-800',    label: 'Sankey', Icon: Share2 },
};

// Skeleton shimmer
const Skeleton = () => (
    <div className="flex flex-col gap-3 h-full p-2 animate-pulse">
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3" />
        <div className="flex-1 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 rounded-2xl" />
        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2" />
    </div>
);

export default function DashboardWidget({ widget, onRemove, onEdit, isEditing }) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const endpoint = widget.data_endpoint.startsWith('/api/')
                ? widget.data_endpoint.replace('/api/', '/')
                : widget.data_endpoint;
            const res = await apiFetch(endpoint);
            if (!res.ok) throw new Error(`${res.status}`);
            const json = await res.json();
            setData(json);
            setLastFetch(new Date());
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    }, [widget.data_endpoint]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const meta = TYPE_META[widget.chart_type] || TYPE_META.BAR;

    const renderChart = () => {
        if (loading) return <Skeleton />;
        if (error) return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <span className="text-3xl">⚠️</span>
                <p className="text-xs text-rose-500 font-semibold">{error}</p>
                <button onClick={fetchData} className="px-3 py-1.5 text-[10px] font-bold bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-colors">
                    Retry
                </button>
            </div>
        );

        switch (widget.chart_type) {
            case 'STAT':   return <StatWidget data={data} title={widget.title} />;
            case 'BAR':    return <BarChartWidget data={data?.by_fuel || data?.by_sector || data?.by_dzongkhag || data} />;
            case 'PIE':    return <PieChartWidget data={data?.by_sector || data?.sector_usage || data} />;
            case 'LINE':   return <LineChartWidget data={data} xKey={Array.isArray(data) && data[0]?.year ? 'year' : 'label'} />;
            case 'AREA':   return <AreaChartWidget data={data?.by_fuel || data?.by_sector || data} />;
            case 'RADAR':  return <RadarChartWidget data={data?.by_fuel || data?.by_sector || data} />;
            case 'MAP':    return <BhutanChoropleth data={Array.isArray(data) ? data : (data?.by_dzongkhag || [])} />;
            case 'SANKEY': return <SankeyWidget data={data} />;
            default:      return <div className="text-xs text-slate-400 flex items-center justify-center h-full">Unsupported type</div>;
        }
    };

    return (
        <div className={`
            group h-full w-full flex flex-col rounded-2xl overflow-hidden shadow-sm transition-all duration-300
            bg-white dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60
            ${isEditing ? 'ring-2 ring-indigo-400/40 shadow-indigo-100 dark:shadow-none' : 'hover:shadow-xl hover:shadow-slate-200/60 dark:-translate-y-0'}
        `}>
            {/* ── Gradient Header Strip ───────────────────────── */}
            <div className={`
                flex items-center justify-between px-4 py-2.5 flex-shrink-0
                bg-gradient-to-r ${meta.bg} relative overflow-hidden
                ${isEditing ? 'drag-handle cursor-grab active:cursor-grabbing' : ''}
            `}>
                {/* subtle pattern overlay */}
                <div className="absolute inset-0 opacity-20"
                    style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="relative flex items-center gap-2 min-w-0">
                    {isEditing && <GripVertical className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />}
                    <meta.Icon className="h-3.5 w-3.5 text-white/80 flex-shrink-0" />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-wider truncate">{widget.title}</h3>
                </div>

                <div className="relative flex items-center gap-1 flex-shrink-0">
                    <span className="hidden sm:block text-[8px] font-black text-white/60 bg-white/10 px-1.5 py-0.5 rounded-full uppercase tracking-widest">
                        {meta.label}
                    </span>
                    {isEditing ? (
                        <>
                            <button onClick={e => { e.stopPropagation(); onEdit(widget); }}
                                className="p-1.5 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors">
                                <Edit2 className="h-3 w-3" />
                            </button>
                            <button onClick={e => { e.stopPropagation(); onRemove(widget.id); }}
                                className="p-1.5 rounded-lg bg-white/15 hover:bg-rose-500/60 text-white transition-colors">
                                <Trash2 className="h-3 w-3" />
                            </button>
                        </>
                    ) : (
                        <button onClick={fetchData}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/25 text-white opacity-0 group-hover:opacity-100 transition-all">
                            <RefreshCw className="h-3 w-3" />
                        </button>
                    )}
                </div>
            </div>

            {/* ── Chart Content ───────────────────────────────── */}
            <div className="flex-1 min-h-0 p-3">
                {renderChart()}
            </div>

            {/* ── Footer timestamp ─────────────────────────────── */}
            {lastFetch && !loading && !isEditing && (
                <div className="flex-shrink-0 px-4 pb-2">
                    <p className="text-[8px] text-slate-300 dark:text-slate-600 font-medium">
                        Updated {lastFetch.toLocaleTimeString()}
                    </p>
                </div>
            )}
        </div>
    );
}
