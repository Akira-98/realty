import { STATUS_LABELS, STATUS_OPTIONS } from "../_lib/inquiries";

export function InquiryToolbar({
  error,
  status,
  setStatus,
}) {
  return (
    <section className="adminToolbar inquiryToolbar">
      <div className="adminSearch inquirySearch">
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="all">전체 상태</option>
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {STATUS_LABELS[option]}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="adminError">{error}</p>}
    </section>
  );
}
