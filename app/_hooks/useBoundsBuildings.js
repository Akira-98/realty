"use client";

import { useCallback, useEffect, useRef } from "react";

import { appendFilters, filtersKey } from "../_lib/search-filters";

function boundsCacheKey(bounds, filters, searchRadius) {
  const boundsKey = [
    bounds.swLat.toFixed(5),
    bounds.swLng.toFixed(5),
    bounds.neLat.toFixed(5),
    bounds.neLng.toFixed(5),
    bounds.mapLevel ?? "",
    searchRadius?.searchLat?.toFixed(5) ?? "",
    searchRadius?.searchLng?.toFixed(5) ?? "",
    searchRadius?.radius ?? "",
  ].join(",");

  return `${boundsKey}|${filtersKey(filters)}`;
}

function paramsFromBounds(bounds, filters, extraParams = {}) {
  const params = new URLSearchParams({
    swLat: String(bounds.swLat),
    swLng: String(bounds.swLng),
    neLat: String(bounds.neLat),
    neLng: String(bounds.neLng),
    ...extraParams,
  });
  appendFilters(params, filters);
  return params;
}

function trimCache(cache) {
  if (cache.size <= 30) {
    return;
  }
  const oldestKey = cache.keys().next().value;
  cache.delete(oldestKey);
}

export function useBoundsBuildings({
  filters,
  latestBoundsKeyRef,
  mode,
  searchRadius,
  setMarkerBuildings,
  setError,
}) {
  const summaryCacheRef = useRef(new Map());
  const pendingSummaryAbortRef = useRef(null);

  useEffect(() => {
    return () => {
      pendingSummaryAbortRef.current?.abort();
    };
  }, []);

  const fetchBuildingsInBounds = useCallback(
    async (bounds) => {
      const cacheKey = boundsCacheKey(bounds, filters, searchRadius);

      if (latestBoundsKeyRef.current === cacheKey || mode !== "bounds") {
        return;
      }

      latestBoundsKeyRef.current = cacheKey;
      pendingSummaryAbortRef.current?.abort();

      const cachedSummary = summaryCacheRef.current.get(cacheKey);
      if (cachedSummary) {
        setMarkerBuildings(cachedSummary.markers);
        return;
      }

      const controller = new AbortController();
      pendingSummaryAbortRef.current = controller;
      setError("");

      try {
        const params = paramsFromBounds(bounds, filters);
        if (bounds.mapLevel) {
          params.set("mapLevel", String(bounds.mapLevel));
        }
        if (searchRadius) {
          params.set("searchLat", String(searchRadius.searchLat));
          params.set("searchLng", String(searchRadius.searchLng));
          params.set("radius", String(searchRadius.radius));
        }
        const response = await fetch(`/api/buildings/in-bounds/summary?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "현재 지도 영역의 매물을 불러오지 못했습니다.");
        }
        if (latestBoundsKeyRef.current !== cacheKey) {
          return;
        }
        setError("");
        summaryCacheRef.current.set(cacheKey, {
          markers: payload.markers,
        });
        trimCache(summaryCacheRef.current);
        setMarkerBuildings(payload.markers);
      } catch (boundsError) {
        if (boundsError.name === "AbortError") {
          return;
        }
        setError(boundsError.message);
      } finally {
        if (pendingSummaryAbortRef.current === controller) {
          pendingSummaryAbortRef.current = null;
        }
      }
    },
    [
      filters,
      latestBoundsKeyRef,
      mode,
      searchRadius,
      setError,
      setMarkerBuildings,
    ],
  );

  return {
    fetchBuildingsInBounds,
  };
}
