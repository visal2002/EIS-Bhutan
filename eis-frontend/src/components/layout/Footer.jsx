// src/components/layout/Footer.jsx
const currentYear = new Date().getFullYear();

export default function Footer() {
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
                            <div>
                                <span className="font-bold text-lg text-white leading-tight block">
                                    National Energy Information System
                                </span>
                                <span className="text-sm text-white/60">
                                    Department of Energy · MoENR · Royal Government of Bhutan
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-white/70 max-w-sm leading-relaxed">
                            A centralized data repository for Bhutan's energy sector, providing
                            real-time analytics, automated data collection, and IPCC-aligned
                            GHG reporting capabilities.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
                            Quick Links
                        </h3>
                        <ul className="space-y-3 text-sm">
                            {['Home', 'Dashboard', 'Reports'].map(l => (
                                <li key={l}>
                                    <a href="#" className="hover:text-primary-300 transition-colors">{l}</a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* System info */}
                    <div>
                        <h3 className="text-white text-sm font-semibold mb-4 tracking-wider uppercase">
                            System Info
                        </h3>
                        <ul className="space-y-3 text-sm">
                            <li>Department of Energy</li>
                            <li>Version: FY 2025–26</li>
                            <li>
                                <a href="mailto:support@energy.gov.bt" className="hover:text-primary-300 transition-colors">
                                    support@energy.gov.bt
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="mt-12 pt-8 border-t border-primary-700 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p>&copy; {currentYear} Department of Energy, Bhutan. All rights reserved.</p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}