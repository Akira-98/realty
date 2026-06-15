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

function numberFromListingValue(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }
  if (value === null || value === undefined) {
    return null;
  }

  const text = String(value).replaceAll(",", "").trim();
  if (!text) {
    return null;
  }

  const eokMatch = text.match(/([\d.]+)\s*억/);
  const manMatch = text.match(/([\d.]+)\s*만/);
  if (eokMatch || manMatch) {
    const eok = eokMatch ? Number(eokMatch[1]) * 10000 : 0;
    const man = manMatch ? Number(manMatch[1]) : 0;
    const total = eok + man;
    return Number.isFinite(total) ? total : null;
  }

  const numericText = text.replace(/[^\d.-]/g, "");
  if (!numericText) {
    return null;
  }
  const number = Number(numericText);
  return Number.isFinite(number) ? number : null;
}

function isWithinRange(value, min, max) {
  if (min === null && max === null) {
    return true;
  }

  const number = numberFromListingValue(value);
  if (number === null) {
    return false;
  }

  return (min === null || number >= min) && (max === null || number <= max);
}

function isWithinMax(value, max) {
  if (max === null) {
    return true;
  }

  const number = numberFromListingValue(value);
  return number !== null && number <= max;
}

export function readListingFilters(searchParams) {
  return Object.fromEntries(
    FILTER_KEYS.map((key) => [key, filterParam(searchParams, key)]),
  );
}

export function hasActiveListingFilters(filters) {
  return Object.values(filters).some((value) => value !== null);
}

export function appendSubwayWalkFilter(params, filters) {
  if (filters.subwayWalkMax !== null) {
    params.set("subway_walk_min", `lte.${filters.subwayWalkMax}`);
  }
}

export function filterBuildingsByListingFilters(buildings, filters) {
  return buildings.filter(
    (building) =>
      isWithinRange(
        building.rental_area_pyeong,
        filters.areaMin,
        filters.areaMax,
      ) &&
      isWithinRange(
        building.deposit_total,
        filters.depositTotalMin,
        filters.depositTotalMax,
      ) &&
      isWithinRange(
        building.rent_total,
        filters.rentTotalMin,
        filters.rentTotalMax,
      ) &&
      isWithinMax(building.subway_walk_min, filters.subwayWalkMax),
  );
}
