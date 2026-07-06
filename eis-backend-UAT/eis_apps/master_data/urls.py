from django.urls import path
from . import views, views_bulk_import

urlpatterns = [
    # ── Conversion Units ──────────────────────────────────────────
    path("settings/conversion-units/",             views.ConversionUnitListCreateView.as_view(),  name="conversion-unit-list"),
    path("settings/conversion-units/<int:pk>/",    views.ConversionUnitDetailView.as_view(),      name="conversion-unit-detail"),
    path("settings/conversion-units/dropdown/",    views.ConversionUnitDropdownView.as_view(),    name="conversion-unit-dropdown"),

    # ── Electricity Types ─────────────────────────────────────────
    path("settings/electricity-types/",            views.ElectricityTypeListCreateView.as_view(), name="electricity-type-list"),
    path("settings/electricity-types/<int:pk>/",   views.ElectricityTypeDetailView.as_view(),     name="electricity-type-detail"),
    path("settings/electricity-types/dropdown/",   views.ElectricityTypeDropdownView.as_view(),   name="electricity-type-dropdown"),



    # ── Fuel Types ────────────────────────────────────────────────
    path("settings/fuel-types/",                   views.FuelTypeListCreateView.as_view(),        name="fuel-type-list"),
    path("settings/fuel-types/<int:pk>/",          views.FuelTypeDetailView.as_view(),            name="fuel-type-detail"),
    path("settings/fuel-types/dropdown/",          views.FuelTypeDropdownView.as_view(),          name="fuel-type-dropdown"),

    # ── Vehicle Fuel Types ────────────────────────────────────────
    path("settings/vehicle-fuel-types/",                   views.VehicleFuelTypeListCreateView.as_view(),   name="vehicle-fuel-type-list"),
    path("settings/vehicle-fuel-types/<int:pk>/",          views.VehicleFuelTypeDetailView.as_view(),       name="vehicle-fuel-type-detail"),
    path("settings/vehicle-fuel-types/dropdown/",          views.VehicleFuelTypeDropdownView.as_view(),     name="vehicle-fuel-type-dropdown"),

    # ── Production Types ──────────────────────────────────────────
    path("settings/production-types/",             views.ProductionTypeListCreateView.as_view(),  name="production-type-list"),
    path("settings/production-types/<int:pk>/",    views.ProductionTypeDetailView.as_view(),      name="production-type-detail"),
    path("settings/production-types/dropdown/",    views.ProductionTypeDropdownView.as_view(),    name="production-type-dropdown"),

    # ── Panel Types ───────────────────────────────────────────────
    path("settings/panel-types/",                  views.PanelTypeListCreateView.as_view(),       name="panel-type-list"),
    path("settings/panel-types/<int:pk>/",         views.PanelTypeDetailView.as_view(),           name="panel-type-detail"),
    path("settings/panel-types/dropdown/",         views.PanelTypeDropdownView.as_view(),         name="panel-type-dropdown"),

    # ── Industry Categories ───────────────────────────────────────
    path("settings/industry-categories/",          views.IndustryCategoryListCreateView.as_view(), name="industry-category-list"),
    path("settings/industry-categories/<int:pk>/", views.IndustryCategoryDetailView.as_view(),     name="industry-category-detail"),
    path("settings/industry-categories/dropdown/", views.IndustryCategoryDropdownView.as_view(),   name="industry-category-dropdown"),

    # ── Measurement Units ─────────────────────────────────────────
    path("settings/measurement-units/",            views.MeasurementUnitListCreateView.as_view(),  name="measurement-unit-list"),
    path("settings/measurement-units/<int:pk>/",   views.MeasurementUnitDetailView.as_view(),      name="measurement-unit-detail"),
    path("settings/measurement-units/dropdown/",   views.MeasurementUnitDropdownView.as_view(),    name="measurement-unit-dropdown"),

    # ── Energy Categories ─────────────────────────────────────────
    path("settings/energy-categories/",            views.EnergyCategoryListCreateView.as_view(),   name="energy-category-list"),
    path("settings/energy-categories/<int:pk>/",   views.EnergyCategoryDetailView.as_view(),       name="energy-category-detail"),
    path("settings/energy-categories/dropdown/",   views.EnergyCategoryDropdownView.as_view(),     name="energy-category-dropdown"),

    # ════════════════════════════════════════════════════════════════
    # SHARED DATA COLLECTION SETTINGS
    # ════════════════════════════════════════════════════════════════

    # Dzongkhag
    path("settings/dzongkhags/",                 views.DzongkhagListCreateView.as_view(),          name="dzongkhag-list"),
    path("settings/dzongkhags/<int:pk>/",        views.DzongkhagDetailView.as_view(),              name="dzongkhag-detail"),
    path("settings/dzongkhags/dropdown/",        views.DzongkhagDropdownView.as_view(),            name="dzongkhag-dropdown"),

    # Data Collection Years
    path("settings/data-years/",                views.DataCollectionYearListCreateView.as_view(),  name="dc-year-list"),
    path("settings/data-years/<int:pk>/",       views.DataCollectionYearDetailView.as_view(),      name="dc-year-detail"),
    path("settings/data-years/dropdown/",       views.DataCollectionYearDropdownView.as_view(),    name="dc-year-dropdown"),

    # Data Sources
    path("settings/data-sources/",               views.DataSourceListCreateView.as_view(),          name="data-source-list"),
    path("settings/data-sources/<int:pk>/",      views.DataSourceDetailView.as_view(),              name="data-source-detail"),
    path("settings/data-sources/dropdown/",      views.DataSourceDropdownView.as_view(),            name="data-source-dropdown"),

    # Countries
    path("settings/countries/",                  views.CountryListCreateView.as_view(),             name="country-list"),
    path("settings/countries/<int:pk>/",         views.CountryDetailView.as_view(),                 name="country-detail"),
    path("settings/countries/dropdown/",         views.CountryDropdownView.as_view(),               name="country-dropdown"),

    # BPC Categories
    path("settings/bpc-categories/",             views.BPCCategoryListCreateView.as_view(),         name="bpc-category-list"),
    path("settings/bpc-categories/<int:pk>/",    views.BPCCategoryDetailView.as_view(),             name="bpc-category-detail"),
    path("settings/bpc-categories/dropdown/",    views.BPCCategoryDropdownView.as_view(),           name="bpc-category-dropdown"),

    # Generation Plants
    path("settings/generation-plants/",          views.GenerationPlantListCreateView.as_view(),     name="generation-plant-list"),
    path("settings/generation-plants/<int:pk>/", views.GenerationPlantDetailView.as_view(),         name="generation-plant-detail"),
    path("settings/generation-plants/dropdown/", views.GenerationPlantDropdownView.as_view(),       name="generation-plant-dropdown"),

    # Substations
    path("substations/",                views.SubstationListCreateView.as_view(),          name="substation-list"),
    path("substations/<int:pk>/",       views.SubstationDetailView.as_view(),              name="substation-detail"),
    path("substations/dropdown/",       views.SubstationDropdownView.as_view(),            name="substation-dropdown"),

    # Substation Transformers
    path("substation-transformers/",          views.SubstationTransformerListCreateView.as_view(),     name="substation-transformer-list"),
    path("substation-transformers/<int:pk>/", views.SubstationTransformerDetailView.as_view(),         name="substation-transformer-detail"),
    path("substation-transformers/dropdown/", views.SubstationTransformerDropdownView.as_view(),       name="substation-transformer-dropdown"),

    # ════════════════════════════════════════════════════════════════
    # MIGRATED FROM MASTER DATA
    # ════════════════════════════════════════════════════════════════

    # Sectors
    path("sectors/",                    views.SectorListCreateView.as_view(),        name="sector-list"),
    path("sectors/<int:pk>/",           views.SectorDetailView.as_view(),            name="sector-detail"),
    path("sectors/dropdown/",           views.SectorDropdownView.as_view(),          name="sector-dropdown"),

    # Electricity Categories
    path("electricity-categories/",          views.ElectricityCategoryListCreateView.as_view(), name="electricity-category-list"),
    path("electricity-categories/<int:pk>/", views.ElectricityCategoryDetailView.as_view(),     name="electricity-category-detail"),
    path("electricity-categories/dropdown/", views.ElectricityCategoryDropdownView.as_view(),   name="electricity-category-dropdown"),

    # Vehicle Types
    path("vehicle-types/",              views.VehicleTypeListCreateView.as_view(),   name="vehicle-type-list"),
    path("vehicle-types/<int:pk>/",     views.VehicleTypeDetailView.as_view(),       name="vehicle-type-detail"),
    path("vehicle-types/dropdown/",     views.VehicleTypeDropdownView.as_view(),     name="vehicle-type-dropdown"),

    # Mileage
    path("mileage/",                    views.MileageListCreateView.as_view(),       name="mileage-list"),
    path("mileage/<int:pk>/",           views.MileageDetailView.as_view(),           name="mileage-detail"),

    # Biogas Size
    path("biogas-sizes/",               views.BiogasSizeListCreateView.as_view(),    name="biogas-size-list"),
    path("biogas-sizes/<int:pk>/",      views.BiogasSizeDetailView.as_view(),        name="biogas-size-detail"),

    # Solar Energy Size
    path("solar-sizes/",                views.SolarEnergySizeListCreateView.as_view(), name="solar-size-list"),
    path("solar-sizes/<int:pk>/",       views.SolarEnergySizeDetailView.as_view(),     name="solar-size-detail"),

    # Industry Classification
    path("industry-classifications/",          views.IndustryClassificationListCreateView.as_view(), name="industry-classification-list"),
    path("industry-classifications/<int:pk>/", views.IndustryClassificationDetailView.as_view(),     name="industry-classification-detail"),
    path("industry-classifications/dropdown/", views.IndustryClassificationDropdownView.as_view(),   name="industry-classification-dropdown"),

    # ── Energy Supply (MIGRATED) ──────────────────────────────────
    path("energy-supply/",            views.EnergySupplyListCreateView.as_view(),  name="energy-supply-list"),
    path("energy-supply/<int:pk>/",   views.EnergySupplyDetailView.as_view(),      name="energy-supply-detail"),
    path("energy-supply/tree/",       views.EnergySupplyTreeView.as_view(),        name="energy-supply-tree"),
    path("energy-supply/dropdown/",   views.EnergySupplyDropdownView.as_view(),    name="energy-supply-dropdown"),

    # ── Conversion Factor (MIGRATED) ──────────────────────────────
    path("conversion-factors/",          views.ConversionFactorListCreateView.as_view(), name="conversion-factor-list"),
    path("conversion-factors/<int:pk>/", views.ConversionFactorDetailView.as_view(),     name="conversion-factor-detail"),

    # ── Bulk Imports ──────────────────────────────────────────────
    path("sectors/bulk-import/", views_bulk_import.SectorBulkImportView.as_view(), name="sector-bulk-import"),
    path("electricity-categories/bulk-import/", views_bulk_import.ElectricityCategoryBulkImportView.as_view(), name="electricity-category-bulk-import"),
    path("vehicle-types/bulk-import/", views_bulk_import.VehicleTypeBulkImportView.as_view(), name="vehicle-type-bulk-import"),
    path("mileage/bulk-import/", views_bulk_import.MileageBulkImportView.as_view(), name="mileage-bulk-import"),
    path("biogas-sizes/bulk-import/", views_bulk_import.BiogasSizeBulkImportView.as_view(), name="biogas-size-bulk-import"),
    path("solar-sizes/bulk-import/", views_bulk_import.SolarEnergySizeBulkImportView.as_view(), name="solar-size-bulk-import"),
    path("industry-classifications/bulk-import/", views_bulk_import.IndustryClassificationBulkImportView.as_view(), name="industry-classification-bulk-import"),
    path("energy-supplies/bulk-import/", views_bulk_import.EnergySupplyBulkImportView.as_view(), name="energy-supply-bulk-import"),
    path("conversion-factors/bulk-import/", views_bulk_import.ConversionFactorBulkImportView.as_view(), name="conversion-factor-bulk-import"),

    # Settings Bulk Imports
    path("settings/conversion-units/bulk-import/",   views_bulk_import.ConversionUnitBulkImportView.as_view(),   name="conversion-unit-bulk-import"),
    path("settings/electricity-types/bulk-import/",  views_bulk_import.ElectricityTypeBulkImportView.as_view(),  name="electricity-type-bulk-import"),

    path("settings/vehicle-fuel-types/bulk-import/", views_bulk_import.VehicleFuelTypeBulkImportView.as_view(), name="vehicle-fuel-type-bulk-import"),
    path("settings/production-types/bulk-import/",   views_bulk_import.ProductionTypeBulkImportView.as_view(),   name="production-type-bulk-import"),
    path("settings/panel-types/bulk-import/",        views_bulk_import.PanelTypeBulkImportView.as_view(),        name="panel-type-bulk-import"),
    path("settings/industry-categories/bulk-import/", views_bulk_import.IndustryCategoryBulkImportView.as_view(), name="industry-category-bulk-import"),
    path("settings/measurement-units/bulk-import/",  views_bulk_import.MeasurementUnitBulkImportView.as_view(),  name="measurement-unit-bulk-import"),
    path("settings/energy-categories/bulk-import/",  views_bulk_import.EnergyCategoryBulkImportView.as_view(),  name="energy-category-bulk-import"),
    path("settings/dzongkhags/bulk-import/",         views_bulk_import.DzongkhagBulkImportView.as_view(),         name="dzongkhag-bulk-import"),
    path("settings/data-years/bulk-import/",         views_bulk_import.DataYearBulkImportView.as_view(),          name="data-year-bulk-import"),
    path("settings/data-sources/bulk-import/",       views_bulk_import.DataSourceBulkImportView.as_view(),        name="data-source-bulk-import"),
    path("settings/countries/bulk-import/",          views_bulk_import.CountryBulkImportView.as_view(),           name="country-bulk-import"),
    path("settings/bpc-categories/bulk-import/",     views_bulk_import.BPCCategoryBulkImportView.as_view(),       name="bpc-category-bulk-import"),
    path("settings/fuel-types/bulk-import/", views_bulk_import.FuelTypeBulkImportView.as_view(), name="fuel-type-bulk-import"),
    path("settings/generation-plants/bulk-import/",  views_bulk_import.GenerationPlantBulkImportView.as_view(),  name="generation-plant-bulk-import"),
    
    # Substations & Transformers Bulk Imports
    path("substations/bulk-import/",               views_bulk_import.SubstationBulkImportView.as_view(),               name="substation-bulk-import"),
    path("substation-transformers/bulk-import/",    views_bulk_import.SubstationTransformerBulkImportView.as_view(),    name="substation-transformer-bulk-import"),
    # ── Summary/Stats ─────────────────────────────────────────────
    path("summary/stats/", views.MasterDataSummaryView.as_view(), name="master-data-stats"),

    # ── Migrated Standard Master Data (17 Models) ─────────────────────────

    path("settings/consumer-types/", views.ConsumerTypeListCreateView.as_view(), name="consumer-types-list"),
    path("settings/consumer-types/<int:pk>/", views.ConsumerTypeDetailView.as_view(), name="consumer-types-detail"),
    path("settings/consumer-types/dropdown/", views.ConsumerTypeDropdownView.as_view(), name="consumer-types-dropdown"),
    path("settings/consumer-types/bulk-import/", views_bulk_import.ConsumerTypeBulkImportView.as_view(), name="consumer-types-bulk-import"),

    path("settings/voltage-types/", views.VoltageTypeListCreateView.as_view(), name="voltage-types-list"),
    path("settings/voltage-types/<int:pk>/", views.VoltageTypeDetailView.as_view(), name="voltage-types-detail"),
    path("settings/voltage-types/dropdown/", views.VoltageTypeDropdownView.as_view(), name="voltage-types-dropdown"),
    path("settings/voltage-types/bulk-import/", views_bulk_import.VoltageTypeBulkImportView.as_view(), name="voltage-types-bulk-import"),

    path("settings/consumer-groups/", views.ConsumerGroupListCreateView.as_view(), name="consumer-groups-list"),
    path("settings/consumer-groups/<int:pk>/", views.ConsumerGroupDetailView.as_view(), name="consumer-groups-detail"),
    path("settings/consumer-groups/dropdown/", views.ConsumerGroupDropdownView.as_view(), name="consumer-groups-dropdown"),
    path("settings/consumer-groups/bulk-import/", views_bulk_import.ConsumerGroupBulkImportView.as_view(), name="consumer-groups-bulk-import"),

    path("settings/locations/", views.LocationListCreateView.as_view(), name="locations-list"),
    path("settings/locations/<int:pk>/", views.LocationDetailView.as_view(), name="locations-detail"),
    path("settings/locations/dropdown/", views.LocationDropdownView.as_view(), name="locations-dropdown"),
    path("settings/locations/bulk-import/", views_bulk_import.LocationBulkImportView.as_view(), name="locations-bulk-import"),

    path("settings/conductor-types/", views.ConductorTypeListCreateView.as_view(), name="conductor-types-list"),
    path("settings/conductor-types/<int:pk>/", views.ConductorTypeDetailView.as_view(), name="conductor-types-detail"),
    path("settings/conductor-types/dropdown/", views.ConductorTypeDropdownView.as_view(), name="conductor-types-dropdown"),
    path("settings/conductor-types/bulk-import/", views_bulk_import.ConductorTypeBulkImportView.as_view(), name="conductor-types-bulk-import"),

    path("settings/unit-types/", views.UnitTypeListCreateView.as_view(), name="unit-types-list"),
    path("settings/unit-types/<int:pk>/", views.UnitTypeDetailView.as_view(), name="unit-types-detail"),
    path("settings/unit-types/dropdown/", views.UnitTypeDropdownView.as_view(), name="unit-types-dropdown"),
    path("settings/unit-types/bulk-import/", views_bulk_import.UnitTypeBulkImportView.as_view(), name="unit-types-bulk-import"),

    path("settings/connection-types/", views.ConnectionTypeListCreateView.as_view(), name="connection-types-list"),
    path("settings/connection-types/<int:pk>/", views.ConnectionTypeDetailView.as_view(), name="connection-types-detail"),
    path("settings/connection-types/dropdown/", views.ConnectionTypeDropdownView.as_view(), name="connection-types-dropdown"),
    path("settings/connection-types/bulk-import/", views_bulk_import.ConnectionTypeBulkImportView.as_view(), name="connection-types-bulk-import"),

    path("settings/plant-sizes/", views.PlantSizeListCreateView.as_view(), name="plant-sizes-list"),
    path("settings/plant-sizes/<int:pk>/", views.PlantSizeDetailView.as_view(), name="plant-sizes-detail"),
    path("settings/plant-sizes/dropdown/", views.PlantSizeDropdownView.as_view(), name="plant-sizes-dropdown"),
    path("settings/plant-sizes/bulk-import/", views_bulk_import.PlantSizeBulkImportView.as_view(), name="plant-sizes-bulk-import"),

    path("settings/grid-types/", views.GridTypeListCreateView.as_view(), name="grid-types-list"),
    path("settings/grid-types/<int:pk>/", views.GridTypeDetailView.as_view(), name="grid-types-detail"),
    path("settings/grid-types/dropdown/", views.GridTypeDropdownView.as_view(), name="grid-types-dropdown"),
    path("settings/grid-types/bulk-import/", views_bulk_import.GridTypeBulkImportView.as_view(), name="grid-types-bulk-import"),

    path("settings/configuration-types/", views.ConfigurationTypeListCreateView.as_view(), name="configuration-types-list"),
    path("settings/configuration-types/<int:pk>/", views.ConfigurationTypeDetailView.as_view(), name="configuration-types-detail"),
    path("settings/configuration-types/dropdown/", views.ConfigurationTypeDropdownView.as_view(), name="configuration-types-dropdown"),
    path("settings/configuration-types/bulk-import/", views_bulk_import.ConfigurationTypeBulkImportView.as_view(), name="configuration-types-bulk-import"),

    path("settings/line-categories/", views.LineCategoryListCreateView.as_view(), name="line-categories-list"),
    path("settings/line-categories/<int:pk>/", views.LineCategoryDetailView.as_view(), name="line-categories-detail"),
    path("settings/line-categories/dropdown/", views.LineCategoryDropdownView.as_view(), name="line-categories-dropdown"),
    path("settings/line-categories/bulk-import/", views_bulk_import.LineCategoryBulkImportView.as_view(), name="line-categories-bulk-import"),

    path("settings/circuit-types/", views.CircuitTypeListCreateView.as_view(), name="circuit-types-list"),
    path("settings/circuit-types/<int:pk>/", views.CircuitTypeDetailView.as_view(), name="circuit-types-detail"),
    path("settings/circuit-types/dropdown/", views.CircuitTypeDropdownView.as_view(), name="circuit-types-dropdown"),
    path("settings/circuit-types/bulk-import/", views_bulk_import.CircuitTypeBulkImportView.as_view(), name="circuit-types-bulk-import"),

    path("settings/subsidy-types/", views.SubsidyTypeListCreateView.as_view(), name="subsidy-types-list"),
    path("settings/subsidy-types/<int:pk>/", views.SubsidyTypeDetailView.as_view(), name="subsidy-types-detail"),
    path("settings/subsidy-types/dropdown/", views.SubsidyTypeDropdownView.as_view(), name="subsidy-types-dropdown"),
    path("settings/subsidy-types/bulk-import/", views_bulk_import.SubsidyTypeBulkImportView.as_view(), name="subsidy-types-bulk-import"),

    path("settings/tower-types/", views.TowerTypeListCreateView.as_view(), name="tower-types-list"),
    path("settings/tower-types/<int:pk>/", views.TowerTypeDetailView.as_view(), name="tower-types-detail"),
    path("settings/tower-types/dropdown/", views.TowerTypeDropdownView.as_view(), name="tower-types-dropdown"),
    path("settings/tower-types/bulk-import/", views_bulk_import.TowerTypeBulkImportView.as_view(), name="tower-types-bulk-import"),

    path("settings/transformer-types/", views.TransformerTypeListCreateView.as_view(), name="transformer-types-list"),
    path("settings/transformer-types/<int:pk>/", views.TransformerTypeDetailView.as_view(), name="transformer-types-detail"),
    path("settings/transformer-types/dropdown/", views.TransformerTypeDropdownView.as_view(), name="transformer-types-dropdown"),
    path("settings/transformer-types/bulk-import/", views_bulk_import.TransformerTypeBulkImportView.as_view(), name="transformer-types-bulk-import"),

    path("settings/voltage-levels/", views.VoltageLevelListCreateView.as_view(), name="voltage-levels-list"),
    path("settings/voltage-levels/<int:pk>/", views.VoltageLevelDetailView.as_view(), name="voltage-levels-detail"),
    path("settings/voltage-levels/dropdown/", views.VoltageLevelDropdownView.as_view(), name="voltage-levels-dropdown"),
    path("settings/voltage-levels/bulk-import/", views_bulk_import.VoltageLevelBulkImportView.as_view(), name="voltage-levels-bulk-import"),

    path("settings/consumer-subtypes/", views.ConsumerSubtypeListCreateView.as_view(), name="consumer-subtypes-list"),
    path("settings/consumer-subtypes/<int:pk>/", views.ConsumerSubtypeDetailView.as_view(), name="consumer-subtypes-detail"),
    path("settings/consumer-subtypes/dropdown/", views.ConsumerSubtypeDropdownView.as_view(), name="consumer-subtypes-dropdown"),
    path("settings/consumer-subtypes/bulk-import/", views_bulk_import.ConsumerSubtypeBulkImportView.as_view(), name="consumer-subtypes-bulk-import"),
]

