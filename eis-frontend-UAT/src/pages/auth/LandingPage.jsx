// src/pages/auth/LandingPage.jsx
// EIS Bhutan - Original good design preserved.
// ONLY upgraded: Bhutan Map section, Sankey Diagram section, Energy Trends section.
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    AreaChart, Area, PieChart, Pie, Cell, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
    Zap, Droplets, Leaf, Factory, ArrowRight, BarChart3,
    TrendingUp, Globe, ChevronRight, ChevronDown, ChevronUp, Activity,
    Shield, Database, Download, Info, ArrowUpRight, Flame, HelpCircle,
    Home, FileText
} from "lucide-react";
import PublicNavbar from "../../components/layout/PublicNavbar";
import Footer from "../../components/layout/Footer";
import { useSiteSettings } from "../../context/SiteSettingsContext";

const ICON_MAP = {
    Zap, Droplets, Leaf, Factory, BarChart3, Database, TrendingUp, Flame, Activity, Shield, Home, FileText
};

import { nationalData, dzongkhagData } from "../../constants/DzongkhagData";
import { dzongkhagPaths } from "../../constants/DzongkhagPaths";
import { energyData } from "../../constants/EnergyData";

const P = {
    forest:"#1a4a3a", teal:"#2d8a5e", mint:"#5AC994",
    navy:"#0f1f3d", gold:"#b45309", amber:"#f59e0b",
};

const NC = {
    "Domestic Production":"#15803d","Imports":"#0284c7","Hydro":"#3e6c7e",
    "Coal":"#374151","Solar/Renewables":"#eab308","Biomass":"#8c7746",
    "POL (Imported)":"#b45309","POL Distribution":"#f59e0b",
    "Coal Processing":"#64748b","Biomass Processing":"#65a30d","Residential":"#6366f1",
    "Commercial":"#8b5cf6","Industry":"#7c3aed","Transport":"#ea580c",
    "Other Sectors":"#94a3b8","Exports":"#f43f5e","Losses / Stock Adj.":"#cbd5e1",
};

const TREND = [
    {y:"2010",hydro:180000,biomass:72000,POL:68000},
    {y:"2012",hydro:198000,biomass:76000,POL:79000},
    {y:"2014",hydro:210000,biomass:80000,POL:88000},
    {y:"2016",hydro:222500,biomass:84693,POL:97500},
    {y:"2018",hydro:248000,biomass:90000,POL:108000},
    {y:"2020",hydro:272000,biomass:96000,POL:115000},
    {y:"2022",hydro:301852,biomass:100617,POL:130000},
];
const SECTORS = [
    {icon:Zap,       label:"Electricity",  desc:"Generation, transmission & consumption across all 20 dzongkhags.",      color:"#2563eb",bg:"#eff6ff"},
    {icon:Droplets,  label:"POL",          desc:"Import, export & distribution of all POL products.",                       color:"#b45309",bg:"#fef3c7"},
    {icon:Leaf,      label:"Biomass",      desc:"Fuelwood, biogas, dung cake, briquettes and agricultural residues.",      color:P.teal,   bg:"#f0fdf9"},
    {icon:Factory,   label:"Industry",     desc:"Energy consumption across manufacturing and industrial sectors.",         color:"#7c3aed",bg:"#f5f3ff"},
    {icon:BarChart3, label:"GHG Reports",  desc:"IPCC 2006 methodology greenhouse gas inventories and UNFCCC reporting.",  color:"#0891b2",bg:"#ecfeff"},
    {icon:Database,  label:"Master Data",  desc:"Conversion factors, sector classifications and reference lookup tables.", color:"#374151",bg:"#f9fafb"},
    {icon:TrendingUp,label:"Transport",    desc:"Fuel consumption across road, air and water transport segments.",         color:"#ea580c",bg:"#fff7ed"},
    {icon:Flame,     label:"Coal",         desc:"Coal production, imports, exports and end-use consumption by sector.",    color:"#78716c",bg:"#fafaf9"},
    {icon:Activity,  label:"Solar & RE",   desc:"Solar installations, off-grid systems and emerging renewable sources.",   color:"#ca8a04",bg:"#fefce8"},
];
const INTEG = [
    {abbr:"NDI",full:"National Digital Identity"},{abbr:"FIRMS",full:"Forest Info System"},
    {abbr:"eRALIS",full:"Vehicle Registration"},{abbr:"MAS",full:"Mining Admin System"},
    {abbr:"IIS",full:"Industry Info System"},{abbr:"OFS",full:"Online Filing System"},
];
const MIX_COLORS = ["#3e6c7e","#374151","#8c7746","#b45309","#eab308"];

// tooltips
function CT({active,payload,label}) {
    if(!active||!payload?.length) return null;
    return (
        <div className="bg-white/95 backdrop-blur border border-slate-200 rounded-2xl px-4 py-3 shadow-xl text-xs">
            {label&&<p className="font-bold text-slate-400 mb-2 uppercase tracking-wider text-[10px]">{label}</p>}
            {payload.map((p,i)=>(
                <div key={i} className="flex items-center gap-2 mb-1">
                    <span className="h-2 w-2 rounded-full" style={{background:p.stroke||p.fill}}/>
                    <span className="text-slate-600">{p.name}:</span>
                    <span className="font-extrabold text-slate-800">{(p.value/1000).toFixed(0)}K TOE</span>
                </div>
            ))}
        </div>
    );
}
function CTDark({active,payload,label}) {
    if(!active||!payload?.length) return null;
    return (
        <div className="rounded-xl px-3 py-2.5 text-xs shadow-2xl" style={{background:"rgba(8,14,28,0.97)",border:"1px solid rgba(255,255,255,0.1)"}}>
            {label&&<p className="font-bold mb-1.5 text-[10px] uppercase tracking-wider" style={{color:"rgba(255,255,255,0.4)"}}>{label}</p>}
            {payload.map((p,i)=>(
                <div key={i} className="flex items-center gap-2 mb-0.5 last:mb-0">
                    <span className="h-2 w-2 rounded-full" style={{background:p.stroke||p.fill}}/>
                    <span style={{color:"rgba(255,255,255,0.5)"}}>{p.name}:</span>
                    <span className="font-extrabold text-white">{(p.value/1000).toFixed(0)}K TOE</span>
                </div>
            ))}
        </div>
    );
}

// simple count-up
function CountUp({end,suffix=""}) {
    const [c,setC]=useState(0);
    useEffect(()=>{
        let s=0, duration=1500, steps=30, valStep=end/steps, tStep=duration/steps;
        const tm=setInterval(()=>{
            s++;
            if(s>=steps) { setC(end); clearInterval(tm); }
            else { setC(Math.floor(valStep*s)); }
        },tStep);
        return ()=>clearInterval(tm);
    },[end]);
    return <>{c.toLocaleString()}{suffix}</>;
}

// ── UPGRADED SANKEY ──────────────────────────────────────────────
function Sankey({year}) {
    const [hov,setHov]=useState(null);
    const [tip,setTip]=useState(null);
    const raw=energyData[year]; if(!raw) return null;
    const links=raw.links.filter(l=>l.value>0);
    const usedIds=new Set(links.flatMap(l=>[l.source,l.target]));
    const nodes=raw.nodes.filter(n=>usedIds.has(n.id)).map(n=>({...n,name:n.id}));
    const W=1100,H=520,nodeW=20;
    const CATS=["supply","source","transformation","consumption"];
    const colW=W/CATS.length;
    const totals={};
    nodes.forEach(n=>{totals[n.id]=0;});
    links.forEach(l=>{totals[l.source]=(totals[l.source]||0)+l.value;totals[l.target]=(totals[l.target]||0)+l.value;});
    const maxT=Math.max(...Object.values(totals));
    const usable=H-80;
    const pos={};
    CATS.forEach((cat,ci)=>{
        const col=nodes.filter(n=>n.category===cat&&totals[n.id]>0);
        const heights=col.map(n=>Math.max((totals[n.id]/maxT)*usable*0.72,26));
        const totalH=heights.reduce((s,h)=>s+h,0);
        const spacing=col.length>1?(usable-totalH)/(col.length-1):0;
        let y=44+(col.length===1?(usable-heights[0])/2:0);
        col.forEach((n,ni)=>{pos[n.id]={x:ci*colW+(colW-nodeW)/2,y,h:heights[ni],w:nodeW,ci};y+=heights[ni]+spacing;});
    });
    const srcOff={},tgtOff={};
    const paths=links.map((l,i)=>{
        const s=pos[l.source],t=pos[l.target]; if(!s||!t)return null;
        const lh=Math.max((l.value/totals[l.source])*s.h,2);
        const rh=Math.max((l.value/totals[l.target])*t.h,2);
        srcOff[l.source]=srcOff[l.source]||0; tgtOff[l.target]=tgtOff[l.target]||0;
        const y1=s.y+srcOff[l.source]+lh/2; const y2=t.y+tgtOff[l.target]+rh/2;
        srcOff[l.source]+=lh; tgtOff[l.target]+=rh;
        const x1=s.x+s.w,x2=t.x,c1=x1+(x2-x1)*0.42,c2=x1+(x2-x1)*0.58;
        const sc=NC[l.source]||"#94a3b8",tc=NC[l.target]||"#94a3b8";
        const isH=hov===l.source||hov===l.target;
        const op=hov?(isH?0.72:0.05):0.42;
        return (
            <g key={i}>
                <defs><linearGradient id={"sk"+i} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor={sc}/><stop offset="100%" stopColor={tc}/>
                </linearGradient></defs>
                <path d={`M${x1} ${y1-lh/2} C${c1} ${y1-lh/2},${c2} ${y2-rh/2},${x2} ${y2-rh/2} L${x2} ${y2+rh/2} C${c2} ${y2+rh/2},${c1} ${y1+lh/2},${x1} ${y1+lh/2}Z`}
                    fill={"url(#sk"+i+")"} opacity={op} className="transition-opacity duration-200 cursor-pointer"
                    onMouseEnter={e=>setTip({x:e.clientX,y:e.clientY,l})} onMouseLeave={()=>setTip(null)}/>
            </g>
        );
    });
    const COL_LABELS=["Primary Supply","Energy Sources","Transformation","Final Use"];
    const COL_COLORS=["#4ade80","#38bdf8","#818cf8","#c084fc"];
    return (
        <div className="relative w-full">
            <div className="overflow-x-auto">
                <svg viewBox={"0 0 "+W+" "+H} style={{minWidth:580,width:"100%",height:"auto"}}>
                    {COL_LABELS.map((lab,ci)=>(
                        <g key={lab}>
                            <rect x={ci*colW+8} y={8} width={colW-16} height={2.5} rx={2} fill={COL_COLORS[ci]} opacity={0.65}/>
                            <text x={ci*colW+colW/2} y={24} textAnchor="middle" fill={COL_COLORS[ci]} fontSize={9.5} fontWeight={700} letterSpacing="0.1em" fontFamily="system-ui,sans-serif">{lab.toUpperCase()}</text>
                        </g>
                    ))}
                    {paths}
                    {Object.entries(pos).map(([id,p])=>{
                        const c=NC[id]||"#64748b",isH=hov===id,val=totals[id];
                        const lab=id.length>22?id.slice(0,20)+"...":id;
                        return (
                            <g key={id} className="cursor-pointer" onMouseEnter={()=>setHov(id)} onMouseLeave={()=>setHov(null)}>
                                <rect x={p.x} y={p.y} width={p.w} height={p.h} rx={4} fill={c}
                                    opacity={hov&&!isH?0.2:1} className="transition-all duration-150"
                                    style={{filter:isH?"drop-shadow(0 0 10px "+c+"bb)":undefined}}/>
                                <text x={p.ci<2?p.x-8:p.x+p.w+8} y={p.y+p.h/2} textAnchor={p.ci<2?"end":"start"}
                                    dominantBaseline="middle" fontSize={isH?10:9} fontWeight={isH?700:500}
                                    fill={isH?c:"rgba(255,255,255,0.6)"} fontFamily="system-ui,sans-serif"
                                    className="transition-all duration-150 select-none">{lab}</text>
                                {isH&&p.h>24&&<text x={p.x+p.w/2} y={p.y+p.h/2} textAnchor="middle" dominantBaseline="middle"
                                    fontSize={7} fontWeight={700} fill="white" fontFamily="system-ui">
                                    {val>=1000?(val/1000).toFixed(0)+"K":val}</text>}
                            </g>
                        );
                    })}
                </svg>
            </div>
            {tip&&<div className="fixed z-50 pointer-events-none" style={{left:tip.x+16,top:tip.y-54}}>
                <div className="rounded-xl px-3.5 py-2.5 text-xs shadow-2xl" style={{background:"rgba(5,10,20,0.97)",border:"1px solid rgba(255,255,255,0.12)"}}>
                    <p className="font-bold mb-1 flex items-center gap-1.5 text-white">
                        <span className="h-1.5 w-1.5 rounded-full" style={{background:NC[tip.l.source]}}/>
                        {tip.l.source}<span className="text-white/25 mx-1">→</span>
                        <span className="h-1.5 w-1.5 rounded-full" style={{background:NC[tip.l.target]}}/>
                        {tip.l.target}
                    </p>
                    <p className="font-extrabold text-sm" style={{color:P.mint}}>
                        {tip.l.value>=1000?(tip.l.value/1000).toFixed(1)+"K":tip.l.value} TOE
                    </p>
                </div>
            </div>}
        </div>
    );
}

// ── UPGRADED MAP ─────────────────────────────────────────────────
function BMap({year,hov,setHov,mpos,setMpos}) {
    return (
        <svg viewBox="0 0 1000 522" className="w-full h-auto select-none cursor-pointer"
            stroke="#fff" strokeWidth={0.8}
            onMouseLeave={()=>{setHov(null);setMpos(null);}}
            onMouseMove={e=>{const r=e.currentTarget.getBoundingClientRect();setMpos({x:e.clientX-r.left,y:e.clientY-r.top,rw:r.width});}}>
            {Object.keys(dzongkhagPaths).map(id=>{
                const isH=hov===id,hasHydro=dzongkhagData[year]?.[id]?.installedCapacity!=="0";
                return (
                    <path key={id} d={dzongkhagPaths[id]}
                        fill={isH?P.mint:hasHydro?"#2d7a52":"#4f8e68"}
                        stroke={isH?"rgba(255,255,255,0.95)":"rgba(255,255,255,0.55)"}
                        strokeWidth={isH?1.8:0.7} className="transition-all duration-100"
                        style={{filter:isH?"drop-shadow(0 2px 8px rgba(90,201,148,.55))":undefined}}
                        onMouseEnter={()=>setHov(id)}/>
                );
            })}
        </svg>
    );
}

function MapTip({id,year,pos}) {
    if(!id||!pos)return null;
    const d=dzongkhagData[year]?.[id]; if(!d)return null;
    const hasHydro=d.installedCapacity!=="0";
    const flipX=pos.rw&&pos.x>pos.rw-240;
    return (
        <div className="absolute z-20 pointer-events-none" style={{left:flipX?pos.x-240:pos.x+16,top:Math.max(pos.y-132,4)}}>
            <div className="w-56 rounded-2xl overflow-hidden shadow-2xl" style={{background:"rgba(8,14,28,0.97)",backdropFilter:"blur(16px)",border:"1px solid rgba(255,255,255,0.1)"}}>
                <div className="px-4 py-3 flex items-center justify-between" style={{background:"rgba(255,255,255,0.04)",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
                    <div className="flex items-center gap-2">
                        <img src="https://flagcdn.com/w40/bt.png" alt="" className="h-3.5 rounded-sm opacity-75" onError={e=>e.target.style.display="none"}/>
                        <span className="font-extrabold text-[13px] text-white">{d.name}</span>
                    </div>
                    {hasHydro&&<span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{background:"rgba(90,201,148,0.18)",color:P.mint,border:"1px solid rgba(90,201,148,0.28)"}}>{"⚡ Hydro"}</span>}
                </div>
                <div className="px-4 py-3 grid grid-cols-2 gap-y-3 gap-x-2">
                    {[["Population",d.population+"M","#60a5fa"],["Installed",d.installedCapacity+" MW",P.mint],
                      ["Per Capita",d.consumptionPerCapita+" kWh","#a78bfa"],["TPES",d.tpes+" KTOE",P.amber],
                      ["TFEC",d.tfec+" KTOE","#34d399"],["Peak",d.peakDemand+" MW","#fb7185"]].map(([l,v,c])=>(
                        <div key={l}>
                            <p className="text-[9px] font-medium mb-0.5" style={{color:"rgba(255,255,255,0.33)"}}>{l}</p>
                            <p className="text-[11px] font-extrabold" style={{color:c}}>{v}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function YTab({year,setYear,dark=false}) {
    return (
        <div className={"inline-flex p-0.5 rounded-full border "+(dark?"border-white/20 bg-white/10":"border-slate-200 bg-slate-50")}>
            {[2022,2016].map(y=>(
                <button key={y} onClick={()=>setYear(y)} className="px-4 py-1.5 rounded-full text-xs font-bold transition-all"
                    style={{background:y===year?`linear-gradient(135deg,${P.forest},${P.teal})`:"transparent",color:y===year?"#fff":dark?"rgba(255,255,255,0.5)":"#64748b"}}>
                    {y}
                </button>
            ))}
        </div>
    );
}

export default function LandingPage() {
    const nav = useNavigate();
    const { slug } = useParams();
    const { settings } = useSiteSettings();
    const [imgIdx, setImgIdx] = useState(0);
    const [year, setYear] = useState(2022);
    const [mapHov, setMapHov] = useState(null);
    const [mpos, setMpos] = useState(null);
    const [slides, setSlides] = useState([]);
    const [faqOpen, setFaqOpen] = useState({});

    const customPages = settings?.landing_page_settings?.custom_pages || [];
    const activePage = slug ? customPages.find(p => p.slug === slug) : null;

    useEffect(() => {
        fetch('/api/admin/landing-slides/')
            .then(r => r.ok ? r.json() : [])
            .then(data => setSlides(Array.isArray(data) ? data : (data?.results || [])))
            .catch(() => {});
    }, []);

    useEffect(() => {
        if (settings?.landing_page_settings?.map_default_year) {
            setYear(parseInt(settings.landing_page_settings.map_default_year));
        }
    }, [settings?.landing_page_settings?.map_default_year]);

    const activeSlides = slides.length > 0 ? slides : [
        { image_url: "/images/hero1.jpg", title: "National Energy Information System", tagline: "Bhutan's unified platform for energy data management..." },
        { image_url: "/images/hero2.jpg", title: "Sustainable Energy Transition", tagline: "Tracking renewable energy capacity..." },
        { image_url: "/images/hero3.jpg", title: "Dynamic Flow Modeling", tagline: "Sankey diagrams, regional energy balances..." }
    ];

    const transitionSpeed = settings?.landing_page_settings?.hero_transition_speed || 4500;

    useEffect(() => {
        const t = setInterval(() => {
            setImgIdx(i => (i + 1) % activeSlides.length);
        }, transitionSpeed);
        return () => clearInterval(t);
    }, [activeSlides.length, transitionSpeed]);

    const activeYear = energyData[year] ? year : 2022;
    const nd = nationalData[activeYear], ed = energyData[activeYear];
    const totalSupply = ed.energyMix.reduce((s,d)=>s+d.value,0);
    const finalCons = ed.consumptionMix.filter(d=>!["Exports","Losses / Stock Adj."].includes(d.name)).reduce((s,d)=>s+d.value,0);
    const exports_val = ed.consumptionMix.find(d=>d.name==="Exports")?.value||0;
    const losses_val = ed.consumptionMix.find(d=>d.name==="Losses / Stock Adj.")?.value||0;

    const renderSection = (id) => {
        switch (id) {
            case "hero":
                return (
                    <div key="hero">
                        {/* HERO - original unchanged */}
                        <section className="relative min-h-screen flex items-center overflow-hidden" style={{background:`linear-gradient(135deg,${P.navy} 0%,#0d2a1f 60%,#1a1a2e 100%)`}}>
                            <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
                            <div className="absolute right-0 top-0 bottom-0 w-[55%] overflow-hidden hidden lg:block">
                                {activeSlides.map((slide, i)=>(
                                    <img key={i} src={slide.image_url || slide.image} alt="" className={"absolute inset-0 w-full h-full object-cover transition-opacity duration-[2000ms] "+(i===imgIdx?"opacity-100":"opacity-0")}/>
                                ))}
                                <div className="absolute inset-0" style={{background:`linear-gradient(to right,${P.navy} 0%,rgba(15,31,61,0.7) 30%,rgba(15,31,61,0.15) 70%,transparent 100%),linear-gradient(to top,rgba(13,42,31,0.9) 0%,transparent 50%)`}}/>
                                <div className="absolute bottom-8 right-8 text-white/30 text-[10px] font-medium tracking-widest uppercase">Bhutan · Kingdom of the Thunder Dragon</div>
                                <div className="absolute bottom-8 left-1/3 flex gap-2">
                                    {activeSlides.map((_,i)=>(
                                        <button key={i} onClick={()=>setImgIdx(i)} className="rounded-full transition-all duration-300"
                                            style={{width:i===imgIdx?24:7,height:7,background:i===imgIdx?P.mint:"rgba(255,255,255,0.3)"}}/>
                                    ))}
                                </div>
                            </div>
                            <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full opacity-[0.07] blur-3xl pointer-events-none" style={{background:P.mint}}/>
                            <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full opacity-[0.05] blur-3xl pointer-events-none" style={{background:"#60a5fa"}}/>
                            <div className="relative z-10 w-full max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 xl:px-20 pt-24 pb-16">
                                <div className="max-w-xl lg:max-w-2xl text-left">
                                    <div className="inline-flex items-center gap-2.5 mb-8 px-4 py-2 rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em]"
                                        style={{background:"rgba(90,201,148,0.12)",border:"1px solid rgba(90,201,148,0.3)",color:P.mint}}>
                                        <Globe className="h-3.5 w-3.5"/>Royal Government of Bhutan · Ministry of Energy & Natural Resources
                                    </div>
                                    <h1 className="font-black text-white leading-[1.0] tracking-tight mb-6" style={{fontSize:"clamp(2.8rem,7vw,6rem)"}}>
                                        {activeSlides[imgIdx]?.title ? (
                                            <>
                                                {activeSlides[imgIdx].title.split(' ').slice(0, 2).join(' ')}<br/>
                                                <span style={{background:`linear-gradient(135deg,${P.mint},#60d8a4,#34d399)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                                                    {activeSlides[imgIdx].title.split(' ').slice(2, 3).join(' ')}
                                                </span>
                                                <br/>{activeSlides[imgIdx].title.split(' ').slice(3).join(' ')}
                                            </>
                                        ) : (
                                            <>
                                                National<br/>
                                                <span style={{background:`linear-gradient(135deg,${P.mint},#60d8a4,#34d399)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>Energy</span>
                                                <br/>Information<br/><span className="text-white/90">System</span>
                                            </>
                                        )}
                                    </h1>
                                    <p className="text-white/60 text-[1.1rem] leading-relaxed max-w-lg mb-10">
                                        {activeSlides[imgIdx]?.tagline || "Bhutan's unified platform for energy data collection, cross-sector analytics, and IPCC-aligned GHG reporting."}
                                    </p>
                                    <div className="flex flex-wrap gap-4 mb-12">
                                        <button onClick={()=>nav(activeSlides[imgIdx]?.cta_link || "/public")} className="flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                                            style={{background:`linear-gradient(135deg,${P.mint},#34d399)`,color:P.forest}}>
                                            <BarChart3 className="h-4 w-4"/> {activeSlides[imgIdx]?.cta_text || "Live Dashboard"}
                                        </button>
                                        <button onClick={()=>nav("/public/reports")} className="flex items-center gap-2.5 px-7 py-3.5 rounded-full text-sm font-bold border-2 hover:-translate-y-0.5 transition-all text-white/90 hover:text-white hover:bg-white/10"
                                            style={{borderColor:"rgba(255,255,255,0.25)"}}>
                                            Browse Reports <ArrowRight className="h-4 w-4"/>
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-white/30 text-xs font-semibold mr-2">Tracks:</span>
                                        {[[Zap,"Electricity"],[Droplets,"POL"],[Leaf,"Biomass"],[Factory,"Industry"],[BarChart3,"GHG"],[Activity,"Solar"]].map(([Icon,label])=>(
                                            <div key={label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold transition-all hover:-translate-y-0.5"
                                                style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.7)"}}>
                                                <Icon className="h-3 w-3 flex-shrink-0"/>{label}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl lg:max-w-xl">
                                    {[{v:"2,335",u:"MW",l:"Installed Capacity",c:P.mint},{v:"605",u:"KTOE",l:"Primary Supply",c:"#60a5fa"},{v:"20",u:"",l:"Dzongkhags",c:"#a78bfa"},{v:"100%",u:"",l:"Energy Security",c:"#fb923c"}].map(({v,u,l,c})=>(
                                        <div key={l} className="rounded-2xl p-4 text-center" style={{background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",backdropFilter:"blur(8px)"}}>
                                            <p className="text-xl font-black" style={{color:c}}>{v}<span className="text-sm font-bold ml-0.5">{u}</span></p>
                                            <p className="text-[10px] font-semibold mt-0.5" style={{color:"rgba(255,255,255,0.4)"}}>{l}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="lg:absolute lg:bottom-12 lg:right-8 xl:right-16 mt-8 lg:mt-0 w-full lg:w-72 xl:w-80 flex-shrink-0">
                                    <div className="rounded-3xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                                        <div className="relative h-40 overflow-hidden">
                                            <img src="/images/R.jpg" alt="Bhutan energy infrastructure" className="absolute inset-0 w-full h-full object-cover"
                                                onError={e=>{e.target.parentElement.style.background=P.forest;e.target.style.display="none";}}/>
                                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/85"/>
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <span className="text-[9px] font-bold text-white/50 uppercase tracking-[0.18em]">Energy Infrastructure · Bhutan</span>
                                            </div>
                                        </div>
                                        <div className="p-5 text-white" style={{background:`linear-gradient(160deg,${P.navy},${P.forest})`}}>
                                            <p className="text-[10px] font-extrabold tracking-[0.2em] uppercase mb-1" style={{color:P.mint}}>About</p>
                                            <h3 className="text-base font-extrabold mb-3 leading-tight">Data-Driven Energy Policy for Bhutan</h3>
                                            <p className="text-white/55 text-[11px] leading-relaxed mb-5">A centralised repository to disseminate energy data, reduce information asymmetry, and enable high-quality research across all sectors.</p>
                                            <div className="grid grid-cols-4 gap-2 mb-5">
                                                {[["20","Dzongkhag"],["9+","Sectors"],["100%","IPCC"],["6+","Systems"]].map(([v,l])=>(
                                                    <div key={l} className="rounded-xl p-2 text-center" style={{background:"rgba(255,255,255,0.08)"}}>
                                                        <p className="text-sm font-black" style={{color:P.mint}}>{v}</p>
                                                        <p className="text-[8px] text-white/45 font-semibold uppercase leading-tight mt-0.5">{l}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <button onClick={()=>nav("/login")} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-xs font-bold border border-white/20 hover:bg-white/10 transition-colors" style={{color:P.mint}}>
                                                Access Portal <ChevronRight className="h-3.5 w-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
                                <div className="h-8 w-5 rounded-full border-2 border-white/20 flex items-start justify-center pt-1"><div className="h-2 w-0.5 rounded-full bg-white/40"/></div>
                                <span className="text-[9px] text-white/30 font-medium uppercase tracking-widest">Scroll</span>
                            </div>
                        </section>

                        {/* COUNTER STRIP */}
                        <section style={{background:`linear-gradient(135deg,${P.forest},${P.navy})`}}>
                            <div className="max-w-5xl mx-auto px-6 py-11">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 divide-x divide-white/10">
                                    {[{end:2335,sf:" MW",l:"Installed Capacity",sub:"As of 2022"},{end:605,sf:" KTOE",l:"Total Primary Supply",sub:"National 2022"},{end:20,sf:"",l:"Dzongkhags Covered",sub:"Full national coverage"},{end:100,sf:"%",l:"Energy Security",sub:"Annual target met"}].map(({end,sf,l,sub})=>(
                                        <div key={l} className="text-center pl-6 first:pl-0">
                                            <p className="font-black tabular-nums mb-1" style={{fontSize:"clamp(1.6rem,4vw,2.5rem)",color:P.mint}}><CountUp end={end} suffix={sf}/></p>
                                            <p className="text-white/85 text-xs font-bold">{l}</p>
                                            <p className="text-white/35 text-[10px] mt-0.5">{sub}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                );
            case "map":
                return (
                    <section key="map" className="py-20 bg-white border-b border-slate-100">
                        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full"
                                        style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>Regional Overview</div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight leading-tight">Bhutan Energy<br/>by Dzongkhag</h2>
                                    <p className="text-slate-400 mt-2 text-sm max-w-md">Hover any district to explore local energy data. Darker = hydro power plant district.</p>
                                </div>
                                <YTab year={year} setYear={setYear}/>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
                                <div className="lg:col-span-3 relative rounded-3xl overflow-hidden shadow-md ring-1 ring-slate-200"
                                    style={{background:"linear-gradient(150deg,#0f1f3d 0%,#0d2418 100%)"}}>
                                    <div className="absolute inset-0 pointer-events-none">
                                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full blur-3xl opacity-20" style={{background:P.teal}}/>
                                    </div>
                                    <div className="p-5 pb-1 relative">
                                        <BMap year={year} hov={mapHov} setHov={setMapHov} mpos={mpos} setMpos={setMpos}/>
                                        <MapTip id={mapHov} year={year} pos={mpos}/>
                                    </div>
                                    <div className="px-5 py-3.5 flex items-center gap-4 flex-wrap" style={{borderTop:"1px solid rgba(255,255,255,0.07)"}}>
                                        {[["#4f8e68","District"],["#2d7a52","Hydro Plant"],[P.mint,"Hovered"]].map(([c,l])=>(
                                            <span key={l} className="flex items-center gap-1.5 text-[10px] font-semibold" style={{color:"rgba(255,255,255,0.45)"}}>
                                                <span className="h-3 w-4 rounded-sm flex-shrink-0" style={{background:c}}/>{l}
                                            </span>
                                        ))}
                                        {!mapHov&&<span className="ml-auto text-[10px] italic flex items-center gap-1" style={{color:"rgba(255,255,255,0.2)"}}><Info className="h-3 w-3"/>Hover a district</span>}
                                    </div>
                                </div>
                                <div className="lg:col-span-2 flex flex-col gap-5">
                                    <div className="bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm p-5">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5" style={{color:P.teal}}>Primary Energy Mix · {year}</p>
                                        <p className="text-sm font-bold text-slate-700 mb-3">Source distribution (TOE)</p>
                                        <ResponsiveContainer width="100%" height={170}>
                                            <PieChart>
                                                <Pie data={ed.energyMix} cx="50%" cy="50%" innerRadius={50} outerRadius={74} dataKey="value" strokeWidth={2.5} stroke="#fff" paddingAngle={2}>
                                                    {ed.energyMix.map((_,i)=><Cell key={i} fill={MIX_COLORS[i%MIX_COLORS.length]}/>)}
                                                </Pie>
                                                <Tooltip formatter={v=>[((v/totalSupply)*100).toFixed(1)+"%",""]} contentStyle={{borderRadius:10,border:"1px solid #e2e8f0",fontSize:11}}/>
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 justify-center mt-1">
                                            {ed.energyMix.map((d,i)=>(
                                                <span key={d.name} className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500">
                                                    <span className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{background:MIX_COLORS[i%MIX_COLORS.length]}}/>{d.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm p-5">
                                        <p className="text-[10px] font-extrabold uppercase tracking-widest mb-3" style={{color:P.teal}}>National KPIs · {year}</p>
                                        <div className="space-y-2">
                                            {[["Installed Capacity",nd.installedCapacity+" MW","#2563eb"],["Total Primary Supply",nd.tpes+" KTOE",P.forest],["Final Energy Cons.",nd.tfec+" KTOE","#7c3aed"],["Per Capita Cons.",nd.consumptionPerCapita+" kWh",P.gold],["Peak Demand",nd.peakDemand+" MW","#0891b2"],["Population",nd.population+"M","#64748b"]].map(([l,v,c])=>(
                                                <div key={l} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                                                    <span className="text-[11px] text-slate-400 font-medium">{l}</span>
                                                    <span className="text-[11px] font-extrabold" style={{color:c}}>{v}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                );
            case "sankey":
                return (
                    <section key="sankey" className="py-0 border-b border-slate-900 relative overflow-hidden" style={{background:"linear-gradient(160deg,#080e1c 0%,#0c1e14 55%,#080e1c 100%)"}}>
                        <div className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full blur-[130px] opacity-[0.1] pointer-events-none" style={{background:P.teal}}/>
                        <div className="absolute bottom-1/4 right-1/4 h-80 w-80 rounded-full blur-[100px] opacity-[0.07] pointer-events-none" style={{background:"#2563eb"}}/>
                        <div className="absolute inset-0 opacity-[0.025]" style={{backgroundImage:"radial-gradient(rgba(255,255,255,0.7) 1px,transparent 1px)",backgroundSize:"30px 30px"}}/>
                        <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-10 pt-16 pb-8">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full"
                                        style={{background:"rgba(90,201,148,0.1)",color:P.mint,border:"1px solid rgba(90,201,148,0.22)"}}>Energy Balance</div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-2">Energy Sankey Diagram</h2>
                                    <p className="text-sm max-w-lg leading-relaxed" style={{color:"rgba(255,255,255,0.38)"}}>
                                        Complete energy flows — Primary Supply → Transformation → Final Consumption. Hover nodes and flows for values. Unit: TOE.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 flex-shrink-0">
                                    <YTab year={year} setYear={setYear} dark/>
                                    <button onClick={()=>nav("/public")} className="flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-full border transition-all hover:-translate-y-0.5"
                                        style={{borderColor:"rgba(90,201,148,0.28)",color:P.mint,background:"rgba(90,201,148,0.07)"}}>
                                        Full View <ArrowUpRight className="h-3.5 w-3.5"/>
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 flex-wrap mb-5">
                                <span className="text-[9px] font-bold uppercase tracking-wider" style={{color:"rgba(255,255,255,0.2)"}}>Nodes:</span>
                                {[["#15803d","Domestic"],["#0284c7","Imports"],["#3e6c7e","Hydro"],["#2563eb","Elec. Grid"],["#65a30d","Biomass"],["#b45309","POL"],["#7c3aed","Industry"],["#f43f5e","Exports"]].map(([c,l])=>(
                                    <span key={l} className="flex items-center gap-1.5 text-[10px] font-semibold" style={{color:"rgba(255,255,255,0.45)"}}>
                                        <span className="h-2.5 w-2.5 rounded-sm flex-shrink-0" style={{background:c}}/>{l}
                                    </span>
                                ))}
                                <span className="ml-auto text-[10px] italic flex items-center gap-1" style={{color:"rgba(255,255,255,0.18)"}}><Info className="h-3 w-3"/>Hover nodes &amp; flows</span>
                            </div>
                        </div>
                        <div className="relative z-10 max-w-[1320px] mx-auto px-2 sm:px-4 lg:px-6">
                            <Sankey year={year}/>
                        </div>
                        <div className="relative z-10 max-w-[1320px] mx-auto px-6 lg:px-10 pt-6 pb-14">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[{l:"Total Supply",v:(totalSupply/1000).toFixed(0)+"K TOE",c:P.mint,sub:"All primary sources",icon:"⚡"},{l:"Final Consumption",v:(finalCons/1000).toFixed(0)+"K TOE",c:"#a78bfa",sub:"Excl. exports & losses",icon:"🏠"},{l:"Electricity Export",v:(exports_val/1000).toFixed(0)+"K TOE",c:"#fb7185",sub:"Cross-border export",icon:"🔌"},{l:"Losses & Adj.",v:(losses_val/1000).toFixed(0)+"K TOE",c:"#64748b",sub:"Distribution losses",icon:"📉"}].map(({l,v,c,sub,icon})=>(
                                    <div key={l} className="rounded-2xl px-5 py-4 text-center" style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)"}}>
                                        <p className="text-xl mb-1">{icon}</p>
                                        <p className="text-base font-extrabold mb-0.5" style={{color:c}}>{v}</p>
                                        <p className="text-[11px] font-bold" style={{color:"rgba(255,255,255,0.55)"}}>{l}</p>
                                        <p className="text-[9px] mt-0.5" style={{color:"rgba(255,255,255,0.22)"}}>{sub}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-5 flex items-center justify-center gap-2 flex-wrap">
                                {["Primary Sources","→","Energy Carriers","→","Transformation","→","Consumption","→","Exports"].map((t,i)=>(
                                    <span key={i} className={"text-xs "+(t!=="→"?"font-semibold":"")} style={{color:t==="→"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.28)"}}>{t}</span>
                                ))}
                                <span className="text-[10px] italic sm:ml-4" style={{color:"rgba(255,255,255,0.15)"}}>· TOE = Tonnes of Oil Equivalent · EDD Master Files</span>
                            </div>
                        </div>
                    </section>
                );
            case "trends":
                return (
                    <section key="trends" className="py-20 bg-white border-b border-slate-100">
                        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
                                <div>
                                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full"
                                        style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>Historical Data</div>
                                    <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">Energy Trends 2010–2022</h2>
                                    <p className="text-slate-400 mt-2 text-sm">Values in Tonnes of Oil Equivalent. Source: EDD Calculation Master Files.</p>
                                </div>
                                <button onClick={()=>nav("/public")} className="self-start flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold transition-all hover:-translate-y-0.5" style={{background:P.forest+"0d",color:P.forest}}>
                                    Full Dashboard <ArrowRight className="h-3.5 w-3.5"/>
                                </button>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="rounded-3xl overflow-hidden shadow-lg" style={{background:"linear-gradient(160deg,#0d1f14,#0a1628)"}}>
                                    <div className="px-6 pt-6 pb-2 flex items-start justify-between">
                                        <div>
                                            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-0.5" style={{color:P.mint}}>Supply Trends</p>
                                            <p className="text-base font-bold text-white">Hydro · Biomass · POL</p>
                                            <p className="text-[11px] mt-0.5" style={{color:"rgba(255,255,255,0.3)"}}>Tonnes of Oil Equivalent · 2010–2022</p>
                                        </div>
                                        <div className="flex gap-3 mt-1">
                                            {[["Hydro",P.teal],["Biomass","#65a30d"],["POL",P.gold]].map(([n,c])=>(
                                                <span key={n} className="flex items-center gap-1 text-[9px] font-semibold" style={{color:"rgba(255,255,255,0.4)"}}>
                                                    <span className="h-1.5 w-1.5 rounded-full" style={{background:c}}/>{n}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <AreaChart data={TREND} margin={{left:5,right:10,top:5,bottom:10}}>
                                            <defs>
                                                {[[P.teal,"tH"],["#65a30d","tB"],[P.gold,"tP"]].map(([c,id])=>(
                                                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor={c} stopOpacity={.55}/>
                                                        <stop offset="95%" stopColor={c} stopOpacity={0}/>
                                                    </linearGradient>
                                                ))}
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false}/>
                                            <XAxis dataKey="y" tick={{fill:"rgba(255,255,255,0.3)",fontSize:11}} axisLine={false} tickLine={false}/>
                                            <YAxis tick={{fill:"rgba(255,255,255,0.3)",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>(v/1000).toFixed(0)+"K"}/>
                                            <Tooltip content={<CTDark/>}/>
                                            <Area type="monotone" dataKey="hydro"   name="Hydro"     stroke={P.teal}  strokeWidth={2.5} fill="url(#tH)"/>
                                            <Area type="monotone" dataKey="biomass" name="Biomass"   stroke="#65a30d" strokeWidth={2.5} fill="url(#tB)"/>
                                            <Area type="monotone" dataKey="POL"     name="POL"       stroke={P.gold}  strokeWidth={2.5} fill="url(#tP)"/>
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-white rounded-3xl ring-1 ring-slate-100 shadow-sm p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-[10px] font-extrabold uppercase tracking-widest mb-0.5" style={{color:P.teal}}>Final Consumption · {year}</p>
                                            <p className="text-base font-bold text-slate-800">By Sector</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">Thousand Tonnes of Oil Equivalent</p>
                                        </div>
                                        <YTab year={year} setYear={setYear}/>
                                    </div>
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={ed.consumptionMix.filter(d=>!["Exports","Losses / Stock Adj."].includes(d.name)).map(d=>({...d,value:Math.round(d.value/1000)}))} margin={{left:-5,right:5,top:5,bottom:20}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                                            <XAxis dataKey="name" tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} angle={-15} textAnchor="end" height={45}/>
                                            <YAxis tick={{fill:"#94a3b8",fontSize:10}} axisLine={false} tickLine={false} tickFormatter={v=>v+"K"}/>
                                            <Tooltip formatter={v=>[v+"K TOE",""]} contentStyle={{borderRadius:12,border:"1px solid #e2e8f0",fontSize:11,boxShadow:"0 8px 24px rgba(0,0,0,0.1)"}}/>
                                            <Bar dataKey="value" radius={[7,7,0,0]} maxBarSize={52}>
                                                {ed.consumptionMix.filter(d=>!["Exports","Losses / Stock Adj."].includes(d.name)).map((d,i)=><Cell key={i} fill={d.color}/>)}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                {[{l:"Hydro Supply",v22:301852,v16:222500,unit:"TOE",c:P.teal,ic:"💧"},{l:"POL",v22:130000,v16:97500,unit:"TOE",c:"#b45309",ic:"🛢️"},{l:"Biomass",v22:100617,v16:84693,unit:"TOE",c:"#65a30d",ic:"🌿"},{l:"Installed Cap.",v22:2335,v16:1614,unit:"MW",c:"#2563eb",ic:"⚡"}].map(({l,v22,v16,unit,c,ic})=>{
                                    const pct=(((v22-v16)/v16)*100).toFixed(1);
                                    return (
                                        <div key={l} className="rounded-2xl p-5 flex flex-col" style={{background:c+"08",border:"1px solid "+c+"1a"}}>
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-lg">{ic}</span>
                                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600">↑ {pct}%</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 mb-1">{l}</p>
                                            <p className="text-xl font-extrabold" style={{color:c}}>{v22>=1000?(v22/1000).toFixed(0)+"K":v22}<span className="text-xs font-semibold text-slate-400 ml-1">{unit}</span></p>
                                            <p className="text-[10px] text-slate-400 mt-1">from {v16>=1000?(v16/1000).toFixed(0)+"K":v16} in 2016</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                );
            case "sectors":
                return (
                    <section key="sectors" className="py-20 border-b border-slate-100" style={{background:"#f6fbf8"}}>
                        <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>Coverage</div>
                                <h2 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">All Energy Sectors</h2>
                                <p className="text-slate-400 mt-3 max-w-xl mx-auto text-sm leading-relaxed">Every energy stream in Bhutan — from primary supply to final consumption — systematically tracked, verified, and published.</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {(settings?.landing_body_sectors?.length > 0 ? settings.landing_body_sectors.map(sec => ({
                                    icon: ICON_MAP[sec.icon] || Zap,
                                    label: sec.label,
                                    desc: sec.desc,
                                    color: sec.color,
                                    bg: sec.bg
                                })) : SECTORS).map(({icon:Icon,label,desc,color,bg})=>(
                                    <div key={label} className="group rounded-2xl border border-slate-100 p-6 hover:shadow-lg hover:border-transparent hover:-translate-y-0.5 transition-all cursor-default" style={{background:bg}}>
                                        <div className="h-11 w-11 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{background:color+"18",color}}>
                                            <Icon className="h-5 w-5"/>
                                        </div>
                                        <h3 className="font-extrabold text-slate-800 text-[15px] mb-2">{label}</h3>
                                        <p className="text-slate-500 text-sm leading-relaxed">{desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                );
            case "faqs":
                return settings?.landing_faqs?.length > 0 ? (
                    <section key="faqs" className="py-20 bg-white border-b border-slate-100">
                        <div className="max-w-4xl mx-auto px-6 lg:px-10">
                            <div className="text-center mb-12">
                                <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>FAQ</div>
                                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Frequently Asked Questions</h2>
                                <p className="text-slate-400 mt-2 text-sm">Find answers to common questions about the Bhutan Energy Information System.</p>
                            </div>
                            <div className="space-y-4">
                                {settings.landing_faqs.filter(faq => faq.is_active !== false).map((faq, idx) => (
                                    <div key={idx} className="border border-slate-200/60 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/20 hover:shadow-sm transition-all duration-300">
                                        <button
                                            onClick={() => setFaqOpen(o => ({ ...o, [idx]: !o[idx] }))}
                                            className="w-full flex justify-between items-center px-6 py-5 font-bold text-slate-800 dark:text-slate-200 text-sm text-left hover:text-indigo-650 transition-colors"
                                        >
                                            <span className="flex items-center gap-2.5">
                                                <HelpCircle className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                                                {faq.question}
                                            </span>
                                            {faqOpen[idx] ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                                        </button>
                                        {faqOpen[idx] && (
                                            <div className="px-6 pb-6 text-slate-500 dark:text-slate-400 text-xs leading-relaxed border-t border-slate-100 dark:border-slate-700/50 pt-4 text-left">
                                                {faq.answer}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                ) : null;
            default:
                if (id && id.startsWith('sec_')) {
                    const customSecs = settings?.landing_page_settings?.custom_sections || [];
                    const secData = customSecs.find(s => s.id === id);
                    if (!secData) return null;

                    switch (secData.type) {
                        case 'rich_text':
                            return (
                                <section key={id} className="py-20 bg-white border-b border-slate-100">
                                    <div className="max-w-[1000px] mx-auto px-6 text-center animate-fade-in">
                                        {secData.content?.subtitle && (
                                            <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-4 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>
                                                {secData.content.subtitle}
                                            </div>
                                        )}
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">{secData.content?.title || secData.name}</h2>
                                        <p className="text-slate-650 text-sm leading-relaxed whitespace-pre-line max-w-3xl mx-auto">{secData.content?.body}</p>
                                    </div>
                                </section>
                            );
                        case 'feature_grid':
                            return (
                                <section key={id} className="py-20 bg-slate-50 border-b border-slate-100">
                                    <div className="max-w-[1320px] mx-auto px-6 lg:px-10 text-center">
                                        {secData.content?.subtitle && (
                                            <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-4 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>
                                                {secData.content.subtitle}
                                            </div>
                                        )}
                                        <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-12">{secData.content?.title || secData.name}</h2>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {(secData.content?.cards || []).map((card, idx) => {
                                                const CardIcon = ICON_MAP[card.icon] || Zap;
                                                return (
                                                    <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-all duration-300 text-left">
                                                        <div className="h-12 w-12 rounded-2xl flex items-center justify-center mb-6" style={{background:(card.color || P.teal)+"14", color: card.color || P.teal}}>
                                                            <CardIcon className="h-5 w-5" />
                                                        </div>
                                                        <h3 className="font-extrabold text-slate-800 text-base mb-2">{card.label}</h3>
                                                        <p className="text-slate-550 text-sm leading-relaxed mb-4">{card.desc}</p>
                                                        {card.link && (
                                                            <button onClick={() => nav(card.link)} className="flex items-center gap-1.5 text-xs font-extrabold hover:gap-3 transition-all" style={{color: card.color || P.teal}}>
                                                                Explore <ArrowRight className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </section>
                            );
                        case 'banner':
                            return (
                                <section key={id} className="py-16 text-white border-b border-slate-100" style={{background: secData.content?.bg_color || `linear-gradient(135deg, ${P.forest}, ${P.teal})`}}>
                                    <div className="max-w-4xl mx-auto px-6 text-center">
                                        <h2 className="text-3xl font-black mb-3 tracking-tight">{secData.content?.title || secData.name}</h2>
                                        <p className="text-white/85 text-sm mb-8 max-w-xl mx-auto">{secData.content?.subtitle}</p>
                                        {secData.content?.cta_text && (
                                            <button onClick={() => nav(secData.content.cta_link || '/')} className="px-6 py-2.5 bg-white text-slate-950 font-bold text-xs rounded-full hover:bg-slate-50 shadow-md transition-all">
                                                {secData.content.cta_text}
                                            </button>
                                        )}
                                    </div>
                                </section>
                            );
                        default:
                            return null;
                    }
                }
                return null;
        }
    };

    const activeSections = activePage ? activePage.sections_order : (settings?.landing_page_settings?.sections_order || [
        {id: "hero", name: "Hero Slideshow", enabled: settings?.landing_page_settings?.show_hero_slideshow !== false},
        {id: "map", name: "Bhutan Energy by Dzongkhag (Map)", enabled: settings?.landing_page_settings?.show_bhutan_map !== false},
        {id: "sankey", name: "Energy Sankey Diagram", enabled: settings?.landing_page_settings?.show_sankey_diagram !== false},
        {id: "trends", name: "Energy Trends 2010–2022", enabled: settings?.landing_page_settings?.show_energy_trends !== false},
        {id: "sectors", name: "All Energy Sectors", enabled: settings?.landing_page_settings?.show_sectors_grid !== false},
        {id: "faqs", name: "FAQs Accordions", enabled: settings?.landing_page_settings?.show_faqs !== false}
    ]);

    return (
        <div className="min-h-screen flex flex-col bg-slate-50 antialiased" style={{fontFamily:"system-ui,sans-serif"}}>
            <PublicNavbar/>

            {/* Custom Page Sleek Header Banner if Hero is not present */}
            {activePage && !activeSections.some(s => s.id === "hero" && s.enabled !== false) && (
                <section className="relative pt-32 pb-16 text-center border-b border-slate-100" style={{background:`linear-gradient(135deg,${P.navy} 0%,#0d2a1f 100%)`}}>
                    <div className="absolute inset-0 opacity-[0.04]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
                    <div className="relative z-10 max-w-4xl mx-auto px-6">
                        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">{activePage.title}</h1>
                        <p className="text-emerald-400 text-[10px] font-black tracking-[0.25em] uppercase">EIS Bhutan Layout Profile</p>
                    </div>
                </section>
            )}

            {/* Dynamic layout builder sections */}
            {activeSections.map(sec => {
                if (sec.enabled === false) return null;
                return renderSection(sec.id);
            })}

            {/* OPEN DATA — original static */}
            <section className="py-20 bg-white border-b border-slate-100">
                <div className="max-w-[1320px] mx-auto px-6 lg:px-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-10">
                        <div>
                            <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>Open Access</div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Explore Public Energy Data</h2>
                            <p className="text-slate-400 mt-2 text-sm">No login required — interactive dashboards and free downloadable reports.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[{icon:BarChart3,label:"Energy Dashboard",desc:"Interactive charts covering electricity, petroleum, biomass, solar and industrial energy across 2016 & 2022.",tag:"Live",accent:P.teal,route:"/public"},{icon:Activity,label:"Energy Balance",desc:"Full Sankey diagram showing energy flows from primary supply through transformation to final consumption.",tag:"2016 & 2022",accent:P.navy,route:"/public"},{icon:Download,label:"Published Reports",desc:"Download national energy balance reports, GHG inventories, and sector analyses as PDFs — completely free.",tag:"Free PDF",accent:P.gold,route:"/public/reports"}].map(({icon:Icon,label,desc,tag,accent,route})=>(
                            <button key={label} onClick={()=>nav(route)} className="group text-left rounded-3xl ring-1 ring-slate-100 bg-white p-7 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300">
                                <div className="flex items-start justify-between mb-6">
                                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center" style={{background:accent+"14",color:accent}}><Icon className="h-5 w-5"/></div>
                                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full border" style={{color:accent,borderColor:accent+"30",background:accent+"08"}}>{tag}</span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-base mb-2">{label}</h3>
                                <p className="text-slate-500 text-sm leading-relaxed mb-5">{desc}</p>
                                <div className="flex items-center gap-1.5 text-xs font-extrabold group-hover:gap-3 transition-all" style={{color:accent}}>Explore <ArrowRight className="h-3.5 w-3.5"/></div>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* INTEGRATIONS — original static */}
            <section className="py-16 border-b border-slate-100" style={{background:"#f6fbf8"}}>
                <div className="max-w-5xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.22em] mb-3 px-3 py-1.5 rounded-full" style={{background:P.forest+"0d",color:P.forest,border:"1px solid "+P.forest+"25"}}>Ecosystem</div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2 tracking-tight">Integrated Government Systems</h2>
                    <p className="text-slate-400 text-sm mb-10 max-w-lg mx-auto">EIS connects with key national platforms to automate data collection, verification, and cross-sector analysis.</p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                        {(settings?.landing_body_integrations?.length > 0 ? settings.landing_body_integrations : INTEG).map(({abbr,full,a,f})=>(
                            <div key={abbr || a} className="flex flex-col items-center p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all">
                                <div className="h-11 w-11 rounded-2xl mb-2 flex items-center justify-center text-white text-sm font-black animate-pulse" style={{background:`linear-gradient(135deg,${P.forest},${P.teal})`}}>{(abbr || a)[0]}</div>
                                <p className="font-extrabold text-slate-800 text-sm">{abbr || a}</p>
                                <p className="text-slate-400 text-[9px] mt-0.5 text-center leading-tight">{full || f}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA - original */}
            <section className="py-28 relative overflow-hidden" style={{background:`linear-gradient(145deg,${P.navy} 0%,#0d2a1f 50%,#1a1a2e 100%)`}}>
                <div className="absolute inset-0 opacity-[0.03]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",backgroundSize:"48px 48px"}}/>
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full opacity-[0.06] blur-3xl pointer-events-none" style={{background:P.mint}}/>
                <div className="absolute top-1/2 right-1/4 translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full opacity-[0.05] blur-3xl pointer-events-none" style={{background:"#60a5fa"}}/>
                <div className="relative max-w-3xl mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] mb-7 px-4 py-2 rounded-full border border-white/10 text-white/40">
                        <Shield className="h-3 w-3"/> Secure Government Portal
                    </div>
                    <h2 className="font-black text-white mb-5 tracking-tight leading-tight" style={{fontSize:"clamp(2.4rem,5vw,4rem)"}}>
                        Access the Full<br/><span style={{background:`linear-gradient(135deg,${P.mint},#34d399)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>EIS Portal</span>
                    </h2>
                    <p className="text-white/50 text-lg mb-10 leading-relaxed max-w-xl mx-auto">Government officials, data focal points and energy analysts can log in via NDI or agency credentials to submit data, generate advanced reports and access full analytics.</p>
                    <div className="flex flex-wrap gap-4 justify-center">
                        <button onClick={()=>nav("/login")} className="flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-black shadow-2xl hover:-translate-y-0.5 transition-all"
                            style={{background:`linear-gradient(135deg,${P.mint},#34d399)`,color:P.forest}}>
                            Login to Portal <ArrowRight className="h-4 w-4"/>
                        </button>
                        <button onClick={()=>nav("/public")} className="flex items-center gap-2.5 px-8 py-4 rounded-full text-sm font-bold border-2 border-white/20 text-white hover:bg-white/8 hover:-translate-y-0.5 transition-all">
                            <BarChart3 className="h-4 w-4"/> Public Dashboard
                        </button>
                    </div>
                    <p className="text-white/20 text-xs mt-8">NDI login · Agency credentials · Data updated periodically · FY 2025–26</p>
                </div>
            </section>
            <Footer/>
        </div>
    );
}