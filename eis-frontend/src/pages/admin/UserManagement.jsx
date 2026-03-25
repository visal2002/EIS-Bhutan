// src/pages/admin/UserManagement.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, Plus, Edit3, Shield, CheckCircle2, RefreshCw,
    UserX, UserCheck, ChevronLeft, ChevronRight, Users,
    Trash2, RotateCcw, AlertTriangle, X, Calendar,
    Fingerprint, Clock,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser } from '../../services/api';

// ── Helpers ───────────────────────────────────────────────────────
const initials = u =>
    ((u?.first_name?.[0] || '') + (u?.last_name?.[0] || '')).toUpperCase() ||
    u?.username?.[0]?.toUpperCase() || '?';

const fmtDate = d =>
    d ? new Date(d).toLocaleDateString('en-BT', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const timeAgo = d => {
    if (!d) return 'Never';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60)     return 'Just now';
    if (s < 3600)   return `${Math.floor(s / 60)}m ago`;
    if (s < 86400)  return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return fmtDate(d);
};

const ROLE_CLS = {
    ADMIN:        'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-700',
    DOE_HEAD:     'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-700',
    DATA_MANAGER: 'bg-primary-100 text-primary-700 border-primary-200 dark:bg-primary-900/20 dark:text-primary-400 dark:border-primary-700',
    DATA_FOCAL:   'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700',
    VIEWER:       'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',
};

const STATUS_META = {
    ACTIVE:    { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700', dot: 'bg-emerald-500' },
    INACTIVE:  { cls: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600',             dot: 'bg-slate-400'   },
    SUSPENDED: { cls: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-700',                 dot: 'bg-rose-400'    },
    DELETED:   { cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700',           dot: 'bg-amber-500'   },
};

// ── Avatar ─────────────────────────────────────────────────────────
const AV_BG = ['bg-primary-600','bg-violet-600','bg-rose-500','bg-amber-500','bg-teal-600','bg-blue-600'];
function Avatar({ user, size = 'md', faded = false }) {
    const bg  = AV_BG[(user.id || 0) % AV_BG.length];
    const sz  = size === 'sm' ? 'h-8 w-8 text-[11px]' : 'h-9 w-9 text-xs';
    return (
        <div className={`${sz} rounded-full ${bg} flex items-center justify-center font-bold text-white flex-shrink-0 ${faded ? 'opacity-50' : ''} overflow-hidden`}>
            {user.avatar_url
                ? <img src={user.avatar_url} className="h-full w-full object-cover" alt="" />
                : initials(user)}
        </div>
    );
}

// ── Toast ──────────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    const ok = type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5
            rounded-2xl shadow-2xl text-white text-sm font-semibold
            ${ok ? 'bg-emerald-600' : 'bg-rose-500'}`}
            style={{ animation: 'slideUp .22s ease-out' }}>
            {ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {message}
            <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
        </div>
    );
}

// ── Confirm Modal ──────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading, extra }) {
    useEffect(() => {
        const h = e => e.key === 'Escape' && onCancel();
        document.addEventListener('keydown', h);
        return () => document.removeEventListener('keydown', h);
    }, [onCancel]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCancel}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6
                border border-slate-200 dark:border-slate-700"
                onClick={e => e.stopPropagation()}
                style={{ animation: 'modalIn .18s ease-out' }}>
                <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertTriangle className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
                    </div>
                </div>
                {extra && <div className="mb-4">{extra}</div>}
                <div className="flex gap-3 mt-4">
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
                <style>{`@keyframes modalIn{from{opacity:0;transform:scale(.97) translateY(6px)}to{opacity:1;transform:scale(1) translateY(0)}}`}</style>
            </div>
        </div>
    );
}

const PAGE_SIZE = 15;

// ════════════════════════════════════════════════════════════════
// MAIN
// ════════════════════════════════════════════════════════════════
export default function UserManagement() {
    const navigate    = useNavigate();
    const currentUser = getUser();
    const isAdmin     = currentUser?.role?.role_name === 'ADMIN';

    // ── Tab state ───────────────────────────────────────────────
    const [tab, setTab] = useState('active'); // 'active' | 'trash'

    // ── Active users state ──────────────────────────────────────
    const [users,        setUsers]        = useState([]);
    const [roles,        setRoles]        = useState([]);
    const [total,        setTotal]        = useState(0);
    const [loading,      setLoading]      = useState(true);
    const [search,       setSearch]       = useState('');
    const [roleFilter,   setRoleFilter]   = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [page,         setPage]         = useState(1);

    // ── Trash state ─────────────────────────────────────────────
    const [trash,         setTrash]         = useState([]);
    const [trashLoading,  setTrashLoading]  = useState(false);
    const [trashSearch,   setTrashSearch]   = useState('');

    // ── Confirm/toast ────────────────────────────────────────────
    const [confirm,        setConfirm]        = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [toast,          setToast]          = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    // ── Load roles ────────────────────────────────────────────────
    useEffect(() => {
        apiFetch('/auth/roles/').then(async r => { if (r?.ok) setRoles(await r.json()); });
    }, []);

    // ── Load active users ─────────────────────────────────────────
    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams({ page, page_size: PAGE_SIZE });
            if (search)       p.set('search', search);
            if (roleFilter)   p.set('role',   roleFilter);
            if (statusFilter) p.set('status', statusFilter);
            const res  = await apiFetch(`/auth/users/?${p}`);
            if (!res?.ok) { showToast('Failed to load users.', 'error'); return; }
            const data = await res.json();
            if (Array.isArray(data)) { setUsers(data); setTotal(data.length); }
            else { setUsers(data.results || []); setTotal(data.count || 0); }
        } finally { setLoading(false); }
    }, [page, search, roleFilter, statusFilter]);

    useEffect(() => { loadUsers(); }, [loadUsers]);
    useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter]);

    // ── Load trash ────────────────────────────────────────────────
    const loadTrash = useCallback(async () => {
        if (!isAdmin) return;
        setTrashLoading(true);
        try {
            const res  = await apiFetch('/auth/users/trash/');
            if (!res?.ok) return;
            const data = await res.json();
            setTrash(Array.isArray(data) ? data : data.results ?? []);
        } finally { setTrashLoading(false); }
    }, [isAdmin]);

    useEffect(() => {
        if (tab === 'trash') loadTrash();
    }, [tab, loadTrash]);

    // ── Active user actions ───────────────────────────────────────
    const handleToggleStatus = async (user, newStatus) => {
        const res = await apiFetch(`/auth/users/${user.id}/`, {
            method: 'PATCH',
            body:   JSON.stringify({ status: newStatus }),
        });
        if (res?.ok) { loadUsers(); showToast(`User ${newStatus === 'ACTIVE' ? 'activated' : 'deactivated'}.`); }
        else showToast('Failed to update status.', 'error');
    };

    const handleMoveToTrash = user => {
        let reason = '';
        setConfirm({
            title:        `Move "${user.first_name} ${user.last_name}" to Trash?`,
            message:      'The user will be deactivated. All their data is preserved and can be restored anytime.',
            confirmLabel: 'Move to Trash',
            confirmClass: 'bg-rose-500 hover:bg-rose-600',
            extra: (
                <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                        Reason <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                    </label>
                    <textarea
                        onChange={e => { reason = e.target.value; }}
                        placeholder="e.g. Employee resigned…"
                        rows={2}
                        className="w-full rounded-xl px-3 py-2 text-sm bg-slate-50 dark:bg-slate-700
                            border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200
                            placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300/50 resize-none" />
                </div>
            ),
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`/auth/users/${user.id}/`, {
                        method: 'DELETE',
                        body:   JSON.stringify({ reason }),
                    });
                    if (res?.ok || res?.status === 200) {
                        loadUsers();
                        showToast(`${user.first_name} moved to trash. Data preserved.`);
                    } else {
                        showToast('Failed to move to trash.', 'error');
                    }
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    // ── Trash actions ─────────────────────────────────────────────
    const handleRestore = user => {
        setConfirm({
            title:        `Restore "${user.first_name} ${user.last_name}"?`,
            message:      'The user will be restored as Inactive. You can then activate them when ready.',
            confirmLabel: 'Restore User',
            confirmClass: 'bg-emerald-600 hover:bg-emerald-700',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`/auth/users/${user.id}/restore/`, { method: 'POST' });
                    if (res?.ok) {
                        loadTrash();
                        showToast(`${user.first_name} restored successfully!`);
                    } else {
                        showToast('Failed to restore.', 'error');
                    }
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const handlePermanentDelete = user => {
        setConfirm({
            title:        `Permanently delete "${user.first_name} ${user.last_name}"?`,
            message:      'This will remove the user and ALL their data from the database forever. This action cannot be undone.',
            confirmLabel: 'Delete Forever',
            confirmClass: 'bg-rose-700 hover:bg-rose-800',
            onConfirm: async () => {
                setConfirmLoading(true);
                try {
                    const res = await apiFetch(`/auth/users/${user.id}/permanent-delete/`, { method: 'DELETE' });
                    if (res?.ok || res?.status === 200) {
                        loadTrash();
                        showToast(`${user.first_name} permanently deleted.`);
                    } else {
                        showToast('Failed to permanently delete.', 'error');
                    }
                } finally { setConfirmLoading(false); setConfirm(null); }
            },
        });
    };

    const totalPages  = Math.ceil(total / PAGE_SIZE);
    const trashFilter = trashSearch
        ? trash.filter(u =>
            `${u.first_name} ${u.last_name} ${u.username} ${u.email}`.toLowerCase()
                .includes(trashSearch.toLowerCase()))
        : trash;

    const stats = {
        total:    total,
        active:   users.filter(u => u.status === 'ACTIVE').length,
        ndi:      users.filter(u => u.ndi_sub).length,
        trash:    trash.length,
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title="User Management">
            <div className="space-y-5 max-w-7xl mx-auto">

                {/* ── Banner ──────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1a4a3a 100%)' }}>
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center flex-shrink-0">
                                <Users className="h-6 w-6 text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.15em] text-blue-200/80 mb-0.5">Administration</p>
                                <h1 className="text-xl font-bold text-white">User Management</h1>
                                <p className="text-xs text-white/60 mt-0.5">Manage system users, roles and access</p>
                            </div>
                        </div>
                        {isAdmin && (
                            <button onClick={() => navigate('/admin/users/new')}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-800 text-sm font-bold hover:bg-blue-50 transition-colors shadow-sm flex-shrink-0">
                                <Plus className="h-4 w-4" /> Add User
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Stat cards ──────────────────────────────── */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { label: 'Total Users',  val: total,       color: 'text-slate-700 dark:text-slate-200',  bg: 'bg-white dark:bg-slate-800',             border: 'border-slate-200 dark:border-slate-700' },
                        { label: 'Active',        val: stats.active, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20',  border: 'border-emerald-100 dark:border-emerald-800' },
                        { label: 'NDI Linked',    val: stats.ndi,   color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/20',  border: 'border-primary-100 dark:border-primary-800' },
                        { label: 'In Trash',      val: trash.length, color: 'text-amber-600 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-900/20',        border: 'border-amber-100 dark:border-amber-800',
                          onClick: () => setTab('trash'), clickable: true },
                    ].map(s => (
                        <div key={s.label}
                            onClick={s.onClick}
                            className={`${s.bg} rounded-2xl border ${s.border} px-4 py-3.5 ${s.clickable ? 'cursor-pointer hover:shadow-sm transition-shadow' : ''}`}>
                            <p className="text-xs text-slate-400 font-medium">{s.label}</p>
                            <p className={`text-2xl font-extrabold mt-0.5 ${s.color}`}>{s.val}</p>
                            {s.clickable && s.val > 0 && (
                                <p className="text-[10px] text-amber-500 mt-1 font-semibold">Click to view →</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Tab bar ─────────────────────────────────── */}
                <div className="flex items-center gap-1 border-b border-slate-200 dark:border-slate-700">
                    <button onClick={() => setTab('active')}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                            border-b-2 -mb-px transition-all
                            ${tab === 'active'
                                ? 'border-primary-600 text-primary-700 dark:text-primary-400'
                                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}>
                        <Users className="h-4 w-4" />
                        Active Users
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                            ${tab === 'active' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                            {total}
                        </span>
                    </button>
                    {isAdmin && (
                        <button onClick={() => setTab('trash')}
                            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold
                                border-b-2 -mb-px transition-all
                                ${tab === 'trash'
                                    ? 'border-amber-500 text-amber-700 dark:text-amber-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300'}`}>
                            <Trash2 className="h-4 w-4" />
                            Trash
                            {trash.length > 0 && (
                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full
                                    ${tab === 'trash' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400'}`}>
                                    {trash.length}
                                </span>
                            )}
                        </button>
                    )}
                </div>

                {/* ════════════════════════════════════════════════
                    ACTIVE USERS TAB
                ════════════════════════════════════════════════ */}
                {tab === 'active' && (
                    <>
                        {/* Filters */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex flex-col sm:flex-row gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search name, username, email…"
                                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                                {search && (
                                    <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
                                className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer">
                                <option value="">All Roles</option>
                                {roles.map(r => <option key={r.id} value={r.role_name}>{r.role_name.replace(/_/g, ' ')}</option>)}
                            </select>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none appearance-none cursor-pointer">
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                                <option value="SUSPENDED">Suspended</option>
                            </select>
                            <button onClick={loadUsers} title="Refresh"
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-primary-600 transition-colors">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {loading ? (
                                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                                    Loading users…
                                </div>
                            ) : users.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                    <Users className="h-10 w-10 opacity-30" />
                                    <p className="font-medium">No users found</p>
                                    <p className="text-xs">Try adjusting your search or filters</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/30">
                                                {['User', 'Role', 'Department', 'Status', 'NDI', 'Last Login', ''].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {users.map(u => {
                                                const sm     = STATUS_META[u.status] || STATUS_META.INACTIVE;
                                                const isSelf = String(u.id) === String(currentUser?.id);
                                                return (
                                                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/20 transition-colors group">
                                                        {/* User */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar user={u} />
                                                                <div className="min-w-0">
                                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 truncate">
                                                                            {u.first_name} {u.last_name}
                                                                        </p>
                                                                        {isSelf && (
                                                                            <span className="text-[10px] bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-bold flex-shrink-0">You</span>
                                                                        )}
                                                                        {u.ndi_verified && (
                                                                            <Fingerprint className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" title="NDI Verified" />
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {/* Role */}
                                                        <td className="px-4 py-3.5">
                                                            {u.role ? (
                                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${ROLE_CLS[u.role.role_name] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                    {u.role.role_name.replace(/_/g, ' ')}
                                                                </span>
                                                            ) : <span className="text-xs text-slate-300 italic">No role</span>}
                                                        </td>
                                                        {/* Dept */}
                                                        <td className="px-4 py-3.5 text-xs text-slate-500 dark:text-slate-400 hidden md:table-cell max-w-[140px] truncate">
                                                            {u.department || <span className="text-slate-300">—</span>}
                                                        </td>
                                                        {/* Status */}
                                                        <td className="px-4 py-3.5">
                                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${sm.cls}`}>
                                                                <span className={`h-1.5 w-1.5 rounded-full ${sm.dot}`} />
                                                                {u.status}
                                                            </span>
                                                        </td>
                                                        {/* NDI */}
                                                        <td className="px-4 py-3.5 hidden lg:table-cell">
                                                            {u.ndi_sub ? (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-700">
                                                                    <CheckCircle2 className="h-3 w-3" /> Linked
                                                                </span>
                                                            ) : <span className="text-xs text-slate-300">—</span>}
                                                        </td>
                                                        {/* Last login */}
                                                        <td className="px-4 py-3.5 text-xs text-slate-400 hidden lg:table-cell whitespace-nowrap">
                                                            {timeAgo(u.last_login)}
                                                        </td>
                                                        {/* Actions */}
                                                        <td className="px-4 py-3.5">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                {isAdmin && (
                                                                    <button onClick={() => navigate(`/admin/users/${u.id}/edit`)}
                                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                            bg-slate-100 dark:bg-slate-700
                                                                            hover:bg-primary-50 dark:hover:bg-primary-900/20
                                                                            text-slate-500 hover:text-primary-600 dark:hover:text-primary-400
                                                                            text-xs font-semibold transition-colors">
                                                                        <Edit3 className="h-3.5 w-3.5" /> Edit
                                                                    </button>
                                                                )}
                                                                {isAdmin && !isSelf && (
                                                                    u.status === 'ACTIVE' ? (
                                                                        <button onClick={() => handleToggleStatus(u, 'INACTIVE')}
                                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                                bg-slate-100 dark:bg-slate-700
                                                                                hover:bg-amber-50 dark:hover:bg-amber-900/20
                                                                                text-slate-400 hover:text-amber-600 dark:hover:text-amber-400
                                                                                text-xs font-semibold transition-colors"
                                                                            title="Deactivate">
                                                                            <UserX className="h-3.5 w-3.5" /> Deactivate
                                                                        </button>
                                                                    ) : (
                                                                        <button onClick={() => handleToggleStatus(u, 'ACTIVE')}
                                                                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                                bg-emerald-50 dark:bg-emerald-900/20
                                                                                text-emerald-600 dark:text-emerald-400
                                                                                hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                                                                                text-xs font-semibold transition-colors"
                                                                            title="Activate">
                                                                            <UserCheck className="h-3.5 w-3.5" /> Activate
                                                                        </button>
                                                                    )
                                                                )}
                                                                {isAdmin && !isSelf && (
                                                                    <button onClick={() => handleMoveToTrash(u)}
                                                                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg
                                                                            bg-slate-100 dark:bg-slate-700
                                                                            hover:bg-rose-50 dark:hover:bg-rose-900/20
                                                                            text-slate-400 hover:text-rose-500 dark:hover:text-rose-400
                                                                            text-xs font-semibold transition-colors"
                                                                        title="Move to Trash">
                                                                        <Trash2 className="h-3.5 w-3.5" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {!loading && totalPages > 1 && (
                                <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500">
                                    <span>
                                        Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
                                    </span>
                                    <div className="flex gap-1">
                                        <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map(p => (
                                            <button key={p} onClick={() => setPage(p)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors
                                                    ${page === p ? 'bg-primary-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}`}>
                                                {p}
                                            </button>
                                        ))}
                                        <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {!isAdmin && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                                <Shield className="h-4 w-4 flex-shrink-0" />
                                You have view-only access. Contact a System Administrator to make changes.
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════════════════════════════════════
                    TRASH TAB
                ════════════════════════════════════════════════ */}
                {tab === 'trash' && isAdmin && (
                    <>
                        {/* Trash notice */}
                        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-2xl px-5 py-4">
                            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Trash2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                                    {trash.length} user{trash.length !== 1 ? 's' : ''} in trash
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                    All user data is preserved. Restore a user to re-enable their account, or permanently delete to remove them forever.
                                </p>
                            </div>
                        </div>

                        {/* Trash search */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-4 py-3 flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input value={trashSearch} onChange={e => setTrashSearch(e.target.value)}
                                    placeholder="Search trashed users…"
                                    className="w-full pl-9 pr-8 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/30" />
                                {trashSearch && (
                                    <button onClick={() => setTrashSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            <button onClick={loadTrash} title="Refresh"
                                className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 hover:text-amber-600 transition-colors">
                                <RefreshCw className={`h-4 w-4 ${trashLoading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>

                        {/* Trash table */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            {trashLoading ? (
                                <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                                    <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-amber-500 animate-spin" />
                                    Loading trash…
                                </div>
                            ) : trashFilter.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                                    <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                                        <Trash2 className="h-7 w-7 text-slate-300 dark:text-slate-500" />
                                    </div>
                                    <p className="font-medium text-slate-600 dark:text-slate-300">
                                        {trashSearch ? 'No trashed users match your search' : 'Trash is empty'}
                                    </p>
                                    <p className="text-xs">
                                        {trashSearch ? 'Try different keywords' : 'Deleted users will appear here'}
                                    </p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-700/30">
                                                {['User', 'Role', 'Deleted By', 'Deleted On', 'Reason', ''].map(h => (
                                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                            {trashFilter.map(u => (
                                                <tr key={u.id} className="hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors">
                                                    {/* User */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-3">
                                                            <Avatar user={u} faded />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 truncate line-through decoration-slate-400">
                                                                    {u.first_name} {u.last_name}
                                                                </p>
                                                                <p className="text-xs text-slate-400 truncate">@{u.username}</p>
                                                                {u.email && <p className="text-[10px] text-slate-300 dark:text-slate-600 truncate">{u.email}</p>}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {/* Role */}
                                                    <td className="px-4 py-3.5">
                                                        {u.role ? (
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border opacity-60 ${ROLE_CLS[u.role.role_name] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                                {u.role.role_name.replace(/_/g, ' ')}
                                                            </span>
                                                        ) : <span className="text-xs text-slate-300 italic">No role</span>}
                                                    </td>
                                                    {/* Deleted by */}
                                                    <td className="px-4 py-3.5">
                                                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                            {u.deleted_by || '—'}
                                                        </span>
                                                    </td>
                                                    {/* Deleted on */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            {fmtDate(u.deleted_at)}
                                                        </div>
                                                        <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-0.5 ml-4.5">
                                                            {timeAgo(u.deleted_at)}
                                                        </p>
                                                    </td>
                                                    {/* Reason */}
                                                    <td className="px-4 py-3.5 max-w-[200px]">
                                                        {u.deleted_reason ? (
                                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate" title={u.deleted_reason}>
                                                                {u.deleted_reason}
                                                            </p>
                                                        ) : (
                                                            <span className="text-xs text-slate-300 dark:text-slate-600 italic">No reason given</span>
                                                        )}
                                                    </td>
                                                    {/* Actions */}
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {/* Restore */}
                                                            <button onClick={() => handleRestore(u)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                                                    bg-emerald-50 dark:bg-emerald-900/20
                                                                    border border-emerald-200 dark:border-emerald-700
                                                                    text-emerald-700 dark:text-emerald-400
                                                                    hover:bg-emerald-100 dark:hover:bg-emerald-900/30
                                                                    text-xs font-bold transition-colors">
                                                                <RotateCcw className="h-3.5 w-3.5" /> Restore
                                                            </button>
                                                            {/* Permanent delete */}
                                                            <button onClick={() => handlePermanentDelete(u)}
                                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                                                    bg-rose-50 dark:bg-rose-900/20
                                                                    border border-rose-200 dark:border-rose-700
                                                                    text-rose-600 dark:text-rose-400
                                                                    hover:bg-rose-100 dark:hover:bg-rose-900/30
                                                                    text-xs font-bold transition-colors">
                                                                <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Confirm dialog */}
            {confirm && (
                <ConfirmModal
                    title={confirm.title}
                    message={confirm.message}
                    confirmLabel={confirm.confirmLabel}
                    confirmClass={confirm.confirmClass}
                    onConfirm={confirm.onConfirm}
                    onCancel={() => setConfirm(null)}
                    loading={confirmLoading}
                    extra={confirm.extra}
                />
            )}

            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}