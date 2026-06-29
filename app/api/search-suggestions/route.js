import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../lib/http";

export const dynamic = "force-dynamic";

const KAKAO_KEYWORD_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";
const KAKAO_SUBWAY_CATEGORY = "SW8";

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

function suggestionRank(suggestion) {
  if (suggestion.type === "district") {
    return 1;
  }
  if (suggestion.type === "subway") {
    return 2;
  }
  return 3;
}

function normalizeKakaoStation(document) {
  return {
    type: "subway",
    label: document.place_name,
    description: document.road_address_name || document.address_name || "지하철역",
    city: "",
    district: "",
    lat: Number(document.y),
    lng: Number(document.x),
    level: 4,
    building_count: null,
  };
}

async function fetchSubwaySuggestions(query, limit) {
  const apiKey = process.env.KAKAO_REST_API_KEY;
  if (!apiKey) {
    return [];
  }

  const requestUrl = new URL(KAKAO_KEYWORD_URL);
  requestUrl.searchParams.set("query", query.endsWith("역") ? query : `${query}역`);
  requestUrl.searchParams.set("category_group_code", KAKAO_SUBWAY_CATEGORY);
  requestUrl.searchParams.set("size", String(Math.min(limit, 15)));

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const payload = await response.json();
  const seen = new Set();
  return (payload.documents ?? [])
    .map(normalizeKakaoStation)
    .filter((suggestion) => {
      if (!Number.isFinite(suggestion.lat) || !Number.isFinite(suggestion.lng)) {
        return false;
      }
      const key = `${suggestion.label}:${suggestion.lat}:${suggestion.lng}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return NextResponse.json({ query: "", suggestions: [] });
  }

  const limit = clamp(numberParam(searchParams, "limit") ?? 10, 1, 30);

  let supabaseUrl;
  let supabaseKey;
  try {
    supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
    supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const [response, subwaySuggestions] = await Promise.all([
    fetch(`${supabaseUrl}/rest/v1/rpc/search_location_suggestions`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        search_query: query,
        result_limit: Math.round(limit),
      }),
      cache: "no-store",
    }),
    fetchSubwaySuggestions(query, limit),
  ]);

  if (!response.ok) {
    const body = await response.text();
    return jsonError("Supabase search suggestions failed.", response.status, { body });
  }

  const payload = await response.json();
  const locationSuggestions = Array.isArray(payload)
    ? payload
    : payload?.search_location_suggestions ?? [];
  const suggestions = [...locationSuggestions, ...subwaySuggestions]
    .filter((suggestion) => suggestion.type !== "subway" || suggestion.lat !== null)
    .sort((a, b) => {
      const rankDiff = suggestionRank(a) - suggestionRank(b);
      if (rankDiff !== 0) {
        return rankDiff;
      }
      return String(a.label).localeCompare(String(b.label), "ko");
    })
    .slice(0, limit);

  return NextResponse.json({
    query,
    suggestions,
  });
}
