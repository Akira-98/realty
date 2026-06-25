import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../lib/http";
import { supabaseBaseUrl, supabaseHeaders } from "../../../lib/supabase-admin";

export const dynamic = "force-dynamic";

const MAX_TEXT_LENGTHS = {
  name: 80,
  phone: 40,
  company: 120,
  message: 2000,
  building_name: 200,
  desired_area: 120,
  desired_deposit: 120,
  desired_rent: 120,
  preferred_region: 200,
  parking: 120,
  business_type: 120,
  room_count: 120,
};

function cleanText(value, maxLength) {
  const text = String(value ?? "").trim();
  return text.slice(0, maxLength);
}

function cleanOptionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function cleanOptionalBuildingId(value) {
  const text = cleanOptionalText(value, 40);
  if (!text) {
    return null;
  }

  const id = Number(text);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function cleanOptionalBoolean(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") {
    return true;
  }
  if (value === "false") {
    return false;
  }
  return null;
}

function cleanRequiredDate(value) {
  const text = String(value ?? "").trim();
  if (!text) {
    return "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return "";
  }

  const date = new Date(`${text}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text
    ? ""
    : text;
}

function cleanPayload(body) {
  const payload = {
    building_id: cleanOptionalBuildingId(body?.building_id),
    building_name: cleanOptionalText(body?.building_name, MAX_TEXT_LENGTHS.building_name),
    name: cleanText(body?.name, MAX_TEXT_LENGTHS.name),
    phone: cleanText(body?.phone, MAX_TEXT_LENGTHS.phone),
    company: cleanOptionalText(body?.company, MAX_TEXT_LENGTHS.company),
    message: cleanOptionalText(body?.message, MAX_TEXT_LENGTHS.message),
    desired_area: cleanText(body?.desired_area, MAX_TEXT_LENGTHS.desired_area),
    move_in_date: cleanRequiredDate(body?.move_in_date),
    desired_deposit: cleanText(body?.desired_deposit, MAX_TEXT_LENGTHS.desired_deposit),
    desired_rent: cleanText(body?.desired_rent, MAX_TEXT_LENGTHS.desired_rent),
    preferred_region: cleanText(body?.preferred_region, MAX_TEXT_LENGTHS.preferred_region),
    parking: cleanOptionalText(body?.parking, MAX_TEXT_LENGTHS.parking),
    overtime: cleanOptionalBoolean(body?.overtime),
    business_type: cleanOptionalText(body?.business_type, MAX_TEXT_LENGTHS.business_type),
    has_visitors: cleanOptionalBoolean(body?.has_visitors),
    has_interior: cleanOptionalBoolean(body?.has_interior),
    room_count: cleanOptionalText(body?.room_count, MAX_TEXT_LENGTHS.room_count),
    status: "new",
    source: "web",
  };

  if (!payload.name) {
    throw new Error("이름을 입력해 주세요.");
  }
  if (!payload.phone) {
    throw new Error("연락처를 입력해 주세요.");
  }
  if (!payload.desired_area) {
    throw new Error("희망 면적을 입력해 주세요.");
  }
  if (!payload.move_in_date) {
    throw new Error("입주 희망일을 입력해 주세요.");
  }
  if (!payload.desired_deposit) {
    throw new Error("희망 보증금을 입력해 주세요.");
  }
  if (!payload.desired_rent) {
    throw new Error("희망 임대료를 입력해 주세요.");
  }
  if (!payload.preferred_region) {
    throw new Error("희망 지역을 입력해 주세요.");
  }

  return payload;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  let payload;
  try {
    payload = cleanPayload(body);
  } catch (error) {
    return jsonError(error.message);
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
  params.set("select", "id,created_at");

  const response = await fetch(`${supabaseUrl}/rest/v1/inquiries?${params}`, {
    method: "POST",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  if (!response.ok) {
    const responseBody = await response.text();
    let supabaseMessage = responseBody;
    try {
      const parsed = JSON.parse(responseBody);
      supabaseMessage = parsed.message || parsed.details || responseBody;
    } catch {
      // Keep the original response body when Supabase does not return JSON.
    }
    return jsonError("Supabase inquiry insert failed.", response.status, {
      body: responseBody,
      message: supabaseMessage,
    });
  }

  const inquiries = await response.json();
  return NextResponse.json({
    inquiry: inquiries[0] ?? null,
  });
}
