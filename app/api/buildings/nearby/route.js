import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";

export const dynamic = "force-dynamic";

const LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_scale",
  "lat",
  "lng",
  "distance_m",
].join(",");

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = numberParam(searchParams, "lat");
  const lng = numberParam(searchParams, "lng");

  if (lat === null || lng === null) {
    return jsonError("lat and lng are required numeric parameters.");
  }

  const radius = clamp(numberParam(searchParams, "radius") ?? 1000, 100, 10000);
  const limit = clamp(numberParam(searchParams, "limit") ?? 100, 1, 500);

  let supabaseUrl;
  let supabaseKey;
  try {
    supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const rpcParams = new URLSearchParams();
  rpcParams.set("select", LIST_SELECT);
  rpcParams.set("is_public", "eq.true");

  const response = await fetch(
    `${supabaseUrl}/rest/v1/rpc/search_buildings_nearby?${rpcParams}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_lat: lat,
        search_lng: lng,
        radius_m: Math.round(radius),
        result_limit: Math.round(limit),
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase nearby search failed.", response.status, {
      body,
    });
  }

  const buildings = await response.json();

  return NextResponse.json({
    center: { lat, lng },
    radius_m: Math.round(radius),
    count: buildings.length,
    buildings,
  });
}
