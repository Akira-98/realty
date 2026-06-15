"use client";

import { useEffect, useRef, useState } from "react";

import {
  FILTER_GROUPS,
  SUBWAY_WALK_OPTIONS,
  filterSummary,
} from "../../_lib/search-filters";

export function AdminToolbar({
  error,
  filters,
  loading,
  query,
  setFilters,
  setQuery,
  visibility,
  setVisibility,
  onResetFilters,
  onSearch,
}) {
  const filtersRef = useRef(null);
  const [openFilter, setOpenFilter] = useState("");

  useEffect(() => {
    function closeOnOutsideClick(event) {
      if (!filtersRef.current?.contains(event.target)) {
        setOpenFilter("");
      }
    }

    document.addEventListener("pointerdown", closeOnOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, []);

  return (
    <section className="adminToolbar">
      <form
        className="adminSearch"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="건물명 또는 주소"
        />
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
        >
          <option value="all">전체</option>
          <option value="public">공개</option>
          <option value="private">비공개</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "조회 중" : "조회"}
        </button>
        <div ref={filtersRef} className="adminRangeFilters">
          {FILTER_GROUPS.map((group) => {
            const isActive = Boolean(filters[group.minKey] || filters[group.maxKey]);

            return (
              <details
                key={group.label}
                open={openFilter === group.label}
                className={isActive ? "adminFilterPopover active" : "adminFilterPopover"}
              >
                <summary
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenFilter((currentFilter) =>
                      currentFilter === group.label ? "" : group.label,
                    );
                  }}
                >
                  <span>{group.label}</span>
                </summary>
                <div className="adminFilterDropdown">
                  <strong>{filterSummary(filters, group)}</strong>
                  <div className="adminFilterInputs">
                    <label>
                      최소
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="0"
                        value={filters[group.minKey] ?? ""}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            [group.minKey]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <label>
                      최대
                      <input
                        type="number"
                        inputMode="numeric"
                        min="0"
                        placeholder="제한 없음"
                        value={filters[group.maxKey] ?? ""}
                        onChange={(event) =>
                          setFilters((current) => ({
                            ...current,
                            [group.maxKey]: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>
                  <span>{group.unit} 기준</span>
                  <div className="adminFilterActions">
                    <button
                      type="button"
                      className="adminGhostButton"
                      onClick={() => {
                        onResetFilters();
                        setOpenFilter("");
                      }}
                    >
                      초기화
                    </button>
                    <button type="submit" onClick={() => setOpenFilter("")}>
                      적용
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
          <details
            open={openFilter === "subwayWalk"}
            className={filters.subwayWalkMax ? "adminFilterPopover active" : "adminFilterPopover"}
          >
            <summary
              onClick={(event) => {
                event.preventDefault();
                setOpenFilter((currentFilter) =>
                  currentFilter === "subwayWalk" ? "" : "subwayWalk",
                );
              }}
            >
              <span>지하철</span>
            </summary>
            <div className="adminFilterDropdown">
              <strong>지하철역과의 거리</strong>
              <div className="adminFilterChoices">
                {SUBWAY_WALK_OPTIONS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={filters.subwayWalkMax === minutes ? "active" : ""}
                    onClick={() =>
                      setFilters((current) => ({
                        ...current,
                        subwayWalkMax:
                          current.subwayWalkMax === minutes ? "" : minutes,
                      }))
                    }
                  >
                    {minutes}분
                  </button>
                ))}
              </div>
              <div className="adminFilterActions">
                <button
                  type="button"
                  className="adminGhostButton"
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      subwayWalkMax: "",
                    }))
                  }
                >
                  초기화
                </button>
                <button type="submit" onClick={() => setOpenFilter("")}>
                  적용
                </button>
              </div>
            </div>
          </details>
        </div>
      </form>
      {error && <p className="adminError">{error}</p>}
    </section>
  );
}
