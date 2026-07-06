from django.urls import path
from . import views, views_bulk_import

app_name = 'solar'

urlpatterns = [
    path('', views.SolarEnergyListCreateView.as_view(), name='solar-list'),
    path('<int:pk>/', views.SolarEnergyDetailView.as_view(), name='solar-detail'),
    path('bulk-import/', views_bulk_import.SolarBulkImportView.as_view(), name='solar-bulk'),
]