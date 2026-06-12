import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";

export const dynamic = "force-dynamic";

const LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_scale",
  "rental_area_pyeong",
  "deposit_total",
  "rent_total",
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

function filterParam(searchParams, name) {
  const value = numberParam(searchParams, name);
  return value === null ? null : value;
}

function numberFromListingValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).replaceAll(",", "").trim();
  if (!text) {
    return null;
  }

  const eokMatch = text.match(/([\d.]+)\s*억/);
  const manMatch = text.match(/([\d.]+)\s*만/);
  if (eokMatch || manMatch) {
    const eok = eokMatch ? Number(eokMatch[1]) * 10000 : 0;
    const man = manMatch ? Number(manMatch[1]) : 0;
    const total = eok + man;
    return Number.isFinite(total) ? total : null;
  }

  const numericText = text.replace(/[^\d.-]/g, "");
  if (!numericText) {
    return null;
  }
  const number = Number(numericText);
  return Number.isFinite(number) ? number : null;
}

function isWithinRange(value, min, max) {
  if (min === null && max === null) {
    return true;
  }

  const number = numberFromListingValue(value);
  if (number === null) {
    return false;
  }

  return (min === null || number >= min) && (max === null || number <= max);
}

function filterBuildings(buildings, filters) {
  return buildings.filter(
    (building) =>
      isWithinRange(
        building.rental_area_pyeong,
        filters.areaMin,
        filters.areaMax,
      ) &&
      isWithinRange(
        building.deposit_total,
        filters.depositTotalMin,
        filters.depositTotalMax,
      ) &&
      isWithinRange(
        building.rent_total,
        filters.rentTotalMin,
        filters.rentTotalMax,
      ),
  );
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
  const filters = {
    areaMin: filterParam(searchParams, "areaMin"),
    areaMax: filterParam(searchParams, "areaMax"),
    depositTotalMin: filterParam(searchParams, "depositTotalMin"),
    depositTotalMax: filterParam(searchParams, "depositTotalMax"),
    rentTotalMin: filterParam(searchParams, "rentTotalMin"),
    rentTotalMax: filterParam(searchParams, "rentTotalMax"),
  };

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

  const buildings = filterBuildings(await response.json(), filters).sort(
    compareBuildingName,
  );

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
