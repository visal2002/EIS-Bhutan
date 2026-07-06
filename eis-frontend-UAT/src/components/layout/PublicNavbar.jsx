// src/components/layout/PublicNavbar.jsx
// Creative glassmorphism navbar - transparent on hero, frosted on scroll
import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogIn, Zap, ChevronDown, BarChart3, FileText, Home, Droplets, Leaf, Factory, Database, TrendingUp, Flame, Activity, Shield } from 'lucide-react';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const ICON_MAP = {
    Zap, Droplets, Leaf, Factory, BarChart3, Database, TrendingUp, Flame, Activity, Shield, Home, FileText
};

export default function PublicNavbar() {
    const navigate  = useNavigate();
    const location  = useLocation();
    const { settings } = useSiteSettings();
    const [open,    setOpen]    = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close mobile menu on route change
    useEffect(() => { setOpen(false); }, [location.pathname]);

    const isHome = location.pathname === '/';

    const menuItems = settings?.landing_header?.menu_items || [];
    const navItems = menuItems.length > 0 ? menuItems.map(item => ({
        label: item.label,
        to: item.to,
        icon: ICON_MAP[item.icon] || Home,
        exact: item.exact
    })) : [
        { label: 'Home',      to: '/',              icon: Home,       exact: true  },
        { label: 'Dashboard', to: '/public',         icon: BarChart3,  exact: false },
        { label: 'Reports',   to: '/public/reports', icon: FileText,   exact: false },
    ];

    const logoText = settings?.landing_header?.logo_text || 'EIS · Bhutan';
    const logoSubtext = settings?.landing_header?.logo_subtext || 'National Energy Information System';

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
                scrolled || !isHome
                    ? 'bg-white/95 backdrop-blur-xl shadow-sm border-b border-slate-100/80'
                    : 'bg-transparent border-b border-transparent'
            }`}>
                <div className="max-w-[1440px] mx-auto px-5 sm:px-8 lg:px-12">
                    <div className="flex items-center justify-between h-[68px]">

                        {/* ── Logo ── */}
                        <button onClick={() => navigate('/')}
                            className="flex items-center gap-3 group flex-shrink-0">
                            {/* Crest */}
                            <div className="relative flex-shrink-0">
                                <img src="/images/rgob-crest.png" alt="RGoB"
                                    className="h-9 w-9 object-contain transition-transform group-hover:scale-105"
                                    onError={e => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }} />
                                <div className="h-9 w-9 rounded-full items-center justify-center hidden"
                                    style={{ background: 'linear-gradient(135deg,#1a4a3a,#2d8a5e)' }}>
                                    <Zap className="h-4 w-4 text-white" />
                                </div>
                            </div>
                            {/* Name */}
                            <div className="flex flex-col leading-tight text-left">
                                <span className={`font-extrabold text-[14px] tracking-tight transition-colors ${
                                    scrolled || !isHome ? 'text-slate-900' : 'text-white drop-shadow-sm'
                                }`}>
                                    {logoText}
                                </span>
                                <span className={`text-[10px] font-medium transition-colors hidden sm:block ${
                                    scrolled || !isHome ? 'text-slate-400' : 'text-white/70'
                                }`}>
                                    {logoSubtext}
                                </span>
                            </div>
                        </button>

                        {/* ── Desktop nav ── */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map(item => (
                                <NavLink key={item.to} to={item.to} end={item.exact}
                                    className={({ isActive }) => `
                                        relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-all duration-200
                                        ${isActive
                                            ? scrolled || !isHome
                                                ? 'text-[#1a4a3a] bg-[#1a4a3a]/8'
                                                : 'text-white bg-white/15 backdrop-blur-sm'
                                            : scrolled || !isHome
                                                ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                                                : 'text-white/80 hover:text-white hover:bg-white/10'
                                        }
                                    `}>
                                    {({ isActive }) => (
                                        <>
                                            <item.icon className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={isActive ? 2.5 : 1.8} />
                                            {item.label}
                                            {isActive && (
                                                <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full"
                                                    style={{ background: scrolled || !isHome ? '#1a4a3a' : 'white' }} />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            ))}
                        </div>

                        {/* ── Right actions ── */}
                        <div className="flex items-center gap-3">
                            {/* Data badge */}
                            <div className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all ${
                                scrolled || !isHome
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-white/10 text-white/80 border border-white/20 backdrop-blur-sm'
                            }`}>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                Live Data
                            </div>

                            {/* Login */}
                            <NavLink to="/login"
                                className={`hidden md:flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 ${
                                    scrolled || !isHome
                                        ? 'bg-[#1a4a3a] text-white hover:bg-[#256648]'
                                        : 'bg-white text-[#1a4a3a] hover:bg-white/90'
                                }`}>
                                <LogIn className="h-3.5 w-3.5" />
                                Portal Login
                            </NavLink>

                            {/* Hamburger */}
                            <button onClick={() => setOpen(v => !v)}
                                className={`md:hidden flex items-center justify-center h-9 w-9 rounded-xl transition-colors ${
                                    scrolled || !isHome
                                        ? 'text-slate-600 hover:bg-slate-100'
                                        : 'text-white hover:bg-white/15'
                                }`}>
                                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* ── Mobile drawer ── */}
            <div className={`fixed inset-0 z-40 md:hidden transition-all duration-300 ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
                {/* Panel */}
                <div className={`absolute top-0 right-0 h-full w-72 bg-white shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
                    <div className="flex items-center justify-between p-5 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <img src="/images/rgob-crest.png" alt="" className="h-7 w-7 object-contain"
                                onError={e => e.target.style.display='none'} />
                            <span className="font-extrabold text-sm text-slate-800">{logoText}</span>
                        </div>
                        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="p-4 space-y-1 text-left">
                        {navItems.map(item => (
                            <NavLink key={item.to} to={item.to} end={item.exact}
                                onClick={() => setOpen(false)}
                                className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                    isActive ? 'bg-[#1a4a3a]/8 text-[#1a4a3a]' : 'text-slate-600 hover:bg-slate-50'
                                }`}>
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </NavLink>
                        ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-5 border-t border-slate-100">
                        <NavLink to="/login" onClick={() => setOpen(false)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-bold text-white"
                            style={{ background: 'linear-gradient(135deg,#1a4a3a,#2d8a5e)' }}>
                            <LogIn className="h-4 w-4" /> Portal Login
                        </NavLink>
                        <p className="text-[10px] text-slate-400 text-center mt-3">
                            Department of Energy · MoENR · Bhutan
                        </p>
                    </div>
                </div>
            </div>

            {/* Spacer — only on non-home pages */}
            {!isHome && <div className="h-[68px]" />}
        </>
    );
}