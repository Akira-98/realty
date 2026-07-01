import Link from "next/link";

import { buildSummary } from "../_lib/buildings";
import { buildingDetailPath } from "../_lib/building-url";
import { districtMapPath, districtPagePath } from "../_lib/district-pages";

function districtPageHref(district, page) {
  return page > 1 ? `${districtPagePath(district)}/${page}` : districtPagePath(district);
}

function pageRange(currentPage, totalPages) {
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(totalPages, currentPage + 2);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
}

export function DistrictSeoContent({ district, buildingPage }) {
  const { buildings, page, totalPages } = buildingPage;

  return (
    <main className="districtPage">
      <header className="districtPageHeader">
        <Link href="/" className="districtBrand">
          REALTY FIND
        </Link>
        <nav aria-label="권역 페이지 메뉴">
          <Link href={districtMapPath(district)}>지도에서 보기</Link>
          <Link href="/inquiries/tenant">문의</Link>
        </nav>
      </header>

      <section className="districtHero" aria-labelledby="district-seo-title">
        <div className="districtHeroContent">
          <span>{district.label}</span>
          <h1 id="district-seo-title">{district.keyword}</h1>
          <p>{district.description}</p>
          <div className="districtHeroActions">
            <Link className="districtPrimaryLink" href={districtMapPath(district)}>
              지도에서 보기
            </Link>
            <Link className="districtSecondaryLink" href="/inquiries/tenant">
              임차 문의
            </Link>
          </div>
        </div>
        <img src={district.image} alt="" aria-hidden="true" />
      </section>

      <section className="districtSeoSection" aria-label={`${district.label} 건물 목록`}>
        <div className="districtSeoInner">
          <div className="districtSeoHeader">
            <span>BUILDINGS</span>
            <h2>{district.label} 사무실 임대 건물</h2>
            <p>{district.name} 일대의 공개 오피스 빌딩 목록입니다. 건물명을 선택하면 상세 임대 정보를 확인할 수 있습니다.</p>
          </div>
          {buildings.length > 0 ? (
            <div className="districtBuildingGrid">
              {buildings.map((building) => (
                <a
                  key={building.id}
                  className="districtBuildingLink"
                  href={buildingDetailPath(building)}
                >
                  <div className={building.thumbnail_url ? "districtBuildingPhoto hasPhoto" : "districtBuildingPhoto"}>
                    {building.thumbnail_url ? (
                      <img
                        src={building.thumbnail_url}
                        alt={`${building.building_name} 사진`}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <span aria-label="건물 사진 없음" />
                    )}
                  </div>
                  <div className="districtBuildingInfo">
                    <strong>{building.building_name}</strong>
                    <span>{building.address}</span>
                    <small>{buildSummary(building)}</small>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <p className="districtEmptyText">
              현재 공개된 {district.label} 건물 목록을 준비 중입니다.
            </p>
          )}
          {totalPages > 1 && (
            <nav className="districtPagination" aria-label={`${district.label} 건물 목록 페이지`}>
              {page > 1 && (
                <Link href={districtPageHref(district, page - 1)}>이전</Link>
              )}
              {pageRange(page, totalPages).map((pageNumber) => (
                <Link
                  key={pageNumber}
                  href={districtPageHref(district, pageNumber)}
                  aria-current={pageNumber === page ? "page" : undefined}
                >
                  {pageNumber}
                </Link>
              ))}
              {page < totalPages && (
                <Link href={districtPageHref(district, page + 1)}>다음</Link>
              )}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
