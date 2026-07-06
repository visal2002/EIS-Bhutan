# eis_apps/electricity/serializers.py
from rest_framework import serializers
from .models import (
    ElectricityConsumption, ElectricityGeneration, ElectricityImportExport,
    HydrologyData, PlantGenerationDaily, HourlyGenerationData,
    TransmissionLineData, DistributionLineData, DistributionTransformerData,
    ElectricitySalesData, ElectricityConsumerData, TradeMarketExport, TradeMarketImportDam, TradeMarketImportRtm, ExportREAData,
    BiogasGenerationData, IndustryPowerData, SubstationLoadData,
    ElectricityRoyaltyData, SupplyDemandForecastingData
)
from eis_apps.master_data.serializers import (
    BPCCategorySerializer, BPCCategoryDropdownSerializer,
    GenerationPlantSerializer, GenerationPlantDropdownSerializer
)
from eis_apps.master_data.models import DataCollectionYear


class DecimalRoundingModelSerializer(serializers.ModelSerializer):
    def to_internal_value(self, data):
        # Handle QueryDict or immutable dicts by copying
        if hasattr(data, '_mutable') and not data._mutable:
            data = data.copy()
        elif isinstance(data, dict):
            data = data.copy()

        if "plant" in data and ("acronym" not in data or not data["acronym"]):
            data["acronym"] = data["plant"]

        for field_name, field in self.fields.items():
            if isinstance(field, serializers.DecimalField) and field_name in data:
                val = data[field_name]
                if val is not None and val != '':
                    try:
                        num_val = float(val)
                        dec_places = min(field.decimal_places, 8) if field.decimal_places is not None else 8
                        rounded_val = round(num_val, dec_places)
                        # Format as string to avoid floating point precision issues during decimal validation
                        data[field_name] = f"{rounded_val:.{dec_places}f}"
                    except (ValueError, TypeError):
                        pass
        return super().to_internal_value(data)


# ══════════════════════════════════════════════════════════════════
# ENERGY BALANCE RECORD SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class ElectricityConsumptionSerializer(DecimalRoundingModelSerializer):
    year = serializers.SlugRelatedField(
        queryset=DataCollectionYear.objects.all(),
        slug_field="year",
        error_messages={"does_not_exist": "Year {value} does not exist in master data."}
    )
    electricity_category_name = serializers.CharField(
        source="electricity_category.category_name", read_only=True
    )
    electricity_category_code = serializers.CharField(
        source="electricity_category.category_code", read_only=True
    )
    dzongkhag_name       = serializers.CharField(
        source="dzongkhag.dzongkhag", read_only=True
    )
    sector_name = serializers.CharField(
        source="sector.sector_name", read_only=True
    )
    data_source_names = serializers.SerializerMethodField()

    def get_data_source_names(self, obj):
        return ", ".join([s.source_name for s in obj.data_sources.all()])

    class Meta:
        model  = ElectricityConsumption
        fields = [
            "id", "year", "month",
            "electricity_category", "electricity_category_name", "electricity_category_code",
            "sector", "sector_name",
            "dzongkhag", "dzongkhag_name",
            "consumption_gwh",
            "data_sources", "data_source_names",
            "toe_calculated", "data_source", "remarks",
            "created_at", "updated_at",
        'is_active']
        read_only_fields = ["id", "toe_calculated", "created_at", "updated_at"]


class ElectricityGenerationSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model  = ElectricityGeneration
        fields = [
            "id", "acronym", "date", "year_val", "month_val",
            "internal_consumption", "target_generation",
            "generation", "export_generation", "domestic_sales_generation",
            "domestic_sales_amount", "export_amount", "export_tariff",
            "remarks", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ElectricityImportExportSerializer(DecimalRoundingModelSerializer):
    transaction_display = serializers.CharField(
        source="get_transaction_type_display", read_only=True
    )
    country_name        = serializers.CharField(
        source="country.country_name", read_only=True
    )
    sector_name = serializers.CharField(
        source="sector.sector_name", read_only=True, allow_null=True
    )
    data_source_names = serializers.SerializerMethodField()

    def get_data_source_names(self, obj):
        return ", ".join([s.source_name for s in obj.data_sources.all()])

    class Meta:
        model  = ElectricityImportExport
        fields = [
            "id", "year", "month",
            "transaction_type", "transaction_display",
            "sector", "sector_name",
            "country", "country_name",
            "quantity_gwh",
            "data_sources", "data_source_names",
            "toe_calculated", "data_source", "remarks",
            "created_at", "updated_at",
        'is_active']
        read_only_fields = ["id", "toe_calculated", "created_at", "updated_at"]


# ══════════════════════════════════════════════════════════════════
# DETAILED OPERATIONAL RECORD SERIALIZERS
# ══════════════════════════════════════════════════════════════════

class HydrologyDataSerializer(DecimalRoundingModelSerializer):
    year_val         = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    data_source_name = serializers.CharField(source="data_source.source_name", read_only=True, allow_null=True)

    class Meta:
        model = HydrologyData
        fields = [
            "id", "acronym", "date", "year_val", "month", "day",
            "inflow", "data_source", "data_source_name", "toe_calculated", 
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "toe_calculated", "created_at", "updated_at"]

class PlantGenerationDailySerializer(DecimalRoundingModelSerializer):
    class Meta:
        model = PlantGenerationDaily
        fields = [
            "id", "date",
            "generation_bhp", "generation_chp", "export_chp",
            "generation_khp", "export_khp", "generation_thp", "export_thp",
            "generation_mhp", "export_mhp", "generation_dhp", "export_dhp",
            "generation_nhp", "export_nhp", "remarks", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class HourlyGenerationDataSerializer(DecimalRoundingModelSerializer):
    plant_name = serializers.CharField(source="plant.plant_name", read_only=True)

    class Meta:
        model = HourlyGenerationData
        fields = [
            "id", "plant", "plant_name",
            "timestamp", "date", "hour",
            "unit1", "unit2", "unit3", "unit4", "unit5", "unit6",
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class TransmissionLineDataSerializer(DecimalRoundingModelSerializer):
    year_val       = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val      = serializers.IntegerField(source="month",     read_only=True, allow_null=True)
    class Meta:
        model = TransmissionLineData
        fields = [
            "id", "date", "year_val", "month_val",
            "status", "line_from", "line_to",
            "line_category", "voltage_level", "circuit", "conductor_type", "configuration",
            "ampacity_75", "ampacity_85", "mw_75", "mw_85", "sil", "line_length",
            "tower_a", "tower_b", "tower_c", "tower_d", "tower_spl", "tower_q",
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "year_val", "month_val", "toe_calculated", "created_at", "updated_at"]

class DistributionLineDataSerializer(DecimalRoundingModelSerializer):
    dzongkhag_name = serializers.CharField(source="dzongkhag.dzongkhag", read_only=True)
    year_val       = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val      = serializers.IntegerField(source="month",     read_only=True, allow_null=True)
    class Meta:
        model = DistributionLineData
        fields = [
            "id", "date", "year_val", "month_val",
            "dzongkhag", "dzongkhag_name",
            "kv33", "kv11", "kv6_6", "lv_line",
            "data_source", "toe_calculated", "remarks", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "year_val", "month_val", "toe_calculated", "created_at", "updated_at"]

class DistributionTransformerDataSerializer(DecimalRoundingModelSerializer):
    dzongkhag_name = serializers.CharField(source="dzongkhag.dzongkhag", read_only=True)
    year_val       = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val      = serializers.IntegerField(source="month",     read_only=True, allow_null=True)
    class Meta:
        model = DistributionTransformerData
        fields = [
            "id", "date", "year_val", "month_val",
            "dzongkhag", "dzongkhag_name",
            "voltage_ratio", "transformer_type",
            "no_of_transformers_bpc", "capacity_bpc",
            "no_of_transformers", "capacity",
            "data_source", "toe_calculated", "remarks", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "year_val", "month_val", "toe_calculated", "created_at", "updated_at"]

class ElectricitySalesDataSerializer(DecimalRoundingModelSerializer):
    year_val  = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month",     read_only=True, allow_null=True)
    class Meta:
        model = ElectricitySalesData
        fields = [
            "id", "date", "year_val", "month_val", "dzongkhag",
            "rural_residents", "rural_cooperatives", "rural_microtrades",
            "rural_community_lhakhangs", "highlands", "urban_residents",
            "religious_institutions", "cottage_small_industries", "commercial",
            "industries", "agriculture", "institutions", "street_lighting",
            "power_house_auxiliaries", "temporary_connections", "lv_bulk",
            "mv_industries", "hv_industries", "electric_vehicles",
            "data_source", "toe_calculated", "remarks", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "year_val", "month_val", "toe_calculated", "created_at", "updated_at"]



class ElectricityConsumerDataSerializer(DecimalRoundingModelSerializer):
    year_val  = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month",     read_only=True, allow_null=True)
    class Meta:
        model = ElectricityConsumerData
        fields = [
            "id", "date", "year_val", "month_val", "dzongkhag",
            "rural_residents", "rural_cooperatives", "rural_microtrades",
            "rural_community_lhakhangs", "highlands", "urban_residents",
            "religious_institutions", "cottage_small_industries", "commercial",
            "industries", "agriculture", "institutions", "street_lighting",
            "power_house_auxiliaries", "temporary_connections", "lv_bulk",
            "mv_industries", "hv_industries", "electric_vehicles",
            "data_source", "toe_calculated", "remarks", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "year_val", "month_val", "toe_calculated", "created_at", "updated_at"]


class TradeMarketExportSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model = TradeMarketExport
        fields = [
            "id", "acronym", "timestamp", "date", "year_val", "month_val", "day",
            "block", "qty_mw", "rate_per_mwh", "iex_margin_rate", "igst_rate",
            "trader_margin_rate", "nldc_app_fee", "successful_portfolios",
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class TradeMarketImportDamSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model = TradeMarketImportDam
        fields = [
            "id", "timestamp", "date", "year_val", "month_val", "day",
            "block", "qty_mw", "rate_per_mwh", "india_trans_loss", "ctu_charge_rate",
            "iex_margin_rate", "igst_rate", "trader_margin_rate", "nldc_app_fee",
            "successful_portfolios", "nldc_op_charge",
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class TradeMarketImportRtmSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model = TradeMarketImportRtm
        fields = [
            "id", "timestamp", "date", "year_val", "month_val", "day",
            "block", "qty_mw", "rate_per_mwh", "india_trans_loss", "ctu_charge_rate",
            "iex_margin_rate", "igst_rate", "trader_margin_rate", "nldc_app_fee",
            "successful_portfolios", "nldc_op_charge",
            "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class ExportREADataSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model = ExportREAData
        fields = [
            "id", "date", "year_val", "month_val", "day",
            "chp_energy", "chp_tariff", "khp_energy", "khp_tariff",
            "mhp_energy", "mhp_tariff", "thp_energy", "thp_tariff",
            "dhp_energy", "dhp_tariff", "nhp_energy", "nhp_tariff",
            "remarks", "created_at", "updated_at"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class BiogasGenerationDataSerializer(DecimalRoundingModelSerializer):
    class Meta:
        model = BiogasGenerationData
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

class IndustryPowerDataSerializer(DecimalRoundingModelSerializer):
    class Meta:
        model = IndustryPowerData
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

class SubstationLoadDataSerializer(DecimalRoundingModelSerializer):
    class Meta:
        model = SubstationLoadData
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]

class ElectricityRoyaltyDataSerializer(DecimalRoundingModelSerializer):
    year_val = serializers.IntegerField(source="year.year", read_only=True, allow_null=True)
    month_val = serializers.IntegerField(source="month", read_only=True, allow_null=True)

    class Meta:
        model = ElectricityRoyaltyData
        fields = [
            "id", "acronym", "date", "year_val", "month_val", "day",
            "generation", "gen_royalty_rate", "aux_rate", "line_losses_rate",
            "export_tariff", "wheeling_rate", "schedule_export", "domestic_tariff",
            "rebate", "export_tariff_iex", "export_tariff_ptc", "schedule_export_iex",
            "schedule_export_ptc", "remarks", "created_at", "updated_at", "is_active"
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

class SupplyDemandForecastingDataSerializer(DecimalRoundingModelSerializer):
    class Meta:
        model = SupplyDemandForecastingData
        fields = "__all__"
        read_only_fields = ["id", "created_at", "updated_at"]