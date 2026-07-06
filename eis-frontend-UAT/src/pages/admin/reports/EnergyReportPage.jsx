// src/pages/admin/reports/EnergyReportPage.jsx
import { useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Zap, TrendingUp, Download, Filter, ChevronDown } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
    YEARS, ENERGY_CATEGORIES, ENERGY_BALANCE_ROWS, ENERGY_BALANCE_DATA,
    TPES_TREND, KEY_INDICATORS, GENERATION_BREAKDOWN, TFC_BY_SECTOR
} from './data/energyDummyData';

// Category palette
const CAT_COLORS = {
    Electricity: '#3b82f6',
    POL:         '#f97316',
    Coal:        '#64748b',
    Fuelwood:    '#84cc16',
    Biomass:     '#10b981',
    Solar:       '#f59e0b',
    Others:      '#8b5cf6',
};

const fmt = v => {
    if (!v && v !== 0) return '—';
    if (v === 0) return '0';
    return v < 0
        ? `(${Math.abs(v).toLocaleString()})`
        : v.toLocaleString();
};

const fmtTotal = row => {
    const data = ENERGY_BALANCE_DATA[2022]?.[row.id];
    if (!data) return '—';
    const total = Object.values(data).reduce((a, b) => a + b, 0);
    return total < 0
        ? `(${Math.abs(total).toLocaleString()})`
        : total.toLocaleString();
};

// ── KPI card ────────────────────────────────────────────────────────
function KpiCard({ label, value, change }) {
    const isPos = change >= 0;
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white mb-2">{value}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPos ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                {isPos ? '▲' : '▼'} {Math.abs(change)}% vs prior year
            </span>
        </div>
    );
}

// ── Section card ─────────────────────────────────────────────────────
function Section({ title, subtitle, children }) {
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-3 border-b border-slate-100 dark:border-slate-700">
                <h2 className="font-bold text-slate-800 dark:text-white text-sm">{title}</h2>
                {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
            </div>
            <div className="p-5">{children}</div>
        </div>
    );
}

export default function EnergyReportPage() {
    const [year, setYear] = useState(2022);

    const balanceData = ENERGY_BALANCE_DATA[year] || ENERGY_BALANCE_DATA[2022];

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Reports & GHG', href: '/reports' },
        { label: 'Energy Balance Report' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
            <div className="space-y-5">

                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 55%,#2563eb 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.06]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                                <Zap className="h-6 w-6 text-blue-100" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-blue-300/80 mb-0.5">Department of Energy · MoENR</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">National Energy Balance Report</h1>
                                <p className="text-xs text-white/50 mt-0.5">IEA methodology · All values in Terajoules (TJ)</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            {/* Year selector */}
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="appearance-none bg-white/10 text-white text-sm font-bold border border-white/20 rounded-xl pl-4 pr-8 py-2 cursor-pointer focus:outline-none">
                                    {YEARS.map(y => <option key={y} value={y} className="text-slate-800">{y}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 text-white/70 pointer-events-none" />
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-colors">
                                <Download className="h-4 w-4" /> Export
                            </button>
                        </div>
                    </div>
                </div>

                {/* KPI row */}
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                    {KEY_INDICATORS.map(k => (
                        <KpiCard key={k.label} {...k} />
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                    {/* TPES trend */}
                    <div className="xl:col-span-2">
                        <Section title="TPES Trend by Energy Carrier (TJ)" subtitle="Total Primary Energy Supply — 2018 to 2023">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={TPES_TREND} margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                    <Tooltip formatter={(v, n) => [`${v.toLocaleString()} TJ`, n]} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    {ENERGY_CATEGORIES.map(cat => (
                                        <Bar key={cat} dataKey={cat} stackId="a" fill={CAT_COLORS[cat]} />
                                    ))}
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                    </div>

                    {/* Generation breakdown pie */}
                    <Section title="Electricity Generation Mix" subtitle={`${year} · Total: ${(52340).toLocaleString()} TJ`}>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={GENERATION_BREAKDOWN}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={95}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                    labelLine={false}>
                                    {GENERATION_BREAKDOWN.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={v => [`${v.toLocaleString()} TJ`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Section>
                </div>

                {/* TFC by sector bar */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    <Section title="Final Energy Consumption by Sector (TJ)" subtitle={`${year} — all energy carriers combined`}>
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={TFC_BY_SECTOR} layout="vertical" margin={{ left: 80, right: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="sector" tick={{ fontSize: 11 }} width={78} />
                                <Tooltip formatter={v => [`${v.toLocaleString()} TJ`]} />
                                <Bar dataKey="value" radius={4}>
                                    {TFC_BY_SECTOR.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </Section>

                    {/* TPES line trend */}
                    <Section title="TPES vs Final Consumption Trend" subtitle="TJ — 2018 to 2023">
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={TPES_TREND} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(v, n) => [`${v.toLocaleString()} TJ`, n]} />
                                <Legend wrapperStyle={{ fontSize: 11 }} />
                                <Line type="monotone" dataKey="Electricity" stroke={CAT_COLORS.Electricity} strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="POL"         stroke={CAT_COLORS.POL}         strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Coal"        stroke={CAT_COLORS.Coal}        strokeWidth={2} dot={false} />
                                <Line type="monotone" dataKey="Fuelwood"    stroke={CAT_COLORS.Fuelwood}    strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Section>
                </div>

                {/* Energy Balance Table */}
                <Section
                    title={`National Energy Balance Table — ${year}`}
                    subtitle="All values in Terajoules (TJ) · Negative values shown in parentheses">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50">
                                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 sticky left-0 bg-slate-50 dark:bg-slate-700/50 min-w-[220px]">
                                        Flow / Category
                                    </th>
                                    {ENERGY_CATEGORIES.map(cat => (
                                        <th key={cat} className="text-right px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 min-w-[90px]"
                                            style={{ color: CAT_COLORS[cat] }}>
                                            {cat}
                                        </th>
                                    ))}
                                    <th className="text-right px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 min-w-[90px]">
                                        Total
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {ENERGY_BALANCE_ROWS.map((row, i) => (
                                    <tr key={row.id}
                                        className={[
                                            row.divider   ? 'border-t-2 border-slate-300 dark:border-slate-500' : '',
                                            row.bold      ? 'bg-slate-50 dark:bg-slate-700/30 font-semibold' : '',
                                            row.group === 'supply'    ? '' : '',
                                            i % 2 === 0 && !row.bold ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-700/10',
                                            'hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors'
                                        ].join(' ')}>
                                        <td className={`px-3 py-2 border-b border-slate-100 dark:border-slate-700 sticky left-0 bg-inherit
                                            ${row.group === 'final' ? 'pl-7' : ''}
                                            ${row.bold ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {row.label}
                                        </td>
                                        {ENERGY_CATEGORIES.map(cat => {
                                            const v = balanceData[row.id]?.[cat];
                                            return (
                                                <td key={cat}
                                                    className={`text-right px-3 py-2 font-mono border-b border-slate-100 dark:border-slate-700
                                                        ${v < 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}
                                                        ${row.bold ? 'font-bold' : ''}`}>
                                                    {fmt(v)}
                                                </td>
                                            );
                                        })}
                                        <td className={`text-right px-3 py-2 font-mono font-bold border-b border-slate-100 dark:border-slate-700
                                            text-slate-800 dark:text-slate-200`}>
                                            {fmtTotal(row)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">
                        Source: Department of Energy, Ministry of Energy and Natural Resources. Figures are provisional and subject to revision.
                    </p>
                </Section>

            </div>
        </DashboardLayout>
    );
}
