import pandas as pd
import io
import time
from decimal import Decimal
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework import parsers

class BaseBulkImportView(APIView):
    """
    Standardized Enterprise Import Engine.
    Supports file uploads (Excel/CSV) and streaming JSON batch payloads.
    """
    parser_classes = [MultiPartParser, FormParser, parsers.JSONParser]
    
    # Required in subclasses
    model = None
    serializer_class = None
    column_mapping = {} # {'Excel Header': 'model_field'}
    
    def post(self, request, *args, **kwargs):
        from eis_apps.administration.models import BulkImportJob
        import threading
        import json
        
        # Resolve string model/serializer_class
        if isinstance(self.model, str):
            from django.apps import apps
            self.model = apps.get_model(self.model)
        if isinstance(self.serializer_class, str):
            from django.utils.module_loading import import_string
            self.serializer_class = import_string(self.serializer_class)
            
        mode = request.data.get("mode", "create_only")
        default_plant_id = request.data.get("default_plant_id")  # Optional plant override
        header_mapping = {}
        if "header_mapping" in request.data:
            try:
                header_mapping = json.loads(request.data["header_mapping"])
            except:
                pass
        
        # 1. Parse Payload
        rows_data = request.data.get("rows")
        if rows_data and isinstance(rows_data, list):
            df = pd.DataFrame(rows_data)
            df = df.where(pd.notnull(df), None)
            filename = "JSON Batch"
        else:
            file_obj = request.FILES.get("file")
            if not file_obj:
                return Response({"detail": "No file or rows provided."}, status=400)
            filename = file_obj.name
            try:
                if filename.endswith(".csv"):
                    df = pd.read_csv(io.BytesIO(file_obj.read()), dtype=str)
                else:
                    df = pd.read_excel(io.BytesIO(file_obj.read()), dtype=str)
                    
                df.columns = [str(c).strip() for c in df.columns]
                # Apply header mapping
                if header_mapping:
                    inverted_mapping = {v: k for k, v in header_mapping.items()}
                    df = df.rename(columns=inverted_mapping)
                    
                df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
                df = df.where(pd.notnull(df), None)
            except Exception as e:
                return Response({"detail": f"Failed to read file: {str(e)}"}, status=400)

        # 2. Create Job Record
        total_rows = len(df)
        base_module = f"{self.model._meta.app_label}.{self.model.__name__}"
        params = {}
        for param_key in ["transaction_type", "data_type"]:
            val = request.data.get(param_key) or request.query_params.get(param_key)
            if val:
                params[param_key] = str(val).upper()
        if params:
            from urllib.parse import urlencode
            module_name = f"{base_module}?{urlencode(params)}"
        else:
            module_name = base_module
            
        job = BulkImportJob.objects.create(
            module_name=module_name,
            total_rows=total_rows,
            original_filename=filename,
            created_by=request.user,
            status='processing'
        )
        if file_obj:
            job.file = file_obj
            job.save()
        
        # Clean request data for MockRequest (keep only primitive types)
        req_data = {}
        for k, v in request.data.items():
            if isinstance(v, (str, int, float, bool)):
                req_data[k] = v
                
        # 3. Spawn background thread for row processing
        # We pass df, mode, request.user down
        user = request.user
        
        def run_import():
            from django.db import close_old_connections
            close_old_connections()
            
            class MockRequest:
                def __init__(self, user, default_plant_id=None, data=None, path=None):
                    self.user = user
                    self.default_plant_id = default_plant_id
                    self.data = data or {}
                    self.path = path
            mock_request = MockRequest(user, default_plant_id=default_plant_id, data=req_data, path=request.path)
            
            processed_count = 0
            error_count = 0
            
            # If job is already partially processed (e.g., resumed), slice df
            if job.processed_rows > 0:
                df_to_process = df.iloc[job.processed_rows:]
                processed_count = job.processed_rows
                error_count = job.error_count
            else:
                df_to_process = df
            
            try:
                for index, row in df_to_process.iterrows():
                    row_num = row.get("_row", index + 2) if "_row" in row else index + 2
                    
                    try:
                        data = self.process_row(row, mock_request)
                        existing = self.lookup_existing(data) if mode == "create_and_update" else None
                        
                        if existing:
                            serializer = self.serializer_class(existing, data=data, partial=True)
                            if serializer.is_valid():
                                serializer.save(updated_by=user)
                            else:
                                raise ValueError(serializer.errors)
                        else:
                            serializer = self.serializer_class(data=data)
                            if serializer.is_valid():
                                serializer.save(created_by=user, updated_by=user)
                            else:
                                raise ValueError(serializer.errors)
                                
                    except Exception as e:
                        error_count += 1
                        err_msg = e.args[0] if len(e.args) > 0 else str(e)
                        if not isinstance(err_msg, dict):
                            err_msg = {"_error": str(err_msg)}
                            
                        row_dict = row.to_dict()
                        for k,v in row_dict.items():
                            if pd.isna(v): row_dict[k] = None
                            
                        from eis_apps.administration.models import BulkImportError
                        BulkImportError.objects.create(
                            job=job,
                            row_index=row_num,
                            raw_data=row_dict,
                            error_message=err_msg
                        )
                    
                    processed_count += 1
                    
                    if processed_count % 100 == 0:
                        job.refresh_from_db()
                        
                        while job.status == 'paused':
                            time.sleep(2)
                            job.refresh_from_db()
                            
                        if job.status == 'stopped':
                            break

                        job.processed_rows = processed_count
                        job.error_count = error_count
                        job.save(update_fields=['processed_rows', 'error_count'])
                        close_old_connections()
                
                if job.status != 'stopped':
                    job.status = 'completed'
                
            except Exception as e:
                job.status = 'failed'
                from eis_apps.administration.models import BulkImportError
                BulkImportError.objects.create(
                    job=job,
                    row_index=-1,
                    raw_data={},
                    error_message={"_fatal": str(e)}
                )
                
            finally:
                job.processed_rows = processed_count
                job.error_count = error_count
                job.save()
                close_old_connections()

        thread = threading.Thread(target=run_import)
        thread.daemon = True
        thread.start()
        
        return Response({"detail": "Import started successfully", "job_id": job.id})

    @classmethod
    def get_dataframe_from_file(cls, file_path):
        import pandas as pd
        import io
        try:
            with open(file_path, 'rb') as f:
                content = f.read()
            if file_path.endswith(".csv"):
                df = pd.read_csv(io.BytesIO(content), dtype=str)
            else:
                df = pd.read_excel(io.BytesIO(content), dtype=str)
            df.columns = [str(c).strip() for c in df.columns]
            df = df.map(lambda x: x.strip() if isinstance(x, str) else x)
            df = df.where(pd.notnull(df), None)
            return df
        except Exception as e:
            raise ValueError(f"Failed to read file: {e}")

    def process_row(self, row, request):
        """
        Convert row dict to model-ready data.
        Subclasses should override to handle Foreign Key lookups.
        """
        data = {}
        # Auto-detect Day, Month, Year if they exist in mapping or standard headers
        for std_key, model_key in [("Day", "day"), ("Month", "month"), ("Year", "year")]:
            val = str(row.get(std_key, "")).strip()
            if val and val != "None":
                try: data[model_key] = int(float(val)) 
                except: pass

        # Standard mapping processing
        import pandas as pd
        for excel_col, model_field in self.column_mapping.items():
            if model_field in ["day", "month", "year"]: continue # Already handled above
            val = row.get(excel_col)
            if pd.isna(val) or val is None:
                val = ""
            else:
                val = str(val).strip()
            
            # If value is empty-like and the model field is nullable, convert it to None
            if val in ["", "None", "nan", "NaN"]:
                try:
                    field = self.model._meta.get_field(model_field)
                    if field.null:
                        val = None
                except Exception:
                    pass
            data[model_field] = val

        # Apply default_plant_id from request if plant is not already in data
        default_plant_id = getattr(request, 'default_plant_id', None)
        if default_plant_id and not data.get('plant'):
            data['plant'] = default_plant_id
            
        # Default data source (only for models that have this attribute)
        if hasattr(self.model, 'DATA_SOURCE_EXCEL'):
            data["data_source"] = self.model.DATA_SOURCE_EXCEL
        return data

    def lookup_existing(self, data):
        """
        Default lookup based on Day/Month/Year.
        Override in subclasses to include dimensions like Dzongkhag or Category.
        """
        filters = {k: data.get(k) for k in ["year", "month", "day"] if data.get(k) is not None}
        if not filters: return None
        return self.model.objects.filter(**filters).first()
