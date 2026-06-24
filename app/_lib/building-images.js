const DEFAULT_BUILDING_IMAGES_BUCKET = "building-images";

function encodeStoragePath(storagePath) {
  return storagePath.split("/").map(encodeURIComponent).join("/");
}

export function getBuildingImagePublicUrl(imagePath) {
  const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/+$/, "");
  const bucket =
    process.env.BUILDING_IMAGES_BUCKET ||
    process.env.SUPABASE_STORAGE_BUCKET ||
    DEFAULT_BUILDING_IMAGES_BUCKET;

  if (!supabaseUrl || !bucket || !imagePath) {
    return null;
  }

  return `${supabaseUrl}/storage/v1/object/public/${bucket}/${encodeStoragePath(imagePath)}`;
}

export function withBuildingImageUrl(building) {
  if (!building || typeof building !== "object") {
    return building;
  }

  return {
    ...building,
    thumbnail_url: getBuildingImagePublicUrl(building.thumbnail_path),
  };
}

export function withBuildingImageUrlsForRows(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map((image) => ({
    ...image,
    image_url: getBuildingImagePublicUrl(image.image_path),
  }));
}

export function withBuildingImageUrls(buildings) {
  if (!Array.isArray(buildings)) {
    return buildings;
  }

  return buildings.map(withBuildingImageUrl);
}

export function withBoundsPayloadImageUrls(payload) {
  if (!payload || typeof payload !== "object") {
    return payload;
  }

  return {
    ...payload,
    buildings: withBuildingImageUrls(payload.buildings),
  };
}
