import { requiredEnv } from "../../lib/http";
import {
  withBuildingImageUrl,
  withBuildingImageUrlsForRows,
} from "./building-images";
import { formatBuildingAge, formatWithUnit } from "./formatters";
import { parseBuildingIdParam } from "./building-url";
import { businessDistrictLabel } from "./search-filters";

export const BUILDING_DETAIL_SELECT = [
  "id",
  "building_name",
  "address",
  "subway",
  "building_use",
  "building_scale",
  "business_district",
  "scale",
  "gross_floor_area",
  "approval_date",
  "approval_date_parsed",
  "deposit_num",
  "rent_num",
  "maintenance_num",
  "parking_fee",
  "elevator",
  "parking",
  "hvac",
  "ceiling_height",
  "lat",
  "lng",
  "is_public",
  "thumbnail_path",
].join(",");

export const BUILDING_SITEMAP_SELECT = [
  "id",
  "building_name",
  "updated_at",
].join(",");

const DETAIL_EMPTY_VALUE = "별도문의";

export function field(value, fallback = DETAIL_EMPTY_VALUE) {
  return value || fallback;
}

export function withSquareMeterUnit(value) {
  return formatWithUnit(value, "m²", /(㎡|m2|m²|제곱미터)/i);
}

export function joinValues(...values) {
  return values.filter(Boolean).join(" ");
}

export function formatApprovalDate(value) {
  if (!value) {
    return DETAIL_EMPTY_VALUE;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
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
  const buildingScale = building.building_scale;
  const businessDistrict = businessDistrictLabel(building.business_district);
  const buildingAge = formatBuildingAge(building.approval_date_parsed);
  const heroMeta = [businessDistrict, building.scale, buildingAge].filter(Boolean);
  const basicItems = [
    { icon: "building", label: "규모", value: buildingScale },
    { icon: "tag", label: "용도", value: building.building_use },
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
    { icon: "pin", label: "주소", value: building.address },
    { icon: "parking", label: "주차", value: building.parking },
    { icon: "coin", label: "주차비", value: building.parking_fee },
  ];

  return {
    basicItems,
    buildingScale,
    facilityItems,
    heroMeta,
    title,
    transportItems,
  };
}
