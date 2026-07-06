from django.urls import path
from . import views, views_bulk_import

app_name = 'industry'

urlpatterns = [
    path('', views.IndustryConsumptionListCreateView.as_view(), name='industry-list'),
    path('<int:pk>/', views.IndustryConsumptionDetailView.as_view(), name='industry-detail'),
    path('bulk-import/', views_bulk_import.IndustryBulkImportView.as_view(), name='industry-bulk'),
]