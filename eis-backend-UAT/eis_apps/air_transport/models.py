from django.db import models
from eis_core.models import EnergyDataModel


class AircraftActivity(EnergyDataModel):
    """Model to capture aircraft activity metrics."""
    
    date = models.DateField(blank=True, null=True, db_column="date")
    airlines = models.CharField(
        max_length=150,
        help_text="Name of the Airline (e.g. Drukair, Bhutan Airlines)"
    )
    aircraft_type = models.CharField(
        max_length=100,
        help_text="Aircraft Type (e.g. Airbus A319, ATR 42)"
    )
    no_of_flights_operating_per_day = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Number of flights operating per day"
    )
    domestic_landings = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Number of domestic landings"
    )
    international_landings = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Number of international landings"
    )
    domestic_takeoffs = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Number of domestic take-offs"
    )
    international_takeoffs = models.PositiveIntegerField(
        null=True, blank=True,
        help_text="Number of international take-offs"
    )

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
            self.day = self.date.day
        super().save(*args, **kwargs)

    class Meta:
        app_label = "air_transport"
        db_table  = "aircraft_activity"
        ordering  = ["-date", "airlines"]
        verbose_name = "Aircraft Activity Record"
        verbose_name_plural = "Aircraft Activity Records"

    def __str__(self):
        return f"{self.airlines} — {self.aircraft_type} ({self.date or self.year})"


class AviationFuelConsumption(EnergyDataModel):
    """Model to capture aviation fuel consumption data."""

    date = models.DateField(blank=True, null=True, db_column="date")
    airlines = models.CharField(
        max_length=150,
        help_text="Name of the Airline (e.g. Drukair, Bhutan Airlines)"
    )
    aircraft_type = models.CharField(
        max_length=100,
        help_text="Aircraft Type (e.g. Airbus A319, ATR 42)"
    )
    domestic_fuel_consumption = models.DecimalField(
        max_digits=18, decimal_places=4,
        null=True, blank=True,
        help_text="Domestic fuel consumption in kilolitres (KL) or equivalent"
    )
    international_fuel_consumption = models.DecimalField(
        max_digits=18, decimal_places=4,
        null=True, blank=True,
        help_text="International fuel consumption in kilolitres (KL) or equivalent"
    )

    def save(self, *args, **kwargs):
        if self.date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.date.month
            self.day = self.date.day
        super().save(*args, **kwargs)

    class Meta:
        app_label = "air_transport"
        db_table  = "aviation_fuel_consumption"
        ordering  = ["-date", "airlines"]
        verbose_name = "Aviation Fuel Consumption Record"
        verbose_name_plural = "Aviation Fuel Consumption Records"

    def __str__(self):
        return f"{self.airlines} — {self.aircraft_type} ({self.date or self.year})"


