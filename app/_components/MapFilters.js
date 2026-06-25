"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import {
  BUILDING_AGE_OPTIONS,
  BUSINESS_DISTRICT_OPTIONS,
  FILTER_GROUPS,
  SCALE_OPTIONS,
  SUBWAY_WALK_OPTIONS,
  filterSummary,
} from "../_lib/search-filters";

function FilterPopover({
  active,
  children,
  label,
  open,
  onToggle,
}) {
  return (
    <details
      open={open}
      className={active ? "mapFilterPopover active" : "mapFilterPopover"}
    >
      <summary
        onClick={(event) => {
          event.preventDefault();
          onToggle();
        }}
      >
        <span>{label}</span>
      </summary>
      <div className="mapFilterDropdown">{children}</div>
    </details>
  );
}

export function MapFilters({ filters, onApply, resultsPanelOpen = false }) {
  const filtersRef = useRef(null);
  const [draft, setDraft] = useState(filters);
  const [openFilter, setOpenFilter] = useState("");
  const className = [
    "mapFilters",
    resultsPanelOpen && "withResultsPanel",
  ].filter(Boolean).join(" ");

  useEffect(() => {
    setDraft(filters);
  }, [filters]);

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

  const applyDraft = (nextDraft, options = {}) => {
    setDraft(nextDraft);
    onApply(nextDraft, options);
    setOpenFilter("");
  };

  const resetDraftValues = (values) => {
    applyDraft({
      ...draft,
      ...values,
    });
  };

  const resetButton = (label, values) => (
    <button
      type="button"
      className="ghostButton"
      aria-label={`${label} 초기화`}
      title={`${label} 초기화`}
      onClick={() => resetDraftValues(values)}
    >
      ↺
    </button>
  );

  return (
    <form
      ref={filtersRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        onApply(draft);
        setOpenFilter("");
      }}
    >
      {FILTER_GROUPS.map((group) => {
        const isActive = Boolean(filters[group.minKey] || filters[group.maxKey]);
        return (
          <Fragment key={group.label}>
            <FilterPopover
              active={isActive}
              label={group.label}
              open={openFilter === group.label}
              onToggle={() => {
                setOpenFilter((currentFilter) =>
                  currentFilter === group.label ? "" : group.label,
                );
              }}
            >
              <strong>{filterSummary(draft, group)}</strong>
              <div className="mapFilterInputs">
                <label>
                  최소
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    placeholder="0"
                    value={draft[group.minKey] ?? ""}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
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
                    value={draft[group.maxKey] ?? ""}
                    onChange={(event) =>
                      setDraft((currentDraft) => ({
                        ...currentDraft,
                        [group.maxKey]: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <span>{group.basisLabel || `${group.unit} 기준`}</span>
              <div className="mapFilterActions">
                <button
                  type="button"
                  className="ghostButton"
                  aria-label={`${group.label} 초기화`}
                  title={`${group.label} 초기화`}
                  onClick={() => {
                    resetDraftValues({
                      [group.minKey]: "",
                      [group.maxKey]: "",
                    });
                  }}
                >
                  ↺
                </button>
                <button type="submit">적용</button>
              </div>
            </FilterPopover>
            {group.minKey === "areaMin" && (
              <FilterPopover
                active={Boolean(filters.scale)}
                label="규모"
                open={openFilter === "scale"}
                onToggle={() => {
                  setOpenFilter((currentFilter) =>
                    currentFilter === "scale" ? "" : "scale",
                  );
                }}
              >
                <strong>{draft.scale || "전체"}</strong>
                <div className="mapFilterChoices">
                  {SCALE_OPTIONS.map((scale) => (
                    <button
                      key={scale}
                      type="button"
                      className={draft.scale === scale ? "active" : ""}
                      onClick={() => {
                        applyDraft({
                          ...draft,
                          scale: draft.scale === scale ? "" : scale,
                        });
                      }}
                    >
                      {scale}
                    </button>
                  ))}
                </div>
                <div className="mapFilterActions">
                  {resetButton("규모", { scale: "" })}
                </div>
              </FilterPopover>
            )}
          </Fragment>
        );
      })}
      <FilterPopover
        active={Boolean(filters.businessDistrict)}
        label="권역"
        open={openFilter === "businessDistrict"}
        onToggle={() => {
          setOpenFilter((currentFilter) =>
            currentFilter === "businessDistrict" ? "" : "businessDistrict",
          );
        }}
      >
        <strong>{draft.businessDistrict || "전체"}</strong>
        <div className="mapFilterChoices">
          {BUSINESS_DISTRICT_OPTIONS.map((district) => {
            const isActive = draft.businessDistrict === district.value;
            return (
              <button
                key={district.value}
                type="button"
                className={isActive ? "active" : ""}
                title={district.description}
                onClick={() => {
                  applyDraft(
                    {
                      ...draft,
                      businessDistrict: isActive ? "" : district.value,
                    },
                    isActive ? {} : { center: district.center },
                  );
                }}
              >
                {district.label}
              </button>
            );
          })}
        </div>
        <span>강남권역 · 여의도권역 · 도심권역 · 분당권역</span>
        <div className="mapFilterActions">
          {resetButton("권역", { businessDistrict: "" })}
        </div>
      </FilterPopover>
      <FilterPopover
        active={Boolean(filters.buildingAgeMax)}
        label="준공연차"
        open={openFilter === "buildingAge"}
        onToggle={() => {
          setOpenFilter((currentFilter) =>
            currentFilter === "buildingAge" ? "" : "buildingAge",
          );
        }}
      >
        <strong>
          {draft.buildingAgeMax ? `${draft.buildingAgeMax}년 이하` : "전체"}
        </strong>
        <div className="mapFilterChoices">
          {BUILDING_AGE_OPTIONS.map((years) => (
            <button
              key={years}
              type="button"
              className={draft.buildingAgeMax === years ? "active" : ""}
              onClick={() => {
                applyDraft({
                  ...draft,
                  buildingAgeMax: draft.buildingAgeMax === years ? "" : years,
                });
              }}
            >
              {years}년
            </button>
          ))}
        </div>
        <div className="mapFilterActions">
          {resetButton("준공연차", { buildingAgeMax: "" })}
        </div>
      </FilterPopover>
      <FilterPopover
        active={Boolean(filters.subwayWalkMax)}
        label="지하철"
        open={openFilter === "subwayWalk"}
        onToggle={() => {
          setOpenFilter((currentFilter) =>
            currentFilter === "subwayWalk" ? "" : "subwayWalk",
          );
        }}
      >
        <strong>지하철역과의 거리</strong>
        <div className="mapFilterChoices">
          {SUBWAY_WALK_OPTIONS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              className={draft.subwayWalkMax === minutes ? "active" : ""}
              onClick={() => {
                applyDraft({
                  ...draft,
                  subwayWalkMax: draft.subwayWalkMax === minutes ? "" : minutes,
                });
              }}
            >
              {minutes}분
            </button>
          ))}
        </div>
        <div className="mapFilterActions">
          {resetButton("지하철", { subwayWalkMax: "" })}
        </div>
      </FilterPopover>
    </form>
  );
}
