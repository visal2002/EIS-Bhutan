// src/pages/admin/RolesPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Shield, CheckCircle2, XCircle, Eye, Edit, Save,
    RefreshCw, Lock, ChevronDown, ChevronRight, Info,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser } from '../../services/api';

// ── Role meta ─────────────────────────────────────────────────────
const ROLE_META = {
    ADMIN:        { label: 'System Admin',  cls: 'bg-purple-100 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
    DOE_HEAD:     { label: 'DOE Head',      cls: 'bg-blue-50 text-blue-700 border-blue-200',         dot: 'bg-blue-500'   },
    DATA_MANAGER: { label: 'Data Manager',  cls: 'bg-primary-100 text-primary-700 border-primary-200', dot: 'bg-primary-500' },
    DATA_FOCAL:   { label: 'Data Focal',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200',  dot: 'bg-emerald-500' },
    VIEWER:       { label: 'Viewer',        cls: 'bg-slate-100 text-slate-600 border-slate-200',        dot: 'bg-slate-400'  },
};

const ROLE_DESCS = {
    ADMIN:        'Full system access. Can manage users, roles, settings and all data modules.',
    DOE_HEAD:     'Executive oversight. Can view all data, approve submissions and review all reports.',
    DATA_MANAGER: 'Data steward. Can create, edit and manage energy data across all sectors.',
    DATA_FOCAL:   'Field officer. Can enter and update data for their assigned sectors.',
    VIEWER:       'Read-only access to dashboards and published energy reports.',
};

const PERM_COLS = [
    { key: 'can_view',   label: 'View',   color: 'text-blue-600',    bg: 'bg-blue-500',    light: 'bg-blue-50 border-blue-200'    },
    { key: 'can_create', label: 'Create', color: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50 border-emerald-200' },
    { key: 'can_edit',   label: 'Edit',   color: 'text-amber-600',   bg: 'bg-amber-500',   light: 'bg-amber-50 border-amber-200'   },
    { key: 'can_delete', label: 'Delete', color: 'text-rose-600',    bg: 'bg-rose-500',    light: 'bg-rose-50 border-rose-200'     },
];

function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {type === 'success' ? '✓' : '⚠'} {message}
        </div>
    );
}

// ── Permission toggle ─────────────────────────────────────────────
function Toggle({ value, onChange, disabled, colMeta }) {
    return (
        <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
            title={`${colMeta.label}: ${value ? 'ON — click to disable' : 'OFF — click to enable'}`}
            className={`relative w-10 h-5 rounded-full transition-all focus:outline-none
                ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}
                ${value ? colMeta.bg : 'bg-slate-200 dark:bg-slate-600'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all
                ${value ? 'left-5' : 'left-0.5'}`} />
        </button>
    );
}

// ── Permission editor ─────────────────────────────────────────────
function PermissionEditor({ role, onClose, onSaved, showToast }) {
    const [permissions, setPermissions] = useState([]);
    const [groups,      setGroups]      = useState([]);
    const [collapsed,   setCollapsed]   = useState({});
    const [loading,     setLoading]     = useState(true);
    const [saving,      setSaving]      = useState(false);
    const [dirty,       setDirty]       = useState(false);
    const isAdmin  = getUser()?.role?.role_name === 'ADMIN';
    const isLocked = role.role_name === 'ADMIN';

    useEffect(() => {
        (async () => {
            const res = await apiFetch(`/auth/roles/${role.id}/permissions/`);
            if (res?.ok) {
                const data = await res.json();
                setPermissions(data.permissions);
                const g = {};
                data.permissions.forEach(p => { g[p.group] = g[p.group] || []; g[p.group].push(p); });
                setGroups(Object.entries(g));
            }
            setLoading(false);
        })();
    }, [role.id]);

    const update = (module, perm, value) => {
        setPermissions(prev => prev.map(p => p.module === module ? { ...p, [perm]: value } : p));
        setDirty(true);
    };

    const toggleAll = (group, perm, value) => {
        setPermissions(prev => prev.map(p => p.group === group ? { ...p, [perm]: value } : p));
        setDirty(true);
    };

    const setAllModule = (module, value) => {
        setPermissions(prev => prev.map(p => p.module === module
            ? { ...p, can_view: value, can_create: value, can_edit: value, can_delete: value } : p));
        setDirty(true);
    };

    const handleSave = async () => {
        setSaving(true);
        const res = await apiFetch(`/auth/roles/${role.id}/permissions/`, {
            method: 'PUT', body: JSON.stringify({ permissions }),
        });
        setSaving(false);
        if (res?.ok) { showToast(`Permissions saved for ${ROLE_META[role.role_name]?.label || role.role_name}`); setDirty(false); onSaved(); }
        else { const e = await res?.json(); showToast(e?.error || 'Failed to save.', 'error'); }
    };

    const meta = ROLE_META[role.role_name] || { label: role.role_name, cls: '' };

    return (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex" onClick={onClose}>
            <div className="ml-auto w-full max-w-3xl bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl"
                onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex-shrink-0"
                    style={{ background: 'linear-gradient(135deg,#1a4a3a,#256648)' }}>
                    <div>
                        <div className="flex items-center gap-2 mb-1.5">
                            <Shield className="h-4 w-4 text-emerald-300" />
                            <span className="text-xs font-semibold text-emerald-200 uppercase tracking-wider">Role Permissions</span>
                            {isLocked && <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-300 bg-amber-900/30 border border-amber-700/50 px-2 py-0.5 rounded-full"><Lock className="h-3 w-3" /> Locked</span>}
                        </div>
                        <h2 className="text-lg font-bold text-white">{meta.label}</h2>
                        <p className="text-xs text-emerald-200 mt-0.5">{ROLE_DESCS[role.role_name] || ''}</p>
                    </div>
                    <button onClick={onClose}
                        className="h-9 w-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors text-xl font-light">
                        ×
                    </button>
                </div>

                {/* Legend */}
                <div className="flex items-center gap-4 px-6 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700 flex-shrink-0 flex-wrap">
                    <span className="text-xs text-slate-400 font-medium">Permissions:</span>
                    {PERM_COLS.map(c => (
                        <span key={c.key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                            <span className={`h-3 w-3 rounded-full ${c.bg}`} /> {c.label}
                        </span>
                    ))}
                    {!isLocked && <span className="ml-auto text-xs text-slate-400 hidden sm:block">Toggle to enable/disable · Save when done</span>}
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 gap-3 text-slate-400">
                            <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-emerald-500 animate-spin" />
                            Loading permissions...
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {groups.map(([group, mods]) => {
                                const isCollapsed = collapsed[group];
                                // Check if all enabled per perm for group header
                                const groupAllOn = perm => mods.every(m => m[perm]);

                                return (
                                    <div key={group}>
                                        {/* Group header */}
                                        <div className="flex items-center gap-3 px-6 py-3 bg-slate-50 dark:bg-slate-800/50 cursor-pointer select-none"
                                            onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}>
                                            <button className="text-slate-400">
                                                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                            </button>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex-1">{group}</span>
                                            <span className="text-xs text-slate-400">{mods.length} modules</span>
                                            {/* Group-level quick toggles */}
                                            {!isLocked && isAdmin && !isCollapsed && (
                                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                                    {PERM_COLS.map(c => {
                                                        const allOn = groupAllOn(c.key);
                                                        return (
                                                            <button key={c.key}
                                                                onClick={() => toggleAll(group, c.key, !allOn)}
                                                                title={`${allOn ? 'Disable' : 'Enable'} ${c.label} for all ${group} modules`}
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors
                                                                    ${allOn ? `${c.bg} text-white border-transparent` : `bg-white dark:bg-slate-700 ${c.color} border-current opacity-60 hover:opacity-100`}`}>
                                                                {c.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Module rows */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                                                {mods.map(mod => {
                                                    const allOn = PERM_COLS.every(c => mod[c.key]);
                                                    return (
                                                        <div key={mod.module}
                                                            className="flex items-center gap-4 px-6 py-3.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                            {/* Module info */}
                                                            <div className="w-52 flex-shrink-0">
                                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{mod.label}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">{mod.module}</p>
                                                            </div>

                                                            {/* All toggle */}
                                                            {!isLocked && isAdmin && (
                                                                <button
                                                                    onClick={() => setAllModule(mod.module, !allOn)}
                                                                    title={allOn ? 'Disable all' : 'Enable all'}
                                                                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border w-14 text-center flex-shrink-0 transition-colors
                                                                        ${allOn ? 'bg-slate-700 text-white border-transparent' : 'bg-white dark:bg-slate-700 text-slate-500 border-slate-300 dark:border-slate-600 hover:border-slate-500'}`}>
                                                                    {allOn ? 'All On' : 'All Off'}
                                                                </button>
                                                            )}

                                                            {/* Permission toggles */}
                                                            <div className="flex items-center gap-5 flex-1">
                                                                {PERM_COLS.map(c => (
                                                                    <div key={c.key} className="flex flex-col items-center gap-1">
                                                                        <Toggle
                                                                            value={mod[c.key]}
                                                                            onChange={v => update(mod.module, c.key, v)}
                                                                            disabled={isLocked || !isAdmin}
                                                                            colMeta={c}
                                                                        />
                                                                        <span className={`text-[9px] font-bold ${mod[c.key] ? c.color : 'text-slate-300 dark:text-slate-600'}`}>
                                                                            {c.label}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>

                                                            {/* Status indicator */}
                                                            <div className="w-16 flex-shrink-0 text-right">
                                                                {PERM_COLS.filter(c => mod[c.key]).length === 0 ? (
                                                                    <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium">No access</span>
                                                                ) : PERM_COLS.filter(c => mod[c.key]).length === 4 ? (
                                                                    <span className="text-[10px] text-emerald-600 font-bold">Full access</span>
                                                                ) : (
                                                                    <span className="text-[10px] text-blue-600 font-medium">
                                                                        {PERM_COLS.filter(c => mod[c.key]).map(c => c.label).join(', ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between flex-shrink-0">
                    <div className="text-xs text-slate-400">
                        {isLocked
                            ? '🔒 Admin role has full access and cannot be restricted'
                            : dirty
                                ? '● Unsaved changes — click Save to apply'
                                : '✓ All changes saved'}
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose}
                            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                            Close
                        </button>
                        {!isLocked && isAdmin && (
                            <button onClick={handleSave} disabled={saving || !dirty}
                                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-50 shadow-sm">
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? 'Saving...' : 'Save Permissions'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export default function RolesPage() {
    const [roles,   setRoles]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [toast,   setToast]   = useState(null);
    const [seeding, setSeeding] = useState(false);
    const navigate = useNavigate();
    const isAdmin  = getUser()?.role?.role_name === 'ADMIN';

    const loadRoles = useCallback(async () => {
        setLoading(true);
        const res = await apiFetch('/auth/roles/');
        if (res?.ok) setRoles(await res.json());
        setLoading(false);
    }, []);

    useEffect(() => { loadRoles(); }, [loadRoles]);

    const showToast = (msg, type = 'success') => setToast({ msg, type });

    const handleSeed = async () => {
        setSeeding(true);
        const res = await apiFetch('/auth/permissions/seed/?force=true', { method: 'POST' });
        setSeeding(false);
        if (res?.ok) { const d = await res.json(); showToast(d.message); loadRoles(); }
        else showToast('Failed to seed permissions.', 'error');
    };

    return (
        <DashboardLayout breadcrumb="User Management" title="Roles & Permissions">
            <div className="space-y-5">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                        style={{ background: 'linear-gradient(135deg,#1a4a3a,#256648)' }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-200 mb-1">Access Control</p>
                            <h1 className="text-xl font-bold text-white">Roles & Permissions</h1>
                            <p className="text-sm text-emerald-100 mt-0.5">Configure View · Create · Edit · Delete access per module per role</p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <button onClick={() => navigate('/admin/roles/new')}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-sm font-bold transition-colors">
                                    + Add Role
                                </button>
                                <button onClick={handleSeed} disabled={seeding}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-colors disabled:opacity-60">
                                    <RefreshCw className={`h-4 w-4 ${seeding ? 'animate-spin' : ''}`} />
                                    Reset Defaults
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Role cards */}
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                        Loading roles...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {roles.map(role => {
                            const meta    = ROLE_META[role.role_name] || { label: role.role_name, cls: 'bg-slate-100 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
                            const isLocked = role.role_name === 'ADMIN';
                            const totalMods = role.total_modules || 16;
                            const pct  = Math.round((role.perm_count / totalMods) * 100);

                            return (
                                <div key={role.id}
                                    className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all overflow-hidden group">

                                    <div className="p-5">
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${meta.cls}`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                                                {meta.label}
                                            </span>
                                            {isLocked && (
                                                <span className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-2 py-0.5 rounded-full">
                                                    <Lock className="h-3 w-3" /> Locked
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                                            {ROLE_DESCS[role.role_name] || role.description || '—'}
                                        </p>

                                        {/* Progress */}
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-xs text-slate-400">
                                                <span>Module access</span>
                                                <span className="font-bold text-slate-600 dark:text-slate-300">{role.perm_count}/{totalMods}</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all"
                                                    style={{ width: `${pct}%`, background: pct === 100 ? '#10b981' : 'linear-gradient(90deg,#1a4a3a,#5AC994)' }} />
                                            </div>
                                        </div>

                                        {/* Permission pills */}
                                        <div className="flex gap-1.5 mt-3 flex-wrap">
                                            {PERM_COLS.map(c => {
                                                const count = 0; // simplified
                                                return (
                                                    <span key={c.key}
                                                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${c.light} ${c.color}`}>
                                                        {c.label}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 flex items-center justify-between">
                                        <span className="text-xs text-slate-400">{pct}% access</span>
                                        <button onClick={() => navigate(`/admin/roles/${role.id}/edit`)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors bg-primary-600 hover:bg-primary-700 text-white shadow-sm">
                                            {isLocked || !isAdmin ? <Eye className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                                            {isLocked || !isAdmin ? 'View' : 'Edit Permissions'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* All Permissions overview table */}
                <AllPermissionsTable />

                {/* Info */}
                <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 flex items-start gap-2">
                    <Info className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                        <strong>System Policy:</strong> The ADMIN role has full access and cannot be restricted.
                        Changes take effect immediately. Use "Reset to Defaults" to restore factory settings.
                    </div>
                </div>

            </div>

            {editing && (
                <PermissionEditor role={editing} onClose={() => setEditing(null)}
                    onSaved={loadRoles} showToast={showToast} />
            )}
            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}

// ── All Permissions overview ───────────────────────────────────────
function AllPermissionsTable() {
    const [roles, setRoles] = useState([]);
    const [perms, setPerms] = useState({}); // { roleId: [permissions] }
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState({});

    useEffect(() => {
        (async () => {
            const res = await apiFetch('/auth/roles/');
            if (!res?.ok) { setLoading(false); return; }
            const roleList = await res.json();
            setRoles(roleList);

            // Fetch permissions for all roles in parallel
            const results = await Promise.all(
                roleList.map(r => apiFetch(`/auth/roles/${r.id}/permissions/`).then(async re => re?.ok ? { id: r.id, data: await re.json() } : null))
            );
            const map = {};
            results.forEach(r => { if (r) map[r.id] = r.data.permissions; });
            setPerms(map);
            setLoading(false);
        })();
    }, []);

    if (loading) return null;
    if (!roles.length) return null;

    // Get all groups and modules from first role
    const firstRolePerms = Object.values(perms)[0] || [];
    const groups = {};
    firstRolePerms.forEach(p => { groups[p.group] = groups[p.group] || []; groups[p.group].push(p); });
    const groupEntries = Object.entries(groups);

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">All Permissions Overview</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Full permission matrix across all roles and modules</p>
                </div>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-xs">
                    <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                            <th className="px-4 py-3 text-left font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider w-48">Module</th>
                            {roles.map(r => (
                                <th key={r.id} colSpan={4} className="px-2 py-3 text-center font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-l border-slate-100 dark:border-slate-700">
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] ${ROLE_META[r.role_name]?.cls || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                        {ROLE_META[r.role_name]?.label || r.role_name}
                                    </span>
                                </th>
                            ))}
                        </tr>
                        <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                            <th className="px-4 py-2" />
                            {roles.map(r => (
                                PERM_COLS.map(c => (
                                    <th key={`${r.id}-${c.key}`} className={`px-1 py-2 text-center font-bold ${c.color} border-l border-slate-100 dark:border-slate-700 first:border-l`}>
                                        {c.label[0]}
                                    </th>
                                ))
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                        {groupEntries.map(([group, mods]) => {
                            const isCollapsed = collapsed[group];
                            return (
                                <div key={group} className="contents">
                                    {/* Group row */}
                                    <tr key={`g-${group}`}
                                        className="bg-slate-100 dark:bg-slate-700/50 cursor-pointer"
                                        onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}>
                                        <td className="px-4 py-2 font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1">
                                            {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                            {group}
                                        </td>
                                        {roles.map(r => PERM_COLS.map(c => (
                                            <td key={`${r.id}-${c.key}-g`} className="px-1 py-2 border-l border-slate-200 dark:border-slate-700" />
                                        )))}
                                    </tr>
                                    {/* Module rows */}
                                    {!isCollapsed && mods.map(mod => (
                                        <tr key={`${group}-${mod.module}`}
                                            className="hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                            <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400 pl-8">{mod.label}</td>
                                            {roles.map(r => {
                                                const rPerms = perms[r.id] || [];
                                                const mPerm  = rPerms.find(p => p.module === mod.module);
                                                return PERM_COLS.map(c => (
                                                    <td key={`${r.id}-${c.key}-${mod.module}`}
                                                        className="px-1 py-2.5 text-center border-l border-slate-100 dark:border-slate-700/50">
                                                        {mPerm?.[c.key]
                                                            ? <span className={`inline-block h-4 w-4 rounded-full ${c.bg} mx-auto`} title={`${c.label}: Enabled`} />
                                                            : <span className="inline-block h-4 w-4 rounded-full bg-slate-100 dark:bg-slate-700 mx-auto" title={`${c.label}: Disabled`} />}
                                                    </td>
                                                ));
                                            })}
                                        </tr>
                                    ))}
                                </div>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}