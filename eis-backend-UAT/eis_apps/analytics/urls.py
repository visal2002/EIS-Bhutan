from django.urls import path
from . import views

app_name = 'analytics'

urlpatterns = [
    path('widgets/', views.WidgetLibraryListView.as_view(), name='widget-list'),
    path('dashboard/', views.UserDashboardView.as_view(), name='user-dashboard'),
    path('discovery/', views.AnalyticsDiscoveryView.as_view(), name='discovery'),
    path('query/', views.DynamicDataView.as_view(), name='query'),
]
