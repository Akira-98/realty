"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { useBoundsBuildings } from "./useBoundsBuildings";
import { useResultsPanel } from "./useResultsPanel";
import { useSearchSubmit } from "./useSearchSubmit";
import {
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
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const [query, setQuery] = useState("");
  const [center, setCenter] = useState(null);
  const [markerBuildings, setMarkerBuildings] = useState([]);
  const [mode, setMode] = useState("bounds");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [boundsRefreshKey, setBoundsRefreshKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [hasCheckedSearchUrl, setHasCheckedSearchUrl] = useState(false);
  const latestBoundsKeyRef = useRef("");
  const activeFiltersKey = filtersKey(filters);

  const hasResults = Boolean(center);

  const resultsPanel = useResultsPanel({
    filters,
    filtersKey: activeFiltersKey,
    setError,
    setMode,
  });

  const applyFilters = useCallback((nextFilters, options = {}) => {
    resultsPanel.abortMarkerDetails();
    const normalizedFilters = normalizeFilters(nextFilters);
    setFilters(normalizedFilters);
    if (options.center) {
      setCenter((currentCenter) => ({
        ...(currentCenter ?? {}),
        ...options.center,
        source: "businessDistrict",
      }));
    }
    setMode("bounds");
    if (!resultsPanel.hasActiveContext) {
      resultsPanel.resetResultsPanel();
    }
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
  }, [resultsPanel]);

  const resetListingFilters = useCallback(() => {
    applyFilters(EMPTY_FILTERS);
  }, [applyFilters]);

  const resetToLanding = useCallback(() => {
    resultsPanel.resetResultsPanel();
    router.push("/");
    setMode("bounds");
    setCenter(null);
    setMarkerBuildings([]);
    latestBoundsKeyRef.current = "";
  }, [resultsPanel, router]);

  const closeResultsPanel = useCallback(() => {
    resultsPanel.closeResultsPanel();
    if (pathname.startsWith("/buildings/")) {
      const currentSearch = searchParams.toString();
      router.replace(`/${currentSearch ? `?${currentSearch}` : ""}`);
    }
  }, [pathname, resultsPanel, router, searchParams]);

  useEffect(() => {
    const urlQuery = searchParams.get("q")?.trim() ?? "";
    const lat = numberParam(searchParams, "lat");
    const lng = numberParam(searchParams, "lng");
    const level = numberParam(searchParams, "level");

    if (!urlQuery || lat === null || lng === null) {
      setQuery(urlQuery);
      setCenter(null);
      setMarkerBuildings([]);
      setMode("bounds");
      resultsPanel.resetResultsPanel();
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
    setMode("bounds");
    resultsPanel.resetResultsPanel();
    latestBoundsKeyRef.current = "";
    setBoundsRefreshKey((key) => key + 1);
    setHasCheckedSearchUrl(true);
  }, [searchParamsKey]);

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

  const boundsBuildings = useBoundsBuildings({
    filters,
    latestBoundsKeyRef,
    mode,
    setMarkerBuildings,
    setError,
  });

  const handleSearch = useSearchSubmit({
    latestBoundsKeyRef,
    query,
    router,
    setError,
    setLoading,
  });

  return {
    boundsRefreshKey,
    center,
    displayedBuildings: resultsPanel.displayedBuildings,
    error,
    filters,
    applyFilters,
    fetchBuildingsInBounds: boundsBuildings.fetchBuildingsInBounds,
    fetchNextClusterListPage: resultsPanel.fetchNextClusterListPage,
    handleMapMove,
    handleMapViewportChange,
    handleMarkerSelect: resultsPanel.selectMarkerGroup,
    handleCloseResultsPanel: closeResultsPanel,
    handleSearch,
    hasCheckedSavedState: hasCheckedSearchUrl,
    hasResults,
    listLoading: resultsPanel.listLoading,
    listMode: resultsPanel.listMode,
    loading,
    markerBuildings,
    query,
    resetToLanding,
    resetListingFilters,
    resultCount: resultsPanel.resultCount,
    selectedId: resultsPanel.selectedId,
    setQuery,
  };
}
