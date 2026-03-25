# backend/config/settings/base.py
import os
from pathlib import Path
from datetime import timedelta
from django.urls import reverse_lazy

BASE_DIR = Path(__file__).resolve().parent.parent.parent

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "change-me-in-production")

DEBUG = os.environ.get("DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")

# In development, allow ngrok domains for webhook testing
if DEBUG:
    ALLOWED_HOSTS += [
        "unbeaued-leida-unconcernedly.ngrok-free.dev",  # current ngrok URL
        ".ngrok-free.dev",   # wildcard for ngrok free dev domains
        ".ngrok-free.app",   # wildcard for ngrok free app domains
        ".ngrok.io",         # wildcard for ngrok paid domains
    ]
    CSRF_TRUSTED_ORIGINS = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://unbeaued-leida-unconcernedly.ngrok-free.dev",
    ]

# ── Apps ──────────────────────────────────────────────────────────
DJANGO_APPS = [
    "unfold",                   # ← ADDED: must be BEFORE django.contrib.admin
    "unfold.contrib.filters",   # ← ADDED
    "unfold.contrib.forms",     # ← ADDED
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_celery_beat",
    "django_celery_results",
    "django_filters",
]

LOCAL_APPS = [
    "eis_core",
    "eis_apps.authentication",
    "eis_apps.master_data",
    "eis_apps.administration",
    "eis_apps.electricity",
    "eis_apps.solar",
    "eis_apps.fuelwood",
    "eis_apps.petroleum",
    "eis_apps.biomass",
    "eis_apps.coal",
    "eis_apps.transport",
    "eis_apps.industry",
    "eis_apps.ghg",
    "eis_apps.reporting",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

# ── Middleware ─────────────────────────────────────────────────────
MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
    "eis_apps.authentication.middleware.AuditLogMiddleware",
]

ROOT_URLCONF     = "config.urls"
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

# ── Database ───────────────────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE":   "django.db.backends.postgresql",
        "NAME":     os.environ.get("DB_NAME",     "eis_jdms_db"),
        "USER":     os.environ.get("DB_USER",     "eis_jdms_user"),
        "PASSWORD": os.environ.get("DB_PASSWORD", ""),
        "HOST":     os.environ.get("DB_HOST",     "db"),
        "PORT":     os.environ.get("DB_PORT",     "5432"),
        "OPTIONS":  {"connect_timeout": 10},
    }
}

# ── Custom User Model ──────────────────────────────────────────────
AUTH_USER_MODEL = "authentication.User"

# ── Password Validators ────────────────────────────────────────────
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator", "OPTIONS": {"min_length": 8}},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ── REST Framework ─────────────────────────────────────────────────
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "eis_core.pagination.StandardPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_RENDERER_CLASSES": (
        "rest_framework.renderers.JSONRenderer",
    ),
    "EXCEPTION_HANDLER": "eis_core.exceptions.custom_exception_handler",
}

# ── JWT ────────────────────────────────────────────────────────────
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME":    timedelta(hours=8),
    "REFRESH_TOKEN_LIFETIME":   timedelta(days=7),
    "ROTATE_REFRESH_TOKENS":    True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN":        True,
    "AUTH_HEADER_TYPES":        ("Bearer",),
    "USER_ID_FIELD":            "id",
    "USER_ID_CLAIM":            "user_id",
}

# ── Redis & Celery ─────────────────────────────────────────────────
REDIS_URL              = os.environ.get("REDIS_URL", "redis://127.0.0.1:6379/0")
CELERY_BROKER_URL      = REDIS_URL
CELERY_RESULT_BACKEND  = "django-db"
CELERY_CACHE_BACKEND   = "django-cache"
CELERY_BEAT_SCHEDULER  = "django_celery_beat.schedulers:DatabaseScheduler"
CELERY_TASK_SERIALIZER = "json"
CELERY_ACCEPT_CONTENT  = ["json"]
CELERY_TIMEZONE        = "Asia/Thimphu"

# ── Cache — Redis primary, DB fallback ─────────────────────────────
# NDI status polling (webhook → status poll) REQUIRES a shared cache.
# If Redis is unavailable, falls back to database cache automatically.
try:
    import redis as _redis_lib
    _r = _redis_lib.from_url(REDIS_URL, socket_connect_timeout=1)
    _r.ping()
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
            "OPTIONS": {
                "socket_connect_timeout": 2,
                "socket_timeout": 2,
            },
        }
    }
except Exception:
    # Redis not available — use database cache (slower but works)
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.db.DatabaseCache",
            "LOCATION": "eis_cache_table",
        }
    }

# ── CORS ───────────────────────────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173"
).split(",")
CORS_ALLOW_CREDENTIALS = True

# ── Email ──────────────────────────────────────────────────────────
# Fallback only — real config lives in SystemSetting DB.
# Views call SystemSetting.get().apply_email_settings() before sending mail.
EMAIL_BACKEND       = "django.core.mail.backends.console.EmailBackend"
EMAIL_HOST          = ""
EMAIL_PORT          = 587
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = ""
EMAIL_HOST_PASSWORD = ""
DEFAULT_FROM_EMAIL  = "noreply@doe.gov.bt"

# ── Static & Media ─────────────────────────────────────────────────
STATIC_URL  = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
MEDIA_URL   = "/media/"
MEDIA_ROOT  = BASE_DIR / "media"

# ── Internationalisation ───────────────────────────────────────────
LANGUAGE_CODE = "en-us"
TIME_ZONE     = "Asia/Thimphu"
USE_I18N      = True
USE_TZ        = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ── Session ────────────────────────────────────────────────────────
SESSION_COOKIE_AGE              = 900
SESSION_EXPIRE_AT_BROWSER_CLOSE = True
SESSION_COOKIE_SECURE           = False

# ── EIS App-specific settings ──────────────────────────────────────
EIS_MAX_EXCEL_ROWS           = 50000
EIS_SESSION_TIMEOUT_MINUTES  = 15
EIS_MAX_LOGIN_ATTEMPTS       = 5
EIS_LOCKOUT_DURATION_MINUTES = 30
EIS_PASSWORD_EXPIRY_DAYS     = 90

# ── Unfold Admin ───────────────────────────────────────────────────
UNFOLD = {
    "SITE_TITLE":     "EIS Admin",
    "SITE_HEADER":    "Energy Information System",
    "SITE_SUBHEADER": "Dept. of Energy · MoENR · Bhutan",
    "SITE_URL":       "/",
    "SITE_SYMBOL":    "bolt",

    # ── Bhutan EIS green palette ──────────────────────────────────
    "COLORS": {
        "primary": {
            "50":  "240 253 244",
            "100": "220 252 231",
            "200": "187 247 208",
            "300": "134 239 172",
            "400": "74  222 128",
            "500": "34  197 94",
            "600": "22  163 74",
            "700": "21  128 61",
            "800": "22  101 52",
            "900": "20  83  45",
            "950": "5   46  22",
        },
    },

    # ── Sidebar navigation ────────────────────────────────────────
    "SIDEBAR": {
        "show_search":            True,
        "show_all_applications":  False,
        "navigation": [
            {
                "title":     "👥 User Management",
                "separator": True,
                "items": [
                    {
                        "title": "Users",
                        "icon":  "person",
                        "link":  reverse_lazy("admin:authentication_user_changelist"),
                    },
                    {
                        "title": "Roles & Permissions",
                        "icon":  "admin_panel_settings",
                        "link":  reverse_lazy("admin:authentication_role_changelist"),
                    },
                ],
            },
            {
                "title":     "📊 Monitoring",
                "separator": True,
                "items": [
                    {
                        "title": "Audit Logs",
                        "icon":  "manage_history",
                        "link":  reverse_lazy("admin:authentication_auditlog_changelist"),
                    },
                    {
                        "title": "Sessions",
                        "icon":  "devices",
                        "link":  reverse_lazy("admin:authentication_usersession_changelist"),
                    },
                ],
            },
            {
                "title":     "⚙️ System",
                "separator": True,
                "items": [
                    {
                        "title": "Site Settings",
                        "icon":  "tune",
                        "link":  reverse_lazy("admin:administration_sitesetting_changelist"),
                    },
                    {
                        "title": "System Settings",
                        "icon":  "settings_applications",
                        "link":  reverse_lazy("admin:administration_systemsetting_changelist"),
                    },
                ],
            },
        ],
    },
}

# ── Logging ────────────────────────────────────────────────────────
LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verbose": {"format": "{levelname} {asctime} {module} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verbose"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "eis_apps.authentication": {
            "handlers": ["console"], "level": "DEBUG", "propagate": False,
        },
    },
}

# ── NDI Integration ────────────────────────────────────────────────
# ALL NDI config (client_id, client_secret, webhook_secret, URLs) is
# stored in SystemSetting DB and read at runtime via SystemSetting.cached().
# These fallback values are only used if DB is unreachable at startup.
NDI_CLIENT_ID        = ""
NDI_CLIENT_SECRET    = ""
NDI_WEBHOOK_ID       = "eis-bhutan-26"
NDI_WEBHOOK_SECRET   = ""
NDI_WEBHOOK_BASE_URL = ""
NDI_WEBHOOK_ENDPOINT = ""
NDI_AUTH_URL         = "https://staging.bhutanndi.com/authentication/v1/authenticate"
NDI_VERIFIER_URL     = "https://demo-client.bhutanndi.com/verifier/v1/proof-request"
NDI_SCHEMA_ID        = "https://dev-schema.ngotag.com/schemas/c7952a0a-e9b5-4a4b-a714-1e5d0a1ae076"
# Configure NDI at: /admin/system-settings → NDI tab