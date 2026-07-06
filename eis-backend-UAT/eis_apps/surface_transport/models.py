import uuid
from django.db import models
from eis_core.models import AuditedModel, SoftDeleteModel, EnergyDataModel
from eis_apps.master_data.models import Dzongkhag, VehicleType, VehicleFuelType


class TransportConsumption(EnergyDataModel):
    vehicle_type = models.ForeignKey(VehicleType, on_delete=models.PROTECT)
    fuel_type = models.ForeignKey(VehicleFuelType, on_delete=models.PROTECT)
    odometer_reading = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    fuel_consumed_calculated = models.DecimalField(max_digits=18, decimal_places=4, null=True, blank=True)
    original_vehicle_type = models.CharField(max_length=100, blank=True)
    gross_weight = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)

    class Meta:
        app_label = "surface_transport"
        db_table  = "surface_transport_consumption"
        unique_together = (("year", "month", "day", "vehicle_type", "fuel_type"),)


class VehicleRegistration(AuditedModel, SoftDeleteModel):
    """Individual vehicle registration record."""

    STATUS_CHOICES = [
        ("ACTIVE",      "Active"),
        ("CANCELLED",   "Cancelled"),
        ("OUTSTANDING", "Outstanding"),
    ]

    OWNER_TYPE_CHOICES = [
        ("Individual", "Individual"),
        ("Organization", "Organization"),
    ]

    owner_type = models.CharField(
        max_length=20, choices=OWNER_TYPE_CHOICES, blank=True, null=True,
        help_text="Type of owner (Individual or Organization)"
    )

    # Core registration fields
    registration_no = models.CharField(
        max_length=100, unique=True,
        help_text="Unique Registration Number"
    )
    initial_registration_date = models.DateField(
        help_text="Date the vehicle was first registered"
    )
    vehicle_type = models.ForeignKey(
        VehicleType, on_delete=models.PROTECT,
        related_name="vehicleregistration",
        help_text="Type / category of the vehicle"
    )
    model_name = models.CharField(
        max_length=200, blank=True, null=True,
        help_text="Make and model of the vehicle (e.g. Toyota Hilux)"
    )

    # Technical specs
    seating_capacity = models.PositiveSmallIntegerField(
        null=True, blank=True,
        help_text="Number of seats (passengers)"
    )
    engine_cc = models.DecimalField(
        max_digits=8, decimal_places=1, null=True, blank=True,
        help_text="Engine displacement in cubic centimetres (cc)"
    )
    horse_power = models.DecimalField(
        max_digits=8, decimal_places=2, null=True, blank=True,
        help_text="Engine power in horsepower (HP)"
    )
    kilo_watt_hour = models.DecimalField(
        max_digits=10, decimal_places=3, null=True, blank=True,
        help_text="Battery capacity in kWh (for EVs)"
    )
    gross_vehicle_weight = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        help_text="Gross vehicle weight in kilograms (kg)"
    )

    # Fuel / energy
    fuel_type = models.ForeignKey(
        VehicleFuelType, on_delete=models.PROTECT,
        related_name="vehicleregistration",
        help_text="Primary fuel or energy source"
    )

    # Status
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="ACTIVE", blank=True, null=True
    )

    # Optional metadata
    remarks = models.TextField(blank=True, null=True)

    class Meta:
        app_label = "surface_transport"
        db_table  = "surface_transport_vehicle_registration"
        ordering  = ["-initial_registration_date"]
        verbose_name = "Vehicle Registration"
        verbose_name_plural = "Vehicle Registrations"

    def __str__(self):
        return f"{self.vehicle_type} — {self.model_name or 'Unknown'} ({self.status})"