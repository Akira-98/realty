import { notFound } from "next/navigation";

import {
  DistrictPageView,
  cleanPageNumber,
  districtMetadata,
} from "../district-page-view";

export const revalidate = 3600;
export const dynamic = "force-dynamic";

function readPathPageNumber(value) {
  if (!/^\d+$/.test(String(value ?? ""))) {
    notFound();
  }

  const page = cleanPageNumber(value);
  if (page < 2) {
    notFound();
  }
  return page;
}

export async function generateMetadata({ params }) {
  const { districtSlug, pageNumber } = await params;
  return districtMetadata({
    districtSlug,
    page: readPathPageNumber(pageNumber),
  });
}

export default async function DistrictPagedPage({ params }) {
  const { districtSlug, pageNumber } = await params;
  return (
    <DistrictPageView
      districtSlug={districtSlug}
      page={readPathPageNumber(pageNumber)}
    />
  );
}
