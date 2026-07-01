ALTER TABLE public.buildings
ADD COLUMN IF NOT EXISTS district_unit_plan_zone boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS national_industrial_complex boolean DEFAULT false NOT NULL;

CREATE TABLE IF NOT EXISTS public.building_zone_flags_import (
  id bigint PRIMARY KEY,
  district_unit_plan_zone boolean NOT NULL,
  national_industrial_complex boolean NOT NULL
);
