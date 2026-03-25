# backend/eis_apps/master_data/urls.py
from django.urls import path
from . import views

urlpatterns = [

    # ── Energy Supply ────────────────────────────────────────────
    path("energy-supply/",              views.EnergySupplyListCreateView.as_view(),  name="energy-supply-list"),
    path("energy-supply/<int:pk>/",     views.EnergySupplyDetailView.as_view(),      name="energy-supply-detail"),
    path("energy-supply/dropdown/",     views.EnergySupplyDropdownView.as_view(),    name="energy-supply-dropdown"),

    # ── Conversion Factors ───────────────────────────────────────
    path("conversion-factors/",         views.ConversionFactorListCreateView.as_view(), name="conversion-factor-list"),
    path("conversion-factors/<int:pk>/",views.ConversionFactorDetailView.as_view(),     name="conversion-factor-detail"),

    # ── Sectors ──────────────────────────────────────────────────
    path("sectors/",                    views.SectorListCreateView.as_view(),        name="sector-list"),
    path("sectors/<int:pk>/",           views.SectorDetailView.as_view(),            name="sector-detail"),
    path("sectors/dropdown/",           views.SectorDropdownView.as_view(),          name="sector-dropdown"),

    # ── Electricity Categories ───────────────────────────────────
    path("electricity-categories/",             views.ElectricityCategoryListCreateView.as_view(), name="electricity-category-list"),
    path("electricity-categories/<int:pk>/",    views.ElectricityCategoryDetailView.as_view(),     name="electricity-category-detail"),
    path("electricity-categories/dropdown/",    views.ElectricityCategoryDropdownView.as_view(),   name="electricity-category-dropdown"),

    # ── Vehicle Types ─────────────────────────────────────────────
    path("vehicle-types/",              views.VehicleTypeListCreateView.as_view(),   name="vehicle-type-list"),
    path("vehicle-types/<int:pk>/",     views.VehicleTypeDetailView.as_view(),       name="vehicle-type-detail"),
    path("vehicle-types/dropdown/",     views.VehicleTypeDropdownView.as_view(),     name="vehicle-type-dropdown"),

    # ── Mileage ───────────────────────────────────────────────────
    path("mileage/",                    views.MileageListCreateView.as_view(),       name="mileage-list"),
    path("mileage/<int:pk>/",           views.MileageDetailView.as_view(),           name="mileage-detail"),

    # ── Biogas Size ───────────────────────────────────────────────
    path("biogas-sizes/",               views.BiogasSizeListCreateView.as_view(),    name="biogas-size-list"),
    path("biogas-sizes/<int:pk>/",      views.BiogasSizeDetailView.as_view(),        name="biogas-size-detail"),

    # ── Solar Energy Size ─────────────────────────────────────────
    path("solar-sizes/",                views.SolarEnergySizeListCreateView.as_view(), name="solar-size-list"),
    path("solar-sizes/<int:pk>/",       views.SolarEnergySizeDetailView.as_view(),     name="solar-size-detail"),

    # ── Industry Classification ───────────────────────────────────
    path("industry-classifications/",           views.IndustryClassificationListCreateView.as_view(), name="industry-classification-list"),
    path("industry-classifications/<int:pk>/",  views.IndustryClassificationDetailView.as_view(),     name="industry-classification-detail"),
    path("industry-classifications/dropdown/",  views.IndustryClassificationDropdownView.as_view(),   name="industry-classification-dropdown"),
]