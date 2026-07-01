-- Run supabase/migrations/20260701_add_building_zone_flags.sql first.
-- Then import data/building_zone_flags.csv into public.building_zone_flags_import
-- from the Supabase Table Editor before running this file.

UPDATE public.buildings b
SET
  district_unit_plan_zone = i.district_unit_plan_zone,
  national_industrial_complex = i.national_industrial_complex,
  updated_at = now()
FROM public.building_zone_flags_import i
WHERE b.id = i.id;

SELECT
  count(*) AS imported_rows,
  count(*) FILTER (WHERE district_unit_plan_zone) AS district_unit_plan_zone_true,
  count(*) FILTER (WHERE national_industrial_complex) AS national_industrial_complex_true
FROM public.building_zone_flags_import;

SELECT
  count(*) AS unmatched_csv_ids
FROM public.building_zone_flags_import i
LEFT JOIN public.buildings b ON b.id = i.id
WHERE b.id IS NULL;

SELECT
  count(*) AS updated_buildings
FROM public.buildings b
JOIN public.building_zone_flags_import i ON i.id = b.id;
