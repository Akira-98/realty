export const EMPTY_FILTERS = {
  areaMin: "",
  areaMax: "",
  depositTotalMin: "",
  depositTotalMax: "",
  rentTotalMin: "",
  rentTotalMax: "",
  subwayWalkMax: "",
};

export const FILTER_GROUPS = [
  {
    label: "면적",
    unit: "평",
    minKey: "areaMin",
    maxKey: "areaMax",
  },
  {
    label: "보증금",
    unit: "만원",
    minKey: "depositTotalMin",
    maxKey: "depositTotalMax",
  },
  {
    label: "임대료",
    unit: "만원",
    minKey: "rentTotalMin",
    maxKey: "rentTotalMax",
  },
];

export const SUBWAY_WALK_OPTIONS = ["2", "5", "10"];

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

export function filterSummary(filters, group) {
  const min = filters[group.minKey];
  const max = filters[group.maxKey];

  if (min && max) {
    return `${min}~${max}${group.unit}`;
  }
  if (min) {
    return `${min}${group.unit} 이상`;
  }
  if (max) {
    return `${max}${group.unit} 이하`;
  }
  return "전체";
}
