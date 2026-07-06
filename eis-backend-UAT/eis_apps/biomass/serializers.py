from rest_framework import serializers
from .models import BiogasData, BriquetteCharcoal
from eis_apps.master_data.models import BiogasSize, Sector, MeasurementUnit

class BiogasDataSerializer(serializers.ModelSerializer):
    biogas_size_name = serializers.ReadOnlyField(source='biogas_size.size_category')
    sector_name = serializers.ReadOnlyField(source='sector.sector_name')
    dzongkhag_display = serializers.CharField(source='get_dzongkhag_display', read_only=True)
    
    class Meta:
        model = BiogasData
        fields = [
            'id', 'year', 'month', 'date', 'biogas_size', 'biogas_size_name', 
            'sector', 'sector_name', 'number_of_plants', 'dzongkhag', 
            'dzongkhag_display', 'data_source', 'remarks', 
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

class BriquetteCharcoalSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='type.fuel_name', read_only=True)
    unit = serializers.SlugRelatedField(slug_field='unit_code', queryset=MeasurementUnit.objects.all())
    
    class Meta:
        model = BriquetteCharcoal
        fields = [
            'id', 'year', 'month', 'date', 'type', 'type_display', 
            'quantity', 'unit', 'data_source', 'remarks', 
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
