import os
import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from eis_apps.electricity.serializers import ElectricityGenerationSerializer
data = {"year": 2024, "month": 5, "plant": 1, "generation_gwh": 100, "target_generation": 100}
serializer = ElectricityGenerationSerializer(data=data)
print("Is valid:", serializer.is_valid())
print("Errors:", serializer.errors)
