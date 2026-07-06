// src/pages/admin/UserFormPage.jsx
// Full-page Add / Edit user — redesigned with:
// • Phone number with country code selector
// • Soft delete (moves to trash, data preserved)
// • Restore from trash
// • Permanent delete (only from trash)
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
    User, Mail, Phone, MapPin, Building2, Shield, Lock,
    Save, RefreshCw, ArrowLeft, CheckCircle2, Eye, EyeOff,
    Trash2, AlertTriangle, CreditCard, Fingerprint, Globe,
    RotateCcw, ShieldAlert, UserCheck, BadgeCheck, Info,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser } from '../../services/api';
import { usePermissions } from '../../context/PermissionsContext';

// ── Country codes ─────────────────────────────────────────────────
const COUNTRY_CODES = [
    { code: '+975', flag: '🇧🇹', name: 'Bhutan',       short: 'BT' },
    { code: '+91',  flag: '🇮🇳', name: 'India',        short: 'IN' },
    { code: '+86',  flag: '🇨🇳', name: 'China',        short: 'CN' },
    { code: '+1',   flag: '🇺🇸', name: 'USA/Canada',   short: 'US' },
    { code: '+44',  flag: '🇬🇧', name: 'UK',           short: 'GB' },
    { code: '+61',  flag: '🇦🇺', name: 'Australia',    short: 'AU' },
    { code: '+65',  flag: '🇸🇬', name: 'Singapore',    short: 'SG' },
    { code: '+60',  flag: '🇲🇾', name: 'Malaysia',     short: 'MY' },
    { code: '+66',  flag: '🇹🇭', name: 'Thailand',     short: 'TH' },
    { code: '+977', flag: '🇳🇵', name: 'Nepal',        short: 'NP' },
    { code: '+94',  flag: '🇱🇰', name: 'Sri Lanka',    short: 'LK' },
    { code: '+880', flag: '🇧🇩', name: 'Bangladesh',   short: 'BD' },
    { code: '+92',  flag: '🇵🇰', name: 'Pakistan',     short: 'PK' },
    { code: '+971', flag: '🇦🇪', name: 'UAE',          short: 'AE' },
    { code: '+81',  flag: '🇯🇵', name: 'Japan',        short: 'JP' },
    { code: '+82',  flag: '🇰🇷', name: 'South Korea',  short: 'KR' },
];

// Parse stored contact_no into { code, number }
const parsePhone = (raw = '') => {
    if (!raw) return { code: '+975', number: '' };
    const match = COUNTRY_CODES.find(c => raw.startsWith(c.code));
    if (match) return { code: match.code, number: raw.slice(match.code.length).trim() };
    return { code: '+975', number: raw };
};

const joinPhone = (code, number) => number ? `${code} ${number}` : '';

// ── Field wrapper ─────────────────────────────────────────────────
function Field({ label, hint, error, required, optional, children }) {
    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {label}
                    {required && <span className="text-rose-500 ml-0.5">*</span>}
                </label>
                {optional && (
                    <span className="text-[10px] text-slate-400 font-normal normal-case tracking-normal">(optional)</span>
                )}
            </div>
            {children}
            {hint  && !error && <p className="text-xs text-slate-400 flex items-start gap-1"><Info className="h-3 w-3 mt-0.5 flex-shrink-0" />{hint}</p>}
            {error && <p className="text-xs text-rose-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3 flex-shrink-0" />{error}</p>}
        </div>
    );
}

// ── Text input ────────────────────────────────────────────────────
function TInput({ error, className = '', ...props }) {
    return (
        <input {...props}
            className={`w-full rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                bg-slate-50 dark:bg-slate-700/80 placeholder:text-slate-400
                border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400
                ${error ? 'border-rose-400 ring-1 ring-rose-300 bg-rose-50/30 dark:bg-rose-900/10' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}
                ${className}`}
        />
    );
}

// ── Password input ────────────────────────────────────────────────
function PInput({ error, ...props }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input {...props} type={show ? 'text' : 'password'}
                className={`w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-700 dark:text-slate-200
                    bg-slate-50 dark:bg-slate-700/80 placeholder:text-slate-400
                    border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-400
                    ${error ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300'}`} />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

// ── Phone input with country code ─────────────────────────────────
function PhoneInput({ value, onChange, error }) {
    const [code,   setCode]   = useState('+975');
    const [number, setNumber] = useState('');
    const [init,   setInit]   = useState(false);

    // Parse initial value once
    useEffect(() => {
        if (!init && value) {
            const p = parsePhone(value);
            setCode(p.code);
            setNumber(p.number);
            setInit(true);
        }
    }, [value, init]);

    const handleCode = (c) => {
        setCode(c);
        onChange(joinPhone(c, number));
    };
    const handleNumber = (n) => {
        // Only digits, spaces, dashes
        const clean = n.replace(/[^\d\s\-]/g, '');
        setNumber(clean);
        onChange(joinPhone(code, clean));
    };

    return (
        <div className={`flex rounded-xl border overflow-hidden transition-all focus-within:ring-2 focus-within:ring-primary-500/30 focus-within:border-primary-400
            ${error ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}>
            {/* Country code dropdown */}
            <div className="relative flex-shrink-0">
                <select
                    value={code}
                    onChange={e => handleCode(e.target.value)}
                    className="h-full pl-3 pr-7 py-3 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-0 focus:outline-none appearance-none cursor-pointer font-medium">
                    {COUNTRY_CODES.map(c => (
                        <option key={c.code} value={c.code}>
                            {c.flag} {c.code}
                        </option>
                    ))}
                </select>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="h-3 w-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </div>
            {/* Divider */}
            <div className="w-px bg-slate-200 dark:bg-slate-600 self-stretch" />
            {/* Number input */}
            <input
                type="tel"
                value={number}
                onChange={e => handleNumber(e.target.value)}
                placeholder="17 123 456"
                className="flex-1 px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none"
            />
        </div>
    );
}

// ── Section card ──────────────────────────────────────────────────
function SectionCard({ icon: Icon, title, subtitle, iconBg = 'bg-primary-100 dark:bg-primary-900/30', iconCl = 'text-primary-600', children, onSave, saving, saveLabel, isNew, badge }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                    <Icon className={`h-4 w-4 ${iconCl}`} />
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                        {badge}
                    </div>
                    {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
                </div>
                {onSave && !isNew && (
                    <button onClick={onSave} disabled={saving}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-all disabled:opacity-60 shadow-sm hover:shadow-md">
                        {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                        {saving ? 'Saving...' : (saveLabel || 'Save Changes')}
                    </button>
                )}
            </div>
            <div className="px-6 py-5">{children}</div>
        </div>
    );
}

// ── Toast ─────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    const isSuccess = type === 'success';
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-2xl text-white text-sm font-semibold
            ${isSuccess ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {isSuccess ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            {msg}
        </div>
    );
}

// ── Confirm dialog ─────────────────────────────────────────────────
function ConfirmModal({ title, message, confirmLabel, confirmClass, onConfirm, onCancel, loading, icon: Icon, extra }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
            onClick={onCancel}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
                onClick={e => e.stopPropagation()}>
                <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
                        {Icon && <Icon className="h-6 w-6 text-rose-500" />}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">{title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{message}</p>
                    </div>
                </div>
                {extra && <div className="mb-4">{extra}</div>}
                <div className="flex gap-3">
                    <button onClick={onCancel}
                        className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} disabled={loading}
                        className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 ${confirmClass}`}>
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}

const DZONGKHAGS = ['','Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
    'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
    'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'];

const ROLE_DESC = {
    ADMIN:        'Full system access — can manage users, roles, settings and all data.',
    DOE_HEAD:     'Can view all data, approve submissions and manage reporting.',
    DATA_MANAGER: 'Can create and edit energy data across all sectors.',
    DATA_FOCAL:   'Can enter and edit data for assigned sectors only.',
    VIEWER:       'Read-only access to dashboards and published reports.',
};

// ══════════════════════════════════════════════════════════════════
// Main
// ══════════════════════════════════════════════════════════════════
export default function UserFormPage() {
    const { id }   = useParams();
    const isNew    = !id;
    const navigate = useNavigate();
    const me       = getUser();
    const { refreshPermissions } = usePermissions();

    const [roles,   setRoles]   = useState([]);
    const [loading, setLoading] = useState(!isNew);
    const [toast,   setToast]   = useState(null);
    const [saving,  setSaving]  = useState({});

    // Modal states
    const [showTrashModal,     setShowTrashModal]     = useState(false);
    const [showRestoreModal,   setShowRestoreModal]   = useState(false);
    const [showPermDeleteModal,setShowPermDeleteModal] = useState(false);
    const [trashReason,        setTrashReason]        = useState('');
    const [modalLoading,       setModalLoading]       = useState(false);

    // User state from API
    const [userData, setUserData] = useState(null);
    const isDeleted = userData?.status === 'DELETED';
    const isSelf    = !isNew && String(id) === String(me?.id);

    // ── Section 1: Identity ───────────────────────────────────────
    const [identity, setIdentity] = useState({
        first_name: '', last_name: '', username: '', email: '',
        gender: '', employee_id: '', ndi_id_number: '',
        department: '', dzongkhag: '', contact_no: '',
    });
    const [identityErrors, setIdentityErrors] = useState({});

    // ── Section 2: Role & Status ──────────────────────────────────
    const [roleStatus, setRoleStatus] = useState({ role_id: '', status: 'ACTIVE' });
    const [roleErrors,  setRoleErrors]  = useState({});

    // ── Section 3: Password ───────────────────────────────────────
    const [password, setPassword] = useState({ password: '', confirm: '' });
    const [pwErrors, setPwErrors] = useState({});

    const showToast = (msg, type = 'success') => setToast({ msg, type });
    const setSav    = (k, v) => setSaving(s => ({ ...s, [k]: v }));

    // Load roles
    useEffect(() => {
        apiFetch('/auth/roles/').then(async r => { if (r?.ok) setRoles(await r.json()); });
    }, []);

    // Load user for edit
    useEffect(() => {
        if (isNew) return;
        (async () => {
            setLoading(true);
            const res = await apiFetch(`/auth/users/${id}/`);
            if (!res?.ok) { showToast('User not found', 'error'); navigate('/admin/users'); return; }
            const u = await res.json();
            setUserData(u);
            setIdentity({
                first_name: u.first_name || '', last_name: u.last_name || '',
                username: u.username || '', email: u.email || '',
                gender: u.gender || '', employee_id: u.employee_id || '',
                ndi_id_number: u.ndi_id_number || '', department: u.department || '',
                dzongkhag: u.dzongkhag || '', contact_no: u.contact_no || '',
            });
            setRoleStatus({ role_id: u.role?.id || '', status: u.status || 'ACTIVE' });
            setLoading(false);
        })();
    }, [id, isNew, navigate]);

    // ── Save identity ─────────────────────────────────────────────
    const saveIdentity = async () => {
        const e = {};
        if (!identity.first_name.trim()) e.first_name = 'Required';
        if (!identity.last_name.trim())  e.last_name  = 'Required';
        if (!identity.username.trim())   e.username   = 'Required';
        if (!identity.email.trim())      e.email      = 'Required';
        else if (!/\S+@\S+\.\S+/.test(identity.email)) e.email = 'Invalid email format';
        if (Object.keys(e).length) { setIdentityErrors(e); return; }
        setIdentityErrors({});
        setSav('identity', true);
        try {
            const res  = await apiFetch(`/auth/users/${id}/`, { method: 'PATCH', body: JSON.stringify(identity) });
            const data = await res.json();
            if (!res.ok) { setIdentityErrors(data); showToast('Failed to save.', 'error'); return; }
            setUserData(data);
            showToast('Profile updated successfully!');
        } finally { setSav('identity', false); }
    };

    // ── Save role/status ──────────────────────────────────────────
    const saveRoleStatus = async () => {
        if (!roleStatus.role_id) { setRoleErrors({ role_id: 'Please select a role' }); return; }
        setRoleErrors({});
        setSav('role', true);
        try {
            const res = await apiFetch(`/auth/users/${id}/`, {
                method: 'PATCH',
                body: JSON.stringify({ role_id: roleStatus.role_id, status: roleStatus.status }),
            });
            if (!res.ok) { showToast('Failed to save role.', 'error'); return; }
            const data = await res.json();
            setUserData(data);
            showToast('Role & status updated!');
            if (isSelf) await refreshPermissions();
        } finally { setSav('role', false); }
    };

    // ── Save password ─────────────────────────────────────────────
    const savePassword = async () => {
        const e = {};
        if (!password.password)                          e.password = 'Required';
        else if (password.password.length < 8)           e.password = 'Minimum 8 characters';
        if (!password.confirm)                           e.confirm  = 'Required';
        else if (password.password !== password.confirm) e.confirm  = 'Passwords do not match';
        if (Object.keys(e).length) { setPwErrors(e); return; }
        setPwErrors({});
        setSav('pw', true);
        try {
            const endpoint = isNew ? '/auth/users/' : `/auth/users/${id}/`;
            const method   = isNew ? 'POST'  : 'PATCH';
            const payload  = isNew
                ? { ...identity, ...roleStatus, password: password.password, confirm_password: password.confirm }
                : { password: password.password, confirm_password: password.confirm };
            const res  = await apiFetch(endpoint, { method, body: JSON.stringify(payload) });
            const data = await res.json();
            if (!res.ok) {
                if (data.username) setIdentityErrors(p => ({ ...p, username: data.username[0] || data.username }));
                if (data.email)    setIdentityErrors(p => ({ ...p, email: data.email[0] || data.email }));
                if (data.ndi_id_number) setIdentityErrors(p => ({ ...p, ndi_id_number: data.ndi_id_number[0] || data.ndi_id_number }));
                setPwErrors(data);
                showToast('Failed — check highlighted fields.', 'error');
                return;
            }
            if (isNew) {
                showToast('User created successfully!');
                navigate(`/admin/users/${data.id}/edit`);
            } else {
                setPassword({ password: '', confirm: '' });
                showToast('Password reset successfully!');
            }
        } finally { setSav('pw', false); }
    };

    // ── Soft delete (move to trash) ───────────────────────────────
    const handleTrash = async () => {
        setModalLoading(true);
        try {
            const res = await apiFetch(`/auth/users/${id}/`, {
                method: 'DELETE',
                body: JSON.stringify({ reason: trashReason }),
            });
            if (res?.ok || res?.status === 200) {
                showToast('User moved to trash. Data preserved.');
                setTimeout(() => navigate('/admin/users'), 1200);
            } else {
                showToast('Failed to delete.', 'error');
            }
        } finally { setModalLoading(false); setShowTrashModal(false); }
    };

    // ── Restore from trash ────────────────────────────────────────
    const handleRestore = async () => {
        setModalLoading(true);
        try {
            const res  = await apiFetch(`/auth/users/${id}/restore/`, { method: 'POST' });
            const data = await res?.json();
            if (res?.ok) {
                showToast(data?.detail || 'User restored successfully!');
                setUserData(data?.user || userData);
                setRoleStatus(p => ({ ...p, status: 'INACTIVE' }));
            } else {
                showToast('Failed to restore.', 'error');
            }
        } finally { setModalLoading(false); setShowRestoreModal(false); }
    };

    // ── Permanent delete ──────────────────────────────────────────
    const handlePermanentDelete = async () => {
        setModalLoading(true);
        try {
            const res = await apiFetch(`/auth/users/${id}/permanent-delete/`, { method: 'DELETE' });
            if (res?.ok || res?.status === 200) {
                showToast('User permanently removed.');
                setTimeout(() => navigate('/admin/users'), 1200);
            } else {
                showToast('Failed to permanently delete.', 'error');
            }
        } finally { setModalLoading(false); setShowPermDeleteModal(false); }
    };

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'User Management', href: '/admin/users' },
    ];

    if (loading) {
        return (
            <DashboardLayout breadcrumb={breadcrumbs} title={isNew ? 'Add User' : 'Edit User'}>
                <div className="flex items-center justify-center py-32 gap-3 text-slate-400">
                    <div className="h-6 w-6 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                    Loading...
                </div>
            </DashboardLayout>
        );
    }

    const selectedRole = roles.find(r => String(r.id) === String(roleStatus.role_id));

    return (
        <DashboardLayout breadcrumb={breadcrumbs} title={isNew ? 'Add New User' : 'Edit User'}>
            <div className="space-y-5 max-w-4xl mx-auto">

                {/* ── Page header ────────────────────────────────── */}
                <div className="flex items-start gap-4 flex-wrap">
                    <Link to="/admin/users"
                        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex-shrink-0">
                        <ArrowLeft className="h-4 w-4" /> Back to Users
                    </Link>
                    <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                            {isNew ? 'Add New User'
                                   : `${identity.first_name} ${identity.last_name}`.trim() || 'Edit User'}
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isNew
                                ? 'Fill all required fields then click Create User at the bottom'
                                : 'Each section saves independently — click Save Changes in the section you edited'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        {isSelf && (
                            <span className="text-xs font-semibold bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-700 px-3 py-1.5 rounded-full">
                                This is you
                            </span>
                        )}
                        {!isNew && userData?.ndi_verified && (
                            <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700 px-3 py-1.5 rounded-full">
                                <Fingerprint className="h-3.5 w-3.5" /> NDI Verified
                            </span>
                        )}
                        {isDeleted && (
                            <span className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700 px-3 py-1.5 rounded-full">
                                <Trash2 className="h-3.5 w-3.5" /> In Trash
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Trash notice ─────────────────────────────── */}
                {isDeleted && (
                    <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-5 py-4">
                        <div className="flex items-start gap-3">
                            <div className="h-9 w-9 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">This user is in the trash</p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
                                    Deleted by <strong>{userData?.deleted_by || 'admin'}</strong>
                                    {userData?.deleted_at && ` on ${new Date(userData.deleted_at).toLocaleDateString('en-BT', { day:'numeric', month:'short', year:'numeric' })}`}
                                    {userData?.deleted_reason && ` · Reason: ${userData.deleted_reason}`}
                                </p>
                                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                                    All data is preserved. Restore the user to re-enable their account.
                                </p>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                                <button onClick={() => setShowRestoreModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors">
                                    <RotateCcw className="h-3.5 w-3.5" /> Restore
                                </button>
                                <button onClick={() => setShowPermDeleteModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors">
                                    <Trash2 className="h-3.5 w-3.5" /> Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Section 1: Personal Info ─────────────────── */}
                <SectionCard
                    icon={User}
                    title="Personal Information"
                    subtitle="Full name, contact details and location"
                    iconBg="bg-blue-50 dark:bg-blue-900/20" iconCl="text-blue-600"
                    onSave={isDeleted ? null : saveIdentity}
                    saving={saving.identity}
                    isNew={isNew}>
                    <div className="space-y-5">

                        {/* Name row */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="First Name" required error={identityErrors.first_name}>
                                <TInput
                                    value={identity.first_name}
                                    onChange={e => setIdentity(p => ({ ...p, first_name: e.target.value }))}
                                    placeholder="e.g. Tashi"
                                    error={identityErrors.first_name}
                                    disabled={isDeleted} />
                            </Field>
                            <Field label="Last Name" required error={identityErrors.last_name}>
                                <TInput
                                    value={identity.last_name}
                                    onChange={e => setIdentity(p => ({ ...p, last_name: e.target.value }))}
                                    placeholder="e.g. Dorji"
                                    error={identityErrors.last_name}
                                    disabled={isDeleted} />
                            </Field>
                        </div>

                        {/* Username + Email */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Username" required error={identityErrors.username}
                                hint={isNew ? 'Used for agency/password login' : 'Cannot be changed after creation'}>
                                <TInput
                                    value={identity.username}
                                    onChange={e => setIdentity(p => ({ ...p, username: e.target.value }))}
                                    placeholder="e.g. tashi.dorji"
                                    disabled={!isNew || isDeleted}
                                    error={identityErrors.username}
                                    className={!isNew ? 'opacity-60 cursor-not-allowed' : ''} />
                            </Field>
                            <Field label="Email Address" required error={identityErrors.email}>
                                <TInput
                                    type="email"
                                    value={identity.email}
                                    onChange={e => setIdentity(p => ({ ...p, email: e.target.value }))}
                                    placeholder="tashi.dorji@energy.gov.bt"
                                    error={identityErrors.email}
                                    disabled={isDeleted} />
                            </Field>
                        </div>

                        {/* Phone + Gender */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Contact Number" optional
                                hint="Select country code then enter number">
                                <PhoneInput
                                    value={identity.contact_no}
                                    onChange={val => setIdentity(p => ({ ...p, contact_no: val }))}
                                    error={identityErrors.contact_no}
                                    disabled={isDeleted} />
                            </Field>
                            <Field label="Gender" optional>
                                <select
                                    value={identity.gender}
                                    onChange={e => setIdentity(p => ({ ...p, gender: e.target.value }))}
                                    disabled={isDeleted}
                                    className="w-full rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 hover:border-slate-300 transition-all appearance-none disabled:opacity-60">
                                    <option value="">Select...</option>
                                    <option value="M">Male</option>
                                    <option value="F">Female</option>
                                    <option value="O">Other / Prefer not to say</option>
                                </select>
                            </Field>
                        </div>

                        {/* Dzongkhag */}
                        <Field label="Dzongkhag" optional hint="Home or work district">
                            <select
                                value={identity.dzongkhag}
                                onChange={e => setIdentity(p => ({ ...p, dzongkhag: e.target.value }))}
                                disabled={isDeleted}
                                className="w-full rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 hover:border-slate-300 transition-all appearance-none disabled:opacity-60">
                                {DZONGKHAGS.map(d => (
                                    <option key={d} value={d}>{d || 'Select dzongkhag...'}</option>
                                ))}
                            </select>
                        </Field>
                    </div>
                </SectionCard>

                {/* ── Section 2: Work Info ─────────────────────── */}
                <SectionCard
                    icon={Building2}
                    title="Work Information"
                    subtitle="Employee ID, department and NDI credential linking"
                    iconBg="bg-violet-50 dark:bg-violet-900/20" iconCl="text-violet-600"
                    onSave={isDeleted ? null : saveIdentity}
                    saving={saving.identity}
                    saveLabel="Save Work Info"
                    isNew={isNew}>
                    <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Employee ID" optional hint="Government employee / staff ID">
                                <TInput
                                    value={identity.employee_id}
                                    onChange={e => setIdentity(p => ({ ...p, employee_id: e.target.value }))}
                                    placeholder="e.g. EMP-001"
                                    disabled={isDeleted} />
                            </Field>
                            <Field label="CID / National ID" optional
                                error={identityErrors.ndi_id_number}
                                hint="Bhutan CID — required to link this account to NDI wallet login">
                                <div className="relative">
                                    <TInput
                                        value={identity.ndi_id_number}
                                        onChange={e => setIdentity(p => ({ ...p, ndi_id_number: e.target.value }))}
                                        placeholder="e.g. 11512001234567"
                                        error={identityErrors.ndi_id_number}
                                        disabled={isDeleted}
                                        className="pr-10" />
                                    {userData?.ndi_verified && (
                                        <BadgeCheck className="absolute right-3 top-3.5 h-4 w-4 text-emerald-500" title="NDI verified" />
                                    )}
                                </div>
                            </Field>
                        </div>
                        <Field label="Department" optional hint="Government department or division">
                            <TInput
                                value={identity.department}
                                onChange={e => setIdentity(p => ({ ...p, department: e.target.value }))}
                                placeholder="e.g. Department of Energy, MoENR"
                                disabled={isDeleted} />
                        </Field>

                        {/* NDI status info */}
                        {!isNew && (
                            <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
                                userData?.ndi_verified
                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700'
                                    : 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                            }`}>
                                <Fingerprint className={`h-5 w-5 flex-shrink-0 ${userData?.ndi_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                                <div>
                                    <p className={`text-xs font-semibold ${userData?.ndi_verified ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500'}`}>
                                        {userData?.ndi_verified ? 'NDI Wallet Linked' : 'NDI Wallet Not Linked'}
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {userData?.ndi_verified
                                            ? 'User can log in with their Bhutan NDI wallet. Wallet linked automatically on first NDI login.'
                                            : 'Enter the CID above so this user\'s NDI wallet login links to this account automatically.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* ── Section 3: Role & Status ─────────────────── */}
                <SectionCard
                    icon={Shield}
                    title="Role & Access"
                    subtitle="Assign role and set account status"
                    iconBg="bg-emerald-50 dark:bg-emerald-900/20" iconCl="text-emerald-600"
                    onSave={isDeleted ? null : saveRoleStatus}
                    saving={saving.role}
                    saveLabel="Save Role"
                    isNew={isNew}>
                    <div className="space-y-5">
                        <Field label="Role" required error={roleErrors.role_id}
                            hint="Determines what the user can see and do in EIS">
                            <select
                                value={roleStatus.role_id}
                                onChange={e => setRoleStatus(p => ({ ...p, role_id: e.target.value }))}
                                disabled={isDeleted}
                                className={`w-full rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 border text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 hover:border-slate-300 transition-all appearance-none disabled:opacity-60
                                    ${roleErrors.role_id ? 'border-rose-400' : 'border-slate-200 dark:border-slate-600'}`}>
                                <option value="">Select a role...</option>
                                {roles.map(r => (
                                    <option key={r.id} value={r.id}>
                                        {r.role_name.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                        </Field>

                        {/* Role description card */}
                        {selectedRole && (
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3 flex items-start gap-3">
                                <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                        {selectedRole.role_name.replace(/_/g, ' ')}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {ROLE_DESC[selectedRole.role_name] || selectedRole.description || '—'}
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Status */}
                        <Field label="Account Status">
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { val:'ACTIVE',    label:'Active',    desc:'Can log in',    cls:'border-emerald-500 bg-emerald-500 text-white', unsel:'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-emerald-300' },
                                    { val:'INACTIVE',  label:'Inactive',  desc:'Login disabled', cls:'border-slate-500 bg-slate-500 text-white',   unsel:'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-slate-400' },
                                    { val:'SUSPENDED', label:'Suspended', desc:'Temporarily locked', cls:'border-rose-500 bg-rose-500 text-white',  unsel:'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-rose-300' },
                                ].map(s => {
                                    const isSel = roleStatus.status === s.val;
                                    const isDisabled = isDeleted || (isSelf && s.val !== 'ACTIVE');
                                    return (
                                        <button key={s.val}
                                            onClick={() => !isDisabled && setRoleStatus(p => ({ ...p, status: s.val }))}
                                            disabled={isDisabled}
                                            className={`py-3 px-3 rounded-xl border-2 text-center transition-all disabled:opacity-40 disabled:cursor-not-allowed
                                                ${isSel ? s.cls : 'bg-white dark:bg-slate-800 ' + s.unsel}`}>
                                            <p className={`text-xs font-bold ${isSel ? 'text-white' : ''}`}>{s.label}</p>
                                            <p className={`text-[10px] mt-0.5 ${isSel ? 'text-white/80' : 'text-slate-400'}`}>{s.desc}</p>
                                        </button>
                                    );
                                })}
                            </div>
                            {isSelf && <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 flex items-center gap-1.5"><AlertTriangle className="h-3 w-3" />You cannot deactivate your own account.</p>}
                        </Field>
                    </div>
                </SectionCard>

                {/* ── Section 4: Password ──────────────────────── */}
                <SectionCard
                    icon={Lock}
                    title={isNew ? 'Set Password' : 'Reset Password'}
                    subtitle={isNew ? 'Set the initial login password for agency login' : 'Override the user\'s password — they will need to change it on next login'}
                    iconBg="bg-amber-50 dark:bg-amber-900/20" iconCl="text-amber-600"
                    onSave={!isNew && !isDeleted ? savePassword : undefined}
                    saving={saving.pw}
                    saveLabel="Reset Password"
                    isNew={isNew}>
                    <div className="space-y-4">
                        {!isNew && (
                            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2">
                                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                                This will override the user's current password. User will be required to change it on next login.
                            </div>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label={isNew ? 'Password' : 'New Password'} required error={pwErrors.password}>
                                <PInput
                                    value={password.password}
                                    onChange={e => { setPassword(p => ({ ...p, password: e.target.value })); setPwErrors(p => ({ ...p, password: '' })); }}
                                    placeholder="Minimum 8 characters"
                                    error={pwErrors.password}
                                    disabled={isDeleted} />
                            </Field>
                            <Field label="Confirm Password" required error={pwErrors.confirm}>
                                <PInput
                                    value={password.confirm}
                                    onChange={e => { setPassword(p => ({ ...p, confirm: e.target.value })); setPwErrors(p => ({ ...p, confirm: '' })); }}
                                    placeholder="Re-enter password"
                                    error={pwErrors.confirm}
                                    disabled={isDeleted} />
                            </Field>
                        </div>
                        {password.confirm && password.password === password.confirm && password.password.length >= 8 && (
                            <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                            </p>
                        )}
                        {/* Password strength hints */}
                        {password.password && (
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { ok: password.password.length >= 8, label: '8+ chars' },
                                    { ok: /[A-Z]/.test(password.password), label: 'Uppercase' },
                                    { ok: /[0-9]/.test(password.password), label: 'Number' },
                                    { ok: /[^A-Za-z0-9]/.test(password.password), label: 'Symbol' },
                                ].map(({ ok, label }) => (
                                    <span key={label} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ok ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-700' : 'bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-700 dark:border-slate-600'}`}>
                                        {ok ? '✓' : '○'} {label}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </SectionCard>

                {/* ── Create button (new users only) ──────────── */}
                {isNew && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm px-6 py-5">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                            <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Ready to create?</p>
                                <p className="text-xs text-slate-400 mt-0.5">All required fields must be filled in all sections above.</p>
                            </div>
                            <button onClick={savePassword} disabled={saving.pw}
                                className="flex items-center gap-2 px-7 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-all disabled:opacity-60 shadow-sm hover:shadow-md">
                                {saving.pw ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                                {saving.pw ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Danger zone (edit only, not self, not deleted) */}
                {!isNew && !isSelf && !isDeleted && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-800/40 flex items-center gap-3"
                            style={{ background: 'linear-gradient(135deg, rgba(254,242,242,0.8) 0%, rgba(255,255,255,0.8) 100%)' }}>
                            <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <ShieldAlert className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h3>
                                <p className="text-xs text-rose-400 mt-0.5">These actions affect user access</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            {/* Move to trash */}
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                        <Trash2 className="h-4 w-4 text-rose-400" />
                                        Move to Trash
                                    </p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        User is deactivated and moved to trash. All data is preserved. Admin can restore anytime.
                                    </p>
                                </div>
                                <button onClick={() => setShowTrashModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors flex-shrink-0">
                                    <Trash2 className="h-4 w-4" /> Move to Trash
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ── Restore / Permanent delete (only for deleted users) */}
                {!isNew && isDeleted && !isSelf && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-rose-800/60 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-rose-100 dark:border-rose-800/40 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                                <ShieldAlert className="h-5 w-5 text-rose-500" />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-rose-700 dark:text-rose-400">Danger Zone</h3>
                                <p className="text-xs text-rose-400 mt-0.5">Permanent delete cannot be undone</p>
                            </div>
                        </div>
                        <div className="px-6 py-5 space-y-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Permanently Delete</p>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Removes the user and all associated data forever. This cannot be undone.
                                    </p>
                                </div>
                                <button onClick={() => setShowPermDeleteModal(true)}
                                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors flex-shrink-0">
                                    <Trash2 className="h-4 w-4" /> Delete Forever
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Move to trash modal ─────────────────────────── */}
            {showTrashModal && (
                <ConfirmModal
                    icon={Trash2}
                    title="Move User to Trash?"
                    message={`${identity.first_name} ${identity.last_name} will be deactivated. Their account data, history, and records are preserved. You can restore them at any time.`}
                    confirmLabel="Move to Trash"
                    confirmClass="bg-rose-500 hover:bg-rose-600"
                    onConfirm={handleTrash}
                    onCancel={() => { setShowTrashModal(false); setTrashReason(''); }}
                    loading={modalLoading}
                    extra={
                        <div>
                            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">
                                Reason <span className="font-normal normal-case tracking-normal text-slate-400">(optional)</span>
                            </label>
                            <textarea
                                value={trashReason}
                                onChange={e => setTrashReason(e.target.value)}
                                placeholder="e.g. Employee resigned, account inactive..."
                                rows={2}
                                className="w-full rounded-xl px-3 py-2.5 text-sm bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 resize-none" />
                        </div>
                    }
                />
            )}

            {/* ── Restore modal ───────────────────────────────── */}
            {showRestoreModal && (
                <ConfirmModal
                    icon={RotateCcw}
                    title="Restore User?"
                    message={`${identity.first_name} ${identity.last_name} will be restored as INACTIVE. You can then set their status to Active when ready.`}
                    confirmLabel="Restore User"
                    confirmClass="bg-emerald-600 hover:bg-emerald-700"
                    onConfirm={handleRestore}
                    onCancel={() => setShowRestoreModal(false)}
                    loading={modalLoading}
                />
            )}

            {/* ── Permanent delete modal ──────────────────────── */}
            {showPermDeleteModal && (
                <ConfirmModal
                    icon={Trash2}
                    title="Permanently Delete User?"
                    message={`This will permanently remove ${identity.first_name} ${identity.last_name} and all their data. This action cannot be undone.`}
                    confirmLabel="Delete Forever"
                    confirmClass="bg-rose-600 hover:bg-rose-700"
                    onConfirm={handlePermanentDelete}
                    onCancel={() => setShowPermDeleteModal(false)}
                    loading={modalLoading}
                />
            )}

            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}