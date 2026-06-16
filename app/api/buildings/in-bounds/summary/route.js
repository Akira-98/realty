import { NextResponse } from "next/server";

import {
  BOUNDS_CACHE_HEADERS,
  createBoundsRpcPayload,
  fetchBoundsRpc,
  numberParam,
  readBoundsRequest,
} from "../../_bounds-query";

export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

const FIRST_LIST_PAGE_SIZE = 30;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestState = readBoundsRequest(searchParams, {
    defaultLimit: FIRST_LIST_PAGE_SIZE,
    maxLimit: 100,
  });
  if (requestState.error) {
    return requestState.error;
  }

  const { bounds, filters, limit, offset } = requestState;
  const mapLevel =
    numberParam(searchParams, "mapLevel") ??
    numberParam(searchParams, "map_level") ??
    4;

  const result = await fetchBoundsRpc({
    functionName: "search_buildings_summary",
    errorMessage: "Supabase bounds summary failed.",
    body: createBoundsRpcPayload({
      bounds,
      filters,
      limit,
      offset,
      extra: {
        map_level: Math.round(mapLevel),
      },
    }),
  });
  if (result.error) {
    return result.error;
  }

  return NextResponse.json(result.payload, {
    headers: BOUNDS_CACHE_HEADERS,
  });
}
