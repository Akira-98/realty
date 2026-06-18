import { NextResponse } from "next/server";

import { jsonError } from "../../../../lib/http";
import {
  appendListingFilterParams,
  readListingFilters,
} from "../../../_lib/listing-filters";
import {
  LIST_SELECT,
  requiredSupabasePublicConfig,
} from "../_bounds-query";

export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

function readIds(searchParams) {
  const repeatedIds = searchParams.getAll("id");
  const commaIds = searchParams.get("ids")?.split(",") ?? [];
  return [...repeatedIds, ...commaIds]
    .map((id) => id.trim())
    .filter(Boolean);
}

function serializeIdFilter(ids) {
  return ids
    .map((id) => `"${id.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`)
    .join(",");
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ids = [...new Set(readIds(searchParams))];
  const filters = readListingFilters(searchParams);

  if (ids.length === 0) {
    return jsonError("At least one id is required.");
  }
  if (ids.length > 500) {
    return jsonError("A maximum of 500 ids can be requested.");
  }

  let supabaseUrl;
  let supabaseKey;
  try {
    ({ supabaseUrl, supabaseKey } = requiredSupabasePublicConfig());
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const params = new URLSearchParams();
  params.set("select", LIST_SELECT);
  params.set("is_public", "eq.true");
  params.set("id", `in.(${serializeIdFilter(ids)})`);
  appendListingFilterParams(params, filters);
  params.set("order", "building_name.asc,id.asc");
  params.set("limit", String(ids.length));

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase building lookup failed.", response.status, {
      body,
    });
  }

  const buildings = await response.json();

  return NextResponse.json({
    count: buildings.length,
    buildings,
  });
}
