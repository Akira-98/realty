"use client";

import { Fragment, useEffect, useRef, useState } from "react";

import {
  BUILDING_AGE_OPTIONS,
  BUSINESS_DISTRICT_OPTIONS,
  FILTER_GROUPS,
  SCALE_OPTIONS,
  SUBWAY_WALK_OPTIONS,
  buildingAgeFilterLabel,
} from "../_lib/search-filters";
import {
  ChoiceFilterPopover,
  RangeFilterPopover,
} from "./map-filters/FilterPopovers";

function businessDistrictFilterLabel(value) {
  return BUSINESS_DISTRICT_OPTIONS.find((district) => district.value === value)?.label || "권역";
}

const SCALE_HELP_ROWS = [
  ["소형", "9,917㎡ 미만", "3,000평 미만"],
  ["중형", "9,917 ~ 16,529㎡", "3,000 ~ 5,000평"],
  ["중대형", "16,529 ~ 33,058㎡", "5,000 ~ 10,000평"],
  ["대형", "33,058 ~ 66,116㎡", "10,000 ~ 20,000평"],
  ["초대형", "66,116㎡ 이상", "20,000평 이상"],
];

function ScaleHelp() {
  return (
    <div className="mapFilterHelp">
      <button type="button" className="mapFilterHelpButton" aria-label="규모 기준 보기">
        i
      </button>
      <div className="mapFilterHelpPopover" role="tooltip">
        <p>면적 기준 (3.3㎡ = 1평)</p>
        <table>
          <tbody>
            {SCALE_HELP_ROWS.map(([label, squareMeters, pyeong]) => (
              <tr key={label}>
                <th scope="row">{label}</th>
                <td>{squareMeters}</td>
                <td>({pyeong})</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function MapFilters({ filters, onApply, resultsPanelOpen = false }) {
  const filtersRef = useRef(null);
  const [draft, setDraft] = useState(filters);
  const [openFilter, setOpenFilter] = useState("");
  const className = [
    "mapFilters",
    openFilter && "hasOpenFilter",
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

  const toggleFilter = (filterKey) => {
    setOpenFilter((currentFilter) =>
      currentFilter === filterKey ? "" : filterKey,
    );
  };

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
        return (
          <Fragment key={group.label}>
            <RangeFilterPopover
              draft={draft}
              filters={filters}
              group={group}
              open={openFilter === group.label}
              onDraftChange={setDraft}
              onReset={() => {
                resetDraftValues({
                  [group.minKey]: "",
                  [group.maxKey]: "",
                });
              }}
              onToggle={() => toggleFilter(group.label)}
            />
            {group.minKey === "areaMin" && (
              <ChoiceFilterPopover
                active={Boolean(filters.scale)}
                choices={SCALE_OPTIONS.map((scale) => ({ label: scale, value: scale }))}
                help={<ScaleHelp />}
                label={filters.scale || "규모"}
                open={openFilter === "scale"}
                resetLabel="규모"
                value={draft.scale}
                onReset={() => resetDraftValues({ scale: "" })}
                onSelect={(choice, isActive) => {
                  applyDraft({
                    ...draft,
                    scale: isActive ? "" : choice.value,
                  });
                }}
                onToggle={() => toggleFilter("scale")}
              />
            )}
          </Fragment>
        );
      })}
      <ChoiceFilterPopover
        active={Boolean(filters.businessDistrict)}
        choices={BUSINESS_DISTRICT_OPTIONS.map((district) => ({
          label: district.label,
          title: district.description,
          value: district.value,
          center: district.center,
        }))}
        className="businessDistrictChoices"
        label={businessDistrictFilterLabel(filters.businessDistrict)}
        open={openFilter === "businessDistrict"}
        resetLabel="권역"
        value={draft.businessDistrict}
        onReset={() => resetDraftValues({ businessDistrict: "" })}
        onSelect={(choice, isActive) => {
          applyDraft(
            {
              ...draft,
              businessDistrict: isActive ? "" : choice.value,
            },
            isActive ? {} : { center: choice.center },
          );
        }}
        onToggle={() => toggleFilter("businessDistrict")}
      />
      <ChoiceFilterPopover
        active={Boolean(filters.buildingAgeMax)}
        choices={BUILDING_AGE_OPTIONS}
        label={filters.buildingAgeMax ? buildingAgeFilterLabel(filters.buildingAgeMax) : "준공연차"}
        open={openFilter === "buildingAge"}
        resetLabel="준공연차"
        value={draft.buildingAgeMax}
        onReset={() => resetDraftValues({ buildingAgeMax: "" })}
        onSelect={(choice, isActive) => {
          applyDraft({
            ...draft,
            buildingAgeMax: isActive ? "" : choice.value,
          });
        }}
        onToggle={() => toggleFilter("buildingAge")}
      />
      <ChoiceFilterPopover
        active={Boolean(filters.subwayWalkMax)}
        choices={SUBWAY_WALK_OPTIONS.map((minutes) => ({
          label: `${minutes}분`,
          value: minutes,
        }))}
        label={filters.subwayWalkMax ? `~${filters.subwayWalkMax}분` : "지하철"}
        open={openFilter === "subwayWalk"}
        resetLabel="지하철"
        value={draft.subwayWalkMax}
        onReset={() => resetDraftValues({ subwayWalkMax: "" })}
        onSelect={(choice, isActive) => {
          applyDraft({
            ...draft,
            subwayWalkMax: isActive ? "" : choice.value,
          });
        }}
        onToggle={() => toggleFilter("subwayWalk")}
      />
    </form>
  );
}
