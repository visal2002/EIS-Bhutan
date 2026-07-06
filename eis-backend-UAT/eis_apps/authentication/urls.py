# backend/eis_apps/authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views
from . import roles_views
from .admin_views import AdminTokenLoginView

urlpatterns = [
    # ── Login / Logout ────────────────────────────────────────────
    path("login/",           views.LoginView.as_view(),          name="auth-login"),
    path("logout/",          views.LogoutView.as_view(),         name="auth-logout"),
    path("token/refresh/",   TokenRefreshView.as_view(),         name="auth-token-refresh"),

    # ── Current user profile ──────────────────────────────────────
    path("me/",                views.MeView.as_view(),             name="auth-me"),
    path("me/permissions/",    views.MePermissionsView.as_view(),  name="auth-me-permissions"),
    path("change-password/",   views.ChangePasswordView.as_view(), name="auth-change-password"),

    # ── NDI — Bhutan NDI Wallet integration ──────────────────────
    path("ndi/initiate/",   views.NDIInitiateView.as_view(),       name="ndi-initiate"),
    path("ndi/status/",     views.NDIStatusView.as_view(),         name="ndi-status"),
    path("ndi/webhook/",    views.NDIWebhookView.as_view(),        name="ndi-webhook"),
    path("ndi/profile/",    views.NDIProfileCompleteView.as_view(),name="ndi-profile"),

    # ── Roles & Permissions ───────────────────────────────────────
    path("roles/",                          roles_views.RoleListView.as_view(),        name="role-list"),
    path("roles/<int:role_id>/",            roles_views.RoleDetailView.as_view(),      name="role-detail"),
    path("roles/<int:role_id>/permissions/",roles_views.RolePermissionsView.as_view(), name="role-permissions"),
    path("permissions/modules/",            roles_views.ModuleListView.as_view(),      name="module-list"),
    path("permissions/seed/",               roles_views.SeedPermissionsView.as_view(), name="permissions-seed"),
    # ── User management ───────────────────────────────────────────
    path("users/",                              views.UserListCreateView.as_view(),       name="user-list-create"),
    path("users/trash/",                         views.UserTrashListView.as_view(),        name="user-trash-list"),
    path("users/<int:pk>/",                      views.UserDetailView.as_view(),           name="user-detail"),
    path("users/<int:pk>/restore/",              views.UserRestoreView.as_view(),          name="user-restore"),
    path("users/<int:pk>/permanent-delete/",     views.UserPermanentDeleteView.as_view(),  name="user-permanent-delete"),
    path("users/<int:user_id>/role/",            roles_views.UserRoleUpdateView.as_view(), name="user-role-update"),

    # ── Audit logs ────────────────────────────────────────────────
    path("audit-logs/",      views.AuditLogListView.as_view(),   name="audit-logs"),
    path("sessions/",        views.UserSessionListView.as_view(), name="session-list"),
    path("sessions/<int:pk>/", views.UserSessionDeleteView.as_view(), name="session-revoke"),

    # ── MFA — Google Authenticator (TOTP) ────────────────────────
    path("mfa/setup/",       views.MFASetupView.as_view(),       name="mfa-setup"),
    path("mfa/verify/",      views.MFAVerifyView.as_view(),      name="mfa-verify"),
    path("mfa/disable/",     views.MFADisableView.as_view(),     name="mfa-disable"),

    # ── Email verification ────────────────────────────────────────
    path("verify-email/send/",    views.SendEmailOTPView.as_view(),   name="verify-email-send"),
    path("verify-email/confirm/", views.VerifyEmailOTPView.as_view(), name="verify-email-confirm"),

    # ── Phone verification ────────────────────────────────────────
    path("verify-phone/send/",    views.SendPhoneOTPView.as_view(),   name="verify-phone-send"),
    path("verify-phone/confirm/", views.VerifyPhoneOTPView.as_view(), name="verify-phone-confirm"),

    # ── Account ───────────────────────────────────────────────────
    path("delete-account/",      views.DeleteAccountView.as_view(),         name="delete-account"),
    path("forgot-password/",     views.ForgotPasswordView.as_view(),        name="forgot-password"),
    path("reset-password/",      views.ResetPasswordView.as_view(),         name="reset-password"),

    # ── Dashboard widgets ────────────────────────────────────────
    path("dashboard/widgets/",            views.DashboardWidgetListView.as_view(),   name="dashboard-widgets"),
    path("dashboard/widgets/<int:pk>/",   views.DashboardWidgetDetailView.as_view(), name="dashboard-widget-detail"),

    # ── Admin session (called by React after login) ───────────────
    path("admin-session/",   AdminTokenLoginView.as_view(),      name="admin-session"),
]