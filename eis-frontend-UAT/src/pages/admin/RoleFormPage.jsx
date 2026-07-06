// src/pages/admin/RoleFormPage.jsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    Shield, Save, RefreshCw, ArrowLeft, CheckCircle2,
    Lock, Trash2, AlertTriangle, Users, Info,
    Eye, Edit, Plus, Minus,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser } from '../../services/api';
import { usePermissions } from '../../context/PermissionsContext';

// ── Helpers ───────────────────────────────────────────────────────
function Field({ label, hint, error, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint  && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
            {error && <p className="text-xs text-rose-500 mt-1">⚠ {error}</p>}
        </div>
    );
}

function TInput({ error, ...props }) {
    return (
        <input {...props}
            className={`w-full rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                bg-slate-50 dark:bg-slate-700/80 placeholder:text-slate-400
                border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30
                ${error ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 dark:border-slate-600'}`}
        />
    );
}

function SectionCard({ icon: Icon, title, subtitle, iconBg, iconCl, children, onSave, saving, saveLabel, isNew, locked }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg || 'bg-primary-50 dark:bg-primary-900/20'}`}>
                    <Icon className={`h-4.5 w-4.5 ${iconCl || 'text-primary-600'}`} />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {locked && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full">
                        <Lock className="h-3 w-3" /> System Role
                    </span>
                )}
                {onSave && !isNew && (
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors disabled:opacity-60 shadow-sm">
                        {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {saving ? 'Saving...' : (saveLabel || 'Save')}
                    </button>
                )}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : '⚠'} {msg}
        </div>
    );
}

const PERM_COLS = [
    { key: 'can_view',     label: 'View',     bg: 'bg-blue-500',    light: 'bg-blue-50 dark:bg-blue-900/20',       text: 'text-blue-600 dark:text-blue-400'       },
    { key: 'can_create',   label: 'Create',   bg: 'bg-emerald-500', light: 'bg-emerald-50 dark:bg-emerald-900/20', text: 'text-emerald-600 dark:text-emerald-400' },
    { key: 'can_edit',     label: 'Edit',     bg: 'bg-amber-500',   light: 'bg-amber-50 dark:bg-amber-900/20',     text: 'text-amber-600 dark:text-amber-400'     },
    { key: 'can_delete',   label: 'Delete',   bg: 'bg-rose-500',    light: 'bg-rose-50 dark:bg-rose-900/20',       text: 'text-rose-600 dark:text-rose-400'       },
    { key: 'can_upload',   label: 'Upload',   bg: 'bg-violet-500',  light: 'bg-violet-50 dark:bg-violet-900/20',   text: 'text-violet-600 dark:text-violet-400',
      groups: ['Data Collection'] },                                               // shown only for relevant groups
    { key: 'can_download', label: 'Download', bg: 'bg-cyan-500',    light: 'bg-cyan-50 dark:bg-cyan-900/20',       text: 'text-cyan-600 dark:text-cyan-400',
      groups: ['Reports', 'Dashboard', 'Data Collection'] },
];

function PermToggle({ value, onChange, disabled, colMeta }) {
    return (
        <button onClick={() => !disabled && onChange(!value)} disabled={disabled}
            className={`relative w-11 h-6 rounded-full transition-all flex-shrink-0
                ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                ${value ? colMeta.bg : 'bg-slate-200 dark:bg-slate-600'}`}>
            <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all
                ${value ? 'left-6' : 'left-1'}`} />
        </button>
    );
}

const SYSTEM_ROLES = ['ADMIN', 'DOE_HEAD', 'DATA_MANAGER', 'DATA_FOCAL', 'VIEWER'];

// ── Main ──────────────────────────────────────────────────────────
export default function RoleFormPage() {
    const { id }   = useParams();
    const isNew    = !id;
    const navigate = useNavigate();
    const me       = getUser();
    const isAdmin  = me?.role?.role_name === 'ADMIN';
    const { refreshPermissions } = usePermissions();

    const [loading,  setLoading]  = useState(!isNew);
    const [toast,    setToast]    = useState(null);
    const [confirm,  setConfirm]  = useState(false);
    const [saving,   setSaving]   = useState({});
    const [isSystem, setIsSystem] = useState(false);

    // Section 1 — Identity
    const [info,      setInfo]      = useState({ role_name: '', description: '' });
    const [infoErr,   setInfoErr]   = useState({});

    // Section 2 — Permissions
    const [perms,     setPerms]     = useState([]);
    const [groups,    setGroups]    = useState([]);
    const [collapsed, setCollapsed] = useState({});

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const setSav    = (k, v) => setSaving(s => ({ ...s, [k]: v }));

    // Load role for edit
    useEffect(() => {
        if (isNew) {
            // Load empty permission template
            loadPermTemplate();
            return;
        }
        (async () => {
            setLoading(true);
            const [roleRes, permRes] = await Promise.all([
                apiFetch(`/auth/roles/${id}/`),
                apiFetch(`/auth/roles/${id}/permissions/`),
            ]);
            if (!roleRes?.ok) { showToast('Role not found', 'error'); navigate('/admin/roles'); return; }
            const role = await roleRes.json();
            setInfo({ role_name: role.role_name, description: role.description || '' });
            setIsSystem(SYSTEM_ROLES.includes(role.role_name));

            if (permRes?.ok) {
                const data = await permRes.json();
                setPermsAndGroups(data.permissions);
            }
            setLoading(false);
        })();
    }, [id, isNew]);

    const loadPermTemplate = async () => {
        // Get modules list to build empty permission template
        const res = await apiFetch('/auth/permissions/modules/');
        if (res?.ok) {
            const moduleGroups = await res.json();
            const allPerms = moduleGroups.flatMap(g =>
                g.modules.map(m => ({
                    module: m.key, label: m.label, group: g.group,
                    can_view: false, can_create: false, can_edit: false, can_delete: false,
                }))
            );
            setPermsAndGroups(allPerms);
        }
    };

    const setPermsAndGroups = (permissions) => {
        setPerms(permissions);
        const g = {};
        permissions.forEach(p => { g[p.group] = g[p.group] || []; g[p.group].push(p); });
        setGroups(Object.entries(g));
    };

    const updatePerm = (module, key, value) => {
        setPerms(prev => prev.map(p => p.module === module ? { ...p, [key]: value } : p));
        setGroups(prev => prev.map(([g, mods]) => [g, mods.map(p => p.module === module ? { ...p, [key]: value } : p)]));
    };

    const toggleGroupAll = (group, key, value) => {
        setPerms(prev => prev.map(p => p.group === group ? { ...p, [key]: value } : p));
        setGroups(prev => prev.map(([g, mods]) => [g, mods.map(p => p.group === group ? { ...p, [key]: value } : p)]));
    };

    const setModuleAll = (module, value) => {
        PERM_COLS.forEach(c => {
            setPerms(prev => prev.map(p => p.module === module ? { ...p, [c.key]: value } : p));
        });
        setGroups(prev => prev.map(([g, mods]) => [g, mods.map(p => p.module === module
            ? { ...p, can_view: value, can_create: value, can_edit: value, can_delete: value } : p)]));
    };

    // Save info
    const saveInfo = async () => {
        const e = {};
        if (!info.role_name.trim()) e.role_name = 'Required';
        if (Object.keys(e).length) { setInfoErr(e); return; }
        setInfoErr({});
        setSav('info', true);
        try {
            const res  = await apiFetch(`/auth/roles/${id}/`, { method: 'PATCH', body: JSON.stringify(info) });
            const data = await res.json();
            if (!res.ok) { setInfoErr(data); showToast(data.error || 'Failed to save.', 'error'); return; }
            setInfo({ role_name: data.role_name, description: data.description || '' });
            showToast('Role updated!');
        } finally { setSav('info', false); }
    };

    // Save permissions
    const savePerms = async () => {
        setSav('perms', true);
        try {
            const res  = await apiFetch(`/auth/roles/${id}/permissions/`, {
                method: 'PUT', body: JSON.stringify({ permissions: perms }),
            });
            const data = await res.json();
            if (!res.ok) { showToast(data.error || 'Failed to save permissions.', 'error'); return; }
            showToast('Permissions saved!');
            // Refresh current user's permissions in case they share this role
            await refreshPermissions();
        } finally { setSav('perms', false); }
    };

    // Create role (new)
    const createRole = async () => {
        const e = {};
        if (!info.role_name.trim()) e.role_name = 'Role name is required';
        if (Object.keys(e).length) { setInfoErr(e); return; }
        setInfoErr({});
        setSav('create', true);
        try {
            const res  = await apiFetch('/auth/roles/', { method: 'POST', body: JSON.stringify(info) });
            const data = await res.json();
            if (!res.ok) { setInfoErr(data); showToast(data.error || data.role_name || 'Failed to create.', 'error'); return; }
            showToast('Role created!');
            // Now save permissions for the new role
            await apiFetch(`/auth/roles/${data.id}/permissions/`, {
                method: 'PUT', body: JSON.stringify({ permissions: perms }),
            });
            navigate(`/admin/roles/${data.id}/edit`);
        } finally { setSav('create', false); }
    };

    // Delete role
    const deleteRole = async () => {
        setSav('delete', true);
        try {
            const res = await apiFetch(`/auth/roles/${id}/`, { method: 'DELETE' });
            if (res?.ok || res?.status === 204) {
                showToast('Role deleted.');
                setTimeout(() => navigate('/admin/roles'), 800);
            } else {
                const d = await res.json();
                showToast(d.error || 'Failed to delete.', 'error');
            }
        } finally { setSav('delete', false); setConfirm(false); }
    };

    if (loading) {
        return (
            <DashboardLayout breadcrumb="Roles" title={isNew ? 'Add Role' : 'Edit Role'}>
                <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                    Loading...
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout breadcrumb="Roles & Permissions" title={isNew ? 'Add New Role' : 'Edit Role'}>
            <div className="space-y-5 max-w-4xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/admin/roles')}
                        className="flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <ArrowLeft className="h-4 w-4" /> Back to Roles
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {isNew ? 'Add New Role' : `Edit: ${info.role_name.replace(/_/g, ' ')}`}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isNew ? 'Define the role and configure its module permissions'
                                   : 'Each section saves independently — click Save in the section you changed'}
                        </p>
                    </div>
                </div>

                {/* ── Section 1: Role Info ── */}
                <SectionCard icon={Shield} title="Role Information"
                    subtitle="Name and description for this role"
                    iconBg="bg-primary-50 dark:bg-primary-900/20" iconCl="text-primary-600"
                    onSave={saveInfo} saving={saving.info} saveLabel="Save Info"
                    isNew={isNew} locked={isSystem && !isNew}>
                    <div className="space-y-4">
                        {isSystem && !isNew ? (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <Lock className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                <span>This is a system role. The role name cannot be changed, but you can update the description and permissions below.</span>
                            </div>
                        ) : null}
                        <Field label="Role Name" required error={infoErr.role_name}
                            hint={isSystem ? 'System role name cannot be changed' : 'Use UPPERCASE with underscores e.g. DATA_ANALYST'}>
                            <TInput
                                value={info.role_name}
                                onChange={e => setInfo(p => ({ ...p, role_name: e.target.value.toUpperCase().replace(/\s+/g, '_') }))}
                                placeholder="e.g. DATA_ANALYST"
                                disabled={isSystem && !isNew}
                                error={infoErr.role_name}
                                className={isSystem && !isNew ? 'opacity-60 cursor-not-allowed' : ''}
                            />
                        </Field>
                        <Field label="Description" hint="Brief description of this role's responsibilities">
                            <textarea
                                value={info.description}
                                onChange={e => setInfo(p => ({ ...p, description: e.target.value }))}
                                rows={3}
                                placeholder="e.g. Can view and submit energy data for assigned sectors..."
                                className="w-full rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                                    bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600
                                    placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/30
                                    resize-none transition-colors"
                            />
                        </Field>
                    </div>
                </SectionCard>

                {/* ── Section 2: Permissions ── */}
                <SectionCard icon={Eye} title="Module Permissions"
                    subtitle="Configure what this role can access in each module"
                    iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconCl="text-emerald-600"
                    onSave={savePerms} saving={saving.perms} saveLabel="Save Permissions"
                    isNew={isNew} locked={info.role_name === 'ADMIN' && !isNew}>

                    {info.role_name === 'ADMIN' && !isNew ? (
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-4 text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                            The ADMIN role has full access to all modules and cannot be restricted.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {/* Legend */}
                            <div className="flex items-center gap-4 pb-2 border-b border-slate-100 dark:border-slate-700 flex-wrap">
                                <span className="text-xs text-slate-400 font-medium">Toggle permissions:</span>
                                {PERM_COLS.map(c => (
                                    <span key={c.key} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                        <span className={`h-3 w-3 rounded-full ${c.bg}`} /> {c.label}
                                    </span>
                                ))}
                            </div>

                            {groups.map(([group, mods]) => {
                                const isCollapsed = collapsed[group];
                                return (
                                    <div key={group} className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        {/* Group header */}
                                        <div className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer"
                                            onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))}>
                                            <button className="text-slate-400 flex-shrink-0">
                                                {isCollapsed
                                                    ? <Plus className="h-3.5 w-3.5" />
                                                    : <Minus className="h-3.5 w-3.5" />}
                                            </button>
                                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex-1">
                                                {group}
                                            </span>
                                            <span className="text-xs text-slate-400">{mods.length} modules</span>
                                            {/* Group-level quick toggles — filtered by group */}
                                            {!isCollapsed && isAdmin && (
                                                <div className="flex items-center gap-2 ml-2" onClick={e => e.stopPropagation()}>
                                                    {PERM_COLS.filter(c => !c.groups || c.groups.includes(group)).map(c => {
                                                        const allOn = mods.every(m => m[c.key]);
                                                        return (
                                                            <button key={c.key}
                                                                onClick={() => toggleGroupAll(group, c.key, !allOn)}
                                                                title={`${allOn ? 'Disable' : 'Enable'} ${c.label} for all`}
                                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors
                                                                    ${allOn ? `${c.bg} text-white border-transparent` : `bg-white dark:bg-slate-700 ${c.text} border-current opacity-70 hover:opacity-100`}`}>
                                                                {c.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>

                                        {/* Module rows */}
                                        {!isCollapsed && (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                                                {mods.map(mod => {
                                                    // Filter cols relevant to this group
                                                    const cols = PERM_COLS.filter(c => !c.groups || c.groups.includes(group));
                                                    const enabledCount = cols.filter(c => mod[c.key]).length;
                                                    const allOn = cols.length > 0 && cols.every(c => mod[c.key]);
                                                    return (
                                                        <div key={mod.module}
                                                            className="flex items-center gap-4 px-4 py-3 hover:bg-slate-50/50 dark:hover:bg-slate-700/20 transition-colors">
                                                            {/* Module name */}
                                                            <div className="w-48 flex-shrink-0">
                                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{mod.label}</p>
                                                                <p className="text-[10px] text-slate-400 font-mono">{mod.module}</p>
                                                            </div>
                                                            {/* All/None toggle */}
                                                            {isAdmin && (
                                                                <button onClick={() => setModuleAll(mod.module, !allOn)}
                                                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors w-16 text-center flex-shrink-0
                                                                        ${allOn
                                                                            ? 'bg-slate-700 dark:bg-slate-500 text-white border-transparent'
                                                                            : 'bg-white dark:bg-slate-800 text-slate-500 border-slate-300 dark:border-slate-600 hover:border-slate-500'}`}>
                                                                    {allOn ? 'All On' : 'All Off'}
                                                                </button>
                                                            )}
                                                            {/* Toggle switches — show relevant cols for group */}
                                                            <div className="flex items-center gap-4 flex-1 flex-wrap">
                                                                {cols.map(c => (
                                                                    <div key={c.key} className="flex flex-col items-center gap-1">
                                                                        <PermToggle
                                                                            value={mod[c.key]}
                                                                            onChange={v => updatePerm(mod.module, c.key, v)}
                                                                            disabled={!isAdmin || info.role_name === 'ADMIN'}
                                                                            colMeta={c}
                                                                        />
                                                                        <span className={`text-[9px] font-bold ${mod[c.key] ? c.text : 'text-slate-300 dark:text-slate-600'}`}>
                                                                            {c.label}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            {/* Summary */}
                                                            <div className="w-24 flex-shrink-0 text-right">
                                                                {enabledCount === 0
                                                                    ? <span className="text-[10px] text-slate-300 dark:text-slate-600">No access</span>
                                                                    : enabledCount === cols.length
                                                                        ? <span className="text-[10px] text-emerald-600 font-bold">Full</span>
                                                                        : <span className="text-[10px] text-blue-500 font-medium">{enabledCount}/{cols.length}</span>}
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
                </SectionCard>

                {/* ── Create button (new) ── */}
                {isNew && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-6 py-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Ready to create?</p>
                                <p className="text-xs text-slate-400 mt-0.5">Fill in the role name and configure permissions, then click Create Role.</p>
                            </div>
                            <button onClick={createRole} disabled={saving.create}
                                className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-sm">
                                {saving.create ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                {saving.create ? 'Creating...' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Danger zone (edit, non-system roles) ── */}
                {!isNew && !isSystem && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-800 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                <AlertTriangle className="h-4.5 w-4.5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h3>
                                <p className="text-xs text-rose-400 mt-0.5">Irreversible — proceed with caution</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Delete this role</p>
                                <p className="text-xs text-slate-400 mt-0.5">Only possible if no users are currently assigned to this role.</p>
                            </div>
                            <button onClick={() => setConfirm(true)}
                                className="flex items-center gap-2 px-4 py-2 rounded-full border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                <Trash2 className="h-4 w-4" /> Delete Role
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm delete */}
            {confirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm" onClick={() => setConfirm(false)}>
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <Trash2 className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-slate-100">Delete Role?</h3>
                                <p className="text-xs text-slate-400">This cannot be undone.</p>
                            </div>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                            Delete <strong className="text-slate-700 dark:text-slate-200">{info.role_name}</strong>? This will fail if any users are assigned to this role.
                        </p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirm(false)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Cancel
                            </button>
                            <button onClick={deleteRole} disabled={saving.delete}
                                className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                                {saving.delete ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}