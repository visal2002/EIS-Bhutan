// src/pages/auth/NDIProfileSetup.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, CheckCircle2, Eye, EyeOff, ArrowRight, User, Lock } from 'lucide-react';
import { apiFetch, getUser, getAccessToken } from '../../services/api';

const DZONGKHAGS = [
    '', 'Bumthang', 'Chhukha', 'Dagana', 'Gasa', 'Haa', 'Lhuentse',
    'Mongar', 'Paro', 'Pemagatshel', 'Punakha', 'Samdrup Jongkhar',
    'Samtse', 'Sarpang', 'Thimphu', 'Trashigang', 'Trashiyangtse',
    'Trongsa', 'Tsirang', 'Wangdue Phodrang', 'Zhemgang',
];

function Field({ label, required, error, hint, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint  && <p className="text-xs text-slate-400">{hint}</p>}
            {error && <p className="text-xs text-rose-500">⚠ {error}</p>}
        </div>
    );
}

function TextInput({ error, ...props }) {
    return (
        <input {...props}
            className={`w-full rounded-xl px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400
                focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                ${error ? 'bg-rose-50 ring-1 ring-rose-300 border border-rose-200'
                        : 'bg-primary-50/60 border border-primary-100'}`}
        />
    );
}

function DisabledInput({ value }) {
    return (
        <input value={value} disabled
            className="w-full rounded-xl px-4 py-3 text-sm bg-slate-50 border border-slate-200 text-slate-500 cursor-not-allowed" />
    );
}

function PasswordInput({ value, onChange, placeholder, error }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative">
            <input type={show ? 'text' : 'password'} value={value} onChange={onChange}
                placeholder={placeholder}
                className={`w-full rounded-xl px-4 py-3 pr-11 text-sm text-slate-700 placeholder:text-slate-400
                    focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors
                    ${error ? 'bg-rose-50 ring-1 ring-rose-300 border border-rose-200'
                            : 'bg-primary-50/60 border border-primary-100'}`} />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
        </div>
    );
}

function SelectInput({ error, children, ...props }) {
    return (
        <select {...props}
            className={`w-full rounded-xl px-4 py-3 text-sm text-slate-700 appearance-none cursor-pointer
                focus:outline-none focus:ring-2 focus:ring-primary-600/30
                ${error ? 'bg-rose-50 ring-1 ring-rose-300' : 'bg-primary-50/60 border border-primary-100'}`}>
            {children}
        </select>
    );
}

function PasswordStrength({ password }) {
    if (!password) return null;
    const checks = [
        { label: '8+ characters',     ok: password.length >= 8 },
        { label: 'Uppercase',         ok: /[A-Z]/.test(password) },
        { label: 'Number',            ok: /\d/.test(password) },
        { label: 'Special character', ok: /[^A-Za-z0-9]/.test(password) },
    ];
    const passed = checks.filter(c => c.ok).length;
    const bar    = ['', 'bg-rose-400', 'bg-amber-400', 'bg-blue-400', 'bg-emerald-500'][passed];
    const lbl    = ['', 'Weak', 'Fair', 'Good', 'Strong'][passed];
    return (
        <div className="space-y-2 mt-1.5">
            <div className="flex items-center gap-1">
                {[1,2,3,4].map(i => (
                    <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= passed ? bar : 'bg-slate-200'}`} />
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-1 w-10">{lbl}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
                {checks.map(c => (
                    <span key={c.label} className={`text-[11px] flex items-center gap-1 ${c.ok ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {c.ok ? '✓' : '○'} {c.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function StepBar({ step }) {
    const steps = [
        { n: 1, label: 'Profile Info', icon: User },
        { n: 2, label: 'Set Password', icon: Lock },
    ];
    return (
        <div className="flex items-center justify-center gap-3 mb-8">
            {steps.map(({ n, label, icon: Icon }, i) => (
                <div key={n} className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold transition-all
                        ${step === n ? 'bg-primary-600 text-white shadow-sm'
                            : step > n ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-400'}`}>
                        {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Icon className="h-3.5 w-3.5" />}
                        {label}
                    </div>
                    {i < steps.length - 1 && (
                        <div className={`h-px w-8 ${step > 1 ? 'bg-emerald-400' : 'bg-slate-200'}`} />
                    )}
                </div>
            ))}
        </div>
    );
}

export default function NDIProfileSetup() {
    const navigate = useNavigate();
    const user     = getUser();

    const [step,    setStep]    = useState(1);
    const [loading, setLoading] = useState(false);
    const [done,    setDone]    = useState(false);
    const [errors,  setErrors]  = useState({});

    const [form, setForm] = useState({
        first_name: '',
        last_name:  '',
        username:   '',
        email:      '',
        contact_no: '',
        gender:     '',
        dzongkhag:  '',
    });

    const [pw, setPw] = useState({ password: '', confirm: '' });

    // ── Pre-fill from NDI user ────────────────────────────────────
    useEffect(() => {
        if (!getAccessToken()) { navigate('/login'); return; }
        if (!user) return;
        setForm(f => ({
            ...f,
            first_name: (user.first_name && user.first_name !== 'NDI')  ? user.first_name : f.first_name,
            last_name:  (user.last_name  && user.last_name  !== 'User') ? user.last_name  : f.last_name,
            username:   (!user.username  || user.username.startsWith('ndi_')) ? f.username : user.username,
            email:      user.email || f.email,
        }));
    }, []);

    const setF   = k => e => { setForm(p => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };
    const setPwF = k => e => { setPw(p  => ({ ...p, [k]: e.target.value })); if (errors[k]) setErrors(p => ({ ...p, [k]: '' })); };

    const validateStep1 = () => {
        const e = {};
        if (!form.first_name.trim()) e.first_name = 'Required';
        if (!form.last_name.trim())  e.last_name  = 'Required';
        if (!form.username.trim())   e.username   = 'Required';
        else if (!/^[a-zA-Z0-9._-]+$/.test(form.username)) e.username = 'Letters, numbers, dots, dashes only';
        if (!form.email.trim())      e.email      = 'Required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email address';
        setErrors(e); return !Object.keys(e).length;
    };

    const validateStep2 = () => {
        const e = {};
        if (!pw.password)                 e.password = 'Required';
        else if (pw.password.length < 8)  e.password = 'Minimum 8 characters';
        if (!pw.confirm)                  e.confirm  = 'Required';
        else if (pw.password !== pw.confirm) e.confirm = 'Passwords do not match';
        setErrors(e); return !Object.keys(e).length;
    };

    const handleSubmit = async () => {
        if (!validateStep2()) return;
        setLoading(true);
        try {
            const res  = await apiFetch('/auth/ndi/profile/', {
                method: 'POST',
                body:   JSON.stringify({ ...form, password: pw.password }),
            });
            const data = await res.json();
            if (!res.ok) {
                const fe = {};
                Object.entries(data).forEach(([k, v]) => { fe[k] = Array.isArray(v) ? v[0] : v; });
                const step1Keys = ['first_name', 'last_name', 'username', 'email'];
                if (Object.keys(fe).some(k => step1Keys.includes(k))) { setErrors(fe); setStep(1); }
                else setErrors(fe);
                return;
            }
            localStorage.setItem('access_token',  data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user',          JSON.stringify(data.user));
            setDone(true);
            const ROUTES = { ADMIN: '/admin/dashboard', DOE_HEAD: '/doe/dashboard',
                             DATA_MANAGER: '/manager/dashboard', DATA_FOCAL: '/focal/dashboard',
                             VIEWER: '/viewer/dashboard' };
            setTimeout(() => navigate(ROUTES[data.user?.role?.role_name] || '/viewer/dashboard'), 2000);
        } finally { setLoading(false); }
    };

    if (done) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="text-center space-y-4 p-8">
                <div className="h-20 w-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto shadow-lg">
                    <CheckCircle2 className="h-10 w-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800">Setup Complete!</h2>
                <p className="text-slate-400 text-sm">Redirecting to your dashboard...</p>
            </div>
        </div>
    );

    const bannerInfo = user?.ndi_id_number
        ? `CID: ${user.ndi_id_number}`
        : (form.first_name ? `${form.first_name} ${form.last_name}`.trim() : 'Identity confirmed');

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 py-12 font-sans">
            <div className="w-full max-w-lg">

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 text-primary-700 text-xs font-semibold px-4 py-2 rounded-full mb-4">
                        <Shield className="h-3.5 w-3.5" />
                        NDI Verified — Complete Your Profile
                    </div>
                    <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                        {form.first_name ? `Welcome, ${form.first_name}!` : 'Welcome!'}
                    </h1>
                    <p className="text-slate-500 text-sm mt-1.5">
                        Your Bhutan NDI identity has been verified. Complete your profile to access EIS.
                    </p>
                </div>

                {/* Step bar */}
                <StepBar step={step} />

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">

                    {/* Banner */}
                    <div className="px-6 py-3 flex items-center gap-2"
                        style={{ background: 'linear-gradient(90deg, #124143, #1a4a3a)' }}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-300 flex-shrink-0" />
                        <p className="text-xs text-slate-200">
                            Identity verified via Bhutan NDI ·{' '}
                            <span className="font-semibold text-white">{bannerInfo}</span>
                        </p>
                    </div>

                    <div className="px-6 py-6 space-y-5">

                        {/* ── STEP 1 ── */}
                        {step === 1 && <>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="First Name" required error={errors.first_name} hint="As per your NDI / CID">
                                    <TextInput value={form.first_name} onChange={setF('first_name')}
                                        placeholder="e.g. Tashi" error={errors.first_name} />
                                </Field>
                                <Field label="Last Name" required error={errors.last_name}>
                                    <TextInput value={form.last_name} onChange={setF('last_name')}
                                        placeholder="e.g. Dorji" error={errors.last_name} />
                                </Field>
                            </div>

                            {user?.ndi_id_number && (
                                <Field label="CID / National ID" hint="From your NDI credential">
                                    <DisabledInput value={user.ndi_id_number} />
                                </Field>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Username" required error={errors.username} hint="For Agency Login">
                                    <TextInput value={form.username} onChange={setF('username')}
                                        placeholder="e.g. tashi.dorji" error={errors.username} />
                                </Field>
                                <Field label="Contact Number" error={errors.contact_no}>
                                    <TextInput value={form.contact_no} onChange={setF('contact_no')}
                                        placeholder="+975 17xxxxxx" error={errors.contact_no} />
                                </Field>
                            </div>

                            <Field label="Email Address" required error={errors.email} hint="Your official government email">
                                <TextInput type="email" value={form.email} onChange={setF('email')}
                                    placeholder="tashi.dorji@energy.gov.bt" error={errors.email} />
                            </Field>

                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Gender" error={errors.gender}>
                                    <SelectInput value={form.gender} onChange={setF('gender')}>
                                        <option value="">Select...</option>
                                        <option value="M">Male</option>
                                        <option value="F">Female</option>
                                        <option value="O">Other</option>
                                    </SelectInput>
                                </Field>
                                <Field label="Dzongkhag" error={errors.dzongkhag}>
                                    <SelectInput value={form.dzongkhag} onChange={setF('dzongkhag')}>
                                        {DZONGKHAGS.map(d => <option key={d} value={d}>{d || 'Select...'}</option>)}
                                    </SelectInput>
                                </Field>
                            </div>

                            <button onClick={() => { if (validateStep1()) setStep(2); }}
                                className="w-full py-3.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 shadow-sm mt-2">
                                <ArrowRight className="h-5 w-5" /> Next — Set Password
                            </button>
                        </>}

                        {/* ── STEP 2 ── */}
                        {step === 2 && <>
                            {/* Summary */}
                            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 space-y-2">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Summary</p>
                                {[['Name', `${form.first_name} ${form.last_name}`],
                                  ['Username', form.username],
                                  ['Email', form.email]].map(([k, v]) => (
                                    <div key={k} className="flex items-center justify-between">
                                        <span className="text-xs text-slate-500">{k}</span>
                                        <span className="text-xs font-semibold text-slate-700">{v}</span>
                                    </div>
                                ))}
                                <button onClick={() => { setErrors({}); setStep(1); }}
                                    className="text-xs text-primary-600 hover:underline pt-0.5">← Edit profile</button>
                            </div>

                            <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-xs text-blue-700 leading-relaxed">
                                🔒 Setting a password lets you also log in via <strong>Agency Login</strong> anytime — without needing your NDI app.
                            </div>

                            <Field label="Password" required error={errors.password}>
                                <PasswordInput value={pw.password} onChange={setPwF('password')}
                                    placeholder="Create a strong password" error={errors.password} />
                                <PasswordStrength password={pw.password} />
                            </Field>

                            <Field label="Confirm Password" required error={errors.confirm}>
                                <PasswordInput value={pw.confirm} onChange={setPwF('confirm')}
                                    placeholder="Re-enter your password" error={errors.confirm} />
                                {pw.confirm && pw.password === pw.confirm && (
                                    <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                        <CheckCircle2 className="h-3 w-3" /> Passwords match
                                    </p>
                                )}
                            </Field>

                            {errors._general && (
                                <div className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3 text-sm text-rose-600">
                                    ⚠ {errors._general}
                                </div>
                            )}

                            <button onClick={handleSubmit} disabled={loading}
                                className="w-full py-3.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white font-bold text-base transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm mt-2">
                                {loading
                                    ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    : <><CheckCircle2 className="h-5 w-5" /> Complete Setup</>}
                            </button>
                        </>}

                        <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                            Your information is secured and used only for EIS access management.<br />
                            Department of Energy · MoENR · Royal Government of Bhutan
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}