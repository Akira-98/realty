"use client";

function normalizeAddress(value) {
  return String(value || "").trim();
}

export function useAddressDisplay(building, addressMode) {
  const roadAddress = normalizeAddress(building.address);
  const lotAddress = normalizeAddress(building.plat_address);
  const canToggleAddress = Boolean(
    roadAddress && lotAddress && roadAddress !== lotAddress,
  );
  const displayedAddress =
    addressMode === "lot" && lotAddress ? lotAddress : roadAddress || lotAddress;
  const toggleLabel = addressMode === "lot" ? "도로명" : "지번";

  return {
    canToggleAddress,
    displayedAddress,
    toggleLabel,
  };
}

export function DetailAddressToggle({ canToggle, label, onToggle }) {
  if (!canToggle) {
    return null;
  }

  return (
    <button
      type="button"
      className="detailAddressToggle"
      onClick={onToggle}
    >
      {label}
    </button>
  );
}
