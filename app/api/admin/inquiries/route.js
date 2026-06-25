import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../lib/http";
import {
  requireAdmin,
  setAdminSessionCookies,
  supabaseBaseUrl,
  supabaseHeaders,
} from "../../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const INQUIRY_SELECT = [
  "id",
  "building_id",
  "building_name",
  "name",
  "phone",
  "company",
  "message",
  "desired_area",
  "move_in_date",
  "desired_deposit",
  "desired_rent",
  "preferred_region",
  "parking",
  "overtime",
  "business_type",
  "has_visitors",
  "has_interior",
  "room_count",
  "status",
  "source",
  "created_at",
  "updated_at",
].join(",");

const STATUSES = new Set(["new", "contacted"]);
const BUILDING_SELECT = [
  "id",
  "building_name",
  "address",
  "deposit_num",
  "rent_num",
  "maintenance_num",
].join(",");

function numberParam(searchParams, name, fallback) {
  const value = Number(searchParams.get(name) ?? fallback);
  return Number.isFinite(value) ? value : fallback;
}

async function fetchInquiryBuilding(inquiry, supabaseUrl, serviceKey) {
  if (!inquiry.building_id && !inquiry.building_name) {
    return null;
  }

  const params = new URLSearchParams();
  params.set("select", BUILDING_SELECT);
  params.set("limit", "1");
  if (inquiry.building_id) {
    params.set("id", `eq.${inquiry.building_id}`);
  } else {
    params.set("building_name", `eq.${inquiry.building_name}`);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const buildings = await response.json();
  return buildings[0] ?? null;
}

async function enrichInquiriesWithBuildings(inquiries, supabaseUrl, serviceKey) {
  return Promise.all(
    inquiries.map(async (inquiry) => ({
      ...inquiry,
      building: await fetchInquiryBuilding(inquiry, supabaseUrl, serviceKey),
    })),
  );
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
  const status = searchParams.get("status")?.trim();
  const limit = Math.min(Math.max(numberParam(searchParams, "limit", 50), 1), 200);
  const offset = Math.max(numberParam(searchParams, "offset", 0), 0);

  const params = new URLSearchParams();
  params.set("select", INQUIRY_SELECT);
  params.set("order", "created_at.desc");
  params.set("limit", String(Math.round(limit)));
  params.set("offset", String(Math.round(offset)));

  if (status && STATUSES.has(status)) {
    params.set("status", `eq.${status}`);
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/inquiries?${params}`, {
    headers: supabaseHeaders(serviceKey, {
      Prefer: "count=exact",
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase admin inquiry list failed.", response.status, {
      body,
    });
  }

  const inquiries = await response.json();
  const enrichedInquiries = await enrichInquiriesWithBuildings(
    inquiries,
    supabaseUrl,
    serviceKey,
  );
  const contentRange = response.headers.get("content-range") || "";
  const total = Number(contentRange.split("/")[1]);
  const result = NextResponse.json({
    count: enrichedInquiries.length,
    total: Number.isFinite(total) ? total : null,
    limit,
    offset,
    inquiries: enrichedInquiries,
  });
  return setAdminSessionCookies(result, admin.session);
}

export async function PATCH(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return admin.error;
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const id = String(body?.id ?? "").trim();
  const status = String(body?.status ?? "").trim();
  if (!id) {
    return jsonError("id is required.");
  }
  if (!STATUSES.has(status)) {
    return jsonError("Invalid inquiry status.");
  }

  let supabaseUrl;
  let serviceKey;
  try {
    supabaseUrl = supabaseBaseUrl();
    serviceKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const params = new URLSearchParams();
  params.set("id", `eq.${id}`);
  params.set("select", INQUIRY_SELECT);

  const response = await fetch(`${supabaseUrl}/rest/v1/inquiries?${params}`, {
    method: "PATCH",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      status,
      updated_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseBody = await response.text();
    return jsonError("Supabase admin inquiry update failed.", response.status, {
      body: responseBody,
    });
  }

  const inquiries = await response.json();
  const result = NextResponse.json({
    inquiry: inquiries[0] ?? null,
  });
  return setAdminSessionCookies(result, admin.session);
}
