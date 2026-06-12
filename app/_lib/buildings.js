export function formatDistance(value) {
  if (!Number.isFinite(value)) {
    return "";
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}km`;
  }
  return `${Math.round(value)}m`;
}

export function compactText(value) {
  return value || "-";
}

export function buildSummary(building) {
  return [
    building.subway && `지하철 ${building.subway}`,
    building.building_scale && `규모 ${building.building_scale}`,
    building.distance_m !== undefined &&
      `거리 ${formatDistance(building.distance_m)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

export function centerFromBuildings(query, buildings) {
  const located = buildings.filter((building) => building.lat && building.lng);
  if (located.length === 0) {
    return null;
  }

  const lat =
    located.reduce((sum, building) => sum + Number(building.lat), 0) /
    located.length;
  const lng =
    located.reduce((sum, building) => sum + Number(building.lng), 0) /
    located.length;

  return {
    label: query,
    lat,
    lng,
    source: "building-search",
  };
}

function normalizeSearchText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function isSpecificBuildingSearch(query, buildings) {
  if (buildings.length === 0) {
    return false;
  }

  const normalizedQuery = normalizeSearchText(query);
  const hasExactMatch = buildings.some(
    (building) => normalizeSearchText(building.building_name) === normalizedQuery,
  );
  if (hasExactMatch) {
    return true;
  }

  if (normalizedQuery.length >= 4 && buildings.length <= 20) {
    return true;
  }

  return normalizedQuery.length >= 3 && buildings.length <= 3;
}

const DEFAULT_CLUSTER_PIXEL_SIZE = 144;

export function groupBuildingsForMarkers(buildings, options = {}) {
  const {
    bounds,
    viewportWidth = 0,
    viewportHeight = 0,
    clusterPixelSize = DEFAULT_CLUSTER_PIXEL_SIZE,
  } = options;
  const locatedBuildings = buildings
    .map((building) => ({
      building,
      lat: Number(building.lat),
      lng: Number(building.lng),
    }))
    .filter(({ lat, lng }) => Number.isFinite(lat) && Number.isFinite(lng));

  if (locatedBuildings.length === 0) {
    return [];
  }

  if (
    !bounds ||
    !viewportWidth ||
    !viewportHeight ||
    bounds.swLat === bounds.neLat ||
    bounds.swLng === bounds.neLng
  ) {
    return locatedBuildings.map(({ building, lat, lng }) => ({
      buildings: [building],
      lat,
      lng,
    }));
  }

  const minLat = Math.min(bounds.swLat, bounds.neLat);
  const maxLat = Math.max(bounds.swLat, bounds.neLat);
  const minLng = Math.min(bounds.swLng, bounds.neLng);
  const maxLng = Math.max(bounds.swLng, bounds.neLng);
  const latSpan = Math.max(maxLat - minLat, 0.000001);
  const lngSpan = Math.max(maxLng - minLng, 0.000001);
  const columnCount = Math.max(1, Math.ceil(viewportWidth / clusterPixelSize));
  const rowCount = Math.max(1, Math.ceil(viewportHeight / clusterPixelSize));
  const groups = new Map();

  locatedBuildings.forEach(({ building, lat, lng }) => {
    if (lat < minLat || lat > maxLat || lng < minLng || lng > maxLng) {
      return;
    }

    const column = Math.min(
      columnCount - 1,
      Math.floor(((lng - minLng) / lngSpan) * columnCount),
    );
    const row = Math.min(
      rowCount - 1,
      Math.floor(((maxLat - lat) / latSpan) * rowCount),
    );
    const key = `${row},${column}`;

    if (!groups.has(key)) {
      groups.set(key, {
        buildings: [],
        latSum: 0,
        lngSum: 0,
      });
    }

    const group = groups.get(key);
    group.buildings.push(building);
    group.latSum += lat;
    group.lngSum += lng;
  });

  return [...groups.values()].map((group) => ({
    buildings: group.buildings,
    lat: group.latSum / group.buildings.length,
    lng: group.lngSum / group.buildings.length,
  }));
}
