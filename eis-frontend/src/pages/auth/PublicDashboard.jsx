// src/pages/auth/PublicDashboard.jsx
// Public Energy Dashboard — Bhutan EIS
// Uses real data from constants/energyData.js and constants/dzongkhagData.js
import { useState } from 'react';
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
    Zap, Flame, Droplets, Leaf, TrendingUp, TrendingDown,
    BarChart3, Globe, Download, Info, ArrowUpRight, Activity,
    ChevronDown, Filter,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { nationalData, dzongkhagData } from '../../constants/dzongkhagData';
import { energyData, availableYears } from '../../constants/energyData';
import { dzongkhagPaths } from '../../constants/dzongkhagPaths';

// ─── colour palette ───────────────────────────────────────────────
const G = {
    forest: '#1a4a3a', teal: '#2d8a5e', mint: '#5AC994',
    navy: '#0f1f3d',   gold: '#b45309', amber: '#f59e0b',
};
const SOURCE_COLORS = {
    Hydro: '#3e6c7e', Coal: '#374151', Biomass: '#8c7746',
    Petroleum: '#b45309', 'Solar/Renewables': '#eab308',
};
const SECTOR_COLORS = {
    Industry: '#7c3aed', Residential: '#6366f1', Commercial: '#8b5cf6',
    Transport: '#b45309', 'Other Sectors': '#94a3b8',
    Exports: '#f43f5e', 'Losses / Stock Adj.': '#cbd5e1',
};

// ─── trend data ───────────────────────────────────────────────────
const TREND = [
    { y: '2010', hydro: 180000, biomass: 72000, petroleum: 68000, coal: 55000 },
    { y: '2012', hydro: 198000, biomass: 76000, petroleum: 79000, coal: 82000 },
    { y: '2014', hydro: 210000, biomass: 80000, petroleum: 88000, coal: 110000 },
    { y: '2016', hydro: 222500, biomass: 84693, petroleum: 97500, coal: 149230 },
    { y: '2018', hydro: 248000, biomass: 90000, petroleum: 108000, coal: 95000 },
    { y: '2020', hydro: 272000, biomass: 96000, petroleum: 115000, coal: 75000 },
    { y: '2022', hydro: 301852, biomass: 100617, petroleum: 130000, coal: 78042 },
];

// ─── custom tooltip ───────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-slate-200 rounded-xl px-4 py-3 shadow-xl text-xs">
            {label && <p className="font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">{label}</p>}
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: p.stroke || p.fill }} />
                    <span className="text-slate-500">{p.name}:</span>
                    <span className="font-bold text-slate-800">
                        {p.value >= 1000 ? `${(p.value / 1000).toFixed(0)}K` : p.value} TOE
                    </span>
                </div>
            ))}
        </div>
    );
}

// ─── stat card ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, unit, sub, color, trend }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${color}18` }}>
                    <Icon className="h-5 w-5" style={{ color }} />
                </div>
                {trend !== undefined && (
                    <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full
                        ${trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-extrabold text-slate-800 leading-none">{value}</p>
            <p className="text-xs font-semibold text-slate-500 mt-0.5">{unit}</p>
            <p className="text-[11px] text-slate-400 mt-2 leading-tight">{label}</p>
            {sub && <p className="text-[10px] text-slate-300 mt-0.5">{sub}</p>}
        </div>
    );
}

// ─── section header ────────────────────────────────────────────────
function SectionHeader({ title, sub, children }) {
    return (
        <div className="flex items-end justify-between mb-5 flex-wrap gap-3">
            <div>
                <h2 className="text-lg font-bold text-slate-800">{title}</h2>
                {sub && <p className="text-sm text-slate-400 mt-0.5">{sub}</p>}
            </div>
            {children}
        </div>
    );
}

// ─── Bhutan SVG map ────────────────────────────────────────────────
function BhutanMap({ year, selected, onSelect }) {
    const data = dzongkhagData[year] || {};
    const vals = Object.values(data).map(d => parseFloat(d.tpes) || 0);
    const max  = Math.max(...vals, 1);

    const getColor = (code) => {
        const d   = data[code];
        if (!d) return '#e2e8f0';
        const v   = parseFloat(d.tpes) || 0;
        const t   = v / max;
        if (t > 0.7) return '#1a4a3a';
        if (t > 0.4) return '#2d8a5e';
        if (t > 0.2) return '#5AC994';
        if (t > 0.1) return '#a7f3d0';
        return '#d1fae5';
    };

    return (
        <div className="relative w-full" style={{ paddingBottom: '55%' }}>
            <svg viewBox="0 0 800 440" className="absolute inset-0 w-full h-full"
                style={{ fontFamily: 'inherit' }}>
                {Object.entries(dzongkhagPaths).map(([code, path]) => (
                    <path key={code} d={path}
                        fill={selected === code ? '#f59e0b' : getColor(code)}
                        stroke="white" strokeWidth={selected === code ? 2 : 1}
                        className="cursor-pointer transition-all duration-150 hover:opacity-80"
                        onClick={() => onSelect(selected === code ? null : code)}
                    />
                ))}
            </svg>
        </div>
    );
}

// ─── donut chart ───────────────────────────────────────────────────
function DonutChart({ data, title }) {
    const total = data.reduce((s, d) => s + d.value, 0);
    return (
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{title}</p>
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0" style={{ width: 120, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={data} cx="50%" cy="50%" innerRadius={32} outerRadius={52}
                                dataKey="value" strokeWidth={0}>
                                {data.map((d, i) => <Cell key={i} fill={d.color} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-1.5 min-w-0">
                    {data.slice(0, 5).map((d, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                            <span className="text-xs text-slate-600 truncate flex-1">{d.name}</span>
                            <span className="text-xs font-bold text-slate-700 flex-shrink-0">
                                {((d.value / total) * 100).toFixed(1)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════════════
export default function PublicDashboard() {
    const [year,       setYear]       = useState(availableYears[availableYears.length - 1]);
    const [selected,   setSelected]   = useState(null);  // dzongkhag code or null = national
    const [activeTab,  setActiveTab]  = useState('overview');

    const yData  = energyData[year]  || energyData[2022];
    const natD   = nationalData[year] || nationalData[2022];
    const dzData = dzongkhagData[year] || dzongkhagData[2022];

    // Which data to show — selected dzongkhag or national
    const loc    = selected ? dzData[selected] : natD;
    const locName = selected ? (dzData[selected]?.name || selected) : 'Bhutan (National)';

    const prevYear = availableYears[availableYears.indexOf(year) - 1];
    const prevNat  = prevYear ? nationalData[prevYear] : null;

    const tpeTrend = prevNat
        ? Math.round(((parseFloat(natD.tpes) - parseFloat(prevNat.tpes)) / parseFloat(prevNat.tpes)) * 100)
        : null;

    const TABS = [
        { id: 'overview',   label: 'Overview' },
        { id: 'supply',     label: 'Energy Supply' },
        { id: 'demand',     label: 'Final Demand' },
        { id: 'regional',   label: 'By Dzongkhag' },
    ];

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            {/* ── Page header ─────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[.15em] text-emerald-600 mb-1">
                                Energy Information System · Bhutan
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                                National Energy Dashboard
                            </h1>
                            <p className="text-slate-500 mt-1.5 text-sm">
                                Comprehensive energy statistics — supply, demand and sector analysis
                            </p>
                        </div>

                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Year selector */}
                            <div className="relative">
                                <select value={year} onChange={e => setYear(Number(e.target.value))}
                                    className="appearance-none h-10 pl-4 pr-9 rounded-xl border border-slate-200 bg-white
                                        text-sm font-bold text-slate-700 focus:outline-none focus:border-emerald-400
                                        focus:ring-2 focus:ring-emerald-500/20 cursor-pointer">
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>

                            <button className="flex items-center gap-2 h-10 px-4 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                                <Download className="h-4 w-4" /> Export
                            </button>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 mt-6 border-b border-slate-100 -mb-px">
                        {TABS.map(t => (
                            <button key={t.id} onClick={() => setActiveTab(t.id)}
                                className={`px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px
                                    ${activeTab === t.id
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8 space-y-10">

                {/* ═══════════════════════════════════════════════
                    OVERVIEW TAB
                ════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <>
                        {/* KPI cards */}
                        <div>
                            <SectionHeader title={`Key Indicators — ${locName}, ${year}`}
                                sub="Primary energy figures in thousands of tonnes of oil equivalent (kTOE)">
                            </SectionHeader>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                <StatCard icon={Zap} label="Total Primary Energy Supply"
                                    value={loc?.tpes || '—'} unit="kTOE"
                                    color="#3e6c7e" trend={!selected ? tpeTrend : undefined} />
                                <StatCard icon={Activity} label="Total Final Energy Consumption"
                                    value={loc?.tfec || '—'} unit="kTOE"
                                    color="#2d8a5e" />
                                <StatCard icon={TrendingUp} label="Per Capita Consumption"
                                    value={loc?.consumptionPerCapita || '—'} unit="kWh/person"
                                    color="#7c3aed" />
                                <StatCard icon={Globe} label="Installed Capacity"
                                    value={loc?.installedCapacity || '—'} unit="MW"
                                    color="#b45309" />
                                <StatCard icon={BarChart3} label="Peak Demand"
                                    value={loc?.peakDemand || '—'} unit="MW"
                                    color="#0891b2" />
                            </div>
                        </div>

                        {/* Energy trend + mix donutss */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Trend chart — takes 2 cols */}
                            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <SectionHeader title="Energy Mix Trend (2010–2022)"
                                    sub="Total Primary Energy Supply by source in TOE" />
                                <ResponsiveContainer width="100%" height={260}>
                                    <AreaChart data={TREND} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                        <defs>
                                            {[
                                                { id: 'hydro',    color: '#3e6c7e' },
                                                { id: 'biomass',  color: '#8c7746' },
                                                { id: 'petrol',   color: '#b45309' },
                                                { id: 'coal',     color: '#374151' },
                                            ].map(g => (
                                                <linearGradient key={g.id} id={g.id} x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%"  stopColor={g.color} stopOpacity={0.25} />
                                                    <stop offset="95%" stopColor={g.color} stopOpacity={0.03} />
                                                </linearGradient>
                                            ))}
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="y" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Legend iconType="circle" iconSize={8}
                                            formatter={v => <span className="text-xs text-slate-600 font-medium capitalize">{v}</span>} />
                                        <Area type="monotone" dataKey="hydro"     name="Hydro"     stroke="#3e6c7e" fill="url(#hydro)"   strokeWidth={2} />
                                        <Area type="monotone" dataKey="biomass"   name="Biomass"   stroke="#8c7746" fill="url(#biomass)" strokeWidth={2} />
                                        <Area type="monotone" dataKey="petroleum" name="Petroleum" stroke="#b45309" fill="url(#petrol)"  strokeWidth={2} />
                                        <Area type="monotone" dataKey="coal"      name="Coal"      stroke="#374151" fill="url(#coal)"    strokeWidth={2} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Mix donuts */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
                                <p className="text-sm font-bold text-slate-800">Energy Mix — {year}</p>
                                <DonutChart data={yData.energyMix} title="Supply by Source" />
                                <div className="border-t border-slate-100 pt-5">
                                    <DonutChart data={yData.consumptionMix.slice(0, 5)} title="Demand by Sector" />
                                </div>
                            </div>
                        </div>

                        {/* Supply vs Demand bar comparison */}
                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <SectionHeader title="Supply vs Final Consumption by Source" sub={`${year} — Values in TOE`} />
                            <ResponsiveContainer width="100%" height={220}>
                                <BarChart data={yData.energyMix} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" name="TPES (TOE)" radius={[6, 6, 0, 0]}>
                                        {yData.energyMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </>
                )}

                {/* ═══════════════════════════════════════════════
                    SUPPLY TAB
                ════════════════════════════════════════════════ */}
                {activeTab === 'supply' && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
                            {yData.energyMix.map(s => (
                                <div key={s.name} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="h-3 w-3 rounded-full flex-shrink-0" style={{ background: s.color }} />
                                        <p className="text-xs font-bold text-slate-600">{s.name}</p>
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-800">{(s.value / 1000).toFixed(1)}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">kTOE</p>
                                    <div className="mt-3 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                                        <div className="h-full rounded-full transition-all"
                                            style={{
                                                width: `${(s.value / Math.max(...yData.energyMix.map(x => x.value))) * 100}%`,
                                                background: s.color,
                                            }} />
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-1.5">
                                        {((s.value / yData.energyMix.reduce((a, b) => a + b.value, 0)) * 100).toFixed(1)}% of TPES
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <SectionHeader title="Primary Energy Supply by Source" sub={`${year} — TOE`} />
                            <ResponsiveContainer width="100%" height={320}>
                                <BarChart data={yData.energyMix} layout="vertical"
                                    margin={{ top: 0, right: 20, bottom: 0, left: 120 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                    <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                        tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                                    <YAxis type="category" dataKey="name" width={115} tick={{ fontSize: 12, fill: '#475569', fontWeight: 600 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} />
                                    <Bar dataKey="value" name="TOE" radius={[0, 6, 6, 0]}>
                                        {yData.energyMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        {/* Hydro export highlight */}
                        <div className="bg-gradient-to-br from-[#1a4a3a] to-[#256648] rounded-2xl p-6 text-white">
                            <div className="flex items-center gap-3 mb-4">
                                <Zap className="h-6 w-6 text-emerald-300" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300/80">Key Insight</p>
                                    <p className="font-bold text-lg">Hydropower Dominance</p>
                                </div>
                            </div>
                            <p className="text-white/80 text-sm leading-relaxed">
                                Hydropower constitutes{' '}
                                <span className="font-bold text-emerald-300">
                                    {((yData.energyMix.find(d => d.name === 'Hydro')?.value || 0) /
                                        yData.energyMix.reduce((a, b) => a + b.value, 0) * 100).toFixed(1)}%
                                </span>{' '}
                                of Bhutan's total primary energy supply in {year},
                                with a significant portion exported to India, making it the largest source of national revenue.
                                Installed capacity reached{' '}
                                <span className="font-bold text-emerald-300">{natD.installedCapacity} MW</span>.
                            </p>
                            <div className="grid grid-cols-3 gap-4 mt-5">
                                {[
                                    { label: 'Installed Capacity', val: `${natD.installedCapacity} MW` },
                                    { label: 'Hydro Export Share', val: `${((200452 / 301852) * 100).toFixed(0)}%` },
                                    { label: 'Domestic Consumption', val: `${(100 - (200452 / 301852) * 100).toFixed(0)}%` },
                                ].map(s => (
                                    <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
                                        <p className="text-xl font-extrabold text-white">{s.val}</p>
                                        <p className="text-[10px] text-white/60 mt-1">{s.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════════════════════════════════════
                    DEMAND TAB
                ════════════════════════════════════════════════ */}
                {activeTab === 'demand' && (
                    <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {yData.consumptionMix.filter(s => !['Exports','Losses / Stock Adj.'].includes(s.name)).map(s => (
                                <div key={s.name} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                                        <p className="text-xs font-bold text-slate-600">{s.name}</p>
                                    </div>
                                    <p className="text-2xl font-extrabold text-slate-800">{(s.value / 1000).toFixed(1)}</p>
                                    <p className="text-xs text-slate-400">kTOE</p>
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <SectionHeader title="Final Energy Consumption by Sector" sub={`${year} — TOE`} />
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={yData.consumptionMix.filter(s => !['Exports','Losses / Stock Adj.'].includes(s.name))}
                                        margin={{ top: 5, right: 10, bottom: 40, left: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} angle={-30} textAnchor="end"
                                            axisLine={false} tickLine={false} interval={0} />
                                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false}
                                            tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={40} />
                                        <Tooltip content={<ChartTooltip />} />
                                        <Bar dataKey="value" name="TOE" radius={[6, 6, 0, 0]}>
                                            {yData.consumptionMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <SectionHeader title="Consumption Share" sub="Including exports and losses" />
                                <div className="flex items-center justify-center">
                                    <div style={{ width: 200, height: 200 }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={yData.consumptionMix} cx="50%" cy="50%"
                                                    innerRadius={50} outerRadius={85}
                                                    dataKey="value" strokeWidth={2} stroke="white">
                                                    {yData.consumptionMix.map((d, i) => <Cell key={i} fill={d.color} />)}
                                                </Pie>
                                                <Tooltip content={<ChartTooltip />} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {yData.consumptionMix.map(d => (
                                        <div key={d.name} className="flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: d.color }} />
                                            <span className="text-[11px] text-slate-500 truncate">{d.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {/* ═══════════════════════════════════════════════
                    REGIONAL TAB
                ════════════════════════════════════════════════ */}
                {activeTab === 'regional' && (
                    <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                        {/* Map */}
                        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                            <SectionHeader title="Bhutan — Energy by Dzongkhag"
                                sub={`Click a dzongkhag to view its data · ${year}`} />
                            <BhutanMap year={year} selected={selected} onSelect={setSelected} />
                            <div className="flex items-center gap-3 mt-4">
                                <p className="text-[11px] text-slate-400">TPES Intensity:</p>
                                <div className="flex items-center gap-1 flex-1">
                                    {['#d1fae5', '#a7f3d0', '#5AC994', '#2d8a5e', '#1a4a3a'].map(c => (
                                        <div key={c} className="flex-1 h-2 rounded-sm" style={{ background: c }} />
                                    ))}
                                </div>
                                <p className="text-[11px] text-slate-400">Low → High</p>
                                <div className="w-3 h-3 rounded-sm bg-amber-400 ml-2" />
                                <p className="text-[11px] text-slate-400">Selected</p>
                            </div>
                        </div>

                        {/* Detail panel */}
                        <div className="xl:col-span-2 space-y-4">
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                            {selected ? 'Dzongkhag' : 'National'}
                                        </p>
                                        <p className="font-bold text-slate-800 text-lg">{locName}</p>
                                    </div>
                                    {selected && (
                                        <button onClick={() => setSelected(null)}
                                            className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 px-2 py-1 rounded-lg">
                                            ← National
                                        </button>
                                    )}
                                </div>

                                {loc ? (
                                    <div className="space-y-3">
                                        {[
                                            { label: 'Population',          val: `${loc.population}M`,           icon: '👥' },
                                            { label: 'Installed Capacity',  val: `${loc.installedCapacity} MW`,  icon: '⚡' },
                                            { label: 'TPES',                val: `${loc.tpes} kTOE`,             icon: '🔋' },
                                            { label: 'TFEC',                val: `${loc.tfec} kTOE`,             icon: '🔌' },
                                            { label: 'Per Capita',          val: `${loc.consumptionPerCapita} kWh`, icon: '📊' },
                                            { label: 'Peak Demand',         val: `${loc.peakDemand} MW`,         icon: '📈' },
                                            { label: 'GDP (nominal)',        val: `Nu. ${loc.gdp}M`,              icon: '💰' },
                                        ].map(r => (
                                            <div key={r.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">{r.icon}</span>
                                                    <p className="text-xs text-slate-500">{r.label}</p>
                                                </div>
                                                <p className="text-sm font-bold text-slate-800">{r.val}</p>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-slate-400">Click a dzongkhag on the map</p>
                                )}
                            </div>

                            {/* Top 5 dzongkhags */}
                            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-3">
                                    Top 5 by TPES ({year})
                                </p>
                                <div className="space-y-2">
                                    {Object.entries(dzData || {})
                                        .map(([code, d]) => ({ code, ...d, tpesNum: parseFloat(d.tpes) || 0 }))
                                        .sort((a, b) => b.tpesNum - a.tpesNum)
                                        .slice(0, 5)
                                        .map((d, i) => (
                                            <button key={d.code} onClick={() => setSelected(d.code)}
                                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-colors text-left
                                                    ${selected === d.code ? 'bg-amber-50 border border-amber-200' : 'hover:bg-slate-50'}`}>
                                                <span className="text-xs font-extrabold text-slate-400 w-5 text-center">{i + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-bold text-slate-700 truncate">{d.name}</p>
                                                    <div className="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
                                                        <div className="h-full rounded-full bg-emerald-500 transition-all"
                                                            style={{ width: `${(d.tpesNum / Object.values(dzData).reduce((mx, x) => Math.max(mx, parseFloat(x.tpes) || 0), 0)) * 100}%` }} />
                                                    </div>
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 flex-shrink-0">{d.tpes} kTOE</span>
                                            </button>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Data note */}
                <div className="flex items-start gap-2.5 bg-slate-100 rounded-xl px-4 py-3">
                    <Info className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-500">
                        Data sourced from EDD Calculation Master Files. Values in Tonnes of Oil Equivalent (TOE) unless stated.
                        2022 data is the most recent published dataset. Dzongkhag data is estimated based on district-level surveys.
                    </p>
                </div>
            </div>

            <Footer />
        </div>
    );
}