"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useBoundsBuildings } from "./useBoundsBuildings";
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

export function useSearchWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [focusedBuildingIds, setFocusedBuildingIds] = useState(null);
  const [mode, setMode] = useState("bounds");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [boundsRefreshKey, setBoundsRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasCheckedSearchUrl, setHasCheckedSearchUrl] = useState(false);
  const latestBoundsKeyRef = useRef("");

  const hasResults = Boolean(center);
  const selectedBuilding = useMemo(
    () => buildings.find((building) => building.id === selectedId),
    [buildings, selectedId],
  );
  const displayedBuildings = useMemo(() => {
    if (!focusedBuildingIds) {
      return buildings;
    }
    const focusedIdSet = new Set(focusedBuildingIds);
    return buildings.filter((building) => focusedIdSet.has(building.id));
  }, [buildings, focusedBuildingIds]);

  const resetMapFilter = useCallback((refreshBounds = true) => {
    setMode("bounds");
    setSelectedId(null);
    setFocusedBuildingIds(null);
    latestBoundsKeyRef.current = "";
    if (refreshBounds) {
      setBoundsRefreshKey((key) => key + 1);
    }
  }, []);

  const applyFilters = useCallback((nextFilters) => {
    setFilters(normalizeFilters(nextFilters));
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
    router.push("/");
    setMode("bounds");
    setSelectedId(null);
    setFocusedBuildingIds(null);
    setCenter(null);
    setBuildings([]);
    latestBoundsKeyRef.current = "";
  }, [router]);

  useEffect(() => {
    const urlQuery = searchParams.get("q")?.trim() ?? "";
    const lat = numberParam(searchParams, "lat");
    const lng = numberParam(searchParams, "lng");
    const level = numberParam(searchParams, "level");

    if (!urlQuery || lat === null || lng === null) {
      setQuery(urlQuery);
      setCenter(null);
      setBuildings([]);
      setSelectedId(null);
      setFocusedBuildingIds(null);
      setMode("bounds");
      latestBoundsKeyRef.current = "";
      setHasCheckedSearchUrl(true);
      return;
    }

    const urlMode = searchParams.get("mode") === "marker" ? "marker" : "bounds";
    setQuery(urlQuery);
    setCenter({
      label: searchParams.get("label") || urlQuery,
      lat,
      lng,
      source: searchParams.get("source") || "location",
      level,
    });
    setBuildings([]);
    setSelectedId(null);
    setFocusedBuildingIds(null);
    setMode(urlMode);
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
    setHasCheckedSearchUrl(true);

    if (urlMode !== "marker") {
      return;
    }

    const controller = new AbortController();
    async function restoreBuildingSearch() {
      try {
        const response = await fetch(
          `/api/buildings/search?q=${encodeURIComponent(urlQuery)}`,
          { signal: controller.signal },
        );
        const payload = await response.json();
        if (!response.ok) {
          return;
        }
        setBuildings(payload.buildings);
        setSelectedId(payload.buildings[0]?.id ?? null);
      } catch (restoreError) {
        if (restoreError.name !== "AbortError") {
          setError(restoreError.message);
        }
      }
    }
    restoreBuildingSearch();
    return () => {
      controller.abort();
    };
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

  const fetchBuildingsInBounds = useBoundsBuildings({
    filters,
    latestBoundsKeyRef,
    mode,
    setBuildings,
    setError,
    setSelectedId,
  });

  const handleSearch = useSearchSubmit({
    latestBoundsKeyRef,
    query,
    router,
    setError,
    setLoading,
  });

  const handleMarkerSelect = useCallback((markerBuildings) => {
    const markerIds = markerBuildings.map((building) => building.id);
    setMode("marker");
    setSelectedId(markerIds[0] ?? null);
    setFocusedBuildingIds(markerIds);
  }, []);

  return {
    boundsRefreshKey,
    buildings,
    center,
    displayedBuildings,
    error,
    filters,
    applyFilters,
    fetchBuildingsInBounds,
    handleMapMove,
    handleMapViewportChange,
    handleMarkerSelect,
    handleSearch,
    hasCheckedSavedState: hasCheckedSearchUrl,
    hasResults,
    loading,
    query,
    resetToLanding,
    resetListingFilters,
    selectedBuilding,
    selectedId,
    setQuery,
  };
}
