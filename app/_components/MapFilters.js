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

export function MapFilters({ filters, onApply }) {
  const filtersRef = useRef(null);
  const [draft, setDraft] = useState(filters);
  const [openFilter, setOpenFilter] = useState("");

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
      className="mapFilters"
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
            <details
              open={openFilter === group.label}
              className={isActive ? "mapFilterPopover active" : "mapFilterPopover"}
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
              <div className="mapFilterDropdown">
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
              </div>
            </details>
            {group.minKey === "areaMin" && (
              <details
                open={openFilter === "scale"}
                className={filters.scale ? "mapFilterPopover active" : "mapFilterPopover"}
              >
                <summary
                  onClick={(event) => {
                    event.preventDefault();
                    setOpenFilter((currentFilter) =>
                      currentFilter === "scale" ? "" : "scale",
                    );
                  }}
                >
                  <span>규모</span>
                </summary>
                <div className="mapFilterDropdown">
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
                </div>
              </details>
            )}
          </Fragment>
        );
      })}
      <details
        open={openFilter === "businessDistrict"}
        className={filters.businessDistrict ? "mapFilterPopover active" : "mapFilterPopover"}
      >
        <summary
          onClick={(event) => {
            event.preventDefault();
            setOpenFilter((currentFilter) =>
              currentFilter === "businessDistrict" ? "" : "businessDistrict",
            );
          }}
        >
          <span>업무권역</span>
        </summary>
        <div className="mapFilterDropdown">
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
          <span>GBD · YBD · CBD · BBD</span>
          <div className="mapFilterActions">
            {resetButton("업무권역", { businessDistrict: "" })}
          </div>
        </div>
      </details>
      <details
        open={openFilter === "buildingAge"}
        className={filters.buildingAgeMax ? "mapFilterPopover active" : "mapFilterPopover"}
      >
        <summary
          onClick={(event) => {
            event.preventDefault();
            setOpenFilter((currentFilter) =>
              currentFilter === "buildingAge" ? "" : "buildingAge",
            );
          }}
        >
          <span>준공연차</span>
        </summary>
        <div className="mapFilterDropdown">
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
        </div>
      </details>
      <details
        open={openFilter === "subwayWalk"}
        className={filters.subwayWalkMax ? "mapFilterPopover active" : "mapFilterPopover"}
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
        <div className="mapFilterDropdown">
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
        </div>
      </details>
    </form>
  );
}
