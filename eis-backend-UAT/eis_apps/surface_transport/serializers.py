from rest_framework import serializers
from eis_apps.master_data.models import VehicleType, VehicleFuelType, Dzongkhag, DataCollectionYear
from .models import TransportConsumption, VehicleRegistration

class TransportConsumptionSerializer(serializers.ModelSerializer):
    year = serializers.SlugRelatedField(
        queryset=DataCollectionYear.objects.all(),
        slug_field="year",
        error_messages={"does_not_exist": "Year {value} does not exist."}
    )
    vehicle_type_name = serializers.ReadOnlyField(source='vehicle_type.vehicle_type_name')
    fuel_type_name = serializers.ReadOnlyField(source='fuel_type.fuel_name')
    
    class Meta:
        model = TransportConsumption
        fields = [
            'id', 'year', 'month', 'vehicle_type', 'vehicle_type_name', 
            'fuel_type', 'fuel_type_name', 'odometer_reading', 
            'fuel_consumed_calculated', 'original_vehicle_type', 
            'gross_weight', 'data_source', 'remarks', 
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']



class VehicleRegistrationSerializer(serializers.ModelSerializer):
    vehicle_type_name = serializers.ReadOnlyField(source='vehicle_type.vehicle_type_name')
    vehicle_type_parent_name = serializers.ReadOnlyField(source='vehicle_type.parent.vehicle_type_name')
    fuel_type_name = serializers.ReadOnlyField(source='fuel_type.fuel_name')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = VehicleRegistration
        fields = [
            'id',
            'registration_no',
            'initial_registration_date',
            'owner_type',
            'vehicle_type', 'vehicle_type_name', 'vehicle_type_parent_name',
            'model_name',
            'seating_capacity',
            'engine_cc',
            'horse_power',
            'kilo_watt_hour',
            'gross_vehicle_weight',
            'fuel_type', 'fuel_type_name',
            'status', 'status_display',
            'remarks',
            'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

