from rest_framework import serializers
from .models import POLImportExport, POLAviation
from eis_apps.master_data.models import Sector

class POLImportExportSerializer(serializers.ModelSerializer):
    class Meta:
        model = POLImportExport
        fields = [
            'id', 'year', 'month', 'transaction_type', 'data_source', 'remarks', 
            'rrco_office', 'customs_office', 'declaration_number', 'declaration_date',
            'importer_tpn', 'importer_name', 'exporter_name', 'country_of_exportation',
            'country_of_origin', 'vehicle_number', 'invoice_number', 'invoice_date',
            'btc_chapter', 'btc_code', 'full_description', 'standard_unit_id',
            'quantity', 'customs_value_nu', 'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'rrco_office': {'required': True, 'allow_null': False, 'allow_blank': False},
            'customs_office': {'required': True, 'allow_null': False, 'allow_blank': False},
            'declaration_date': {'required': True, 'allow_null': False},
            'importer_name': {'required': True, 'allow_null': False, 'allow_blank': False},
            'country_of_exportation': {'required': True, 'allow_null': False, 'allow_blank': False},
            'country_of_origin': {'required': True, 'allow_null': False, 'allow_blank': False},
            'btc_code': {'required': True, 'allow_null': False, 'allow_blank': False},
            'full_description': {'required': True, 'allow_null': False, 'allow_blank': False},
            'standard_unit_id': {'required': True, 'allow_null': False, 'allow_blank': False},
            'quantity': {'required': True, 'allow_null': False},
            'customs_value_nu': {'required': True, 'allow_null': False},
        }

    def validate(self, data):
        from decimal import Decimal, ROUND_HALF_UP
        if 'quantity' in data and data['quantity'] is not None:
            data['quantity'] = data['quantity'].quantize(Decimal('0.0001'), rounding=ROUND_HALF_UP)
        if 'customs_value_nu' in data and data['customs_value_nu'] is not None:
            data['customs_value_nu'] = data['customs_value_nu'].quantize(Decimal('0.000001'), rounding=ROUND_HALF_UP)
        return data

class POLAviationSerializer(serializers.ModelSerializer):
    sector_name = serializers.ReadOnlyField(source='sector.sector_name')
    
    class Meta:
        model = POLAviation
        fields = [
            'id', 'year', 'month', 'sector', 'sector_name', 
            'quantity_kl', 'unit', 'data_source', 'remarks', 
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
