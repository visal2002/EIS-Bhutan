import React, { useMemo, useState } from 'react';
import { MousePointer2 } from 'lucide-react';
import { dzongkhagPaths } from '../../../../constants/DzongkhagPaths';
import { dzongkhagData } from '../../../../constants/DzongkhagData';

/**
 * BhutanChoropleth — Fixed version
 * Correctly maps API label names → BT codes using dzongkhagData name→code table.
 */
export default function BhutanChoropleth({ data = [] }) {
    const [hovered, setHovered] = useState(null);

    // Build name→code lookup from dzongkhagData (use 2022 as canonical)
    const nameToCode = useMemo(() => {
        const map = {};
        const yearData = dzongkhagData[2022] || {};
        Object.entries(yearData).forEach(([code, info]) => {
            if (info?.name) {
                // Store both exact and normalised versions
                map[info.name.toLowerCase().trim()] = code;
                // Also strip common suffixes
                const stripped = info.name.toLowerCase().replace(/dzongkhag/gi, '').trim();
                map[stripped] = code;
            }
        });
        // Manual aliases for common DB name variations
        const ALIASES = {
            'tashi yangtse': 'BTTY',
            'trashiyangtse': 'BTTY',
            'tashiyangtse': 'BTTY',
            'lhuntse': 'BT44',
            'lhuntshi': 'BT44',
            'lhuentse': 'BT44',
            'haa': 'BT13',
            'ha': 'BT13',
            'chhukha': 'BT12',
            'chukha': 'BT12',
            'sarpang': 'BT31',
            'zhemgang': 'BT34',
            'samdrup jongkhar': 'BT45',
            'trashigang': 'BT41',
            'tashigang': 'BT41',
            'thimphu': 'BT15',
            'paro': 'BT11',
            'gasa': 'BTGA',
            'tsirang': 'BT21',
            'wangdue phodrang': 'BT24',
            'wangdi phodrang': 'BT24',
            'dagana': 'BT22',
            'punakha': 'BT23',
            'mongar': 'BT42',
            'trongsa': 'BT32',
            'pemagatshel': 'BT43',
            'bumthang': 'BT33',
            'samtse': 'BT14',
        };
        return { ...map, ...ALIASES };
    }, []);

    // Map API data [{label, value}] → { code: value }
    const codeValues = useMemo(() => {
        const result = {};
        if (!Array.isArray(data)) return result;
        data.forEach(item => {
            if (!item?.label) return;
            const key = item.label.toLowerCase().trim();
            const code = nameToCode[key];
            if (code) {
                result[code] = (result[code] || 0) + (item.value || 0);
            }
        });
        return result;
    }, [data, nameToCode]);

    const maxVal = useMemo(() => {
        const vals = Object.values(codeValues);
        return vals.length ? Math.max(...vals, 1) : 1;
    }, [codeValues]);

    const getInfo = (code) => {
        const yearData = dzongkhagData[2022] || {};
        return yearData[code] || null;
    };

    const getColor = (code) => {
        const val = codeValues[code];
        if (!val) return '#c8d5b9'; // light green for no-data
        const intensity = val / maxVal;
        if (intensity > 0.85) return '#064e3b';
        if (intensity > 0.65) return '#065f46';
        if (intensity > 0.45) return '#047857';
        if (intensity > 0.25) return '#10b981';
        if (intensity > 0.10) return '#34d399';
        return '#6ee7b7';
    };

    const hovInfo = hovered ? getInfo(hovered) : null;
    const hovVal  = hovered ? codeValues[hovered] : null;

    return (
        <div className="relative w-full h-full flex flex-col bg-slate-50/50 rounded-xl overflow-hidden select-none">

            {/* Map */}
            <div className="relative flex-1 min-h-0 flex items-center justify-center p-2">
                <svg
                    viewBox="0 0 1000 522"
                    className="w-full h-full max-h-[95%]"
                    preserveAspectRatio="xMidYMid meet"
                >
                    <g filter="drop-shadow(0 3px 8px rgba(0,0,0,0.10))">
                        {Object.entries(dzongkhagPaths).map(([code, pathD]) => {
                            const isH = hovered === code;
                            return (
                                <path
                                    key={code}
                                    d={pathD}
                                    fill={isH ? '#f59e0b' : getColor(code)}
                                    stroke="white"
                                    strokeWidth={isH ? 2 : 0.7}
                                    className="cursor-pointer transition-all duration-150"
                                    style={{ filter: isH ? 'drop-shadow(0 2px 8px rgba(245,158,11,0.5))' : undefined }}
                                    onMouseEnter={() => setHovered(code)}
                                    onMouseLeave={() => setHovered(null)}
                                >
                                    <title>{getInfo(code)?.name || code}: {codeValues[code]?.toFixed(1) ?? 'No data'} GWh</title>
                                </path>
                            );
                        })}
                    </g>
                </svg>

                {/* Hover Tooltip */}
                {hovered && hovInfo && (
                    <div className="absolute top-3 right-3 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-3.5 rounded-2xl shadow-2xl z-20 pointer-events-none min-w-[160px]">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Dzongkhag</p>
                        <h4 className="text-base font-black text-slate-800 dark:text-white leading-tight">{hovInfo.name}</h4>
                        {hovVal != null ? (
                            <div className="flex items-baseline gap-1 mt-1.5">
                                <span className="text-xl font-black text-emerald-600">{hovVal.toFixed(1)}</span>
                                <span className="text-[9px] font-bold text-slate-400 uppercase">GWh</span>
                            </div>
                        ) : (
                            <p className="text-[10px] text-slate-400 mt-1">No data available</p>
                        )}
                        {hovInfo.installedCapacity !== '0' && (
                            <div className="mt-1.5 flex items-center gap-1">
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">⚡ {hovInfo.installedCapacity} MW Hydro</span>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg shadow-sm">
                    <MousePointer2 className="h-2.5 w-2.5 text-emerald-500" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Hover to explore</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex gap-0.5 h-2 w-32 rounded-full overflow-hidden border border-slate-200">
                        {['#6ee7b7','#34d399','#10b981','#047857','#065f46','#064e3b'].map(c => (
                            <div key={c} className="flex-1" style={{ background: c }} />
                        ))}
                    </div>
                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Low → High (GWh)</p>
                </div>
            </div>
        </div>
    );
}
