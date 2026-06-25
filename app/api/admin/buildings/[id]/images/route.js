import { jsonError } from "../../../../../../lib/http";
import { supabaseHeaders } from "../../../../../../lib/supabase-admin";

import {
  BUILDING_IMAGE_SELECT,
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  cleanId,
  fetchBuilding,
  fetchImages,
  imageResponse,
  normalizeImagesPayload,
  requireAdminImageConfig,
  storageObjectUrl,
  updateThumbnail,
  withImageUrls,
} from "./image-admin-utils";

export const dynamic = "force-dynamic";

function safeFilename(name) {
  return String(name || "image")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "image";
}

function imagePathForUpload(buildingId, file) {
  const timestamp = Date.now();
  const random = crypto.randomUUID();
  return `buildings/${buildingId}/${timestamp}-${random}-${safeFilename(file.name)}`;
}

function validateFile(file) {
  if (!file || typeof file.arrayBuffer !== "function") {
    throw new Error("image file is required.");
  }
  if (!IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error("Only jpeg, png, webp, and gif images are allowed.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Image must be 8MB or smaller.");
  }
}

async function nextImageOrder(supabaseUrl, serviceKey, buildingId) {
  const params = new URLSearchParams();
  params.set("select", "image_order");
  params.set("building_id", `eq.${buildingId}`);
  params.set("order", "image_order.desc.nullslast,created_at.desc");
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase image order lookup failed: ${body}`);
  }

  const images = await response.json();
  const currentOrder = Number(images[0]?.image_order);
  return Number.isFinite(currentOrder) ? currentOrder + 1 : 1;
}

async function insertImage(supabaseUrl, serviceKey, buildingId, imagePath, imageOrder) {
  const params = new URLSearchParams();
  params.set("select", BUILDING_IMAGE_SELECT);

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    method: "POST",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
      Prefer: "return=representation",
    }),
    body: JSON.stringify({
      building_id: buildingId,
      image_path: imagePath,
      image_order: imageOrder,
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase building image insert failed: ${body}`);
  }

  const images = await response.json();
  return images[0] ?? null;
}

async function uploadStorageObject({ supabaseUrl, serviceKey, bucket, imagePath, file }) {
  const body = await file.arrayBuffer();
  const response = await fetch(storageObjectUrl(supabaseUrl, bucket, imagePath), {
    method: "POST",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": file.type,
      "x-upsert": "false",
    }),
    body,
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase storage upload failed: ${body}`);
  }
}

function cleanOrderPayload(value) {
  if (!Array.isArray(value)) {
    throw new Error("images must be an array.");
  }

  const seen = new Set();
  return value.map((item, index) => {
    const id = cleanId(item?.id, "image id");
    if (seen.has(id)) {
      throw new Error("Duplicate image id.");
    }
    seen.add(id);
    return {
      id,
      image_order: index + 1,
    };
  });
}

async function updateImageOrder(supabaseUrl, serviceKey, buildingId, item) {
  const params = new URLSearchParams();
  params.set("building_id", `eq.${buildingId}`);
  params.set("id", `eq.${item.id}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    method: "PATCH",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ image_order: item.image_order }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase image order update failed: ${body}`);
  }
}

async function updateImageOrders(supabaseUrl, serviceKey, buildingId, orderedImages) {
  const temporaryBase = orderedImages.length + 1;
  for (const [index, item] of orderedImages.entries()) {
    await updateImageOrder(supabaseUrl, serviceKey, buildingId, {
      id: item.id,
      image_order: temporaryBase + index,
    });
  }

  for (const item of orderedImages) {
    await updateImageOrder(supabaseUrl, serviceKey, buildingId, item);
  }
}

async function resolveBuildingId(context) {
  const params = await context.params;
  return cleanId(params?.id, "building id");
}

export async function GET(request, context) {
  const config = await requireAdminImageConfig(request);
  if (config.error) {
    return config.error;
  }

  let buildingId;
  try {
    buildingId = await resolveBuildingId(context);
    const building = await fetchBuilding(config.supabaseUrl, config.serviceKey, buildingId);
    if (!building) {
      return jsonError("Building not found.", 404);
    }
    const images = await fetchImages(config.supabaseUrl, config.serviceKey, buildingId);
    return imageResponse(normalizeImagesPayload(images), config.admin);
  } catch (error) {
    return jsonError(error.message, 500);
  }
}

export async function POST(request, context) {
  const config = await requireAdminImageConfig(request);
  if (config.error) {
    return config.error;
  }

  try {
    const buildingId = await resolveBuildingId(context);
    const building = await fetchBuilding(config.supabaseUrl, config.serviceKey, buildingId);
    if (!building) {
      return jsonError("Building not found.", 404);
    }

    const formData = await request.formData();
    const file = formData.get("image");
    validateFile(file);

    const imagePath = imagePathForUpload(buildingId, file);
    const imageOrder = await nextImageOrder(
      config.supabaseUrl,
      config.serviceKey,
      buildingId,
    );
    await uploadStorageObject({
      supabaseUrl: config.supabaseUrl,
      serviceKey: config.serviceKey,
      bucket: config.bucket,
      imagePath,
      file,
    });
    const image = await insertImage(
      config.supabaseUrl,
      config.serviceKey,
      buildingId,
      imagePath,
      imageOrder,
    );

    if (!building.thumbnail_path || imageOrder === 1) {
      await updateThumbnail(config.supabaseUrl, config.serviceKey, buildingId, imagePath);
    }

    const images = await fetchImages(config.supabaseUrl, config.serviceKey, buildingId);
    return imageResponse({
      image: withImageUrls([image])[0] ?? null,
      images: withImageUrls(images),
    }, config.admin);
  } catch (error) {
    return jsonError(error.message, 500);
  }
}

export async function PATCH(request, context) {
  const config = await requireAdminImageConfig(request);
  if (config.error) {
    return config.error;
  }

  try {
    const buildingId = await resolveBuildingId(context);
    const building = await fetchBuilding(config.supabaseUrl, config.serviceKey, buildingId);
    if (!building) {
      return jsonError("Building not found.", 404);
    }

    const body = await request.json();
    const orderedImages = cleanOrderPayload(body?.images);
    await updateImageOrders(
      config.supabaseUrl,
      config.serviceKey,
      buildingId,
      orderedImages,
    );

    const images = await fetchImages(config.supabaseUrl, config.serviceKey, buildingId);
    if (images[0]?.image_path && images[0].image_path !== building.thumbnail_path) {
      await updateThumbnail(
        config.supabaseUrl,
        config.serviceKey,
        buildingId,
        images[0].image_path,
      );
    }

    return imageResponse(normalizeImagesPayload(images), config.admin);
  } catch (error) {
    return jsonError(error.message, 500);
  }
}
