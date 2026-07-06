from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import Sector, VehicleType, FuelType, MeasurementUnit, VehicleFuelType


class POLImportExport(EnergyDataModel):
    TRANSACTION_CHOICES = [("IMPORT", "Import"), ("EXPORT", "Export")]
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_CHOICES)
    
    rrco_office = models.CharField(max_length=100, blank=True, null=True, db_column="rrco_office")
    customs_office = models.CharField(max_length=100, blank=True, null=True, db_column="customs_office")
    declaration_number = models.CharField(max_length=100, blank=True, null=True, db_column="declaration_number")
    declaration_date = models.DateTimeField(blank=True, null=True, db_column="declaration_date")
    importer_tpn = models.CharField(max_length=100, blank=True, null=True, db_column="importer_tpn")
    importer_name = models.CharField(max_length=255, blank=True, null=True, db_column="importer_name")
    exporter_name = models.CharField(max_length=255, blank=True, null=True, db_column="exporter_name")
    country_of_exportation = models.CharField(max_length=100, blank=True, null=True, db_column="country_of_exportation")
    country_of_origin = models.CharField(max_length=100, blank=True, null=True, db_column="country_of_origin")
    vehicle_number = models.CharField(max_length=100, blank=True, null=True, db_column="vehicle_number")
    invoice_number = models.CharField(max_length=100, blank=True, null=True, db_column="invoice_number")
    invoice_date = models.DateField(blank=True, null=True, db_column="invoice_date")
    btc_chapter = models.CharField(max_length=100, blank=True, null=True, db_column="btc_chapter")
    btc_code = models.CharField(max_length=100, blank=True, null=True, db_column="btc_code")
    full_description = models.TextField(blank=True, null=True, db_column="full_description")
    standard_unit_id = models.CharField(max_length=50, blank=True, null=True, db_column="standard_unit_id")
    quantity = models.DecimalField(max_digits=18, decimal_places=4, blank=True, null=True, db_column="quantity")
    customs_value_nu = models.DecimalField(max_digits=18, decimal_places=6, blank=True, null=True, db_column="customs_value_nu")

    def save(self, *args, **kwargs):
        if self.declaration_date:
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.declaration_date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
            self.month = self.declaration_date.month
        super().save(*args, **kwargs)

    class Meta:
        app_label = "pol"
        db_table  = "pol_import_export"


class POLAviation(EnergyDataModel):
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="aviation_consumption")
    quantity_kl = models.DecimalField(max_digits=18, decimal_places=4)
    unit = models.ForeignKey(MeasurementUnit, on_delete=models.PROTECT)

    class Meta:
        app_label = "pol"
        db_table  = "pol_aviation"