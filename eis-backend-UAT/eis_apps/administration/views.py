# backend/eis_apps/administration/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework import serializers, viewsets, mixins
from .models import SiteSetting, SystemSetting, LandingPageSlide, BlockType, LandingPageSection


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
            'session_timeout', 'max_login_attempts', 'audit_log_retention_days',
            'footer_text', 'copyright_year',
            'landing_header', 'landing_body_sectors', 'landing_body_integrations', 'landing_footer',
            'landing_faqs', 'landing_page_settings',
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
        return Response(s.errors, status=400)


# ─────────────────────────────────────────────────────────────────
# Landing Page Slides
# ─────────────────────────────────────────────────────────────────

class LandingPageSlideSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = LandingPageSlide
        fields = ['id', 'title', 'tagline', 'image', 'image_url', 'cta_text', 'cta_link', 'order']
        read_only_fields = ['id', 'image_url']

    def get_image_url(self, obj):
        req = self.context.get('request')
        if not obj.image:
            return None
        return req.build_absolute_uri(obj.image.url) if req else obj.image.url


class LandingPageSlideViewSet(viewsets.ModelViewSet):
    queryset = LandingPageSlide.objects.all()
    serializer_class = LandingPageSlideSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method in ['GET']:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        if not _is_admin(self.request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admins only.")
        serializer.save()

    def perform_update(self, serializer):
        if not _is_admin(self.request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admins only.")
        serializer.save()

    def perform_destroy(self, instance):
        if not _is_admin(self.request):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Admins only.")
        instance.delete()


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
    ndi_nats_seed       = serializers.SerializerMethodField()

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
    def get_ndi_nats_seed(self, obj):       return self._mask(obj, 'ndi_nats_seed')


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

from django.apps import apps
from django.db import transaction

class BulkOperationView(APIView):
    """
    Generic Bulk Operation endpoint.
    Accepts:
    {
        "app_model": "transport.VehicleRegistration",
        "action": "update" | "delete" | "restore",
        "ids": [1, 2, 3],
        "data": {"status": "INACTIVE"} # For update
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        app_model = request.data.get("app_model")
        action = request.data.get("action")
        ids = request.data.get("ids", [])
        data = request.data.get("data", {})

        if not app_model or not action or not ids:
            return Response({"error": "Missing app_model, action, or ids"}, status=400)

        try:
            model_class = apps.get_model(app_model)
        except LookupError:
            return Response({"error": f"Model {app_model} not found"}, status=400)

        # Basic permission check: user must be Data Focal or above
        from eis_apps.authentication.permissions import IsDataFocalOrAbove
        if not IsDataFocalOrAbove().has_permission(request, self):
            return Response({"error": "Permission denied"}, status=403)

        qs = model_class.objects.filter(id__in=ids)
        
        try:
            with transaction.atomic():
                if action == "update":
                    qs.update(**data)
                elif action == "delete":
                    if hasattr(model_class, "is_active"):
                        qs.update(is_active=False)
                    else:
                        qs.delete()
                elif action == "restore":
                    if hasattr(model_class, "is_active"):
                        qs.update(is_active=True)
                else:
                    return Response({"error": "Invalid action"}, status=400)
                    
            return Response({"success": True, "count": len(ids)})
        except Exception as e:
            return Response({"error": str(e)}, status=500)

# ─────────────────────────────────────────────────────────────────
# Bulk Import Jobs & Errors
# ─────────────────────────────────────────────────────────────────
from rest_framework import viewsets, mixins
from rest_framework.decorators import action
from rest_framework.pagination import PageNumberPagination
from .models import BulkImportJob, BulkImportError, BulkExportJob

class BulkImportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkImportJob
        fields = '__all__'

class BulkExportJobSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkExportJob
        fields = '__all__'

class BulkImportErrorSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulkImportError
        fields = '__all__'

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 100
    page_size_query_param = 'page_size'
    max_page_size = 1000

class BulkImportJobViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin):
    queryset = BulkImportJob.objects.all()
    serializer_class = BulkImportJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        # Allow filtering by module name
        qs = super().get_queryset()
        module = self.request.query_params.get('module_name')
        if module:
            from django.db.models import Q
            base_module = module.split('?')[0]
            qs = qs.filter(Q(module_name=module) | Q(module_name=base_module))
        return qs

    def _check_permission(self, job):
        is_admin = self.request.user.is_superuser or (hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.role_name == 'ADMIN')
        if is_admin:
            return True
        if job.created_by and job.created_by == self.request.user:
            return True
        return False

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status == 'processing':
            job.status = 'paused'
            job.save(update_fields=['status'])
            return Response({'status': 'paused'})
        return Response({'detail': 'Job is not processing.'}, status=400)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status == 'paused':
            job.status = 'processing'
            job.save(update_fields=['status'])
            return Response({'status': 'processing'})
        return Response({'detail': 'Job is not paused.'}, status=400)

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status in ['processing', 'paused', 'pending']:
            job.status = 'stopped'
            job.save(update_fields=['status'])
            return Response({'status': 'stopped'})
        return Response({'detail': 'Job cannot be stopped.'}, status=400)

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
            
        if job.status not in ['stopped', 'failed', 'processing']:
            return Response({'detail': 'Only stopped, failed, or stuck jobs can be retried.'}, status=400)
            
        if not job.file:
            return Response({'detail': 'This job has no file saved. Cannot retry.'}, status=400)
            
        from django.apps import apps
        try:
            job_module = job.module_name.split('?')[0]
            app_label, model_name = job_module.split('.')
            model = apps.get_model(app_label, model_name)
        except Exception:
            return Response({"detail": "Invalid module."}, status=400)
            
        import importlib
        try:
            views_module = importlib.import_module(f"eis_apps.{app_label}.views_bulk_import")
            view_class = None
            for attr_name in dir(views_module):
                attr = getattr(views_module, attr_name)
                if isinstance(attr, type) and hasattr(attr, 'model') and getattr(attr, 'model') == model:
                    view_class = attr
                    break
                    
            if not view_class:
                return Response({"detail": "Bulk view not found."}, status=400)
                
            # Create a mock request payload that triggers post() 
            # Wait, post() expects the file upload. 
            # We already have the file in job.file. 
            # We can mock the request.FILES and just call post() directly!
            # Or we can just read the dataframe and launch the thread!
            
            from eis_core.utils.import_engine import BaseBulkImportView
            import pandas as pd
            import io
            
            df = BaseBulkImportView.get_dataframe_from_file(job.file.path)
            job.status = 'processing'
            job.save(update_fields=['status'])
            
            import threading
            
            def run_import():
                from django.db import close_old_connections
                close_old_connections()
                
                class MockRequest:
                    def __init__(self, user):
                        self.user = user
                mock_request = MockRequest(request.user)
                view_instance = view_class()
                
                processed_count = 0
                error_count = 0
                
                if job.processed_rows > 0:
                    df_to_process = df.iloc[job.processed_rows:]
                    processed_count = job.processed_rows
                    error_count = job.error_count
                else:
                    df_to_process = df
                
                try:
                    for index, row in df_to_process.iterrows():
                        row_num = row.get("_row", index + 2) if "_row" in row else index + 2
                        try:
                            data = view_instance.process_row(row, mock_request)
                            # We don't have 'mode' easily available, assume 'create_only' for retries 
                            # or try to lookup if possible. Most jobs are create_only.
                            # For safety, let's just create.
                            serializer = view_instance.serializer_class(data=data)
                            if serializer.is_valid():
                                serializer.save(created_by=request.user, updated_by=request.user)
                            else:
                                raise ValueError(serializer.errors)
                        except Exception as e:
                            error_count += 1
                            err_msg = e.args[0] if len(e.args) > 0 else str(e)
                            if not isinstance(err_msg, dict):
                                err_msg = {"_error": str(err_msg)}
                                
                            row_dict = row.to_dict()
                            for k,v in row_dict.items():
                                if pd.isna(v): row_dict[k] = None
                                
                            from eis_apps.administration.models import BulkImportError
                            BulkImportError.objects.create(
                                job=job,
                                row_index=row_num,
                                raw_data=row_dict,
                                error_message=err_msg
                            )
                        
                        processed_count += 1
                        
                        if processed_count % 100 == 0:
                            job.refresh_from_db()
                            while job.status == 'paused':
                                import time
                                time.sleep(2)
                                job.refresh_from_db()
                            if job.status == 'stopped':
                                break
                            job.processed_rows = processed_count
                            job.error_count = error_count
                            job.save(update_fields=['processed_rows', 'error_count'])
                            close_old_connections()
                            
                    job.refresh_from_db()
                    if job.status != 'stopped':
                        job.status = 'completed' if error_count == 0 else 'failed'
                        job.processed_rows = processed_count
                        job.error_count = error_count
                        job.save(update_fields=['status', 'processed_rows', 'error_count'])
                except Exception as e:
                    job.status = 'failed'
                    job.save(update_fields=['status'])
                finally:
                    close_old_connections()

            t = threading.Thread(target=run_import)
            t.daemon = True
            t.start()
            
            return Response({'status': 'processing', 'detail': 'Job resumed successfully'})
            
        except Exception as e:
            return Response({"detail": str(e)}, status=500)

    def destroy(self, request, *args, **kwargs):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        return super().destroy(request, *args, **kwargs)



class BulkExportJobViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin):
    queryset = BulkExportJob.objects.all()
    serializer_class = BulkExportJobSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        qs = super().get_queryset()
        module = self.request.query_params.get('module_name')
        if module:
            from django.db.models import Q
            base_module = module.split('?')[0]
            qs = qs.filter(Q(module_name=module) | Q(module_name=base_module))
        # Non-admins only see their own exports
        is_admin = self.request.user.is_superuser or (hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.role_name == 'ADMIN')
        if not is_admin:
            qs = qs.filter(created_by=self.request.user)
        return qs

    def create(self, request, *args, **kwargs):
        module_name = request.data.get('module_name')
        if not module_name:
            return Response({'detail': 'module_name is required'}, status=400)
            
        filters = request.data.get('filters', {})
        
        job = BulkExportJob.objects.create(
            module_name=module_name,
            filters=filters,
            created_by=request.user,
            status='pending'
        )
        
        # Start background job
        import threading
        from eis_core.utils.export_engine import run_export_job
        domain_url = request.build_absolute_uri('/')[:-1] # Get domain
        
        t = threading.Thread(target=run_export_job, args=(job.id, domain_url))
        t.daemon = True
        t.start()
        
        return Response(self.get_serializer(job).data, status=201)

    def _check_permission(self, job):
        is_admin = self.request.user.is_superuser or (hasattr(self.request.user, 'role') and self.request.user.role and self.request.user.role.role_name == 'ADMIN')
        if is_admin:
            return True
        if job.created_by and job.created_by == self.request.user:
            return True
        return False

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status == 'processing':
            job.status = 'paused'
            job.save(update_fields=['status'])
            return Response({'status': 'paused'})
        return Response({'detail': 'Job is not processing.'}, status=400)

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status == 'paused':
            job.status = 'processing'
            job.save(update_fields=['status'])
            return Response({'status': 'processing'})
        return Response({'detail': 'Job is not paused.'}, status=400)

    @action(detail=True, methods=['post'])
    def stop(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
        if job.status in ['processing', 'paused', 'pending']:
            job.status = 'stopped'
            job.save(update_fields=['status'])
            return Response({'status': 'stopped'})
        return Response({'detail': 'Job cannot be stopped.'}, status=400)

    @action(detail=True, methods=['post'])
    def retry(self, request, pk=None):
        job = self.get_object()
        if not self._check_permission(job):
            return Response({'detail': 'Permission denied.'}, status=403)
            
        if job.status not in ['stopped', 'failed', 'processing']:
            return Response({'detail': 'Only stopped, failed, or stuck jobs can be retried.'}, status=400)
            
        job.status = 'pending'
        job.processed_rows = 0
        job.save(update_fields=['status', 'processed_rows'])
        
        import threading
        from eis_core.utils.export_engine import run_export_job
        domain_url = request.build_absolute_uri('/')[:-1]
        
        t = threading.Thread(target=run_export_job, args=(job.id, domain_url))
        t.daemon = True
        t.start()
        
        return Response({'status': 'processing', 'detail': 'Job retried successfully'})

class BulkImportErrorViewSet(viewsets.GenericViewSet, mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.DestroyModelMixin):
    queryset = BulkImportError.objects.all()
    serializer_class = BulkImportErrorSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = super().get_queryset()
        job_id = self.request.query_params.get('job_id')
        if job_id:
            qs = qs.filter(job_id=job_id)
        return qs

    @action(detail=False, methods=['post'])
    def retry(self, request):
        """
        Expects payload:
        {
            "job_id": 12,
            "rows": [
                { "id": 1, "raw_data": { "Fuel Type": "Diesel", ... } },
                ...
            ]
        }
        """
        job_id = request.data.get('job_id')
        retry_all = request.data.get('retry_all', False)
        
        from eis_apps.administration.models import BulkImportJob, BulkImportError
        job = BulkImportJob.objects.filter(id=job_id).first()
        if not job:
            return Response({"detail": "Job not found."}, status=404)
            
        if retry_all:
            db_errors = BulkImportError.objects.filter(job_id=job.id)
            rows = [{"id": err.id, "raw_data": err.raw_data} for err in db_errors]
        else:
            rows = request.data.get('rows', [])
            
        # Get the view class string from something like "transport.VehicleRegistration"
        # We need to map it back to the View.
        # Actually, simpler: we can just post this payload back to the original bulk import view!
        # But wait, BulkImportError tracks row index.
        # If we resend to the Bulk Import view, it creates a NEW job.
        
        # A cleaner way: resolve the original model and view.
        from django.apps import apps
        try:
            job_module = job.module_name.split('?')[0]
            app_label, model_name = job_module.split('.')
            model = apps.get_model(app_label, model_name)
        except Exception:
            return Response({"detail": "Invalid module."}, status=400)
            
        # Dynamically import the views_bulk_import for that app
        import importlib
        try:
            views_module = importlib.import_module(f"eis_apps.{app_label}.views_bulk_import")
            # Find the view class that has model == model
            view_class = None
            for attr_name in dir(views_module):
                attr = getattr(views_module, attr_name)
                if isinstance(attr, type) and hasattr(attr, 'model') and getattr(attr, 'model') == model:
                    view_class = attr
                    break
                    
            if not view_class:
                return Response({"detail": "Bulk view not found."}, status=400)
                
            view_instance = view_class()
            
            # Set job status to processing
            job.status = 'processing'
            job.save(update_fields=['status'])
            
            success_ids = []
            total_retry_rows = len(rows)
            
            for idx, row_payload in enumerate(rows):
                err_record = BulkImportError.objects.filter(id=row_payload['id'], job_id=job.id).first()
                if not err_record: continue
                
                new_raw = row_payload.get('raw_data', {})
                
                try:
                    # Mock request
                    class MockRequest:
                        def __init__(self, u): self.user = u
                    data = view_instance.process_row(new_raw, MockRequest(request.user))
                    existing = view_instance.lookup_existing(data)
                    
                    if existing:
                        serializer = view_instance.serializer_class(existing, data=data, partial=True)
                        if serializer.is_valid():
                            serializer.save(updated_by=request.user)
                            success_ids.append(err_record.id)
                        else:
                            err_record.error_message = serializer.errors
                            err_record.save()
                    else:
                        serializer = view_instance.serializer_class(data=data)
                        if serializer.is_valid():
                            serializer.save(created_by=request.user, updated_by=request.user)
                            success_ids.append(err_record.id)
                        else:
                            err_record.error_message = serializer.errors
                            err_record.save()
                            
                except Exception as e:
                    err_record.error_message = {"_error": str(e)}
                    err_record.save()
                    
                # Update progress periodically
                if idx % 10 == 0 or idx == total_retry_rows - 1:
                    job.processed_rows = job.total_rows - (total_retry_rows - idx)
                    job.save(update_fields=['processed_rows'])
                    
            # Delete successful errors
            BulkImportError.objects.filter(id__in=success_ids).delete()
            
            # Update job
            remaining = BulkImportError.objects.filter(job_id=job.id).count()
            job.error_count = remaining
            job.status = 'completed'
            job.save()
            
            return Response({"success": len(success_ids), "remaining": remaining})
            
        except Exception as e:
            return Response({"detail": str(e)}, status=500)


# ─────────────────────────────────────────────────────────────────
# Landing Page Config
# ─────────────────────────────────────────────────────────────────

class LandingPageConfigView(APIView):
    """
    Returns the dynamic configuration for landing page components,
    including registered BlockTypes and LandingPageSections.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        sections = LandingPageSection.objects.all().order_by('order', 'id')
        block_types = BlockType.objects.all().order_by('category', 'label')

        return Response({
            "sections": [
                {
                    "id": sec.id,
                    "name": sec.name,
                    "icon": sec.icon,
                    "desc": sec.desc,
                    "color": sec.color,
                } for sec in sections
            ],
            "block_types": [
                {
                    "id": bt.id,
                    "label": bt.label,
                    "icon": bt.icon,
                    "category": bt.category,
                    "desc": bt.desc,
                    "color": bt.color,
                } for bt in block_types
            ]
        })
