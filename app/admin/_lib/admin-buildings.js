import { formatNumber } from "../../_lib/formatters";

export const EDIT_FIELDS = [
  ["deposit_num", "보증금 / 3.3㎡"],
  ["rent_num", "임대료 / 3.3㎡"],
  ["maintenance_num", "관리비 / 3.3㎡"],
];

export const PAGE_SIZE = 10;

export function emptyDraft(building) {
  return Object.fromEntries(
    EDIT_FIELDS.map(([key]) => [key, building?.[key] ?? ""]),
  );
}

export function priceSummary(building) {
  return [
    priceLabel("보증금", building.deposit_num),
    priceLabel("임대료", building.rent_num),
    priceLabel("관리비", building.maintenance_num),
  ].join(" · ");
}

function priceLabel(label, value) {
  if (value === null || value === undefined || value === "") {
    return `${label} 별도문의`;
  }

  return `${label} ${formatNumber(value)}원 / 3.3㎡`;
}

export function isUnauthorized(response) {
  return response.status === 401 || response.status === 403;
}

export function pageWindow(currentPage, totalPages) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, start + 4);
  const adjustedStart = Math.max(1, end - 4);
  return Array.from(
    { length: end - adjustedStart + 1 },
    (_, index) => adjustedStart + index,
  );
}
