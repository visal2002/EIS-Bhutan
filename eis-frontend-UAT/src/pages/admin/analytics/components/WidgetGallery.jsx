import React, { useState, useEffect } from 'react';
import { Plus, X, Search, BarChart2, PieChart, LineChart, Hash, Map, Activity, TrendingUp, Radar } from 'lucide-react';
import { analyticsAPI } from '../../../../services/api';

const CHART_META = {
    STAT:  { icon: Hash,       label: 'KPI',     color: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-950/50',  text: 'text-indigo-600' },
    BAR:   { icon: BarChart2,  label: 'Bar',     color: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-600' },
    PIE:   { icon: PieChart,   label: 'Pie',     color: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-950/50',    text: 'text-amber-600' },
    LINE:  { icon: LineChart,  label: 'Line',    color: '#6366f1', bg: 'bg-indigo-100 dark:bg-indigo-950/50',  text: 'text-indigo-600' },
    AREA:  { icon: TrendingUp, label: 'Area',    color: '#06b6d4', bg: 'bg-cyan-100 dark:bg-cyan-950/50',      text: 'text-cyan-600' },
    RADAR: { icon: Radar,      label: 'Radar',   color: '#8b5cf6', bg: 'bg-violet-100 dark:bg-violet-950/50',  text: 'text-violet-600' },
    MAP:   { icon: Map,        label: 'Map',     color: '#0ea5e9', bg: 'bg-sky-100 dark:bg-sky-950/50',        text: 'text-sky-600' },
};

export default function WidgetGallery({ isOpen, onClose, onAdd, existingIds = [] }) {
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => {
        if (isOpen) {
            analyticsAPI.getWidgets().then(data => {
                setWidgets(Array.isArray(data) ? data : (data?.results || []));
                setLoading(false);
            });
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const chartTypes = ['ALL', ...Object.keys(CHART_META)];
    const filtered = widgets.filter(w =>
        (filter === 'ALL' || w.chart_type === filter) &&
        (w.title?.toLowerCase().includes(search.toLowerCase()) ||
         w.description?.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-end bg-slate-900/50 backdrop-blur-sm">
            <div className="h-full w-full max-w-[420px] bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col">

                {/* Header */}
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-violet-600 text-white flex-shrink-0">
                    <div className="flex items-center justify-between mb-1">
                        <h2 className="text-lg font-black">Widget Gallery</h2>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <p className="text-indigo-200 text-xs font-medium">{widgets.length} widgets available — click to add</p>
                </div>

                {/* Search */}
                <div className="px-4 pt-4 pb-2 flex-shrink-0 space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search widgets..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-400 focus:border-transparent outline-none"
                        />
                    </div>
                    {/* Type filters */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-wrap">
                        {chartTypes.map(t => {
                            const m = CHART_META[t];
                            return (
                                <button key={t}
                                    onClick={() => setFilter(t)}
                                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex-shrink-0 ${
                                        filter === t
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}>
                                    {m && <m.icon className="h-3 w-3" />}
                                    {t}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Widget list */}
                <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-2">
                    {loading ? (
                        [...Array(5)].map((_, i) => (
                            <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                        ))
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <span className="text-4xl mb-3">🔍</span>
                            <p className="font-bold text-slate-500">No widgets match your search</p>
                        </div>
                    ) : (
                        filtered.map(w => {
                            const meta = CHART_META[w.chart_type] || CHART_META.BAR;
                            const Icon = meta.icon;
                            const isAdded = existingIds.includes(w.id);
                            return (
                                <div key={w.id}
                                    className={`group p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                                        isAdded
                                            ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20 opacity-60'
                                            : 'border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20'
                                    }`}
                                    onClick={() => !isAdded && onAdd(w)}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={`w-9 h-9 rounded-xl ${meta.bg} flex items-center justify-center flex-shrink-0`}>
                                            <Icon className={`h-4 w-4 ${meta.text}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 leading-tight truncate">{w.title}</h4>
                                                <span className={`flex-shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.text}`}>{meta.label}</span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{w.description}</p>
                                        </div>
                                        <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                            isAdded
                                                ? 'bg-emerald-100 text-emerald-600'
                                                : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                        }`}>
                                            {isAdded ? '✓' : <Plus className="h-4 w-4" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
