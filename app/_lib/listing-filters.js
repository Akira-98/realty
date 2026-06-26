const FILTER_KEYS = [
  "areaMin",
  "areaMax",
  "scale",
  "depositMin",
  "depositMax",
  "rentMin",
  "rentMax",
  "subwayWalkMax",
  "buildingAgeMax",
  "businessDistrict",
];

const BUSINESS_DISTRICT_CODES = new Set(["GBD", "YBD", "CBD", "BBD"]);

function filterParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

function buildingAgeParam(searchParams) {
  const rawValue = searchParams.get("buildingAgeMax");
  if (rawValue === null || rawValue === "") {
    return null;
  }
  if (rawValue === "20+") {
    return rawValue;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function readListingFilters(searchParams) {
  const filters = Object.fromEntries(
    FILTER_KEYS.map((key) => [key, filterParam(searchParams, key)]),
  );
  filters.buildingAgeMax = buildingAgeParam(searchParams);
  filters.scale = searchParams.get("scale")?.trim() || null;
  const businessDistrict = searchParams.get("businessDistrict")?.trim().toUpperCase() || null;
  filters.businessDistrict = BUSINESS_DISTRICT_CODES.has(businessDistrict)
    ? businessDistrict
    : null;
  return filters;
}

export function appendSubwayWalkFilter(params, filters) {
  if (filters.subwayWalkMax !== null) {
    params.set("subway_walk_min", `lte.${filters.subwayWalkMax}`);
  }
}

export function minApprovalYearFromFilters(filters, currentYear = new Date().getFullYear()) {
  if (filters.buildingAgeMax === null || filters.buildingAgeMax === "") {
    return null;
  }
  if (filters.buildingAgeMax === "20+") {
    return null;
  }
  const ageMax = Number(filters.buildingAgeMax);
  if (!Number.isFinite(ageMax)) {
    return null;
  }
  return currentYear - ageMax;
}

export function maxApprovalYearFromFilters(filters, currentYear = new Date().getFullYear()) {
  if (filters.buildingAgeMax !== "20+") {
    return null;
  }
  return currentYear - 20;
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
  const minApprovalYear = minApprovalYearFromFilters(filters);
  if (minApprovalYear !== null) {
    params.set("approval_date_parsed", `gte.${minApprovalYear}`);
  }
  const maxApprovalYear = maxApprovalYearFromFilters(filters);
  if (maxApprovalYear !== null) {
    params.set("approval_date_parsed", `lte.${maxApprovalYear}`);
  }
  if (filters.businessDistrict !== null) {
    params.set("business_district", `eq.${filters.businessDistrict}`);
  }
}
