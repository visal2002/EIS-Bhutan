// src/pages/admin/BlockBuilder.jsx
// Visualization Block Builder — right-side drawer with live preview
import { useState, useEffect } from 'react';
import { X, Check, ChevronRight } from 'lucide-react';
import {
    BarChart, Bar, LineChart, Line, AreaChart, Area,
    PieChart as RPieChart, Pie, Cell, ScatterChart, Scatter,
    XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

// Block types are now passed via props from the backend

const CATEGORIES = [
    { id: 'all',     label: 'All' },
    { id: 'chart',   label: '📊 Charts' },
    { id: 'geo',     label: '🗺️ Geo / Map' },
    { id: 'table',   label: '📋 Table' },
    { id: 'content', label: '📝 Content' },
];

const PIE_COLORS = ['#6366f1','#2d8a5e','#0284c7','#b45309','#7c3aed','#0891b2','#e11d48','#f59e0b'];

const SAMPLE_BAR   = [{name:'Hydro',value:4800},{name:'Solar',value:1200},{name:'Biomass',value:890},{name:'Diesel',value:560},{name:'Coal',value:310}];
const SAMPLE_LINE  = [{year:'2017',val:3200},{year:'2018',val:3800},{year:'2019',val:3500},{year:'2020',val:4100},{year:'2021',val:4600},{year:'2022',val:5100}];
const SAMPLE_PIE   = [{name:'Electricity',value:55},{name:'Petroleum',value:22},{name:'Biomass',value:14},{name:'Solar',value:9}];
const SAMPLE_SCATTER = [{x:12,y:45},{x:34,y:78},{x:56,y:32},{x:78,y:90},{x:23,y:56},{x:45,y:67}];
const SAMPLE_ROWS  = [{d:'Thimphu',t:'245',f:'198',c:'360'},{d:'Chhukha',t:'189',f:'145',c:'1480'},{d:'Paro',t:'134',f:'112',c:'0'},{d:'Wangdue',t:'98',f:'82',c:'720'}];

function LivePreview({ block }) {
    const c = block.color || '#6366f1';
    const isArea  = block.chart_variant === 'area';
    const isDonut = block.chart_variant === 'donut';
    const wrap = (ch) => (
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm">
            <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full flex-shrink-0" style={{background:c}} />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{block.title||'Untitled Block'}</p>
            </div>
            <div className="p-3">{ch}</div>
        </div>
    );
    if (block.type==='bar_chart') return wrap(
        <ResponsiveContainer width="100%" height={150}>
            <BarChart data={SAMPLE_BAR} margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)"/>
                <XAxis dataKey="name" tick={{fontSize:9,fill:'#94a3b8'}}/>
                <YAxis tick={{fontSize:9,fill:'#94a3b8'}}/>
                <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
                <Bar dataKey="value" fill={c} radius={[4,4,0,0]}/>
            </BarChart>
        </ResponsiveContainer>
    );
    if (block.type==='line_chart') {
        const C=isArea?AreaChart:LineChart; const D=isArea?Area:Line;
        return wrap(
            <ResponsiveContainer width="100%" height={150}>
                <C data={SAMPLE_LINE} margin={{top:4,right:4,left:-20,bottom:0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)"/>
                    <XAxis dataKey="year" tick={{fontSize:9,fill:'#94a3b8'}}/>
                    <YAxis tick={{fontSize:9,fill:'#94a3b8'}}/>
                    <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
                    <D type="monotone" dataKey="val" stroke={c} fill={isArea?c+'33':undefined} strokeWidth={2} dot={false}/>
                </C>
            </ResponsiveContainer>
        );
    }
    if (block.type==='pie_chart') return wrap(
        <ResponsiveContainer width="100%" height={150}>
            <RPieChart>
                <Pie data={SAMPLE_PIE} cx="50%" cy="50%" innerRadius={isDonut?36:0} outerRadius={60} dataKey="value" stroke="none">
                    {SAMPLE_PIE.map((_,i)=><Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
                <Legend wrapperStyle={{fontSize:9}}/>
            </RPieChart>
        </ResponsiveContainer>
    );
    if (block.type==='scatter_chart') return wrap(
        <ResponsiveContainer width="100%" height={150}>
            <ScatterChart margin={{top:4,right:4,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)"/>
                <XAxis dataKey="x" type="number" tick={{fontSize:9,fill:'#94a3b8'}}/>
                <YAxis dataKey="y" type="number" tick={{fontSize:9,fill:'#94a3b8'}}/>
                <Tooltip contentStyle={{fontSize:10,borderRadius:8}}/>
                <Scatter data={SAMPLE_SCATTER} fill={c}/>
            </ScatterChart>
        </ResponsiveContainer>
    );
    if (block.type==='sankey_viz') return wrap(
        <div className="h-32 flex items-center justify-center"><div className="text-center"><div className="text-4xl mb-1">🌊</div><p className="text-xs text-slate-500 font-semibold">Sankey Flow Diagram</p><p className="text-[10px] text-slate-400">Data: {block.data_source||'energy flow (auto)'}</p></div></div>
    );
    if (block.type==='map_viz') return wrap(
        <div className="h-32 flex items-center justify-center bg-gradient-to-br from-emerald-950/30 to-teal-900/20 rounded-xl"><div className="text-center"><div className="text-4xl mb-1">🗺️</div><p className="text-xs text-slate-500 font-semibold">Bhutan Map</p><p className="text-[10px] text-slate-400">Metric: {block.map_metric||'tfec'}</p></div></div>
    );
    if (block.type==='data_table') return wrap(
        <div className="overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-700">
            <table className="w-full text-[9px]">
                <thead><tr className="bg-slate-50 dark:bg-slate-700">{['Dzongkhag','TPES','TFEC','Cap.'].map(h=><th key={h} className="px-2 py-1.5 text-left font-bold text-slate-500">{h}</th>)}</tr></thead>
                <tbody>{SAMPLE_ROWS.map((r,i)=><tr key={i} className="border-t border-slate-100 dark:border-slate-700"><td className="px-2 py-1.5 font-semibold text-slate-700 dark:text-slate-300">{r.d}</td><td className="px-2 py-1.5 text-slate-500">{r.t}</td><td className="px-2 py-1.5 text-slate-500">{r.f}</td><td className="px-2 py-1.5 font-bold" style={{color:parseInt(r.c)>0?'#2d8a5e':'#94a3b8'}}>{r.c}</td></tr>)}</tbody>
            </table>
        </div>
    );
    if (block.type==='stat_cards') return wrap(
        <div className="grid grid-cols-2 gap-2">
            {[['TPES','4,821','KTOE','#6366f1'],['Capacity','2,335','MW','#2d8a5e'],['Renewable','96.4','%','#0284c7'],['Per Capita','1,842','kWh','#b45309']].map(([l,v,u,col])=>(
                <div key={l} className="rounded-xl p-2 bg-slate-50 dark:bg-slate-700 border border-slate-100 dark:border-slate-600">
                    <p className="text-[8px] text-slate-400 font-semibold mb-0.5">{l}</p>
                    <p className="text-sm font-extrabold" style={{color:col}}>{v}<span className="text-[9px] font-normal text-slate-400 ml-1">{u}</span></p>
                </div>
            ))}
        </div>
    );
    if (block.type==='rich_text') return wrap(
        <div className="space-y-1.5 px-1">
            {block.content?.subtitle&&<p className="text-[8px] font-black tracking-widest uppercase" style={{color:c}}>{block.content.subtitle}</p>}
            <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100 leading-tight">{block.content?.title||'Section Title'}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed line-clamp-3">{block.content?.body||'Your content text will appear here...'}</p>
        </div>
    );
    if (block.type==='banner') return wrap(
        <div className="rounded-xl py-5 px-4 text-center" style={{background:block.content?.bg_color||`linear-gradient(135deg, ${c}, ${c}99)`}}>
            <p className="text-sm font-extrabold text-white mb-1">{block.content?.title||'Your Banner Title'}</p>
            <p className="text-[10px] text-white/70 mb-2">{block.content?.subtitle||'Subtitle text'}</p>
            {block.content?.cta_text&&<span className="inline-block bg-white/20 text-white text-[9px] font-bold px-3 py-1.5 rounded-full border border-white/30">{block.content.cta_text}</span>}
        </div>
    );
    if (block.type==='feature_grid') {
        const cards = block.content?.cards?.length>0?block.content.cards.slice(0,4):[{label:'Feature 1',desc:'Desc',color:'#6366f1'},{label:'Feature 2',desc:'Desc',color:'#2d8a5e'},{label:'Feature 3',desc:'Desc',color:'#b45309'},{label:'Feature 4',desc:'Desc',color:'#0891b2'}];
        return wrap(<div className="grid grid-cols-2 gap-2">{cards.map((c2,i)=><div key={i} className="rounded-xl p-2.5 border border-slate-100 dark:border-slate-600" style={{borderLeftColor:c2.color,borderLeftWidth:3}}><p className="text-[10px] font-extrabold text-slate-700 dark:text-slate-200">{c2.label}</p><p className="text-[8px] text-slate-400 mt-0.5">{c2.desc}</p></div>)}</div>);
    }
    return wrap(<div className="h-20 flex items-center justify-center text-slate-400 text-xs">Select a type to preview</div>);
}

function TypeConfig({ block, onChange }) {
    const upd = (k,v) => onChange({...block,[k]:v});
    const updC = (k,v) => onChange({...block,content:{...(block.content||{}),[k]:v}});
    const ic = "w-full rounded-xl bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30";
    const lc = "text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1";
    const DS = [{value:'energyData',label:'Energy Balance (by year)'},{value:'dzongkhagData',label:'Dzongkhag Energy Data'},{value:'energyTrends',label:'Energy Trends 2010–2022'},{value:'sectorsData',label:'All Energy Sectors'},{value:'custom_json',label:'Custom JSON (manual)'}];
    const isChart = ['bar_chart','line_chart','pie_chart','scatter_chart','sankey_viz','map_viz'].includes(block.type);
    return (
        <div className="space-y-4">
            <div><label className={lc}>Block Title <span className="text-rose-500">*</span></label><input className={ic} value={block.title||''} onChange={e=>upd('title',e.target.value)} placeholder="e.g. Energy Consumption by Dzongkhag"/></div>
            <div><label className={lc}>Description (subtitle)</label><input className={ic} value={block.description||''} onChange={e=>upd('description',e.target.value)} placeholder="Brief description..."/></div>
            <div className="grid grid-cols-2 gap-3">
                <div><label className={lc}>Accent Color</label>
                    <div className="flex items-center gap-2">
                        <input type="color" value={block.color||'#6366f1'} onChange={e=>upd('color',e.target.value)} className="h-9 w-12 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white"/>
                        <input className={ic} value={block.color||'#6366f1'} onChange={e=>upd('color',e.target.value)}/>
                    </div>
                </div>
                {isChart&&<div><label className={lc}>Data Source</label>
                    <select className={ic} value={block.data_source||''} onChange={e=>upd('data_source',e.target.value)}>
                        <option value="">-- Select Data Source --</option>
                        {DS.map(d=><option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                </div>}
            </div>
            {block.type==='bar_chart'&&<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Orientation</label><select className={ic} value={block.chart_variant||'vertical'} onChange={e=>upd('chart_variant',e.target.value)}><option value="vertical">Vertical</option><option value="horizontal">Horizontal</option></select></div>
                <div><label className={lc}>X-Axis Label</label><input className={ic} value={block.x_label||''} onChange={e=>upd('x_label',e.target.value)} placeholder="e.g. Source"/></div>
                <div><label className={lc}>Y-Axis Label</label><input className={ic} value={block.y_label||''} onChange={e=>upd('y_label',e.target.value)} placeholder="e.g. KTOE"/></div>
                <div><label className={lc}>Legend</label><select className={ic} value={block.show_legend??'true'} onChange={e=>upd('show_legend',e.target.value)}><option value="true">Show</option><option value="false">Hide</option></select></div>
            </div>}
            {block.type==='line_chart'&&<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Variant</label><select className={ic} value={block.chart_variant||'line'} onChange={e=>upd('chart_variant',e.target.value)}><option value="line">Line</option><option value="area">Area (filled)</option></select></div>
                <div><label className={lc}>Curve</label><select className={ic} value={block.curve_type||'monotone'} onChange={e=>upd('curve_type',e.target.value)}><option value="monotone">Smooth</option><option value="linear">Linear</option><option value="step">Step</option></select></div>
                <div><label className={lc}>X-Axis Field</label><input className={ic} value={block.x_key||'year'} onChange={e=>upd('x_key',e.target.value)}/></div>
                <div><label className={lc}>Y-Axis Label</label><input className={ic} value={block.y_label||''} onChange={e=>upd('y_label',e.target.value)} placeholder="e.g. KTOE"/></div>
            </div>}
            {block.type==='pie_chart'&&<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Variant</label><select className={ic} value={block.chart_variant||'pie'} onChange={e=>upd('chart_variant',e.target.value)}><option value="pie">Full Pie</option><option value="donut">Donut</option></select></div>
                <div><label className={lc}>Value Field</label><input className={ic} value={block.value_key||'value'} onChange={e=>upd('value_key',e.target.value)}/></div>
            </div>}
            {block.type==='scatter_chart'&&<div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>X Field</label><input className={ic} value={block.x_key||'x'} onChange={e=>upd('x_key',e.target.value)}/></div>
                <div><label className={lc}>Y Field</label><input className={ic} value={block.y_key||'y'} onChange={e=>upd('y_key',e.target.value)}/></div>
                <div><label className={lc}>X Label</label><input className={ic} value={block.x_label||''} onChange={e=>upd('x_label',e.target.value)}/></div>
                <div><label className={lc}>Y Label</label><input className={ic} value={block.y_label||''} onChange={e=>upd('y_label',e.target.value)}/></div>
            </div>}
            {block.type==='sankey_viz'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Default Year</label><select className={ic} value={block.default_year||'2022'} onChange={e=>upd('default_year',e.target.value)}><option value="2022">2022</option><option value="2016">2016</option></select></div>
                <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl border border-teal-200 dark:border-teal-800 text-[10px] text-teal-700 dark:text-teal-300">ℹ️ Data fetched automatically from the energy balance database.</div>
            </div>}
            {block.type==='map_viz'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Default Year</label><select className={ic} value={block.default_year||'2022'} onChange={e=>upd('default_year',e.target.value)}><option value="2022">2022</option><option value="2016">2016</option></select></div>
                    <div><label className={lc}>Map Metric</label><select className={ic} value={block.map_metric||'tfec'} onChange={e=>upd('map_metric',e.target.value)}><option value="tfec">TFEC (KTOE)</option><option value="tpes">TPES (KTOE)</option><option value="installedCapacity">Capacity (MW)</option><option value="peakDemand">Peak Demand (MW)</option><option value="consumptionPerCapita">Per Capita (kWh)</option></select></div>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[10px] text-emerald-700 dark:text-emerald-300">ℹ️ Map uses dzongkhag energy database with hover tooltips.</div>
            </div>}
            {block.type==='data_table'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Rows/Page</label><select className={ic} value={block.page_size||'10'} onChange={e=>upd('page_size',e.target.value)}>{['5','10','20','50','All'].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
                    <div><label className={lc}>Sorting</label><select className={ic} value={block.sortable??'true'} onChange={e=>upd('sortable',e.target.value)}><option value="true">Allow</option><option value="false">Fixed</option></select></div>
                </div>
                <div><label className={lc}>Column Headers (comma-separated)</label><input className={ic} value={block.columns||''} onChange={e=>upd('columns',e.target.value)} placeholder="Dzongkhag, TPES, TFEC, Capacity"/></div>
            </div>}
            {block.type==='stat_cards'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Layout Columns</label><select className={ic} value={block.columns||'4'} onChange={e=>upd('columns',e.target.value)}>{['2','3','4','6'].map(n=><option key={n} value={n}>{n} columns</option>)}</select></div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[10px] text-amber-700 dark:text-amber-300">ℹ️ KPI values fetched from energy database. Add metric config once APIs are ready.</div>
            </div>}
            {block.type==='rich_text'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Category Tag</label><input className={ic} value={block.content?.subtitle||''} onChange={e=>updC('subtitle',e.target.value)} placeholder="e.g. OVERVIEW"/></div>
                <div><label className={lc}>Main Heading</label><input className={ic} value={block.content?.title||''} onChange={e=>updC('title',e.target.value)} placeholder="Section heading..."/></div>
                <div><label className={lc}>Body Text</label><textarea rows={4} className={ic} value={block.content?.body||''} onChange={e=>updC('body',e.target.value)} placeholder="Your paragraph..."/></div>
            </div>}
            {block.type==='banner'&&<div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                <div><label className={lc}>Banner Title</label><input className={ic} value={block.content?.title||''} onChange={e=>updC('title',e.target.value)} placeholder="Big title"/></div>
                <div><label className={lc}>Subtitle</label><input className={ic} value={block.content?.subtitle||''} onChange={e=>updC('subtitle',e.target.value)} placeholder="Supporting text"/></div>
                <div className="grid grid-cols-2 gap-3">
                    <div><label className={lc}>Button Label</label><input className={ic} value={block.content?.cta_text||''} onChange={e=>updC('cta_text',e.target.value)} placeholder="Get Started"/></div>
                    <div><label className={lc}>Button Link</label><input className={ic} value={block.content?.cta_link||''} onChange={e=>updC('cta_link',e.target.value)} placeholder="/public"/></div>
                </div>
                <div><label className={lc}>Background (CSS)</label><input className={ic} value={block.content?.bg_color||''} onChange={e=>updC('bg_color',e.target.value)} placeholder="linear-gradient(135deg,#1a4a3a,#0d6b50)"/></div>
            </div>}
            {block.type==='feature_grid'&&<div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800 text-[10px] text-indigo-700 dark:text-indigo-300 mt-2">ℹ️ Feature cards are configured in the "Custom Sections" tab and referenced here.</div>}
        </div>
    );
}

export default function BlockBuilder({ open, onClose, onSave, initialBlock, blockTypes = [] }) {
    const [step, setStep] = useState('pick');
    const [catFilter, setCatFilter] = useState('all');
    const [block, setBlock] = useState(null);

    useEffect(() => {
        if (open) {
            if (initialBlock) { setBlock(initialBlock); setStep('configure'); }
            else { setBlock(null); setStep('pick'); }
            setCatFilter('all');
        }
    }, [open, initialBlock]);

    const filtered = catFilter === 'all' ? blockTypes : blockTypes.filter(b => b.category === catFilter);

    const handleSelect = (bt) => {
        setBlock({ id:'blk_'+Date.now(), type:bt.id, title:'', description:'', color:bt.color, data_source:'', content:{title:'',subtitle:'',body:'',cta_text:'',cta_link:'',bg_color:'',cards:[]} });
        setStep('configure');
    };

    const handleSave = () => {
        if (!block?.title?.trim()) { alert('Please enter a block title.'); return; }
        onSave(block);
        onClose();
    };

    return (
        <>
            <div className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${open?'opacity-100 pointer-events-auto':'opacity-0 pointer-events-none'}`} onClick={onClose}/>
            <div className={`fixed top-0 right-0 z-50 h-full w-full max-w-2xl bg-white dark:bg-slate-900 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${open?'translate-x-0':'translate-x-full'}`}>
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        {step==='configure'&&<button onClick={()=>setStep('pick')} className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><ChevronRight className="h-4 w-4 rotate-180 text-slate-500"/></button>}
                        <div>
                            <h2 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                                {step==='pick'?'🧩 Choose Visualization Type':`⚙️ Configure — ${blockTypes.find(b=>b.id===block?.type)?.label||''}`}
                            </h2>
                            <p className="text-[10px] text-slate-400 mt-0.5">{step==='pick'?'Select the type of visualization or content block to create.':'Set up the block title, data source, and display options.'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"><X className="h-4 w-4 text-slate-500"/></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    {step==='pick'&&(
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIES.map(cat=>(
                                    <button key={cat.id} onClick={()=>setCatFilter(cat.id)}
                                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${catFilter===cat.id?'bg-indigo-600 text-white shadow-sm':'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'}`}>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {filtered.map(bt=>(
                                    <button key={bt.id} onClick={()=>handleSelect(bt)}
                                        className="text-left p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20 bg-white dark:bg-slate-800 transition-all duration-200 group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-2xl">{bt.icon}</span>
                                                <div>
                                                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{bt.label}</p>
                                                    <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{background:bt.color+'22',color:bt.color}}>{bt.category}</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-indigo-500 transition-colors"/>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">{bt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step==='configure'&&block&&(
                        <div className="flex flex-1 overflow-hidden">
                            <div className="flex-1 p-5 space-y-4 overflow-y-auto border-r border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-xl">{blockTypes.find(b=>b.id===block.type)?.icon}</span>
                                    <div>
                                        <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{blockTypes.find(b=>b.id===block.type)?.label}</p>
                                        <p className="text-[9px] text-slate-400">{blockTypes.find(b=>b.id===block.type)?.desc}</p>
                                    </div>
                                </div>
                                <TypeConfig block={block} onChange={setBlock}/>
                            </div>
                            <div className="w-72 flex-shrink-0 p-4 bg-slate-50 dark:bg-slate-800/60 space-y-3 overflow-y-auto">
                                <p className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">Live Preview</p>
                                <LivePreview block={block}/>
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-[9px] text-amber-600 dark:text-amber-400 leading-relaxed">
                                    <strong>Preview note:</strong> Sample data shown. Real data loads from the database when rendered on a public page.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step==='configure'&&(
                    <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex-shrink-0">
                        <button onClick={()=>setStep('pick')} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">← Change Type</button>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                            <button onClick={handleSave} className="px-5 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 shadow-md transition-all inline-flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5"/> Save Block
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
