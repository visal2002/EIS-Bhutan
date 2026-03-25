// src/components/layout/Sidebar.jsx
import { useState, useCallback, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    Database, Users, FileText, Zap, BarChart3,
    ChevronDown, Settings, LayoutDashboard,
    Sun, Moon, Monitor, Maximize, Minimize,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getUser } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../context/PermissionsContext';

// ── Nav groups — each item has a module key for permission check ───
const NAV_GROUPS = [
    {
        id:    'master-data',
        label: 'Master Data',
        icon:  Database,
        module: 'master_data',  // group-level module check
        items: [
            { label: 'Energy Supply',           path: '/admin/master-data/energy-supply',           module: 'master_data' },
            { label: 'Conversion Factors',      path: '/admin/master-data/conversion-factors',      module: 'master_data' },
            { label: 'Sectors',                 path: '/admin/master-data/sectors',                 module: 'master_data' },
            { label: 'Electricity Categories',  path: '/admin/master-data/electricity-categories',  module: 'master_data' },
            { label: 'Vehicle Types',           path: '/admin/master-data/vehicle-types',           module: 'master_data' },
            { label: 'Mileage',                 path: '/admin/master-data/mileage',                 module: 'master_data' },
            { label: 'Biogas Sizes',            path: '/admin/master-data/biogas-sizes',            module: 'master_data' },
            { label: 'Solar Sizes',             path: '/admin/master-data/solar-sizes',             module: 'master_data' },
            { label: 'Industry Classification', path: '/admin/master-data/industry-classification', module: 'master_data' },
        ],
    },
    {
        id:    'users',
        label: 'User Management',
        icon:  Users,
        module: 'users',
        items: [
            { label: 'Users',       path: '/admin/users',       module: 'users' },
            { label: 'Roles',       path: '/admin/roles',       module: 'roles' },
            { label: 'Permissions', path: '/admin/permissions', module: 'roles' },
        ],
    },
    {
        id:    'data-collection',
        label: 'Data Collection',
        icon:  Zap,
        module: null,  // show group if any sub-module is accessible
        items: [
            { label: 'Electricity', path: '/data-collection/electricity', module: 'electricity_data', soon: true },
            { label: 'Solar',       path: '/data-collection/solar',       module: 'solar_data',       soon: true },
            { label: 'Petroleum',   path: '/data-collection/petroleum',   module: 'petroleum_data',   soon: true },
            { label: 'Fuelwood',    path: '/data-collection/fuelwood',    module: 'fuelwood_data',    soon: true },
            { label: 'Coal',        path: '/data-collection/coal',        module: 'coal_data',        soon: true },
            { label: 'Biomass',     path: '/data-collection/biomass',     module: 'biomass_data',     soon: true },
            { label: 'Transport',   path: '/data-collection/transport',   module: 'transport_data',   soon: true },
            { label: 'Industry',    path: '/data-collection/industry',    module: 'industry_data',    soon: true },
        ],
    },
    {
        id:    'reports',
        label: 'Reports & GHG',
        icon:  FileText,
        module: null,
        items: [
            { label: 'Energy Reports', path: '/reports',     module: 'energy_reports', soon: true },
            { label: 'GHG Report',     path: '/reports/ghg', module: 'ghg_report',     soon: true },
        ],
    },
    {
        id:    'system',
        label: 'System',
        icon:  Settings,
        module: null,
        items: [
            { label: 'Site Settings',   path: '/admin/site-settings',   adminOnly: true },
            { label: 'System Settings', path: '/admin/system-settings', adminOnly: true },
            { label: 'Audit Logs',      path: '/admin/audit-logs',      module: 'audit_logs' },
            { label: 'Sessions',        path: '/admin/sessions',        adminOnly: true },
        ],
    },
];

const getInitials = u => {
    const f = u?.first_name?.[0] || '';
    const l = u?.last_name?.[0]  || '';
    return (f + l).toUpperCase() || u?.username?.[0]?.toUpperCase() || 'EIS';
};

const ROLE_LABEL = {
    ADMIN:        'System Admin',
    DOE_HEAD:     'DOE Head',
    DATA_MANAGER: 'Data Manager',
    DATA_FOCAL:   'Data Focal',
    VIEWER:       'Viewer',
};

// ── NavGroup — collapsible ────────────────────────────────────────
function NavGroup({ group, isOpen, onToggle, isAdmin, canView }) {
    const location  = useLocation();
    const Icon      = group.icon;
    const hasActive = group.items.some(i =>
        location.pathname === i.path || location.pathname.startsWith(i.path + '/')
    );

    // Filter items by permission
    const visibleItems = group.items.filter(item => {
        if (item.adminOnly) return isAdmin;
        if (item.module)    return canView(item.module);
        return true; // no module key = always show
    });

    if (visibleItems.length === 0) return null;

    return (
        <div className="px-2">
            {/* Group header button */}
            <button
                onClick={onToggle}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all',
                    hasActive
                        ? 'text-primary-400 bg-primary-500/10'
                        : 'text-slate-400 dark:text-slate-500 hover:text-slate-200 dark:hover:text-slate-300 hover:bg-white/5 dark:hover:bg-white/5'
                )}>
                <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 flex-shrink-0" strokeWidth={1.5} />
                    <span>{group.label}</span>
                </div>
                <ChevronDown className={cn(
                    'h-3.5 w-3.5 transition-transform duration-200 flex-shrink-0',
                    isOpen ? 'rotate-0' : '-rotate-90'
                )} strokeWidth={2} />
            </button>

            {/* Items — animated collapse */}
            <div className={cn(
                'overflow-hidden transition-all duration-200 ease-in-out',
                isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            )}>
                <div className="mt-0.5 ml-3 border-l border-white/10 dark:border-white/5 pl-2 pb-1 space-y-0.5">
                    {visibleItems.map(item => {
                        if (item.soon) return (
                            <div key={item.path}
                                className="flex items-center justify-between px-3 py-2 text-xs text-slate-600 dark:text-slate-600 cursor-not-allowed rounded-lg">
                                <span>{item.label}</span>
                                <span className="text-[9px] font-bold bg-slate-800 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">SOON</span>
                            </div>
                        );
                        return (
                            <NavLink key={item.path} to={item.path}
                                className={({ isActive }) => cn(
                                    'flex items-center px-3 py-2 text-xs rounded-xl transition-all',
                                    isActive
                                        ? 'bg-primary-500/15 text-primary-400 font-semibold'
                                        : 'text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-200 hover:bg-white/5 dark:hover:bg-white/5'
                                )}>
                                <span className="h-1 w-1 rounded-full bg-current mr-2.5 flex-shrink-0 opacity-50" />
                                {item.label}
                            </NavLink>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ── Sidebar ───────────────────────────────────────────────────────
const APP_VERSION = '1.0.0-beta';

// Theme cycle: light → dark → system → light
const THEME_OPTIONS = [
    { value: 'light',  icon: Sun,     label: 'Light',  next: 'dark'   },
    { value: 'dark',   icon: Moon,    label: 'Dark',   next: 'system' },
    { value: 'system', icon: Monitor, label: 'System', next: 'light'  },
];

export default function Sidebar({ isOpen, onClose }) {
    const location      = useLocation();
    const user          = getUser();
    const userRole      = user?.role?.role_name || '';
    const { settings }  = useSiteSettings();
    const { theme, setTheme } = useTheme();
    const { canView }   = usePermissions();
    const isAdmin       = userRole === 'ADMIN' || !!user?.is_superuser;
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

    // Fullscreen toggle
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen().catch(() => {});
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    // Cycle theme: light → dark → system → light
    const cycleTheme = useCallback(() => {
        const current = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];
        setTheme(current.next);
    }, [theme, setTheme]);

    const currentThemeOpt = THEME_OPTIONS.find(t => t.value === theme) || THEME_OPTIONS[0];
    const ThemeIcon = currentThemeOpt.icon;

    // All groups — NavGroup itself filters items by permission, returns null if none visible
    const visibleGroups = NAV_GROUPS;

    const getInitialOpen = () => {
        const open = {};
        NAV_GROUPS.forEach(g => {
            const isActiveGroup = g.items.some(i =>
                location.pathname === i.path || location.pathname.startsWith(i.path + '/')
            );
            open[g.id] = isActiveGroup;
        });
        return open;
    };

    const [openGroups, setOpenGroups] = useState(getInitialOpen);
    const toggleGroup = useCallback(id =>
        setOpenGroups(p => ({ ...p, [id]: !p[id] })), []);

    const logoUrl   = settings?.gov_logo_url || settings?.site_logo_url || '/images/gov_logo.png';
    const siteName  = settings?.site_short_name || 'EIS';

    return (
        <>
            {/* Mobile overlay */}
            {isOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
                    onClick={onClose} />
            )}

            <aside className={cn(
                'fixed md:static inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 flex-shrink-0',
                'bg-slate-900 border-r border-slate-800',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}>

                {/* ── Logo ─────────────────────────────────────── */}
                <div className="h-16 flex items-center px-4 border-b border-slate-800 flex-shrink-0 gap-3">
                    <div className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                        <img src={logoUrl} alt={siteName}
                            className="h-full w-full object-contain p-0.5"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <span style={{ display: 'none' }}
                            className="text-xs font-extrabold text-primary-400 tracking-tight">{siteName}</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="font-bold text-sm text-white leading-tight truncate">{siteName}</h1>
                        <p className="text-[10px] text-slate-500 leading-tight truncate">Energy Information System</p>
                    </div>
                </div>

                {/* ── Nav ──────────────────────────────────────── */}
                <nav className="flex-1 py-3 overflow-y-auto scrollbar-hide">
                    <div className="px-2">
                        <NavLink to="/admin/dashboard"
                            className={({ isActive }) => cn(
                                'flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                                isActive
                                    ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                            )}>
                            <LayoutDashboard className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                            Dashboard
                        </NavLink>
                    </div>
                    <div className="mx-4 my-2 border-t border-slate-800" />
                    <div className="space-y-0.5">
                        {visibleGroups.map(group => (
                            <NavGroup key={group.id} group={group}
                                isOpen={!!openGroups[group.id]}
                                onToggle={() => toggleGroup(group.id)}
                                isAdmin={isAdmin}
                                canView={canView} />
                        ))}
                    </div>
                </nav>

                {/* ── Footer — version + theme + fullscreen ────── */}
                <div className="border-t border-slate-800 flex-shrink-0 px-3 py-3 space-y-2">

                    {/* Theme cycle + fullscreen in one row */}
                    <div className="flex items-center gap-2">
                        {/* Theme cycle button */}
                        <button onClick={cycleTheme}
                            title={`Theme: ${currentThemeOpt.label} — click to switch`}
                            className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors group">
                            <ThemeIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-white flex-shrink-0 transition-colors" />
                            <span className="text-xs text-slate-400 group-hover:text-white transition-colors font-medium">
                                {currentThemeOpt.label}
                            </span>
                            {/* Three dots preview */}
                            <div className="ml-auto flex gap-0.5">
                                {THEME_OPTIONS.map(t => (
                                    <div key={t.value}
                                        className={cn(
                                            'h-1.5 w-1.5 rounded-full transition-colors',
                                            t.value === theme ? 'bg-primary-400' : 'bg-slate-600'
                                        )} />
                                ))}
                            </div>
                        </button>

                        {/* Fullscreen button */}
                        <button onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-slate-400 hover:text-white flex-shrink-0">
                            {isFullscreen
                                ? <Minimize className="h-3.5 w-3.5" />
                                : <Maximize className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Version info */}
                    <div className="flex items-center justify-between px-2">
                        <span className="text-[10px] text-slate-600 font-medium">
                            EIS · v{APP_VERSION}
                        </span>
                        <span className="text-[10px] text-slate-700">
                            © {new Date().getFullYear()} DoE · MoENR
                        </span>
                    </div>
                </div>
            </aside>
        </>
    );
}