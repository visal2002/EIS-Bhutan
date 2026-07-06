from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Only System Administrators."""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, "role") and
            request.user.role is not None and
            request.user.role.role_name == "ADMIN"
        )


class IsDataManager(BasePermission):
    """Data Managers and Admins."""
    ALLOWED = {"ADMIN", "DATA_MANAGER"}

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, "role") and
            request.user.role is not None and
            request.user.role.role_name in self.ALLOWED
        )


class IsDOEHead(BasePermission):
    """DOE Head, Data Manager, and Admin (view/export only)."""
    ALLOWED = {"ADMIN", "DATA_MANAGER", "DOE_HEAD"}

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, "role") and
            request.user.role is not None and
            request.user.role.role_name in self.ALLOWED
        )


class IsDataFocal(BasePermission):
    """Data Focals, Data Managers, and Admins."""
    ALLOWED = {"ADMIN", "DATA_MANAGER", "DATA_FOCAL"}

    def has_permission(self, request, view):
        return (
            request.user.is_authenticated and
            hasattr(request.user, "role") and
            request.user.role is not None and
            request.user.role.role_name in self.ALLOWED
        )


class IsAuthenticatedReadOnly(BasePermission):
    """Any authenticated user can read; only admins/managers can write."""
    WRITE_ROLES = {"ADMIN", "DATA_MANAGER"}

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return (
            hasattr(request.user, "role") and
            request.user.role is not None and
            request.user.role.role_name in self.WRITE_ROLES
        )