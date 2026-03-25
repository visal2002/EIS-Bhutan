// src/pages/admin/Dashboard.jsx
// Role-aware dashboard — shows user's role, permissions summary, and role-specific content.
// Sample chart data — will be replaced by real API data in Phase 4.
import { useState } from 'react';
import {
    Activity, Zap, TrendingUp, TrendingDown, Download,
    BarChart2, RefreshCw, Info, User, Shield, Eye,
    Plus, Edit, Trash2, Upload, Lock, CheckCircle, XCircle,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import { getUser } from '../../services/api';
import { usePermissions } from '../../context/PermissionsContext';

// ── Colour palette ────────────────────────────────────────────────
const C = {
    green:    '#1a4a3a',
    teal:     '#256648',
    mint:     '#5AC994',
    amber:    '#f59e0b',
    orange:   '#f97316',
    rose:     '#f43f5e',
    blue:     '#3b82f6',
    slate:    '#94a3b8',
    gridLine: '#e2e8f0',
};

// ── Role display config ───────────────────────────────────────────
const ROLE_CONFIG = {
    ADMIN: {
        label:    'System Administrator',
        color:    '#7c3aed',
        bg:       '#f5f3ff',
        badge:    'bg-purple-100 text-purple-700 border-purple-200',
        icon:     '🛡️',
        greeting: 'Full system access — manage users, roles, and all data.',
    },
    DOE_HEAD: {
        label:    'DOE Head',
        color:    '#0891b2',
        bg:       '#ecfeff',
        badge:    'bg-cyan-100 text-cyan-700 border-cyan-200',
        icon:     '🏛️',
        greeting: 'Overview access — review and approve energy data submissions.',
    },
    DATA_MANAGER: {
        label:    'Data Manager',
        color:    '#1a4a3a',
        bg:       '#f0fdf9',
        badge:    'bg-emerald-100 text-emerald-700 border-emerald-200',
        icon:     '📊',
        greeting: 'Manage and validate energy data across all sectors.',
    },
    DATA_FOCAL: {
        label:    'Data Focal',
        color:    '#b45309',
        bg:       '#fef3c7',
        badge:    'bg-amber-100 text-amber-700 border-amber-200',
        icon:     '✏️',
        greeting: 'Submit and update energy data for your assigned modules.',
    },
    VIEWER: {
        label:    'Viewer',
        color:    '#475569',
        bg:       '#f8fafc',
        badge:    'bg-slate-100 text-slate-600 border-slate-200',
        icon:     '👁️',
        greeting: 'Read-only access to dashboards and reports.',
    },
};

// ── All modules for the permission grid ──────────────────────────
const MODULE_GROUPS = [
    {
        group: 'Administration',
        modules: [
            { key: 'users',        label: 'User Management' },
            { key: 'roles',        label: 'Roles & Permissions' },
            { key: 'audit_logs',   label: 'Audit Logs' },
            { key: 'master_data',  label: 'Master Data' },
        ],
    },
    {
        group: 'Data Collection',
        modules: [
            { key: 'electricity_data', label: 'Electricity' },
            { key: 'solar_data',       label: 'Solar & RE' },
            { key: 'petroleum_data',   label: 'Petroleum' },
            { key: 'fuelwood_data',    label: 'Fuelwood' },
            { key: 'coal_data',        label: 'Coal' },
            { key: 'biomass_data',     label: 'Biomass' },
            { key: 'transport_data',   label: 'Transport' },
            { key: 'industry_data',    label: 'Industry' },
        ],
    },
    {
        group: 'Reports & Dashboard',
        modules: [
            { key: 'energy_reports',   label: 'Energy Reports' },
            { key: 'ghg_report',       label: 'GHG Reports' },
            { key: 'public_dashboard', label: 'Public Dashboard' },
            { key: 'dashboard',        label: 'My Dashboard' },
        ],
    },
];

const PERM_COLS = [
    { key: 'can_view',     label: 'V',  icon: Eye,      title: 'View',     color: '#0891b2' },
    { key: 'can_create',   label: 'C',  icon: Plus,     title: 'Create',   color: '#16a34a' },
    { key: 'can_edit',     label: 'E',  icon: Edit,     title: 'Edit',     color: '#b45309' },
    { key: 'can_delete',   label: 'D',  icon: Trash2,   title: 'Delete',   color: '#dc2626' },
    { key: 'can_upload',   label: 'U',  icon: Upload,   title: 'Upload',   color: '#7c3aed' },
    { key: 'can_download', label: 'DL', icon: Download, title: 'Download', color: '#0f766e' },
];

// ── Sample chart data ─────────────────────────────────────────────
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const GENERATION_DATA = [180,210,195,230,220,240,215,235,205,195,185,200];
const TEMP_DATA       = [12,13,16,19,22,24,23,22,20,17,14,12];
const SECTOR_BALANCE  = [
    { label:'Hydropower', value:236, color:C.mint   },
    { label:'Grid Import',value:90,  color:C.orange  },
];

function lerp(a,b,t){return a+(b-a)*t;}
function polyline(data,w,h,pad=20){
    const min=Math.min(...data),max=Math.max(...data),range=max-min||1;
    return data.map((v,i)=>{
        const x=pad+(i/(data.length-1))*(w-pad*2);
        const y=h-pad-((v-min)/range)*(h-pad*2);
        return `${x},${y}`;
    }).join(' ');
}

function GenerationChart(){
    const W=420,H=180,PAD=28;
    const maxG=Math.max(...GENERATION_DATA);
    const minT=Math.min(...TEMP_DATA),maxT=Math.max(...TEMP_DATA);
    const tempPts=TEMP_DATA.map((v,i)=>{
        const x=PAD+(i/(TEMP_DATA.length-1))*(W-PAD*2);
        const y=PAD+(1-(v-minT)/(maxT-minT))*(H-PAD*2);
        return `${x},${y}`;
    }).join(' ');
    return(
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.amber} stopOpacity="0.9"/>
                    <stop offset="100%" stopColor={C.amber} stopOpacity="0.3"/>
                </linearGradient>
            </defs>
            {[0.25,0.5,0.75,1].map(t=>(
                <line key={t} x1={PAD} x2={W-PAD} y1={PAD+(1-t)*(H-PAD*2)} y2={PAD+(1-t)*(H-PAD*2)}
                    stroke={C.gridLine} strokeWidth="0.5" strokeDasharray="3,3"/>
            ))}
            {GENERATION_DATA.map((v,i)=>{
                const bw=(W-PAD*2)/GENERATION_DATA.length*0.55;
                const x=PAD+i*((W-PAD*2)/GENERATION_DATA.length)+((W-PAD*2)/GENERATION_DATA.length-bw)/2;
                const bh=(v/maxG)*(H-PAD*2-10);
                return <rect key={i} x={x} y={H-PAD-bh} width={bw} height={bh} fill="url(#barGrad)" rx="2"/>;
            })}
            <polyline points={tempPts} fill="none" stroke={C.teal} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            {TEMP_DATA.map((v,i)=>{
                const x=PAD+(i/(TEMP_DATA.length-1))*(W-PAD*2);
                const y=PAD+(1-(v-minT)/(maxT-minT))*(H-PAD*2);
                return <circle key={i} cx={x} cy={y} r="2.5" fill={C.teal}/>;
            })}
            {MONTHS.map((m,i)=>{
                const x=PAD+i*((W-PAD*2)/(MONTHS.length-1));
                return <text key={m} x={x} y={H-6} textAnchor="middle" fontSize="7" fill={C.slate}>{m}</text>;
            })}
        </svg>
    );
}

function DonutChart({data,size=140}){
    const total=data.reduce((s,d)=>s+d.value,0);
    const cx=size/2,cy=size/2,r=size*0.38,inner=size*0.24;
    let angle=-Math.PI/2;
    const slices=data.map(d=>{
        const a=(d.value/total)*2*Math.PI;
        const x1=cx+r*Math.cos(angle),y1=cy+r*Math.sin(angle);
        const x2=cx+r*Math.cos(angle+a),y2=cy+r*Math.sin(angle+a);
        const xi1=cx+inner*Math.cos(angle),yi1=cy+inner*Math.sin(angle);
        const xi2=cx+inner*Math.cos(angle+a),yi2=cy+inner*Math.sin(angle+a);
        const large=a>Math.PI?1:0;
        const path=`M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${inner} ${inner} 0 ${large} 0 ${xi1} ${yi1} Z`;
        angle+=a;
        return{...d,path};
    });
    return(
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices.map((s,i)=><path key={i} d={s.path} fill={s.color} opacity="0.92"/>)}
            <text x={cx} y={cy-5} textAnchor="middle" fontSize="9" fill="#64748b">Total</text>
            <text x={cx} y={cy+8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#1e293b">{total} MW</text>
        </svg>
    );
}

// ── Permission cell ───────────────────────────────────────────────
function PermCell({ allowed, title }) {
    return (
        <div title={title}
            className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                allowed
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    : 'bg-slate-50 text-slate-300 border border-slate-100'
            }`}>
            {allowed ? '✓' : '–'}
        </div>
    );
}

// ── Main Dashboard ────────────────────────────────────────────────
export default function Dashboard() {
    const [year, setYear]         = useState('2024');
    const [showPerms, setShowPerms] = useState(false);
    const user        = getUser();
    const { permissions, can } = usePermissions();
    const roleName    = user?.role?.role_name || 'VIEWER';
    const roleConfig  = ROLE_CONFIG[roleName] || ROLE_CONFIG.VIEWER;
    const isAdmin     = roleName === 'ADMIN' || user?.is_superuser;

    // Count how many modules the user can view
    const accessibleModules = Object.values(permissions).filter(p => p?.can_view).length;
    const totalModules = 16;

    return (
        <DashboardLayout breadcrumb="Home" title="Dashboard">
            <div className="space-y-4">

                {/* ── Welcome banner ───────────────────────────── */}
                <div className="rounded-2xl border p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                    style={{ background: roleConfig.bg, borderColor: `${roleConfig.color}25` }}>
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                        style={{ background: `${roleConfig.color}18` }}>
                        {roleConfig.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h1 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Welcome, {user?.first_name || user?.username}
                            </h1>
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${roleConfig.badge}`}>
                                <Shield className="h-3 w-3" />
                                {roleConfig.label}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500">{roleConfig.greeting}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                            {user?.employee_id  && <span>🪪 {user.employee_id}</span>}
                            {user?.department   && <span>🏢 {user.department}</span>}
                            {user?.dzongkhag    && <span>📍 {user.dzongkhag}</span>}
                        </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-black" style={{ color: roleConfig.color }}>
                            {isAdmin ? totalModules : accessibleModules}
                            <span className="text-sm font-semibold text-slate-400">/{totalModules}</span>
                        </p>
                        <p className="text-[10px] text-slate-400 font-medium">Modules accessible</p>
                        <button
                            onClick={() => setShowPerms(v => !v)}
                            className="mt-1.5 text-[10px] font-bold underline underline-offset-2 transition-colors"
                            style={{ color: roleConfig.color }}>
                            {showPerms ? 'Hide' : 'View'} my permissions
                        </button>
                    </div>
                </div>

                {/* ── Permission grid (expandable) ─────────────── */}
                {showPerms && (
                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                                    My Permissions
                                </p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                    {roleConfig.label} — module access matrix
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                {PERM_COLS.map(col => (
                                    <div key={col.key} className="flex items-center gap-1 text-[10px] text-slate-500">
                                        <div className="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold bg-slate-100 text-slate-600">
                                            {col.label}
                                        </div>
                                        <span className="hidden sm:inline">{col.title}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {MODULE_GROUPS.map(group => (
                                <div key={group.group}>
                                    <div className="px-5 py-2 bg-slate-50/70 dark:bg-slate-700/30">
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            {group.group}
                                        </p>
                                    </div>
                                    {group.modules.map(mod => {
                                        const perms = isAdmin
                                            ? { can_view:true, can_create:true, can_edit:true, can_delete:true, can_upload:true, can_download:true }
                                            : (permissions[mod.key] || {});
                                        const hasAny = Object.values(perms).some(Boolean);
                                        return (
                                            <div key={mod.key}
                                                className={`px-5 py-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors ${!hasAny ? 'opacity-40' : ''}`}>
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    {hasAny
                                                        ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0"/>
                                                        : <XCircle    className="h-3.5 w-3.5 text-slate-300 flex-shrink-0"/>
                                                    }
                                                    <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate">
                                                        {mod.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                                    {PERM_COLS.map(col => (
                                                        <PermCell key={col.key} allowed={!!perms[col.key]} title={`${col.title}: ${perms[col.key] ? 'Yes' : 'No'}`}/>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>

                        <div className="px-5 py-3 bg-slate-50/60 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700">
                            <p className="text-[10px] text-slate-400">
                                <strong className="text-slate-500">V</strong> = View &nbsp;
                                <strong className="text-slate-500">C</strong> = Create &nbsp;
                                <strong className="text-slate-500">E</strong> = Edit &nbsp;
                                <strong className="text-slate-500">D</strong> = Delete &nbsp;
                                <strong className="text-slate-500">U</strong> = Upload &nbsp;
                                <strong className="text-slate-500">DL</strong> = Download
                                {isAdmin && <span className="ml-3 text-purple-500 font-semibold">· Admin has full access to all modules</span>}
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Stat cards ────────────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 dark:divide-slate-700">
                        {[
                            { icon:Activity,   label:'System\nEfficiency',   value:'70%',  trend:+2.1, color:C.green  },
                            { icon:Zap,        label:'Electricity\nUtilization', value:'70%', trend:+0.8, color:C.teal   },
                            { icon:TrendingUp, label:'Electricity\nExport',   value:'40%',  trend:-1.2, color:C.mint   },
                            { icon:Download,   label:'Fuel Import',          value:'150',  unit:'metric tons CO₂/yr', color:C.amber},
                        ].map(s=>(
                            <div key={s.label} className="flex flex-col items-center justify-center py-5 px-4 gap-1">
                                <s.icon className="h-5 w-5 mb-1" style={{color:s.color}} strokeWidth={1.8}/>
                                <p className="text-[10px] text-slate-400 text-center whitespace-pre-line leading-tight">{s.label}</p>
                                <p className="text-2xl font-extrabold" style={{color:s.color}}>{s.value}</p>
                                {s.unit && <p className="text-[9px] text-slate-400 text-center">{s.unit}</p>}
                                <span className={`flex items-center gap-0.5 text-[10px] font-semibold mt-0.5 ${s.trend>0?'text-emerald-500':'text-rose-500'}`}>
                                    {s.trend>0?<TrendingUp className="h-3 w-3"/>:<TrendingDown className="h-3 w-3"/>}
                                    {Math.abs(s.trend)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Charts row ────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Electricity Generation</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Million kWh · {year}</p>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1">
                                    <span className="h-2.5 w-2.5 rounded-sm" style={{background:C.amber}}/>Generation
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="h-2.5 w-2.5 rounded-full" style={{background:C.teal}}/>Temp °C
                                </span>
                            </div>
                        </div>
                        <GenerationChart/>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                        <div className="mb-3">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Energy Balance</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Supply Mix · {year}</p>
                        </div>
                        <div className="flex flex-col items-center gap-3">
                            <DonutChart data={SECTOR_BALANCE} size={160}/>
                            <div className="w-full space-y-2">
                                {SECTOR_BALANCE.map(s=>(
                                    <div key={s.label} className="flex items-center justify-between text-xs">
                                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                                            <span className="h-2.5 w-2.5 rounded-full" style={{background:s.color}}/>
                                            {s.label}
                                        </span>
                                        <span className="font-bold text-slate-800 dark:text-slate-200">{s.value} MW</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Sector breakdown ──────────────────────────── */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider text-primary-600">Sector Energy Use</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Consumption by sector · {year}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <select value={year} onChange={e=>setYear(e.target.value)}
                                className="h-8 rounded-full border border-slate-200 dark:bg-slate-700 dark:border-slate-600 px-3 text-xs text-slate-600 dark:text-slate-300 focus:outline-none">
                                {['2024','2023','2022','2021','2020'].map(y=><option key={y}>{y}</option>)}
                            </select>
                            <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-semibold">
                                Sample data · Phase 4 will connect to real API
                            </span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            {label:'Residential', value:32, unit:'GWh', icon:'🏠', color:C.mint,   pct:32},
                            {label:'Industrial',  value:48, unit:'GWh', icon:'🏭', color:C.orange, pct:48},
                            {label:'Commercial',  value:18, unit:'GWh', icon:'🏢', color:C.blue,   pct:18},
                            {label:'Transport',   value:12, unit:'GWh', icon:'🚗', color:C.amber,  pct:12},
                        ].map(s=>(
                            <div key={s.label} className="rounded-xl border border-slate-100 dark:border-slate-700 p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-xl">{s.icon}</span>
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{s.label}</span>
                                </div>
                                <div>
                                    <p className="text-2xl font-extrabold" style={{color:s.color}}>{s.value}</p>
                                    <p className="text-[10px] text-slate-400">{s.unit}</p>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full" style={{width:`${s.pct}%`,background:s.color}}/>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
}