"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { boundsFromClusterMarker, useClusterBuildings } from "./useClusterBuildings";
import { uniqueBuildingsById } from "../_lib/building-list";
import { appendFilters } from "../_lib/search-filters";

export function useResultsPanel({ filters, filtersKey, searchRadius, setError, setMode }) {
  const [listBuildings, setListBuildings] = useState([]);
  const [resultCount, setResultCount] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [listMode, setListMode] = useState("empty");
  const [listLoading, setListLoading] = useState(false);
  const markerDetailsAbortRef = useRef(null);
  const selectedListContextRef = useRef(null);

  useEffect(() => {
    return () => {
      markerDetailsAbortRef.current?.abort();
    };
  }, []);

  const abortMarkerDetails = useCallback(() => {
    markerDetailsAbortRef.current?.abort();
    markerDetailsAbortRef.current = null;
  }, []);

  const clusterBuildings = useClusterBuildings({
    filters,
    listMode,
    searchRadius,
    setError,
    setListBuildings,
    setListLoading,
    setResultCount,
  });

  const closeResultsPanel = useCallback(() => {
    abortMarkerDetails();
    setListMode("empty");
    setSelectedId(null);
    setListBuildings([]);
    setResultCount(null);
    setListLoading(false);
    selectedListContextRef.current = null;
  }, [abortMarkerDetails]);

  const resetResultsPanel = useCallback(() => {
    closeResultsPanel();
    clusterBuildings.abortClusterList();
  }, [closeResultsPanel, clusterBuildings]);

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
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "선택한 매물 목록을 불러오지 못했습니다.");
        }
        const uniqueBuildings = uniqueBuildingsById(payload.buildings);
        setError("");
        setListBuildings(uniqueBuildings);
        setResultCount(payload.count ?? uniqueBuildings.length);
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
    [abortMarkerDetails, filters, setError],
  );

  const selectMarkerGroup = useCallback(
    async (markerGroup) => {
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
      const markerIds = [...new Set(markerBuildings.map((building) => building.id))];
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
    },
    [abortMarkerDetails, clusterBuildings, fetchMarkerBuildingsByIds, setError, setMode],
  );

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
  }, [filtersKey]);

  const fetchNextClusterListPage = useCallback(async () => {
    await clusterBuildings.fetchNextClusterListPage();
  }, [clusterBuildings]);

  return {
    abortMarkerDetails,
    closeResultsPanel,
    displayedBuildings: listBuildings,
    fetchNextClusterListPage,
    hasActiveContext: listMode !== "empty" && Boolean(selectedListContextRef.current),
    listLoading,
    listMode,
    resetResultsPanel,
    resultCount,
    selectMarkerGroup,
    selectedId,
  };
}
