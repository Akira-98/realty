export function InquiryToolbar({
  error,
  loading,
  status,
  setStatus,
  onRefresh,
}) {
  return (
    <section className="adminToolbar inquiryToolbar">
      <div className="adminSearch inquirySearch">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">전체 상태</option>
          <option value="new">신규</option>
          <option value="contacted">연락완료</option>
          <option value="closed">종료</option>
        </select>
        <button type="button" onClick={onRefresh} disabled={loading}>
          {loading ? "조회 중" : "새로고침"}
        </button>
      </div>
      {error && <p className="adminError">{error}</p>}
    </section>
  );
}
