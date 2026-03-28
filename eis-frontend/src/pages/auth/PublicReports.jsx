// src/pages/auth/PublicReports.jsx
// Public Reports page — Bhutan EIS
// Shows energy balance tables, report cards by category, downloadable publications
import { useState } from 'react';
import {
    FileText, Download, ExternalLink, Calendar, BarChart3,
    Leaf, Droplets, Zap, Factory, TrendingUp, Flame,
    Activity, Search, Filter, ChevronDown, ArrowUpRight,
    BookOpen, Shield, Globe, ChevronRight,
} from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import { energyData, availableYears } from '../../constants/energyData';
import { nationalData } from '../../constants/dzongkhagData';

// ─── report catalogue ─────────────────────────────────────────────
const REPORTS = [
    {
        id: 1, category: 'Energy Balance', year: 2022,
        title: 'Bhutan Energy Balance 2022',
        desc: 'Comprehensive national energy balance covering all primary sources, transformation and final consumption by sector.',
        pages: 48, format: 'PDF', size: '3.2 MB',
        tags: ['TOE', 'Sankey', 'All Sectors'],
        icon: BarChart3, color: '#3e6c7e',
        featured: true,
    },
    {
        id: 2, category: 'Energy Balance', year: 2016,
        title: 'Bhutan Energy Balance 2016',
        desc: 'National energy balance reference data for 2016 — baseline year for current planning cycles.',
        pages: 42, format: 'PDF', size: '2.8 MB',
        tags: ['TOE', 'Baseline', 'All Sectors'],
        icon: BarChart3, color: '#3e6c7e',
    },
    {
        id: 3, category: 'Electricity', year: 2022,
        title: 'Electricity Statistics 2022',
        desc: 'Generation, transmission losses, consumption by category and dzongkhag-level distribution data.',
        pages: 32, format: 'PDF', size: '2.1 MB',
        tags: ['Generation', 'Dzongkhag', 'BPC'],
        icon: Zap, color: '#2563eb',
        featured: true,
    },
    {
        id: 4, category: 'GHG', year: 2022,
        title: 'GHG Inventory Report 2022',
        desc: 'IPCC 2006 methodology greenhouse gas inventory for the energy sector, aligned with UNFCCC reporting.',
        pages: 65, format: 'PDF', size: '4.5 MB',
        tags: ['IPCC 2006', 'CO₂eq', 'UNFCCC'],
        icon: Shield, color: '#0891b2',
        featured: true,
    },
    {
        id: 5, category: 'Petroleum', year: 2022,
        title: 'Petroleum Statistics 2022',
        desc: 'Import, distribution and consumption of all petroleum and POL products across transport, industry and residential sectors.',
        pages: 28, format: 'PDF', size: '1.8 MB',
        tags: ['Import', 'POL', 'Transport'],
        icon: Droplets, color: '#b45309',
    },
    {
        id: 6, category: 'Biomass', year: 2022,
        title: 'Biomass Energy Report 2022',
        desc: 'Fuelwood, biogas, dung cake and agricultural residue consumption survey results with dzongkhag breakdown.',
        pages: 38, format: 'PDF', size: '2.4 MB',
        tags: ['Fuelwood', 'Biogas', 'Rural'],
        icon: Leaf, color: '#2d8a5e',
    },
    {
        id: 7, category: 'Industry', year: 2022,
        title: 'Industrial Energy Consumption 2022',
        desc: 'Energy use in manufacturing, mining and construction sectors classified by ISIC codes.',
        pages: 24, format: 'Excel', size: '1.2 MB',
        tags: ['Manufacturing', 'ISIC', 'Coal'],
        icon: Factory, color: '#7c3aed',
    },
    {
        id: 8, category: 'Solar', year: 2022,
        title: 'Solar & Renewables Report 2022',
        desc: 'Off-grid solar installations, mini-hydro and emerging renewable energy data by district.',
        pages: 20, format: 'PDF', size: '1.5 MB',
        tags: ['Solar PV', 'Off-grid', 'Mini-hydro'],
        icon: Activity, color: '#ca8a04',
    },
    {
        id: 9, category: 'Transport', year: 2022,
        title: 'Transport Fuel Statistics 2022',
        desc: 'Road, air and water transport fuel consumption segmented by vehicle category and fuel type.',
        pages: 22, format: 'PDF', size: '1.3 MB',
        tags: ['Road', 'Aviation', 'Petrol/Diesel'],
        icon: TrendingUp, color: '#ea580c',
    },
    {
        id: 10, category: 'Coal', year: 2022,
        title: 'Coal Statistics 2022',
        desc: 'Production, import, export and sectoral consumption of coal with quality and calorific value data.',
        pages: 18, format: 'Excel', size: '0.9 MB',
        tags: ['Coking Coal', 'Industry', 'Import'],
        icon: Flame, color: '#78716c',
    },
    {
        id: 11, category: 'Energy Balance', year: 2022,
        title: 'National Energy Policy Review 2022',
        desc: 'Policy analysis against the Bhutan Sustainable Hydropower Policy and Renewable Energy Policy 2013 targets.',
        pages: 55, format: 'PDF', size: '3.8 MB',
        tags: ['Policy', 'RE Targets', 'Planning'],
        icon: Globe, color: '#0f172a',
    },
    {
        id: 12, category: 'GHG', year: 2016,
        title: 'GHG Inventory Report 2016',
        desc: 'Baseline greenhouse gas inventory for the energy sector using IPCC 2006 methodology.',
        pages: 58, format: 'PDF', size: '3.9 MB',
        tags: ['IPCC 2006', 'Baseline', 'CO₂eq'],
        icon: Shield, color: '#0891b2',
    },
];

const CATEGORIES = ['All', 'Energy Balance', 'Electricity', 'GHG', 'Petroleum', 'Biomass', 'Industry', 'Solar', 'Transport', 'Coal'];

// ─── Energy balance table from real data ─────────────────────────
function EnergyBalanceTable({ year }) {
    const d = energyData[year];
    if (!d) return null;

    const rows = [
        { label: 'Total Primary Energy Supply', key: 'TPES', value: d.energyMix.reduce((s, x) => s + x.value, 0), bold: true, bg: 'bg-slate-800 text-white' },
        ...d.energyMix.map(e => ({ label: e.name, value: e.value, color: e.color, indent: true })),
        { spacer: true },
        { label: 'Total Final Energy Consumption', key: 'TFEC', value: d.consumptionMix.filter(x => !['Exports','Losses / Stock Adj.'].includes(x.name)).reduce((s, x) => s + x.value, 0), bold: true, bg: 'bg-slate-700 text-white' },
        ...d.consumptionMix.filter(x => !['Exports','Losses / Stock Adj.'].includes(x.name)).map(e => ({ label: e.name, value: e.value, color: e.color, indent: true })),
        { spacer: true },
        { label: 'Exports (Hydro)', value: d.consumptionMix.find(x => x.name === 'Exports')?.value || 0, color: '#f43f5e', indent: true },
        { label: 'Losses & Stock Adjustment', value: d.consumptionMix.find(x => x.name === 'Losses / Stock Adj.')?.value || 0, color: '#cbd5e1', indent: true },
    ];

    const total = d.energyMix.reduce((s, x) => s + x.value, 0);

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="bg-slate-800 text-white">
                        <th className="px-5 py-3 font-semibold text-[11px] uppercase tracking-wider">Energy Category</th>
                        <th className="px-5 py-3 font-semibold text-[11px] uppercase tracking-wider text-right">TOE</th>
                        <th className="px-5 py-3 font-semibold text-[11px] uppercase tracking-wider text-right">kTOE</th>
                        <th className="px-5 py-3 font-semibold text-[11px] uppercase tracking-wider text-right">% Share</th>
                        <th className="px-5 py-3 font-semibold text-[11px] uppercase tracking-wider w-32">Chart</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => {
                        if (row.spacer) return <tr key={i} className="h-2 bg-slate-50"><td colSpan={5} /></tr>;
                        const pct = ((row.value / total) * 100).toFixed(1);
                        return (
                            <tr key={i} className={`border-b border-slate-100 last:border-0
                                ${row.bg ? '' : row.indent ? 'bg-white hover:bg-slate-50' : 'bg-slate-50'}`}>
                                <td className={`px-5 py-3 ${row.bg || ''}`}>
                                    <div className={`flex items-center gap-2 ${row.indent ? 'pl-4' : ''}`}>
                                        {row.color && !row.bg && (
                                            <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: row.color }} />
                                        )}
                                        <span className={`${row.bold ? 'font-bold text-sm' : 'text-slate-700 text-xs'}`}>
                                            {row.label}
                                        </span>
                                    </div>
                                </td>
                                <td className={`px-5 py-3 text-right font-mono text-xs ${row.bg ? 'text-white font-bold' : 'text-slate-600'}`}>
                                    {row.value.toLocaleString()}
                                </td>
                                <td className={`px-5 py-3 text-right font-mono text-xs ${row.bg ? 'text-white font-bold' : 'text-slate-500'}`}>
                                    {(row.value / 1000).toFixed(1)}
                                </td>
                                <td className={`px-5 py-3 text-right text-xs font-semibold ${row.bg ? 'text-white' : 'text-slate-500'}`}>
                                    {row.indent ? `${pct}%` : ''}
                                </td>
                                <td className="px-5 py-3">
                                    {row.indent && row.color && (
                                        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden w-full">
                                            <div className="h-full rounded-full transition-all"
                                                style={{ width: `${Math.min(parseFloat(pct) * 2, 100)}%`, background: row.color }} />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}

// ─── report card ──────────────────────────────────────────────────
function ReportCard({ report, featured = false }) {
    const Icon = report.icon;
    return (
        <div className={`bg-white rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all
            ${featured ? 'border-slate-200 ring-1 ring-emerald-200' : 'border-slate-100'}`}>
            {featured && (
                <span className="inline-block text-[10px] font-bold uppercase tracking-wider
                    bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full mb-3">
                    Featured
                </span>
            )}
            <div className="flex items-start gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: `${report.color}18` }}>
                    <Icon className="h-5 w-5" style={{ color: report.color }} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight">{report.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> {report.year}
                        </span>
                        <span className="text-slate-200">·</span>
                        <span className="text-[11px] text-slate-400">{report.pages}p</span>
                        <span className="text-slate-200">·</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded
                            ${report.format === 'Excel' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                            {report.format}
                        </span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-3">{report.desc}</p>
            <div className="flex flex-wrap gap-1 mb-4">
                {report.tags.map(t => (
                    <span key={t} className="text-[10px] font-semibold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        {t}
                    </span>
                ))}
            </div>
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors flex-1 justify-center">
                    <Download className="h-3.5 w-3.5" /> Download {report.size}
                </button>
                <button className="flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-500 text-xs font-semibold hover:bg-slate-50 transition-colors">
                    <ExternalLink className="h-3.5 w-3.5" /> View
                </button>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN REPORTS PAGE
// ═══════════════════════════════════════════════════════════════════
export default function PublicReports() {
    const [category, setCategory] = useState('All');
    const [search,   setSearch]   = useState('');
    const [year,     setYear]     = useState('All');
    const [balYear,  setBalYear]  = useState(availableYears[availableYears.length - 1]);
    const [tab,      setTab]      = useState('reports'); // 'reports' | 'balance'

    const filtered = REPORTS.filter(r => {
        const matchCat  = category === 'All' || r.category === category;
        const matchYear = year     === 'All' || String(r.year) === year;
        const matchSearch = !search ||
            r.title.toLowerCase().includes(search.toLowerCase()) ||
            r.desc.toLowerCase().includes(search.toLowerCase()) ||
            r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));
        return matchCat && matchYear && matchSearch;
    });

    const featured = filtered.filter(r => r.featured);
    const regular  = filtered.filter(r => !r.featured);

    return (
        <div className="min-h-screen bg-slate-50">
            <PublicNavbar />

            {/* ── Header ──────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[.15em] text-emerald-600 mb-1">
                                Energy Information System · Bhutan
                            </p>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
                                Publications & Reports
                            </h1>
                            <p className="text-slate-500 mt-1.5 text-sm">
                                Official energy statistics, balance sheets and sector reports
                            </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <BookOpen className="h-4 w-4" />
                            <span>{REPORTS.length} publications available</span>
                        </div>
                    </div>

                    {/* Tab bar */}
                    <div className="flex gap-1 mt-6 border-b border-slate-100 -mb-px">
                        {[
                            { id: 'reports', label: 'All Reports', icon: FileText },
                            { id: 'balance', label: 'Energy Balance Table', icon: BarChart3 },
                        ].map(t => (
                            <button key={t.id} onClick={() => setTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-all border-b-2 -mb-px
                                    ${tab === t.id
                                        ? 'border-emerald-600 text-emerald-700'
                                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300'}`}>
                                <t.icon className="h-4 w-4" />
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-12 py-8">

                {/* ═══════════════════════════════════════════════
                    REPORTS TAB
                ════════════════════════════════════════════════ */}
                {tab === 'reports' && (
                    <>
                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 mb-6">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[220px] max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input value={search} onChange={e => setSearch(e.target.value)}
                                    placeholder="Search reports…"
                                    className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm
                                        text-slate-700 placeholder:text-slate-400 focus:border-emerald-400
                                        focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                            </div>

                            {/* Year filter */}
                            <div className="relative">
                                <select value={year} onChange={e => setYear(e.target.value)}
                                    className="h-10 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm
                                        font-semibold text-slate-700 focus:outline-none appearance-none cursor-pointer">
                                    <option value="All">All Years</option>
                                    {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                            </div>

                            <span className="text-xs text-slate-400 ml-auto">{filtered.length} reports</span>
                        </div>

                        {/* Category pills */}
                        <div className="flex flex-wrap gap-2 mb-8">
                            {CATEGORIES.map(c => (
                                <button key={c} onClick={() => setCategory(c)}
                                    className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all
                                        ${category === c
                                            ? 'bg-slate-800 text-white shadow-sm'
                                            : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-800'}`}>
                                    {c}
                                </button>
                            ))}
                        </div>

                        {/* Featured */}
                        {featured.length > 0 && category === 'All' && !search && (
                            <div className="mb-8">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Featured Publications</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {featured.map(r => <ReportCard key={r.id} report={r} featured />)}
                                </div>
                            </div>
                        )}

                        {/* All / filtered results */}
                        {(category !== 'All' || search || year !== 'All' || featured.length === 0) && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {filtered.map(r => <ReportCard key={r.id} report={r} />)}
                                {filtered.length === 0 && (
                                    <div className="col-span-3 py-20 text-center">
                                        <p className="font-semibold text-slate-600">No reports match your filters</p>
                                        <p className="text-sm text-slate-400 mt-1">Try different keywords or clear the filters</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* More reports section */}
                        {category === 'All' && !search && year === 'All' && regular.length > 0 && (
                            <div className="mt-8">
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">All Publications</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {regular.map(r => <ReportCard key={r.id} report={r} />)}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ═══════════════════════════════════════════════
                    ENERGY BALANCE TABLE TAB
                ════════════════════════════════════════════════ */}
                {tab === 'balance' && (
                    <>
                        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">National Energy Balance</h2>
                                <p className="text-sm text-slate-400 mt-0.5">
                                    Primary energy supply and final consumption breakdown in Tonnes of Oil Equivalent
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <select value={balYear} onChange={e => setBalYear(Number(e.target.value))}
                                        className="h-10 pl-4 pr-9 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 focus:outline-none appearance-none cursor-pointer">
                                        {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                                </div>
                                <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-slate-800 text-white text-sm font-bold hover:bg-slate-900 transition-colors">
                                    <Download className="h-4 w-4" /> Download CSV
                                </button>
                            </div>
                        </div>

                        {/* National KPIs */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                            {[
                                { label: 'TPES',           val: `${nationalData[balYear]?.tpes} kTOE`,  color: '#3e6c7e' },
                                { label: 'TFEC',           val: `${nationalData[balYear]?.tfec} kTOE`,  color: '#2d8a5e' },
                                { label: 'Hydro Capacity', val: `${nationalData[balYear]?.installedCapacity} MW`, color: '#2563eb' },
                                { label: 'Per Capita',     val: `${nationalData[balYear]?.consumptionPerCapita} kWh`, color: '#b45309' },
                            ].map(k => (
                                <div key={k.label} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
                                    <div className="h-1 rounded-full mb-3" style={{ background: k.color }} />
                                    <p className="text-xl font-extrabold text-slate-800">{k.val}</p>
                                    <p className="text-[11px] text-slate-400 mt-0.5">{k.label} — {balYear}</p>
                                </div>
                            ))}
                        </div>

                        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-800">Energy Balance — {balYear}</p>
                                    <p className="text-xs text-slate-400">Source: Department of Energy, EDD Calculation Master File</p>
                                </div>
                                <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                                    Values in TOE (Tonnes of Oil Equivalent)
                                </span>
                            </div>
                            <div className="p-5">
                                <EnergyBalanceTable year={balYear} />
                            </div>
                        </div>

                        {/* Year comparison */}
                        {availableYears.length > 1 && (
                            <div className="mt-6 bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                                <p className="font-bold text-slate-800 mb-4">Year-on-Year Comparison</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100">
                                                <th className="py-2 px-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Indicator</th>
                                                {availableYears.map(y => (
                                                    <th key={y} className="py-2 px-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">{y}</th>
                                                ))}
                                                <th className="py-2 px-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider">Change</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {[
                                                { label: 'TPES (kTOE)',             key: 'tpes' },
                                                { label: 'TFEC (kTOE)',             key: 'tfec' },
                                                { label: 'Installed Capacity (MW)', key: 'installedCapacity' },
                                                { label: 'Per Capita (kWh)',        key: 'consumptionPerCapita' },
                                                { label: 'Peak Demand (MW)',        key: 'peakDemand' },
                                            ].map(row => {
                                                const vals = availableYears.map(y => parseFloat(String(nationalData[y]?.[row.key] || '0').replace(/,/g, '')));
                                                const change = vals.length > 1 ? ((vals[vals.length - 1] - vals[0]) / vals[0] * 100).toFixed(1) : null;
                                                return (
                                                    <tr key={row.key} className="hover:bg-slate-50/60 transition-colors">
                                                        <td className="py-3 px-3 text-sm font-medium text-slate-700">{row.label}</td>
                                                        {availableYears.map((y, i) => (
                                                            <td key={y} className="py-3 px-3 text-right font-mono text-sm text-slate-600">
                                                                {nationalData[y]?.[row.key] || '—'}
                                                            </td>
                                                        ))}
                                                        <td className="py-3 px-3 text-right">
                                                            {change !== null && (
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full
                                                                    ${parseFloat(change) >= 0
                                                                        ? 'bg-emerald-50 text-emerald-600'
                                                                        : 'bg-rose-50 text-rose-600'}`}>
                                                                    {parseFloat(change) >= 0 ? '+' : ''}{change}%
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Data footer */}
                <div className="mt-10 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-400">
                        Department of Energy · Ministry of Energy and Natural Resources · Royal Government of Bhutan
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>Data: 2016–2022</span>
                        <span>·</span>
                        <span>Methodology: IPCC 2006 · IEA</span>
                        <span>·</span>
                        <span>Unit: TOE</span>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}