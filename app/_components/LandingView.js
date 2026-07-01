import Link from "next/link";

import { LandingFeaturedIsland } from "./LandingFeaturedIsland";
import { LandingInquiryMenu } from "./LandingInquiryMenu";
import { LandingSearchIsland } from "./LandingSearchIsland";
import { SiteFooter } from "./SiteFooter";
import {
  DISTRICT_LINKS,
  GANGNAM_MAP_URL,
  PROCESS_STEPS,
  SERVICE_ITEMS,
} from "../_lib/landing-content";

export function LandingView() {
  return (
    <section className="landing">
      <header className="siteHeader">
        <div className="brand">REALTY FIND</div>
        <nav className="desktopHeaderNav" aria-label="메뉴">
          <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
          <LandingInquiryMenu />
        </nav>
        <nav className="mobileHeaderNav" aria-label="모바일 메뉴">
          <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
          <LandingInquiryMenu />
        </nav>
      </header>
      <div className="hero">
        <div className="heroBackdrop" />
        <div className="heroContent">
          <aside className="heroSearchPanel heroSearchPanelPlain" aria-label="오피스 검색">
            <div className="heroSearchCopy">
              <h1>
                <span className="heroSearchLine">새로운 사무공간이 필요할 땐</span>
                <span>REALTY FIND</span>
              </h1>
            </div>
            <LandingSearchIsland />
          </aside>
          <LandingFeaturedIsland />
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
