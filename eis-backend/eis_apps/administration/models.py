# backend/eis_apps/administration/models.py
"""
Two single-row settings tables:

  SiteSetting   — branding, contact, login toggles (public-facing)
  SystemSetting — NDI, email, API keys, app config (admin-only)

STORAGE PHILOSOPHY
==================
Everything is stored in the database.
The .env file only holds secrets that Django needs BEFORE the app starts:
  - DJANGO_SECRET_KEY
  - DB_* credentials
  - DJANGO_SETTINGS_MODULE
  - DEBUG (true/false)
  - ALLOWED_HOSTS (initial value — overridden at runtime from SystemSetting)

NDI credentials, SMTP passwords, API keys — all in DB.
Django reads them at runtime via SystemSetting.get() and the helpers below.
No server restart needed when you change them.
"""
from django.db import models


# ── Site Setting ──────────────────────────────────────────────────
class SiteSetting(models.Model):
    """Public-facing site configuration — branding, contact, login options."""

    # Branding
    site_title      = models.CharField(max_length=200, default="Energy Information System")
    site_short_name = models.CharField(max_length=50,  default="EIS")
    site_tagline    = models.CharField(max_length=300, blank=True,
                                       default="Department of Energy · MoENR · Royal Government of Bhutan")
    site_logo       = models.ImageField(upload_to="site/", blank=True, null=True)
    doe_logo        = models.ImageField(upload_to="site/", blank=True, null=True)
    gov_logo        = models.ImageField(upload_to="site/", blank=True, null=True)
    favicon         = models.ImageField(upload_to="site/", blank=True, null=True)

    # Contact
    contact_email   = models.EmailField(blank=True, default="support@energy.gov.bt")
    contact_phone   = models.CharField(max_length=50, blank=True)
    contact_address = models.TextField(blank=True,
                                       default="Department of Energy, MoENR, Thimphu, Bhutan")
    website_url     = models.URLField(blank=True, default="https://www.moea.gov.bt")

    # Social
    facebook_url    = models.URLField(blank=True)
    twitter_url     = models.URLField(blank=True)
    youtube_url     = models.URLField(blank=True)

    # Login options
    allow_ndi_login    = models.BooleanField(default=True)
    allow_agency_login = models.BooleanField(default=True)

    # System
    maintenance_mode   = models.BooleanField(default=False)
    maintenance_msg    = models.TextField(blank=True,
                                          default="The system is under maintenance. Please try again later.")
    session_timeout    = models.PositiveIntegerField(default=480,
                                                     help_text="Session timeout in minutes")
    max_login_attempts = models.PositiveSmallIntegerField(default=5)

    # Footer
    footer_text    = models.TextField(blank=True,
                                      default="© 2026 Department of Energy, MoENR, Royal Government of Bhutan. All rights reserved.")
    copyright_year = models.CharField(max_length=10, default="2026")

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, blank=True)

    class Meta:
        app_label    = "administration"
        db_table     = "site_settings"
        verbose_name = "Site Setting"

    def __str__(self):
        return self.site_title

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


# ── System Setting ────────────────────────────────────────────────
class SystemSetting(models.Model):
    """
    Technical/integration settings — all stored in DB.

    HOW TO USE IN YOUR DJANGO CODE
    ================================
    from eis_apps.administration.models import SystemSetting

    # Get NDI config:
    ndi = SystemSetting.get().get_ndi_config()
    requests.post(ndi['auth_url'], headers={'Authorization': f"Bearer {ndi['client_secret']}"})

    # Get email config — Django applies it dynamically:
    SystemSetting.get().apply_email_settings()
    send_mail(...)

    # Get any API integration:
    mas = SystemSetting.get().get_api_config('mas')
    if mas['enabled']:
        requests.get(mas['base_url'], headers={'Authorization': f"Bearer {mas['api_key']}"})
    """

    # ── NDI Integration ───────────────────────────────────────────
    # All URLs from: Bhutan NDI Technical Documentation V1.2
    ndi_environment      = models.CharField(
        max_length=20,
        choices=[("staging", "Staging / Dev"), ("production", "Production")],
        default="staging",
        verbose_name="NDI Environment",
    )
    ndi_client_id        = models.CharField(max_length=255, blank=True,
                                            verbose_name="NDI Client ID",
                                            help_text="Shared by Bhutan NDI team")
    ndi_client_secret    = models.CharField(max_length=255, blank=True,
                                            verbose_name="NDI Client Secret",
                                            help_text="Shared by Bhutan NDI team")
    ndi_webhook_id       = models.CharField(max_length=100, blank=True,
                                            default="eis-bhutan-26",
                                            verbose_name="NDI Webhook ID",
                                            help_text="Unique ID registered with NDI webhook service")
    ndi_webhook_secret   = models.CharField(max_length=255, blank=True,
                                            verbose_name="NDI Webhook Secret",
                                            help_text="OAuth2 v2 fixed token — NDI sends this in Authorization header to authenticate webhook calls to our server")
    ndi_webhook_base_url = models.URLField(
        blank=True,
        default="https://your-ngrok-url.ngrok-free.dev",
        verbose_name="Webhook Base URL",
        help_text="Public URL this server is reachable at. Use ngrok in dev. Re-run register_ndi_webhook after changing.",
    )
    # NDI API endpoints — confirmed from NDI Technical Documentation V1.2
    ndi_auth_url             = models.URLField(
        blank=True,
        default="https://staging.bhutanndi.com/authentication/v1/authenticate",
        verbose_name="NDI Auth URL (Staging)",
        help_text="POST — get OAuth2 Bearer token using client_id + client_secret. Swagger: https://staging.bhutanndi.com/authentication/swagger",
    )
    ndi_verifier_url         = models.URLField(
        blank=True,
        default="https://demo-client.bhutanndi.com/verifier/v1/proof-request",
        verbose_name="NDI Verifier URL (Staging)",
        help_text="POST — create proof request. GET — poll proof status. Swagger: https://demo-client.bhutanndi.com/verifier/swagger",
    )
    ndi_webhook_register_url = models.URLField(
        blank=True,
        default="https://demo-client.bhutanndi.com/webhook/v1",
        verbose_name="NDI Webhook Service Base URL (Staging)",
        help_text="Base URL for webhook register/subscribe/unsubscribe. Swagger: https://demo-client.bhutanndi.com/webhook/swagger/",
    )
    ndi_issuer_url           = models.URLField(
        blank=True,
        default="https://demo-client.bhutanndi.com/issuer/v1",
        verbose_name="NDI Issuer URL (Staging)",
        help_text="POST — issue/revoke verifiable credentials. Swagger: https://demo-client.bhutanndi.com/issuer/swagger",
    )
    ndi_schema_id            = models.URLField(
        blank=True,
        default="https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
        verbose_name="NDI Schema ID — Foundational ID",
        help_text="Schema URL for requesting ID Number and Full Name from Foundational ID credential",
    )
    # NATS — alternative to webhook for receiving async NDI responses
    ndi_nats_url     = models.CharField(
        max_length=500, blank=True,
        default="https://natsdemoclient.bhutanndi.com",
        verbose_name="NDI NATS URL (Staging)",
        help_text="NATS server URL. Pattern: threadId",
    )
    ndi_nats_ws_url  = models.CharField(
        max_length=500, blank=True,
        default="wss://natsdemoclient.bhutanndi.com",
        verbose_name="NDI NATS WebSocket URL",
        help_text="WebSocket URL — wss:// protocol not validated as URL",
    )
    ndi_nats_seed    = models.CharField(
        max_length=500, blank=True,
        verbose_name="NDI NATS Seed (Dev)",
        help_text="Dev seed (not secret in staging): SUAPXY7TJFUFE3IX3OEMSLE3JFZJ3FZZRSRSOGSG2ANDIFN77O2MIBHWUM — treat production seed as secret",
    )

    # ── Email / SMTP ──────────────────────────────────────────────
    email_backend        = models.CharField(
        max_length=200,
        default="django.core.mail.backends.smtp.EmailBackend",
        help_text="Use console backend for dev/testing",
    )
    email_host           = models.CharField(max_length=255, blank=True)
    email_port           = models.PositiveIntegerField(default=587)
    email_use_tls        = models.BooleanField(default=True)
    email_use_ssl        = models.BooleanField(default=False)
    email_host_user      = models.CharField(max_length=255, blank=True)
    email_host_password  = models.CharField(max_length=255, blank=True,
                                            help_text="Leave blank to keep existing value.")
    default_from_email   = models.EmailField(blank=True, default="noreply@doe.gov.bt")
    email_timeout        = models.PositiveIntegerField(default=30)

    # ── Government API Integrations ───────────────────────────────
    # All stored in DB — read at runtime, no restart needed

    # MAS
    mas_name       = models.CharField(max_length=100, blank=True,
                                      default="MAS",
                                      help_text="Meteorological and Hydrological Services")
    mas_api_key    = models.CharField(max_length=500, blank=True)
    mas_base_url   = models.URLField(blank=True)
    mas_enabled    = models.BooleanField(default=False)

    # FIRMS
    firms_name     = models.CharField(max_length=100, blank=True,
                                      default="FIRMS",
                                      help_text="Financial Information & Reporting Management System")
    firms_api_key  = models.CharField(max_length=500, blank=True)
    firms_base_url = models.URLField(blank=True)
    firms_enabled  = models.BooleanField(default=False)

    # IIS
    iis_name       = models.CharField(max_length=100, blank=True,
                                      default="IIS",
                                      help_text="Integrated Information System")
    iis_api_key    = models.CharField(max_length=500, blank=True)
    iis_base_url   = models.URLField(blank=True)
    iis_enabled    = models.BooleanField(default=False)

    # OFS
    ofs_name       = models.CharField(max_length=100, blank=True,
                                      default="OFS",
                                      help_text="Online Filing System")
    ofs_api_key    = models.CharField(max_length=500, blank=True)
    ofs_base_url   = models.URLField(blank=True)
    ofs_enabled    = models.BooleanField(default=False)

    # eRALIS
    eralis_name     = models.CharField(max_length=100, blank=True,
                                       default="eRALIS",
                                       help_text="Electronic Renewal of Agencies Licence Information System")
    eralis_api_key  = models.CharField(max_length=500, blank=True)
    eralis_base_url = models.URLField(blank=True)
    eralis_enabled  = models.BooleanField(default=False)

    # ── App Config ────────────────────────────────────────────────
    app_env      = models.CharField(
        max_length=20,
        choices=[("development", "Development"),
                 ("staging",     "Staging"),
                 ("production",  "Production")],
        default="development",
    )
    debug_mode   = models.BooleanField(default=True,
                                       help_text="Never enable in production")
    allowed_hosts = models.TextField(blank=True, default="localhost,127.0.0.1",
                                     help_text="Comma-separated hostnames")
    cors_origins  = models.TextField(blank=True, default="http://localhost:5173",
                                     help_text="Comma-separated frontend origins")

    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.CharField(max_length=150, blank=True)

    class Meta:
        app_label    = "administration"
        db_table     = "system_settings"
        verbose_name = "System Setting"

    def __str__(self):
        return f"System Settings [{self.app_env.upper()}]"

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    # ── Runtime helpers ───────────────────────────────────────────

    def get_ndi_config(self) -> dict:
        """
        Returns full NDI config dict for use in authentication views.

        Usage:
            ndi = SystemSetting.get().get_ndi_config()
            ndi['client_id']        # NDI_CLIENT_ID
            ndi['client_secret']    # NDI_CLIENT_SECRET
            ndi['webhook_secret']   # for verifying webhook signatures
            ndi['webhook_endpoint'] # full webhook URL
        """
        base = self.ndi_webhook_base_url.rstrip("/")
        return {
            "environment":      self.ndi_environment,
            "client_id":        self.ndi_client_id,
            "client_secret":    self.ndi_client_secret,
            "webhook_id":       self.ndi_webhook_id,
            "webhook_secret":   self.ndi_webhook_secret,
            "webhook_base_url": self.ndi_webhook_base_url,
            "webhook_endpoint": f"{base}/api/auth/ndi/webhook/",
            "auth_url":         self.ndi_auth_url,
            "verifier_url":     self.ndi_verifier_url,
            "schema_id":        self.ndi_schema_id,
        }

    def apply_email_settings(self):
        """
        Dynamically applies email settings to Django's live configuration.
        Call this before sending email so the latest DB values are used
        without restarting the server.

        Usage:
            from eis_apps.administration.models import SystemSetting
            SystemSetting.get().apply_email_settings()
            send_mail(subject, body, from_email, [to])
        """
        from django.conf import settings as django_settings
        django_settings.EMAIL_BACKEND       = self.email_backend
        django_settings.EMAIL_HOST          = self.email_host
        django_settings.EMAIL_PORT          = self.email_port
        django_settings.EMAIL_USE_TLS       = self.email_use_tls
        django_settings.EMAIL_USE_SSL       = self.email_use_ssl
        django_settings.EMAIL_HOST_USER     = self.email_host_user
        django_settings.EMAIL_HOST_PASSWORD = self.email_host_password
        django_settings.DEFAULT_FROM_EMAIL  = self.default_from_email
        django_settings.EMAIL_TIMEOUT       = self.email_timeout

    def get_api_config(self, system: str) -> dict:
        """
        Returns API config for a named integration system.

        Supported systems: 'mas', 'firms', 'iis', 'ofs', 'eralis'

        Usage:
            cfg = SystemSetting.get().get_api_config('mas')
            if not cfg['enabled']:
                raise Exception("MAS integration is disabled")
            response = requests.get(
                f"{cfg['base_url']}/energy-data",
                headers={"Authorization": f"Bearer {cfg['api_key']}"},
                timeout=30,
            )
        """
        s = system.lower().replace('-', '_')
        return {
            "system":   s,
            "name":     getattr(self, f"{s}_name",    ""),
            "api_key":  getattr(self, f"{s}_api_key", ""),
            "base_url": getattr(self, f"{s}_base_url",""),
            "enabled":  getattr(self, f"{s}_enabled", False),
        }

    def get_all_apis(self) -> list:
        """Returns config for all 5 integration systems."""
        return [self.get_api_config(s) for s in
                ["mas", "firms", "iis", "ofs", "eralis"]]