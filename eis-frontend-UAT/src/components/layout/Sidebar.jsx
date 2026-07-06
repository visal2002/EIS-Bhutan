// src/components/layout/Sidebar.jsx
import { useState, useCallback, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
    Database, Users, FileText, Zap, BarChart3,
    ChevronDown, Settings, LayoutDashboard,
    Sun, Moon, Monitor, Maximize, Minimize,
    Droplet, Flame, Shield, Key, Sliders, Briefcase,
    Activity, Globe, Cpu, ChevronRight, HelpCircle,
    LogOut, Factory, Layout
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { getUser, authAPI, getRefreshToken, clearAuth } from '../../services/api';
import { useSiteSettings } from '../../context/SiteSettingsContext';
import { useTheme } from '../../context/ThemeContext';
import { usePermissions } from '../../context/PermissionsContext';

// ── Nav groups — each item has a module key for permission check ───
const NAV_GROUPS = [
    {
        id:    'renewable-energy',
        label: 'Renewable Energy',
        items: [
            {
                label: 'Hydropower',
                icon: Zap,
                module: 'electricity_data',
                children: [
                    { label: 'Run-of-river Hydro', path: '/admin/electricity/hydropower/run-of-river' },
                    { label: 'Reservoir Hydro', path: '/admin/electricity/hydropower/reservoir' },
                    { label: 'Pumped Hydro', path: '/admin/electricity/hydropower/pumped' },
                ]
            },
            {
                label: 'Solar',
                icon: Sun,
                module: 'electricity_data',
                children: [
                    { label: 'Solar ground mounted', path: '/admin/electricity/generation?type=SOLAR&subtype=SOLAR_GROUND' },
                    { label: 'Solar Roof top', path: '/admin/electricity/generation?type=SOLAR&subtype=SOLAR_ROOF_TOP' },
                    { label: 'Solar Lift Irrigation', path: '/admin/electricity/generation?type=SOLAR&subtype=SOLAR_LIFT_IRRIGATION' },
                    { label: 'Solar Home Lighting Systems', path: '/admin/electricity/generation?type=SOLAR&subtype=SOLAR_HOME_LIGHTING' },
                ]
            },
            { label: 'Wind', icon: Globe, path: '/admin/electricity/generation?type=WIND', module: 'electricity_data' },
            { label: 'Geothermal', icon: Flame, path: '/admin/electricity/generation?type=GEOTHERMAL', module: 'electricity_data' },
            { label: 'Battery Energy Storage', icon: Database, path: '/admin/electricity/generation?type=BATTERY_STORAGE', module: 'electricity_data' },
        ],
    },
    {
        id:    'transmission-distribution',
        label: 'Associated Transmission and Distribution Systems',
        items: [
            { label: 'Substations', icon: Cpu, path: '/admin/electricity/substations', module: 'electricity_data' },
            { label: 'Distribution lines', icon: Activity, path: '/admin/electricity/lines-transformer?tab=distribution', module: 'electricity_data' },
            { label: 'Transmission lines', icon: Activity, path: '/admin/electricity/lines-transformer?tab=transmission', module: 'electricity_data' },
        ],
    },
    {
        id:    'trade-accounting',
        label: 'Trade and Energy accounting',
        items: [
            { label: 'Electricity export', icon: Globe, path: '/admin/electricity/trade?tab=export', module: 'electricity_data' },
            { label: 'Electricity import', icon: Globe, path: '/admin/electricity/trade?tab=import', module: 'electricity_data' },
        ],
    },
    {
        id:    'electricity-tariff',
        label: 'Electricity Tariff',
        items: [
            { label: 'Electricity static tariff', icon: Sliders, path: '/admin/electricity/tariff?tab=static', module: 'electricity_data' },
            { label: 'Electricity dynamic import', icon: Sliders, path: '/admin/electricity/tariff?tab=dynamic', module: 'electricity_data' },
        ],
    },
    {
        id:    'electricity-projections',
        label: 'Electricity projections',
        items: [
            { label: 'Electricity projections', icon: BarChart3, path: '/admin/electricity/forecasting', module: 'electricity_data' },
        ],
    },
    {
        id:    'thermal-energy',
        label: 'Thermal Energy',
        items: [
            { label: 'Solar Water Heating Systems', icon: Sun, path: '/admin/thermal/solar-water-heating', module: 'master_data' },
            {
                label: 'Liquid fuels',
                icon: Droplet,
                module: 'master_data',
                children: [
                    { label: 'Crude Oil', path: '/admin/thermal/liquid-fuels?type=CRUDE_OIL' },
                    { label: 'Natural Gas Liquids (NGLs)', path: '/admin/thermal/liquid-fuels?type=NGL' },
                    { label: 'Motor Gasoline', path: '/admin/thermal/liquid-fuels?type=MOTOR_GASOLINE' },
                    { label: 'Aviation Gasoline', path: '/admin/thermal/liquid-fuels?type=AVIATION_GASOLINE' },
                    { label: 'Jet Gasoline', path: '/admin/thermal/liquid-fuels?type=JET_GASOLINE' },
                    { label: 'Jet Kerosene', path: '/admin/thermal/liquid-fuels?type=JET_KEROSENE' },
                    { label: 'Other Kerosene', path: '/admin/thermal/liquid-fuels?type=OTHER_KEROSENE' },
                    { label: 'Gas/Diesel Oil', path: '/admin/thermal/liquid-fuels?type=GAS_DIESEL' },
                    { label: 'Residual Fuel Oil', path: '/admin/thermal/liquid-fuels?type=RESIDUAL_FUEL' },
                    { label: 'Bitumen', path: '/admin/thermal/liquid-fuels?type=BITUMEN' },
                    { label: 'Lubricants', path: '/admin/thermal/liquid-fuels?type=LUBRICANTS' },
                ]
            },
            { label: 'Solid fuels', icon: Flame, path: '/admin/thermal/solid-fuels', module: 'master_data' },
        ],
    },
    {
        id:    'fossil-trade',
        label: 'Fossil fuel trade',
        items: [
            { label: 'Liquid fuel import', icon: Globe, path: '/admin/fossil-trade/liquid-import', module: 'master_data' },
            { label: 'Solid fuel import', icon: Globe, path: '/admin/fossil-trade/solid-import', module: 'master_data' },
            { label: 'Solid fuel export', icon: Globe, path: '/admin/fossil-trade/solid-export', module: 'master_data' },
        ],
    },
    {
        id:    'electricity-consumption',
        label: 'Electricity consumption',
        items: [
            { label: 'Number of consumers', icon: Users, path: '/admin/electricity/sales?tab=consumers', module: 'electricity_data' },
            { label: 'Electricity sales', icon: Activity, path: '/admin/electricity/sales?tab=sales', module: 'electricity_data' },
        ],
    },
    {
        id:    'fossil-consumption',
        label: 'Fossil fuel consumption',
        items: [
            { label: 'POL', icon: Droplet, path: '/admin/data-collection/pol', module: 'pol_data' },
            { label: 'Coal', icon: Flame, path: '/admin/data-collection/coal', module: 'coal_data' },
            { label: 'Fuelwood', icon: Flame, path: '/admin/data-collection/fuelwood', module: 'fuelwood_data' },
            { label: 'Biomass', icon: Activity, path: '/admin/data-collection/biomass', module: 'biomass_data' },
            { label: 'Surface Transport', icon: Cpu, path: '/admin/data-collection/surface-transport', module: 'surface_transport_data' },
            { label: 'Air Transport', icon: Globe, path: '/admin/data-collection/air-transport', module: 'air_transport_data' },
            { label: 'Industry', icon: Database, path: '/admin/data-collection/industry', module: 'industry_data' },
        ],
    },
    {
        id:    'master-data',
        label: 'Master Data',
        items: [
            {
                label: 'Geography & Location',
                icon: Globe,
                module: 'master_data',
                children: [
                    { label: 'Dzongkhag', path: '/admin/master-data/dzongkhags' },
                    { label: 'Country', path: '/admin/master-data/countries' },
                     { label: 'Location', path: '/admin/master-data/locations' }, 
                ]
            },
            {
                label: 'Consumers & Demographics',
                icon: Users,
                module: 'master_data',
                children: [
                     { label: 'Consumer Group', path: '/admin/master-data/consumer-groups' },
                     { label: 'Consumer Type', path: '/admin/master-data/consumer-types' },
                     { label: 'Consumer Subtype', path: '/admin/master-data/consumer-subtypes' },
                    { label: 'Sector', path: '/admin/master-data/sectors' },
                    { label: 'Industry Category', path: '/admin/master-data/industry-categories' },
                    { label: 'Industry Classification', path: '/admin/master-data/industry-classification' },
                ]
            },
            {
                label: 'Power Grid',
                icon: Zap,
                module: 'master_data',
                children: [
                     { label: 'Grid Type', path: '/admin/master-data/grid-types' },
                     { label: 'Voltage Type', path: '/admin/master-data/voltage-types' },
                     { label: 'Voltage Level', path: '/admin/master-data/voltage-levels' },
                     { label: 'Circuit Type', path: '/admin/master-data/circuit-types' },
                     { label: 'Conductor Type', path: '/admin/master-data/conductor-types' },
                     { label: 'Tower Type', path: '/admin/master-data/tower-types' },
                     { label: 'Transformer Type', path: '/admin/master-data/transformer-types' },
                    { label: 'Substation', path: '/admin/master-data/substations' },
                    { label: 'Substation Transformer', path: '/admin/master-data/substation-transformers' },
                     { label: 'Line Category', path: '/admin/master-data/line-categories' },
                ]
            },
            {
                label: 'Renewables',
                icon: Sun,
                module: 'master_data',
                children: [
                     { label: 'Plant Size', path: '/admin/master-data/plant-sizes' },
                    { label: 'Solar Energy Size', path: '/admin/master-data/solar-sizes' },
                    { label: 'Biogas Size', path: '/admin/master-data/biogas-sizes' },
                    { label: 'Panel Type', path: '/admin/master-data/settings/panel-types' },
                    { label: 'Production Type', path: '/admin/master-data/settings/production-types' },
                    { label: 'Generation Plant', path: '/admin/master-data/plants' },
                ]
            },
            {
                label: 'Master Classifications',
                icon: Sliders,
                module: 'master_data',
                children: [
                     { label: 'Subsidy Type', path: '/admin/master-data/subsidy-types' },
                     { label: 'Connection Type', path: '/admin/master-data/connection-types' },
                     { label: 'Configuration Type', path: '/admin/master-data/configuration-types' },
                     { label: 'Unit Type', path: '/admin/master-data/unit-types' },
                    { label: 'Measurement Unit', path: '/admin/master-data/settings/measurement-units' },
                    { label: 'Fuel Type', path: '/admin/master-data/settings/fuel-types' },
                    { label: 'Vehicle Fuel Type', path: '/admin/master-data/settings/vehicle-fuel-types' },
                    { label: 'Data Collection Year', path: '/admin/master-data/years' },
                    { label: 'Data Source', path: '/admin/master-data/data-sources' },
                    { label: 'Conversion Factors', path: '/admin/master-data/conversion-factors' },
                    { label: 'Energy Supply', path: '/admin/master-data/energy-supply' },
                ]
            },
            { label: 'All Master Settings', icon: Database, path: '/admin/master-data', module: 'master_data' },
        ],
    },
    {
        id:    'users',
        label: 'Administration',
        items: [
            { label: 'Users List', icon: Users, path: '/admin/users', module: 'users' },
            { label: 'Role Roles', icon: Shield, path: '/admin/roles', module: 'roles' },
            { label: 'Permissions Settings', icon: Key, path: '/admin/permissions', module: 'roles' },
        ],
    },
    {
        id:    'reports',
        label: 'Reports & GHG',
        items: [
            { label: 'Reports Overview', icon: FileText, path: '/reports' },
            { label: 'Energy Report', icon: Activity, path: '/reports/energy' },
            { label: 'GHG Report', icon: Flame, path: '/reports/ghg' },
        ],
    },
    {
        id:    'frontend-setting',
        label: 'Frontend Setting',
        items: [
            { label: 'Landing Page', icon: Layout, path: '/admin/frontend/landing', adminOnly: true },
            { label: 'FAQs', icon: HelpCircle, path: '/admin/frontend/faqs', adminOnly: true },
            { label: 'Page Settings', icon: Settings, path: '/admin/frontend/pages', adminOnly: true },
        ],
    },
    {
        id:    'system',
        label: 'System Admin',
        items: [
            { label: 'Site Settings', icon: Settings, path: '/admin/site-settings', adminOnly: true },
            { label: 'System Settings', icon: Sliders, path: '/admin/system-settings', adminOnly: true },
            { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs', module: 'admin_system' },
            { label: 'System Jobs', icon: Briefcase, path: '/system/jobs', adminOnly: true },
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

// ── Recursive sub-nav rendering for nested menus ───────────────────
function NestedSubNav({ item, depth = 0, collapsed }) {
    const location = useLocation();

    // Check if current location or any of its children match
    const checkActive = (navItem) => {
        if (navItem.path) {
            const fullPath = navItem.path;
            const currentFullPath = location.pathname + location.search;
            return currentFullPath === fullPath || (location.pathname === navItem.path.split('?')[0] && !navItem.path.includes('?'));
        }
        if (navItem.children) {
            return navItem.children.some(ch => checkActive(ch));
        }
        return false;
    };

    const isAnyChildActive = item.children?.some(ch => checkActive(ch));
    const [open, setOpen] = useState(isAnyChildActive);

    // Auto open if active child exists
    useEffect(() => {
        if (isAnyChildActive) {
            setOpen(true);
        }
    }, [isAnyChildActive]);

    if (!item.children) {
        const isActive = checkActive(item);
        return (
            <NavLink key={item.path} to={item.path}
                className={({ isActive: linkActive }) => cn(
                    'flex items-center px-3 py-1.5 text-[11px] rounded-lg transition-all',
                    isActive || linkActive
                        ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50/50 dark:hover:bg-white/5'
                )}>
                <span className="h-1.5 w-1.5 rounded-full bg-current mr-2.5 flex-shrink-0 opacity-55" />
                {item.label}
            </NavLink>
        );
    }

    const ParentIcon = item.icon;

    // Apply different styles for top-level vs nested collapsible items
    const buttonClass = depth === 0
        ? cn(
            'w-full flex items-start transition-all text-left',
            collapsed ? 'justify-center p-2.5 rounded-xl mx-1' : 'justify-between px-3 py-2 text-xs rounded-xl font-bold gap-2',
            isAnyChildActive
                ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/5'
          )
        : cn(
            'w-full flex items-start transition-all text-left',
            collapsed ? 'justify-center p-2.5 rounded-lg mx-1' : 'justify-between px-2.5 py-1.5 text-[11px] rounded-lg font-semibold gap-2',
            isAnyChildActive
                ? 'text-primary-600 dark:text-primary-400 bg-primary-50/30 dark:bg-primary-500/5'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-955 dark:hover:text-slate-205 hover:bg-slate-50/50 dark:hover:bg-white/5'
          );

    return (
        <div className="space-y-0.5">
            <button onClick={() => setOpen(o => !o)} className={buttonClass} title={collapsed ? item.label : undefined}>
                <span className={cn("flex items-start min-w-0", collapsed ? "justify-center gap-0" : "gap-2.5 flex-1")}>
                    {ParentIcon ? (
                        <ParentIcon className="h-4 w-4 flex-shrink-0 mt-0.5" strokeWidth={1.8} />
                    ) : (
                        <span className={cn("h-1.5 w-1.5 rounded-full flex-shrink-0 mt-1.5 ml-1 mr-0.5", isAnyChildActive ? "bg-primary-500" : "bg-slate-400/45")} />
                    )}
                    {!collapsed && <span className="leading-tight break-words">{item.label}</span>}
                </span>
                {!collapsed && (
                    <ChevronRight className={cn('h-3.5 w-3.5 transition-transform opacity-60 flex-shrink-0 mt-0.5', open ? 'rotate-90' : '')} strokeWidth={2} />
                )}
            </button>
            {open && (
                <div className="pl-6 space-y-0.5 mt-0.5 border-none">
                    {item.children.map((child, idx) => (
                        <NestedSubNav key={child.label + idx} item={child} depth={depth + 1} collapsed={collapsed} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Settings sub-nav (expandable) ─────────────────────────────────
function SettingsSubNav({ item }) {
    const location = useLocation();
    const isAnyChildActive = item.children?.some(ch => location.pathname.startsWith(ch.path));
    const [open, setOpen] = useState(isAnyChildActive);

    return (
        <div>
            <button
                onClick={() => setOpen(o => !o)}
                className={cn(
                    'w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all mt-1',
                    isAnyChildActive
                        ? 'bg-indigo-500/20 text-indigo-400 font-semibold border border-indigo-500/20'
                        : 'text-indigo-400/70 hover:text-indigo-300 hover:bg-indigo-500/10 border border-transparent'
                )}>
                <span className="flex items-center gap-2">
                    <span className="opacity-70">⚙</span>
                    {item.label}
                </span>
                <ChevronDown className={cn('h-3 w-3 transition-transform opacity-60', open ? 'rotate-180' : '')} />
            </button>
            {open && (
                <div className="ml-4 mt-0.5 border-l border-indigo-500/20 pl-2 space-y-0.5">
                    {item.children.map(child => (
                        <NavLink key={child.path} to={child.path}
                            className={({ isActive }) => cn(
                                'flex items-center px-2 py-1.5 text-[11px] rounded-lg transition-all',
                                isActive
                                    ? 'text-indigo-300 font-semibold bg-indigo-500/15'
                                    : 'text-slate-500 dark:text-slate-500 hover:text-indigo-300 hover:bg-indigo-500/10'
                            )}>
                            <span className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0 opacity-50" />
                            {child.label}
                        </NavLink>
                    ))}
                </div>
            )}
        </div>
    );
}

function NavGroup({ group, isAdmin, canView, collapsed }) {
    // Filter items by permission
    const filterVisible = (itemsList) => {
        return itemsList.filter(item => {
            if (item.adminOnly && !isAdmin) return false;
            if (item.module && !canView(item.module)) return false;
            if (item.children) {
                const visibleChildren = filterVisible(item.children);
                return visibleChildren.length > 0;
            }
            return true;
        });
    };
    
    const visibleItems = filterVisible(group.items);

    if (visibleItems.length === 0) return null;

    return (
        <div className="space-y-1">
            {/* Category header - static text */}
            {collapsed ? (
                <div className="mx-3 my-2.5 border-t border-slate-100 dark:border-slate-800/80 select-none" />
            ) : (
                <div className="text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-500/80 px-4 pt-3.5 pb-1 select-none">
                    {group.label}
                </div>
            )}

            {/* List items directly */}
            <div className={cn("space-y-0.5", collapsed ? "px-1.5" : "px-2")}>
                {visibleItems.map((item, idx) => {
                    // Soon — disabled item
                    if (item.soon) return (
                        <div key={item.path}
                            className={cn(
                                "flex items-center text-xs text-slate-650 dark:text-slate-600 cursor-not-allowed rounded-lg",
                                collapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                            )}>
                            {!collapsed && <span>{item.label}</span>}
                            <span className="text-[9px] font-bold bg-slate-800 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">SOON</span>
                        </div>
                    );

                    // Nested collapsible sub-nav (2 levels or more)
                    if (item.children) {
                        return (
                            <NestedSubNav key={item.label + idx} item={item} depth={0} collapsed={collapsed} />
                        );
                    }

                    // Settings item with expandable children
                    if (item.isSettings && item.children) {
                        return (
                            <SettingsSubNav key={item.path} item={item} />
                        );
                    }

                    // Normal nav item
                    const ItemIcon = item.icon;
                    return (
                        <NavLink key={item.path} to={item.path}
                            title={collapsed ? item.label : undefined}
                            className={({ isActive }) => cn(
                                'flex items-center rounded-xl font-bold transition-all',
                                collapsed ? 'justify-center p-2.5 mx-1' : 'gap-2.5 px-3 py-2 text-xs',
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50/50 dark:hover:bg-white/5'
                            )}>
                            {ItemIcon ? <ItemIcon className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} /> : <span className="h-1 w-1 rounded-full bg-current mr-2 flex-shrink-0" />}
                            {!collapsed && <span className="transition-opacity duration-200">{item.label}</span>}
                        </NavLink>
                    );
                })}
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

export default function Sidebar({ isOpen, onClose, isCollapsed }) {
    const location      = useLocation();
    const navigate      = useNavigate();
    const user          = getUser();
    const userRole      = user?.role?.role_name || '';
    const { settings }  = useSiteSettings();
    const { theme, setTheme } = useTheme();
    const { canView }   = usePermissions();
    const isAdmin       = userRole === 'ADMIN' || !!user?.is_superuser;
    const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);
    const [isHovered, setIsHovered] = useState(false);

    const navRef = useRef(null);

    // Save scroll position
    const handleScroll = useCallback(() => {
        if (navRef.current) {
            sessionStorage.setItem('sidebar-scroll', navRef.current.scrollTop);
        }
    }, []);

    // Restore scroll position on mount/route change
    useEffect(() => {
        const savedScroll = sessionStorage.getItem('sidebar-scroll');
        if (savedScroll && navRef.current) {
            navRef.current.scrollTop = parseInt(savedScroll, 10);
        }
    }, [location.pathname]);

    // Combine isCollapsed and isHovered to get layout collapsed mode
    const actualCollapsed = isCollapsed && !isHovered;

    // Logout handler
    const handleLogout = async () => {
        try {
            await authAPI.logout(getRefreshToken());
        } catch (e) {
            console.error('Logout error:', e);
        }
        clearAuth();
        navigate('/login');
    };

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
            const isActiveGroup = g.items.some(i => {
                if (i.path) return location.pathname === i.path || location.pathname.startsWith(i.path + '/');
                if (i.children) {
                    return i.children.some(ch => {
                        if (ch.path) return location.pathname === ch.path || location.pathname.startsWith(ch.path + '/');
                        if (ch.children) return ch.children.some(subch => location.pathname === subch.path || location.pathname.startsWith(subch.path + '/'));
                        return false;
                    });
                }
                return false;
            });
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

            {/* Layout width spacer on desktop so the main panel does not jump */}
            <div className={cn(
                'hidden md:block transition-all duration-300 ease-in-out flex-shrink-0',
                isCollapsed ? 'w-20' : 'w-64'
            )} />

            <aside 
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className={cn(
                    'fixed inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out md:translate-x-0 flex-shrink-0',
                    'bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    actualCollapsed ? 'w-20' : 'w-64 shadow-2xl'
                )}>

                {/* ── Logo ─────────────────────────────────────── */}
                <div className={cn(
                    "h-16 flex items-center border-b border-slate-100 dark:border-slate-800/80 flex-shrink-0 gap-3 transition-all",
                    actualCollapsed ? "px-5 justify-center" : "px-4"
                )}>
                    <div className="h-9 w-9 flex-shrink-0 rounded-lg overflow-hidden bg-primary-50 dark:bg-white/10 flex items-center justify-center">
                        <img src={logoUrl} alt={siteName}
                            className="h-full w-full object-contain p-0.5"
                            onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                        <span style={{ display: 'none' }}
                            className="text-xs font-extrabold text-primary-600 tracking-tight">{siteName}</span>
                    </div>
                    {!actualCollapsed && (
                        <div className="min-w-0 transition-opacity duration-200">
                            <h1 className="font-bold text-sm text-slate-800 dark:text-white leading-tight truncate">{siteName}</h1>
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight truncate">Energy Information System</p>
                        </div>
                    )}
                </div>



                {/* ── Nav ──────────────────────────────────────── */}
                <nav ref={navRef} onScroll={handleScroll} className="flex-1 py-3 overflow-y-auto scrollbar-hide space-y-1">
                    <div className="px-2">
                        <NavLink to="/admin/dashboard"
                            title={actualCollapsed ? "Dashboard" : undefined}
                            className={({ isActive }) => cn(
                                'flex items-center transition-all font-bold',
                                actualCollapsed ? 'justify-center p-2.5 mx-1' : 'gap-2.5 px-3 py-2.5 rounded-xl text-xs',
                                isActive
                                    ? 'bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-400 shadow-sm'
                                    : 'text-slate-500 dark:text-slate-450 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-white/5'
                            )}>
                            <LayoutDashboard className="h-4 w-4 flex-shrink-0" strokeWidth={1.8} />
                            {!actualCollapsed && <span className="transition-opacity duration-200">Dashboard</span>}
                        </NavLink>
                    </div>
                    {actualCollapsed ? (
                        <div className="mx-3 my-2.5 border-t border-slate-100 dark:border-slate-800/80" />
                    ) : (
                        <div className="mx-4 my-2 border-t border-slate-100 dark:border-slate-850" />
                    )}
                    <div className="space-y-0.5">
                        {visibleGroups.map(group => (
                            <NavGroup key={group.id} group={group}
                                isAdmin={isAdmin}
                                canView={canView}
                                collapsed={actualCollapsed} />
                        ))}
                    </div>
                </nav>

                {/* ── Footer — version + theme + fullscreen ────── */}
                <div className="border-t border-slate-100 dark:border-slate-850 flex-shrink-0 p-3 space-y-2">

                    {/* Theme cycle + fullscreen in one row */}
                    <div className={cn("flex items-center gap-2", actualCollapsed ? "flex-col" : "flex-row")}>
                        {/* Theme cycle button */}
                        <button onClick={cycleTheme}
                            title={`Theme: ${currentThemeOpt.label} — click to switch`}
                            className={cn(
                                "flex items-center rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition-colors group",
                                actualCollapsed ? "p-2.5 justify-center w-full" : "flex-1 gap-2 px-3 py-2"
                            )}>
                            <ThemeIcon className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-white flex-shrink-0 transition-colors" />
                            {!actualCollapsed && (
                                <>
                                    <span className="text-xs text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-white transition-colors font-semibold">
                                        {currentThemeOpt.label}
                                    </span>
                                    {/* Three dots preview */}
                                    <div className="ml-auto flex gap-0.5">
                                        {THEME_OPTIONS.map(t => (
                                            <div key={t.value}
                                                className={cn(
                                                    'h-1.5 w-1.5 rounded-full transition-colors',
                                                    t.value === theme ? 'bg-primary-500' : 'bg-slate-350 dark:bg-slate-600'
                                                )} />
                                        ))}
                                    </div>
                                </>
                            )}
                        </button>

                        {/* Fullscreen button */}
                        <button onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                            className={cn(
                                "p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors text-slate-400 hover:text-slate-700 dark:hover:text-white flex-shrink-0",
                                actualCollapsed ? "w-full flex justify-center" : ""
                            )}>
                            {isFullscreen
                                ? <Minimize className="h-3.5 w-3.5" />
                                : <Maximize className="h-3.5 w-3.5" />}
                        </button>
                    </div>

                    {/* Version info */}
                    {!actualCollapsed && (
                        <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 dark:text-slate-600 font-bold transition-opacity duration-200">
                            <span>EIS · v{APP_VERSION}</span>
                            <span className="font-medium">© {new Date().getFullYear()} DoE · MoENR</span>
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}