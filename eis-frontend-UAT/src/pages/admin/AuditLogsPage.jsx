import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Calendar, User, Activity, 
  ChevronRight, ChevronDown, Download, AlertCircle,
  LogIn, LogOut, UserPlus, UserMinus, ShieldCheck, 
  ExternalLink, FileJson, Clock, Globe, Laptop, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiFetch from '../../services/api';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  
  // Filters
  const [filters, setFilters] = useState({
    action: '',
    search: '',
    user_id: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    count: 0,
    pageSize: 20
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page,
        page_size: pagination.pageSize,
        ordering: '-timestamp'
      });
      const res = await apiFetch(`/auth/audit-logs/?${params.toString()}`);
      if (!res || !res.ok) throw new Error('Failed to load audit logs.');
      const data = await res.json();
      setLogs(data.results || []);
      setPagination(prev => ({ ...prev, count: data.count || 0 }));
      setError(null);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
      setError('Failed to load audit logs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters, pagination.page]);

  const getActionIcon = (action) => {
    const a = action.toLowerCase();
    if (a.includes('login')) return <LogIn className="w-4 h-4 text-emerald-500" />;
    if (a.includes('logout')) return <LogOut className="w-4 h-4 text-slate-500" />;
    if (a.includes('created')) return <UserPlus className="w-4 h-4 text-blue-500" />;
    if (a.includes('updated')) return <Activity className="w-4 h-4 text-amber-500" />;
    if (a.includes('deactivated') || a.includes('delete')) return <UserMinus className="w-4 h-4 text-rose-500" />;
    if (a.includes('password')) return <ShieldCheck className="w-4 h-4 text-indigo-500" />;
    return <Shield className="w-4 h-4 text-slate-400" />;
  };

  const getActionColor = (action) => {
    const a = action.toLowerCase();
    if (a.includes('login')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (a.includes('created')) return 'bg-blue-50 text-blue-700 border-blue-100';
    if (a.includes('updated')) return 'bg-amber-50 text-amber-700 border-amber-100';
    if (a.includes('deactivated') || a.includes('delete')) return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-700 border-slate-100';
  };

  const formatMetadata = (data) => {
    if (!data || Object.keys(data).length === 0) return null;
    return (
      <div className="mt-2 p-3 bg-slate-900 rounded-lg overflow-x-auto">
        <pre className="text-xs text-emerald-400 font-mono">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="mb-2">
        <Link 
          to="/admin/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#124143] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#124143]" />
            System Audit Logs
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Monitor all administrative actions and security events across the system.
          </p>
        </div>
        <button 
          onClick={fetchLogs}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
        >
          <Activity className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Activity
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by description..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#124143]/20 focus:border-[#124143] outline-none transition-all"
            value={filters.search}
            onChange={(e) => setFilters(f => ({ ...f, search: e.target.value }))}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg appearance-none bg-white focus:ring-2 focus:ring-[#124143]/20 outline-none cursor-pointer"
            value={filters.action}
            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="user_created">User Creation</option>
            <option value="user_updated">User Update</option>
            <option value="password_change">Password Change</option>
          </select>
        </div>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text"
            placeholder="User ID..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#124143]/20 outline-none"
            value={filters.user_id}
            onChange={(e) => setFilters(f => ({ ...f, user_id: e.target.value }))}
          />
        </div>
        <button 
          className="bg-[#124143] text-white px-4 py-2 rounded-lg hover:bg-[#0e3234] transition-colors flex items-center justify-center gap-2"
          onClick={() => setPagination(p => ({ ...p, page: 1 }))}
        >
          <Search className="w-4 h-4" />
          Filter Logs
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-10"></th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="6" className="px-6 py-4">
                      <div className="h-4 bg-slate-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-slate-400">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No audit logs found matching your filters.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <React.Fragment key={log.id}>
                    <tr 
                      className={`hover:bg-slate-50 transition-colors cursor-pointer ${expandedId === log.id ? 'bg-slate-50' : ''}`}
                      onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                    >
                      <td className="px-6 py-4 text-slate-400">
                        {expandedId === log.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">
                            {new Date(log.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#124143]/10 flex items-center justify-center text-[#124143] text-xs font-bold ring-2 ring-white">
                            {log.user_name?.charAt(0) || 'S'}
                          </div>
                          <span className="text-sm font-medium text-slate-700">{log.user_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {getActionIcon(log.action)}
                          {log.action.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-600 line-clamp-1">{log.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded flex items-center gap-1.5 w-fit">
                          <Globe className="w-3 h-3 text-slate-400" />
                          {log.ip_address}
                        </span>
                      </td>
                    </tr>
                    
                    {/* Expandable Metadata Area */}
                    <AnimatePresence>
                      {expandedId === log.id && (
                        <motion.tr
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-50/50"
                        >
                          <td colSpan="6" className="px-12 py-4 border-l-4 border-[#124143]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                  <Laptop className="w-3 h-3" />
                                  Connection Details
                                </h4>
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm py-1 border-b border-slate-100">
                                    <span className="text-slate-500">IP Address</span>
                                    <span className="font-mono text-slate-700">{log.ip_address}</span>
                                  </div>
                                  <div className="text-sm py-1">
                                    <span className="text-slate-500 block mb-1">User Agent</span>
                                    <p className="text-xs text-slate-600 bg-white p-2 rounded border border-slate-200">
                                      {log.user_agent || 'Unknown Client'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="text-xs font-bold uppercase text-slate-400 mb-2 flex items-center gap-2">
                                  <FileJson className="w-3 h-3" />
                                  Metadata & Payload
                                </h4>
                                {log.metadata && Object.keys(log.metadata).length > 0 ? (
                                  formatMetadata(log.metadata)
                                ) : (
                                  <p className="text-xs text-slate-400 italic">No additional metadata recorded for this action.</p>
                                )}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            Showing <span className="font-medium text-slate-700">{(pagination.page - 1) * pagination.pageSize + 1}</span> to <span className="font-medium text-slate-700">{Math.min(pagination.page * pagination.pageSize, pagination.count)}</span> of <span className="font-medium text-slate-700">{pagination.count}</span> logs
          </p>
          <div className="flex gap-2">
            <button 
              disabled={pagination.page === 1}
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Previous
            </button>
            <button 
              disabled={pagination.page * pagination.pageSize >= pagination.count}
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-sm disabled:opacity-50 hover:bg-slate-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogsPage;
