import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove

from .models import CoalData
from .serializers import CoalDataSerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    coal_type = request.query_params.get("coal_type")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    if coal_type: qs = qs.filter(coal_type=coal_type)
    return qs

class CoalDataListCreateView(generics.ListCreateAPIView):
    serializer_class = CoalDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["data_type", "coal_type__fuel_name", "source", "remarks"]
    ordering         = ["-date", "-created_at"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        qs = CoalData.objects.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class CoalProductionView(CoalDataListCreateView):
    def get_queryset(self):
        return super().get_queryset().filter(data_type="PRODUCTION")
    def perform_create(self, s):
        s.save(data_type="PRODUCTION", created_by=self.request.user, updated_by=self.request.user)

class CoalImportView(CoalDataListCreateView):
    def get_queryset(self):
        return super().get_queryset().filter(data_type="IMPORT")
    def perform_create(self, s):
        s.save(data_type="IMPORT", created_by=self.request.user, updated_by=self.request.user)

class CoalConsumptionView(CoalDataListCreateView):
    def get_queryset(self):
        return super().get_queryset().filter(data_type="CONSUMPTION")
    def perform_create(self, s):
        s.save(data_type="CONSUMPTION", created_by=self.request.user, updated_by=self.request.user)

class CoalTradeView(CoalDataListCreateView):
    def get_queryset(self):
        return super().get_queryset().filter(data_type="EXPORT")
    def perform_create(self, s):
        s.save(data_type="EXPORT", created_by=self.request.user, updated_by=self.request.user)


class CoalDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = CoalDataSerializer
    permission_classes = WRITE
    queryset           = CoalData.objects.all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class CoalDataBulkImportView(APIView):
    parser_classes     = [MultiPartParser, FormParser]
    permission_classes = WRITE

    def post(self, request):
        file_obj = request.FILES.get("file")
        if not file_obj:
            return Response({"detail": "No file provided."}, status=400)
        try:
            raw  = file_obj.read()
            if raw.startswith(codecs.BOM_UTF8): raw = raw[len(codecs.BOM_UTF8):]
            text = raw.decode("utf-8-sig", errors="replace")
            rows = list(csv.DictReader(io.StringIO(text)))
        except Exception as e:
            return Response({"detail": f"Failed to read CSV: {e}"}, status=400)

        results = {"total": len(rows), "created": 0, "failed": 0, "errors": []}

        for i, row in enumerate(rows, start=2):
            try:
                year  = int(str(row.get("year", "")).strip())
                month_raw = str(row.get("month", "")).strip()
                month = int(month_raw) if month_raw else None

                obj = CoalData(
                    year=year,
                    month=month,
                    data_type=str(row.get("data_type", "PRODUCTION")).strip().upper(),
                    category=str(row.get("category", "")).strip(),
                    quantity=float(str(row.get("quantity", "0")).strip()),
                    unit=str(row.get("unit", "MT")).strip(),
                    data_source=str(row.get("data_source", "EXCEL")).strip().upper(),
                    remarks=str(row.get("remarks", "")).strip(),
                    created_by=request.user,
                    updated_by=request.user,
                )
                obj.save()
                results["created"] += 1
            except Exception as e:
                results["failed"] += 1
                results["errors"].append({
                    "row": i, "data": dict(row),
                    "errors": {"_error": str(e)[:200]},
                })

        return Response(results, status=200)
