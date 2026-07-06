// src/pages/admin/data-collection/DataCollectionImportEngine.jsx
import { useState, useRef, useEffect } from 'react';
import { Upload, Download, X, AlertTriangle, RefreshCw, ChevronRight, CheckCircle2, ArrowRight, Building2, Search } from 'lucide-react';
import { apiFetch } from '../../../services/api';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

const normalizeKey = (s) => (s || '').toLowerCase().replace(/[\s_-]/g, '');

export function GenericImportEngine({ config, onClose, onSuccess }) {
    const { title, api, templateHeaders, templateExample } = config;
    // phases: select | mapping | plant-picker | preview
    const [phase, setPhase] = useState('select');
    const [file, setFile] = useState(null);
    const [csvHeaders, setCsvHeaders] = useState([]);
    const [mapping, setMapping] = useState({});
    
    // Plant picker state
    const [plantPickerRequired, setPlantPickerRequired] = useState(false);
    const [plants, setPlants] = useState([]);
    const [plantsLoading, setPlantsLoading] = useState(false);
    const [selectedPlant, setSelectedPlant] = useState(null);
    const [plantSearch, setPlantSearch] = useState('');

    // Preview States
    const [previewStats, setPreviewStats] = useState({ total: 0, ready: 0, errors: 0, cols: 0 });
    const [previewData, setPreviewData] = useState([]);
    const [importMode, setImportMode] = useState('create_only');
    const [duplicateWarning, setDuplicateWarning] = useState(null);

    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef(null);

    // ── Fetch plants when plant-picker phase activates ──────────────────────
    const plantFieldConfig = config.fields?.find(f => f.key === 'plant');
    const plantApiUrl = plantFieldConfig?.apiUrl;

    useEffect(() => {
        if (phase === 'plant-picker' && plantApiUrl && plants.length === 0) {
            setPlantsLoading(true);
            apiFetch(plantApiUrl)
                .then(r => r.json())
                .then(data => setPlants(data.results || data))
                .catch(() => setPlants([]))
                .finally(() => setPlantsLoading(false));
        }
    }, [phase, plantApiUrl]);

    const filteredPlants = plants.filter(p => {
        const q    = plantSearch.toLowerCase();
        const name = (p[plantFieldConfig?.apiLabel] || p.plant_name || p.name || '').toLowerCase();
        const acro = (p.acronym || '').toLowerCase();
        return name.includes(q) || acro.includes(q);
    });


    const downloadTemplate = () => {
        const csv = [
            templateHeaders.join(','),
            templateExample,
            '# Delete this comment row before importing',
        ].join('\n') + '\n';
        const a = document.createElement('a');
        a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
        a.download = `${title.toLowerCase().replace(/[\s/]+/g, '-')}-template.csv`;
        a.click();
    };

    const handleFileSelect = async (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        setFile(f);
        setError('');

        try {
            let rawHeaders = [];
            const isExcel = f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls');
            const isJson = f.name.toLowerCase().endsWith('.json');

            if (isJson) {
                const text = await f.text();
                const data = JSON.parse(text);
                const rows = Array.isArray(data) ? data : (data.results || [data]);
                if (rows.length === 0) throw new Error("File is empty.");
                rawHeaders = Object.keys(rows[0]) || [];
            } else if (isExcel) {
                const data = await f.arrayBuffer();
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                if (json.length === 0) throw new Error("File is empty.");
                rawHeaders = json[0] || [];
            } else {
                // Read first few KB to extract headers for CSV
                const slice = f.slice(0, 4096);
                const text = await slice.text();
                
                // Basic CSV header parser for the first line
                const firstLine = text.split(/\r?\n/)[0];
                if (!firstLine) throw new Error("File is empty.");
                
                let cur = '', inQ = false;
                for (let i = 0; i < firstLine.length; i++) {
                    const ch = firstLine[i];
                    if (ch === '"') { inQ = !inQ; continue; }
                    if (ch === ',' && !inQ) { rawHeaders.push(cur.trim()); cur = ''; continue; }
                    cur += ch;
                }
                rawHeaders.push(cur.trim());
            }
            
            if (rawHeaders.length === 0) throw new Error("No columns found.");
            
            setCsvHeaders(rawHeaders);
            
            // Auto map using fuzzy matching
            const norm = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
            const initialMap = {};
            templateHeaders.forEach(th => {
                const normTh = norm(th);
                const exactMatch = rawHeaders.find(h => norm(h) === normTh);
                if (exactMatch) {
                    initialMap[th] = exactMatch;
                } else {
                    const partialMatch = rawHeaders.find(h => {
                        const nh = norm(h);
                        return (nh.length > 3 && normTh.length > 3) && (nh.includes(normTh) || normTh.includes(nh));
                    });
                    initialMap[th] = partialMatch || '';
                }
            });
            
            setMapping(initialMap);
            setPhase('mapping');

            // Check for previous uploads of the same file
            try {
                const jobRes = await apiFetch('/admin/import-jobs/');
                if (jobRes.ok) {
                    const jobData = await jobRes.json();
                    const duplicate = (jobData.results || []).find(j => 
                        j.original_filename === f.name && 
                        (j.status === 'completed' || j.status === 'processing')
                    );
                    if (duplicate) {
                        setDuplicateWarning(duplicate);
                        setImportMode('create_and_update'); // default to update mode to prevent dupes
                    } else {
                        setDuplicateWarning(null);
                        setImportMode('create_only');
                    }
                }
            } catch (err) {
                // Ignore error for non-critical check
            }
        } catch (err) {
            setError(`Failed to read headers: ${err.message}`);
        }
    };

    const generatePreview = () => {
        // Check if plant is required but not mapped → go to plant-picker phase first
        const hasPiantField = templateHeaders.includes('plant');
        const plantMapped = !!mapping['plant'];
        if (hasPiantField && !plantMapped && !selectedPlant) {
            setPlantPickerRequired(true);
            setPhase('plant-picker');
            return;
        }

        // Ensure all other required template headers are mapped
        const missing = templateHeaders.filter(th => {
            if (th === 'plant') return false; // handled via plant picker
            const fieldConfig = config.fields?.find(f => 
                normalizeKey(f.label) === normalizeKey(th) || 
                normalizeKey(f.key) === normalizeKey(th)
            );
            const isOptional = fieldConfig ? !fieldConfig.required : (th.toLowerCase() === 'remarks');
            return !mapping[th] && !isOptional;
        });
        if (missing.length > 0) {
            setError(`Please map the following required fields: ${missing.join(', ')}`);
            return;
        }

        setError('');

        const processData = (data) => {
            const total = data.length;
            let ready = 0;
            let errors = 0;
            const preview = [];
            
            const mappedColsCount = Object.keys(mapping).filter(k => mapping[k]).length;

            for (let i = 0; i < total; i++) {
                const row = data[i];
                let hasError = false;
                const mappedRow = {};
                
                templateHeaders.forEach(th => {
                    const csvCol = mapping[th];
                    let val = csvCol ? row[csvCol] : null;

                    // If this is the plant column and came from picker, show human-readable label
                    if (th === 'plant' && !csvCol && selectedPlant) {
                        const plantLabel = plantFieldConfig?.apiLabel;
                        const name  = selectedPlant[plantLabel] || selectedPlant.plant_name || selectedPlant.name || '';
                        const acro  = selectedPlant.acronym ? ` (${selectedPlant.acronym})` : '';
                        val = `${name}${acro}`;
                    }

                    mappedRow[th] = val;
                    
                    const fieldConfig = config.fields?.find(f => 
                        normalizeKey(f.label) === normalizeKey(th) || 
                        normalizeKey(f.key) === normalizeKey(th)
                    );
                    const isOptional = fieldConfig ? !fieldConfig.required : (th.toLowerCase() === 'remarks');
                    // Basic validation — plant filled via picker is valid
                    if (!isOptional) {
                        const filled = th === 'plant' && selectedPlant
                            ? true
                            : !(val === null || val === undefined || String(val).trim() === '');
                        if (!filled) hasError = true;
                    }
                });

                if (hasError) errors++;
                else ready++;

                if (i < 500) {
                    preview.push({
                        _row: i + 1,
                        _status: hasError ? 'Error' : 'Ready',
                        ...mappedRow
                    });
                }
            }

            setPreviewStats({ total, ready, errors, cols: mappedColsCount });
            setPreviewData(preview);
            setPhase('preview');
        };

        const isExcel = file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');
        const isJson = file.name.toLowerCase().endsWith('.json');
        
        if (isJson) {
            file.text().then(text => {
                const data = JSON.parse(text);
                const json = Array.isArray(data) ? data : (data.results || [data]);
                processData(json);
            }).catch(err => {
                setError(`Failed to parse JSON file: ${err.message}`);
            });
        } else if (isExcel) {
            file.arrayBuffer().then(buffer => {
                const workbook = XLSX.read(buffer, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { defval: null });
                processData(json);
            }).catch(err => {
                setError(`Failed to parse Excel file: ${err.message}`);
            });
        } else {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: (results) => {
                    processData(results.data);
                },
                error: (err) => {
                    setError(`Failed to parse CSV file: ${err.message}`);
                }
            });
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('file', file);
        formData.append('mode', importMode);
        formData.append('header_mapping', JSON.stringify(mapping));

        // If a plant was selected in the picker, inject it as the fallback
        if (selectedPlant) {
            formData.append('default_plant_id', String(selectedPlant.id));
        }

        try {
            const [basePath, existingQuery] = api.split('?');
            let url = basePath.endsWith('/') ? `${basePath}bulk-import/` : `${basePath}/bulk-import/`;
            
            const params = new URLSearchParams(existingQuery || '');
            if (config.params && Object.keys(config.params).length > 0) {
                Object.entries(config.params).forEach(([k, v]) => params.set(k, v));
            }
            const qs = params.toString();
            if (qs) url += `?${qs}`;
            const res = await apiFetch(url, {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (res.ok) {
                onSuccess?.(data.job_id);
            } else {
                setError(data.detail || 'Failed to start import job.');
            }
        } catch (err) {
            setError('Network error: ' + err.message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in">
            <div className={`w-full bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${phase === 'preview' ? 'max-w-5xl h-[90vh]' : 'max-w-2xl'}`} onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center border border-indigo-100 dark:border-indigo-800 flex-shrink-0">
                            <Upload className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Import {title}</h2>
                            {phase === 'preview' ? (
                                <p className="text-xs font-medium text-slate-500 mt-0.5">
                                    {previewStats.total.toLocaleString()} rows · {previewStats.errors.toLocaleString()} errors · {previewStats.ready.toLocaleString()} ready · showing first {Math.min(500, previewStats.total).toLocaleString()}
                                </p>
                            ) : (
                                <div className="flex items-center gap-2 mt-1">
                                        <span className={`text-xs font-semibold ${phase === 'select' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Select File</span>
                                        <ChevronRight className="h-3 w-3 text-slate-300" />
                                        <span className={`text-xs font-semibold ${phase === 'mapping' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Map Columns</span>
                                        {plantPickerRequired && (
                                            <>
                                                <ChevronRight className="h-3 w-3 text-slate-300" />
                                                <span className={`text-xs font-semibold ${phase === 'plant-picker' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`}>Select Plant</span>
                                            </>
                                        )}
                                        <ChevronRight className="h-3 w-3 text-slate-300" />
                                        <span className={`text-xs font-semibold text-slate-400`}>Preview</span>
                                    </div>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="h-8 w-8 rounded-xl flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-900/20">
                    {phase === 'select' && (
                        <div className="px-6 py-10 max-w-xl mx-auto">
                            <div className="flex items-center justify-between mb-6">
                                <p className="text-sm text-slate-500">Upload a CSV file with the required columns.</p>
                                <button onClick={downloadTemplate} className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1">
                                    <Download className="h-4 w-4" /> Template
                                </button>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm mb-6">
                                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Required columns</p>
                                <div className="flex flex-wrap gap-2">
                                    {templateHeaders.map(h => <span key={h} className="text-xs font-mono px-2 py-1 rounded bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">{h}</span>)}
                                </div>
                            </div>

                            <div 
                                className={`border-2 border-dashed rounded-xl py-14 text-center cursor-pointer transition-all bg-white dark:bg-slate-800
                                    ${file ? 'border-primary-400 bg-primary-50/20' : 'border-slate-300 dark:border-slate-600 hover:border-primary-400 hover:bg-primary-50/10'}`}
                                onClick={() => fileRef.current?.click()}
                            >
                                <Upload className={`h-10 w-10 mx-auto mb-4 ${file ? 'text-primary-500' : 'text-slate-300'}`} />
                                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {file ? file.name : "Click to choose or drag & drop"}
                                </p>
                                <p className="text-xs text-slate-400 mt-2">.csv, .xlsx, .xls, .json files supported</p>
                                <input ref={fileRef} type="file" accept=".csv,.tsv,.xlsx,.xls,.json" onChange={handleFileSelect} className="hidden" />
                            </div>
                            
                            {error && (
                                <div className="mt-6 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'mapping' && (
                        <div className="px-6 py-8 max-w-2xl mx-auto space-y-6">
                            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">Match your uploaded columns to the required system fields.</p>
                            
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 uppercase tracking-wider text-[10px] font-bold text-slate-500">
                                            <th className="px-5 py-3 text-left w-1/2">System Field</th>
                                            <th className="px-5 py-3 text-left w-1/2">Your Column</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                        {templateHeaders.map(th => {
                                            const fieldConfig = config.fields?.find(f => 
                                                normalizeKey(f.label) === normalizeKey(th) || 
                                                normalizeKey(f.key) === normalizeKey(th)
                                            );
                                            const isOptional = fieldConfig ? !fieldConfig.required : (th.toLowerCase() === 'remarks');
                                            const isMapped = !!mapping[th];
                                            return (
                                                <tr key={th} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-5 py-3.5">
                                                        <div className="flex items-center gap-2.5">
                                                            {isMapped ? (
                                                                <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                                                            ) : isOptional ? (
                                                                <CheckCircle2 className="h-4 w-4 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                                                            ) : (
                                                                <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                                                            )}
                                                            <span className="font-semibold text-slate-800 dark:text-slate-200">{th}</span>
                                                            {isOptional ? (
                                                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Optional</span>
                                                            ) : (
                                                                <span className="text-[10px] uppercase font-bold text-rose-500 tracking-wider">Required</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-3.5">
                                                        <select
                                                            className={`w-full px-3 py-2 rounded-xl border text-sm focus:ring-2 outline-none transition-colors appearance-none font-medium
                                                                ${isMapped 
                                                                    ? 'border-slate-200 dark:border-slate-600 focus:border-indigo-500 focus:ring-indigo-500/20 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200' 
                                                                    : (isOptional ? 'border-slate-200 bg-slate-50 text-slate-500 focus:ring-slate-500/20' : 'border-amber-300 bg-amber-50 text-amber-700 focus:ring-amber-500/20')}`}
                                                            value={mapping[th] || ''}
                                                            onChange={e => setMapping(prev => ({ ...prev, [th]: e.target.value }))}
                                                        >
                                                            <option value="">-- Ignore / Do not map --</option>
                                                            {csvHeaders.map(ch => (
                                                                <option key={ch} value={ch}>{ch}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {error && (
                                <div className="mt-4 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Plant Picker Phase ─────────────────────────────────────── */}
                    {phase === 'plant-picker' && (
                        <div className="px-6 py-8 max-w-xl mx-auto space-y-5">
                            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700">
                                <Building2 className="h-5 w-5 text-amber-500 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Plant column missing in your file</p>
                                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">Select a plant below — it will be applied to <strong>all rows</strong> in this import.</p>
                                </div>
                            </div>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <input
                                    type="text"
                                    placeholder="Search plants..."
                                    value={plantSearch}
                                    onChange={e => setPlantSearch(e.target.value)}
                                    className="w-full h-10 pl-9 pr-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-primary-500/20 outline-none"
                                />
                            </div>

                            {/* Plant list */}
                            {plantsLoading ? (
                                <div className="flex items-center justify-center py-10 text-slate-400">
                                    <RefreshCw className="h-5 w-5 animate-spin mr-2" /> Loading plants...
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                                    {filteredPlants.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-6">No plants found.</p>
                                    )}
                                    {filteredPlants.map(p => {
                                        const label = p[plantFieldConfig?.apiLabel] || p.plant_name || p.name;
                                        const isSelected = selectedPlant?.id === p.id;
                                        return (
                                            <button
                                                key={p.id}
                                                onClick={() => setSelectedPlant(p)}
                                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border text-left transition-all ${
                                                    isSelected
                                                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-primary-300 hover:bg-primary-50/50'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-xs font-black ${
                                                        isSelected ? 'bg-primary-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                                                    }`}>
                                                        {(p.acronym || label || '?').slice(0, 3).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{label}</p>
                                                        {p.acronym && <p className="text-[11px] text-slate-400 font-mono">{p.acronym}</p>}
                                                    </div>
                                                </div>
                                                {isSelected && <CheckCircle2 className="h-5 w-5 text-primary-500 flex-shrink-0" />}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {error && (
                                <div className="flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-rose-600">{error}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {phase === 'preview' && (
                        <div className="p-6 h-full flex flex-col gap-6">

                            {/* Selected Plant Banner — only when plant came from picker */}
                            {selectedPlant && (
                                <div className="flex-shrink-0 flex items-center justify-between gap-4 px-5 py-3.5 bg-primary-50 dark:bg-primary-900/20 rounded-2xl border border-primary-200 dark:border-primary-700/50">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-primary-500 flex items-center justify-center flex-shrink-0">
                                            <span className="text-xs font-black text-white">
                                                {(selectedPlant.acronym || selectedPlant[plantFieldConfig?.apiLabel] || selectedPlant.plant_name || '?').slice(0, 3).toUpperCase()}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-primary-500 dark:text-primary-400">Plant applied to all rows</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                                    {selectedPlant[plantFieldConfig?.apiLabel] || selectedPlant.plant_name || selectedPlant.name}
                                                </span>
                                                {selectedPlant.acronym && (
                                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700 font-mono tracking-wider">
                                                        {selectedPlant.acronym}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setSelectedPlant(null); setPhase('plant-picker'); }}
                                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-200 underline underline-offset-2 transition-colors flex-shrink-0"
                                    >
                                        Change plant
                                    </button>
                                </div>
                            )}

                            {/* Stats Cards */}
                            <div className="grid grid-cols-4 gap-4 flex-shrink-0">
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{previewStats.total.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Total Rows</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{previewStats.ready.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Ready</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">{previewStats.errors.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Errors</span>
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex flex-col items-center justify-center text-center shadow-sm">
                                    <span className="text-2xl font-black text-slate-800 dark:text-slate-100">{previewStats.cols}</span>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">Columns</span>
                                </div>
                            </div>

                            {/* Mode Selection */}
                            <div className="grid grid-cols-2 gap-4 flex-shrink-0">
                                <label className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${importMode === 'create_only' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300'}`}>
                                    <input type="radio" name="importMode" value="create_only" className="mt-1 h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500" checked={importMode === 'create_only'} onChange={() => setImportMode('create_only')} />
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Create only</span>
                                        <span className="block text-xs text-slate-500 mt-0.5">Skip existing records</span>
                                    </div>
                                </label>
                                <label className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all ${importMode === 'create_and_update' ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-300'}`}>
                                    <input type="radio" name="importMode" value="create_and_update" className="mt-1 h-4 w-4 text-emerald-600 border-slate-300 focus:ring-emerald-500" checked={importMode === 'create_and_update'} onChange={() => setImportMode('create_and_update')} />
                                    <div className="ml-3">
                                        <span className="block text-sm font-bold text-slate-800 dark:text-slate-200">Create & Update</span>
                                        <span className="block text-xs text-slate-500 mt-0.5">Update if already exists</span>
                                    </div>
                                </label>
                            </div>

                            {/* Data Preview */}
                            <div className="flex-1 min-h-0 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
                                <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Preview (first {Math.min(500, previewStats.total).toLocaleString()} of {previewStats.total.toLocaleString()})</h3>
                                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        Show all {Math.min(500, previewStats.total).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead className="sticky top-0 bg-white dark:bg-slate-800 shadow-sm z-10">
                                            <tr className="uppercase tracking-wider text-[10px] font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm">
                                                <th className="px-4 py-3 font-semibold">Row</th>
                                                <th className="px-4 py-3 font-semibold">Status</th>
                                                {templateHeaders.map(th => (
                                                    <th key={th} className="px-4 py-3 font-semibold">{th}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                            {previewData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                    <td className="px-4 py-2 text-xs font-medium text-slate-400">{row._row}</td>
                                                    <td className="px-4 py-2">
                                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border
                                                            ${row._status === 'Ready' 
                                                                ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:border-emerald-800' 
                                                                : 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-900/30 dark:border-rose-800'}`}>
                                                            {row._status}
                                                        </span>
                                                    </td>
                                                    {templateHeaders.map(th => (
                                                        <td key={th} className={`px-4 py-2 text-xs ${!row[th] ? 'text-rose-400 italic' : 'text-slate-600 dark:text-slate-300'}`}>
                                                            {row[th] || '(empty)'}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Duplicate Warning */}
                            {duplicateWarning && (
                                <div className="flex-shrink-0 flex items-start gap-3 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-700/50">
                                    <AlertTriangle className="h-5 w-5 text-indigo-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">
                                            This file was previously imported.
                                        </p>
                                        <p className="text-xs text-indigo-700 dark:text-indigo-400 mt-1 leading-relaxed">
                                            A file named <span className="font-semibold">"{duplicateWarning.original_filename}"</span> was uploaded on {new Date(duplicateWarning.created_at).toLocaleDateString()}. 
                                            We've automatically selected <strong>Create & Update</strong> to prevent duplicate records. Please verify before importing.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Warning Alert */}
                            {previewStats.errors > 0 && (
                                <div className="flex-shrink-0 flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-700/50">
                                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                            {previewStats.errors.toLocaleString()} rows have validation errors.
                                        </p>
                                        <p className="text-xs text-amber-700 dark:text-amber-500 mt-0.5">
                                            These rows will be skipped during import or may cause errors.
                                        </p>
                                    </div>
                                </div>
                            )}
                            
                            {error && (
                                <div className="flex-shrink-0 flex items-start gap-2 p-3 bg-rose-50 dark:bg-rose-900/20 rounded-xl border border-rose-200 dark:border-rose-700">
                                    <AlertTriangle className="h-4 w-4 text-rose-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center flex-shrink-0">
                    <button onClick={downloadTemplate} className="text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors">
                        <Download className="h-4 w-4" /> Download Template
                    </button>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors bg-slate-100 dark:bg-slate-800">
                            Cancel
                        </button>
                        {phase === 'select' ? (
                            <button disabled className="px-5 py-2.5 bg-primary-200 text-white rounded-xl text-sm font-bold opacity-50 cursor-not-allowed flex items-center gap-2">
                                Next Step <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : phase === 'mapping' ? (
                            <button onClick={generatePreview} className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95">
                                Next: Preview <ArrowRight className="h-4 w-4" />
                            </button>
                        ) : phase === 'plant-picker' ? (
                            <div className="flex items-center gap-3">
                                <button onClick={() => setPhase('mapping')} className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors bg-slate-100 dark:bg-slate-800">
                                    ← Back
                                </button>
                                <button
                                    onClick={() => {
                                        if (!selectedPlant) { setError('Please select a plant to continue.'); return; }
                                        setError('');
                                        generatePreview();
                                    }}
                                    className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95"
                                >
                                    Next: Preview <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        ) : (
                            <button onClick={handleUpload} disabled={uploading || previewStats.total === 0} className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all shadow-sm active:scale-95">
                                {uploading && <RefreshCw className="h-4 w-4 animate-spin" />}
                                {uploading ? 'Starting Job...' : `Import ${previewStats.total.toLocaleString()} rows`}
                            </button>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

export const GenericAPIFetch = null;
