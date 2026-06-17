export const EMPTY_FILTERS = {
  areaMin: "",
  areaMax: "",
  scale: "",
  depositMin: "",
  depositMax: "",
  rentMin: "",
  rentMax: "",
  subwayWalkMax: "",
};

export const FILTER_GROUPS = [
  {
    label: "연면적",
    unit: "3.3㎡",
    basisLabel: "3.3㎡ 기준",
    minKey: "areaMin",
    maxKey: "areaMax",
  },
  {
    label: "보증금",
    unit: "만원",
    basisLabel: "@3.3㎡",
    minKey: "depositMin",
    maxKey: "depositMax",
  },
  {
    label: "임대료",
    unit: "만원",
    basisLabel: "@3.3㎡",
    minKey: "rentMin",
    maxKey: "rentMax",
  },
];

export const SCALE_OPTIONS = ["소형", "중형", "중대형", "대형", "초대형"];

export const SUBWAY_WALK_OPTIONS = ["2", "5", "10"];

function normalizeFilterValue(value) {
  if (typeof value === "string" && SCALE_OPTIONS.includes(value)) {
    return value;
  }
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
  const formatValue = (value) => {
    if (!group.unit) {
      return value;
    }
    return `${value}${group.unit.startsWith("3.3") ? " " : ""}${group.unit}`;
  };

  if (min && max) {
    return `${formatValue(min)}~${formatValue(max)}`;
  }
  if (min) {
    return `${formatValue(min)} 이상`;
  }
  if (max) {
    return `${formatValue(max)} 이하`;
  }
  return "전체";
}
