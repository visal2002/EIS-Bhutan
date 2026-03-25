// src/context/PermissionsContext.jsx
/**
 * Stores the current user's module permissions fetched from the backend.
 * Shape: { module_key: { can_view, can_create, can_edit, can_delete } }
 *
 * Permissions are:
 *  - Loaded from localStorage on mount (set during login)
 *  - Refreshable via refreshPermissions() — call after role change
 *  - Always full-access for ADMIN role (enforced backend + frontend)
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getUser, getAccessToken, apiFetch } from '../services/api';

const PermissionsContext = createContext(null);

const STORAGE_KEY = 'eis-permissions';

export function PermissionsProvider({ children }) {
    const [permissions, setPermissions] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        } catch {
            return {};
        }
    });

    // Refresh permissions from server (e.g. after role change)
    const refreshPermissions = useCallback(async () => {
        if (!getAccessToken()) return;
        try {
            const res = await apiFetch('/auth/me/permissions/');
            if (res?.ok) {
                const data = await res.json();
                setPermissions(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            }
        } catch {}
    }, []);

    // Re-read from localStorage when storage event fires (e.g. after login)
    useEffect(() => {
        const handler = () => {
            try {
                const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
                setPermissions(stored);
            } catch {}
        };
        window.addEventListener('storage', handler);
        return () => window.removeEventListener('storage', handler);
    }, []);

    // Helper: check if user can do action on module
    const can = useCallback((module, action = 'can_view') => {
        const user = getUser();
        if (!user) return false;
        // ADMIN always passes on frontend too
        if (user.role?.role_name === 'ADMIN' || user.is_superuser) return true;
        return permissions[module]?.[action] === true;
    }, [permissions]);

    // Shorthand helpers
    const canView     = (module) => can(module, 'can_view');
    const canCreate   = (module) => can(module, 'can_create');
    const canEdit     = (module) => can(module, 'can_edit');
    const canDelete   = (module) => can(module, 'can_delete');
    const canUpload   = (module) => can(module, 'can_upload');
    const canDownload = (module) => can(module, 'can_download');

    return (
        <PermissionsContext.Provider value={{ permissions, can, canView, canCreate, canEdit, canDelete, canUpload, canDownload, refreshPermissions }}>
            {children}
        </PermissionsContext.Provider>
    );
}

export const usePermissions = () => useContext(PermissionsContext);

/** Utility — save permissions to localStorage after login */
export function savePermissions(perms) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(perms || {}));
        window.dispatchEvent(new Event('storage'));
    } catch {}
}

/** Utility — clear permissions on logout */
export function clearPermissions() {
    localStorage.removeItem(STORAGE_KEY);
}