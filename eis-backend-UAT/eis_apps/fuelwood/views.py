from rest_framework import generics, filters
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from .models import FuelwoodSupply, FuelwoodConsumption
from .serializers import FuelwoodSupplySerializer, FuelwoodConsumptionSerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    return qs

# ── FUELWOOD SUPPLY ──────────────────────────────────────────────────────────

class FuelwoodSupplyListCreateView(generics.ListCreateAPIView):
    serializer_class = FuelwoodSupplySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["office", "dzongkhag__dzongkhag", "purpose", "remarks"]
    ordering         = ["-permit_date", "office"]

    def get_queryset(self):
        return _year_filter(FuelwoodSupply.objects.select_related("dzongkhag").all(), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)


class FuelwoodSupplyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = FuelwoodSupplySerializer
    permission_classes = WRITE
    queryset           = FuelwoodSupply.objects.select_related("dzongkhag").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


# ── FUELWOOD CONSUMPTION ──────────────────────────────────────────────────────

class FuelwoodConsumptionListCreateView(generics.ListCreateAPIView):
    serializer_class = FuelwoodConsumptionSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["office", "dzongkhag__dzongkhag", "purpose", "purpose_group", "remarks"]
    ordering         = ["-permit_date", "office"]

    def get_queryset(self):
        return _year_filter(FuelwoodConsumption.objects.select_related("dzongkhag").all(), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)


class FuelwoodConsumptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = FuelwoodConsumptionSerializer
    permission_classes = WRITE
    queryset           = FuelwoodConsumption.objects.select_related("dzongkhag").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])

