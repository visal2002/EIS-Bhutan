# backend/eis_apps/administration/urls.py
from django.urls import path
from .views import SiteSettingView, SystemSettingView, TestEmailView

urlpatterns = [
    path('site-settings/',   SiteSettingView.as_view(),   name='site-settings'),
    path('system-settings/', SystemSettingView.as_view(),  name='system-settings'),
    path('test-email/',      TestEmailView.as_view(),      name='test-email'),
]