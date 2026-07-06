// src/pages/admin/master-data/MasterDataEngine.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Search, Plus, Edit3, Trash2, X, Save, RefreshCw,
    AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, ArrowRight,
    Upload, Download, AlertCircle, CheckCheck, XCircle, List, GitBranch,
    Database, ChevronDown, Filter, FileText, FileSpreadsheet,
    ToggleLeft, ToggleRight, Sparkles, ExternalLink,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { apiFetch } from '../../../services/api';
import { generateCode } from '../../../utils/string';
import { cn } from '../../../utils/cn';
import ExportModal from '../data-collection/ExportModal';
import * as XLSX from 'xlsx';


// ── Shared input style ───────────────────────────────────────────
export const inputCls = [
    'h-9 w-full rounded-xl border border-slate-200 dark:border-slate-600',
    'bg-white dark:bg-slate-700/60',
    'px-3 text-sm text-slate-700 dark:text-slate-200',
    'focus:border-primary-400 focus:ring-2 focus:ring-primary-500/20',
    'outline-none transition-all placeholder:text-slate-400',
].join(' ');

// ── Exported sub-components ──────────────────────────────────────

export function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full
            text-[10px] font-semibold uppercase tracking-wider
            ${active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                : 'bg-slate-100 text-slate-400 border border-slate-200 dark:bg-slate-700 dark:text-slate-500 dark:border-slate-600'
            }`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

export function Toast({ message, type = 'success', onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className="fixed bottom-8 right-8 z-[200] flex items-center gap-3 px-5 py-3.5
            bg-slate-900 dark:bg-slate-800 text-white rounded-2xl shadow-2xl
            border border-white/10 animate-in slide-in-from-right duration-300">
            {type === 'success'
                ? <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                : <AlertCircle  className="h-5 w-5 text-rose-400 flex-shrink-0" />}
            <span className="text-sm font-semibold">{message}</span>
        </div>
    );
}

export function ConfirmModal({ title, message, onConfirm, onCancel, loading, confirmLabel, confirmClass }) {
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4
            bg-slate-900/30 dark:bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-8
                border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                <div className="h-12 w-12 rounded-2xl bg-rose-50 dark:bg-rose-900/30
                    text-rose-500 dark:text-rose-400 flex items-center justify-center mb-6">
                    <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 h-10 rounded-xl text-sm font-bold text-white transition-all active:scale-95 ${confirmClass || 'bg-rose-600 hover:bg-rose-700'}`}>
                        {loading ? <RefreshCw className="h-4 w-4 animate-spin mx-auto" /> : (confirmLabel || 'Confirm')}
                    </button>
                    <button onClick={onCancel}
                        className="flex-1 h-10 rounded-xl border border-slate-200 dark:border-slate-600
                            text-sm font-bold text-slate-600 dark:text-slate-300
                            hover:bg-slate-50 dark:hover:bg-slate-700 transition-all active:scale-95">
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Row Status Badge (Simple) ───────────────────────────────────
function RowStatus({ status }) {
    if (status === 'error') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                font-bold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="h-2.5 w-2.5" />
                Error
            </span>
        );
    }
    if (status === 'ready') {
        return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]
                font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="h-2.5 w-2.5" />
                Ready
            </span>
        );
    }
    return null;
}

// ── Shared: CSV parser ──────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 1) return null;

    const parseRow = (line) => {
        const vals = [];
        let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') { inQ = !inQ; continue; }
            if (ch === ',' && !inQ) { vals.push(cur.trim()); cur = ''; continue; }
            cur += ch;
        }
        vals.push(cur.trim());
        return vals;
    };

    const headers = parseRow(lines[0]).map(h => h.trim().replace(/"/g, ''));
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#') || line.trim() === '') continue;
        const vals = parseRow(line);
        const row  = {};
        headers.forEach((h, j) => { row[h] = vals[j] ?? ''; });
        row._row = i + 1;
        rows.push(row);
    }
    return { headers, rows };
}

// ── Shared: Validate a row ────────────────────────
function validateRow(row, fields) {
    const errors = {};
    fields.forEach(f => {
        const v = String(row[f.key] ?? '').trim();
        if (f.required && !v) {
            if (!f.autoCode && f.key !== 'transformer_code' && f.key !== 'substation_code') {
                errors[f.key] = `${f.label || f.key} is required`;
            }
        } else if (f.type === 'number' && v && isNaN(Number(v))) {
            errors[f.key] = 'Must be a number';
        } else if (f.type === 'integer' && v && !/^\d+$/.test(v)) {
            errors[f.key] = 'Must be a whole number';
        }
    });
    return errors;
}

export function FieldWrap({ label, children, error, hint, required }) {
    return (
        <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400
                uppercase tracking-wider pl-0.5">
                {label}
                {required && <span className="text-rose-500 ml-1 font-black">*</span>}
            </label>
            {children}
            {error && <p className="text-[11px] text-rose-500 font-medium pl-0.5">{error}</p>}
            {hint && !error && <p className="text-[11px] text-slate-400 font-medium pl-0.5 italic">{hint}</p>}
        </div>
    );
}

// ── Import Modal ─────────────────────────────────────────────────
export function ImportModal({ title, config, onClose, onImported }) {
    const [phase,     setPhase]    = useState('select');  // select|mapping|preview|uploading|done
    const [file,      setFile]     = useState(null);
    const [parsed,    setParsed]   = useState(null);      // { headers, rows }
    const [mapping,   setMapping]  = useState({});        // { fieldKey: csvHeader }
    const [csvHeaders,setCsvHeaders] = useState([]);       // headers in uploaded file
    const [reviewed,  setReviewed] = useState([]);        // preview rows
    const [mode,      setMode]     = useState('create_only');
    const [progress,  setProgress] = useState(0);
    const [result,    setResult]   = useState(null);      // { success, failed, errors }
    const [error,     setError]    = useState('');
    const [showAll,   setShowAll]  = useState(false);
    const fileRef = useRef(null);

    const PREVIEW_LIMIT = 500;
    const readyCount = reviewed.filter(r => r._status === 'ready').length;
    const errorCount = reviewed.filter(r => r._status === 'error').length;
    const totalRows  = parsed?.rows.length ?? 0;

    const handleFile = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setError('');
        setFile(f);

        try {
            let p;
            if (f.name.toLowerCase().endsWith('.json')) {
                const text = await f.text();
                const data = JSON.parse(text);
                const rows = Array.isArray(data) ? data : (data.results || [data]);
                p = { headers: rows.length > 0 ? Object.keys(rows[0]) : [], rows: rows.map((r, i) => ({ ...r, _row: i + 1 })) };
            } else if (f.name.toLowerCase().endsWith('.xls') || f.name.toLowerCase().endsWith('.xlsx')) {
                const buffer = await f.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
                p = {
                    headers: json.length > 0 ? Object.keys(json[0]) : [],
                    rows: json.map((r, i) => ({ ...r, _row: i + 1 }))
                };
            } else {
                const text = await f.text();
                p = parseCSV(text);
            }

            if (!p || p.rows.length === 0) {
                setError('File has no data rows.');
                return;
            }

            setParsed(p);
            setCsvHeaders(p.headers);

            // Auto-mapping logic
            const initialMap = {};
            (config.fields || []).forEach(fld => {
                const normFld = fld.key.toLowerCase().replace(/[\s-_]/g, '');
                const normLbl = (fld.label || '').toLowerCase().replace(/[\s-_]/g, '');
                const match = p.headers.find(h => {
                    const nh = h.toLowerCase().replace(/[\s-_]/g, '');
                    return nh === normFld || nh.includes(normFld) || normFld.includes(nh) ||
                           (normLbl.length > 2 && (nh.includes(normLbl) || normLbl.includes(nh)));
                });
                initialMap[fld.key] = match || '';
            });
            setMapping(initialMap);
            setPhase('mapping');
        } catch (err) {
            setError(`Failed to parse file: ${err.message}`);
        }
    };

    const generatePreview = () => {
        const missing = (config.fields || [])
            .filter(f => f.required)
            .filter(f => !mapping[f.key])
            .filter(f => !f.autoCode && f.key !== 'transformer_code' && f.key !== 'substation_code');

        if (missing.length > 0) {
            setError(`Please map the following required fields: ${missing.map(f => f.label || f.key).join(', ')}`);
            return;
        }

        setError('');

        const preview = parsed.rows.slice(0, PREVIEW_LIMIT).map(row => {
            const mappedRow = {};
            (config.fields || []).forEach(fld => {
                const csvCol = mapping[fld.key];
                mappedRow[fld.key] = csvCol ? row[csvCol] : null;
            });

            const errs = validateRow(mappedRow, config.fields || []);
            const status = Object.keys(errs).length > 0 ? 'error' : 'ready';
            return { ...mappedRow, _row: row._row, _status: status, _errors: errs };
        });

        setReviewed(preview);
        setPhase('preview');
    };

    const handleExecute = async () => {
        if (!file) return;
        setPhase('uploading');
        setProgress(0);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('header_mapping', JSON.stringify(mapping));

        try {
            let interval = setInterval(() => {
                setProgress(prev => (prev >= 90 ? prev : prev + 10));
            }, 200);

            const res = await apiFetch(`${config.api}bulk-import/`, {
                method: 'POST',
                body: formData
            });
            clearInterval(interval);
            setProgress(100);

            const data = await res.json();
            if (res.ok) {
                const mappedErrors = (data.errors || []).map(e => ({
                    row: e.row,
                    data: e.data,
                    error: typeof e.errors === 'object' ? Object.entries(e.errors).map(([k, v]) => `${k}: ${v}`).join('; ') : String(e.errors)
                }));
                setResult({
                    success: data.created + data.updated,
                    failed: data.failed,
                    errors: mappedErrors
                });
                setPhase('done');
                if (data.created + data.updated > 0) onImported();
            } else {
                setError(data.detail || 'Failed to import data.');
                setPhase('preview');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
            setPhase('preview');
        }
    };

    const downloadTemplate = () => {
        const headers = config.fields.map(f => f.key);
        const csv = [headers.join(','), '# Delete this row before importing'].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${config.singular.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
        a.click();
    };

    const downloadFailed = () => {
        if (!result?.errors?.length) return;
        const headers = [...config.fields.map(f => f.key), 'error'];
        const csvRows = result.errors.map(e => {
            const vals = config.fields.map(f => {
                const v = String(e.data[f.key] ?? '');
                return v.includes(',') ? `"${v.replace(/"/g, '""')}"` : v;
            });
            const msg = String(e.error);
            vals.push(msg.includes(',') ? `"${msg.replace(/"/g, '""')}"` : msg);
            return vals.join(',');
        });
        const csv = [headers.join(','), ...csvRows].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `failed-${config.singular.toLowerCase().replace(/\s+/g, '-')}-rows.csv`;
        a.click();
    };

    const displayRows = showAll ? reviewed : reviewed.slice(0, 15);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4
            bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={cn("w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 animate-in zoom-in-95", phase === 'preview' ? 'max-w-5xl h-[90vh]' : 'max-w-2xl')}>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6
                    border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30
                            flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                            <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Import {title}
                            </h2>
                            {phase === 'preview' ? (
                                <p className="text-xs text-slate-400 mt-0.5 font-medium">
                                    {totalRows.toLocaleString()} rows detected · {errorCount} errors · {readyCount} ready
                                </p>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={cn("text-xs font-semibold", phase === 'select' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>Select File</span>
                                    <ChevronRight className="h-3 w-3 text-slate-300" />
                                    <span className={cn("text-xs font-semibold", phase === 'mapping' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400')}>Map Columns</span>
                                    <ChevronRight className="h-3 w-3 text-slate-300" />
                                    <span className="text-xs font-semibold text-slate-400">Preview</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="h-10 w-10 rounded-2xl flex items-center justify-center
                            bg-slate-50 dark:bg-slate-700 text-slate-400
                            hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 transition-all">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 p-8 bg-slate-50/50 dark:bg-slate-900/20">
                    {/* ── PHASE: select ── */}
                    {phase === 'select' && (
                        <div className="space-y-6 max-w-xl mx-auto">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm">
                                    Upload a CSV, JSON, or Excel file. Download the template below to see the default headers.
                                </p>
                                <button onClick={downloadTemplate}
                                    className="flex-shrink-0 flex items-center gap-2 h-9 px-4 rounded-xl
                                        bg-slate-100 dark:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300
                                        hover:bg-slate-200 transition-all border border-slate-200 dark:border-white/5">
                                    <Download className="h-3.5 w-3.5" /> Template
                                </button>
                            </div>

                            <div
                                onClick={() => fileRef.current?.click()}
                                className="border-3 border-dashed border-slate-200 dark:border-slate-700
                                    rounded-3xl py-12 text-center cursor-pointer
                                    hover:border-indigo-400 hover:bg-indigo-50/30
                                    dark:hover:bg-indigo-900/10 transition-all group">
                                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-700/50 rounded-2xl
                                    flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet className="h-8 w-8 text-slate-300 dark:text-slate-600 group-hover:text-indigo-400" />
                                </div>
                                <p className="text-base font-bold text-slate-700 dark:text-slate-200">
                                    Click to choose or drag & drop
                                </p>
                                <p className="text-sm text-slate-400 mt-1 font-medium">CSV, JSON, and Excel files supported</p>
                                <input ref={fileRef} type="file" accept=".csv,.json,.xlsx,.xls"
                                    onChange={handleFile} className="hidden" />
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-900/20
                                    rounded-2xl border border-rose-100 dark:border-rose-900/30">
                                    <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0" />
                                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PHASE: mapping ── */}
                    {phase === 'mapping' && (
                        <div className="space-y-6 max-w-2xl mx-auto">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Match your uploaded columns to the required system fields.</p>
                            
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                                            <th className="px-5 py-3 text-left w-1/2">System Field</th>
                                            <th className="px-5 py-3 text-left w-1/2">Your Column</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {(config.fields || []).map(fld => {
                                            const isOptional = !fld.required;
                                            const isMapped = !!mapping[fld.key];
                                            return (
                                                <tr key={fld.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            {isMapped ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                            ) : isOptional ? (
                                                                <CheckCircle2 className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                                            ) : (
                                                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                            )}
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                                                                {fld.label || fld.key}
                                                                {!isOptional && <span className="text-rose-500 ml-1 font-black">*</span>}
                                                            </span>
                                                            {isOptional ? (
                                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Optional</span>
                                                            ) : (
                                                                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Required</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <select
                                                            className={cn("w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 outline-none transition-colors appearance-none font-medium",
                                                                isMapped 
                                                                    ? 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200' 
                                                                    : (isOptional ? 'border-slate-200 bg-slate-50 text-slate-500 focus:ring-slate-500/20' : 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-500/20')
                                                            )}
                                                            value={mapping[fld.key] || ''}
                                                            onChange={e => setMapping(prev => ({ ...prev, [fld.key]: e.target.value }))}
                                                        >
                                                            <option value="">-- Ignore / Do not map --</option>
                                                            {csvHeaders.map(ch => (
                                                                <option key={ch} value={ch}>{ch}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {error && (
                                <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PHASE: preview ── */}
                    {phase === 'preview' && (
                        <div className="space-y-6">
                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { label: 'Total Rows', val: totalRows.toLocaleString(), color: 'text-slate-700 dark:text-slate-200' },
                                    { label: 'Ready',      val: readyCount.toLocaleString(), color: 'text-emerald-600' },
                                    { label: 'Errors',     val: errorCount.toLocaleString(), color: errorCount > 0 ? 'text-rose-600' : 'text-slate-400' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 dark:bg-slate-700/40
                                        rounded-2xl p-4 text-center border border-slate-100 dark:border-slate-700">
                                        <p className={`text-2xl font-black ${s.color}`}>{s.val}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Mode toggle */}
                            <div className="flex gap-4 p-1 bg-slate-100 dark:bg-slate-700 rounded-2xl">
                                {[
                                    { val: 'create_only',    label: 'Create records only',     desc: 'Duplicates will be skipped' },
                                    { val: 'create_and_update', label: 'Create or Update', desc: 'Checks ID for updates' },
                                ].map(opt => (
                                    <button key={opt.val}
                                        onClick={() => setMode(opt.val)}
                                        className={`flex-1 text-left px-5 py-4 rounded-xl transition-all
                                            ${mode === opt.val
                                                ? 'bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none'
                                                : 'hover:bg-white/50 text-slate-400'}`}>
                                        <p className={`text-sm font-bold ${mode === opt.val ? 'text-slate-800 dark:text-slate-100' : ''}`}>
                                            {opt.label}
                                        </p>
                                        <p className="text-[10px] font-medium mt-0.5 opacity-80">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>

                            {/* Preview table */}
                            <div>
                                <div className="flex items-center justify-between mb-3 px-1">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                                        Data Preview
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-inner">
                                    <div className="overflow-x-auto max-h-64">
                                        <table className="w-full text-xs text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Row</th>
                                                    <th className="px-4 py-3 font-bold text-slate-500">Status</th>
                                                    {config.fields.map(f => (
                                                        <th key={f.key} className="px-4 py-3 font-bold text-slate-500 whitespace-nowrap">{f.label || f.key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                                {displayRows.map((r, i) => (
                                                    <tr key={i} className={cn("hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", r._status === 'error' && 'bg-rose-50/30')}>
                                                        <td className="px-4 py-2 text-slate-400 font-mono font-bold">{r._row}</td>
                                                        <td className="px-4 py-2">
                                                            <RowStatus status={r._status} />
                                                        </td>
                                                        {config.fields.map(f => (
                                                            <td key={f.key} className="px-4 py-2">
                                                                <span className={r._errors?.[f.key] ? 'text-rose-600 font-bold' : 'text-slate-600 dark:text-slate-300'}>
                                                                    {r[f.key] || <span className="opacity-30">null</span>}
                                                                </span>
                                                                {r._errors?.[f.key] && (
                                                                    <div className="text-[10px] text-rose-400 font-medium leading-tight">
                                                                        {r._errors[f.key]}
                                                                    </div>
                                                                )}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: uploading ── */}
                    {phase === 'uploading' && (
                        <div className="py-12 space-y-8 text-center">
                            <div className="flex justify-center">
                                <div className="relative h-24 w-24">
                                    <div className="absolute inset-0 rounded-full border-4
                                        border-indigo-100 dark:border-indigo-900/40" />
                                    <div className="absolute inset-0 rounded-full border-4
                                        border-transparent border-t-indigo-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="h-16 w-16 rounded-full bg-indigo-50 dark:bg-indigo-900/30
                                            flex items-center justify-center shadow-inner">
                                            <Database className="h-8 w-8 text-indigo-500" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="max-w-xs mx-auto space-y-4">
                                <div className="flex items-center justify-between text-sm font-black text-slate-800 dark:text-slate-100">
                                    <span>Syncing with database…</span>
                                    <span className="text-indigo-600">{progress}%</span>
                                </div>
                                <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                    <div className="h-full bg-indigo-500 rounded-full transition-all duration-300 ease-out shadow-lg"
                                        style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Please do not close this window</p>
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: done ── */}
                    {phase === 'done' && result && (
                        <div className="space-y-8 py-4">
                            <div className="text-center space-y-2">
                                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30
                                    rounded-3xl flex items-center justify-center mx-auto mb-4 border border-emerald-200 shadow-lg">
                                    <CheckCheck className="h-8 w-8 text-emerald-600" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100">Import Complete!</h3>
                                <p className="text-sm font-medium text-slate-400">Database synchronization finished.</p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: 'Imported',  val: result.success, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                    { label: 'Failed',    val: result.failed,  color: result.failed > 0 ? 'text-rose-600' : 'text-slate-300', bg: 'bg-rose-50/50 dark:bg-rose-900/10' },
                                ].map(s => (
                                    <div key={s.label} className={`${s.bg} rounded-3xl p-6 text-center border border-white/10`}>
                                        <p className={`text-4xl font-black ${s.color}`}>{s.val}</p>
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-2">{s.label}</p>
                                    </div>
                                ))}
                            </div>

                            {result.failed > 0 && (
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between px-1">
                                        <p className="text-sm font-bold text-rose-600">Export Errors</p>
                                        <button onClick={downloadFailed}
                                            className="flex items-center gap-2 text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors">
                                            <Download className="h-4 w-4" /> Download Failed Rows
                                        </button>
                                    </div>
                                    <div className="rounded-2xl border border-rose-100 dark:border-rose-900/30 overflow-hidden">
                                        <div className="overflow-y-auto max-h-40 bg-rose-50/30">
                                            <table className="w-full text-xs">
                                                <thead className="bg-rose-100/50 dark:bg-rose-900/40 sticky top-0">
                                                    <tr>
                                                        <th className="px-4 py-2 font-bold text-rose-700">Row</th>
                                                        <th className="px-4 py-2 font-bold text-rose-700">Database Error</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-rose-100/50">
                                                    {result.errors.slice(0, 50).map((e, i) => (
                                                        <tr key={i}>
                                                            <td className="px-4 py-1.5 font-mono font-bold text-rose-600">{e.row}</td>
                                                            <td className="px-4 py-1.5 text-rose-600/80 font-medium">{e.error}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-700
                    bg-slate-50/50 dark:bg-slate-800/80 flex items-center justify-end gap-4">
                    <button onClick={onClose}
                        className="h-11 px-6 rounded-2xl text-sm font-bold text-slate-600
                            hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all">
                        {phase === 'done' ? 'Close' : 'Cancel'}
                    </button>
                    {phase === 'mapping' && (
                        <button onClick={generatePreview}
                            className="h-11 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700
                                text-white text-sm font-black shadow-lg shadow-indigo-200
                                dark:shadow-none transition-all active:scale-95 flex items-center gap-2">
                            Generate Preview <ArrowRight className="h-4 w-4" />
                        </button>
                    )}
                    {phase === 'preview' && (
                        <button onClick={handleExecute}
                            disabled={readyCount === 0}
                            className="h-11 px-8 rounded-2xl bg-indigo-600 hover:bg-indigo-700
                                text-white text-sm font-black shadow-lg shadow-indigo-200
                                dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                            Start Import ({readyCount.toLocaleString()} rows)
                        </button>
                    )}
                    {phase === 'done' && (
                        <button onClick={onClose}
                            className="h-11 px-8 rounded-2xl bg-slate-900 text-white
                                text-sm font-black hover:bg-black transition-all active:scale-95">
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export function MasterModal({ show, title, onClose, children, footer }) {
    if (!show) return null;
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4
            bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg
                border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]
                animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700
                    flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest
                            text-primary-600 dark:text-primary-400 mb-0.5">Master Data</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h3>
                    </div>
                    <button onClick={onClose}
                        className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700
                            hover:bg-slate-200 dark:hover:bg-slate-600
                            flex items-center justify-center text-slate-500 dark:text-slate-400
                            transition-all active:scale-90">
                        <X className="h-4.5 w-4.5" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">{children}</div>
                {footer && (
                    <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700
                        bg-slate-50/60 dark:bg-slate-900/40 flex justify-end gap-3 rounded-b-2xl">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Tree builder ─────────────────────────────────────────────────
export function buildTree(items, parentKey = 'parent_id') {
    if (!items || !Array.isArray(items)) return [];
    const map = {};
    items.forEach(i => { 
        if (i && i.id) {
            map[i.id] = { ...i, children: [] }; 
        }
    });
    const roots = [];
    items.forEach(i => {
        if (!i) return;
        const pVal = i[parentKey];
        const pId  = (typeof pVal === 'object' && pVal !== null) ? pVal.id : pVal;
        if (pId && map[pId]) map[pId].children.push(map[i.id]);
        else roots.push(map[i.id]);
    });
    return roots;
}

/**
 * Builds a flat list from a tree for select items, with indentation
 */
export function buildFlatTree(items, parentKey = 'parent_id', labelKey = 'name', depth = 0) {
    const tree = buildTree(items, parentKey);
    const flat = [];
    const traverse = (nodes, d) => {
        nodes.forEach(node => {
            flat.push({
                ...node,
                displayName: (d > 0 ? '\u00A0\u00A0'.repeat(d) + '└─ ' : '') + node[labelKey]
            });
            if (node.children?.length > 0) traverse(node.children, d + 1);
        });
    };
    traverse(tree, 0);
    return flat;
}

// ── Main Engine ──────────────────────────────────────────────────
export function MasterDataEngine({ config }) {
    const [items,      setItems]      = useState([]);
    const [loading,    setLoading]    = useState(true);
    const [search,     setSearch]     = useState('');
    const [filter,     setFilter]     = useState('all');
    const [page,       setPage]       = useState(1);
    const pageSize = 100;
    const [total,      setTotal]      = useState(0);
    const [stats,      setStats]      = useState({ total: 0, active: 0 });
    const [modal,      setModal]      = useState(null);
    const [confirm,    setConfirm]    = useState(null);
    const [toast,      setToast]      = useState(null);
    const [apiCache,   setApiCache]   = useState({});
    const [viewMode,    setViewMode]    = useState(config.isTree ? 'hierarchy' : 'table');
    const [expandedIds, setExpandedIds]  = useState(new Set());
    const [importOpen,  setImportOpen]   = useState(false);
    const [exportOpen,  setExportOpen]   = useState(false);

    // accent colour from config, fallback to primary
    const accent = config.accent || '#059669';

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const isHierarchy = viewMode === 'hierarchy' && !search;
            const params = new URLSearchParams({
                search,
                page: isHierarchy ? 1 : page,
                page_size: isHierarchy ? 500 : pageSize,
            });
            if (filter === 'active')   params.append('is_active', 'true');
            if (filter === 'inactive') params.append('is_active', 'false');

            const res = await apiFetch(`${config.api}?${params}`);
            if (res && res.ok) {
                const data = await res.json();
                setItems(data.results || data || []);
                setTotal(data.count || (Array.isArray(data) ? data.length : 0));
                if (data.stats) setStats(data.stats);
            } else {
                console.warn(`MasterDataEngine: API error ${res?.status} on ${config.api}`);
                setItems([]);
            }
        } catch (e) {
            console.error('MasterDataEngine Load Error:', e);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [config.api, search, filter, page, viewMode]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        config.fields.filter(f => f.type === 'api-select').forEach(async f => {
            if (apiCache[f.apiUrl]) return;
            try {
                const res  = await apiFetch(f.apiUrl);
                const data = await res.json();
                setApiCache(p => ({ ...p, [f.apiUrl]: Array.isArray(data) ? data : (data.results || []) }));
            } catch {}
        });
    }, [config.fields]);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const handleTemplate = () => {
        const headers = config.fields.map(f => f.key);
        const csv = [headers.join(','), '# Delete this row before importing'].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${config.singular.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
        a.click();
    };

    const handleSave = async (formData) => {
        const isEdit = !!modal.item?.id;
        const res = await apiFetch(
            isEdit ? `${config.api}${modal.item.id}/` : config.api,
            { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(formData) }
        );
        if (res.ok) { showToast(`${config.singular} saved`); setModal(null); load(); }
        else return await res.json();
    };

    const handleToggleStatus = async (item) => {
        const next = !item.is_active;
        const res = await apiFetch(`${config.api}${item.id}/`, {
            method: 'PATCH',
            body: JSON.stringify({ is_active: next })
        });
        if (res.ok) {
            showToast(next ? 'Record activated' : 'Record deactivated');
            load();
        } else {
            showToast('Update failed', 'error');
        }
    };

    const handleDelete = (item) => {
        // If active, ask to deactivate first
        if (item.is_active) {
            setConfirm({
                title:   `Deactivate "${item[config.nameKey]}"?`,
                message: 'Active records should be deactivated before deletion to prevent data inconsistencies.',
                confirmLabel: 'Deactivate Now',
                confirmClass: 'bg-amber-600 hover:bg-amber-700',
                onConfirm: async () => {
                    await handleToggleStatus(item);
                    setConfirm(null);
                }
            });
            return;
        }

        // Only hard delete if inactive
        setConfirm({
            title:   `Delete "${item[config.nameKey]}"?`,
            message: 'This record is currently INACTIVE. Deleting it will permanently remove it and all associated references.',
            confirmLabel: 'Permanently Delete',
            confirmClass: 'bg-rose-600 hover:bg-rose-700',
            onConfirm: async () => {
                const res = await apiFetch(`${config.api}${item.id}/?hard=1`, { method: 'DELETE' });
                if (res.ok || res.status === 204) { showToast('Record deleted'); load(); setConfirm(null); }
                else {
                    const data = await res.json().catch(() => ({}));
                    showToast(data.detail || 'Delete failed', 'error');
                    setConfirm(null);
                }
            }
        });
    };

    const toggleId = id => {
        setExpandedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id); else next.add(id);
            return next;
        });
    };

    // ── Cell renderer ──────────────────────────────────────────
    const Cell = ({ col, item }) => {
        if (col.render) return col.render(item);
        const val = item[col.key];
        switch (col.type) {
            case 'status': return <StatusBadge active={item.is_active} />;
            case 'code':   return (
                <span className="font-mono text-[11px] font-semibold
                    bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                    px-2 py-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    {val || '—'}
                </span>
            );
            case 'badge': return (
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border
                    ${col.badgeMap?.[val] || 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'}`}>
                    {val || '—'}
                </span>
            );
            default: return (
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{val ?? '—'}</span>
            );
        }
    };

    // ── Tree row ───────────────────────────────────────────────
    const TreeRow = ({ node, depth = 0 }) => {
        const hasChildren = node.children?.length > 0;
        const isOpen      = expandedIds.has(node.id);
        return (
            <>
                <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    {config.columns.map((col, idx) => (
                        <td key={col.key}
                            className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700
                                text-sm text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-2"
                                style={idx === 0 ? { paddingLeft: `${depth * 24}px` } : {}}>
                                {idx === 0 && (
                                    <button
                                        onClick={() => toggleId(node.id)}
                                        disabled={!hasChildren}
                                        className={`h-6 w-6 rounded-lg flex items-center justify-center
                                            transition-all flex-shrink-0
                                            ${hasChildren
                                                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
                                                : 'opacity-0 pointer-events-none'}`}>
                                        {isOpen
                                            ? <ChevronDown className="h-3.5 w-3.5" />
                                            : <ChevronRight className="h-3.5 w-3.5" />}
                                    </button>
                                )}
                                <Cell col={col} item={node} />
                            </div>
                        </td>
                    ))}
                    <td className="px-6 py-3.5 border-b border-slate-100 dark:border-slate-700 text-right">
                        <div className="flex items-center justify-end gap-1.5
                            opacity-0 group-hover:opacity-100 transition-opacity">
                            {depth < 3 && config.isTree && (
                                <button
                                    onClick={() => setModal({ mode: 'create', item: { [config.parentKey]: node.id } })}
                                    title="Add child"
                                    className="h-8 w-8 rounded-lg flex items-center justify-center
                                        text-slate-400 hover:text-white transition-all"
                                    style={{ background: `${accent}20` }}
                                    onMouseEnter={e => e.currentTarget.style.background = accent}
                                    onMouseLeave={e => e.currentTarget.style.background = `${accent}20`}>
                                    <Plus className="h-3.5 w-3.5" />
                                </button>
                            )}
                            <button onClick={() => setModal({ mode: 'edit', item: node })}
                                title="Edit"
                                className="h-8 w-8 rounded-lg flex items-center justify-center
                                    text-slate-400 hover:text-slate-700 hover:bg-slate-100
                                    dark:hover:bg-slate-600 dark:hover:text-slate-200 transition-all">
                                <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button onClick={() => handleToggleStatus(node)}
                                title={node.is_active ? 'Deactivate' : 'Activate'}
                                className={cn(
                                    'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                                    node.is_active
                                        ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                        : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                )}>
                                {node.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                            </button>
                            <button onClick={() => handleDelete(node)}
                                title={node.is_active ? 'Soft Delete' : 'Hard Delete'}
                                className={cn(
                                    'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                                    node.is_active
                                        ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                                        : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40'
                                )}>
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </td>
                </tr>
                {isOpen && hasChildren && node.children.map(child =>
                    <TreeRow key={child.id} node={child} depth={depth + 1} />
                )}
            </>
        );
    };

    const treeData = (viewMode === 'hierarchy' && !search)
        ? buildTree(items, config.parentKey || 'parent_id')
        : [];

    const breadcrumbs = config.breadcrumbs || [
        { label: 'Administration',  href: '/admin/dashboard' },
        { label: 'Master Data',      href: '/admin/master-data' },
        { label: config.title },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title={config.title}>
            <div className="space-y-6">

                {/* ── Hero banner (matches MasterDataIndex theme) ── */}
                <div className="relative rounded-3xl overflow-hidden"
                    style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' }}>

                    {/* Radial glows */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                            backgroundImage: `
                                radial-gradient(circle at 20% 50%, #4ade80 0%, transparent 50%),
                                radial-gradient(circle at 80% 20%, #34d399 0%, transparent 40%),
                                radial-gradient(circle at 60% 80%, #6ee7b7 0%, transparent 30%)`,
                        }} />
                    {/* Grid lines */}
                    <div className="absolute inset-0 opacity-5 pointer-events-none"
                        style={{
                            backgroundImage: `
                                linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
                            backgroundSize: '40px 40px',
                        }} />

                    <div className="relative px-8 py-8 flex flex-col lg:flex-row lg:items-center gap-6">
                        {/* Left — title */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="h-11 w-11 rounded-2xl bg-white/10 border border-white/20
                                    flex items-center justify-center backdrop-blur-sm flex-shrink-0">
                                    {config.icon
                                        ? <config.icon className="h-5 w-5 text-emerald-300" />
                                        : <Database className="h-5 w-5 text-emerald-300" />}
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-[.2em]
                                        text-emerald-400/80">Reference Tables</p>
                                    <h1 className="text-2xl font-bold text-white leading-tight">
                                        {config.title}
                                    </h1>
                                </div>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed max-w-lg">
                                {config.description || 'Manage reference data for the EIS data collection system.'}
                            </p>
                        </div>

                        {/* Right — stats + Add button */}
                        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
                            {[
                                { label: 'Total',  val: total },
                                { label: 'Active', val: stats.active || items.filter(i => i.is_active).length },
                            ].map(s => (
                                <div key={s.label}
                                    className="rounded-2xl bg-white/8 border border-white/12
                                        backdrop-blur-sm px-5 py-3.5 text-center min-w-[72px]">
                                    <p className="text-2xl font-extrabold text-white leading-none">{s.val}</p>
                                    <p className="text-[10px] text-white/50 font-medium
                                        uppercase tracking-widest mt-1">{s.label}</p>
                                </div>
                            ))}
                            <button
                                onClick={() => setModal({ mode: 'create', item: null })}
                                className="flex items-center gap-2 px-5 py-3 rounded-2xl
                                    bg-white text-slate-900 text-sm font-bold
                                    hover:bg-emerald-50 transition-all shadow-lg
                                    hover:scale-105 active:scale-95">
                                <Plus className="h-4 w-4" />
                                Add {config.singular}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Toolbar ──────────────────────────────────────── */}
                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[180px] max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder={`Search ${config.title.toLowerCase()}…`}
                            className={`${inputCls} pl-8 pr-8`} />
                        {search && (
                            <button onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2
                                    text-slate-400 hover:text-slate-600">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Status filter */}
                    <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1">
                        {['all', 'active', 'inactive'].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold
                                    uppercase tracking-wider transition-all
                                    ${filter === f
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Tree / Flat toggle */}
                    {config.isTree && (
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-xl p-1">
                            <button onClick={() => setViewMode('hierarchy')}
                                title="Hierarchy view"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                    text-[11px] font-bold uppercase tracking-wider transition-all
                                    ${viewMode === 'hierarchy'
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400'}`}>
                                <GitBranch className="h-3.5 w-3.5" /> Tree
                            </button>
                            <button onClick={() => setViewMode('table')}
                                title="Flat list"
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                                    text-[11px] font-bold uppercase tracking-wider transition-all
                                    ${viewMode === 'table'
                                        ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400'}`}>
                                <List className="h-3.5 w-3.5" /> List
                            </button>
                        </div>
                    )}

                    {/* Refresh */}
                    <button onClick={load} title="Refresh"
                        className="h-9 w-9 flex items-center justify-center rounded-xl
                            border border-slate-200 dark:border-slate-600
                            bg-white dark:bg-slate-700/60
                            text-slate-400 hover:text-slate-700 dark:hover:text-slate-200
                            hover:border-slate-300 dark:hover:border-slate-500 transition-all">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Item count */}
                    {!loading && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 hidden sm:block">
                            <span className="font-semibold text-slate-600 dark:text-slate-300">{total}</span> records
                            {search && <span className="ml-1">(filtered)</span>}
                        </p>
                    )}

                    <div className="flex-1" />

                    {/* Template | Import | Export Cohesive Group */}
                    <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-0.5">
                        <button onClick={handleTemplate} title="Download Template"
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-all">
                            <FileText className="h-3.5 w-3.5" /> Template
                        </button>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-0.5"></div>
                        <button onClick={() => setImportOpen(true)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all">
                            <Upload className="h-3.5 w-3.5" /> Import
                        </button>
                        <div className="w-px bg-slate-200 dark:bg-slate-700 my-1 mx-0.5"></div>
                        <button onClick={() => setExportOpen(true)}
                            className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                            <Download className="h-3.5 w-3.5" /> Export
                        </button>
                    </div>
                </div>

                {/* ── Data table ───────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl
                    border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

                    {/* Accent top strip using config colour */}
                    <div className="h-1 w-full"
                        style={{ background: `linear-gradient(90deg, ${accent}60, ${accent}15)` }} />

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead>
                                <tr>
                                    {config.columns.map((col, idx) => (
                                        <th key={col.key}
                                            className={`px-6 py-4 text-[10px] font-bold text-slate-400
                                                dark:text-slate-500 uppercase tracking-[.15em]
                                                bg-slate-50/80 dark:bg-slate-900/40
                                                border-b border-slate-100 dark:border-slate-700
                                                sticky top-0 z-10 whitespace-nowrap
                                                ${idx === 0 ? '' : ''}`}>
                                            {col.label}
                                        </th>
                                    ))}
                                    <th className="px-6 py-4 text-[10px] font-bold text-slate-400
                                        dark:text-slate-500 uppercase tracking-[.15em]
                                        bg-slate-50/80 dark:bg-slate-900/40
                                        border-b border-slate-100 dark:border-slate-700
                                        sticky top-0 z-10 text-right whitespace-nowrap">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && items.length === 0 ? (
                                    <tr>
                                        <td colSpan={config.columns.length + 1}
                                            className="px-6 py-16 text-center text-slate-400
                                                dark:text-slate-500 text-sm">
                                            <div className="flex flex-col items-center gap-3">
                                                <RefreshCw className="h-6 w-6 animate-spin text-slate-300" />
                                                Loading…
                                            </div>
                                        </td>
                                    </tr>
                                ) : items.length === 0 ? (
                                    <tr>
                                        <td colSpan={config.columns.length + 1}
                                            className="px-6 py-16 text-center text-slate-400
                                                dark:text-slate-500 text-sm">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="h-12 w-12 rounded-2xl
                                                    bg-slate-100 dark:bg-slate-700
                                                    flex items-center justify-center">
                                                    <Database className="h-6 w-6 text-slate-300 dark:text-slate-500" />
                                                </div>
                                                {search ? `No records match "${search}"` : 'No records yet'}
                                            </div>
                                        </td>
                                    </tr>
                                ) : viewMode === 'hierarchy' && !search ? (
                                    treeData.map(node => <TreeRow key={node.id} node={node} />)
                                ) : (
                                    items.map(item => (
                                        <tr key={item.id}
                                            className="group hover:bg-slate-50 dark:hover:bg-slate-700/30
                                                transition-colors">
                                            {config.columns.map(col => (
                                                <td key={col.key}
                                                    className="px-6 py-3.5 border-b
                                                        border-slate-100 dark:border-slate-700">
                                                    <Cell col={col} item={item} />
                                                </td>
                                            ))}
                                            <td className="px-6 py-3.5 border-b
                                                border-slate-100 dark:border-slate-700 text-right">
                                                <div className="flex items-center justify-end gap-1.5
                                                    opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => setModal({ mode: 'edit', item })}
                                                        title="Edit"
                                                        className="h-8 w-8 rounded-lg flex items-center justify-center
                                                            text-slate-400 hover:text-slate-700
                                                            hover:bg-slate-100 dark:hover:bg-slate-600
                                                            dark:hover:text-slate-200 transition-all">
                                                        <Edit3 className="h-3.5 w-3.5" />
                                                    </button>
                                                    <button onClick={() => handleToggleStatus(item)}
                                                        title={item.is_active ? 'Deactivate' : 'Activate'}
                                                        className={cn(
                                                            'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                                                            item.is_active
                                                                ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                                                                : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                        )}>
                                                        {item.is_active ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(item)}
                                                        title={item.is_active ? 'Soft Delete' : 'Hard Delete'}
                                                        className={cn(
                                                            'h-8 w-8 rounded-lg flex items-center justify-center transition-all',
                                                            item.is_active
                                                                ? 'text-slate-300 hover:text-amber-600 hover:bg-amber-50'
                                                                : 'text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40'
                                                        )}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination footer */}
                    {!loading && total > pageSize && (
                        <div className="flex items-center justify-between px-6 py-4
                            border-t border-slate-100 dark:border-slate-700
                            bg-slate-50/40 dark:bg-slate-900/20">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Page <span className="font-semibold text-slate-600 dark:text-slate-300">{page}</span>
                                {' '}of {Math.ceil(total / pageSize)}
                                <span className="mx-2 text-slate-300 dark:text-slate-600">·</span>
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{total}</span> total
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                                        font-medium text-slate-500 hover:bg-slate-100
                                        dark:hover:bg-slate-700 disabled:opacity-40
                                        disabled:cursor-not-allowed transition-all">
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </button>
                                <button onClick={() => setPage(p => p + 1)}
                                    disabled={page * pageSize >= total}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs
                                        font-medium text-slate-500 hover:bg-slate-100
                                        dark:hover:bg-slate-700 disabled:opacity-40
                                        disabled:cursor-not-allowed transition-all">
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Simple footer */}
                    {!loading && total <= pageSize && total > 0 && (
                        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700
                            bg-slate-50/40 dark:bg-slate-900/20">
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {total} records · Changes apply immediately to all collection forms
                            </p>
                        </div>
                    )}
                </div>

            </div>

            {/* ── Modals ─────────────────────────────────────────── */}
            {modal && (
                <MasterModal
                    show={!!modal}
                    title={modal.mode === 'create' ? `Add ${config.singular}` : `Edit ${config.singular}`}
                    onClose={() => setModal(null)}>
                    <FormContainer
                        config={config} item={modal.item}
                        apiCache={apiCache} onSave={handleSave}
                        onClose={() => setModal(null)} />
                </MasterModal>
            )}
            {confirm && (
                <ConfirmModal
                    title={confirm.title} message={confirm.message}
                    confirmLabel={confirm.confirmLabel} confirmClass={confirm.confirmClass}
                    onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)} />
            )}
            {exportOpen && (
                <ExportModal
                    title={config.title}
                    config={config}
                    filters={{ search }}
                    onClose={() => setExportOpen(false)}
                />
            )}
            {importOpen && (
                <ImportModal
                    title={config.title}
                    config={config}
                    onClose={() => setImportOpen(false)}
                    onImported={() => {
                        load();
                        // We don't automatically close so they can see results
                    }}
                />
            )}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}

// Named exports for legacy pages ─────────────────────────────────
MasterDataEngine.QuickAdd = ({ parent, onAdd }) => (
    <button
        onClick={() => onAdd({ mode: 'create', item: { parent_id: parent.id } })}
        title="Add child record"
        className="h-7 w-7 rounded-lg flex items-center justify-center
            bg-slate-100 dark:bg-slate-700 text-slate-400
            hover:bg-emerald-100 hover:text-emerald-600
            dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400
            transition-all active:scale-90">
        <Plus className="h-3.5 w-3.5" />
    </button>
);

export const FormField = renderField;

function renderField(f, form, setForm, error, apiCache) {
    const cls = `${inputCls} ${error ? 'border-rose-400 focus:border-rose-400 focus:ring-rose-500/20' : ''}`;
    const onChange = e => setForm(p => ({ ...p, [f.key]: e.target.value }));

    if (f.type === 'api-select') {
        const rawOpts = apiCache[f.apiUrl] || [];
        // If the module has parent_id or similar, build a tree representation for the dropdown
        const opts = (rawOpts.some(r => r.parent || r.parent_id || r.parent_fuel))
            ? buildFlatTree(rawOpts, f.parentKey || 'parent_id', f.apiLabel || 'name')
            : rawOpts;

        return (
            <div className="relative group/select">
                <select value={form[f.key] ?? ''} onChange={onChange} className={cls}>
                    <option value="">— Select {f.label} —</option>
                    {opts.map(o => (
                        <option key={o.id} value={o[f.apiValue] || o.id}>
                            {o.displayName || o[f.apiLabel || 'name']}
                        </option>
                    ))}
                </select>
                {f.managePath && (
                    <button
                        type="button"
                        onClick={() => window.open(f.managePath, '_blank')}
                        title={`Manage ${f.label} options`}
                        className="absolute right-8 top-1/2 -translate-y-1/2 p-1.5 
                            text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 
                            dark:hover:bg-indigo-900/30 rounded-lg transition-all
                            opacity-0 group-hover/select:opacity-100">
                        <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
        );
    }
    if (f.type === 'select') return (
        <select value={form[f.key] ?? ''} onChange={onChange} className={cls}>
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
    );
    if (f.type === 'textarea') return (
        <textarea value={form[f.key] ?? ''} onChange={onChange}
            className={`${cls} h-28 py-2.5 resize-none`}
            placeholder={f.placeholder} />
    );
    if (f.type === 'checkbox') return (
        <label className="flex items-center gap-3 cursor-pointer
            bg-slate-50 dark:bg-slate-700/50 px-4 py-3 rounded-xl
            border border-slate-200 dark:border-slate-600
            hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
            <input type="checkbox"
                checked={!!form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.checked }))}
                className="h-4 w-4 rounded border-slate-300 text-emerald-600
                    focus:ring-emerald-500 cursor-pointer" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Active (visible across all modules)
            </span>
        </label>
    );

    return (
        <div className="relative group/field">
            <input type={f.type || 'text'}
                step={f.type === 'number' ? (f.step || 'any') : undefined}
                value={form[f.key] ?? ''} onChange={onChange}
                className={cls} placeholder={f.placeholder} />
            {f.autoCode && (
                <button
                    type="button"
                    onClick={() => {
                        const name = form[f.autoCode];
                        if (name) setForm(p => ({ ...p, [f.key]: generateCode(name) }));
                    }}
                    title={`Generate code from ${f.autoCode}`}
                    className="absolute right-2 top-1.5 h-6 px-2 rounded-lg
                        bg-slate-100 dark:bg-slate-700 text-[10px] font-bold text-slate-500
                        hover:bg-primary-500 hover:text-white transition-all
                        border border-slate-200 dark:border-slate-600
                        flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AUTO
                </button>
            )}
        </div>
    );
}

function FormContainer({ config, item, apiCache, onSave, onClose }) {
    const initForm = config.fields.reduce(
        (acc, f) => ({ ...acc, [f.key]: f.default ?? '' }),
        { is_active: true }
    );
    const [form,    setForm]    = useState(item ? { ...item } : initForm);
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);

    const handleSubmit = async e => {
        e.preventDefault();
        setLoading(true);
        const result = await onSave(form);
        if (result) { setErrors(result); setLoading(false); }
    };

    const halfFields = config.fields.filter(f => f.half);
    const fullFields = config.fields.filter(f => !f.half);

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {halfFields.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
                    {halfFields.map(f => (
                        <FieldWrap key={f.key} label={f.label} error={errors[f.key]} hint={f.hint} required={f.required}>
                            {renderField(f, form, setForm, errors[f.key], apiCache)}
                        </FieldWrap>
                    ))}
                </div>
            )}
            {fullFields.map(f => (
                <FieldWrap key={f.key} label={f.label} error={errors[f.key]} hint={f.hint} required={f.required}>
                    {renderField(f, form, setForm, errors[f.key], apiCache)}
                </FieldWrap>
            ))}
            <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                    className="flex-1 h-10 flex items-center justify-center gap-2
                        bg-emerald-600 hover:bg-emerald-700 text-white
                        text-sm font-bold rounded-xl shadow-sm
                        transition-all active:scale-95 disabled:opacity-60">
                    {loading
                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                        : <Save className="h-4 w-4" />}
                    {loading ? 'Saving…' : 'Save Record'}
                </button>
                <button type="button" onClick={onClose}
                    className="flex-1 h-10 rounded-xl border border-slate-200
                        dark:border-slate-600 text-sm font-bold
                        text-slate-600 dark:text-slate-300
                        hover:bg-slate-50 dark:hover:bg-slate-700
                        transition-all active:scale-95">
                    Discard
                </button>
            </div>
        </form>
    );
}

export default MasterDataEngine;
