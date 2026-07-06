
export function JobsTab({ moduleKey, endpoint, params }) {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewJobErrors, setViewJobErrors] = useState(null);

    const fetchJobs = useCallback(async () => {
        try {
            let actualModule = 'EnergyDataModel';
            if (moduleKey === 'pol') {
                actualModule = 'pol.POLImportExport';
            } else if (moduleKey === 'coal') {
                actualModule = 'coal.CoalData';
            } else if (moduleKey === 'biomass') {
                if ((endpoint || '').includes('biogas')) {
                    actualModule = 'biomass.BiogasData';
                } else if ((endpoint || '').includes('briquette')) {
                    actualModule = 'biomass.BriquetteCharcoal';
                } else if ((endpoint || '').includes('charcoal')) {
                    actualModule = 'biomass.BriquetteCharcoal';
                }
            } else if (moduleKey === 'surface_transport') {
                actualModule = (endpoint || '').includes('registration') ? 'surface_transport.VehicleRegistration' : 'surface_transport.TransportConsumption';
            } else if (moduleKey === 'air_transport') {
                actualModule = (endpoint || '').includes('activity') ? 'air_transport.AircraftActivity' : 'air_transport.AviationFuelConsumption';
            } else if (moduleKey === 'electricity_data') {
                if ((endpoint || '').includes('generation-hourly')) {
                    actualModule = 'electricity.HourlyGenerationData';
                } else if ((endpoint || '').includes('generation-daily')) {
                    actualModule = 'electricity.PlantGenerationDaily';
                } else if ((endpoint || '').includes('generation')) {
                    actualModule = 'electricity.ElectricityGeneration';
                } else if ((endpoint || '').includes('hydrology')) {
                    actualModule = 'electricity.HydrologyData';
                } else if ((endpoint || '').includes('infra/transmission')) {
                    actualModule = 'electricity.TransmissionLineData';
                } else if ((endpoint || '').includes('infra/distribution')) {
                    actualModule = 'electricity.DistributionLineData';
                } else if ((endpoint || '').includes('infra/dist-transformer')) {
                    actualModule = 'electricity.DistributionTransformerData';
                } else if ((endpoint || '').includes('sales')) {
                    actualModule = 'electricity.ElectricitySalesData';
                } else if ((endpoint || '').includes('consumers')) {
                    actualModule = 'electricity.ElectricityConsumerData';
                } else if ((endpoint || '').includes('consumption')) {
                    actualModule = 'electricity.ElectricityConsumption';
                } else if ((endpoint || '').includes('trade/rea')) {
                    actualModule = 'electricity.ExportREAData';
                }
            }
            if (params && Object.keys(params).length > 0) {
                const qs = new URLSearchParams(params).toString();
                actualModule = `${actualModule}?${qs}`;
            } else if (endpoint && endpoint.includes('?')) {
                const qs = endpoint.split('?')[1];
                if (qs) actualModule = `${actualModule}?${qs}`;
            }
            
            const [importRes, exportRes] = await Promise.all([
                apiFetch(`/admin/import-jobs/?module_name=${actualModule}`),
                apiFetch(`/admin/export-jobs/?module_name=${actualModule}`)
            ]);
            
            let allJobs = [];
            if (importRes.ok) {
                const data = await importRes.json();
                const importJobs = (data.results || []).map(j => ({ ...j, type: 'import' }));
                allJobs = allJobs.concat(importJobs);
            }
            if (exportRes.ok) {
                const data = await exportRes.json();
                const exportJobs = (data.results || []).map(j => ({ ...j, type: 'export' }));
                allJobs = allJobs.concat(exportJobs);
            }
            
            // Sort by created_at descending
            allJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setJobs(allJobs);
        } finally {
            setLoading(false);
        }
    }, [moduleKey, endpoint]);

    const handleAction = async (jobId, action, type) => {
        try {
            const endpoint = type === 'import' ? `/admin/import-jobs/${jobId}/${action}/` : `/admin/export-jobs/${jobId}/${action}/`;
            const res = await apiFetch(endpoint, { method: 'POST' });
            if (res.ok) fetchJobs();
            else {
                const data = await res.json();
                alert(data.detail || `Failed to ${action} job.`);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const executeDelete = async (jobId, type) => {
        if (!window.confirm('Are you sure you want to delete this job?')) return;
        try {
            const endpoint = type === 'import' ? `/admin/import-jobs/${jobId}/` : `/admin/export-jobs/${jobId}/`;
            const res = await apiFetch(endpoint, { method: 'DELETE' });
            if (res.ok) fetchJobs();
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(() => {
            setJobs(prev => {
                if (prev.some(j => j.status === 'processing' || j.status === 'pending')) {
                    fetchJobs();
                }
                return prev;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchJobs]);

    if (viewJobErrors) {
        return <ErrorResolutionGrid job={viewJobErrors} params={params} onClose={() => { setViewJobErrors(null); fetchJobs(); }} />;
    }

    if (loading) return <div className="p-8 text-center text-slate-500">Loading jobs...</div>;
    if (jobs.length === 0) return <div className="p-8 text-center text-slate-500">No background jobs found.</div>;

    return (
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {jobs.map(job => (
                <div key={`${job.type}-${job.id}`} className="p-5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                                {job.type === 'import' ? (job.original_filename || 'Data Import') : 'Data Export'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                job.type === 'import' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-200'
                            }`}>
                                {job.type.toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                job.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                job.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                job.status === 'failed' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                                'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                                {job.status === 'processing' && <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />}
                                {job.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Started {new Date(job.created_at).toLocaleString()} {job.type === 'import' ? `• ${job.processed_rows} / ${job.total_rows} rows processed` : `• ${job.processed_rows || 0} / ${job.total_rows || '?'} rows exported`}
                        </p>
                        {job.status === 'processing' && (
                            <div className="w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full mt-2 overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${job.total_rows ? Math.max(5, (job.processed_rows / job.total_rows) * 100) : 5}%` }} />
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {job.type === 'export' && job.status === 'completed' && job.file && (
                            <a href={job.file} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all mr-2">
                                <Download className="h-3.5 w-3.5" /> Download File
                            </a>
                        )}
                        {job.type === 'import' && job.error_count > 0 && job.status === 'completed' && (
                            <button onClick={() => setViewJobErrors(job)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all">
                                <AlertTriangle className="h-3.5 w-3.5" /> Resolve {job.error_count} Errors
                            </button>
                        )}
                        <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-slate-700 pl-3 ml-1">
                            {job.status === 'processing' && (
                                <button onClick={() => handleAction(job.id, 'pause', job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">
                                    <PauseCircle className="h-4 w-4" /> Pause
                                </button>
                            )}
                            {job.status === 'paused' && (
                                <button onClick={() => handleAction(job.id, 'resume', job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
                                    <PlayCircle className="h-4 w-4" /> Resume
                                </button>
                            )}
                            {['processing', 'paused', 'pending'].includes(job.status) && (
                                <button onClick={() => handleAction(job.id, 'stop', job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
                                    <StopCircle className="h-4 w-4" /> Stop
                                </button>
                            )}
                            {job.status === 'stopped' && (
                                <button onClick={() => handleAction(job.id, 'retry', job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
                                    <PlayCircle className="h-4 w-4" /> Resume
                                </button>
                            )}
                            {job.status === 'failed' && (
                                <button onClick={() => handleAction(job.id, 'retry', job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">
                                    <RefreshCw className="h-4 w-4" /> Retry
                                </button>
                            )}
                            <button onClick={() => executeDelete(job.id, job.type)} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}


export function ErrorResolutionGrid({ job, params, onClose }) {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [retryingAll, setRetryingAll] = useState(false);
    
    const fetchErrors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/import-errors/?job_id=${job.id}&page_size=100`);
            if (res.ok) {
                const data = await res.json();
                setErrors(data.results || []);
            }
        } finally {
            setLoading(false);
        }
    }, [job.id]);

    useEffect(() => {
        fetchErrors();
    }, [fetchErrors]);

    const updateCell = (id, field, value) => {
        setErrors(prev => prev.map(e => e.id === id ? { ...e, raw_data: { ...e.raw_data, [field]: value } } : e));
    };

    const handleRetryAll = async () => {
        setRetrying(true);
        try {
            const res = await apiFetch(`/admin/import-errors/retry/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: job.id,
                    rows: errors.map(e => ({ id: e.id, raw_data: e.raw_data })),
                    params: params
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.remaining === 0) {
                    onClose();
                } else {
                    fetchErrors();
                }
            }
        } finally {
            setRetrying(false);
        }
    };

    const handleRetryEverything = async () => {
        setRetryingAll(true);
        try {
            const res = await apiFetch(`/admin/import-errors/retry/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    job_id: job.id,
                    retry_all: true,
                    params: params
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.remaining === 0) {
                    onClose();
                } else {
                    fetchErrors();
                }
            }
        } finally {
            setRetryingAll(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Loading errors...</div>;
    
    if (errors.length === 0) {
        return (
            <div className="p-8 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">All Errors Resolved!</h3>
                <button onClick={onClose} className="mt-4 px-4 py-2 bg-primary-50 text-primary-700 rounded-xl font-semibold hover:bg-primary-100">Back to Jobs</button>
            </div>
        );
    }

    const headers = Object.keys(errors[0]?.raw_data || {}).filter(k => k !== '_row');

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"><ChevronLeft className="h-5 w-5" /></button>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">Fix Errors: {job.original_filename}</h3>
                        <p className="text-xs text-rose-500 font-semibold">{errors.length} rows to fix on this page</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRetryAll} disabled={retrying || retryingAll} className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                        {(retrying) && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Retry Displayed Rows
                    </button>
                    <button onClick={handleRetryEverything} disabled={retrying || retryingAll} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-2">
                        {retryingAll && <RefreshCw className="h-4 w-4 animate-spin" />}
                        Retry All Rows
                    </button>
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                            <th className="px-4 py-3">Row</th>
                            {headers.map(h => <th key={h} className="px-4 py-3">{h}</th>)}
                            <th className="px-4 py-3">Error Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                        {errors.map(errObj => {
                            const errs = errObj.error_message || {};
                            const msg = errs._error || Object.entries(errs).map(([k,v])=>`${k}: ${v}`).join('; ');
                            
                            return (
                                <tr key={errObj.id} className="hover:bg-rose-50/30 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono">#{errObj.row_index}</td>
                                    {headers.map(h => (
                                        <td key={h} className="px-2 py-2">
                                            <input 
                                                type="text"
                                                value={errObj.raw_data[h] || ''}
                                                onChange={e => updateCell(errObj.id, h, e.target.value)}
                                                className={`w-full px-2 py-1.5 text-sm bg-transparent border rounded-md focus:ring-2 focus:ring-primary-500 outline-none transition-colors
                                                    ${errs[h] ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                                title={errs[h] || ''}
                                            />
                                        </td>
                                    ))}
                                    <td className="px-4 py-3">
                                        <span className="inline-block px-2 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[10px] font-bold max-w-[200px] truncate" title={msg}>
                                            {msg}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Plus, Edit3, Trash2, X, Save, RefreshCw, RotateCcw,
    ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
    ChevronLeft, ChevronRight, Download, Upload, FileText,
    FileSpreadsheet, ChevronDown, SlidersHorizontal,
    CheckCheck, XCircle, AlertCircle, ArrowRight,
    Filter, Calendar, Database, MoreHorizontal, Wifi,
    PauseCircle, PlayCircle, StopCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { apiFetch, getAccessToken } from '../../../services/api';
import { usePermissions } from '../../../context/PermissionsContext';
import { GenericImportEngine, GenericAPIFetch } from './DataCollectionImportEngine';
import ExportModal from './ExportModal';

const PAGE_SIZES = [10, 20, 50, 100, 500];
const DEFAULT_PAGE_SIZE = 20;

const MONTHS = [
    { value: 1, label: 'January' }, { value: 2, label: 'February' },
    { value: 3, label: 'March' }, { value: 4, label: 'April' },
    { value: 5, label: 'May' }, { value: 6, label: 'June' },
    { value: 7, label: 'July' }, { value: 8, label: 'August' },
    { value: 9, label: 'September' }, { value: 10, label: 'October' },
    { value: 11, label: 'November' }, { value: 12, label: 'December' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - i);

// ── Shared Primitives ──────────────────────────────────────────────────────

export function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t); }, [onDone]);
    const ok = type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-2.5
            px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold
            ${ok ? 'bg-emerald-600' : 'bg-rose-500'}`}
            style={{ animation: 'slideUp .25s ease-out' }}>
            {ok ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {message}
        </div>
    );
}

export function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4
            bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6
                border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-center gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/30
                        flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                    {message}
                </p>
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600
                            text-sm font-semibold text-slate-600 dark:text-slate-300
                            hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold
                            disabled:opacity-60 flex items-center justify-center gap-2
                            transition-colors ${confirmClass}`}>
                        {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════════
// DATA COLLECTION ENGINE
// ═══════════════════════════════════════════════════════════════════════════

// ── Export helper ─────────────────────────────────────────────────
function exportCSV(records, headers, filename) {
    const rows = records.map(r =>
        headers.map(h => {
            const v = String(r[h] ?? '');
            return v.includes(',') ? `"${v}"` : v;
        }).join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const a   = document.createElement('a');
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = filename;
    a.click();
}

export function DataCollectionBanner({ title, description, icon: Icon, parentTitle = "Data Collection", gradient = "#0f2922 0%, #1a4a3a 50%, #1e6647 100%" }) {
    return (
        <div className="relative rounded-3xl overflow-hidden mb-5"
            style={{ background: `linear-gradient(135deg, ${gradient})` }}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{
                    backgroundImage: `
                        radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, #34d399 0%, transparent 40%),
                        radial-gradient(circle at 60% 80%, #6ee7b7 0%, transparent 30%)`,
                }} />
            <div className="absolute inset-0 opacity-5 pointer-events-none"
                style={{
                    backgroundImage: `
                        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }} />
            <div className="relative px-8 py-8 flex flex-col lg:flex-row lg:items-center gap-6">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20
                            flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                            {Icon ? <Icon className="h-5 w-5 text-emerald-300" /> : <Database className="h-5 w-5 text-emerald-300" />}
                        </div>
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-[.2em]
                                text-emerald-400/80">{parentTitle}</p>
                            <h1 className="text-2xl font-bold text-white leading-tight">
                                {title}
                            </h1>
                        </div>
                    </div>
                    {description && (
                         <p className="text-sm text-white/60 leading-relaxed max-w-lg">
                             {description}
                         </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export default function DataCollectionEngine({ config, standalone = true, hideBanner = false }) {
    const navigate = useNavigate();
    const { can, canView, canCreate, canEdit, canDelete, canUpload } = usePermissions();
    const moduleKey = config.moduleKey || config.title.toLowerCase();

    // ── State ──────────────────────────────────────────────────────────────
    const [items,      setItems]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [total,      setTotal]      = useState(0);
    const [page,       setPage]       = useState(1);
    const [pageSize,   setPageSize]   = useState(DEFAULT_PAGE_SIZE);
    
    const [search,     setSearch]     = useState('');
    const [year,       setYear]       = useState('');
    const [month,      setMonth]      = useState('');
    const [customFilters, setCustomFilters] = useState({});
    
    const [modal,      setModal]      = useState(null); // { mode: 'add'|'edit', item?: any }
    const [confirm,    setConfirm]    = useState(null); // { type, id }
    const [toast,      setToast]      = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [exportOpen, setExportOpen] = useState(false);
    const [apiOpen,    setApiOpen]    = useState(false);
    
    const [apiCache,   setApiCache]   = useState({}); // For api-select fields
    const [gridOpen,   setGridOpen]   = useState(false);
    const [tabMode,    setTabMode]    = useState('active'); // active | trash | jobs
    const [selected,   setSelected]   = useState([]);
    const [sortField,  setSortField]  = useState('');
    const [sortDirection, setSortDirection] = useState('asc');

    // ── Fetching ───────────────────────────────────────────────────────────
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page,
                page_size: pageSize,
                search,
                year,
                month,
                trashed: tabMode === 'trash' ? 'true' : 'false',
                ordering: sortField ? (sortDirection === 'desc' ? `-${sortField}` : sortField) : '',
                ...(config.params || {}),
                ...customFilters,
            });
            // Clean empty params
            const toDelete = [];
            params.forEach((val, key) => { if (!val) toDelete.push(key); });
            toDelete.forEach(k => params.delete(k));

            const res = await apiFetch(`${config.api}?${params}`);
            if (res?.ok) {
                const data = await res.json();
                setItems(data.results || []);
                setTotal(data.count || 0);
            }
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [config.api, page, pageSize, search, year, month, tabMode, customFilters, sortField, sortDirection]);

    useEffect(() => {
        setSelected([]);
    }, [items, tabMode]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // PRE-FETCH API SELECT DROPDOWNS
    useEffect(() => {
        const fieldsToFetch = [...(config.fields || []), ...(config.filters || [])];
        fieldsToFetch.forEach(f => {
            if (f.type === 'api-select' && f.apiUrl && !apiCache[f.apiUrl]) {
                apiFetch(`${f.apiUrl}`)
                    .then(r => r.json())
                    .then(data => {
                        setApiCache(prev => ({ ...prev, [f.apiUrl]: data.results || data }));
                    });
            }
        });
    }, [config.fields]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleBulkOp = async (action) => {
        if (!selected.length) return;
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/bulk-operation/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    app_model: (() => {
                        if (config.moduleKey === 'surface_transport') {
                            return config.api.includes('registration') ? 'surface_transport.VehicleRegistration' : 'surface_transport.TransportConsumption';
                        } else if (config.moduleKey === 'air_transport') {
                            return config.api.includes('activity') ? 'air_transport.AircraftActivity' : 'air_transport.AviationFuelConsumption';
                        } else if (config.moduleKey === 'electricity_data') {
                            if (config.api.includes('generation-hourly')) return 'electricity.HourlyGenerationData';
                            if (config.api.includes('generation-daily')) return 'electricity.PlantGenerationDaily';
                            if (config.api.includes('generation')) return 'electricity.ElectricityGeneration';
                            if (config.api.includes('hydrology')) return 'electricity.HydrologyData';
                            if (config.api.includes('infra/transmission')) return 'electricity.TransmissionLineData';
                            if (config.api.includes('infra/distribution')) return 'electricity.DistributionLineData';
                            if (config.api.includes('infra/dist-transformer')) return 'electricity.DistributionTransformerData';
                            if (config.api.includes('sales')) return 'electricity.ElectricitySalesData';
                            if (config.api.includes('consumers')) return 'electricity.ElectricityConsumerData';
                            if (config.api.includes('consumption')) return 'electricity.ElectricityConsumption';
                            if (config.api.includes('trade/rea')) return 'electricity.ExportREAData';
                        }
                        return 'EnergyDataModel';
                    })(),
                    action,
                    ids: selected
                })
            });
            if (res.ok) {
                setToast({ message: `Successfully processed ${selected.length} records`, type: 'success' });
                setSelected([]);
                fetchData();
            } else {
                setToast({ message: 'Bulk operation failed', type: 'error' });
            }
        } catch {
            setToast({ message: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
        }
    };


        const handleRestore = async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`${config.api}${confirm.id}/?trashed=true`, {
                method: 'PATCH',
                body: JSON.stringify({ is_active: true })
            });
            if (res.ok) {
                setToast({ message: 'Record restored successfully', type: 'success' });
                fetchData();
            } else {
                setToast({ message: 'Failed to restore record', type: 'error' });
            }
        } catch {
            setToast({ message: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
            setConfirm(null);
        }
    };

    const handleDelete = async () => {
        setLoading(true);
        try {
            const hardQuery = tabMode === 'trash' ? '?hard=1&trashed=true' : '';
            const res = await apiFetch(`${config.api}${confirm.id}/${hardQuery}`, { method: 'DELETE' });
            if (res.ok) {
                setToast({ message: 'Record deleted successfully', type: 'success' });
                fetchData();
            } else {
                setToast({ message: 'Failed to delete record', type: 'error' });
            }
        } catch {
            setToast({ message: 'Network error', type: 'error' });
        } finally {
            setLoading(false);
            setConfirm(null);
        }
    };

    const handleTemplate = () => {
        const fields = config.templateHeaders || ['year', 'month', ...config.fields.map(f => f.key), 'remarks', 'data_source_code'];
        exportCSV([], fields, `${config.moduleKey}_template.csv`);
    };

    const handleApiFetch = async () => {
        if (!config.hasApi) return;
        setApiOpen(true);
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: config.title },
    ];

    if (!canView(moduleKey)) {
        return <div className="p-8 text-center text-slate-500">Access Denied</div>;
    }

    const content = (
        <div className="space-y-4">
            {/* ── Top-Level Workspace Tabs ──────────────── */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4 px-2">
                <button 
                    onClick={() => { setTabMode('active'); setPage(1); }} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${tabMode === 'active' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Active Records
                </button>
                <button 
                    onClick={() => { setTabMode('trash'); setPage(1); }} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${tabMode === 'trash' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Trash Bin
                </button>
                <button 
                    onClick={() => { setTabMode('jobs'); setPage(1); }} 
                    className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${tabMode === 'jobs' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    Jobs History
                </button>
            </div>

            {/* ── Action & Filter Bar (Electricity Style) ──────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                <div className="flex gap-1">
                    <button onClick={() => { setTabMode('active'); setPage(1); }} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${tabMode === 'active' ? 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-100' : 'text-slate-500 hover:text-slate-700'}`}>Active Records</button>
                </div>
                {selected.length > 0 && tabMode !== 'jobs' && (
                    <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                        <span className="text-xs font-bold text-slate-500 mr-2">{selected.length} selected</span>
                        {tabMode === 'trash' ? (
                            <>
                                <button onClick={() => handleBulkOp('restore')} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-bold transition-all"><RotateCcw className="h-3.5 w-3.5"/> Restore</button>
                                <button onClick={() => handleBulkOp('delete')} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all"><Trash2 className="h-3.5 w-3.5"/> Delete Forever</button>
                            </>
                        ) : (
                            <button onClick={() => handleBulkOp('delete')} className="flex items-center gap-1.5 h-8 px-3 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 text-xs font-bold transition-all"><Trash2 className="h-3.5 w-3.5"/> Move to Trash</button>
                        )}
                    </div>
                )}
            </div>

            {/* ── Import History Tab ──────────────────────────────── */}
            {tabMode === 'jobs' && (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <JobsTab moduleKey={moduleKey} endpoint={config.api} params={config.params} />
                </div>
            )}

            {/* ── Toolbar Area ─────────────────────────────────────────────────── */}
            {tabMode !== 'jobs' && <>
                <div className="flex flex-col gap-4 mb-4">
                    {/* Top Row: Title/Breadcrumbs/Stats & Actions */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Stats / Context */}
                        <div className="flex items-center gap-3">
                            {total !== undefined && (
                                <div className="px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-sm text-slate-500 dark:text-slate-400">
                                    <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> records
                                </div>
                            )}
                            <button onClick={fetchData} title="Refresh"
                                className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-primary-600 shadow-sm transition-all active:scale-95">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                        
                        {/* Primary Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {config.hasApi && (
                                <button onClick={handleApiFetch}
                                    className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-violet-200 dark:border-violet-700 bg-violet-50 dark:bg-violet-900/20 text-xs font-semibold text-violet-700 dark:text-violet-300 hover:bg-violet-100 dark:hover:bg-violet-900/40 transition-all shadow-sm">
                                    <Wifi className="h-3.5 w-3.5" /> API
                                </button>
                            )}
                            
                            <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm p-0.5">
                                <button onClick={handleTemplate} title="Download Template"
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                                    <FileText className="h-3.5 w-3.5" /> Template
                                </button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-0.5"></div>
                                <button onClick={() => setImportOpen(true)}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                                    <Upload className="h-3.5 w-3.5" /> Import
                                </button>
                                <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-0.5"></div>
                                <button onClick={() => setExportOpen(true)}
                                    className="flex items-center gap-1.5 h-8 px-3 rounded-md text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                                    <Download className="h-3.5 w-3.5" /> Export
                                </button>
                            </div>

                            <button onClick={() => setGridOpen(true)}
                                className="flex items-center gap-1.5 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-primary-300 hover:text-primary-600 shadow-sm transition-all">
                                <FileSpreadsheet className="h-3.5 w-3.5 text-primary-500" /> 
                                {selected.length > 0 ? `Quick Grid (Edit ${selected.length})` : 'Quick Grid'}
                            </button>

                            <button onClick={() => setModal({ mode: 'add' })}
                                className="flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all shadow-sm active:scale-95">
                                <Plus className="h-3.5 w-3.5" /> Add New
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Filters */}
                    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                        {/* Search */}
                        <div className="relative group min-w-[220px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search records..."
                                className="h-9 pl-9 pr-4 rounded-lg bg-white dark:bg-slate-800 border-none shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 transition-all w-full" />
                        </div>

                        {/* Date Filters */}
                        <div className="flex items-center gap-1.5">
                            <div className="relative">
                                <select value={year} onChange={e => setYear(e.target.value)}
                                    className="h-9 pl-3 pr-8 rounded-lg bg-white dark:bg-slate-800 border-none shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 outline-none min-w-[100px]">
                                    <option value="">All Years</option>
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                            <div className="relative">
                                <select value={month} onChange={e => setMonth(e.target.value)}
                                    className="h-9 pl-3 pr-8 rounded-lg bg-white dark:bg-slate-800 border-none shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 outline-none min-w-[120px]">
                                    <option value="">All Months</option>
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Custom Filters */}
                        {config.filters?.map(f => (
                            <div key={f.key} className="relative">
                                <select 
                                    value={customFilters[f.key] || ''} 
                                    onChange={e => { setCustomFilters(prev => ({ ...prev, [f.key]: e.target.value })); setPage(1); }}
                                    className="h-9 pl-3 pr-8 rounded-lg bg-white dark:bg-slate-800 border-none shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 outline-none max-w-[150px]">
                                    <option value="">{f.label}</option>
                                    {f.type === 'api-select' ? (
                                        (apiCache[f.apiUrl] || []).map(opt => (
                                            <option key={opt.id} value={opt[f.apiValue] || opt.id}>{opt[f.apiLabel] || opt.name}</option>
                                        ))
                                    ) : f.options ? (
                                        f.options.map(opt => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))
                                    ) : null}
                                </select>
                            </div>
                        ))}

                        <div className="flex-1" />
                        
                        {/* Page Size */}
                        <div className="relative">
                            <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
                                className="h-9 px-3 rounded-lg bg-white dark:bg-slate-800 border-none shadow-sm text-sm focus:ring-2 focus:ring-primary-500/20 outline-none font-medium text-slate-600 dark:text-slate-300">
                                <option value="20">20 / page</option>
                                <option value="50">50 / page</option>
                                <option value="100">100 / page</option>
                                <option value="500">500 / page</option>
                            </select>
                        </div>
                    </div>
                </div>

            {/* ── Table Area ─────────────────────────────────────────── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm border-collapse">
                            <thead>
                            <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                                <th className="px-4 py-3 w-10">
                                    <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                        checked={items.length > 0 && selected.length === items.length}
                                        onChange={e => setSelected(e.target.checked ? items.map(i => i.id) : [])}
                                    />
                                </th>
                                {!config.hideDateFields && <th className="px-4 py-3">Period</th>}
                                {config.columns.map(col => {
                                    const fieldKey = col.sortKey || col.key;
                                    const isSorted = sortField === fieldKey;
                                    return (
                                        <th 
                                            key={col.key} 
                                            className="px-4 py-3 cursor-pointer select-none hover:bg-slate-100/50 dark:hover:bg-slate-900/30 transition-colors" 
                                            style={{ width: col.width }}
                                            onClick={() => {
                                                setPage(1);
                                                if (sortField === fieldKey) {
                                                    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
                                                } else {
                                                    setSortField(fieldKey);
                                                    setSortDirection('asc');
                                                }
                                            }}
                                        >
                                            <div className="flex flex-center gap-1 items-center">
                                                {col.label}
                                                <span className="text-slate-400 text-[10px]">
                                                    {isSorted ? (sortDirection === 'asc' ? ' ▲' : ' ▼') : ' ↕'}
                                                </span>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                            {loading ? (
                                Array(pageSize).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={config.columns.length + 3} className="px-4 py-3">
                                            <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded w-full opacity-50" />
                                        </td>
                                    </tr>
                                ))
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={config.columns.length + 3} className="px-4 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-200 dark:text-slate-700">
                                                <Database className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-semibold text-slate-400">No records found matching filters.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                items.map((item, idx) => (
                                    <tr key={item.id} className={`hover:bg-primary-50/20 dark:hover:bg-primary-900/5 transition-colors group ${selected.includes(item.id) ? 'bg-primary-50/30 dark:bg-primary-900/10' : ''}`}>
                                        <td className="px-4 py-3">
                                            <input type="checkbox" className="rounded border-slate-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
                                                checked={selected.includes(item.id)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelected(p => [...p, item.id]);
                                                    else setSelected(p => p.filter(id => id !== item.id));
                                                }}
                                            />
                                        </td>
                                        {!config.hideDateFields && (
                                            <td className="px-4 py-3 whitespace-nowrap border-r border-slate-50 dark:border-slate-700/50">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                                        {item.year_val ?? item.year ?? '—'}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-tight mt-0.5">
                                                        {item.day ? `${String(item.day).padStart(2, '0')} ` : ''}
                                                        {MONTHS.find(m => m.value === (item.month_val ?? item.month))?.label || 'Annual'}
                                                    </span>
                                                </div>
                                            </td>
                                        )}
                                        {config.columns.map(col => (
                                            <td key={col.key} className="px-4 py-3">
                                                {col.render ? col.render(item) : (
                                                    <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[200px] block">
                                                        {item[col.key] || '—'}
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-right whitespace-nowrap">
                                            <div className="flex justify-end gap-1 px-1">
                                                {tabMode === 'active' && (
                                                    <>
                                                        <button onClick={() => setModal({ mode: 'edit', item })}
                                                            className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                                            <Edit3 className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => setConfirm({ type: 'delete', id: item.id })}
                                                            className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}

                                                                                                {tabMode === 'trash' && (
                                                    <>
                                                        <button onClick={() => setConfirm({ type: 'restore', id: item.id })}
                                                            title="Restore Record"
                                                            className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                                            <RefreshCw className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button onClick={() => setConfirm({ type: 'delete', id: item.id })}
                                                            title="Delete Forever"
                                                            className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </>
                                                )}

                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ── Pagination (Electricity Style) ──────────────── */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                    <p className="text-xs text-slate-500">
                        {Math.min((page - 1) * pageSize + 1, total)}–{Math.min(page * pageSize, total)} of {total}
                    </p>
                    <div className="flex items-center gap-1">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                            <ChevronLeft className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-xs text-slate-600 px-2 font-medium">{page} / {Math.ceil(total / pageSize) || 1}</span>
                        <button onClick={() => setPage(p => p + 1)} disabled={items.length < pageSize}
                            className="h-7 w-7 rounded flex items-center justify-center text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                            <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>
            </div>
            </>}

            {/* ── Modals & Overlays ─────────────────────────────── */}
            {modal && (
                <RecordModal
                    config={config}
                    mode={modal.mode}
                    item={modal.item}
                    apiCache={apiCache}
                    onClose={() => setModal(null)}
                    onSaved={(ev) => {
                        if (ev === 'created_keep_open') {
                            setToast({ message: `Record created successfully. You can add another one.`, type: 'success' });
                            fetchData();
                        } else {
                            setToast({ message: `Record ${ev} successfully`, type: 'success' });
                            setModal(null);
                            fetchData();
                        }
                    }}
                />
            )}

                        {confirm && confirm.type === 'delete' && (
                <ConfirmModal
                    title={tabMode === 'trash' ? "Delete Forever" : "Delete Record"}
                    message={tabMode === 'trash' 
                        ? "WARNING: You are about to permanently delete this record. This action cannot be undone. Are you absolutely sure?" 
                        : "Are you sure you want to delete this data record? It will be moved to the Trash Bin."}
                    confirmLabel="Delete"
                    confirmClass="bg-rose-500 hover:bg-rose-600"
                    onConfirm={handleDelete}
                    onCancel={() => setConfirm(null)}
                    loading={loading}
                />
            )}
            
            {confirm && confirm.type === 'restore' && (
                <ConfirmModal
                    title="Restore Record"
                    message="Are you sure you want to restore this record back to the active list?"
                    confirmLabel="Restore"
                    confirmClass="bg-emerald-500 hover:bg-emerald-600"
                    onConfirm={handleRestore}
                    onCancel={() => setConfirm(null)}
                    loading={loading}
                />
            )}

            {toast && <Toast {...toast} onDone={() => setToast(null)} />}

            {importOpen && (
                <GenericImportEngine
                    config={{
                        title: config.title || config.singular || 'Data',
                        api: config.api,
                        params: config.params,
                        templateHeaders: config.templateHeaders || ['year', 'month', ...config.fields.filter(f => !f.hidden).map(f => f.key), 'remarks'],
                        templateExample: config.templateExample || `2024,1,${config.fields.filter(f => !f.hidden).map(()=>'').join(',')},`,
                        fields: config.fields
                    }}
                    onClose={() => setImportOpen(false)}
                    onSuccess={(jobId) => {
                        setImportOpen(false);
                        fetchData();
                        setToast({ message: `Import triggered successfully (Job #${jobId})`, type: 'success' });
                    }}
                />
            )}

            {exportOpen && (
                <ExportModal
                    title={config.title}
                    config={config}
                    filters={{ search, year, month, ...customFilters }}
                    onClose={() => setExportOpen(false)}
                    onSuccess={(msg) => setToast({ message: msg, type: 'success' })}
                />
            )}

            {apiOpen && config.hasApi && (
                <GenericAPIFetch
                    title={config.title || config.singular || 'Data API'}
                    yearValue={year}
                    onClose={() => setApiOpen(false)}
                />
            )}

            {gridOpen && (
                <QuickEntryGrid
                    config={config}
                    apiCache={apiCache}
                    initialRows={items.filter(item => selected.includes(item.id))}
                    onClose={() => setGridOpen(false)}
                    onSaved={() => {
                        setToast({ message: 'Bulk records saved successfully', type: 'success' });
                        setGridOpen(false);
                        setSelected([]);
                        fetchData();
                    }}
                />
            )}
        </div>
    );

    if (standalone) {
        return (
            <DashboardLayout breadcrumb={breadcrumbs} title={config.title}>
                {!hideBanner && (
                    <DataCollectionBanner 
                        title={config.title}
                        description={config.description}
                        icon={config.icon}
                        parentTitle="Electricity Data"
                    />
                )}
                {content}
            </DashboardLayout>
        );
    }

    return content;
}

// ═══════════════════════════════════════════════════════════════════════════
// RECORD MODAL
// ═══════════════════════════════════════════════════════════════════════════

function RecordModal({ config, mode, item, apiCache, onClose, onSaved }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState(() => {
        if (isEdit) return { ...item };
        const init = { year: CURRENT_YEAR, month: new Date().getMonth() + 1 };
        config.fields.forEach(f => {
            if (f.default !== undefined) init[f.key] = f.default;
        });
        return init;
    });
    const [loading, setLoading] = useState(false);
    const [errors, setErrors]   = useState({});

    const set = (key, val) => {
        setForm(p => ({ ...p, [key]: val }));
        if (errors[key]) setErrors(p => { const n = { ...p }; delete n[key]; return n; });
    };

    const handleSave = async (addAnother = false) => {
        setLoading(true);
        try {
            const url = isEdit ? `${config.api}${item.id}/` : `${config.api}`;
            const res = await apiFetch(url, {
                method: isEdit ? 'PATCH' : 'POST',
                body: JSON.stringify(form),
            });
            if (res.ok) {
                if (addAnother && !isEdit) {
                    onSaved('created_keep_open');
                    const init = { year: new Date().getFullYear(), month: new Date().getMonth() + 1 };
                    config.fields.forEach(f => {
                        if (f.default !== undefined) init[f.key] = f.default;
                    });
                    setForm(init);
                    setErrors({});
                } else {
                    onSaved(isEdit ? 'updated' : 'created');
                }
            } else {
                const errData = await res.json();
                setErrors(errData);
            }
        } catch {
            setErrors({ _g: 'Network error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4
            bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl
                border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]
                animate-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-0.5">Data Record</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{isEdit ? 'Edit' : 'Add'} {config.singular}</h3>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="h-4.5 w-4.5" /></button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Common Fields: Year, Month */}
                    {!config.hideDateFields && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
                                <select value={form.year} onChange={e => set('year', Number(e.target.value))}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm">
                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                {errors.year && <p className="text-[10px] text-rose-500 mt-1">{errors.year}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Day</label>
                                <input type="number" min="1" max="31" value={form.day || ''} onChange={e => set('day', e.target.value ? Number(e.target.value) : null)}
                                    placeholder="Optional"
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm" />
                                {errors.day && <p className="text-[10px] text-rose-500 mt-1">{errors.day}</p>}
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month</label>
                                <select value={form.month || ''} onChange={e => set('month', e.target.value ? Number(e.target.value) : null)}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm">
                                    <option value="">Annual (None)</option>
                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                </select>
                                {errors.month && <p className="text-[10px] text-rose-500 mt-1">{errors.month}</p>}
                            </div>
                        </div>
                    )}

                    {errors.non_field_errors && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {errors.non_field_errors}
                        </div>
                    )}
                    {errors._g && (
                        <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm font-medium">
                            {errors._g}
                        </div>
                    )}

                    {/* Dynamic Fields */}
                    {config.fields.filter(f => !f.hidden).map(f => (
                        <div key={f.key} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{f.label}</label>
                            {f.type === 'api-select' ? (
                                <select value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm">
                                    <option value="">Select {f.label}...</option>
                                    {(apiCache[f.apiUrl] || []).map(opt => (
                                        <option key={opt.id} value={opt[f.apiValue] || opt.id}>{opt[f.apiLabel] || opt[`${f.key}_name`] || opt.name || opt.id}</option>
                                    ))}
                                </select>
                            ) : f.type === 'select' ? (
                                <select value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm">
                                    {f.options.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                            ) : f.type === 'textarea' ? (
                                <textarea value={form[f.key] || ''} onChange={e => set(f.key, e.target.value)}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm h-20" />
                            ) : (
                                <input type={f.type === 'number' ? 'number' : (f.type === 'date' || f.type === 'datetime-local') ? f.type : 'text'}
                                    step={f.type === 'number' ? "any" : undefined}
                                    value={form[f.key] || ''}
                                    onChange={e => set(f.key, f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                                    className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm" />
                            )}
                            {errors[f.key] && <p className="text-[10px] text-rose-500 mt-1">{errors[f.key]}</p>}
                        </div>
                    ))}

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Remarks</label>
                        <textarea value={form.remarks || ''} onChange={e => set('remarks', e.target.value)}
                            className="w-full rounded-xl px-4 py-2 bg-slate-50 border-slate-200 text-sm h-20 resize-none" />
                    </div>
                </div>

                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all">Cancel</button>
                    {!isEdit && (
                        <button onClick={() => handleSave(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white text-sm font-bold transition-all active:scale-95 disabled:opacity-50">
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Save & Add Another
                        </button>
                    )}
                    <button onClick={() => handleSave(false)} disabled={loading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}


// ═══════════════════════════════════════════════════════════════════════════
// QUICK ENTRY GRID (SPREADSHEET MODE)
// ═══════════════════════════════════════════════════════════════════════════

function QuickEntryGrid({ config, apiCache, onClose, onSaved, initialRows }) {
    const [rows, setRows] = useState(() => initialRows && initialRows.length > 0 ? initialRows.map(r => ({...r})) : [createEmptyRow()]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({}); // { rowIndex: { field: error } }

    function createEmptyRow() {
        const init = { year: CURRENT_YEAR, month: new Date().getMonth() + 1 };
        config.fields.forEach(f => {
            if (f.default !== undefined) init[f.key] = f.default;
        });
        return init;
    }

    const addRow = () => setRows(p => [...p, createEmptyRow()]);
    
    const updateRow = (idx, key, val) => {
        setRows(p => p.map((r, i) => i === idx ? { ...r, [key]: val } : r));
    };

    const handleSaveAll = async () => {
        setLoading(true);
        let successCount = 0;
        const newErrors = {};

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                const url = row.id ? `${config.api}${row.id}/` : `${config.api}`;
                const res = await apiFetch(url, {
                    method: row.id ? 'PATCH' : 'POST',
                    body: JSON.stringify(row),
                });
                if (res.ok) {
                    successCount++;
                } else {
                    newErrors[i] = await res.json();
                }
            } catch {
                newErrors[i] = { _g: 'Network error' };
            }
        }

        if (Object.keys(newErrors).length === 0) {
            onSaved();
        } else {
            const nextRows = [];
            const nextErrors = {};
            let newIdx = 0;
            for (let i = 0; i < rows.length; i++) {
                if (newErrors[i]) {
                    nextRows.push(rows[i]);
                    nextErrors[newIdx] = newErrors[i];
                    newIdx++;
                }
            }
            setRows(nextRows);
            setErrors(nextErrors);
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-6xl
                border border-white/10 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
                
                {/* Grid Header */}
                <div className="px-10 py-8 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/50 backdrop-blur-xl">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <div className="h-8 w-8 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                                <FileSpreadsheet className="h-4 w-4 text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                                Quick Grid Entry
                            </h3>
                        </div>
                        <p className="text-sm text-slate-400 font-medium">{config.title} · Bulk Input Mode</p>
                    </div>
                    <button onClick={onClose} className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white transition-all">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Grid Body */}
                <div className="flex-1 overflow-auto p-10 pt-4">
                    <table className="w-full border-separate border-spacing-y-2">
                        <thead>
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                <th className="px-4 py-2 text-left w-12">#</th>
                                {!config.hideDateFields && (
                                    <>
                                        <th className="px-4 py-2 text-left w-24">Year</th>
                                        <th className="px-4 py-2 text-left w-24">Month</th>
                                        <th className="px-4 py-2 text-left w-24">Day</th>
                                    </>
                                )}
                                {config.fields.filter(f => !f.hidden).map(f => (
                                    <th key={f.key} className="px-4 py-2 text-left">{f.label}</th>
                                ))}
                                <th className="px-4 py-2 text-left">Remarks</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                            {rows.map((row, idx) => (
                                <tbody key={idx}>
                                    <tr className="group animate-in slide-in-from-left-2" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <td className="px-4 py-2 text-xs font-mono text-slate-300 group-hover:text-primary-500 transition-colors">
                                        {idx + 1}
                                    </td>
                                    
                                    {/* Date Fields */}
                                    {!config.hideDateFields && (
                                        <>
                                            <td className="px-2 py-1">
                                                <select value={row.year} onChange={e => updateRow(idx, 'year', Number(e.target.value))}
                                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.year ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`}>
                                                    {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1">
                                                <select value={row.month || ''} onChange={e => updateRow(idx, 'month', e.target.value ? Number(e.target.value) : null)}
                                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.month ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`}>
                                                    <option value="">Annual</option>
                                                    {MONTHS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                                </select>
                                            </td>
                                            <td className="px-2 py-1">
                                                <input type="number" min="1" max="31" value={row.day || ''} placeholder="Day"
                                                    onChange={e => updateRow(idx, 'day', e.target.value ? Number(e.target.value) : null)}
                                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.day ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`} />
                                            </td>
                                        </>
                                    )}

                                    {/* Dynamic Fields */}
                                    {config.fields.filter(f => !f.hidden).map(f => (
                                        <td key={f.key} className="px-2 py-1">
                                            {f.type === 'api-select' ? (
                                                <select value={row[f.key] || ''} onChange={e => updateRow(idx, f.key, e.target.value)}
                                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.[f.key] ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`}>
                                                    <option value="">Select...</option>
                                                    {(apiCache[f.apiUrl] || []).map(opt => (
                                                        <option key={opt.id} value={opt.id}>{opt[f.apiLabel] || opt[`${f.key}_name`] || opt.name || opt.id}</option>
                                                    ))}
                                                </select>
                                            ) : f.type === 'select' ? (
                                                <select value={row[f.key] || ''} onChange={e => updateRow(idx, f.key, e.target.value)}
                                                    className={`w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.[f.key] ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`}>
                                                    <option value="">Select...</option>
                                                    {(f.options || []).map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input 
                                                    type={f.type === 'number' ? 'number' : (f.type === 'date' || f.type === 'datetime-local') ? f.type : 'text'}
                                                    step={f.type === 'number' ? 'any' : undefined}
                                                    value={row[f.key] || ''}
                                                    placeholder={f.label}
                                                    onChange={e => updateRow(idx, f.key, f.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
                                                    className={`w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm transition-all outline-none text-slate-700 dark:text-slate-200
                                                        ${errors[idx]?.[f.key] ? 'ring-2 ring-rose-500/20 !bg-rose-50/10' : ''}`}
                                                />
                                            )}
                                        </td>
                                    ))}

                                    <td className="px-2 py-1">
                                        <input type="text" value={row.remarks || ''} onChange={e => updateRow(idx, 'remarks', e.target.value)}
                                            className="w-full h-10 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary-500/20 text-sm outline-none text-slate-700 dark:text-slate-200"
                                            placeholder="Notes..." />
                                    </td>

                                    <td className="px-2 py-1">
                                        <button onClick={() => setRows(p => p.filter((_, i) => i !== idx))} 
                                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all opacity-0 group-hover:opacity-100">
                                            <XCircle className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                                {errors[idx]?.non_field_errors && (
                                    <tr>
                                        <td colSpan={100} className="px-4 pb-4 pt-1">
                                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-2 rounded-lg text-xs font-medium inline-flex items-center shadow-sm ml-8">
                                                ⚠️ {errors[idx].non_field_errors}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            ))}
                    </table>

                    <button onClick={addRow}
                        className="mt-6 flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/5 text-slate-400 hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all text-xs font-bold w-full justify-center">
                        <Plus className="h-4 w-4" /> Add Another Row
                    </button>
                </div>

                {/* Grid Footer */}
                <div className="px-10 py-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/80 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm text-slate-500">TAB</kbd>
                            Next Cell
                        </div>
                        <div className="flex items-center gap-1.5">
                            <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 shadow-sm text-slate-500">ENTER</kbd>
                            Save All
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="px-6 py-3 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                            Cancel
                        </button>
                        <button onClick={handleSaveAll} disabled={loading || rows.length === 0}
                            className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-black shadow-xl shadow-primary-500/20 transition-all active:scale-95 disabled:opacity-50">
                            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Submit {rows.length} Records
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
