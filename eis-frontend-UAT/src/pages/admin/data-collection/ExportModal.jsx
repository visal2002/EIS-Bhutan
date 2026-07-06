// src/pages/admin/data-collection/ExportModal.jsx
import { useState } from 'react';
import { Download, X, FileSpreadsheet, FileText, Database, RefreshCw, FileJson } from 'lucide-react';
import * as XLSX from 'xlsx';
import { apiFetch, getAccessToken } from '../../../services/api';

export default function ExportModal({ title, config, filters, sort, onClose, onSuccess }) {
    const [format, setFormat] = useState('excel');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleExport = async () => {
        setLoading(true);
        setError('');
        try {
            let actualModule = 'master_data.EnergyDataModel'; // Fallback
            if (config.api) {
                if (config.api.includes('pol/import-export')) actualModule = 'pol.POLImportExport';
                else if (config.api.includes('coal')) actualModule = 'coal.CoalData';
                else if (config.api.includes('surface-transport/consumption')) actualModule = 'surface_transport.TransportConsumption';
                else if (config.api.includes('transport/registration')) actualModule = 'transport.VehicleRegistration';
                else if (config.api.includes('transport/consumption')) actualModule = 'transport.TransportConsumption';
                else if (config.api.includes('electricity')) actualModule = 'electricity.ElectricityData';
                else if (config.api.includes('biomass/biogas')) actualModule = 'biomass.BiogasData';
                else if (config.api.includes('biomass/briquette')) actualModule = 'biomass.BriquetteCharcoal';
                else if (config.api.includes('biomass/charcoal')) actualModule = 'biomass.BriquetteCharcoal';
                else if (config.api.includes('biomass')) actualModule = 'biomass.BriquetteCharcoal';
                else if (config.api.includes('industry')) actualModule = 'industry.IndustryData';
            }
            
            if (config.params && Object.keys(config.params).length > 0) {
                const qs = new URLSearchParams(config.params).toString();
                actualModule = `${actualModule}?${qs}`;
            }
            
            const payload = {
                module_name: actualModule,
                filters: {
                    ...(filters.search ? { search: filters.search } : {}),
                    ...(filters.year ? { year: filters.year } : {}),
                    ...(filters.month ? { month: filters.month } : {}),
                    ...(sort && sort.key ? { ordering: `${sort.dir === 'desc' ? '-' : ''}${sort.key}` } : {}),
                    ...(config.params || {}),
                    format: format
                }
            };
            
            const res = await apiFetch('/admin/export-jobs/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            if (!res.ok) throw new Error('Failed to schedule export job. Check server connection.');
            
            if (onSuccess) {
                onSuccess('Export job scheduled successfully. You will be notified via email when it completes, and it will appear in the Jobs tab.');
            } else {
                alert('Export job scheduled successfully. You will be notified via email when it completes, and it will appear in the Jobs tab.');
            }
            onClose();
        } catch (err) {
            setError(err.message || 'An error occurred while scheduling export.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/20 dark:bg-black/40 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Export Data</h2>
                            <p className="text-xs text-slate-400 mt-1">{title}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    <div className="space-y-3">
                        <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Select Format</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <button onClick={() => setFormat('excel')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'excel' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-800'}`}>
                                <FileSpreadsheet className="h-6 w-6" />
                                <span className="text-xs font-bold text-center">Excel (.xlsx)</span>
                            </button>
                            <button onClick={() => setFormat('xls')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'xls' ? 'border-emerald-600 bg-emerald-100/30 dark:bg-emerald-800/10 text-emerald-800 dark:text-emerald-500' : 'border-slate-100 dark:border-slate-700 hover:border-emerald-100 dark:hover:border-emerald-900'}`}>
                                <FileSpreadsheet className="h-6 w-6" />
                                <span className="text-xs font-bold text-center">Excel (.xls)</span>
                            </button>
                            <button onClick={() => setFormat('csv')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'csv' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400' : 'border-slate-100 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800'}`}>
                                <FileText className="h-6 w-6" />
                                <span className="text-xs font-bold text-center">CSV</span>
                            </button>
                            <button onClick={() => setFormat('json')} className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${format === 'json' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-800'}`}>
                                <FileJson className="h-6 w-6" />
                                <span className="text-xs font-bold text-center">JSON</span>
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg text-xs text-rose-600 dark:text-rose-400">
                            {error}
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleExport} disabled={loading} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50">
                        {loading && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {loading ? 'Generating...' : 'Download Export'}
                    </button>
                </div>
            </div>
        </div>
    );
}
