"use client";

import { useCallback } from "react";

import {
  centerFromBuildings,
  isSpecificBuildingSearch,
} from "../_lib/buildings";
import { buildSearchUrl } from "../_lib/search-url";

export function useSearchSubmit({
  latestBoundsKeyRef,
  query,
  router,
  setError,
  setLoading,
}) {
  return useCallback(
    async (event) => {
      event.preventDefault();
      const nextQuery = query.trim();
      if (!nextQuery) {
        setError("검색어를 입력해 주세요.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const buildingResponse = await fetch(
          `/api/buildings/search?q=${encodeURIComponent(nextQuery)}`,
        );
        const buildingPayload = await buildingResponse.json();
        if (!buildingResponse.ok) {
          throw new Error(buildingPayload.error || "매물을 검색하지 못했습니다.");
        }

        if (isSpecificBuildingSearch(nextQuery, buildingPayload.buildings)) {
          const nextCenter = centerFromBuildings(nextQuery, buildingPayload.buildings);
          if (!nextCenter) {
            throw new Error("검색된 건물에 좌표가 없습니다.");
          }
          latestBoundsKeyRef.current = "";
          router.push(buildSearchUrl({ query: nextQuery, center: nextCenter, mode: "marker" }));
          return;
        }

        if (buildingPayload.buildings.length > 0) {
          const nextCenter = centerFromBuildings(nextQuery, buildingPayload.buildings);
          if (!nextCenter) {
            throw new Error("검색된 매물에 좌표가 없습니다.");
          }
          latestBoundsKeyRef.current = "";
          router.push(buildSearchUrl({ query: nextQuery, center: nextCenter, mode: "bounds" }));
          return;
        }

        const locationResponse = await fetch(
          `/api/search-location?q=${encodeURIComponent(nextQuery)}`,
        );
        const locationPayload = await locationResponse.json();
        if (!locationResponse.ok) {
          throw new Error(locationPayload.error || "위치를 찾지 못했습니다.");
        }

        latestBoundsKeyRef.current = "";
        router.push(
          buildSearchUrl({
            query: nextQuery,
            center: locationPayload.result,
            mode: "bounds",
          }),
        );
      } catch (searchError) {
        setError(searchError.message);
      } finally {
        setLoading(false);
      }
    },
    [latestBoundsKeyRef, query, router, setError, setLoading],
  );
}
