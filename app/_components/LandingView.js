import { SearchForm } from "./SearchForm";
import { SiteFooter } from "./SiteFooter";

export function LandingView({ query, setQuery, loading, error, onSearch }) {
  return (
    <section className="landing">
      <header className="siteHeader">
        <div className="brand">REALTY FIND</div>
        <nav aria-label="메뉴">
          <a>오피스</a>
          <a>지역검색</a>
          <a>문의</a>
        </nav>
      </header>
      <div className="hero">
        <div className="heroBackdrop" />
        <div className="heroContent">
          <div className="heroCopy">
            <span>오피스 · 업무시설 · 위치기반 검색</span>
            <h1>원하는 지역 근처의 오피스를 빠르게 찾아보세요.</h1>
            <p>지역, 지하철역, 주소로 검색하고 지도 영역 안의 매물을 확인합니다.</p>
          </div>
          <div className="searchPanel">
            <h2>지역 검색</h2>
            <SearchForm
              query={query}
              setQuery={setQuery}
              onSearch={onSearch}
              loading={loading}
            />
            {error && <p className="errorText">{error}</p>}
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
