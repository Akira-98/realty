import { NextResponse } from "next/server";

import { jsonError, requiredEnv } from "../../../../../../lib/http";
import {
  requireAdmin,
  setAdminSessionCookies,
  supabaseBaseUrl,
  supabaseHeaders,
} from "../../../../../../lib/supabase-admin";
import { getBuildingImagePublicUrl } from "../../../../../_lib/building-images";

export const BUILDING_IMAGE_SELECT = [
  "id",
  "building_id",
  "image_path",
  "image_order",
  "created_at",
].join(",");

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
export const IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function requireAdminImageConfig(request) {
  const admin = await requireAdmin(request);
  if (admin.error) {
    return { error: admin.error };
  }

  try {
    return {
      admin,
      bucket:
        process.env.BUILDING_IMAGES_BUCKET ||
        process.env.SUPABASE_STORAGE_BUCKET ||
        "building-images",
      serviceKey: requiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
      supabaseUrl: supabaseBaseUrl(),
    };
  } catch (error) {
    return { error: jsonError(error.message, 500) };
  }
}

export function imageResponse(payload, admin) {
  return setAdminSessionCookies(NextResponse.json(payload), admin.session);
}

export function withImageUrls(images) {
  if (!Array.isArray(images)) {
    return [];
  }

  return images.map((image) => ({
    ...image,
    image_url: getBuildingImagePublicUrl(image.image_path),
  }));
}

export function cleanId(value, label = "id") {
  const id = String(value ?? "").trim();
  if (!id) {
    throw new Error(`${label} is required.`);
  }
  return id;
}

export function storageObjectUrl(supabaseUrl, bucket, path) {
  return `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodeStoragePath(path)}`;
}

function encodeStoragePath(storagePath) {
  return storagePath.split("/").map(encodeURIComponent).join("/");
}

export async function fetchBuilding(supabaseUrl, serviceKey, buildingId) {
  const params = new URLSearchParams();
  params.set("select", "id,thumbnail_path");
  params.set("id", `eq.${buildingId}`);
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase building lookup failed: ${body}`);
  }

  const buildings = await response.json();
  return buildings[0] ?? null;
}

export async function fetchImages(supabaseUrl, serviceKey, buildingId) {
  const params = new URLSearchParams();
  params.set("select", BUILDING_IMAGE_SELECT);
  params.set("building_id", `eq.${buildingId}`);
  params.set("order", "image_order.asc.nullslast,created_at.asc");

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase building image list failed: ${body}`);
  }

  return response.json();
}

export async function fetchImage(supabaseUrl, serviceKey, buildingId, imageId) {
  const params = new URLSearchParams();
  params.set("select", BUILDING_IMAGE_SELECT);
  params.set("building_id", `eq.${buildingId}`);
  params.set("id", `eq.${imageId}`);
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/building_images?${params}`, {
    headers: supabaseHeaders(serviceKey),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase building image lookup failed: ${body}`);
  }

  const images = await response.json();
  return images[0] ?? null;
}

export async function updateThumbnail(supabaseUrl, serviceKey, buildingId, thumbnailPath) {
  const params = new URLSearchParams();
  params.set("id", `eq.${buildingId}`);

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    method: "PATCH",
    headers: supabaseHeaders(serviceKey, {
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ thumbnail_path: thumbnailPath }),
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase thumbnail update failed: ${body}`);
  }
}

export async function deleteStorageObject(supabaseUrl, serviceKey, bucket, imagePath) {
  const response = await fetch(
    `${supabaseUrl}/storage/v1/object/${encodeURIComponent(bucket)}`,
    {
      method: "DELETE",
      headers: supabaseHeaders(serviceKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify({ prefixes: [imagePath] }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Supabase storage delete failed: ${body}`);
  }
}

export function normalizeImagesPayload(images) {
  return { images: withImageUrls(images) };
}
