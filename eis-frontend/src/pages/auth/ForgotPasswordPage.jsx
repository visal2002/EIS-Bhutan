// src/pages/auth/ForgotPasswordPage.jsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, KeyRound, Lock, CheckCircle2, ArrowLeft,
         Eye, EyeOff, RefreshCw, Shield } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const BASE_URL = 'http://127.0.0.1:8000/api';

// ── Shared ────────────────────────────────────────────────────────
function Field({ label, error, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">{label}</label>
            {children}
            {error && <p className="text-xs text-rose-500 flex items-center gap-1">⚠ {error}</p>}
        </div>
    );
}

function TInput({ error, ...props }) {
    return (
        <input {...props}
            className={`w-full rounded-xl px-4 py-3.5 text-sm text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                ${error ? 'bg-rose-50 ring-1 ring-rose-300 border border-rose-200'
                        : 'bg-primary-50/60 border border-primary-100'}`} />
    );
}

function PInput({ error, ...props }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input {...props} type={show ? 'text' : 'password'}
                className={`w-full rounded-xl px-4 py-3.5 pr-11 text-sm text-slate-700 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                    ${error ? 'bg-rose-50 ring-1 ring-rose-300 border border-rose-200'
                            : 'bg-primary-50/60 border border-primary-100'}`} />
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
        { label: '8+ characters',    ok: password.length >= 8 },
        { label: 'Uppercase letter', ok: /[A-Z]/.test(password) },
        { label: 'Number',           ok: /\d/.test(password) },
        { label: 'Special character',ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const n = checks.filter(c => c.ok).length;
    const bar = ['', 'bg-rose-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][n];
    return (
        <div className="mt-2 space-y-1.5">
            <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= n ? bar : 'bg-slate-200'}`} />)}
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

// ── Step indicator ────────────────────────────────────────────────
function Steps({ step }) {
    const steps = [
        { n: 1, label: 'Email',       icon: Mail     },
        { n: 2, label: 'Verify Code', icon: KeyRound },
        { n: 3, label: 'New Password',icon: Lock     },
    ];
    return (
        <div className="flex items-center justify-center gap-2 mb-6">
            {steps.map(({ n, label, icon: Icon }, i) => (
                <div key={n} className="flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all
                        ${step === n ? 'bg-primary-600 text-white shadow-sm'
                            : step > n ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'}`}>
                        {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                        <span className="hidden sm:inline">{label}</span>
                    </div>
                    {i < 2 && <div className={`h-px w-5 ${step > n ? 'bg-emerald-400' : 'bg-slate-200'}`} />}
                </div>
            ))}
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { settings } = useSiteSettings();

    const [step,    setStep]    = useState(1); // 1=email, 2=code, 3=newpass, 4=done
    const [loading, setLoading] = useState(false);
    const [email,   setEmail]   = useState('');
    const [code,    setCode]    = useState('');
    const [pw,      setPw]      = useState({ password: '', confirm: '' });
    const [errors,  setErrors]  = useState({});
    const [resendCd,setResendCd]= useState(0);

    // Step 1 — send OTP
    const handleSendOTP = async () => {
        if (!email.trim()) { setErrors({ email: 'Email is required.' }); return; }
        if (!/\S+@\S+\.\S+/.test(email)) { setErrors({ email: 'Enter a valid email address.' }); return; }
        setLoading(true); setErrors({});
        try {
            const res  = await fetch(`${BASE_URL}/auth/forgot-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (!res.ok) { setErrors({ email: data.error || 'Failed to send.' }); return; }
            setStep(2);
            // Start 60s resend cooldown
            setResendCd(60);
            const t = setInterval(() => setResendCd(v => { if (v <= 1) { clearInterval(t); return 0; } return v - 1; }), 1000);
        } finally { setLoading(false); }
    };

    // Step 2 — verify code
    const handleVerifyCode = async () => {
        if (code.length !== 6) { setErrors({ code: 'Enter the 6-digit code.' }); return; }
        // Lightweight check — just move to step 3; actual verification happens on submit
        setErrors({});
        setStep(3);
    };

    // Step 3 — set new password
    const handleReset = async () => {
        const e = {};
        if (!pw.password)              e.password = 'Required';
        else if (pw.password.length < 8) e.password = 'Minimum 8 characters';
        if (!pw.confirm)               e.confirm  = 'Required';
        else if (pw.password !== pw.confirm) e.confirm = 'Passwords do not match';
        if (Object.keys(e).length) { setErrors(e); return; }

        setLoading(true); setErrors({});
        try {
            const res  = await fetch(`${BASE_URL}/auth/reset-password/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code, password: pw.password, confirm: pw.confirm }),
            });
            const data = await res.json();
            if (!res.ok) {
                // If code is wrong, send back to step 2
                if (data.code) { setErrors({ code: data.code }); setStep(2); return; }
                setErrors(data);
                return;
            }
            setStep(4);
        } finally { setLoading(false); }
    };

    const logoUrl = settings?.gov_logo_url || '/images/gov_logo.png';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-md">

                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-3">
                        <img src={logoUrl} alt="EIS" className="h-10 w-10 object-contain"
                            onError={e => { e.target.style.display='none'; }} />
                    </div>
                    <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Reset your password</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {step === 1 && "We'll send a reset code to your email"}
                        {step === 2 && `Code sent to ${email}`}
                        {step === 3 && 'Create a new strong password'}
                        {step === 4 && 'Password reset complete'}
                    </p>
                </div>

                {/* Step indicator */}
                {step < 4 && <Steps step={step} />}

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Banner */}
                    <div className="px-6 py-3 flex items-center gap-2"
                        style={{ background: 'linear-gradient(90deg,#124143,#1a4a3a)' }}>
                        <Shield className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                        <p className="text-xs text-slate-200">
                            Department of Energy · MoENR ·{' '}
                            <span className="font-semibold text-white">Secure Password Reset</span>
                        </p>
                    </div>

                    <div className="px-6 py-6 space-y-5">

                        {/* ── STEP 1: Email ── */}
                        {step === 1 && (
                            <>
                                <Field label="Email Address" error={errors.email}>
                                    <TInput
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setErrors({}); }}
                                        onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                                        placeholder="your.email@energy.gov.bt"
                                        error={errors.email}
                                        autoFocus
                                    />
                                </Field>
                                <button onClick={handleSendOTP} disabled={loading}
                                    className="w-full h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                                    {loading
                                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                                        : <><Mail className="h-4 w-4" /> Send Reset Code</>}
                                </button>
                            </>
                        )}

                        {/* ── STEP 2: OTP ── */}
                        {step === 2 && (
                            <>
                                <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-xs text-emerald-700">
                                    ✉ A 6-digit code was sent to <strong>{email}</strong>. Check your inbox and spam folder.
                                </div>
                                <Field label="Enter 6-digit code" error={errors.code}>
                                    <input
                                        value={code}
                                        onChange={e => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setErrors({}); }}
                                        onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                                        placeholder="000000"
                                        maxLength={6}
                                        autoFocus
                                        className={`w-full rounded-xl px-4 py-4 text-center text-3xl font-mono tracking-[0.5em]
                                            focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                                            ${errors.code ? 'bg-rose-50 ring-1 ring-rose-300 border border-rose-200'
                                                          : 'bg-primary-50/60 border border-primary-100'}`}
                                    />
                                </Field>
                                <button onClick={handleVerifyCode} disabled={code.length !== 6}
                                    className="w-full h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                                    <KeyRound className="h-4 w-4" /> Verify Code
                                </button>
                                <div className="flex items-center justify-between text-xs">
                                    <button onClick={() => setStep(1)}
                                        className="text-slate-400 hover:text-slate-600 flex items-center gap-1">
                                        <ArrowLeft className="h-3.5 w-3.5" /> Change email
                                    </button>
                                    {resendCd > 0
                                        ? <span className="text-slate-400">Resend in {resendCd}s</span>
                                        : <button onClick={handleSendOTP} disabled={loading}
                                            className="text-primary-600 hover:underline font-semibold">
                                            Resend code
                                          </button>}
                                </div>
                            </>
                        )}

                        {/* ── STEP 3: New password ── */}
                        {step === 3 && (
                            <>
                                <Field label="New Password" error={errors.password}>
                                    <PInput
                                        value={pw.password}
                                        onChange={e => { setPw(p => ({ ...p, password: e.target.value })); setErrors(p => ({ ...p, password: '' })); }}
                                        placeholder="Create new password"
                                        error={errors.password}
                                        autoFocus
                                    />
                                    <PasswordStrength password={pw.password} />
                                </Field>
                                <Field label="Confirm Password" error={errors.confirm}>
                                    <PInput
                                        value={pw.confirm}
                                        onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setErrors(p => ({ ...p, confirm: '' })); }}
                                        placeholder="Re-enter new password"
                                        error={errors.confirm}
                                        onKeyDown={e => e.key === 'Enter' && handleReset()}
                                    />
                                    {pw.confirm && pw.password === pw.confirm && (
                                        <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                            <CheckCircle2 className="h-3 w-3" /> Passwords match
                                        </p>
                                    )}
                                </Field>
                                <button onClick={handleReset} disabled={loading}
                                    className="w-full h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                                    {loading
                                        ? <RefreshCw className="h-4 w-4 animate-spin" />
                                        : <><Lock className="h-4 w-4" /> Reset Password</>}
                                </button>
                                <button onClick={() => setStep(2)}
                                    className="w-full text-xs text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1">
                                    <ArrowLeft className="h-3.5 w-3.5" /> Back to code entry
                                </button>
                            </>
                        )}

                        {/* ── STEP 4: Done ── */}
                        {step === 4 && (
                            <div className="text-center space-y-5 py-4">
                                <div className="h-16 w-16 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                                    <CheckCircle2 className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Password Reset!</h3>
                                    <p className="text-sm text-slate-500 mt-1">
                                        Your password has been updated. You can now log in with your new password.
                                    </p>
                                </div>
                                <button onClick={() => navigate('/login')}
                                    className="w-full h-12 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-sm transition-colors shadow-sm">
                                    Go to Login
                                </button>
                            </div>
                        )}

                        {step < 4 && (
                            <div className="flex items-center justify-center pt-1">
                                <Link to="/login"
                                    className="text-xs text-slate-400 hover:text-primary-600 flex items-center gap-1 transition-colors">
                                    <ArrowLeft className="h-3.5 w-3.5" /> Back to login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-[10px] text-slate-400 text-center mt-4 leading-relaxed">
                    For assistance contact the MoENR ICT Division.<br />
                    Department of Energy · Royal Government of Bhutan
                </p>
            </div>
        </div>
    );
}