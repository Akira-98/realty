ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS district_unit_plan_zone boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS national_industrial_complex boolean DEFAULT false NOT NULL;

CREATE TEMP TABLE building_zone_flags_import (
  id bigint PRIMARY KEY,
  district_unit_plan_zone boolean NOT NULL,
  national_industrial_complex boolean NOT NULL
);

\copy building_zone_flags_import (id, district_unit_plan_zone, national_industrial_complex) FROM 'data/building_zone_flags.csv' WITH (FORMAT csv, HEADER true);

UPDATE public.buildings b
SET
  district_unit_plan_zone = i.district_unit_plan_zone,
  national_industrial_complex = i.national_industrial_complex,
  updated_at = now()
FROM building_zone_flags_import i
WHERE b.id = i.id;

SELECT
  count(*) AS imported_rows,
  count(*) FILTER (WHERE district_unit_plan_zone) AS district_unit_plan_zone_true,
  count(*) FILTER (WHERE national_industrial_complex) AS national_industrial_complex_true
FROM building_zone_flags_import;

SELECT
  count(*) AS unmatched_csv_ids
FROM building_zone_flags_import i
LEFT JOIN public.buildings b ON b.id = i.id
WHERE b.id IS NULL;

SELECT
  count(*) AS updated_buildings
FROM public.buildings b
JOIN building_zone_flags_import i ON i.id = b.id;
