from rest_framework import serializers
from eis_apps.master_data.models import DataCollectionYear
from .models import AircraftActivity, AviationFuelConsumption

class AircraftActivitySerializer(serializers.ModelSerializer):
    year = serializers.SlugRelatedField(
        queryset=DataCollectionYear.objects.all(),
        slug_field="year",
        error_messages={"does_not_exist": "Year {value} does not exist."},
        required=False,
        allow_null=True
    )

    class Meta:
        model = AircraftActivity
        fields = [
            'id', 'date', 'year', 'month', 'day', 'airlines', 'aircraft_type', 
            'no_of_flights_operating_per_day', 
            'domestic_landings', 'international_landings',
            'domestic_takeoffs', 'international_takeoffs',
            'data_source', 'remarks', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AviationFuelConsumptionSerializer(serializers.ModelSerializer):
    year = serializers.SlugRelatedField(
        queryset=DataCollectionYear.objects.all(),
        slug_field="year",
        error_messages={"does_not_exist": "Year {value} does not exist."},
        required=False,
        allow_null=True
    )

    class Meta:
        model = AviationFuelConsumption
        fields = [
            'id', 'date', 'year', 'month', 'day', 'airlines', 'aircraft_type', 
            'domestic_fuel_consumption', 'international_fuel_consumption',
            'data_source', 'remarks', 'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']



