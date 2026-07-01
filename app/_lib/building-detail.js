import { requiredEnv } from "../../lib/http";
import {
  withBuildingImageUrl,
  withBuildingImageUrlsForRows,
} from "./building-images";
import {
  buildingHeroMeta,
  field,
  formatApprovalDate,
  formatDisplayAddress,
  formatFloorScale,
  purposeReferenceMarks,
  withSquareMeterUnit,
} from "./building-display";
import {
  BUILDING_DETAIL_SELECT,
  BUILDING_SITEMAP_SELECT,
} from "./building-selects";
import { parseBuildingIdParam } from "./building-url";

export function joinValues(...values) {
  return values.filter(Boolean).join(" ");
}

export async function fetchBuildingDetail(id) {
  const buildingId = parseBuildingIdParam(id);
  if (!buildingId) {
    return null;
  }

  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams();
  params.set("select", BUILDING_DETAIL_SELECT);
  params.set("id", `eq.${buildingId}`);
  params.set("is_public", "eq.true");
  params.set("limit", "1");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    throw new Error("Supabase building detail failed.");
  }

  const buildings = await response.json();
  const building = withBuildingImageUrl(buildings[0] ?? null);

  if (!building) {
    return null;
  }

  const imageParams = new URLSearchParams();
  imageParams.set("select", "image_path,image_order");
  imageParams.set("building_id", `eq.${building.id}`);
  imageParams.set("order", "image_order.asc");

  const imageResponse = await fetch(`${supabaseUrl}/rest/v1/building_images?${imageParams}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 60 },
  });

  if (!imageResponse.ok) {
    throw new Error("Supabase building images failed.");
  }

  const images = withBuildingImageUrlsForRows(await imageResponse.json());

  return {
    ...building,
    images:
      images.length > 0
        ? images
        : [
            {
              image_path: building.thumbnail_path,
              image_order: 1,
              image_url: building.thumbnail_url,
            },
          ].filter((image) => image.image_url),
  };
}

export async function fetchPublicBuildingSitemapRows() {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams();
  params.set("select", BUILDING_SITEMAP_SELECT);
  params.set("is_public", "eq.true");
  params.set("order", "updated_at.desc.nullslast,building_name.asc");
  params.set("limit", "50000");

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Supabase building sitemap failed.");
  }

  return response.json();
}

export function getBuildingDetailModel(building) {
  const title = field(building.building_name, "이름 없는 빌딩");
  const buildingScale = formatFloorScale(building);
  const displayAddress = formatDisplayAddress(building);
  const heroMeta = buildingHeroMeta(building);
  const purposeMarks = purposeReferenceMarks(building);
  const basicItems = [
    { icon: "building", label: "규모", value: buildingScale },
    {
      icon: "tag",
      label: "용도",
      value: building.building_use,
      description: building.etc_purpose,
      marks: purposeMarks,
    },
    { icon: "calendar", label: "사용승인일", value: formatApprovalDate(building.approval_date) },
    { icon: "area", label: "연면적", value: withSquareMeterUnit(building.gross_floor_area) },
  ].filter(Boolean);
  const facilityItems = [
    { icon: "height", label: "천정고", value: building.ceiling_height },
    { icon: "wind", label: "냉난방방식", value: building.hvac },
    { icon: "elevator", label: "엘리베이터", value: building.elevator },
  ];
  const transportItems = [
    { icon: "train", label: "지하철", value: building.subway },
    { icon: "pin", label: "주소", value: displayAddress },
    { icon: "parking", label: "주차", value: building.parking },
    { icon: "coin", label: "주차비", value: building.parking_fee },
  ];

  return {
    basicItems,
    buildingScale,
    displayAddress,
    facilityItems,
    heroMeta,
    registerClassification: building.register_classification,
    title,
    transportItems,
  };
}
