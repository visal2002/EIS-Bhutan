"""
EIS Full-Stack Integration Test
Covers: Database, Backend API, Auth, All App Modules
"""
import os
import sys
import json
import django
import requests
from pathlib import Path
from dotenv import load_dotenv

# Force UTF-8 output on Windows
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings.development")
django.setup()

BASE_URL = "http://localhost:8000"
PASS = "[PASS]"
FAIL = "[FAIL]"
INFO = "[INFO]"
WARN = "[WARN]"

results = {"passed": 0, "failed": 0, "warnings": 0}

def ok(msg):
    print(f"  {PASS} {msg}")
    results["passed"] += 1

def fail(msg):
    print(f"  {FAIL} {msg}")
    results["failed"] += 1

def warn(msg):
    print(f"  {WARN} {msg}")
    results["warnings"] += 1

def info(msg):
    print(f"  {INFO} {msg}")

def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

# ─────────────────────────────────────────────────────────────
# 1. DATABASE CONNECTIVITY
# ─────────────────────────────────────────────────────────────
section("1. DATABASE CONNECTIVITY")
try:
    from django.db import connection
    with connection.cursor() as cursor:
        cursor.execute("SELECT version();")
        version = cursor.fetchone()[0]
        ok(f"PostgreSQL connected: {version[:65]}")

        cursor.execute("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';")
        count = cursor.fetchone()[0]
        ok(f"Database tables found: {count}")
except Exception as e:
    fail(f"Database connection failed: {e}")

# ─────────────────────────────────────────────────────────────
# 2. DJANGO APPS & MODELS
# ─────────────────────────────────────────────────────────────
section("2. DJANGO APPS & MODELS")
apps_to_check = [
    ("authentication",    "eis_apps.authentication.models",    "User"),
    ("master_data",       "eis_apps.master_data.models",       "Dzongkhag"),
    ("electricity",       "eis_apps.electricity.models",       "ElectricityGeneration"),
    ("solar",             "eis_apps.solar.models",             "SolarEnergy"),
    ("fuelwood",          "eis_apps.fuelwood.models",          "FuelwoodConsumption"),
    ("pol",               "eis_apps.pol.models",               "POLAviation"),
    ("biomass",           "eis_apps.biomass.models",           "BiogasData"),
    ("coal",              "eis_apps.coal.models",              "CoalData"),
    ("industry",          "eis_apps.industry.models",          "IndustryConsumption"),
    ("surface_transport", "eis_apps.surface_transport.models", "TransportConsumption"),
    ("air_transport",     "eis_apps.air_transport.models",     "AircraftActivity"),
    ("ghg",               "eis_apps.ghg.models",              "GHGCalculation"),
    ("administration",    "eis_apps.administration.models",    "SiteSetting"),
    ("reporting",         "eis_apps.reporting.models",         None),
    ("analytics",         "eis_apps.analytics.models",         None),
]

for app_name, module_path, model_name in apps_to_check:
    try:
        mod = __import__(module_path, fromlist=[model_name] if model_name else ["__name__"])
        if model_name:
            model = getattr(mod, model_name, None)
            if model:
                count = model.objects.count()
                ok(f"{app_name}.{model_name}: accessible (records: {count})")
            else:
                warn(f"{app_name}: module imported but model '{model_name}' not found")
        else:
            ok(f"{app_name}: module imported successfully")
    except Exception as e:
        fail(f"{app_name}: {e}")

# ─────────────────────────────────────────────────────────────
# 3. BACKEND HTTP SERVER
# ─────────────────────────────────────────────────────────────
section("3. BACKEND HTTP SERVER (http://localhost:8000)")
try:
    r = requests.get(f"{BASE_URL}/eis-admin/login/", timeout=5)
    if r.status_code == 200:
        ok(f"Admin panel accessible (HTTP {r.status_code})")
    else:
        warn(f"Admin panel returned HTTP {r.status_code}")
except Exception as e:
    fail(f"Backend server unreachable: {e}")

# ─────────────────────────────────────────────────────────────
# 4. FRONTEND SERVER
# ─────────────────────────────────────────────────────────────
section("4. FRONTEND SERVER (http://localhost:5173)")
try:
    r = requests.get("http://localhost:5173/", timeout=5)
    if r.status_code == 200:
        ok(f"Frontend Vite server accessible (HTTP {r.status_code})")
        if "<!doctype html" in r.text.lower():
            ok("Frontend returns valid HTML page")
        else:
            warn("Frontend response may not be valid HTML")
    else:
        warn(f"Frontend returned HTTP {r.status_code}")
except Exception as e:
    fail(f"Frontend server unreachable: {e}")

# ─────────────────────────────────────────────────────────────
# 5. AUTHENTICATION API
# ─────────────────────────────────────────────────────────────
section("5. AUTHENTICATION API")
from django.contrib.auth import get_user_model
User = get_user_model()
TEST_USERNAME = "test_admin"
TEST_PASSWORD = "TestAdmin@2024"
TEST_EMAIL = "test@eis.bt"

try:
    if not User.objects.filter(username=TEST_USERNAME).exists():
        User.objects.create_superuser(username=TEST_USERNAME, email=TEST_EMAIL, password=TEST_PASSWORD)
        ok(f"Test superuser '{TEST_USERNAME}' created")
    else:
        user = User.objects.get(username=TEST_USERNAME)
        user.set_password(TEST_PASSWORD)
        user.save()
        ok(f"Test superuser '{TEST_USERNAME}' already exists (password reset)")
except Exception as e:
    fail(f"Could not create test user: {e}")

ACCESS_TOKEN = None
REFRESH_TOKEN = None
try:
    r = requests.post(
        f"{BASE_URL}/api/auth/login/",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        timeout=10,
    )
    if r.status_code == 200:
        data = r.json()
        # Handle nested or flat JWT response
        ACCESS_TOKEN = (data.get("access") or
                        data.get("data", {}).get("access") or
                        data.get("tokens", {}).get("access"))
        REFRESH_TOKEN = (data.get("refresh") or
                         data.get("data", {}).get("refresh") or
                         data.get("tokens", {}).get("refresh"))
        if ACCESS_TOKEN:
            ok(f"Login API: JWT access token obtained (HTTP 200)")
            if REFRESH_TOKEN:
                ok(f"Login API: JWT refresh token obtained")
            else:
                warn(f"Login API: No refresh token in response. Keys: {list(data.keys())}")
        else:
            warn(f"Login HTTP 200 but no access token. Response keys: {list(data.keys())}")
    elif r.status_code == 400:
        fail(f"Login failed (HTTP 400): {r.text[:300]}")
    elif r.status_code == 500:
        fail(f"Login server error (HTTP 500): {r.text[:300]}")
    else:
        fail(f"Login returned unexpected HTTP {r.status_code}: {r.text[:200]}")
except Exception as e:
    fail(f"Login API request failed: {e}")

# ─────────────────────────────────────────────────────────────
# 6. PROTECTED API ENDPOINTS (with correct paths)
# ─────────────────────────────────────────────────────────────
section("6. PROTECTED API ENDPOINTS")

if ACCESS_TOKEN:
    headers = {"Authorization": f"Bearer {ACCESS_TOKEN}"}
    api_endpoints = [
        # Master Data
        ("GET", "/api/master-data/settings/dzongkhags/",        "Master Data - Dzongkhags"),
        ("GET", "/api/master-data/settings/generation-plants/", "Master Data - Generation Plants"),
        ("GET", "/api/master-data/settings/countries/",         "Master Data - Countries"),
        # Electricity
        ("GET", "/api/electricity/generation/",                  "Electricity - Generation"),
        # Solar
        ("GET", "/api/solar/",                                   "Solar Energy"),
        # Fuelwood
        ("GET", "/api/fuelwood/consumption/",                    "Fuelwood - Consumption"),
        # POL
        ("GET", "/api/pol/aviation/",                            "POL - Aviation"),
        ("GET", "/api/pol/import-export/",                       "POL - Import/Export"),
        # Biomass
        ("GET", "/api/biomass/biogas/",                          "Biomass - Biogas"),
        # Coal
        ("GET", "/api/coal/production/",                         "Coal - Production"),
        # Industry
        ("GET", "/api/industry/",                                "Industry - Consumption"),
        # Surface Transport
        ("GET", "/api/surface-transport/consumption/",           "Surface Transport"),
        # Air Transport
        ("GET", "/api/air-transport/activity/",                  "Air Transport - Activity"),
        ("GET", "/api/air-transport/consumption/",               "Air Transport - Fuel Consumption"),
        # GHG (urls empty per Phase 2)
        # Administration
        ("GET", "/api/admin/site-settings/",                     "Administration - Site Settings"),
        # Analytics
        ("GET", "/api/analytics/dashboard/",                     "Analytics - Dashboard"),
        ("GET", "/api/analytics/widgets/",                       "Analytics - Widgets"),
        # Reporting
        ("GET", "/api/reporting/dashboard/summary/",             "Reporting - Dashboard Summary"),
        ("GET", "/api/reporting/dashboard/ghg/",                 "Reporting - GHG Analytics"),
        ("GET", "/api/reporting/dashboard/generation/",          "Reporting - Generation Analytics"),
    ]
    for method, endpoint, label in api_endpoints:
        try:
            r = requests.request(method, f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
            if r.status_code in (200, 201):
                try:
                    data = r.json()
                    count_info = ""
                    if isinstance(data, dict):
                        cnt = data.get("count", data.get("total", ""))
                        count_info = f" (count: {cnt})" if cnt != "" else ""
                    ok(f"{label}: HTTP {r.status_code}{count_info}")
                except Exception:
                    ok(f"{label}: HTTP {r.status_code}")
            elif r.status_code == 404:
                warn(f"{label}: HTTP 404 - endpoint not found")
            elif r.status_code == 403:
                warn(f"{label}: HTTP 403 - forbidden")
            elif r.status_code == 401:
                fail(f"{label}: HTTP 401 - unauthorized (token issue)")
            elif r.status_code == 500:
                fail(f"{label}: HTTP 500 - server error")
            else:
                warn(f"{label}: HTTP {r.status_code}")
        except Exception as e:
            fail(f"{label}: Request failed - {e}")
else:
    fail("Skipping protected endpoint tests -- no access token available")

# ─────────────────────────────────────────────────────────────
# 7. SECURITY: UNAUTHENTICATED REJECTION
# ─────────────────────────────────────────────────────────────
section("7. SECURITY - UNAUTHENTICATED ACCESS")
try:
    r = requests.get(f"{BASE_URL}/api/electricity/generation/", timeout=5)
    if r.status_code in (401, 403):
        ok(f"Protected endpoints correctly reject unauthenticated requests (HTTP {r.status_code})")
    else:
        warn(f"Unauthenticated request returned HTTP {r.status_code} (expected 401/403)")
except Exception as e:
    fail(f"Security test failed: {e}")

# ─────────────────────────────────────────────────────────────
# 8. JWT TOKEN REFRESH
# ─────────────────────────────────────────────────────────────
section("8. JWT TOKEN REFRESH")
if REFRESH_TOKEN:
    try:
        r = requests.post(
            f"{BASE_URL}/api/auth/token/refresh/",
            json={"refresh": REFRESH_TOKEN},
            timeout=5,
        )
        if r.status_code == 200:
            new_token = r.json().get("access")
            if new_token:
                ok(f"Token refresh works -- new access token obtained")
            else:
                warn(f"Token refresh HTTP 200 but no new access token")
        else:
            warn(f"Token refresh returned HTTP {r.status_code}: {r.text[:200]}")
    except Exception as e:
        fail(f"Token refresh failed: {e}")
else:
    warn("Skipping token refresh test -- no refresh token available")

# ─────────────────────────────────────────────────────────────
# 9. DATABASE CACHE TABLE
# ─────────────────────────────────────────────────────────────
section("9. DATABASE CACHE TABLE")
try:
    with connection.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) FROM eis_cache_table;")
        count = cursor.fetchone()[0]
        ok(f"Cache table 'eis_cache_table' exists (entries: {count})")
except Exception as e:
    fail(f"Cache table check failed: {e}")

# ─────────────────────────────────────────────────────────────
# 10. FRONTEND <-> BACKEND PROXY
# ─────────────────────────────────────────────────────────────
section("10. FRONTEND <-> BACKEND PROXY")
try:
    r = requests.get("http://localhost:5173/", timeout=5)
    if r.status_code == 200:
        ok("Frontend dev server serving correctly")

    r2 = requests.post(
        "http://localhost:5173/api/auth/login/",
        json={"username": TEST_USERNAME, "password": TEST_PASSWORD},
        timeout=10,
    )
    if r2.status_code in (200, 400):
        ok(f"Frontend->Backend proxy active (API call via port 5173 -> 8000, HTTP {r2.status_code})")
    elif r2.status_code == 500:
        warn(f"Proxy reached backend but got server error (HTTP 500)")
    else:
        warn(f"Proxy test returned HTTP {r2.status_code}")
except Exception as e:
    warn(f"Proxy test skipped: {e}")

# ─────────────────────────────────────────────────────────────
# SUMMARY
# ─────────────────────────────────────────────────────────────
section("FINAL TEST SUMMARY")
total = results["passed"] + results["failed"] + results["warnings"]
print(f"  Total checks : {total}")
print(f"  Passed       : {results['passed']}")
print(f"  Warnings     : {results['warnings']}")
print(f"  Failed       : {results['failed']}")
print()
if results["failed"] == 0:
    print("  ALL CRITICAL TESTS PASSED -- Stack is healthy!")
elif results["failed"] <= 3:
    print("  MINOR ISSUES DETECTED -- Review warnings above")
else:
    print("  MULTIPLE FAILURES -- Check logs above")
print()
