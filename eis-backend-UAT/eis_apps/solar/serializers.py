from rest_framework import serializers
from .models import SolarEnergy
from eis_apps.master_data.models import SolarEnergySize

class SolarEnergySerializer(serializers.ModelSerializer):
    solar_size_name = serializers.ReadOnlyField(source='solar_size.size_category')
    dzongkhag_display = serializers.CharField(source='get_dzongkhag_display', read_only=True)
    
    class Meta:
        model = SolarEnergy
        fields = [
            'id', 'year', 'month', 'solar_size', 'solar_size_name', 
            'solar_type', 'dzongkhag', 'dzongkhag_display', 
            'energy_kwh', 'data_source', 'remarks', 
            'created_at', 'updated_at'
        'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']
