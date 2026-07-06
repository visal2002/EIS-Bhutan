from eis_core.utils.import_engine import BaseBulkImportView
from eis_apps.master_data.models import Dzongkhag, ElectricityCategory, GenerationPlant, Sector, Substation
from .models import ElectricityConsumption, ElectricityGeneration, TransmissionLineData, DistributionLineData, DistributionTransformerData, ElectricitySalesData, ElectricityConsumerData
from .serializers import ElectricityConsumptionSerializer, ElectricityGenerationSerializer, TransmissionLineDataSerializer, DistributionLineDataSerializer, DistributionTransformerDataSerializer, ElectricitySalesDataSerializer, ElectricityConsumerDataSerializer

class ElectricityConsumptionBulkImportView(BaseBulkImportView):
    model = ElectricityConsumption
    serializer_class = ElectricityConsumptionSerializer
    column_mapping = {
        "Year": "year",
        "Month": "month",
        "Category": "electricity_category",
        "Dzongkhag": "dzongkhag",
        "Consumption GWh": "consumption_gwh",
        "Remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Resolve Dzongkhag (Fuzzy match)
        dz_name = str(row.get("Dzongkhag", "")).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz: raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        # Resolve Category
        cat_name = str(row.get("Category", "")).strip()
        if cat_name:
            cat = ElectricityCategory.objects.filter(category_name__iexact=cat_name).first()
            if not cat: raise ValueError(f"Category '{cat_name}' not found")
            data["electricity_category"] = cat.id
            
        return data

    def lookup_existing(self, data):
        return ElectricityConsumption.objects.filter(
            year=data.get("year"),
            month=data.get("month"),
            electricity_category_id=data.get("electricity_category"),
            dzongkhag_id=data.get("dzongkhag")
        ).first()


class ElectricityGenerationBulkImportView(BaseBulkImportView):
    model = ElectricityGeneration
    serializer_class = ElectricityGenerationSerializer
    column_mapping = {
        "Acronym": "acronym",
        "acronym": "acronym",
        "Date": "date",
        "date": "date",
        "Internal Consumption": "internal_consumption",
        "internal_consumption": "internal_consumption",
        "Target Generation": "target_generation",
        "target_generation": "target_generation",
        "Generation": "generation",
        "generation": "generation",
        "Export Generation": "export_generation",
        "export_generation": "export_generation",
        "Domestic Sales Generation": "domestic_sales_generation",
        "domestic_sales_generation": "domestic_sales_generation",
        "Domestic Sales Amount": "domestic_sales_amount",
        "domestic_sales_amount": "domestic_sales_amount",
        "Export Amount": "export_amount",
        "export_amount": "export_amount",
        "Export Tariff": "export_tariff",
        "export_tariff": "export_tariff",
        "Remarks": "remarks",
        "remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # Parse Excel date serial numbers or standard date strings safely
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime
            import pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                # If it's a numeric Excel serial date
                if str(raw_date).replace('.', '', 1).isdigit():
                    excel_date = float(raw_date)
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=excel_date)
                else:
                    # Parse standard string date formats using pandas
                    parsed_date = pd.to_datetime(raw_date).date()
                
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                # Automatically populate required year and month from the parsed date
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date format '{raw_date}': {e}")

        # Round all decimal values in data to max 8 decimal places
        for key, val in data.items():
            if val is not None and key not in ['id', 'date', 'month', 'year', 'acronym', 'remarks']:
                try:
                    data[key] = round(float(val), 8)
                except ValueError:
                    pass
                
        return data

    def lookup_existing(self, data):
        return ElectricityGeneration.objects.filter(
            acronym=data.get("acronym"),
            date=data.get("date")
        ).first()


class HydrologyBulkImportView(BaseBulkImportView):
    model = "electricity.HydrologyData" # Using string to avoid direct import loop if any
    serializer_class = "eis_apps.electricity.serializers.HydrologyDataSerializer"
    column_mapping = {
        "Date": "date",
        "date": "date",
        "Inflow": "inflow",
        "inflow": "inflow",
        "Acronym": "acronym",
        "acronym": "acronym",
        "Remarks": "remarks",
        "remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime
            import pandas as pd
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    excel_date = float(raw_date)
                    parsed_date = pd.to_datetime(excel_date, unit='D', origin='1899-12-30').date()
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
            except Exception as e:
                raise ValueError(f"Invalid date format '{raw_date}': {str(e)}")

        # 2. Get plant identifier and resolve it against master data
        p_name = str(
            row.get("Plant") or 
            row.get("plant") or 
            row.get("Acronym") or 
            row.get("acronym") or 
            ""
        ).strip()
        
        if not p_name:
            raise ValueError("Plant name or Acronym is required")
            
        from eis_apps.master_data.models import GenerationPlant
        plant = GenerationPlant.objects.filter(plant_name__iexact=p_name).first()
        if not plant:
            plant = GenerationPlant.objects.filter(acronym__iexact=p_name).first()
            
        if not plant:
            raise ValueError(f"Generation Plant '{p_name}' not found in master data")
            
        if not plant.acronym:
            raise ValueError(f"Generation Plant '{plant.plant_name}' does not have an acronym configured in master data")
            
        data["acronym"] = plant.acronym
        return data

    def lookup_existing(self, data):
        from .models import HydrologyData
        return HydrologyData.objects.filter(
            date=data.get("date"),
            acronym=data.get("acronym")
        ).first()


class PlantDailyGenerationBulkImportView(BaseBulkImportView):
    model = "electricity.PlantGenerationDaily"
    serializer_class = "eis_apps.electricity.serializers.PlantGenerationDailySerializer"
    column_mapping = {
        "Date": "date",
        "date": "date",
        "generation_bhp": "generation_bhp",
        "generation_chp": "generation_chp",
        "export_chp": "export_chp",
        "generation_khp": "generation_khp",
        "export_khp": "export_khp",
        "generation_thp": "generation_thp",
        "export_thp": "export_thp",
        "generation_mhp": "generation_mhp",
        "export_mhp": "export_mhp",
        "generation_dhp": "generation_dhp",
        "export_dhp": "export_dhp",
        "generation_nhp": "generation_nhp",
        "export_nhp": "export_nhp",
        "Remarks": "remarks",
        "remarks": "remarks"
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime
            import pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    excel_date = float(raw_date)
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=excel_date)
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date format '{raw_date}': {e}")

        # Round all decimal values in data to max 8 decimal places
        for key, val in data.items():
            if val is not None and key not in ['id', 'date', 'month', 'year', 'remarks']:
                try:
                    data[key] = round(float(val), 8)
                except ValueError:
                    pass

        return data

    def lookup_existing(self, data):
        from .models import PlantGenerationDaily
        return PlantGenerationDaily.objects.filter(
            date=data.get("date")
        ).first()


class HourlyGenerationBulkImportView(BaseBulkImportView):
    model = "electricity.HourlyGenerationData"
    serializer_class = "eis_apps.electricity.serializers.HourlyGenerationDataSerializer"
    column_mapping = {
        "Plant": "plant",
        "plant": "plant",
        "Timestamp": "timestamp",
        "timestamp": "timestamp",
        "Date": "date",
        "date": "date",
        "Hour": "hour",
        "hour": "hour",
        "Unit 1": "unit1",
        "Unit1": "unit1",
        "unit1": "unit1",
        "Unit 2": "unit2",
        "Unit2": "unit2",
        "unit2": "unit2",
        "Unit 3": "unit3",
        "Unit3": "unit3",
        "unit3": "unit3",
        "Unit 4": "unit4",
        "Unit4": "unit4",
        "unit4": "unit4",
        "Unit 5": "unit5",
        "Unit5": "unit5",
        "unit5": "unit5",
        "Unit 6": "unit6",
        "Unit6": "unit6",
        "unit6": "unit6",
        "Remarks": "remarks",
        "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Resolve plant
        p_name = str(row.get("Plant", row.get("plant", ""))).strip()
        if p_name:
            plant = GenerationPlant.objects.filter(plant_name__iexact=p_name).first()
            if not plant:
                plant = GenerationPlant.objects.filter(acronym__iexact=p_name).first()
            if not plant:
                raise ValueError(f"Plant '{p_name}' not found")
            data["plant"] = plant.id

        # 2. Parse timestamp
        raw_ts = row.get("Timestamp") or row.get("timestamp")
        if raw_ts:
            import pandas as pd
            try:
                data["timestamp"] = pd.to_datetime(raw_ts).isoformat()
            except Exception as e:
                raise ValueError(f"Invalid timestamp '{raw_ts}': {e}")

        # 3. Parse date (fallback from timestamp)
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 4. Normalise hour to 2-char string
        raw_hour = row.get("Hour") or row.get("hour")
        if raw_hour is not None:
            data["hour"] = str(int(float(str(raw_hour)))).zfill(2)

        # 5. Round unit values to 3 decimal places
        for key in ["unit1", "unit2", "unit3", "unit4", "unit5", "unit6"]:
            val = data.get(key)
            if val is not None:
                try:
                    data[key] = round(float(val), 3)
                except (ValueError, TypeError):
                    pass

        return data

    def lookup_existing(self, data):
        from .models import HourlyGenerationData
        return HourlyGenerationData.objects.filter(
            plant_id=data.get("plant"),
            date=data.get("date"),
            hour=data.get("hour"),
        ).first()


class TransmissionLineBulkImportView(BaseBulkImportView):
    model = TransmissionLineData
    serializer_class = TransmissionLineDataSerializer
    column_mapping = {
        "Date": "date",
        "date": "date",
        "Status": "status",
        "status": "status",
        "Line From": "line_from",
        "line_from": "line_from",
        "Line To": "line_to",
        "line_to": "line_to",
        "Line Category": "line_category",
        "line_category": "line_category",
        "Voltage Level": "voltage_level",
        "voltage_level": "voltage_level",
        "Circuit": "circuit",
        "circuit": "circuit",
        "Conductor Type": "conductor_type",
        "conductor_type": "conductor_type",
        "Configuration": "configuration",
        "configuration": "configuration",
        "Ampacity 75": "ampacity_75",
        "ampacity_75": "ampacity_75",
        "Ampacity 85": "ampacity_85",
        "ampacity_85": "ampacity_85",
        "MW 75": "mw_75",
        "mw_75": "mw_75",
        "MW 85": "mw_85",
        "mw_85": "mw_85",
        "SIL": "sil",
        "sil": "sil",
        "Line Length": "line_length",
        "line_length": "line_length",
        "Tower A": "tower_a",
        "tower_a": "tower_a",
        "Tower B": "tower_b",
        "tower_b": "tower_b",
        "Tower C": "tower_c",
        "tower_c": "tower_c",
        "Tower D": "tower_d",
        "tower_d": "tower_d",
        "Tower SPL": "tower_spl",
        "tower_spl": "tower_spl",
        "Tower Q": "tower_q",
        "tower_q": "tower_q",
        "Remarks": "remarks",
        "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        
        # 1. Parse Date safely
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Resolve line_from
        from_name = str(row.get("Line From", row.get("line_from", ""))).strip()
        if from_name:
            data["line_from"] = from_name

        # 3. Resolve line_to
        to_name = str(row.get("Line To", row.get("line_to", ""))).strip()
        if to_name:
            data["line_to"] = to_name

        return data

    def lookup_existing(self, data):
        return TransmissionLineData.objects.filter(
            line_from=data.get("line_from"),
            line_to=data.get("line_to"),
            circuit=data.get("circuit"),
            date=data.get("date"),
        ).first()


class DistributionLineBulkImportView(BaseBulkImportView):
    model = DistributionLineData
    serializer_class = DistributionLineDataSerializer
    column_mapping = {
        "Date": "date",
        "date": "date",
        "Dzongkhag": "dzongkhag",
        "dzongkhag": "dzongkhag",
        "33kV": "kv33",
        "kv33": "kv33",
        "11kV": "kv11",
        "kv11": "kv11",
        "6.6kV": "kv6_6",
        "kv6_6": "kv6_6",
        "LV Line": "lv_line",
        "lv_line": "lv_line",
        "Remarks": "remarks",
        "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Resolve Dzongkhag (Fuzzy match)
        dz_name = str(row.get("Dzongkhag", row.get("dzongkhag", ""))).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz:
                raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        # 2. Parse Date safely
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        return data

    def lookup_existing(self, data):
        return DistributionLineData.objects.filter(
            dzongkhag_id=data.get("dzongkhag"),
            date=data.get("date"),
        ).first()


class DistributionTransformerBulkImportView(BaseBulkImportView):
    model = DistributionTransformerData
    serializer_class = DistributionTransformerDataSerializer
    column_mapping = {
        "Date": "date",
        "date": "date",
        "Dzongkhag": "dzongkhag",
        "dzongkhag": "dzongkhag",
        "Voltage Ratio": "voltage_ratio",
        "voltage_ratio": "voltage_ratio",
        "Transformer Type": "transformer_type",
        "transformer_type": "transformer_type",
        "No of Transformers BPC": "no_of_transformers_bpc",
        "no_of_transformers_bpc": "no_of_transformers_bpc",
        "Capacity BPC": "capacity_bpc",
        "capacity_bpc": "capacity_bpc",
        "No of Transformers": "no_of_transformers",
        "no_of_transformers": "no_of_transformers",
        "Capacity": "capacity",
        "capacity": "capacity",
        "Remarks": "remarks",
        "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Resolve Dzongkhag (Fuzzy match)
        dz_name = str(row.get("Dzongkhag", row.get("dzongkhag", ""))).strip()
        if dz_name:
            dz = Dzongkhag.objects.filter(dzongkhag__iexact=dz_name).first()
            if not dz:
                raise ValueError(f"Dzongkhag '{dz_name}' not found")
            data["dzongkhag"] = dz.id

        # 2. Parse Date safely
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 3. Cast integer fields safely
        for int_field in ["no_of_transformers_bpc", "no_of_transformers"]:
            val = data.get(int_field)
            if val is not None and val != "":
                try:
                    data[int_field] = int(float(str(val)))
                except (ValueError, TypeError):
                    pass

        return data

    def lookup_existing(self, data):
        return DistributionTransformerData.objects.filter(
            dzongkhag_id=data.get("dzongkhag"),
            date=data.get("date"),
            voltage_ratio=data.get("voltage_ratio"),
            transformer_type=data.get("transformer_type"),
        ).first()


class ElectricitySalesBulkImportView(BaseBulkImportView):
    model = ElectricitySalesData
    serializer_class = ElectricitySalesDataSerializer
    column_mapping = {
        "Date": "date", "date": "date",
        "Dzongkhag": "dzongkhag", "dzongkhag_name": "dzongkhag",
        "Rural Residents": "rural_residents", "rural_residents": "rural_residents",
        "Rural Cooperatives": "rural_cooperatives", "rural_cooperatives": "rural_cooperatives",
        "Rural Microtrades": "rural_microtrades", "rural_microtrades": "rural_microtrades",
        "Rural Community Lhakhangs": "rural_community_lhakhangs", "rural_community_lhakhangs": "rural_community_lhakhangs",
        "Highlands": "highlands", "highlands": "highlands",
        "Urban Residents": "urban_residents", "urban_residents": "urban_residents",
        "Religious Institutions": "religious_institutions", "religious_institutions": "religious_institutions",
        "Cottage Small Industries": "cottage_small_industries", "cottage_small_industries": "cottage_small_industries",
        "Commercial": "commercial", "commercial": "commercial",
        "Industries": "industries", "industries": "industries",
        "Agriculture": "agriculture", "agriculture": "agriculture",
        "Institutions": "institutions", "institutions": "institutions",
        "Street Lighting": "street_lighting", "street_lighting": "street_lighting",
        "Power House Auxiliaries": "power_house_auxiliaries", "power_house_auxiliaries": "power_house_auxiliaries",
        "Temporary Connections": "temporary_connections", "temporary_connections": "temporary_connections",
        "LV Bulk": "lv_bulk", "lv_bulk": "lv_bulk",
        "MV Industries": "mv_industries", "mv_industries": "mv_industries",
        "HV Industries": "hv_industries", "hv_industries": "hv_industries",
        "Electric Vehicles": "electric_vehicles", "electric_vehicles": "electric_vehicles",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # Parse Date and auto-derive year/month
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        return data

    def lookup_existing(self, data):
        return ElectricitySalesData.objects.filter(
            date=data.get("date"),
            dzongkhag=data.get("dzongkhag"),
        ).first()


class ElectricityConsumerBulkImportView(BaseBulkImportView):
    model = ElectricityConsumerData
    serializer_class = ElectricityConsumerDataSerializer
    column_mapping = {
        "Date": "date", "date": "date",
        "Dzongkhag": "dzongkhag", "dzongkhag_name": "dzongkhag",
        "Rural Residents": "rural_residents", "rural_residents": "rural_residents",
        "Rural Cooperatives": "rural_cooperatives", "rural_cooperatives": "rural_cooperatives",
        "Rural Microtrades": "rural_microtrades", "rural_microtrades": "rural_microtrades",
        "Rural Community Lhakhangs": "rural_community_lhakhangs", "rural_community_lhakhangs": "rural_community_lhakhangs",
        "Highlands": "highlands", "highlands": "highlands",
        "Urban Residents": "urban_residents", "urban_residents": "urban_residents",
        "Religious Institutions": "religious_institutions", "religious_institutions": "religious_institutions",
        "Cottage Small Industries": "cottage_small_industries", "cottage_small_industries": "cottage_small_industries",
        "Commercial": "commercial", "commercial": "commercial",
        "Industries": "industries", "industries": "industries",
        "Agriculture": "agriculture", "agriculture": "agriculture",
        "Institutions": "institutions", "institutions": "institutions",
        "Street Lighting": "street_lighting", "street_lighting": "street_lighting",
        "Power House Auxiliaries": "power_house_auxiliaries", "power_house_auxiliaries": "power_house_auxiliaries",
        "Temporary Connections": "temporary_connections", "temporary_connections": "temporary_connections",
        "LV Bulk": "lv_bulk", "lv_bulk": "lv_bulk",
        "MV Industries": "mv_industries", "mv_industries": "mv_industries",
        "HV Industries": "hv_industries", "hv_industries": "hv_industries",
        "Electric Vehicles": "electric_vehicles", "electric_vehicles": "electric_vehicles",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        return data

    def lookup_existing(self, data):
        return ElectricityConsumerData.objects.filter(
            date=data.get("date"),
            dzongkhag=data.get("dzongkhag"),
        ).first()


class ExportREABulkImportView(BaseBulkImportView):
    model = "electricity.ExportREAData"
    serializer_class = "eis_apps.electricity.serializers.ExportREADataSerializer"
    column_mapping = {
        "Date": "date", "date": "date",
        "CHP Energy": "chp_energy", "chp_energy": "chp_energy",
        "CHP Tariff": "chp_tariff", "chp_tariff": "chp_tariff",
        "KHP Energy": "khp_energy", "khp_energy": "khp_energy",
        "KHP Tariff": "khp_tariff", "khp_tariff": "khp_tariff",
        "MHP Energy": "mhp_energy", "mhp_energy": "mhp_energy",
        "MHP Tariff": "mhp_tariff", "mhp_tariff": "mhp_tariff",
        "THP Energy": "thp_energy", "thp_energy": "thp_energy",
        "THP Tariff": "thp_tariff", "thp_tariff": "thp_tariff",
        "DHP Energy": "dhp_energy", "dhp_energy": "dhp_energy",
        "DHP Tariff": "dhp_tariff", "dhp_tariff": "dhp_tariff",
        "NHP Energy": "nhp_energy", "nhp_energy": "nhp_energy",
        "NHP Tariff": "nhp_tariff", "nhp_tariff": "nhp_tariff",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        return data

    def lookup_existing(self, data):
        from .models import ExportREAData
        return ExportREAData.objects.filter(
            date=data.get("date")
        ).first()


class ElectricityRoyaltyBulkImportView(BaseBulkImportView):
    model = "electricity.ElectricityRoyaltyData"
    serializer_class = "eis_apps.electricity.serializers.ElectricityRoyaltyDataSerializer"
    column_mapping = {
        "Date": "date", "date": "date",
        "Acronym": "acronym", "acronym": "acronym",
        "Generation": "generation", "generation": "generation",
        "Gen Royalty Rate": "gen_royalty_rate", "gen_royalty_rate": "gen_royalty_rate",
        "Aux Rate": "aux_rate", "aux_rate": "aux_rate",
        "Line Losses Rate": "line_losses_rate", "line_losses_rate": "line_losses_rate",
        "Export Tariff": "export_tariff", "export_tariff": "export_tariff",
        "Wheeling Rate": "wheeling_rate", "wheeling_rate": "wheeling_rate",
        "Schedule Export": "schedule_export", "schedule_export": "schedule_export",
        "Domestic Tariff": "domestic_tariff", "domestic_tariff": "domestic_tariff",
        "Rebate": "rebate", "rebate": "rebate",
        "Export Tariff IEX": "export_tariff_iex", "export_tariff_iex": "export_tariff_iex",
        "Export Tariff PTC": "export_tariff_ptc", "export_tariff_ptc": "export_tariff_ptc",
        "Schedule Export IEX": "schedule_export_iex", "schedule_export_iex": "schedule_export_iex",
        "Schedule Export PTC": "schedule_export_ptc", "schedule_export_ptc": "schedule_export_ptc",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Get plant acronym and validate against GenerationPlant
        p_name = str(
            row.get("Acronym") or 
            row.get("acronym") or 
            row.get("Plant") or 
            row.get("plant") or 
            ""
        ).strip()
        
        if p_name:
            from eis_apps.master_data.models import GenerationPlant
            plant = GenerationPlant.objects.filter(acronym__iexact=p_name).first()
            if not plant:
                plant = GenerationPlant.objects.filter(plant_name__iexact=p_name).first()
            if not plant:
                raise ValueError(f"Generation Plant '{p_name}' not found in master data")
            data["acronym"] = plant.acronym
        else:
            raise ValueError("Acronym or Plant is required")

        return data

    def lookup_existing(self, data):
        from .models import ElectricityRoyaltyData
        return ElectricityRoyaltyData.objects.filter(
            date=data.get("date"),
            acronym=data.get("acronym"),
        ).first()


class TradeMarketExportBulkImportView(BaseBulkImportView):
    model = "electricity.TradeMarketExport"
    serializer_class = "eis_apps.electricity.serializers.TradeMarketExportSerializer"
    column_mapping = {
        "Acronym": "acronym", "acronym": "acronym",
        "Timestamp": "timestamp", "timestamp": "timestamp",
        "Date": "date", "date": "date",
        "Block": "block", "block": "block",
        "Qty MW": "qty_mw", "qty_mw": "qty_mw",
        "Rate per MWh": "rate_per_mwh", "rate_per_mwh": "rate_per_mwh",
        "IEX Margin Rate": "iex_margin_rate", "iex_margin_rate": "iex_margin_rate",
        "IGST Rate": "igst_rate", "igst_rate": "igst_rate",
        "Trader Margin Rate": "trader_margin_rate", "trader_margin_rate": "trader_margin_rate",
        "NLDC App Fee": "nldc_app_fee", "nldc_app_fee": "nldc_app_fee",
        "Successful Portfolios": "successful_portfolios", "successful_portfolios": "successful_portfolios",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Parse timestamp correctly if provided
        raw_ts = row.get("Timestamp") or row.get("timestamp")
        if raw_ts:
            import pandas as pd
            try:
                data["timestamp"] = pd.to_datetime(raw_ts).isoformat()
            except Exception as e:
                raise ValueError(f"Invalid timestamp '{raw_ts}': {e}")

        # 3. Get plant acronym and validate against GenerationPlant
        p_name = str(
            row.get("Acronym") or 
            row.get("acronym") or 
            row.get("Plant") or 
            row.get("plant") or 
            ""
        ).strip()
        
        default_plant_id = getattr(request, 'default_plant_id', None)
        if default_plant_id and not p_name:
            from eis_apps.master_data.models import GenerationPlant
            plant = GenerationPlant.objects.filter(id=default_plant_id).first()
            if plant:
                data["acronym"] = plant.acronym
        elif p_name:
            from eis_apps.master_data.models import GenerationPlant
            plant = GenerationPlant.objects.filter(acronym__iexact=p_name).first()
            if not plant:
                plant = GenerationPlant.objects.filter(plant_name__iexact=p_name).first()
            if not plant:
                raise ValueError(f"Generation Plant '{p_name}' not found in master data")
            data["acronym"] = plant.acronym
        else:
            raise ValueError("Acronym or Plant is required")

        return data

    def lookup_existing(self, data):
        from .models import TradeMarketExport
        return TradeMarketExport.objects.filter(
            date=data.get("date"),
            timestamp=data.get("timestamp"),
            acronym=data.get("acronym"),
            block=data.get("block"),
        ).first()


class TradeMarketImportDamBulkImportView(BaseBulkImportView):
    model = "electricity.TradeMarketImportDam"
    serializer_class = "eis_apps.electricity.serializers.TradeMarketImportDamSerializer"
    column_mapping = {
        "Timestamp": "timestamp", "timestamp": "timestamp",
        "Date": "date", "date": "date",
        "Block": "block", "block": "block",
        "Qty MW": "qty_mw", "qty_mw": "qty_mw",
        "Rate per MWh": "rate_per_mwh", "rate_per_mwh": "rate_per_mwh",
        "India Trans Loss": "india_trans_loss", "india_trans_loss": "india_trans_loss",
        "CTU Charge Rate": "ctu_charge_rate", "ctu_charge_rate": "ctu_charge_rate",
        "IEX Margin Rate": "iex_margin_rate", "iex_margin_rate": "iex_margin_rate",
        "IGST Rate": "igst_rate", "igst_rate": "igst_rate",
        "Trader Margin Rate": "trader_margin_rate", "trader_margin_rate": "trader_margin_rate",
        "NLDC App Fee": "nldc_app_fee", "nldc_app_fee": "nldc_app_fee",
        "Successful Portfolios": "successful_portfolios", "successful_portfolios": "successful_portfolios",
        "NLDC Op Charge": "nldc_op_charge", "nldc_op_charge": "nldc_op_charge",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Parse timestamp correctly if provided
        raw_ts = row.get("Timestamp") or row.get("timestamp")
        if raw_ts:
            import pandas as pd
            try:
                data["timestamp"] = pd.to_datetime(raw_ts).isoformat()
            except Exception as e:
                raise ValueError(f"Invalid timestamp '{raw_ts}': {e}")

        return data

    def lookup_existing(self, data):
        from .models import TradeMarketImportDam
        return TradeMarketImportDam.objects.filter(
            date=data.get("date"),
            timestamp=data.get("timestamp"),
            block=data.get("block"),
        ).first()


class TradeMarketImportRtmBulkImportView(BaseBulkImportView):
    model = "electricity.TradeMarketImportRtm"
    serializer_class = "eis_apps.electricity.serializers.TradeMarketImportRtmSerializer"
    column_mapping = {
        "Timestamp": "timestamp", "timestamp": "timestamp",
        "Date": "date", "date": "date",
        "Block": "block", "block": "block",
        "Qty MW": "qty_mw", "qty_mw": "qty_mw",
        "Rate per MWh": "rate_per_mwh", "rate_per_mwh": "rate_per_mwh",
        "India Trans Loss": "india_trans_loss", "india_trans_loss": "india_trans_loss",
        "CTU Charge Rate": "ctu_charge_rate", "ctu_charge_rate": "ctu_charge_rate",
        "IEX Margin Rate": "iex_margin_rate", "iex_margin_rate": "iex_margin_rate",
        "IGST Rate": "igst_rate", "igst_rate": "igst_rate",
        "Trader Margin Rate": "trader_margin_rate", "trader_margin_rate": "trader_margin_rate",
        "NLDC App Fee": "nldc_app_fee", "nldc_app_fee": "nldc_app_fee",
        "Successful Portfolios": "successful_portfolios", "successful_portfolios": "successful_portfolios",
        "NLDC Op Charge": "nldc_op_charge", "nldc_op_charge": "nldc_op_charge",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Parse timestamp correctly if provided
        raw_ts = row.get("Timestamp") or row.get("timestamp")
        if raw_ts:
            import pandas as pd
            try:
                data["timestamp"] = pd.to_datetime(raw_ts).isoformat()
            except Exception as e:
                raise ValueError(f"Invalid timestamp '{raw_ts}': {e}")

        return data

    def lookup_existing(self, data):
        from .models import TradeMarketImportRtm
        return TradeMarketImportRtm.objects.filter(
            date=data.get("date"),
            timestamp=data.get("timestamp"),
            block=data.get("block"),
        ).first()


class BiogasGenerationBulkImportView(BaseBulkImportView):
    model = "electricity.BiogasGenerationData"
    serializer_class = "eis_apps.electricity.serializers.BiogasGenerationDataSerializer"
    column_mapping = {
        "Fiscal Year": "fiscal_year", "fiscal_year": "fiscal_year",
        "Date": "date", "date": "date",
        "Dzongkhag": "dzongkhag", "dzongkhag_name": "dzongkhag",
        "Small 4m3": "small_4m3", "small_4m3": "small_4m3",
        "Small 6m3": "small_6m3", "small_6m3": "small_6m3",
        "Small 8m3": "small_8m3", "small_8m3": "small_8m3",
        "Small 10m3": "small_10m3", "small_10m3": "small_10m3",
        "Unspecified": "unspecified", "unspecified": "unspecified",
        "Medium": "medium", "medium": "medium",
        "Plant Type": "plant_type", "plant_type": "plant_type",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly if provided
        raw_date = row.get("Date") or row.get("date")
        if raw_date and str(raw_date).strip() != "" and str(raw_date) != "nan":
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")
        
        raw_fy = row.get("Fiscal Year") or row.get("fiscal_year")
        if raw_fy and (not data.get("year")):
            from eis_apps.master_data.models import DataCollectionYear
            try:
                parts = str(raw_fy).split("-")
                if parts and parts[0].isdigit():
                    year_val = int(parts[0])
                    year_obj, _ = DataCollectionYear.objects.get_or_create(year=year_val)
                    data["year"] = year_obj.id
            except Exception:
                pass

        return data

    def lookup_existing(self, data):
        from .models import BiogasGenerationData
        q = BiogasGenerationData.objects.filter(
            dzongkhag=data.get("dzongkhag"),
            plant_type=data.get("plant_type"),
        )
        if data.get("date"):
            return q.filter(date=data.get("date")).first()
        elif data.get("fiscal_year"):
            return q.filter(fiscal_year=data.get("fiscal_year")).first()
        return None


class IndustryPowerBulkImportView(BaseBulkImportView):
    model = "electricity.IndustryPowerData"
    serializer_class = "eis_apps.electricity.serializers.IndustryPowerDataSerializer"
    column_mapping = {
        "Business Name": "business_name", "business_name": "business_name",
        "Activity": "activity", "activity": "activity",
        "Industry Category": "industry_category", "industry_category": "industry_category",
        "Max Power": "max_power", "max_power": "max_power",
        "Location": "location", "location": "location",
        "Dzongkhag": "dzongkhag", "dzongkhag_name": "dzongkhag",
        "COD": "cod", "cod": "cod",
        "App Status": "app_status", "app_status": "app_status",
        "Voltage Type": "voltage_type", "voltage_type": "voltage_type",
        "Validity Status": "validity_status", "validity_status": "validity_status",
        "Feeding Substation": "feeding_substation", "feeding_substation": "feeding_substation",
        "Feeder Name": "feeder_name", "feeder_name": "feeder_name",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)
        import datetime
        from eis_apps.master_data.models import DataCollectionYear
        current_year = datetime.datetime.now().year
        year_obj, _ = DataCollectionYear.objects.get_or_create(year=current_year)
        data["year"] = year_obj.id
        return data

    def lookup_existing(self, data):
        from .models import IndustryPowerData
        return IndustryPowerData.objects.filter(
            business_name=data.get("business_name"),
            dzongkhag=data.get("dzongkhag"),
        ).first()


class SubstationLoadBulkImportView(BaseBulkImportView):
    model = "electricity.SubstationLoadData"
    serializer_class = "eis_apps.electricity.serializers.SubstationLoadDataSerializer"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        subs = [
            "tsi", "bhp", "chp", "gwa", "lsa", "sem", "den", "ola", "jem", "pro",
            "haa", "dhp", "ged", "plg", "gom", "mal", "sgo", "dam", "cha", "damji",
            "pan", "doc", "jamjee", "ged220", "kan", "kil", "khp", "nko", "deo", "mga",
            "nga", "dccl", "tin", "yur", "jlg", "gel", "cor", "phu", "dag"
        ]
        mapping = {
            "Timestamp": "timestamp", "timestamp": "timestamp",
            "Date": "date", "date": "date",
            "Hour": "hour", "hour": "hour",
            "Remarks": "remarks", "remarks": "remarks",
        }
        for sub in subs:
            mapping[f"{sub}_mw"] = f"{sub}_mw"
            mapping[f"{sub}_mvar"] = f"{sub}_mvar"
            mapping[f"{sub.upper()}_MW"] = f"{sub}_mw"
            mapping[f"{sub.upper()}_MVAR"] = f"{sub}_mvar"
            mapping[f"{sub.upper()} MW"] = f"{sub}_mw"
            mapping[f"{sub.upper()} MVAR"] = f"{sub}_mvar"
        self.column_mapping = mapping

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # 1. Parse date correctly
        raw_date = row.get("Date") or row.get("date")
        if raw_date:
            import datetime, pandas as pd
            from eis_apps.master_data.models import DataCollectionYear
            try:
                if str(raw_date).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_date))
                else:
                    parsed_date = pd.to_datetime(raw_date).date()
                data["date"] = parsed_date.strftime("%Y-%m-%d")
                data["month"] = parsed_date.month
                year_obj, _ = DataCollectionYear.objects.get_or_create(year=parsed_date.year)
                data["year"] = year_obj.id
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_date}': {e}")

        # 2. Parse timestamp correctly if provided
        raw_ts = row.get("Timestamp") or row.get("timestamp")
        if raw_ts:
            import pandas as pd
            try:
                data["timestamp"] = pd.to_datetime(raw_ts).isoformat()
            except Exception as e:
                raise ValueError(f"Invalid timestamp '{raw_ts}': {e}")

        return data

    def lookup_existing(self, data):
        from .models import SubstationLoadData
        return SubstationLoadData.objects.filter(
            date=data.get("date"),
            hour=data.get("hour"),
        ).first()


class SupplyDemandForecastingBulkImportView(BaseBulkImportView):
    model = "electricity.SupplyDemandForecastingData"
    serializer_class = "eis_apps.electricity.serializers.SupplyDemandForecastingDataSerializer"
    column_mapping = {
        "Year": "year", "year": "year",
        "Generation GWh": "generation_gwh", "generation_gwh": "generation_gwh",
        "Load GWh": "load_gwh", "load_gwh": "load_gwh",
        "Export GWh": "export_gwh", "export_gwh": "export_gwh",
        "Import GWh": "import_gwh", "import_gwh": "import_gwh",
        "Peakload MW": "peakload_mw", "peakload_mw": "peakload_mw",
        "Firm Power": "firm_power", "firm_power": "firm_power",
        "Installed Capacity MW": "installed_capacity_mw", "installed_capacity_mw": "installed_capacity_mw",
        "Remarks": "remarks", "remarks": "remarks",
    }

    def process_row(self, row, request):
        data = super().process_row(row, request)

        # Parse date correctly
        raw_year = row.get("Year") or row.get("year")
        if raw_year:
            import datetime, pandas as pd
            try:
                if str(raw_year).replace('.', '', 1).isdigit():
                    parsed_date = datetime.date(1899, 12, 30) + datetime.timedelta(days=float(raw_year))
                else:
                    parsed_date = pd.to_datetime(raw_year).date()
                data["year"] = parsed_date.strftime("%Y-%m-%d")
            except Exception as e:
                raise ValueError(f"Invalid date '{raw_year}': {e}")
        return data

    def lookup_existing(self, data):
        from .models import SupplyDemandForecastingData
        return SupplyDemandForecastingData.objects.filter(
            year=data.get("year"),
        ).first()
