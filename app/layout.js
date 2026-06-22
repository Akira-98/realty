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

export const metadata = {
  title: "Realt Search",
  description: "Location-based building search",
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
