from django.urls import path
from . import views, views_bulk_import

app_name = 'fuelwood'

urlpatterns = [
    # Fuelwood Supply
    path('supply/', views.FuelwoodSupplyListCreateView.as_view(), name='supply-list'),
    path('supply/<int:pk>/', views.FuelwoodSupplyDetailView.as_view(), name='supply-detail'),
    path('supply/bulk-import/', views_bulk_import.FuelwoodSupplyBulkImportView.as_view(), name='supply-bulk'),

    # Fuelwood Consumption
    path('consumption/', views.FuelwoodConsumptionListCreateView.as_view(), name='consumption-list'),
    path('consumption/<int:pk>/', views.FuelwoodConsumptionDetailView.as_view(), name='consumption-detail'),
    path('consumption/bulk-import/', views_bulk_import.FuelwoodConsumptionBulkImportView.as_view(), name='consumption-bulk'),
]