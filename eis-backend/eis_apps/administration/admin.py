# backend/eis_apps/administration/admin.py
from django import forms
from django.contrib import admin
from django.http import HttpResponseRedirect
from django.urls import reverse
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display
from .models import SiteSetting


class SiteSettingAdminForm(forms.ModelForm):
    """Exclude ImageFields — upload logos via the React frontend instead."""

    class Meta:
        model   = SiteSetting
        exclude = ["site_logo", "doe_logo", "gov_logo", "favicon"]
        widgets = {
            "site_tagline":    forms.TextInput(),
            "footer_text":     forms.Textarea(attrs={"rows": 2}),
            "contact_address": forms.Textarea(attrs={"rows": 3}),
            "maintenance_msg": forms.Textarea(attrs={"rows": 3}),
        }


@admin.register(SiteSetting)
class SiteSettingAdmin(ModelAdmin):   # ← Unfold ModelAdmin — styled correctly
    form = SiteSettingAdminForm

    list_display = [
        "site_title",
        "site_short_name",
        "get_ndi_status",
        "get_agency_status",
        "get_maintenance_status",
        "updated_at",
        "updated_by",
    ]

    fieldsets = (
        ("Site Identity", {
            "fields": (
                "site_title",
                "site_short_name",
                "site_tagline",
                "footer_text",
                "copyright_year",
            ),
        }),
        ("Contact Details", {
            "fields": (
                "contact_email",
                "contact_phone",
                "contact_address",
                "website_url",
            ),
        }),
        ("Social Links", {
            "classes": ("collapse",),
            "fields": (
                "facebook_url",
                "twitter_url",
                "youtube_url",
            ),
        }),
        ("Login Options", {
            "fields": (
                "allow_ndi_login",
                "allow_agency_login",
            ),
        }),
        ("System Config", {
            "fields": (
                "session_timeout",
                "max_login_attempts",
            ),
        }),
        ("Maintenance", {
            "fields": (
                "maintenance_mode",
                "maintenance_msg",
            ),
        }),
        ("Audit Trail", {
            "classes": ("collapse",),
            "fields": (
                "updated_by",
                "updated_at",
            ),
        }),
    )

    readonly_fields = ["updated_at", "updated_by"]

    def has_add_permission(self, request):
        return not SiteSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user.username
        super().save_model(request, obj, form, change)

    def response_change(self, request, obj):
        """Stay on edit page after saving."""
        return HttpResponseRedirect(
            reverse("admin:administration_sitesetting_change", args=[obj.pk])
        )

    def changelist_view(self, request, extra_context=None):
        """Single-row model — jump straight to the edit form."""
        obj = SiteSetting.get()
        return HttpResponseRedirect(
            reverse("admin:administration_sitesetting_change", args=[obj.pk])
        )

    @display(description="NDI Login")
    def get_ndi_status(self, obj):
        if obj.allow_ndi_login:
            return format_html(
                '<span style="color:#059669;font-weight:700">✓ Enabled</span>'
            )
        return format_html(
            '<span style="color:#DC2626;font-weight:700">✗ Disabled</span>'
        )

    @display(description="Agency Login")
    def get_agency_status(self, obj):
        if obj.allow_agency_login:
            return format_html(
                '<span style="color:#059669;font-weight:700">✓ Enabled</span>'
            )
        return format_html(
            '<span style="color:#DC2626;font-weight:700">✗ Disabled</span>'
        )

    @display(description="Maintenance")
    def get_maintenance_status(self, obj):
        if obj.maintenance_mode:
            return format_html(
                '<span style="background:#DC2626;color:#fff;padding:2px 10px;'
                'border-radius:12px;font-size:11px;font-weight:600">ON</span>'
            )
        return format_html(
            '<span style="color:#94A3B8;font-size:11px">off</span>'
        )


# ── System Setting Admin ──────────────────────────────────────────
from django import forms as django_forms
from .models import SystemSetting


class SystemSettingAdminForm(django_forms.ModelForm):
    """Mask secret fields so they show dots but can be overwritten."""
    ndi_client_secret   = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="NDI Client Secret")
    ndi_webhook_secret  = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="NDI Webhook Secret")
    email_host_password = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="SMTP Password")
    mas_api_key         = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="MAS API Key")
    firms_api_key       = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="FIRMS API Key")
    iis_api_key         = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="IIS API Key")
    ofs_api_key         = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="OFS API Key")
    eralis_api_key      = django_forms.CharField(required=False, widget=django_forms.PasswordInput(render_value=False), label="eRALIS API Key")

    class Meta:
        model  = SystemSetting
        fields = "__all__"
        widgets = {
            "allowed_hosts":  django_forms.Textarea(attrs={"rows": 2}),
            "cors_origins":   django_forms.Textarea(attrs={"rows": 2}),
        }

    def _keep(self, field):
        v = self.cleaned_data.get(field)
        return v if v else getattr(self.instance, field, '')

    def clean_ndi_client_secret(self):   return self._keep('ndi_client_secret')
    def clean_ndi_webhook_secret(self):  return self._keep('ndi_webhook_secret')
    def clean_email_host_password(self): return self._keep('email_host_password')
    def clean_mas_api_key(self):         return self._keep('mas_api_key')
    def clean_firms_api_key(self):       return self._keep('firms_api_key')
    def clean_iis_api_key(self):         return self._keep('iis_api_key')
    def clean_ofs_api_key(self):         return self._keep('ofs_api_key')
    def clean_eralis_api_key(self):      return self._keep('eralis_api_key')


@admin.register(SystemSetting)
class SystemSettingAdmin(ModelAdmin):
    form = SystemSettingAdminForm

    fieldsets = (
        ("NDI Integration", {
            "fields": (
                "ndi_environment",
                "ndi_client_id",
                "ndi_client_secret",
                "ndi_webhook_id",
                "ndi_webhook_secret",
                "ndi_webhook_base_url",
                "ndi_auth_url",
                "ndi_verifier_url",
                "ndi_webhook_register_url",
                "ndi_issuer_url",
                "ndi_schema_id",
            ),
        }),
        ("NDI NATS (alternative to webhook)", {
            "classes": ("collapse",),
            "fields": (
                "ndi_nats_url",
                "ndi_nats_ws_url",
                "ndi_nats_seed",
            ),
        }),
        ("Email / SMTP", {
            "fields": (
                "email_backend",
                "email_host",
                "email_port",
                "email_use_tls",
                "email_use_ssl",
                "email_host_user",
                "email_host_password",
                "default_from_email",
                "email_timeout",
            ),
        }),
        ("MAS — Meteorological & Hydrological", {
            "classes": ("collapse",),
            "fields": ("mas_name", "mas_api_key", "mas_base_url", "mas_enabled"),
        }),
        ("FIRMS — Financial Information & Reporting", {
            "classes": ("collapse",),
            "fields": ("firms_name", "firms_api_key", "firms_base_url", "firms_enabled"),
        }),
        ("IIS — Integrated Information System", {
            "classes": ("collapse",),
            "fields": ("iis_name", "iis_api_key", "iis_base_url", "iis_enabled"),
        }),
        ("OFS — Online Filing System", {
            "classes": ("collapse",),
            "fields": ("ofs_name", "ofs_api_key", "ofs_base_url", "ofs_enabled"),
        }),
        ("eRALIS — Agencies Licence System", {
            "classes": ("collapse",),
            "fields": ("eralis_name", "eralis_api_key", "eralis_base_url", "eralis_enabled"),
        }),
        ("App Config", {
            "fields": (
                "app_env",
                "debug_mode",
                "allowed_hosts",
                "cors_origins",
            ),
        }),
        ("Audit", {
            "classes": ("collapse",),
            "fields": ("updated_by", "updated_at"),
        }),
    )

    readonly_fields = ["updated_at", "updated_by"]

    def has_add_permission(self, request):
        return not SystemSetting.objects.exists()

    def has_delete_permission(self, request, obj=None):
        return False

    def save_model(self, request, obj, form, change):
        obj.updated_by = request.user.username
        super().save_model(request, obj, form, change)
        try:
            obj.write_to_env()
        except Exception:
            pass

    def response_change(self, request, obj):
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        return HttpResponseRedirect(
            reverse("admin:administration_systemsetting_change", args=[obj.pk])
        )

    def changelist_view(self, request, extra_context=None):
        from django.http import HttpResponseRedirect
        from django.urls import reverse
        obj = SystemSetting.get()
        return HttpResponseRedirect(
            reverse("admin:administration_systemsetting_change", args=[obj.pk])
        )