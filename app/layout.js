import "./globals.css";
import "./styles/landing-header.css";
import "./styles/landing-hero.css";
import "./styles/landing-preview.css";
import "./styles/landing-stats.css";
import "./styles/site-footer.css";
import "./styles/search-layout.css";
import "./styles/map.css";
import "./styles/map-filters.css";
import "./styles/results-panel.css";
import "./styles/selected-bar.css";
import "./styles/detail-page.css";
import "./styles/detail-content.css";
import "./styles/detail-panel.css";
import "./styles/inquiry-modal.css";
import "./styles/admin-base.css";
import "./styles/admin-login.css";
import "./styles/admin-layout.css";
import "./styles/admin-toolbar.css";
import "./styles/admin-list.css";
import "./styles/admin-inquiries.css";
import "./styles/admin-editor.css";
import "./styles/admin-responsive.css";
import "./styles/landing-responsive.css";
import "./styles/search-responsive.css";
import "./styles/detail-responsive.css";

import { DEFAULT_SEO_DESCRIPTION, SITE_NAME, absoluteUrl, siteUrl } from "./_lib/seo";

export const metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: `${SITE_NAME} | 서울 오피스·사무실 임대 빌딩 검색`,
    template: `%s | ${SITE_NAME}`,
  },
  description: DEFAULT_SEO_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    title: `${SITE_NAME} | 서울 오피스·사무실 임대 빌딩 검색`,
    description: DEFAULT_SEO_DESCRIPTION,
    url: "/",
    images: [
      {
        url: absoluteUrl("/images/landing-office-hero.png"),
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} 오피스 빌딩 검색`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | 서울 오피스·사무실 임대 빌딩 검색`,
    description: DEFAULT_SEO_DESCRIPTION,
    images: [absoluteUrl("/images/landing-office-hero.png")],
  },
};

export const viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children, detail }) {
  return (
    <html lang="ko">
      <body>
        {children}
        {detail}
      </body>
    </html>
  );
}
