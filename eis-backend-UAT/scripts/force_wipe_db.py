import os
import django
from pathlib import Path
from dotenv import load_dotenv

# Load env and setup django
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.db import connection

def force_wipe():
    print("\n[FORCE WIPE] Starting complete database schema reset...")
    
    with connection.cursor() as cursor:
        # 1. Get all tables in the public schema
        cursor.execute("""
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public'
        """)
        tables = [row[0] for row in cursor.fetchall()]
        
        if not tables:
            print("  No tables found in 'public' schema. Database is already empty.")
            return

        print(f"  Found {len(tables)} tables. Dropping all with CASCADE...")
        
        # 2. Drop all tables one by one with CASCADE
        # This handles dependencies between energy modules and master data
        for table in tables:
            try:
                cursor.execute(f'DROP TABLE IF EXISTS "{table}" CASCADE;')
                print(f"  ✓ Dropped: {table}")
            except Exception as e:
                print(f"  ✗ Failed to drop {table}: {e}")
        
        # 3. Truncate migration history
        print("\n  Clearing django_migrations history...")
        try:
            cursor.execute("TRUNCATE TABLE django_migrations CASCADE;")
            print("  ✓ django_migrations cleared.")
        except Exception:
            # Table might have been dropped already in the loop above
            pass

    print("\n[FORCE WIPE] Database is now clean.")

if __name__ == "__main__":
    force_wipe()
