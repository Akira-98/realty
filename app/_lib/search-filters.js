export const EMPTY_FILTERS = {
  areaMin: "",
  areaMax: "",
  scale: "",
  depositMin: "",
  depositMax: "",
  rentMin: "",
  rentMax: "",
  subwayWalkMax: "",
  buildingAgeMax: "",
  businessDistrict: "",
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

export const BUILDING_AGE_OPTIONS = ["3", "5", "10", "20"];

export const BUSINESS_DISTRICT_OPTIONS = [
  {
    value: "GBD",
    label: "강남권역",
    description: "강남구 · 서초구 · 송파구",
    center: { label: "강남권역", lat: 37.4979, lng: 127.0276, level: 6 },
  },
  {
    value: "YBD",
    label: "여의도권역",
    description: "영등포구",
    center: { label: "여의도권역", lat: 37.5263, lng: 126.9259, level: 6 },
  },
  {
    value: "CBD",
    label: "도심권역",
    description: "종로구 · 중구",
    center: { label: "도심권역", lat: 37.5663, lng: 126.9782, level: 6 },
  },
  {
    value: "BBD",
    label: "분당권역",
    description: "분당구",
    center: { label: "분당권역", lat: 37.3827, lng: 127.1189, level: 6 },
  },
];

export function businessDistrictLabel(value) {
  const option = BUSINESS_DISTRICT_OPTIONS.find((district) => district.value === value);
  return option ? option.label : "";
}

function normalizeFilterValue(value, key) {
  if (typeof value === "string" && key === "scale" && SCALE_OPTIONS.includes(value)) {
    return value;
  }
  if (
    typeof value === "string" &&
    key === "businessDistrict" &&
    BUSINESS_DISTRICT_OPTIONS.some((district) => district.value === value)
  ) {
    return value;
  }
  const number = Number(value);
  return Number.isFinite(number) && value !== "" ? String(number) : "";
}

export function normalizeFilters(filters) {
  return Object.fromEntries(
    Object.keys(EMPTY_FILTERS).map((key) => [
      key,
      normalizeFilterValue(filters[key], key),
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
