# backend/eis_apps/authentication/management/commands/create_superuser_with_role.py
"""
Creates the default EIS superuser with ADMIN role.

Usage:
    python manage.py create_superuser_with_role
    python manage.py create_superuser_with_role --username eis --password Bhutan@123

Safe to run multiple times — skips if user already exists.
"""
from django.core.management.base import BaseCommand
from django.db import transaction


class Command(BaseCommand):
    help = "Create the default EIS superuser with ADMIN role"

    def add_arguments(self, parser):
        parser.add_argument("--username",    default="eis",          help="Username (default: eis)")
        parser.add_argument("--email",       default="eis@doe.gov.bt", help="Email")
        parser.add_argument("--password",    default="Bhutan@123",   help="Password")
        parser.add_argument("--employee_id", default="EMP-001",      help="Employee ID")
        parser.add_argument("--first_name",  default="EIS",          help="First name")
        parser.add_argument("--last_name",   default="Admin",        help="Last name")

    def handle(self, *args, **options):
        from eis_apps.authentication.models import User, Role

        username = options["username"]

        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f"User '{username}' already exists — skipping."
            ))
            return

        try:
            with transaction.atomic():
                # Get ADMIN role (must exist — run migrate first)
                try:
                    role = Role.objects.get(role_name="ADMIN")
                except Role.DoesNotExist:
                    self.stdout.write(self.style.ERROR(
                        "ADMIN role not found. Run 'python manage.py migrate' first."
                    ))
                    return

                # Create superuser
                user = User.objects.create_superuser(
                    username    = username,
                    email       = options["email"],
                    password    = options["password"],
                    employee_id = options["employee_id"],
                    first_name  = options["first_name"],
                    last_name   = options["last_name"],
                )
                user.role       = role
                user.is_verified = True
                user.save()

                self.stdout.write(self.style.SUCCESS(
                    f"\n✅ Superuser created successfully!\n"
                    f"   Username  : {user.username}\n"
                    f"   Email     : {user.email}\n"
                    f"   Role      : {user.role}\n"
                    f"   Employee  : {user.employee_id}\n"
                    f"\n   Login at  : http://127.0.0.1:8000/login/\n"
                    f"   Admin at  : http://127.0.0.1:8000/eis-admin/\n"
                ))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error: {e}"))