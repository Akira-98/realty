import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";

export const dynamic = "force-dynamic";

const LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "building_scale",
  "gross_floor_area",
  "lat",
  "lng",
].join(",");

function escapeLike(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function searchExpression(query) {
  const escapedQuery = escapeLike(query);
  return [
    `building_name.ilike.*${escapedQuery}*`,
    `address.ilike.*${escapedQuery}*`,
    `subway.ilike.*${escapedQuery}*`,
  ].join(",");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return jsonError("q is required.");
  }

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
  params.set("or", `(${searchExpression(query)})`);
  params.set("is_public", "eq.true");
  params.set("lat", "not.is.null");
  params.set("lng", "not.is.null");
  params.set("order", "building_name.asc");
  params.set("limit", "50");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase building search failed.", response.status, {
      body,
    });
  }

  const buildings = await response.json();

  return NextResponse.json({
    query,
    count: buildings.length,
    buildings,
  });
}
