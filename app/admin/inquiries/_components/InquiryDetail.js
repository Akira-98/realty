import { STATUS_LABELS, formatInquiryDate } from "../_lib/inquiries";

export function InquiryDetail({ inquiry, savingId, onStatusChange }) {
  if (!inquiry) {
    return (
      <aside className="adminEditor inquiryDetail">
        <div className="adminEmpty">확인할 문의를 선택하세요.</div>
      </aside>
    );
  }

  return (
    <aside className="adminEditor inquiryDetail">
      <div className="adminEditorTitle">
        <span>{STATUS_LABELS[inquiry.status]}</span>
        <h2>{inquiry.name}</h2>
        <p>{inquiry.phone}</p>
      </div>
      <dl className="inquiryDetailList">
        <div>
          <dt>회사명</dt>
          <dd>{inquiry.company || "-"}</dd>
        </div>
        <div>
          <dt>문의 매물</dt>
          <dd>{inquiry.building_name || "일반 문의"}</dd>
        </div>
        <div>
          <dt>접수일</dt>
          <dd>{formatInquiryDate(inquiry.created_at)}</dd>
        </div>
        <div>
          <dt>문의 내용</dt>
          <dd>{inquiry.message}</dd>
        </div>
      </dl>
      <div className="inquiryStatusActions">
        {Object.keys(STATUS_LABELS).map((nextStatus) => (
          <button
            type="button"
            key={nextStatus}
            disabled={savingId === inquiry.id || inquiry.status === nextStatus}
            onClick={() => onStatusChange(inquiry, nextStatus)}
          >
            {STATUS_LABELS[nextStatus]}
          </button>
        ))}
      </div>
    </aside>
  );
}
