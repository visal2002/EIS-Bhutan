# backend/eis_apps/administration/management/commands/seed_administration.py
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
import random

from eis_apps.administration.models import SiteSetting, SystemSetting
from eis_apps.authentication.models import User, AuditLog, Role, RolePermission
from eis_apps.authentication.role_permissions import MODULES, DEFAULTS

class Command(BaseCommand):
    help = "Seed Site Branding, System Settings, and Audit Trail for User Management"

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n── EIS Administration Seeding ──────────────────────"))

        # ── 1. Seed Site Settings (Branding) ───────────────────────
        self.stdout.write("  Seeding Site Settings...", ending=" ")
        site = SiteSetting.get()
        site.site_title      = "Energy Information System"
        site.site_short_name = "EIS"
        site.site_tagline    = "Department of Energy · MoENR · Royal Government of Bhutan"
        site.contact_email   = "support@energy.gov.bt"
        site.contact_phone   = "+975-2-322141"
        site.contact_address = "Department of Energy, MoENR, Thimphu, Bhutan"
        site.website_url     = "https://www.moenr.gov.bt"
        site.footer_text     = "© 2026 Department of Energy, MoENR, Royal Government of Bhutan. All rights reserved."
        
        # Social links
        site.facebook_url    = "https://www.facebook.com/moenrbhutan"
        site.twitter_url     = "https://twitter.com/moenrbhutan"
        
        # Support/System defaults
        site.max_login_attempts = 5
        site.session_timeout    = 480 # 8 hours
        site.save()
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── 2. Seed System Settings (Technical) ───────────────────
        self.stdout.write("  Seeding System Settings...", ending=" ")
        from django.conf import settings as django_settings
        sys = SystemSetting.get()
        
        # Sync with .env / settings.py
        sys.app_env           = "development" if django_settings.DEBUG else "production"
        sys.debug_mode        = django_settings.DEBUG
        sys.allowed_hosts     = ",".join(django_settings.ALLOWED_HOSTS) if django_settings.ALLOWED_HOSTS else "localhost"
        
        # Handle CORS (if defined in settings)
        cors = getattr(django_settings, "CORS_ALLOWED_ORIGINS", ["http://localhost:5173"])
        sys.cors_origins      = ",".join(cors) if isinstance(cors, list) else str(cors)
        
        # NDI Staging Defaults (from Bhutan NDI Doc V1.2)
        sys.ndi_environment   = "staging"
        sys.ndi_webhook_id    = "eis-bhutan-26"
        sys.ndi_webhook_base_url = "https://your-ngrok-url.ngrok-free.dev"
        sys.ndi_auth_url      = "https://staging.bhutanndi.com/authentication/v1/authenticate"
        sys.ndi_verifier_url  = "https://demo-client.bhutanndi.com/verifier/v1/proof-request"
        sys.save()
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── 3. Update Role & Permission Matrix ──────────────
        self.stdout.write("  Updating Role Descriptions & Permissions...", ending=" ")
        role_metadata = {
            "ADMIN":        "System Administrator with full access to configuration, user management, and audit logs.",
            "DOE_HEAD":     "Department Head / Director with oversight authority, approval rights, and high-level reporting access.",
            "DATA_MANAGER": "Energy Data Manager responsible for validating, clearing, and managing sectoral data collection.",
            "DATA_FOCAL":   "Sectoral Focal Point responsible for periodic data entry and document uploads for specific energy carriers.",
            "VIEWER":       "Public or Inter-agency user with read-only access to published reports and dashboards.",
        }

        for role_name, description in role_metadata.items():
            # Ensure role exists and has correct description
            role, _ = Role.objects.get_or_create(
                role_name=role_name,
                defaults={"description": description}
            )
            if role.description != description:
                role.description = description
                role.save(update_fields=["description"])

            # Sync Permissions from DEFAULTS
            role_defaults = DEFAULTS.get(role_name, {})
            for (module_key, _, _) in MODULES:
                perms = role_defaults.get(module_key, {
                    "can_view": False, "can_create": False, "can_edit": False, 
                    "can_delete": False, "can_upload": False, "can_download": False
                })

                RolePermission.objects.update_or_create(
                    role=role, 
                    module=module_key,
                    defaults={
                        "can_view":     perms.get("can_view", False),
                        "can_create":   perms.get("can_create", False),
                        "can_edit":     perms.get("can_edit", False),
                        "can_delete":   perms.get("can_delete", False),
                        "can_upload":   perms.get("can_upload", False),
                        "can_download": perms.get("can_download", False),
                    }
                )
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── 4. Update User Profiles (Bhutan Context) ──────────────
        self.stdout.write("  Updating User Profiles...", ending=" ")
        dept_map = {
            "admin.demo":    "IT & Systems Section",
            "doehead.demo":  "Directorate Services",
            "manager.demo":  "Energy Data & Hydropower Division",
            "focal.demo":    "Renewable Energy Division",
            "viewer.demo":   "Planning & Policy Division",
        }
        dzongkhag_pool = ["Thimphu", "Paro", "Punakha", "Wangdue Phodrang", "Bumthang"]
        
        for username, dept in dept_map.items():
            try:
                user = User.objects.get(username=username)
                user.department = dept
                user.dzongkhag  = random.choice(dzongkhag_pool)
                user.save()
            except User.DoesNotExist:
                pass
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── 4. Seed Audit Trail (Activity History) ────────────────
        self.stdout.write("  Seeding Audit Activity Trail...", ending=" ")
        # Clear existing logs for a fresh start
        AuditLog.objects.all().delete()
        
        users = list(User.objects.all())
        if users:
            actions = [
                (AuditLog.Action.LOGIN,            "Login",              "User logged into the system"),
                (AuditLog.Action.LOGIN_FAILED,     "Login Failed",       "Multiple failed attempts detected from IP: 10.1.2.23"),
                (AuditLog.Action.USER_UPDATED,     "User Profile",       "Admin updated focal point department"),
                (AuditLog.Action.DATA_EXPORT,      "Data Export",        "Exported Electricity data for 2025"),
                (AuditLog.Action.USER_CREATED,     "Account Setup",      "New viewer account provisioned"),
            ]
            
            # Create ~15 realistic history entries
            now = timezone.now()
            for i in range(15):
                user = random.choice(users)
                act, lbl, desc = random.choice(actions)
                # Failures shouldn't happen to the current user in all logs
                if act == AuditLog.Action.LOGIN_FAILED:
                    desc = f"Failed login attempt for {user.username} from unauthorized IP"
                
                AuditLog.objects.create(
                    user        = user,
                    action      = act,
                    ip_address  = f"172.16.1.{random.randint(10, 50)}",
                    description = desc,
                    timestamp   = now - timedelta(hours=random.randint(1, 48), minutes=random.randint(0, 59))
                )
        self.stdout.write(self.style.SUCCESS("✓"))

        self.stdout.write(self.style.MIGRATE_HEADING("\n── Seeding Complete ───────────────────────────────\n"))
