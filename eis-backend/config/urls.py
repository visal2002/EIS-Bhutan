# backend/config/urls.py
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from django.http import HttpResponse
import requests


def proxy_to_vite(request):
    """Proxy all non-API, non-admin requests to Vite dev server."""
    vite_url = f"http://localhost:5173{request.path}"
    if request.META.get("QUERY_STRING"):
        vite_url += f"?{request.META['QUERY_STRING']}"
    try:
        resp = requests.get(
            vite_url,
            headers={"Accept": request.META.get("HTTP_ACCEPT", "*/*")},
            timeout=5,
        )
        content_type = resp.headers.get("Content-Type", "text/html")
        return HttpResponse(resp.content, content_type=content_type, status=resp.status_code)
    except requests.exceptions.ConnectionError:
        return HttpResponse(
            """
            <html>
            <body style="font-family:sans-serif;padding:40px;background:#F8FAFC;text-align:center">
                <div style="font-size:48px;margin-bottom:16px">⚡</div>
                <h2 style="color:#0F2A4A">EIS Frontend Not Running</h2>
                <p style="color:#64748B;margin-top:8px">Start the React dev server first:</p>
                <pre style="background:#1E293B;color:#fff;padding:16px;border-radius:8px;
                            display:inline-block;text-align:left;margin-top:16px">
cd frontend
npm run dev</pre>
                <p style="color:#64748B;margin-top:16px">Then refresh this page.</p>
            </body>
            </html>
            """,
            content_type="text/html",
            status=503,
        )


# Change admin URL to /eis-admin/
admin.site.site_url = "/"

urlpatterns = [
    # ── Admin panel at /eis-admin/ (Django default login) ─────────
    path("eis-admin/", admin.site.urls),

    # ── Auth API ───────────────────────────────────────────────────
    path("api/auth/", include("eis_apps.authentication.urls")),

    # ── Phase 3+ APIs (uncomment as you build) ────────────────────
    path("api/master-data/",    include("eis_apps.master_data.urls")),
    path("api/admin/",          include("eis_apps.administration.urls")),
    # path("api/solar/",          include("eis_apps.solar.urls")),
    # path("api/fuelwood/",       include("eis_apps.fuelwood.urls")),
    # path("api/petroleum/",      include("eis_apps.petroleum.urls")),
    # path("api/biomass/",        include("eis_apps.biomass.urls")),
    # path("api/coal/",           include("eis_apps.coal.urls")),
    # path("api/transport/",      include("eis_apps.transport.urls")),
    # path("api/industry/",       include("eis_apps.industry.urls")),
    # path("api/ghg/",            include("eis_apps.ghg.urls")),
    # path("api/reporting/",      include("eis_apps.reporting.urls")),
    # path("api/administration/", include("eis_apps.administration.urls")),

] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)

# ── Dev: proxy /login and everything else to Vite ─────────────────
if settings.DEBUG:
    urlpatterns += [
        re_path(r"^(?!api/|eis-admin/|static/|media/).*$", proxy_to_vite),
    ]