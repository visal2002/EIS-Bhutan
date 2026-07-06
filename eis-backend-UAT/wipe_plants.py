from eis_apps.electricity.models import (
    ElectricityGeneration,
    HydrologyData,
    PlantGenerationDaily,
    HourlyGenerationData,
    TradeMarketData,
    ExportREAData,
    ElectricityRoyaltyData,
)
from eis_apps.master_data.models import GenerationPlant

# Delete all connected data
ElectricityGeneration.objects.all().delete()
HydrologyData.objects.all().delete()
PlantGenerationDaily.objects.all().delete()
HourlyGenerationData.objects.all().delete()
TradeMarketData.objects.all().delete()
ExportREAData.objects.all().delete()
ElectricityRoyaltyData.objects.all().delete()

# Delete generation plants
GenerationPlant.objects.all().delete()

print("Successfully wiped all connected generation records and Generation Plants.")
