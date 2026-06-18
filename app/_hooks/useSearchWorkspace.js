"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBoundsBuildings } from "./useBoundsBuildings";
import { boundsFromClusterMarker, useClusterBuildings } from "./useClusterBuildings";
import { useSearchSubmit } from "./useSearchSubmit";
import { EMPTY_FILTERS, normalizeFilters } from "../_lib/search-filters";
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

function idKey(id) {
  return id === null || id === undefined ? "" : String(id);
}

function isSameId(left, right) {
  return idKey(left) !== "" && idKey(left) === idKey(right);
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
  const [focusedBuildingIds, setFocusedBuildingIds] = useState(null);
  const [mode, setMode] = useState("bounds");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [boundsRefreshKey, setBoundsRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasCheckedSearchUrl, setHasCheckedSearchUrl] = useState(false);
  const latestBoundsKeyRef = useRef("");
  const markerDetailsAbortRef = useRef(null);

  useEffect(() => {
    return () => {
      markerDetailsAbortRef.current?.abort();
    };
  }, []);

  const hasResults = Boolean(center);
  const selectedBuilding = useMemo(() => {
    return (
      listBuildings.find((building) => isSameId(building.id, selectedId)) ||
      markerBuildings.find((building) => isSameId(building.id, selectedId))
    );
  }, [listBuildings, markerBuildings, selectedId]);
  const displayedBuildings = useMemo(() => {
    if (!focusedBuildingIds) {
      return listBuildings;
    }
    const focusedIdSet = new Set(focusedBuildingIds.map(idKey));
    return listBuildings.filter((building) => focusedIdSet.has(idKey(building.id)));
  }, [listBuildings, focusedBuildingIds]);

  const abortMarkerDetails = useCallback(() => {
    markerDetailsAbortRef.current?.abort();
    markerDetailsAbortRef.current = null;
  }, []);

  const resetMapFilter = useCallback((refreshBounds = true) => {
    abortMarkerDetails();
    setMode("bounds");
    setSelectedId(null);
    setFocusedBuildingIds(null);
    latestBoundsKeyRef.current = "";
    if (refreshBounds) {
      setBoundsRefreshKey((key) => key + 1);
    }
  }, [abortMarkerDetails]);

  const applyFilters = useCallback((nextFilters, options = {}) => {
    setFilters(normalizeFilters(nextFilters));
    if (options.center) {
      setCenter((currentCenter) => ({
        ...(currentCenter ?? {}),
        ...options.center,
        source: "businessDistrict",
      }));
    }
    setMode("bounds");
    setSelectedId(null);
    setFocusedBuildingIds(null);
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
  }, []);

  const resetListingFilters = useCallback(() => {
    applyFilters(EMPTY_FILTERS);
  }, [applyFilters]);

  const resetToLanding = useCallback(() => {
    abortMarkerDetails();
    router.push("/");
    setMode("bounds");
    setSelectedId(null);
    setFocusedBuildingIds(null);
    setCenter(null);
    setMarkerBuildings([]);
    setListBuildings([]);
    setResultCount(null);
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
      setFocusedBuildingIds(null);
      setMode("bounds");
      latestBoundsKeyRef.current = "";
      setHasCheckedSearchUrl(true);
      return;
    }

    setQuery(urlQuery);
    setCenter({
      label: searchParams.get("label") || urlQuery,
      lat,
      lng,
      source: searchParams.get("source") || "location",
      level,
    });
    setMarkerBuildings([]);
    setListBuildings([]);
    setResultCount(null);
    setSelectedId(null);
    setFocusedBuildingIds(null);
    setMode("bounds");
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
    setHasCheckedSearchUrl(true);
  }, [searchParams]);

  const handleMapMove = useCallback(() => {
    if (mode !== "marker") {
      return;
    }
    resetMapFilter(false);
  }, [mode, resetMapFilter]);

  const handleMapViewportChange = useCallback(
    (view) => {
      replaceSearchViewUrl(view);
    },
    [],
  );

  const boundsBuildings = useBoundsBuildings({
    filters,
    latestBoundsKeyRef,
    mode,
    setListBuildings,
    setListLoading,
    setMarkerBuildings,
    setError,
    setResultCount,
    setSelectedId,
  });

  const clusterBuildings = useClusterBuildings({
    filters,
    mode,
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

  const handleMarkerSelect = useCallback(async (markerGroup) => {
    abortMarkerDetails();
    clusterBuildings.abortClusterList();
    setMode("marker");
    setListBuildings([]);

    if (markerGroup?.type === "cluster") {
      const clusterBounds = boundsFromClusterMarker(markerGroup.marker);
      setSelectedId(null);
      setFocusedBuildingIds(null);
      setResultCount(markerGroup.count ?? null);

      if (!clusterBounds) {
        setError("선택한 클러스터의 범위 정보가 없습니다.");
        return;
      }

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
    setFocusedBuildingIds(markerIds);
    setResultCount(markerIds.length);

    if (markerIds.length === 0) {
      return;
    }

    const controller = new AbortController();
    markerDetailsAbortRef.current = controller;
    setListLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      markerIds.forEach((id) => params.append("id", id));
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
  }, [abortMarkerDetails, clusterBuildings, setError]);

  const handleLoadMore = useCallback(async () => {
    const didFetchClusterPage = await clusterBuildings.fetchNextClusterListPage();
    if (didFetchClusterPage) {
      return;
    }

    await boundsBuildings.fetchNextListPage();
  }, [boundsBuildings, clusterBuildings]);

  return {
    boundsRefreshKey,
    center,
    displayedBuildings,
    error,
    filters,
    applyFilters,
    fetchBuildingsInBounds: boundsBuildings.fetchBuildingsInBounds,
    fetchNextListPage: handleLoadMore,
    handleMapMove,
    handleMapViewportChange,
    handleMarkerSelect,
    handleSearch,
    hasCheckedSavedState: hasCheckedSearchUrl,
    hasResults,
    listLoading,
    loading,
    markerBuildings,
    query,
    resetToLanding,
    resetListingFilters,
    resultCount,
    selectedBuilding,
    selectedId,
    setQuery,
  };
}
