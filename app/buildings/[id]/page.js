import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "../../_components/SiteFooter";
import { BuildingDetailView } from "../../_components/detail/BuildingDetailView";
import { fetchBuildingDetail } from "../../_lib/building-detail";

export const revalidate = 60;

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
