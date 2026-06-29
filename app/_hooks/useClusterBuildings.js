"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { uniqueBuildingsById } from "../_lib/building-list";
import { appendFilters } from "../_lib/search-filters";
import { appendLocationFilter } from "../_lib/search-url";

const CLUSTER_LIST_PAGE_SIZE = 30;

export function boundsFromClusterMarker(marker) {
  const bounds = {
    swLat: Number(marker?.sw_lat),
    swLng: Number(marker?.sw_lng),
    neLat: Number(marker?.ne_lat),
    neLng: Number(marker?.ne_lng),
  };

  return Object.values(bounds).every(Number.isFinite) ? bounds : null;
}

export function useClusterBuildings({
  filters,
  locationFilter,
  listMode,
  setError,
  setListBuildings,
  setListLoading,
  setResultCount,
}) {
  const clusterListRef = useRef(null);
  const pendingClusterAbortRef = useRef(null);
  const isFetchingClusterListRef = useRef(false);

  const abortClusterList = useCallback((clearLoading = true) => {
    pendingClusterAbortRef.current?.abort();
    pendingClusterAbortRef.current = null;
    clusterListRef.current = null;
    isFetchingClusterListRef.current = false;
    if (clearLoading) {
      setListLoading(false);
    }
  }, [setListLoading]);

  useEffect(() => () => abortClusterList(false), [abortClusterList]);

  useEffect(() => {
    if (listMode !== "cluster") {
      abortClusterList();
    }
  }, [abortClusterList, listMode]);

  const fetchClusterListPage = useCallback(
    async ({ bounds, offset = 0, append = false, total = null, filtersOverride = filters }) => {
      if (isFetchingClusterListRef.current) {
        return clusterListRef.current?.nextOffset ?? null;
      }

      const controller = new AbortController();
      pendingClusterAbortRef.current = controller;
      isFetchingClusterListRef.current = true;
      setListLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          swLat: String(bounds.swLat),
          swLng: String(bounds.swLng),
          neLat: String(bounds.neLat),
          neLng: String(bounds.neLng),
          limit: String(CLUSTER_LIST_PAGE_SIZE),
          offset: String(offset),
        });
        appendLocationFilter(params, locationFilter);
        appendFilters(params, filtersOverride);
        const response = await fetch(`/api/buildings/in-bounds/list?${params}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "선택한 클러스터의 매물 목록을 불러오지 못했습니다.");
        }
        setError("");
        setListBuildings((currentBuildings) =>
          uniqueBuildingsById(
            append ? [...currentBuildings, ...payload.buildings] : payload.buildings,
          ),
        );
        setResultCount(total ?? payload.total ?? payload.count ?? payload.buildings.length);
        return payload.nextOffset;
      } catch (clusterError) {
        if (clusterError.name !== "AbortError") {
          setError(clusterError.message);
        }
        return null;
      } finally {
        if (pendingClusterAbortRef.current === controller) {
          pendingClusterAbortRef.current = null;
        }
        isFetchingClusterListRef.current = false;
        setListLoading(false);
      }
    },
    [filters, locationFilter, setError, setListBuildings, setListLoading, setResultCount],
  );

  const selectCluster = useCallback(
    async ({ bounds, total = null, filtersOverride = filters }) => {
      pendingClusterAbortRef.current?.abort();
      const clusterListState = {
        bounds,
        filters: filtersOverride,
        locationFilter,
        nextOffset: null,
        total,
      };
      clusterListRef.current = clusterListState;

      const nextOffset = await fetchClusterListPage({ bounds, total, filtersOverride });
      if (clusterListRef.current === clusterListState) {
        clusterListRef.current = {
          ...clusterListState,
          nextOffset,
        };
      }
    },
    [fetchClusterListPage, filters, locationFilter],
  );

  const fetchNextClusterListPage = useCallback(async () => {
    const clusterList = clusterListRef.current;
    if (listMode !== "cluster" || !clusterList || clusterList.nextOffset === null) {
      return false;
    }

    const nextOffset = await fetchClusterListPage({
      bounds: clusterList.bounds,
      offset: clusterList.nextOffset,
      append: true,
      total: clusterList.total,
      filtersOverride: clusterList.filters,
    });
    if (clusterListRef.current === clusterList) {
      clusterListRef.current = {
        ...clusterList,
        nextOffset,
      };
    }
    return true;
  }, [fetchClusterListPage, listMode]);

  return useMemo(
    () => ({
      abortClusterList,
      fetchNextClusterListPage,
      selectCluster,
    }),
    [abortClusterList, fetchNextClusterListPage, selectCluster],
  );
}
