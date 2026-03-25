# backend/eis_apps/authentication/admin_views.py
from django.contrib.auth import login
from django.shortcuts import redirect
from django.http import JsonResponse
from django.contrib.admin import site
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework_simplejwt.tokens import AccessToken
from .models import User
import json


@method_decorator(csrf_exempt, name="dispatch")
class AdminTokenLoginView(View):
    """
    React frontend calls this after successful JWT login.
    It creates a Django session so /django-admin/ works.

    POST /api/auth/admin-session/
    Body: { "token": "<access_token>" }
    """

    def post(self, request):
        try:
            body      = json.loads(request.body)
            raw_token = body.get("token", "")

            # Validate the JWT
            token   = AccessToken(raw_token)
            user_id = token["user_id"]
            user    = User.objects.get(pk=user_id)

            # Must be staff to access admin
            if not user.is_staff and not user.is_superuser:
                return JsonResponse(
                    {"detail": "You do not have admin access."},
                    status=403
                )

            # Create Django session for admin panel
            login(request, user, backend="django.contrib.auth.backends.ModelBackend")

            return JsonResponse({
                "detail": "Admin session created.",
                "redirect": "/django-admin/",
            })

        except User.DoesNotExist:
            return JsonResponse({"detail": "User not found."}, status=404)
        except Exception as e:
            return JsonResponse({"detail": f"Invalid token: {str(e)}"}, status=400)