// src/App.jsx
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { getUser, getAccessToken } from './services/api';
import { usePermissions } from './context/PermissionsContext';

// Auth pages
import LandingPage        from './pages/auth/LandingPage';
import LoginPage          from './pages/auth/LoginPage';
import NDIProfileSetup    from './pages/auth/NDIProfileSetup';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import PublicDashboard    from './pages/auth/PublicDashboard';
import PublicReports      from './pages/auth/PublicReports';

// Admin pages
import UserManagement     from './pages/admin/UserManagement';
import RolesPage          from './pages/admin/RolesPage';
import UserFormPage       from './pages/admin/UserFormPage';
import RoleFormPage       from './pages/admin/RoleFormPage';
import PermissionsPage    from './pages/admin/PermissionsPage';
import SiteSettingsPage   from './pages/admin/SiteSettingsPage';
import SystemSettingsPage from './pages/admin/SystemSettingsPage';
import AccountSettingsPage from './pages/account/AccountSettingsPage';
import MyProfilePage       from './pages/account/MyProfilePage';
import Dashboard           from './pages/admin/Dashboard';

// Master Data — all 9 modules from pages.jsx, engine is MasterDataEngine.jsx
import {
    EnergySupply,
    ConversionFactors,
    Sectors,
    ElectricityCategories,
    VehicleTypes,
    Mileage,
    BiogasSizes,
    SolarSizes,
    IndustryClassification,
} from './pages/admin/master-data/pages';

import DashboardLayout from './components/layout/DashboardLayout';

// ── Role → home dashboard route ───────────────────────────────────
const ROLE_DASHBOARD = {
    ADMIN:        '/admin/dashboard',
    DOE_HEAD:     '/doe/dashboard',
    DATA_MANAGER: '/manager/dashboard',
    DATA_FOCAL:   '/focal/dashboard',
    VIEWER:       '/viewer/dashboard',
};

// ── Access denied page ────────────────────────────────────────────
function AccessDenied() {
    return (
        <DashboardLayout breadcrumb="Error" title="Access Denied">
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl">🚫</div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">Access Denied</h2>
                <p className="text-sm text-slate-400 max-w-xs">
                    You don't have permission to access this page. Contact your administrator to request access.
                </p>
            </div>
        </DashboardLayout>
    );
}

// ── Coming soon placeholder ───────────────────────────────────────
function ComingSoon({ label, breadcrumb }) {
    return (
        <DashboardLayout breadcrumb={breadcrumb} title={label}>
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary-50 flex items-center justify-center text-3xl">🚧</div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{label}</h2>
                <p className="text-sm text-slate-400 max-w-xs">This module is under development.</p>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-xs font-semibold">Coming Soon</span>
            </div>
        </DashboardLayout>
    );
}

// ── Protected route ───────────────────────────────────────────────
// module + action → check DB permissions
// adminOnly       → only ADMIN role (superuser-level)
// allowedRoles    → fallback role-name list (for routes that don't have a module key yet)
function Protected({ children, module, action = 'can_view', adminOnly, allowedRoles }) {
    const location = useLocation();
    const token    = getAccessToken();
    const user     = getUser();
    const { can }  = usePermissions();

    if (!token) {
        return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
    }

    const role = user?.role?.role_name;
    const isAdmin = role === 'ADMIN' || user?.is_superuser;

    // Admin-only routes (site settings, system settings, create/delete users)
    if (adminOnly && !isAdmin) {
        return <AccessDenied />;
    }

    // Module-permission guard — check DB permissions
    if (module) {
        if (!can(module, action)) {
            return <AccessDenied />;
        }
        return children;
    }

    // Legacy role-name list guard (for routes not yet mapped to modules)
    if (allowedRoles && role && !allowedRoles.includes(role)) {
        const dest = ROLE_DASHBOARD[role] || '/viewer/dashboard';
        return <Navigate to={dest} replace />;
    }

    return children;
}

// ── Admin dashboard redirect ──────────────────────────────────────
function AdminDashboard() {
    const user = getUser();
    const role = user?.role?.role_name;
    if (role === 'ADMIN' || role === 'DOE_HEAD') return <Navigate to="/admin/users" replace />;
    if (role === 'DATA_MANAGER') return <Navigate to="/admin/master-data/energy-supply" replace />;
    return <Navigate to="/viewer/dashboard" replace />;
}

export default function App() {
    return (
        <Routes>

            {/* ── Public ──────────────────────────────────────────── */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/forgot-password"element={<ForgotPasswordPage />} />
            <Route path="/ndi/setup"      element={<NDIProfileSetup />} />
            <Route path="/public"         element={<PublicDashboard />} />
            <Route path="/public/reports" element={<PublicReports />} />

            {/* ── Dashboards ──────────────────────────────────────── */}
            <Route path="/admin/dashboard"   element={<Protected><Dashboard /></Protected>} />
            <Route path="/doe/dashboard"     element={<Protected allowedRoles={['ADMIN','DOE_HEAD']}><Dashboard /></Protected>} />
            <Route path="/manager/dashboard" element={<Protected allowedRoles={['ADMIN','DATA_MANAGER']}><Dashboard /></Protected>} />
            <Route path="/focal/dashboard"   element={<Protected allowedRoles={['ADMIN','DATA_FOCAL']}><Dashboard /></Protected>} />
            <Route path="/viewer/dashboard"  element={<Protected><Dashboard /></Protected>} />

            {/* ── User Management — module: "users" ───────────────── */}
            <Route path="/admin/users"          element={<Protected module="users" action="can_view"><UserManagement /></Protected>} />
            <Route path="/admin/users/new"      element={<Protected module="users" action="can_create"><UserFormPage /></Protected>} />
            <Route path="/admin/users/:id/edit" element={<Protected module="users" action="can_edit"><UserFormPage /></Protected>} />

            {/* ── Roles — module: "roles" ──────────────────────────── */}
            <Route path="/admin/roles"          element={<Protected module="roles" action="can_view"><RolesPage /></Protected>} />
            <Route path="/admin/roles/new"      element={<Protected module="roles" action="can_create"><RoleFormPage /></Protected>} />
            <Route path="/admin/roles/:id/edit" element={<Protected module="roles" action="can_edit"><RoleFormPage /></Protected>} />
            <Route path="/admin/permissions"    element={<Protected module="roles" action="can_view"><PermissionsPage /></Protected>} />

            {/* ── Settings — admin only ────────────────────────────── */}
            <Route path="/admin/site-settings"   element={<Protected adminOnly><SiteSettingsPage /></Protected>} />
            <Route path="/admin/system-settings" element={<Protected adminOnly><SystemSettingsPage /></Protected>} />
            <Route path="/admin/audit-logs"      element={<Protected module="audit_logs" action="can_view"><ComingSoon label="Audit Logs" breadcrumb="System" /></Protected>} />
            <Route path="/admin/sessions"        element={<Protected adminOnly><ComingSoon label="Sessions" breadcrumb="System" /></Protected>} />

            {/* ── Account — available to all authenticated users ───── */}
            <Route path="/account/settings" element={<Protected><AccountSettingsPage /></Protected>} />
            <Route path="/account/profile"  element={<Protected><MyProfilePage /></Protected>} />

            {/* ── Master Data — module: "master_data" ─────────────── */}
            <Route path="/admin/master-data/energy-supply"           element={<Protected module="master_data" action="can_view"><EnergySupply /></Protected>} />
            <Route path="/admin/master-data/conversion-factors"      element={<Protected module="master_data" action="can_view"><ConversionFactors /></Protected>} />
            <Route path="/admin/master-data/sectors"                 element={<Protected module="master_data" action="can_view"><Sectors /></Protected>} />
            <Route path="/admin/master-data/electricity-categories"  element={<Protected module="master_data" action="can_view"><ElectricityCategories /></Protected>} />
            <Route path="/admin/master-data/vehicle-types"           element={<Protected module="master_data" action="can_view"><VehicleTypes /></Protected>} />
            <Route path="/admin/master-data/mileage"                 element={<Protected module="master_data" action="can_view"><Mileage /></Protected>} />
            <Route path="/admin/master-data/biogas-sizes"            element={<Protected module="master_data" action="can_view"><BiogasSizes /></Protected>} />
            <Route path="/admin/master-data/solar-sizes"             element={<Protected module="master_data" action="can_view"><SolarSizes /></Protected>} />
            <Route path="/admin/master-data/industry-classification" element={<Protected module="master_data" action="can_view"><IndustryClassification /></Protected>} />

            {/* ── Data Collection — module per energy type ─────────── */}
            <Route path="/data-collection/electricity" element={<Protected module="electricity_data" action="can_view"><ComingSoon label="Electricity Data"   breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/solar"       element={<Protected module="solar_data"        action="can_view"><ComingSoon label="Solar & Renewables" breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/petroleum"   element={<Protected module="petroleum_data"    action="can_view"><ComingSoon label="Petroleum & POL"    breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/fuelwood"    element={<Protected module="fuelwood_data"     action="can_view"><ComingSoon label="Fuelwood Data"      breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/coal"        element={<Protected module="coal_data"         action="can_view"><ComingSoon label="Coal Data"          breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/biomass"     element={<Protected module="biomass_data"      action="can_view"><ComingSoon label="Biomass & Biogas"   breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/transport"   element={<Protected module="transport_data"    action="can_view"><ComingSoon label="Transport Fuel"     breadcrumb="Data Collection" /></Protected>} />
            <Route path="/data-collection/industry"    element={<Protected module="industry_data"     action="can_view"><ComingSoon label="Industrial Energy"  breadcrumb="Data Collection" /></Protected>} />

            {/* ── Reports — module: "energy_reports" ──────────────── */}
            <Route path="/reports"     element={<Protected module="energy_reports" action="can_view"><ComingSoon label="Reports"    breadcrumb="Reports" /></Protected>} />
            <Route path="/reports/ghg" element={<Protected module="ghg_report"     action="can_view"><ComingSoon label="GHG Report" breadcrumb="Reports" /></Protected>} />

            {/* ── Catch-all ─────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    );
}