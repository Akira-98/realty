"use client";

import { useEffect, useRef, useState } from "react";

function suggestionDescription(suggestion) {
  if (suggestion.type === "district") {
    return suggestion.description || suggestion.city || "지역";
  }
  if (suggestion.type === "subway") {
    return "지하철역";
  }
  return "시/도";
}

export function SearchForm({ query, setQuery, onSearch, loading, compact = false }) {
  const formRef = useRef(null);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const selectedSuggestionRef = useRef(null);

  useEffect(() => {
    function handlePointerDown(event) {
      if (formRef.current?.contains(event.target)) {
        return;
      }
      setSuggestionsOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    selectedSuggestionRef.current = null;
    const nextQuery = query.trim();
    if (nextQuery.length < 1) {
      setSuggestions([]);
      setSuggestionsOpen(false);
      setSuggestionsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSuggestionsLoading(true);
      try {
        const response = await fetch(
          `/api/search-suggestions?q=${encodeURIComponent(nextQuery)}`,
          {
            cache: "no-store",
            signal: controller.signal,
          },
        );
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error || "검색 후보를 불러오지 못했습니다.");
        }
        setSuggestions(payload.suggestions ?? []);
        setSuggestionsOpen(true);
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          setSuggestionsOpen(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSuggestionsLoading(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeoutId);
      controller.abort();
    };
  }, [query]);

  function handleSuggestionSelect(suggestion) {
    selectedSuggestionRef.current = suggestion;
    setQuery(suggestion.label);
    setSuggestionsOpen(false);
    onSearch(null, suggestion);
  }

  function handleSubmit(event) {
    setSuggestionsOpen(false);
    onSearch(event, selectedSuggestionRef.current);
  }

  return (
    <form
      ref={formRef}
      className={compact ? "searchForm compact" : "searchForm"}
      onSubmit={handleSubmit}
    >
      <div className="searchInputWrap">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="지역, 지하철역"
          aria-label="검색어"
          autoComplete="off"
          onFocus={() => {
            if (suggestions.length > 0) {
              setSuggestionsOpen(true);
            }
          }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "검색 중" : "검색"}
        </button>
      </div>
      {suggestionsOpen && (suggestions.length > 0 || suggestionsLoading) && (
        <div className="searchSuggestions" role="listbox">
          {suggestions.map((suggestion) => (
            <button
              key={`${suggestion.type}:${suggestion.label}:${suggestion.description || ""}`}
              type="button"
              role="option"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => handleSuggestionSelect(suggestion)}
            >
              <span>{suggestion.label}</span>
              <strong>{suggestionDescription(suggestion)}</strong>
            </button>
          ))}
          {suggestionsLoading && suggestions.length === 0 && (
            <div className="searchSuggestionStatus">검색 중</div>
          )}
        </div>
      )}
    </form>
  );
}
