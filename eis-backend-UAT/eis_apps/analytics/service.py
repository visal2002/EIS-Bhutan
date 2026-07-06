import django.apps
from django.db.models import Sum, Avg, Count
from django.core.exceptions import FieldError
from eis_core.models import EnergyDataModel

class AggregationService:
    @staticmethod
    def get_analyzable_models():
        """
        Discovery: Returns a registry of all models inheriting from EnergyDataModel.
        Format: { 'app_label.ModelName': { 'verbose_name': '...', 'fields': [...] } }
        """
        registry = {}
        for model in django.apps.apps.get_models():
            if issubclass(model, EnergyDataModel) and not model._meta.abstract:
                key = f"{model._meta.app_label}.{model.__name__}"
                
                # Extract numeric fields for aggregation and grouping fields
                fields = []
                for field in model._meta.get_fields():
                    # We only care about fields likely used for grouping or values
                    if field.name in ['id', 'created_at', 'updated_at', 'created_by', 'updated_by']:
                        continue
                        
                    field_type = field.get_internal_type()
                    is_numeric = any(t in field_type for t in ['Decimal', 'Integer', 'Float'])
                    is_relation = field.is_relation
                    
                    fields.append({
                        "name": field.name,
                        "label": field.verbose_name.title() if hasattr(field, 'verbose_name') else field.name,
                        "type": field_type,
                        "is_numeric": is_numeric,
                        "is_relation": is_relation
                    })
                
                registry[key] = {
                    "verbose_name": model._meta.verbose_name.title() if hasattr(model._meta, 'verbose_name') else model.__name__,
                    "fields": fields
                }
        return registry

    @staticmethod
    def aggregate_data(model_key, metric_field, group_by_field, filters=None):
        """
        Performs dynamic aggregation.
        model_key: e.g., 'electricity.ElectricityGeneration'
        metric_field: The field to SUM (e.g., 'quantity_gwh')
        group_by_field: The field to group by (e.g., 'dzongkhag__dzongkhag')
        filters: dict of filters (e.g., {'year': '2024'})
        """
        try:
            app_label, model_name = model_key.split('.')
            model = django.apps.apps.get_model(app_label, model_name)
        except (ValueError, LookupError):
            return {"error": f"Model {model_key} not found"}

        queryset = model.objects.all()
        if filters:
            queryset = queryset.filter(**filters)

        # Handle relation grouping safely
        # If group_by_field doesn't contain __, check if it's a relation
        final_group_by = group_by_field
        if '__' not in group_by_field:
            field = model._meta.get_field(group_by_field)
            if field.is_relation:
                # Try to guess a name field or use PK
                remote_model = field.related_model
                name_fields = [f.name for f in remote_model._meta.get_fields() if 'name' in f.name]
                if name_fields:
                    final_group_by = f"{group_by_field}__{name_fields[0]}"

        try:
            results = queryset.values(final_group_by).annotate(
                value=Sum(metric_field)
            ).order_by('-value')
            
            # Reformat for frontend charts
            return [
                {"label": str(item[final_group_by]) if item[final_group_by] else "Unknown", "value": float(item['value'] or 0)}
                for item in results
            ]
        except FieldError as e:
            return {"error": str(e)}
        except Exception as e:
            return {"error": "An unexpected error occurred during aggregation"}
