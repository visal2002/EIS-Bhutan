import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import Sector

from .models import POLImportExport, POLAviation
from .serializers import (
    POLImportExportSerializer, POLAviationSerializer
)

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year=year)
    if month: qs = qs.filter(month=month)
    return qs

# ── POL IMPORT/EXPORT ────────────────────────────────────────────────────────

class POLImportExportListCreateView(generics.ListCreateAPIView):
    serializer_class = POLImportExportSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["importer_name", "exporter_name", "btc_code", "full_description", "transaction_type"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        qs = POLImportExport.objects.all()
        tt = self.request.query_params.get("transaction_type")
        if tt:
            qs = qs.filter(transaction_type=tt.upper())
        trashed = self.request.query_params.get("trashed") == "true"
        qs = qs.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class POLImportExportDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = POLImportExportSerializer
    permission_classes = WRITE
    queryset           = POLImportExport.objects.all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

# ── POL AVIATION ─────────────────────────────────────────────────────────────

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class POLAviationListCreateView(generics.ListCreateAPIView):
    serializer_class = POLAviationSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["sector__sector_name", "remarks"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        return _year_filter(POLAviation.objects.select_related("sector").all(), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class POLAviationDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = POLAviationSerializer
    permission_classes = WRITE
    queryset           = POLAviation.objects.select_related("sector").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])

