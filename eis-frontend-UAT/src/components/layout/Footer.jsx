// src/components/layout/Footer.jsx
import { useSiteSettings } from '../../context/SiteSettingsContext';

const currentYear = new Date().getFullYear();

export default function Footer() {
    const { settings } = useSiteSettings();

    const logoText = settings?.landing_header?.logo_text || 'EIS · Bhutan';
    const logoSubtext = settings?.landing_header?.logo_subtext || 'National Energy Information System';

    const quickLinks = settings?.landing_footer?.quick_links || [
        { label: 'Home', to: '/' },
        { label: 'Dashboard', to: '/public' },
        { label: 'Reports', to: '/public/reports' }
    ];

    const systemInfo = settings?.landing_footer?.system_info || [
        { label: 'Department of Energy' },
        { label: 'Version: FY 2025–26' },
        { label: 'support@energy.gov.bt' }
    ];

    const copyrightText = settings?.landing_footer?.copyright_text || `© ${currentYear} Department of Energy, Bhutan. All rights reserved.`;

    return (
        <footer className="bg-primary-600 border-t border-primary-700 text-white/80 font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

                    {/* Brand */}
                    <div className="col-span-1 lg:col-span-2 space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="h-20 w-20 flex items-center justify-center flex-shrink-0">
                                <img
                                    src="/images/rgob-crest.png"
                                    alt="RGoB Crest"
                                    className="h-full w-full object-contain opacity-95"
                                    onError={e => { e.target.style.display = 'none'; }}
                                />
                            </div>
                            <div className="text-left">
                                <span className="font-bold text-lg text-white leading-tight block">
                                    {logoText}
                                </span>
                                <span className="text-sm text-white/60">
                                    {logoSubtext}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 max-w-sm leading-relaxed text-left">
                            A centralized data repository for Bhutan's energy sector, providing
                            real-time analytics, automated data collection, and IPCC-aligned
                            GHG reporting capabilities.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div className="text-left">
                        <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
                            Quick Links
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {quickLinks.map(link => (
                                <li key={link.label}>
                                    <a href={link.to} className="hover:text-primary-300 transition-colors">{link.label}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* System info */}
                    <div className="text-left">
                        <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
                            System Info
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {systemInfo.map((info, idx) => (
                                <li key={idx}>{info.label}</li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-primary-700 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>{copyrightText}</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}