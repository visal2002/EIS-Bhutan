from django.db import models
from django.conf import settings


class TimeStampedModel(models.Model):
    """Abstract base with created/updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AuditedModel(TimeStampedModel):
    """Abstract base with full user audit trail."""
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="%(class)s_created",
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="%(class)s_updated",
    )

    class Meta:
        abstract = True


class SoftDeleteModel(models.Model):
    """Abstract base supporting soft delete (deactivate instead of delete)."""
    is_active = models.BooleanField(default=True)
    deactivated_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        abstract = True


class EnergyDataModel(AuditedModel, SoftDeleteModel):
    """Abstract base for all energy data records."""

    day = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-31
    month = models.PositiveSmallIntegerField(null=True, blank=True)  # 1-12, null = annual
    year = models.ForeignKey(
        "master_data.DataCollectionYear", 
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="%(class)s_records"
    )
    data_source = models.ForeignKey(
        "master_data.DataSource",
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name="%(class)s_records"
    )
    toe_calculated = models.DecimalField(max_digits=18, decimal_places=6, null=True, blank=True)
    remarks = models.TextField(blank=True)

    class Meta:
        abstract = True