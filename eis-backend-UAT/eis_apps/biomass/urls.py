from django.urls import path
from . import views, views_bulk_import

app_name = 'biomass'

urlpatterns = [
    # Biogas Data
    path('biogas/', views.BiogasDataListCreateView.as_view(), name='biogas-list'),
    path('biogas/<int:pk>/', views.BiogasDataDetailView.as_view(), name='biogas-detail'),
    path('biogas/bulk-import/', views_bulk_import.BiogasBulkImportView.as_view(), name='biogas-bulk'),

    # Briquette
    path('briquette/', views.BriquetteDataListCreateView.as_view(), name='briquette-list'),
    path('briquette/<int:pk>/', views.BriquetteDataDetailView.as_view(), name='briquette-detail'),
    path('briquette/bulk-import/', views_bulk_import.BriquetteBulkImportView.as_view(), name='briquette-bulk'),

    # Charcoal
    path('charcoal/', views.CharcoalDataListCreateView.as_view(), name='charcoal-list'),
    path('charcoal/<int:pk>/', views.CharcoalDataDetailView.as_view(), name='charcoal-detail'),
    path('charcoal/bulk-import/', views_bulk_import.CharcoalBulkImportView.as_view(), name='charcoal-bulk'),
]