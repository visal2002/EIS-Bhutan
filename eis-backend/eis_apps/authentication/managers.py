# backend/eis_apps/authentication/managers.py
from django.contrib.auth.models import BaseUserManager
from django.utils import timezone
from datetime import timedelta


class UserManager(BaseUserManager):

    def create_user(self, username, email, full_name, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        if not username:
            raise ValueError("Username is required")

        email = self.normalize_email(email)
        user  = self.model(
            username=username,
            email=email,
            full_name=full_name,
            **extra_fields
        )
        if password:
            user.set_password(password)
            user.password_changed_at = timezone.now()
            user.password_expires_at = timezone.now() + timedelta(days=90)
        user.save(using=self._db)
        return user

    def create_superuser(self, username, email, full_name, password=None, **extra_fields):
        extra_fields.setdefault("is_staff",      True)
        extra_fields.setdefault("is_superuser",  True)
        extra_fields.setdefault("is_active",     True)
        extra_fields.setdefault("is_verified",   True)
        extra_fields.setdefault("role",          "system_admin")
        return self.create_user(username, email, full_name, password, **extra_fields)