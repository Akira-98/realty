import { STATUS_LABELS, STATUS_OPTIONS, formatInquiryDate } from "../_lib/inquiries";

function booleanLabel(value) {
  if (value === true) {
    return "예";
  }
  if (value === false) {
    return "아니오";
  }
  return "-";
}

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
          <dt>희망면적</dt>
          <dd>{inquiry.desired_area || "-"}</dd>
        </div>
        <div>
          <dt>입주시기</dt>
          <dd>{inquiry.move_in_date || "-"}</dd>
        </div>
        <div>
          <dt>예산 범위 - 보증금</dt>
          <dd>{inquiry.desired_deposit || "-"}</dd>
        </div>
        <div>
          <dt>예산 범위 - 임대료 + 관리비</dt>
          <dd>{inquiry.desired_rent || "-"}</dd>
        </div>
        <div>
          <dt>지역</dt>
          <dd>{inquiry.preferred_region || "-"}</dd>
        </div>
        <div>
          <dt>필요 주차대수(차종)</dt>
          <dd>{inquiry.parking || "-"}</dd>
        </div>
        <div>
          <dt>야근 여부</dt>
          <dd>{booleanLabel(inquiry.overtime)}</dd>
        </div>
        <div>
          <dt>내방객 유무</dt>
          <dd>{booleanLabel(inquiry.has_visitors)}</dd>
        </div>
        <div>
          <dt>인테리어 유무</dt>
          <dd>{booleanLabel(inquiry.has_interior)}</dd>
        </div>
        <div>
          <dt>방 개수</dt>
          <dd>{inquiry.room_count || "-"}</dd>
        </div>
        <div>
          <dt>요청사항</dt>
          <dd>{inquiry.message || "-"}</dd>
        </div>
      </dl>
      <div className="inquiryStatusActions">
        {STATUS_OPTIONS.map((nextStatus) => (
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
