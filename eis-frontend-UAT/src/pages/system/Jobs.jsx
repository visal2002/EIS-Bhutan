import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch, getUser } from '../../services/api';
import {
    RefreshCw, AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight,
    FileSpreadsheet, Clock, Loader2, XCircle, ChevronDown, ChevronUp,
    FileText, Rows3, AlertOctagon, CircleCheck, Eye, RotateCcw, Search,
    Filter, Download, PauseCircle, PlayCircle, StopCircle, Trash2
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';

const PAGE_SIZE = 20;
const ERROR_PAGE_SIZE = 50;

/* ── Status Config ──────────────────────────────────────────── */
const STATUS_CONFIG = {
    pending:    { label: 'Pending',     icon: Clock,        bg: 'bg-amber-50 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-700', dot: 'bg-amber-400' },
    processing: { label: 'Processing',  icon: Loader2,      bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-700 dark:text-blue-300',   border: 'border-blue-200 dark:border-blue-700',   dot: 'bg-blue-400' },
    paused:     { label: 'Paused',      icon: PauseCircle,  bg: 'bg-purple-50 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-700', dot: 'bg-purple-400' },
    stopped:    { label: 'Stopped',     icon: StopCircle,   bg: 'bg-slate-100 dark:bg-slate-800',   text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600', dot: 'bg-slate-400' },
    completed:  { label: 'Completed',   icon: CheckCircle2, bg: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-400' },
    failed:     { label: 'Failed',      icon: XCircle,      bg: 'bg-rose-50 dark:bg-rose-900/20',   text: 'text-rose-700 dark:text-rose-300',   border: 'border-rose-200 dark:border-rose-700',   dot: 'bg-rose-400' },
};

function StatusBadge({ status }) {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const Icon = cfg.icon;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
            <Icon className={`h-3 w-3 ${status === 'processing' ? 'animate-spin' : ''}`} />
            {cfg.label}
        </span>
    );
}

/* ── Stat Card ──────────────────────────────────────────────── */
function StatCard({ icon: Icon, label, value, color = 'slate', sub }) {
    const colors = {
        slate:   'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400',
        blue:    'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
        emerald: 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400',
        rose:    'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400',
        amber:   'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400',
    };
    return (
        <div className={`rounded-2xl border border-slate-200 dark:border-slate-700 p-4 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 opacity-70" />
                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">{label}</span>
            </div>
            <p className="text-2xl font-black">{value}</p>
            {sub && <p className="text-[10px] mt-0.5 opacity-60">{sub}</p>}
        </div>
    );
}

/* ── Error Inspector Panel ──────────────────────────────────── */
function ErrorInspector({ job, onRetrySuccess }) {
    const [errors, setErrors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [retrying, setRetrying] = useState(false);
    const [search, setSearch] = useState('');

    const fetchErrors = useCallback(async () => {
        setLoading(true);
        try {
            const res = await apiFetch(`/admin/import-errors/?job_id=${job.id}&page=${page}&page_size=${ERROR_PAGE_SIZE}`);
            if (res.ok) {
                const data = await res.json();
                setErrors(data.results || []);
                setTotal(data.count || 0);
            }
        } finally {
            setLoading(false);
        }
    }, [job.id, page]);

    useEffect(() => { fetchErrors(); }, [fetchErrors]);

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
                    rows: errors.map(e => ({ id: e.id, raw_data: e.raw_data }))
                })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.remaining === 0) {
                    onRetrySuccess?.();
                }
                fetchErrors();
            }
        } finally {
            setRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading error details...
            </div>
        );
    }

    if (errors.length === 0) {
        return (
            <div className="p-8 text-center">
                <CircleCheck className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 dark:text-slate-100">All Errors Resolved!</h3>
                <p className="text-xs text-slate-500 mt-1">All rows have been imported successfully.</p>
            </div>
        );
    }

    const allHeaders = Object.keys(errors[0]?.raw_data || {}).filter(k => k !== '_row');
    const filtered = search
        ? errors.filter(e => {
            const msg = JSON.stringify(e.error_message).toLowerCase();
            const raw = JSON.stringify(e.raw_data).toLowerCase();
            return msg.includes(search.toLowerCase()) || raw.includes(search.toLowerCase());
        })
        : errors;
    const totalPages = Math.ceil(total / ERROR_PAGE_SIZE) || 1;

    return (
        <div className="space-y-4">
            {/* Error toolbar */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search errors..."
                            className="pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-primary-500 outline-none w-56"
                        />
                    </div>
                    <span className="text-xs text-slate-500">{total} total errors</span>
                </div>
                <button
                    onClick={handleRetryAll}
                    disabled={retrying}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                    {retrying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                    Retry All on This Page
                </button>
            </div>

            {/* Error table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
                <table className="w-full text-left text-sm border-collapse">
                    <thead>
                        <tr className="bg-rose-50/50 dark:bg-rose-900/10 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                            <th className="px-4 py-3 whitespace-nowrap">Row #</th>
                            {allHeaders.map(h => <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>)}
                            <th className="px-4 py-3 whitespace-nowrap min-w-[200px]">Error</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
                        {filtered.map(errObj => {
                            const errs = errObj.error_message || {};
                            const errorFields = Object.keys(errs).filter(k => k !== '_error');
                            const msg = errs._error || Object.entries(errs).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' • ');
                            return (
                                <tr key={errObj.id} className="hover:bg-rose-50/30 dark:hover:bg-rose-900/10 transition-colors">
                                    <td className="px-4 py-3 text-xs text-slate-400 font-mono whitespace-nowrap">#{errObj.row_index}</td>
                                    {allHeaders.map(h => {
                                        const hasError = errorFields.includes(h);
                                        return (
                                            <td key={h} className="px-2 py-2">
                                                <input
                                                    type="text"
                                                    value={errObj.raw_data[h] ?? ''}
                                                    onChange={e => updateCell(errObj.id, h, e.target.value)}
                                                    className={`w-full min-w-[100px] px-2.5 py-1.5 text-xs bg-transparent border rounded-lg focus:ring-2 focus:ring-primary-500 outline-none transition-all
                                                        ${hasError
                                                            ? 'border-rose-300 dark:border-rose-600 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300'
                                                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'}`}
                                                    title={hasError ? (Array.isArray(errs[h]) ? errs[h].join(', ') : errs[h]) : ''}
                                                />
                                                {hasError && (
                                                    <p className="text-[9px] text-rose-500 mt-0.5 px-1 truncate max-w-[150px]">
                                                        {Array.isArray(errs[h]) ? errs[h].join(', ') : errs[h]}
                                                    </p>
                                                )}
                                            </td>
                                        );
                                    })}
                                    <td className="px-4 py-3">
                                        <span className="inline-block px-2 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-700 rounded-lg text-[10px] font-bold max-w-[250px] truncate" title={msg}>
                                            {msg}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                    <p className="text-xs text-slate-500">
                        Showing {Math.min((page - 1) * ERROR_PAGE_SIZE + 1, total)}–{Math.min(page * ERROR_PAGE_SIZE, total)} of {total} errors
                    </p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 px-2">{page} / {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── Confirm Delete Modal ──────────────────────────────────── */
function ConfirmDeleteModal({ job, onConfirm, onCancel }) {
    const [deleting, setDeleting] = useState(false);

    const handleConfirm = async () => {
        setDeleting(true);
        await onConfirm();
        setDeleting(false);
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onCancel}>
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="p-6 pb-4 text-center">
                    <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-4">
                        <AlertTriangle className="h-7 w-7 text-rose-500" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                        {job.type === 'import' ? 'Delete Import Job?' : 'Delete Export Job?'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                        You are about to permanently delete <span className="font-bold text-slate-700 dark:text-slate-200">Job #{job.id}</span>
                        {job.type === 'import' ? (
                            job.original_filename && <> — <span className="font-semibold">{job.original_filename}</span></>
                        ) : (
                            <> — <span className="font-semibold">Data Export</span></>
                        )}.
                    </p>
                </div>

                {/* Warning Box */}
                <div className="mx-6 p-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-200 dark:border-amber-700/50 rounded-xl">
                    <div className="flex gap-2">
                        <AlertOctagon className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                            <p className="font-bold mb-0.5">What will be removed:</p>
                            <ul className="list-disc list-inside space-y-0.5 text-amber-600 dark:text-amber-400">
                                <li>The job record and all its error logs</li>
                                <li>Error resolution history for this job</li>
                            </ul>
                            <p className="mt-1.5 font-semibold text-emerald-700 dark:text-emerald-400">✓ Imported data will NOT be affected.</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 p-6 pt-5">
                    <button
                        onClick={onCancel}
                        disabled={deleting}
                        className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={deleting}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 border border-rose-700 transition-colors disabled:opacity-60"
                    >
                        {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        {deleting ? 'Deleting...' : 'Delete Job'}
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── Expanded Job Detail ────────────────────────────────────── */
function JobDetail({ job, onRefresh }) {
    const pct = job.total_rows > 0 ? Math.round((job.processed_rows / job.total_rows) * 100) : 0;
    const successRows = job.processed_rows - job.error_count;
    const duration = job.updated_at && job.created_at
        ? Math.round((new Date(job.updated_at) - new Date(job.created_at)) / 1000)
        : null;
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const formatDuration = (secs) => {
        if (!secs || secs < 0) return '—';
        if (secs < 60) return `${secs}s`;
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}m ${s}s`;
    };

    const user = getUser();
    const isAuthorized = user && (user.is_superuser || (user.role && user.role.role_name === 'ADMIN') || job.created_by === user.id);

    const handleAction = async (action) => {
        if (action === 'delete') {
            setShowDeleteConfirm(true);
            return;
        }
        try {
            const endpoint = job.type === 'import' ? `/admin/import-jobs/${job.id}/${action}/` : `/admin/export-jobs/${job.id}/${action}/`;
            const res = await apiFetch(endpoint, { method: 'POST' });
            if (res.ok) onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    const executeDelete = async () => {
        try {
            const endpoint = job.type === 'import' ? `/admin/import-jobs/${job.id}/` : `/admin/export-jobs/${job.id}/`;
            const res = await apiFetch(endpoint, { method: 'DELETE' });
            if (res.ok) {
                setShowDeleteConfirm(false);
                onRefresh();
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
    <>
        <div className="bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-200 dark:border-slate-700">
            {/* Stats Grid */}
            <div className="p-5 space-y-5">
                <div className={`grid grid-cols-2 ${job.type === 'export' ? 'sm:grid-cols-3' : 'sm:grid-cols-4'} gap-3`}>
                    <StatCard icon={Rows3} label="Total Rows" value={job.total_rows.toLocaleString()} color="slate" />
                    {job.type !== 'export' && (
                        <>
                            <StatCard icon={CircleCheck} label="Successful" value={Math.max(0, successRows).toLocaleString()} color="emerald" sub={`${job.total_rows > 0 ? Math.round((successRows / job.total_rows) * 100) : 0}% success rate`} />
                            <StatCard icon={AlertOctagon} label="Errors" value={job.error_count.toLocaleString()} color={job.error_count > 0 ? 'rose' : 'slate'} sub={job.error_count > 0 ? 'Click to inspect & fix' : 'No errors'} />
                        </>
                    )}
                    {job.type === 'export' && job.status === 'completed' && job.file && (
                        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-700 p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                            <div className="flex items-center gap-2 mb-1">
                                <Download className="h-4 w-4 opacity-70" />
                                <span className="text-[10px] uppercase tracking-wider font-bold opacity-70">Export Complete</span>
                            </div>
                            <a href={job.file} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 mt-1 text-sm font-bold underline hover:text-emerald-700">
                                Download Excel/CSV
                            </a>
                        </div>
                    )}
                    <StatCard icon={Clock} label="Duration" value={formatDuration(duration)} color="blue" sub={job.status === 'processing' ? 'Still processing...' : `Finished ${new Date(job.updated_at).toLocaleTimeString()}`} />
                </div>

                {/* Progress Bar (always show) */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Progress</span>
                        <span className="font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                    </div>
                    <div className="w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        {job.type !== 'export' && job.error_count > 0 && job.total_rows > 0 ? (
                            <div className="h-full flex">
                                <div
                                    className="h-full bg-emerald-500 transition-all duration-700"
                                    style={{ width: `${(successRows / job.total_rows) * 100}%` }}
                                />
                                <div
                                    className="h-full bg-rose-400 transition-all duration-700"
                                    style={{ width: `${(job.error_count / job.total_rows) * 100}%` }}
                                />
                            </div>
                        ) : (
                            <div
                                className={`h-full transition-all duration-700 ${job.status === 'processing' ? 'bg-blue-500 animate-pulse' : job.status === 'completed' ? 'bg-emerald-500' : job.status === 'failed' ? 'bg-rose-500' : 'bg-slate-400'}`}
                                style={{ width: `${Math.max(2, pct)}%` }}
                            />
                        )}
                    </div>
                    {job.type !== 'export' && job.error_count > 0 && job.total_rows > 0 && (
                        <div className="flex items-center gap-4 text-[10px] text-slate-500">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Successful ({Math.max(0, successRows).toLocaleString()})</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Errors ({job.error_count.toLocaleString()})</span>
                            {job.status === 'processing' && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-300 inline-block" /> Remaining</span>}
                        </div>
                    )}
                </div>

                {/* Job Meta & Actions */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2">
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">File Name</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 truncate">{job.type === 'import' ? (job.original_filename || '—') : 'Data Export'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Module</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{job.module_name?.split('.').pop() || '—'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Started</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(job.created_at).toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Last Updated</p>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{new Date(job.updated_at).toLocaleString()}</p>
                        </div>
                    </div>
                    {isAuthorized && (
                        <div className="flex items-center gap-2 border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-slate-700 pt-3 sm:pt-0 sm:pl-4">
                            {job.status === 'processing' && (
                                <button onClick={() => handleAction('pause')} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-xs font-bold transition-colors">
                                    <PauseCircle className="h-4 w-4" /> Pause
                                </button>
                            )}
                            {job.status === 'paused' && (
                                <button onClick={() => handleAction('resume')} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
                                    <PlayCircle className="h-4 w-4" /> Resume
                                </button>
                            )}
                            {['processing', 'paused', 'pending'].includes(job.status) && (
                                <button onClick={() => handleAction('stop')} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-xs font-bold transition-colors">
                                    <StopCircle className="h-4 w-4" /> Stop
                                </button>
                            )}
                            {['stopped', 'failed', 'processing'].includes(job.status) && (
                                <button onClick={() => handleAction('retry')} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors">
                                    <RefreshCw className="h-4 w-4" /> Retry
                                </button>
                            )}
                            <button onClick={() => handleAction('delete')} className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold transition-colors ml-auto sm:ml-0">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Inspector */}
                {job.type !== 'export' && job.error_count > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            Error Inspector — {job.error_count} rows need attention
                        </h4>
                        <ErrorInspector job={job} onRetrySuccess={onRefresh} />
                    </div>
                )}

                {/* Success message */}
                {job.status === 'completed' && (job.type === 'export' || job.error_count === 0) && (
                    <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-700/50 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                                {job.type === 'import' ? 'Import completed successfully!' : 'Export completed successfully!'}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {job.type === 'import' 
                                    ? `All ${job.total_rows.toLocaleString()} rows were imported without any errors.`
                                    : `All ${job.total_rows.toLocaleString()} rows were exported successfully.`}
                            </p>
                        </div>
                    </div>
                )}

                {/* Failed message */}
                {job.status === 'failed' && (
                    <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/15 border border-rose-200 dark:border-rose-700/50 rounded-xl">
                        <XCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                                {job.type === 'import' ? 'Import failed' : 'Export failed'}
                            </p>
                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">
                                {job.type === 'import' 
                                    ? 'This job encountered a critical error and could not complete. Please check the error details above or try re-importing the file.'
                                    : 'This export job encountered a critical error and could not complete.'}
                            </p>
                        </div>
                    </div>
                )}

                {/* Processing message */}
                {job.status === 'processing' && (
                    <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/15 border border-blue-200 dark:border-blue-700/50 rounded-xl">
                        <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 animate-spin" />
                        <div>
                            <p className="text-sm font-bold text-blue-700 dark:text-blue-300">
                                {job.type === 'import' ? 'Import in progress...' : 'Export in progress...'}
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                                Processing row {job.processed_rows.toLocaleString()} of {job.total_rows.toLocaleString()}. This page auto-refreshes every 5 seconds.
                            </p>
                        </div>
                    </div>
                )}
                
                {/* Paused message */}
                {job.status === 'paused' && (
                    <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-900/15 border border-purple-200 dark:border-purple-700/50 rounded-xl">
                        <PauseCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-purple-700 dark:text-purple-300">
                                {job.type === 'import' ? 'Import paused' : 'Export paused'}
                            </p>
                            <p className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
                                Processing has been paused at row {job.processed_rows.toLocaleString()}. You can resume it at any time.
                            </p>
                        </div>
                    </div>
                )}

                {/* Stopped message */}
                {job.status === 'stopped' && (
                    <div className="flex items-center gap-3 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl">
                        <StopCircle className="h-5 w-5 text-slate-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                {job.type === 'import' ? 'Import stopped' : 'Export stopped'}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                                This job was manually stopped after processing {job.processed_rows.toLocaleString()} rows.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <ConfirmDeleteModal
                job={job}
                onConfirm={executeDelete}
                onCancel={() => setShowDeleteConfirm(false)}
            />
        )}
    </>
    );
}

/* ── Main Jobs Page ─────────────────────────────────────────── */
export default function Jobs() {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [expandedId, setExpandedId] = useState(null);
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchParams] = useSearchParams();
    const moduleName = searchParams.get('module_name');

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const moduleQuery = moduleName ? `&module_name=${moduleName}` : '';
            const [importRes, exportRes] = await Promise.all([
                apiFetch(`/admin/import-jobs/?page_size=500${moduleQuery}`),
                apiFetch(`/admin/export-jobs/?page_size=500${moduleQuery}`)
            ]);
            
            let allJobs = [];
            if (importRes.ok) {
                const data = await importRes.json();
                allJobs = allJobs.concat((data.results || []).map(j => ({ ...j, type: 'import' })));
            }
            if (exportRes.ok) {
                const data = await exportRes.json();
                allJobs = allJobs.concat((data.results || []).map(j => ({ ...j, type: 'export' })));
            }
            
            allJobs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            setJobs(allJobs);
            setTotal(allJobs.length);
        } catch (err) {
            console.error('Fetch error:', err);
        } finally {
            setLoading(false);
        }
    }, [moduleName]);

    useEffect(() => {
        fetchJobs();
        const interval = setInterval(() => {
            setJobs(prev => {
                if (prev.some(j => j.status === 'processing' || j.status === 'pending' || j.status === 'paused')) {
                    fetchJobs();
                }
                return prev;
            });
        }, 5000);
        return () => clearInterval(interval);
    }, [fetchJobs]);

    // Summary counts
    const counts = {
        all:        jobs.length,
        pending:    jobs.filter(j => j.status === 'pending').length,
        processing: jobs.filter(j => j.status === 'processing').length,
        completed:  jobs.filter(j => j.status === 'completed').length,
        failed:     jobs.filter(j => j.status === 'failed').length,
    };
    const filtered = statusFilter === 'all' ? jobs : jobs.filter(j => j.status === statusFilter);
    const startIndex = (page - 1) * PAGE_SIZE;
    const paginatedJobs = filtered.slice(startIndex, startIndex + PAGE_SIZE);

    return (
        <DashboardLayout title={moduleName ? `System Jobs: ${moduleName.split('.').pop()}` : "System Jobs"}>
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-900/30 rounded-xl text-blue-600 dark:text-blue-400">
                                <FileSpreadsheet className="w-6 h-6" />
                            </div>
                            System Jobs
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Monitor background tasks. Click any job to see full details, progress breakdown, and error inspector.
                        </p>
                    </div>
                    <button onClick={fetchJobs} disabled={loading}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-600">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary-500' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                        { key: 'all',        label: 'Total Jobs',  icon: FileText,     color: 'slate' },
                        { key: 'pending',    label: 'Pending',     icon: Clock,        color: 'amber' },
                        { key: 'processing', label: 'Processing',  icon: Loader2,      color: 'blue' },
                        { key: 'completed',  label: 'Completed',   icon: CheckCircle2, color: 'emerald' },
                        { key: 'failed',     label: 'Failed',      icon: XCircle,      color: 'rose' },
                    ].map(s => (
                        <button
                            key={s.key}
                            onClick={() => setStatusFilter(s.key)}
                            className={`text-left rounded-2xl border p-4 transition-all ${
                                statusFilter === s.key
                                    ? 'ring-2 ring-primary-500 border-primary-300 dark:border-primary-600'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                            } bg-white dark:bg-slate-800`}
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <s.icon className={`h-4 w-4 ${STATUS_CONFIG[s.key]?.text || 'text-slate-500'} ${s.key === 'processing' && counts.processing > 0 ? 'animate-spin' : ''}`} />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">{s.label}</span>
                            </div>
                            <p className="text-2xl font-black text-slate-800 dark:text-slate-100">{counts[s.key]}</p>
                        </button>
                    ))}
                </div>

                {/* Jobs List */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                                    <th className="px-5 py-4 w-8"></th>
                                    <th className="px-5 py-4">Job</th>
                                    <th className="px-5 py-4">Module</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Progress</th>
                                    <th className="px-5 py-4">Errors</th>
                                    <th className="px-5 py-4">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {loading && jobs.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto mb-2" />
                                            <p className="text-slate-500 text-sm">Loading jobs...</p>
                                        </td>
                                    </tr>
                                ) : filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan="7" className="px-6 py-12 text-center">
                                            <FileSpreadsheet className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                            <p className="text-slate-500 text-sm font-semibold">No {statusFilter !== 'all' ? statusFilter : ''} jobs found.</p>
                                            {statusFilter !== 'all' && (
                                                <button onClick={() => setStatusFilter('all')} className="text-xs text-primary-600 hover:text-primary-700 font-bold mt-2">
                                                    Show all jobs
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : paginatedJobs.map(job => {
                                    const isExpanded = expandedId === `${job.type}-${job.id}`;
                                    const pct = job.total_rows > 0 ? Math.round((job.processed_rows / job.total_rows) * 100) : 0;
                                    return (
                                        <React.Fragment key={`${job.type}-${job.id}`}>
                                            <tr
                                                onClick={() => setExpandedId(isExpanded ? null : `${job.type}-${job.id}`)}
                                                className={`cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50 dark:bg-slate-900/50' : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'}`}
                                            >
                                                <td className="px-5 py-4">
                                                    {isExpanded
                                                        ? <ChevronUp className="h-4 w-4 text-slate-400" />
                                                        : <ChevronDown className="h-4 w-4 text-slate-400" />}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-slate-800 dark:text-slate-200">#{job.id}</span>
                                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border ${
                                                            job.type === 'import' 
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' 
                                                                : 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/20 dark:text-fuchsia-300 dark:border-fuchsia-800'
                                                        }`}>
                                                            {job.type}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-slate-400 font-normal mt-0.5 truncate max-w-[180px]">
                                                        {job.type === 'import' ? (job.original_filename || 'Data Import') : 'Data Export'}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                                                        {job.module_name?.split('.').pop() || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <StatusBadge status={job.status} />
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex flex-col gap-1.5 min-w-[160px]">
                                                        <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                                                            <span>{job.processed_rows.toLocaleString()} / {job.total_rows.toLocaleString()}</span>
                                                            <span className="font-bold">{pct}%</span>
                                                        </div>
                                                        <div className="w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full transition-all duration-500 rounded-full ${
                                                                    job.status === 'completed' ? 'bg-emerald-500' :
                                                                    job.status === 'processing' ? 'bg-blue-500' :
                                                                    job.status === 'failed' ? 'bg-rose-500' :
                                                                    'bg-slate-400'
                                                                }`}
                                                                style={{ width: `${Math.max(2, pct)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4">
                                                    {job.error_count > 0 ? (
                                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-200 dark:border-rose-700">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {job.error_count.toLocaleString()}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                                    {new Date(job.created_at).toLocaleDateString()}
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(job.created_at).toLocaleTimeString()}</div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filtered.length > 0 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
                            <p className="text-xs text-slate-500">
                                Showing {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} jobs
                            </p>
                            <div className="flex items-center gap-2">
                                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 px-2">{page} / {Math.ceil(filtered.length / PAGE_SIZE) || 1}</span>
                                <button onClick={() => setPage(p => p + 1)} disabled={page >= Math.ceil(filtered.length / PAGE_SIZE)}
                                    className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal for Expanded Job Details */}
            {expandedId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-primary-500" />
                                Job Details #{expandedId.split('-')[1]}
                            </h2>
                            <button onClick={() => setExpandedId(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                                <XCircle className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 dark:bg-slate-900/30">
                            <JobDetail 
                                job={jobs.find(j => `${j.type}-${j.id}` === expandedId)} 
                                onRefresh={() => { setExpandedId(null); fetchJobs(); }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
