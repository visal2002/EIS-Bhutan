from rest_framework import serializers
from .models import CoalData

class CoalDataSerializer(serializers.ModelSerializer):
    data_type_display = serializers.CharField(source='get_data_type_display', read_only=True)
    coal_type_name = serializers.CharField(source='coal_type.fuel_name', read_only=True)
    
    class Meta:
        model = CoalData
        fields = [
            'id', 'year', 'month', 'data_type', 'data_type_display', 
            'date', 'source', 'quantity_mt', 'destination', 'mineral_type', 'coal_type', 'coal_type_name',
            'data_source', 'remarks', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
