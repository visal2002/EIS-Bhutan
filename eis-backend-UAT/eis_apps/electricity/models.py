# eis_apps/electricity/models.py
#
# Contains data records for the Electricity module.
# Core lookup tables (Dzongkhag, Year, Source, BPCCategory, GenerationPlant, Country)
# have been migrated to the master_data app.

from django.db import models
from eis_core.models import EnergyDataModel, AuditedModel, SoftDeleteModel
from eis_apps.master_data.models import (
    Dzongkhag, DataCollectionYear, DataSource, Country, 
    BPCCategory, GenerationPlant, Substation, SubstationTransformer,
    Sector, ElectricityCategory
)


# ══════════════════════════════════════════════════════════════════
# ENERGY BALANCE RECORDS (High Level)
# ══════════════════════════════════════════════════════════════════

class ElectricityConsumption(EnergyDataModel):
    """
    BPC grid consumption by electricity category.
    Source: BPC Annual Energy Data — 18 tariff lines per year.
    """
    electricity_category = models.ForeignKey(
        ElectricityCategory, on_delete=models.PROTECT,
        related_name="consumption_records",
        null=True, blank=True,
    )
    sector = models.ForeignKey(
        Sector, on_delete=models.PROTECT,
        related_name="consumption_records",
        null=True, blank=True,
    )
    dzongkhag       = models.ForeignKey(
        Dzongkhag, on_delete=models.SET_NULL, null=True, blank=True,
        help_text="Leave blank for national aggregate",
    )
    consumption_gwh = models.DecimalField(
        max_digits=18, decimal_places=6,
        null=True, blank=True,
        help_text="Electricity consumption in GWh (MU = Million Units)",
    )
    data_sources    = models.ManyToManyField(
        DataSource, blank=True,
        related_name="consumption_records",
    )

    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_consumption"
        ordering        = ["-year", "-month", "electricity_category__category_name"]
        unique_together = ("year", "month", "electricity_category", "dzongkhag")

    def __str__(self):
        y = self.year.year if self.year else "???"
        period = f"{y}" if not self.month else f"{y}-{self.month:02d}"
        return f"{self.electricity_category.category_name} — {period} — {self.consumption_gwh} GWh"


class ElectricityGeneration(EnergyDataModel):
    """
    Electricity generation per plant per month (acronym-based).
    """
    acronym = models.CharField(max_length=50, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    internal_consumption = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    target_generation = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_generation = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    domestic_sales_generation = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    domestic_sales_amount = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_amount = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_tariff = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)

    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_generation"
        ordering        = ["-date", "acronym"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Monthly Gen — {self.acronym} — {self.date}"


class ElectricityImportExport(EnergyDataModel):
    """
    Monthly import/export from DGPC.
    Source: DGPC monthly returns.
    """
    TRANSACTION_CHOICES = [
        ("IMPORT", "Import"),
        ("EXPORT", "Export"),
    ]
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_CHOICES)
    sector = models.ForeignKey(
        Sector, on_delete=models.PROTECT,
        related_name="import_export_records",
        null=True, blank=True,
    )
    country          = models.ForeignKey(
        Country, on_delete=models.PROTECT,
        related_name="import_export_records",
    )
    quantity_gwh     = models.DecimalField(
        max_digits=18, decimal_places=6,
        null=True, blank=True,
        help_text="Quantity in GWh (MU)",
    )
    data_sources     = models.ManyToManyField(
        DataSource, blank=True,
        related_name="import_export_records",
    )

    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_import_export"
        ordering        = ["-year", "-month", "transaction_type"]
        unique_together = ("year", "month", "transaction_type", "country")

    def __str__(self):
        y = self.year.year if self.year else "???"
        period = f"{y}" if not self.month else f"{y}-{self.month:02d}"
        return f"{self.get_transaction_type_display()} — {self.country} — {period}"


# ══════════════════════════════════════════════════════════════════
# DETAILED OPERATIONAL RECORDS (Migrated from DataSharingPortal)
# ══════════════════════════════════════════════════════════════════

# ── 1. HYDROLOGY ──────────────────────────────────────────────────
class HydrologyData(EnergyDataModel):
    acronym = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    inflow = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_hydrology"
        unique_together = ("acronym", "date")
        ordering        = ["-date", "acronym"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Inflow: {self.acronym} — {self.date}"


# ── 2. GENERATION (Daily & Hourly) ────────────────────────────────
class PlantGenerationDaily(EnergyDataModel):
    date = models.DateField(null=True, blank=True)
    generation_bhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_chp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_chp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_khp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_khp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_thp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_thp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_mhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_mhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_dhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_dhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    generation_nhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    export_nhp = models.DecimalField(max_digits=20, decimal_places=8, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_generation_daily"
        ordering        = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Daily Gen — {self.date}"


class HourlyGenerationData(EnergyDataModel):
    plant = models.ForeignKey(GenerationPlant, on_delete=models.PROTECT, related_name="hourly_records")
    timestamp = models.DateTimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    hour = models.CharField(max_length=2, null=True, blank=True, help_text="Hour as 2-digit string, e.g. '01', '23'")
    unit1 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit2 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit3 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit4 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit5 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    unit6 = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_generation_hourly"
        unique_together = ("plant", "date", "hour")
        ordering        = ["-date", "-hour", "plant"]
        indexes         = [models.Index(fields=["plant", "date", "hour"])]

    def save(self, *args, **kwargs):
        # Derive date from timestamp if date not provided
        if not self.date and self.timestamp:
            self.date = self.timestamp.date()
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Hourly Gen: {self.plant.plant_name} — {self.date} H{self.hour}"


# ── 3. INFRASTRUCTURE ─────────────────────────────────────────────
class TransmissionLineData(EnergyDataModel):
    date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=100, blank=True, null=True)
    line_from = models.CharField(max_length=255, null=True, blank=True)
    line_to = models.CharField(max_length=255, null=True, blank=True)
    line_category = models.CharField(max_length=100, blank=True, null=True)
    voltage_level = models.CharField(max_length=100, null=True, blank=True)
    circuit = models.CharField(max_length=100, blank=True, null=True)
    conductor_type = models.CharField(max_length=100, blank=True, null=True)
    configuration = models.CharField(max_length=100, blank=True, null=True)
    ampacity_75 = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    ampacity_85 = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    mw_75 = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    mw_85 = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    sil = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    line_length = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    tower_a = models.IntegerField(null=True, blank=True, default=0)
    tower_b = models.IntegerField(null=True, blank=True, default=0)
    tower_c = models.IntegerField(null=True, blank=True, default=0)
    tower_d = models.IntegerField(null=True, blank=True, default=0)
    tower_spl = models.IntegerField(null=True, blank=True, default=0)
    tower_q = models.IntegerField(null=True, blank=True, default=0)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_infra_transmission"

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        f_name = self.line_from if self.line_from else "?"
        t_name = self.line_to if self.line_to else "?"
        return f"{f_name} -> {t_name} ({self.voltage_level} kV)"


class DistributionLineData(EnergyDataModel):
    date = models.DateField(null=True, blank=True)
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)
    kv33 = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    kv11 = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    kv6_6 = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    lv_line = models.DecimalField(max_digits=10, decimal_places=3, default=0)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_infra_distribution"

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        d_name = self.dzongkhag.dzongkhag if self.dzongkhag else "?"
        return f"Dist Line: {d_name} ({self.date})"


class DistributionTransformerData(EnergyDataModel):
    date = models.DateField(null=True, blank=True)
    dzongkhag = models.ForeignKey(Dzongkhag, on_delete=models.PROTECT)
    voltage_ratio = models.CharField(max_length=100, blank=True, null=True)
    transformer_type = models.CharField(max_length=100, blank=True, null=True)
    no_of_transformers_bpc = models.IntegerField(default=0, null=True, blank=True)
    capacity_bpc = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=True, blank=True)
    no_of_transformers = models.IntegerField(default=0, null=True, blank=True)
    capacity = models.DecimalField(max_digits=15, decimal_places=3, default=0, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_infra_dist_transformer"

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        d_name = self.dzongkhag.dzongkhag if self.dzongkhag else "?"
        return f"Dist Transformer: {d_name} ({self.date})"


# ── 4. SALES & CONSUMERS ──────────────────────────────────────────
class ElectricitySalesData(EnergyDataModel):
    date                     = models.DateField(null=True, blank=True)
    dzongkhag                = models.CharField(max_length=255, null=True, blank=True)
    rural_residents          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_cooperatives       = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_microtrades        = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_community_lhakhangs = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    highlands                = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    urban_residents          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    religious_institutions   = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    cottage_small_industries = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    commercial               = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    industries               = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    agriculture              = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    institutions             = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    street_lighting          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    power_house_auxiliaries  = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    temporary_connections    = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    lv_bulk                  = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    mv_industries            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    hv_industries            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    electric_vehicles        = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)

    class Meta:
        app_label = "electricity"
        db_table  = "electricity_sales_dzongkhag"

    def save(self, *args, **kwargs):
        if self.date:
            self.day   = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=self.date.year)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Sales: {self.dzongkhag} ({self.date})"




class ElectricityConsumerData(EnergyDataModel):
    date                     = models.DateField(null=True, blank=True)
    dzongkhag                = models.CharField(max_length=255, null=True, blank=True)
    rural_residents          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_cooperatives       = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_microtrades        = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    rural_community_lhakhangs = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    highlands                = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    urban_residents          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    religious_institutions   = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    cottage_small_industries = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    commercial               = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    industries               = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    agriculture              = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    institutions             = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    street_lighting          = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    power_house_auxiliaries  = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    temporary_connections    = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    lv_bulk                  = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    mv_industries            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    hv_industries            = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)
    electric_vehicles        = models.DecimalField(max_digits=15, decimal_places=3, null=True, blank=True)

    class Meta:
        app_label = "electricity"
        db_table  = "electricity_consumers_dzongkhag"

    def save(self, *args, **kwargs):
        if self.date:
            self.day   = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=self.date.year)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Consumers: {self.dzongkhag} ({self.date})"




# ── 5. TRADE & MARKETS ────────────────────────────────────────────
class TradeMarketExport(EnergyDataModel):
    acronym = models.CharField(max_length=255, null=True, blank=True)
    timestamp = models.DateTimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    block = models.CharField(max_length=255, null=True, blank=True)
    qty_mw = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    rate_per_mwh = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    iex_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    igst_rate = models.DecimalField(max_digits=8, decimal_places=3, null=True, blank=True)
    trader_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    nldc_app_fee = models.DecimalField(max_digits=12, decimal_places=3, null=True, blank=True)
    successful_portfolios = models.IntegerField(null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_trade_market_export"
        ordering        = ["-date", "acronym"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Export: {self.acronym} — {self.date}"


class TradeMarketImportDam(EnergyDataModel):
    timestamp = models.DateTimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    block = models.CharField(max_length=40, null=True, blank=True)
    qty_mw = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    rate_per_mwh = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    india_trans_loss = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    ctu_charge_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    iex_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    trader_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    nldc_app_fee = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    successful_portfolios = models.IntegerField(null=True, blank=True)
    nldc_op_charge = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_trade_market_import_dam"
        ordering        = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Import DAM: {self.date}"


class TradeMarketImportRtm(EnergyDataModel):
    timestamp = models.DateTimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    block = models.CharField(max_length=40, null=True, blank=True)
    qty_mw = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    rate_per_mwh = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    india_trans_loss = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    ctu_charge_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    iex_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    igst_rate = models.DecimalField(max_digits=5, decimal_places=3, null=True, blank=True)
    trader_margin_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    nldc_app_fee = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    successful_portfolios = models.IntegerField(null=True, blank=True)
    nldc_op_charge = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_trade_market_import_rtm"
        ordering        = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Import RTM: {self.date}"


class ExportREAData(EnergyDataModel):
    date = models.DateField(null=True, blank=True)
    chp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    chp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    khp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    khp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    mhp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    mhp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    thp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    thp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    dhp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    dhp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    nhp_energy = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    nhp_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_trade_rea"

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"REA Data — {self.date}"


# ── 6. OTHERS, FINANCIALS, FORECASTING ────────────────────────────
class BiogasGenerationData(EnergyDataModel):
    fiscal_year = models.CharField(max_length=7, null=True, blank=True)  # Example: '2023-24'
    date = models.DateField(null=True, blank=True)
    dzongkhag = models.CharField(max_length=100, null=True, blank=True)
    small_4m3 = models.IntegerField(null=True, blank=True)
    small_6m3 = models.IntegerField(null=True, blank=True)
    small_8m3 = models.IntegerField(null=True, blank=True)
    small_10m3 = models.IntegerField(null=True, blank=True)
    unspecified = models.IntegerField(null=True, blank=True)
    medium = models.IntegerField(null=True, blank=True)
    plant_type = models.CharField(max_length=100, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_biogas"
        ordering        = ["-date"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Biogas: {self.dzongkhag} — {self.date or self.fiscal_year}"


class IndustryPowerData(EnergyDataModel):
    business_name = models.CharField(max_length=255, null=True, blank=True)
    activity = models.CharField(max_length=255, null=True, blank=True)
    industry_category = models.CharField(max_length=100, null=True, blank=True)
    max_power = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    dzongkhag = models.CharField(max_length=100, null=True, blank=True)
    cod = models.CharField(max_length=100, null=True, blank=True)
    app_status = models.CharField(max_length=100, null=True, blank=True)
    voltage_type = models.CharField(max_length=100, null=True, blank=True)
    validity_status = models.CharField(max_length=100, null=True, blank=True)
    feeding_substation = models.CharField(max_length=255, null=True, blank=True)
    feeder_name = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_industry_power"

    def __str__(self):
        return self.business_name or "Unnamed Business"


class SubstationLoadData(EnergyDataModel):
    timestamp = models.DateTimeField(null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    hour = models.IntegerField(null=True, blank=True)
    
    tsi_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tsi_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bhp_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    bhp_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    chp_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    chp_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gwa_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gwa_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    lsa_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    lsa_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sem_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sem_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    den_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    den_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ola_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ola_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jem_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jem_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    pro_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    pro_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    haa_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    haa_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dhp_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dhp_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ged_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ged_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    plg_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    plg_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gom_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gom_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    mal_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    mal_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sgo_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    sgo_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dam_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dam_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cha_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cha_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    damji_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    damji_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    pan_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    pan_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    doc_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    doc_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jamjee_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jamjee_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ged220_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    ged220_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    kan_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    kan_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    kil_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    kil_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    khp_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    khp_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nko_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nko_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    deo_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    deo_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    mga_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    mga_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nga_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    nga_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dccl_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dccl_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tin_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tin_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    yur_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    yur_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jlg_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    jlg_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gel_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    gel_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cor_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    cor_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    phu_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    phu_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dag_mw = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    dag_mvar = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_substation_load"
        ordering        = ["-date", "-hour"]

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Substation Load — {self.date} @ {self.hour}"


class ElectricityRoyaltyData(EnergyDataModel):
    acronym = models.CharField(max_length=255, null=True, blank=True)
    date = models.DateField(null=True, blank=True)
    generation = models.CharField(max_length=255, null=True, blank=True)
    gen_royalty_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    aux_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    line_losses_rate = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    export_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    wheeling_rate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    schedule_export = models.CharField(max_length=255, null=True, blank=True)
    domestic_tariff = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    rebate = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    export_tariff_iex = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    export_tariff_ptc = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    schedule_export_iex = models.CharField(max_length=255, null=True, blank=True)
    schedule_export_ptc = models.CharField(max_length=255, null=True, blank=True)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_royalty"

    def save(self, *args, **kwargs):
        if self.date:
            self.day = self.date.day
            self.month = self.date.month
            from eis_apps.master_data.models import DataCollectionYear
            year_val = self.date.year
            year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
            self.year = year_obj
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Royalty: {self.acronym} — {self.date}"


class SupplyDemandForecastingData(EnergyDataModel):
    year = models.DateField(null=True, blank=True)  # Year (last date of each year)
    generation_gwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Energy generation (GWh)
    load_gwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Load (GWh)
    export_gwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Export (GWh)
    import_gwh = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Import (GWh)
    peakload_mw = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Peak load (MW)
    firm_power = models.IntegerField(null=True, blank=True)  # Firm power (MW)
    installed_capacity_mw = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)  # Total installed capacity (MW)
    
    class Meta:
        app_label       = "electricity"
        db_table        = "electricity_forecast"
        ordering        = ["-year"]

    def save(self, *args, **kwargs):
        if self.year:
            self.day = self.year.day
            self.month = self.year.month
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Forecast: {self.year}"