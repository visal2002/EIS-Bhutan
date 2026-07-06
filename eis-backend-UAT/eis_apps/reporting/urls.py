from django.urls import path
from . import views

app_name = 'reporting'

urlpatterns = [
    path('dashboard/summary/', views.DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('dashboard/ghg/', views.GHGAnalyticsView.as_view(), name='dashboard-ghg'),
    path('dashboard/generation/', views.GenerationAnalyticsView.as_view(), name='dashboard-generation'),
    path('dashboard/consumption/dzongkhag/', views.ConsumptionByDzongkhagView.as_view(), name='dashboard-consumption-dzongkhag'),
]
