# backend/eis_apps/administration/models.py
"""
Two single-row settings tables:

  SiteSetting   - branding, contact, login toggles (public-facing)
  SystemSetting - NDI, email, API keys, app config (admin-only)

STORAGE PHILOSOPHY
==================
Everything is stored in the database.
The .env file only holds secrets that Django needs BEFORE the app starts:
  - DJANGO_SECRET_KEY
  - DB_* credentials
  - DJANGO_SETTINGS_MODULE
  - DEBUG (true/false)
  - ALLOWED_HOSTS (initial value - overridden at runtime from SystemSetting)

NDI credentials, SMTP passwords, API keys - all in DB.
Django reads them at runtime via SystemSetting.get() and the helpers below.
"""
from django.db import models

# ── Site Setting Defaults ──────────────────────────────────────────
def default_landing_header():

    return {
        "logo_text": "EIS · Bhutan",
        "logo_subtext": "National Energy Information System",
        "menu_items": [
            {"label": "Home", "to": "/", "icon": "Home", "exact": True},
            {"label": "Dashboard", "to": "/public", "icon": "BarChart3", "exact": False},
            {"label": "Reports", "to": "/public/reports", "icon": "FileText", "exact": False}
        ]
    }

def default_landing_body_sectors():
    return [
        {"icon": "Zap", "label": "Electricity", "desc": "Generation, transmission & consumption across all 20 dzongkhags.", "color": "#2563eb", "bg": "#eff6ff"},
        {"icon": "Droplets", "label": "POL", "desc": "Import, export & distribution of all POL products.", "color": "#b45309", "bg": "#fef3c7"},
        {"icon": "Leaf", "label": "Biomass", "desc": "Fuelwood, biogas, dung cake, briquettes and agricultural residues.", "color": "#2d8a5e", "bg": "#f0fdf9"},
        {"icon": "Factory", "label": "Industry", "desc": "Energy consumption across manufacturing and industrial sectors.", "color": "#7c3aed", "bg": "#f5f3ff"},
        {"icon": "BarChart3", "label": "GHG Reports", "desc": "IPCC 2006 methodology greenhouse gas inventories and UNFCCC reporting.", "color": "#0891b2", "bg": "#ecfeff"},
        {"icon": "Database", "label": "Master Data", "desc": "Conversion factors, sector classifications and reference lookup tables.", "color": "#374151", "bg": "#f9fafb"},
        {"icon": "TrendingUp", "label": "Transport", "desc": "Fuel consumption across road, air and water transport segments.", "color": "#ea580c", "bg": "#fff7ed"},
        {"icon": "Flame", "label": "Coal", "desc": "Coal production, imports, exports and end-use consumption by sector.", "color": "#78716c", "bg": "#fafaf9"},
        {"icon": "Activity", "label": "Solar & RE", "desc": "Solar installations, off-grid systems and emerging renewable sources.", "color": "#ca8a04", "bg": "#fefce8"}
    ]

def default_landing_body_integrations():
    return [
        {"abbr": "NDI", "full": "National Digital Identity"},
        {"abbr": "FIRMS", "full": "Forest Info System"},
        {"abbr": "eRALIS", "full": "Vehicle Registration"},
        {"abbr": "MAS", "full": "Mining Admin System"},
        {"abbr": "IIS", "full": "Industry Info System"},
        {"abbr": "OFS", "full": "Online Filing System"}
    ]

def default_landing_footer():
    return {
        "quick_links": [
            {"label": "Home", "to": "/"},
            {"label": "Dashboard", "to": "/public"},
            {"label": "Reports", "to": "/public/reports"}
        ],
        "system_info": [
            {"label": "Department of Energy"},
            {"label": "Version: FY 2025–26"},
            {"label": "support@energy.gov.bt"}
        ],
        "copyright_text": "© 2026 Department of Energy, MoENR, Royal Government of Bhutan. All rights reserved."
    }

def default_landing_faqs():
    return [
        {
            "question": "What is the National Energy Information System (EIS)?",
            "answer": "The EIS is Bhutan's unified platform for compiling, analyzing, and disseminating national energy data, consumption stats, and greenhouse gas inventories.",
            "is_active": True
        },
        {
            "question": "How can agencies import energy data?",
            "answer": "Authorized officers can log in, navigate to Data Collection, download the template Excel files, fill in the records, and use the drag-and-drop Import tool.",
            "is_active": True
        },
        {
            "question": "Is the system integrated with other Government registries?",
            "answer": "Yes, EIS is integrated with Bhutan NDI for secure authentication, and synchronizes reference metadata with MAS, eRALIS, and IIS.",
            "is_active": True
        }
    ]

def default_landing_page_settings():
    return {
        "show_hero_slideshow": True,
        "show_sectors_grid": True,
        "show_bhutan_map": True,
        "show_sankey_diagram": True,
        "show_energy_trends": True,
        "show_faqs": True,
        "hero_transition_speed": 4500,
        "map_default_year": "2022",
        "sankey_default_year": "2022",
        "sections_order": [
            {"id": "hero", "name": "Hero Slideshow", "enabled": True},
            {"id": "map", "name": "Bhutan Energy by Dzongkhag (Map)", "enabled": True},
            {"id": "sankey", "name": "Energy Sankey Diagram", "enabled": True},
            {"id": "trends", "name": "Energy Trends 2010–2022", "enabled": True},
            {"id": "sectors", "name": "All Energy Sectors", "enabled": True},
            {"id": "faqs", "name": "FAQs Accordions", "enabled": True}
        ],
        "custom_sections": [],
        "custom_pages": []
    }


# ── Site Setting ──────────────────────────────────────────────────
class SiteSetting(models.Model):
    """Public-facing site configuration - branding, contact, login options."""

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
    audit_log_retention_days = models.PositiveIntegerField(default=90,
                                                          help_text="Auto-delete logs older than X days")

    # Footer
    footer_text    = models.TextField(blank=True,
                                      default="© 2026 Department of Energy, MoENR, Royal Government of Bhutan. All rights reserved.")
    copyright_year = models.CharField(max_length=10, default="2026")

    # Dynamic CMS Content
    landing_header = models.JSONField(default=default_landing_header, blank=True)
    landing_body_sectors = models.JSONField(default=default_landing_body_sectors, blank=True)
    landing_body_integrations = models.JSONField(default=default_landing_body_integrations, blank=True)
    landing_footer = models.JSONField(default=default_landing_footer, blank=True)
    landing_faqs = models.JSONField(default=default_landing_faqs, blank=True)
    landing_page_settings = models.JSONField(default=default_landing_page_settings, blank=True)

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


class LandingPageSlide(models.Model):
    title = models.CharField(max_length=255, blank=True)
    tagline = models.TextField(blank=True)
    image = models.ImageField(upload_to="landing_slides/")
    cta_text = models.CharField(max_length=50, blank=True, default="Live Dashboard")
    cta_link = models.CharField(max_length=255, blank=True, default="/public")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        app_label = "administration"
        db_table = "landing_page_slides"
        ordering = ["order", "id"]

    def __str__(self):
        return self.title or f"Slide #{self.id}"



# ── System Setting ────────────────────────────────────────────────
class SystemSetting(models.Model):
    """
    Technical/integration settings - all stored in DB.

    HOW TO USE IN YOUR DJANGO CODE
    ================================
    from eis_apps.administration.models import SystemSetting

    # Get NDI config:
    ndi = SystemSetting.get().get_ndi_config()
    requests.post(ndi['auth_url'], headers={'Authorization': f"Bearer {ndi['client_secret']}"})

    # Get email config - Django applies it dynamically:
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
                                            help_text="OAuth2 v2 fixed token - NDI sends this in Authorization header to authenticate webhook calls to our server")
    ndi_webhook_base_url = models.URLField(
        blank=True,
        default="https://your-ngrok-url.ngrok-free.dev",
        verbose_name="Webhook Base URL",
        help_text="Public URL this server is reachable at. Use ngrok in dev. Re-run register_ndi_webhook after changing.",
    )
    # NDI API endpoints - confirmed from NDI Technical Documentation V1.2
    ndi_auth_url             = models.URLField(
        blank=True,
        default="https://staging.bhutanndi.com/authentication/v1/authenticate",
        verbose_name="NDI Auth URL (Staging)",
        help_text="POST - get OAuth2 Bearer token using client_id + client_secret. Swagger: https://staging.bhutanndi.com/authentication/swagger",
    )
    ndi_verifier_url         = models.URLField(
        blank=True,
        default="https://demo-client.bhutanndi.com/verifier/v1/proof-request",
        verbose_name="NDI Verifier URL (Staging)",
        help_text="POST - create proof request. GET - poll proof status. Swagger: https://demo-client.bhutanndi.com/verifier/swagger",
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
        help_text="POST - issue/revoke verifiable credentials. Swagger: https://demo-client.bhutanndi.com/issuer/swagger",
    )
    ndi_schema_id            = models.URLField(
        blank=True,
        default="https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076",
        verbose_name="NDI Schema ID - Foundational ID",
        help_text="Schema URL for requesting ID Number and Full Name from Foundational ID credential",
    )
    # NATS - alternative to webhook for receiving async NDI responses
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
        help_text="WebSocket URL - wss:// protocol not validated as URL",
    )
    ndi_nats_seed    = models.CharField(
        max_length=500, blank=True,
        verbose_name="NDI NATS Seed (Dev)",
        help_text="Dev seed (not secret in staging): SUAPXY7TJFUFE3IX3OEMSLE3JFZJ3FZZRSRSOGSG2ANDIFN77O2MIBHWUM - treat production seed as secret",
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
    # All stored in DB - read at runtime, no restart needed

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

# ── Dynamic Landing Page Components ───────────────────────────────
class BlockType(models.Model):
    """
    Registry of available visualization and content blocks for custom sections.
    """
    id = models.CharField(max_length=100, primary_key=True)
    label = models.CharField(max_length=100)
    icon = models.CharField(max_length=20)
    category = models.CharField(max_length=50)
    desc = models.TextField(blank=True)
    color = models.CharField(max_length=50, default="#6366f1")

    class Meta:
        app_label = "administration"
        db_table = "block_types"
        ordering = ["category", "label"]

    def __str__(self):
        return f"{self.label} ({self.id})"


class LandingPageSection(models.Model):
    """
    Registry of available sections that can be used on landing pages.
    """
    id = models.CharField(max_length=100, primary_key=True)
    name = models.CharField(max_length=100)
    icon = models.CharField(max_length=20)
    desc = models.TextField(blank=True)
    color = models.CharField(max_length=50, default="#6366f1")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        app_label = "administration"
        db_table = "landing_page_sections"
        ordering = ["order", "id"]

    def __str__(self):
        return f"{self.name} ({self.id})"


# ── Bulk Import ───────────────────────────────────────────────────
class BulkImportJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('paused', 'Paused'),
        ('stopped', 'Stopped'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    module_name = models.CharField(max_length=100) # e.g., 'transport.VehicleRegistration'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    
    # Store the actual filename for user reference
    original_filename = models.CharField(max_length=255, blank=True)
    
    # Store the actual uploaded file for resume/retry capabilities
    file = models.FileField(upload_to='import_jobs/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        'authentication.User', on_delete=models.SET_NULL, null=True, related_name='import_jobs'
    )
    
    class Meta:
        app_label    = "administration"
        db_table     = "bulk_import_jobs"
        ordering = ['-created_at']

class BulkImportError(models.Model):
    job = models.ForeignKey(BulkImportJob, on_delete=models.CASCADE, related_name='errors')
    row_index = models.IntegerField()
    raw_data = models.JSONField(help_text="The raw row dict from Pandas")
    error_message = models.JSONField(help_text="Validation error dictionary")
    
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label    = "administration"
        db_table     = "bulk_import_errors"
        ordering = ['row_index']

class BulkExportJob(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed')
    ]
    module_name = models.CharField(max_length=100) # e.g., 'transport.VehicleRegistration'
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Store the query configuration used to generate the export
    filters = models.JSONField(default=dict, blank=True)
    
    # Generated file
    file = models.FileField(upload_to='export_jobs/', null=True, blank=True)
    
    # Metadata for tracking progress
    total_rows = models.IntegerField(default=0)
    processed_rows = models.IntegerField(default=0)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    created_by = models.ForeignKey(
        'authentication.User', on_delete=models.SET_NULL, null=True, related_name='export_jobs'
    )
    
    class Meta:
        app_label    = "administration"
        db_table     = "bulk_export_jobs"
        ordering = ['-created_at']

