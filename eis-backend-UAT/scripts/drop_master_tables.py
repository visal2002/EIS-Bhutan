# backend/drop_master_tables.py
#
# Run from backend folder:
#   python drop_master_tables.py
#
# This drops all master_* tables and resets the migration state
# so you can run a clean makemigrations + migrate + seed_all

import os
import django
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection

cursor = connection.cursor()

print("\n=== Dropping all master_data tables ===\n")

# Get all master_ tables in dependency order (CASCADE handles it)
cursor.execute("""
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename LIKE 'master_%'
    ORDER BY tablename;
""")
tables = [r[0] for r in cursor.fetchall()]

if not tables:
    print("  No master_ tables found — already clean.")
else:
    for t in tables:
        try:
            cursor.execute(f'DROP TABLE IF EXISTS "{t}" CASCADE;')
            print(f"  ✓ Dropped: {t}")
        except Exception as e:
            print(f"  ✗ Failed {t}: {e}")

print()

# Remove master_data entries from django_migrations table
cursor.execute("""
    DELETE FROM django_migrations 
    WHERE app = 'master_data';
""")
print(f"  ✓ Cleared master_data migration records from django_migrations")

# Dependent apps that reference master_data tables
dependent_apps = [
    'biomass', 'coal', 'electricity', 'fuelwood', 
    'ghg', 'industry', 'petroleum', 'reporting', 
    'solar', 'transport'
]

print(f"\n=== Dropping all dependent energy module tables: {dependent_apps} ===\n")

for app in dependent_apps:
    cursor.execute("""
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename LIKE %s
        ORDER BY tablename;
    """, [f"{app}_%"])
    app_tables = [r[0] for r in cursor.fetchall()]
    
    if app_tables:
        print(f"  [{app}] Found {len(app_tables)} tables...")
        for t in app_tables:
            try:
                cursor.execute(f'DROP TABLE IF EXISTS "{t}" CASCADE;')
                print(f"  ✓ Dropped: {t}")
            except Exception as e:
                print(f"  ✗ Failed {t}: {e}")
    
    cursor.execute("DELETE FROM django_migrations WHERE app = %s;", [app])
    print(f"  ✓ Cleared {app} migration records")

connection.commit()

print("\n=== Done! ===")
print("\nNow run:")
print("  python manage.py makemigrations")
print("  python manage.py migrate")
print("  python manage.py seed_all")
print()