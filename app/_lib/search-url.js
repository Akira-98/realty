export function numberParam(searchParams, name) {
  const rawValue = searchParams.get(name);
  if (rawValue === null || rawValue === "") {
    return null;
  }

  const value = Number(rawValue);
  return Number.isFinite(value) ? value : null;
}

export const SUBWAY_SEARCH_RADIUS_M = 700;

export function locationFilterFromSuggestion(suggestion) {
  if (!suggestion) {
    return null;
  }

  const lat = Number(suggestion.lat);
  const lng = Number(suggestion.lng);
  const isSubway = suggestion.type === "subway";

  return {
    type: suggestion.type || "location",
    city: isSubway ? "" : suggestion.city || "",
    district: isSubway ? "" : suggestion.district || "",
    nearLat: isSubway && Number.isFinite(lat) ? lat : null,
    nearLng: isSubway && Number.isFinite(lng) ? lng : null,
    nearRadius: isSubway ? SUBWAY_SEARCH_RADIUS_M : null,
  };
}

export function appendLocationFilter(params, locationFilter) {
  if (!locationFilter) {
    return;
  }
  if (locationFilter.city) {
    params.set("city", locationFilter.city);
  }
  if (locationFilter.district) {
    params.set("district", locationFilter.district);
  }
  if (
    Number.isFinite(locationFilter.nearLat) &&
    Number.isFinite(locationFilter.nearLng) &&
    Number.isFinite(locationFilter.nearRadius)
  ) {
    params.set("nearLat", String(locationFilter.nearLat));
    params.set("nearLng", String(locationFilter.nearLng));
    params.set("nearRadius", String(locationFilter.nearRadius));
  }
}

export function buildSearchUrl({ query, location, mode }) {
  const params = new URLSearchParams();
  params.set("q", query);
  params.set("lat", String(location.lat));
  params.set("lng", String(location.lng));
  params.set("label", location.label || query);
  params.set("source", location.type || location.source || "location");
  appendLocationFilter(params, locationFilterFromSuggestion(location));
  if (location.level) {
    params.set("level", String(location.level));
  }
  if (mode === "marker") {
    params.set("mode", "marker");
  }
  return `/?${params}`;
}
