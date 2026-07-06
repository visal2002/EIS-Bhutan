# backend/config/settings/unfold_config.py
# Paste this entire UNFOLD dict into base.py
# (import reverse_lazy is already at top of base.py)

from django.urls import reverse_lazy

UNFOLD = {
    "SITE_TITLE":     "EIS Admin",
    "SITE_HEADER":    "Energy Information System",
    "SITE_SUBHEADER": "Department of Energy · MoENR · Bhutan",
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

            # ── User & Access Management ──────────────────────────
            {
                "title":     "👥 User Management",
                "separator": True,
                "items": [
                    {
                        "title": "Users",
                        "icon":  "person",
                        "link":  reverse_lazy("admin:authentication_user_changelist"),
                        "badge": lambda request: str(
                            __import__("eis_apps.authentication.models",
                                       fromlist=["User"]).User.objects.filter(
                                           status="ACTIVE").count()
                        ),
                    },
                    {
                        "title": "Roles & Permissions",
                        "icon":  "admin_panel_settings",
                        "link":  reverse_lazy("admin:authentication_role_changelist"),
                    },
                ],
            },

            # ── Activity / Monitoring ─────────────────────────────
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

            # ── System Configuration ──────────────────────────────
            {
                "title":     "⚙️ System",
                "separator": True,
                "items": [
                    {
                        "title": "Site Settings",
                        "icon":  "tune",
                        "link":  reverse_lazy("admin:administration_sitesetting_changelist"),
                    },
                ],
            },
        ],
    },
}