// src/pages/admin/data-collection/electricity/ElectricityEngine.jsx
//
// Reusable import engine for Electricity data collection.
// Provides: CSV preview → validation → chunked upload → results + error download
// Same pattern as MasterDataEngine.jsx but tailored for energy data records.
//
// Usage:
//   <ElectricityImportEngine
//     config={{ title, apiPath, templateHeaders, templateExample, fields }}
//     onClose={() => setImportOpen(false)}
//     onComplete={() => { setImportOpen(false); reload(); }}
//   />

import { useState, useRef, useCallback } from 'react';
import {
    Upload, Download, X, RefreshCw, AlertTriangle, CheckCircle2,
    FileText, ChevronRight, Eye, EyeOff, Wifi,
} from 'lucide-react';
import { apiFetch, getAccessToken } from '../../../../services/api';

const PREVIEW_LIMIT = 500;   // rows shown in preview
const CHUNK_SIZE    = 500;   // rows sent per backend batch (handled by backend)

// ── CSV parser ──────────────────────────────────────────────────────
function parseCSV(text) {
    const lines = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return null;

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

    const headers = parseRow(lines[0]);
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

// ── Validate a row against field definitions ────────────────────────
function validateRow(row, fields) {
    const errors = {};
    fields.forEach(f => {
        const v = String(row[f.key] ?? '').trim();
        if (f.required && !v) {
            errors[f.key] = `${f.label} is required`;
        } else if (f.type === 'number' && v && isNaN(Number(v))) {
            errors[f.key] = 'Must be a number';
        } else if (f.type === 'integer' && v && !/^\d+$/.test(v)) {
            errors[f.key] = 'Must be a whole number';
        } else if (f.type === 'month' && v && (isNaN(Number(v)) || Number(v) < 1 || Number(v) > 12)) {
            errors[f.key] = 'Must be 1–12';
        }
    });
    return errors;
}

// ── Status badge ────────────────────────────────────────────────────
function RowStatus({ status, errors }) {
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

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export function ElectricityImportEngine({ config, onClose, onComplete }) {
    const {
        title,
        apiPath,          // e.g. '/api/electricity/consumption/bulk-import/'
        templateHeaders,  // string[] — CSV column names
        templateExample,  // string   — one example CSV row
        fields,           // { key, label, required, type }[] — for validation
    } = config;

    const [phase,     setPhase]    = useState('select');  // select|preview|uploading|done
    const [file,      setFile]     = useState(null);
    const [parsed,    setParsed]   = useState(null);      // { headers, rows }
    const [reviewed,  setReviewed] = useState([]);        // rows with _status + _errors
    const [mode,      setMode]     = useState('create_only');
    const [progress,  setProgress] = useState(0);
    const [result,    setResult]   = useState(null);
    const [error,     setError]    = useState('');
    const [showAll,   setShowAll]  = useState(false);
    const fileRef = useRef(null);

    const readyCount = reviewed.filter(r => r._status === 'ready').length;
    const errorCount = reviewed.filter(r => r._status === 'error').length;
    const totalRows  = parsed?.rows.length ?? 0;
    const isLarge    = totalRows > PREVIEW_LIMIT;

    // ── File selected ───────────────────────────────────────────────
    const handleFileSelect = useCallback(async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        if (fileRef.current) fileRef.current.value = '';
        setError('');
        setFile(f);

        try {
            const text = await f.text();
            const p = parseCSV(text);
            if (!p || p.rows.length === 0) {
                setError('File has no data rows. Check the format matches the template.');
                return;
            }
            setParsed(p);

            // Validate preview rows (first PREVIEW_LIMIT)
            const preview = p.rows.slice(0, PREVIEW_LIMIT);
            const rev = preview.map(row => {
                const errs   = validateRow(row, fields || []);
                const status = Object.keys(errs).length > 0 ? 'error' : 'ready';
                return { ...row, _status: status, _errors: errs };
            });
            setReviewed(rev);
            setPhase('preview');
        } catch (err) {
            setError(`Failed to parse file: ${err.message}`);
        }
    }, [fields]);

    // ── Upload ──────────────────────────────────────────────────────
    const handleUpload = useCallback(async () => {
        if (!file) return;
        setPhase('uploading');
        setProgress(5);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', mode);
        formData.append('data_source', 'EXCEL');

        let ticker = null;
        const startTick = () => {
            let p = 10;
            ticker = setInterval(() => {
                p = Math.min(p + 2, 88);
                setProgress(p);
            }, 400);
        };

        try {
            const token = getAccessToken();
            setProgress(10);
            startTick();

            const res = await fetch(apiPath, {
                method:  'POST',
                headers: { Authorization: `Bearer ${token}` },
                body:    formData,
            });

            clearInterval(ticker);
            setProgress(100);

            if (res.ok) {
                const data = await res.json();
                setResult(data);
                setPhase('done');
                if ((data.created ?? 0) > 0) onComplete?.();
            } else {
                let msg = `Server error ${res.status}`;
                try {
                    const err = await res.json();
                    msg = err.detail || JSON.stringify(err).slice(0, 200);
                } catch {}
                throw new Error(msg);
            }
        } catch (err) {
            clearInterval(ticker);
            setError(err.message || 'Upload failed — check connection and try again.');
            setPhase('preview');
        }
    }, [file, mode, apiPath, onComplete]);

    // ── Template download ───────────────────────────────────────────
    const downloadTemplate = () => {
        const csv = [
            templateHeaders.join(','),
            templateExample,
            '# Delete this comment row before importing',
        ].join('\n') + '\n';
        const a   = document.createElement('a');
        a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${title.toLowerCase().replace(/[\s/]+/g, '-')}-template.csv`;
        a.click();
    };

    // ── Download failed rows ────────────────────────────────────────
    const downloadFailed = () => {
        if (!result?.errors?.length) return;
        const header = [...templateHeaders, '_error'].join(',');
        const rows = result.errors.map(e => {
            const vals = templateHeaders.map(h => {
                const v = String(e.data?.[h] ?? '');
                return `"${v.replace(/"/g, '""')}"`;
            });
            const msg = e.errors?._error || Object.entries(e.errors || {}).map(([k,v])=>`${k}: ${v}`).join('; ');
            vals.push(`"${msg.replace(/"/g, '""')}"`);
            return vals.join(',');
        }).join('\n');
        const a   = document.createElement('a');
        a.href    = URL.createObjectURL(new Blob([`${header}\n${rows}`], { type: 'text/csv' }));
        a.download = `${title.toLowerCase().replace(/[\s/]+/g, '-')}-failed-rows.csv`;
        a.click();
    };

    const displayRows = showAll ? reviewed : reviewed.slice(0, 20);

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800">
                            <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                Import {title}
                            </h2>
                            {phase === 'preview' && (
                                <p className="text-xs text-slate-400 mt-1">
                                    {totalRows.toLocaleString()} rows · {errorCount} errors · {readyCount} ready
                                    {isLarge && ` · showing first ${PREVIEW_LIMIT}`}
                                </p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1">

                    {/* ── PHASE: select ── */}
                    {phase === 'select' && (
                        <div className="px-6 py-6 space-y-5">
                            <div className="flex items-center justify-between">
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Upload a CSV file with the required columns. Download the template to get started.
                                </p>
                                <button onClick={downloadTemplate}
                                    className="flex-shrink-0 flex items-center gap-1.5 ml-4
                                        text-xs font-semibold text-primary-600 hover:text-primary-700">
                                    <Download className="h-3.5 w-3.5" /> Template
                                </button>
                            </div>

                            {/* Column guide */}
                            <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4
                                border border-slate-100 dark:border-slate-700">
                                <p className="text-[11px] font-bold uppercase tracking-wider
                                    text-slate-400 mb-2">Required columns</p>
                                <div className="flex flex-wrap gap-2">
                                    {templateHeaders.map(h => (
                                        <span key={h} className="text-xs font-mono px-2 py-1 rounded
                                            bg-white dark:bg-slate-700 border border-slate-200
                                            dark:border-slate-600 text-slate-600 dark:text-slate-300">
                                            {h}
                                        </span>
                                    ))}
                                </div>
                                {fields?.filter(f => f.required).length > 0 && (
                                    <p className="text-xs text-slate-400 mt-2">
                                        Required: {fields.filter(f => f.required).map(f => f.key).join(', ')}
                                    </p>
                                )}
                            </div>

                            {/* Drop zone */}
                            <div
                                className="border-2 border-dashed border-slate-200 dark:border-slate-600
                                    rounded-xl py-10 text-center cursor-pointer
                                    hover:border-primary-400 hover:bg-primary-50/20
                                    dark:hover:bg-primary-900/10 transition-all"
                                onClick={() => fileRef.current?.click()}
                                onDragOver={e => e.preventDefault()}
                                onDrop={e => {
                                    e.preventDefault();
                                    const f = e.dataTransfer.files[0];
                                    if (f) { fileRef.current.files = e.dataTransfer.files; handleFileSelect({ target: e.dataTransfer }); }
                                }}>
                                <Upload className="h-8 w-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                    Click to choose or drag & drop
                                </p>
                                <p className="text-xs text-slate-400 mt-1">.csv files supported</p>
                                <input ref={fileRef} type="file" accept=".csv,.tsv"
                                    onChange={handleFileSelect} className="hidden" />
                            </div>

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20
                                    rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PHASE: preview ── */}
                    {phase === 'preview' && (
                        <div className="px-6 py-4 space-y-4">

                            {/* Stats bar */}
                            <div className="grid grid-cols-4 gap-3">
                                {[
                                    { label: 'Total Rows', val: totalRows.toLocaleString(), color: 'text-slate-700 dark:text-slate-200' },
                                    { label: 'Ready',      val: readyCount.toLocaleString(), color: 'text-emerald-600' },
                                    { label: 'Errors',     val: errorCount.toLocaleString(), color: errorCount > 0 ? 'text-rose-600' : 'text-slate-400' },
                                    { label: 'Columns',    val: parsed?.headers.length, color: 'text-primary-600' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 dark:bg-slate-700/40
                                        rounded-xl p-3 text-center border border-slate-100 dark:border-slate-700">
                                        <p className={`text-xl font-extrabold ${s.color}`}>{s.val}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {/* Import mode */}
                            <div className="flex gap-3">
                                {[
                                    { val: 'create_only',    label: 'Create only',     desc: 'Skip existing records' },
                                    { val: 'create_and_update', label: 'Create & Update', desc: 'Update if already exists' },
                                ].map(opt => (
                                    <label key={opt.val}
                                        className={`flex-1 flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors
                                            ${mode === opt.val
                                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                                : 'border-slate-200 dark:border-slate-600 hover:border-primary-300'}`}>
                                        <input type="radio" value={opt.val} checked={mode === opt.val}
                                            onChange={() => setMode(opt.val)} className="mt-0.5" />
                                        <div>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{opt.label}</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">{opt.desc}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Preview table */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        Preview {isLarge ? `(first ${PREVIEW_LIMIT.toLocaleString()} of ${totalRows.toLocaleString()})` : `(${totalRows} rows)`}
                                    </p>
                                    {reviewed.length > 20 && (
                                        <button onClick={() => setShowAll(s => !s)}
                                            className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-semibold">
                                            {showAll ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                            {showAll ? 'Show less' : `Show all ${reviewed.length}`}
                                        </button>
                                    )}
                                </div>
                                <div className="overflow-x-auto rounded-xl border border-slate-100
                                    dark:border-slate-700 max-h-64">
                                    <table className="text-xs w-full">
                                        <thead className="bg-slate-50 dark:bg-slate-700/30 sticky top-0">
                                            <tr>
                                                <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Row</th>
                                                <th className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">Status</th>
                                                {parsed?.headers.map(h => (
                                                    <th key={h} className="px-3 py-2 text-left font-semibold text-slate-500 whitespace-nowrap">{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                                            {displayRows.map((r, i) => (
                                                <tr key={i} className={r._status === 'error'
                                                    ? 'bg-rose-50/50 dark:bg-rose-900/10'
                                                    : ''}>
                                                    <td className="px-3 py-1.5 text-slate-400 font-mono">{r._row}</td>
                                                    <td className="px-3 py-1.5">
                                                        <RowStatus status={r._status} />
                                                    </td>
                                                    {parsed?.headers.map(h => (
                                                        <td key={h} className={`px-3 py-1.5 whitespace-nowrap
                                                            ${r._errors?.[h] ? 'text-rose-600 font-semibold' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {r[h] || <span className="text-slate-300">—</span>}
                                                            {r._errors?.[h] && (
                                                                <span className="block text-[10px] text-rose-500 font-normal">
                                                                    {r._errors[h]}
                                                                </span>
                                                            )}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {errorCount > 0 && (
                                <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20
                                    rounded-xl border border-amber-200 dark:border-amber-700">
                                    <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-400">
                                        {errorCount} row{errorCount > 1 ? 's' : ''} have validation errors.
                                        {mode === 'create_only'
                                            ? ' These rows will be skipped during import.'
                                            : ' Fix errors before importing for best results.'}
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20
                                    rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── PHASE: uploading ── */}
                    {phase === 'uploading' && (
                        <div className="px-6 py-10 space-y-6">
                            <div className="flex justify-center">
                                <div className="relative h-16 w-16">
                                    <div className="absolute inset-0 rounded-full border-4
                                        border-primary-100 dark:border-primary-900/40" />
                                    <div className="absolute inset-0 rounded-full border-4
                                        border-transparent border-t-primary-500 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Upload className="h-6 w-6 text-primary-500" />
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm font-semibold
                                    text-slate-600 dark:text-slate-300">
                                    <span>{progress < 90 ? `Uploading ${totalRows.toLocaleString()} rows…` : 'Server processing…'}</span>
                                    <span className="text-primary-600">{progress}%</span>
                                </div>
                                <div className="h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary-500 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-slate-400 text-center">
                                    {totalRows > CHUNK_SIZE
                                        ? `Processing in batches of ${CHUNK_SIZE} rows…`
                                        : 'Processing rows on the server…'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* ── PHASE: done ── */}
                    {phase === 'done' && result && (
                        <div className="px-6 py-6 space-y-5">
                            {/* Summary stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {[
                                    { label: 'Created',  val: result.created  ?? 0, color: 'text-emerald-600' },
                                    { label: 'Updated',  val: result.updated  ?? 0, color: 'text-blue-600'    },
                                    { label: 'Skipped',  val: result.skipped  ?? 0, color: 'text-amber-500'   },
                                    { label: 'Failed',   val: result.failed   ?? 0, color: result.failed > 0 ? 'text-rose-600' : 'text-slate-400' },
                                ].map(s => (
                                    <div key={s.label} className="bg-slate-50 dark:bg-slate-700/40
                                        rounded-xl p-4 text-center border border-slate-100 dark:border-slate-700">
                                        <p className={`text-2xl font-extrabold ${s.color}`}>{s.val}</p>
                                        <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                                            {s.label}
                                        </p>
                                    </div>
                                ))}
                            </div>

                            {result.duration_ms && (
                                <p className="text-xs text-center text-slate-400">
                                    Completed in {(result.duration_ms / 1000).toFixed(1)}s · {result.total ?? totalRows} rows processed
                                </p>
                            )}

                            {/* Failed rows */}
                            {result.failed > 0 && result.errors?.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                                            {result.failed} rows failed:
                                        </p>
                                        <button onClick={downloadFailed}
                                            className="flex items-center gap-1.5 text-xs font-semibold
                                                text-rose-600 hover:text-rose-700">
                                            <Download className="h-3.5 w-3.5" /> Download failed rows
                                        </button>
                                    </div>
                                    <div className="bg-rose-50 dark:bg-rose-900/20 rounded-xl
                                        border border-rose-200 dark:border-rose-700 overflow-hidden">
                                        <div className="overflow-y-auto max-h-40">
                                            <table className="text-xs w-full">
                                                <thead className="bg-rose-100 dark:bg-rose-900/30">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Row</th>
                                                        <th className="px-3 py-2 text-left font-semibold text-rose-700">Error</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-rose-100 dark:divide-rose-900/20">
                                                    {result.errors.slice(0, 50).map((e, i) => (
                                                        <tr key={i}>
                                                            <td className="px-3 py-1.5 font-mono text-rose-600">{e.row}</td>
                                                            <td className="px-3 py-1.5 text-rose-600">
                                                                {e.errors?._error || Object.entries(e.errors || {}).map(([k,v]) => `${k}: ${v}`).join('; ')}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {result.errors.length > 50 && (
                                                        <tr>
                                                            <td colSpan={2} className="px-3 py-1.5 text-rose-500 italic">
                                                                + {result.errors.length - 50} more errors — download to see all
                                                            </td>
                                                        </tr>
                                                    )}
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
                <div className="flex items-center justify-between px-6 py-4
                    border-t border-slate-100 dark:border-slate-700
                    bg-slate-50/50 dark:bg-slate-800/80 flex-shrink-0">
                    <div>
                        {(phase === 'select' || phase === 'preview') && (
                            <button onClick={downloadTemplate}
                                className="flex items-center gap-1.5 text-xs font-semibold
                                    text-slate-500 hover:text-primary-600 transition-colors">
                                <Download className="h-3.5 w-3.5" /> Download Template
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose}
                            className="px-4 py-2 rounded-xl text-sm font-semibold
                                bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200
                                hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors">
                            {phase === 'done' ? 'Close' : 'Cancel'}
                        </button>
                        {phase === 'preview' && (
                            <button onClick={handleUpload}
                                disabled={readyCount === 0}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl
                                    bg-primary-600 hover:bg-primary-700 text-white
                                    text-sm font-bold transition-colors shadow-sm
                                    disabled:opacity-40 disabled:cursor-not-allowed">
                                <ChevronRight className="h-4 w-4" />
                                Import {readyCount.toLocaleString()} rows
                                {mode === 'create_and_update' && errorCount > 0 && ' (skip errors)'}
                            </button>
                        )}
                        {phase === 'done' && result && (result.created ?? 0) > 0 && (
                            <button onClick={onClose}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl
                                    bg-emerald-600 hover:bg-emerald-700 text-white
                                    text-sm font-bold transition-colors shadow-sm">
                                <CheckCircle2 className="h-4 w-4" />
                                Done — {result.created} imported
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── API Fetch Modal ─────────────────────────────────────────────────
export function ElectricityAPIFetch({ title, yearValue, onClose }) {
    const [year,    setYear]    = useState(yearValue || String(new Date().getFullYear()));
    const [running, setRunning] = useState(false);
    const [log,     setLog]     = useState([]);
    const [done,    setDone]    = useState(false);
    const [years,   setYears]   = useState([]);

    useState(() => {
        apiFetch('/master-data/settings/years/dropdown/').then(async r => {
            if (r?.ok) setYears(await r.json());
        });
    }, []);

    const addLog = (msg, type = 'info') => setLog(p => [...p, { msg, type, ts: Date.now() }]);

    const runFetch = async () => {
        setRunning(true); setLog([]); setDone(false);
        addLog(`Starting API fetch for year ${year}…`);
        await new Promise(r => setTimeout(r, 500));
        addLog('Connecting to BPC Energy Dashboard API…');
        await new Promise(r => setTimeout(r, 700));
        addLog('⚠ BPC API endpoint not yet configured.', 'warn');
        addLog('  Configure BPC_API_URL and BPC_API_KEY in System Settings to enable.', 'warn');
        await new Promise(r => setTimeout(r, 300));
        addLog('Alternative: Use CSV Upload to import BPC data manually.', 'info');
        addLog('  Download the CSV template → fill with BPC report data → upload.', 'info');
        setRunning(false); setDone(true);
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center border border-violet-100 dark:border-violet-800">
                            <Wifi className="h-6 w-6 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                                API Fetch
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">{title}</p>
                        </div>
                    </div>
                    <button onClick={onClose}
                        className="h-10 w-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-slate-600
                            dark:text-slate-400 mb-1">Data Year *</label>
                        <select value={year} onChange={e => setYear(e.target.value)}
                            className="w-full h-9 px-3 rounded-lg border border-slate-200
                                dark:border-slate-600 bg-white dark:bg-slate-700 text-sm
                                text-slate-700 dark:text-slate-200 focus:outline-none
                                focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400">
                            <option value="">Select year…</option>
                            {years.map(y => <option key={y.id} value={y.year}>{y.year}</option>)}
                            {years.length === 0 && <option value={year}>{year}</option>}
                        </select>
                    </div>

                    {log.length > 0 && (
                        <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs
                            space-y-1.5 max-h-44 overflow-y-auto">
                            {log.map((l, i) => (
                                <p key={i} className={
                                    l.type === 'error' ? 'text-rose-400' :
                                    l.type === 'warn'  ? 'text-amber-400' :
                                    l.type === 'ok'    ? 'text-emerald-400' :
                                    'text-slate-300'
                                }>
                                    <span className="text-slate-600 mr-1">›</span>
                                    {l.msg}
                                </p>
                            ))}
                            {running && (
                                <p className="text-primary-400 animate-pulse">
                                    <span className="text-slate-600 mr-1">›</span> Running…
                                </p>
                            )}
                        </div>
                    )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4
                    border-t border-slate-100 dark:border-slate-700
                    bg-slate-50/50 dark:bg-slate-800/80">
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-xl text-sm font-semibold
                            bg-slate-200 dark:bg-slate-700 text-slate-700
                            hover:bg-slate-300 transition-colors">
                        {done ? 'Close' : 'Cancel'}
                    </button>
                    {!done && (
                        <button onClick={runFetch} disabled={running || !year}
                            className="flex items-center gap-2 px-5 py-2 rounded-xl
                                bg-violet-600 hover:bg-violet-700 text-white
                                text-sm font-bold transition-colors disabled:opacity-50">
                            {running
                                ? <RefreshCw className="h-4 w-4 animate-spin" />
                                : <Wifi className="h-4 w-4" />}
                            {running ? 'Fetching…' : 'Fetch from API'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}