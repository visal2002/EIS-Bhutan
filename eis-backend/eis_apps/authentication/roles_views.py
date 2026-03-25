# backend/eis_apps/authentication/roles_views.py
"""
Roles & Permissions API
- GET  /api/auth/roles/                    → list all roles with permission counts
- GET  /api/auth/roles/<id>/permissions/   → get all module permissions for a role
- PUT  /api/auth/roles/<id>/permissions/   → update all permissions for a role (admin only)
- GET  /api/auth/permissions/modules/      → list all available modules
- POST /api/auth/permissions/seed/         → seed default permissions (admin only)
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404

from .models import Role, RolePermission
from .permissions import IsSystemAdmin
from .role_permissions import MODULES, DEFAULTS


class RoleListView(APIView):
    """
    GET  /api/auth/roles/  — list all roles with stats
    POST /api/auth/roles/  — create a new role (admin only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = Role.objects.all().order_by("id")
        data  = []
        for role in roles:
            perms      = RolePermission.objects.filter(role=role)
            perm_count = perms.filter(can_view=True).count()
            data.append({
                "id":            role.id,
                "role_name":     role.role_name,
                "description":   role.description,
                "perm_count":    perm_count,
                "total_modules": len(MODULES),
                "created_at":    role.created_at,
            })
        return Response(data)

    def post(self, request):
        if not (request.user.role and request.user.role.role_name == "ADMIN"):
            return Response({"error": "Only admins can create roles."}, status=403)
        role_name   = request.data.get("role_name", "").strip().upper().replace(" ", "_")
        description = request.data.get("description", "").strip()
        if not role_name:
            return Response({"role_name": "Role name is required."}, status=400)
        if Role.objects.filter(role_name=role_name).exists():
            return Response({"role_name": "A role with this name already exists."}, status=400)
        role = Role.objects.create(role_name=role_name, description=description)
        # Seed empty permissions for this new role
        for module_key, _, _ in MODULES:
            RolePermission.objects.create(
                role=role, module=module_key,
                can_view=False, can_create=False, can_edit=False, can_delete=False,
            )
        return Response({
            "id": role.id, "role_name": role.role_name,
            "description": role.description, "perm_count": 0,
            "total_modules": len(MODULES), "created_at": role.created_at,
        }, status=201)


class RoleDetailView(APIView):
    """
    GET    /api/auth/roles/<id>/  — get single role
    PATCH  /api/auth/roles/<id>/  — update name/description (admin only)
    DELETE /api/auth/roles/<id>/  — delete role (admin only, cannot delete system roles)
    """
    permission_classes = [IsAuthenticated]
    SYSTEM_ROLES = {"ADMIN", "DOE_HEAD", "DATA_MANAGER", "DATA_FOCAL", "VIEWER"}

    def get(self, request, role_id):
        role = get_object_or_404(Role, id=role_id)
        return Response({
            "id": role.id, "role_name": role.role_name,
            "description": role.description, "created_at": role.created_at,
        })

    def patch(self, request, role_id):
        if not (request.user.role and request.user.role.role_name == "ADMIN"):
            return Response({"error": "Only admins can edit roles."}, status=403)
        role = get_object_or_404(Role, id=role_id)
        if role.role_name in self.SYSTEM_ROLES:
            # Allow description edit but not name change for system roles
            description = request.data.get("description", role.description)
            role.description = description
            role.save(update_fields=["description"])
        else:
            role_name   = request.data.get("role_name", role.role_name).strip().upper().replace(" ", "_")
            description = request.data.get("description", role.description).strip()
            if not role_name:
                return Response({"role_name": "Role name is required."}, status=400)
            if Role.objects.filter(role_name=role_name).exclude(id=role_id).exists():
                return Response({"role_name": "A role with this name already exists."}, status=400)
            role.role_name   = role_name
            role.description = description
            role.save(update_fields=["role_name", "description"])
        return Response({
            "id": role.id, "role_name": role.role_name,
            "description": role.description, "created_at": role.created_at,
        })

    def delete(self, request, role_id):
        if not (request.user.role and request.user.role.role_name == "ADMIN"):
            return Response({"error": "Only admins can delete roles."}, status=403)
        role = get_object_or_404(Role, id=role_id)
        if role.role_name in self.SYSTEM_ROLES:
            return Response({"error": f"System role '{role.role_name}' cannot be deleted."}, status=400)
        # Check no users assigned
        from .models import User
        users_count = User.objects.filter(role=role).count()
        if users_count > 0:
            return Response({"error": f"Cannot delete role with {users_count} assigned user(s). Reassign them first."}, status=400)
        role.delete()
        return Response(status=204)


class RolePermissionsView(APIView):
    """
    GET  /api/auth/roles/<id>/permissions/ — get all permissions for a role
    PUT  /api/auth/roles/<id>/permissions/ — update all permissions (admin only)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, role_id):
        role  = get_object_or_404(Role, id=role_id)
        perms = {p.module: p for p in RolePermission.objects.filter(role=role)}

        result = []
        for module_key, module_label, group in MODULES:
            perm = perms.get(module_key)
            result.append({
                "module":        module_key,
                "label":         module_label,
                "group":         group,
                "can_view":      perm.can_view     if perm else False,
                "can_create":    perm.can_create   if perm else False,
                "can_edit":      perm.can_edit     if perm else False,
                "can_delete":    perm.can_delete   if perm else False,
                "can_upload":    perm.can_upload   if perm else False,
                "can_download":  perm.can_download if perm else False,
            })

        return Response({
            "role": {
                "id":          role.id,
                "role_name":   role.role_name,
                "description": role.description,
            },
            "permissions": result,
        })

    def put(self, request, role_id):
        # Only admins can change permissions
        if not request.user.is_authenticated or not (
            request.user.role and request.user.role.role_name == "ADMIN"
        ):
            return Response({"error": "Only administrators can modify permissions."}, status=403)

        role  = get_object_or_404(Role, id=role_id)

        # Cannot modify ADMIN role permissions
        if role.role_name == "ADMIN":
            return Response({"error": "ADMIN role permissions cannot be modified."}, status=400)

        permissions = request.data.get("permissions", [])

        updated = []
        for perm_data in permissions:
            module = perm_data.get("module")
            if not module:
                continue
            obj, _ = RolePermission.objects.update_or_create(
                role=role, module=module,
                defaults={
                    "can_view":     bool(perm_data.get("can_view",     False)),
                    "can_create":   bool(perm_data.get("can_create",   False)),
                    "can_edit":     bool(perm_data.get("can_edit",     False)),
                    "can_delete":   bool(perm_data.get("can_delete",   False)),
                    "can_upload":   bool(perm_data.get("can_upload",   False)),
                    "can_download": bool(perm_data.get("can_download", False)),
                },
            )
            updated.append(module)

        return Response({
            "success": True,
            "message": f"Updated {len(updated)} module permissions for {role.role_name}",
            "role_name": role.role_name,
        })


class ModuleListView(APIView):
    """GET /api/auth/permissions/modules/ — list all available modules grouped"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        groups = {}
        for key, label, group in MODULES:
            groups.setdefault(group, []).append({"key": key, "label": label})
        return Response([{"group": g, "modules": mods} for g, mods in groups.items()])


class SeedPermissionsView(APIView):
    """
    POST /api/auth/permissions/seed/
    Seeds default permissions for all roles.
    Safe to run multiple times — won't overwrite manually changed permissions
    unless ?force=true is passed.
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request):
        force = request.query_params.get("force") == "true"
        seeded = 0

        for role in Role.objects.all():
            role_defaults = DEFAULTS.get(role.role_name, {})
            for module_key, _, _ in MODULES:
                perms = role_defaults.get(module_key, {
                    "can_view": False, "can_create": False,
                    "can_edit": False, "can_delete": False,
                })
                if force:
                    RolePermission.objects.update_or_create(
                        role=role, module=module_key, defaults=perms
                    )
                    seeded += 1
                else:
                    _, created = RolePermission.objects.get_or_create(
                        role=role, module=module_key, defaults=perms
                    )
                    if created:
                        seeded += 1

        return Response({
            "success": True,
            "message": f"Seeded {seeded} permission records.",
            "force":   force,
        })


class UserRoleUpdateView(APIView):
    """
    PATCH /api/auth/users/<id>/role/
    Admin/SuperAdmin only — update a user's role directly
    """
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def patch(self, request, user_id):
        from .models import User
        user = get_object_or_404(User, id=user_id)

        role_id   = request.data.get("role_id")
        role_name = request.data.get("role_name")

        if role_id:
            role = get_object_or_404(Role, id=role_id)
        elif role_name:
            role = get_object_or_404(Role, role_name=role_name)
        else:
            return Response({"error": "role_id or role_name required."}, status=400)

        old_role    = user.role.role_name if user.role else "None"
        user.role   = role
        user.save(update_fields=["role"])

        # Audit log
        from .views import log_action
        log_action(request.user, "ROLE_CHANGED", request,
                   f"Changed {user.username} role: {old_role} → {role.role_name}")

        return Response({
            "success":  True,
            "message":  f"Role updated to {role.role_name}",
            "user_id":  user.id,
            "username": user.username,
            "role":     {"id": role.id, "role_name": role.role_name},
        })