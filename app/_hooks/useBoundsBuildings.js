"use client";

import { useCallback, useEffect, useRef } from "react";

import { appendFilters, filtersKey } from "../_lib/search-filters";

const LIST_PAGE_SIZE = 30;

function boundsCacheKey(bounds, filters) {
  const boundsKey = [
    bounds.swLat.toFixed(5),
    bounds.swLng.toFixed(5),
    bounds.neLat.toFixed(5),
    bounds.neLng.toFixed(5),
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
  setListBuildings,
  setListLoading,
  setMarkerBuildings,
  setError,
  setResultCount,
  setSelectedId,
}) {
  const summaryCacheRef = useRef(new Map());
  const listCacheRef = useRef(new Map());
  const latestBoundsRef = useRef(null);
  const pendingSummaryAbortRef = useRef(null);
  const pendingListAbortRef = useRef(null);
  const isFetchingListRef = useRef(false);

  useEffect(() => {
    return () => {
      pendingSummaryAbortRef.current?.abort();
      pendingListAbortRef.current?.abort();
    };
  }, []);

  const fetchListPage = useCallback(
    async ({ bounds, cacheKey, offset = 0, append = false, resultCount = null }) => {
      if (isFetchingListRef.current) {
        return latestBoundsRef.current?.nextOffset ?? null;
      }

      const listCacheKey = `${cacheKey}|${offset}`;
      const cachedPage = listCacheRef.current.get(listCacheKey);
      if (cachedPage) {
        if (latestBoundsKeyRef.current !== cacheKey) {
          return null;
        }
        setListBuildings((currentBuildings) =>
          append ? [...currentBuildings, ...cachedPage.buildings] : cachedPage.buildings,
        );
        if (!append && resultCount !== null) {
          setResultCount(resultCount);
        }
        setListLoading(false);
        return cachedPage.nextOffset;
      }

      pendingListAbortRef.current?.abort();
      const controller = new AbortController();
      pendingListAbortRef.current = controller;
      isFetchingListRef.current = true;
      setListLoading(true);

      try {
        const params = paramsFromBounds(bounds, filters, {
          limit: String(LIST_PAGE_SIZE),
          offset: String(offset),
        });
        const response = await fetch(`/api/buildings/in-bounds/list?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "매물 목록을 불러오지 못했습니다.");
        }
        if (latestBoundsKeyRef.current !== cacheKey) {
          return null;
        }
        listCacheRef.current.set(listCacheKey, {
          buildings: payload.buildings,
          nextOffset: payload.nextOffset,
        });
        trimCache(listCacheRef.current);
        setListBuildings((currentBuildings) =>
          append ? [...currentBuildings, ...payload.buildings] : payload.buildings,
        );
        if (!append && resultCount !== null) {
          setResultCount(resultCount);
        }
        return payload.nextOffset;
      } catch (listError) {
        if (listError.name === "AbortError") {
          return null;
        }
        setError(listError.message);
        return null;
      } finally {
        if (pendingListAbortRef.current === controller) {
          pendingListAbortRef.current = null;
          isFetchingListRef.current = false;
          setListLoading(false);
        }
      }
    },
    [
      filters,
      latestBoundsKeyRef,
      setError,
      setListBuildings,
      setListLoading,
      setResultCount,
    ],
  );

  const fetchBuildingsInBounds = useCallback(
    async (bounds) => {
      const cacheKey = boundsCacheKey(bounds, filters);

      if (latestBoundsKeyRef.current === cacheKey || mode !== "bounds") {
        return;
      }

      latestBoundsKeyRef.current = cacheKey;
      latestBoundsRef.current = {
        bounds,
        cacheKey,
        nextOffset: null,
      };
      pendingSummaryAbortRef.current?.abort();
      pendingListAbortRef.current?.abort();
      pendingListAbortRef.current = null;
      isFetchingListRef.current = false;

      const cachedSummary = summaryCacheRef.current.get(cacheKey);
      if (cachedSummary) {
        setMarkerBuildings(cachedSummary.markers);
        setListBuildings(cachedSummary.buildings);
        setResultCount(cachedSummary.count);
        setListLoading(false);
        setSelectedId((currentId) =>
          cachedSummary.markers.some((building) => building.id === currentId)
            ? currentId
            : null,
        );
        latestBoundsRef.current.nextOffset = cachedSummary.nextOffset;
        return;
      }

      const controller = new AbortController();
      pendingSummaryAbortRef.current = controller;
      setListLoading(true);
      setError("");

      try {
        const params = paramsFromBounds(bounds, filters, {
          limit: "2000",
        });
        const response = await fetch(`/api/buildings/in-bounds/summary?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "현재 지도 영역의 매물을 불러오지 못했습니다.");
        }
        if (latestBoundsKeyRef.current !== cacheKey) {
          return;
        }
        summaryCacheRef.current.set(cacheKey, {
          markers: payload.markers,
          buildings: payload.buildings,
          count: payload.count,
          nextOffset: payload.nextOffset,
        });
        trimCache(summaryCacheRef.current);
        setMarkerBuildings(payload.markers);
        setListBuildings(payload.buildings);
        setResultCount(payload.count);
        setListLoading(false);
        setSelectedId((currentId) =>
          payload.markers.some((building) => building.id === currentId)
            ? currentId
            : null,
        );
        latestBoundsRef.current.nextOffset = payload.nextOffset;
      } catch (boundsError) {
        if (boundsError.name === "AbortError") {
          return;
        }
        setError(boundsError.message);
        setListLoading(false);
      } finally {
        if (pendingSummaryAbortRef.current === controller) {
          pendingSummaryAbortRef.current = null;
        }
      }
    },
    [
      fetchListPage,
      filters,
      latestBoundsKeyRef,
      mode,
      setError,
      setListBuildings,
      setMarkerBuildings,
      setResultCount,
      setSelectedId,
    ],
  );

  const fetchNextListPage = useCallback(async () => {
    const latestBounds = latestBoundsRef.current;
    if (!latestBounds || latestBounds.nextOffset === null || mode !== "bounds") {
      return;
    }
    const nextOffset = await fetchListPage({
      bounds: latestBounds.bounds,
      cacheKey: latestBounds.cacheKey,
      offset: latestBounds.nextOffset,
      append: true,
    });
    latestBoundsRef.current = {
      ...latestBounds,
      nextOffset,
    };
  }, [fetchListPage, mode]);

  return {
    fetchBuildingsInBounds,
    fetchNextListPage,
  };
}
