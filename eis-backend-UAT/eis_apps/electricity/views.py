# eis_apps/electricity/views.py
import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import (
    Dzongkhag, DataCollectionYear, DataSource, Country, BPCCategory, GenerationPlant, Substation,
    Sector, ElectricityCategory
)
from .models import (
    ElectricityConsumption, ElectricityGeneration, ElectricityImportExport,
    HydrologyData, PlantGenerationDaily, HourlyGenerationData,
    TransmissionLineData, DistributionLineData, DistributionTransformerData,
    ElectricitySalesData, ElectricityConsumerData, TradeMarketExport, TradeMarketImportDam, TradeMarketImportRtm, ExportREAData,
    BiogasGenerationData, IndustryPowerData, SubstationLoadData,
    ElectricityRoyaltyData, SupplyDemandForecastingData
)
from .serializers import (
    ElectricityConsumptionSerializer, ElectricityGenerationSerializer, ElectricityImportExportSerializer,
    HydrologyDataSerializer, PlantGenerationDailySerializer, HourlyGenerationDataSerializer,
    TransmissionLineDataSerializer, DistributionLineDataSerializer, DistributionTransformerDataSerializer,
    ElectricitySalesDataSerializer, ElectricityConsumerDataSerializer, TradeMarketExportSerializer, TradeMarketImportDamSerializer, TradeMarketImportRtmSerializer, ExportREADataSerializer,
    BiogasGenerationDataSerializer, IndustryPowerDataSerializer, SubstationLoadDataSerializer,
    ElectricityRoyaltyDataSerializer, SupplyDemandForecastingDataSerializer
)

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]


def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)   # year is a FK; filter on related field
    if month: qs = qs.filter(month=month)
    
    # Apply soft-delete is_active filter
    trashed = request.query_params.get("trashed") == "true"
    if hasattr(qs.model, "is_active"):
        qs = qs.filter(is_active=not trashed)
    return qs


# ══════════════════════════════════════════════════════════════════
# 1. CORE DATA RECORD VIEWS (Energy Balance)
# ══════════════════════════════════════════════════════════════════

class ElectricityConsumptionListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityConsumptionSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["electricity_category__category_name", "remarks"]
    ordering_fields  = ["date", "electricity_category__category_code", "created_at"]
    ordering         = ["-date", "electricity_category__category_code"]
    def get_queryset(self):
        return _year_filter(ElectricityConsumption.objects.select_related("electricity_category", "sector", "dzongkhag").prefetch_related("data_sources"), self.request)
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]
    def perform_create(self, s):
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class ElectricityConsumptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityConsumptionSerializer
    permission_classes = WRITE
    queryset           = ElectricityConsumption.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ElectricityGenerationListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityGenerationSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["acronym", "date"]
    ordering_fields  = [
        "acronym", "date", "internal_consumption", "target_generation",
        "generation", "export_generation", "domestic_sales_generation",
        "domestic_sales_amount", "export_amount", "export_tariff"
    ]
    ordering         = ["-date", "acronym"]
    def get_queryset(self):
        qs = _year_filter(ElectricityGeneration.objects.all(), self.request)
        acronym = self.request.query_params.get("acronym")
        if acronym:
            qs = qs.filter(acronym=acronym)
        
        # Filter by plant_type/plant_subtype by resolving plant acronyms
        plant_type = self.request.query_params.get("plant_type")
        plant_subtype = self.request.query_params.get("plant_subtype")
        if plant_type or plant_subtype:
            plants_qs = GenerationPlant.objects.filter(is_active=True)
            if plant_type:
                plants_qs = plants_qs.filter(plant_type__iexact=plant_type)
            if plant_subtype:
                plants_qs = plants_qs.filter(plant_subtype__iexact=plant_subtype)
            acronyms = plants_qs.exclude(acronym__isnull=True).exclude(acronym="").values_list('acronym', flat=True)
            qs = qs.filter(acronym__in=acronyms)
        return qs
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]
    def perform_create(self, s):
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class ElectricityGenerationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityGenerationSerializer
    permission_classes = WRITE
    queryset           = ElectricityGeneration.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ElectricityImportExportListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityImportExportSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["country__country_name", "transaction_type"]
    ordering         = ["-date"]
    def get_queryset(self):
        qs = _year_filter(ElectricityImportExport.objects.select_related("country", "sector"), self.request)
        txtype = self.request.query_params.get("transaction_type")
        if txtype: qs = qs.filter(transaction_type=txtype)
        return qs
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]
    def perform_create(self, s):
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class ElectricityImportExportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityImportExportSerializer
    permission_classes = WRITE
    queryset           = ElectricityImportExport.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)


# ══════════════════════════════════════════════════════════════════
# 2. DETAILED OPERATIONAL VIEWS
# ══════════════════════════════════════════════════════════════════

# --- Hydrology ---

class HydrologyDataListCreateView(generics.ListCreateAPIView):
    serializer_class = HydrologyDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["acronym", "remarks"]
    ordering_fields  = ["acronym", "date", "inflow", "created_at", "updated_at"]
    ordering         = ["-date", "acronym"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        qs = HydrologyData.objects.filter(is_active=not trashed)
        acronym = self.request.query_params.get("acronym")
        if acronym: 
            qs = qs.filter(acronym__iexact=acronym)
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:  qs = qs.filter(date__year=year)
        if month: qs = qs.filter(date__month=month)
        return qs

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class HydrologyDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HydrologyDataSerializer
    permission_classes = WRITE
    queryset = HydrologyData.objects.all()

    def perform_update(self, s): 
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class PlantDailyGenerationListCreateView(generics.ListCreateAPIView):
    serializer_class = PlantGenerationDailySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["date"]
    ordering_fields  = ["date", "generation_bhp", "generation_chp", "export_chp", "generation_khp", "export_khp", "generation_thp", "export_thp", "generation_mhp", "export_mhp", "generation_dhp", "export_dhp", "generation_nhp", "export_nhp"]
    ordering         = ["-date"]
    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return PlantGenerationDaily.objects.filter(is_active=not trashed)
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class PlantDailyGenerationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = PlantGenerationDailySerializer
    permission_classes = WRITE
    queryset = PlantGenerationDaily.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class HourlyGenerationDataListCreateView(generics.ListCreateAPIView):
    serializer_class = HourlyGenerationDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["plant__plant_name", "plant__acronym", "date"]
    ordering_fields  = ["plant__plant_name", "timestamp", "date", "hour", "unit1", "unit2", "unit3", "unit4", "unit5", "unit6", "created_at", "updated_at"]
    ordering         = ["-date", "-hour", "plant__plant_name"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        qs = HourlyGenerationData.objects.select_related("plant").filter(is_active=not trashed)
        plant = self.request.query_params.get("plant")
        if plant:
            qs = qs.filter(plant_id=plant)
        
        # Filter by plant_type/plant_subtype
        plant_type = self.request.query_params.get("plant_type")
        plant_subtype = self.request.query_params.get("plant_subtype")
        if plant_type:
            qs = qs.filter(plant__plant_type__iexact=plant_type)
        if plant_subtype:
            qs = qs.filter(plant__plant_subtype__iexact=plant_subtype)
        return qs

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class HourlyGenerationDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = HourlyGenerationDataSerializer
    permission_classes = WRITE
    queryset = HourlyGenerationData.objects.select_related("plant").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


# --- Infrastructure ---

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class TransmissionLineDataListCreateView(generics.ListCreateAPIView):
    serializer_class = TransmissionLineDataSerializer
    def get_queryset(self): return TransmissionLineData.objects.all()
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class TransmissionLineDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TransmissionLineDataSerializer
    permission_classes = WRITE
    queryset = TransmissionLineData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class DistributionLineDataListCreateView(generics.ListCreateAPIView):
    serializer_class = DistributionLineDataSerializer
    def get_queryset(self): return DistributionLineData.objects.select_related("dzongkhag")
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class DistributionLineDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DistributionLineDataSerializer
    permission_classes = WRITE
    queryset = DistributionLineData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class DistributionTransformerDataListCreateView(generics.ListCreateAPIView):
    serializer_class = DistributionTransformerDataSerializer
    def get_queryset(self): return DistributionTransformerData.objects.select_related("dzongkhag")
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class DistributionTransformerDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = DistributionTransformerDataSerializer
    permission_classes = WRITE
    queryset = DistributionTransformerData.objects.all()

# --- Sales & Consumers ---

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ElectricitySalesDataListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricitySalesDataSerializer
    def get_queryset(self): return ElectricitySalesData.objects.all()
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class ElectricitySalesDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ElectricitySalesDataSerializer
    permission_classes = WRITE
    queryset = ElectricitySalesData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ElectricityConsumerDataListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityConsumerDataSerializer
    def get_queryset(self): return ElectricityConsumerData.objects.all()
    def get_permissions(self): return [p() for p in (WRITE if self.request.method != "GET" else READ)]

class ElectricityConsumerDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ElectricityConsumerDataSerializer
    permission_classes = WRITE
    queryset = ElectricityConsumerData.objects.all()

# --- Trade ---

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class TradeMarketExportListCreateView(generics.ListCreateAPIView):
    serializer_class = TradeMarketExportSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["acronym", "remarks"]
    ordering_fields  = ["acronym", "date", "created_at", "updated_at"]
    ordering         = ["-date", "acronym"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return TradeMarketExport.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class TradeMarketExportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TradeMarketExportSerializer
    permission_classes = WRITE
    queryset = TradeMarketExport.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class TradeMarketImportDamListCreateView(generics.ListCreateAPIView):
    serializer_class = TradeMarketImportDamSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["remarks"]
    ordering_fields  = ["date", "created_at", "updated_at"]
    ordering         = ["-date"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return TradeMarketImportDam.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class TradeMarketImportDamDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TradeMarketImportDamSerializer
    permission_classes = WRITE
    queryset = TradeMarketImportDam.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class TradeMarketImportRtmListCreateView(generics.ListCreateAPIView):
    serializer_class = TradeMarketImportRtmSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["remarks"]
    ordering_fields  = ["date", "created_at", "updated_at"]
    ordering         = ["-date"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return TradeMarketImportRtm.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class TradeMarketImportRtmDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TradeMarketImportRtmSerializer
    permission_classes = WRITE
    queryset = TradeMarketImportRtm.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ExportREADataListCreateView(generics.ListCreateAPIView):
    serializer_class = ExportREADataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["remarks"]
    ordering_fields  = ["date", "created_at", "updated_at"]
    ordering         = ["-date"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return ExportREAData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class ExportREADataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ExportREADataSerializer
    permission_classes = WRITE
    queryset = ExportREAData.objects.all()

    def perform_update(self, s): 
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])





class BiogasGenerationDataListCreateView(generics.ListCreateAPIView):
    serializer_class = BiogasGenerationDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["dzongkhag", "fiscal_year", "plant_type"]
    ordering_fields  = ["date", "fiscal_year", "created_at", "updated_at"]
    ordering         = ["-date"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return BiogasGenerationData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class BiogasGenerationDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BiogasGenerationDataSerializer
    permission_classes = WRITE
    queryset = BiogasGenerationData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class IndustryPowerDataListCreateView(generics.ListCreateAPIView):
    serializer_class = IndustryPowerDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["business_name", "activity", "industry_category", "dzongkhag", "location"]
    ordering_fields  = ["business_name", "max_power", "created_at", "updated_at"]
    ordering         = ["business_name"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return IndustryPowerData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class IndustryPowerDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = IndustryPowerDataSerializer
    permission_classes = WRITE
    queryset = IndustryPowerData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class SubstationLoadDataListCreateView(generics.ListCreateAPIView):
    serializer_class = SubstationLoadDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["date", "hour"]
    ordering_fields  = ["date", "hour", "created_at"]
    ordering         = ["-date", "-hour"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return SubstationLoadData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class SubstationLoadDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SubstationLoadDataSerializer
    permission_classes = WRITE
    queryset = SubstationLoadData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class ElectricityRoyaltyDataListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityRoyaltyDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["acronym", "remarks"]
    ordering_fields  = ["acronym", "date", "created_at", "updated_at"]
    ordering         = ["-date", "acronym"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return ElectricityRoyaltyData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class ElectricityRoyaltyDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ElectricityRoyaltyDataSerializer
    permission_classes = WRITE
    queryset = ElectricityRoyaltyData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class SupplyDemandForecastingDataListCreateView(generics.ListCreateAPIView):
    serializer_class = SupplyDemandForecastingDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["year"]
    ordering_fields  = ["year", "created_at"]
    ordering         = ["-year"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return SupplyDemandForecastingData.objects.filter(is_active=not trashed)

    def get_permissions(self): 
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        from eis_apps.master_data.models import DataSource
        ds = DataSource.objects.filter(source_code="MANUAL").first()
        s.save(created_by=self.request.user, updated_by=self.request.user, data_source=ds)

class SupplyDemandForecastingDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SupplyDemandForecastingDataSerializer
    permission_classes = WRITE
    queryset = SupplyDemandForecastingData.objects.all()

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])

