from django.db import models
from eis_core.models import EnergyDataModel


class TransportData(EnergyDataModel):
    note = models.TextField(blank=True, default="See petroleum app for TransportConsumption model.")

    class Meta:
        app_label = "transport"
        db_table = "transport_data"