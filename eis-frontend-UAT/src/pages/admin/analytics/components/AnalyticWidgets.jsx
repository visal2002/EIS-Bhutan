import React from 'react';
import { apiFetch } from '../../../../services/api';
import { useEffect, useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, Legend,
    AreaChart, Area, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
    LabelList
} from 'recharts';
import BhutanChoropleth from './BhutanChoropleth';

export { BhutanChoropleth };

// ── Vibrant palette ────────────────────────────────────────────────────────
const PALETTE = ['#6366f1','#10b981','#f59e0b','#f43f5e','#06b6d4','#8b5cf6','#ec4899','#84cc16','#14b8a6','#fb923c'];
const GRAD_PAIRS = [
    ['#6366f1','#8b5cf6'],['#10b981','#06b6d4'],['#f59e0b','#fb923c'],
    ['#f43f5e','#ec4899'],['#06b6d4','#3b82f6'],['#8b5cf6','#a78bfa'],
];

// ── Custom Tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-white/10 text-xs">
            <p className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">{label}</p>
            {payload.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
                    <span className="text-white font-black text-sm">{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : p.value}</span>
                    {p.unit && <span className="text-slate-400">{p.unit}</span>}
                </div>
            ))}
        </div>
    );
};

// ── Gradient defs helper ───────────────────────────────────────────────────
const GradientDefs = ({ id, colors }) => (
    <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={colors[0]} stopOpacity={0.9} />
            <stop offset="95%" stopColor={colors[1]} stopOpacity={0.15} />
        </linearGradient>
        <linearGradient id={`${id}_bar`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor={colors[0]} stopOpacity={1} />
            <stop offset="100%" stopColor={colors[1]} stopOpacity={0.8} />
        </linearGradient>
    </defs>
);

// ── STAT widget ────────────────────────────────────────────────────────────
export const StatWidget = ({ data, title }) => {
    const getValue = () => {
        if (!data || typeof data !== 'object') return data || 0;
        if (title?.toLowerCase().includes('generation') || title?.toLowerCase().includes('generation')) {
            const v = data.total_generation_gwh ?? data.value;
            return v !== undefined ? parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' GWh' : 'N/A';
        }
        if (title?.toLowerCase().includes('consumption')) {
            const v = data.total_consumption_gwh ?? data.value;
            return v !== undefined ? parseFloat(v).toLocaleString(undefined, { maximumFractionDigits: 0 }) + ' GWh' : 'N/A';
        }
        if (title?.toLowerCase().includes('renewable') || title?.toLowerCase().includes('share')) {
            return (data.renewable_share ?? 96.4) + '%';
        }
        if (title?.toLowerCase().includes('ghg')) return (data.total_ghg ?? 0).toLocaleString() + ' kt';
        if (data.value !== undefined) return parseFloat(data.value).toLocaleString(undefined, { maximumFractionDigits: 1 });
        const firstNum = Object.values(data).find(v => typeof v === 'number');
        return firstNum !== undefined ? parseFloat(firstNum).toLocaleString(undefined, { maximumFractionDigits: 1 }) : 'N/A';
    };

    const icons = { generation:'⚡', consumption:'🔌', renewable:'🌿', ghg:'🌫️' };
    const getIcon = () => {
        const t = title?.toLowerCase() || '';
        if (t.includes('generation')) return icons.generation;
        if (t.includes('consumption')) return icons.consumption;
        if (t.includes('renewable')) return icons.renewable;
        if (t.includes('ghg')) return icons.ghg;
        return '📊';
    };

    return (
        <div className="flex flex-col items-center justify-center h-full gap-2 py-2">
            <span className="text-3xl">{getIcon()}</span>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">{title}</p>
            <p className="text-3xl font-black bg-gradient-to-br from-indigo-600 to-violet-600 bg-clip-text text-transparent leading-none text-center">{getValue()}</p>
            <span className="text-[9px] text-emerald-500 font-bold bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">↑ Live Data</span>
        </div>
    );
};

// ── BAR chart ──────────────────────────────────────────────────────────────
export const BarChartWidget = ({ data, xKey = 'label', yKey = 'value' }) => {
    const safeData = Array.isArray(data) ? data.slice(0, 12) :
                     Array.isArray(data?.by_sector) ? data.by_sector.slice(0, 12) :
                     Array.isArray(data?.by_fuel) ? data.by_fuel.slice(0, 12) : [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={safeData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }} barSize={24}>
                <GradientDefs id="barGrad0" colors={GRAD_PAIRS[0]} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} width={36} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                <Bar dataKey={yKey} radius={[6, 6, 0, 0]}>
                    {safeData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                    <LabelList dataKey={yKey} position="top" formatter={v => v > 999 ? (v/1000).toFixed(1)+'k' : v?.toFixed ? v.toFixed(0) : v} style={{ fontSize: 9, fontWeight: 700, fill: '#64748b' }} />
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

// ── PIE / DONUT chart ──────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    if (percent < 0.06) return null;
    const r = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + r * Math.cos(-midAngle * RADIAN);
    const y = cy + r * Math.sin(-midAngle * RADIAN);
    return <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={800}>{`${(percent * 100).toFixed(0)}%`}</text>;
};

export const PieChartWidget = ({ data }) => {
    const safeData = Array.isArray(data) ? data :
                     Array.isArray(data?.by_sector) ? data.by_sector :
                     Array.isArray(data?.sector_usage) ? data.sector_usage : [];
    const total = safeData.reduce((a, d) => a + (d.value || 0), 0);

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie data={safeData} cx="50%" cy="45%" innerRadius="50%" outerRadius="75%"
                    paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                    {safeData.map((_, i) => (
                        <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="none" />
                    ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 10, fontWeight: 700 }} />
            </PieChart>
        </ResponsiveContainer>
    );
};

// ── LINE chart ─────────────────────────────────────────────────────────────
export const LineChartWidget = ({ data, xKey = 'year', yKey = 'value' }) => {
    const safeData = Array.isArray(data) ? data : [];
    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={safeData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <defs>
                    <filter id="glow"><feGaussianBlur stdDeviation="3" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }} />
                <Line type="monotone" dataKey={yKey} stroke="#6366f1" strokeWidth={3}
                    dot={{ r: 4, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#6366f1', stroke: '#fff', strokeWidth: 3 }}
                    filter="url(#glow)" />
            </LineChart>
        </ResponsiveContainer>
    );
};

// ── AREA chart ─────────────────────────────────────────────────────────────
export const AreaChartWidget = ({ data, xKey = 'label', yKey = 'value' }) => {
    const safeData = Array.isArray(data) ? data :
                     Array.isArray(data?.by_fuel) ? data.by_fuel :
                     Array.isArray(data?.by_sector) ? data.by_sector : [];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={safeData} margin={{ top: 8, right: 8, left: -16, bottom: 4 }}>
                <GradientDefs id="areaGrad" colors={['#10b981','#06b6d4']} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                <XAxis dataKey={xKey} axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: '#94a3b8' }} width={36} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={yKey} stroke="#10b981" strokeWidth={3} fill="url(#areaGrad)" />
            </AreaChart>
        </ResponsiveContainer>
    );
};

// ── RADAR chart ────────────────────────────────────────────────────────────
export const RadarChartWidget = ({ data, xKey = 'label', yKey = 'value' }) => {
    const safeData = Array.isArray(data) ? data.slice(0, 8) : [];
    return (
        <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={safeData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey={xKey} tick={{ fill: '#64748b', fontSize: 9, fontWeight: 700 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 9 }} />
                <Radar name="Value" dataKey={yKey} stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} strokeWidth={2} />
                <Tooltip content={<CustomTooltip />} />
            </RadarChart>
        </ResponsiveContainer>
    );
};
