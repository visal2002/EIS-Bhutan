# backend/eis_apps/authentication/management/commands/create_demo_users.py
"""
Creates 5 demo users — one per role — for development testing.
Run: python manage.py create_demo_users

Passwords are all:  Demo@1234
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from eis_apps.authentication.models import User, Role, RolePermission
from eis_apps.authentication.role_permissions import MODULES, DEFAULTS


DEMO_USERS = [
    {
        "username":    "admin.demo",
        "email":       "admin@demo.eis.bt",
        "first_name":  "Tshering",
        "last_name":   "Dorji",
        "role":        "ADMIN",
        "employee_id": "EMP-ADMIN-01",
        "department":  "Department of Energy",
        "dzongkhag":   "Thimphu",
        "gender":      "M",
        "contact_no":  "17123456",
    },
    {
        "username":    "doehead.demo",
        "email":       "doehead@demo.eis.bt",
        "first_name":  "Karma",
        "last_name":   "Wangchuk",
        "role":        "DOE_HEAD",
        "employee_id": "EMP-DOE-01",
        "department":  "Department of Energy",
        "dzongkhag":   "Thimphu",
        "gender":      "M",
        "contact_no":  "17234567",
    },
    {
        "username":    "manager.demo",
        "email":       "manager@demo.eis.bt",
        "first_name":  "Pema",
        "last_name":   "Lhamo",
        "role":        "DATA_MANAGER",
        "employee_id": "EMP-MGR-01",
        "department":  "Energy Data Division",
        "dzongkhag":   "Paro",
        "gender":      "F",
        "contact_no":  "17345678",
    },
    {
        "username":    "focal.demo",
        "email":       "focal@demo.eis.bt",
        "first_name":  "Sonam",
        "last_name":   "Choden",
        "role":        "DATA_FOCAL",
        "employee_id": "EMP-FOCAL-01",
        "department":  "Renewable Energy Division",
        "dzongkhag":   "Punakha",
        "gender":      "F",
        "contact_no":  "17456789",
    },
    {
        "username":    "viewer.demo",
        "email":       "viewer@demo.eis.bt",
        "first_name":  "Rinzin",
        "last_name":   "Namgyal",
        "role":        "VIEWER",
        "employee_id": "EMP-VIEW-01",
        "department":  "Planning Division",
        "dzongkhag":   "Wangdue Phodrang",
        "gender":      "M",
        "contact_no":  "17567890",
    },
]

PASSWORD = "Demo@1234"


class Command(BaseCommand):
    help = "Create 5 demo users (one per role) for development testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete existing demo users before creating",
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n── EIS Demo User Setup ─────────────────────────────"))

        # ── Step 1: Ensure roles exist ─────────────────────────────
        self.stdout.write("  Checking roles...", ending=" ")
        role_names = [r[0] for r in Role.ROLE_CHOICES]
        for rn in role_names:
            Role.objects.get_or_create(role_name=rn)
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── Step 2: Seed permissions for all roles ─────────────────
        self.stdout.write("  Seeding permissions...", ending=" ")
        for role in Role.objects.all():
            role_defaults = DEFAULTS.get(role.role_name, {})
            for module_key, _, _ in MODULES:
                perms = role_defaults.get(module_key, {
                    "can_view": False, "can_create": False,
                    "can_edit": False, "can_delete": False,
                    "can_upload": False, "can_download": False,
                })
                RolePermission.objects.update_or_create(
                    role=role, module=module_key, defaults=perms
                )
        self.stdout.write(self.style.SUCCESS("✓"))

        # ── Step 3: Reset if requested ─────────────────────────────
        if options["reset"]:
            usernames = [u["username"] for u in DEMO_USERS]
            deleted, _ = User.objects.filter(username__in=usernames).delete()
            self.stdout.write(f"  Reset: deleted {deleted} existing demo user(s)")

        # ── Step 4: Create demo users ──────────────────────────────
        self.stdout.write("")
        created_count = 0
        skipped_count = 0

        for ud in DEMO_USERS:
            role = Role.objects.get(role_name=ud["role"])

            if User.objects.filter(username=ud["username"]).exists():
                self.stdout.write(
                    f"  ⚠  {ud['username']:<22} already exists — skipped "
                    f"(use --reset to recreate)"
                )
                skipped_count += 1
                continue

            user = User(
                username    = ud["username"],
                email       = ud["email"],
                first_name  = ud["first_name"],
                last_name   = ud["last_name"],
                employee_id = ud["employee_id"],
                role        = role,
                department  = ud["department"],
                dzongkhag   = ud["dzongkhag"],
                gender      = ud["gender"],
                contact_no  = ud["contact_no"],
                status      = User.STATUS_ACTIVE,
                is_staff    = (ud["role"] == "ADMIN"),
                is_verified = True,
                email_verified      = True,
                password_changed_at = timezone.now(),
                password_expires_at = timezone.now() + timedelta(days=365),
                must_change_password= False,
            )
            user.set_password(PASSWORD)
            user.save()

            self.stdout.write(
                f"  {self.style.SUCCESS('✓')}  "
                f"{ud['username']:<22}  "
                f"{ud['role']:<14}  "
                f"{ud['first_name']} {ud['last_name']}"
            )
            created_count += 1

        # ── Summary ────────────────────────────────────────────────
        self.stdout.write(self.style.MIGRATE_HEADING(
            "\n── Summary ─────────────────────────────────────────"
        ))
        self.stdout.write(f"  Created : {created_count}")
        self.stdout.write(f"  Skipped : {skipped_count}")
        self.stdout.write(f"  Password: {PASSWORD}  (all users)")
        self.stdout.write("")
        self.stdout.write(self.style.MIGRATE_HEADING("── Demo Login Credentials ──────────────────────────"))
        self.stdout.write(f"  {'Username':<22}  {'Role':<14}  Password")
        self.stdout.write(f"  {'─'*22}  {'─'*14}  {'─'*12}")
        for ud in DEMO_USERS:
            self.stdout.write(f"  {ud['username']:<22}  {ud['role']:<14}  {PASSWORD}")
        self.stdout.write("")
        self.stdout.write(
            self.style.WARNING(
                "  ⚠  These are DEVELOPMENT accounts only.\n"
                "     Delete before deploying to production:\n"
                "     python manage.py delete_demo_users"
            )
        )
        self.stdout.write("")