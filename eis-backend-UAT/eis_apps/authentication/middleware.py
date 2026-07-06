import json
from django.utils import timezone
from django.shortcuts import redirect
from django.urls import resolve
from django.http import JsonResponse
from .views import log_action
from eis_apps.administration.models import SiteSetting

class AuditLogMiddleware:
    """
    1. Updates last_seen timestamp on every authenticated request.
    2. Logs all mutating (POST, PUT, PATCH, DELETE) actions to AuditLog.
    """

    # Sensitive fields to scrub from metadata
    SENSITIVE_FIELDS = {'password', 'token', 'refresh', 'access', 'secret', 'key'}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # We need the user to be authenticated, so we let downstream middleware work first
        response = self.get_response(request)

        if not request.user.is_authenticated:
            return response

        # 1. Update last_seen
        try:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            User.objects.filter(pk=request.user.pk).update(last_seen=timezone.now())
        except Exception:
            pass

        # 2. Log Mutating Actions (POST, PUT, PATCH, DELETE)
        # Skip GET (too much noise) and OPTIONS
        if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
            # Skip logging for the audit-logs endpoint to avoid recursion
            if '/api/auth/audit-logs/' in request.path:
                return response

            action_map = {
                'POST':   'CREATE',
                'PUT':    'UPDATE_FULL',
                'PATCH':  'UPDATE_PARTIAL',
                'DELETE': 'DELETE'
            }

            # Extract module from path
            path_parts = [p for p in request.path.split('/') if p and p != 'api']
            module = path_parts[1] if len(path_parts) > 1 else (path_parts[0] if path_parts else 'system')
            
            action = f"{module.upper()}_{action_map.get(request.method)}"
            description = f"{request.method} request to {request.path}"
            
            # Prepare metadata (payload + status)
            metadata = {
                'path': request.path,
                'method': request.method,
                'status': response.status_code,
            }

            # Scrub and include payload if JSON
            if request.method != 'DELETE':
                try:
                    if 'application/json' in request.content_type:
                        body = json.loads(request.body)
                        metadata['payload'] = self._scrub_dict(body)
                    elif 'multipart' in request.content_type:
                        metadata['payload'] = "[Multi-part/File Upload]"
                except Exception:
                    metadata['payload'] = "[Payload Unavailable]"

            log_action(
                user=request.user,
                action=action,
                request=request,
                description=description,
                metadata=metadata
            )

        return response

    def _scrub_dict(self, data):
        if not isinstance(data, dict): return data
        scrubbed = {}
        for k, v in data.items():
            if any(s in k.lower() for s in self.SENSITIVE_FIELDS):
                scrubbed[k] = "[REDACTED]"
            elif isinstance(v, dict):
                scrubbed[k] = self._scrub_dict(v)
            elif isinstance(v, list):
                scrubbed[k] = [self._scrub_dict(i) if isinstance(i, dict) else i for i in v]
            else:
                scrubbed[k] = v
        return scrubbed


class SessionTimeoutMiddleware:
    """
    Enforces idle session timeout based on SiteSetting.session_timeout (minutes).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.user.is_authenticated:
            # Check last activity in session
            last_activity = request.session.get('last_activity')
            now = timezone.now().timestamp()
            
            timeout_minutes = SiteSetting.get().session_timeout
            timeout_seconds = timeout_minutes * 60

            if last_activity:
                elapsed = now - last_activity
                if elapsed > timeout_seconds:
                    # Session expired - logout and redirect
                    from django.contrib.auth import logout
                    logout(request)
                    if request.path.startswith('/api/'):
                        return JsonResponse({'error': 'Session timed out.'}, status=401)
                    return redirect('/login?timeout=1')

            # Update last activity
            request.session['last_activity'] = now

        return self.get_response(request)


class MaintenanceModeMiddleware:
    """
    Blocks non-admin access when maintenance mode is ON.
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        setting = SiteSetting.get()
        
        if setting.maintenance_mode:
            # Allow static files and media
            if '/static/' in request.path or '/media/' in request.path:
                return self.get_response(request)

            # Allow System Admins always (to turn it off)
            user = request.user
            if user.is_authenticated:
                is_admin = user.is_superuser or (hasattr(user, 'role') and user.role.role_name == 'ADMIN')
                if is_admin:
                    return self.get_response(request)

            # Allow public maintenance page paths if they exist, but we use the overlay
            # For API, block with 503
            if request.path.startswith('/api/'):
                # Exclude login/site-settings read so frontend can still load branding
                if '/api/auth/login/' in request.path or '/api/admin/site-settings/' in request.path:
                    return self.get_response(request)
                    
                return JsonResponse({
                    'error': 'Maintenance Mode',
                    'message': setting.maintenance_msg
                }, status=503)

        return self.get_response(request)