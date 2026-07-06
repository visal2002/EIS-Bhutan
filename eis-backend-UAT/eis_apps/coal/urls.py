from django.urls import path
from . import views, views_bulk_import

app_name = 'coal'

urlpatterns = [
    path('', views.CoalDataListCreateView.as_view(), name='coal-list'),
    path('production/', views.CoalProductionView.as_view(), name='coal-production'),
    path('production/bulk-import/', views_bulk_import.CoalBulkImportView.as_view(), name='coal-production-bulk'),
    path('import/', views.CoalImportView.as_view(), name='coal-import'),
    path('import/bulk-import/', views_bulk_import.CoalBulkImportView.as_view(), name='coal-import-bulk'),
    path('consumption/', views.CoalConsumptionView.as_view(), name='coal-consumption'),
    path('consumption/bulk-import/', views_bulk_import.CoalBulkImportView.as_view(), name='coal-consumption-bulk'),
    path('trade/', views.CoalTradeView.as_view(), name='coal-trade'),
    path('trade/bulk-import/', views_bulk_import.CoalBulkImportView.as_view(), name='coal-trade-bulk'),
    path('<int:pk>/', views.CoalDataDetailView.as_view(), name='coal-detail'),
    path('bulk-import/', views_bulk_import.CoalBulkImportView.as_view(), name='coal-bulk'),
]