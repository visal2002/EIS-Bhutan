import { motion } from 'framer-motion';
import { AlertTriangle, Hammer, Clock, Home, Mail } from 'lucide-react';
import { useSiteSettings } from '../context/SiteSettingsContext';

const MaintenancePage = () => {
  const { settings } = useSiteSettings();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary-600/10 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-[#124143]/10 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl w-full relative z-10"
      >
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-2xl p-8 md:p-12 text-center">
          
          {/* Logo / Icon Section */}
          <div className="relative inline-block mb-8">
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="bg-primary-50 dark:bg-primary-900/20 p-6 rounded-full inline-flex relative z-10"
            >
              <Hammer className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </motion.div>
            <motion.div 
               animate={{ scale: [1, 1.2, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="absolute -top-2 -right-2 bg-rose-500 text-white p-2 rounded-full z-20 shadow-lg"
            >
              <AlertTriangle className="w-5 h-5" />
            </motion.div>
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold text-slate-800 dark:text-white mb-4 tracking-tight">
            System Maintenance
          </h1>
          
          <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto leading-relaxed">
            {settings.maintenance_msg || "We're currently performing scheduled maintenance to improve your experience. We'll be back online shortly."}
          </p>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-4 text-left shadow-sm">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm">
                <Clock className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Expected Time</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">Approx. 45-60 mins</p>
              </div>
            </div>
            <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 flex items-center gap-4 text-left shadow-sm">
              <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Support Access</p>
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-200">{settings.contact_email || "support@energy.gov.bt"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button 
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto px-8 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-600/20 flex items-center justify-center gap-2"
            >
               Check Status
            </button>
            <a 
              href="/"
              className="w-full sm:w-auto px-8 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Go Home
            </a>
          </div>

          {/* Bhutan Govenrment / DOE Footer */}
          <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800">
             <div className="flex justify-center items-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all">
                <img src={settings.doe_logo || "/logo-placeholder.png"} alt="DOE" className="h-10 object-contain" />
                <div className="h-8 w-[1px] bg-slate-300 dark:bg-slate-700" />
                <img src={settings.gov_logo || "/logo-placeholder.png"} alt="RGoB" className="h-10 object-contain" />
             </div>
             <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-[0.2em] font-medium">
               Department of Energy · MoENR · Royal Government of Bhutan
             </p>
          </div>
        </div>
      </motion.div>

      {/* Decorative Circles */}
      <div className="absolute top-[20%] right-[10%] w-32 h-32 border-4 border-primary-500/10 rounded-full animate-pulse" />
      <div className="absolute bottom-[20%] left-[10%] w-48 h-48 border-8 border-primary-500/5 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default MaintenancePage;
