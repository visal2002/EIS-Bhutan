from rest_framework import serializers
from .models import FuelwoodSupply, FuelwoodConsumption

class FuelwoodSupplySerializer(serializers.ModelSerializer):
    dzongkhag_display = serializers.CharField(source='dzongkhag.dzongkhag', read_only=True)
    year_val = serializers.IntegerField(source='year.year', read_only=True, allow_null=True)
    
    class Meta:
        model = FuelwoodSupply
        fields = [
            'id', 'year', 'year_val', 'month', 'day', 'permit_date', 
            'office', 'dzongkhag', 'dzongkhag_display', 'purpose', 
            'quantity_m3', 'data_source', 'remarks', 'is_active', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class FuelwoodConsumptionSerializer(serializers.ModelSerializer):
    dzongkhag_display = serializers.CharField(source='dzongkhag.dzongkhag', read_only=True)
    year_val = serializers.IntegerField(source='year.year', read_only=True, allow_null=True)
    
    class Meta:
        model = FuelwoodConsumption
        fields = [
            'id', 'year', 'year_val', 'month', 'day', 'permit_date', 
            'office', 'dzongkhag', 'dzongkhag_display', 'purpose', 
            'purpose_group', 'quantity_m3', 'data_source', 'remarks', 
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

