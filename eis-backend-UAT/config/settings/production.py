# backend/config/settings/production.py
import os
from .base import *

DEBUG = False

ALLOWED_HOSTS = os.environ.get("ALLOWED_HOSTS", "energy.gov.bt,172.30.3.10").split(",")

# ── Security (enforce HTTPS in prod) ──────────────────────────────
SESSION_COOKIE_SECURE           = os.environ.get("SESSION_COOKIE_SECURE", "True") == "True"
CSRF_COOKIE_SECURE              = os.environ.get("CSRF_COOKIE_SECURE", "True") == "True"
SECURE_SSL_REDIRECT             = os.environ.get("SECURE_SSL_REDIRECT", "False") == "True"
SECURE_HSTS_SECONDS             = int(os.environ.get("SECURE_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS  = os.environ.get("SECURE_HSTS_INCLUDE_SUBDOMAINS", "True") == "True"
SECURE_HSTS_PRELOAD             = os.environ.get("SECURE_HSTS_PRELOAD", "False") == "True"
SECURE_BROWSER_XSS_FILTER       = True
SECURE_CONTENT_TYPE_NOSNIFF     = True

# ── Email (SMTP in production) ────────────────────────────────────
EMAIL_BACKEND       = "django.core.mail.backends.smtp.EmailBackend"
EMAIL_HOST          = os.environ.get("EMAIL_HOST",          "smtp.gov.bt")
EMAIL_PORT          = int(os.environ.get("EMAIL_PORT",      "587"))
EMAIL_USE_TLS       = True
EMAIL_HOST_USER     = os.environ.get("EMAIL_HOST_USER",     "")
EMAIL_HOST_PASSWORD = os.environ.get("EMAIL_HOST_PASSWORD", "")

# ── Static files (WhiteNoise for production) ──────────────────────
MIDDLEWARE.insert(1, "whitenoise.middleware.WhiteNoiseMiddleware")
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ── Only JSON in prod (no browsable API) ──────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (
    "rest_framework.renderers.JSONRenderer",
)

# ── CORS locked down in prod ───────────────────────────────────────
CORS_ALLOWED_ORIGINS = os.environ.get(
    "CORS_ALLOWED_ORIGINS", "http://localhost:5173,http://172.30.3.10,http://172.30.3.10:32230"
).split(",")
CSRF_TRUSTED_ORIGINS = os.environ.get(
    "CSRF_TRUSTED_ORIGINS", "http://localhost:5173,http://172.30.3.10,http://172.30.3.10:32230"
).split(",")

# ── Logging — Console only in K8s ─────────────────────────────────
LOGGING["root"]["handlers"] = ["console"]