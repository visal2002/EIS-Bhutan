from django.core.management.base import BaseCommand
from django.core.management import call_command

class Command(BaseCommand):
    help = 'Master Orchestrator: Runs all module seeders in the professional order'

    def handle(self, *args, **options):
        self.stdout.write(self.style.MIGRATE_HEADING("\n🚀 STARTING SYSTEM-WIDE SEEDING ORCHESTRATION..."))

        # 1. Base Setup (Identity, Access & Site Branding)
        self.stdout.write(self.style.MIGRATE_HEADING("\n[1/3] Base Configuration & Identity"))
        
        # Load core roles from fixture
        call_command('loaddata', 'initial_roles')
        
        # Matrix of permissions for those roles
        call_command('seed_permissions', force=True)
        
        # Create 'eis' superuser
        call_command('create_superuser_with_role')
        
        # Create demo accounts (admin.demo, etc.)
        call_command('create_demo_users')
        
        # Site Branding and technical settings
        call_command('seed_administration')

        # 2. Comprehensive Master Data
        self.stdout.write(self.style.MIGRATE_HEADING("\n[2/3] Comprehensive Master Data"))
        
        # Lookup tables + Substations (which we just added)
        call_command('seed_all')
        
        # Energy data defaults (Disabled: schema is outdated and data is fake/random)
        # call_command('seed_energy_data')

        # 3. Analytics & GHG Emission Factors
        self.stdout.write(self.style.MIGRATE_HEADING("\n[3/3] Analytics & GHG Factors"))
        
        # IPCC Emission factors
        call_command('seed_ghg_factors')
        
        # Dashboard widgets
        call_command('seed_widgets')

        self.stdout.write(self.style.MIGRATE_HEADING("\n🎉 ALL PROFESSIONAL MODULES SEEDED SUCCESSFULLY!\n"))
