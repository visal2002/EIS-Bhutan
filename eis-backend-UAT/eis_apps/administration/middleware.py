from django.conf import settings
from .models import SystemSetting
import logging

logger = logging.getLogger(__name__)

class DynamicSettingsMiddleware:
    """
    Ensures that technical settings from the database (ALLOWED_HOSTS, CORS, Email)
    are applied to the active Django process on every request.
    This allows for 'instantly active' settings without a server restart.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        try:
            # ── 1. Apply Settings ───────────────────────────────────────
            config = SystemSetting.get()

            # Dynamic Email
            config.apply_email_settings()

            # Dynamic Allowed Hosts
            # Split DB string into a list
            db_hosts = [h.strip() for h in config.allowed_hosts.split(',') if h.strip()]
            if db_hosts:
                # Merge with current static settings (avoiding duplicates)
                current = list(settings.ALLOWED_HOSTS)
                for h in db_hosts:
                    if h not in current:
                        current.append(h)
                settings.ALLOWED_HOSTS = current

            # Dynamic CORS & CSRF
            db_cors = [c.strip() for c in config.cors_origins.split(',') if c.strip()]
            if db_cors:
                # CORS
                current_cors = list(getattr(settings, 'CORS_ALLOWED_ORIGINS', []))
                for c in db_cors:
                    if c not in current_cors:
                        current_cors.append(c)
                settings.CORS_ALLOWED_ORIGINS = current_cors
                
                # CSRF
                current_csrf = list(getattr(settings, 'CSRF_TRUSTED_ORIGINS', []))
                for c in db_cors:
                    if c not in current_csrf:
                        current_csrf.append(c)
                settings.CSRF_TRUSTED_ORIGINS = current_csrf

            # Dynamic Debug Mode (Use with caution)
            # Only update if explicitly set in DB (default in model is True, which is safe for Dev)
            # In a real production environment, you might want more guardrails here.
            # settings.DEBUG = config.debug_mode

        except Exception as e:
            # We fail silently here so a DB failure doesn't crash the whole site
            logger.error(f"Failed to apply dynamic system settings: {e}")

        response = self.get_response(request)
        return response
