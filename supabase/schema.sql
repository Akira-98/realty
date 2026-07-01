


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."search_buildings_in_bounds"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "result_limit" integer DEFAULT 500) RETURNS TABLE("id" bigint, "source" "text", "building_name" "text", "address" "text", "subway" "text", "features" "text", "building_use" "text", "building_scale" "text", "gross_floor_area" "text", "approval_date" "text", "rental_area_m2" "text", "rental_area_pyeong" "text", "exclusive_area_m2" "text", "exclusive_area_pyeong" "text", "deposit" "text", "deposit_total" "text", "rent" "text", "rent_total" "text", "maintenance_fee" "text", "maintenance_fee_total" "text", "parking_fee" "text", "elevator" "text", "parking" "text", "hvac" "text", "ceiling_height" "text", "lat" double precision, "lng" double precision)
    LANGUAGE "sql" STABLE
    AS $$
    select
      b.id,
      b.source,
      b.building_name,
      b.address,
      b.subway,
      b.features,
      b.building_use,
      b.building_scale,
      b.gross_floor_area,
      b.approval_date,
      b.rental_area_m2,
      b.rental_area_pyeong,
      b.exclusive_area_m2,
      b.exclusive_area_pyeong,
      b.deposit,
      b.deposit_total,
      b.rent,
      b.rent_total,
      b.maintenance_fee,
      b.maintenance_fee_total,
      b.parking_fee,
      b.elevator,
      b.parking,
      b.hvac,
      b.ceiling_height,
      b.lat,
      b.lng
    from public.buildings b
    where b.geom is not null
      and st_intersects(
        b.geom::geometry,
        st_makeenvelope(sw_lng, sw_lat, ne_lng, ne_lat, 4326)
      )
    order by b.building_name asc
    limit result_limit;
  $$;


ALTER FUNCTION "public"."search_buildings_in_bounds"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_buildings_list"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "min_deposit" bigint DEFAULT NULL::bigint, "max_deposit" bigint DEFAULT NULL::bigint, "min_rent" bigint DEFAULT NULL::bigint, "max_rent" bigint DEFAULT NULL::bigint, "min_area" numeric DEFAULT NULL::numeric, "max_area" numeric DEFAULT NULL::numeric, "scale" "text" DEFAULT NULL::"text", "business_district_filter" "text" DEFAULT NULL::"text", "subway_walk_max" integer DEFAULT NULL::integer, "min_approval_year" integer DEFAULT NULL::integer, "list_limit" integer DEFAULT 30, "list_offset" integer DEFAULT 0, "city_filter" "text" DEFAULT NULL::"text", "district_filter" "text" DEFAULT NULL::"text", "near_lat" double precision DEFAULT NULL::double precision, "near_lng" double precision DEFAULT NULL::double precision, "near_radius_m" integer DEFAULT NULL::integer, "max_approval_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
  with args as (
    select
      least(sw_lat, ne_lat) as min_lat,
      greatest(sw_lat, ne_lat) as max_lat,
      least(sw_lng, ne_lng) as min_lng,
      greatest(sw_lng, ne_lng) as max_lng,
      least(greatest(coalesce(list_limit, 30), 1), 100) as safe_list_limit,
      greatest(coalesce(list_offset, 0), 0) as safe_list_offset,
      scale as scale_filter,
      nullif(trim(city_filter), '') as city_filter,
      nullif(trim(district_filter), '') as district_filter,
      near_lat as near_lat,
      near_lng as near_lng,
      case
        when near_radius_m is null then null
        else greatest(near_radius_m, 1)
      end as safe_near_radius_m
  ),
  matching as (
    select
      b.id,
      b.building_name,
      b.address,
      b.city,
      b.district,
      b.subway_name,
      b.building_scale,
      b.business_district,
      b.gross_floor_area,
      b.approval_date_parsed,
      b.rental_area_pyeong,
      b.deposit_total,
      b.rent_total,
      b.subway_walk_min,
      b.lat,
      b.lng,
      b.deposit_num,
      b.rent_num,
      b.maintenance_num,
      b.scale,
      b.thumbnail_path
    from public.buildings b
    cross join args
    where b.is_public = true
      and b.lat is not null
      and b.lng is not null
      and b.lat between args.min_lat and args.max_lat
      and b.lng between args.min_lng and args.max_lng
      and (args.city_filter is null or b.city = args.city_filter)
      and (args.district_filter is null or b.district = args.district_filter)
      and (
        args.near_lat is null
        or args.near_lng is null
        or args.safe_near_radius_m is null
        or ST_DWithin(
          ST_SetSRID(ST_MakePoint(b.lng, b.lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(args.near_lng, args.near_lat), 4326)::geography,
          args.safe_near_radius_m
        )
      )
      and (min_deposit is null or b.deposit_num >= min_deposit)
      and (max_deposit is null or b.deposit_num <= max_deposit)
      and (min_rent is null or b.rent_num >= min_rent)
      and (max_rent is null or b.rent_num <= max_rent)
      and (min_area is null or b.gross_floor_area >= min_area)
      and (max_area is null or b.gross_floor_area <= max_area)
      and (args.scale_filter is null or b.scale = args.scale_filter)
      and (business_district_filter is null or b.business_district = business_district_filter)
      and (subway_walk_max is null or b.subway_walk_min <= subway_walk_max)
      and (min_approval_year is null or b.approval_date_parsed >= min_approval_year)
      and (max_approval_year is null or b.approval_date_parsed <= max_approval_year)
  ),
  list_rows as (
    select
      m.id,
      m.building_name,
      m.address,
      m.city,
      m.district,
      m.subway_name,
      m.building_scale,
      m.business_district,
      m.gross_floor_area,
      m.approval_date_parsed,
      m.rental_area_pyeong,
      m.deposit_total,
      m.rent_total,
      m.subway_walk_min,
      m.lat,
      m.lng,
      m.deposit_num,
      m.rent_num,
      m.maintenance_num,
      m.scale,
      m.thumbnail_path
    from matching m
    cross join args
    order by m.building_name asc, m.id asc
    limit (select safe_list_limit from args)
    offset (select safe_list_offset from args)
  ),
  total_count as (
    select count(*)::integer as count from matching
  )
  select jsonb_build_object(
    'bounds', jsonb_build_object(
      'swLat', (select min_lat from args),
      'swLng', (select min_lng from args),
      'neLat', (select max_lat from args),
      'neLng', (select max_lng from args)
    ),
    'filters', jsonb_build_object(
      'minDeposit', min_deposit,
      'maxDeposit', max_deposit,
	      'minRent', min_rent,
	      'maxRent', max_rent,
	      'minArea', min_area,
	      'maxArea', max_area,
	      'scale', (select scale_filter from args),
	      'businessDistrict', business_district_filter,
	      'subwayWalkMax', subway_walk_max,
	      'minApprovalYear', min_approval_year,
	      'maxApprovalYear', max_approval_year,
	      'city', (select city_filter from args),
	      'district', (select district_filter from args),
	      'nearLat', (select near_lat from args),
	      'nearLng', (select near_lng from args),
	      'nearRadiusM', (select safe_near_radius_m from args)
    ),
    'count', coalesce((select count(*)::integer from list_rows), 0),
    'total', (select count from total_count),
    'limit', (select safe_list_limit from args),
    'offset', (select safe_list_offset from args),
    'nextOffset',
      case
        when (select safe_list_offset + safe_list_limit from args) < (select count from total_count)
        then (select safe_list_offset + safe_list_limit from args)
        else null
      end,
    'buildings', coalesce(
      (select jsonb_agg(to_jsonb(list_rows) order by list_rows.building_name, list_rows.id) from list_rows),
      '[]'::jsonb
    )
  );
$$;


ALTER FUNCTION "public"."search_buildings_list"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "scale" "text", "business_district_filter" "text", "subway_walk_max" integer, "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_buildings_nearby"("search_lat" double precision, "search_lng" double precision, "radius_m" integer DEFAULT 1000, "result_limit" integer DEFAULT 100) RETURNS TABLE("id" bigint, "source" "text", "building_name" "text", "address" "text", "subway" "text", "features" "text", "building_use" "text", "building_scale" "text", "gross_floor_area" "text", "approval_date" "text", "rental_area_m2" "text", "rental_area_pyeong" "text", "exclusive_area_m2" "text", "exclusive_area_pyeong" "text", "deposit" "text", "deposit_total" "text", "rent" "text", "rent_total" "text", "maintenance_fee" "text", "maintenance_fee_total" "text", "parking_fee" "text", "elevator" "text", "parking" "text", "hvac" "text", "ceiling_height" "text", "lat" double precision, "lng" double precision, "distance_m" double precision)
    LANGUAGE "sql" STABLE
    AS $$
    select
      b.id,
      b.source,
      b.building_name,
      b.address,
      b.subway,
      b.features,
      b.building_use,
      b.building_scale,
      b.gross_floor_area,
      b.approval_date,
      b.rental_area_m2,
      b.rental_area_pyeong,
      b.exclusive_area_m2,
      b.exclusive_area_pyeong,
      b.deposit,
      b.deposit_total,
      b.rent,
      b.rent_total,
      b.maintenance_fee,
      b.maintenance_fee_total,
      b.parking_fee,
      b.elevator,
      b.parking,
      b.hvac,
      b.ceiling_height,
      b.lat,
      b.lng,
      st_distance(
        b.geom,
        st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography
      ) as distance_m
    from public.buildings b
    where b.geom is not null
    and b.is_public = true
      and st_dwithin(
        b.geom,
        st_setsrid(st_makepoint(search_lng, search_lat), 4326)::geography,
        radius_m
      )
    order by distance_m asc
    limit result_limit;
  $$;


ALTER FUNCTION "public"."search_buildings_nearby"("search_lat" double precision, "search_lng" double precision, "radius_m" integer, "result_limit" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_buildings_summary"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "map_level" integer DEFAULT 4, "min_deposit" bigint DEFAULT NULL::bigint, "max_deposit" bigint DEFAULT NULL::bigint, "min_rent" bigint DEFAULT NULL::bigint, "max_rent" bigint DEFAULT NULL::bigint, "min_area" numeric DEFAULT NULL::numeric, "max_area" numeric DEFAULT NULL::numeric, "subway_walk_max" integer DEFAULT NULL::integer, "scale" "text" DEFAULT NULL::"text", "business_district_filter" "text" DEFAULT NULL::"text", "min_approval_year" integer DEFAULT NULL::integer, "list_limit" integer DEFAULT 30, "list_offset" integer DEFAULT 0, "city_filter" "text" DEFAULT NULL::"text", "district_filter" "text" DEFAULT NULL::"text", "near_lat" double precision DEFAULT NULL::double precision, "near_lng" double precision DEFAULT NULL::double precision, "near_radius_m" integer DEFAULT NULL::integer, "max_approval_year" integer DEFAULT NULL::integer) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public', 'extensions'
    AS $$
    with args as (
      select
        least(sw_lat, ne_lat) as min_lat,
        greatest(sw_lat, ne_lat) as max_lat,
        least(sw_lng, ne_lng) as min_lng,
        greatest(sw_lng, ne_lng) as max_lng,
        coalesce(map_level, 4) as safe_map_level,
        least(greatest(coalesce(list_limit, 30), 1), 100) as safe_list_limit,
        greatest(coalesce(list_offset, 0), 0) as safe_list_offset,
        scale as scale_filter,
        nullif(trim(city_filter), '') as city_filter,
        nullif(trim(district_filter), '') as district_filter,
        near_lat as near_lat,
        near_lng as near_lng,
        case
          when near_radius_m is null then null
          else greatest(near_radius_m, 1)
        end as safe_near_radius_m
    ),
    settings as (
      select
        args.*,
        case
          -- Kakao map_level: lower = zoomed in, higher = zoomed out.
          when args.safe_map_level <= 3 then 0::double precision
          when args.safe_map_level = 4 then 0.005::double precision
          when args.safe_map_level = 5 then 0.01::double precision
          when args.safe_map_level = 6 then 0.02::double precision
          when args.safe_map_level = 7 then 0.05::double precision
          when args.safe_map_level = 8 then 0.12::double precision
          when args.safe_map_level = 9 then 0.25::double precision
          when args.safe_map_level = 10 then 0.45::double precision
          when args.safe_map_level = 11 then 0.80::double precision
          else 0.2048::double precision
        end as cell_size
      from args
    ),
    matching as (
      select
        b.id,
        b.building_name,
        b.address,
        b.city,
        b.district,
        b.subway_name,
        b.building_scale,
        b.business_district,
        b.gross_floor_area,
        b.approval_date_parsed,
        b.rental_area_pyeong,
        b.deposit_total,
        b.rent_total,
        b.subway_walk_min,
        b.lat,
        b.lng,
        b.deposit_num,
        b.rent_num,
        b.maintenance_num,
        b.scale,
        b.thumbnail_path
      from public.buildings b
      cross join args
      where b.is_public = true
        and b.lat is not null
        and b.lng is not null
        and b.lat between args.min_lat and args.max_lat
        and b.lng between args.min_lng and args.max_lng
        and (args.city_filter is null or b.city = args.city_filter)
        and (args.district_filter is null or b.district = args.district_filter)
        and (
          args.near_lat is null
          or args.near_lng is null
          or args.safe_near_radius_m is null
          or ST_DWithin(
            ST_SetSRID(ST_MakePoint(b.lng, b.lat), 4326)::geography,
            ST_SetSRID(ST_MakePoint(args.near_lng, args.near_lat), 4326)::geography,
            args.safe_near_radius_m
          )
        )
        and (min_deposit is null or b.deposit_num >= min_deposit)
        and (max_deposit is null or b.deposit_num <= max_deposit)
        and (min_rent is null or b.rent_num >= min_rent)
        and (max_rent is null or b.rent_num <= max_rent)
        and (min_area is null or b.gross_floor_area >= min_area)
        and (max_area is null or b.gross_floor_area <= max_area)
        and (args.scale_filter is null or b.scale = args.scale_filter)
        and (business_district_filter is null or b.business_district = business_district_filter)
        and (subway_walk_max is null or b.subway_walk_min <= subway_walk_max)
        and (min_approval_year is null or b.approval_date_parsed >= min_approval_year)
        and (max_approval_year is null or b.approval_date_parsed <= max_approval_year)
    ),
    clustered as (
      select
        m.*,
        s.cell_size,
        case
          when s.cell_size = 0 then null
          else floor(m.lat / s.cell_size)::bigint
        end as lat_bucket,
        case
          when s.cell_size = 0 then null
          else floor(m.lng / s.cell_size)::bigint
        end as lng_bucket
      from matching m
      cross join settings s
    ),
    marker_groups as (
      select
        case
          when c.cell_size = 0 then c.id::text
          else concat(c.lat_bucket, ':', c.lng_bucket)
        end as bucket_id,
        c.cell_size,
        c.lat_bucket,
        c.lng_bucket,
        count(*)::integer as count,
        avg(c.lat)::double precision as lat,
        avg(c.lng)::double precision as lng,
        (array_agg(c.id order by c.building_name asc, c.id asc))[1]::text as
        sample_building_id,
        (array_agg(c.building_name order by c.building_name asc, c.id asc))[1]
        as label
      from clustered c
      group by
        c.cell_size,
        c.lat_bucket,
        c.lng_bucket,
        case
          when c.cell_size = 0 then c.id::text
          else concat(c.lat_bucket, ':', c.lng_bucket)
        end
    ),
    marker_rows as (
      select
        case
          when g.count = 1 then g.sample_building_id
          else g.bucket_id
        end as id,
        case
          when g.count = 1 then 'building'
          else 'cluster'
        end as type,
        g.count,
        g.lat,
        g.lng,
        g.sample_building_id,
        g.label,
        case
          when g.count = 1 then g.label
          else null
        end as building_name,
        case
          when g.count = 1 or g.cell_size = 0 then null
          else g.lat_bucket::double precision * g.cell_size
        end as sw_lat,
        case
          when g.count = 1 or g.cell_size = 0 then null
          else g.lng_bucket::double precision * g.cell_size
        end as sw_lng,
        case
          when g.count = 1 or g.cell_size = 0 then null
          else (g.lat_bucket::double precision + 1) * g.cell_size
        end as ne_lat,
        case
          when g.count = 1 or g.cell_size = 0 then null
          else (g.lng_bucket::double precision + 1) * g.cell_size
        end as ne_lng
      from marker_groups g
    ),
    list_rows as (
      select
        m.id,
        m.building_name,
        m.address,
        m.city,
        m.district,
        m.subway_name,
        m.building_scale,
        m.business_district,
        m.gross_floor_area,
        m.approval_date_parsed,
        m.rental_area_pyeong,
        m.deposit_total,
        m.rent_total,
        m.subway_walk_min,
        m.lat,
        m.lng,
        m.deposit_num,
        m.rent_num,
        m.maintenance_num,
        m.scale,
        m.thumbnail_path
      from matching m
      cross join args
      order by m.building_name asc, m.id asc
      limit (select safe_list_limit from args)
      offset (select safe_list_offset from args)
    ),
    total_count as (
      select count(*)::integer as count from matching
    )
    select jsonb_build_object(
      'bounds', jsonb_build_object(
        'swLat', (select min_lat from args),
        'swLng', (select min_lng from args),
        'neLat', (select max_lat from args),
        'neLng', (select max_lng from args)
      ),
      'filters', jsonb_build_object(
        'minDeposit', min_deposit,
        'maxDeposit', max_deposit,
        'minRent', min_rent,
        'maxRent', max_rent,
        'minArea', min_area,
        'maxArea', max_area,
        'scale', (select scale_filter from args),
        'businessDistrict', business_district_filter,
        'subwayWalkMax', subway_walk_max,
        'minApprovalYear', min_approval_year,
        'maxApprovalYear', max_approval_year,
        'city', (select city_filter from args),
        'district', (select district_filter from args),
        'nearLat', (select near_lat from args),
        'nearLng', (select near_lng from args),
        'nearRadiusM', (select safe_near_radius_m from args)
      ),
      'count', (select count from total_count),
      'total', (select count from total_count),
      'markerCount', coalesce((select count(*)::integer from marker_rows), 0),
      'markersTruncated', false,
      'markers', coalesce(
        (select jsonb_agg(to_jsonb(marker_rows) order by marker_rows.type,
        marker_rows.id) from marker_rows),
        '[]'::jsonb
      ),
      'buildings', coalesce(
        (select jsonb_agg(to_jsonb(list_rows) order by list_rows.building_name,
        list_rows.id) from list_rows),
        '[]'::jsonb
      ),
      'limit', (select safe_list_limit from args),
      'offset', (select safe_list_offset from args),
      'nextOffset',
        case
          when (select safe_list_offset + safe_list_limit from args) < (select
          count from total_count)
          then (select safe_list_offset + safe_list_limit from args)
          else null
        end
    );
  $$;


ALTER FUNCTION "public"."search_buildings_summary"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "map_level" integer, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "subway_walk_max" integer, "scale" "text", "business_district_filter" "text", "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_location_suggestions"("search_query" "text", "result_limit" integer DEFAULT 10) RETURNS "jsonb"
    LANGUAGE "sql" STABLE
    SET "search_path" TO 'public'
    AS $$
  with args as (
    select
      nullif(trim(search_query), '') as query,
      least(greatest(coalesce(result_limit, 10), 1), 30) as safe_limit
  ),
  district_matches as (
    select
      'district'::text as type,
      b.district::text as label,
      b.city::text as description,
      b.city::text as city,
      b.district::text as district,
      avg(b.lat)::double precision as lat,
      avg(b.lng)::double precision as lng,
      6::integer as level,
      count(*)::integer as building_count,
      1::integer as type_rank,
      case
        when b.district = (select query from args) then 0
        when b.district ilike (select query from args) || '%' then 1
        else 2
      end as match_rank
    from public.buildings b
    cross join args
    where args.query is not null
      and b.is_public = true
      and b.city is not null
      and b.district is not null
      and b.lat is not null
      and b.lng is not null
      and b.district ilike '%' || args.query || '%'
    group by b.city, b.district
  ),
  city_matches as (
    select
      'city'::text as type,
      b.city::text as label,
      'City'::text as description,
      b.city::text as city,
      null::text as district,
      avg(b.lat)::double precision as lat,
      avg(b.lng)::double precision as lng,
      9::integer as level,
      count(*)::integer as building_count,
      3::integer as type_rank,
      case
        when b.city = (select query from args) then 0
        when b.city ilike (select query from args) || '%' then 1
        else 2
      end as match_rank
    from public.buildings b
    cross join args
    where args.query is not null
      and b.is_public = true
      and b.city is not null
      and b.lat is not null
      and b.lng is not null
      and b.city ilike '%' || args.query || '%'
    group by b.city
  ),
  ranked as (
    select * from district_matches
    union all
    select * from city_matches
  ),
  limited as (
    select
      type,
      label,
      description,
      city,
      district,
      lat,
      lng,
      level,
      building_count
    from ranked
    order by match_rank asc, type_rank asc, building_count desc, label asc
    limit (select safe_limit from args)
  )
  select coalesce(jsonb_agg(to_jsonb(limited)), '[]'::jsonb)
  from limited;
$$;


ALTER FUNCTION "public"."search_location_suggestions"("search_query" "text", "result_limit" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."building_images" (
    "id" bigint NOT NULL,
    "building_id" bigint NOT NULL,
    "image_path" "text" NOT NULL,
    "image_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."building_images" OWNER TO "postgres";


ALTER TABLE "public"."building_images" ALTER COLUMN "id" ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME "public"."building_images_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."buildings" (
    "id" bigint NOT NULL,
    "source" "text",
    "building_name" "text",
    "address" "text",
    "subway" "text",
    "features" "text",
    "building_use" "text",
    "building_scale" "text",
    "gross_floor_area" numeric,
    "approval_date" "text",
    "rental_area_m2" "text",
    "rental_area_pyeong" "text",
    "exclusive_area_m2" "text",
    "exclusive_area_pyeong" "text",
    "deposit" "text",
    "deposit_total" "text",
    "rent" "text",
    "rent_total" "text",
    "maintenance_fee" "text",
    "maintenance_fee_total" "text",
    "parking_fee" "text",
    "elevator" "text",
    "parking" "text",
    "hvac" "text",
    "ceiling_height" "text",
    "lat" double precision,
    "lng" double precision,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "geom" "public"."geography"(Point,4326),
    "is_public" boolean DEFAULT true NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "subway_walk_min" integer,
    "deposit_num" numeric,
    "rent_num" numeric,
    "maintenance_num" numeric,
    "scale" "text",
    "approval_date_parsed" integer,
    "business_district" "text",
    "thumbnail_path" "text",
    "subway_name" "text",
    "city" "text",
    "district" "text",
    "district_unit_plan_zone" boolean DEFAULT false NOT NULL,
    "national_industrial_complex" boolean DEFAULT false NOT NULL,
    "etc_purpose" "text",
    "register_classification" "text",
    "plat_address" "text",
    "basement_floors" integer,
    "ground_floors" integer
);


ALTER TABLE "public"."buildings" OWNER TO "postgres";


ALTER TABLE "public"."buildings" ALTER COLUMN "id" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."buildings_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);



CREATE TABLE IF NOT EXISTS "public"."inquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "building_id" bigint,
    "building_name" "text",
    "name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "company" "text",
    "message" "text",
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "source" "text" DEFAULT 'web'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "desired_area" "text" NOT NULL,
    "move_in_date" "date" NOT NULL,
    "preferred_region" "text" NOT NULL,
    "parking" "text",
    "overtime" boolean,
    "business_type" "text",
    "has_visitors" boolean,
    "has_interior" boolean,
    "room_count" "text",
    "desired_deposit" "text",
    "desired_rent" "text",
    CONSTRAINT "inquiries_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'contacted'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."inquiries" OWNER TO "postgres";


ALTER TABLE ONLY "public"."building_images"
    ADD CONSTRAINT "building_images_building_id_image_order_key" UNIQUE ("building_id", "image_order");



ALTER TABLE ONLY "public"."building_images"
    ADD CONSTRAINT "building_images_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."buildings"
    ADD CONSTRAINT "buildings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."inquiries"
    ADD CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id");



CREATE INDEX "buildings_geom_idx" ON "public"."buildings" USING "gist" ("geom");



CREATE INDEX "buildings_public_lat_lng_idx" ON "public"."buildings" USING "btree" ("lat", "lng") WHERE (("is_public" = true) AND ("lat" IS NOT NULL) AND ("lng" IS NOT NULL));



CREATE INDEX "idx_building_images_building_id" ON "public"."building_images" USING "btree" ("building_id");



CREATE INDEX "idx_buildings_address_trgm" ON "public"."buildings" USING "gin" ("address" "public"."gin_trgm_ops");



CREATE INDEX "idx_buildings_subway_trgm" ON "public"."buildings" USING "gin" ("subway" "public"."gin_trgm_ops");



CREATE UNIQUE INDEX "uq_building_images_path" ON "public"."building_images" USING "btree" ("image_path");



ALTER TABLE ONLY "public"."building_images"
    ADD CONSTRAINT "building_images_building_id_fkey" FOREIGN KEY ("building_id") REFERENCES "public"."buildings"("id") ON DELETE CASCADE;



CREATE POLICY "Allow public read buildings" ON "public"."buildings" FOR SELECT TO "anon" USING (true);



CREATE POLICY "Public can read building images" ON "public"."building_images" FOR SELECT TO "authenticated", "anon" USING ((EXISTS ( SELECT 1
   FROM "public"."buildings" "b"
  WHERE (("b"."id" = "building_images"."building_id") AND ("b"."is_public" = true)))));



ALTER TABLE "public"."building_images" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."buildings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."inquiries" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."search_buildings_in_bounds"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_buildings_in_bounds"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_buildings_in_bounds"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_buildings_list"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "scale" "text", "business_district_filter" "text", "subway_walk_max" integer, "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_buildings_list"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "scale" "text", "business_district_filter" "text", "subway_walk_max" integer, "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_buildings_list"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "scale" "text", "business_district_filter" "text", "subway_walk_max" integer, "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_buildings_nearby"("search_lat" double precision, "search_lng" double precision, "radius_m" integer, "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_buildings_nearby"("search_lat" double precision, "search_lng" double precision, "radius_m" integer, "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_buildings_nearby"("search_lat" double precision, "search_lng" double precision, "radius_m" integer, "result_limit" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_buildings_summary"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "map_level" integer, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "subway_walk_max" integer, "scale" "text", "business_district_filter" "text", "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_buildings_summary"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "map_level" integer, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "subway_walk_max" integer, "scale" "text", "business_district_filter" "text", "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_buildings_summary"("sw_lat" double precision, "sw_lng" double precision, "ne_lat" double precision, "ne_lng" double precision, "map_level" integer, "min_deposit" bigint, "max_deposit" bigint, "min_rent" bigint, "max_rent" bigint, "min_area" numeric, "max_area" numeric, "subway_walk_max" integer, "scale" "text", "business_district_filter" "text", "min_approval_year" integer, "list_limit" integer, "list_offset" integer, "city_filter" "text", "district_filter" "text", "near_lat" double precision, "near_lng" double precision, "near_radius_m" integer, "max_approval_year" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_location_suggestions"("search_query" "text", "result_limit" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_location_suggestions"("search_query" "text", "result_limit" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_location_suggestions"("search_query" "text", "result_limit" integer) TO "service_role";



GRANT ALL ON TABLE "public"."building_images" TO "anon";
GRANT ALL ON TABLE "public"."building_images" TO "authenticated";
GRANT ALL ON TABLE "public"."building_images" TO "service_role";



GRANT ALL ON SEQUENCE "public"."building_images_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."building_images_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."building_images_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."buildings" TO "anon";
GRANT ALL ON TABLE "public"."buildings" TO "authenticated";
GRANT ALL ON TABLE "public"."buildings" TO "service_role";



GRANT ALL ON SEQUENCE "public"."buildings_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."buildings_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."buildings_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."inquiries" TO "anon";
GRANT ALL ON TABLE "public"."inquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."inquiries" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







