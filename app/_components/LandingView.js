"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { SearchForm } from "./SearchForm";
import { SiteFooter } from "./SiteFooter";
import { buildingDetailPath } from "../_lib/building-url";

const GANGNAM_MAP_URL =
  "/?q=%EA%B0%95%EB%82%A8&label=%EA%B0%95%EB%82%A8&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds";

const DISTRICT_LINKS = [
  {
    label: "강남권역",
    name: "강남 · 서초 · 송파",
    image: "/images/gbd.jpg",
    href: "/?q=GBD&label=%EA%B0%95%EB%82%A8%EA%B6%8C%EC%97%AD&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds&businessDistrict=GBD",
  },
  {
    label: "여의도권역",
    name: "여의도 · 영등포",
    image: "/images/ybd.jpg",
    href: "/?q=YBD&label=%EC%97%AC%EC%9D%98%EB%8F%84%EA%B6%8C%EC%97%AD&lat=37.5263&lng=126.9259&level=6&source=default&mode=bounds&businessDistrict=YBD",
  },
  {
    label: "도심권역",
    name: "종로 · 중구",
    image: "/images/cbd.jpg",
    href: "/?q=CBD&label=%EB%8F%84%EC%8B%AC%EA%B6%8C%EC%97%AD&lat=37.5663&lng=126.9782&level=6&source=default&mode=bounds&businessDistrict=CBD",
  },
  {
    label: "분당권역",
    name: "분당",
    image: "/images/bbd.png",
    href: "/?q=BBD&label=%EB%B6%84%EB%8B%B9%EA%B6%8C%EC%97%AD&lat=37.3827&lng=127.1189&level=6&source=default&mode=bounds&businessDistrict=BBD",
  },
];

const FEATURED_BUILDINGS = [
  {
    id: 253,
    name: "디지털큐브",
    image: "/images/featured/digital-cube.png",
    tags: ["#대표매물", "#오피스빌딩", "#업무시설"],
  },
  {
    id: 3066,
    name: "덕승빌딩",
    image: "/images/featured/deokseung-building.jpg",
    tags: ["#추천오피스", "#빌딩임대", "#업무시설"],
  },
  {
    id: 57,
    name: "한덕빌딩",
    image: "/images/featured/handeok-building.jpg",
    tags: ["#대표매물", "#오피스", "#빌딩정보"],
  },
  {
    id: 3813,
    name: "서울파이낸스센터 SFC",
    image: "/images/featured/seoul-finance-center.png",
    tags: ["#CBD", "#프라임오피스", "#대표매물"],
  },
  {
    id: 2094,
    name: "FKI타워(구.전경련회관)",
    image: "/images/featured/fki-tower.png",
    tags: ["#YBD", "#프라임오피스", "#대표매물"],
  },
];

const SERVICE_ITEMS = [
  {
    title: "사무실 이전 컨설팅",
    description: "인원 계획, 예산, 출퇴근 동선, 입주 시점을 기준으로 후보지를 좁힙니다.",
  },
  {
    title: "오피스 임대차 중개",
    description: "권역별 공실과 조건을 비교하고 임대인 협의까지 한 흐름으로 진행합니다.",
  },
  {
    title: "빌딩 데이터 탐색",
    description: "지도와 필터로 규모, 연차, 위치, 임대료 정보를 빠르게 확인합니다.",
  },
];

const PROCESS_STEPS = [
  "요구 조건 정리",
  "후보 빌딩 선별",
  "투어 및 조건 협의",
  "계약·입주 일정 관리",
];

export function LandingView({ query, setQuery, onSearch, loading }) {
  const headerRef = useRef(null);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeaturedIndex, setActiveFeaturedIndex] = useState(0);
  const featuredBuilding = FEATURED_BUILDINGS[activeFeaturedIndex];

  useEffect(() => {
    if (!inquiryOpen && !mobileMenuOpen) {
      return;
    }

    function handlePointerDown(event) {
      if (headerRef.current?.contains(event.target)) {
        return;
      }

      setInquiryOpen(false);
      setMobileMenuOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [inquiryOpen, mobileMenuOpen]);

  function showPreviousFeaturedBuilding() {
    setActiveFeaturedIndex((index) =>
      index === 0 ? FEATURED_BUILDINGS.length - 1 : index - 1,
    );
  }

  function showNextFeaturedBuilding() {
    setActiveFeaturedIndex((index) =>
      index === FEATURED_BUILDINGS.length - 1 ? 0 : index + 1,
    );
  }

  return (
    <section className="landing">
      <header className="siteHeader" ref={headerRef}>
        <div className="brand">REALTY FIND</div>
        <nav className="desktopHeaderNav" aria-label="메뉴">
          <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
          <a>빌딩정보(List)</a>
          <button
            type="button"
            className="headerMenuButton"
            aria-expanded={inquiryOpen}
            onClick={() => setInquiryOpen((open) => !open)}
          >
            문의하기
          </button>
        </nav>
        <nav className="mobileHeaderNav" aria-label="모바일 메뉴">
          <button
            type="button"
            className="headerMenuButton"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-header-menu"
            onClick={() => {
              setMobileMenuOpen((open) => !open);
              setInquiryOpen(false);
            }}
          >
            빌딩정보
          </button>
          <button
            type="button"
            className="headerMenuButton"
            aria-expanded={inquiryOpen}
            onClick={() => {
              setInquiryOpen((open) => !open);
              setMobileMenuOpen(false);
            }}
          >
            문의하기
          </button>
        </nav>
        {inquiryOpen && (
          <div className="inquiryMenu" role="dialog" aria-label="문의 유형">
            <button type="button">임대</button>
            <Link href="/inquiries/tenant">임차</Link>
            <button type="button">매입</button>
          </div>
        )}
        {mobileMenuOpen && (
          <div
            id="mobile-header-menu"
            className="mobileHeaderMenu"
            role="dialog"
            aria-label="모바일 메뉴"
          >
            <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
            <a>빌딩정보(List)</a>
          </div>
        )}
      </header>
      <div className="hero">
        <div className="heroBackdrop" />
        <div className="heroContent">
          <aside className="heroSearchPanel heroSearchPanelPlain" aria-label="오피스 검색">
            <div className="heroSearchCopy">
              <span className="heroSearchEyebrow">COMMERCIAL OFFICE ADVISORY</span>
              <h1>
                <span className="heroSearchLine">새로운 사무공간이 필요할 땐</span>
                <span>REALTY FIND</span>
              </h1>
            </div>
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={onSearch}
              loading={loading}
            />
          </aside>
          <div className="heroFeature">
            <div className="heroTags">
              {featuredBuilding.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
            <strong className="heroFeatureTitle">{featuredBuilding.name}</strong>
            <a
              className="heroDetailLink"
              href={buildingDetailPath({
                id: featuredBuilding.id,
                building_name: featuredBuilding.name,
              })}
            >
              자세히 보기
            </a>
            <div className="featuredControls" aria-label="대표매물 이동">
              <button
                type="button"
                aria-label="이전 대표매물"
                onClick={showPreviousFeaturedBuilding}
              >
                &lt;
              </button>
              <button
                type="button"
                aria-label="다음 대표매물"
                onClick={showNextFeaturedBuilding}
              >
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
      <section className="landingSection areaSection">
        <div className="sectionHeading">
          <span>LOCATION</span>
          <h2>주요 업무권역을 바로 확인하세요</h2>
        </div>
        <div className="areaLinks">
          {DISTRICT_LINKS.map((district) => (
            <Link key={district.label} href={district.href}>
              <img src={district.image} alt="" aria-hidden="true" />
              <span className="areaLinkOverlay" aria-hidden="true" />
              <span className="areaLinkText">
                <strong>{district.label}</strong>
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="landingSection processSection">
        <div className="sectionHeading">
          <span>PROCESS</span>
          <h2>조건 정리부터 계약 검토까지 한 번에</h2>
        </div>
        <ol className="processList">
          {PROCESS_STEPS.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>
      <section className="landingSection serviceSection">
        <div className="sectionHeading">
          <span>WHAT WE DO</span>
          <h2>검색에서 끝나지 않는 오피스 찾기</h2>
          <p>필요 면적과 예산이 정해진 팀도, 이전 후보지를 처음 검토하는 팀도 같은 흐름으로 비교할 수 있습니다.</p>
        </div>
        <div className="serviceGrid">
          {SERVICE_ITEMS.map((item) => (
            <article key={item.title} className="serviceCard">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
      <SiteFooter />
    </section>
  );
}
