from django.db import models
from django.conf import settings
from eis_core.models import AuditedModel, SoftDeleteModel

class WidgetLibrary(AuditedModel, SoftDeleteModel):
    CHART_TYPES = [
        ("STAT",   "Single Statistic"),
        ("BAR",    "Bar Chart"),
        ("PIE",    "Pie Chart"),
        ("LINE",   "Line Chart"),
        ("AREA",   "Area Chart"),
        ("RADAR",  "Radar Chart"),
        ("MAP",    "Choropleth Map"),
        ("SANKEY", "Sankey Diagram"),
        ("TABLE",  "Data Table"),
    ]
    
    widget_code = models.CharField(max_length=50, unique=True)
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    chart_type = models.CharField(max_length=10, choices=CHART_TYPES)
    data_endpoint = models.CharField(max_length=200, help_text="API endpoint to fetch data")
    default_w = models.PositiveSmallIntegerField(default=1)
    default_h = models.PositiveSmallIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta:
        app_label = "analytics"
        db_table = "analytics_widget_library"
        verbose_name_plural = "Widget Library"

    def __str__(self):
        return f"{self.title} ({self.widget_code})"


class UserDashboard(AuditedModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dashboards")
    layout_config = models.JSONField(
        default=list, 
        help_text="Stored as a list of widget placements: [{id, x, y, w, h, config}]"
    )
    is_primary = models.BooleanField(default=True)

    class Meta:
        app_label = "analytics"
        db_table = "analytics_user_dashboard"

    def __str__(self):
        return f"Dashboard for {self.user.username}"
