# backend/eis_apps/administration/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import serializers
from .models import SiteSetting, SystemSetting


def _is_admin(request):
    role = getattr(getattr(request.user, 'role', None), 'role_name', None)
    return role == 'ADMIN' or getattr(request.user, 'is_superuser', False)


# ─────────────────────────────────────────────────────────────────
# Site Setting
# ─────────────────────────────────────────────────────────────────

class SiteSettingSerializer(serializers.ModelSerializer):
    site_logo_url = serializers.SerializerMethodField()
    doe_logo_url  = serializers.SerializerMethodField()
    gov_logo_url  = serializers.SerializerMethodField()
    favicon_url   = serializers.SerializerMethodField()

    class Meta:
        model  = SiteSetting
        fields = [
            'site_title', 'site_short_name', 'site_tagline',
            'site_logo', 'site_logo_url',
            'doe_logo',  'doe_logo_url',
            'gov_logo',  'gov_logo_url',
            'favicon',   'favicon_url',
            'contact_email', 'contact_phone', 'contact_address', 'website_url',
            'facebook_url', 'twitter_url', 'youtube_url',
            'allow_ndi_login', 'allow_agency_login',
            'maintenance_mode', 'maintenance_msg',
            'session_timeout', 'max_login_attempts',
            'footer_text', 'copyright_year',
            'updated_at', 'updated_by',
        ]
        read_only_fields = ['updated_at', 'updated_by',
                            'site_logo_url', 'doe_logo_url', 'gov_logo_url', 'favicon_url']

    def _url(self, obj, field):
        req = self.context.get('request')
        f   = getattr(obj, field)
        if not f:
            return None
        return req.build_absolute_uri(f.url) if req else f.url

    def get_site_logo_url(self, obj): return self._url(obj, 'site_logo')
    def get_doe_logo_url(self, obj):  return self._url(obj, 'doe_logo')
    def get_gov_logo_url(self, obj):  return self._url(obj, 'gov_logo')
    def get_favicon_url(self, obj):   return self._url(obj, 'favicon')


class SiteSettingView(APIView):
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        return [AllowAny()] if self.request.method == 'GET' else [IsAuthenticated()]

    def get(self, request):
        return Response(SiteSettingSerializer(
            SiteSetting.get(), context={'request': request}
        ).data)

    def patch(self, request):
        if not _is_admin(request):
            return Response({'error': 'Admins only.'}, status=403)
        s = SiteSettingSerializer(
            SiteSetting.get(), data=request.data,
            partial=True, context={'request': request}
        )
        if s.is_valid():
            obj = s.save()
            obj.updated_by = request.user.username
            obj.save(update_fields=['updated_by'])
            return Response(SiteSettingSerializer(obj, context={'request': request}).data)
        return Response(s.errors, status=400)


# ─────────────────────────────────────────────────────────────────
# System Setting
# ─────────────────────────────────────────────────────────────────

# Fields that must never be returned in plain text in GET responses
_SECRET_FIELDS = [
    'ndi_client_secret', 'ndi_webhook_secret', 'ndi_nats_seed',
    'email_host_password',
    'mas_api_key', 'firms_api_key', 'iis_api_key',
    'ofs_api_key', 'eralis_api_key',
]

_ALL_SYSTEM_FIELDS = [
    # NDI — Bhutan NDI Technical Documentation V1.2 confirmed fields
    'ndi_environment',
    'ndi_client_id', 'ndi_client_secret',
    'ndi_webhook_id', 'ndi_webhook_secret', 'ndi_webhook_base_url',
    'ndi_auth_url', 'ndi_verifier_url',
    'ndi_webhook_register_url', 'ndi_issuer_url',
    'ndi_schema_id',
    'ndi_nats_url', 'ndi_nats_ws_url', 'ndi_nats_seed',
    # Email
    'email_backend', 'email_host', 'email_port',
    'email_use_tls', 'email_use_ssl',
    'email_host_user', 'email_host_password',
    'default_from_email', 'email_timeout',
    # APIs
    'mas_name',    'mas_api_key',    'mas_base_url',    'mas_enabled',
    'firms_name',  'firms_api_key',  'firms_base_url',  'firms_enabled',
    'iis_name',    'iis_api_key',    'iis_base_url',    'iis_enabled',
    'ofs_name',    'ofs_api_key',    'ofs_base_url',    'ofs_enabled',
    'eralis_name', 'eralis_api_key', 'eralis_base_url', 'eralis_enabled',
    # App
    'app_env', 'debug_mode', 'allowed_hosts', 'cors_origins',
    # Meta
    'updated_at', 'updated_by',
]


class SystemSettingSerializer(serializers.ModelSerializer):
    """Read serializer — secrets are masked as '••••••••'."""
    ndi_client_secret   = serializers.SerializerMethodField()
    ndi_webhook_secret  = serializers.SerializerMethodField()
    email_host_password = serializers.SerializerMethodField()
    mas_api_key         = serializers.SerializerMethodField()
    firms_api_key       = serializers.SerializerMethodField()
    iis_api_key         = serializers.SerializerMethodField()
    ofs_api_key         = serializers.SerializerMethodField()
    eralis_api_key      = serializers.SerializerMethodField()

    class Meta:
        model  = SystemSetting
        fields = _ALL_SYSTEM_FIELDS
        read_only_fields = ['updated_at', 'updated_by']

    def _mask(self, obj, f):
        return '••••••••' if getattr(obj, f, '') else ''

    def get_ndi_client_secret(self, obj):   return self._mask(obj, 'ndi_client_secret')
    def get_ndi_webhook_secret(self, obj):  return self._mask(obj, 'ndi_webhook_secret')
    def get_email_host_password(self, obj): return self._mask(obj, 'email_host_password')
    def get_mas_api_key(self, obj):         return self._mask(obj, 'mas_api_key')
    def get_firms_api_key(self, obj):       return self._mask(obj, 'firms_api_key')
    def get_iis_api_key(self, obj):         return self._mask(obj, 'iis_api_key')
    def get_ofs_api_key(self, obj):         return self._mask(obj, 'ofs_api_key')
    def get_eralis_api_key(self, obj):      return self._mask(obj, 'eralis_api_key')


class SystemSettingWriteSerializer(serializers.ModelSerializer):
    """Write serializer — accepts real values for all fields."""
    class Meta:
        model  = SystemSetting
        fields = '__all__'
        read_only_fields = ['updated_at', 'updated_by']


class SystemSettingView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not _is_admin(request):
            return Response({'error': 'Admins only.'}, status=403)
        return Response(SystemSettingSerializer(SystemSetting.get()).data)

    def patch(self, request):
        if not _is_admin(request):
            return Response({'error': 'Admins only.'}, status=403)

        obj  = SystemSetting.get()
        data = request.data.copy()

        # Drop masked placeholder values — don't overwrite with '••••••••'
        for field in _SECRET_FIELDS:
            if data.get(field) == '••••••••':
                data.pop(field)

        s = SystemSettingWriteSerializer(obj, data=data, partial=True)
        if s.is_valid():
            obj = s.save()
            obj.updated_by = request.user.username
            obj.save(update_fields=['updated_by'])
            return Response(SystemSettingSerializer(obj).data)
        return Response(s.errors, status=400)


class TestEmailView(APIView):
    """Send a test email using settings from DB (no restart needed)."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not _is_admin(request):
            return Response({'error': 'Admins only.'}, status=403)

        to = request.data.get('to') or request.user.email
        if not to:
            return Response({'error': 'No recipient email address provided.'}, status=400)

        try:
            # Apply latest DB settings before sending
            SystemSetting.get().apply_email_settings()

            from django.core.mail import send_mail
            from django.conf import settings as dj
            send_mail(
                subject='EIS — Test Email',
                message=(
                    'This is a test email from the Energy Information System.\n\n'
                    f'SMTP Host: {dj.EMAIL_HOST}:{dj.EMAIL_PORT}\n'
                    f'From: {dj.DEFAULT_FROM_EMAIL}'
                ),
                from_email=dj.DEFAULT_FROM_EMAIL,
                recipient_list=[to],
                fail_silently=False,
            )
            return Response({'success': True, 'message': f'Test email sent to {to}'})
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)