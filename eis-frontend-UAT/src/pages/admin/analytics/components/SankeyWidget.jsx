/**
 * SankeyWidget.jsx
 * Reusable Energy Sankey Diagram for the admin dashboard.
 * Uses the same EnergyData constants as the public landing page.
 */
import React, { useState } from 'react';
import { energyData } from '../../../../constants/EnergyData';

// Node colour map (same as LandingPage)
const NC = {
    "Domestic Production":"#15803d","Imports":"#0284c7","Hydro":"#3e6c7e",
    "Coal":"#374151","Solar/Renewables":"#eab308","Biomass":"#8c7746",
    "POL (Imported)":"#b45309","POL Distribution":"#f59e0b",
    "Coal Processing":"#64748b","Biomass Processing":"#65a30d","Residential":"#6366f1",
    "Commercial":"#8b5cf6","Industry":"#7c3aed","Transport":"#ea580c",
    "Other Sectors":"#94a3b8","Exports":"#f43f5e","Losses / Stock Adj.":"#cbd5e1",
};

const COL_LABELS = ["Primary Supply","Energy Sources","Transformation","Final Use"];
const COL_COLORS = ["#4ade80","#38bdf8","#818cf8","#c084fc"];
const CATS = ["supply","source","transformation","consumption"];

function SankeyChart({ year = 2022 }) {
    const [hov, setHov] = useState(null);
    const [tip, setTip] = useState(null);

    const raw = energyData[year];
    if (!raw) return (
        <div className="flex items-center justify-center h-full text-slate-400 text-xs">
            No energy data for {year}
        </div>
    );

    const links  = raw.links.filter(l => l.value > 0);
    const usedIds = new Set(links.flatMap(l => [l.source, l.target]));
    const nodes  = raw.nodes.filter(n => usedIds.has(n.id)).map(n => ({ ...n, name: n.id }));

    const W = 1100, H = 480, nodeW = 20;
    const colW = W / CATS.length;
    const totals = {};
    nodes.forEach(n => { totals[n.id] = 0; });
    links.forEach(l => {
        totals[l.source] = (totals[l.source] || 0) + l.value;
        totals[l.target] = (totals[l.target] || 0) + l.value;
    });
    const maxT  = Math.max(...Object.values(totals));
    const usable = H - 70;
    const pos   = {};

    CATS.forEach((cat, ci) => {
        const col    = nodes.filter(n => n.category === cat && totals[n.id] > 0);
        const heights = col.map(n => Math.max((totals[n.id] / maxT) * usable * 0.70, 24));
        const totalH  = heights.reduce((s, h) => s + h, 0);
        const spacing = col.length > 1 ? (usable - totalH) / (col.length - 1) : 0;
        let y = 38 + (col.length === 1 ? (usable - heights[0]) / 2 : 0);
        col.forEach((n, ni) => {
            pos[n.id] = { x: ci * colW + (colW - nodeW) / 2, y, h: heights[ni], w: nodeW, ci };
            y += heights[ni] + spacing;
        });
    });

    const srcOff = {}, tgtOff = {};
    const paths = links.map((l, i) => {
        const s = pos[l.source], t = pos[l.target];
        if (!s || !t) return null;
        const lh = Math.max((l.value / totals[l.source]) * s.h, 2);
        const rh = Math.max((l.value / totals[l.target]) * t.h, 2);
        srcOff[l.source] = srcOff[l.source] || 0;
        tgtOff[l.target] = tgtOff[l.target] || 0;
        const y1 = s.y + srcOff[l.source] + lh / 2;
        const y2 = t.y + tgtOff[l.target] + rh / 2;
        srcOff[l.source] += lh;
        tgtOff[l.target] += rh;
        const x1 = s.x + s.w, x2 = t.x;
        const c1 = x1 + (x2 - x1) * 0.42, c2 = x1 + (x2 - x1) * 0.58;
        const sc = NC[l.source] || "#94a3b8", tc = NC[l.target] || "#94a3b8";
        const isH = hov === l.source || hov === l.target;
        const op = hov ? (isH ? 0.72 : 0.05) : 0.40;
        return (
            <g key={i}>
                <defs>
                    <linearGradient id={`sk${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%"   stopColor={sc} />
                        <stop offset="100%" stopColor={tc} />
                    </linearGradient>
                </defs>
                <path
                    d={`M${x1} ${y1 - lh/2} C${c1} ${y1 - lh/2},${c2} ${y2 - rh/2},${x2} ${y2 - rh/2} L${x2} ${y2 + rh/2} C${c2} ${y2 + rh/2},${c1} ${y1 + lh/2},${x1} ${y1 + lh/2}Z`}
                    fill={`url(#sk${i})`}
                    opacity={op}
                    className="transition-opacity duration-200 cursor-pointer"
                    onMouseEnter={e => setTip({ x: e.clientX, y: e.clientY, l })}
                    onMouseLeave={() => setTip(null)}
                />
            </g>
        );
    });

    return (
        <div className="relative w-full h-full overflow-hidden">
            <div className="w-full h-full overflow-x-auto">
                <svg
                    viewBox={`0 0 ${W} ${H}`}
                    style={{ minWidth: 560, width: '100%', height: '100%' }}
                    preserveAspectRatio="xMidYMid meet"
                >
                    {/* Column headers */}
                    {COL_LABELS.map((lab, ci) => (
                        <g key={lab}>
                            <rect x={ci * colW + 8} y={6} width={colW - 16} height={2} rx={2} fill={COL_COLORS[ci]} opacity={0.7} />
                            <text x={ci * colW + colW / 2} y={20} textAnchor="middle"
                                fill={COL_COLORS[ci]} fontSize={8.5} fontWeight={700}
                                letterSpacing="0.12em" fontFamily="system-ui,sans-serif">
                                {lab.toUpperCase()}
                            </text>
                        </g>
                    ))}

                    {/* Flow ribbons */}
                    {paths}

                    {/* Nodes */}
                    {Object.entries(pos).map(([id, p]) => {
                        const c   = NC[id] || "#64748b";
                        const isH = hov === id;
                        const val = totals[id];
                        const lab = id.length > 20 ? id.slice(0, 18) + "…" : id;
                        return (
                            <g key={id} className="cursor-pointer"
                                onMouseEnter={() => setHov(id)}
                                onMouseLeave={() => setHov(null)}>
                                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={3}
                                    fill={c} opacity={hov && !isH ? 0.2 : 1}
                                    className="transition-all duration-150"
                                    style={{ filter: isH ? `drop-shadow(0 0 8px ${c}bb)` : undefined }} />
                                <text
                                    x={p.ci < 2 ? p.x - 6 : p.x + p.w + 6}
                                    y={p.y + p.h / 2}
                                    textAnchor={p.ci < 2 ? "end" : "start"}
                                    dominantBaseline="middle"
                                    fontSize={isH ? 9.5 : 8.5}
                                    fontWeight={isH ? 700 : 500}
                                    fill={isH ? c : "rgba(255,255,255,0.65)"}
                                    fontFamily="system-ui,sans-serif"
                                    className="transition-all duration-150 select-none">
                                    {lab}
                                </text>
                                {isH && p.h > 20 && (
                                    <text x={p.x + p.w / 2} y={p.y + p.h / 2}
                                        textAnchor="middle" dominantBaseline="middle"
                                        fontSize={6.5} fontWeight={700} fill="white" fontFamily="system-ui">
                                        {val >= 1000 ? (val / 1000).toFixed(0) + "K" : val}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>

            {/* Floating tooltip */}
            {tip && (
                <div className="fixed z-50 pointer-events-none" style={{ left: tip.x + 14, top: tip.y - 50 }}>
                    <div className="rounded-xl px-3 py-2.5 text-xs shadow-2xl"
                        style={{ background: "rgba(5,10,20,0.97)", border: "1px solid rgba(255,255,255,0.12)" }}>
                        <p className="font-bold mb-1 flex items-center gap-1.5 text-white text-[11px]">
                            <span className="h-2 w-2 rounded-full" style={{ background: NC[tip.l.source] }} />
                            {tip.l.source}
                            <span className="text-white/30 mx-0.5">→</span>
                            <span className="h-2 w-2 rounded-full" style={{ background: NC[tip.l.target] }} />
                            {tip.l.target}
                        </p>
                        <p className="font-extrabold text-sm text-emerald-400">
                            {tip.l.value >= 1000 ? (tip.l.value / 1000).toFixed(1) + "K" : tip.l.value} TOE
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

/**
 * SankeyWidget — wrapper used by DashboardWidget
 * data prop is ignored (uses static EnergyData constants like the landing page)
 */
export default function SankeyWidget({ data }) {
    const [year, setYear] = useState(2022);
    return (
        <div className="flex flex-col h-full gap-2">
            {/* Year toggle */}
            <div className="flex items-center justify-between flex-shrink-0 px-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Energy Flow (TOE)</p>
                <div className="inline-flex p-0.5 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    {[2022, 2016].map(y => (
                        <button key={y} onClick={() => setYear(y)}
                            className="px-3 py-1 rounded-full text-[10px] font-bold transition-all"
                            style={{
                                background: y === year ? 'linear-gradient(135deg,#1a4a3a,#2d8a5e)' : 'transparent',
                                color: y === year ? '#fff' : '#64748b',
                            }}>
                            {y}
                        </button>
                    ))}
                </div>
            </div>
            {/* Chart */}
            <div className="flex-1 min-h-0" style={{ background: 'linear-gradient(160deg,#080e1c 0%,#0c1e14 55%,#080e1c 100%)', borderRadius: '12px', overflow: 'hidden' }}>
                <SankeyChart year={year} />
            </div>
        </div>
    );
}
