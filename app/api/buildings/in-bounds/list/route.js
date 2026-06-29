import { NextResponse } from "next/server";

import {
  BOUNDS_CACHE_HEADERS,
  createBoundsRpcPayload,
  createLocationFilterRpcPayload,
  fetchBoundsRpc,
  readBoundsRequest,
} from "../../_bounds-query";

export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestState = readBoundsRequest(searchParams, {
    defaultLimit: 30,
    maxLimit: 100,
    includeOffset: true,
  });
  if (requestState.error) {
    return requestState.error;
  }

  const { bounds, filters, limit, offset, locationFilters } = requestState;
  const result = await fetchBoundsRpc({
    functionName: "search_buildings_list",
    errorMessage: "Supabase bounds list failed.",
    body: createBoundsRpcPayload({
      bounds,
      filters,
      limit,
      offset,
      extra: createLocationFilterRpcPayload(locationFilters),
    }),
  });
  if (result.error) {
    return result.error;
  }

  return NextResponse.json(result.payload, {
    headers: BOUNDS_CACHE_HEADERS,
  });
}
