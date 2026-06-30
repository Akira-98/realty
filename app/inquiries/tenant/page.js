import Link from "next/link";

import { SiteFooter } from "../../_components/SiteFooter";
import { TenantInquiryPageClient } from "./TenantInquiryPageClient";

const GANGNAM_MAP_URL =
  "/?q=%EA%B0%95%EB%82%A8&label=%EA%B0%95%EB%82%A8&lat=37.4979&lng=127.0276&level=6&source=default&mode=bounds";

export const metadata = {
  title: "임차 문의 | Realty Find",
};

export default function TenantInquiryPage() {
  return (
    <>
      <header className="siteHeader inquiryPageHeaderNav">
        <Link href="/" className="brand">
          REALTY FIND
        </Link>
        <nav className="desktopHeaderNav" aria-label="메뉴">
          <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
          <a>빌딩정보(List)</a>
        </nav>
        <nav className="mobileHeaderNav" aria-label="모바일 메뉴">
          <Link href={GANGNAM_MAP_URL}>빌딩정보(MAP)</Link>
          <a>빌딩정보(List)</a>
        </nav>
      </header>
      <TenantInquiryPageClient />
      <SiteFooter />
    </>
  );
}
