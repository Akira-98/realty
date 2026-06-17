import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";
import {
  appendListingFilterParams,
  readListingFilters,
} from "../../../_lib/listing-filters";
import {
  requireAdmin,
  setAdminSessionCookies,
  supabaseBaseUrl,
  supabaseHeaders,
} from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const ADMIN_LIST_SELECT = [
  "id",
  "building_name",
  "address",
  "rental_area_pyeong",
  "deposit_num",
  "rent_num",
  "maintenance_num",
  "subway_walk_min",
  "is_public",
  "updated_at",
].join(",");

const EDITABLE_FIELDS = new Set([
  "deposit_num",
  "rent_num",
  "maintenance_num",
  "is_public",
]);

const NUMERIC_FIELDS = new Set([
  "deposit_num",
  "rent_num",
  "maintenance_num",
]);

function escapeLike(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function cleanPatchValue(key, value) {
  if (key === "is_public") {
    if (typeof value !== "boolean") {
      throw new Error("is_public must be a boolean.");
    }
    return value;
  }

  if (NUMERIC_FIELDS.has(key)) {
    if (value === null || value === "") {
      return null;
    }
    const number = Number(value);
    if (!Number.isFinite(number)) {
      throw new Error(`${key} must be a number.`);
    }
    return number;
  }

  if (value === null) {
    return "";
  }
  if (typeof value !== "string") {
    throw new Error(`${key} must be a string.`);
  }
  return value.trim();
}

function buildPatch(body) {
  const patch = {};
  for (const [key, value] of Object.entries(body ?? {})) {
    if (!EDITABLE_FIELDS.has(key)) {
      continue;
    }
    patch[key] = cleanPatchValue(key, value);
  }
  return patch;
}

function numberParam(searchParams, name, fallback) {
  const value = Number(searchParams.get(name) ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

export async function GET(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return admin.error;
  }

  let supabaseUrl;
  let serviceKey;
  try {
    supabaseUrl = supabaseBaseUrl();
    serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const visibility = searchParams.get("visibility")?.trim();
  const limit = Math.min(Math.max(numberParam(searchParams, "limit", 50), 1), 200);
  const offset = Math.max(numberParam(searchParams, "offset", 0), 0);
  const filters = readListingFilters(searchParams);

  const params = new URLSearchParams();
  params.set("select", ADMIN_LIST_SELECT);
  params.set("order", "updated_at.desc.nullslast,building_name.asc");
  params.set("limit", String(Math.round(limit)));
  params.set("offset", String(Math.round(offset)));

  if (query) {
    const escapedQuery = escapeLike(query);
    params.set(
      "or",
      `(building_name.ilike.*${escapedQuery}*,address.ilike.*${escapedQuery}*)`,
    );
  }

  if (visibility === "public") {
    params.set("is_public", "eq.true");
  } else if (visibility === "private") {
    params.set("is_public", "eq.false");
  }

  appendListingFilterParams(params, filters);

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: supabaseHeaders(serviceKey, {
      Prefer: "count=exact",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase admin building list failed.", response.status, {
      body,
    });
  }

  const buildings = await response.json();
  const contentRange = response.headers.get("content-range") || "";
  const total = Number(contentRange.split("/")[1]);
  const result = NextResponse.json({
    count: buildings.length,
    total: Number.isFinite(total) ? total : null,
    limit,
    offset,
    filters,
    buildings,
  });
  return setAdminSessionCookies(result, admin.session);
}

export async function PATCH(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return admin.error;
  }

  let supabaseUrl;
  let serviceKey;
  try {
    supabaseUrl = supabaseBaseUrl();
    serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const id = body?.id;
  if (!id) {
    return jsonError("id is required.");
  }

  let patch;
  try {
    patch = buildPatch(body);
  } catch (error) {
    return jsonError(error.message);
  }

  if (Object.keys(patch).length === 0) {
    return jsonError("No editable fields were provided.");
  }

  const params = new URLSearchParams();
  params.set("id", `eq.${id}`);
  params.set("select", ADMIN_LIST_SELECT);

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    method: "PATCH",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(patch),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseBody = await response.text();
    return jsonError("Supabase admin building update failed.", response.status, {
      body: responseBody,
    });
  }

  const buildings = await response.json();
  const result = NextResponse.json({
    building: buildings[0] ?? null,
  });
  return setAdminSessionCookies(result, admin.session);
}
