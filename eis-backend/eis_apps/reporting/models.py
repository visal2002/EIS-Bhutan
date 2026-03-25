from django.db import models
from django.conf import settings
from eis_core.models import TimeStampedModel


class ReportRequest(TimeStampedModel):
    STATUS_CHOICES = [
        ("PENDING", "Pending"), ("PROCESSING", "Processing"),
        ("DONE", "Done"), ("FAILED", "Failed"),
    ]
    REPORT_TYPE_CHOICES = [
        ("ELECTRICITY", "Electricity Balance"),
        ("SOLAR", "Solar Installations & Output"),
        ("FUELWOOD", "Fuelwood Supply & Demand"),
        ("POL", "POL Trade & Use"),
        ("TRANSPORT", "Road Transport Fuel Consumption"),
        ("BIOGAS", "Biogas Plant Inventory"),
        ("BRIQUETTE", "Briquette / Charcoal"),
        ("COAL", "Coal Production & Flows"),
        ("INDUSTRY", "Industrial Energy Use"),
    ]
    requested_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    report_type = models.CharField(max_length=20, choices=REPORT_TYPE_CHOICES)
    filters = models.JSONField(default=dict)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    file_path = models.CharField(max_length=500, blank=True)
    error_message = models.TextField(blank=True)

    class Meta:
        app_label = "reporting"
        db_table = "reporting_request"