import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import SolarEnergySize

from .models import SolarEnergy
from .serializers import SolarEnergySerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year=year)
    if month: qs = qs.filter(month=month)
    return qs

class SolarEnergyListCreateView(generics.ListCreateAPIView):
    serializer_class = SolarEnergySerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["solar_type", "dzongkhag", "remarks"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        return _year_filter(SolarEnergy.objects.select_related("solar_size").all(), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class SolarEnergyDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = SolarEnergySerializer
    permission_classes = WRITE
    queryset           = SolarEnergy.objects.select_related("solar_size").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class SolarEnergyBulkImportView(APIView):
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

        size_map = {s.size_category.upper(): s for s in SolarEnergySize.objects.all()}
        results = {"total": len(rows), "created": 0, "failed": 0, "errors": []}

        for i, row in enumerate(rows, start=2):
            try:
                sname = str(row.get("solar_size", "")).strip().upper()
                ssize = size_map.get(sname)
                if not ssize:
                    raise ValueError(f"Solar Size '{sname}' not found")
                
                year  = int(str(row.get("year", "")).strip())
                month_raw = str(row.get("month", "")).strip()
                month = int(month_raw) if month_raw else None

                obj = SolarEnergy(
                    year=year,
                    month=month,
                    solar_size=ssize,
                    solar_type=str(row.get("solar_type", "UTILITY")).strip().upper(),
                    dzongkhag=str(row.get("dzongkhag", "")).strip().lower(),
                    energy_kwh=float(str(row.get("energy_kwh", "0")).strip()),
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
