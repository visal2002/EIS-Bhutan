import os, django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from django.contrib.auth import get_user_model
from eis_apps.administration.models import SiteSetting
from eis_apps.administration.views import SiteSettingView
from rest_framework.test import APIRequestFactory, force_authenticate

User = get_user_model()
factory = APIRequestFactory()

try:
    user = User.objects.get(username='admin.demo')
    request = factory.get('/api/admin/site-settings/')
    force_authenticate(request, user=user)
    view = SiteSettingView.as_view()
    response = view(request)
    print(f"Status: {response.status_code}")
    print(f"Data: {response.data}")
except Exception as e:
    print(f"Error: {e}")
