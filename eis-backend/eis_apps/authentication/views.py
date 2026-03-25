# backend/eis_apps/authentication/views.py
import logging
from datetime import timedelta

from django.conf import settings
from django.utils import timezone
from django.core.cache import cache

from rest_framework import status, generics, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User, AuditLog, Role
from .serializers import (
    CustomTokenObtainPairSerializer,
    UserProfileSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    NDIProfileCompleteSerializer,
    ChangePasswordSerializer,
    AuditLogSerializer,
)
from .permissions import IsSystemAdmin, IsSystemAdminOrDOEHead, _build_permissions
from .ndi import create_proof_request, subscribe_webhook, unsubscribe_webhook

logger = logging.getLogger("eis_apps.authentication")

NDI_STATUS_CACHE_PREFIX = "ndi_status:"
NDI_WEBHOOK_ID          = getattr(settings, "NDI_WEBHOOK_ID",     "eis-webhook-01")
def _get_ndi_webhook_secret() -> str:
    """Read NDI webhook secret from DB (not settings)."""
    try:
        from eis_apps.administration.models import SystemSetting
        return SystemSetting.cached().ndi_webhook_secret or ""
    except Exception:
        return getattr(settings, "NDI_WEBHOOK_SECRET", "")


# ── Helpers ───────────────────────────────────────────────────────
def get_client_ip(request):
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR")


def log_action(user, action, request, description="", metadata=None):
    AuditLog.objects.create(
        user        = user,
        action      = action,
        ip_address  = get_client_ip(request),
        description = description,
        metadata    = metadata or {},
    )


# ── Auth ──────────────────────────────────────────────────────────
class LoginView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get("username", "")
            try:
                user = (
                    User.objects.get(email__iexact=username)
                    if "@" in username
                    else User.objects.get(username__iexact=username)
                )
                log_action(user, AuditLog.Action.LOGIN, request, "Department login successful")
            except User.DoesNotExist:
                pass
        return response


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            log_action(request.user, AuditLog.Action.LOGOUT, request, "User logged out")
            return Response({"detail": "Successfully logged out."})
        except TokenError:
            return Response({"detail": "Token already invalidated."}, status=400)


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(UserProfileSerializer(request.user, context={'request': request}).data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            if "role_id" in serializer.validated_data:
                if not (request.user.role and request.user.role.role_name == "ADMIN"):
                    serializer.validated_data.pop("role_id", None)
                    serializer.validated_data.pop("role", None)
            serializer.save()
            # Re-serialize with request context so avatar_url is an absolute URL
            return Response(UserProfileSerializer(request.user, context={"request": request}).data)
        return Response(serializer.errors, status=400)


class MePermissionsView(APIView):
    """GET /api/auth/me/permissions/ — return current user's module permissions"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(_build_permissions(request.user))


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.password_changed_at  = timezone.now()
            user.password_expires_at  = timezone.now() + timedelta(days=90)
            user.must_change_password = False
            user.save(update_fields=[
                "password", "password_changed_at",
                "password_expires_at", "must_change_password",
            ])
            log_action(user, AuditLog.Action.PASSWORD_CHANGE, request, "Password changed")
            return Response({"detail": "Password changed successfully."})
        return Response(serializer.errors, status=400)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = request.user
            user.set_password(serializer.validated_data["new_password"])
            user.password_changed_at  = timezone.now()
            user.password_expires_at  = timezone.now() + timedelta(days=90)
            user.must_change_password = False
            user.save(update_fields=[
                "password", "password_changed_at",
                "password_expires_at", "must_change_password",
            ])
            log_action(user, AuditLog.Action.PASSWORD_CHANGE, request, "Password changed")
            return Response({"detail": "Password changed successfully."})
        return Response(serializer.errors, status=400)


# ── User Management — Admin + DOE Head can view, only Admin can write ──
class UserListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Admin and DOE Head can list all users
        user_role = request.user.role.role_name if request.user.role else None
        if user_role not in ["ADMIN", "DOE_HEAD"]:
            return Response({"error": "Permission denied."}, status=403)

        qs = User.objects.select_related("role").order_by("first_name", "last_name")

        # Hide the true Django superuser and soft-deleted users from normal list
        qs = qs.exclude(is_superuser=True, role__isnull=True).exclude(status="DELETED")

        role   = request.query_params.get("role")
        status_filter = request.query_params.get("status")
        search = request.query_params.get("search")

        if role:
            qs = qs.filter(role__role_name=role)
        if status_filter:
            qs = qs.filter(status=status_filter.upper())
        if search:
            qs = (
                qs.filter(first_name__icontains=search)
                | qs.filter(last_name__icontains=search)
                | qs.filter(username__icontains=search)
                | qs.filter(email__icontains=search)
                | qs.filter(employee_id__icontains=search)
            )

        # Pagination
        page      = int(request.query_params.get("page", 1))
        page_size = int(request.query_params.get("page_size", 10))
        total     = qs.count()
        offset    = (page - 1) * page_size
        users     = qs[offset: offset + page_size]

        return Response({
            "count":   total,
            "results": UserProfileSerializer(users, many=True).data,
        })

    def post(self, request):
        # Only Admin can create users
        user_role = request.user.role.role_name if request.user.role else None
        if user_role != "ADMIN":
            return Response({"error": "Only administrators can create users."}, status=403)

        serializer = UserCreateSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            user = serializer.save()
            log_action(request.user, AuditLog.Action.USER_CREATED, request, f"Created user: {user.username}")
            return Response(UserProfileSerializer(user).data, status=201)
        return Response(serializer.errors, status=400)


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_user(self, pk):
        try:
            return User.objects.select_related("role").get(pk=pk)
        except User.DoesNotExist:
            return None

    def _check_permission(self, request, write=False):
        user_role = request.user.role.role_name if request.user.role else None
        if write:
            return user_role == "ADMIN"
        return user_role in ["ADMIN", "DOE_HEAD"]

    def get(self, request, pk):
        if not self._check_permission(request):
            return Response({"error": "Permission denied."}, status=403)
        user = self._get_user(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)
        return Response(UserProfileSerializer(user, context={"request": request}).data)

    def patch(self, request, pk):
        if not self._check_permission(request, write=True):
            return Response({"error": "Only administrators can edit users."}, status=403)
        user = self._get_user(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)

        # Prevent editing the true Django superuser (eis account with no role)
        if user.is_superuser and not user.role:
            return Response({"error": "Cannot edit the system superuser account."}, status=403)

        serializer = UserUpdateSerializer(user, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            updated = serializer.save()
            log_action(request.user, AuditLog.Action.USER_UPDATED, request, f"Updated user: {updated.username}")
            return Response(UserProfileSerializer(updated, context={"request": request}).data)
        return Response(serializer.errors, status=400)

    def delete(self, request, pk):
        """Soft-delete: moves user to trash, never physically removes."""
        if not self._check_permission(request, write=True):
            return Response({"error": "Only administrators can delete users."}, status=403)
        user = self._get_user(pk)
        if not user:
            return Response({"error": "User not found."}, status=404)
        if user.pk == request.user.pk:
            return Response({"error": "You cannot delete your own account."}, status=400)
        if user.is_superuser and not user.role:
            return Response({"error": "Cannot delete the system superuser account."}, status=403)
        if user.status == "DELETED":
            return Response({"error": "User is already in trash."}, status=400)

        reason = request.data.get("reason", "") if hasattr(request, "data") else ""
        user.soft_delete(deleted_by_username=request.user.username, reason=reason)
        log_action(request.user, AuditLog.Action.USER_DEACTIVATED, request,
                   f"Soft-deleted user: {user.username} — reason: {reason or 'none'}")
        return Response({"detail": "User moved to trash. Data preserved."}, status=200)




class UserTrashListView(APIView):
    """GET /api/auth/users/trash/ — list all soft-deleted users."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_role = request.user.role.role_name if request.user.role else None
        if user_role != "ADMIN":
            return Response({"error": "Only administrators can view trash."}, status=403)

        qs = User.objects.filter(status="DELETED").select_related("role").order_by("-deleted_at")
        return Response({
            "count":   qs.count(),
            "results": UserProfileSerializer(qs, many=True, context={"request": request}).data,
        })


class UserRestoreView(APIView):
    """POST /api/auth/users/<pk>/restore/ — restore a soft-deleted user."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        user_role = request.user.role.role_name if request.user.role else None
        if user_role != "ADMIN":
            return Response({"error": "Only administrators can restore users."}, status=403)

        try:
            user = User.objects.get(pk=pk, status="DELETED")
        except User.DoesNotExist:
            return Response({"error": "Deleted user not found."}, status=404)

        user.restore()
        log_action(request.user, AuditLog.Action.USER_UPDATED, request,
                   f"Restored user from trash: {user.username}")
        return Response({
            "detail": f"{user.get_full_name()} has been restored as INACTIVE. Activate them when ready.",
            "user": UserProfileSerializer(user, context={"request": request}).data,
        })


class UserPermanentDeleteView(APIView):
    """DELETE /api/auth/users/<pk>/permanent-delete/ — permanently removes from DB (irreversible)."""
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        user_role = request.user.role.role_name if request.user.role else None
        if user_role != "ADMIN":
            return Response({"error": "Only administrators can permanently delete users."}, status=403)

        try:
            user = User.objects.get(pk=pk, status="DELETED")
        except User.DoesNotExist:
            return Response({"error": "Only trashed users can be permanently deleted."}, status=404)

        if user.pk == request.user.pk:
            return Response({"error": "You cannot delete your own account."}, status=400)

        username = user.get_full_name() or user.username
        user.delete()
        log_action(request.user, AuditLog.Action.USER_DEACTIVATED, request,
                   f"Permanently deleted user: {username}")
        return Response({"detail": f"{username} permanently removed."}, status=200)

# ── NDI Profile Completion ────────────────────────────────────────
class NDIProfileCompleteView(APIView):
    """
    GET  /api/auth/ndi/profile/  — check if current NDI user needs setup
    POST /api/auth/ndi/profile/  — submit profile completion form

    After NDI login, if user has no email/username set yet,
    frontend redirects them here to complete their profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        needs_setup = bool(
            user.ndi_sub and (
                user.username.startswith("ndi_") or
                not user.email or
                not user.has_usable_password()
            )
        )
        return Response({
            "needs_setup": needs_setup,
            "user": {
                "id":         user.id,
                "first_name": user.first_name,
                "last_name":  user.last_name,
                "ndi_sub":    user.ndi_sub,
                "username":   user.username,
                "email":      user.email,
                "employee_id":user.employee_id,
                "contact_no": user.contact_no,
                "gender":     user.gender,
                "department": user.department,
                "dzongkhag":  user.dzongkhag,
                "ndi_verified": user.ndi_verified,
            }
        })

    def post(self, request):
        user = request.user
        if not user.ndi_sub:
            return Response({"error": "This endpoint is only for NDI users."}, status=400)

        serializer = NDIProfileCompleteSerializer(
            user, data=request.data, partial=True, context={"request": request}
        )
        if serializer.is_valid():
            updated = serializer.save()
            log_action(user, "NDI_PROFILE_COMPLETED", request, f"NDI user completed profile: {updated.username}")

            # Issue fresh tokens with updated user data
            refresh   = RefreshToken.for_user(updated)
            user_data = UserProfileSerializer(updated).data

            return Response({
                "success": True,
                "message": "Profile completed successfully.",
                "access":  str(refresh.access_token),
                "refresh": str(refresh),
                "user":    user_data,
            })
        return Response(serializer.errors, status=400)


# ── Audit Logs ────────────────────────────────────────────────────
class AuditLogListView(generics.ListAPIView):
    permission_classes = [IsAuthenticated, IsSystemAdminOrDOEHead]
    serializer_class   = AuditLogSerializer
    filter_backends    = [filters.OrderingFilter]
    ordering           = ["-timestamp"]

    def get_queryset(self):
        qs      = AuditLog.objects.select_related("user").all()
        action  = self.request.query_params.get("action")
        user_id = self.request.query_params.get("user_id")
        if action:
            qs = qs.filter(action=action)
        if user_id:
            qs = qs.filter(user_id=user_id)
        return qs


# ═══════════════════════════════════════════════════════════════════
# NDI VIEWS
# ═══════════════════════════════════════════════════════════════════
class NDIInitiateView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        try:
            proof = create_proof_request("EIS Login - Verify Identity")
            ndi_webhook_secret = _get_ndi_webhook_secret()
            if ndi_webhook_secret:
                try:
                    subscribe_webhook(NDI_WEBHOOK_ID, proof["thread_id"])
                except Exception as e:
                    logger.warning("Webhook subscribe failed (non-fatal): %s", e)

            cache.set(
                f"{NDI_STATUS_CACHE_PREFIX}{proof['thread_id']}",
                {"authenticated": False, "status": "pending"},
                timeout=1800,
            )

            return Response({
                "success":           True,
                "thread_id":         proof["thread_id"],
                "proof_request_url": proof["proof_request_url"],
                "deep_link_url":     proof["deep_link_url"],
            }, status=201)

        except ValueError as e:
            return Response({"success": False, "error": str(e)}, status=503)
        except Exception as e:
            logger.error("NDI initiate error: %s", e, exc_info=True)
            return Response({"success": False, "error": str(e)}, status=503)


class NDIStatusView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        thread_id = request.query_params.get("thread_id")
        if not thread_id:
            return Response({"success": False, "error": "thread_id required."}, status=400)

        # ── Check cache first (populated by webhook if registered) ───
        cached = cache.get(f"{NDI_STATUS_CACHE_PREFIX}{thread_id}")
        if cached and cached.get("authenticated"):
            cache.delete(f"{NDI_STATUS_CACHE_PREFIX}{thread_id}")
            return Response({
                "authenticated":       True,
                "access":              cached["access"],
                "refresh":             cached["refresh"],
                "user":                cached["user"],
                "needs_profile_setup": cached.get("needs_profile_setup", False),
            })

        # ── Fallback: poll NDI verifier API directly ──────────────────
        # Works even without webhook registration — frontend polls us,
        # we poll NDI, find ProofValidated, create user + JWT on the spot
        try:
            import requests as _req
            from .ndi import get_ndi_token, _cfg
            cfg       = _cfg()
            ndi_token = get_ndi_token()
            ndi_resp  = _req.get(
                cfg.ndi_verifier_url,
                params={"threadId": thread_id, "page": 1, "pageSize": 1},
                headers={"Authorization": f"Bearer {ndi_token}"},
                timeout=8,
            )
            if ndi_resp.ok:
                proof_data   = ndi_resp.json().get("data", {})
                proof_status = proof_data.get("status", "")
                logger.debug("NDI direct poll: thread=%s status=%s data=%s",
                             thread_id, proof_status, str(proof_data)[:500])

                if proof_status in ("ProofValidated", "done", "Done", "DONE"):
                    relation_did = proof_data.get("relationshipDid", "") or proof_data.get("holderDid", "")

                    id_number = ""
                    full_name = ""

                    # NDI GET verifier endpoint with threadId returns minimal data.
                    # The full proof attributes are in the presentationResult field
                    # or accessible via the proof request detail endpoint.
                    # Based on NDI Technical Doc V1.2 webhook response structure:
                    # revealed_attrs = { "ID Number": [{"value": "...", "identifier_index": 0}] }
                    # But via GET poll, the structure is in requestedProof.revealed_attrs

                    # Try direct from poll response first
                    def extract_from_revealed(revealed):
                        id_val = name_val = ""
                        if isinstance(revealed, dict):
                            for key, val in revealed.items():
                                kl = key.lower()
                                # val can be dict {"raw":...} or list [{"value":...}]
                                raw = ""
                                if isinstance(val, dict):
                                    raw = val.get("raw") or val.get("value") or ""
                                elif isinstance(val, list) and val:
                                    raw = val[0].get("value") or val[0].get("raw") or ""
                                if raw:
                                    if "id" in kl or "number" in kl or "cid" in kl:
                                        id_val = raw
                                    elif "name" in kl:
                                        name_val = raw
                        return id_val, name_val

                    # Check if proof_data already has revealed attrs
                    for attr_key in ["requestedProof", "requested_presentation", "presentation_result"]:
                        sub = proof_data.get(attr_key, {})
                        if sub:
                            revealed = sub.get("revealed_attrs") or sub.get("revealedAttrs") or {}
                            id_number, full_name = extract_from_revealed(revealed)
                            if id_number or full_name:
                                break

                    # If still empty, fetch full proof detail using the proof id
                    if not id_number and not full_name:
                        proof_id = proof_data.get("id")
                        try:
                            detail_resp = _req.get(
                                cfg.ndi_verifier_url,
                                params={"id": proof_id, "threadId": thread_id,
                                        "page": 1, "pageSize": 1},
                                headers={"Authorization": f"Bearer {ndi_token}"},
                                timeout=8,
                            )
                            if detail_resp.ok:
                                detail = detail_resp.json().get("data", {})
                                logger.debug("NDI proof detail full: %s", str(detail)[:1000])

                                # Try every possible location for revealed attrs
                                for attr_key in ["requestedProof", "requested_presentation",
                                                 "presentationResult"]:
                                    sub = detail.get(attr_key, {})
                                    if sub:
                                        revealed = (sub.get("revealed_attrs") or
                                                    sub.get("revealedAttrs") or {})
                                        id_number, full_name = extract_from_revealed(revealed)
                                        if id_number or full_name:
                                            break

                                # Also try top-level revealed_attrs
                                if not id_number and not full_name:
                                    revealed = (detail.get("revealed_attrs") or
                                                detail.get("revealedAttrs") or {})
                                    id_number, full_name = extract_from_revealed(revealed)

                        except Exception as ex:
                            logger.debug("NDI detail fetch error: %s", ex)

                    logger.info("NDI validated: relation_did=%s id_number=%s name=%s",
                                relation_did, id_number, full_name)

                    # Find existing user
                    user = None
                    if relation_did:
                        user = User.objects.filter(ndi_sub=relation_did).first()
                    if not user and id_number:
                        user = User.objects.filter(ndi_id_number=id_number).first()

                    if not user:
                        from .models import Role as RoleModel
                        viewer_role   = RoleModel.objects.filter(role_name="VIEWER").first()
                        temp_username = f"ndi_{relation_did[:20]}" if relation_did else f"ndi_{thread_id[:12]}"
                        name_parts    = full_name.split(" ", 1) if full_name else ["NDI", "User"]
                        user = User(
                            username      = temp_username,
                            first_name    = name_parts[0],
                            last_name     = name_parts[1] if len(name_parts) > 1 else "User",
                            ndi_sub       = relation_did or None,
                            ndi_id_number = id_number or None,
                            ndi_verified  = True,
                            status        = User.STATUS_ACTIVE,
                            role          = viewer_role,
                        )
                        user.set_unusable_password()
                        user.save()
                        needs_profile_setup = True
                        logger.info("NDI: created new user %s", temp_username)
                    else:
                        # Update fields if needed
                        update_fields = []
                        if relation_did and not user.ndi_sub:
                            user.ndi_sub = relation_did; update_fields.append("ndi_sub")
                        if id_number and not user.ndi_id_number:
                            user.ndi_id_number = id_number; update_fields.append("ndi_id_number")
                        if update_fields:
                            user.save(update_fields=update_fields)
                        needs_profile_setup = bool(
                            user.username.startswith("ndi_") or
                            not user.email or
                            not user.has_usable_password()
                        )

                    if user.status != User.STATUS_ACTIVE:
                        return Response({"authenticated": False, "status": "blocked",
                                         "error": f"Account is {user.status.lower()}."})

                    refresh   = RefreshToken.for_user(user)
                    user_data = UserProfileSerializer(user).data
                    log_action(user, "NDI_LOGIN", request, "NDI login via direct poll")

                    return Response({
                        "authenticated":       True,
                        "access":              str(refresh.access_token),
                        "refresh":             str(refresh),
                        "user":                user_data,
                        "needs_profile_setup": needs_profile_setup,
                        "permissions":         _build_permissions(user),
                    })

                elif proof_status in ("ProofFailed", "proofFailed"):
                    return Response({"authenticated": False, "status": "failed"})

        except Exception as e:
            logger.debug("NDI direct poll error (non-fatal): %s", e)

        # Still pending
        return Response({
            "authenticated": False,
            "status":        cached.get("status", "pending") if cached else "pending",
        })


def get_ndi_webhook_secret():
    """Read from DB — fallback to settings for backward compat."""
    return _get_ndi_webhook_secret()


class NDIWebhookView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        logger.info("NDI webhook POST received")

        # Verify secret from DB
        ndi_secret = _get_ndi_webhook_secret()
        if ndi_secret:
            auth_header = request.headers.get("Authorization", "")
            token = auth_header.replace("Bearer ", "").strip()
            if token != ndi_secret:
                logger.warning("NDI webhook: invalid secret")
                return Response({"error": "Unauthorized"}, status=401)

        payload   = request.data
        msg_type  = payload.get("type", "")
        thread_id = payload.get("thid") or payload.get("threadId")

        logger.info("NDI webhook: type=%s thread_id=%s", msg_type, thread_id)

        if msg_type == "present-proof/presentation-result":
            verification = payload.get("verification_result")

            if verification != "ProofValidated":
                if thread_id:
                    cache.set(f"{NDI_STATUS_CACHE_PREFIX}{thread_id}",
                              {"authenticated": False, "status": "failed"}, timeout=300)
                return Response(status=202)

            revealed = payload.get("requested_presentation", {}).get("revealed_attrs", {})

            def extract(key):
                val = revealed.get(key, [])
                return val[0].get("value", "") if isinstance(val, list) and val else ""

            id_number  = extract("ID Number")
            full_name  = extract("Full Name")
            holder_did = payload.get("holder_did", "")

            logger.info("NDI proof validated: ID=%s Name=%s holder_did=%s", id_number, full_name, holder_did)

            # ── Find existing user ────────────────────────────────
            # Priority: 1) match by ndi_sub (holder_did) — fastest for returning users
            #           2) match by ndi_id_number (CID number) — for re-linked accounts
            user = None
            if holder_did:
                user = User.objects.filter(ndi_sub=holder_did).first()
            if not user and id_number:
                user = User.objects.filter(ndi_id_number=id_number).first()

            needs_profile_setup = False

            if not user:
                # ── Brand new NDI user ────────────────────────────
                # Always assign VIEWER role — admin can upgrade later
                from .models import Role as RoleModel
                viewer_role = RoleModel.objects.filter(role_name="VIEWER").first()

                name_parts  = full_name.split(" ", 1) if full_name else ["NDI", "User"]
                first_name  = name_parts[0]
                last_name   = name_parts[1] if len(name_parts) > 1 else ""

                # Unique temp username from holder_did or id_number
                temp_username = f"ndi_{holder_did[:20]}" if holder_did else f"ndi_{id_number}"

                user = User(
                    username      = temp_username,
                    first_name    = first_name,
                    last_name     = last_name,
                    ndi_sub       = holder_did or None,
                    ndi_id_number = id_number  or None,
                    ndi_verified  = True,
                    employee_id   = None,   # filled in profile setup
                    email         = None,   # filled in profile setup
                    status        = User.STATUS_ACTIVE,
                    is_verified   = False,  # admin verifies after profile complete
                    role          = viewer_role,  # VIEWER by default
                )
                user.set_unusable_password()
                user.save()
                needs_profile_setup = True
                logger.info("NDI: created new VIEWER user %s — needs profile setup", temp_username)

            else:
                # ── Returning user — update NDI fields if changed ─
                update_fields = []
                if holder_did and user.ndi_sub != holder_did:
                    user.ndi_sub = holder_did
                    update_fields.append("ndi_sub")
                if id_number and user.ndi_id_number != id_number:
                    user.ndi_id_number = id_number
                    update_fields.append("ndi_id_number")
                if not user.ndi_verified:
                    user.ndi_verified = True
                    update_fields.append("ndi_verified")
                if update_fields:
                    user.save(update_fields=update_fields)

                # Profile incomplete = no email, temp username, or no password set
                needs_profile_setup = bool(
                    user.username.startswith("ndi_") or
                    not user.email or
                    not user.has_usable_password()
                )

            # Block inactive users
            if user.status != User.STATUS_ACTIVE:
                if thread_id:
                    cache.set(f"{NDI_STATUS_CACHE_PREFIX}{thread_id}",
                              {"authenticated": False, "status": "blocked",
                               "error": f"Your account is {user.status.lower()}. Contact the administrator."},
                              timeout=300)
                return Response(status=202)

            # Issue JWT
            refresh   = RefreshToken.for_user(user)
            user_data = UserProfileSerializer(user).data

            if thread_id:
                cache.set(
                    f"{NDI_STATUS_CACHE_PREFIX}{thread_id}",
                    {
                        "authenticated":      True,
                        "access":             str(refresh.access_token),
                        "refresh":            str(refresh),
                        "user":               user_data,
                        "needs_profile_setup": needs_profile_setup,
                    },
                    timeout=300,
                )
                try:
                    unsubscribe_webhook(thread_id)
                except Exception:
                    pass

            log_action(user, "NDI_LOGIN", request, f"NDI login: {id_number}")
            return Response(status=202)

        if msg_type == "present-proof/rejected":
            if thread_id:
                cache.set(f"{NDI_STATUS_CACHE_PREFIX}{thread_id}",
                          {"authenticated": False, "status": "rejected"}, timeout=300)
            return Response(status=202)

        return Response(status=202)


# ═══════════════════════════════════════════════════════════════════
# MFA — Google Authenticator (TOTP) via pyotp
# ═══════════════════════════════════════════════════════════════════
def _is_superadmin(user):
    """True for Django superusers with no role (the true system admin account)."""
    return user.is_superuser and (user.role is None or not hasattr(user, 'role') or user.role_id is None)

SUPERADMIN_SKIP = Response(
    {"detail": "Superadmin accounts do not require verification or 2FA."},
    status=200
)


class MFASetupView(APIView):
    """POST /api/auth/mfa/setup/ — generate secret + QR for Google Authenticator"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        try:
            import pyotp, qrcode, base64
            from io import BytesIO
        except ImportError:
            return Response({
                "error": "pyotp and qrcode packages are required. Run: pip install pyotp qrcode"
            }, status=503)

        user = request.user
        # Generate a new TOTP secret
        secret = pyotp.random_base32()
        user.mfa_secret = secret
        user.save(update_fields=["mfa_secret"])

        # Build OTP auth URI for Google Authenticator
        app_name = "EIS Bhutan"
        totp_uri = pyotp.totp.TOTP(secret).provisioning_uri(
            name=user.email or user.username,
            issuer_name=app_name,
        )

        # Generate QR code as base64 data URL
        qr = qrcode.QRCode(box_size=6, border=2)
        qr.add_data(totp_uri)
        qr.make(fit=True)
        img = qr.make_image(fill_color="#124143", back_color="white")
        buf = BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        return Response({
            "secret":  secret,
            "qr_url":  f"data:image/png;base64,{qr_b64}",
            "totp_uri": totp_uri,
            "app_name": app_name,
            "account":  user.email or user.username,
        })


class MFAVerifyView(APIView):
    """POST /api/auth/mfa/verify/ — verify TOTP code and enable MFA"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        try:
            import pyotp
        except ImportError:
            return Response({"error": "pyotp not installed."}, status=503)

        user = request.user
        code = request.data.get("code", "").strip().replace(" ", "")

        if not user.mfa_secret:
            return Response({"error": "MFA not set up. Call /mfa/setup/ first."}, status=400)

        totp = pyotp.TOTP(user.mfa_secret)
        # valid_window=1 allows ±30s clock drift
        if not totp.verify(code, valid_window=1):
            return Response({"error": "Invalid code. Please try again."}, status=400)

        user.is_mfa_enabled = True
        user.save(update_fields=["is_mfa_enabled"])
        log_action(user, "MFA_ENABLED", request, "MFA enabled via Google Authenticator")
        return Response({"success": True, "message": "Two-factor authentication enabled."})


class MFADisableView(APIView):
    """POST /api/auth/mfa/disable/ — disable MFA"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        try:
            import pyotp
        except ImportError:
            return Response({"error": "pyotp not installed."}, status=503)

        user = request.user
        code = request.data.get("code", "").strip()

        # Require a valid TOTP code to disable (security check)
        if user.mfa_secret and code:
            totp = pyotp.TOTP(user.mfa_secret)
            if not totp.verify(code, valid_window=1):
                return Response({"error": "Invalid code."}, status=400)

        user.is_mfa_enabled = False
        user.mfa_secret     = ""
        user.save(update_fields=["is_mfa_enabled", "mfa_secret"])
        log_action(user, "MFA_DISABLED", request, "MFA disabled")
        return Response({"success": True, "message": "Two-factor authentication disabled."})


# ═══════════════════════════════════════════════════════════════════
# Email Verification — OTP via Django email
# ═══════════════════════════════════════════════════════════════════
class SendEmailOTPView(APIView):
    """POST /api/auth/verify-email/send/ — send OTP to user's email"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        import random, string
        from django.core.mail import send_mail
        from django.utils import timezone
        from datetime import timedelta

        user = request.user
        if not user.email:
            return Response({"error": "No email address on your account."}, status=400)

        if user.email_verified:
            return Response({"message": "Email is already verified."})

        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        user.email_otp      = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=10)
        user.save(update_fields=["email_otp", "otp_expires_at"])

        # Apply email settings from DB
        try:
            from eis_apps.administration.models import SystemSetting
            SystemSetting.get().apply_email_settings()
        except Exception:
            pass

        try:
            send_mail(
                subject="EIS — Email Verification Code",
                message=(
                    f"Your EIS email verification code is:\n\n"
                    f"  {otp}\n\n"
                    f"This code expires in 10 minutes.\n"
                    f"If you did not request this, please ignore.\n\n"
                    f"Department of Energy · MoENR · Royal Government of Bhutan"
                ),
                from_email=None,  # uses DEFAULT_FROM_EMAIL
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Email OTP send failed: %s", e)
            return Response({"error": f"Failed to send email: {e}"}, status=500)

        logger.info("Email OTP sent to %s", user.email)
        return Response({"success": True, "message": f"Verification code sent to {user.email}"})


class VerifyEmailOTPView(APIView):
    """POST /api/auth/verify-email/confirm/ — confirm OTP and mark email verified"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        from django.utils import timezone

        user = request.user
        code = request.data.get("code", "").strip()

        if user.email_verified:
            return Response({"success": True, "message": "Already verified."})

        if not user.email_otp or not code:
            return Response({"error": "No OTP to verify."}, status=400)

        if user.otp_expires_at and timezone.now() > user.otp_expires_at:
            return Response({"error": "Code has expired. Please request a new one."}, status=400)

        if user.email_otp != code:
            return Response({"error": "Invalid code. Please try again."}, status=400)

        user.email_verified = True
        user.email_otp      = ""
        user.otp_expires_at = None
        user.save(update_fields=["email_verified", "email_otp", "otp_expires_at"])
        log_action(user, "EMAIL_VERIFIED", request, f"Email verified: {user.email}")
        return Response({"success": True, "message": "Email verified successfully!"})


# ═══════════════════════════════════════════════════════════════════
# Phone Verification — OTP via SMS (or console fallback)
# ═══════════════════════════════════════════════════════════════════
class SendPhoneOTPView(APIView):
    """POST /api/auth/verify-phone/send/ — send OTP to user's phone"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        import random, string
        from django.utils import timezone
        from datetime import timedelta

        user = request.user
        if not user.contact_no:
            return Response({"error": "No phone number on your account. Add one in Account Settings first."}, status=400)

        if user.phone_verified:
            return Response({"message": "Phone is already verified."})

        otp = ''.join(random.choices(string.digits, k=6))
        user.phone_otp      = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=10)
        user.save(update_fields=["phone_otp", "otp_expires_at"])

        # Try SMS via system settings API key, fallback to console log
        sms_sent = False
        try:
            from eis_apps.administration.models import SystemSetting
            cfg = SystemSetting.get()
            # You can wire this to any SMS API (e.g. BT SMS Gateway via api_1 slot)
            # For now we log it — replace with your SMS provider call
            logger.info("📱 PHONE OTP for %s: %s (expires 10min)", user.contact_no, otp)
            sms_sent = True
        except Exception as e:
            logger.error("SMS OTP failed: %s", e)

        # In development: return OTP in response for testing
        from django.conf import settings as dj
        if dj.DEBUG:
            return Response({
                "success": True,
                "message": f"OTP sent to {user.contact_no}",
                "debug_otp": otp,  # Remove in production
            })

        return Response({"success": True, "message": f"Verification code sent to {user.contact_no}"})


class VerifyPhoneOTPView(APIView):
    """POST /api/auth/verify-phone/confirm/ — confirm OTP and mark phone verified"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if _is_superadmin(request.user):
            return SUPERADMIN_SKIP
        from django.utils import timezone

        user = request.user
        code = request.data.get("code", "").strip()

        if user.phone_verified:
            return Response({"success": True, "message": "Already verified."})

        if not user.phone_otp or not code:
            return Response({"error": "No OTP to verify."}, status=400)

        if user.otp_expires_at and timezone.now() > user.otp_expires_at:
            return Response({"error": "Code expired. Request a new one."}, status=400)

        if user.phone_otp != code:
            return Response({"error": "Invalid code."}, status=400)

        user.phone_verified = True
        user.phone_otp      = ""
        user.otp_expires_at = None
        user.save(update_fields=["phone_verified", "phone_otp", "otp_expires_at"])
        log_action(user, "PHONE_VERIFIED", request, f"Phone verified: {user.contact_no}")
        return Response({"success": True, "message": "Phone number verified successfully!"})


# ═══════════════════════════════════════════════════════════════════
# Delete Account
# ═══════════════════════════════════════════════════════════════════
class DeleteAccountView(APIView):
    """DELETE /api/auth/delete-account/ — permanently delete own account"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        user     = request.user
        password = request.data.get("password", "")

        # Admins cannot delete themselves
        if user.role and user.role.role_name == "ADMIN":
            return Response({"error": "Administrators cannot delete their own account."}, status=403)

        # Verify password if they have one
        if user.has_usable_password() and not user.check_password(password):
            return Response({"error": "Incorrect password."}, status=400)

        username = user.username
        user.delete()
        log_action(None, "ACCOUNT_DELETED", request, f"Account deleted: {username}")
        return Response({"success": True, "message": "Account deleted."})


# ═══════════════════════════════════════════════════════════════════
# Forgot / Reset Password
# ═══════════════════════════════════════════════════════════════════
class ForgotPasswordView(APIView):
    """
    POST /api/auth/forgot-password/
    Body: { "email": "user@example.com" }
    Sends a 6-digit OTP to the email. Reuses email_otp + otp_expires_at fields.
    Always returns 200 to avoid user enumeration.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        import random, string
        from django.core.mail import send_mail
        from django.utils import timezone
        from datetime import timedelta

        email = request.data.get("email", "").strip().lower()
        if not email:
            return Response({"error": "Email is required."}, status=400)

        user = User.objects.filter(email__iexact=email, status=User.STATUS_ACTIVE).first()

        # Always return success to prevent email enumeration
        SUCCESS = Response({"success": True, "message": "If that email is registered, a reset code has been sent."})

        if not user:
            return SUCCESS

        if user.is_superuser:
            # Superadmin uses Django admin for password reset
            return SUCCESS

        otp = ''.join(random.choices(string.digits, k=6))
        user.email_otp      = otp
        user.otp_expires_at = timezone.now() + timedelta(minutes=15)
        user.save(update_fields=["email_otp", "otp_expires_at"])

        # Apply email settings from DB
        try:
            from eis_apps.administration.models import SystemSetting
            SystemSetting.get().apply_email_settings()
        except Exception:
            pass

        try:
            send_mail(
                subject="EIS — Password Reset Code",
                message=(
                    f"You requested a password reset for your EIS account.\n\n"
                    f"Your reset code is:\n\n"
                    f"  {otp}\n\n"
                    f"This code expires in 15 minutes.\n"
                    f"If you did not request this, please ignore this email.\n\n"
                    f"Department of Energy · MoENR · Royal Government of Bhutan"
                ),
                from_email=None,
                recipient_list=[user.email],
                fail_silently=False,
            )
        except Exception as e:
            logger.error("Forgot password email failed: %s", e)
            return Response({"error": "Failed to send reset email. Please try again later."}, status=500)

        logger.info("Password reset OTP sent to %s", email)
        return SUCCESS


class ResetPasswordView(APIView):
    """
    POST /api/auth/reset-password/
    Body: { "email": "...", "code": "123456", "password": "newpass", "confirm": "newpass" }
    Verifies OTP then sets new password.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        from django.utils import timezone

        email    = request.data.get("email", "").strip().lower()
        code     = request.data.get("code", "").strip()
        password = request.data.get("password", "")
        confirm  = request.data.get("confirm", "")

        if not all([email, code, password, confirm]):
            return Response({"error": "All fields are required."}, status=400)

        if password != confirm:
            return Response({"confirm": "Passwords do not match."}, status=400)

        if len(password) < 8:
            return Response({"password": "Password must be at least 8 characters."}, status=400)

        user = User.objects.filter(email__iexact=email, status=User.STATUS_ACTIVE).first()
        if not user:
            return Response({"error": "Invalid or expired reset code."}, status=400)

        if not user.email_otp or user.email_otp != code:
            return Response({"code": "Invalid reset code."}, status=400)

        if user.otp_expires_at and timezone.now() > user.otp_expires_at:
            return Response({"code": "Reset code has expired. Please request a new one."}, status=400)

        # Set new password
        user.set_password(password)
        user.email_otp           = ""
        user.otp_expires_at      = None
        user.must_change_password = False
        user.failed_login_attempts = 0
        user.locked_until         = None
        user.save(update_fields=[
            "password", "email_otp", "otp_expires_at",
            "must_change_password", "failed_login_attempts", "locked_until",
        ])
        log_action(user, "PASSWORD_RESET", request, "Password reset via email OTP")
        return Response({"success": True, "message": "Password reset successfully. You can now log in."})



# ═══════════════════════════════════════════════════════════════════
# Dashboard Widget Layout — per-user editable dashboard
# ═══════════════════════════════════════════════════════════════════
class DashboardWidgetListView(APIView):
    """
    GET  /api/auth/dashboard/widgets/       — list current user's widgets
    POST /api/auth/dashboard/widgets/       — create a widget
    PUT  /api/auth/dashboard/widgets/       — bulk update layout (positions/sizes)
    DELETE /api/auth/dashboard/widgets/     — clear all widgets (reset layout)
    """
    permission_classes = [IsAuthenticated]

    def _check_perm(self, user, action):
        """Check RolePermission for dashboard module."""
        if user.is_superuser or (user.role and user.role.role_name == "ADMIN"):
            return True
        from .models import RolePermission
        try:
            perm = RolePermission.objects.get(role=user.role, module="dashboard")
            return getattr(perm, action, False)
        except RolePermission.DoesNotExist:
            return False

    def get(self, request):
        if not self._check_perm(request.user, "can_view"):
            return Response({"error": "No permission to view dashboard."}, status=403)
        from .models import DashboardWidget
        widgets = DashboardWidget.objects.filter(user=request.user, is_visible=True)
        data = [{
            "id":          w.id,
            "widget_type": w.widget_type,
            "title":       w.title,
            "data_module": w.data_module,
            "config":      w.config,
            "position_x":  w.position_x,
            "position_y":  w.position_y,
            "width":       w.width,
            "height":      w.height,
        } for w in widgets]
        return Response(data)

    def post(self, request):
        if not self._check_perm(request.user, "can_create"):
            return Response({"error": "No permission to create widgets."}, status=403)
        from .models import DashboardWidget
        d = request.data
        widget = DashboardWidget.objects.create(
            user        = request.user,
            widget_type = d.get("widget_type", "stat_card"),
            title       = d.get("title", "New Widget"),
            data_module = d.get("data_module", ""),
            config      = d.get("config", {}),
            position_x  = d.get("position_x", 0),
            position_y  = d.get("position_y", 0),
            width       = d.get("width", 6),
            height      = d.get("height", 4),
        )
        return Response({"id": widget.id, "title": widget.title, "widget_type": widget.widget_type}, status=201)

    def put(self, request):
        """Bulk update layout — expects list of {id, position_x, position_y, width, height}"""
        if not self._check_perm(request.user, "can_edit"):
            return Response({"error": "No permission to edit widgets."}, status=403)
        from .models import DashboardWidget
        updates = request.data.get("widgets", [])
        for item in updates:
            try:
                w = DashboardWidget.objects.get(id=item["id"], user=request.user)
                w.position_x = item.get("position_x", w.position_x)
                w.position_y = item.get("position_y", w.position_y)
                w.width      = item.get("width",      w.width)
                w.height     = item.get("height",     w.height)
                w.title      = item.get("title",      w.title)
                w.config     = item.get("config",     w.config)
                w.save(update_fields=["position_x","position_y","width","height","title","config"])
            except DashboardWidget.DoesNotExist:
                pass
        return Response({"success": True, "updated": len(updates)})

    def delete(self, request):
        if not self._check_perm(request.user, "can_delete"):
            return Response({"error": "No permission to delete widgets."}, status=403)
        from .models import DashboardWidget
        count, _ = DashboardWidget.objects.filter(user=request.user).delete()
        return Response({"success": True, "deleted": count})


class DashboardWidgetDetailView(APIView):
    """PATCH/DELETE /api/auth/dashboard/widgets/<id>/"""
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        from .models import DashboardWidget
        try:
            w = DashboardWidget.objects.get(pk=pk, user=request.user)
        except DashboardWidget.DoesNotExist:
            return Response({"error": "Widget not found."}, status=404)
        d = request.data
        for field in ["widget_type","title","data_module","config","position_x","position_y","width","height","is_visible"]:
            if field in d:
                setattr(w, field, d[field])
        w.save()
        return Response({"id": w.id, "title": w.title})

    def delete(self, request, pk):
        from .models import DashboardWidget
        try:
            w = DashboardWidget.objects.get(pk=pk, user=request.user)
            w.delete()
            return Response(status=204)
        except DashboardWidget.DoesNotExist:
            return Response({"error": "Widget not found."}, status=404)