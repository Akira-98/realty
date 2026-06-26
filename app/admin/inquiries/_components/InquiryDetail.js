import { STATUS_LABELS, STATUS_OPTIONS, formatInquiryDate } from "../_lib/inquiries";
import { priceSummary } from "../../_lib/admin-buildings";

function booleanLabel(value) {
  if (value === true) {
    return "예";
  }
  if (value === false) {
    return "아니오";
  }
  return "-";
}

export function InquiryDetail({ inquiry, savingId, onClose, onStatusChange }) {
  if (!inquiry) {
    return null;
  }

  const buildingName = inquiry.building?.building_name || inquiry.building_name || "일반 문의";
  const buildingAddress = inquiry.building?.address || "매물 정보 없음";
  const buildingPrice = inquiry.building ? priceSummary(inquiry.building) : "";
  const extraConditions = [
    ["주차", inquiry.parking],
    ["방", inquiry.room_count],
    ["야근", booleanLabel(inquiry.overtime)],
    ["내방객", booleanLabel(inquiry.has_visitors)],
    ["인테리어", booleanLabel(inquiry.has_interior)],
  ].filter(([, value]) => value && value !== "-");

  return (
    <div
      className="inquiryDetailBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="inquiryDetailModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-inquiry-title"
      >
        <div className="inquiryDetailHeader">
          <span className={`inquiryStatus status-${inquiry.status}`}>
            {STATUS_LABELS[inquiry.status] || inquiry.status}
          </span>
          <div>
            <h2 id="admin-inquiry-title">{inquiry.name || "이름 없음"}</h2>
            <p>{inquiry.phone || "연락처 없음"}</p>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>

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

        <section className="inquiryDetailSection">
          <h3>기본 정보</h3>
          <dl className="inquiryDetailList compact">
            <div>
              <dt>회사명</dt>
              <dd>{inquiry.company || "-"}</dd>
            </div>
            <div>
              <dt>접수일</dt>
              <dd>{formatInquiryDate(inquiry.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="inquiryDetailSection">
          <h3>문의 매물</h3>
          <div className="inquiryBuildingSummary">
            <strong>{buildingName}</strong>
            <span>{buildingAddress}</span>
            {buildingPrice && <em>{buildingPrice}</em>}
          </div>
        </section>

        <section className="inquiryDetailSection">
          <h3>핵심 조건</h3>
          <dl className="inquiryDetailList compact">
            <div>
              <dt>희망면적</dt>
              <dd>{inquiry.desired_area || "-"}</dd>
            </div>
            <div>
              <dt>입주시기</dt>
              <dd>{inquiry.move_in_date || "-"}</dd>
            </div>
            <div>
              <dt>희망지역</dt>
              <dd>{inquiry.preferred_region || "-"}</dd>
            </div>
            <div>
              <dt>보증금</dt>
              <dd>{inquiry.desired_deposit || "-"}</dd>
            </div>
            <div>
              <dt>임대료 + 관리비</dt>
              <dd>{inquiry.desired_rent || "-"}</dd>
            </div>
          </dl>
        </section>

        <section className="inquiryDetailSection">
          <h3>추가 조건</h3>
          <div className="inquiryConditionChips">
            {extraConditions.length > 0 ? (
              extraConditions.map(([label, value]) => (
                <span key={label}>
                  <b>{label}</b>
                  {value}
                </span>
              ))
            ) : (
              <em>추가 조건 없음</em>
            )}
          </div>
        </section>

        <section className="inquiryDetailSection">
          <h3>요청사항</h3>
          <p className="inquiryMessage">{inquiry.message || "-"}</p>
        </section>
      </section>
    </div>
  );
}
