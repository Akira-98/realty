-- Update only the cluster/list RPC payload.
-- This keeps search_buildings_summary unchanged because the map currently uses
-- only payload.markers from that RPC.

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
      b.thumbnail_path,
      b.basement_floors,
      b.ground_floors
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
      m.thumbnail_path,
      m.basement_floors,
      m.ground_floors
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

-- Quick check after running:
-- select jsonb_pretty(public.search_buildings_list(37.45, 126.8, 37.7, 127.2, list_limit := 1));
