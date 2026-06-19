import { priceSummary } from "../../_lib/admin-buildings";
import { Pagination } from "../../_components/Pagination";
import { STATUS_LABELS, formatInquiryDate } from "../_lib/inquiries";

function buildingSummary(inquiry) {
  return inquiry.building ? priceSummary(inquiry.building) : "";
}

export function InquiryList({
  currentPage,
  inquiries,
  loading,
  offset,
  pages,
  selectedId,
  total,
  totalPages,
  onPage,
  onSelect,
}) {
  return (
    <div className="adminList inquiryAdminList">
      <div className="adminListMeta">
        <span>
          {inquiries.length > 0 ? `${offset + 1}-${offset + inquiries.length}` : "0"}
          {total !== null ? ` / ${total}` : ""}
        </span>
      </div>
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
          <div className="adminEmpty">
            {loading ? "문의를 불러오는 중입니다." : "접수된 문의가 없습니다."}
          </div>
        )}
      </div>

      {total !== null && (
        <Pagination
          ariaLabel="문의 페이지"
          currentPage={currentPage}
          loading={loading}
          pages={pages}
          totalPages={totalPages}
          onPage={onPage}
        />
      )}
    </div>
  );
}
