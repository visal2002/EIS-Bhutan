# backend/eis_apps/authentication/middleware.py
from django.utils import timezone


class AuditLogMiddleware:
    """Updates last_seen timestamp on every authenticated request."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        if request.user.is_authenticated:
            try:
                request.user.__class__.objects.filter(pk=request.user.pk).update(
                    last_seen=timezone.now()
                )
            except Exception:
                pass
        return response