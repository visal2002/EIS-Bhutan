// src/pages/admin/master-data/MasterDataEngine.jsx
// Generic engine for all master-data modules EXCEPT Sectors
// (Sectors has its own SectorsPage.jsx for tree view)
import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Edit3, Trash2, X, Save, RefreshCw,
    ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
    ChevronLeft, ChevronRight, Info,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { apiFetch } from '../../../services/api';

const PAGE_SIZE = 12;

// ─── shared input class ───────────────────────────────────────────
export const inputCls = (err) =>
    `w-full rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2
    bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100
    placeholder:text-slate-400 dark:placeholder:text-slate-500
    border ${err
        ? 'border-rose-400 ring-1 ring-rose-300/60 bg-rose-50/40 dark:bg-rose-900/10'
        : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500 focus:ring-primary-500/25 focus:border-primary-400'}`;

// ═══════════════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════════════
export function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    const ok = type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3
            px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold
            ${ok ? 'bg-emerald-600' : 'bg-rose-500'}`}
            style={{ animation: 'slideUp .22s ease-out' }}>
            {ok
                ? <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                : <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
            {message}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// CONFIRM MODAL
// ═══════════════════════════════════════════════════════════════════
export function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading }) {
    useEffect(() => {
        const h = e => e.key === 'Escape' && onCancel();
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onCancel]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden
                border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'modalIn .18s ease-out' }}>
                <div className="px-6 pt-6 pb-5">
                    <div className="flex items-start gap-4 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <AlertTriangle className="h-5 w-5 text-rose-500" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">{title}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-1">
                        <button onClick={onCancel}
                            className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600
                                text-sm font-semibold text-slate-600 dark:text-slate-300
                                hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors">
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
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// STATUS BADGE
// ═══════════════════════════════════════════════════════════════════
export function StatusBadge({ active }) {
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold
            ${active
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700/60'
                : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700/60 dark:text-slate-400 dark:border-slate-600'}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
            {active ? 'Active' : 'Inactive'}
        </span>
    );
}

// ═══════════════════════════════════════════════════════════════════
// FORM FIELD
// ═══════════════════════════════════════════════════════════════════
export function FormField({ def, value, onChange, error, apiCache }) {
    const base = inputCls(error);
    if (def.type === 'textarea') {
        return <textarea value={value ?? ''} onChange={onChange} placeholder={def.placeholder}
            rows={3} className={base + ' resize-none'} />;
    }
    if (def.type === 'select') {
        return (
            <select value={value ?? ''} onChange={onChange} className={base + ' appearance-none cursor-pointer'}>
                {(def.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        );
    }
    if (def.type === 'api-select') {
        const opts   = apiCache[def.apiUrl] || [];
        const valKey = def.apiValue ?? 'id';
        const lblKey = def.apiLabel ?? 'name';
        return (
            <select value={value ?? ''} onChange={onChange} className={base + ' appearance-none cursor-pointer'}>
                <option value="">Select {def.label}…</option>
                {opts.map(o => <option key={o[valKey]} value={o[valKey]}>{o[lblKey]}</option>)}
            </select>
        );
    }
    return (
        <input
            type={def.type === 'number' ? 'number' : def.type === 'date' ? 'date' : 'text'}
            value={value ?? ''}
            onChange={onChange}
            placeholder={def.placeholder}
            step={def.type === 'number' ? 'any' : undefined}
            style={def.type === 'code' ? { textTransform: 'uppercase' } : {}}
            className={base}
        />
    );
}

// ═══════════════════════════════════════════════════════════════════
// FIELD WRAPPER — label + hint + error
// ═══════════════════════════════════════════════════════════════════
export function FieldWrap({ def, error, children }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {def.label}
                    {def.required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
                {!def.required && (
                    <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
                )}
            </div>
            {children}
            {error && (
                <p className="text-[11px] text-rose-500 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}
                </p>
            )}
            {def.hint && !error && (
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Info className="h-3 w-3 flex-shrink-0" />{def.hint}
                </p>
            )}
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// ADD / EDIT MODAL
// ═══════════════════════════════════════════════════════════════════
export function MasterModal({ config, mode, item, onClose, onSaved, apiCache }) {
    const isEdit = mode === 'edit';
    const buildEmpty = () => config.fields.reduce((a, f) => ({ ...a, [f.key]: f.default ?? '' }), { is_active: true });
    const [form,    setForm]    = useState(isEdit ? { ...item } : buildEmpty());
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const h = e => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onClose]);

    const set = key => e => {
        setForm(p => ({ ...p, [key]: e.target.value }));
        if (errors[key]) setErrors(p => ({ ...p, [key]: '' }));
    };

    const validate = () => {
        const e = {};
        config.fields.forEach(f => {
            if (f.required && !String(form[f.key] ?? '').trim()) e[f.key] = `${f.label} is required`;
        });
        setErrors(e);
        return !Object.keys(e).length;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = config.fields.reduce((acc, f) => {
                let v = form[f.key];
                if (f.type === 'code')           v = String(v ?? '').trim().toUpperCase();
                else if (f.type === 'number')     v = (v === '' || v == null) ? null : Number(v);
                else if (typeof v === 'string')   v = v.trim();
                return { ...acc, [f.key]: v };
            }, { is_active: form.is_active !== false });

            const url = isEdit ? `${config.api}${item.id}/` : config.api;
            const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) });

            if (!res?.ok) {
                const err = await res.json();
                const fe  = {};
                let   gMsg = '';
                Object.entries(err).forEach(([k, v]) => {
                    const msg = Array.isArray(v) ? v[0] : String(v);
                    if (config.fields.find(f => f.key === k)) fe[k] = msg;
                    else gMsg = msg;
                });
                if (Object.keys(fe).length) setErrors(fe);
                else setErrors({ _g: gMsg || 'Failed to save. Please try again.' });
                return;
            }
            onSaved(isEdit ? 'updated' : 'created');
        } catch {
            setErrors({ _g: 'Network error. Please check your connection.' });
        } finally { setLoading(false); }
    };

    // Group half+half pairs into 2-col rows
    const rows = [];
    let i = 0;
    while (i < config.fields.length) {
        const f = config.fields[i];
        if (f.half && config.fields[i + 1]?.half) { rows.push([f, config.fields[i + 1]]); i += 2; }
        else { rows.push([f]); i++; }
    }

    const Icon = config.icon;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-[520px]
                border border-slate-200 dark:border-slate-700 flex flex-col max-h-[92vh]"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'modalIn .18s ease-out' }}>

                {/* Header */}
                <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div className="h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg,#1a4a3a,#256648)' }}>
                        {Icon && <Icon className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 leading-none mb-0.5">
                            {config.title}
                        </p>
                        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                            {isEdit ? `Edit — ${item[config.nameKey] ?? 'Record'}` : `Add ${config.singular}`}
                        </h2>
                    </div>
                    <button onClick={onClose}
                        className="h-8 w-8 rounded-xl bg-slate-100 dark:bg-slate-700
                            hover:bg-slate-200 dark:hover:bg-slate-600
                            flex items-center justify-center flex-shrink-0
                            text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
                    {errors._g && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-rose-50 dark:bg-rose-900/20
                            border border-rose-200 dark:border-rose-800 px-4 py-3">
                            <AlertTriangle className="h-4 w-4 text-rose-500 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-rose-600 dark:text-rose-400">{errors._g}</p>
                        </div>
                    )}

                    {rows.map((row, idx) => (
                        <div key={idx} className={row.length === 2 ? 'grid grid-cols-2 gap-4' : ''}>
                            {row.map(f => (
                                <FieldWrap key={f.key} def={f} error={errors[f.key]}>
                                    <FormField def={f} value={form[f.key]} onChange={set(f.key)}
                                        error={errors[f.key]} apiCache={apiCache} />
                                </FieldWrap>
                            ))}
                        </div>
                    ))}

                    {/* Status cards */}
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Status</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { val: true,  label: 'Active',   sub: 'Available in forms',
                                  on: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20',
                                  dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400' },
                                { val: false, label: 'Inactive', sub: 'Hidden from forms',
                                  on: 'border-slate-400 bg-slate-50 dark:bg-slate-700/40',
                                  dot: 'bg-slate-400',   text: 'text-slate-600 dark:text-slate-400' },
                            ].map(s => {
                                const active = form.is_active === s.val;
                                return (
                                    <button key={String(s.val)} type="button"
                                        onClick={() => setForm(p => ({ ...p, is_active: s.val }))}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2
                                            text-left transition-all
                                            ${active ? s.on + ' border-opacity-100'
                                                : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-300'}`}>
                                        <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${active ? s.dot : 'bg-slate-300 dark:bg-slate-500'}`} />
                                        <div>
                                            <p className={`text-xs font-bold ${active ? s.text : 'text-slate-600 dark:text-slate-300'}`}>{s.label}</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">{s.sub}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 px-6 py-4
                    border-t border-slate-100 dark:border-slate-700
                    bg-slate-50/80 dark:bg-slate-800/80 flex-shrink-0">
                    <button onClick={onClose} disabled={loading}
                        className="px-5 py-2 rounded-xl border border-slate-200 dark:border-slate-600
                            text-sm font-semibold text-slate-600 dark:text-slate-300
                            hover:bg-white dark:hover:bg-slate-700 transition-colors disabled:opacity-50">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={loading}
                        className="flex items-center gap-2 px-5 py-2 rounded-xl
                            bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold
                            transition-all disabled:opacity-60 shadow-sm hover:shadow-md">
                        {loading
                            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Saving…</>
                            : <><Save className="h-3.5 w-3.5" />{isEdit ? 'Save Changes' : `Add ${config.singular}`}</>}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalIn { from{opacity:0;transform:scale(.97) translateY(6px)} to{opacity:1;transform:scale(1) translateY(0)} }
                @keyframes slideUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
            `}</style>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// TABLE CELL
// ═══════════════════════════════════════════════════════════════════
function Cell({ col, item }) {
    if (col.render) return col.render(item);
    const val = item[col.key];
    switch (col.type) {
        case 'status':  return <StatusBadge active={item.is_active} />;
        case 'code':    return (
            <span className="font-mono text-[11px] font-bold tracking-widest
                bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                px-2.5 py-1 rounded-lg">
                {val}
            </span>
        );
        case 'badge': {
            const cls = col.badgeMap?.[val] ?? 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600';
            return (
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
                    {val}
                </span>
            );
        }
        case 'number':  return <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-200">{val ?? '—'}</span>;
        case 'date':    return (
            <span className="text-xs text-slate-500 dark:text-slate-400">
                {val ? new Date(val).toLocaleDateString('en-BT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
            </span>
        );
        default: return col.muted
            ? <span className="text-xs text-slate-400 dark:text-slate-500 truncate block max-w-[180px]">{val || '—'}</span>
            : <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{val ?? <span className="text-slate-300">—</span>}</span>;
    }
}

// ═══════════════════════════════════════════════════════════════════
// MASTER DATA PAGE (generic)
// ═══════════════════════════════════════════════════════════════════
export default function MasterDataPage({ config }) {
    const [items,          setItems]          = useState([]);
    const [total,          setTotal]          = useState(0);
    const [stats,          setStats]          = useState({ total: 0, active: 0, inactive: 0 });
    const [loading,        setLoading]        = useState(true);
    const [search,         setSearch]         = useState('');
    const [filter,         setFilter]         = useState('');
    const [page,           setPage]           = useState(1);
    const [modal,          setModal]          = useState(null);
    const [confirm,        setConfirm]        = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [toast,          setToast]          = useState(null);
    const [apiCache,       setApiCache]       = useState({});

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // Pre-fetch api-select options
    useEffect(() => {
        config.fields
            .filter(f => f.type === 'api-select' && f.apiUrl && !apiCache[f.apiUrl])
            .forEach(async f => {
                try {
                    const res  = await apiFetch(f.apiUrl);
                    if (!res?.ok) return;
                    const data = await res.json();
                    setApiCache(prev => ({ ...prev, [f.apiUrl]: Array.isArray(data) ? data : data.results ?? [] }));
                } catch {}
            });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [config.api]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, page_size: PAGE_SIZE });
            if (search)                p.set('search',    search);
            if (filter === 'active')   p.set('is_active', 'true');
            if (filter === 'inactive') p.set('is_active', 'false');
            const res  = await apiFetch(`${config.api}?${p}`);
            if (!res?.ok) return;
            const data = await res.json();
            if (Array.isArray(data)) { setItems(data); setTotal(data.length); }
            else { setItems(data.results ?? []); setTotal(data.count ?? 0); }
        } finally { setLoading(false); }
    }, [search, filter, page, config.api]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, filter, config.api]);

    // Global stats (unfiltered)
    useEffect(() => {
        apiFetch(`${config.api}?page_size=1000`).then(async r => {
            if (!r?.ok) return;
            const d = await r.json();
            const all = Array.isArray(d) ? d : d.results ?? [];
            setStats({ total: all.length, active: all.filter(i => i.is_active).length, inactive: all.filter(i => !i.is_active).length });
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, config.api]);

    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

    const handleToggle = item => {
        const activate = !item.is_active;
        setConfirm({
            title:        `${activate ? 'Activate' : 'Deactivate'} "${item[config.nameKey]}"?`,
            message:      activate
                ? `"${item[config.nameKey]}" will appear in all data collection forms.`
                : `"${item[config.nameKey]}" will be hidden from forms. Existing records are not affected.`,
            confirmLabel: activate ? 'Activate' : 'Deactivate',
            confirmClass: activate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`${config.api}${item.id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: activate }) });
                    if (res?.ok) { load(); showToast(`${config.singular} ${activate ? 'activated' : 'deactivated'}!`); }
                    else showToast('Failed to update status.', 'error');
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const handleDelete = item => {
        setConfirm({
            title:        `Permanently delete "${item[config.nameKey]}"?`,
            message:      `This will remove this ${config.singular.toLowerCase()} from the database forever. This action cannot be undone.`,
            confirmLabel: 'Delete Forever',
            confirmClass: 'bg-rose-600 hover:bg-rose-700',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`${config.api}${item.id}/?hard=1`, { method: 'DELETE' });
                    if (res?.ok || res?.status === 204) { load(); showToast(`${config.singular} deleted.`); }
                    else {
                        const err = res ? await res.json() : {};
                        showToast(err?.detail ?? 'Cannot delete — may be referenced by other records.', 'error');
                    }
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const Icon        = config.icon;
    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Master Data',    href: '/admin/master-data/energy-supply' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title={config.title}>
            <div className="space-y-5 max-w-7xl mx-auto">

                {/* ── Banner ──────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1a4a3a 0%,#256648 55%,#1c7a4e 100%)' }}>
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20
                                flex items-center justify-center flex-shrink-0">
                                {Icon && <Icon className="h-6 w-6 text-white" />}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-300/80 mb-0.5">Master Data</p>
                                <h1 className="text-lg font-bold text-white truncate">{config.title}</h1>
                                <p className="text-xs text-white/60 mt-0.5 truncate">{config.description}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {[
                                { label: 'Total',    val: stats.total,    bg: 'bg-white/10',          text: 'text-white' },
                                { label: 'Active',   val: stats.active,   bg: 'bg-emerald-500/20',    text: 'text-emerald-300' },
                                { label: 'Inactive', val: stats.inactive, bg: 'bg-slate-900/20',      text: 'text-slate-300' },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} border border-white/10 rounded-xl px-3.5 py-2.5 text-center min-w-[58px]`}>
                                    <p className={`text-xl font-extrabold leading-none ${s.text}`}>{s.val}</p>
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50 mt-1">{s.label}</p>
                                </div>
                            ))}
                            <button onClick={() => setModal({ mode: 'create', item: null })}
                                className="flex items-center gap-2 ml-2 px-4 py-2.5 rounded-xl
                                    bg-white hover:bg-emerald-50 text-slate-800
                                    text-sm font-bold transition-colors shadow-sm">
                                <Plus className="h-4 w-4" /> Add {config.singular}
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Table card ──────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder={`Search ${config.title.toLowerCase()}…`}
                                className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-600
                                    bg-slate-50 dark:bg-slate-700/60 pl-8 pr-7 text-sm
                                    text-slate-700 dark:text-slate-200 placeholder:text-slate-400
                                    focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                            {search && (
                                <button onClick={() => setSearch('')}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
                            {[{ val: '', label: 'All' }, { val: 'active', label: 'Active' }, { val: 'inactive', label: 'Inactive' }].map(f => (
                                <button key={f.val} onClick={() => setFilter(f.val)}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all
                                        ${filter === f.val
                                            ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <button onClick={load} title="Refresh"
                            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-600
                                bg-slate-50 dark:bg-slate-700/60 flex items-center justify-center
                                text-slate-400 hover:text-primary-600 hover:border-primary-300 transition-colors">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {!loading && (
                            <p className="text-xs text-slate-400 ml-auto">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{total}</span> records
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                            <p className="text-sm">Loading…</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                {Icon && <Icon className="h-7 w-7 text-slate-300 dark:text-slate-500" />}
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-slate-600 dark:text-slate-300">
                                    {search ? 'No results match your search' : `No ${config.title.toLowerCase()} yet`}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {search ? 'Try different keywords' : `Add your first ${config.singular.toLowerCase()} to get started`}
                                </p>
                            </div>
                            {!search && (
                                <button onClick={() => setModal({ mode: 'create', item: null })}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl
                                        bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold">
                                    <Plus className="h-4 w-4" /> Add {config.singular}
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/20">
                                        {config.columns.map(col => (
                                            <th key={col.key}
                                                className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap"
                                                style={col.width ? { width: col.width } : {}}>
                                                {col.label}
                                            </th>
                                        ))}
                                        <th className="px-5 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                                    {items.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors group">
                                            {config.columns.map(col => (
                                                <td key={col.key} className="px-5 py-3.5"><Cell col={col} item={item} /></td>
                                            ))}
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => setModal({ mode: 'edit', item })}
                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                            bg-slate-100 dark:bg-slate-700
                                                            hover:bg-primary-50 dark:hover:bg-primary-900/20
                                                            text-slate-500 hover:text-primary-600 dark:hover:text-primary-400
                                                            text-xs font-semibold transition-colors">
                                                        <Edit3 className="h-3.5 w-3.5" /> Edit
                                                    </button>
                                                    {item.is_active ? (
                                                        <button onClick={() => handleToggle(item)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                bg-slate-100 dark:bg-slate-700
                                                                hover:bg-amber-50 dark:hover:bg-amber-900/20
                                                                text-slate-400 hover:text-amber-600 dark:hover:text-amber-400
                                                                text-xs font-semibold transition-colors">
                                                            <ToggleRight className="h-3.5 w-3.5" /> Deactivate
                                                        </button>
                                                    ) : (
                                                        <button onClick={() => handleToggle(item)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                bg-emerald-50 dark:bg-emerald-900/20
                                                                text-emerald-600 dark:text-emerald-400
                                                                hover:bg-emerald-100 text-xs font-semibold transition-colors">
                                                            <ToggleLeft className="h-3.5 w-3.5" /> Activate
                                                        </button>
                                                    )}
                                                    {!item.is_active && (
                                                        <button onClick={() => handleDelete(item)}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                bg-slate-100 dark:bg-slate-700
                                                                hover:bg-rose-50 dark:hover:bg-rose-900/20
                                                                text-slate-400 hover:text-rose-500 dark:hover:text-rose-400
                                                                text-xs font-semibold transition-colors">
                                                            <Trash2 className="h-3.5 w-3.5" /> Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Pagination */}
                    {!loading && totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3
                            border-t border-slate-100 dark:border-slate-700 bg-slate-50/40 dark:bg-slate-700/10">
                            <p className="text-xs text-slate-500">
                                Page <span className="font-bold text-slate-700 dark:text-slate-200">{page}</span> of {totalPages}
                                <span className="mx-2 text-slate-300">·</span>
                                <span className="font-semibold">{total}</span> total
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                    if (p > totalPages) return null;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors
                                                ${page === p ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                            {p}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {modal && (
                <MasterModal config={config} mode={modal.mode} item={modal.item}
                    onClose={() => setModal(null)}
                    onSaved={action => { setModal(null); load(); showToast(`${config.singular} ${action} successfully!`); }}
                    apiCache={apiCache} />
            )}
            {confirm && (
                <ConfirmModal title={confirm.title} message={confirm.message}
                    confirmLabel={confirm.confirmLabel} confirmClass={confirm.confirmClass}
                    onConfirm={confirm.onConfirm} onCancel={() => setConfirm(null)}
                    loading={confirmLoading} />
            )}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}