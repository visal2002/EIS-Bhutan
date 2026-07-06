import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import IndustryClassification

from .models import IndustryConsumption
from .serializers import IndustryConsumptionSerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

from django_filters.rest_framework import DjangoFilterBackend

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    return qs

class IndustryConsumptionListCreateView(generics.ListCreateAPIView):
    serializer_class = IndustryConsumptionSerializer
    filter_backends  = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ["classification"]
    search_fields    = ["classification__classification_name", "name_industry", "type_industry", "remarks"]
    ordering         = ["-date", "name_industry"]


    def get_queryset(self):
        qs = IndustryConsumption.objects.select_related("classification", "data_source").all()
        trashed = self.request.query_params.get("trashed") == "true"
        if hasattr(IndustryConsumption, "is_active"):
            qs = qs.filter(is_active=not trashed)
        return _year_filter(qs, self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)


class IndustryConsumptionDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = IndustryConsumptionSerializer
    permission_classes = WRITE
    queryset           = IndustryConsumption.objects.select_related("classification", "data_source").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])



class IndustryConsumptionBulkImportView(APIView):
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

        class_map = {c.classification_name.upper(): c for c in IndustryClassification.objects.all()}
        results = {"total": len(rows), "created": 0, "failed": 0, "errors": []}

        for i, row in enumerate(rows, start=2):
            try:
                cl_name = str(row.get("classification", "")).strip().upper()
                classification = class_map.get(cl_name)
                if not classification:
                    raise ValueError(f"Industry Classification '{cl_name}' not found")
                
                year  = int(str(row.get("year", "")).strip())
                month_raw = str(row.get("month", "")).strip()
                month = int(month_raw) if month_raw else None

                obj = IndustryConsumption(
                    year=year,
                    month=month,
                    classification=classification,
                    industry_category=str(row.get("industry_category", "")).strip(),
                    consumption_type=str(row.get("consumption_type", "ELECTRICITY")).strip().upper(),
                    energy_consumption=float(str(row.get("energy_consumption", "0")).strip()),
                    unit=str(row.get("unit", "")).strip(),
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
