"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useBoundsBuildings } from "./useBoundsBuildings";
import { boundsFromClusterMarker, useClusterBuildings } from "./useClusterBuildings";
import { useSearchSubmit } from "./useSearchSubmit";
import {
  appendFilters,
  EMPTY_FILTERS,
  filtersKey,
  normalizeFilters,
} from "../_lib/search-filters";
import { numberParam } from "../_lib/search-url";

function replaceSearchViewUrl(view) {
  if (typeof window === "undefined") {
    return;
  }

  const nextUrl = new URL(window.location.href);
  if (!nextUrl.searchParams.has("q")) {
    return;
  }

  nextUrl.searchParams.set("lat", String(view.lat));
  nextUrl.searchParams.set("lng", String(view.lng));
  if (view.level) {
    nextUrl.searchParams.set("level", String(view.level));
  } else {
    nextUrl.searchParams.delete("level");
  }
  nextUrl.searchParams.delete("mode");
  window.history.replaceState(window.history.state, "", nextUrl);
}

export function useSearchWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState(null);
  const [markerBuildings, setMarkerBuildings] = useState([]);
  const [listBuildings, setListBuildings] = useState([]);
  const [resultCount, setResultCount] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("bounds");
  const [listMode, setListMode] = useState("empty");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [boundsRefreshKey, setBoundsRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasCheckedSearchUrl, setHasCheckedSearchUrl] = useState(false);
  const latestBoundsKeyRef = useRef("");
  const markerDetailsAbortRef = useRef(null);
  const selectedListContextRef = useRef(null);
  const activeFiltersKey = filtersKey(filters);

  useEffect(() => {
    return () => {
      markerDetailsAbortRef.current?.abort();
    };
  }, []);

  const hasResults = Boolean(center);

  const abortMarkerDetails = useCallback(() => {
    markerDetailsAbortRef.current?.abort();
    markerDetailsAbortRef.current = null;
  }, []);

  const applyFilters = useCallback((nextFilters, options = {}) => {
    abortMarkerDetails();
    const normalizedFilters = normalizeFilters(nextFilters);
    const shouldKeepPanelOpen = listMode !== "empty" && selectedListContextRef.current;
    setFilters(normalizedFilters);
    if (options.center) {
      setCenter((currentCenter) => ({
        ...(currentCenter ?? {}),
        ...options.center,
        source: "businessDistrict",
      }));
    }
    setMode("bounds");
    if (!shouldKeepPanelOpen) {
      selectedListContextRef.current = null;
      setListMode("empty");
      setSelectedId(null);
      setListBuildings([]);
      setResultCount(null);
    }
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
  }, [abortMarkerDetails, listMode]);

  const resetListingFilters = useCallback(() => {
    applyFilters(EMPTY_FILTERS);
  }, [applyFilters]);

  const resetToLanding = useCallback(() => {
    abortMarkerDetails();
    router.push("/");
    setMode("bounds");
    setListMode("empty");
    setSelectedId(null);
    setCenter(null);
    setMarkerBuildings([]);
    setListBuildings([]);
    setResultCount(null);
    selectedListContextRef.current = null;
    latestBoundsKeyRef.current = "";
  }, [abortMarkerDetails, router]);

  useEffect(() => {
    const urlQuery = searchParams.get("q")?.trim() ?? "";
    const lat = numberParam(searchParams, "lat");
    const lng = numberParam(searchParams, "lng");
    const level = numberParam(searchParams, "level");

    if (!urlQuery || lat === null || lng === null) {
      setQuery(urlQuery);
      setCenter(null);
      setMarkerBuildings([]);
      setListBuildings([]);
      setResultCount(null);
      setSelectedId(null);
      setMode("bounds");
      setListMode("empty");
      selectedListContextRef.current = null;
      latestBoundsKeyRef.current = "";
      setHasCheckedSearchUrl(true);
      return;
    }

    const source = searchParams.get("source") || "location";

    setQuery(source === "default" ? "" : urlQuery);
    setCenter({
      label: searchParams.get("label") || urlQuery,
      lat,
      lng,
      source,
      level,
    });
    setMarkerBuildings([]);
    setListBuildings([]);
    setResultCount(null);
    setSelectedId(null);
    setMode("bounds");
    setListMode("empty");
    selectedListContextRef.current = null;
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
    setHasCheckedSearchUrl(true);
  }, [searchParams]);

  const handleMapMove = useCallback(() => {
    if (mode !== "marker") {
      return;
    }
    setMode("bounds");
    latestBoundsKeyRef.current = "";
  }, [mode]);

  const handleMapViewportChange = useCallback(
    (view) => {
      replaceSearchViewUrl(view);
    },
    [],
  );

  const handleCloseResultsPanel = useCallback(() => {
    abortMarkerDetails();
    setListMode("empty");
    setSelectedId(null);
    setListBuildings([]);
    setResultCount(null);
    setListLoading(false);
    selectedListContextRef.current = null;
  }, [abortMarkerDetails]);

  const boundsBuildings = useBoundsBuildings({
    filters,
    latestBoundsKeyRef,
    mode,
    setMarkerBuildings,
    setError,
  });

  const clusterBuildings = useClusterBuildings({
    filters,
    listMode,
    setError,
    setListBuildings,
    setListLoading,
    setResultCount,
  });

  const handleSearch = useSearchSubmit({
    latestBoundsKeyRef,
    query,
    router,
    setError,
    setLoading,
  });

  const fetchMarkerBuildingsByIds = useCallback(
    async (markerIds, filtersOverride = filters) => {
      abortMarkerDetails();

      if (markerIds.length === 0) {
        setListMode("empty");
        setListBuildings([]);
        setResultCount(0);
        return;
      }

      const controller = new AbortController();
      markerDetailsAbortRef.current = controller;
      setListLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        markerIds.forEach((id) => params.append("id", id));
        appendFilters(params, filtersOverride);
        const response = await fetch(`/api/buildings/by-ids?${params}`, {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "선택한 매물 목록을 불러오지 못했습니다.");
        }
        setListBuildings(payload.buildings);
        setResultCount(payload.count ?? markerIds.length);
      } catch (markerError) {
        if (markerError.name !== "AbortError") {
          setError(markerError.message);
        }
      } finally {
        if (markerDetailsAbortRef.current === controller) {
          markerDetailsAbortRef.current = null;
          setListLoading(false);
        }
      }
    },
    [abortMarkerDetails, filters],
  );

  const handleMarkerSelect = useCallback(async (markerGroup) => {
    abortMarkerDetails();
    clusterBuildings.abortClusterList();
    setMode("marker");
    setListMode("marker");
    setListBuildings([]);

    if (markerGroup?.type === "cluster") {
      const clusterBounds = boundsFromClusterMarker(markerGroup.marker);
      setSelectedId(null);
      setListMode("cluster");
      setResultCount(markerGroup.count ?? null);

      if (!clusterBounds) {
        setError("선택한 클러스터의 범위 정보가 없습니다.");
        return;
      }

      selectedListContextRef.current = {
        type: "cluster",
        bounds: clusterBounds,
        total: markerGroup.count ?? null,
      };
      await clusterBuildings.selectCluster({
        bounds: clusterBounds,
        total: markerGroup.count ?? null,
      });
      return;
    }

    const markerBuildings = Array.isArray(markerGroup)
      ? markerGroup
      : markerGroup?.buildings ?? [];
    const markerIds = markerBuildings.map((building) => building.id);
    setSelectedId(markerIds[0] ?? null);
    setResultCount(markerIds.length);

    if (markerIds.length === 0) {
      setListMode("empty");
      selectedListContextRef.current = null;
      return;
    }

    selectedListContextRef.current = {
      type: "marker",
      ids: markerIds,
    };
    await fetchMarkerBuildingsByIds(markerIds);
  }, [abortMarkerDetails, clusterBuildings, fetchMarkerBuildingsByIds, setError]);

  useEffect(() => {
    const selectedListContext = selectedListContextRef.current;
    if (!selectedListContext || listMode === "empty") {
      return;
    }

    if (selectedListContext.type === "cluster") {
      clusterBuildings.selectCluster({
        bounds: selectedListContext.bounds,
        total: null,
        filtersOverride: filters,
      });
      return;
    }

    fetchMarkerBuildingsByIds(selectedListContext.ids, filters);
  }, [activeFiltersKey]);

  const handleLoadMore = useCallback(async () => {
    await clusterBuildings.fetchNextClusterListPage();
  }, [clusterBuildings]);

  return {
    boundsRefreshKey,
    center,
    displayedBuildings: listBuildings,
    error,
    filters,
    applyFilters,
    fetchBuildingsInBounds: boundsBuildings.fetchBuildingsInBounds,
    fetchNextClusterListPage: handleLoadMore,
    handleMapMove,
    handleMapViewportChange,
    handleMarkerSelect,
    handleCloseResultsPanel,
    handleSearch,
    hasCheckedSavedState: hasCheckedSearchUrl,
    hasResults,
    listLoading,
    listMode,
    loading,
    markerBuildings,
    query,
    resetToLanding,
    resetListingFilters,
    resultCount,
    selectedId,
    setQuery,
  };
}
