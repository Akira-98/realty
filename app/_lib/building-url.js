export function parseBuildingIdParam(value) {
  const match = String(value ?? "").match(/^\d+/);
  return match ? match[0] : "";
}

export function buildingSlug(value) {
  return String(value ?? "")
    .trim()
    .normalize("NFKC")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");
}

export function buildingDetailPath(building) {
  const id = building?.id;
  if (id === null || id === undefined || id === "") {
    return "/buildings";
  }

  const slug = buildingSlug(building.building_name);
  return `/buildings/${id}${slug ? `-${slug}` : ""}`;
}
