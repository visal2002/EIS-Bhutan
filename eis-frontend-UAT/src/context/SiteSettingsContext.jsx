// src/context/SiteSettingsContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext(null);

const DEFAULTS = {
    site_title:       'Energy Information System',
    site_short_name:  'EIS',
    site_tagline:     'Department of Energy · MoENR · Royal Government of Bhutan',
    contact_email:    'support@energy.gov.bt',
    contact_address:  'Department of Energy, MoENR, Thimphu, Bhutan',
    website_url:      'https://www.moea.gov.bt',
    footer_text:      '© 2026 Department of Energy, MoENR, Royal Government of Bhutan. All rights reserved.',
    copyright_year:   '2026',
    allow_ndi_login:    true,
    allow_agency_login: true,
    maintenance_mode:   false,
    site_logo_url:    null,
    doe_logo_url:     null,
    gov_logo_url:     null,
    favicon_url:      null,
};

export function SiteSettingsProvider({ children }) {
    const [settings, setSettings] = useState(DEFAULTS);
    const [loading,  setLoading]  = useState(true);

    useEffect(() => {
        fetch('/api/admin/site-settings/')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setSettings({ ...DEFAULTS, ...data }); })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    // Update favicon dynamically
    useEffect(() => {
        if (settings.favicon_url) {
            let link = document.querySelector("link[rel*='icon']");
            if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
            link.href = settings.favicon_url;
        }
        if (settings.site_title) {
            document.title = settings.site_title;
        }
    }, [settings.favicon_url, settings.site_title]);

    const reload = () => {
        fetch('/api/admin/site-settings/')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data) setSettings({ ...DEFAULTS, ...data }); })
            .catch(() => {});
    };

    return (
        <Ctx.Provider value={{ settings, loading, reload }}>
            {children}
        </Ctx.Provider>
    );
}

export const useSiteSettings = () => useContext(Ctx);