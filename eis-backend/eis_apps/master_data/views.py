# backend/eis_apps/master_data/views.py
#
# CHANGES FROM ORIGINAL:
#   1. Every list view now returns ALL records (active + inactive)
#      and supports ?is_active=true/false query param for filtering.
#      Previously only active records were returned, making it
#      impossible to see, reactivate, or delete inactive records.
#
#   2. Every perform_destroy now supports two modes:
#      - Default (DELETE /api/.../123/):        soft-deactivate
#      - Permanent (DELETE /api/.../123/?hard=1): hard delete from DB
#      Only inactive records should be hard-deleted from the UI.
#
#   3. No model changes — deactivated_at already exists in SoftDeleteModel.
#   4. No migration needed.

from django.utils import timezone
from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from eis_apps.authentication.permissions import IsDataManagerOrAbove, ReadOnly

from .models import (
    EnergySupply, ConversionFactor, Sector, ElectricityCategory,
    VehicleType, Mileage, BiogasSize, SolarEnergySize, IndustryClassification,
)
from .serializers import (
    EnergySupplySerializer, EnergySupplyDropdownSerializer,
    ConversionFactorSerializer,
    SectorSerializer, SectorDropdownSerializer,
    ElectricityCategorySerializer, ElectricityCategoryDropdownSerializer,
    VehicleTypeSerializer, VehicleTypeDropdownSerializer,
    MileageSerializer,
    BiogasSizeSerializer,
    SolarEnergySizeSerializer,
    IndustryClassificationSerializer, IndustryClassificationDropdownSerializer,
)

# ── Permission helpers ─────────────────────────────────────────────
# Admins / Data Managers can write; everyone else read-only
WRITE_PERMISSION = [IsAuthenticated, IsDataManagerOrAbove]
READ_PERMISSION  = [IsAuthenticated]


def apply_active_filter(qs, request):
    """
    Apply ?is_active=true/false filter from query params.
    Called by every list view's get_queryset.
    No param → return all records (active + inactive).
    """
    val = request.query_params.get('is_active')
    if val == 'true':
        return qs.filter(is_active=True)
    if val == 'false':
        return qs.filter(is_active=False)
    return qs


def soft_or_hard_delete(instance, request):
    """
    Two-mode delete called by every perform_destroy:
      DELETE /api/.../123/         → soft-deactivate (sets is_active=False)
      DELETE /api/.../123/?hard=1  → hard delete from database (irreversible)
    """
    if request.query_params.get('hard') == '1':
        instance.delete()
    else:
        instance.is_active = False
        instance.deactivated_at = timezone.now()
        instance.save(update_fields=['is_active', 'deactivated_at'])


# ══════════════════════════════════════════════════════════════════
# ENERGY SUPPLY
# ══════════════════════════════════════════════════════════════════

class EnergySupplyListCreateView(generics.ListCreateAPIView):
    serializer_class = EnergySupplySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['supply_name', 'supply_code']
    ordering_fields  = ['supply_name', 'supply_code']
    ordering         = ['supply_name']

    def get_queryset(self):
        return apply_active_filter(
            EnergySupply.objects.all(),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class EnergySupplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = EnergySupplySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = EnergySupply.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


class EnergySupplyDropdownView(generics.ListAPIView):
    """Active-only list for use in dropdown selects across other modules."""
    serializer_class   = EnergySupplyDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = EnergySupply.objects.filter(is_active=True).order_by('supply_name')
    pagination_class   = None


# ══════════════════════════════════════════════════════════════════
# CONVERSION FACTOR
# ══════════════════════════════════════════════════════════════════

class ConversionFactorListCreateView(generics.ListCreateAPIView):
    serializer_class = ConversionFactorSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['energy_supply', 'unit']
    ordering         = ['-effective_date']

    def get_queryset(self):
        return apply_active_filter(
            ConversionFactor.objects.all().select_related('energy_supply'),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class ConversionFactorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ConversionFactorSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ConversionFactor.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


# ══════════════════════════════════════════════════════════════════
# SECTOR
# ══════════════════════════════════════════════════════════════════

class SectorListCreateView(generics.ListCreateAPIView):
    serializer_class = SectorSerializer
    filter_backends  = [filters.SearchFilter, DjangoFilterBackend, filters.OrderingFilter]
    search_fields    = ['sector_name', 'sector_code']
    filterset_fields = ['parent_sector']
    ordering         = ['sector_name']

    def get_queryset(self):
        qs = apply_active_filter(
            Sector.objects.all().select_related('parent_sector'),
            self.request,
        )
        if self.request.query_params.get('top_level') == 'true':
            qs = qs.filter(parent_sector__isnull=True)
        return qs

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class SectorDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SectorSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = Sector.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


class SectorDropdownView(generics.ListAPIView):
    serializer_class   = SectorDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = Sector.objects.filter(is_active=True).order_by('sector_name')
    pagination_class   = None


# ══════════════════════════════════════════════════════════════════
# ELECTRICITY CATEGORY
# ══════════════════════════════════════════════════════════════════

class ElectricityCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = ElectricityCategorySerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['sector', 'category_type']
    search_fields    = ['category_name', 'category_code']
    ordering         = ['category_name']

    def get_queryset(self):
        return apply_active_filter(
            ElectricityCategory.objects.all().select_related('sector'),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class ElectricityCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = ElectricityCategorySerializer
    permission_classes = WRITE_PERMISSION
    queryset           = ElectricityCategory.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


class ElectricityCategoryDropdownView(generics.ListAPIView):
    serializer_class   = ElectricityCategoryDropdownSerializer
    permission_classes = READ_PERMISSION
    pagination_class   = None

    def get_queryset(self):
        qs = ElectricityCategory.objects.filter(is_active=True).order_by('category_name')
        sector = self.request.query_params.get('sector')
        if sector:
            qs = qs.filter(sector=sector)
        return qs


# ══════════════════════════════════════════════════════════════════
# VEHICLE TYPE
# ══════════════════════════════════════════════════════════════════

class VehicleTypeListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleTypeSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['vehicle_category']
    search_fields    = ['vehicle_type_name', 'vehicle_type_code']
    ordering         = ['vehicle_type_name']

    def get_queryset(self):
        return apply_active_filter(
            VehicleType.objects.all(),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class VehicleTypeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = VehicleTypeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = VehicleType.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


class VehicleTypeDropdownView(generics.ListAPIView):
    serializer_class   = VehicleTypeDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = VehicleType.objects.filter(is_active=True).order_by('vehicle_type_name')
    pagination_class   = None


# ══════════════════════════════════════════════════════════════════
# MILEAGE
# ══════════════════════════════════════════════════════════════════

class MileageListCreateView(generics.ListCreateAPIView):
    serializer_class = MileageSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['vehicle_type', 'fuel_type', 'effective_year']
    ordering         = ['vehicle_type', 'fuel_type', '-effective_year']

    def get_queryset(self):
        return apply_active_filter(
            Mileage.objects.all().select_related('vehicle_type'),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class MileageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = MileageSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = Mileage.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


# ══════════════════════════════════════════════════════════════════
# BIOGAS SIZE
# ══════════════════════════════════════════════════════════════════

class BiogasSizeListCreateView(generics.ListCreateAPIView):
    serializer_class = BiogasSizeSerializer
    filter_backends  = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['production_type']
    ordering         = ['size_category']

    def get_queryset(self):
        return apply_active_filter(
            BiogasSize.objects.all(),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class BiogasSizeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = BiogasSizeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = BiogasSize.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


# ══════════════════════════════════════════════════════════════════
# SOLAR ENERGY SIZE
# ══════════════════════════════════════════════════════════════════

class SolarEnergySizeListCreateView(generics.ListCreateAPIView):
    serializer_class = SolarEnergySizeSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ['size_category', 'panel_type']
    ordering         = ['size_category']

    def get_queryset(self):
        return apply_active_filter(
            SolarEnergySize.objects.all(),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class SolarEnergySizeDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SolarEnergySizeSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = SolarEnergySize.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


# ══════════════════════════════════════════════════════════════════
# INDUSTRY CLASSIFICATION
# ══════════════════════════════════════════════════════════════════

class IndustryClassificationListCreateView(generics.ListCreateAPIView):
    serializer_class = IndustryClassificationSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category']
    search_fields    = ['classification_name', 'classification_code', 'isic_code']
    ordering         = ['classification_name']

    def get_queryset(self):
        return apply_active_filter(
            IndustryClassification.objects.all(),
            self.request,
        )

    def get_permissions(self):
        if self.request.method != 'GET':
            return [p() for p in WRITE_PERMISSION]
        return [p() for p in READ_PERMISSION]


class IndustryClassificationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = IndustryClassificationSerializer
    permission_classes = WRITE_PERMISSION
    queryset           = IndustryClassification.objects.all()

    def perform_destroy(self, instance):
        soft_or_hard_delete(instance, self.request)


class IndustryClassificationDropdownView(generics.ListAPIView):
    serializer_class   = IndustryClassificationDropdownSerializer
    permission_classes = READ_PERMISSION
    queryset           = IndustryClassification.objects.filter(is_active=True).order_by('classification_name')
    pagination_class   = None