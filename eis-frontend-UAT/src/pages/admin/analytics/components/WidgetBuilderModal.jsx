import React, { useState, useEffect } from 'react';
import { X, Search, ChevronRight, BarChart2, PieChart, LineChart, Map, Check, Trash2, ArrowRight, Plus } from 'lucide-react';
import { analyticsAPI } from '../../../../services/api';

const CHART_TYPES = [
    { key: 'BAR',   label: 'Bar Chart',    icon: BarChart2 },
    { key: 'PIE',   label: 'Pie Chart',    icon: PieChart },
    { key: 'LINE',  label: 'Line Trend',   icon: LineChart },
    { key: 'AREA',  label: 'Area Trend',   icon: BarChart2 },
    { key: 'RADAR', label: 'Radar Radar',  icon: PieChart },
    { key: 'MAP',   label: 'Bhutan Map',   icon: Map },
];

export default function WidgetBuilderModal({ isOpen, onClose, onAdd, editingWidget = null }) {
    const [step, setStep] = useState(1);
    const [discovery, setDiscovery] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Selection state
    const [selectedModel, setSelectedModel] = useState(null);
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [selectedGroupBy, setSelectedGroupBy] = useState(null);
    const [selectedChart, setSelectedChart] = useState('BAR');
    const [widgetTitle, setWidgetTitle] = useState('');

    useEffect(() => {
        if (isOpen) {
            analyticsAPI.getDiscovery().then(data => {
                setDiscovery(data);
                setLoading(false);
                
                // If editing, try to pre-populate
                if (editingWidget && editingWidget.is_dynamic) {
                    const cfg = editingWidget.config;
                    setSelectedModel(cfg.model);
                    setWidgetTitle(editingWidget.title);
                    setSelectedChart(editingWidget.chart_type);
                    // Metrics/GroupBy need the discovery data to be fully loaded/matched
                    if (data[cfg.model]) {
                        const m = data[cfg.model].fields.find(f => f.name === cfg.metric);
                        const g = data[cfg.model].fields.find(f => f.name === cfg.group_by);
                        setSelectedMetric(m);
                        setSelectedGroupBy(g);
                        setStep(3); // Go straight to last step
                    }
                }
            });
        }
    }, [isOpen, editingWidget]);

    if (!isOpen) return null;

    const handleCreate = () => {
        const config = {
            model: selectedModel,
            metric: selectedMetric.name,
            group_by: selectedGroupBy.name,
        };
        
        onAdd({
            ...editingWidget,
            title: widgetTitle || `${selectedMetric.label} by ${selectedGroupBy.label}`,
            chart_type: selectedChart,
            data_endpoint: `/analytics/query/?model=${config.model}&metric=${config.metric}&group_by=${config.group_by}`,
            default_w: editingWidget?.default_w || (selectedChart === 'MAP' ? 4 : 2),
            default_h: editingWidget?.default_h || (selectedChart === 'MAP' ? 3 : 2),
            is_dynamic: true,
            config: config
        });
        
        // Reset
        setStep(1);
        setSelectedModel(null);
        setWidgetTitle('');
    };

    const models = discovery ? Object.entries(discovery) : [];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-2xl bg-primary-600 flex items-center justify-center text-white shadow-lg shadow-primary-200">
                            <Plus className="h-6 w-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-800 dark:text-white">Widget Builder</h2>
                            <p className="text-xs text-slate-400 font-medium">Step {step} of 3: {step === 1 ? 'Data Source' : step === 2 ? 'Aggregation' : 'Visualization'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X className="h-6 w-6 text-slate-400" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 space-y-4">
                            <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                            <p className="text-slate-400 font-medium">Scanning modules...</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {step === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {models.map(([key, val]) => (
                                        <button 
                                            key={key}
                                            onClick={() => { setSelectedModel(key); setStep(2); }}
                                            className={`p-6 text-left rounded-3xl border-2 transition-all group ${selectedModel === key ? 'border-primary-600 bg-primary-50/50' : 'border-slate-100 hover:border-primary-200 hover:bg-slate-50'}`}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-widest mb-1">{key.split('.')[0]}</p>
                                                    <h4 className="text-lg font-bold text-slate-800 dark:text-white">{val.verbose_name}</h4>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-slate-300 group-hover:text-primary-500 transform group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {step === 2 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Which value should we sum?</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {discovery[selectedModel].fields.filter(f => f.is_numeric).map(f => (
                                                <button 
                                                    key={f.name}
                                                    onClick={() => setSelectedMetric(f)}
                                                    className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${selectedMetric?.name === f.name ? 'border-primary-600 bg-primary-600 text-white shadow-lg' : 'border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Group data by:</label>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                            {discovery[selectedModel].fields.filter(f => f.name !== selectedMetric?.name).map(f => (
                                                <button 
                                                    key={f.name}
                                                    onClick={() => setSelectedGroupBy(f)}
                                                    className={`px-4 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${selectedGroupBy?.name === f.name ? 'border-primary-600 bg-primary-600 text-white shadow-lg' : 'border-slate-100 text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    {f.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {step === 3 && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Select Visualization</label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {CHART_TYPES.map(type => (
                                                <button 
                                                    key={type.key}
                                                    onClick={() => setSelectedChart(type.key)}
                                                    className={`flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all ${selectedChart === type.key ? 'border-primary-600 bg-primary-50' : 'border-slate-100 hover:bg-slate-50'}`}
                                                >
                                                    <type.icon className={`h-8 w-8 mb-3 ${selectedChart === type.key ? 'text-primary-600' : 'text-slate-400'}`} />
                                                    <span className={`text-sm font-bold ${selectedChart === type.key ? 'text-primary-700' : 'text-slate-600'}`}>{type.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <label className="text-sm font-bold text-slate-500 uppercase tracking-wider">Widget Title (Optional)</label>
                                        <input 
                                            type="text"
                                            placeholder={`${selectedMetric?.label} by ${selectedGroupBy?.label}`}
                                            value={widgetTitle}
                                            onChange={e => setWidgetTitle(e.target.value)}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:border-primary-500 focus:outline-none font-bold text-slate-700"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                    <button 
                        disabled={step === 1}
                        onClick={() => setStep(step - 1)}
                        className="px-6 py-3 text-sm font-bold text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all"
                    >
                        Back
                    </button>
                    
                    {step < 3 ? (
                        <button 
                            disabled={step === 2 && (!selectedMetric || !selectedGroupBy)}
                            onClick={() => setStep(step + 1)}
                            className="flex items-center gap-2 px-8 py-3 bg-slate-800 text-white rounded-2xl text-sm font-bold hover:bg-slate-900 transition-all disabled:opacity-30"
                        >
                            Next Step <ArrowRight className="h-4 w-4" />
                        </button>
                    ) : (
                        <button 
                            onClick={handleCreate}
                            className="flex items-center gap-2 px-8 py-3 bg-primary-600 text-white rounded-2xl text-sm font-bold shadow-lg shadow-primary-200 hover:bg-primary-700 transition-all"
                        >
                            Create Widget <Check className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
