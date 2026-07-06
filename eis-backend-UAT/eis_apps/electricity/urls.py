# eis_apps/electricity/urls.py
from django.urls import path
from . import views, views_bulk_import

urlpatterns = [

    # ══ CORE DATA RECORDS (Energy Balance) ════════════════════════
    path("consumption/",                         views.ElectricityConsumptionListCreateView.as_view(),  name="consumption-list"),
    path("consumption/<int:pk>/",                views.ElectricityConsumptionDetailView.as_view(),      name="consumption-detail"),
    path("consumption/bulk-import/",           views_bulk_import.ElectricityConsumptionBulkImportView.as_view(),  name="consumption-bulk-import"),
    
    path("generation/",                          views.ElectricityGenerationListCreateView.as_view(),   name="generation-list"),
    path("generation/<int:pk>/",                 views.ElectricityGenerationDetailView.as_view(),       name="generation-detail"),
    path("generation/bulk-import/",            views_bulk_import.ElectricityGenerationBulkImportView.as_view(),   name="generation-bulk-import"),


    # ══ DETAILED OPERATIONAL RECORDS ══════════════════════════════

    # Hydrology
    path("hydrology/",                          views.HydrologyDataListCreateView.as_view(),           name="hydrology-list"),
    path("hydrology/<int:pk>/",                 views.HydrologyDataDetailView.as_view(),               name="hydrology-detail"),
    path("hydrology/bulk-import/",              views_bulk_import.HydrologyBulkImportView.as_view(),   name="hydrology-bulk-import"),

    # Generation (Daily/Hourly)
    path("generation-daily/",                   views.PlantDailyGenerationListCreateView.as_view(),   name="generation-daily-list"),
    path("generation-daily/<int:pk>/",          views.PlantDailyGenerationDetailView.as_view(),       name="generation-daily-detail"),
    path("generation-daily/bulk-import/",       views_bulk_import.PlantDailyGenerationBulkImportView.as_view(), name="generation-daily-bulk-import"),

    path("generation-hourly/",                  views.HourlyGenerationDataListCreateView.as_view(),    name="generation-hourly-list"),
    path("generation-hourly/<int:pk>/",         views.HourlyGenerationDataDetailView.as_view(),        name="generation-hourly-detail"),
    path("generation-hourly/bulk-import/",      views_bulk_import.HourlyGenerationBulkImportView.as_view(), name="generation-hourly-bulk-import"),

    # Infrastructure
    path("infra/transmission/",                  views.TransmissionLineDataListCreateView.as_view(),    name="infra-transmission-list"),
    path("infra/transmission/<int:pk>/",         views.TransmissionLineDataDetailView.as_view(),        name="infra-transmission-detail"),
    path("infra/transmission/bulk-import/",      views_bulk_import.TransmissionLineBulkImportView.as_view(), name="infra-transmission-bulk-import"),

    path("infra/distribution/",                  views.DistributionLineDataListCreateView.as_view(),    name="infra-distribution-list"),
    path("infra/distribution/<int:pk>/",         views.DistributionLineDataDetailView.as_view(),        name="infra-distribution-detail"),
    path("infra/distribution/bulk-import/",      views_bulk_import.DistributionLineBulkImportView.as_view(), name="infra-distribution-bulk-import"),

    path("infra/dist-transformer/",              views.DistributionTransformerDataListCreateView.as_view(), name="infra-dist-transformer-list"),
    path("infra/dist-transformer/<int:pk>/",     views.DistributionTransformerDataDetailView.as_view(),     name="infra-dist-transformer-detail"),
    path("infra/dist-transformer/bulk-import/",  views_bulk_import.DistributionTransformerBulkImportView.as_view(), name="infra-dist-transformer-bulk-import"),

    # Sales & Consumers
    path("sales/",                               views.ElectricitySalesDataListCreateView.as_view(),    name="sales-list"),
    path("sales/<int:pk>/",                      views.ElectricitySalesDataDetailView.as_view(),        name="sales-detail"),
    path("sales/bulk-import/",                   views_bulk_import.ElectricitySalesBulkImportView.as_view(), name="sales-bulk-import"),

    path("consumers/",                           views.ElectricityConsumerDataListCreateView.as_view(), name="consumers-list"),
    path("consumers/<int:pk>/",                  views.ElectricityConsumerDataDetailView.as_view(),     name="consumers-detail"),
    path("consumers/bulk-import/",               views_bulk_import.ElectricityConsumerBulkImportView.as_view(), name="consumers-bulk-import"),

    # Trade
    path("trade/market-export/",                 views.TradeMarketExportListCreateView.as_view(),       name="trade-market-export-list"),
    path("trade/market-export/<int:pk>/",        views.TradeMarketExportDetailView.as_view(),           name="trade-market-export-detail"),
    path("trade/market-export/bulk-import/",     views_bulk_import.TradeMarketExportBulkImportView.as_view(),  name="trade-market-export-bulk-import"),

    path("trade/market-import/",                 views.TradeMarketImportDamListCreateView.as_view(),    name="trade-market-import-list"),
    path("trade/market-import/<int:pk>/",        views.TradeMarketImportDamDetailView.as_view(),        name="trade-market-import-detail"),
    path("trade/market-import/bulk-import/",     views_bulk_import.TradeMarketImportDamBulkImportView.as_view(),  name="trade-market-import-bulk-import"),

    path("trade/market-import-rtm/",             views.TradeMarketImportRtmListCreateView.as_view(),    name="trade-market-import-rtm-list"),
    path("trade/market-import-rtm/<int:pk>/",    views.TradeMarketImportRtmDetailView.as_view(),        name="trade-market-import-rtm-detail"),
    path("trade/market-import-rtm/bulk-import/", views_bulk_import.TradeMarketImportRtmBulkImportView.as_view(),  name="trade-market-import-rtm-bulk-import"),

    path("trade/rea/",                           views.ExportREADataListCreateView.as_view(),           name="trade-rea-list"),
    path("trade/rea/<int:pk>/",                  views.ExportREADataDetailView.as_view(),               name="trade-rea-detail"),
    path("trade/rea/bulk-import/",               views_bulk_import.ExportREABulkImportView.as_view(),   name="trade-rea-bulk-import"),

    # Others
    path("biogas/",                              views.BiogasGenerationDataListCreateView.as_view(),    name="biogas-list"),
    path("biogas/<int:pk>/",                     views.BiogasGenerationDataDetailView.as_view(),         name="biogas-detail"),
    path("biogas/bulk-import/",                  views_bulk_import.BiogasGenerationBulkImportView.as_view(), name="biogas-bulk-import"),

    path("industry/",                            views.IndustryPowerDataListCreateView.as_view(),       name="industry-list"),
    path("industry/<int:pk>/",                   views.IndustryPowerDataDetailView.as_view(),           name="industry-detail"),
    path("industry/bulk-import/",                views_bulk_import.IndustryPowerBulkImportView.as_view(), name="industry-bulk-import"),

    path("substation-load/",                     views.SubstationLoadDataListCreateView.as_view(),      name="substation-load-list"),
    path("substation-load/<int:pk>/",            views.SubstationLoadDataDetailView.as_view(),          name="substation-load-detail"),
    path("substation-load/bulk-import/",         views_bulk_import.SubstationLoadBulkImportView.as_view(), name="substation-load-bulk-import"),

    path("royalty/",                             views.ElectricityRoyaltyDataListCreateView.as_view(),  name="royalty-list"),
    path("royalty/<int:pk>/",                    views.ElectricityRoyaltyDataDetailView.as_view(),      name="royalty-detail"),
    path("royalty/bulk-import/",                 views_bulk_import.ElectricityRoyaltyBulkImportView.as_view(), name="royalty-bulk-import"),

    path("forecast/",                            views.SupplyDemandForecastingDataListCreateView.as_view(), name="forecast-list"),
    path("forecast/<int:pk>/",                   views.SupplyDemandForecastingDataDetailView.as_view(),     name="forecast-detail"),
    path("forecast/bulk-import/",                views_bulk_import.SupplyDemandForecastingBulkImportView.as_view(), name="forecast-bulk-import"),
]