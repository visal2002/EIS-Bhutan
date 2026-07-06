// src/pages/admin/data-collection/electricity/ElectricityPage.jsx
// 3 tabs: Consumption | Generation | Import/Export
// Every data tab has: Add · Edit · Delete · Import CSV · API Fetch · Download Template · Export CSV

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Zap, Plus, Edit3, Trash2, X, Save, RefreshCw, Upload, Download,
    ChevronLeft, ChevronRight, Search, CheckCircle2, AlertTriangle,
    BarChart3, ArrowUpDown, ArrowRight, Wifi, FileText,
} from 'lucide-react';
import DashboardLayout from '../../../../components/layout/DashboardLayout';
import { apiFetch } from '../../../../services/api';
import { useNavigate } from 'react-router-dom';
import { ElectricityImportEngine, ElectricityAPIFetch } from './ElectricityEngine';

// ── Constants ────────────────────────────────────────────────────
const PAGE_SIZE  = 20;
const MONTHS     = ['','January','February','March','April','May','June',
                   'July','August','September','October','November','December'];
const CURR_YEAR  = new Date().getFullYear();
const TABS = [
    { key: 'consumption',   label: 'Consumption',     icon: BarChart3   },
    { key: 'generation',    label: 'Generation',       icon: Zap         },
    { key: 'import_export', label: 'Import / Export',  icon: ArrowUpDown },
];

// ── Shared helpers ───────────────────────────────────────────────
const ic = err =>
    `w-full h-9 px-3 rounded-lg border text-sm bg-white dark:bg-slate-700
     text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2
     focus:ring-primary-500/20 transition-colors
     ${err ? 'border-rose-400' : 'border-slate-200 dark:border-slate-600 focus:border-primary-400'}`;

function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
    const bg   = type === 'error' ? 'bg-rose-600' : 'bg-emerald-600';
    const Icon = type === 'error' ? AlertTriangle : CheckCircle2;
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3
            px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold text-white ${bg} max-w-sm`}>
            <Icon className="h-4 w-4 flex-shrink-0" /><span>{message}</span>
        </div>
    );
}

function Pagination({ page, total, pageSize, onPage }) {
    const pages = Math.max(1, Math.ceil(total / pageSize));
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-3
            border-t border-slate-100 dark:border-slate-700
            bg-slate-50/60 dark:bg-slate-800/40">
            <p className="text-xs text-slate-500">
                {Math.min((page-1)*pageSize+1,total)}–{Math.min(page*pageSize,total)} of {total}
            </p>
            <div className="flex items-center gap-1">
                <button onClick={() => onPage(p => p-1)} disabled={page===1}
                    className="h-7 w-7 rounded flex items-center justify-center
                        text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700
                        disabled:opacity-30 transition-colors">
                    <ChevronLeft className="h-3.5 w-3.5" /></button>
                <span className="text-xs text-slate-600 px-2">{page}/{pages}</span>
                <button onClick={() => onPage(p => p+1)} disabled={page===pages}
                    className="h-7 w-7 rounded flex items-center justify-center
                        text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700
                        disabled:opacity-30 transition-colors">
                    <ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
        </div>
    );
}

function YearSelect({ value, onChange, className, all }) {
    const [years, setYears] = useState([]);
    useEffect(() => {
        apiFetch('/master-data/settings/years/dropdown/').then(async r => {
            if (r?.ok) setYears(await r.json());
        });
    }, []);
    return (
        <select value={value} onChange={onChange}
            className={className || `h-9 rounded-lg border border-slate-200 dark:border-slate-600
                bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200
                focus:outline-none w-28`}>
            {all ? <option value="">All years</option> : <option value="">Year…</option>}
            {years.map(y => <option key={y.id} value={y.year}>{y.year}</option>)}
        </select>
    );
}

function MonthSelect({ value, onChange, className }) {
    return (
        <select value={value} onChange={onChange} className={className || ic()}>
            <option value="">Annual (no month)</option>
            {MONTHS.slice(1).map((m,i) => <option key={i+1} value={i+1}>{m}</option>)}
        </select>
    );
}

function MultiSelect({ value = [], options = [], onChange, label = 'Select sources…' }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    useEffect(() => {
        const handleClick = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const toggle = id => {
        const next = value.includes(id) ? value.filter(v => v !== id) : [...value, id];
        onChange(next);
    };

    return (
        <div className="relative" ref={ref}>
            <div onClick={() => setOpen(!open)}
                className="min-h-[36px] w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600
                    bg-white dark:bg-slate-700 text-sm cursor-pointer flex flex-wrap gap-1.5 items-center">
                {value.length === 0 ? <span className="text-slate-400">{label}</span> :
                    value.map(id => {
                        const opt = options.find(o => String(o.id) === String(id));
                        return (
                            <span key={id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[11px] font-bold border border-primary-100 dark:border-primary-800">
                                {opt?.source_name || opt?.category_name || id}
                                <X className="h-2.5 w-2.5 hover:text-primary-900 cursor-pointer" onClick={(e) => { e.stopPropagation(); toggle(id); }} />
                            </span>
                        );
                    })
                }
            </div>
            {open && (
                <div className="absolute z-50 w-full mt-1 max-h-60 overflow-y-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl p-2 top-full">
                    {options.map(opt => (
                        <div key={opt.id} onClick={() => toggle(opt.id)}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer">
                            <div className={`h-4 w-4 rounded border flex items-center justify-center transition-colors
                                ${value.includes(opt.id) ? 'bg-primary-600 border-primary-600' : 'border-slate-300 dark:border-slate-500'}`}>
                                {value.includes(opt.id) && <RefreshCw className="h-2.5 w-2.5 text-white animate-pulse" />}
                            </div>
                            <span className="text-sm text-slate-700 dark:text-slate-200">{opt.source_name || opt.category_name}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Shared: Tab Action Bar (same for every tab) ──────────────────
function TabActionBar({ onAdd, onImport, onApiFetch, onTemplate, onExport,
                        loading, onRefresh, total, extraFilters }) {
    return (
        <div className="flex flex-wrap items-center gap-2">
            {extraFilters}
            <button onClick={onRefresh}
                className="h-9 w-9 rounded-lg border border-slate-200 dark:border-slate-600
                    bg-white dark:bg-slate-800 flex items-center justify-center
                    text-slate-400 hover:text-primary-600 transition-colors flex-shrink-0">
                <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {total !== undefined && (
                <span className="text-sm text-slate-500 dark:text-slate-400 hidden sm:block">
                    <span className="font-bold text-slate-700 dark:text-slate-200">{total}</span> records
                </span>
            )}
            <div className="flex-1" />
            {/* API Fetch */}
            <button onClick={onApiFetch}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg
                    border border-violet-200 dark:border-violet-700
                    bg-violet-50 dark:bg-violet-900/20
                    text-xs font-semibold text-violet-700 dark:text-violet-300
                    hover:bg-violet-100 transition-colors">
                <Wifi className="h-3.5 w-3.5" /> API
            </button>
            {/* Import CSV */}
            <button onClick={onImport}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg
                    border border-emerald-200 dark:border-emerald-700
                    bg-emerald-50 dark:bg-emerald-900/20
                    text-xs font-semibold text-emerald-700 dark:text-emerald-300
                    hover:bg-emerald-100 transition-colors">
                <Upload className="h-3.5 w-3.5" /> Import
            </button>
            {/* Template */}
            <button onClick={onTemplate}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg
                    border border-slate-200 dark:border-slate-600
                    bg-white dark:bg-slate-800
                    text-xs font-semibold text-slate-600 dark:text-slate-300
                    hover:border-primary-300 hover:text-primary-600 transition-colors">
                <FileText className="h-3.5 w-3.5" /> Template
            </button>
            {/* Export */}
            <button onClick={onExport}
                className="flex items-center gap-1.5 h-9 px-3 rounded-lg
                    border border-slate-200 dark:border-slate-600
                    bg-white dark:bg-slate-800
                    text-xs font-semibold text-slate-600 dark:text-slate-300
                    hover:border-blue-300 hover:text-blue-600 transition-colors">
                <Download className="h-3.5 w-3.5" /> Export
            </button>
            {/* Add */}
            <button onClick={onAdd}
                className="flex items-center gap-1.5 h-9 px-4 rounded-lg
                    bg-primary-600 hover:bg-primary-700 text-white
                    text-xs font-bold transition-colors shadow-sm">
                <Plus className="h-3.5 w-3.5" /> Add
            </button>
        </div>
    );
}

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

// ══════════════════════════════════════════════════════════════════
// TAB 1: CONSUMPTION
// ══════════════════════════════════════════════════════════════════
const CONSUMPTION_FIELDS = [
    { key: 'year',                      label: 'Year',                      required: true,  type: 'integer' },
    { key: 'month',                     label: 'Month',                     required: false, type: 'month'   },
    { key: 'electricity_category_code', label: 'Electricity Category Code',  required: true,  type: 'text'   },
    { key: 'sector_code',               label: 'Sector Code',               required: false, type: 'text'    },
    { key: 'dzongkhag_code',            label: 'Dzongkhag Code',            required: false, type: 'text'    },
    { key: 'consumption_gwh',           label: 'Consumption GWh',           required: true,  type: 'number'  },
    { key: 'data_source_codes',         label: 'Data Source Codes',         required: false, type: 'text'    },
    { key: 'remarks',                   label: 'Remarks',                   required: false, type: 'text'    },
];

function ConsumptionTab() {
    const [recs, setRecs]   = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage]   = useState(1);
    const [loading, setLoading] = useState(true);
    const [fy, setFY]       = useState(String(CURR_YEAR));
    const [search, setSearch] = useState('');
    const [cats, setCats]   = useState([]);
    const [dzongs, setDzongs] = useState([]);
    const [sources, setSources] = useState([]);
    const [modal, setModal] = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [apiOpen, setApiOpen]   = useState(false);
    const [toast, setToast] = useState(null);
    const show = (m, t='success') => setToast({ msg: m, type: t });

    const [secs, setSecs]   = useState([]);

    useEffect(() => {
        Promise.all([
            apiFetch('/master-data/electricity-categories/dropdown/'),
            apiFetch('/master-data/settings/dzongkhags/dropdown/'),
            apiFetch('/master-data/settings/data-sources/dropdown/'),
            apiFetch('/master-data/sectors/dropdown/'),
        ]).then(async ([r1, r2, r3, r4]) => {
            if (r1?.ok) setCats(await r1.json());
            if (r2?.ok) setDzongs(await r2.json());
            if (r3?.ok) setSources(await r3.json());
            if (r4?.ok) setSecs(await r4.json());
        });
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, page_size: PAGE_SIZE });
            if (fy)     p.set('year', fy);
            if (search) p.set('search', search);
            const res = await apiFetch(`/electricity/consumption/?${p}`);
            const d   = await res.json();
            const arr = Array.isArray(d) ? d : d.results ?? [];
            setRecs(arr);
            setTotal(Array.isArray(d) ? arr.length : d.count ?? arr.length);
        } finally { setLoading(false); }
    }, [page, fy, search]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [fy, search]);

    const del = async id => {
        if (!confirm('Delete this record?')) return;
        await apiFetch(`/electricity/consumption/${id}/`, { method: 'DELETE' });
        load(); show('Record deleted.');
    };

    const downloadTemplate = () => {
        const headers = CONSUMPTION_FIELDS.map(f => f.key);
        const example = '2022,,LV-UR,,182.1258,BPC-ANN,BPC Annual Report 2022';
        const csv = [headers.join(','), example, '# Delete this comment row'].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'electricity-consumption-template.csv';
        a.click();
    };

    const doExport = () => {
        exportCSV(recs,
            ['year','month','electricity_category_name','sector_name','dzongkhag_name','consumption_gwh','data_source_names'],
            `electricity-consumption-${fy||'all'}.csv`
        );
    };

    const vBadge = t => ({
        LV:      'bg-blue-50 text-blue-700 border-blue-200',
        LV_BULK: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        MV:      'bg-violet-50 text-violet-700 border-violet-200',
        HV:      'bg-rose-50 text-rose-700 border-rose-200',
    }[t] || 'bg-slate-50 text-slate-600 border-slate-200');

    return (
        <div className="space-y-4">
            <TabActionBar
                loading={loading}
                total={total}
                onRefresh={load}
                onAdd={() => setModal({ mode: 'create', item: null })}
                onImport={() => setImportOpen(true)}
                onApiFetch={() => setApiOpen(true)}
                onTemplate={downloadTemplate}
                onExport={doExport}
                extraFilters={<>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search…"
                            className="h-9 pl-8 pr-3 rounded-lg border border-slate-200 dark:border-slate-600
                                bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200
                                focus:outline-none focus:ring-2 focus:ring-primary-500/20 w-40" />
                    </div>
                    <YearSelect value={fy} onChange={e => setFY(e.target.value)} all />
                </>}
            />

            <div className="bg-white dark:bg-slate-800 rounded-2xl border
                border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                            <tr>{['Year','Month','Electricity Category','Sector','Dzongkhag','GWh','Sources',''].map(h => (
                                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                            {loading ? (
                                <tr><td colSpan={8} className="px-4 py-16 text-center">
                                    <RefreshCw className="h-5 w-5 animate-spin text-slate-300 mx-auto" /></td></tr>
                            ) : recs.length === 0 ? (
                                <tr><td colSpan={8} className="px-4 py-16 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <BarChart3 className="h-10 w-10 text-slate-200 dark:text-slate-600" />
                                        <p className="text-slate-400 font-medium">No records for {fy || 'any year'}</p>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setImportOpen(true)}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-emerald-300 text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors">
                                                <Upload className="h-3.5 w-3.5" /> Import CSV</button>
                                            <button onClick={() => setModal({ mode: 'create', item: null })}
                                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold">
                                                <Plus className="h-3.5 w-3.5" /> Add Manually</button>
                                        </div>
                                    </div>
                                </td></tr>
                            ) : recs.map((r, i) => (
                                <tr key={r.id} className={`transition-colors hover:bg-primary-50/20 dark:hover:bg-primary-900/10 ${i%2===0?'':'bg-slate-50/30 dark:bg-slate-700/10'}`}>
                                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{r.year}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.month ? MONTHS[r.month] : '—'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 text-xs">{r.electricity_category_name}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.sector_name || '—'}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.dzongkhag_name || 'National'}</td>
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100">
                                        {parseFloat(r.consumption_gwh).toFixed(4)}<span className="text-slate-400 font-normal text-xs ml-1">GWh</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                            {(r.data_source_names || r.data_source).split(',').map((s, idx) => (
                                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 whitespace-nowrap">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1">
                                            <button onClick={() => setModal({ mode: 'edit', item: r })}
                                                className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors">
                                                <Edit3 className="h-3.5 w-3.5" /></button>
                                            <button onClick={() => del(r.id)}
                                                className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                                <Trash2 className="h-3.5 w-3.5" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
            </div>

            {modal && <ConsumptionModal mode={modal.mode} item={modal.item}
                cats={cats} dzongs={dzongs} sources={sources} secs={secs}
                onClose={() => setModal(null)}
                onSaved={() => { setModal(null); load(); show('Record saved!'); }} />}

            {importOpen && (
                <ElectricityImportEngine
                    config={{
                        title: 'BPC Consumption Data',
                        apiPath: '/api/electricity/consumption/bulk-import/',
                        templateHeaders: CONSUMPTION_FIELDS.map(f => f.key),
                        templateExample: '2022,,LV-UR,DOM-GEN,,182.1258,BPC-ANN,BPC Annual Report 2022',
                        fields: CONSUMPTION_FIELDS,
                    }}
                    onClose={() => setImportOpen(false)}
                    onComplete={() => { setImportOpen(false); load(); show('Import completed!'); }}
                />
            )}
            {apiOpen && <ElectricityAPIFetch title="BPC Consumption"
                yearValue={fy} onClose={() => setApiOpen(false)} />}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}

function ConsumptionModal({ mode, item, cats, dzongs, sources, secs, onClose, onSaved }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState(isEdit ? {
        year: String(item.year), month: item.month ? String(item.month) : '',
        electricity_category: String(item.electricity_category),
        sector: item.sector ? String(item.sector) : '',
        dzongkhag: item.dzongkhag ? String(item.dzongkhag) : '',
        consumption_gwh: String(item.consumption_gwh),
        data_sources: item.data_sources || [],
        remarks: item.remarks || '',
    } : { year: String(CURR_YEAR), month: '', electricity_category: '', sector: '', dzongkhag: '',
          consumption_gwh: '', data_sources: [], remarks: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const tiers = ['LV','LV_BULK','MV','HV'];
    const tLabel = { LV:'Low Voltage (LV)', LV_BULK:'LV Bulk', MV:'Medium Voltage (MV)', HV:'High Voltage (HV)' };

    const save = async () => {
        const e = {};
        try {
            const payload = {
                year: parseInt(form.year), month: form.month ? parseInt(form.month) : null,
                electricity_category: parseInt(form.electricity_category),
                sector: form.sector ? parseInt(form.sector) : null,
                dzongkhag: form.dzongkhag ? parseInt(form.dzongkhag) : null,
                consumption_gwh: parseFloat(form.consumption_gwh),
                data_sources: form.data_sources,
                remarks: form.remarks,
            };
            const url = isEdit ? `/electricity/consumption/${item.id}/` : '/electricity/consumption/';
            const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
            if (res?.ok) onSaved();
            else { const err = await res.json(); setErrors({ _g: err.detail || JSON.stringify(err) }); }
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-0.5">Consumption Data</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{isEdit?'Edit':'Add'} Record</h3>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="h-4.5 w-4.5" /></button>
                </div>
                <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
                    {errors._g && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-xs text-rose-600 border border-rose-200">{errors._g}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Year *</label>
                            <YearSelect value={form.year} onChange={set('year')} className={ic(errors.year)} />
                            {errors.year && <p className="text-xs text-rose-500 mt-1">{errors.year}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Month</label>
                            <MonthSelect value={form.month} onChange={set('month')} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Electricity Category *</label>
                            <select value={form.electricity_category} onChange={set('electricity_category')} className={ic(errors.electricity_category)}>
                                <option value="">Select category…</option>
                                {cats.map(c => (
                                    <option key={c.id} value={c.id}>{c.category_name}</option>
                                ))}
                            </select>
                            {errors.electricity_category && <p className="text-xs text-rose-500 mt-1">{errors.electricity_category}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sector</label>
                            <select value={form.sector} onChange={set('sector')} className={ic()}>
                                <option value="">Select sector…</option>
                                {secs.map(s => <option key={s.id} value={s.id}>{s.sector_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Dzongkhag</label>
                            <select value={form.dzongkhag} onChange={set('dzongkhag')} className={ic()}>
                                <option value="">National aggregate</option>
                                {dzongs.map(d => <option key={d.id} value={d.id}>{d.dzongkhag_name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Consumption (GWh) *</label>
                            <input type="number" step="any" value={form.consumption_gwh} onChange={set('consumption_gwh')} placeholder="0.000000" className={ic(errors.consumption_gwh)} />
                            {errors.consumption_gwh && <p className="text-xs text-rose-500 mt-1">{errors.consumption_gwh}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data Sources</label>
                        <MultiSelect 
                            value={form.data_sources} 
                            options={sources} 
                            onChange={v => setForm(p => ({ ...p, data_sources: v }))} 
                            label="Select source documents…" 
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
                        <textarea value={form.remarks} onChange={set('remarks')} rows={2} placeholder="Optional notes…"
                            className="w-full px-3 py-2 rounded-lg border text-sm resize-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-400" />
                    </div>
                </div>
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all">Cancel</button>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 2: GENERATION
// ══════════════════════════════════════════════════════════════════
const GENERATION_FIELDS = [
    { key: 'year',                 label: 'Year',                required: true,  type: 'integer' },
    { key: 'month',                label: 'Month',               required: false, type: 'month'   },
    { key: 'plant_code',           label: 'Plant Code',          required: true,  type: 'text'   },
    { key: 'sector_code',          label: 'Sector Code',         required: false, type: 'text'    },
    { key: 'dzongkhag_code',       label: 'Dzongkhag Code',      required: false, type: 'text'    },
    { key: 'generation_gwh',       label: 'Generation GWh',      required: true,  type: 'number'  },
    { key: 'data_source_codes',    label: 'Data Source Codes',   required: false, type: 'text'    },
    { key: 'remarks',              label: 'Remarks',             required: false, type: 'text'    },
];

function GenerationTab() {
    const [recs, setRecs]   = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage]   = useState(1);
    const [loading, setLoading] = useState(true);
    const [fy, setFY]       = useState(String(CURR_YEAR));
    const [plants, setPlants] = useState([]);
    const [sources, setSources] = useState([]);
    const [modal, setModal] = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [apiOpen, setApiOpen]   = useState(false);
    const [toast, setToast] = useState(null);
    const show = (m, t='success') => setToast({ msg: m, type: t });

    const [secs, setSecs]   = useState([]);

    useEffect(() => {
        Promise.all([
            apiFetch('/master-data/settings/generation-plants/dropdown/'),
            apiFetch('/master-data/settings/data-sources/dropdown/'),
            apiFetch('/master-data/sectors/dropdown/'),
        ]).then(async ([r1, r2, r3]) => {
            if (r1?.ok) setPlants(await r1.json());
            if (r2?.ok) setSources(await r2.json());
            if (r3?.ok) setSecs(await r3.json());
        });
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, page_size: PAGE_SIZE });
            if (fy) p.set('year', fy);
            const res = await apiFetch(`/electricity/generation/?${p}`);
            const d   = await res.json();
            const arr = Array.isArray(d) ? d : d.results ?? [];
            setRecs(arr); setTotal(Array.isArray(d) ? arr.length : d.count ?? arr.length);
        } finally { setLoading(false); }
    }, [page, fy]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [fy]);

    const del = async id => {
        if (!confirm('Delete?')) return;
        await apiFetch(`/electricity/generation/${id}/`, { method: 'DELETE' });
        load(); show('Deleted.');
    };

    const downloadTemplate = () => {
        const hdrs = GENERATION_FIELDS.map(f => f.key);
        const csv  = [hdrs.join(','), '2022,1,CHUMEY,231830,DGPC-MON,Jan 2022', '# Delete this row'].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'electricity-generation-template.csv';
        a.click();
    };

    const doExport = () => {
        exportCSV(recs, ['year','month','plant_name','sector_name','plant_type','dzongkhag_name','generation_gwh','data_source_names'],
            `electricity-generation-${fy||'all'}.csv`);
    };

    const sBadge = t => ({
        LARGE_HYDRO: 'bg-blue-50 text-blue-700 border-blue-200',
        SMALL_HYDRO: 'bg-cyan-50 text-cyan-700 border-cyan-200',
        MICRO_HYDRO: 'bg-sky-50 text-sky-700 border-sky-200',
        WIND:        'bg-emerald-50 text-emerald-700 border-emerald-200',
        SOLAR:       'bg-yellow-50 text-yellow-700 border-yellow-200',
        DG_SET:      'bg-orange-50 text-orange-700 border-orange-200',
    }[t] || 'bg-slate-50 text-slate-600 border-slate-200');

    return (
        <div className="space-y-4">
            <TabActionBar
                loading={loading} total={total} onRefresh={load}
                onAdd={() => setModal({ mode: 'create', item: null })}
                onImport={() => setImportOpen(true)}
                onApiFetch={() => setApiOpen(true)}
                onTemplate={downloadTemplate}
                onExport={doExport}
                extraFilters={<YearSelect value={fy} onChange={e => setFY(e.target.value)} all />}
            />
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                            <tr>{['Year','Month','Plant','Sector','Type','Dzongkhag','GWh','Sources',''].map(h => (
                                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                            {loading ? (<tr><td colSpan={9} className="px-4 py-16 text-center"><RefreshCw className="h-5 w-5 animate-spin text-slate-300 mx-auto" /></td></tr>)
                            : recs.length === 0 ? (<tr><td colSpan={9} className="px-4 py-16 text-center text-slate-400">No generation records for {fy||'any year'}</td></tr>)
                            : recs.map((r,i) => (
                                <tr key={r.id} className={`transition-colors hover:bg-primary-50/20 dark:hover:bg-primary-900/10 ${i%2===0?'':'bg-slate-50/30 dark:bg-slate-700/10'}`}>
                                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{r.year}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.month ? MONTHS[r.month] : '—'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 text-xs">{r.plant_name}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.sector_name || '—'}</td>
                                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sBadge(r.plant_source_type)}`}>{r.source_type_display}</span></td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.dzongkhag_name || '—'}</td>
                                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-200">{parseFloat(r.generation_gwh).toFixed(4)}</td>
                                    <td className="px-4 py-3 font-mono text-slate-500 text-xs">{r.generation_gwh_computed?.toFixed(4)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                            {(r.data_source_names || r.data_source).split(',').map((s, idx) => (
                                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 whitespace-nowrap">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-1">
                                        <button onClick={() => setModal({ mode:'edit', item:r })} className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => del(r.id)} className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
            </div>
            {modal && <GenerationModal mode={modal.mode} item={modal.item} plants={plants} sources={sources} secs={secs}
                onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); show('Record saved!'); }} />}
            {importOpen && (
                <ElectricityImportEngine
                    config={{ title:'Generation Data', apiPath:'/api/electricity/generation/bulk-import/',
                        templateHeaders: GENERATION_FIELDS.map(f => f.key),
                        templateExample: '2022,1,CHUMEY,DOM-GEN,,0.2318,DGPC-MON,Jan 2022',
                        fields: GENERATION_FIELDS }}
                    onClose={() => setImportOpen(false)}
                    onComplete={() => { setImportOpen(false); load(); show('Import completed!'); }}
                />
            )}
            {apiOpen && <ElectricityAPIFetch title="Generation Data" yearValue={fy} onClose={() => setApiOpen(false)} />}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}

function GenerationModal({ mode, item, plants, sources, secs, onClose, onSaved }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState(isEdit ? {
        year: String(item.year), month: item.month ? String(item.month) : '',
        plant: String(item.plant), 
        sector: item.sector ? String(item.sector) : '',
        generation_gwh: String(item.generation_gwh),
        data_sources: item.data_sources || [],
        remarks: item.remarks || '',
    } : { year: String(CURR_YEAR), month: '', plant: '', sector: '', generation_gwh: '',
          data_sources: [], remarks: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));
    const stypes = [...new Set(plants.map(p => p.source_type))];

    const save = async () => {
        const e = {};
        if (!form.year) e.year = 'Required';
        if (!form.plant) e.plant = 'Required';
        if (!form.generation_kwh || isNaN(Number(form.generation_kwh))) e.generation_kwh = 'Required';
        setErrors(e); if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const payload = { year: parseInt(form.year), month: form.month ? parseInt(form.month) : null,
                plant: parseInt(form.plant), 
                sector: form.sector ? parseInt(form.sector) : null,
                generation_gwh: parseFloat(form.generation_gwh),
                data_sources: form.data_sources,
                remarks: form.remarks };
            const url = isEdit ? `/electricity/generation/${item.id}/` : '/electricity/generation/';
            const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
            if (res?.ok) onSaved();
            else { const err = await res.json(); setErrors({ _g: err.detail || JSON.stringify(err) }); }
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-xl border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary-600 dark:text-primary-400 mb-0.5">Generation Data</p>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">{isEdit?'Edit':'Add'} Record</h3>
                    </div>
                    <button onClick={onClose} className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"><X className="h-4.5 w-4.5" /></button>
                </div>
                <div className="px-6 py-6 space-y-5 overflow-y-auto flex-1">
                    {errors._g && <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-600 border border-rose-200">{errors._g}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Year *</label>
                            <YearSelect value={form.year} onChange={set('year')} className={ic(errors.year)} /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Month</label>
                            <MonthSelect value={form.month} onChange={set('month')} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Plant *</label>
                            <select value={form.plant} onChange={set('plant')} className={ic(errors.plant)}>
                                <option value="">Select plant…</option>
                                {stypes.map(st => (
                                    <optgroup key={st} label={st.replace(/_/g,' ')}>
                                        {plants.filter(p => p.source_type === st).map(p => (
                                            <option key={p.id} value={p.id}>{p.plant_name}{p.dzongkhag_name ? ` — ${p.dzongkhag_name}` : ''}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>
                            {errors.plant && <p className="text-xs text-rose-500 mt-1">{errors.plant}</p>}
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sector Category</label>
                            <select value={form.sector_category} onChange={set('sector_category')} className={ic()}>
                                <option value="">Select sector cat…</option>
                                {secs.map(s => <option key={s.id} value={s.id}>{s.category_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Generation (GWh) *</label>
                            <input type="number" step="any" value={form.generation_gwh} onChange={set('generation_gwh')} placeholder="0.00" className={ic(errors.generation_gwh)} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data Sources</label>
                            <MultiSelect 
                                value={form.data_sources} 
                                options={sources} 
                                onChange={v => setForm(p => ({ ...p, data_sources: v }))} 
                                label="Select sources…" 
                            />
                        </div>
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
                        <textarea value={form.remarks} onChange={set('remarks')} rows={2}
                            className="w-full px-3 py-2 rounded-lg border text-sm resize-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20" /></div>
                </div>
                <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-900/40 flex justify-end gap-3 rounded-b-3xl">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 transition-all">Cancel</button>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold shadow-lg shadow-primary-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50">
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// TAB 3: IMPORT / EXPORT
// ══════════════════════════════════════════════════════════════════
const IE_FIELDS = [
    { key: 'year',                 label: 'Year',                required: true,  type: 'integer' },
    { key: 'month',                label: 'Month',               required: false, type: 'month'   },
    { key: 'transaction_type',     label: 'Type (IMPORT/EXPORT)',required: true,  type: 'text'    },
    { key: 'country_code',         label: 'Country Code',        required: true,  type: 'text'    },
    { key: 'sector_code',          label: 'Sector Code',         required: false, type: 'text'    },
    { key: 'quantity_gwh',         label: 'Quantity GWh',        required: true,  type: 'number'  },
    { key: 'data_source_codes',    label: 'Data Source Codes',   required: false, type: 'text'    },
    { key: 'remarks',              label: 'Remarks',             required: false, type: 'text'    },
];

function ImportExportTab() {
    const [recs, setRecs]   = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage]   = useState(1);
    const [loading, setLoading] = useState(true);
    const [fy, setFY]       = useState(String(CURR_YEAR));
    const [ft, setFT]       = useState('');
    const [countries, setCountries] = useState([]);
    const [sources, setSources] = useState([]);
    const [modal, setModal] = useState(null);
    const [importOpen, setImportOpen] = useState(false);
    const [apiOpen, setApiOpen]   = useState(false);
    const [toast, setToast] = useState(null);
    const show = (m, t='success') => setToast({ msg: m, type: t });

    const [secs, setSecs]   = useState([]);

    useEffect(() => {
        Promise.all([
            apiFetch('/master-data/settings/countries/dropdown/'),
            apiFetch('/master-data/settings/data-sources/dropdown/'),
            apiFetch('/master-data/electricity-categories/dropdown/'),
        ]).then(async ([r1, r2, r3]) => {
            if (r1?.ok) setCountries(await r1.json());
            if (r2?.ok) setSources(await r2.json());
            if (r3?.ok) setSecs(await r3.json());
        });
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, page_size: PAGE_SIZE });
            if (fy) p.set('year', fy);
            if (ft) p.set('transaction_type', ft);
            const res = await apiFetch(`/electricity/import-export/?${p}`);
            const d   = await res.json();
            const arr = Array.isArray(d) ? d : d.results ?? [];
            setRecs(arr); setTotal(Array.isArray(d) ? arr.length : d.count ?? arr.length);
        } finally { setLoading(false); }
    }, [page, fy, ft]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [fy, ft]);

    const del = async id => {
        if (!confirm('Delete?')) return;
        await apiFetch(`/electricity/import-export/${id}/`, { method: 'DELETE' });
        load(); show('Deleted.');
    };

    const downloadTemplate = () => {
        const hdrs = IE_FIELDS.map(f => f.key);
        const csv  = [hdrs.join(','), '2022,1,IMPORT,IND,94.504836,DGPC-IMP,Jan 2022 DGPC import', '# Delete this row'].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = 'electricity-import-export-template.csv';
        a.click();
    };

    const doExport = () => {
        exportCSV(recs, ['year','month','transaction_type','sector_name','country_name','quantity_gwh','data_source_names'],
            `electricity-import-export-${fy||'all'}.csv`);
    };

    return (
        <div className="space-y-4">
            <TabActionBar
                loading={loading} total={total} onRefresh={load}
                onAdd={() => setModal({ mode: 'create', item: null })}
                onImport={() => setImportOpen(true)}
                onApiFetch={() => setApiOpen(true)}
                onTemplate={downloadTemplate}
                onExport={doExport}
                extraFilters={<>
                    <YearSelect value={fy} onChange={e => setFY(e.target.value)} all />
                    <select value={ft} onChange={e => setFT(e.target.value)}
                        className="h-9 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 text-sm text-slate-700 dark:text-slate-200 focus:outline-none">
                        <option value="">All types</option>
                        <option value="IMPORT">Import</option>
                        <option value="EXPORT">Export</option>
                    </select>
                </>}
            />
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 dark:bg-slate-700/30 border-b border-slate-100 dark:border-slate-700">
                            <tr>{['Year','Month','Type','Sector','Country','GWh','Sources',''].map(h => (
                                <th key={h} className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                            {loading ? (<tr><td colSpan={7} className="px-4 py-16 text-center"><RefreshCw className="h-5 w-5 animate-spin text-slate-300 mx-auto" /></td></tr>)
                            : recs.length === 0 ? (<tr><td colSpan={7} className="px-4 py-16 text-center text-slate-400">No records for {fy||'any year'}</td></tr>)
                            : recs.map((r,i) => (
                                <tr key={r.id} className={`transition-colors hover:bg-primary-50/20 dark:hover:bg-primary-900/10 ${i%2===0?'':'bg-slate-50/30 dark:bg-slate-700/10'}`}>
                                    <td className="px-4 py-3 font-semibold text-slate-700 dark:text-slate-200">{r.year}</td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.month ? MONTHS[r.month] : 'Annual'}</td>
                                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${r.transaction_type==='IMPORT'?'bg-amber-50 text-amber-700 border-amber-200':'bg-blue-50 text-blue-700 border-blue-200'}`}>{r.transaction_display}</span></td>
                                    <td className="px-4 py-3 text-slate-500 text-xs">{r.sector_name || '—'}</td>
                                    <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200 text-xs">{r.country_name}</td>
                                    <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-100">{parseFloat(r.quantity_gwh).toFixed(4)}<span className="text-slate-400 font-normal text-xs ml-1">GWh</span></td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-wrap gap-1 max-w-[120px]">
                                            {(r.data_source_names || r.data_source).split(',').map((s, idx) => (
                                                <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-100 dark:bg-slate-700 text-slate-500 whitespace-nowrap">
                                                    {s.trim()}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3"><div className="flex items-center gap-1">
                                        <button onClick={() => setModal({ mode:'edit', item:r })} className="h-7 w-7 rounded flex items-center justify-center text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => del(r.id)} className="h-7 w-7 rounded flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination page={page} total={total} pageSize={PAGE_SIZE} onPage={setPage} />
            </div>
            {modal && <IEModal mode={modal.mode} item={modal.item} countries={countries} sources={sources} secs={secs}
                onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); show('Record saved!'); }} />}
            {importOpen && (
                <ElectricityImportEngine
                    config={{ title:'Import/Export Data', apiPath:'/api/electricity/import-export/bulk-import/',
                        templateHeaders: IE_FIELDS.map(f => f.key),
                        templateExample: '2022,1,IMPORT,IND,DOM-GEN,94.5048,DGPC-IMP,Jan 2022',
                        fields: IE_FIELDS }}
                    onClose={() => setImportOpen(false)}
                    onComplete={() => { setImportOpen(false); load(); show('Import completed!'); }}
                />
            )}
            {apiOpen && <ElectricityAPIFetch title="Import/Export" yearValue={fy} onClose={() => setApiOpen(false)} />}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </div>
    );
}

function IEModal({ mode, item, countries, sources, secs, onClose, onSaved }) {
    const isEdit = mode === 'edit';
    const [form, setForm] = useState(isEdit ? {
        year: String(item.year), month: item.month ? String(item.month) : '',
        transaction_type: item.transaction_type || 'IMPORT', 
        sector: item.sector ? String(item.sector) : '',
        country: String(item.country),
        quantity_gwh: String(item.quantity_gwh),
        data_sources: item.data_sources || [],
        remarks: item.remarks || '',
    } : { year: String(CURR_YEAR), month: '', transaction_type: 'IMPORT', sector: '', country: '',
          quantity_gwh: '', data_sources: [], remarks: '' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

    const save = async () => {
        const e = {};
        if (!form.year) e.year = 'Required';
        if (!form.country) e.country = 'Required';
        if (!form.quantity_gwh || isNaN(Number(form.quantity_gwh))) e.quantity_gwh = 'Required';
        setErrors(e); if (Object.keys(e).length) return;
        setSaving(true);
        try {
            const payload = { year: parseInt(form.year), month: form.month ? parseInt(form.month) : null,
                transaction_type: form.transaction_type, 
                sector: form.sector ? parseInt(form.sector) : null,
                country: parseInt(form.country),
                quantity_gwh: parseFloat(form.quantity_gwh),
                data_sources: form.data_sources,
                remarks: form.remarks };
            const url = isEdit ? `/electricity/import-export/${item.id}/` : '/electricity/import-export/';
            const res = await apiFetch(url, { method: isEdit ? 'PATCH' : 'POST', body: JSON.stringify(payload) });
            if (res?.ok) onSaved();
            else { const err = await res.json(); setErrors({ _g: err.detail || JSON.stringify(err) }); }
        } finally { setSaving(false); }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                    <h2 className="font-bold text-slate-800 dark:text-slate-100">{isEdit?'Edit':'Add'} Import/Export</h2>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"><X className="h-4 w-4" /></button>
                </div>
                <div className="px-6 py-5 space-y-4">
                    {errors._g && <div className="p-3 rounded-xl bg-rose-50 text-xs text-rose-600 border border-rose-200">{errors._g}</div>}
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Year *</label>
                            <YearSelect value={form.year} onChange={set('year')} className={ic(errors.year)} /></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Month</label>
                            <MonthSelect value={form.month} onChange={set('month')} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Type *</label>
                            <select value={form.transaction_type} onChange={set('transaction_type')} className={ic()}>
                                <option value="IMPORT">Import</option><option value="EXPORT">Export</option>
                            </select></div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Sector</label>
                            <select value={form.sector} onChange={set('sector')} className={ic()}>
                                <option value="">Select sector…</option>
                                {secs.map(s => <option key={s.id} value={s.id}>{s.sector_name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Country *</label>
                            <select value={form.country} onChange={set('country')} className={ic(errors.country)}>
                                <option value="">Select…</option>
                                {countries.map(c => <option key={c.id} value={c.id}>{c.country_name}</option>)}
                            </select>
                            {errors.country && <p className="text-xs text-rose-500 mt-1">{errors.country}</p>}</div>
                        <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Quantity (GWh) *</label>
                            <input type="number" step="any" value={form.quantity_gwh} onChange={set('quantity_gwh')} placeholder="0.000000" className={ic(errors.quantity_gwh)} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Data Sources</label>
                        <MultiSelect 
                            value={form.data_sources} 
                            options={sources} 
                            onChange={v => setForm(p => ({ ...p, data_sources: v }))} 
                            label="Select sources…" 
                        />
                    </div>
                    <div><label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Remarks</label>
                        <textarea value={form.remarks} onChange={set('remarks')} rows={2}
                            className="w-full px-3 py-2 rounded-lg border text-sm resize-none bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600 focus:outline-none focus:ring-2 focus:ring-primary-500/20" /></div>
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/80">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold bg-slate-200 dark:bg-slate-700 text-slate-700 hover:bg-slate-300 transition-colors">Cancel</button>
                    <button onClick={save} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50">
                        {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        {isEdit ? 'Update' : 'Save'}</button>
                </div>
            </div>
        </div>
    );
}


// ══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════
export default function ElectricityPage() {
    const [activeTab, setActive] = useState('consumption');
    const breadcrumbs = [
        { label: 'Administration',  href: '/admin/dashboard' },
        { label: 'Data Collection', href: '/admin/data-collection' },
        { label: 'Electricity' },
    ];
    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="Electricity Data">
            <div className="space-y-5">
                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1a2f4a 0%,#1e4080 55%,#1a5fa8 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-6 w-6 text-blue-300" /></div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-400/80 mb-0.5">Secondary Energy</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">Electricity Data Collection</h1>
                                <p className="text-xs text-white/50 mt-0.5">Grid Consumption · Embedded Generation · Import/Export</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {[{label:'Unit',val:'GWh / kWh'},{label:'Source',val:'BPC / DGPC'},{label:'Frequency',val:'Annual'}].map(s => (
                                <div key={s.label} className="rounded-xl bg-white/8 border border-white/10 px-3 py-2 text-center hidden sm:block">
                                    <p className="text-[9px] text-white/40 font-semibold uppercase tracking-widest mb-0.5">{s.label}</p>
                                    <p className="text-xs font-bold text-white">{s.val}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActive(tab.key)}
                                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap
                                    ${activeTab===tab.key?'border-primary-500 text-primary-600 dark:text-primary-400':'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}>
                                <Icon className="h-4 w-4" />{tab.label}</button>
                        );
                    })}
                </div>

                {/* Content */}
                <div>
                    {activeTab === 'consumption'   && <ConsumptionTab />}
                    {activeTab === 'generation'    && <GenerationTab />}
                    {activeTab === 'import_export' && <ImportExportTab />}
                </div>
            </div>
        </DashboardLayout>
    );
}