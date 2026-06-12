import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../lib/http";

export const dynamic = "force-dynamic";

const KAKAO_ADDRESS_URL =
  "https://dapi.kakao.com/v2/local/search/address.json";
const KAKAO_KEYWORD_URL =
  "https://dapi.kakao.com/v2/local/search/keyword.json";
const LOCATION_CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
};
const ADDRESS_HINT_PATTERN =
  /(\d|대로|번길|길|로|(?:^|\s)[가-힣]+(?:시|군|구|동|읍|면|리)(?:\s|$))/;

async function kakaoSearch(url, query, apiKey) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set("query", query);
  requestUrl.searchParams.set("size", "5");

  const response = await fetch(requestUrl, {
    headers: {
      Authorization: `KakaoAK ${apiKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    return {
      ok: false,
      status: response.status,
      body,
    };
  }

  return {
    ok: true,
    data: await response.json(),
  };
}

function normalizeAddressDocument(document) {
  return {
    label: document.road_address?.address_name || document.address_name,
    address: document.address_name,
    road_address: document.road_address?.address_name || "",
    lat: Number(document.y),
    lng: Number(document.x),
    source: "address",
  };
}

function normalizeKeywordDocument(document) {
  return {
    label: document.place_name,
    address: document.address_name,
    road_address: document.road_address_name || "",
    lat: Number(document.y),
    lng: Number(document.x),
    source: "keyword",
  };
}

function jsonLocation(payload) {
  return NextResponse.json(payload, {
    headers: LOCATION_CACHE_HEADERS,
  });
}

function hasAddressHint(query) {
  return ADDRESS_HINT_PATTERN.test(query);
}

async function findLocation({ query, apiKey, searchType }) {
  const isAddressSearch = searchType === "address";
  const result = await kakaoSearch(
    isAddressSearch ? KAKAO_ADDRESS_URL : KAKAO_KEYWORD_URL,
    query,
    apiKey,
  );

  if (!result.ok) {
    return result;
  }

  const candidates = result.data.documents.map(
    isAddressSearch ? normalizeAddressDocument : normalizeKeywordDocument,
  );

  return {
    ok: true,
    searchType,
    candidates,
  };
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();

  if (!query) {
    return jsonError("q is required.");
  }

  let apiKey;
  try {
    apiKey = requiredEnv("KAKAO_REST_API_KEY");
  } catch (error) {
    return jsonError(error.message, 500);
  }

  const searchOrder = hasAddressHint(query)
    ? ["address", "keyword"]
    : ["keyword", "address"];

  for (const searchType of searchOrder) {
    const result = await findLocation({ query, apiKey, searchType });
    if (!result.ok) {
      return jsonError(`Kakao ${searchType} search failed.`, result.status, {
        body: result.body,
      });
    }

    if (result.candidates.length > 0) {
      return jsonLocation({
        query,
        result: result.candidates[0],
        candidates: result.candidates,
      });
    }
  }

  return jsonError("No location found.", 404);
}
