// src/pages/admin/SystemSettingsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { Save, RefreshCw, Eye, EyeOff, Send, CheckCircle2,
         XCircle, Wifi, Key, Mail, Settings, Globe, AlertTriangle,
         Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';

// ── Helpers ───────────────────────────────────────────────────────
const IS_MASKED = v => v === '••••••••';
const token = () => localStorage.getItem('access_token');

async function refreshToken() {
    const refresh = localStorage.getItem('refresh_token');
    if (!refresh) return null;
    try {
        const res  = await fetch('/api/auth/token/refresh/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        localStorage.setItem('access_token', data.access);
        if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
        return data.access;
    } catch { return null; }
}

async function apiFetch(path, opts = {}) {
    const makeReq = (tok) => fetch(`/api/admin/${path}`, {
        ...opts,
        headers: { 'Authorization': `Bearer ${tok}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
    });

    let res = await makeReq(token());

    // If 401, try refreshing token once then retry
    if (res.status === 401) {
        const newToken = await refreshToken();
        if (newToken) {
            res = await makeReq(newToken);
        } else {
            // Refresh also failed — redirect to login
            window.location.href = '/login';
            return res;
        }
    }
    return res;
}

function Toast({ msg, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 4000); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-emerald-600' : 'bg-rose-500'}`}>
            {type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            {msg}
        </div>
    );
}

function Section({ title, icon: Icon, color = 'text-primary-600', children, defaultOpen = true }) {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => setOpen(v => !v)}
                className="w-full flex items-center justify-between gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-100/60 dark:hover:bg-slate-700/40 transition-colors">
                <div className="flex items-center gap-2.5">
                    <Icon className={`h-4 w-4 ${color} flex-shrink-0`} />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                </div>
                <RefreshCw className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? '' : '-rotate-90'}`} />
            </button>
            {open && <div className="p-5 space-y-4">{children}</div>}
        </div>
    );
}

function Field({ label, hint, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
    );
}

function Input({ type = 'text', ...props }) {
    return <input type={type} {...props}
        className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors" />;
}

function Textarea({ ...props }) {
    return <textarea {...props}
        className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 resize-none transition-colors" />;
}

function SecretInput({ value, onChange, placeholder }) {
    const [show, setShow] = useState(false);
    const isMasked = IS_MASKED(value);
    return (
        <div className="relative">
            <input
                type={show ? 'text' : 'password'}
                value={isMasked ? '' : (value || '')}
                onChange={onChange}
                placeholder={isMasked ? '••••••••  (saved — type to change)' : placeholder}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2.5 pr-10 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors"
            />
            <button type="button" onClick={() => setShow(v => !v)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
            {isMasked && (
                <span className="absolute right-9 top-3 text-[10px] text-emerald-600 font-semibold">saved</span>
            )}
        </div>
    );
}

function Toggle({ value, onChange, label, description }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button type="button" onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${value ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

function Select({ value, onChange, options }) {
    return (
        <select value={value || ''} onChange={e => onChange(e.target.value)}
            className="w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-600/30">
            {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
    );
}

// ── Tab definitions ───────────────────────────────────────────────
const TABS = [
    { id: 'ndi',   label: 'NDI',     icon: Key },
    { id: 'mail',  label: 'Email',   icon: Mail },
    { id: 'api',   label: 'API Keys', icon: Globe },
    { id: 'app',   label: 'App Config', icon: Settings },
];

const TAB_FIELDS = {
    ndi:  ['ndi_client_id','ndi_client_secret','ndi_webhook_secret','ndi_webhook_id',
           'ndi_webhook_base_url','ndi_auth_url','ndi_verifier_url',
           'ndi_webhook_register_url','ndi_issuer_url',
           'ndi_schema_id','ndi_environment',
           'ndi_nats_url','ndi_nats_ws_url','ndi_nats_seed'],
    mail: ['email_backend','email_host','email_port','email_use_tls','email_use_ssl',
           'email_host_user','email_host_password','default_from_email','email_timeout'],
    api:  ['mas_name','mas_api_key','mas_base_url','mas_enabled',
           'firms_name','firms_api_key','firms_base_url','firms_enabled',
           'iis_name','iis_api_key','iis_base_url','iis_enabled',
           'ofs_name','ofs_api_key','ofs_base_url','ofs_enabled',
           'eralis_name','eralis_api_key','eralis_base_url','eralis_enabled'],
    app:  ['app_env','debug_mode','allowed_hosts','cors_origins'],
};

// ── Main page ─────────────────────────────────────────────────────
export default function SystemSettingsPage() {
    const [form,      setForm]      = useState({});
    const [savedForm, setSavedForm] = useState({});
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [tab,       setTab]       = useState('ndi');
    const [toast,     setToast]     = useState(null);
    const [testEmail, setTestEmail] = useState('');
    const [testing,   setTesting]   = useState(false);

    useEffect(() => {
        apiFetch('system-settings/')
            .then(r => r.ok ? r.json() : null)
            .then(d => { if (d) { setForm(d); setSavedForm(d); } })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const set = (f, v) => setForm(p => ({ ...p, [f]: v }));

    // Per-tab dirty check
    const fields = TAB_FIELDS[tab] || [];
    const isDirty = fields.some(k => JSON.stringify(form[k]) !== JSON.stringify(savedForm[k]));

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {};
            fields.forEach(k => { payload[k] = form[k]; });
            const res = await apiFetch('system-settings/', {
                method: 'PATCH',
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                const updated = await res.json();
                setForm(updated);
                setSavedForm(prev => ({ ...prev, ...updated }));
                setToast({ msg: `✓ ${TABS.find(t=>t.id===tab)?.label} settings saved!`, type: 'success' });
            } else {
                const err = await res.json();
                setToast({ msg: err?.error || JSON.stringify(err), type: 'error' });
            }
        } catch (e) {
            setToast({ msg: `Network error: ${e.message}`, type: 'error' });
        } finally { setSaving(false); }
    };

    const handleDiscard = () => {
        setForm(prev => {
            const reset = { ...prev };
            fields.forEach(k => { reset[k] = savedForm[k]; });
            return reset;
        });
    };

    const handleTestEmail = async () => {
        setTesting(true);
        try {
            const res = await apiFetch('test-email/', {
                method: 'POST',
                body: JSON.stringify({ to: testEmail }),
            });
            const d = await res.json();
            setToast({ msg: d.message || d.error || 'Done', type: d.success ? 'success' : 'error' });
        } catch (e) {
            setToast({ msg: e.message, type: 'error' });
        } finally { setTesting(false); }
    };

    return (
        <DashboardLayout breadcrumb="System" title="System Settings">
            <div className="space-y-5 w-full">

                {/* Header */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <div className="px-6 py-5 flex items-center justify-between"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a4a3a 100%)' }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-blue-200 mb-1">System</p>
                            <h1 className="text-xl font-bold text-white">System Settings</h1>
                            <p className="text-sm text-slate-200 mt-0.5">NDI integration, email, API keys and app config</p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isDirty && !saving && (
                                <>
                                    <button onClick={handleDiscard}
                                        className="text-xs font-medium text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-full transition-colors">
                                        Discard
                                    </button>
                                    <span className="flex items-center gap-1.5 text-xs text-amber-200 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                                        Unsaved changes
                                    </span>
                                </>
                            )}
                            <button onClick={handleSave} disabled={saving || loading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-60
                                    ${isDirty ? 'bg-white text-slate-800 hover:bg-slate-100 ring-2 ring-white/50' : 'bg-white/20 text-white border border-white/30'}`}>
                                {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saving ? 'Saving...' : isDirty ? `Save ${TABS.find(t=>t.id===tab)?.label}` : 'Saved ✓'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    {TABS.map(({ id, label, icon: Icon }) => {
                        const tabFields = TAB_FIELDS[id] || [];
                        const tabDirty  = tabFields.some(k => JSON.stringify(form[k]) !== JSON.stringify(savedForm[k]));
                        return (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all relative
                                    ${tab === id
                                        ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                                {tabDirty && <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />}
                            </button>
                        );
                    })}
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
                        <div className="h-5 w-5 rounded-full border-2 border-slate-200 border-t-primary-500 animate-spin" />
                        Loading settings...
                    </div>
                ) : (
                    <>
                        {/* ── NDI ─────────────────────────────────── */}
                        {tab === 'ndi' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Left column */}
                                <div className="space-y-5">
                                    <Section title="NDI Credentials" icon={Key} color="text-purple-600">
                                        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                            Client ID and Secret are shared by the Bhutan NDI team. All values stored in DB — no restart needed.
                                        </div>
                                        <Field label="Environment">
                                            <Select value={form.ndi_environment} onChange={v => set('ndi_environment', v)}
                                                options={[['staging','Staging / Dev'],['production','Production']]} />
                                        </Field>
                                        <Field label="NDI Client ID" hint="Shared by Bhutan NDI team">
                                            <Input value={form.ndi_client_id || ''} onChange={e => set('ndi_client_id', e.target.value)}
                                                placeholder="Client ID from NDI team" />
                                        </Field>
                                        <Field label="NDI Client Secret">
                                            <SecretInput value={form.ndi_client_secret}
                                                onChange={e => set('ndi_client_secret', e.target.value)}
                                                placeholder="Client Secret from NDI team" />
                                        </Field>
                                    </Section>

                                    <Section title="Webhook Config" icon={Globe} color="text-blue-600">
                                        <Field label="Webhook ID" hint="e.g. eis-bhutan-26 — unique ID registered with NDI">
                                            <Input value={form.ndi_webhook_id || ''} onChange={e => set('ndi_webhook_id', e.target.value)} />
                                        </Field>
                                        <Field label="Webhook Secret (OAuth2 v2 token)" hint="NDI sends this in Authorization header to verify calls to our webhook">
                                            <SecretInput value={form.ndi_webhook_secret}
                                                onChange={e => set('ndi_webhook_secret', e.target.value)}
                                                placeholder="Fixed token for webhook auth" />
                                        </Field>
                                        <Field label="Webhook Base URL" hint="Public URL this server is reachable at. Use ngrok in dev.">
                                            <Input value={form.ndi_webhook_base_url || ''} onChange={e => set('ndi_webhook_base_url', e.target.value)}
                                                placeholder="https://your-ngrok-url.ngrok-free.dev" />
                                        </Field>
                                        <div className="rounded-xl bg-slate-900 text-emerald-400 px-4 py-3 font-mono text-xs">
                                            <div className="text-slate-500 mb-1"># After saving webhook URL, re-register:</div>
                                            python manage.py register_ndi_webhook
                                        </div>
                                    </Section>

                                    <Section title="NDI NATS (alternative to webhook)" icon={Wifi} color="text-slate-500" defaultOpen={false}>
                                        <p className="text-xs text-slate-500">NATS is an alternative way to receive async NDI responses. Pattern: <code className="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1 rounded">threadId</code></p>
                                        <Field label="NATS URL" hint="Staging: https://natsdemoclient.bhutanndi.com">
                                            <Input value={form.ndi_nats_url || ''} onChange={e => set('ndi_nats_url', e.target.value)} />
                                        </Field>
                                        <Field label="NATS WebSocket URL">
                                            <Input value={form.ndi_nats_ws_url || ''} onChange={e => set('ndi_nats_ws_url', e.target.value)} />
                                        </Field>
                                        <Field label="NATS Seed" hint="Dev seed is not secret. Treat production seed as secret.">
                                            <SecretInput value={form.ndi_nats_seed}
                                                onChange={e => set('ndi_nats_seed', e.target.value)}
                                                placeholder="SUAPXY7TJFUFE3IX3..." />
                                        </Field>
                                    </Section>
                                </div>

                                {/* Right column — NDI API URLs */}
                                <div className="space-y-5">
                                    <Section title="NDI API Endpoints (Staging)" icon={Wifi} color="text-emerald-600">
                                        <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
                                            Pre-filled with confirmed staging URLs from NDI Technical Documentation V1.2. Only change these when moving to production.
                                        </div>
                                        <Field label="Auth URL" hint="POST to get OAuth2 Bearer token">
                                            <Input value={form.ndi_auth_url || ''} onChange={e => set('ndi_auth_url', e.target.value)} />
                                        </Field>
                                        <Field label="Verifier URL" hint="POST create proof request / GET poll status">
                                            <Input value={form.ndi_verifier_url || ''} onChange={e => set('ndi_verifier_url', e.target.value)} />
                                        </Field>
                                        <Field label="Webhook Service Base URL" hint="For register/subscribe/unsubscribe">
                                            <Input value={form.ndi_webhook_register_url || ''} onChange={e => set('ndi_webhook_register_url', e.target.value)} />
                                        </Field>
                                        <Field label="Issuer URL" hint="For issuing / revoking verifiable credentials">
                                            <Input value={form.ndi_issuer_url || ''} onChange={e => set('ndi_issuer_url', e.target.value)} />
                                        </Field>
                                        <Field label="Schema ID — Foundational ID" hint="Used to request ID Number and Full Name">
                                            <Input value={form.ndi_schema_id || ''} onChange={e => set('ndi_schema_id', e.target.value)} />
                                        </Field>
                                    </Section>

                                    {/* Swagger links */}
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">NDI Swagger Docs</p>
                                        {[
                                            { name: 'Authentication', url: 'https://staging.bhutanndi.com/authentication/swagger' },
                                            { name: 'Verifier',       url: 'https://demo-client.bhutanndi.com/verifier/swagger' },
                                            { name: 'Webhook',        url: 'https://demo-client.bhutanndi.com/webhook/swagger/' },
                                            { name: 'Issuer',         url: 'https://demo-client.bhutanndi.com/issuer/swagger' },
                                        ].map(s => (
                                            <a key={s.name} href={s.url} target="_blank" rel="noreferrer"
                                                className="flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                <span className="font-medium">{s.name} Service</span>
                                                <span className="text-slate-400 truncate max-w-[160px]">{s.url.replace('https://', '')}</span>
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── MAIL ────────────────────────────────── */}
                        {tab === 'mail' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="SMTP Configuration" icon={Mail} color="text-blue-600">
                                    <Field label="Email Backend" hint="Use console backend for development">
                                        <Select value={form.email_backend} onChange={v => set('email_backend', v)}
                                            options={[
                                                ['django.core.mail.backends.smtp.EmailBackend',    'SMTP (production)'],
                                                ['django.core.mail.backends.console.EmailBackend', 'Console (development)'],
                                                ['django.core.mail.backends.dummy.EmailBackend',   'Dummy (disabled)'],
                                            ]} />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="SMTP Host" hint="e.g. smtp.gmail.com">
                                            <Input value={form.email_host || ''} onChange={e => set('email_host', e.target.value)}
                                                placeholder="smtp.gov.bt" />
                                        </Field>
                                        <Field label="Port">
                                            <Input type="number" value={form.email_port || 587}
                                                onChange={e => set('email_port', Number(e.target.value))} />
                                        </Field>
                                    </div>
                                    <Toggle value={form.email_use_tls} onChange={v => set('email_use_tls', v)}
                                        label="Use TLS" description="Recommended for port 587" />
                                    <Toggle value={form.email_use_ssl} onChange={v => set('email_use_ssl', v)}
                                        label="Use SSL" description="For port 465 — don't use with TLS" />
                                    <Field label="SMTP Username">
                                        <Input value={form.email_host_user || ''} onChange={e => set('email_host_user', e.target.value)}
                                            placeholder="noreply@doe.gov.bt" />
                                    </Field>
                                    <Field label="SMTP Password">
                                        <SecretInput value={form.email_host_password}
                                            onChange={e => set('email_host_password', e.target.value)}
                                            placeholder="SMTP password" />
                                    </Field>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Field label="Default From Email">
                                            <Input type="email" value={form.default_from_email || ''}
                                                onChange={e => set('default_from_email', e.target.value)} />
                                        </Field>
                                        <Field label="Timeout (sec)">
                                            <Input type="number" value={form.email_timeout || 30}
                                                onChange={e => set('email_timeout', Number(e.target.value))} />
                                        </Field>
                                    </div>
                                </Section>

                                {/* Test email */}
                                <div className="space-y-5">
                                    <Section title="Send Test Email" icon={Send} color="text-emerald-600">
                                        <p className="text-xs text-slate-500">Verify your SMTP config by sending a test email. Save settings first.</p>
                                        <Field label="Send To">
                                            <Input type="email" value={testEmail}
                                                onChange={e => setTestEmail(e.target.value)}
                                                placeholder="your@email.com" />
                                        </Field>
                                        <button onClick={handleTestEmail} disabled={testing || !testEmail}
                                            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold transition-colors disabled:opacity-50">
                                            {testing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                            {testing ? 'Sending...' : 'Send Test Email'}
                                        </button>
                                    </Section>

                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-5 space-y-3">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Common Settings</p>
                                        {[
                                            { name: 'Gmail',    host: 'smtp.gmail.com',  port: 587, tls: true },
                                            { name: 'Outlook',  host: 'smtp.office365.com', port: 587, tls: true },
                                            { name: 'Mailtrap', host: 'smtp.mailtrap.io',  port: 2525, tls: false },
                                        ].map(p => (
                                            <button key={p.name} onClick={() => {
                                                set('email_host', p.host);
                                                set('email_port', p.port);
                                                set('email_use_tls', p.tls);
                                            }} className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                                <span>{p.name}</span>
                                                <span className="text-slate-400 font-mono">{p.host}:{p.port}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── API KEYS ─────────────────────────────── */}
                        {tab === 'api' && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                        <span><strong>Stored in database only</strong> — API keys are read at runtime, no server restart needed when you change them.</span>
                                    </div>
                                    <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 px-4 py-3 text-xs text-blue-700 dark:text-blue-300 flex items-start gap-2">
                                        <Globe className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                        <span>Use <code className="font-mono bg-blue-100 dark:bg-blue-800 px-1 rounded">SystemSetting.get().get_api_config('mas')</code> in your Django views to access these keys.</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    {[
                                        {
                                            key:   'mas',
                                            label: 'MAS',
                                            full:  'Meteorological and Hydrological Services',
                                            color: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-700',
                                            badge: 'bg-sky-100 dark:bg-sky-800 text-sky-700 dark:text-sky-300',
                                            dot:   'bg-sky-500',
                                        },
                                        {
                                            key:   'firms',
                                            label: 'FIRMS',
                                            full:  'Financial Information & Reporting Management System',
                                            color: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-700',
                                            badge: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300',
                                            dot:   'bg-emerald-500',
                                        },
                                        {
                                            key:   'iis',
                                            label: 'IIS',
                                            full:  'Integrated Information System',
                                            color: 'bg-violet-50 dark:bg-violet-900/20 border-violet-200 dark:border-violet-700',
                                            badge: 'bg-violet-100 dark:bg-violet-800 text-violet-700 dark:text-violet-300',
                                            dot:   'bg-violet-500',
                                        },
                                        {
                                            key:   'ofs',
                                            label: 'OFS',
                                            full:  'Online Filing System',
                                            color: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700',
                                            badge: 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300',
                                            dot:   'bg-amber-500',
                                        },
                                        {
                                            key:   'eralis',
                                            label: 'eRALIS',
                                            full:  'Electronic Renewal of Agencies Licence Information System',
                                            color: 'bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-700',
                                            badge: 'bg-rose-100 dark:bg-rose-800 text-rose-700 dark:text-rose-300',
                                            dot:   'bg-rose-500',
                                        },
                                    ].map(sys => (
                                        <div key={sys.key}
                                            className={`rounded-2xl border p-5 space-y-4 ${sys.color}`}>
                                            {/* Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${sys.badge}`}>
                                                        {sys.label}
                                                    </span>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight max-w-[180px]">
                                                        {sys.full}
                                                    </p>
                                                </div>
                                                {/* Enable toggle */}
                                                <button
                                                    onClick={() => set(`${sys.key}_enabled`, !form[`${sys.key}_enabled`])}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                                                        ${form[`${sys.key}_enabled`] ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                                                        ${form[`${sys.key}_enabled`] ? 'translate-x-6' : 'translate-x-1'}`} />
                                                </button>
                                            </div>

                                            {/* Status badge */}
                                            <div className="flex items-center gap-1.5">
                                                <span className={`h-2 w-2 rounded-full flex-shrink-0 ${form[`${sys.key}_enabled`] ? sys.dot : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {form[`${sys.key}_enabled`] ? 'Integration enabled' : 'Integration disabled'}
                                                </span>
                                            </div>

                                            {/* Fields */}
                                            <Field label="Base URL" hint={`API endpoint for ${sys.label}`}>
                                                <Input
                                                    value={form[`${sys.key}_base_url`] || ''}
                                                    onChange={e => set(`${sys.key}_base_url`, e.target.value)}
                                                    placeholder={`https://api.${sys.key.toLowerCase()}.gov.bt`}
                                                />
                                            </Field>
                                            <Field label="API Key / Token">
                                                <SecretInput
                                                    value={form[`${sys.key}_api_key`]}
                                                    onChange={e => set(`${sys.key}_api_key`, e.target.value)}
                                                    placeholder="Paste API key or Bearer token"
                                                />
                                            </Field>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* ── APP CONFIG ───────────────────────────── */}
                        {tab === 'app' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="Application Environment" icon={Settings} color="text-slate-600">
                                    <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-start gap-2">
                                        <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                        <span>Stored in <strong>database</strong> — changes apply instantly, no Django restart needed.</span>
                                    </div>
                                    <Field label="Environment">
                                        <Select value={form.app_env} onChange={v => set('app_env', v)}
                                            options={[
                                                ['development', 'Development'],
                                                ['staging',     'Staging'],
                                                ['production',  'Production'],
                                            ]} />
                                    </Field>
                                    <Toggle value={form.debug_mode} onChange={v => set('debug_mode', v)}
                                        label="Debug Mode"
                                        description="⚠ Shows detailed error pages. Disable in production." />
                                    <Field label="Allowed Hosts" hint="Comma-separated: localhost,127.0.0.1,your-domain.com">
                                        <Textarea value={form.allowed_hosts || ''} rows={2}
                                            onChange={e => set('allowed_hosts', e.target.value)} />
                                    </Field>
                                    <Field label="CORS Allowed Origins" hint="Comma-separated frontend origins: http://localhost:5173">
                                        <Textarea value={form.cors_origins || ''} rows={2}
                                            onChange={e => set('cors_origins', e.target.value)} />
                                    </Field>
                                </Section>

                                <div className="space-y-4">
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Where things are stored</p>
                                        </div>
                                        <div className="p-4 space-y-4">
                                            <div>
                                                <p className="text-xs font-bold text-emerald-600 mb-1.5">✅ Database (System Settings)</p>
                                                <ul className="space-y-1">
                                                    {['NDI credentials & URLs','SMTP password & config','MAS / FIRMS / IIS / OFS / eRALIS keys','Allowed hosts & CORS origins','Debug mode & environment'].map(i => (
                                                        <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <span className="h-1 w-1 rounded-full bg-emerald-400 flex-shrink-0" />{i}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5">🔒 .env file (required at boot)</p>
                                                <ul className="space-y-1">
                                                    {['DJANGO_SECRET_KEY','DB_NAME / DB_USER / DB_PASSWORD','DJANGO_SETTINGS_MODULE'].map(i => (
                                                        <li key={i} className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                                                            <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600 flex-shrink-0" />{i}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 p-4">
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">.env — minimum required</p>
                                        <div className="rounded-xl bg-slate-900 text-emerald-400 px-4 py-3 font-mono text-[11px] space-y-1 leading-relaxed">
                                            <div className="text-slate-500"># Only these are truly required in .env:</div>
                                            <div>DJANGO_SECRET_KEY=<span className="text-amber-400">your-secret</span></div>
                                            <div>DB_PASSWORD=<span className="text-amber-400">your-db-pass</span></div>
                                            <div>DJANGO_SETTINGS_MODULE=<span className="text-amber-400">config.settings.development</span></div>
                                            <div className="text-slate-500 mt-1"># Everything else → this page</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Last updated */}
                        {form.updated_at && (
                            <p className="text-xs text-slate-400 text-center pb-4">
                                Last updated {new Date(form.updated_at).toLocaleString()}
                                {form.updated_by && ` by ${form.updated_by}`}
                            </p>
                        )}
                    </>
                )}

                {/* Sticky save bar */}
                {isDirty && !loading && (
                    <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                            Unsaved changes in <strong className="text-slate-800 dark:text-white ml-1">{TABS.find(t=>t.id===tab)?.label}</strong>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={handleDiscard}
                                className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Discard
                            </button>
                            <button onClick={handleSave} disabled={saving}
                                className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-60">
                                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                                {saving ? 'Saving...' : `Save ${TABS.find(t=>t.id===tab)?.label}`}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
        </DashboardLayout>
    );
}