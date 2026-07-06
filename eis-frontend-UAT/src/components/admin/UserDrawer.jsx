// src/components/admin/UserDrawer.jsx
// Side drawer for Add / Edit user — Phase 2
import { useState, useEffect } from 'react';
import { X, Eye, EyeOff, User, Mail, Phone, Building, MapPin, Shield, Lock } from 'lucide-react';
import { usersAPI } from '../../services/api';

const ROLES = [
    { value: '',             label: 'Select role...' },
    { value: 'ADMIN',        label: 'System Administrator' },
    { value: 'DOE_HEAD',     label: 'DOE Head' },
    { value: 'DATA_MANAGER', label: 'Data Manager' },
    { value: 'DATA_FOCAL',   label: 'Data Focal' },
    { value: 'VIEWER',       label: 'Viewer' },
];

const DZONGKHAGS = [
    '', 'Bumthang', 'Chhukha', 'Dagana', 'Gasa', 'Haa', 'Lhuentse',
    'Mongar', 'Paro', 'Pemagatshel', 'Punakha', 'Samdrup Jongkhar',
    'Samtse', 'Sarpang', 'Thimphu', 'Trashigang', 'Trashiyangtse',
    'Trongsa', 'Tsirang', 'Wangdue Phodrang', 'Zhemgang',
];

const EMPTY = {
    first_name: '', last_name: '', email: '', username: '',
    employee_id: '', contact_no: '', gender: '',
    role_id: '', department: '', dzongkhag: '',
    password: '', confirm_password: '',
};

// ── Field component ───────────────────────────────────────────────
function Field({ label, error, required, children }) {
    return (
        <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {error && <p className="text-xs text-rose-500">{error}</p>}
        </div>
    );
}

function Input({ error, ...props }) {
    return (
        <input
            {...props}
            className={`w-full rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                ${error ? 'bg-rose-50 ring-1 ring-rose-300' : 'bg-primary-50 border-none'}`}
        />
    );
}

function Select({ error, children, ...props }) {
    return (
        <select
            {...props}
            className={`w-full rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors appearance-none cursor-pointer
                ${error ? 'bg-rose-50 ring-1 ring-rose-300' : 'bg-primary-50 border-none'}`}
        >
            {children}
        </select>
    );
}

// ── Role badge preview ────────────────────────────────────────────
function RoleBadge({ role }) {
    const map = {
        ADMIN:        { label: 'System Administrator', cls: 'bg-purple-100 text-purple-700' },
        DOE_HEAD:     { label: 'DOE Head',             cls: 'bg-blue-50 text-blue-700' },
        DATA_MANAGER: { label: 'Data Manager',         cls: 'bg-primary-100 text-primary-700' },
        DATA_FOCAL:   { label: 'Data Focal',           cls: 'bg-emerald-50 text-emerald-700' },
        VIEWER:       { label: 'Viewer',               cls: 'bg-slate-100 text-slate-600' },
    };
    const r = map[role];
    if (!r) return null;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${r.cls}`}>
            <Shield className="h-3 w-3" />
            {r.label}
        </span>
    );
}

// ── Main Drawer ───────────────────────────────────────────────────
export default function UserDrawer({ mode, user, roles, onClose, onSaved }) {
    const [form,    setForm]    = useState(EMPTY);
    const [errors,  setErrors]  = useState({});
    const [loading, setLoading] = useState(false);
    const [showPw,  setShowPw]  = useState(false);
    const [showCPw, setShowCPw] = useState(false);
    const [tab,     setTab]     = useState('info'); // info | role | security

    const isEdit = mode === 'edit';

    useEffect(() => {
        if (isEdit && user) {
            setForm({
                first_name:       user.first_name  || '',
                last_name:        user.last_name   || '',
                email:            user.email       || '',
                username:         user.username    || '',
                employee_id:      user.employee_id || '',
                contact_no:       user.contact_no  || '',
                gender:           user.gender      || '',
                role_id:          user.role?.id    || '',
                department:       user.department  || '',
                dzongkhag:        user.dzongkhag   || '',
                password:         '',
                confirm_password: '',
            });
        } else {
            setForm(EMPTY);
        }
        setErrors({});
        setTab('info');
    }, [mode, user]);

    const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.first_name.trim())  e.first_name  = 'Required';
        if (!form.last_name.trim())   e.last_name   = 'Required';
        if (!form.email.trim())       e.email       = 'Required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (!form.username.trim())    e.username    = 'Required';
        if (!form.employee_id.trim()) e.employee_id = 'Required';
        if (!form.role_id)            e.role_id     = 'Please select a role';
        if (!isEdit) {
            if (!form.password)                             e.password = 'Required';
            else if (form.password.length < 8)              e.password = 'Minimum 8 characters';
            if (form.password !== form.confirm_password)    e.confirm_password = 'Passwords do not match';
        }
        if (isEdit && form.password && form.password !== form.confirm_password) {
            e.confirm_password = 'Passwords do not match';
        }
        setErrors(e);
        // Switch to tab with errors
        if (e.first_name || e.last_name || e.email || e.username || e.employee_id || e.contact_no) setTab('info');
        else if (e.role_id) setTab('role');
        else if (e.password || e.confirm_password) setTab('security');
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        try {
            const payload = {
                first_name:  form.first_name.trim(),
                last_name:   form.last_name.trim(),
                email:       form.email.trim(),
                username:    form.username.trim(),
                employee_id: form.employee_id.trim(),
                contact_no:  form.contact_no.trim(),
                gender:      form.gender,
                role_id:     form.role_id || null,
                department:  form.department.trim(),
                dzongkhag:   form.dzongkhag,
            };
            if (form.password) payload.password = form.password;

            const res = isEdit
                ? await usersAPI.update(user.id, payload)
                : await usersAPI.create(payload);

            if (!res?.ok) {
                const err = await res.json();
                const msg = err?.email?.[0] || err?.username?.[0] || err?.employee_id?.[0] || err?.detail || 'Failed to save.';
                setErrors({ _general: msg });
                return;
            }
            onSaved();
        } catch {
            setErrors({ _general: 'Network error. Please try again.' });
        } finally {
            setLoading(false);
        }
    };

    const TABS = [
        { id: 'info',     label: 'Personal Info', icon: User },
        { id: 'role',     label: 'Role & Access', icon: Shield },
        { id: 'security', label: 'Security',      icon: Lock },
    ];

    const selectedRole = ROLES.find(r => String(r.value) === String(form.role_id))?.value || '';

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md flex flex-col bg-white shadow-2xl">

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100"
                    style={{ background: 'linear-gradient(135deg, #1a4a3a 0%, #256648 100%)' }}>
                    <div>
                        <h2 className="text-base font-bold text-white">
                            {isEdit ? `Edit — ${user?.first_name} ${user?.last_name}` : 'Add New User'}
                        </h2>
                        <p className="text-xs text-primary-200 mt-0.5">
                            {isEdit ? 'Update user details and permissions' : 'Create a new system user account'}
                        </p>
                    </div>
                    <button onClick={onClose}
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 bg-slate-50/50 px-6">
                    {TABS.map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setTab(id)}
                            className={`flex items-center gap-1.5 px-3 py-3.5 text-xs font-semibold border-b-2 transition-colors -mb-px
                                ${tab === id
                                    ? 'border-primary-600 text-primary-700'
                                    : 'border-transparent text-slate-400 hover:text-slate-600'
                                }`}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {/* Error dot */}
                            {((id === 'info'     && (errors.first_name || errors.last_name || errors.email || errors.username || errors.employee_id)) ||
                              (id === 'role'     && errors.role_id) ||
                              (id === 'security' && (errors.password || errors.confirm_password))) && (
                                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 flex-shrink-0" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Body — scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5">

                    {/* General error */}
                    {errors._general && (
                        <div className="mb-4 rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                            ⚠ {errors._general}
                        </div>
                    )}

                    {/* ── TAB: Personal Info ─────────────────────── */}
                    {tab === 'info' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <Field label="First Name" required error={errors.first_name}>
                                    <Input placeholder="Tashi" value={form.first_name} onChange={set('first_name')} error={errors.first_name} />
                                </Field>
                                <Field label="Last Name" required error={errors.last_name}>
                                    <Input placeholder="Dorji" value={form.last_name} onChange={set('last_name')} error={errors.last_name} />
                                </Field>
                            </div>

                            <Field label="Email Address" required error={errors.email}>
                                <Input type="email" placeholder="tashi.dorji@energy.gov.bt" value={form.email} onChange={set('email')} error={errors.email} />
                            </Field>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Username" required error={errors.username}>
                                    <Input placeholder="tashi.dorji" value={form.username} onChange={set('username')} error={errors.username} />
                                </Field>
                                <Field label="Employee ID" required error={errors.employee_id}>
                                    <Input placeholder="EMP-001" value={form.employee_id} onChange={set('employee_id')} error={errors.employee_id} />
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <Field label="Contact No" error={errors.contact_no}>
                                    <Input placeholder="+975 17xxxxxx" value={form.contact_no} onChange={set('contact_no')} error={errors.contact_no} />
                                </Field>
                                <Field label="Gender" error={errors.gender}>
                                    <Select value={form.gender} onChange={set('gender')}>
                                        <option value="">Select...</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </Select>
                                </Field>
                            </div>

                            <Field label="Department" error={errors.department}>
                                <Input placeholder="Department of Energy" value={form.department} onChange={set('department')} error={errors.department} />
                            </Field>

                            <Field label="Dzongkhag" error={errors.dzongkhag}>
                                <Select value={form.dzongkhag} onChange={set('dzongkhag')}>
                                    {DZONGKHAGS.map(d => (
                                        <option key={d} value={d}>{d || 'Select dzongkhag...'}</option>
                                    ))}
                                </Select>
                            </Field>
                        </div>
                    )}

                    {/* ── TAB: Role & Access ─────────────────────── */}
                    {tab === 'role' && (
                        <div className="space-y-5">

                            <Field label="System Role" required error={errors.role_id}>
                                <Select value={form.role_id} onChange={set('role_id')} error={errors.role_id}>
                                    <option value="">Select role...</option>
                                    {(roles?.length ? roles.filter(r => r.id) : []).map(r => (
                                        <option key={r.id} value={r.id}>{r.role_name?.replace('_', ' ')}</option>
                                    ))}
                                    {/* Fallback if roles not loaded from API */}
                                    {(!roles?.length || roles.every(r => !r.id)) && ROLES.filter(r => r.value).map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </Select>
                            </Field>

                            {/* Role preview card */}
                            {selectedRole && (
                                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                                    <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-slate-400" />
                                        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Role Preview</span>
                                    </div>
                                    <div className="p-4 space-y-3">
                                        <RoleBadge role={selectedRole} />
                                        {selectedRole === 'ADMIN' && (
                                            <div className="space-y-1.5">
                                                {['Full system access', 'User management', 'All data modules', 'Audit logs', 'Master data config'].map(p => (
                                                    <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0" />{p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedRole === 'DOE_HEAD' && (
                                            <div className="space-y-1.5">
                                                {['View all dashboards', 'Approve data submissions', 'Download reports', 'View audit logs'].map(p => (
                                                    <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 flex-shrink-0" />{p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedRole === 'DATA_MANAGER' && (
                                            <div className="space-y-1.5">
                                                {['Manage data submissions', 'Validate & approve entries', 'Sector dashboard access', 'Generate reports'].map(p => (
                                                    <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-primary-500 flex-shrink-0" />{p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedRole === 'DATA_FOCAL' && (
                                            <div className="space-y-1.5">
                                                {['Submit energy data', 'View own submissions', 'Download forms', 'Assigned sector only'].map(p => (
                                                    <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 flex-shrink-0" />{p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {selectedRole === 'VIEWER' && (
                                            <div className="space-y-1.5">
                                                {['View public dashboards', 'Download public reports', 'Read-only access', 'No data entry'].map(p => (
                                                    <div key={p} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400 flex-shrink-0" />{p}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {!selectedRole && (
                                <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center">
                                    <Shield className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-400">Select a role to see permissions</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── TAB: Security ──────────────────────────── */}
                    {tab === 'security' && (
                        <div className="space-y-4">

                            {isEdit && (
                                <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 leading-relaxed">
                                    💡 Leave password blank to keep existing password unchanged.
                                </div>
                            )}

                            <Field label={isEdit ? 'New Password (optional)' : 'Password'} required={!isEdit} error={errors.password}>
                                <div className="relative">
                                    <Input
                                        type={showPw ? 'text' : 'password'}
                                        placeholder="Minimum 8 characters"
                                        value={form.password}
                                        onChange={set('password')}
                                        error={errors.password}
                                    />
                                    <button type="button" onClick={() => setShowPw(v => !v)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1">
                                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>

                            <Field label="Confirm Password" required={!isEdit} error={errors.confirm_password}>
                                <div className="relative">
                                    <Input
                                        type={showCPw ? 'text' : 'password'}
                                        placeholder="Repeat password"
                                        value={form.confirm_password}
                                        onChange={set('confirm_password')}
                                        error={errors.confirm_password}
                                    />
                                    <button type="button" onClick={() => setShowCPw(v => !v)}
                                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1">
                                        {showCPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </Field>

                            {/* Password strength */}
                            {form.password && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password Strength</p>
                                    <div className="flex gap-1">
                                        {[
                                            { check: form.password.length >= 8,           label: '8+ chars' },
                                            { check: /[A-Z]/.test(form.password),          label: 'Uppercase' },
                                            { check: /[0-9]/.test(form.password),          label: 'Number' },
                                            { check: /[^A-Za-z0-9]/.test(form.password),  label: 'Symbol' },
                                        ].map(({ check, label }) => (
                                            <div key={label} className="flex-1 text-center">
                                                <div className={`h-1.5 rounded-full mb-1 ${check ? 'bg-primary-500' : 'bg-slate-200'}`} />
                                                <p className={`text-[9px] font-medium ${check ? 'text-primary-600' : 'text-slate-400'}`}>{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {isEdit && (
                                <>
                                    <hr className="border-slate-100" />
                                    <div className="space-y-3">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Account Status</p>
                                        <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2">
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">NDI Verified</span>
                                                <span className={`font-semibold ${user?.is_verified ? 'text-primary-600' : 'text-slate-400'}`}>
                                                    {user?.is_verified ? '✓ Yes' : '✗ No'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">MFA Enabled</span>
                                                <span className={`font-semibold ${user?.is_mfa_enabled ? 'text-primary-600' : 'text-slate-400'}`}>
                                                    {user?.is_mfa_enabled ? '✓ Yes' : '✗ No'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                                <span className="text-slate-500">NDI Sub</span>
                                                <span className="font-mono text-[10px] text-slate-400 truncate max-w-[140px]">
                                                    {user?.ndi_sub || 'Not linked'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between gap-3">
                    <button onClick={onClose}
                        className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
                        Cancel
                    </button>
                    <div className="flex items-center gap-3">
                        {/* Tab navigation */}
                        {tab !== 'security' && (
                            <button
                                onClick={() => setTab(tab === 'info' ? 'role' : 'security')}
                                className="px-5 py-2.5 rounded-full border border-primary-200 text-sm font-medium text-primary-700 hover:bg-primary-50 transition-colors">
                                Next →
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={loading}
                            className="px-6 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors flex items-center gap-2 disabled:opacity-60">
                            {loading
                                ? <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                : null
                            }
                            {isEdit ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}