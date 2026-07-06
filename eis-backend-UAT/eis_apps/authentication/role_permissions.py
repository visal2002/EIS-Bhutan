# backend/eis_apps/authentication/role_permissions.py
"""
Module-level permissions per role.
Fields: can_view, can_create, can_edit, can_delete, can_upload, can_download

- can_upload   → Data Collection modules: bulk import / file upload
- can_download → Reports / Dashboard: export to Excel/PDF
"""

# ── All system modules ─────────────────────────────────────────────
# (module_key, display_label, group)
MODULES = [
    # Administration
    ("users",            "User Management",         "Administration"),
    ("roles",            "Roles & Permissions",     "Administration"),
    ("audit_logs",       "Audit Logs",              "Administration"),
    ("master_data",      "Master Data",             "Administration"),
    ("admin_site",       "Site Configuration",       "Administration"),
    ("admin_system",     "System Settings",         "Administration"),

    # Data Collection — each energy type is its own module
    ("electricity_data", "Electricity Data",        "Data Collection"),
    ("solar_data",       "Solar & Renewables",      "Data Collection"),
    ("petroleum_data",   "Petroleum & POL",         "Data Collection"),
    ("fuelwood_data",    "Fuelwood Data",            "Data Collection"),
    ("coal_data",        "Coal Data",               "Data Collection"),
    ("biomass_data",     "Biomass & Biogas",        "Data Collection"),
    ("surface_transport_data", "Surface Transport",     "Data Collection"),
    ("air_transport_data",     "Air Transport",         "Data Collection"),
    ("industry_data",    "Industrial Energy",       "Data Collection"),

    # Reports
    ("energy_reports",   "Energy Reports",          "Reports"),
    ("ghg_report",       "GHG Reports",             "Reports"),
    ("public_dashboard", "Public Dashboard",        "Reports"),

    # Dashboard — each user has their own editable layout
    ("dashboard",        "My Dashboard",            "Dashboard"),
    ("dashboard_admin",  "Dashboard Administration","Dashboard"),
]

# ── Helper: full access dict ───────────────────────────────────────
def _full():
    return {"can_view": True, "can_create": True, "can_edit": True,
            "can_delete": True, "can_upload": True, "can_download": True}

def _view_only():
    return {"can_view": True, "can_create": False, "can_edit": False,
            "can_delete": False, "can_upload": False, "can_download": False}

def _view_download():
    return {"can_view": True, "can_create": False, "can_edit": False,
            "can_delete": False, "can_upload": False, "can_download": True}

def _data_entry():
    """Create + Edit + Upload but no Delete/Download"""
    return {"can_view": True, "can_create": True, "can_edit": True,
            "can_delete": False, "can_upload": True, "can_download": False}

def _data_manage():
    """Full data access without admin delete"""
    return {"can_view": True, "can_create": True, "can_edit": True,
            "can_delete": False, "can_upload": True, "can_download": True}

def _none():
    return {"can_view": False, "can_create": False, "can_edit": False,
            "can_delete": False, "can_upload": False, "can_download": False}

# ── Default permissions per role ───────────────────────────────────
DEFAULTS = {

    "ADMIN": {m[0]: _full() for m in MODULES},

    "DOE_HEAD": {
        # Administration — view only
        "users":            _view_only(),
        "roles":            _view_only(),
        "audit_logs":       _view_only(),
        "master_data":      _view_only(),
        # Data Collection — view + edit + download (approve/review)
        "electricity_data": {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "solar_data":       {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "petroleum_data":   {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "fuelwood_data":    {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "coal_data":        {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "biomass_data":     {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "surface_transport_data":   {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "air_transport_data":       {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "industry_data":    {"can_view": True,  "can_create": False, "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        # Reports — full access including download
        "energy_reports":   {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "ghg_report":       {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "public_dashboard": _view_download(),
        # Dashboard
        "dashboard":        {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": True,  "can_upload": False, "can_download": True},
        "dashboard_admin":  _none(),
    },

    "DATA_MANAGER": {
        # Administration — no access
        "users":            _none(),
        "roles":            _none(),
        "audit_logs":       _none(),
        "master_data":      _data_manage(),
        # Data Collection — full data management
        "electricity_data": _data_manage(),
        "solar_data":       _data_manage(),
        "petroleum_data":   _data_manage(),
        "fuelwood_data":    _data_manage(),
        "coal_data":        _data_manage(),
        "biomass_data":     _data_manage(),
        "surface_transport_data":   _data_manage(),
        "air_transport_data":       _data_manage(),
        "industry_data":    _data_manage(),
        # Reports — create + download
        "energy_reports":   {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "ghg_report":       {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "public_dashboard": _view_download(),
        # Dashboard
        "dashboard":        {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": True,  "can_upload": False, "can_download": True},
        "dashboard_admin":  _none(),
    },

    "DATA_FOCAL": {
        # Administration — no access
        "users":            _none(),
        "roles":            _none(),
        "audit_logs":       _none(),
        "master_data":      _view_only(),
        # Data Collection — entry + upload only
        "electricity_data": _data_entry(),
        "solar_data":       _data_entry(),
        "petroleum_data":   _data_entry(),
        "fuelwood_data":    _data_entry(),
        "coal_data":        _data_entry(),
        "biomass_data":     _data_entry(),
        "surface_transport_data":   _data_entry(),
        "air_transport_data":       _data_entry(),
        "industry_data":    _data_entry(),
        # Reports — view + download only
        "energy_reports":   _view_download(),
        "ghg_report":       _view_download(),
        "public_dashboard": _view_download(),
        # Dashboard — own dashboard
        "dashboard":        {"can_view": True,  "can_create": True,  "can_edit": True,  "can_delete": False, "can_upload": False, "can_download": True},
        "dashboard_admin":  _none(),
    },

    "VIEWER": {
        # Administration — no access
        "users":            _none(),
        "roles":            _none(),
        "audit_logs":       _none(),
        "master_data":      _none(),
        # Data Collection — view only
        "electricity_data": _view_only(),
        "solar_data":       _view_only(),
        "petroleum_data":   _view_only(),
        "fuelwood_data":    _view_only(),
        "coal_data":        _view_only(),
        "biomass_data":     _view_only(),
        "surface_transport_data":   _view_only(),
        "air_transport_data":       _view_only(),
        "industry_data":    _view_only(),
        # Reports — view + download
        "energy_reports":   _view_download(),
        "ghg_report":       _view_download(),
        "public_dashboard": _view_download(),
        # Dashboard — view only
        "dashboard":        _view_download(),
        "dashboard_admin":  _none(),
    },
}