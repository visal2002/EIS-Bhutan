# backend/eis_apps/authentication/admin.py
from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display
from .models import User, AuditLog, UserSession, Role, RolePermission


# ── Role Permission Inline ────────────────────────────────────────
class RolePermissionInline(TabularInline):
    model      = RolePermission
    extra      = 0
    fields     = ["module", "can_view", "can_create", "can_edit", "can_delete"]
    can_delete = False
    verbose_name = "Module Permission"
    verbose_name_plural = "Module Permissions"

    def has_add_permission(self, request, obj=None):
        return False


# ── Role Admin ────────────────────────────────────────────────────
@admin.register(Role)
class RoleAdmin(ModelAdmin):
    list_display = ["get_role_badge", "description", "get_perm_summary", "created_at"]
    search_fields = ["role_name", "description"]
    ordering = ["role_name"]
    inlines = [RolePermissionInline]

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if "role_name" in form.base_fields:
            from django import forms
            form.base_fields["role_name"].widget = forms.TextInput(
                attrs={"placeholder": "ADMIN / DOE_HEAD / DATA_MANAGER / DATA_FOCAL / VIEWER"}
            )
        return form

    def has_add_permission(self, request):              return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True

    @display(description="Role")
    def get_role_badge(self, obj):
        colors = {
            "ADMIN":        "#DC2626",
            "DOE_HEAD":     "#7C3AED",
            "DATA_MANAGER": "#2563EB",
            "DATA_FOCAL":   "#059669",
            "VIEWER":       "#64748B",
        }
        color = colors.get(obj.role_name, "#64748B")
        return format_html(
            '<span style="background:{};color:#fff;padding:3px 12px;'
            'border-radius:12px;font-size:11px;font-weight:700">{}</span>',
            color, obj.role_name
        )

    @display(description="Permissions")
    def get_perm_summary(self, obj):
        perms    = RolePermission.objects.filter(role=obj)
        total    = perms.count()
        can_view = perms.filter(can_view=True).count()
        can_edit = perms.filter(can_edit=True).count()
        if total == 0:
            return format_html('<span style="color:#94A3B8">No permissions seeded — run seed_permissions</span>')
        return format_html(
            '<span style="color:#64748B;font-size:11px">'
            '👁 {} view &nbsp; ✏️ {} edit &nbsp;/ {} modules</span>',
            can_view, can_edit, total
        )


# ── User Admin ────────────────────────────────────────────────────
@admin.register(User)
class UserAdmin(ModelAdmin):
    list_display    = ["username", "get_full_name_col", "email", "get_role_col",
                       "get_status_col", "get_ndi_col", "last_login"]
    list_filter     = ["status", "role", "is_verified", "ndi_verified", "department"]
    search_fields   = ["username", "first_name", "last_name", "email", "employee_id"]
    ordering        = ["first_name", "last_name"]
    readonly_fields = ["password_changed_at", "failed_login_attempts",
                       "last_login", "last_seen", "ndi_sub", "ndi_id_number"]

    fieldsets = (
        ("Identity", {
            "fields": (
                ("username", "employee_id"),
                ("first_name", "last_name"),
                ("email", "contact_no"),
                "gender",
            ),
        }),
        ("Role & Department", {
            "fields": (
                ("role", "status"),
                ("department", "dzongkhag"),
                ("is_staff", "is_superuser"),
                ("is_verified", "is_mfa_enabled"),
            ),
        }),
        ("NDI — Read Only", {
            "fields": (
                ("ndi_sub", "ndi_id_number"),
                "ndi_verified",
            ),
        }),
        ("Password Policy", {
            "fields": (
                ("password_changed_at", "password_expires_at"),
                ("failed_login_attempts", "locked_until"),
                "must_change_password",
            ),
        }),
        ("Activity", {
            "fields": (("last_login", "last_seen"),),
        }),
        ("Django Permissions", {
            "classes": ("collapse",),
            "fields": ("groups", "user_permissions"),
        }),
    )

    add_fieldsets = (
        ("New User", {
            "classes": ("wide",),
            "fields": (
                ("username", "employee_id"),
                ("first_name", "last_name"),
                "email",
                ("role", "department"),
                ("password1", "password2"),
            ),
        }),
    )

    def has_add_permission(self, request):              return True
    def has_change_permission(self, request, obj=None): return True
    def has_delete_permission(self, request, obj=None): return True

    @display(description="Full Name", ordering="first_name")
    def get_full_name_col(self, obj):
        name = obj.get_full_name()
        return name if name.strip() else "—"

    @display(description="Role")
    def get_role_col(self, obj):
        if not obj.role:
            return format_html('<span style="color:#94A3B8">—</span>')
        colors = {
            "ADMIN":        "#DC2626",
            "DOE_HEAD":     "#7C3AED",
            "DATA_MANAGER": "#2563EB",
            "DATA_FOCAL":   "#059669",
            "VIEWER":       "#64748B",
        }
        color = colors.get(obj.role.role_name, "#64748B")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.role.role_name
        )

    @display(description="Status")
    def get_status_col(self, obj):
        colors = {
            "ACTIVE":    "#059669",
            "INACTIVE":  "#64748B",
            "SUSPENDED": "#DC2626",
        }
        color = colors.get(obj.status, "#64748B")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, obj.status
        )

    @display(description="NDI")
    def get_ndi_col(self, obj):
        if obj.ndi_verified:
            return format_html('<span style="color:#059669;font-weight:600">✓ Verified</span>')
        return format_html('<span style="color:#94A3B8">—</span>')


# ── Audit Log Admin ───────────────────────────────────────────────
@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    list_display    = ["get_user_col", "get_action_col", "ip_address",
                       "timestamp", "description"]
    list_filter     = ["action", "timestamp"]
    search_fields   = ["user__username", "user__first_name", "description", "ip_address"]
    readonly_fields = ["user", "action", "ip_address", "user_agent",
                       "description", "metadata", "timestamp"]
    ordering        = ["-timestamp"]

    def has_add_permission(self, request):              return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return True

    @display(description="User")
    def get_user_col(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "System"

    @display(description="Action")
    def get_action_col(self, obj):
        colors = {
            "login":            "#059669",
            "logout":           "#64748B",
            "login_failed":     "#DC2626",
            "locked":           "#DC2626",
            "password_change":  "#2563EB",
            "ndi_login":        "#7C3AED",
            "user_created":     "#059669",
            "user_updated":     "#F59E0B",
            "user_deactivated": "#DC2626",
        }
        action = obj.action or ""
        color  = colors.get(action.lower(), "#64748B")
        return format_html(
            '<span style="background:{};color:#fff;padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            color, action.upper()
        )


# ── User Session Admin ────────────────────────────────────────────
@admin.register(UserSession)
class UserSessionAdmin(ModelAdmin):
    list_display    = ["user", "ip_address", "created_at", "expires_at", "get_active_col"]
    list_filter     = ["is_active"]
    search_fields   = ["user__username", "ip_address"]
    readonly_fields = ["user", "session_key", "ip_address", "user_agent",
                       "created_at", "expires_at"]

    def has_add_permission(self, request):              return False
    def has_change_permission(self, request, obj=None): return False
    def has_delete_permission(self, request, obj=None): return True

    @display(description="Active")
    def get_active_col(self, obj):
        if obj.is_active:
            return format_html('<span style="color:#059669;font-weight:600">● Active</span>')
        return format_html('<span style="color:#DC2626">● Expired</span>')