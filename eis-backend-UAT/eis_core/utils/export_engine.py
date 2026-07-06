import os
import json
import uuid
import pandas as pd
from io import BytesIO
from django.core.files.base import ContentFile
from django.apps import apps
from django.core.mail import send_mail
from django.urls import reverse
from django.conf import settings
import traceback
import csv
from collections import OrderedDict

def generate_filename(module_name, fmt):
    timestamp = pd.Timestamp.now().strftime('%Y%m%d_%H%M%S')
    clean_module = module_name.split('?')[0].split('.')[-1]
    return f"{clean_module}_Export_{timestamp}.{fmt}"

def run_export_job(job_id, domain_url="http://127.0.0.1:8000"):
    """
    Background worker function to generate large exports.
    """
    from eis_apps.administration.models import BulkExportJob, SystemSetting
    
    try:
        job = BulkExportJob.objects.get(id=job_id)
    except BulkExportJob.DoesNotExist:
        return
        
    job.status = 'processing'
    job.save(update_fields=['status'])
    
    try:
        job_module = job.module_name.split('?')[0]
        app_label, model_name = job_module.split('.')
        ModelClass = apps.get_model(app_label, model_name)
        
        # 1. Reconstruct Query
        qs = ModelClass.objects.all()
        filters = job.filters or {}
        
        # We need to map standard API query params to Django ORM filters
        # In a real DRF app, we could instantiate the FilterSet or ViewSet, but here we'll 
        # do basic exact/icontains mapping for standard fields like 'year', 'month', 'search'
        
        year = filters.get('year')
        month = filters.get('month')
        search = filters.get('search')
        ordering = filters.get('ordering')
        
        # Dynamically apply exact match filters
        for key, value in filters.items():
            if key in ['search', 'ordering', 'format'] or not value:
                continue
                
            # 'year' often maps to year_id due to foreign key setup
            if key == 'year':
                qs = qs.filter(year__year=value)
            elif hasattr(ModelClass, key) or key + '_id' in [f.name for f in ModelClass._meta.fields] or key in [f.name for f in ModelClass._meta.fields]:
                qs = qs.filter(**{key: value})
        
        if ordering:
            qs = qs.order_by(ordering)
            
        total_rows = qs.count()
        job.total_rows = total_rows
        job.save(update_fields=['total_rows'])
        
        # 2. Build the data array
        # To avoid massive memory spikes, we'll iterate with chunking in ORM 
        # (iterator() prevents caching the whole QS in memory)
        
        records = []
        processed_count = 0
        for instance in qs.iterator(chunk_size=5000):
            # We want human readable fields if possible.
            # Using DRF serializer is safer but slower. We'll use a basic dict.
            row = OrderedDict()
            for field in ModelClass._meta.fields:
                val = getattr(instance, field.name)
                # Handle foreign keys returning objects
                if field.is_relation and val:
                    val = str(val)
                row[field.name] = val
            records.append(row)
            
            processed_count += 1
            if processed_count % 1000 == 0:
                job.refresh_from_db()
                while job.status == 'paused':
                    import time
                    time.sleep(2)
                    job.refresh_from_db()
                    
                if job.status == 'stopped':
                    break
                    
                job.processed_rows = processed_count
                job.save(update_fields=['processed_rows'])
                
        job.refresh_from_db()
        if job.status == 'stopped':
            return
            
        
        # Save final processed count
        job.processed_rows = processed_count
        job.save(update_fields=['processed_rows'])
        df = pd.DataFrame(records)
        
        # Strip timezone from datetimes so Excel writer does not fail
        for col in df.columns:
            try:
                if pd.api.types.is_datetime64_any_dtype(df[col]):
                    if hasattr(df[col].dt, 'tz') and df[col].dt.tz is not None:
                        df[col] = df[col].dt.tz_localize(None)
                else:
                    df[col] = df[col].apply(lambda x: x.replace(tzinfo=None) if hasattr(x, 'tzinfo') and x is not None else x)
            except Exception:
                pass
        
        fmt = filters.get('format', 'excel')
        if fmt == 'excel' or fmt == 'xlsx':
            ext = 'xlsx'
        elif fmt == 'xls':
            ext = 'xls'
        elif fmt == 'json':
            ext = 'json'
        else:
            ext = 'csv'
            
        filename = generate_filename(job.module_name, ext)
        
        # 3. Write to FileField
        buffer = BytesIO()
        if fmt == 'excel' or fmt == 'xlsx':
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False)
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif fmt == 'xls':
            with pd.ExcelWriter(buffer, engine='openpyxl') as writer:
                df.to_excel(writer, index=False)
            content_type = 'application/vnd.ms-excel'
        elif fmt == 'json':
            content = df.to_json(orient='records', indent=4)
            buffer.write(content.encode('utf-8'))
            content_type = 'application/json'
        else: # csv
            # We must encode to bytes
            content = df.to_csv(index=False)
            buffer.write(content.encode('utf-8'))
            content_type = 'text/csv'
            
        buffer.seek(0)
        job.file.save(filename, ContentFile(buffer.read()))
        
        # 4. Finalize
        job.status = 'completed'
        job.save(update_fields=['status', 'file'])
        
        # 5. Send Notification
        if job.created_by and job.created_by.email:
            try:
                sys_set = SystemSetting.get()
                sys_set.apply_email_settings()
                download_link = f"{domain_url}{job.file.url}"
                send_mail(
                    subject="Your Data Export is Ready",
                    message=f"Your export for {job.module_name} is complete and ready for download.\n\nDownload Link: {download_link}",
                    from_email=sys_set.default_from_email,
                    recipient_list=[job.created_by.email],
                    fail_silently=True
                )
            except Exception as e:
                # Fail silently if email fails but job succeeds
                pass

    except Exception as e:
        job.status = 'failed'
        job.save(update_fields=['status'])
        traceback.print_exc()
