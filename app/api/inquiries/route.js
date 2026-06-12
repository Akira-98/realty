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
};

function cleanText(value, maxLength) {
  const text = String(value ?? "").trim();
  return text.slice(0, maxLength);
}

function cleanOptionalText(value, maxLength) {
  const text = cleanText(value, maxLength);
  return text || null;
}

function cleanOptionalUuid(value) {
  const text = cleanOptionalText(value, 80);
  if (!text) {
    return null;
  }
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function cleanPayload(body) {
  const payload = {
    building_id: cleanOptionalUuid(body?.building_id),
    building_name: cleanOptionalText(body?.building_name, MAX_TEXT_LENGTHS.building_name),
    name: cleanText(body?.name, MAX_TEXT_LENGTHS.name),
    phone: cleanText(body?.phone, MAX_TEXT_LENGTHS.phone),
    company: cleanOptionalText(body?.company, MAX_TEXT_LENGTHS.company),
    message: cleanText(body?.message, MAX_TEXT_LENGTHS.message),
    status: "new",
    source: "web",
  };

  if (!payload.name) {
    throw new Error("이름을 입력해 주세요.");
  }
  if (!payload.phone) {
    throw new Error("연락처를 입력해 주세요.");
  }
  if (!payload.message) {
    throw new Error("문의 내용을 입력해 주세요.");
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
