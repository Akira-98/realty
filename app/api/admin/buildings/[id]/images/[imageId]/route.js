import { jsonError } from "../../../../../../../lib/http";
import { supabaseHeaders } from "../../../../../../../lib/supabase-admin";

import {
  cleanId,
  deleteStorageObject,
  fetchBuilding,
  fetchImage,
  fetchImages,
  imageResponse,
  normalizeImagesPayload,
  requireAdminImageConfig,
  updateThumbnail,
} from "../image-admin-utils";

export const dynamic = "force-dynamic";

async function resolveIds(context) {
  const params = await context.params;
  return {
    buildingId: cleanId(params?.id, "building id"),
    imageId: cleanId(params?.imageId, "image id"),
  };
}

async function deleteImageRow(supabaseUrl, serviceKey, buildingId, imageId) {
  const params = new URLSearchParams();
  params.set("building_id", `eq.${buildingId}`);
  params.set("id", `eq.${imageId}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    method: "DELETE",
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase building image delete failed: ${body}`);
  }
}

export async function DELETE(request, context) {
  const config = await requireAdminImageConfig(request);
  if (config.error) {
    return config.error;
  }

  try {
    const { buildingId, imageId } = await resolveIds(context);
    const building = await fetchBuilding(config.supabaseUrl, config.serviceKey, buildingId);
    if (!building) {
      return jsonError("Building not found.", 404);
    }

    const image = await fetchImage(
      config.supabaseUrl,
      config.serviceKey,
      buildingId,
      imageId,
    );
    if (!image) {
      return jsonError("Image not found.", 404);
    }

    await deleteStorageObject(
      config.supabaseUrl,
      config.serviceKey,
      config.bucket,
      image.image_path,
    );
    await deleteImageRow(config.supabaseUrl, config.serviceKey, buildingId, imageId);

    const images = await fetchImages(config.supabaseUrl, config.serviceKey, buildingId);
    if (building.thumbnail_path === image.image_path) {
      await updateThumbnail(
        config.supabaseUrl,
        config.serviceKey,
        buildingId,
        images[0]?.image_path ?? null,
      );
    }

    return imageResponse(normalizeImagesPayload(images), config.admin);
  } catch (error) {
    return jsonError(error.message, 500);
  }
}
