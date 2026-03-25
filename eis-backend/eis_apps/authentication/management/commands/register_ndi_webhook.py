# backend/eis_apps/authentication/management/commands/register_ndi_webhook.py
"""
Django management command to register the NDI webhook.
Reads all NDI config from SystemSetting DB — run after changing webhook URL in System Settings.

Usage:
    python manage.py register_ndi_webhook
"""
from django.core.management.base import BaseCommand
from eis_apps.authentication.ndi import register_webhook


class Command(BaseCommand):
    help = "Register EIS webhook endpoint with Bhutan NDI service"

    def handle(self, *args, **options):
        from eis_apps.administration.models import SystemSetting
        cfg = SystemSetting.get()

        if not cfg.ndi_client_id:
            self.stderr.write(self.style.ERROR(
                "NDI Client ID not set in System Settings → NDI tab.\n"
                "Go to /admin/system-settings and configure NDI credentials first."
            ))
            return

        if not cfg.ndi_webhook_base_url or "ngrok" not in cfg.ndi_webhook_base_url and "localhost" in cfg.ndi_webhook_base_url:
            self.stderr.write(self.style.WARNING(
                "Warning: Webhook Base URL looks like a local address. "
                "NDI needs a public URL to reach your server."
            ))

        webhook_url = cfg.ndi_webhook_base_url.rstrip("/") + "/api/auth/ndi/webhook/"

        self.stdout.write("Registering webhook...")
        self.stdout.write(f"  ID:          {cfg.ndi_webhook_id}")
        self.stdout.write(f"  URL:         {webhook_url}")
        self.stdout.write(f"  Environment: {cfg.ndi_environment}")

        try:
            result = register_webhook()
            self.stdout.write(self.style.SUCCESS(
                f"✓ Webhook registered successfully!\n  Response: {result}"
            ))
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"✗ Registration failed: {e}"))