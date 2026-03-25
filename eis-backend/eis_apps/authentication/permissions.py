# backend/eis_apps/authentication/permissions.py
from rest_framework.permissions import BasePermission


# Match exactly what's in your Role model
ADMIN        = "ADMIN"
DOE_HEAD     = "DOE_HEAD"
DATA_MANAGER = "DATA_MANAGER"
DATA_FOCAL   = "DATA_FOCAL"
VIEWER       = "VIEWER"


def get_user_role(user):
    """Get role string from user's FK role object."""
    if user.role:
        return user.role.role_name
    return None


def _build_permissions(user):
    """
    Build a flat permissions dict from the user's role RolePermission rows.
    Returns: { "module_key": { "can_view": bool, "can_create": bool, "can_edit": bool, "can_delete": bool } }
    ADMIN always gets everything regardless of DB rows.
    """
    if not user or not user.role:
        return {}
    if user.role.role_name == ADMIN or user.is_superuser:
        # Admin has full access to all modules
        from .role_permissions import MODULES
        return {
            m[0]: {
                "can_view": True, "can_create": True, "can_edit": True,
                "can_delete": True, "can_upload": True, "can_download": True,
            }
            for m in MODULES
        }
    from .models import RolePermission
    rows = RolePermission.objects.filter(role=user.role)
    return {
        row.module: {
            "can_view":     row.can_view,
            "can_create":   row.can_create,
            "can_edit":     row.can_edit,
            "can_delete":   row.can_delete,
            "can_upload":   row.can_upload,
            "can_download": row.can_download,
        }
        for row in rows
    }


class HasModulePermission(BasePermission):
    """
    DRF permission class for module-level access.
    Usage in a view:
        permission_classes = [IsAuthenticated, HasModulePermission]
        required_module    = "electricity_data"
        required_action    = "can_view"   # or can_create / can_edit / can_delete
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        # Superusers/ADMIN always pass
        if request.user.is_superuser:
            return True
        if request.user.role and request.user.role.role_name == ADMIN:
            return True

        module = getattr(view, "required_module", None)
        action = getattr(view, "required_action", "can_view")

        if not module:
            return True  # No module guard set — allow

        from .models import RolePermission
        try:
            perm = RolePermission.objects.get(role=request.user.role, module=module)
            return getattr(perm, action, False)
        except RolePermission.DoesNotExist:
            return False


class IsSystemAdmin(BasePermission):
    """Only System Administrators."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) == ADMIN
        )


class IsSystemAdminOrDOEHead(BasePermission):
    """System Admin or DOE Head."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) in [ADMIN, DOE_HEAD]
        )


class IsDataManagerOrAbove(BasePermission):
    """Data Manager, DOE Head, or System Admin."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) in [ADMIN, DOE_HEAD, DATA_MANAGER]
        )


class IsDataFocalOrAbove(BasePermission):
    """Any role except Viewer."""
    def has_permission(self, request, view):
        return (
            request.user
            and request.user.is_authenticated
            and get_user_role(request.user) in [ADMIN, DOE_HEAD, DATA_MANAGER, DATA_FOCAL]
        )


class ReadOnly(BasePermission):
    """Allow GET, HEAD, OPTIONS only."""
    def has_permission(self, request, view):
        return request.method in ("GET", "HEAD", "OPTIONS")