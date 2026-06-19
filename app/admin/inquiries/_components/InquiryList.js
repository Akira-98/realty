import { priceSummary } from "../../_lib/admin-buildings";
import { STATUS_LABELS, formatInquiryDate } from "../_lib/inquiries";

function buildingSummary(inquiry) {
  return inquiry.building ? priceSummary(inquiry.building) : "";
}

export function InquiryList({ inquiries, selectedId, onSelect }) {
  return (
    <div className="adminList">
      <div className="adminListMeta">문의 {inquiries.length}건</div>
      <div className="inquiryList">
        {inquiries.map((inquiry) => (
          <button
            type="button"
            key={inquiry.id}
            className={inquiry.id === selectedId ? "adminInquiry active" : "adminInquiry"}
            onClick={() => onSelect(inquiry.id)}
          >
            <span className={`inquiryStatus status-${inquiry.status}`}>
              {STATUS_LABELS[inquiry.status] || inquiry.status}
            </span>
            <strong>
              {inquiry.building?.building_name || inquiry.building_name || "일반 문의"}
            </strong>
            <span>{inquiry.building?.address || "매물 정보 없음"}</span>
            <em>{buildingSummary(inquiry) || "상세 조건 정보 없음"}</em>
            <small>{formatInquiryDate(inquiry.created_at)}</small>
          </button>
        ))}
        {inquiries.length === 0 && (
          <div className="adminEmpty">접수된 문의가 없습니다.</div>
        )}
      </div>
    </div>
  );
}
