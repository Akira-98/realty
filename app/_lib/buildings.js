import { formatWithUnit } from "./formatters";

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

function formatGrossFloorArea(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

export function buildSummary(building) {
  return [
    building.building_scale && `규모 ${building.building_scale}`,
    building.gross_floor_area && `연면적 ${formatGrossFloorArea(building.gross_floor_area)}`,
  ]
    .filter(Boolean)
    .join(" · ");
}

const DEFAULT_CLUSTER_PIXEL_SIZE = 176;

function clusterPixelSizeForLevel(level) {
  if (!Number.isFinite(level)) {
    return DEFAULT_CLUSTER_PIXEL_SIZE;
  }

  if (level <= 3) {
    return 144;
  }
  if (level <= 5) {
    return 176;
  }
  if (level <= 7) {
    return 220;
  }
  return 264;
}

export function groupBuildingsForMarkers(buildings, options = {}) {
  const {
    bounds,
    viewportWidth = 0,
    viewportHeight = 0,
    level = null,
    clusterPixelSize = clusterPixelSizeForLevel(level),
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
