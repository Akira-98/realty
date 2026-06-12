export function AdminToolbar({
  error,
  loading,
  query,
  setQuery,
  visibility,
  setVisibility,
  onSearch,
}) {
  return (
    <section className="adminToolbar">
      <form
        className="adminSearch"
        onSubmit={(event) => {
          event.preventDefault();
          onSearch();
        }}
      >
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="건물명 또는 주소"
        />
        <select
          value={visibility}
          onChange={(event) => setVisibility(event.target.value)}
        >
          <option value="all">전체</option>
          <option value="public">공개</option>
          <option value="private">비공개</option>
        </select>
        <button type="submit" disabled={loading}>
          {loading ? "조회 중" : "조회"}
        </button>
      </form>
      {error && <p className="adminError">{error}</p>}
    </section>
  );
}
