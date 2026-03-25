// src/pages/admin/SiteSettingsPage.jsx
import { useState, useEffect, useRef } from 'react';
import { Save, Upload, X, Globe, Mail, Phone, MapPin,
         Settings, Shield, Image, RefreshCw, ExternalLink,
         Facebook, Twitter, Youtube, AlertTriangle, Info } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { apiFetch } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';

// ── Helpers ───────────────────────────────────────────────────────
function Toast({ message, type, onDone }) {
    useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
    return (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-2xl shadow-xl text-white text-sm font-medium
            ${type === 'success' ? 'bg-primary-600' : 'bg-rose-500'}`}>
            {type === 'success' ? '✓' : '⚠'} {message}
        </div>
    );
}

function Section({ title, icon: Icon, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60">
                <Icon className="h-4 w-4 text-primary-600 flex-shrink-0" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            </div>
            <div className="p-5 space-y-4">{children}</div>
        </div>
    );
}

function Field({ label, hint, error, required, children }) {
    return (
        <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                {label}{required && <span className="text-rose-500 ml-0.5">*</span>}
            </label>
            {children}
            {hint  && <p className="text-xs text-slate-400">{hint}</p>}
            {error && <p className="text-xs text-rose-500">⚠ {error}</p>}
        </div>
    );
}

function Input({ ...props }) {
    return (
        <input {...props}
            className="w-full rounded-xl bg-primary-50/60 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 transition-colors" />
    );
}

function Textarea({ ...props }) {
    return (
        <textarea {...props}
            className="w-full rounded-xl bg-primary-50/60 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30 resize-none transition-colors" />
    );
}

// ── Image upload field ────────────────────────────────────────────
function ImageField({ label, hint, currentUrl, fieldName, onSelect }) {
    const ref = useRef();
    const [preview, setPreview] = useState(currentUrl);

    useEffect(() => setPreview(currentUrl), [currentUrl]);

    const handleFile = e => {
        const file = e.target.files[0];
        if (!file) return;
        setPreview(URL.createObjectURL(file));
        onSelect(fieldName, file);
    };

    return (
        <Field label={label} hint={hint}>
            <div className="flex items-center gap-3">
                {/* Preview */}
                <div className="h-16 w-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {preview
                        ? <img src={preview} alt={label} className="h-full w-full object-contain p-1" />
                        : <Image className="h-6 w-6 text-slate-300" />
                    }
                </div>
                <div className="space-y-1.5 flex-1">
                    <button type="button" onClick={() => ref.current.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 text-xs font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                        <Upload className="h-3.5 w-3.5" /> Upload
                    </button>
                    {preview && (
                        <button type="button"
                            onClick={() => { setPreview(null); onSelect(fieldName, null); }}
                            className="ml-2 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-500 hover:bg-rose-50 transition-colors">
                            <X className="h-3 w-3" /> Remove
                        </button>
                    )}
                    <p className="text-[10px] text-slate-400">PNG, SVG, JPG · Max 2MB</p>
                </div>
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            </div>
        </Field>
    );
}

// ── Toggle ────────────────────────────────────────────────────────
function Toggle({ value, onChange, label, description }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</p>
                {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
            </div>
            <button type="button"
                onClick={() => onChange(!value)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
                    ${value ? 'bg-primary-600' : 'bg-slate-200 dark:bg-slate-600'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
                    ${value ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────
export default function SiteSettingsPage() {
    const { settings: ctxSettings, reload: reloadCtx } = useSiteSettings();
    const [form,      setForm]      = useState({});
    const [savedForm, setSavedForm] = useState({});
    const [files,     setFiles]     = useState({});
    const [loading,   setLoading]   = useState(true);
    const [saving,    setSaving]    = useState(false);
    const [toast,     setToast]     = useState(null);
    const [tab,       setTab]       = useState('branding');

    // ── Which fields belong to each tab ──────────────────────────
    const TAB_FIELDS = {
        branding: ['site_title','site_short_name','site_tagline','footer_text','copyright_year',
                   'site_logo','doe_logo','gov_logo','favicon'],
        contact:  ['contact_email','contact_phone','contact_address','website_url'],
        system:   ['allow_ndi_login','allow_agency_login','session_timeout','max_login_attempts',
                   'maintenance_mode','maintenance_msg'],
        social:   ['facebook_url','twitter_url','youtube_url'],
    };
    const IMAGE_FIELDS = ['site_logo','doe_logo','gov_logo','favicon'];

    // ── Dirty check — only for current tab's fields ───────────────
    const currentFields = TAB_FIELDS[tab] || [];
    const isDirty = currentFields.some(k => {
        if (IMAGE_FIELDS.includes(k)) return files[k] !== undefined;
        return JSON.stringify(form[k]) !== JSON.stringify(savedForm[k]);
    });

    useEffect(() => {
        apiFetch('/admin/site-settings/')
            .then(r => r?.ok ? r.json() : null)
            .then(data => {
                if (data) { setForm(data); setSavedForm(data); }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const set = (field, value) => setForm(p => ({ ...p, [field]: value }));
    const onFileSelect = (field, file) => setFiles(p => ({ ...p, [field]: file }));

    // ── Tab definitions ───────────────────────────────────────────
    const TABS = [
        { id: 'branding', label: 'Branding', icon: Image },
        { id: 'contact',  label: 'Contact',  icon: Mail  },
        { id: 'system',   label: 'System',   icon: Settings },
        { id: 'social',   label: 'Social',   icon: Globe },
    ];

    // ── Save only the current tab's fields ────────────────────────
    const handleSave = async () => {
        setSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const fields = TAB_FIELDS[tab] || [];
            const textFields = fields.filter(k => !IMAGE_FIELDS.includes(k));
            const hasFiles   = fields.some(k => IMAGE_FIELDS.includes(k) && files[k] !== undefined);

            let res;

            if (hasFiles) {
                // FormData — include current tab text fields + any image changes
                const fd = new FormData();
                textFields.forEach(k => {
                    const v = form[k];
                    if (v === null || v === undefined) return;
                    fd.append(k, typeof v === 'boolean' ? String(v) : String(v));
                });
                IMAGE_FIELDS.filter(k => fields.includes(k)).forEach(k => {
                    if (files[k] instanceof File) fd.append(k, files[k]);
                    else if (files[k] === null)   fd.append(k, '');
                    // else — not changed, don't send
                });
                res = await fetch('/api/admin/site-settings/', {
                    method:  'PATCH',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body:    fd,
                });
            } else {
                // JSON — only current tab's text fields
                const payload = {};
                textFields.forEach(k => { payload[k] = form[k]; });
                res = await fetch('/api/admin/site-settings/', {
                    method:  'PATCH',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type':  'application/json',
                    },
                    body: JSON.stringify(payload),
                });
            }

            if (res?.ok) {
                const updated = await res.json();
                setForm(updated);
                setSavedForm(prev => ({ ...prev, ...updated }));
                setFiles(prev => {
                    const next = { ...prev };
                    fields.forEach(k => { if (IMAGE_FIELDS.includes(k)) delete next[k]; });
                    return next;
                });
                reloadCtx();
                setToast({ msg: `✓ ${TABS.find(t=>t.id===tab)?.label} settings saved!`, type: 'success' });
            } else {
                let errMsg = 'Failed to save.';
                try { const e = await res.json(); errMsg = e?.error || e?.detail || JSON.stringify(e); } catch {}
                setToast({ msg: errMsg, type: 'error' });
            }
        } catch (e) {
            setToast({ msg: `Network error: ${e.message}`, type: 'error' });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout breadcrumb="System" title="Site Settings">
            <div className="space-y-5 w-full">{/* Full width — no max-w restriction */}

                {/* Page header */}
                <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                    <div className="px-6 py-5 flex items-center justify-between"
                        style={{ background: 'linear-gradient(135deg, #1a4a3a 0%, #256648 100%)' }}>
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-primary-200 mb-1">System</p>
                            <h1 className="text-xl font-bold text-white">Site Settings</h1>
                            <p className="text-sm text-primary-100 mt-0.5">
                                Manage branding, contact info and system configuration
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {isDirty && !saving && (
                                <button
                                    onClick={() => {
                                        // Discard current tab changes only
                                        const fields = TAB_FIELDS[tab] || [];
                                        setForm(prev => {
                                            const reset = { ...prev };
                                            fields.forEach(k => { reset[k] = savedForm[k]; });
                                            return reset;
                                        });
                                        setFiles(prev => {
                                            const next = { ...prev };
                                            fields.forEach(k => { if (IMAGE_FIELDS.includes(k)) delete next[k]; });
                                            return next;
                                        });
                                    }}
                                    className="text-xs font-medium text-white/60 hover:text-white border border-white/20 px-3 py-1.5 rounded-full transition-colors">
                                    Discard
                                </button>
                            )}
                            {isDirty && !saving && (
                                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-200 bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
                                    <span className="h-1.5 w-1.5 rounded-full bg-amber-300 animate-pulse" />
                                    Unsaved changes
                                </span>
                            )}
                            <button onClick={handleSave} disabled={saving || loading}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm disabled:opacity-60
                                    ${isDirty
                                        ? 'bg-white text-primary-700 hover:bg-primary-50 ring-2 ring-white/50'
                                        : 'bg-white/20 text-white border border-white/30 hover:bg-white/30'
                                    }`}>
                                {saving
                                    ? <RefreshCw className="h-4 w-4 animate-spin" />
                                    : <Save className="h-4 w-4" />
                                }
                                {saving ? 'Saving...' : isDirty ? `Save ${TABS.find(t=>t.id===tab)?.label}` : 'Saved ✓'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                    {TABS.map(({ id, label, icon: Icon }) => {
                        // Check if this tab has unsaved changes
                        const tabFields = TAB_FIELDS[id] || [];
                        const tabDirty = tabFields.some(k => {
                            if (IMAGE_FIELDS.includes(k)) return files[k] !== undefined;
                            return JSON.stringify(form[k]) !== JSON.stringify(savedForm[k]);
                        });
                        return (
                            <button key={id} onClick={() => setTab(id)}
                                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all relative
                                    ${tab === id
                                        ? 'bg-white dark:bg-slate-700 text-primary-700 dark:text-primary-400 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}>
                                <Icon className="h-3.5 w-3.5" />
                                {label}
                                {/* Unsaved dot */}
                                {tabDirty && (
                                    <span className="absolute top-1 right-1.5 h-1.5 w-1.5 rounded-full bg-amber-400" />
                                )}
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
                        {/* ── BRANDING ── */}
                        {tab === 'branding' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                {/* Left column */}
                                <div className="space-y-5">
                                    <Section title="Site Identity" icon={Globe}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Site Title" required>
                                                <Input value={form.site_title || ''} onChange={e => set('site_title', e.target.value)}
                                                    placeholder="Energy Information System" />
                                            </Field>
                                            <Field label="Short Name">
                                                <Input value={form.site_short_name || ''} onChange={e => set('site_short_name', e.target.value)}
                                                    placeholder="EIS" />
                                            </Field>
                                        </div>
                                        <Field label="Tagline" hint="Shown below the title in header and login page">
                                            <Input value={form.site_tagline || ''} onChange={e => set('site_tagline', e.target.value)}
                                                placeholder="Department of Energy · MoENR · Royal Government of Bhutan" />
                                        </Field>
                                        <Field label="Footer Text">
                                            <Textarea value={form.footer_text || ''} onChange={e => set('footer_text', e.target.value)}
                                                rows={2} placeholder="© 2026 Department of Energy..." />
                                        </Field>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Copyright Year">
                                                <Input value={form.copyright_year || ''} onChange={e => set('copyright_year', e.target.value)}
                                                    placeholder="2026" />
                                            </Field>
                                        </div>
                                    </Section>
                                </div>

                                {/* Right column */}
                                <div className="space-y-5">
                                    <Section title="Logos & Images" icon={Image}>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                            <ImageField label="Main Site Logo" fieldName="site_logo"
                                                hint="Header & login page"
                                                currentUrl={form.site_logo_url} onSelect={onFileSelect} />
                                            <ImageField label="DOE Logo" fieldName="doe_logo"
                                                hint="Login card right logo"
                                                currentUrl={form.doe_logo_url} onSelect={onFileSelect} />
                                            <ImageField label="Gov't Crest (RGoB)" fieldName="gov_logo"
                                                hint="Sidebar & header crest"
                                                currentUrl={form.gov_logo_url} onSelect={onFileSelect} />
                                            <ImageField label="Favicon" fieldName="favicon"
                                                hint="Browser tab · 32×32px"
                                                currentUrl={form.favicon_url} onSelect={onFileSelect} />
                                        </div>
                                        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                                            <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                                            Place images in <code className="font-mono">frontend/public/images/</code> for immediate use without upload.
                                        </div>
                                    </Section>
                                </div>
                            </div>
                        )}

                        {/* ── CONTACT ── */}
                        {tab === 'contact' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="Contact Information" icon={Mail}>
                                    <Field label="Support Email" hint="Shown in login page footer and support links">
                                        <Input type="email" value={form.contact_email || ''} onChange={e => set('contact_email', e.target.value)}
                                            placeholder="support@energy.gov.bt" />
                                    </Field>
                                    <Field label="Phone Number">
                                        <Input value={form.contact_phone || ''} onChange={e => set('contact_phone', e.target.value)}
                                            placeholder="+975 2 XXXXXX" />
                                    </Field>
                                    <Field label="Office Address">
                                        <Textarea value={form.contact_address || ''} onChange={e => set('contact_address', e.target.value)}
                                            rows={3} placeholder="Department of Energy, MoENR, Thimphu, Bhutan" />
                                    </Field>
                                    <Field label="Official Website">
                                        <div className="relative">
                                            <Input value={form.website_url || ''} onChange={e => set('website_url', e.target.value)}
                                                placeholder="https://www.moea.gov.bt" />
                                            {form.website_url && (
                                                <a href={form.website_url} target="_blank" rel="noreferrer"
                                                    className="absolute right-3 top-2.5 text-slate-400 hover:text-primary-600">
                                                    <ExternalLink className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    </Field>
                                </Section>
                                {/* Preview card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 flex flex-col justify-center gap-4">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Preview</p>
                                    <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                        {form.contact_email && <p>📧 {form.contact_email}</p>}
                                        {form.contact_phone && <p>📞 {form.contact_phone}</p>}
                                        {form.contact_address && <p>📍 {form.contact_address}</p>}
                                        {form.website_url && (
                                            <a href={form.website_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-1.5 text-primary-600 hover:underline">
                                                🌐 {form.website_url}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── SYSTEM ── */}
                        {tab === 'system' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <div className="space-y-5">
                                    <Section title="Login Options" icon={Shield}>
                                        <Toggle value={form.allow_ndi_login} onChange={v => set('allow_ndi_login', v)}
                                            label="Allow NDI Login"
                                            description="Let users authenticate via Bhutan NDI Wallet" />
                                        <div className="border-t border-slate-100 dark:border-slate-700" />
                                        <Toggle value={form.allow_agency_login} onChange={v => set('allow_agency_login', v)}
                                            label="Allow Agency Login"
                                            description="Let users login with username and password" />
                                    </Section>

                                    <Section title="Session & Security" icon={Settings}>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Field label="Session Timeout (min)" hint="Inactivity timeout">
                                                <Input type="number" value={form.session_timeout || 480}
                                                    onChange={e => set('session_timeout', Number(e.target.value))}
                                                    min={15} max={1440} />
                                            </Field>
                                            <Field label="Max Login Attempts" hint="Before account lockout">
                                                <Input type="number" value={form.max_login_attempts || 5}
                                                    onChange={e => set('max_login_attempts', Number(e.target.value))}
                                                    min={3} max={20} />
                                            </Field>
                                        </div>
                                    </Section>
                                </div>

                                <div className="space-y-5">
                                    <Section title="Maintenance Mode" icon={AlertTriangle}>
                                        <Toggle value={form.maintenance_mode} onChange={v => set('maintenance_mode', v)}
                                            label="Enable Maintenance Mode"
                                            description="Displays maintenance message to all non-admin users" />
                                        {form.maintenance_mode && (
                                            <Field label="Maintenance Message">
                                                <Textarea value={form.maintenance_msg || ''} onChange={e => set('maintenance_msg', e.target.value)}
                                                    rows={4} placeholder="The system is under maintenance. Please try again later." />
                                            </Field>
                                        )}
                                        {form.maintenance_mode && (
                                            <div className="rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 px-4 py-3 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
                                                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                                                Maintenance mode is <strong>ON</strong> — only admins can access the system.
                                            </div>
                                        )}
                                        {!form.maintenance_mode && (
                                            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-3 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                                ✓ System is live and accessible to all users.
                                            </div>
                                        )}
                                    </Section>
                                </div>
                            </div>
                        )}

                        {/* ── SOCIAL ── */}
                        {tab === 'social' && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                                <Section title="Social Media Links" icon={Globe}>
                                    <Field label="Facebook" hint="Department or Ministry Facebook page">
                                        <div className="relative">
                                            <Facebook className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <input value={form.facebook_url || ''} onChange={e => set('facebook_url', e.target.value)}
                                                placeholder="https://facebook.com/..." className="w-full rounded-xl bg-primary-50/60 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
                                        </div>
                                    </Field>
                                    <Field label="Twitter / X">
                                        <div className="relative">
                                            <Twitter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <input value={form.twitter_url || ''} onChange={e => set('twitter_url', e.target.value)}
                                                placeholder="https://twitter.com/..." className="w-full rounded-xl bg-primary-50/60 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
                                        </div>
                                    </Field>
                                    <Field label="YouTube" hint="Official channel for tutorials and guides">
                                        <div className="relative">
                                            <Youtube className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                                            <input value={form.youtube_url || ''} onChange={e => set('youtube_url', e.target.value)}
                                                placeholder="https://youtube.com/..." className="w-full rounded-xl bg-primary-50/60 dark:bg-slate-700 border border-primary-100 dark:border-slate-600 pl-9 pr-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30" />
                                        </div>
                                    </Field>
                                </Section>

                                {/* Live preview */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Link Preview</p>
                                    <div className="space-y-3">
                                        {form.facebook_url && (
                                            <a href={form.facebook_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 text-sm hover:bg-blue-100 transition-colors">
                                                <Facebook className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-xs">{form.facebook_url}</span>
                                            </a>
                                        )}
                                        {form.twitter_url && (
                                            <a href={form.twitter_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 text-sm hover:bg-sky-100 transition-colors">
                                                <Twitter className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-xs">{form.twitter_url}</span>
                                            </a>
                                        )}
                                        {form.youtube_url && (
                                            <a href={form.youtube_url} target="_blank" rel="noreferrer"
                                                className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm hover:bg-red-100 transition-colors">
                                                <Youtube className="h-4 w-4 flex-shrink-0" />
                                                <span className="truncate text-xs">{form.youtube_url}</span>
                                            </a>
                                        )}
                                        {!form.facebook_url && !form.twitter_url && !form.youtube_url && (
                                            <p className="text-xs text-slate-400 text-center py-6">No social links added yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Last updated */}
                        {form.updated_at && (
                            <p className="text-xs text-slate-400 text-center pb-2">
                                Last updated {new Date(form.updated_at).toLocaleString('en-BT')}
                                {form.updated_by && ` by ${form.updated_by}`}
                            </p>
                        )}
                    </>
                )}
            </div>

            {toast && <Toast message={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

            {/* Sticky bottom save bar — appears when there are unsaved changes */}
            {isDirty && !loading && (
                <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between gap-4 px-6 py-3 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-lg">
                    <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                        Unsaved changes in <strong className="text-slate-800 dark:text-slate-100">{TABS.find(t=>t.id===tab)?.label}</strong>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => {
                                const fields = TAB_FIELDS[tab] || [];
                                setForm(prev => {
                                    const reset = { ...prev };
                                    fields.forEach(k => { reset[k] = savedForm[k]; });
                                    return reset;
                                });
                                setFiles(prev => {
                                    const next = { ...prev };
                                    fields.forEach(k => { if (IMAGE_FIELDS.includes(k)) delete next[k]; });
                                    return next;
                                });
                            }}
                            className="px-4 py-2 rounded-full text-sm font-medium text-slate-500 hover:text-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Discard
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition-colors disabled:opacity-60 shadow-sm">
                            {saving
                                ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                : <Save className="h-3.5 w-3.5" />
                            }
                            {saving ? 'Saving...' : `Save ${TABS.find(t=>t.id===tab)?.label}`}
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}