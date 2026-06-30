import { fetchPublicBuildingSitemapRows } from "./_lib/building-detail";
import { buildingDetailPath } from "./_lib/building-url";
import { absoluteUrl } from "./_lib/seo";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

function lastModified(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : new Date();
}

export default async function sitemap() {
  const staticRoutes = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/inquiries/tenant"),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  let buildings = [];
  try {
    buildings = await fetchPublicBuildingSitemapRows();
  } catch {
    buildings = [];
  }

  const buildingRoutes = buildings.map((building) => ({
    url: absoluteUrl(buildingDetailPath(building)),
    lastModified: lastModified(building.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticRoutes, ...buildingRoutes];
}
