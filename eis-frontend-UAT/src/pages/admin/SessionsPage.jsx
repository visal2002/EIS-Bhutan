import React, { useState, useEffect } from 'react';
import { 
  Users, Monitor, Smartphone, Globe, Clock, 
  Trash2, Shield, AlertTriangle, ShieldCheck, 
  RefreshCcw, Info, CheckCircle2, XCircle, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import apiFetch from '../../services/api';

const SessionsPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revokingId, setRevokingId] = useState(null);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/auth/sessions/');
      if (!res || !res.ok) throw new Error("Failed to load sessions");
      const data = await res.json();
      setSessions(data.results || data);
      setError(null);
      // Heuristic: identify current session if needed
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setError('Unable to retrieve active sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to terminate this session? The user will be logged out immediately.')) return;
    
    setRevokingId(id);
    try {
      const res = await apiFetch(`/auth/sessions/${id}/`, { method: 'DELETE' });
      if (!res || !res.ok) throw new Error("Failed to revoke session");
      setSessions(sessions.filter(s => s.id !== id));
    } catch (err) {
      console.error('Revoke failed:', err);
      alert('Failed to revoke session.');
    } finally {
      setRevokingId(null);
    }
  };

  const parseUA = (ua) => {
    if (!ua) return { os: 'Unknown OS', browser: 'Unknown Browser' };
    const lowUA = ua.toLowerCase();
    
    let os = 'Other';
    if (lowUA.includes('win')) os = 'Windows';
    else if (lowUA.includes('mac')) os = 'macOS';
    else if (lowUA.includes('linux')) os = 'Linux';
    else if (lowUA.includes('android')) os = 'Android';
    else if (lowUA.includes('iphone') || lowUA.includes('ipad')) os = 'iOS';

    let browser = 'Other';
    if (lowUA.includes('chrome')) browser = 'Chrome';
    else if (lowUA.includes('firefox')) browser = 'Firefox';
    else if (lowUA.includes('safari')) browser = 'Safari';
    else if (lowUA.includes('edge')) browser = 'Edge';

    return { os, browser };
  };

  const getOSIcon = (os) => {
    switch(os) {
      case 'Windows': return <Monitor className="w-5 h-5 text-blue-500" />;
      case 'macOS': return <Monitor className="w-5 h-5 text-slate-800" />;
      case 'iOS':
      case 'Android': return <Smartphone className="w-5 h-5 text-emerald-500" />;
      default: return <Monitor className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto text-slate-800">
      {/* Header Section */}
      <div className="mb-2">
        <Link 
          to="/admin/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#124143] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-[#124143] rounded-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            Active Sessions
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Monitor and manage all devices currently logged into the system.
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold ring-1 ring-emerald-200">
              {sessions.length} Active
            </span>
          </p>
        </div>
        <button 
          onClick={fetchSessions}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm font-medium disabled:opacity-50"
        >
          <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh List
        </button>
      </div>

      {/* Info Alert */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-4">
        <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-sm">
          <h3 className="font-bold text-amber-900">Security Notice</h3>
          <p className="text-amber-700 leading-relaxed">
            Terminating a session will immediately invalidate the user's access token. 
            They will be redirected to the login page on their next server request. 
            If you see unfamiliar devices, consider resetting the user's password or enabling MFA.
          </p>
        </div>
      </div>

      {/* Sessions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          Array(2).fill(0).map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 animate-pulse rounded-2xl border border-slate-200 shadow-sm" />
          ))
        ) : error ? (
          <div className="col-span-full py-20 text-center">
            <XCircle className="w-16 h-16 text-rose-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-400">Connection Error</h3>
            <p className="text-slate-400">{error}</p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100">
            <CheckCircle2 className="w-16 h-16 text-emerald-100 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-300">All Clear</h3>
            <p className="text-slate-400">No active sessions found (other than system baseline).</p>
          </div>
        ) : (
          <AnimatePresence>
            {sessions.map((session) => {
              const { os, browser } = parseUA(session.user_agent);
              return (
                <motion.div
                  key={session.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="group bg-white rounded-2xl border border-slate-200 p-5 hover:border-[#124143] hover:shadow-xl hover:shadow-[#124143]/5 transition-all relative overflow-hidden"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:bg-[#124143]/5 transition-colors">
                        {getOSIcon(os)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                          {os} &bull; {browser}
                          {session.is_current && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase ring-1 ring-blue-200">
                              This Device
                            </span>
                          )}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <Globe className="w-3 h-3" />
                          {session.ip_address}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleRevoke(session.id)}
                      disabled={revokingId === session.id}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Terminate Session"
                    >
                      <Trash2 className={`w-5 h-5 ${revokingId === session.id ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>

                  <hr className="my-4 border-slate-100" />

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <Users className="w-3 h-3" />
                        Account User
                      </p>
                      <p className="text-sm font-semibold text-[#124143] truncate">
                        {session.user_full_name} ({session.username})
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        First Login
                      </p>
                      <p className="text-sm text-slate-600">
                        {new Date(session.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-xs font-bold text-emerald-600 uppercase">Active Now</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <ShieldCheck className="w-3 h-3" />
                      <span className="text-[10px] font-medium">Verified Session</span>
                    </div>
                  </div>
                  
                  {/* Subtle Background Pattern */}
                  <div className="absolute -right-4 -bottom-4 opacity-[0.02] pointer-events-none group-hover:opacity-[0.05] transition-opacity">
                    <Monitor className="w-24 h-24" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer Support */}
      <div className="mt-12 text-center p-8 border-t border-slate-100">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-slate-50 rounded-full border border-slate-200">
            <Info className="w-6 h-6 text-slate-400" />
          </div>
        </div>
        <h4 className="font-bold text-slate-600">Need more control?</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-md mx-auto">
          If you suspect unauthorized access across multiple accounts, 
          you can also deactivate the user account entirely from the User Management page.
        </p>
      </div>
    </div>
  );
};

export default SessionsPage;
