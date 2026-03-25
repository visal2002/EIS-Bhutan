# backend/eis_apps/authentication/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import authenticate
from django.utils import timezone
from datetime import timedelta
from .models import User, AuditLog, Role
from .permissions import _build_permissions


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Role
        fields = ["id", "role_name", "description"]


class UserProfileSerializer(serializers.ModelSerializer):
    """Full user profile — returned on GET /users/ and /me/"""
    role      = RoleSerializer(read_only=True)
    role_id   = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source="role",
        write_only=True, required=False, allow_null=True
    )
    full_name  = serializers.SerializerMethodField()
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            "id", "username", "email", "first_name", "last_name", "full_name",
            "employee_id", "contact_no", "gender",
            "role", "role_id",
            "department", "dzongkhag", "status",
            "ndi_sub", "ndi_id_number", "ndi_verified", "is_verified",
            "must_change_password", "is_mfa_enabled",
            "email_verified", "phone_verified",
            "last_login", "created_at",
            "avatar", "avatar_url",
            "is_superuser",
        ]
        read_only_fields = ["id", "last_login", "created_at", "ndi_verified", "ndi_sub",
                            "email_verified", "phone_verified", "is_mfa_enabled", "is_superuser"]

    def get_full_name(self, obj):
        return obj.get_full_name()

    def get_avatar_url(self, obj):
        if not obj.avatar:
            return None
        req = self.context.get('request')
        return req.build_absolute_uri(obj.avatar.url) if req else obj.avatar.url


class UserCreateSerializer(serializers.ModelSerializer):
    """Admin creates a new user with password."""
    password         = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)
    role_id          = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source="role", write_only=True, required=False, allow_null=True
    )

    class Meta:
        model  = User
        fields = [
            "username", "email", "first_name", "last_name",
            "employee_id", "contact_no", "gender",
            "ndi_id_number",                        # ← CID for NDI account linking
            "role_id", "department", "dzongkhag",
            "password", "confirm_password",
        ]

    def validate_employee_id(self, value):
        if value and User.objects.filter(employee_id=value).exists():
            raise serializers.ValidationError("Employee ID already exists.")
        return value

    def validate_username(self, value):
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def validate_ndi_id_number(self, value):
        """CID must be unique if provided."""
        if value and User.objects.filter(ndi_id_number=value).exists():
            raise serializers.ValidationError(
                "This CID is already linked to another account."
            )
        return value

    def validate(self, data):
        if data["password"] != data.pop("confirm_password"):
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data

    def create(self, validated_data):
        password = validated_data.pop("password")
        user     = User(**validated_data)
        user.set_password(password)
        user.must_change_password = True
        user.password_changed_at  = timezone.now()
        user.password_expires_at  = timezone.now() + timedelta(days=90)
        user.status = User.STATUS_ACTIVE
        user.save()
        return user


class UserUpdateSerializer(serializers.ModelSerializer):
    """Admin updates an existing user. Password optional."""
    password         = serializers.CharField(write_only=True, min_length=8, required=False, allow_blank=True)
    confirm_password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    role_id          = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source="role", write_only=True, required=False, allow_null=True
    )

    class Meta:
        model  = User
        fields = [
            "username", "email", "first_name", "last_name",
            "employee_id", "contact_no", "gender",
            "ndi_id_number",                        # ← CID for NDI account linking
            "department", "dzongkhag", "status",
            "role_id", "password", "confirm_password",
        ]

    def validate_ndi_id_number(self, value):
        """CID must be unique if provided — but allow keeping the same value."""
        if value:
            qs = User.objects.filter(ndi_id_number=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "This CID is already linked to another account."
                )
        return value

    def validate(self, data):
        pw  = data.get("password", "")
        cpw = data.pop("confirm_password", "")
        if pw and pw != cpw:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        if not pw:
            data.pop("password", None)
        return data

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            instance.must_change_password = False
            instance.password_changed_at  = timezone.now()
            instance.password_expires_at  = timezone.now() + timedelta(days=90)
        instance.save()
        return instance


class NDIProfileCompleteSerializer(serializers.ModelSerializer):
    """
    NDI users complete their profile after first login.
    Collects: first_name, last_name, username, email, contact, gender,
              dzongkhag, and password (so they can also use Agency Login).
    Employee ID and Department are set later by admin.
    """
    password = serializers.CharField(write_only=True, min_length=8, required=True)

    class Meta:
        model  = User
        fields = [
            "first_name", "last_name",
            "username", "email",
            "contact_no", "gender", "dzongkhag",
            "password",
        ]

    def validate_username(self, value):
        user = self.context.get("request").user
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Username already taken.")
        return value

    def validate_email(self, value):
        user = self.context.get("request").user
        if User.objects.filter(email__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError("Email already registered.")
        return value

    def update(self, instance, validated_data):
        password = validated_data.pop("password", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
            instance.must_change_password = False
        instance.is_verified = True
        instance.save()
        return instance


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """JWT login — returns full user object with role and permissions."""
    username_field = "username"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["username"] = serializers.CharField()
        self.fields["password"] = serializers.CharField(write_only=True)

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"]  = user.username
        token["full_name"] = user.get_full_name()
        token["role"]      = user.role.role_name if user.role else None
        token["email"]     = user.email
        return token

    def validate(self, attrs):
        username = attrs.get("username", "").strip()
        password = attrs.get("password", "")

        try:
            user_obj = (
                User.objects.get(email__iexact=username)
                if "@" in username
                else User.objects.get(username__iexact=username)
            )
        except User.DoesNotExist:
            raise serializers.ValidationError({"detail": "Invalid username or password."})

        if user_obj.is_account_locked:
            raise serializers.ValidationError({
                "detail": f"Account locked until {user_obj.locked_until.strftime('%H:%M')}. Contact your administrator."
            })

        if not user_obj.is_active:
            raise serializers.ValidationError({"detail": "Your account has been deactivated."})

        user = authenticate(
            request=self.context.get("request"),
            username=user_obj.username,
            password=password,
        )
        if not user:
            user_obj.record_failed_login()
            remaining = max(0, 5 - user_obj.failed_login_attempts)
            raise serializers.ValidationError({
                "detail": f"Invalid password. {remaining} attempt(s) left before lockout."
            })

        user.record_successful_login()
        data = super().validate({"username": user.username, "password": password})
        data["user"]                 = UserProfileSerializer(user, context=self.context).data
        data["password_expired"]     = user.is_password_expired
        data["must_change_password"] = user.must_change_password
        data["needs_profile_setup"]  = bool(user.ndi_sub and not user.email)
        data["permissions"]          = _build_permissions(user)
        return data


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password     = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect.")
        return value

    def validate(self, data):
        if data["new_password"] != data["confirm_password"]:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data


class AuditLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model  = AuditLog
        fields = ["id", "user_name", "action", "ip_address", "description", "timestamp"]

    def get_user_name(self, obj):
        return obj.user.get_full_name() if obj.user else "System"