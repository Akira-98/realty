"use client";

import Link from "next/link";
import { useState } from "react";

import { SiteFooter } from "./SiteFooter";

const GANGNAM_MAP_URL =
  "/?q=%EA%B0%95%EB%82%A8&label=%EA%B0%95%EB%82%A8&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds";

export function LandingView() {
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
            <span>오피스 · 업무시설 · 위치기반 검색</span>
            <h1>원하는 지역 근처의 오피스를 빠르게 찾아보세요.</h1>
            <p>지도와 목록에서 에이플러스리얼티의 빌딩 정보를 확인합니다.</p>
            <div className="heroActions">
              <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
              <a>빌딩정보(List)</a>
            </div>
          </div>
        </div>
      </div>
      <section className="stats">
        <div>
          <strong>0</strong>
          <span>임대차 자문</span>
        </div>
        <div>
          <strong>0</strong>
          <span>매입매각 자문</span>
        </div>
        <div>
          <strong>0</strong>
          <span>DB</span>
        </div>
      </section>
      <SiteFooter />
    </section>
  );
}
