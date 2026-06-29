"use client";

import { useCallback } from "react";

import { buildSearchUrl } from "../_lib/search-url";

async function fetchFirstSuggestion(query) {
  const response = await fetch(
    `/api/search-suggestions?q=${encodeURIComponent(query)}&limit=1`,
    { cache: "no-store" },
  );
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "검색 후보를 불러오지 못했습니다.");
  }
  return payload.suggestions?.[0] ?? null;
}

export function useSearchSubmit({
  latestBoundsKeyRef,
  query,
  router,
  setError,
  setLoading,
}) {
  return useCallback(
    async (event, selectedSuggestion = null) => {
      event?.preventDefault?.();
      const nextQuery = query.trim();
      if (!nextQuery) {
        setError("검색어를 입력해 주세요.");
        return;
      }

      setLoading(true);
      setError("");

      try {
        const suggestion = selectedSuggestion ?? (await fetchFirstSuggestion(nextQuery));
        if (!suggestion) {
          throw new Error("검색할 지역 또는 지하철역을 선택해 주세요.");
        }

        latestBoundsKeyRef.current = "";
        router.push(
          buildSearchUrl({
            query: suggestion.label || nextQuery,
            location: suggestion,
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
