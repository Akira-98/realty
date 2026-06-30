import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "../../_components/SiteFooter";
import { BuildingDetailView } from "../../_components/detail/BuildingDetailView";
import { fetchBuildingDetail } from "../../_lib/building-detail";
import { buildingDetailPath } from "../../_lib/building-url";
import {
  SITE_NAME,
  absoluteUrl,
  buildBuildingSeoDescription,
} from "../../_lib/seo";

export const revalidate = 60;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const building = await fetchBuildingDetail(id);

  if (!building) {
    return {
      title: "매물을 찾을 수 없습니다",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const title = `${building.building_name || "빌딩"} 임대 정보`;
  const description = buildBuildingSeoDescription(building);
  const canonicalPath = buildingDetailPath(building);
  const image = building.thumbnail_url || absoluteUrl("/images/landing-office-hero.png");

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      type: "article",
      siteName: SITE_NAME,
      locale: "ko_KR",
      title: `${title} | ${SITE_NAME}`,
      description,
      url: canonicalPath,
      images: [
        {
          url: image,
          alt: `${building.building_name || "빌딩"} 사진`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [image],
    },
  };
}

export default async function BuildingDetailPage({ params }) {
  const { id } = await params;
  const building = await fetchBuildingDetail(id);

  if (!building) {
    notFound();
  }

  return (
    <main className="detailPage">
      <header className="detailHeader">
        <Link href="/" className="detailBrand">
          REALTY FIND
        </Link>
        <nav aria-label="상세 메뉴">
          <Link href="/">검색</Link>
          <a>임대</a>
          <a>문의</a>
        </nav>
      </header>

      <div className="detailContainer">
        <BuildingDetailView building={building} />
      </div>
      <SiteFooter />
    </main>
  );
}
