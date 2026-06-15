import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";
import {
  appendSubwayWalkFilter,
  filterBuildingsByListingFilters,
  readListingFilters,
} from "../../../_lib/listing-filters";

export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

const LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_scale",
  "rental_area_pyeong",
  "deposit_total",
  "rent_total",
  "subway_walk_min",
  "lat",
  "lng",
].join(",");
const BOUNDS_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
};

function numberParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function compareBuildingName(a, b) {
  if (a.building_name === b.building_name) {
    return 0;
  }
  return a.building_name > b.building_name ? 1 : -1;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rawSwLat = numberParam(searchParams, "swLat");
  const rawSwLng = numberParam(searchParams, "swLng");
  const rawNeLat = numberParam(searchParams, "neLat");
  const rawNeLng = numberParam(searchParams, "neLng");

  if ([rawSwLat, rawSwLng, rawNeLat, rawNeLng].some((value) => value === null)) {
    return jsonError("swLat, swLng, neLat, and neLng are required numeric parameters.");
  }

  const swLat = Math.min(rawSwLat, rawNeLat);
  const neLat = Math.max(rawSwLat, rawNeLat);
  const swLng = Math.min(rawSwLng, rawNeLng);
  const neLng = Math.max(rawSwLng, rawNeLng);
  const limit = clamp(numberParam(searchParams, "limit") ?? 2000, 1, 5000);
  const filters = readListingFilters(searchParams);

  let supabaseUrl;
  let supabaseKey;
  try {
    supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const params = new URLSearchParams();
  params.set("select", LIST_SELECT);
  params.set("is_public", "eq.true");
  params.set("lat", `gte.${swLat}`);
  params.append("lat", `lte.${neLat}`);
  params.set("lng", `gte.${swLng}`);
  params.append("lng", `lte.${neLng}`);
  params.set("limit", String(Math.round(limit)));
  appendSubwayWalkFilter(params, filters);

  const response = await fetch(
    `${supabaseUrl}/rest/v1/buildings?${params}`,
    {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase bounds search failed.", response.status, {
      body,
    });
  }

  const fetchedBuildings = await response.json();
  const buildings = filterBuildingsByListingFilters(
    fetchedBuildings,
    filters,
  ).sort(compareBuildingName);

  return NextResponse.json(
    {
      bounds: { swLat, swLng, neLat, neLng },
      filters,
      count: buildings.length,
      buildings,
    },
    {
      headers: BOUNDS_CACHE_HEADERS,
    },
  );
}
