"use client";

import Link from "next/link";
import { useState } from "react";

import { SearchForm } from "./SearchForm";
import { SiteFooter } from "./SiteFooter";

const GANGNAM_MAP_URL =
  "/?q=%EA%B0%95%EB%82%A8&label=%EA%B0%95%EB%82%A8&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds";

const DISTRICT_LINKS = [
  {
    label: "GBD",
    name: "강남 · 서초 · 송파",
    href: "/?q=GBD&label=GBD&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds",
  },
  {
    label: "YBD",
    name: "여의도 · 영등포",
    href: "/?q=YBD&label=YBD&lat=37.5263&lng=126.9259&level=6&source=default&mode=bounds",
  },
  {
    label: "CBD",
    name: "종로 · 중구",
    href: "/?q=CBD&label=CBD&lat=37.5663&lng=126.9782&level=6&source=default&mode=bounds",
  },
  {
    label: "BBD",
    name: "분당",
    href: "/?q=BBD&label=BBD&lat=37.3827&lng=127.1189&level=6&source=default&mode=bounds",
  },
];

const PREVIEW_BUILDINGS = [
  { name: "테헤란로 업무시설", meta: "GBD · 12년차", value: "1,240" },
  { name: "여의도역 인근 빌딩", meta: "YBD · 역세권", value: "860" },
  { name: "종로 프라임 오피스", meta: "CBD · 대형", value: "2,180" },
];

export function LandingView({ query, setQuery, onSearch, loading }) {
  const [inquiryOpen, setInquiryOpen] = useState(false);

  return (
    <section className="landing">
      <header className="siteHeader">
        <div className="brand">REALTY FIND</div>
        <nav aria-label="메뉴">
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
        {inquiryOpen && (
          <div className="inquiryMenu" role="dialog" aria-label="문의 유형">
            <button type="button">임대</button>
            <button type="button">임차</button>
            <button type="button">매입</button>
          </div>
        )}
      </header>
      <div className="hero">
        <div className="heroBackdrop" />
        <div className="heroContent">
          <div className="heroCopy">
            <span>OFFICE BUILDING SEARCH</span>
            <h1>전국 오피스 매물 찾기는 REALTY FIND</h1>
            <p>지역, 지하철역, 주소를 입력해 원하는 오피스 매물을 지도에서 바로 확인하세요.</p>
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={onSearch}
              loading={loading}
            />
            <div className="districtShortcuts" aria-label="주요 권역">
              {DISTRICT_LINKS.map((district) => (
                <Link key={district.label} href={district.href}>
                  <strong>{district.label}</strong>
                  <span>{district.name}</span>
                </Link>
              ))}
            </div>
          </div>
          <div className="heroPreview" aria-label="지도 검색 미리보기">
            <div className="previewToolbar">
              <span>Seoul Office Map</span>
              <Link href={GANGNAM_MAP_URL}>MAP 열기</Link>
            </div>
            <div className="previewMap">
              <span className="previewMarker markerA">248</span>
              <span className="previewMarker markerB">86</span>
              <span className="previewMarker markerC">32</span>
              <span className="previewRoute" />
            </div>
            <div className="previewList">
              {PREVIEW_BUILDINGS.map((building) => (
                <div key={building.name}>
                  <span>
                    <strong>{building.name}</strong>
                    <small>{building.meta}</small>
                  </span>
                  <b>{building.value}</b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <section className="stats">
        <div>
          <strong>MAP</strong>
          <span>권역별 지도 탐색</span>
        </div>
        <div>
          <strong>FILTER</strong>
          <span>규모 · 임대료 · 연차 필터</span>
        </div>
        <div>
          <strong>DB</strong>
          <span>오피스 빌딩 데이터</span>
        </div>
      </section>
      <SiteFooter />
    </section>
  );
}
