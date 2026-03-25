/**
 * Centralized role → dashboard route mapping.
 * Used by App.jsx (redirect logic) and LoginPage.jsx (post-login navigation).
 */
export const ROLE_DASHBOARD_ROUTES = {
    ADMIN:        '/admin/dashboard',
    DOE_HEAD:     '/doe/dashboard',
    DATA_MANAGER: '/manager/dashboard',
    DATA_FOCAL:   '/focal/dashboard',
    VIEWER:       '/viewer/dashboard',
};
