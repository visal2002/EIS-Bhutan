from django.urls import path
from . import views, views_bulk_import

app_name = 'air_transport'

urlpatterns = [
    # Aircraft Activity
    path('activity/', views.AircraftActivityListCreateView.as_view(), name='activity-list'),
    path('activity/<int:pk>/', views.AircraftActivityDetailView.as_view(), name='activity-detail'),
    path('activity/bulk-import/', views_bulk_import.AircraftActivityBulkImportView.as_view(), name='activity-bulk'),

    # Aviation Fuel Consumption
    path('consumption/', views.AviationFuelConsumptionListCreateView.as_view(), name='consumption-list'),
    path('consumption/<int:pk>/', views.AviationFuelConsumptionDetailView.as_view(), name='consumption-detail'),
    path('consumption/bulk-import/', views_bulk_import.AviationFuelConsumptionBulkImportView.as_view(), name='consumption-bulk'),
]

