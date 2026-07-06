// src/pages/auth/LoginPage.jsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { savePermissions } from '../../context/PermissionsContext';
import { Eye, EyeOff, ArrowLeft, LogIn, AlertTriangle } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { BASE_URL } from '../../services/api';

// ── NDI colours (Bhutan NDI UI Spec v3) ──────────────────────────
const NDI_TEAL = '#5AC994';
const NDI_DARK = '#124143';
const NDI_GRAY = '#A1A0A0';

// ── NDI Modal ─────────────────────────────────────────────────────
function NDIModal({ onClose }) {
    const navigate = useNavigate();
    const [state,    setState]    = useState('loading');
    const [qrUrl,    setQrUrl]    = useState('');
    const [deepLink, setDeepLink] = useState('');
    const [threadId, setThreadId] = useState('');
    const [error,    setError]    = useState('');
    const initiated = useRef(false); // prevent double-call in React StrictMode

    // Step 1: create proof request on mount
    useEffect(() => {
        if (initiated.current) return; // StrictMode guard
        initiated.current = true;
        (async () => {
            try {
                const res  = await fetch(`${BASE_URL}/auth/ndi/initiate/`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await res.json();
                if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create proof request');
                setQrUrl(data.proof_request_url);
                setDeepLink(data.deep_link_url);
                setThreadId(data.thread_id);
                setState('waiting');
            } catch (e) {
                setError(e.message); setState('failed');
            }
        })();
    }, []);

    // Step 2: poll status every 3s — starts as soon as we have a threadId
    useEffect(() => {
        if (!threadId) return;
        const ROUTES = { ADMIN: '/admin/dashboard', DOE_HEAD: '/doe/dashboard', DATA_MANAGER: '/manager/dashboard', DATA_FOCAL: '/focal/dashboard', VIEWER: '/viewer/dashboard' };
        const nextUrl = new URLSearchParams(window.location.search).get('next') || null;
        const timer = setInterval(async () => {
            try {
                const res  = await fetch(`${BASE_URL}/auth/ndi/status/?thread_id=${threadId}`);
                const data = await res.json();
                if (data.authenticated) {
                    clearInterval(timer);
                    localStorage.setItem('access_token',  data.access);
                    localStorage.setItem('refresh_token', data.refresh);
                    localStorage.setItem('user',          JSON.stringify(data.user));
                    savePermissions(data.permissions || {});
                    setState('success');
                    setTimeout(() => {
                        if (data.needs_profile_setup) {
                            window.location.href = '/ndi/setup';
                        } else {
                            window.location.href = nextUrl || ROUTES[data.user?.role?.role_name] || '/admin/dashboard';
                        }
                    }, 1200);
                } else if (data.status === 'rejected') {
                    clearInterval(timer); setState('rejected');
                } else if (data.status === 'blocked') {
                    clearInterval(timer); setState('failed');
                    setError(data.error || 'Your account is inactive. Contact the administrator.');
                } else if (data.status === 'failed' || data.status === 'expired') {
                    clearInterval(timer); setState('failed'); setError('Verification failed. Please try again.');
                }
                // status === 'pending' → keep polling
            } catch {}
        }, 3000);
        return () => clearInterval(timer);
    }, [threadId]);

    // Escape key closes modal
    useEffect(() => {
        const onKey = e => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const handleRetry = () => { setState('loading'); setQrUrl(''); setDeepLink(''); setThreadId(''); setError(''); };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            {/* Popup — spec: bg #F8F8F8, Inter, all content centered */}
            <div
                className="w-full max-w-[420px] rounded-2xl shadow-2xl overflow-hidden"
                style={{ backgroundColor: '#F8F8F8', fontFamily: 'Inter, system-ui, sans-serif', maxHeight: '92vh', overflowY: 'auto' }}
            >
                {/* Close */}
                <div className="flex justify-end px-5 pt-4">
                    <button onClick={onClose}
                        className="h-7 w-7 rounded-full border border-slate-200 bg-white flex items-center justify-center text-slate-400 hover:bg-slate-100 text-xl leading-none">
                        ×
                    </button>
                </div>

                {/* Content — 30px gap per spec */}
                <div className="flex flex-col items-center px-8 pb-8" style={{ gap: 30 }}>

                    {/* Title — spec: "Bhutan NDI" in #5AC994, semibold 18px */}
                    <p className="font-semibold text-lg text-slate-800 text-center">
                        Scan with <span style={{ color: NDI_TEAL }}>Bhutan NDI</span> Wallet
                    </p>

                    {/* Open wallet button — spec: #5AC994 bg, W:300 H:50, white semibold */}
                    {deepLink ? (                        <a href={deepLink} target="_blank" rel="noreferrer"
                            className="flex items-center justify-center gap-2.5 rounded-lg font-semibold text-white text-base hover:opacity-90 transition-opacity"
                            style={{ backgroundColor: NDI_TEAL, width: 300, height: 50, textDecoration: 'none', flexShrink: 0 }}>
                            <img src="/images/ndi_logo.png" alt="NDI" className="h-7 w-7 object-contain"
                                onError={e => { e.target.style.display = 'none'; }} />
                            Open Bhutan NDI Wallet
                        </a>
                    ) : (
                        <div className="flex items-center justify-center gap-2.5 rounded-lg font-semibold text-white text-base opacity-50 cursor-not-allowed"
                            style={{ backgroundColor: NDI_TEAL, width: 300, height: 50, flexShrink: 0 }}>
                            <img src="/images/ndi_logo.png" alt="NDI" className="h-7 w-7 object-contain"
                                onError={e => { e.target.style.display = 'none'; }} />
                            Open Bhutan NDI Wallet
                        </div>
                    )}

                    {/* OR divider */}
                    <div className="flex items-center gap-4 w-full">
                        <div className="flex-1 h-px bg-slate-300" />
                        <span className="text-sm font-semibold text-slate-400 tracking-widest">OR</span>
                        <div className="flex-1 h-px bg-slate-300" />
                    </div>

                    {/* QR Code area */}
                    <div className="relative">
                        <div className="bg-white rounded-xl shadow-sm flex items-center justify-center"
                            style={{ width: 210, height: 210, padding: 10 }}>

                            {state === 'loading' && (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="h-8 w-8 rounded-full border-2 border-slate-200 animate-spin"
                                        style={{ borderTopColor: NDI_TEAL }} />
                                    <p className="text-xs" style={{ color: NDI_GRAY }}>Generating QR...</p>
                                </div>
                            )}

                            {state === 'waiting' && qrUrl && (
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrUrl)}&color=124143&bgcolor=ffffff`}
                                    alt="NDI QR Code"
                                    style={{ width: 180, height: 180 }}
                                />
                            )}

                            {state === 'success' && (
                                <div className="flex flex-col items-center gap-2">
                                    <div className="h-14 w-14 rounded-full flex items-center justify-center"
                                        style={{ backgroundColor: NDI_TEAL }}>
                                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                                            <path d="M5 13l4 4L19 7" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <p className="text-sm font-bold" style={{ color: NDI_TEAL }}>Verified!</p>
                                    <p className="text-xs text-slate-400">Redirecting to dashboard...</p>
                                </div>
                            )}

                            {state === 'rejected' && (
                                <div className="flex flex-col items-center gap-3 text-center px-2">
                                    <div className="text-3xl">❌</div>
                                    <p className="text-sm font-medium text-slate-600">Proof rejected</p>
                                    <button onClick={handleRetry}
                                        className="text-xs font-semibold px-4 py-1.5 rounded-full text-white"
                                        style={{ backgroundColor: NDI_TEAL }}>
                                        Try again
                                    </button>
                                </div>
                            )}

                            {state === 'failed' && (
                                <div className="flex flex-col items-center gap-3 text-center px-3">
                                    <div className="text-3xl">⚠️</div>
                                    <p className="text-xs text-slate-500">{error || 'NDI service unavailable'}</p>
                                    <button onClick={onClose}
                                        className="text-xs font-semibold px-4 py-1.5 rounded-full border"
                                        style={{ borderColor: NDI_TEAL, color: NDI_TEAL }}>
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* NDI logo overlay on QR */}
                        {state === 'waiting' && qrUrl && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center p-1 shadow-md">
                                    <img src="/images/ndi_logo.png" alt="NDI" className="h-full w-full object-contain"
                                        onError={e => { e.target.parentElement.style.display = 'none'; }} />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Waiting indicator */}
                    {state === 'waiting' && (
                        <div className="flex items-center gap-2 text-xs" style={{ color: NDI_GRAY }}>
                            {[0,1,2].map(i => (
                                <span key={i} className="h-1.5 w-1.5 rounded-full animate-bounce"
                                    style={{ backgroundColor: NDI_TEAL, animationDelay: `${i * 0.15}s` }} />
                            ))}
                            <span className="ml-1">Waiting for scan...</span>
                        </div>
                    )}

                    {/* Instructions — spec: gray #A1A0A0 */}
                    <div className="text-center space-y-1.5 w-full" style={{ color: NDI_GRAY }}>
                        <p className="text-sm">1. Open Bhutan NDI Wallet on your phone</p>
                        <p className="text-sm flex items-center justify-center gap-1.5 flex-wrap">
                            2. Tap the Scan button
                            <img src="/images/ScanButton.png" alt="Scan icon"
                                className="h-5 w-5 object-contain inline-block"
                                onError={e => { e.target.style.display = 'none'; }} />
                            located on the menu bar and scan the QR code
                        </p>
                    </div>

                    {/* Watch Video Guide — spec: border #5AC994, text #5AC994, W:200 H:40 */}
                    <a href="https://www.youtube.com/@BhutanNDI" target="_blank" rel="noreferrer"
                        className="flex items-center justify-center gap-2 rounded-full font-medium hover:opacity-80 transition-opacity"
                        style={{ border: `2px solid ${NDI_TEAL}`, color: NDI_TEAL, width: 200, height: 40, textDecoration: 'none', fontSize: 15 }}>
                        Watch Video Guide
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke={NDI_TEAL} strokeWidth="1.5"/>
                            <path d="M10 8l6 4-6 4V8z" fill={NDI_TEAL}/>
                        </svg>
                    </a>

                    {/* Download — "Download Now!" in #5AC994 */}
                    <p className="text-sm text-center" style={{ color: NDI_GRAY }}>
                        Don't have the Bhutan NDI Wallet?{' '}
                        <a href="https://play.google.com/store/apps/details?id=bt.gov.ndi" target="_blank" rel="noreferrer"
                            className="font-bold hover:underline" style={{ color: NDI_TEAL }}>
                            Download Now!
                        </a>
                    </p>

                    {/* Store buttons */}
                    <div className="flex gap-3">
                        <a href="https://play.google.com/store/apps/details?id=bt.gov.ndi" target="_blank" rel="noreferrer"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #0f3460' }}>
                            {/* Google Play colorful icon */}
                            <svg width="20" height="22" viewBox="0 0 20 22" fill="none">
                                <path d="M1.5 0.8L11.5 11L1.5 21.2C1 20.9 0.5 20.3 0.5 19.5V2.5C0.5 1.7 1 1.1 1.5 0.8Z" fill="#EA4335"/>
                                <path d="M15.5 7.5L11.5 11L1.5 0.8C1.7 0.7 1.9 0.6 2.1 0.6L15.5 7.5Z" fill="#FBBC04"/>
                                <path d="M15.5 14.5L2.1 21.4C1.9 21.4 1.7 21.3 1.5 21.2L11.5 11L15.5 14.5Z" fill="#34A853"/>
                                <path d="M19.5 11C19.5 12.3 18.7 13.4 17.6 13.9L15.5 14.5L11.5 11L15.5 7.5L17.6 8.1C18.7 8.6 19.5 9.7 19.5 11Z" fill="#4285F4"/>
                            </svg>
                            <div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">GET IT ON</div>
                                <div className="text-xs font-semibold leading-tight text-white">Google Play</div>
                            </div>
                        </a>
                        <a href="https://apps.apple.com/app/bhutan-ndi" target="_blank" rel="noreferrer"
                            className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 transition-all hover:scale-105"
                            style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)', border: '1px solid #0f3460' }}>
                            {/* Apple colorful icon */}
                            <svg width="18" height="22" viewBox="0 0 18 22" fill="none">
                                <path d="M14.5 11.5C14.5 9.2 16 7.8 16 7.8C16 7.8 14.8 6 12.5 6C10.8 6 10 7 9 7C8 7 7 6 5.5 6C3.5 6 1.5 7.8 1.5 11C1.5 14.5 3.8 19 6 19C7 19 7.8 18.3 9 18.3C10.2 18.3 10.8 19 12 19C14.2 19 16 14.8 16 14.8C16 14.8 14.5 13.8 14.5 11.5Z" fill="white"/>
                                <path d="M11.5 4C12.3 3 12.8 1.7 12.5 0.5C11.3 0.6 9.8 1.4 9 2.5C8.2 3.4 7.7 4.7 8 5.8C9.2 5.9 10.7 5 11.5 4Z" fill="white"/>
                            </svg>
                            <div>
                                <div className="text-[9px] text-slate-400 uppercase tracking-wider leading-none">Download on the</div>
                                <div className="text-xs font-semibold leading-tight text-white">App Store</div>
                            </div>
                        </a>
                    </div>

                    {/* Get Support — spec: header #5AC994 16px, details 14px */}
                    <div className="text-center space-y-2">
                        <p className="font-semibold text-base" style={{ color: NDI_TEAL }}>Get Support</p>
                        <div className="flex items-center justify-center gap-6" style={{ color: NDI_GRAY, fontSize: 14 }}>
                            <a href="mailto:ndifeedback@dhi.bt" style={{ color: NDI_GRAY, textDecoration: 'none' }}
                                className="flex items-center gap-1.5 hover:underline">
                                <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                                    <rect x="2" y="4" width="16" height="13" rx="2" stroke={NDI_GRAY} strokeWidth="1.3"/>
                                    <path d="M2 7l8 5 8-5" stroke={NDI_GRAY} strokeWidth="1.3"/>
                                </svg>
                                ndifeedback@dhi.bt
                            </a>
                            <a href="tel:1199" style={{ color: NDI_GRAY, textDecoration: 'none' }}
                                className="flex items-center gap-1.5 hover:underline">
                                <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
                                    <path d="M3 4a1 1 0 011-1h2.5a1 1 0 011 .75l.75 3a1 1 0 01-.29.95l-1 .94a11 11 0 004.36 4.36l.94-1a1 1 0 01.95-.29l3 .75a1 1 0 01.75 1V16a1 1 0 01-1 1C7.16 17 3 12.84 3 8V4z" stroke={NDI_GRAY} strokeWidth="1.3"/>
                                </svg>
                                1199
                            </a>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ── Agency Login Form ─────────────────────────────────────────────
function AgencyLoginForm({ onBack, onSuccess }) {
    const navigate  = useNavigate();
    const [loading, setLoading] = useState(false);
    const [form,    setForm]    = useState({ username: '', password: '' });
    const [error,   setError]   = useState('');
    const [showPw,  setShowPw]  = useState(false);

    const handleSubmit = async () => {
        if (!form.username || !form.password) { setError('Please enter both username and password.'); return; }
        setError(''); setLoading(true);
        try {
            const res  = await fetch(`${BASE_URL}/auth/login/`, {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ username: form.username, password: form.password }),
            });
            const data = await res.json();
            if (!res.ok) { setError(data?.detail || 'Login failed.'); return; }
            localStorage.setItem('access_token',  data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user',          JSON.stringify(data.user));
            savePermissions(data.permissions || {});
            onSuccess(data);
        } catch { setError('Cannot connect to server. Please try again.'); }
        finally  { setLoading(false); }
    };

    return (
        <div className="w-full space-y-5">
            {/* Only show back button if there are other login options */}
            {onBack && (
                <button onClick={onBack}
                    className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary-700 transition-colors">
                    <ArrowLeft className="h-4 w-4" /> Back to login options
                </button>
            )}

            <div className="text-center">
                <h2 className="text-4xl font-extrabold text-primary-700 tracking-tight uppercase">Welcome</h2>
                <p className="text-slate-500 text-sm mt-1">Login to your account to continue</p>
            </div>

            {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
                    ⚠ {error}
                </div>
            )}

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Username / Employee ID</label>
                <input
                    type="text"
                    placeholder="e.g. doe.tshering"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                    className="w-full rounded-xl bg-primary-50 border-none px-4 py-3 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                />
            </div>

            <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Password</label>
                <div className="relative">
                    <input
                        type={showPw ? 'text' : 'password'}
                        placeholder="Enter your password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                        className="w-full rounded-xl bg-primary-50 border-none px-4 py-3 pr-12 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                    />
                    <button onClick={() => setShowPw(v => !v)} type="button" tabIndex={-1}
                        className="absolute right-3 top-3 p-1 text-slate-400 hover:text-slate-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                </div>
                <div className="flex justify-end pt-0.5">
                    <button type="button" onClick={() => navigate('/forgot-password')}
                        className="text-xs text-slate-400 hover:text-primary-600 hover:underline transition-colors">
                        Forgot password?
                    </button>
                </div>
            </div>

            <button onClick={handleSubmit} disabled={loading}
                className="w-full h-14 rounded-full bg-primary-700 hover:bg-primary-800 text-white font-bold text-base tracking-widest uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm">
                {loading
                    ? <div className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                    : <><LogIn className="h-5 w-5" /> Log In</>
                }
            </button>

            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
                Unauthorized access is prohibited and monitored.<br />
                For assistance, contact the MoENR ICT Division.
            </p>
        </div>
    );
}

// ── Main LoginPage ────────────────────────────────────────────────
export default function LoginPage() {
    const [view,    setView]    = useState('select');
    const [showNDI, setShowNDI] = useState(false);
    const navigate  = useNavigate();
    const { settings } = useSiteSettings();

    // ── If already logged in → redirect to dashboard ─────────────
    useEffect(() => {
        const token = localStorage.getItem('access_token');
        const user  = JSON.parse(localStorage.getItem('user') || 'null');
        if (token && user) {
            const ROUTES = {
                ADMIN:        '/admin/dashboard',
                DOE_HEAD:     '/doe/dashboard',
                DATA_MANAGER: '/manager/dashboard',
                DATA_FOCAL:   '/focal/dashboard',
                VIEWER:       '/viewer/dashboard',
            };
            const dest = ROUTES[user?.role?.role_name] || '/admin/dashboard';
            navigate(dest, { replace: true });
        }
    }, [navigate]);

    // Get ?next= param — redirect back after login
    const nextUrl = new URLSearchParams(window.location.search).get('next') || null;

    const allowNDI    = settings?.allow_ndi_login    !== false;  // true by default
    const allowAgency = settings?.allow_agency_login !== false;  // true by default
    const bothDisabled = !allowNDI && !allowAgency;

    // If only one method is available, skip the select screen
    useEffect(() => {
        if (!allowNDI && allowAgency) setView('agency');
        if (allowNDI && !allowAgency)  setView('ndi-only');
        if (allowNDI && allowAgency)   setView('select');
    }, [allowNDI, allowAgency]);

    const handleLoginSuccess = (data) => {
        if (data.must_change_password) { navigate('/change-password'); return; }
        const routes = {
            ADMIN:        '/admin/dashboard',
            DOE_HEAD:     '/doe/dashboard',
            DATA_MANAGER: '/manager/dashboard',
            DATA_FOCAL:   '/focal/dashboard',
            VIEWER:       '/viewer/dashboard',
        };
        const dest = nextUrl || routes[data.user?.role?.role_name] || '/admin/dashboard';
        navigate(dest, { replace: true });
    };

    return (
        <div
            className="min-h-screen flex flex-col items-center justify-center font-sans px-4 py-12 relative"
            style={{
                backgroundImage: 'url(/images/bg-pattern.png)',
                backgroundSize:  '360px 360px',
                backgroundRepeat: 'repeat',
                backgroundColor: '#ebe8e3',
            }}
        >
            {/* Vignette */}
            <div className="fixed inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 80% 80% at 50% 40%, rgba(255,255,255,0.15) 0%, transparent 100%)' }} />

            {/* Back to home */}
            <Link to="/"
                className="absolute top-5 left-5 z-10 p-2 bg-white/80 backdrop-blur-sm border border-white/60 rounded-full shadow-sm text-slate-500 hover:text-slate-800 hover:bg-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
            </Link>

            {/* White card */}
            <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-white/80 overflow-hidden">

                {/* Top accent bar */}
                <div className="h-1.5 w-full" style={{ background: 'linear-gradient(90deg, #124143, #1a4a3a)' }} />

                <div className="px-8 py-8">

                    {/* ── BOTH DISABLED ──────────────────────────── */}
                    {bothDisabled && (
                        <div className="space-y-6">
                            {/* Logo — single centered crest */}
                            <div className="flex justify-center">
                                <img src="/images/rgob-crest.png" alt="Royal Government of Bhutan"
                                    className="h-24 w-24 object-contain"
                                    onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                            <div className="text-center">
                                <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide">
                                    {settings?.site_title || 'Energy Information System'}
                                </h1>
                                <p className="text-sm font-semibold text-slate-500 mt-0.5">({settings?.site_short_name || 'EIS'})</p>
                            </div>
                            {/* Disabled notice */}
                            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-6 text-center space-y-3">
                                <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto">
                                    <AlertTriangle className="h-6 w-6 text-amber-500" />
                                </div>
                                <h2 className="font-bold text-slate-800">Login Temporarily Disabled</h2>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    All login methods have been disabled by the system administrator.
                                    Please contact your administrator for access.
                                </p>
                                <a href={`mailto:${settings?.contact_email || 'support@energy.gov.bt'}`}
                                    className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 bg-primary-50 border border-primary-200 px-4 py-2 rounded-full hover:bg-primary-100 transition-colors">
                                    📧 {settings?.contact_email || 'support@energy.gov.bt'}
                                </a>
                            </div>
                            {/* Admin bypass — always available */}
                            <p className="text-center text-xs text-slate-400">
                                Administrator?{' '}
                                <a href="/eis-admin/" className="font-semibold text-primary-600 hover:underline">
                                    Login via Django Admin →
                                </a>
                            </p>
                        </div>
                    )}

                    {/* ── NDI ONLY (agency disabled) ─────────────── */}
                    {view === 'ndi-only' && !bothDisabled && (
                        <div className="space-y-6">
                            <div className="flex justify-center">
                                <img src="/images/rgob-crest.png" alt="Royal Government of Bhutan"
                                    className="h-24 w-24 object-contain"
                                    onError={e => { e.target.style.display = 'none'; }} />
                            </div>
                            <div className="text-center">
                                <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide leading-snug">
                                    {settings?.site_title || 'Energy Information System'}
                                </h1>
                                <p className="text-sm font-semibold text-slate-500 mt-0.5">({settings?.site_short_name || 'EIS'})</p>
                                <p className="text-base font-bold text-slate-700 mt-4">Login with Bhutan NDI</p>
                            </div>
                            <button
                                onClick={() => setShowNDI(true)}
                                className="w-full flex items-center justify-center gap-3 rounded-full text-white font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] shadow-md"
                                style={{ backgroundColor: NDI_DARK, height: 58 }}>
                                <div className="h-9 w-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 p-1.5">
                                    <img src="/images/ndi_logo.png" alt="NDI"
                                        className="h-full w-full object-contain"
                                        onError={e => { e.target.style.display = 'none'; }} />
                                </div>
                                Login with Bhutan NDI
                            </button>
                            <div className="rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 text-xs text-slate-600 text-center">
                                🔐 Use your Bhutan NDI Wallet to login securely.
                            </div>
                        </div>
                    )}

                    {/* ── SELECT VIEW (both enabled) ─────────────── */}
                    {view === 'select' && !bothDisabled && (
                        <div className="space-y-6">
                            {/* Logo — single centered crest */}
                            <div className="flex justify-center">
                                <img src="/images/rgob-crest.png" alt="Royal Government of Bhutan"
                                    className="h-24 w-24 object-contain"
                                    onError={e => { e.target.style.display = 'none'; }} />
                            </div>

                            {/* Title */}
                            <div className="text-center">
                                <h1 className="text-xl font-extrabold text-slate-800 uppercase tracking-wide leading-snug">
                                    {settings?.site_title || 'Energy Information System'}
                                </h1>
                                <p className="text-sm font-semibold text-slate-500 mt-0.5">({settings?.site_short_name || 'EIS'})</p>
                                <p className="text-base font-bold text-slate-700 mt-4">Select your login method</p>
                            </div>

                            {/* NDI button */}
                            <div className="space-y-2">
                                <p className="text-center text-sm text-slate-500">Login as a government official via NDI:</p>
                                <button
                                    onClick={() => setShowNDI(true)}
                                    className="w-full flex items-center justify-center gap-3 rounded-full text-white font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] shadow-md"
                                    style={{ backgroundColor: NDI_DARK, height: 58 }}>
                                    <div className="h-9 w-9 rounded-full bg-white/15 border border-white/20 flex items-center justify-center flex-shrink-0 p-1.5">
                                        <img src="/images/ndi_logo.png" alt="NDI"
                                            className="h-full w-full object-contain"
                                            onError={e => { e.target.style.display = 'none'; }} />
                                    </div>
                                    Login with Bhutan NDI
                                </button>
                            </div>

                            {/* OR divider */}
                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-slate-200" />
                                <span className="text-sm font-bold tracking-[0.2em] text-slate-400">OR</span>
                                <div className="flex-1 h-px bg-slate-200" />
                            </div>

                            {/* Agency login button */}
                            <div className="space-y-2">
                                <p className="text-center text-sm text-slate-500">Login as an executing agency/official:</p>
                                <button
                                    onClick={() => setView('agency')}
                                    className="w-full flex items-center justify-center rounded-full text-white font-semibold text-base transition-all hover:brightness-110 active:scale-[0.98] shadow-md"
                                    style={{ backgroundColor: '#1a4a3a', height: 58 }}>
                                    Agency Login
                                </button>
                            </div>

                            {/* Tip */}
                            <div className="rounded-xl bg-primary-50 border border-primary-100 px-4 py-3 text-xs text-slate-600 leading-relaxed text-center">
                                💡 <strong className="text-slate-700">NDI recommended</strong> — Use your Bhutan NDI app for the most secure login experience.
                            </div>
                        </div>
                    )}

                    {/* ── AGENCY FORM (agency only OR user clicked agency) ── */}
                    {view === 'agency' && !bothDisabled && (
                        <AgencyLoginForm
                            onBack={allowNDI ? () => setView('select') : null}
                            onSuccess={handleLoginSuccess}
                        />
                    )}
                </div>

                {/* Card footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-[11px] text-slate-400 text-center">
                        🔒 Secured by GovTech Bhutan ·{' '}
                        <Link to="/" className="hover:text-primary-600 hover:underline transition-colors">Home</Link>
                        {' · '}
                        <a href="mailto:support@energy.gov.bt" className="hover:text-primary-600 hover:underline transition-colors">Support</a>
                        {' · '}
                        <a href="#" className="hover:text-primary-600 hover:underline transition-colors">Privacy Policy</a>
                    </p>
                    <p className="text-[10px] text-slate-300 text-center mt-1">
                        © 2026 Department of Energy · MoENR · Royal Government of Bhutan
                    </p>
                </div>
            </div>

            {/* NDI Modal */}
            {showNDI && <NDIModal onClose={() => setShowNDI(false)} />}
        </div>
    );
}