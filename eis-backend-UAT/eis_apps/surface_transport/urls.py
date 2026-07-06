from django.urls import path
from . import views, views_bulk_import

app_name = 'surface_transport'

urlpatterns = [
    # Transport Consumption
    path('consumption/', views.TransportConsumptionListCreateView.as_view(), name='consumption-list'),
    path('consumption/<int:pk>/', views.TransportConsumptionDetailView.as_view(), name='consumption-detail'),
    path('consumption/bulk-import/', views_bulk_import.TransportConsumptionBulkImportView.as_view(), name='consumption-bulk'),

    # Vehicle Registration
    path('registration/', views.VehicleRegistrationListCreateView.as_view(), name='registration-list'),
    path('registration/<int:pk>/', views.VehicleRegistrationDetailView.as_view(), name='registration-detail'),
    path('registration/bulk-import/', views_bulk_import.VehicleRegistrationBulkImportView.as_view(), name='registration-bulk'),
]