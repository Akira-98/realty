import { notFound } from "next/navigation";

import { DistrictSeoContent } from "../_components/DistrictSeoContent";
import { fetchDistrictBuildings } from "../_lib/district-buildings";
import {
  districtBySlug,
  districtPagePath,
} from "../_lib/district-pages";
import { DEFAULT_SEO_DESCRIPTION, SITE_NAME, absoluteUrl } from "../_lib/seo";

export function cleanPageNumber(value) {
  const page = Number(value ?? 1);
  return Number.isFinite(page) && page > 1 ? Math.floor(page) : 1;
}

export function districtPagedPath(district, page) {
  return page > 1 ? `${districtPagePath(district)}/${page}` : districtPagePath(district);
}

export async function districtMetadata({ districtSlug, page = 1 }) {
  const district = districtBySlug(decodeURIComponent(districtSlug));

  if (!district) {
    return {
      title: "페이지를 찾을 수 없습니다",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const safePage = cleanPageNumber(page);
  const title = safePage > 1 ? `${district.keyword} ${safePage}페이지` : district.keyword;
  const description = `${district.description} ${DEFAULT_SEO_DESCRIPTION}`;
  const path = districtPagedPath(district, safePage);

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: `${title} | ${SITE_NAME}`,
      description,
      url: path,
      images: [
        {
          url: absoluteUrl(district.image),
          alt: `${district.label} 오피스 빌딩`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [absoluteUrl(district.image)],
    },
  };
}

export async function DistrictPageView({ districtSlug, page = 1 }) {
  const district = districtBySlug(decodeURIComponent(districtSlug));

  if (!district) {
    notFound();
  }

  const safePage = cleanPageNumber(page);
  const buildingPage = await fetchDistrictBuildings(district.code, { page: safePage });

  if (safePage > buildingPage.totalPages) {
    notFound();
  }

  return <DistrictSeoContent district={district} buildingPage={buildingPage} />;
}
