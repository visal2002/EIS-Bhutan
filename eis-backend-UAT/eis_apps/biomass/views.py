import csv, io, codecs
from rest_framework import generics, filters, status
from django.utils import timezone
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from eis_apps.authentication.permissions import IsDataFocalOrAbove, IsViewerOrAbove
from eis_apps.master_data.models import BiogasSize, Sector, FuelType

from .models import BiogasData, BriquetteCharcoal
from .serializers import BiogasDataSerializer, BriquetteCharcoalSerializer

READ  = [IsAuthenticated, IsViewerOrAbove]
WRITE = [IsAuthenticated, IsDataFocalOrAbove]

def _year_filter(qs, request):
    year  = request.query_params.get("year")
    month = request.query_params.get("month")
    if year:  qs = qs.filter(year__year=year)
    if month: qs = qs.filter(month=month)
    return qs

# ── BIOGAS DATA ──────────────────────────────────────────────────────────────

class BiogasDataListCreateView(generics.ListCreateAPIView):
    serializer_class = BiogasDataSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["biogas_size__size_category", "sector__sector_name", "dzongkhag", "remarks"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        return _year_filter(BiogasData.objects.select_related("biogas_size", "sector").all(), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        s.save(created_by=self.request.user, updated_by=self.request.user)

class BiogasDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BiogasDataSerializer
    permission_classes = WRITE
    queryset           = BiogasData.objects.select_related("biogas_size", "sector").all()

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


class BiogasDataBulkImportView(APIView):
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

        size_map = {s.size_category.upper(): s for s in BiogasSize.objects.all()}
        sector_map = {s.sector_name.upper(): s for s in Sector.objects.all()}
        results = {"total": len(rows), "created": 0, "failed": 0, "errors": []}

        for i, row in enumerate(rows, start=2):
            try:
                sz_name = str(row.get("biogas_size", "")).strip().upper()
                bsize = size_map.get(sz_name)
                if not bsize:
                    raise ValueError(f"Biogas Size '{sz_name}' not found")
                
                sname = str(row.get("sector", "")).strip().upper()
                sector = sector_map.get(sname)
                if not sector:
                    raise ValueError(f"Sector '{sname}' not found")

                year  = int(str(row.get("year", "")).strip())
                month_raw = str(row.get("month", "")).strip()
                month = int(month_raw) if month_raw else None

                obj = BiogasData(
                    year=year,
                    month=month,
                    biogas_size=bsize,
                    sector=sector,
                    number_of_plants=int(str(row.get("number_of_plants", "0")).strip()),
                    dzongkhag=str(row.get("dzongkhag", "")).strip().lower(),
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

# ── BRIQUETTE / CHARCOAL ─────────────────────────────────────────────────────

# ── BRIQUETTE ───────────────────────────────────────────────────────────────

class BriquetteDataListCreateView(generics.ListCreateAPIView):
    serializer_class = BriquetteCharcoalSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["unit__unit_code", "remarks"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return _year_filter(BriquetteCharcoal.objects.filter(is_active=not trashed, type__fuel_code="BRIQUETTE"), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        fuel = FuelType.objects.filter(fuel_code="BRIQUETTE").first()
        s.save(type=fuel, created_by=self.request.user, updated_by=self.request.user)


class BriquetteDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BriquetteCharcoalSerializer
    permission_classes = WRITE
    queryset           = BriquetteCharcoal.objects.filter(type__fuel_code="BRIQUETTE")

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])


# ── CHARCOAL ─────────────────────────────────────────────────────────────────

class CharcoalDataListCreateView(generics.ListCreateAPIView):
    serializer_class = BriquetteCharcoalSerializer
    filter_backends  = [filters.SearchFilter, filters.OrderingFilter]
    search_fields    = ["unit__unit_code", "remarks"]
    ordering         = ["-year", "-month"]

    def get_queryset(self):
        trashed = self.request.query_params.get("trashed") == "true"
        return _year_filter(BriquetteCharcoal.objects.filter(is_active=not trashed, type__fuel_code="CHA-COA"), self.request)

    def get_permissions(self):
        return [p() for p in (WRITE if self.request.method != "GET" else READ)]

    def perform_create(self, s):
        fuel = FuelType.objects.filter(fuel_code="CHA-COA").first()
        s.save(type=fuel, created_by=self.request.user, updated_by=self.request.user)


class CharcoalDataDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class   = BriquetteCharcoalSerializer
    permission_classes = WRITE
    queryset           = BriquetteCharcoal.objects.filter(type__fuel_code="CHA-COA")

    def perform_update(self, s):
        s.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        if self.request.query_params.get("hard") == "1":
            instance.delete()
        else:
            instance.is_active = False
            instance.deactivated_at = timezone.now()
            instance.save(update_fields=["is_active", "deactivated_at"])
