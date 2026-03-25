from django.db import models

# Create your models here.
from django.db import models
from eis_core.models import EnergyDataModel
from eis_apps.master_data.models import Sector, ElectricityCategory

DZONGKHAG_CHOICES = [
    ("bumthang", "Bumthang"), ("chhukha", "Chhukha"), ("dagana", "Dagana"),
    ("gasa", "Gasa"), ("haa", "Haa"), ("lhuentse", "Lhuentse"),
    ("mongar", "Mongar"), ("paro", "Paro"), ("pemagatshel", "Pemagatshel"),
    ("punakha", "Punakha"), ("samdrup_jongkhar", "Samdrup Jongkhar"),
    ("samtse", "Samtse"), ("sarpang", "Sarpang"), ("thimphu", "Thimphu"),
    ("trashigang", "Trashigang"), ("trashiyangtse", "Trashiyangtse"),
    ("trongsa", "Trongsa"), ("tsirang", "Tsirang"),
    ("wangdue_phodrang", "Wangdue Phodrang"), ("zhemgang", "Zhemgang"),
]


class ElectricityGeneration(EnergyDataModel):
    SOURCE_CHOICES = [
        ("HYDRO", "Hydro"), ("SOLAR", "Solar"), ("WIND", "Wind"), ("THERMAL", "Thermal"),
    ]
    supply_source = models.CharField(max_length=20, choices=SOURCE_CHOICES)
    quantity_mwh = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "electricity"
        db_table = "electricity_generation"


class ElectricityImportExport(EnergyDataModel):
    TRANSACTION_CHOICES = [("IMPORT", "Import"), ("EXPORT", "Export")]
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_CHOICES)
    country = models.CharField(max_length=100, blank=True)
    quantity_mwh = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "electricity"
        db_table = "electricity_import_export"


class ElectricityConsumption(EnergyDataModel):
    sector = models.ForeignKey(Sector, on_delete=models.PROTECT, related_name="electricity_consumption")
    category = models.ForeignKey(ElectricityCategory, on_delete=models.PROTECT, related_name="consumption_records")
    dzongkhag = models.CharField(max_length=50, choices=DZONGKHAG_CHOICES)
    demand_mwh = models.DecimalField(max_digits=18, decimal_places=4)

    class Meta:
        app_label = "electricity"
        db_table = "electricity_consumption"