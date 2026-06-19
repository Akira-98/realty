import "./globals.css";
import "./styles/landing.css";
import "./styles/search-results.css";
import "./styles/building-detail.css";
import "./styles/admin.css";
import "./styles/responsive.css";

export const metadata = {
  title: "Realt Search",
  description: "Location-based building search",
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
