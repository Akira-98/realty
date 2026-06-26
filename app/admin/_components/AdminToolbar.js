"use client";

import { useEffect, useRef, useState } from "react";

import {
  BUILDING_AGE_OPTIONS,
  BUSINESS_DISTRICT_OPTIONS,
  FILTER_GROUPS,
  SCALE_OPTIONS,
  SUBWAY_WALK_OPTIONS,
  buildingAgeFilterLabel,
  filterSummary,
} from "../../_lib/search-filters";

export function AdminToolbar({
  error,
  filters,
  hasActiveSearch,
  loading,
  query,
  setFilters,
  setQuery,
  onFiltersChange,
  onResetSearch,
  visibility,
  setVisibility,
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

  const applyFilterValues = (values) => {
    const nextFilters = {
      ...filters,
      ...values,
    };
    onFiltersChange(nextFilters);
    setOpenFilter("");
  };

  const resetButton = (label, values) => (
    <button
      type="button"
      className="adminGhostButton adminIconButton"
      aria-label={`${label} 초기화`}
      title={`${label} 초기화`}
      onClick={() => applyFilterValues(values)}
    >
      ↺
    </button>
  );

  const choiceFilters = [
    {
      key: "scale",
      label: "규모",
      valueKey: "scale",
      summary: filters.scale || "전체",
      options: SCALE_OPTIONS.map((scale) => ({
        label: scale,
        value: scale,
      })),
    },
    {
      key: "businessDistrict",
      label: "권역",
      valueKey: "businessDistrict",
      summary: filters.businessDistrict || "전체",
      options: BUSINESS_DISTRICT_OPTIONS.map((district) => ({
        label: district.label,
        title: district.description,
        value: district.value,
      })),
    },
    {
      key: "buildingAge",
      label: "준공연차",
      valueKey: "buildingAgeMax",
      summary: filters.buildingAgeMax ? buildingAgeFilterLabel(filters.buildingAgeMax) : "전체",
      options: BUILDING_AGE_OPTIONS.map((option) => ({
        label: option.label,
        value: option.value,
      })),
    },
    {
      key: "subwayWalk",
      label: "지하철",
      valueKey: "subwayWalkMax",
      summary: filters.subwayWalkMax ? `${filters.subwayWalkMax}분 이내` : "지하철역과의 거리",
      options: SUBWAY_WALK_OPTIONS.map((minutes) => ({
        label: `${minutes}분`,
        value: minutes,
      })),
    },
  ];

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
          <option value="public">노출</option>
          <option value="private">노출종료</option>
        </select>
        <button
          type={hasActiveSearch ? "button" : "submit"}
          disabled={loading}
          onClick={hasActiveSearch ? onResetSearch : undefined}
        >
          {loading ? "조회 중" : hasActiveSearch ? "초기화" : "조회"}
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
                  <span>{group.basisLabel || `${group.unit} 기준`}</span>
                  <div className="adminFilterActions">
                    {resetButton(group.label, {
                      [group.minKey]: "",
                      [group.maxKey]: "",
                    })}
                    <button type="submit" onClick={() => setOpenFilter("")}>
                      적용
                    </button>
                  </div>
                </div>
              </details>
            );
          })}
          {choiceFilters.map((filter) => {
            const activeValue = filters[filter.valueKey];
            const isActive = Boolean(activeValue);

            return (
              <details
                key={filter.key}
                open={openFilter === filter.key}
                className={isActive ? "adminFilterPopover active" : "adminFilterPopover"}
              >
                <summary
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenFilter((currentFilter) =>
                      currentFilter === filter.key ? "" : filter.key,
                    );
                  }}
                >
                  <span>{filter.label}</span>
                </summary>
                <div className="adminFilterDropdown">
                  <strong>{filter.summary}</strong>
                  <div className="adminFilterChoices">
                    {filter.options.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={activeValue === option.value ? "active" : ""}
                        title={option.title}
                        onClick={() => applyFilterValues({
                          [filter.valueKey]:
                            activeValue === option.value ? "" : option.value,
                        })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <div className="adminFilterActions">
                    {resetButton(filter.label, { [filter.valueKey]: "" })}
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      </form>
      {error && <p className="adminError">{error}</p>}
    </section>
  );
}
