from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from .models import AircraftActivity, AviationFuelConsumption
from .serializers import AircraftActivitySerializer, AviationFuelConsumptionSerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    return qs

# --- Aircraft Activity Views ---
class AircraftActivityListCreateView(generics.ListCreateAPIView):
    serializer_class = AircraftActivitySerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["airlines", "aircraft_type"]
    search_fields    = ["airlines", "aircraft_type", "remarks"]
    ordering         = ["-date", "airlines"]

    def get_queryset(self):
        qs = AircraftActivity.objects.all()
        trashed = self.request.query_params.get("trashed") == "true"
        if hasattr(AircraftActivity, "is_active"):
            qs = qs.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class AircraftActivityDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = AircraftActivitySerializer
    permission_classes = WRITE
    queryset           = AircraftActivity.objects.all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


# --- Aviation Fuel Consumption Views ---
class AviationFuelConsumptionListCreateView(generics.ListCreateAPIView):
    serializer_class = AviationFuelConsumptionSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["airlines", "aircraft_type"]
    search_fields    = ["airlines", "aircraft_type", "remarks"]
    ordering         = ["-date", "airlines"]


    def get_queryset(self):
        qs = AviationFuelConsumption.objects.all()
        trashed = self.request.query_params.get("trashed") == "true"
        if hasattr(AviationFuelConsumption, "is_active"):
            qs = qs.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class AviationFuelConsumptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = AviationFuelConsumptionSerializer
    permission_classes = WRITE
    queryset           = AviationFuelConsumption.objects.all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])

