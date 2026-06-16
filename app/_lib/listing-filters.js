const FILTER_KEYS = [
  "areaMin",
  "areaMax",
  "depositTotalMin",
  "depositTotalMax",
  "rentTotalMin",
  "rentTotalMax",
  "subwayWalkMax",
];

function filterParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function readListingFilters(searchParams) {
  return Object.fromEntries(
    FILTER_KEYS.map((key) => [key, filterParam(searchParams, key)]),
  );
}

export function appendSubwayWalkFilter(params, filters) {
  if (filters.subwayWalkMax !== null) {
    params.set("subway_walk_min", `lte.${filters.subwayWalkMax}`);
  }
}

function appendRangeFilter(params, column, min, max) {
  if (min !== null) {
    params.set(column, `gte.${min}`);
  }
  if (max !== null) {
    params.append(column, `lte.${max}`);
  }
}

export function appendListingFilterParams(params, filters) {
  appendRangeFilter(
    params,
    "rental_area_pyeong_num",
    filters.areaMin,
    filters.areaMax,
  );
  appendRangeFilter(
    params,
    "deposit_total_num",
    filters.depositTotalMin,
    filters.depositTotalMax,
  );
  appendRangeFilter(
    params,
    "rent_total_num",
    filters.rentTotalMin,
    filters.rentTotalMax,
  );
  appendSubwayWalkFilter(params, filters);
}
