import csv, io, codecs
from rest_framework import generics, filters, status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import VehicleType, VehicleFuelType

from .models import TransportConsumption, VehicleRegistration
from .serializers import (
    TransportConsumptionSerializer, VehicleRegistrationSerializer
)
from django.utils import timezone

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    return qs

# ── TRANSPORT CONSUMPTION ───────────────────────────────────────────────────

class TransportConsumptionListCreateView(generics.ListCreateAPIView):
    serializer_class = TransportConsumptionSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["vehicle_type", "fuel_type"]
    search_fields    = ["vehicle_type__vehicle_type_name", "original_vehicle_type"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        qs = TransportConsumption.objects.select_related("vehicle_type", "fuel_type").all()
        trashed = self.request.query_params.get("trashed") == "true"
        if hasattr(TransportConsumption, "is_active"):
            qs = qs.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class TransportConsumptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = TransportConsumptionSerializer
    permission_classes = WRITE
    queryset           = TransportConsumption.objects.select_related("vehicle_type", "fuel_type").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


# ── VEHICLE REGISTRATION ────────────────────────────────────────────────────

class VehicleRegistrationListCreateView(generics.ListCreateAPIView):
    serializer_class = VehicleRegistrationSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["status", "fuel_type", "vehicle_type", "owner_type"]
    search_fields    = [
        "registration_no",
        "owner_type",
        "vehicle_type__vehicle_type_name",
        "model_name",
        "fuel_type__fuel_name",
        "status",
        "remarks",
    ]
    ordering = ["-initial_registration_date"]

    def get_queryset(self):
        qs = VehicleRegistration.objects.select_related(
            "vehicle_type", "vehicle_type__parent", "fuel_type"
        ).all()
        trashed = self.request.query_params.get("trashed") == "true"
        if hasattr(VehicleRegistration, "is_active"):
            qs = qs.filter(is_active=not trashed)
            
        year = self.request.query_params.get("year")
        month = self.request.query_params.get("month")
        if year:
            qs = qs.filter(initial_registration_date__year=year)
        if month:
            qs = qs.filter(initial_registration_date__month=month)
            
        return qs

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)


class VehicleRegistrationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = VehicleRegistrationSerializer
    permission_classes = WRITE
    queryset           = VehicleRegistration.objects.select_related(
        "vehicle_type", "vehicle_type__parent", "fuel_type"
    ).all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])

