"use client";

import { useCallback, useEffect, useRef } from "react";

import { appendFilters, filtersKey } from "../_lib/search-filters";

function boundsCacheKey(bounds, filters) {
  const boundsKey = [
    bounds.swLat.toFixed(5),
    bounds.swLng.toFixed(5),
    bounds.neLat.toFixed(5),
    bounds.neLng.toFixed(5),
  ].join(",");

  return `${boundsKey}|${filtersKey(filters)}`;
}

export function useBoundsBuildings({
  filters,
  latestBoundsKeyRef,
  mode,
  setBuildings,
  setError,
  setSelectedId,
}) {
  const boundsCacheRef = useRef(new Map());
  const pendingBoundsAbortRef = useRef(null);

  useEffect(() => {
    return () => {
      pendingBoundsAbortRef.current?.abort();
    };
  }, []);

  return useCallback(
    async (bounds) => {
      const cacheKey = boundsCacheKey(bounds, filters);

      if (latestBoundsKeyRef.current === cacheKey || mode !== "bounds") {
        return;
      }

      latestBoundsKeyRef.current = cacheKey;
      const cachedBuildings = boundsCacheRef.current.get(cacheKey);
      if (cachedBuildings) {
        setBuildings(cachedBuildings);
        setSelectedId((currentId) =>
          cachedBuildings.some((building) => building.id === currentId)
            ? currentId
            : null,
        );
        return;
      }

      pendingBoundsAbortRef.current?.abort();
      const controller = new AbortController();
      pendingBoundsAbortRef.current = controller;
      setError("");

      try {
        const params = new URLSearchParams({
          swLat: String(bounds.swLat),
          swLng: String(bounds.swLng),
          neLat: String(bounds.neLat),
          neLng: String(bounds.neLng),
          limit: "2000",
        });
        appendFilters(params, filters);
        const response = await fetch(`/api/buildings/in-bounds?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "현재 지도 영역의 매물을 불러오지 못했습니다.");
        }
        boundsCacheRef.current.set(cacheKey, payload.buildings);
        if (boundsCacheRef.current.size > 30) {
          const oldestKey = boundsCacheRef.current.keys().next().value;
          boundsCacheRef.current.delete(oldestKey);
        }
        setBuildings(payload.buildings);
        setSelectedId((currentId) =>
          payload.buildings.some((building) => building.id === currentId)
            ? currentId
            : null,
        );
      } catch (boundsError) {
        if (boundsError.name === "AbortError") {
          return;
        }
        setError(boundsError.message);
      } finally {
        if (pendingBoundsAbortRef.current === controller) {
          pendingBoundsAbortRef.current = null;
        }
      }
    },
    [filters, latestBoundsKeyRef, mode, setBuildings, setError, setSelectedId],
  );
}
