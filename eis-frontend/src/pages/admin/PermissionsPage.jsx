// src/pages/admin/PermissionsPage.jsx
// Shows the complete permission matrix — all roles × all modules
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, CheckCircle2, XCircle, RefreshCw, Edit,
    ChevronDown, ChevronRight, Info, Lock, Filter,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser } from '../../services/api';

// ── Meta ──────────────────────────────────────────────────────────
const ROLE_META = {
    ADMIN:        { label: 'Admin',        cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    DOE_HEAD:     { label: 'DOE Head',     cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500'   },
    DATA_MANAGER: { label: 'Data Manager', cls: 'bg-primary-100 text-primary-700 border-primary-200', dot: 'bg-primary-500' },
    DATA_FOCAL:   { label: 'Data Focal',   cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
    VIEWER:       { label: 'Viewer',       cls: 'bg-slate-100 text-slate-600 border-slate-200',        dot: 'bg-slate-400'  },
};

const PERM_COLS = [
    { key: 'can_view',     label: 'V', full: 'View',     bg: 'bg-blue-500',    text: 'text-blue-600'    },
    { key: 'can_create',   label: 'C', full: 'Create',   bg: 'bg-emerald-500', text: 'text-emerald-600' },
    { key: 'can_edit',     label: 'E', full: 'Edit',     bg: 'bg-amber-500',   text: 'text-amber-600'   },
    { key: 'can_delete',   label: 'D', full: 'Delete',   bg: 'bg-rose-500',    text: 'text-rose-600'    },
    { key: 'can_upload',   label: 'U', full: 'Upload',   bg: 'bg-violet-500',  text: 'text-violet-600'  },
    { key: 'can_download', label: 'DL',full: 'Download', bg: 'bg-cyan-500',    text: 'text-cyan-600'    },
];

function PermDot({ value, colMeta }) {
    return value
        ? <div className={`h-5 w-5 rounded-full ${colMeta.bg} flex items-center justify-center mx-auto`} title={`${colMeta.full}: Enabled`}>
              <CheckCircle2 className="h-3 w-3 text-white" />
          </div>
        : <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mx-auto" title={`${colMeta.full}: Disabled`}>
              <XCircle className="h-3 w-3 text-slate-300 dark:text-slate-500" />
          </div>;
}

function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {type === 'success' ? '✓' : '⚠'} {message}
        </div>
    );
}

export default function PermissionsPage() {
    const navigate  = useNavigate();
    const isAdmin   = getUser()?.role?.role_name === 'ADMIN';

    const [roles,      setRoles]      = useState([]);
    const [permMap,    setPermMap]    = useState({});   // { roleId: [perm objects] }
    const [groups,     setGroups]     = useState([]);   // [{ group, modules }]
    const [loading,    setLoading]    = useState(true);
    const [collapsed,  setCollapsed]  = useState({});
    const [filterRole, setFilterRole] = useState('');   // role_name filter
    const [toast,      setToast]      = useState(null);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [rolesRes, modulesRes] = await Promise.all([
                apiFetch('/auth/roles/'),
                apiFetch('/auth/permissions/modules/'),
            ]);
            if (!rolesRes?.ok || !modulesRes?.ok) { showToast('Failed to load data.', 'error'); return; }

            const roleList   = await rolesRes.json();
            const moduleList = await modulesRes.json(); // [{ group, modules: [{key, label}] }]

            setRoles(roleList);
            setGroups(moduleList);

            // Fetch permissions for all roles in parallel
            const results = await Promise.all(
                roleList.map(r =>
                    apiFetch(`/auth/roles/${r.id}/permissions/`)
                        .then(async res => res?.ok ? { id: r.id, data: (await res.json()).permissions } : null)
                )
            );
            const map = {};
            results.forEach(r => { if (r) map[r.id] = r.data; });
            setPermMap(map);
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const getPerm = (roleId, moduleKey) => {
        const perms = permMap[roleId] || [];
        return perms.find(p => p.module === moduleKey);
    };

    // Filtered roles
    const visibleRoles = filterRole ? roles.filter(r => r.role_name === filterRole) : roles;

    // Stats
    const totalModules = groups.reduce((s, g) => s + g.modules.length, 0);

    return (
        <DashboardLayout breadcrumb="User Management" title="All Permissions">
            <div className="space-y-5">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        style={{ background: 'linear-gradient(135deg,#1a4a3a,#256648)' }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-1">Access Control</p>
                            <h1 className="text-xl font-bold text-white">Permissions Matrix</h1>
                            <p className="text-sm text-emerald-100 mt-0.5">
                                {roles.length} roles · {totalModules} modules · View, Create, Edit, Delete permissions
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={load} disabled={loading}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-60">
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {roles.slice(0, 4).map(r => {
                        const meta  = ROLE_META[r.role_name] || { label: r.role_name, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
                        const perms = permMap[r.id] || [];
                        const enabled = perms.reduce((s, p) =>
                            s + (p.can_view ? 1 : 0) + (p.can_create ? 1 : 0) + (p.can_edit ? 1 : 0) + (p.can_delete ? 1 : 0), 0);
                        const total = perms.length * 4 || 1;
                        const pct = Math.round((enabled / total) * 100);
                        return (
                            <div key={r.id}
                                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 hover:shadow-sm transition-all cursor-pointer"
                                onClick={() => navigate(`/admin/roles/${r.id}/edit`)}>
                                <div className="flex items-center justify-between mb-2">
                                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${meta.cls}`}>
                                        {meta.label}
                                    </span>
                                    {r.role_name === 'ADMIN' && <Lock className="h-3.5 w-3.5 text-slate-300" />}
                                </div>
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-100">{pct}%</p>
                                        <p className="text-xs text-slate-400">access granted</p>
                                    </div>
                                    <div className="h-10 w-10 rounded-full border-4 border-slate-100 dark:border-slate-700 flex items-center justify-center"
                                        style={{ background: `conic-gradient(${meta.dot.replace('bg-', '').includes('primary') ? '#1a4a3a' : ''} ${pct * 3.6}deg, #e2e8f0 0deg)` }}>
                                    </div>
                                </div>
                                <div className="mt-2 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className={`h-full ${meta.dot} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Filter + Legend */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 px-5 py-3 flex items-center gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-semibold text-slate-500">Filter by role:</span>
                        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
                            className="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none">
                            <option value="">All roles</option>
                            {roles.map(r => <option key={r.id} value={r.role_name}>{r.role_name.replace(/_/g, ' ')}</option>)}
                        </select>
                    </div>
                    <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-400 font-medium">Legend:</span>
                        {PERM_COLS.map(c => (
                            <span key={c.key} className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                                <span className={`h-3 w-3 rounded-full ${c.bg}`} /> {c.full}
                            </span>
                        ))}
                        <span className="flex items-center gap-1.5 text-xs text-slate-400">
                            <span className="h-3 w-3 rounded-full bg-slate-200 dark:bg-slate-600" /> Disabled
                        </span>
                    </div>
                    {isAdmin && (
                        <button onClick={() => navigate('/admin/roles')}
                            className="ml-auto flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors">
                            <Edit className="h-3.5 w-3.5" /> Edit Permissions
                        </button>
                    )}
                </div>

                {/* Permissions matrix table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-3 text-slate-400">
                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                        Loading permissions...
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead>
                                    {/* Role header */}
                                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                                        <th className="px-5 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider sticky left-0 bg-slate-50 dark:bg-slate-700/50 z-10 min-w-[180px]">
                                            Module
                                        </th>
                                        {visibleRoles.map(r => {
                                            const meta = ROLE_META[r.role_name] || { label: r.role_name, cls: 'bg-slate-100 text-slate-600 border-slate-200' };
                                            return (
                                                <th key={r.id} colSpan={4}
                                                    className="px-3 py-3 text-center border-l border-slate-100 dark:border-slate-700 min-w-[120px]">
                                                    <div className="flex items-center justify-center gap-1.5">
                                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold border ${meta.cls}`}>
                                                            {meta.label}
                                                        </span>
                                                        {r.role_name === 'ADMIN' && <Lock className="h-3 w-3 text-slate-300" />}
                                                    </div>
                                                </th>
                                            );
                                        })}
                                    </tr>
                                    {/* V C E D sub-headers */}
                                    <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30">
                                        <th className="px-5 py-2 sticky left-0 bg-slate-50/50 dark:bg-slate-700/30 z-10" />
                                        {visibleRoles.map(r =>
                                            PERM_COLS.map(c => (
                                                <th key={`${r.id}-${c.key}`}
                                                    className={`px-1 py-2 text-center font-bold ${c.text} border-l border-slate-100 dark:border-slate-700/50 first-of-type:border-l-slate-200`}
                                                    title={c.full}>
                                                    {c.label}
                                                </th>
                                            ))
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map(({ group, modules }) => {
                                        const isCollapsed = collapsed[group];
                                        return (
                                            <>
                                                {/* Group row */}
                                                <tr key={`grp-${group}`}
                                                    className="bg-slate-100 dark:bg-slate-700/60 cursor-pointer hover:bg-slate-150 dark:hover:bg-slate-700"
                                                    onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}>
                                                    <td className="px-5 py-2.5 sticky left-0 bg-slate-100 dark:bg-slate-700/60 z-10">
                                                        <div className="flex items-center gap-2">
                                                            {isCollapsed
                                                                ? <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                                                                : <ChevronDown className="h-3.5 w-3.5 text-slate-400" />}
                                                            <span className="font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[11px]">
                                                                {group}
                                                            </span>
                                                            <span className="text-[10px] text-slate-400 font-normal">({modules.length})</span>
                                                        </div>
                                                    </td>
                                                    {visibleRoles.map(r => PERM_COLS.map(c => (
                                                        <td key={`${r.id}-${c.key}-${group}`}
                                                            className="px-1 py-2 border-l border-slate-200 dark:border-slate-700/50" />
                                                    )))}
                                                </tr>

                                                {/* Module rows */}
                                                {!isCollapsed && modules.map(mod => (
                                                    <tr key={`${group}-${mod.key}`}
                                                        className="border-b border-slate-50 dark:border-slate-700/30 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors group">
                                                        <td className="px-5 py-2.5 sticky left-0 bg-white dark:bg-slate-800 group-hover:bg-slate-50/50 dark:group-hover:bg-slate-700/20 z-10">
                                                            <div className="flex items-center gap-3">
                                                                <div className="pl-5">
                                                                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{mod.label}</p>
                                                                    <p className="text-[10px] text-slate-400 font-mono">{mod.key}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {visibleRoles.map(r => {
                                                            const perm = getPerm(r.id, mod.key);
                                                            return PERM_COLS.map(c => (
                                                                <td key={`${r.id}-${c.key}-${mod.key}`}
                                                                    className="px-1 py-2.5 text-center border-l border-slate-100 dark:border-slate-700/30">
                                                                    <PermDot value={perm?.[c.key] || false} colMeta={c} />
                                                                </td>
                                                            ));
                                                        })}
                                                    </tr>
                                                ))}
                                            </>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Table footer */}
                        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-700/30">
                            <p className="text-xs text-slate-400">
                                {totalModules} modules · {visibleRoles.length} role{visibleRoles.length !== 1 ? 's' : ''} shown
                            </p>
                            {isAdmin && (
                                <button onClick={() => navigate('/admin/roles')}
                                    className="flex items-center gap-1.5 text-xs font-semibold text-primary-600 hover:underline">
                                    <Edit className="h-3.5 w-3.5" /> Edit permissions in Roles page
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Info */}
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        <strong className="text-slate-600 dark:text-slate-300">V</strong> = View &nbsp;·&nbsp;
                        <strong className="text-slate-600 dark:text-slate-300">C</strong> = Create &nbsp;·&nbsp;
                        <strong className="text-slate-600 dark:text-slate-300">E</strong> = Edit &nbsp;·&nbsp;
                        <strong className="text-slate-600 dark:text-slate-300">D</strong> = Delete &nbsp;·&nbsp;
                        ADMIN role has full access and cannot be restricted. Changes to permissions take effect immediately.
                    </div>
                </div>
            </div>

            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}