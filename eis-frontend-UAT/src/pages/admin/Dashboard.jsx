// src/pages/admin/Dashboard.jsx
import React, { useState, useEffect, useCallback } from 'react';
import {
    Plus, Layout, Save, RefreshCw, X, Edit3,
    BarChart2, Settings2, Sparkles, ChevronRight, Zap
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { analyticsAPI, getUser } from '../../services/api';
import DashboardWidget from './analytics/components/DashboardWidget';
import DashboardKPIBar from './analytics/components/DashboardKPIBar';
import WidgetGallery from './analytics/components/WidgetGallery';
import WidgetBuilderModal from './analytics/components/WidgetBuilderModal';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import 'react-grid-layout/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

/* ─── Default layout: auto-seeded when dashboard is empty ─────────────── */
const DEFAULT_LAYOUT = [
    { widget_code: 'electricity_generation_line', x: 0,  y: 0,  default_w: 8,  default_h: 3, id: 'dfl_1'  },
    { widget_code: 'dzongkhag_bar',               x: 8,  y: 0,  default_w: 4,  default_h: 3, id: 'dfl_2'  },
    { widget_code: 'ghg_by_sector_pie',           x: 0,  y: 3,  default_w: 4,  default_h: 3, id: 'dfl_3'  },
    { widget_code: 'dzongkhag_electricity_map',   x: 4,  y: 3,  default_w: 8,  default_h: 4, id: 'dfl_4'  },
    { widget_code: 'system_efficiency_stat',      x: 0,  y: 7,  default_w: 2,  default_h: 2, id: 'dfl_5'  },
    { widget_code: 'total_ghg_stat',              x: 2,  y: 7,  default_w: 2,  default_h: 2, id: 'dfl_6'  },
    { widget_code: 'energy_intensity_stat',       x: 4,  y: 7,  default_w: 2,  default_h: 2, id: 'dfl_7'  },
    { widget_code: 'solar_capacity_pie',          x: 6,  y: 7,  default_w: 3,  default_h: 3, id: 'dfl_8'  },
    { widget_code: 'vehicle_reg_line',            x: 9,  y: 7,  default_w: 3,  default_h: 3, id: 'dfl_9'  },
    { widget_code: 'energy_sankey',               x: 0,  y: 10, default_w: 12, default_h: 5, id: 'dfl_10' },
];

/* ─── Grid CSS ─────────────────────────────────────────────────────────── */
const GRID_CSS = `
  .react-grid-placeholder {
    background: rgba(99,102,241,0.12) !important;
    border: 2px dashed #6366f1 !important;
    border-radius: 1rem !important;
    opacity: 0.7 !important;
  }
  .react-resizable-handle {
    position: absolute;
    width: 20px !important;
    height: 20px !important;
    bottom: 0 !important;
    right: 0 !important;
    cursor: nwse-resize !important;
    z-index: 10;
  }
  .react-resizable-handle::after {
    content: "";
    position: absolute;
    right: 4px;
    bottom: 4px;
    width: 10px;
    height: 10px;
    border-right: 2.5px solid #6366f1;
    border-bottom: 2.5px solid #6366f1;
    border-radius: 0 0 3px 0;
  }
`;

export default function Dashboard() {
    const [layout, setLayout]           = useState([]);
    const [widgetDefs, setWidgetDefs]   = useState([]);
    const [isEditing, setIsEditing]     = useState(false);
    const [isGalleryOpen, setIsGallery] = useState(false);
    const [isBuilderOpen, setIsBuilder] = useState(false);
    const [editingWidget, setEditWidget] = useState(null);
    const [loading, setLoading]         = useState(true);
    const [saving, setSaving]           = useState(false);
    const [toast, setToast]             = useState(null);
    const user = getUser();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    /* ── Fetch dashboard config + widget library ─────────────────────── */
    const fetchConfig = useCallback(async () => {
        setLoading(true);
        try {
            const [dashData, widgetsData] = await Promise.all([
                analyticsAPI.getDashboard(),
                analyticsAPI.getWidgets(),
            ]);
            const allDefs = Array.isArray(widgetsData) ? widgetsData : (widgetsData?.results || []);
            setWidgetDefs(allDefs);

            let saved = dashData.layout_config || [];

            // Auto-seed if empty — merge DEFAULT_LAYOUT with real widget definitions
            if (saved.length === 0 && allDefs.length > 0) {
                const defMap = Object.fromEntries(allDefs.map(w => [w.widget_code, w]));
                saved = DEFAULT_LAYOUT
                    .filter(d => defMap[d.widget_code])
                    .map((d, i) => ({
                        ...defMap[d.widget_code],
                        id: Date.now() + i,
                        x: d.x,
                        y: d.y,
                        default_w: d.default_w,
                        default_h: d.default_h,
                        definition_id: defMap[d.widget_code].id,
                    }));
                // Persist the auto-seeded layout
                try { await analyticsAPI.saveDashboard({ layout_config: saved }); } catch {}
            }
            setLayout(saved);
        } catch (err) {
            console.error('Dashboard fetch failed', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchConfig(); }, [fetchConfig]);

    /* ── Widget management ───────────────────────────────────────────── */
    const handleAddWidget = (widgetDef) => {
        setLayout(prev => {
            if (widgetDef.id && prev.some(w => w.id === widgetDef.id)) {
                return prev.map(w => w.id === widgetDef.id ? widgetDef : w);
            }
            return [...prev, {
                ...widgetDef,
                id: Date.now(),
                definition_id: widgetDef.id,
                x: 0, y: Infinity,
                default_w: widgetDef.default_w || 4,
                default_h: widgetDef.default_h || 3,
            }];
        });
        setIsGallery(false);
        setIsBuilder(false);
        setEditWidget(null);
    };

    const handleLayoutChange = (currentLayout) => {
        setLayout(prev => prev.map(widget => {
            const g = currentLayout.find(l => l.i === String(widget.id));
            return g ? { ...widget, x: g.x, y: g.y, default_w: g.w, default_h: g.h } : widget;
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await analyticsAPI.saveDashboard({ layout_config: layout });
            setIsEditing(false);
            showToast('Dashboard saved successfully!');
        } catch {
            showToast('Failed to save layout', 'error');
        } finally {
            setSaving(false);
        }
    };

    /* ── Loading state ───────────────────────────────────────────────── */
    if (loading) return (
        <DashboardLayout title="Dashboard">
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
                <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-2xl shadow-indigo-200 dark:shadow-none">
                        <Zap className="h-8 w-8 text-white animate-pulse" />
                    </div>
                    <div className="absolute inset-0 rounded-2xl animate-ping bg-indigo-400/30" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-black text-slate-700 dark:text-slate-200">Loading Energy Analytics</p>
                    <p className="text-sm text-slate-400 mt-1">Fetching live data from all modules...</p>
                </div>
            </div>
        </DashboardLayout>
    );

    /* ── Main render ─────────────────────────────────────────────────── */
    return (
        <DashboardLayout breadcrumb="Analytics" title="Dashboard">
            <style>{GRID_CSS}</style>

            {/* ── Toast ────────────────────────────────────────────── */}
            {toast && (
                <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-bold animate-bounce
                    ${toast.type === 'error' ? 'bg-rose-600' : 'bg-indigo-600'}`}>
                    {toast.type === 'error' ? '⚠ ' : '✓ '}{toast.msg}
                </div>
            )}

            <div className="space-y-6 max-w-[1600px] mx-auto">

                {/* ── Page Header ──────────────────────────────────── */}
                <div className="relative rounded-3xl overflow-hidden shadow-xl">
                    {/* Gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900" />
                    {/* Floating orbs */}
                    <div className="absolute top-0 right-32 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-16 w-48 h-48 rounded-full bg-violet-500/15 blur-3xl pointer-events-none" />
                    <div className="absolute top-4 right-64 w-32 h-32 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

                    <div className="relative px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center">
                                    <Zap className="h-4 w-4 text-indigo-300" />
                                </div>
                                <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.25em]">Energy Information System</p>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-black text-white">
                                Analytics Command Center
                            </h1>
                            <p className="text-sm text-slate-400 mt-1">
                                Welcome back, <span className="text-indigo-300 font-bold">{user?.first_name || user?.username}</span>.
                                &nbsp;Live data from all energy modules.
                            </p>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            {isEditing ? (
                                <>
                                    <button onClick={() => setIsBuilder(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                                        <Plus className="h-4 w-4" /> Build Widget
                                    </button>
                                    <button onClick={() => setIsGallery(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                                        <Layout className="h-4 w-4" /> Gallery
                                    </button>
                                    <button onClick={handleSave} disabled={saving}
                                        className="flex items-center gap-2 px-5 py-2.5 bg-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-900/50 hover:bg-indigo-400 transition-all disabled:opacity-50">
                                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                        Save Layout
                                    </button>
                                    <button onClick={() => { setIsEditing(false); fetchConfig(); }}
                                        className="p-2.5 text-white/60 hover:text-white hover:bg-white/10 rounded-xl transition-all">
                                        <X className="h-5 w-5" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEditing(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all backdrop-blur-sm">
                                        <Edit3 className="h-4 w-4" /> Customize
                                    </button>
                                    <button onClick={fetchConfig}
                                        className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-xl text-sm font-bold hover:bg-indigo-500/30 transition-all">
                                        <RefreshCw className="h-4 w-4" /> Refresh
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── KPI Bar ──────────────────────────────────────── */}
                <DashboardKPIBar />

                {/* ── Editing mode banner ───────────────────────────── */}
                {isEditing && (
                    <div className="flex items-center gap-3 px-5 py-3 bg-indigo-50 dark:bg-indigo-950/40 border-2 border-indigo-200 dark:border-indigo-800 rounded-2xl">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse flex-shrink-0" />
                        <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                            Edit mode active — drag widgets to reorder, resize from bottom-right corner
                        </p>
                        <ChevronRight className="h-4 w-4 text-indigo-400 ml-auto flex-shrink-0" />
                    </div>
                )}

                {/* ── Widget Grid ───────────────────────────────────── */}
                {layout.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30 gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center shadow-sm">
                            <BarChart2 className="h-9 w-9 text-indigo-400" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-black text-slate-700 dark:text-slate-200">Dashboard is empty</h3>
                            <p className="text-sm text-slate-400 mt-1">Add widgets from the gallery or build a custom chart</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => { setIsEditing(true); setIsGallery(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                <Sparkles className="h-4 w-4" /> Add Widgets
                            </button>
                            <button onClick={() => { setIsEditing(true); setIsBuilder(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl text-sm font-bold hover:border-indigo-300 transition-all">
                                <Plus className="h-4 w-4" /> Build Custom
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className={`transition-all duration-300 ${isEditing ? 'bg-slate-50/80 dark:bg-slate-900/50 rounded-3xl p-4 border-2 border-dashed border-indigo-200/60 dark:border-indigo-900' : ''}`}>
                        <ResponsiveGridLayout
                            className="layout"
                            layouts={{
                                lg: layout.map(w => ({
                                    i: String(w.id),
                                    x: w.x ?? 0,
                                    y: w.y ?? 0,
                                    w: w.default_w || 4,
                                    h: w.default_h || 3,
                                    minW: 2,
                                    minH: 2,
                                }))
                            }}
                            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                            cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
                            rowHeight={90}
                            draggableHandle=".drag-handle"
                            isDraggable={isEditing}
                            isResizable={isEditing}
                            onLayoutChange={handleLayoutChange}
                            margin={[16, 16]}
                            useCSSTransforms
                            compactType="vertical"
                            preventCollision={false}
                            resizeHandles={['se']}
                        >
                            {layout.map(item => (
                                <div key={String(item.id)}>
                                    <DashboardWidget
                                        widget={item}
                                        isEditing={isEditing}
                                        onRemove={id => setLayout(prev => prev.filter(w => w.id !== id))}
                                        onEdit={w => { setEditWidget(w); setIsBuilder(true); }}
                                    />
                                </div>
                            ))}
                        </ResponsiveGridLayout>
                    </div>
                )}
            </div>

            {/* ── Modals ────────────────────────────────────────── */}
            <WidgetGallery
                isOpen={isGalleryOpen}
                onClose={() => setIsGallery(false)}
                onAdd={handleAddWidget}
                existingIds={layout.map(w => w.definition_id)}
            />
            <WidgetBuilderModal
                isOpen={isBuilderOpen}
                onClose={() => { setIsBuilder(false); setEditWidget(null); }}
                onAdd={handleAddWidget}
                editingWidget={editingWidget}
            />
        </DashboardLayout>
    );
}