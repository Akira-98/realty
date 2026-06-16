import { jsonError, requiredEnv } from "../../../lib/http";
import {
  appendListingFilterParams,
  readListingFilters,
} from "../../_lib/listing-filters";

export const BOUNDS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

export const LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "building_scale",
  "gross_floor_area",
  "rental_area_pyeong",
  "deposit_total",
  "rent_total",
  "subway_walk_min",
  "lat",
  "lng",
].join(",");

export const MARKER_SELECT = [
  "id",
  "building_name",
  "lat",
  "lng",
].join(",");

function numberParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function compareBuildingName(a, b) {
  if (a.building_name === b.building_name) {
    return 0;
  }
  return a.building_name > b.building_name ? 1 : -1;
}

export function readBoundsRequest(searchParams, options = {}) {
  const {
    defaultLimit = 2000,
    maxLimit = 5000,
    includeOffset = false,
  } = options;
  const rawSwLat = numberParam(searchParams, "swLat");
  const rawSwLng = numberParam(searchParams, "swLng");
  const rawNeLat = numberParam(searchParams, "neLat");
  const rawNeLng = numberParam(searchParams, "neLng");

  if ([rawSwLat, rawSwLng, rawNeLat, rawNeLng].some((value) => value === null)) {
    return {
      error: jsonError("swLat, swLng, neLat, and neLng are required numeric parameters."),
    };
  }

  const limit = clamp(numberParam(searchParams, "limit") ?? defaultLimit, 1, maxLimit);
  const offset = includeOffset
    ? Math.max(numberParam(searchParams, "offset") ?? 0, 0)
    : 0;

  return {
    bounds: {
      swLat: Math.min(rawSwLat, rawNeLat),
      neLat: Math.max(rawSwLat, rawNeLat),
      swLng: Math.min(rawSwLng, rawNeLng),
      neLng: Math.max(rawSwLng, rawNeLng),
    },
    filters: readListingFilters(searchParams),
    limit: Math.round(limit),
    offset: Math.round(offset),
  };
}

export function requiredSupabasePublicConfig() {
  return {
    supabaseUrl: requiredEnv("SUPABASE_URL").replace(/\/$/, ""),
    supabaseKey: requiredEnv("SUPABASE_ANON_KEY"),
  };
}

export function createBoundsQueryParams({
  bounds,
  filters,
  limit,
  offset,
  select,
}) {
  const params = new URLSearchParams();
  params.set("select", select);
  params.set("is_public", "eq.true");
  params.set("lat", `gte.${bounds.swLat}`);
  params.append("lat", `lte.${bounds.neLat}`);
  params.set("lng", `gte.${bounds.swLng}`);
  params.append("lng", `lte.${bounds.neLng}`);
  params.set("order", "building_name.asc,id.asc");
  params.set("limit", String(limit));
  if (offset) {
    params.set("offset", String(offset));
  }
  appendListingFilterParams(params, filters);
  return params;
}

export async function fetchBoundsRows({
  select,
  bounds,
  filters,
  limit,
  offset = 0,
  errorMessage,
}) {
  let supabaseUrl;
  let supabaseKey;
  try {
    ({ supabaseUrl, supabaseKey } = requiredSupabasePublicConfig());
  } catch (error) {
    return { error: jsonError(error.message, 500) };
  }

  const params = createBoundsQueryParams({
    bounds,
    filters,
    limit,
    offset,
    select,
  });

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      error: jsonError(errorMessage, response.status, { body }),
    };
  }

  const rows = await response.json();
  const contentRange = response.headers.get("content-range") || "";
  const total = Number(contentRange.split("/")[1]);

  return {
    rows,
    total: Number.isFinite(total) ? total : rows.length,
  };
}
