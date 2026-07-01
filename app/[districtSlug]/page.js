import {
  DistrictPageView,
  districtMetadata,
} from "./district-page-view";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { districtSlug } = await params;
  return districtMetadata({ districtSlug });
}

export default async function DistrictPage({ params }) {
  const { districtSlug } = await params;
  return <DistrictPageView districtSlug={districtSlug} />;
}
