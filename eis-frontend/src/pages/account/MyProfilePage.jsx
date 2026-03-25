// src/pages/account/MyProfilePage.jsx
import { useNavigate } from 'react-router-dom';
import {
    Shield, CheckCircle2, AlertCircle, User, Mail, Phone,
    BadgeCheck, MapPin, Building2, CreditCard, ChevronRight,
    Edit3, Lock, Smartphone,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getUser } from '../../services/api';

// ── Completeness fields ───────────────────────────────────────────
function getCompleteness(user) {
    const isSuperAdmin = !!user?.is_superuser;
    const allFields = [
        { key: 'first_name',     label: 'First Name',      weight: 8,  value: user?.first_name && user.first_name !== 'NDI' },
        { key: 'avatar',         label: 'Profile Photo',   weight: 5,  value: !!user?.avatar_url },
        { key: 'last_name',      label: 'Last Name',       weight: 7,  value: user?.last_name  && user.last_name  !== 'User' },
        { key: 'email',          label: 'Email Address',   weight: 8,  value: !!user?.email },
        { key: 'email_verified', label: 'Email Verified',  weight: 8,  value: !!user?.email_verified,  skipForSuperAdmin: true },
        { key: 'contact_no',     label: 'Phone Number',    weight: 7,  value: !!user?.contact_no },
        { key: 'phone_verified', label: 'Phone Verified',  weight: 7,  value: !!user?.phone_verified,  skipForSuperAdmin: true },
        { key: 'gender',         label: 'Gender',          weight: 3,  value: !!user?.gender },
        { key: 'dzongkhag',      label: 'Dzongkhag',       weight: 3,  value: !!user?.dzongkhag },
        { key: 'department',     label: 'Department',      weight: 7,  value: !!user?.department },
        { key: 'employee_id',    label: 'Employee ID',     weight: 8,  value: !!user?.employee_id },
        { key: 'ndi_id_number',  label: 'CID / NDI ID',    weight: 8,  value: !!user?.ndi_id_number,   skipForSuperAdmin: true },
        { key: 'ndi_verified',   label: 'NDI Verified',    weight: 8,  value: !!user?.ndi_verified,    skipForSuperAdmin: true },
        { key: 'is_mfa_enabled', label: '2FA Enabled',     weight: 8,  value: !!user?.is_mfa_enabled,  skipForSuperAdmin: true },
    ];
    const fields = allFields.filter(f => !isSuperAdmin || !f.skipForSuperAdmin);
    const total  = fields.reduce((s, f) => s + f.weight, 0);
    const earned = fields.filter(f => f.value).reduce((s, f) => s + f.weight, 0);
    return { pct: Math.round((earned / total) * 100), fields, missing: fields.filter(f => !f.value) };
}

function ProfileRing({ pct }) {
    const r = 46, c = 2 * Math.PI * r;
    const off = c - (pct / 100) * c;
    const color = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : '#f59e0b';
    return (
        <div className="relative inline-flex items-center justify-center">
            <svg width="116" height="116" viewBox="0 0 116 116">
                <circle cx="58" cy="58" r={r} fill="none" stroke="#e2e8f0" strokeWidth="9" />
                <circle cx="58" cy="58" r={r} fill="none" stroke={color} strokeWidth="9"
                    strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
                    transform="rotate(-90 58 58)" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-slate-800 dark:text-slate-100 leading-none">{pct}%</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Complete</span>
            </div>
        </div>
    );
}

function DetailRow({ icon: Icon, label, value, badge, missing, onFix }) {
    return (
        <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                ${value ? 'bg-primary-50 dark:bg-primary-900/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                <Icon className={`h-4 w-4 ${value ? 'text-primary-600 dark:text-primary-400' : 'text-slate-300 dark:text-slate-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-400">{label}</p>
                <p className={`text-sm font-semibold truncate ${value ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 italic'}`}>
                    {value || 'Not set'}
                </p>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
                {badge === 'verified' && (
                    <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                    </span>
                )}
                {badge === 'unverified' && (
                    <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Unverified
                    </span>
                )}
                {missing && onFix && (
                    <button onClick={onFix}
                        className="text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full hover:bg-amber-100 transition-colors flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> Add
                    </button>
                )}
                {value && !missing && !badge && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
            </div>
        </div>
    );
}

export default function MyProfilePage() {
    const navigate = useNavigate();
    const user     = getUser();
    const { pct, fields } = getCompleteness(user);
    const barColor = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-blue-500' : 'bg-amber-400';
    const pctLabel = pct >= 80 ? 'Great profile!' : pct >= 50 ? 'Almost there' : 'Just getting started';
    const pctColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-blue-600' : 'text-amber-600';

    const go = (tab = 'general') => navigate('/account/settings', { state: { tab } });
    const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase()
                     || user?.username?.[0]?.toUpperCase() || '?';
    const isSuperAdmin = !!user?.is_superuser;

    return (
        <DashboardLayout breadcrumb="Account" title="My Profile">
            <div className="space-y-5">

                {/* ── Hero ─────────────────────────────────────────── */}
                <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="px-6 py-6 flex flex-col sm:flex-row items-center gap-6"
                        style={{ background: 'linear-gradient(135deg,#1e3a5f 0%,#1a4a3a 100%)' }}>
                        <div className="relative flex-shrink-0">
                            <div className="h-20 w-20 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-3xl font-bold text-white shadow-lg overflow-hidden">
                                {user?.avatar_url
                                    ? <img src={user.avatar_url} alt="avatar" className="h-full w-full object-cover" />
                                    : <span>{initials}</span>}
                            </div>
                            {user?.ndi_verified && (
                                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                                    <BadgeCheck className="h-3.5 w-3.5 text-white" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 text-center sm:text-left">
                            <h1 className="text-xl font-bold text-white">
                                {user?.first_name && user.first_name !== 'NDI'
                                    ? `${user.first_name} ${user.last_name}` : user?.username}
                            </h1>
                            <p className="text-sm text-slate-300 mt-0.5">{user?.email || '—'}</p>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-2">
                                <span className="text-[11px] font-semibold text-emerald-300 bg-white/10 border border-white/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                    {user?.role?.role_name?.replace(/_/g, ' ')}
                                </span>
                                {user?.ndi_verified && <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/20 border border-emerald-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1"><Shield className="h-3 w-3" /> NDI Verified</span>}
                                {user?.is_mfa_enabled && <span className="text-[11px] font-semibold text-blue-300 bg-blue-500/20 border border-blue-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1"><Smartphone className="h-3 w-3" /> 2FA</span>}
                                {user?.employee_id && <span className="text-[11px] text-slate-300 bg-white/10 px-2.5 py-0.5 rounded-full">{user.employee_id}</span>}
                            </div>
                        </div>
                        <button onClick={() => go('general')}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold transition-colors flex-shrink-0">
                            <Edit3 className="h-3.5 w-3.5" /> Edit Profile
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

                    {/* ── Completeness card ─────────────────────────── */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col items-center gap-4 shadow-sm">
                        <ProfileRing pct={pct} />
                        <div className="text-center">
                            <p className={`text-sm font-bold ${pctColor}`}>{pctLabel}</p>
                            <p className="text-xs text-slate-400 mt-0.5">Profile completeness</p>
                        </div>
                        <div className="w-full space-y-1">
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400"><span>0%</span><span>50%</span><span>100%</span></div>
                        </div>
                        <div className="w-full space-y-1.5">
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Checklist</p>
                            {fields.map(f => (
                                <div key={f.key} className="flex items-center justify-between">
                                    <span className={`text-xs flex items-center gap-1.5 ${f.value ? 'text-slate-500' : 'text-slate-400'}`}>
                                        {f.value
                                            ? <CheckCircle2 className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                                            : <span className="h-3 w-3 rounded-full border border-slate-300 dark:border-slate-600 inline-block flex-shrink-0" />}
                                        {f.label}
                                    </span>
                                    {!f.value && <span className="text-[10px] font-bold text-amber-500">+{f.weight}%</span>}
                                </div>
                            ))}
                        </div>
                        {pct < 100 && (
                            <button onClick={() => go('general')}
                                className="w-full py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold transition-colors">
                                Complete Profile
                            </button>
                        )}
                    </div>

                    {/* ── Right columns ─────────────────────────────── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* Profile details */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Profile Details</h3>
                                <button onClick={() => go('general')} className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1">
                                    <Edit3 className="h-3 w-3" /> Edit
                                </button>
                            </div>
                            <div className="px-5">
                                <DetailRow icon={User} label="Full Name"
                                    value={user?.first_name && user.first_name !== 'NDI' ? `${user.first_name} ${user.last_name}` : null}
                                    missing={!user?.first_name || user.first_name === 'NDI'} onFix={() => go()} />
                                <DetailRow icon={Mail} label="Email" value={user?.email}
                                    badge={user?.email ? (user.email_verified ? 'verified' : 'unverified') : null}
                                    missing={!user?.email} onFix={() => go()} />
                                <DetailRow icon={Phone} label="Phone" value={user?.contact_no}
                                    badge={user?.contact_no ? (user.phone_verified ? 'verified' : 'unverified') : null}
                                    missing={!user?.contact_no} onFix={() => go()} />
                                <DetailRow icon={CreditCard} label="CID / NDI ID" value={user?.ndi_id_number}
                                    badge={user?.ndi_id_number && user?.ndi_verified ? 'verified' : null}
                                    missing={!user?.ndi_id_number} onFix={() => go()} />
                                <DetailRow icon={BadgeCheck} label="Employee ID" value={user?.employee_id}
                                    missing={!user?.employee_id} onFix={() => go()} />
                                <DetailRow icon={Building2} label="Department" value={user?.department}
                                    missing={!user?.department} onFix={() => go()} />
                                <DetailRow icon={MapPin} label="Dzongkhag" value={user?.dzongkhag}
                                    missing={!user?.dzongkhag} onFix={() => go()} />
                            </div>
                        </div>

                        {/* Security */}
                        {!isSuperAdmin && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">Security & Verification</h3>
                            </div>
                            <div className="px-5">
                                {[
                                    { icon: Shield,      label: 'Bhutan NDI',         enabled: user?.ndi_verified,   action: () => navigate('/login'),    actionLabel: 'Verify' },
                                    { icon: Smartphone,  label: 'Two-Factor Auth',    enabled: user?.is_mfa_enabled, action: () => go('tfa'),             actionLabel: 'Enable' },
                                    { icon: Mail,        label: 'Email Verified',     enabled: user?.email_verified, action: () => go('tfa'),             actionLabel: user?.email ? 'Verify' : 'Add Email' },
                                    { icon: Phone,       label: 'Phone Verified',     enabled: user?.phone_verified, action: () => go('tfa'),             actionLabel: user?.contact_no ? 'Verify' : 'Add Phone' },
                                    { icon: Lock,        label: 'Password Set',       enabled: true,                 action: () => go('password'),        actionLabel: 'Change' },
                                ].map(({ icon: Icon, label, enabled, action, actionLabel }) => (
                                    <div key={label} className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0
                                            ${enabled ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                            <Icon className={`h-4 w-4 ${enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                                        </div>
                                        {enabled
                                            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                            : <button onClick={action}
                                                className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-2.5 py-1 rounded-full hover:bg-amber-100 transition-colors">
                                                {actionLabel}
                                              </button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                        )}
                    </div>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                        { icon: Edit3,      label: 'Edit Profile',    sub: 'Update info',          tab: 'general',  c: 'text-primary-600 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800', show: true },
                        { icon: Lock,       label: 'Change Password', sub: 'Update password',      tab: 'password', c: 'text-violet-600 bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-800',   show: true },
                        { icon: Smartphone, label: 'Two-Factor Auth', sub: 'Google Authenticator', tab: 'tfa',      c: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',             show: !isSuperAdmin },
                        { icon: Shield,     label: 'Sessions',        sub: 'Manage devices',       tab: 'sessions', c: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800', show: true },
                    ].filter(a => a.show).map(({ icon: Icon, label, sub, tab, c }) => (
                        <button key={tab} onClick={() => go(tab)}
                            className={`flex items-center gap-3 p-4 rounded-2xl border text-left hover:shadow-sm transition-all ${c}`}>
                            <Icon className="h-5 w-5 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold truncate">{label}</p>
                                <p className="text-xs opacity-70 truncate">{sub}</p>
                            </div>
                            <ChevronRight className="h-4 w-4 opacity-40 flex-shrink-0" />
                        </button>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}