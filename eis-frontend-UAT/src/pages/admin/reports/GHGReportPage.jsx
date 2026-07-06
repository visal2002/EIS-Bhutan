// src/pages/admin/reports/GHGReportPage.jsx
import { useState } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ReferenceLine,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Flame, TrendingUp, Download, ChevronDown, Leaf, Wind } from 'lucide-react';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import {
    GHG_YEARS, GAS_COLORS, GHG_SECTORS, GHG_SUMMARY_DATA,
    ENERGY_SUBCATEGORIES, GHG_TREND, GHG_BY_SECTOR_PIE,
    GHG_KEY_INDICATORS, IPCC_ROWS
} from './data/ghgDummyData';

const GASES = ['CO2', 'CH4', 'N2O', 'HFCs', 'PFCs', 'SF6'];

const fmtGhg = v => {
    if (!v && v !== 0) return '—';
    if (v === 0) return '0';
    return v < 0
        ? `(${Math.abs(v).toLocaleString()})`
        : v.toLocaleString();
};

const getTotal = (rowData) => {
    if (!rowData) return '—';
    const sum = Object.values(rowData).reduce((a, b) => a + b, 0);
    return sum < 0
        ? `(${Math.abs(sum).toLocaleString()})`
        : sum.toLocaleString();
};

const getSectorTotal = (sectorData) => {
    if (!sectorData) return 0;
    return Object.values(sectorData).reduce((a, b) => a + b, 0);
};

const SECTOR_COLORS = {
    Energy:  '#3b82f6',
    IPPU:    '#f59e0b',
    AFOLU:   '#10b981',
    Waste:   '#8b5cf6',
    LULUCF:  '#64748b',
};

function KpiCard({ label, value, change }) {
    const isPos = change >= 0;
    const isNeg = value.startsWith('−');
    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
            <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-lg font-bold mb-2 ${isNeg ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-white'}`}>{value}</p>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isPos ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                {isPos ? '▲' : '▼'} {Math.abs(change)}% vs prior year
            </span>
        </div>
    );
}

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

export default function GHGReportPage() {
    const [year, setYear] = useState(2022);
    const summaryData = GHG_SUMMARY_DATA[year] || GHG_SUMMARY_DATA[2022];

    const breadcrumbs = [
        { label: 'Administration', href: '/admin/dashboard' },
        { label: 'Reports & GHG', href: '/reports' },
        { label: 'GHG Inventory Report' },
    ];

    return (
        <DashboardLayout breadcrumb={breadcrumbs}>
            <div className="space-y-5">

                {/* Banner */}
                <div className="relative rounded-2xl overflow-hidden shadow-sm"
                    style={{ background: 'linear-gradient(135deg,#7f1d1d 0%,#991b1b 55%,#c2410c 100%)' }}>
                    <div className="absolute inset-0 opacity-[0.06]" style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)',
                        backgroundSize: '28px 28px' }} />
                    <div className="relative px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
                                <Flame className="h-6 w-6 text-orange-200" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-rose-300/80 mb-0.5">Department of Energy · MoENR</p>
                                <h1 className="text-xl font-bold text-white uppercase tracking-tight">National GHG Inventory Report</h1>
                                <p className="text-xs text-white/50 mt-0.5">IPCC 2006 Guidelines · AR5 GWP · Values in Gg CO₂-equivalent</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0">
                            <div className="relative">
                                <select
                                    value={year}
                                    onChange={e => setYear(Number(e.target.value))}
                                    className="appearance-none bg-white/10 text-white text-sm font-bold border border-white/20 rounded-xl pl-4 pr-8 py-2 cursor-pointer focus:outline-none">
                                    {GHG_YEARS.map(y => <option key={y} value={y} className="text-slate-800">{y}</option>)}
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
                    {GHG_KEY_INDICATORS.map(k => (
                        <KpiCard key={k.label} {...k} />
                    ))}
                </div>

                {/* Charts row */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

                    {/* Gross vs Net trend */}
                    <div className="xl:col-span-2">
                        <Section title="GHG Emissions Trend (Gg CO₂e)" subtitle="Gross by sector vs Net with LULUCF sink — 2018 to 2023">
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={GHG_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                                    <Tooltip formatter={(v, n) => [`${v.toLocaleString()} Gg CO₂e`, n]} />
                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeWidth={1} />
                                    {GHG_SECTORS.filter(s => s !== 'LULUCF').map(s => (
                                        <Bar key={s} dataKey={s} stackId="gross" fill={SECTOR_COLORS[s]} />
                                    ))}
                                    <Line type="monotone" dataKey="net" stroke="#10b981" strokeWidth={2.5}
                                        strokeDasharray="6 3" dot={{ r: 3 }} name="Net (incl. LULUCF)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </Section>
                    </div>

                    {/* Sector pie */}
                    <Section title="Gross Emissions by Sector" subtitle={`${year} · excl. LULUCF`}>
                        <ResponsiveContainer width="100%" height={260}>
                            <PieChart>
                                <Pie
                                    data={GHG_BY_SECTOR_PIE}
                                    cx="50%" cy="50%"
                                    innerRadius={55} outerRadius={92}
                                    paddingAngle={3}
                                    dataKey="value"
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                                    labelLine={false}>
                                    {GHG_BY_SECTOR_PIE.map((entry, i) => (
                                        <Cell key={i} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={v => [`${v.toLocaleString()} Gg CO₂e`]} />
                            </PieChart>
                        </ResponsiveContainer>
                    </Section>
                </div>

                {/* Energy sub-categories */}
                <Section title="Energy Sector Sub-Categories (Gg CO₂e)" subtitle={`${year} — IPCC 1.A breakdown`}>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {ENERGY_SUBCATEGORIES.map(cat => {
                            const isPos = cat.change >= 0;
                            return (
                                <div key={cat.code} className="bg-slate-50 dark:bg-slate-700/40 rounded-xl p-4">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{cat.code}</p>
                                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2 leading-tight">{cat.label}</p>
                                    <p className="text-xl font-bold text-slate-800 dark:text-white">{cat.value.toLocaleString()}</p>
                                    <span className={`text-[10px] font-bold ${isPos ? 'text-rose-500' : 'text-emerald-500'}`}>
                                        {isPos ? '▲' : '▼'} {Math.abs(cat.change)}%
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </Section>

                {/* Summary table by sector × gas */}
                <Section
                    title={`GHG Summary Table — ${year}`}
                    subtitle="Gg CO₂-equivalent · AR5 GWP values · IPCC 2006 Guidelines">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50">
                                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 min-w-[160px]">Sector</th>
                                    {GASES.map(g => (
                                        <th key={g} className="text-right px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 min-w-[80px]"
                                            style={{ color: GAS_COLORS[g] }}>
                                            {g}
                                        </th>
                                    ))}
                                    <th className="text-right px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 min-w-[100px]">
                                        Total Gg CO₂e
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {GHG_SECTORS.map((sector, i) => {
                                    const data = summaryData[sector];
                                    const total = getSectorTotal(data);
                                    const isLulucf = sector === 'LULUCF';
                                    return (
                                        <tr key={sector}
                                            className={[
                                                i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/50 dark:bg-slate-700/10',
                                                'hover:bg-blue-50/30 dark:hover:bg-blue-900/5 transition-colors',
                                                isLulucf ? 'border-t-2 border-slate-300 dark:border-slate-500' : ''
                                            ].join(' ')}>
                                            <td className="px-3 py-2.5 font-semibold border-b border-slate-100 dark:border-slate-700" style={{ color: SECTOR_COLORS[sector] }}>
                                                {sector}
                                            </td>
                                            {GASES.map(g => (
                                                <td key={g}
                                                    className={`text-right px-3 py-2 font-mono border-b border-slate-100 dark:border-slate-700
                                                        ${data?.[g] < 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-700 dark:text-slate-300'}`}>
                                                    {fmtGhg(data?.[g])}
                                                </td>
                                            ))}
                                            <td className={`text-right px-3 py-2 font-mono font-bold border-b border-slate-100 dark:border-slate-700
                                                ${total < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                                {total < 0 ? `(${Math.abs(total).toLocaleString()})` : total.toLocaleString()}
                                            </td>
                                        </tr>
                                    );
                                })}
                                {/* Totals row */}
                                <tr className="bg-slate-100 dark:bg-slate-700/60 font-bold border-t-2 border-slate-300 dark:border-slate-500">
                                    <td className="px-3 py-2.5 text-slate-800 dark:text-white border-b border-slate-200">
                                        Gross (excl. LULUCF)
                                    </td>
                                    {GASES.map(g => {
                                        const grossTotal = GHG_SECTORS
                                            .filter(s => s !== 'LULUCF')
                                            .reduce((sum, s) => sum + (summaryData[s]?.[g] || 0), 0);
                                        return (
                                            <td key={g} className="text-right px-3 py-2 font-mono text-slate-700 dark:text-slate-200 border-b border-slate-200">
                                                {grossTotal.toLocaleString()}
                                            </td>
                                        );
                                    })}
                                    <td className="text-right px-3 py-2 font-mono font-bold text-rose-600 dark:text-rose-400 border-b border-slate-200">
                                        {GHG_SECTORS.filter(s => s !== 'LULUCF')
                                            .reduce((sum, s) => sum + getSectorTotal(summaryData[s]), 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Section>

                {/* IPCC Annex table */}
                <Section
                    title="IPCC 2006 Annex — Detailed Emissions Table"
                    subtitle={`${year} · Gg CO₂e per gas · Category codes follow IPCC 2006 GL Chapter 1`}>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-700/50">
                                    <th className="text-left px-2 py-2.5 font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-600 w-[80px]">Code</th>
                                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 min-w-[240px]">Category</th>
                                    <th className="text-right px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 w-[90px]" style={{ color: GAS_COLORS.CO2 }}>CO₂</th>
                                    <th className="text-right px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 w-[80px]" style={{ color: GAS_COLORS.CH4 }}>CH₄</th>
                                    <th className="text-right px-3 py-2.5 font-semibold border-b border-slate-200 dark:border-slate-600 w-[80px]" style={{ color: GAS_COLORS.N2O }}>N₂O</th>
                                    <th className="text-right px-3 py-2.5 font-bold text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-600 w-[100px]">Total CO₂e</th>
                                </tr>
                            </thead>
                            <tbody>
                                {IPCC_ROWS.map((row, i) => {
                                    const vals = row.values || {};
                                    const co2e = Object.values(vals).reduce((a, b) => a + b, 0);
                                    return (
                                        <tr key={row.code}
                                            className={[
                                                row.bold ? 'bg-slate-50 dark:bg-slate-700/40 font-bold' : (i % 2 === 0 ? 'bg-white dark:bg-transparent' : 'bg-slate-50/30 dark:bg-slate-700/5'),
                                                'hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-colors',
                                                row.level === 0 ? 'border-t-2 border-slate-200 dark:border-slate-600' : ''
                                            ].join(' ')}>
                                            <td className="px-2 py-2 font-mono text-slate-400 border-b border-slate-100 dark:border-slate-700 text-[10px] whitespace-nowrap">{row.code}</td>
                                            <td className={`px-3 py-2 border-b border-slate-100 dark:border-slate-700 ${row.level === 0 ? 'text-slate-800 dark:text-white font-bold text-[11px]' : row.level === 1 ? 'pl-5 text-slate-700 dark:text-slate-300' : 'pl-8 text-slate-500 dark:text-slate-400'}`}>
                                                {row.label}
                                                {row.note && <span className="ml-2 text-[9px] font-bold text-emerald-500 uppercase">{row.note}</span>}
                                            </td>
                                            <td className={`text-right px-3 py-2 font-mono border-b border-slate-100 dark:border-slate-700 ${vals.CO2 < 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {vals.CO2 !== undefined ? fmtGhg(vals.CO2) : ''}
                                            </td>
                                            <td className="text-right px-3 py-2 font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                                {vals.CH4 !== undefined ? fmtGhg(vals.CH4) : ''}
                                            </td>
                                            <td className="text-right px-3 py-2 font-mono text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700">
                                                {vals.N2O !== undefined ? fmtGhg(vals.N2O) : ''}
                                            </td>
                                            <td className={`text-right px-3 py-2 font-mono font-semibold border-b border-slate-100 dark:border-slate-700 ${co2e < 0 ? 'text-emerald-600 dark:text-emerald-400' : row.bold ? 'text-slate-800 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                                                {vals.CO2 !== undefined ? fmtGhg(co2e) : ''}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-3">
                        Source: Department of Energy, MoENR. Data follows IPCC 2006 GL. NE = Not Estimated · NO = Not Occurring · IE = Included Elsewhere.
                        Global Warming Potentials (GWP) from IPCC AR5: CH₄ = 28, N₂O = 265.
                    </p>
                </Section>

            </div>
        </DashboardLayout>
    );
}
