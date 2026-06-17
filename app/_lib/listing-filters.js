const FILTER_KEYS = [
  "areaMin",
  "areaMax",
  "scale",
  "depositMin",
  "depositMax",
  "rentMin",
  "rentMax",
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
  const filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, filterParam(searchParams, key)]),
  );
  filters.scale = searchParams.get("scale")?.trim() || null;
  return filters;
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
    "gross_floor_area",
    filters.areaMin,
    filters.areaMax,
  );
  if (filters.scale !== null) {
    params.set("scale", `eq.${filters.scale}`);
  }
  appendRangeFilter(
    params,
    "deposit_num",
    filters.depositMin,
    filters.depositMax,
  );
  appendRangeFilter(
    params,
    "rent_num",
    filters.rentMin,
    filters.rentMax,
  );
  appendSubwayWalkFilter(params, filters);
}
