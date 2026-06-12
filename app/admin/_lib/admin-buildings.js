export const EDIT_FIELDS = [
  ["deposit", "보증금 단가"],
  ["deposit_total", "보증금 총액"],
  ["rent", "임대료 단가"],
  ["rent_total", "임대료 총액"],
  ["maintenance_fee", "관리비 단가"],
  ["maintenance_fee_total", "관리비 총액"],
];

export const PAGE_SIZE = 10;

export function emptyDraft(building) {
  return Object.fromEntries(
    EDIT_FIELDS.map(([key]) => [key, building?.[key] || ""]),
  );
}

export function priceSummary(building) {
  return [
    building.deposit || building.deposit_total,
    building.rent || building.rent_total,
    building.maintenance_fee || building.maintenance_fee_total,
  ]
    .filter(Boolean)
    .join(" · ");
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
