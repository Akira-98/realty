"use client";

import { useCallback } from "react";

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
