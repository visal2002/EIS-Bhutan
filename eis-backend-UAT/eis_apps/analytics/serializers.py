from rest_framework import serializers
from .models import WidgetLibrary, UserDashboard

class WidgetLibrarySerializer(serializers.ModelSerializer):
    class Meta:
        model = WidgetLibrary
        fields = '__all__'

class UserDashboardSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserDashboard
        fields = ['id', 'layout_config', 'is_primary']
