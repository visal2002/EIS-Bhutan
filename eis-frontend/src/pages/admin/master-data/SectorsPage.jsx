// src/pages/admin/master-data/SectorsPage.jsx
// Dedicated Sectors page with:
//   • Tree view  — top-level sectors expanded to show child sub-sectors
//   • Flat view  — normal table (toggle between views)
//   • Add modal  — parent sector dropdown pre-populated
//   • Edit modal — inline, parent shown clearly
import { useState, useEffect, useCallback } from 'react';
import {
    Search, Plus, Edit3, Trash2, X, Save, RefreshCw,
    ToggleLeft, ToggleRight, AlertTriangle,
    ChevronRight, ChevronDown, LayoutGrid,
    List, Network, ChevronLeft,
} from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { apiFetch } from '../../../services/api';
import {
    Toast, ConfirmModal, StatusBadge,
    MasterModal, inputCls, FieldWrap, FormField,
} from './MasterDataEngine';

const API      = '/master-data/sectors/';
const DROP_API = '/master-data/sectors/dropdown/';

const SECTOR_CONFIG = {
    title:    'Sectors',
    singular: 'Sector',
    icon:     LayoutGrid,
    api:      API,
    nameKey:  'sector_name',
    fields: [
        { key: 'sector_code', label: 'Sector Code', type: 'code', placeholder: 'e.g. ELEC', required: true, half: true },
        { key: 'sector_name', label: 'Sector Name', placeholder: 'e.g. Electricity', required: true, half: true },
        {
            key: 'parent_sector', label: 'Parent Sector', type: 'api-select',
            apiUrl: DROP_API, apiLabel: 'sector_name', apiValue: 'id',
            hint: 'Leave blank to create a top-level sector',
        },
    ],
};

// ═══════════════════════════════════════════════════════════════════
// BUILD TREE from flat list
// Returns array of top-level sectors, each with .children[]
// ═══════════════════════════════════════════════════════════════════
function buildTree(items) {
    const map = {};
    items.forEach(i => { map[i.id] = { ...i, children: [] }; });
    const roots = [];
    items.forEach(i => {
        if (i.parent_sector && map[i.parent_sector]) {
            map[i.parent_sector].children.push(map[i.id]);
        } else {
            roots.push(map[i.id]);
        }
    });
    return roots;
}

// ═══════════════════════════════════════════════════════════════════
// SECTOR ROW (recursive — renders parent + all children indented)
// ═══════════════════════════════════════════════════════════════════
function SectorRow({ node, depth = 0, onEdit, onToggle, onDelete }) {
    const [open, setOpen] = useState(depth === 0);
    const hasChildren     = node.children?.length > 0;

    return (
        <>
            <tr className={`transition-colors ${depth === 0 ? 'bg-white dark:bg-slate-800 hover:bg-slate-50/60 dark:hover:bg-slate-700/20' : 'bg-slate-50/40 dark:bg-slate-800/50 hover:bg-slate-100/60 dark:hover:bg-slate-700/30'}`}>

                {/* Expand + Name */}
                <td className="px-4 py-3">
                    <div className="flex items-center" style={{ paddingLeft: `${depth * 24}px` }}>
                        {/* Expand toggle */}
                        <button
                            onClick={() => setOpen(v => !v)}
                            disabled={!hasChildren}
                            className={`h-6 w-6 rounded-md flex items-center justify-center flex-shrink-0 mr-2 transition-colors
                                ${hasChildren
                                    ? 'text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 cursor-pointer'
                                    : 'text-transparent cursor-default'}`}>
                            {hasChildren
                                ? open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />
                                : <span className="h-3.5 w-3.5" />}
                        </button>

                        {/* Tree connector line for children */}
                        {depth > 0 && (
                            <span className="mr-2 text-slate-300 dark:text-slate-600 flex-shrink-0 text-xs font-mono">└─</span>
                        )}

                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <span className={`font-semibold truncate ${depth === 0 ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300 text-sm'}`}>
                                    {node.sector_name}
                                </span>
                                {hasChildren && (
                                    <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                        {node.children.length} sub
                                    </span>
                                )}
                            </div>
                            {node.parent_sector_name && depth === 0 && (
                                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">
                                    Parent: {node.parent_sector_name}
                                </p>
                            )}
                        </div>
                    </div>
                </td>

                {/* Code */}
                <td className="px-4 py-3">
                    <span className="font-mono text-[11px] font-bold tracking-widest
                        bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300
                        px-2.5 py-1 rounded-lg">
                        {node.sector_code}
                    </span>
                </td>

                {/* Parent */}
                <td className="px-4 py-3">
                    {node.parent_sector_name ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 flex-shrink-0" />
                            {node.parent_sector_name}
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold
                            text-primary-600 dark:text-primary-400
                            bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">
                            Top level
                        </span>
                    )}
                </td>

                {/* Sub-sectors count */}
                <td className="px-4 py-3 text-center">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                        ${hasChildren
                            ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                            : 'text-slate-300 dark:text-slate-600'}`}>
                        {node.sub_sector_count ?? 0}
                    </span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                    <StatusBadge active={node.is_active} />
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => onEdit(node)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                bg-slate-100 dark:bg-slate-700
                                hover:bg-primary-50 dark:hover:bg-primary-900/20
                                text-slate-500 hover:text-primary-600 dark:hover:text-primary-400
                                text-xs font-semibold transition-colors">
                            <Edit3 className="h-3.5 w-3.5" /> Edit
                        </button>
                        {node.is_active ? (
                            <button onClick={() => onToggle(node)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                    bg-slate-100 dark:bg-slate-700
                                    hover:bg-amber-50 dark:hover:bg-amber-900/20
                                    text-slate-400 hover:text-amber-600 dark:hover:text-amber-400
                                    text-xs font-semibold transition-colors">
                                <ToggleRight className="h-3.5 w-3.5" /> Deactivate
                            </button>
                        ) : (
                            <button onClick={() => onToggle(node)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                    bg-emerald-50 dark:bg-emerald-900/20
                                    text-emerald-600 dark:text-emerald-400
                                    hover:bg-emerald-100 text-xs font-semibold transition-colors">
                                <ToggleLeft className="h-3.5 w-3.5" /> Activate
                            </button>
                        )}
                        {!node.is_active && (
                            <button onClick={() => onDelete(node)}
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

            {/* Render children when open */}
            {open && hasChildren && node.children.map(child => (
                <SectorRow key={child.id} node={child} depth={depth + 1}
                    onEdit={onEdit} onToggle={onToggle} onDelete={onDelete} />
            ))}
        </>
    );
}

// ═══════════════════════════════════════════════════════════════════
// SECTORS PAGE
// ═══════════════════════════════════════════════════════════════════
export default function SectorsPage() {
    const [allItems,       setAllItems]       = useState([]);
    const [items,          setItems]          = useState([]);
    const [total,          setTotal]          = useState(0);
    const [stats,          setStats]          = useState({ total: 0, active: 0, inactive: 0 });
    const [loading,        setLoading]        = useState(true);
    const [search,         setSearch]         = useState('');
    const [filter,         setFilter]         = useState('');
    const [viewMode,       setViewMode]       = useState('tree');   // 'tree' | 'flat'
    const [page,           setPage]           = useState(1);
    const [modal,          setModal]          = useState(null);
    const [confirm,        setConfirm]        = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [toast,          setToast]          = useState(null);
    const [apiCache,       setApiCache]       = useState({});

    const PAGE_SIZE  = 20;
    const showToast  = (msg, type = 'success') => setToast({ msg, type });

    // Pre-fetch dropdown for modal
    useEffect(() => {
        apiFetch(DROP_API).then(async r => {
            if (!r?.ok) return;
            const data = await r.json();
            setApiCache({ [DROP_API]: Array.isArray(data) ? data : data.results ?? [] });
        });
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            // Always fetch ALL for tree view (we need the full hierarchy)
            const params = new URLSearchParams({ page_size: 1000 });
            if (filter === 'active')   params.set('is_active', 'true');
            if (filter === 'inactive') params.set('is_active', 'false');
            const res  = await apiFetch(`${API}?${params}`);
            if (!res?.ok) return;
            const data = await res.json();
            const all  = Array.isArray(data) ? data : data.results ?? [];
            setAllItems(all);
            setStats({ total: all.length, active: all.filter(i => i.is_active).length, inactive: all.filter(i => !i.is_active).length });

            // Apply search filter on client side
            const searched = search
                ? all.filter(i =>
                    i.sector_name.toLowerCase().includes(search.toLowerCase()) ||
                    i.sector_code.toLowerCase().includes(search.toLowerCase()) ||
                    (i.parent_sector_name || '').toLowerCase().includes(search.toLowerCase()))
                : all;
            setItems(searched);
            setTotal(searched.length);
        } finally { setLoading(false); }
    }, [search, filter]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { setPage(1); }, [search, filter]);

    const tree       = buildTree(allItems);
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const flatPage   = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const handleToggle = item => {
        const activate = !item.is_active;
        setConfirm({
            title:        `${activate ? 'Activate' : 'Deactivate'} "${item.sector_name}"?`,
            message:      activate
                ? `"${item.sector_name}" will appear in all data collection forms.`
                : `"${item.sector_name}" will be hidden from forms. Existing records are not affected.`,
            confirmLabel: activate ? 'Activate' : 'Deactivate',
            confirmClass: activate ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-500 hover:bg-amber-600',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`${API}${item.id}/`, { method: 'PATCH', body: JSON.stringify({ is_active: activate }) });
                    if (res?.ok) { load(); showToast(`Sector ${activate ? 'activated' : 'deactivated'}!`); }
                    else showToast('Failed to update status.', 'error');
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const handleDelete = item => {
        setConfirm({
            title:        `Permanently delete "${item.sector_name}"?`,
            message:      item.sub_sector_count > 0
                ? `This sector has ${item.sub_sector_count} sub-sector(s). You must delete or re-assign them first.`
                : `This will permanently remove "${item.sector_name}" from the database. This cannot be undone.`,
            confirmLabel: 'Delete Forever',
            confirmClass: 'bg-rose-600 hover:bg-rose-700',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`${API}${item.id}/?hard=1`, { method: 'DELETE' });
                    if (res?.ok || res?.status === 204) { load(); showToast('Sector deleted.'); }
                    else {
                        const err = res ? await res.json() : {};
                        showToast(err?.detail ?? 'Cannot delete — may be referenced by other records.', 'error');
                    }
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Master Data',    href: '/admin/master-data/energy-supply' },
    ];

    // Filtered tree: if searching, show flat (tree doesn't make sense for search results)
    const useTree  = viewMode === 'tree' && !search;
    const treeData = useTree ? buildTree(items) : [];

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="Sectors">
            <div className="space-y-5 max-w-7xl mx-auto">

                {/* ── Banner ──────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1a4a3a 0%,#256648 55%,#1c7a4e 100%)' }}>
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <LayoutGrid className="h-6 w-6 text-white" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-emerald-300/80 mb-0.5">Master Data</p>
                                <h1 className="text-lg font-bold text-white">Sectors</h1>
                                <p className="text-xs text-white/60 mt-0.5">Energy sectors and sub-sectors for data classification</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {[
                                { label: 'Total',    val: stats.total,    bg: 'bg-white/10',       text: 'text-white' },
                                { label: 'Active',   val: stats.active,   bg: 'bg-emerald-500/20', text: 'text-emerald-300' },
                                { label: 'Inactive', val: stats.inactive, bg: 'bg-slate-900/20',   text: 'text-slate-300' },
                            ].map(s => (
                                <div key={s.label} className={`${s.bg} border border-white/10 rounded-xl px-3.5 py-2.5 text-center min-w-[58px]`}>
                                    <p className={`text-xl font-extrabold leading-none ${s.text}`}>{s.val}</p>
                                    <p className="text-[9px] font-semibold uppercase tracking-widest text-white/50 mt-1">{s.label}</p>
                                </div>
                            ))}
                            <button onClick={() => setModal({ mode: 'create', item: null })}
                                className="flex items-center gap-2 ml-2 px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 text-slate-800 text-sm font-bold transition-colors shadow-sm">
                                <Plus className="h-4 w-4" /> Add Sector
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── Table card ──────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">

                    {/* Toolbar */}
                    <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-slate-700">
                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px] max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                placeholder="Search sectors…"
                                className="h-8 w-full rounded-lg border border-slate-200 dark:border-slate-600
                                    bg-slate-50 dark:bg-slate-700/60 pl-8 pr-7 text-sm
                                    text-slate-700 dark:text-slate-200 placeholder:text-slate-400
                                    focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20" />
                            {search && (
                                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    <X className="h-3 w-3" />
                                </button>
                            )}
                        </div>

                        {/* Filter */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
                            {[{ val: '', label: 'All' }, { val: 'active', label: 'Active' }, { val: 'inactive', label: 'Inactive' }].map(f => (
                                <button key={f.val} onClick={() => setFilter(f.val)}
                                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-all
                                        ${filter === f.val ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* View toggle */}
                        <div className="flex items-center bg-slate-100 dark:bg-slate-700/60 rounded-lg p-0.5">
                            <button onClick={() => setViewMode('tree')}
                                title="Tree view"
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all
                                    ${viewMode === 'tree' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <Network className="h-3.5 w-3.5" /> Tree
                            </button>
                            <button onClick={() => setViewMode('flat')}
                                title="List view"
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all
                                    ${viewMode === 'flat' ? 'bg-white dark:bg-slate-600 text-primary-600 dark:text-primary-400 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                                <List className="h-3.5 w-3.5" /> List
                            </button>
                        </div>

                        <button onClick={load} title="Refresh"
                            className="h-8 w-8 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/60 flex items-center justify-center text-slate-400 hover:text-primary-600 hover:border-primary-300 transition-colors">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
                        </button>

                        {!loading && (
                            <p className="text-xs text-slate-400 ml-auto">
                                <span className="font-semibold text-slate-600 dark:text-slate-300">{total}</span> sectors
                                {search && <span className="ml-1">(filtered)</span>}
                            </p>
                        )}
                    </div>

                    {/* Content */}
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
                            <div className="h-7 w-7 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                            <p className="text-sm">Loading sectors…</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                <LayoutGrid className="h-7 w-7 text-slate-300 dark:text-slate-500" />
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-slate-600 dark:text-slate-300">
                                    {search ? 'No sectors match your search' : 'No sectors yet'}
                                </p>
                                <p className="text-sm text-slate-400 mt-1">
                                    {search ? 'Try different keywords' : 'Add your first sector to get started'}
                                </p>
                            </div>
                            {!search && (
                                <button onClick={() => setModal({ mode: 'create', item: null })}
                                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold">
                                    <Plus className="h-4 w-4" /> Add Sector
                                </button>
                            )}
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/20">
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sector Name</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">Code</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Parent Sector</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center w-24">Sub-sectors</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-28">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-700/40">
                                    {useTree
                                        ? treeData.map(node => (
                                            <SectorRow key={node.id} node={node} depth={0}
                                                onEdit={item => setModal({ mode: 'edit', item })}
                                                onToggle={handleToggle}
                                                onDelete={handleDelete} />
                                        ))
                                        : flatPage.map(item => (
                                            <tr key={item.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-slate-800 dark:text-slate-100">{item.sector_name}</span>
                                                        {item.sub_sector_count > 0 && (
                                                            <span className="text-[10px] font-bold bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full">
                                                                {item.sub_sector_count} sub
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="font-mono text-[11px] font-bold tracking-widest bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg">
                                                        {item.sector_code}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {item.parent_sector_name
                                                        ? <span className="text-xs text-slate-500 dark:text-slate-400">{item.parent_sector_name}</span>
                                                        : <span className="text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full border border-primary-200 dark:border-primary-800">Top level</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${item.sub_sector_count > 0 ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600'}`}>
                                                        {item.sub_sector_count ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5"><StatusBadge active={item.is_active} /></td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button onClick={() => setModal({ mode: 'edit', item })}
                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 text-slate-500 hover:text-primary-600 text-xs font-semibold transition-colors">
                                                            <Edit3 className="h-3.5 w-3.5" /> Edit
                                                        </button>
                                                        {item.is_active
                                                            ? <button onClick={() => handleToggle(item)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-amber-50 text-slate-400 hover:text-amber-600 text-xs font-semibold transition-colors"><ToggleRight className="h-3.5 w-3.5" /> Deactivate</button>
                                                            : <button onClick={() => handleToggle(item)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 text-xs font-semibold transition-colors"><ToggleLeft className="h-3.5 w-3.5" /> Activate</button>}
                                                        {!item.is_active && (
                                                            <button onClick={() => handleDelete(item)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-rose-50 text-slate-400 hover:text-rose-500 text-xs font-semibold transition-colors">
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

                    {/* Pagination (flat view only) */}
                    {!loading && !useTree && totalPages > 1 && (
                        <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/40">
                            <p className="text-xs text-slate-500">
                                Page <span className="font-bold">{page}</span> of {totalPages}
                                <span className="mx-2 text-slate-300">·</span>
                                <span className="font-semibold">{total}</span> total
                            </p>
                            <div className="flex items-center gap-1">
                                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                                </button>
                                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                    const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                    if (p > totalPages) return null;
                                    return (
                                        <button key={p} onClick={() => setPage(p)}
                                            className={`w-8 h-8 rounded-lg text-xs font-semibold ${page === p ? 'bg-primary-600 text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                                            {p}
                                        </button>
                                    );
                                })}
                                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed">
                                    Next <ChevronRight className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {modal && (
                <MasterModal config={SECTOR_CONFIG} mode={modal.mode} item={modal.item}
                    onClose={() => setModal(null)}
                    onSaved={action => {
                        setModal(null);
                        load();
                        // Refresh dropdown cache so new sector appears in parent list immediately
                        apiFetch(DROP_API).then(async r => {
                            if (!r?.ok) return;
                            const data = await r.json();
                            setApiCache({ [DROP_API]: Array.isArray(data) ? data : data.results ?? [] });
                        });
                        showToast(`Sector ${action} successfully!`);
                    }}
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