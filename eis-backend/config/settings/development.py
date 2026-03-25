# backend/config/settings/development.py
from .base import *
import os
from pathlib import Path
from dotenv import load_dotenv

# Path to backend/.env
BASE_DIR = Path(__file__).resolve().parent.parent.parent
env_path = BASE_DIR / ".env"

# Load .env — override=True ensures fresh values every time
load_dotenv(env_path, override=True)

DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "unbeaued-leida-unconcernedly.ngrok-free.dev",  # ngrok webhook URL
    ".ngrok-free.dev",  # covers all *.ngrok-free.dev
    ".ngrok-free.app",  # covers all *.ngrok-free.app
]

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://unbeaued-leida-unconcernedly.ngrok-free.dev",
]

# ── Database (local SQLite) ────────────────────────────────────────
DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": BASE_DIR / "db.sqlite3",
    }
}

# ── Email (print to console in dev) ───────────────────────────────
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# ── CORS (allow all in dev) ────────────────────────────────────────
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_CREDENTIALS = True  # ← ADDED: allows frontend to send JWT

# ── Show browsable API in dev ──────────────────────────────────────
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = (   # ← ADDED
    "rest_framework.renderers.JSONRenderer",
    "rest_framework.renderers.BrowsableAPIRenderer",
)

# ── NDI OAuth (dev callback) ───────────────────────────────────────
NDI_REDIRECT_URI = "http://localhost:8000/api/auth/ndi/callback/"  # ← ADDED

# ── Disable HTTPS requirements in dev ─────────────────────────────
SESSION_COOKIE_SECURE = False   # ← ADDED
CSRF_COOKIE_SECURE    = False   # ← ADDED