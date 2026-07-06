from rest_framework import generics, filters, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone
from django.db.models import Max
from django.db.models.deletion import ProtectedError
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated

from eis_apps.authentication.permissions import IsDataFocalOrAbove, ReadOnly

from .models import ConsumerType, VoltageType, ConsumerGroup, Location, ConductorType, UnitType, ConnectionType, PlantSize, GridType, ConfigurationType, LineCategory, CircuitType, SubsidyType, TowerType, TransformerType, VoltageLevel, ConsumerSubtype
from .models import (
    ConversionUnit, ElectricityType,

    FuelType, VehicleFuelType, ProductionType, PanelType, IndustryCategory,
    MeasurementUnit, EnergyCategory,
    Dzongkhag, DataCollectionYear, DataSource, Country,
    BPCCategory, GenerationPlant, Substation, SubstationTransformer,
    Sector, ElectricityCategory, VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
    EnergySupply, ConversionFactor
)
from . import serializers
from .serializers import (
    ConversionUnitSerializer, ConversionUnitDropdownSerializer,
    ElectricityTypeSerializer, ElectricityTypeDropdownSerializer,

    FuelTypeSerializer, FuelTypeDropdownSerializer,
    VehicleFuelTypeSerializer, VehicleFuelTypeDropdownSerializer,
    ProductionTypeSerializer, ProductionTypeDropdownSerializer,
    PanelTypeSerializer, PanelTypeDropdownSerializer,
    IndustryCategorySerializer, IndustryCategoryDropdownSerializer,
    MeasurementUnitSerializer, MeasurementUnitDropdownSerializer,
    EnergyCategorySerializer, EnergyCategoryDropdownSerializer,
    DzongkhagSerializer, DzongkhagDropdownSerializer,
    DataCollectionYearSerializer, DataCollectionYearDropdownSerializer,
    DataSourceSerializer, DataSourceDropdownSerializer,
    CountrySerializer, CountryDropdownSerializer,
    BPCCategorySerializer, BPCCategoryDropdownSerializer,
    GenerationPlantSerializer, GenerationPlantDropdownSerializer,
    SubstationSerializer, SubstationDropdownSerializer,
    SubstationTransformerSerializer, SubstationTransformerDropdownSerializer,
    SectorSerializer, SectorDropdownSerializer,
    ElectricityCategorySerializer, ElectricityCategoryDropdownSerializer,
    VehicleTypeSerializer, VehicleTypeDropdownSerializer,
    MileageSerializer, BiogasSizeSerializer, SolarEnergySizeSerializer,
    IndustryClassificationSerializer, IndustryClassificationDropdownSerializer,
    EnergySupplySerializer, EnergySupplyDropdownSerializer, EnergySupplyTreeSerializer,
    ConversionFactorSerializer
)

WRITE_PERMISSION = [IsAuthenticated, IsDataFocalOrAbove]
READ_PERMISSION  = [IsAuthenticated]


def _active_filter(qs, request):
    val = request.query_params.get("is_active")
    if val == "true":
        return qs.filter(is_active=True)
    if val == "false":
        return qs.filter(is_active=False)
    return qs

def _destroy(instance, request):
    if request.query_params.get("hard") == "1":
        try:
            instance.delete()
        except ProtectedError as e:
            protected_objects = e.protected_objects
            model_names = sorted(set(
                obj.__class__._meta.verbose_name for obj in protected_objects
            ))
            names_str = ", ".join(model_names) if model_names else "other records"
            raise ValidationError(
                f"Cannot delete: this record is referenced by {names_str}. "
                f"Remove or reassign those records first."
            )
    else:
        instance.is_active = False
        instance.deactivated_at = timezone.now()
        instance.save(update_fields=["is_active", "deactivated_at"])

class ConversionUnitListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversionUnitSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["unit_code", "unit_name"]
    ordering         = ["unit_name"]

    def get_queryset(self):
        return _active_filter(ConversionUnit.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class ConversionUnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ConversionUnitSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ConversionUnit.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class ConversionUnitDropdownView(generics.ListAPIView):
    serializer_class   = ConversionUnitDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = ConversionUnit.objects.filter(is_active=True).order_by("unit_name")
    pagination_class   = None

class ElectricityTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityTypeSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["type_code", "type_name"]
    ordering         = ["type_name"]

    def get_queryset(self):
        return _active_filter(ElectricityType.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class ElectricityTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ElectricityType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class ElectricityTypeDropdownView(generics.ListAPIView):
    serializer_class   = ElectricityTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = ElectricityType.objects.filter(is_active=True).order_by("type_name")
    pagination_class   = None


class FuelTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = FuelTypeSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["fuel_category", "parent_fuel", "is_active"]
    search_fields    = ["fuel_code", "fuel_name"]
    ordering         = ["parent_fuel__fuel_name", "fuel_name"]

    def get_queryset(self):
        return _active_filter(
            FuelType.objects.select_related("parent_fuel", "fuel_category").all(),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class FuelTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = FuelTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = FuelType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class FuelTypeDropdownView(generics.ListAPIView):
    serializer_class   = FuelTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        from django.db.models import Q
        qs = FuelType.objects.filter(is_active=True).order_by("fuel_name")
        cat = self.request.query_params.get("category")
        if cat:
            qs = qs.filter(Q(fuel_category__category_code__iexact=cat) | Q(fuel_category__category_name__iexact=cat))
        return qs

class VehicleFuelTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleFuelTypeSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["fuel_code", "fuel_name"]
    ordering         = ["fuel_name"]

    def get_queryset(self):
        return _active_filter(VehicleFuelType.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class VehicleFuelTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = VehicleFuelTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = VehicleFuelType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class VehicleFuelTypeDropdownView(generics.ListAPIView):
    serializer_class   = VehicleFuelTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = VehicleFuelType.objects.filter(is_active=True).order_by("fuel_name")
    pagination_class   = None

class ProductionTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductionTypeSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["type_code", "type_name"]
    ordering         = ["type_name"]

    def get_queryset(self):
        return _active_filter(ProductionType.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class ProductionTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ProductionTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ProductionType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class ProductionTypeDropdownView(generics.ListAPIView):
    serializer_class   = ProductionTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = ProductionType.objects.filter(is_active=True).order_by("type_name")
    pagination_class   = None

class PanelTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = PanelTypeSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["type_code", "type_name"]
    ordering         = ["type_name"]

    def get_queryset(self):
        return _active_filter(PanelType.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class PanelTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = PanelTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = PanelType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class PanelTypeDropdownView(generics.ListAPIView):
    serializer_class   = PanelTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = PanelType.objects.filter(is_active=True).order_by("type_name")
    pagination_class   = None

class IndustryCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = IndustryCategorySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["category_code", "category_name"]
    ordering         = ["category_name"]

    def get_queryset(self):
        return _active_filter(IndustryCategory.objects.all(), self.request)

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class IndustryCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = IndustryCategorySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = IndustryCategory.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class IndustryCategoryDropdownView(generics.ListAPIView):
    serializer_class   = IndustryCategoryDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = IndustryCategory.objects.filter(is_active=True).order_by("category_name")
    pagination_class   = None

class MeasurementUnitListCreateView(generics.ListCreateAPIView):
    serializer_class = MeasurementUnitSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["unit_code", "unit_name"]
    ordering         = ["unit_name"]
    def get_queryset(self):
        return _active_filter(MeasurementUnit.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class MeasurementUnitDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = MeasurementUnitSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = MeasurementUnit.objects.all()
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class MeasurementUnitDropdownView(generics.ListAPIView):
    serializer_class   = MeasurementUnitDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = MeasurementUnit.objects.filter(is_active=True).order_by("unit_name")
    pagination_class   = None

class EnergyCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = EnergyCategorySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["category_code", "category_name"]
    ordering         = ["category_name"]
    def get_queryset(self):
        return _active_filter(EnergyCategory.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]

class EnergyCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = EnergyCategorySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = EnergyCategory.objects.all()
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class EnergyCategoryDropdownView(generics.ListAPIView):
    serializer_class   = EnergyCategoryDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = EnergyCategory.objects.filter(is_active=True).order_by("category_name")
    pagination_class   = None

class DzongkhagListCreateView(generics.ListCreateAPIView):
    serializer_class = DzongkhagSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["dzongkhag_code", "dzongkhag", "region"]
    ordering         = ["dzongkhag"]
    def get_queryset(self):
        return _active_filter(Dzongkhag.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]
    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class DzongkhagDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = DzongkhagSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = Dzongkhag.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class DzongkhagDropdownView(generics.ListAPIView):
    serializer_class   = DzongkhagDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = Dzongkhag.objects.filter(is_active=True).order_by("dzongkhag")
    pagination_class   = None

class DataCollectionYearListCreateView(generics.ListCreateAPIView):
    serializer_class = DataCollectionYearSerializer
    ordering         = ["-year"]
    def get_queryset(self):
        return _active_filter(DataCollectionYear.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]
    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class DataCollectionYearDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = DataCollectionYearSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = DataCollectionYear.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class DataCollectionYearDropdownView(generics.ListAPIView):
    serializer_class   = DataCollectionYearDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = DataCollectionYear.objects.filter(is_active=True).order_by("-year")
    pagination_class   = None

class DataSourceListCreateView(generics.ListCreateAPIView):
    serializer_class = DataSourceSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["source_code", "source_name", "organization"]
    ordering         = ["source_name"]
    def get_queryset(self):
        return _active_filter(DataSource.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]
    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class DataSourceDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = DataSourceSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = DataSource.objects.all()
    def perform_update(self, s): s.save(updated_by=self.request.user)
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class DataSourceDropdownView(generics.ListAPIView):
    serializer_class   = DataSourceDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = DataSource.objects.filter(is_active=True).order_by("source_name")
    pagination_class   = None

class CountryListCreateView(generics.ListCreateAPIView):
    serializer_class = CountrySerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ["country_code", "country_name"]
    def get_queryset(self):
        return _active_filter(Country.objects.all(), self.request)
    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]
    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class CountryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Country.objects.all()
    serializer_class   = CountrySerializer
    permission_classes = WRITE_PERMISSION
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class CountryDropdownView(generics.ListAPIView):
    queryset           = Country.objects.filter(is_active=True).order_by("country_name")
    serializer_class   = CountryDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

class BPCCategoryListCreateView(generics.ListCreateAPIView):
    queryset           = BPCCategory.objects.all()
    serializer_class   = BPCCategorySerializer
    permission_classes = WRITE_PERMISSION
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields      = ["category_code", "category_name", "voltage_tier"]
    filterset_fields   = ["voltage_tier", "is_active", "sector", "electricity_category"]
    ordering_fields    = ["sort_order", "category_code", "category_name"]
    ordering           = ["sort_order", "category_code"]

class BPCCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = BPCCategory.objects.all()
    serializer_class   = BPCCategorySerializer
    permission_classes = WRITE_PERMISSION
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class BPCCategoryDropdownView(generics.ListAPIView):
    queryset           = BPCCategory.objects.filter(is_active=True)
    serializer_class   = BPCCategoryDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

class GenerationPlantListCreateView(generics.ListCreateAPIView):
    queryset           = GenerationPlant.objects.all()
    serializer_class   = GenerationPlantSerializer
    permission_classes = WRITE_PERMISSION
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields      = ["plant_code", "plant_name", "owner"]
    filterset_fields   = ["plant_type", "plant_subtype", "dzongkhag", "is_active", "plant_status"]
    ordering_fields    = ["plant_name", "plant_code", "plant_type", "year_of_operation"]
    ordering           = ["plant_type", "plant_name"]

class GenerationPlantDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = GenerationPlant.objects.all()
    serializer_class   = GenerationPlantSerializer
    permission_classes = WRITE_PERMISSION
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class GenerationPlantDropdownView(generics.ListAPIView):
    serializer_class   = GenerationPlantDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        qs = GenerationPlant.objects.filter(is_active=True)
        plant_type = self.request.query_params.get("plant_type")
        plant_subtype = self.request.query_params.get("plant_subtype")
        if plant_type:
            qs = qs.filter(plant_type__iexact=plant_type)
        if plant_subtype:
            qs = qs.filter(plant_subtype__iexact=plant_subtype)
        return qs.order_by("plant_type", "plant_name")

class SubstationListCreateView(generics.ListCreateAPIView):
    queryset           = Substation.objects.all()
    serializer_class   = SubstationSerializer
    permission_classes = WRITE_PERMISSION
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields      = ["substation_code", "substation_name", "acronym"]
    filterset_fields   = ["dzongkhag", "is_active"]
    ordering_fields    = ["substation_name", "substation_code"]
    ordering           = ["substation_name"]

class SubstationDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = Substation.objects.all()
    serializer_class   = SubstationSerializer
    permission_classes = WRITE_PERMISSION
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class SubstationDropdownView(generics.ListAPIView):
    queryset           = Substation.objects.filter(is_active=True).order_by("substation_name")
    serializer_class   = SubstationDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

class SubstationTransformerListCreateView(generics.ListCreateAPIView):
    queryset           = SubstationTransformer.objects.all()
    serializer_class   = SubstationTransformerSerializer
    permission_classes = WRITE_PERMISSION
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter, DjangoFilterBackend]
    search_fields      = ["transformer_code", "voltage_ratio"]
    filterset_fields   = ["substation", "is_active"]
    ordering_fields    = ["transformer_code", "commissioned_date"]
    ordering           = ["transformer_code"]

class SubstationTransformerDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset           = SubstationTransformer.objects.all()
    serializer_class   = SubstationTransformerSerializer
    permission_classes = WRITE_PERMISSION
    def perform_destroy(self, instance):
        _destroy(instance, self.request)

class SubstationTransformerDropdownView(generics.ListAPIView):
    queryset           = SubstationTransformer.objects.filter(is_active=True).order_by("transformer_code")
    serializer_class   = SubstationTransformerDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None


# ═══════════════════════════════════════════════════════════════════
# MIGRATED LOOKUP VIEWS (From Master Data)
# ═══════════════════════════════════════════════════════════════════

# ── Sector ─────────────────────────────────────────────────────────
class SectorListCreateView(generics.ListCreateAPIView):
    serializer_class = SectorSerializer
    filter_backends  = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields    = ["sector_name", "sector_code"]
    filterset_fields = ["parent_sector"]
    ordering         = ["sector_name"]

    def get_queryset(self):
        qs = _active_filter(
            Sector.objects.all().select_related("parent_sector"),
            self.request
        )
        if self.request.query_params.get("top_level") == "true":
            qs = qs.filter(parent_sector__isnull=True)
        return qs

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class SectorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SectorSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = Sector.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


class SectorDropdownView(generics.ListAPIView):
    serializer_class   = SectorDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = Sector.objects.filter(is_active=True).order_by("sector_name")
    pagination_class   = None


# ── Electricity Category ───────────────────────────────────────────
class ElectricityCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityCategorySerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["sector", "category_type"]
    search_fields    = ["category_name", "category_code"]
    ordering         = ["category_name"]

    def get_queryset(self):
        return _active_filter(
            ElectricityCategory.objects.all().select_related("sector", "category_type"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class ElectricityCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityCategorySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ElectricityCategory.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


class ElectricityCategoryDropdownView(generics.ListAPIView):
    serializer_class   = ElectricityCategoryDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        qs = ElectricityCategory.objects.filter(is_active=True).order_by("category_name")
        sector = self.request.query_params.get("sector")
        if sector:
            qs = qs.filter(sector=sector)
        return qs


# ── Vehicle Type ───────────────────────────────────────────────────
class VehicleTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleTypeSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["parent"]
    search_fields    = ["vehicle_type_name", "vehicle_type_code"]
    ordering         = ["vehicle_type_name"]

    def get_queryset(self):
        return _active_filter(
            VehicleType.objects.all().select_related("parent"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class VehicleTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = VehicleTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = VehicleType.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


class VehicleTypeDropdownView(generics.ListAPIView):
    serializer_class   = VehicleTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = VehicleType.objects.filter(is_active=True).order_by("vehicle_type_name")
    pagination_class   = None


# ── Mileage ────────────────────────────────────────────────────────
class MileageListCreateView(generics.ListCreateAPIView):
    serializer_class = MileageSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["vehicle_type", "fuel_type", "effective_year"]
    ordering         = ["vehicle_type", "fuel_type", "-effective_year"]

    def get_queryset(self):
        return _active_filter(
            Mileage.objects.all().select_related("vehicle_type", "fuel_type"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class MileageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = MileageSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = Mileage.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


# ── Biogas Size ────────────────────────────────────────────────────
class BiogasSizeListCreateView(generics.ListCreateAPIView):
    serializer_class = BiogasSizeSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["production_type"]
    ordering         = ["size_category"]

    def get_queryset(self):
        return _active_filter(
            BiogasSize.objects.all().select_related("production_type"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class BiogasSizeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BiogasSizeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = BiogasSize.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


# ── Solar Energy Size ──────────────────────────────────────────────
class SolarEnergySizeListCreateView(generics.ListCreateAPIView):
    serializer_class = SolarEnergySizeSerializer
    filter_backends  = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields    = ["category"]
    filterset_fields = ["sector"]
    ordering         = ["category"]

    def get_queryset(self):
        return _active_filter(
            SolarEnergySize.objects.all().select_related("sector"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class SolarEnergySizeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SolarEnergySizeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = SolarEnergySize.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


# ── Industry Classification ────────────────────────────────────────
class IndustryClassificationListCreateView(generics.ListCreateAPIView):
    serializer_class = IndustryClassificationSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["category"]
    search_fields    = ["classification_name", "classification_code", "ipcc_code"]
    ordering         = ["classification_name"]

    def get_queryset(self):
        return _active_filter(
            IndustryClassification.objects.all().select_related("category"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class IndustryClassificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = IndustryClassificationSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = IndustryClassification.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


class IndustryClassificationDropdownView(generics.ListAPIView):
    serializer_class   = IndustryClassificationDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = IndustryClassification.objects.filter(is_active=True).order_by("classification_name")
    pagination_class   = None


# ── Energy Supply ──────────────────────────────────────────────────
class EnergySupplyListCreateView(generics.ListCreateAPIView):
    """Flat list with optional filters: ?level= ?parent= ?category= ?show_inactive="""
    serializer_class = EnergySupplySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["supply_name", "supply_code", "energy_category__category_name", "fuel_type"]
    ordering_fields  = ["sort_order", "supply_name", "supply_code", "level"]
    ordering         = ["level", "sort_order", "supply_name"]

    def get_queryset(self):
        qs = _active_filter(
            EnergySupply.objects.select_related("parent_supply", "energy_category").all(),
            self.request,
        )
        level    = self.request.query_params.get("level")
        parent   = self.request.query_params.get("parent")
        category = self.request.query_params.get("category")
        if level is not None:
            qs = qs.filter(level=int(level))
        if parent == "null" or parent == "0":
            qs = qs.filter(parent_supply__isnull=True)
        elif parent:
            qs = qs.filter(parent_supply_id=int(parent))
        if category:
            if category.isdigit():
                qs = qs.filter(energy_category_id=int(category))
            else:
                qs = qs.filter(energy_category__category_code=category)
        return qs

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class EnergySupplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = EnergySupplySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = EnergySupply.objects.select_related("parent_supply").all()

    def perform_destroy(self, instance):
        if instance.children.filter(is_active=True).exists():
            from rest_framework.exceptions import ValidationError
            raise ValidationError(
                "Cannot delete — this supply has child items. "
                "Delete or reassign children first."
            )
        _destroy(instance, self.request)


class EnergySupplyTreeView(generics.ListAPIView):
    """GET /tree/  — full 3-level nested tree. Optional ?category=ELECTRICITY"""
    serializer_class   = EnergySupplyTreeSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        qs = EnergySupply.objects.filter(
            parent_supply__isnull=True, is_active=True
        ).prefetch_related("children__children").order_by("sort_order", "supply_name")
        category = self.request.query_params.get("category")
        if category:
            if category.isdigit():
                qs = qs.filter(energy_category_id=int(category))
            else:
                qs = qs.filter(energy_category__category_code=category)
        return qs


class EnergySupplyDropdownView(generics.ListAPIView):
    """Flat indented list for select dropdowns."""
    serializer_class   = EnergySupplyDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        return EnergySupply.objects.filter(
            is_active=True
        ).select_related("parent_supply", "energy_category").order_by("level", "sort_order", "supply_name")


# ── Conversion Factor ──────────────────────────────────────────────
class ConversionFactorListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversionFactorSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ["energy_supply", "unit"]
    ordering         = ["-effective_date"]

    def get_queryset(self):
        return _active_filter(
            ConversionFactor.objects.all().select_related("energy_supply", "unit"),
            self.request
        )

    def get_permissions(self):
        if self.request.method != "GET":
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class ConversionFactorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ConversionFactorSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ConversionFactor.objects.all()

    def perform_destroy(self, instance):
        _destroy(instance, self.request)


# ── Dashboard Statistics ───────────────────────────────────────────
class MasterDataSummaryView(APIView):
    """
    Returns counts and last_updated timestamps for all master data models
    to provide 'freshness' indicators on the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        registry = {
            # Core Resource Modules
            "sectors": Sector,
            "electricity_categories": ElectricityCategory,
            "vehicle_types": VehicleType,
            "mileage": Mileage,
            "biogas_sizes": BiogasSize,
            "solar_sizes": SolarEnergySize,
            "industry_classifications": IndustryClassification,
            "energy_supplies": EnergySupply,
            "conversion_factors": ConversionFactor,
            "substations": Substation,
            "substation_transformers": SubstationTransformer,
            "generation_plants": GenerationPlant,
            
            # Lookup Settings
            "conversion_units": ConversionUnit,
            "electricity_types": ElectricityType,

            "fuel_types": FuelType,
            "vehicle_fuel_types": VehicleFuelType,
            "production_types": ProductionType,
            "panel_types": PanelType,
            "industry_categories": IndustryCategory,
            "measurement_units": MeasurementUnit,
            "energy_categories": EnergyCategory,
            "dzongkhags": Dzongkhag,
            "years": DataCollectionYear,
            "data_sources": DataSource,
            "countries": Country,
            "bpc_categories": BPCCategory,
        }
        
        stats = {}
        for key, model in registry.items():
            try:
                agg = model.objects.aggregate(Max("updated_at"))
                count_qs = model.objects.all()
                if hasattr(model, "is_active"):
                    count_qs = count_qs.filter(is_active=True)
                
                stats[key] = {
                    "count": count_qs.count(),
                    "last_updated": agg["updated_at__max"].isoformat() if agg["updated_at__max"] else None
                }
            except Exception:
                stats[key] = {"count": 0, "last_updated": None}
                
        return Response(stats)

# ── Migrated Standard Master Data (17 Models) Views ───────────────────────

class ConsumerTypeListCreateView(generics.ListCreateAPIView):
    model_class = ConsumerType
    serializer_class = serializers.ConsumerTypeSerializer
    search_fields = ['code']

class ConsumerTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConsumerType
    serializer_class = serializers.ConsumerTypeSerializer

class ConsumerTypeDropdownView(generics.ListAPIView):
    model_class = ConsumerType
    serializer_class = serializers.ConsumerTypeDropdownSerializer

class VoltageTypeListCreateView(generics.ListCreateAPIView):
    model_class = VoltageType
    serializer_class = serializers.VoltageTypeSerializer
    search_fields = ['code']

class VoltageTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = VoltageType
    serializer_class = serializers.VoltageTypeSerializer

class VoltageTypeDropdownView(generics.ListAPIView):
    model_class = VoltageType
    serializer_class = serializers.VoltageTypeDropdownSerializer

class ConsumerGroupListCreateView(generics.ListCreateAPIView):
    model_class = ConsumerGroup
    serializer_class = serializers.ConsumerGroupSerializer
    search_fields = ['code']

class ConsumerGroupDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConsumerGroup
    serializer_class = serializers.ConsumerGroupSerializer

class ConsumerGroupDropdownView(generics.ListAPIView):
    model_class = ConsumerGroup
    serializer_class = serializers.ConsumerGroupDropdownSerializer

class LocationListCreateView(generics.ListCreateAPIView):
    model_class = Location
    serializer_class = serializers.LocationSerializer
    search_fields = ['code']

class LocationDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = Location
    serializer_class = serializers.LocationSerializer

class LocationDropdownView(generics.ListAPIView):
    model_class = Location
    serializer_class = serializers.LocationDropdownSerializer

class ConductorTypeListCreateView(generics.ListCreateAPIView):
    model_class = ConductorType
    serializer_class = serializers.ConductorTypeSerializer
    search_fields = ['code']

class ConductorTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConductorType
    serializer_class = serializers.ConductorTypeSerializer

class ConductorTypeDropdownView(generics.ListAPIView):
    model_class = ConductorType
    serializer_class = serializers.ConductorTypeDropdownSerializer

class UnitTypeListCreateView(generics.ListCreateAPIView):
    model_class = UnitType
    serializer_class = serializers.UnitTypeSerializer
    search_fields = ['code']

class UnitTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = UnitType
    serializer_class = serializers.UnitTypeSerializer

class UnitTypeDropdownView(generics.ListAPIView):
    model_class = UnitType
    serializer_class = serializers.UnitTypeDropdownSerializer

class ConnectionTypeListCreateView(generics.ListCreateAPIView):
    model_class = ConnectionType
    serializer_class = serializers.ConnectionTypeSerializer
    search_fields = ['code']

class ConnectionTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConnectionType
    serializer_class = serializers.ConnectionTypeSerializer

class ConnectionTypeDropdownView(generics.ListAPIView):
    model_class = ConnectionType
    serializer_class = serializers.ConnectionTypeDropdownSerializer

class PlantSizeListCreateView(generics.ListCreateAPIView):
    model_class = PlantSize
    serializer_class = serializers.PlantSizeSerializer
    search_fields = ['code']

class PlantSizeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = PlantSize
    serializer_class = serializers.PlantSizeSerializer

class PlantSizeDropdownView(generics.ListAPIView):
    model_class = PlantSize
    serializer_class = serializers.PlantSizeDropdownSerializer

class GridTypeListCreateView(generics.ListCreateAPIView):
    model_class = GridType
    serializer_class = serializers.GridTypeSerializer
    search_fields = ['code']

class GridTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = GridType
    serializer_class = serializers.GridTypeSerializer

class GridTypeDropdownView(generics.ListAPIView):
    model_class = GridType
    serializer_class = serializers.GridTypeDropdownSerializer

class ConfigurationTypeListCreateView(generics.ListCreateAPIView):
    model_class = ConfigurationType
    serializer_class = serializers.ConfigurationTypeSerializer
    search_fields = ['code']

class ConfigurationTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConfigurationType
    serializer_class = serializers.ConfigurationTypeSerializer

class ConfigurationTypeDropdownView(generics.ListAPIView):
    model_class = ConfigurationType
    serializer_class = serializers.ConfigurationTypeDropdownSerializer

class LineCategoryListCreateView(generics.ListCreateAPIView):
    model_class = LineCategory
    serializer_class = serializers.LineCategorySerializer
    search_fields = ['code']

class LineCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = LineCategory
    serializer_class = serializers.LineCategorySerializer

class LineCategoryDropdownView(generics.ListAPIView):
    model_class = LineCategory
    serializer_class = serializers.LineCategoryDropdownSerializer

class CircuitTypeListCreateView(generics.ListCreateAPIView):
    model_class = CircuitType
    serializer_class = serializers.CircuitTypeSerializer
    search_fields = ['code']

class CircuitTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = CircuitType
    serializer_class = serializers.CircuitTypeSerializer

class CircuitTypeDropdownView(generics.ListAPIView):
    model_class = CircuitType
    serializer_class = serializers.CircuitTypeDropdownSerializer

class SubsidyTypeListCreateView(generics.ListCreateAPIView):
    model_class = SubsidyType
    serializer_class = serializers.SubsidyTypeSerializer
    search_fields = ['code']

class SubsidyTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = SubsidyType
    serializer_class = serializers.SubsidyTypeSerializer

class SubsidyTypeDropdownView(generics.ListAPIView):
    model_class = SubsidyType
    serializer_class = serializers.SubsidyTypeDropdownSerializer

class TowerTypeListCreateView(generics.ListCreateAPIView):
    model_class = TowerType
    serializer_class = serializers.TowerTypeSerializer
    search_fields = ['code']

class TowerTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = TowerType
    serializer_class = serializers.TowerTypeSerializer

class TowerTypeDropdownView(generics.ListAPIView):
    model_class = TowerType
    serializer_class = serializers.TowerTypeDropdownSerializer

class TransformerTypeListCreateView(generics.ListCreateAPIView):
    model_class = TransformerType
    serializer_class = serializers.TransformerTypeSerializer
    search_fields = ['code']

class TransformerTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = TransformerType
    serializer_class = serializers.TransformerTypeSerializer

class TransformerTypeDropdownView(generics.ListAPIView):
    model_class = TransformerType
    serializer_class = serializers.TransformerTypeDropdownSerializer

class VoltageLevelListCreateView(generics.ListCreateAPIView):
    model_class = VoltageLevel
    serializer_class = serializers.VoltageLevelSerializer
    search_fields = ['code']

class VoltageLevelDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = VoltageLevel
    serializer_class = serializers.VoltageLevelSerializer

class VoltageLevelDropdownView(generics.ListAPIView):
    model_class = VoltageLevel
    serializer_class = serializers.VoltageLevelDropdownSerializer

class ConsumerSubtypeListCreateView(generics.ListCreateAPIView):
    model_class = ConsumerSubtype
    serializer_class = serializers.ConsumerSubtypeSerializer
    search_fields = ['code']

class ConsumerSubtypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    model_class = ConsumerSubtype
    serializer_class = serializers.ConsumerSubtypeSerializer

class ConsumerSubtypeDropdownView(generics.ListAPIView):
    model_class = ConsumerSubtype
    serializer_class = serializers.ConsumerSubtypeDropdownSerializer
