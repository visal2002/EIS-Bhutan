# backend/eis_apps/administration/apps.py
from django.apps import AppConfig

class AdministrationConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'eis_apps.administration'
    verbose_name = 'Administration'