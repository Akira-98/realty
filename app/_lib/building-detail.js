import { requiredEnv } from "../../lib/http";
import { formatBuildingAge, formatNumber, formatWithUnit } from "./formatters";
import { businessDistrictLabel } from "./search-filters";

export const BUILDING_DETAIL_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_use",
  "building_scale",
  "business_district",
  "scale",
  "gross_floor_area",
  "approval_date",
  "approval_date_parsed",
  "deposit_num",
  "rent_num",
  "maintenance_num",
  "parking_fee",
  "elevator",
  "parking",
  "hvac",
  "ceiling_height",
  "lat",
  "lng",
  "is_public",
].join(",");

export function field(value, fallback = "-") {
  return value || fallback;
}

export function withSquareMeterUnit(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

export function joinValues(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatPriceNumber(value) {
  if (value === null || value === undefined || value === "") {
    return "별도문의";
  }

  return `${formatNumber(value)}원 / 3.3㎡`;
}

export function formatApprovalDate(value) {
  if (!value) {
    return "-";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export async function fetchBuildingDetail(id) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams();
  params.set("select", BUILDING_DETAIL_SELECT);
  params.set("id", `eq.${id}`);
  params.set("is_public", "eq.true");
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Supabase building detail failed.");
  }

  const buildings = await response.json();
  return buildings[0] ?? null;
}

export function getBuildingDetailModel(building) {
  const title = field(building.building_name, "이름 없는 빌딩");
  const buildingScale = building.building_scale;
  const businessDistrict = businessDistrictLabel(building.business_district);
  const buildingAge = formatBuildingAge(building.approval_date_parsed);
  const heroMeta = [businessDistrict, building.scale, buildingAge].filter(Boolean);
  const basicItems = [
    { icon: "building", label: "규모", value: buildingScale },
    { icon: "tag", label: "용도", value: building.building_use },
    { icon: "calendar", label: "사용승인일", value: formatApprovalDate(building.approval_date) },
    { icon: "area", label: "연면적", value: withSquareMeterUnit(building.gross_floor_area) },
  ].filter(Boolean);
  const facilityItems = [
    { icon: "height", label: "천정고", value: building.ceiling_height },
    { icon: "wind", label: "냉난방방식", value: building.hvac },
    { icon: "elevator", label: "엘리베이터", value: building.elevator },
  ];
  const transportItems = [
    { icon: "train", label: "지하철", value: building.subway },
    { icon: "pin", label: "주소", value: building.address },
    { icon: "parking", label: "주차", value: building.parking },
    { icon: "coin", label: "주차비", value: building.parking_fee },
  ];

  return {
    basicItems,
    buildingScale,
    facilityItems,
    heroMeta,
    title,
    transportItems,
  };
}
