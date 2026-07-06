from django.urls import path
from . import views, views_bulk_import

app_name = 'pol'

urlpatterns = [
    # POL Import/Export
    path('import-export/', views.POLImportExportListCreateView.as_view(), name='import-export-list'),
    path('import-export/<int:pk>/', views.POLImportExportDetailView.as_view(), name='import-export-detail'),
    path('import-export/bulk-import/', views_bulk_import.POLImportExportBulkImportView.as_view(), name='import-export-bulk'),

    # POL Aviation
    path('aviation/', views.POLAviationListCreateView.as_view(), name='aviation-list'),
    path('aviation/<int:pk>/', views.POLAviationDetailView.as_view(), name='aviation-detail'),
    path('aviation/bulk-import/', views_bulk_import.POLAviationBulkImportView.as_view(), name='aviation-bulk'),
]