import { requiredEnv } from "../../lib/http";
import { BUILDING_LIST_SELECT } from "./building-selects";
import { withBuildingImageUrls } from "./building-images";

export async function fetchDistrictBuildings(
  districtCode,
  { limit = 30, page = 1 } = {},
) {
  const supabaseUrl = requiredEnv("SUPABASE_URL").replace(/\/$/, "");
  const supabaseKey = requiredEnv("SUPABASE_ANON_KEY");
  const params = new URLSearchParams();
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 60);
  const safePage = Math.max(Number(page) || 1, 1);
  const offset = (safePage - 1) * safeLimit;

  params.set("select", BUILDING_LIST_SELECT);
  params.set("is_public", "eq.true");
  params.set("business_district", `eq.${districtCode}`);
  params.set("order", "building_name.asc,id.asc");
  params.set("limit", String(safeLimit));
  params.set("offset", String(offset));

  const response = await fetch(`${supabaseUrl}/rest/v1/buildings?${params}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Prefer: "count=exact",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error("Supabase district building list failed.");
  }

  const contentRange = response.headers.get("content-range") || "";
  const total = Number(contentRange.split("/")[1]);
  const buildings = withBuildingImageUrls(await response.json());

  return {
    buildings,
    limit: safeLimit,
    page: safePage,
    total: Number.isFinite(total) ? total : buildings.length,
    totalPages: Number.isFinite(total) ? Math.max(Math.ceil(total / safeLimit), 1) : 1,
  };
}
