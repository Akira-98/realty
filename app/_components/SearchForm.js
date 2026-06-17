export function SearchForm({ query, setQuery, onSearch, loading, compact = false }) {
  return (
    <form className={compact ? "searchForm compact" : "searchForm"} onSubmit={onSearch}>
      <div className="searchInputWrap">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="지역, 지하철역, 주소"
          aria-label="검색어"
        />
        <button type="submit" disabled={loading}>
          {loading ? "검색 중" : "검색"}
        </button>
      </div>
    </form>
  );
}
