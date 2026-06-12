export const EMPTY_FILTERS = {
  areaMin: "",
  areaMax: "",
  depositTotalMin: "",
  depositTotalMax: "",
  rentTotalMin: "",
  rentTotalMax: "",
};

function normalizeFilterValue(value) {
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? String(number) : "";
}

export function normalizeFilters(filters) {
  return Object.fromEntries(
    Object.keys(EMPTY_FILTERS).map((key) => [
      key,
      normalizeFilterValue(filters[key]),
    ]),
  );
}

export function filtersKey(filters) {
  return Object.keys(EMPTY_FILTERS)
    .map((key) => `${key}:${filters[key] || ""}`)
    .join("|");
}

export function appendFilters(params, filters) {
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "") {
      params.set(key, value);
    }
  });
}
