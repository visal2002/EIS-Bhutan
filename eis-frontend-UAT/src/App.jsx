// src/App.jsx
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom';
import { getUser, getAccessToken } from './services/api';
import { usePermissions } from './context/PermissionsContext';
import { useSiteSettings } from './context/SiteSettingsContext';
import MaintenancePage from './pages/MaintenancePage';

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
import LandingPageEditor  from './pages/admin/LandingPageEditor';
import AccountSettingsPage from './pages/account/AccountSettingsPage';
import MyProfilePage       from './pages/account/MyProfilePage';
import Dashboard           from './pages/admin/Dashboard';
import AuditLogsPage      from './pages/admin/AuditLogsPage';
import SessionsPage       from './pages/admin/SessionsPage';
import JobsPage           from './pages/system/Jobs';

// Data Settings — all modules from pages.jsx
import {
    EnergySupply,
    ConversionFactors,
    Sectors,
    ElectricityCategories,
    VehicleTypes,
    Mileage,
    BiogasSizes,
    SolarEnergy,
    IndustryClassification,
    ConversionUnits, ElectricityTypes,

    FuelTypes, VehicleFuelTypes, ProductionTypes, PanelTypes, IndustryCategories,
    MeasurementUnits, EnergyCategories,
    Dzongkhags, DataYears, DataSources, BPCCategories,
    ConsumerTypes, VoltageTypes, ConsumerGroups, Locations, ConductorTypes, UnitTypes, ConnectionTypes, PlantSizes, GridTypes, ConfigurationTypes, LineCategories, CircuitTypes, SubsidyTypes, TowerTypes, TransformerTypes, VoltageLevels, ConsumerSubtypes,
    GenerationPlants, Substations, SubstationTransformers, Countries,
} from './pages/admin/master-data/pages';
import MasterDataIndex    from './pages/admin/master-data/MasterDataIndex';
import MasterSettingsIndex from './pages/admin/master-data/MasterSettingsIndex';
import DataCollectionIndex from './pages/admin/data-collection/DataCollectionIndex';
import ElectricityPage     from './pages/admin/data-collection/electricity/ElectricityPage';
import PolPage             from './pages/admin/data-collection/pol/PolPage';
import CoalPage            from './pages/admin/data-collection/coal/CoalPage';
import FuelwoodPage        from './pages/admin/data-collection/fuelwood/FuelwoodPage';
import BiomassPage         from './pages/admin/data-collection/biomass/BiomassPage';
import SolarPage           from './pages/admin/data-collection/solar/SolarPage';
import IndustryPage        from './pages/admin/data-collection/industry/IndustryPage';
import SurfaceTransportPage from './pages/admin/data-collection/surface-transport/SurfaceTransportPage';
import AirTransportPage     from './pages/admin/data-collection/air-transport/AirTransportPage';

// Electricity Portal
import HydrologyPage from './pages/admin/electricity/HydrologyPage';
import GenerationPage from './pages/admin/electricity/GenerationPage';
import RunOfRiverPage from './pages/admin/electricity/RunOfRiverPage';
import ReservoirHydroPage from './pages/admin/electricity/ReservoirHydroPage';
import PumpedHydroPage from './pages/admin/electricity/PumpedHydroPage';
import InfrastructurePage from './pages/admin/electricity/InfrastructurePage';
import SalesConsumersPage from './pages/admin/electricity/SalesConsumersPage';
import TradePage from './pages/admin/electricity/TradePage';
import ForecastingPage from './pages/admin/electricity/ForecastingPage';
import OthersPage from './pages/admin/electricity/OthersPage';

import ReportsIndex        from './pages/admin/reports/ReportsIndex';
import EnergyReportPage    from './pages/admin/reports/EnergyReportPage';
import GHGReportPage       from './pages/admin/reports/GHGReportPage';

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

function LookupRedirect() {
    const { module } = useParams();
    return <Navigate to={`/admin/master-data/${module}`} replace />;
}

export default function App() {
    const { settings } = useSiteSettings();
    const user = getUser();
    const isAdmin = user?.role?.role_name === 'ADMIN' || user?.is_superuser;

    // Global Maintenance Mode check
    if (settings?.maintenance_mode && !isAdmin) {
        return <MaintenancePage />;
    }

    return (
        <Routes>

            {/* ── Public ──────────────────────────────────────────── */}
            <Route path="/"               element={<LandingPage />} />
            <Route path="/public"         element={<PublicDashboard />} />
            <Route path="/public/reports" element={<PublicReports />} />
            <Route path="/page/:slug"     element={<LandingPage />} />
            <Route path="/login"          element={<LoginPage />} />
            <Route path="/forgot-password"element={<ForgotPasswordPage />} />
            <Route path="/ndi/setup"      element={<NDIProfileSetup />} />

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
            <Route path="/admin/frontend/landing" element={<Protected adminOnly><LandingPageEditor /></Protected>} />
            <Route path="/admin/frontend/faqs"    element={<Protected adminOnly><LandingPageEditor /></Protected>} />
            <Route path="/admin/frontend/pages"   element={<Protected adminOnly><LandingPageEditor /></Protected>} />
            <Route path="/admin/audit-logs"      element={<Protected module="admin_system" action="can_view"><AuditLogsPage /></Protected>} />
            <Route path="/admin/sessions"        element={<Protected adminOnly><SessionsPage /></Protected>} />
            <Route path="/system/jobs"           element={<Protected adminOnly><JobsPage /></Protected>} />

            {/* ── Account — available to all authenticated users ───── */}
            <Route path="/account/settings" element={<Protected><AccountSettingsPage /></Protected>} />
            <Route path="/account/profile"  element={<Protected><MyProfilePage /></Protected>} />

            {/* ── Master Data — module: "master_data" ─────────────────── */}
            <Route path="/admin/master-data/energy-supply"           element={<Protected module="master_data" action="can_view"><EnergySupply /></Protected>} />
            <Route path="/admin/master-data/conversion-factors"      element={<Protected module="master_data" action="can_view"><ConversionFactors /></Protected>} />
            <Route path="/admin/master-data/sectors"                 element={<Protected module="master_data" action="can_view"><Sectors /></Protected>} />
            <Route path="/admin/master-data/electricity-categories"  element={<Protected module="master_data" action="can_view"><ElectricityCategories /></Protected>} />
            <Route path="/admin/master-data/vehicle-types"           element={<Protected module="master_data" action="can_view"><VehicleTypes /></Protected>} />
            <Route path="/admin/master-data/mileage"                 element={<Protected module="master_data" action="can_view"><Mileage /></Protected>} />
            <Route path="/admin/master-data/biogas-sizes"            element={<Protected module="master_data" action="can_view"><BiogasSizes /></Protected>} />
            <Route path="/admin/master-data/solar-sizes"             element={<Protected module="master_data" action="can_view"><SolarEnergy /></Protected>} />
            <Route path="/admin/master-data/industry-classification" element={<Protected module="master_data" action="can_view"><IndustryClassification /></Protected>} />

            {/* ── Data Settings — module: "master_data" ─────────────── */}
            <Route path="/admin/master-data"                         element={<Protected module="master_data" action="can_view"><MasterDataIndex /></Protected>} />
            {/* Redirect legacy individual setting pages to Master Data */}
            <Route path="/admin/master-data/energy-supply"           element={<Navigate to="/admin/master-data/energy-supply" replace />} />
            <Route path="/admin/master-data/conversion-factors"      element={<Navigate to="/admin/master-data/conversion-factors" replace />} />
            <Route path="/admin/master-data/sectors"                 element={<Navigate to="/admin/master-data/sectors" replace />} />
            <Route path="/admin/master-data/electricity-categories"  element={<Navigate to="/admin/master-data/electricity-categories" replace />} />
            <Route path="/admin/master-data/vehicle-types"           element={<Navigate to="/admin/master-data/vehicle-types" replace />} />
            <Route path="/admin/master-data/mileage"                 element={<Navigate to="/admin/master-data/mileage" replace />} />
            <Route path="/admin/master-data/biogas-sizes"            element={<Navigate to="/admin/master-data/biogas-sizes" replace />} />
            <Route path="/admin/master-data/solar-sizes"             element={<Navigate to="/admin/master-data/solar-sizes" replace />} />
            <Route path="/admin/master-data/industry-classification" element={<Navigate to="/admin/master-data/industry-classification" replace />} />
            
            {/* Catch-all for legacy master-data links */}
            <Route path="/admin/master-data/*" element={<Navigate to="/admin/master-data" replace />} />

            <Route path="/admin/master-data/conversion-units"           element={<Protected module="master_data" action="can_view"><ConversionUnits /></Protected>} />
            <Route path="/admin/master-data/electricity-types"          element={<Protected module="master_data" action="can_view"><ElectricityTypes /></Protected>} />

            <Route path="/admin/master-data/fuel-types"                 element={<Protected module="master_data" action="can_view"><FuelTypes /></Protected>} />
            <Route path="/admin/master-data/vehicle-fuel-types"         element={<Protected module="master_data" action="can_view"><VehicleFuelTypes /></Protected>} />
            <Route path="/admin/master-data/production-types"           element={<Protected module="master_data" action="can_view"><ProductionTypes /></Protected>} />
            <Route path="/admin/master-data/panel-types"                element={<Protected module="master_data" action="can_view"><PanelTypes /></Protected>} />
            <Route path="/admin/master-data/industry-categories"        element={<Protected module="master_data" action="can_view"><IndustryCategories /></Protected>} />
            <Route path="/admin/master-data/measurement-units"          element={<Protected module="master_data" action="can_view"><MeasurementUnits /></Protected>} />
            <Route path="/admin/master-data/energy-categories"          element={<Protected module="master_data" action="can_view"><EnergyCategories /></Protected>} />
            <Route path="/admin/master-data/dzongkhags"         element={<Protected module="master_data" action="can_view"><Dzongkhags /></Protected>} />
            <Route path="/admin/master-data/years"              element={<Protected module="master_data" action="can_view"><DataYears /></Protected>} />
            <Route path="/admin/master-data/data-sources"       element={<Protected module="master_data" action="can_view"><DataSources /></Protected>} />
            <Route path="/admin/master-data/bpc-categories"     element={<Protected module="master_data" action="can_view"><BPCCategories /></Protected>} />
            <Route path="/admin/master-data/plants"             element={<Protected module="master_data" action="can_view"><GenerationPlants /></Protected>} />
            <Route path="/admin/master-data/substations"        element={<Protected module="master_data" action="can_view"><Substations /></Protected>} />
            <Route path="/admin/master-data/substation-transformers" element={<Protected module="master_data" action="can_view"><SubstationTransformers /></Protected>} />
            <Route path="/admin/master-data/countries"          element={<Protected module="master_data" action="can_view"><Countries /></Protected>} />

            {/* Redirect legacy nested settings to flattened paths */}
            <Route path="/admin/master-data/settings/:module"   element={<Protected module="master_data" action="can_view"><LookupRedirect /></Protected>} />
            <Route path="/admin/master-data/settings"           element={<Protected module="master_data" action="can_view"><Navigate to="/admin/master-data" replace /></Protected>} />

            {/* ── Data Collection — module per energy type ─────────── */}
            <Route path="/admin/data-collection"             element={<Protected module="master_data" action="can_view"><DataCollectionIndex /></Protected>} />
            {/* Redirect legacy DC settings to Data Settings */}
            <Route path="/admin/data-collection/settings/*"  element={<Navigate to="/admin/master-data/settings" replace />} />
            
            <Route path="/admin/data-collection/electricity" element={<Protected module="electricity_data" action="can_view"><ElectricityPage /></Protected>} />
            <Route path="/admin/data-collection/pol"         element={<Protected module="master_data" action="can_view"><PolPage /></Protected>} />
            <Route path="/admin/data-collection/coal"        element={<Protected module="master_data" action="can_view"><CoalPage /></Protected>} />
            <Route path="/admin/data-collection/fuelwood"    element={<Protected module="master_data" action="can_view"><FuelwoodPage /></Protected>} />
            <Route path="/admin/data-collection/biomass"     element={<Protected module="master_data" action="can_view"><BiomassPage /></Protected>} />
            <Route path="/admin/data-collection/solar"       element={<Protected module="master_data" action="can_view"><SolarPage /></Protected>} />
            <Route path="/admin/data-collection/surface-transport"   element={<Protected module="surface_transport_data" action="can_view"><SurfaceTransportPage /></Protected>} />
            <Route path="/admin/data-collection/air-transport"       element={<Protected module="air_transport_data" action="can_view"><AirTransportPage /></Protected>} />
            <Route path="/admin/data-collection/transport"           element={<Navigate to="/admin/data-collection/surface-transport" replace />} />
            <Route path="/admin/data-collection/industry"    element={<Protected module="master_data" action="can_view"><IndustryPage /></Protected>} />

            {/* ── Electricity Portal — module: "electricity_data" ─── */}
            <Route path="/admin/electricity/hydrology"        element={<Protected module="electricity_data" action="can_view"><HydrologyPage /></Protected>} />
            <Route path="/admin/electricity/hydropower/run-of-river" element={<Protected module="electricity_data" action="can_view"><RunOfRiverPage /></Protected>} />
            <Route path="/admin/electricity/hydropower/reservoir" element={<Protected module="electricity_data" action="can_view"><ReservoirHydroPage /></Protected>} />
            <Route path="/admin/electricity/hydropower/pumped" element={<Protected module="electricity_data" action="can_view"><PumpedHydroPage /></Protected>} />
            <Route path="/admin/electricity/generation"       element={<Protected module="electricity_data" action="can_view"><GenerationPage /></Protected>} />
            <Route path="/admin/electricity/substations"      element={<Protected module="electricity_data" action="can_view"><Substations /></Protected>} />
            <Route path="/admin/electricity/lines-transformer" element={<Protected module="electricity_data" action="can_view"><InfrastructurePage defaultTab="transmission" /></Protected>} />
            <Route path="/admin/electricity/sales"            element={<Protected module="electricity_data" action="can_view"><SalesConsumersPage /></Protected>} />
            <Route path="/admin/electricity/trade"            element={<Protected module="electricity_data" action="can_view"><TradePage /></Protected>} />
            <Route path="/admin/electricity/forecasting"      element={<Protected module="electricity_data" action="can_view"><ForecastingPage /></Protected>} />
            <Route path="/admin/electricity/others"           element={<Protected module="electricity_data" action="can_view"><OthersPage /></Protected>} />
            
            {/* New placeholders */}
            <Route path="/admin/electricity/tariff"           element={<Protected module="electricity_data" action="can_view"><ComingSoon label="Electricity Tariff" breadcrumb="Electricity" /></Protected>} />
            <Route path="/admin/thermal/solar-water-heating"  element={<Protected module="master_data" action="can_view"><ComingSoon label="Solar Water Heating Systems" breadcrumb="Thermal Energy" /></Protected>} />
            <Route path="/admin/thermal/liquid-fuels"         element={<Protected module="master_data" action="can_view"><ComingSoon label="Liquid Fuels" breadcrumb="Thermal Energy" /></Protected>} />
            <Route path="/admin/thermal/solid-fuels"          element={<Protected module="master_data" action="can_view"><ComingSoon label="Solid Fuels" breadcrumb="Thermal Energy" /></Protected>} />
            <Route path="/admin/fossil-trade/liquid-import"   element={<Protected module="master_data" action="can_view"><ComingSoon label="Liquid Fuel Import" breadcrumb="Fossil Fuel Trade" /></Protected>} />
            <Route path="/admin/fossil-trade/solid-import"    element={<Protected module="master_data" action="can_view"><ComingSoon label="Solid Fuel Import" breadcrumb="Fossil Fuel Trade" /></Protected>} />
            <Route path="/admin/fossil-trade/solid-export"    element={<Protected module="master_data" action="can_view"><ComingSoon label="Solid Fuel Export" breadcrumb="Fossil Fuel Trade" /></Protected>} />

            {/* ── Reports ──────────────────────────────────────────── */}
            <Route path="/reports"        element={<Protected><ReportsIndex /></Protected>} />
            <Route path="/reports/energy" element={<Protected><EnergyReportPage /></Protected>} />
            <Route path="/reports/ghg"    element={<Protected><GHGReportPage /></Protected>} />

            {/* ── Catch-all ─────────────────────────────────────────── */}
            <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
    );
}