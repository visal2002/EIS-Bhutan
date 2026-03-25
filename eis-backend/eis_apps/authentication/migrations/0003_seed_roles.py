from django.db import migrations

ROLES = [
    ("ADMIN",        "System Administrator"),
    ("DOE_HEAD",     "DOE Head"),
    ("DATA_MANAGER", "Data Manager"),
    ("DATA_FOCAL",   "Data Focal"),
    ("VIEWER",       "Viewer"),
]

def seed_roles(apps, schema_editor):
    Role = apps.get_model("authentication", "Role")
    for role_name, description in ROLES:
        Role.objects.get_or_create(
            role_name=role_name,
            defaults={"description": description},
        )

def unseed_roles(apps, schema_editor):
    Role = apps.get_model("authentication", "Role")
    Role.objects.filter(role_name__in=[r[0] for r in ROLES]).delete()

class Migration(migrations.Migration):

    dependencies = [
        ("authentication", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(seed_roles, reverse_code=unseed_roles),
    ]