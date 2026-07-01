-- Purpose/import workflow for Supabase Dashboard.
--
-- 1) Run "Step 1" first to create the import table and add target columns.
-- 2) In Supabase Table Editor, import data/building_purpose_import.csv into
--    public.building_purpose_import.
-- 3) Run "Step 2" to validate/update public.buildings.
-- 4) Run "Step 3" only after you have verified the update.

-- Step 1: Prepare import table and target columns.
CREATE TABLE IF NOT EXISTS public.building_purpose_import (
  id bigint PRIMARY KEY,
  name text,
  main_purpose text,
  etc_purpose text,
  register_classification text,
  plat_address text
);

-- If you need to re-import the CSV later, run this manually before importing:
-- TRUNCATE TABLE public.building_purpose_import;

ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS etc_purpose text,
ADD COLUMN IF NOT EXISTS register_classification text,
ADD COLUMN IF NOT EXISTS plat_address text;

-- Import data/building_purpose_import.csv into public.building_purpose_import
-- before running the queries below.

-- Step 2a: Validate imported rows.
SELECT
  count(*) AS imported_rows,
  count(*) FILTER (WHERE nullif(trim(name), '') IS NULL) AS blank_names,
  count(*) FILTER (WHERE nullif(trim(main_purpose), '') IS NULL) AS blank_main_purpose,
  count(*) FILTER (WHERE nullif(trim(etc_purpose), '') IS NULL) AS blank_etc_purpose,
  count(*) FILTER (WHERE nullif(trim(register_classification), '') IS NULL) AS blank_register_classification,
  count(*) FILTER (WHERE nullif(trim(plat_address), '') IS NULL) AS blank_plat_address
FROM public.building_purpose_import;

SELECT
  count(*) AS unmatched_import_ids
FROM public.building_purpose_import i
LEFT JOIN public.buildings b ON b.id = i.id
WHERE b.id IS NULL;

SELECT
  count(*) AS buildings_without_import_row
FROM public.buildings b
LEFT JOIN public.building_purpose_import i ON i.id = b.id
WHERE i.id IS NULL;

SELECT
  b.id,
  b.building_name AS current_building_name,
  i.name AS import_name,
  b.building_use AS current_building_use,
  i.main_purpose AS new_building_use,
  i.etc_purpose,
  i.register_classification,
  i.plat_address
FROM public.buildings b
JOIN public.building_purpose_import i ON i.id = b.id
WHERE coalesce(b.building_name, '') IS DISTINCT FROM coalesce(i.name, '')
ORDER BY b.id
LIMIT 50;

-- Step 2b: Apply update.
UPDATE public.buildings b
SET
  building_use = nullif(trim(i.main_purpose), ''),
  etc_purpose = nullif(trim(i.etc_purpose), ''),
  register_classification = nullif(trim(i.register_classification), ''),
  plat_address = nullif(trim(i.plat_address), ''),
  updated_at = now()
FROM public.building_purpose_import i
WHERE b.id = i.id;

-- Step 2c: Verify update result.
SELECT
  count(*) AS updated_buildings,
  count(*) FILTER (WHERE b.building_use IS NULL) AS null_building_use,
  count(*) FILTER (WHERE b.etc_purpose IS NULL) AS null_etc_purpose,
  count(*) FILTER (WHERE b.register_classification IS NULL) AS null_register_classification,
  count(*) FILTER (WHERE b.plat_address IS NULL) AS null_plat_address
FROM public.buildings b
JOIN public.building_purpose_import i ON i.id = b.id;

SELECT
  b.id,
  b.building_name,
  b.building_use,
  b.etc_purpose,
  b.register_classification,
  b.plat_address
FROM public.buildings b
JOIN public.building_purpose_import i ON i.id = b.id
ORDER BY b.id
LIMIT 20;

-- Step 3: Optional cleanup after verification.
-- DROP TABLE public.building_purpose_import;
