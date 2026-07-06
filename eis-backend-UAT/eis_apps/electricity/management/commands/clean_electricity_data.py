from django.core.management.base import BaseCommand
from django.db import connection

class Command(BaseCommand):
    help = "Truncate electricity data tables to allow migration from char to foreign key"

    def handle(self, *args, **options):
        # Precise table names from electricity/models.py
        tables = [
            'electricity_consumption',
            'electricity_generation',
            'electricity_import_export',
            'electricity_hydrology',
            'electricity_generation_daily',
            'electricity_generation_hourly',
            'electricity_infra_transmission',
            'electricity_infra_distribution',
            'electricity_infra_dist_transformer',
            'electricity_sales_dzongkhag',
            'electricity_consumers_dzongkhag',
            'electricity_trade_market',
            'electricity_trade_rea',
            'electricity_biogas',
            'electricity_industry_power',
            'electricity_substation_load',
            'electricity_royalty',
            'electricity_forecast',
        ]
        
        with connection.cursor() as cursor:
            self.stdout.write("Truncating electricity tables...")
            for table in tables:
                try:
                    cursor.execute(f'TRUNCATE TABLE "{table}" CASCADE;')
                    self.stdout.write(f"  ✓ Truncated {table}")
                except Exception as e:
                    self.stdout.write(self.style.WARNING(f"  ⚠ Failed to truncate {table}: {e}"))
            self.stdout.write(self.style.SUCCESS("Done."))
