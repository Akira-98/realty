"use client";

import { useEffect, useRef, useState } from "react";

import {
  FILTER_GROUPS,
  SUBWAY_WALK_OPTIONS,
  filterSummary,
} from "../_lib/search-filters";

export function MapFilters({ filters, onApply, onReset }) {
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
          <details
            key={group.label}
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
              <span>{group.unit} 기준</span>
              <div className="mapFilterActions">
                <button
                  type="button"
                  className="ghostButton"
                  onClick={() => {
                    onReset();
                    setOpenFilter("");
                  }}
                >
                  초기화
                </button>
                <button type="submit">적용</button>
              </div>
            </div>
          </details>
        );
      })}
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
                onClick={() =>
                  setDraft((currentDraft) => ({
                    ...currentDraft,
                    subwayWalkMax:
                      currentDraft.subwayWalkMax === minutes ? "" : minutes,
                  }))
                }
              >
                {minutes}분
              </button>
            ))}
          </div>
          <div className="mapFilterActions">
            <button
              type="button"
              className="ghostButton"
              onClick={() => {
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  subwayWalkMax: "",
                }));
              }}
            >
              초기화
            </button>
            <button type="submit">적용</button>
          </div>
        </div>
      </details>
    </form>
  );
}
