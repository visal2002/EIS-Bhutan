# backend/eis_apps/authentication/models.py
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.db import models
from django.utils import timezone
from datetime import timedelta
from eis_core.models import TimeStampedModel


class Role(models.Model):
    ADMIN        = "ADMIN"
    DOE_HEAD     = "DOE_HEAD"
    DATA_MANAGER = "DATA_MANAGER"
    DATA_FOCAL   = "DATA_FOCAL"
    VIEWER       = "VIEWER"
    ROLE_CHOICES = [
        (ADMIN,        "System Administrator"),
        (DOE_HEAD,     "DOE Head"),
        (DATA_MANAGER, "Data Manager"),
        (DATA_FOCAL,   "Data Focal"),
        (VIEWER,       "Viewer"),
    ]
    role_name   = models.CharField(max_length=50, unique=True, choices=ROLE_CHOICES)
    description = models.TextField(blank=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "authentication"
        db_table  = "auth_role"

    def __str__(self):
        return self.get_role_name_display()


class UserManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        user  = self.model(username=username, email=email, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, password=None, **extra):
        extra.setdefault("is_staff",     True)
        extra.setdefault("is_superuser", True)
        return self.create_user(username, email, password, **extra)


class User(AbstractBaseUser, PermissionsMixin, TimeStampedModel):
    STATUS_ACTIVE    = "ACTIVE"
    STATUS_INACTIVE  = "INACTIVE"
    STATUS_SUSPENDED = "SUSPENDED"
    STATUS_DELETED   = "DELETED"
    STATUS_CHOICES   = [
        (STATUS_ACTIVE,    "Active"),
        (STATUS_INACTIVE,  "Inactive"),
        (STATUS_SUSPENDED, "Suspended"),
        (STATUS_DELETED,   "Deleted"),
    ]
    GENDER_CHOICES = [("M", "Male"), ("F", "Female"), ("O", "Other")]

    # ── Your original fields (unchanged) ──────────────────────────
    employee_id           = models.CharField(max_length=50, unique=True, blank=True, null=True)
    username              = models.CharField(max_length=150, unique=True)
    email                 = models.EmailField(unique=True, blank=True, null=True)
    first_name            = models.CharField(max_length=100)
    last_name             = models.CharField(max_length=100)
    gender                = models.CharField(max_length=1, choices=GENDER_CHOICES, blank=True)
    contact_no            = models.CharField(max_length=20, blank=True)
    avatar                = models.ImageField(upload_to='avatars/', blank=True, null=True)
    role                  = models.ForeignKey(Role, on_delete=models.PROTECT, null=True, related_name="users")
    status                = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_ACTIVE)
    is_staff              = models.BooleanField(default=False)
    is_mfa_enabled        = models.BooleanField(default=False)
    mfa_secret            = models.CharField(max_length=64, blank=True)
    email_verified        = models.BooleanField(default=False)
    phone_verified        = models.BooleanField(default=False)
    email_otp             = models.CharField(max_length=6, blank=True)
    phone_otp             = models.CharField(max_length=6, blank=True)
    otp_expires_at        = models.DateTimeField(null=True, blank=True)
    failed_login_attempts = models.PositiveSmallIntegerField(default=0)
    locked_until          = models.DateTimeField(null=True, blank=True)
    last_login            = models.DateTimeField(null=True, blank=True)
    password_changed_at   = models.DateTimeField(null=True, blank=True)

    # ── NDI fields ─────────────────────────────────────────────────
    ndi_sub               = models.CharField(max_length=255, blank=True, unique=True, null=True)
    # Stores the DID key: e.g. did:key:z6Mkmnx2x5iHZAuKxSn6T7H51r8Jv6FUxfYRUDV3tA8YZbiW
    # This is the permanent identifier for the NDI user — used for future logins
    ndi_id_number         = models.CharField(max_length=100, blank=True, null=True)
    # The CID / National ID number from the NDI Foundational ID proof

    # ── Added fields ───────────────────────────────────────────────
    department            = models.CharField(max_length=200, blank=True)
    dzongkhag             = models.CharField(max_length=100, blank=True)
    password_expires_at   = models.DateTimeField(null=True, blank=True)
    must_change_password  = models.BooleanField(default=False)
    last_seen             = models.DateTimeField(null=True, blank=True)
    ndi_verified          = models.BooleanField(default=False)  # NDI identity confirmed
    is_verified           = models.BooleanField(default=False)  # admin verified account

    # ── Soft delete fields ─────────────────────────────────────────
    deleted_at     = models.DateTimeField(null=True, blank=True)
    deleted_by     = models.CharField(max_length=150, blank=True)  # admin username
    deleted_reason = models.TextField(blank=True)

    objects        = UserManager()
    USERNAME_FIELD  = "username"
    REQUIRED_FIELDS = []  # email/employee_id optional — NDI users fill these in profile setup

    class Meta:
        app_label = "authentication"
        db_table  = "auth_user"

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}".strip()

    # ── Properties ────────────────────────────────────────────────
    @property
    def is_active(self):
        return self.status == self.STATUS_ACTIVE

    @property
    def is_deleted(self):
        return self.status == self.STATUS_DELETED

    @property
    def is_account_locked(self):
        return bool(self.locked_until and timezone.now() < self.locked_until)

    @property
    def is_password_expired(self):
        return bool(self.password_expires_at and timezone.now() > self.password_expires_at)

    # ── Login tracking methods ─────────────────────────────────────
    def record_failed_login(self):
        self.failed_login_attempts += 1
        if self.failed_login_attempts >= 5:
            self.locked_until = timezone.now() + timedelta(minutes=30)
        self.save(update_fields=["failed_login_attempts", "locked_until"])

    def record_successful_login(self):
        self.failed_login_attempts = 0
        self.locked_until          = None
        self.last_login            = timezone.now()
        self.save(update_fields=["failed_login_attempts", "locked_until", "last_login"])

    def soft_delete(self, deleted_by_username="", reason=""):
        """Soft-delete: mark as DELETED, never physically remove the row."""
        self.status         = self.STATUS_DELETED
        self.deleted_at     = timezone.now()
        self.deleted_by     = deleted_by_username
        self.deleted_reason = reason
        self.save(update_fields=["status", "deleted_at", "deleted_by", "deleted_reason"])

    def restore(self):
        """Restore a soft-deleted user back to INACTIVE (admin re-activates manually)."""
        self.status         = self.STATUS_INACTIVE
        self.deleted_at     = None
        self.deleted_by     = ""
        self.deleted_reason = ""
        self.save(update_fields=["status", "deleted_at", "deleted_by", "deleted_reason"])

    def unlock_account(self):
        self.failed_login_attempts = 0
        self.locked_until          = None
        self.save(update_fields=["failed_login_attempts", "locked_until"])


class AuditLog(models.Model):
    """Tracks all auth events — login, logout, failures, user changes."""

    class Action(models.TextChoices):
        LOGIN            = "login",            "Login"
        LOGOUT           = "logout",           "Logout"
        LOGIN_FAILED     = "login_failed",     "Login Failed"
        LOCKED           = "locked",           "Account Locked"
        PASSWORD_CHANGE  = "password_change",  "Password Changed"
        NDI_LOGIN        = "ndi_login",        "NDI Login"
        USER_CREATED     = "user_created",     "User Created"
        USER_UPDATED     = "user_updated",     "User Updated"
        USER_DEACTIVATED = "user_deactivated", "User Deactivated"
        DATA_EXPORT      = "data_export",      "Data Exported"
        DATA_IMPORT      = "data_import",      "Data Imported"

    user        = models.ForeignKey(User, null=True, on_delete=models.SET_NULL, related_name="audit_logs")
    action      = models.CharField(max_length=50, choices=Action.choices)
    ip_address  = models.GenericIPAddressField(null=True, blank=True)
    user_agent  = models.TextField(blank=True)
    description = models.TextField(blank=True)
    metadata    = models.JSONField(default=dict, blank=True)
    timestamp   = models.DateTimeField(default=timezone.now)

    class Meta:
        app_label = "authentication"
        db_table  = "auth_audit_log"
        ordering  = ["-timestamp"]

    def __str__(self):
        return f"{self.user} — {self.action} at {self.timestamp:%Y-%m-%d %H:%M}"


class UserSession(models.Model):
    """Your original UserSession — unchanged."""

    user        = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sessions")
    session_key = models.CharField(max_length=255, unique=True)
    ip_address  = models.GenericIPAddressField()
    user_agent  = models.TextField(blank=True)
    expires_at  = models.DateTimeField()
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = "authentication"
        db_table  = "auth_user_session"


# ── Role Permission — module-level CRUD per role ──────────────────
class RolePermission(models.Model):
    """
    Stores per-module permissions for each role.
    Admin can change these via the UI without code changes.
    """
    role         = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions")
    module       = models.CharField(max_length=100)  # e.g. 'electricity_data'
    can_view     = models.BooleanField(default=False)
    can_create   = models.BooleanField(default=False)
    can_edit     = models.BooleanField(default=False)
    can_delete   = models.BooleanField(default=False)
    can_upload   = models.BooleanField(default=False)   # Data Collection: bulk upload files
    can_download = models.BooleanField(default=False)   # Reports: download/export
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        app_label       = "authentication"
        db_table        = "auth_role_permission"
        unique_together = ("role", "module")
        ordering        = ["role__role_name", "module"]

    def __str__(self):
        perms = [p for p, v in [
            ("V", self.can_view), ("C", self.can_create), ("E", self.can_edit),
            ("D", self.can_delete), ("U", self.can_upload), ("DL", self.can_download),
        ] if v]
        return f"{self.role.role_name} → {self.module}: {''.join(perms) or 'none'}"


class DashboardWidget(models.Model):
    """
    Stores per-user dashboard layout — each user can customise
    which widgets (charts/tables) appear and in what order.
    """
    WIDGET_TYPES = [
        ("bar_chart",    "Bar Chart"),
        ("line_chart",   "Line Chart"),
        ("pie_chart",    "Pie Chart"),
        ("area_chart",   "Area Chart"),
        ("stat_card",    "Stat Card"),
        ("data_table",   "Data Table"),
        ("map_view",     "Map View"),
    ]

    user         = models.ForeignKey(
        "User", on_delete=models.CASCADE, related_name="dashboard_widgets"
    )
    widget_type  = models.CharField(max_length=30, choices=WIDGET_TYPES)
    title        = models.CharField(max_length=200)
    data_module  = models.CharField(max_length=100, blank=True)  # e.g. 'electricity_data'
    config       = models.JSONField(default=dict, blank=True)    # chart config, filters, etc.
    position_x   = models.IntegerField(default=0)
    position_y   = models.IntegerField(default=0)
    width        = models.IntegerField(default=6)   # out of 12-col grid
    height       = models.IntegerField(default=4)   # row units
    is_visible   = models.BooleanField(default=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = "authentication"
        db_table  = "auth_dashboard_widget"
        ordering  = ["user", "position_y", "position_x"]

    def __str__(self):
        return f"{self.user.username} — {self.title} ({self.widget_type})"