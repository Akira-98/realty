import { formatBuildingAge, formatWithUnit } from "./formatters";
import { businessDistrictLabel } from "./search-filters";

const DETAIL_EMPTY_VALUE = "별도문의";

export function field(value, fallback = DETAIL_EMPTY_VALUE) {
  return value || fallback;
}

export function withSquareMeterUnit(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

export function formatGrossFloorArea(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

function floorNumber(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function formatFloorScale(building) {
  const basementFloors = floorNumber(building?.basement_floors);
  const groundFloors = floorNumber(building?.ground_floors);
  const parts = [
    basementFloors > 0 && `지하 ${basementFloors}층`,
    groundFloors !== null && `지상 ${groundFloors}층`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" / ") : DETAIL_EMPTY_VALUE;
}

export function buildSummary(building) {
  const floorScale = formatFloorScale(building);

  return [
    floorScale && `규모 ${floorScale}`,
    building.gross_floor_area && `연면적 ${formatGrossFloorArea(building.gross_floor_area)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function formatDisplayAddress(building) {
  return [building?.address, building?.plat_address]
    .filter(Boolean)
    .join(" / ");
}

export function formatApprovalDate(value) {
  if (!value) {
    return DETAIL_EMPTY_VALUE;
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

export function purposeReferenceMarks(building) {
  return [
    building?.district_unit_plan_zone && "지구단위계획구역 포함",
    building?.national_industrial_complex && "국가산업단지 포함",
  ].filter(Boolean);
}

export function buildingHeroMeta(building) {
  return [
    businessDistrictLabel(building.business_district),
    building.scale,
    formatBuildingAge(building.approval_date_parsed),
  ].filter(Boolean);
}
