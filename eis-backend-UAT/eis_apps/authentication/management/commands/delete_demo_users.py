# backend/eis_apps/authentication/management/commands/delete_demo_users.py
"""
Safely removes all demo users created by create_demo_users.
Run before deploying to production:  python manage.py delete_demo_users
"""
from django.core.management.base import BaseCommand
from eis_apps.authentication.models import User

DEMO_USERNAMES = [
    "admin.demo",
    "doehead.demo",
    "manager.demo",
    "focal.demo",
    "viewer.demo",
]


class Command(BaseCommand):
    help = "Delete all demo users created by create_demo_users"

    def add_arguments(self, parser):
        parser.add_argument(
            "--yes",
            action="store_true",
            help="Skip confirmation prompt",
        )

    def handle(self, *args, **options):
        existing = User.objects.filter(username__in=DEMO_USERNAMES)
        count = existing.count()

        if count == 0:
            self.stdout.write(self.style.WARNING("No demo users found — nothing to delete."))
            return

        self.stdout.write(f"Found {count} demo user(s):")
        for u in existing:
            self.stdout.write(f"  - {u.username}  ({u.role})")

        if not options["yes"]:
            confirm = input("\nDelete these users? [y/N]: ").strip().lower()
            if confirm != "y":
                self.stdout.write("Cancelled.")
                return

        existing.delete()
        self.stdout.write(self.style.SUCCESS(f"\n✓ Deleted {count} demo user(s)."))