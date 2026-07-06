# Master Data Migration & Seeder Fix — Summary

**Date:** 2026-03-31
**Issue:** Energy Supply page was not displaying any data after migration and seeding.

## Root Cause

The codebase was using `is_deleted` field for soft deletion filtering, but the `SoftDeleteModel` base class uses `is_active` instead. This caused a `FieldError` when querying Energy Supply data:

```
FieldError: Cannot resolve keyword 'is_deleted' into field. Choices are: ..., is_active, ...
```

## Files Fixed

### 1. backend/eis_apps/master_data/models.py
- **Line 252:** `EnergySupply.get_descendants()` method
- Changed: `self.children.filter(is_deleted=False)` → `self.children.filter(is_active=True)`

### 2. backend/eis_apps/master_data/serializers.py
- **Line 37:** `EnergySupplySerializer.get_has_children()`
  - Changed: `obj.children.filter(is_deleted=False)` → `obj.children.filter(is_active=True)`
- **Line 60:** `EnergySupplyTreeSerializer.get_children()`
  - Changed: `obj.children.filter(is_deleted=False)` → `obj.children.filter(is_active=True)`

### 3. backend/eis_apps/master_data/views.py
- **Line 125:** `EnergySupplyDestroyView.perform_destroy()`
  - Changed: `instance.children.filter(is_deleted=False)` → `instance.children.filter(is_active=True)`
- **Line 142:** `EnergySupplyTreeView.get_queryset()`
  - Changed: `is_deleted=False` → `is_active=True`
- **Line 158:** `EnergySupplyDropdownView.get_queryset()`
  - Removed duplicate `is_deleted=False` filter (already had `is_active=True`)

## Database State

After running:
```bash
python manage.py drop_master_tables.py
python manage.py migrate
python manage.py seed_permissions --force
python manage.py seed_all
python manage.py create_demo_users --reset
```

**Energy Supply Records:** 49 total
- Root nodes (level 0): 21
- Child nodes (level 1 & 2): 28

Categories seeded:
- ELECTRICITY (6 items: Hydro, Solar, Wind, BESS, Import)
- PETROLEUM (7 items: ATF, Diesel, Petrol, Kerosene, LDO, LPG, Tanker LPG)
- COAL (3 items: Anthracite, Sub-Bituminous, Lignite)
- BIOMASS (2 items: Biogas, Briquette/Charcoal)
- RENEWABLES (Biofuels: Biodiesel, Bioethanol, Pellets)
- OTHERS (2 items: Bagasse, Geothermal)

## API Endpoints Verified

✓ `GET /api/master-data/energy-supply/` - Flat list (pagination, search, filter)
✓ `GET /api/master-data/energy-supply/tree/` - Nested tree structure
✓ `GET /api/master-data/energy-supply/dropdown/` - Indented dropdown list

All returning correct data with proper parent-child relationships.

## Frontend Status

- Frontend dev server: `http://localhost:5173` ✓
- Backend dev server: `http://127.0.0.1:8000` ✓
- Energy Supply page should now display all 49 records in both Tree and Table views

## Migration Notes

**No database migration changes were required.** The model was already correct with `is_active` field. Only query code needed updates.

The fix aligns with the existing `SoftDeleteModel` pattern used throughout the project.
