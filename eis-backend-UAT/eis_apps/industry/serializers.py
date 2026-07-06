from rest_framework import serializers
from .models import IndustryConsumption
from eis_apps.master_data.models import IndustryClassification, FuelType, MeasurementUnit, DataCollectionYear

class IndustryConsumptionSerializer(serializers.ModelSerializer):
    classification_name = serializers.ReadOnlyField(source='classification.classification_name')
    data_source_name = serializers.ReadOnlyField(source='data_source.source_name')
    year = serializers.SlugRelatedField(
        queryset=DataCollectionYear.objects.all(),
        slug_field="year",
        error_messages={"does_not_exist": "Year {value} does not exist."},
        required=False,
        allow_null=True
    )

    class Meta:
        model = IndustryConsumption
        fields = [
            'id', 'date', 'year', 'month', 'classification', 'classification_name', 
            'name_industry', 'type_industry', 
            'coal_mt', 'diesel_lt', 'electricity_kWh', 'kerosene_lt', 
            'semicoke_mt', 'furnace_oil_lt', 'lubricants_lt', 'woodchips_mt', 
            'charcoal_mt', 'coke_lamc_mt', 'bamboo_mt', 'limestone_mt', 
            'dolomite_mt', 'sawdust_mt', 'briquettes_mt',
            'data_source', 'data_source_name',
            'remarks', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


