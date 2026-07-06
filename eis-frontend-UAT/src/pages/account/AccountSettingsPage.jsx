// src/pages/account/AccountSettingsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    User, Lock, Shield, Monitor, Trash2, Smartphone,
    Eye, EyeOff, Save, RefreshCw, CheckCircle2, LogOut,
    Copy, AlertTriangle, Mail, Phone, Key,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch, getUser, clearAuth } from '../../services/api';

// ── Shared helpers ────────────────────────────────────────────────
function Field({ label, hint, error, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint  && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
            {error && <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">⚠ {error}</p>}
        </div>
    );
}

function TInput({ error, className = '', ...props }) {
    return (
        <input {...props}
            className={`w-full rounded-xl px-4 py-3 text-sm text-slate-700 dark:text-slate-200
                bg-slate-50 dark:bg-slate-700/80 placeholder:text-slate-400
                border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30
                ${error ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 dark:border-slate-600'}
                ${className}`}
        />
    );
}

function PInput({ error, className = '', ...props }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input {...props} type={show ? 'text' : 'password'}
                className={`w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-700 dark:text-slate-200
                    bg-slate-50 dark:bg-slate-700/80 placeholder:text-slate-400
                    border transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500/30
                    ${error ? 'border-rose-400 ring-1 ring-rose-300' : 'border-slate-200 dark:border-slate-600'}
                    ${className}`} />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        { label: '8+ chars',     ok: password.length >= 8 },
        { label: 'Uppercase',    ok: /[A-Z]/.test(password) },
        { label: 'Number',       ok: /\d/.test(password) },
        { label: 'Special char', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const n = checks.filter(c => c.ok).length;
    const bar = ['', 'bg-rose-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][n];
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? bar : 'bg-slate-200 dark:bg-slate-600'}`} />)}
                <span className="text-xs font-semibold text-slate-500 ml-1 w-12">{['','Weak','Fair','Good','Strong'][n]}</span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {checks.map(c => (
                    <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {c.ok ? '✓' : '○'} {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : '⚠'} {msg}
        </div>
    );
}

function SectionCard({ title, children }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600 p-5 space-y-4">
            {title && <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 pb-2">{title}</h3>}
            {children}
        </div>
    );
}

function InfoBanner({ type, children }) {
    const s = {
        blue:  'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300',
        amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300',
        green: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
        rose:  'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700 text-rose-700 dark:text-rose-400',
    }[type] || s.blue;
    return <div className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${s}`}>{children}</div>;
}

// ── Tabs ──────────────────────────────────────────────────────────
const ALL_TABS = [
    { id: 'general',  label: 'General Info',        icon: User,     superadmin: true  },
    { id: 'password', label: 'Change Password',     icon: Lock,     superadmin: true  },
    { id: 'tfa',      label: 'Two-Factor & Verify', icon: Shield,   superadmin: false },
    { id: 'sessions', label: 'Browser Sessions',    icon: Monitor,  superadmin: true  },
    { id: 'delete',   label: 'Delete Account',      icon: Trash2,   superadmin: true  },
];

// ── GENERAL INFO ──────────────────────────────────────────────────
function GeneralInfo({ onToast }) {
    const user    = getUser();
    const fileRef = useRef();
    const DZONGKHAGS = ['','Bumthang','Chhukha','Dagana','Gasa','Haa','Lhuentse','Mongar','Paro',
        'Pemagatshel','Punakha','Samdrup Jongkhar','Samtse','Sarpang','Thimphu',
        'Trashigang','Trashiyangtse','Trongsa','Tsirang','Wangdue Phodrang','Zhemgang'];

    const [form, setForm] = useState({
        first_name:    user?.first_name !== 'NDI'  ? (user?.first_name  || '') : '',
        last_name:     user?.last_name  !== 'User' ? (user?.last_name   || '') : '',
        email:         user?.email         || '',
        contact_no:    user?.contact_no    || '',
        gender:        user?.gender        || '',
        dzongkhag:     user?.dzongkhag     || '',
        employee_id:   user?.employee_id   || '',
        department:    user?.department    || '',
        ndi_id_number: user?.ndi_id_number || '',
    });
    const [errors,  setErrors]  = useState({});
    const [saving,  setSaving]  = useState(false);
    const [avatar,  setAvatar]  = useState(null);
    const [preview, setPreview] = useState(user?.avatar_url || null);

    const initials = ((form.first_name?.[0]||'') + (form.last_name?.[0]||'')).toUpperCase()
                     || user?.username?.[0]?.toUpperCase() || '?';
    const set = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

    const handleAvatarChange = e => {
        const f = e.target.files[0]; if (!f) return;
        setAvatar(f); setPreview(URL.createObjectURL(f));
    };

    const handleSave = async () => {
        const e = {};
        if (!form.first_name.trim()) e.first_name = 'Required';
        if (!form.last_name.trim())  e.last_name  = 'Required';
        if (!form.email.trim())      e.email      = 'Required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        try {
            let res;
            if (avatar) {
                // FormData — apiFetch now correctly omits Content-Type so browser sets multipart boundary
                const fd = new FormData();
                Object.entries(form).forEach(([k, v]) => {
                    if (v !== null && v !== undefined && v !== '') fd.append(k, v);
                });
                fd.append('avatar', avatar);
                res = await apiFetch('/auth/me/', { method: 'PATCH', body: fd });
            } else {
                res = await apiFetch('/auth/me/', { method: 'PATCH', body: JSON.stringify(form) });
            }
            if (!res) { onToast('Network error', 'error'); return; }
            const data = await res.json();
            if (!res.ok) { setErrors(data); onToast('Failed to update.', 'error'); return; }
            localStorage.setItem('user', JSON.stringify({ ...getUser(), ...data }));
            // Notify Header/other components that user data changed
            window.dispatchEvent(new Event('storage'));
            if (data.avatar_url) setPreview(data.avatar_url);
            setAvatar(null);
            onToast('Profile updated!', 'success');
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-6">
            {/* Avatar row */}
            <div className="flex items-center gap-5 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-2xl border border-slate-200 dark:border-slate-600">
                <div className="relative flex-shrink-0">
                    <div className="h-20 w-20 rounded-full bg-primary-600 flex items-center justify-center text-2xl font-bold text-white overflow-hidden ring-4 ring-primary-100 dark:ring-primary-900/40">
                        {preview ? <img src={preview} className="h-full w-full object-cover" alt="" /> : <span>{initials}</span>}
                    </div>
                    <button onClick={() => fileRef.current?.click()}
                        className="absolute -bottom-0.5 -right-0.5 h-7 w-7 rounded-full bg-primary-600 hover:bg-primary-700 border-2 border-white dark:border-slate-800 shadow flex items-center justify-center text-white transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-base">{form.first_name} {form.last_name}</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">@{user?.username}</p>
                    {avatar && <p className="text-xs text-primary-600 mt-1 font-medium">📷 New photo selected — click Save to apply</p>}
                    {!avatar && <p className="text-xs text-slate-400 mt-1">Click the pencil icon to change your photo</p>}
                    {user?.ndi_verified && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mt-2">
                            <Shield className="h-3.5 w-3.5" /> NDI Identity Verified
                        </span>
                    )}
                </div>
            </div>

            {/* Name + email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="First Name" required error={errors.first_name}>
                    <TInput value={form.first_name} onChange={set('first_name')} placeholder="First name" error={errors.first_name} />
                </Field>
                <Field label="Last Name" required error={errors.last_name}>
                    <TInput value={form.last_name} onChange={set('last_name')} placeholder="Last name" error={errors.last_name} />
                </Field>
            </div>
            <Field label="Email Address" required error={errors.email}>
                <TInput type="email" value={form.email} onChange={set('email')} placeholder="you@energy.gov.bt" error={errors.email} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Contact Number">
                    <TInput value={form.contact_no} onChange={set('contact_no')} placeholder="+975 17xxxxxx" />
                </Field>
                <Field label="Gender">
                    <select value={form.gender} onChange={set('gender')}
                        className="w-full rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none">
                        <option value="">Select...</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                        <option value="O">Other</option>
                    </select>
                </Field>
            </div>
            <Field label="Dzongkhag">
                <select value={form.dzongkhag} onChange={set('dzongkhag')}
                    className="w-full rounded-xl px-4 py-3 text-sm bg-slate-50 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30 appearance-none">
                    {DZONGKHAGS.map(d => <option key={d} value={d}>{d || 'Select dzongkhag...'}</option>)}
                </select>
            </Field>

            <div className="border-t border-slate-200 dark:border-slate-600 pt-4">
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Optional Details</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Employee ID" hint="Your government employee ID">
                        <TInput value={form.employee_id} onChange={set('employee_id')} placeholder="e.g. EMP-001" />
                    </Field>
                    <Field label="CID / National ID" hint={user?.ndi_verified ? '✓ Identity verified via NDI' : 'From your Bhutan NDI credential'}>
                        <div className="relative">
                            <TInput value={form.ndi_id_number} onChange={set('ndi_id_number')} placeholder="e.g. 11512345678" />
                            {user?.ndi_verified && (
                                <span className="absolute right-3 top-3 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-200 pointer-events-none">✓ NDI</span>
                            )}
                        </div>
                    </Field>
                </div>
                <div className="mt-4">
                    <Field label="Department" hint="Your department or division">
                        <TInput value={form.department} onChange={set('department')} placeholder="e.g. Department of Energy" />
                    </Field>
                </div>
            </div>

            {/* Read-only */}
            <div className="flex items-center justify-between rounded-xl bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-4 py-3">
                <div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Username</p>
                    <p className="text-[11px] text-slate-400">Cannot be changed after setup</p>
                </div>
                <code className="text-sm font-mono text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-600">@{user?.username}</code>
            </div>

            <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-sm">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
        </div>
    );
}

// ── CHANGE PASSWORD ───────────────────────────────────────────────
function ChangePassword({ onToast }) {
    const user = getUser();
    const [form, setForm]     = useState({ current:'', password:'', confirm:'' });
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const set = k => e => { setForm(p=>({...p,[k]:e.target.value})); if(errors[k]) setErrors(p=>({...p,[k]:''})); };

    const handleSave = async () => {
        const e = {};
        if (!user?.ndi_sub && !form.current) e.current  = 'Required';
        if (!form.password)                  e.password = 'Required';
        else if (form.password.length < 8)   e.password = 'Minimum 8 characters';
        if (!form.confirm)                   e.confirm  = 'Required';
        else if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
        if (Object.keys(e).length) { setErrors(e); return; }
        setSaving(true);
        try {
            const res  = await apiFetch('/auth/change-password/', { method:'POST', body:JSON.stringify({ old_password:form.current, new_password:form.password }) });
            if (!res.ok) { const d=await res.json(); setErrors({current: d?.old_password?.[0]||d?.detail||'Incorrect password'}); return; }
            setForm({ current:'', password:'', confirm:'' });
            onToast('Password changed successfully!','success');
        } finally { setSaving(false); }
    };

    return (
        <div className="space-y-5 max-w-xl">
            <InfoBanner type="blue">
                🔒 Use at least 8 characters. Include uppercase letters, numbers and special characters for a strong password.
            </InfoBanner>
            {!user?.ndi_sub && (
                <Field label="Current Password" required error={errors.current}>
                    <PInput value={form.current} onChange={set('current')} placeholder="Enter current password" error={errors.current} />
                </Field>
            )}
            <Field label="New Password" required error={errors.password}>
                <PInput value={form.password} onChange={set('password')} placeholder="Create new password" error={errors.password} />
                <PasswordStrength password={form.password} />
            </Field>
            <Field label="Confirm New Password" required error={errors.confirm}>
                <PInput value={form.confirm} onChange={set('confirm')} placeholder="Re-enter new password" error={errors.confirm} />
                {form.confirm && form.password === form.confirm && (
                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1"><CheckCircle2 className="h-3 w-3" /> Passwords match</p>
                )}
            </Field>
            <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 px-8 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60 shadow-sm">
                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
                {saving ? 'Changing...' : 'Change Password'}
            </button>
        </div>
    );
}

// ── TWO-FACTOR AUTH + EMAIL/PHONE VERIFY ─────────────────────────
function TwoFactorAndVerify({ onToast }) {
    const user = getUser();
    const [mfaStep,  setMfaStep]  = useState('info'); // info | setup | verify
    const [qr,       setQr]       = useState('');
    const [secret,   setSecret]   = useState('');
    const [totp_uri, setTotpUri]  = useState('');
    const [mfaCode,  setMfaCode]  = useState('');
    const [disCode,  setDisCode]  = useState('');
    const [loading,  setLoading]  = useState('');
    const [copied,   setCopied]   = useState(false);

    // Email verification
    const [emailStep,  setEmailStep]  = useState(user?.email_verified ? 'done' : 'idle'); // idle|sent|done
    const [emailCode,  setEmailCode]  = useState('');
    const [emailErr,   setEmailErr]   = useState('');

    // Phone verification
    const [phoneStep,  setPhoneStep]  = useState(user?.phone_verified ? 'done' : 'idle');
    const [phoneCode,  setPhoneCode]  = useState('');
    const [phoneErr,   setPhoneErr]   = useState('');
    const [debugOtp,   setDebugOtp]   = useState('');

    // ── 2FA ──
    const setupMFA = async () => {
        setLoading('mfa-setup');
        try {
            const res  = await apiFetch('/auth/mfa/setup/', { method:'POST' });
            const data = await res.json();
            if (!res.ok) { onToast(data.error || 'Failed to setup 2FA','error'); return; }
            setQr(data.qr_url); setSecret(data.secret); setTotpUri(data.totp_uri);
            setMfaStep('setup');
        } finally { setLoading(''); }
    };

    const verifyMFA = async () => {
        if (mfaCode.length !== 6) return;
        setLoading('mfa-verify');
        try {
            const res = await apiFetch('/auth/mfa/verify/', { method:'POST', body:JSON.stringify({ code:mfaCode }) });
            const d   = await res.json();
            if (!res.ok) { onToast(d.error||'Invalid code','error'); return; }
            const stored = getUser();
            localStorage.setItem('user', JSON.stringify({ ...stored, is_mfa_enabled:true }));
            onToast('2FA enabled! Your account is now protected.','success');
            setMfaStep('info'); setMfaCode('');
        } finally { setLoading(''); }
    };

    const disableMFA = async () => {
        if (!disCode || disCode.length !== 6) { onToast('Enter your 6-digit code to disable 2FA','error'); return; }
        setLoading('mfa-disable');
        try {
            const res = await apiFetch('/auth/mfa/disable/', { method:'POST', body:JSON.stringify({ code:disCode }) });
            const d   = await res.json();
            if (!res.ok) { onToast(d.error||'Invalid code','error'); return; }
            const stored = getUser();
            localStorage.setItem('user', JSON.stringify({ ...stored, is_mfa_enabled:false }));
            onToast('2FA disabled.','success');
            setDisCode('');
        } finally { setLoading(''); }
    };

    // ── Email OTP ──
    const sendEmailOTP = async () => {
        setLoading('email-send'); setEmailErr('');
        try {
            const res = await apiFetch('/auth/verify-email/send/', { method:'POST' });
            const d   = await res.json();
            if (!res.ok) { setEmailErr(d.error||'Failed'); return; }
            setEmailStep('sent');
            onToast(`Code sent to ${user?.email}`,'success');
        } finally { setLoading(''); }
    };

    const confirmEmailOTP = async () => {
        setLoading('email-verify'); setEmailErr('');
        try {
            const res = await apiFetch('/auth/verify-email/confirm/', { method:'POST', body:JSON.stringify({ code:emailCode }) });
            const d   = await res.json();
            if (!res.ok) { setEmailErr(d.error||'Invalid code'); return; }
            const stored = getUser();
            localStorage.setItem('user', JSON.stringify({ ...stored, email_verified:true }));
            setEmailStep('done');
            onToast('Email verified!','success');
        } finally { setLoading(''); }
    };

    // ── Phone OTP ──
    const sendPhoneOTP = async () => {
        setLoading('phone-send'); setPhoneErr('');
        try {
            const res = await apiFetch('/auth/verify-phone/send/', { method:'POST' });
            const d   = await res.json();
            if (!res.ok) { setPhoneErr(d.error||'Failed'); return; }
            if (d.debug_otp) setDebugOtp(d.debug_otp); // dev only
            setPhoneStep('sent');
            onToast(`Code sent to ${user?.contact_no}`,'success');
        } finally { setLoading(''); }
    };

    const confirmPhoneOTP = async () => {
        setLoading('phone-verify'); setPhoneErr('');
        try {
            const res = await apiFetch('/auth/verify-phone/confirm/', { method:'POST', body:JSON.stringify({ code:phoneCode }) });
            const d   = await res.json();
            if (!res.ok) { setPhoneErr(d.error||'Invalid code'); return; }
            const stored = getUser();
            localStorage.setItem('user', JSON.stringify({ ...stored, phone_verified:true }));
            setPhoneStep('done');
            onToast('Phone verified!','success');
        } finally { setLoading(''); }
    };

    const isMfaEnabled = getUser()?.is_mfa_enabled;

    return (
        <div className="space-y-6">

            {/* ── EMAIL VERIFICATION ────── */}
            <SectionCard title="📧 Email Verification">
                {!user?.email ? (
                    <InfoBanner type="amber">No email set. Add your email in <strong>General Info</strong> first.</InfoBanner>
                ) : emailStep === 'done' || user?.email_verified ? (
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Email Verified</p>
                            <p className="text-xs text-slate-500">{user?.email}</p>
                        </div>
                    </div>
                ) : emailStep === 'idle' ? (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Verify <strong className="text-slate-700 dark:text-slate-200">{user?.email}</strong> to confirm your email address.</p>
                        <button onClick={sendEmailOTP} disabled={loading === 'email-send'}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                            {loading === 'email-send' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                            Send Verification Code
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <InfoBanner type="green">Code sent to <strong>{user?.email}</strong>. Check your inbox.</InfoBanner>
                        {emailErr && <p className="text-xs text-rose-500">⚠ {emailErr}</p>}
                        <div className="flex gap-3 items-end">
                            <Field label="Enter 6-digit code">
                                <input value={emailCode} onChange={e => setEmailCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    placeholder="000000" maxLength={6}
                                    className="w-44 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                            </Field>
                            <button onClick={confirmEmailOTP} disabled={emailCode.length !== 6 || loading === 'email-verify'}
                                className="mb-0 flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                                {loading === 'email-verify' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Verify
                            </button>
                            <button onClick={() => setEmailStep('idle')} className="mb-0 px-4 py-3 text-xs text-slate-400 hover:text-slate-600">Resend</button>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── PHONE VERIFICATION ────── */}
            <SectionCard title="📱 Phone Verification">
                {!user?.contact_no ? (
                    <InfoBanner type="amber">No phone number set. Add it in <strong>General Info</strong> first.</InfoBanner>
                ) : phoneStep === 'done' || user?.phone_verified ? (
                    <div className="flex items-center gap-3 py-2">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Phone Verified</p>
                            <p className="text-xs text-slate-500">{user?.contact_no}</p>
                        </div>
                    </div>
                ) : phoneStep === 'idle' ? (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Verify <strong className="text-slate-700 dark:text-slate-200">{user?.contact_no}</strong> to confirm your phone number.</p>
                        <button onClick={sendPhoneOTP} disabled={loading === 'phone-send'}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                            {loading === 'phone-send' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Phone className="h-4 w-4" />}
                            Send Verification Code
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <InfoBanner type="green">Code sent to <strong>{user?.contact_no}</strong>.</InfoBanner>
                        {debugOtp && <InfoBanner type="amber">⚡ Dev mode — OTP: <strong className="font-mono text-lg">{debugOtp}</strong></InfoBanner>}
                        {phoneErr && <p className="text-xs text-rose-500">⚠ {phoneErr}</p>}
                        <div className="flex gap-3 items-end">
                            <Field label="Enter 6-digit code">
                                <input value={phoneCode} onChange={e => setPhoneCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    placeholder="000000" maxLength={6}
                                    className="w-44 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                            </Field>
                            <button onClick={confirmPhoneOTP} disabled={phoneCode.length !== 6 || loading === 'phone-verify'}
                                className="flex items-center gap-2 px-5 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                                {loading === 'phone-verify' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Verify
                            </button>
                            <button onClick={() => setPhoneStep('idle')} className="px-4 py-3 text-xs text-slate-400 hover:text-slate-600">Resend</button>
                        </div>
                    </div>
                )}
            </SectionCard>

            {/* ── 2FA ─────────────────────── */}
            <SectionCard title="🔐 Two-Factor Authentication (Google Authenticator)">
                {/* Status */}
                <div className={`flex items-center gap-4 p-4 rounded-xl border ${isMfaEnabled ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700' : 'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'}`}>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${isMfaEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}>
                        <Smartphone className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <p className={`font-bold text-sm ${isMfaEnabled ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                            {isMfaEnabled ? '2FA is Active' : '2FA is Disabled'}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {isMfaEnabled ? 'Your account is protected with Google Authenticator.' : 'Add an extra layer of security with a time-based code.'}
                        </p>
                    </div>
                    {isMfaEnabled && <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />}
                </div>

                {/* Setup flow */}
                {!isMfaEnabled && mfaStep === 'info' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            {['Download Google Authenticator (iOS / Android) or any TOTP app like Authy or Microsoft Authenticator.',
                              'Click "Setup 2FA" below — a QR code will appear.',
                              'Scan the QR code with your authenticator app.',
                              'Enter the 6-digit code from the app to confirm.'].map((s, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                                    <span className="h-5 w-5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>
                                    {s}
                                </div>
                            ))}
                        </div>
                        <button onClick={setupMFA} disabled={loading === 'mfa-setup'}
                            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                            {loading === 'mfa-setup' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                            Setup 2FA with Google Authenticator
                        </button>
                    </div>
                )}

                {!isMfaEnabled && mfaStep === 'setup' && (
                    <div className="space-y-5">
                        <InfoBanner type="blue">Scan this QR code with <strong>Google Authenticator</strong> or any TOTP app.</InfoBanner>
                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex-shrink-0">
                                <img src={qr} alt="2FA QR Code" className="h-44 w-44" />
                            </div>
                            <div className="space-y-4 flex-1">
                                <div>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Can't scan? Enter this code manually:</p>
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2">
                                        <code className="flex-1 text-sm font-mono text-slate-700 dark:text-slate-200 tracking-widest break-all">{secret}</code>
                                        <button onClick={() => { navigator.clipboard.writeText(secret); setCopied(true); setTimeout(()=>setCopied(false),2000); }}
                                            className="text-slate-400 hover:text-primary-600 transition-colors flex-shrink-0">
                                            {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                    <p><strong>App:</strong> EIS Bhutan</p>
                                    <p><strong>Account:</strong> {user?.email || user?.username}</p>
                                    <p><strong>Type:</strong> Time-based (TOTP)</p>
                                </div>
                                <button onClick={() => setMfaStep('verify')}
                                    className="w-full py-3 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold transition-colors">
                                    I've scanned the QR — Enter Code →
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {!isMfaEnabled && mfaStep === 'verify' && (
                    <div className="space-y-4">
                        <InfoBanner type="blue">Open Google Authenticator and enter the <strong>6-digit code</strong> for EIS Bhutan.</InfoBanner>
                        <Field label="6-digit code from app">
                            <input value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                placeholder="000000" maxLength={6}
                                className="w-full rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.4em] bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                        </Field>
                        <div className="flex gap-3">
                            <button onClick={verifyMFA} disabled={mfaCode.length !== 6 || loading === 'mfa-verify'}
                                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                                {loading === 'mfa-verify' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                Verify & Enable 2FA
                            </button>
                            <button onClick={() => setMfaStep('setup')}
                                className="px-5 py-3 rounded-full border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                ← Back
                            </button>
                        </div>
                    </div>
                )}

                {isMfaEnabled && (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                            2FA is active. You will be asked for a code from Google Authenticator every time you log in.
                        </p>
                        <div className="space-y-3">
                            <Field label="Enter current 6-digit code to disable 2FA">
                                <input value={disCode} onChange={e => setDisCode(e.target.value.replace(/\D/g,'').slice(0,6))}
                                    placeholder="000000" maxLength={6}
                                    className="w-44 rounded-xl px-4 py-3 text-center text-xl font-mono tracking-widest bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/30" />
                            </Field>
                            <button onClick={disableMFA} disabled={disCode.length !== 6 || loading === 'mfa-disable'}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-semibold hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors disabled:opacity-60">
                                {loading === 'mfa-disable' ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
                                Disable 2FA
                            </button>
                        </div>
                    </div>
                )}
            </SectionCard>
        </div>
    );
}

// ── SESSIONS ──────────────────────────────────────────────────────
function Sessions({ onToast }) {
    const navigate = useNavigate();
    const user     = getUser();
    const handleLogout = async () => {
        try { await apiFetch('/auth/logout/', { method:'POST', body:JSON.stringify({ refresh:localStorage.getItem('refresh_token') }) }); } catch {}
        clearAuth(); navigate('/login');
    };
    return (
        <div className="space-y-5 max-w-2xl">
            <SectionCard title="Current Session">
                <div className="divide-y divide-slate-200 dark:divide-slate-600">
                    {[
                        ['User',       `${user?.first_name||''} ${user?.last_name||''}`.trim()||user?.username],
                        ['Username',   user?.username],
                        ['Role',       user?.role?.role_name?.replace(/_/g,' ')||'—'],
                        ['Login type', user?.ndi_sub ? '🔐 Bhutan NDI' : '🔑 Agency Login'],
                        ['NDI Verified', user?.ndi_verified ? '✓ Yes' : '✗ No'],
                        ['2FA',          user?.is_mfa_enabled ? '✓ Enabled' : '✗ Disabled'],
                    ].map(([k,v]) => (
                        <div key={k} className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-slate-500 dark:text-slate-400">{k}</span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{v}</span>
                        </div>
                    ))}
                </div>
            </SectionCard>
            <div className="rounded-2xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-5 space-y-3">
                <div className="flex items-start gap-3">
                    <LogOut className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold text-rose-700 dark:text-rose-400">Sign out everywhere</p>
                        <p className="text-xs text-rose-500 dark:text-rose-400 mt-0.5">Signs you out from all browsers and devices. You'll need to log in again.</p>
                    </div>
                </div>
                <button onClick={handleLogout}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-rose-300 dark:border-rose-700 text-rose-600 dark:text-rose-400 text-sm font-bold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors">
                    <LogOut className="h-4 w-4" /> Sign Out All Sessions
                </button>
            </div>
        </div>
    );
}

// ── DELETE ACCOUNT ────────────────────────────────────────────────
function DeleteAccount({ onToast }) {
    const navigate = useNavigate();
    const [confirm,  setConfirm]  = useState('');
    const [password, setPassword] = useState('');
    const [loading,  setLoading]  = useState(false);
    const PHRASE = 'DELETE MY ACCOUNT';

    const handleDelete = async () => {
        setLoading(true);
        try {
            const res = await apiFetch('/auth/delete-account/', { method:'DELETE', body:JSON.stringify({ password }) });
            if (res.ok) { clearAuth(); navigate('/login'); }
            else { const d=await res.json(); onToast(d?.detail||'Failed to delete account.','error'); }
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-5 max-w-2xl">
            <InfoBanner type="rose">
                <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span><strong>This action is permanent.</strong> Deleting your account removes all data, settings and access. This cannot be undone.</span>
                </div>
            </InfoBanner>
            <SectionCard>
                <Field label="Your Password" hint="Enter your current password to confirm identity">
                    <PInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" />
                </Field>
                <Field label={`Type "${PHRASE}" to confirm`}>
                    <TInput value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder={PHRASE} />
                </Field>
                <button onClick={handleDelete} disabled={loading || confirm !== PHRASE || !password}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold transition-colors disabled:opacity-40 shadow-sm">
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    {loading ? 'Deleting...' : 'Permanently Delete Account'}
                </button>
            </SectionCard>
        </div>
    );
}

// ── MAIN ──────────────────────────────────────────────────────────
export default function AccountSettingsPage() {
    const location  = useLocation();
    const user      = getUser();
    const isSuperAdmin = !!user?.is_superuser;

    // Superadmin doesn't need 2FA/verification — filter out that tab
    const TABS = ALL_TABS.filter(t => !isSuperAdmin || t.superadmin);

    // If superadmin somehow lands on 'tfa', redirect to 'general'
    const defaultTab = location.state?.tab === 'tfa' && isSuperAdmin
        ? 'general'
        : (location.state?.tab || 'general');

    const [tab,   setTab]   = useState(defaultTab);
    const [toast, setToast] = useState(null);

    return (
        <DashboardLayout breadcrumb="Account" title="Account Settings">
            <div className="space-y-5">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="px-6 py-5" style={{ background:'linear-gradient(135deg,#1e3a5f 0%,#1a4a3a 100%)' }}>
                        <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">Account</p>
                        <h1 className="text-xl font-bold text-white">Account Settings</h1>
                        <p className="text-sm text-slate-300 mt-0.5">Manage your profile, security and preferences</p>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-5">
                    {/* Sidebar tabs */}
                    <div className="lg:w-56 flex-shrink-0">
                        <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                            {TABS.map(({ id, label, icon: Icon }) => (
                                <button key={id} onClick={() => setTab(id)}
                                    className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold transition-all whitespace-nowrap lg:w-full
                                        ${tab === id
                                            ? id === 'delete'
                                                ? 'bg-rose-500 text-white shadow-sm'
                                                : 'bg-primary-600 text-white shadow-sm'
                                            : id === 'delete'
                                                ? 'text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}>
                                    <Icon className="h-4 w-4 flex-shrink-0" />
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content — full width */}
                    <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-6 pb-3 border-b border-slate-100 dark:border-slate-700">
                            {TABS.find(t => t.id === tab)?.label}
                        </h2>
                        {tab === 'general'  && <GeneralInfo          onToast={(m,t) => setToast({msg:m,type:t})} />}
                        {tab === 'password' && <ChangePassword        onToast={(m,t) => setToast({msg:m,type:t})} />}
                        {tab === 'tfa'      && <TwoFactorAndVerify    onToast={(m,t) => setToast({msg:m,type:t})} />}
                        {tab === 'sessions' && <Sessions              onToast={(m,t) => setToast({msg:m,type:t})} />}
                        {tab === 'delete'   && <DeleteAccount         onToast={(m,t) => setToast({msg:m,type:t})} />}
                    </div>
                </div>
            </div>
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}