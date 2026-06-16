import { NextResponse } from "next/server";

import {
  BOUNDS_CACHE_HEADERS,
  LIST_SELECT,
  fetchBoundsRows,
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

  const { bounds, filters, limit, offset } = requestState;
  const result = await fetchBoundsRows({
    select: LIST_SELECT,
    bounds,
    filters,
    limit,
    offset,
    errorMessage: "Supabase bounds list failed.",
  });
  if (result.error) {
    return result.error;
  }

  const nextOffset = offset + result.rows.length;

  return NextResponse.json(
    {
      bounds,
      filters,
      count: result.rows.length,
      total: result.total,
      limit,
      offset,
      nextOffset: nextOffset < result.total ? nextOffset : null,
      buildings: result.rows,
    },
    {
      headers: BOUNDS_CACHE_HEADERS,
    },
  );
}
