// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { Menu, Bell, LogOut, ChevronRight, Sun, Moon, Monitor,
         Settings, Check, UserCircle, Maximize, Minimize, Home } from 'lucide-react';
import { cn } from '../../utils/cn';
import { authAPI, getUser, getRefreshToken, clearAuth } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useSiteSettings } from '../../context/SiteSettingsContext';

const getInitials = u => {
    const f = u?.first_name?.[0] || '';
    const l = u?.last_name?.[0]  || '';
    return (f + l).toUpperCase() || u?.username?.[0]?.toUpperCase() || '?';
};

// ── Theme picker ──────────────────────────────────────────────────
function ThemePicker({ onClose }) {
    const { theme, setTheme } = useTheme();
    const OPTIONS = [
        { value: 'light',  icon: Sun,     label: 'Light' },
        { value: 'dark',   icon: Moon,    label: 'Dark'  },
        { value: 'system', icon: Monitor, label: 'System' },
    ];
    return (
        <div className="absolute right-0 top-full mt-2 w-44 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl z-50 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Appearance</p>
            </div>
            {OPTIONS.map(({ value, icon: Icon, label }) => (
                <button key={value} onClick={() => { setTheme(value); onClose(); }}
                    className={cn('w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        theme === value
                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}>
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                    {theme === value && <Check className="h-3.5 w-3.5 ml-auto text-primary-600" />}
                </button>
            ))}
        </div>
    );
}

// ── Burger menu ───────────────────────────────────────────────────
function BurgerMenu({ onClose }) {
    const user     = getUser();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await authAPI.logout(getRefreshToken());
        clearAuth();
        onClose();
    };

    return (
        <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-2xl z-50 overflow-hidden"
            onClick={e => e.stopPropagation()}>
            {/* User info */}
            <div className="px-4 py-3.5 border-b border-slate-100 dark:border-slate-700"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1a4a3a 100%)' }}>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-sm font-bold text-white flex-shrink-0 overflow-hidden">
                        {user?.avatar_url
                            ? <img src={user.avatar_url} className="h-full w-full object-cover" alt="" />
                            : getInitials(user)}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                            {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-[11px] text-slate-300 truncate">{user?.email || user?.username}</p>
                        <span className="inline-block text-[10px] font-semibold text-emerald-300 uppercase tracking-widest mt-0.5">
                            {user?.role?.role_name?.replace(/_/g, ' ')}
                        </span>
                    </div>
                </div>
            </div>

            {/* Menu items */}
            <div className="py-1.5">
                <NavLink to="/account/profile" onClick={onClose}
                    className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}>
                    <UserCircle className="h-4 w-4 text-slate-400 flex-shrink-0" strokeWidth={1.8} />
                    My Profile
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto" />
                </NavLink>

                <NavLink to="/account/settings" onClick={onClose}
                    className={({ isActive }) => cn(
                        'flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors',
                        isActive
                            ? 'text-primary-600 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    )}>
                    <Settings className="h-4 w-4 text-slate-400 flex-shrink-0" strokeWidth={1.8} />
                    Account Settings
                    <ChevronRight className="h-3.5 w-3.5 text-slate-300 ml-auto" />
                </NavLink>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-700">
                <button onClick={handleLogout}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                    <LogOut className="h-4 w-4" />
                    Sign out
                </button>
            </div>
        </div>
    );
}

// ── Breadcrumb — supports array of {label, href} or simple strings ─
// Usage from page:
//   breadcrumb="User Management"                → EIS / User Management / Title
//   breadcrumb={[{label:'Admin',href:'/admin/users'},{label:'Roles',href:'/admin/roles'}]}
function Breadcrumb({ breadcrumb, title, siteTitle }) {
    // Build the crumb list
    const crumbs = [];

    // Root — always the site name, links to dashboard
    crumbs.push({ label: siteTitle || 'EIS', href: '/admin/dashboard' });

    if (Array.isArray(breadcrumb)) {
        breadcrumb.forEach(b => crumbs.push(b));
    } else if (breadcrumb) {
        crumbs.push({ label: breadcrumb, href: null });
    }

    if (title) {
        crumbs.push({ label: title, href: null }); // current page — no link
    }

    return (
        <nav className="hidden md:flex items-center gap-1 text-sm min-w-0 flex-1 ml-3">
            {crumbs.map((crumb, i) => {
                const isLast = i === crumbs.length - 1;
                return (
                    <span key={i} className="flex items-center gap-1 min-w-0">
                        {i > 0 && (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                        )}
                        {!isLast && crumb.href ? (
                            <Link
                                to={crumb.href}
                                className="text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors truncate max-w-[120px] font-medium">
                                {i === 0
                                    ? <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5 inline-block" /><span className="hidden lg:inline">{crumb.label}</span></span>
                                    : crumb.label
                                }
                            </Link>
                        ) : isLast ? (
                            <span className="font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px]">
                                {crumb.label}
                            </span>
                        ) : (
                            <span className="text-slate-400 dark:text-slate-500 truncate max-w-[120px]">
                                {crumb.label}
                            </span>
                        )}
                    </span>
                );
            })}
        </nav>
    );
}

// ── Main Header ───────────────────────────────────────────────────
export default function Header({ onMenuClick, breadcrumb, title }) {
    const { theme }      = useTheme();
    const { settings }   = useSiteSettings();
    const [burgerOpen,   setBurgerOpen]   = useState(false);
    const [themeOpen,    setThemeOpen]    = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [currentUser,  setCurrentUser]  = useState(getUser);
    const burgerRef = useRef();
    const themeRef  = useRef();

    useEffect(() => {
        const handler = () => setCurrentUser(getUser());
        window.addEventListener('storage', handler);
        window.addEventListener('focus', handler);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('focus', handler);
        };
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    };

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    useEffect(() => {
        const h = e => {
            if (burgerRef.current && !burgerRef.current.contains(e.target)) setBurgerOpen(false);
            if (themeRef.current  && !themeRef.current.contains(e.target))  setThemeOpen(false);
        };
        document.addEventListener('mousedown', h);
        return () => document.removeEventListener('mousedown', h);
    }, []);

    const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Monitor;

    return (
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between px-4 md:px-6 sticky top-0 z-30 shadow-sm flex-shrink-0 transition-colors">

            {/* Left — logo + breadcrumb */}
            <div className="flex items-center flex-1 min-w-0 gap-0">
                <button onClick={onMenuClick}
                    className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors mr-2">
                    <Menu className="h-5 w-5" />
                </button>

                {/* Logo + site name */}
                <Link to="/admin/dashboard" className="flex items-center gap-2.5 flex-shrink-0 hover:opacity-80 transition-opacity">
                    <img src={settings.gov_logo_url || '/images/gov_logo.png'} alt="RGoB"
                        className="h-9 w-9 object-contain"
                        onError={e => { e.target.style.display = 'none'; }} />
                    <div className="leading-tight hidden lg:block">
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight whitespace-nowrap">
                            {settings.site_title || 'Energy Information System'}
                        </p>
                    </div>
                </Link>

                {/* Breadcrumb */}
                <Breadcrumb
                    breadcrumb={breadcrumb}
                    title={title}
                    siteTitle={settings.site_short_name || 'EIS'}
                />
            </div>

            {/* Right */}
            <div className="flex items-center gap-1 flex-shrink-0">

                {/* Fullscreen */}
                <button onClick={toggleFullscreen}
                    title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                </button>

                {/* Theme */}
                <div className="relative" ref={themeRef}>
                    <button onClick={() => { setThemeOpen(v => !v); setBurgerOpen(false); }}
                        title="Change appearance"
                        className={cn('p-2 rounded-lg transition-colors',
                            themeOpen
                                ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}>
                        <ThemeIcon className="h-5 w-5" />
                    </button>
                    {themeOpen && <ThemePicker onClose={() => setThemeOpen(false)} />}
                </div>

                {/* Bell */}
                <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
                </button>

                {/* User menu */}
                <div className="relative" ref={burgerRef}>
                    <button onClick={() => { setBurgerOpen(v => !v); setThemeOpen(false); }}
                        className={cn('flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl transition-colors',
                            burgerOpen ? 'bg-slate-100 dark:bg-slate-800' : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}>
                        <div className="h-7 w-7 rounded-full bg-primary-600 flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0 overflow-hidden">
                            {currentUser?.avatar_url
                                ? <img src={currentUser.avatar_url} className="h-full w-full object-cover" alt="avatar" />
                                : getInitials(currentUser)}
                        </div>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 hidden sm:block max-w-[90px] truncate">
                            {currentUser?.first_name}
                        </span>
                        <ChevronRight className={cn('h-3.5 w-3.5 text-slate-400 transition-transform', burgerOpen && 'rotate-90')} />
                    </button>
                    {burgerOpen && <BurgerMenu onClose={() => setBurgerOpen(false)} />}
                </div>
            </div>
        </header>
    );
}