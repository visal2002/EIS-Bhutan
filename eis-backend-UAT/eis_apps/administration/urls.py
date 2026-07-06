# backend/eis_apps/administration/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SiteSettingView, SystemSettingView, TestEmailView, BulkOperationView, BulkImportJobViewSet, BulkImportErrorViewSet, BulkExportJobViewSet, LandingPageSlideViewSet, LandingPageConfigView

router = DefaultRouter()
router.register(r'import-jobs', BulkImportJobViewSet, basename='import-job')
router.register(r'import-errors', BulkImportErrorViewSet, basename='import-error')
router.register(r'export-jobs', BulkExportJobViewSet, basename='export-job')
router.register(r'landing-slides', LandingPageSlideViewSet, basename='landing-slide')

urlpatterns = [
    path('', include(router.urls)),
    path('site-settings/',   SiteSettingView.as_view(),   name='site-settings'),
    path('system-settings/', SystemSettingView.as_view(),  name='system-settings'),
    path('landing-config/',  LandingPageConfigView.as_view(), name='landing-config'),
    path('test-email/',      TestEmailView.as_view(),      name='test-email'),
    path('bulk-operation/',  BulkOperationView.as_view(),  name='bulk-operation'),
]