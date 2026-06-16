import { NextResponse } from "next/server";

import {
  BOUNDS_CACHE_HEADERS,
  LIST_SELECT,
  MARKER_SELECT,
  fetchBoundsRows,
  readBoundsRequest,
} from "../../_bounds-query";

export const dynamic = "force-dynamic";
export const preferredRegion = "syd1";

const FIRST_LIST_PAGE_SIZE = 30;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const requestState = readBoundsRequest(searchParams, {
    defaultLimit: 5000,
    maxLimit: 5000,
  });
  if (requestState.error) {
    return requestState.error;
  }

  const { bounds, filters, limit } = requestState;
  const [markerResult, listResult] = await Promise.all([
    fetchBoundsRows({
      select: MARKER_SELECT,
      bounds,
      filters,
      limit,
      errorMessage: "Supabase bounds summary failed.",
    }),
    fetchBoundsRows({
      select: LIST_SELECT,
      bounds,
      filters,
      limit: FIRST_LIST_PAGE_SIZE,
      errorMessage: "Supabase bounds list failed.",
    }),
  ]);
  if (markerResult.error) {
    return markerResult.error;
  }
  if (listResult.error) {
    return listResult.error;
  }

  const nextOffset = listResult.rows.length;

  return NextResponse.json(
    {
      bounds,
      filters,
      count: markerResult.total,
      markerCount: markerResult.rows.length,
      markersTruncated: markerResult.rows.length < markerResult.total,
      markers: markerResult.rows,
      buildings: listResult.rows,
      limit: FIRST_LIST_PAGE_SIZE,
      offset: 0,
      nextOffset: nextOffset < markerResult.total ? nextOffset : null,
    },
    {
      headers: BOUNDS_CACHE_HEADERS,
    },
  );
}
