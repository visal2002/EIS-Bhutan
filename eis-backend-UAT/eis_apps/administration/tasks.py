from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import SiteSetting
from eis_apps.authentication.models import AuditLog
import logging

logger = logging.getLogger(__name__)

@shared_task(name="administration.cleanup_audit_logs")
def cleanup_audit_logs():
    """
    Deletes AuditLog entries older than the retention period set in SiteSettings.
    Default is 90 days if not set.
    """
    try:
        retention_days = SiteSetting.get().audit_log_retention_days
        threshold_date = timezone.now() - timedelta(days=retention_days)
        
        # Perform deletion
        deleted_count, _ = AuditLog.objects.filter(timestamp__lt=threshold_date).delete()
        
        if deleted_count > 0:
            logger.info(f"Successfully cleaned up {deleted_count} audit log entries older than {retention_days} days.")
        return f"Deleted {deleted_count} logs."
    except Exception as e:
        logger.error(f"Error during audit log cleanup: {str(e)}")
        return f"Error: {str(e)}"
