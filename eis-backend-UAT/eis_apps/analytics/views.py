from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import WidgetLibrary, UserDashboard
from .serializers import WidgetLibrarySerializer, UserDashboardSerializer
from .service import AggregationService

class AnalyticsDiscoveryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        discovery_data = AggregationService.get_analyzable_models()
        return Response(discovery_data)

class DynamicDataView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        model_key = request.query_params.get("model")
        metric_field = request.query_params.get("metric")
        group_by = request.query_params.get("group_by")
        
        if not all([model_key, metric_field, group_by]):
            return Response({"error": "Missing required parameters"}, status=status.HTTP_400_BAD_REQUEST)

        # Filters: exclude model, metric, group_by
        filters = {k: v for k, v in request.query_params.items() if k not in ["model", "metric", "group_by"]}
        
        data = AggregationService.aggregate_data(model_key, metric_field, group_by, filters)
        return Response(data)

class WidgetLibraryListView(generics.ListAPIView):
    queryset = WidgetLibrary.objects.filter(is_active=True)
    serializer_class = WidgetLibrarySerializer
    permission_classes = [permissions.IsAuthenticated]

class UserDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        dashboard, created = UserDashboard.objects.get_or_create(
            user=request.user,
            is_primary=True
        )
        serializer = UserDashboardSerializer(dashboard)
        return Response(serializer.data)

    def post(self, request):
        dashboard, created = UserDashboard.objects.get_or_create(
            user=request.user,
            is_primary=True
        )
        serializer = UserDashboardSerializer(dashboard, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save(updated_by=request.user)
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
