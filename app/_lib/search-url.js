export function numberParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export function buildSearchUrl({ query, center, mode }) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("lat", String(center.lat));
  params.set("lng", String(center.lng));
  params.set("label", center.label || query);
  params.set("source", center.source || "location");
  if (center.level) {
    params.set("level", String(center.level));
  }
  if (mode === "marker") {
    params.set("mode", "marker");
  }
  return `/?${params}`;
}
