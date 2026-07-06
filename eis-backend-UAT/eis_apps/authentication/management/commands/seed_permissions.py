# backend/eis_apps/authentication/management/commands/seed_permissions.py
"""
Seeds default role permissions into the database.
Run once after migrations:
    python manage.py seed_permissions

Run with --force to reset all to defaults:
    python manage.py seed_permissions --force
"""
from django.core.management.base import BaseCommand
from eis_apps.authentication.models import Role, RolePermission
from eis_apps.authentication.role_permissions import MODULES, DEFAULTS


class Command(BaseCommand):
    help = "Seed default module permissions for all roles"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true",
                            help="Overwrite all existing permissions with defaults")

    def handle(self, *args, **options):
        force  = options["force"]
        seeded = 0
        skipped = 0

        roles = Role.objects.all()
        if not roles.exists():
            self.stderr.write(self.style.ERROR("No roles found. Run migrations first."))
            return

        for role in roles:
            role_defaults = DEFAULTS.get(role.role_name, {})
            for module_key, module_label, _ in MODULES:
                perms = role_defaults.get(module_key, {
                    "can_view": False, "can_create": False,
                    "can_edit": False, "can_delete": False,
                })
                if force:
                    RolePermission.objects.update_or_create(
                        role=role, module=module_key, defaults=perms
                    )
                    seeded += 1
                else:
                    _, created = RolePermission.objects.get_or_create(
                        role=role, module=module_key, defaults=perms
                    )
                    if created:
                        seeded += 1
                    else:
                        skipped += 1

        self.stdout.write(self.style.SUCCESS(
            f"✓ Seeded {seeded} permissions. Skipped {skipped} existing."
        ))
        if not force and skipped:
            self.stdout.write("  Tip: use --force to reset all permissions to defaults.")