export function InquiryModal({
  building,
  error,
  form,
  onClose,
  onSubmit,
  onUpdate,
  submitting,
  success,
}) {
  const booleanOptions = [
    { label: "예", value: true },
    { label: "아니오", value: false },
  ];

  function BooleanField({ label, name }) {
    return (
      <fieldset className="inquiryChoiceGroup">
        <legend>{label}</legend>
        <div>
          {booleanOptions.map((option) => (
            <label key={option.label}>
              <input
                type="radio"
                name={name}
                checked={form[name] === option.value}
                onChange={() => onUpdate(name, option.value)}
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
    );
  }

  function FieldLabel({ children, required = false }) {
    return (
      <span className={required ? "inquiryFieldLabel required" : "inquiryFieldLabel"}>
        <span>{children}</span>
        {required && <em>*</em>}
      </span>
    );
  }

  return (
    <div
      className="inquiryModalBackdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <section
        className="inquiryModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
      >
        <div className="inquiryModalHeader">
          <div>
            <span>온라인 문의</span>
            <h2 id="inquiry-title">{building?.building_name || "일반 문의"}</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>

        <form className="inquiryForm" onSubmit={onSubmit}>
          <p className="inquiryRequiredHint">* 필수 입력</p>

          <section className="inquiryFormSection">
            <h3>기본 정보</h3>
            <label>
              <FieldLabel required>이름</FieldLabel>
              <input
                placeholder="홍길동"
                value={form.name}
                onChange={(event) => onUpdate("name", event.target.value)}
                required
              />
            </label>
            <label>
              <FieldLabel required>연락처</FieldLabel>
              <input
                placeholder="010-0000-0000"
                value={form.phone}
                onChange={(event) => onUpdate("phone", event.target.value)}
                required
              />
            </label>
            <label>
              <FieldLabel>회사명</FieldLabel>
              <input
                placeholder="회사명"
                value={form.company}
                onChange={(event) => onUpdate("company", event.target.value)}
              />
            </label>
          </section>

          <section className="inquiryFormSection">
            <h3>희망 조건</h3>
            <label>
              <FieldLabel required>희망면적</FieldLabel>
              <input
                placeholder="50평"
                value={form.desired_area}
                onChange={(event) => onUpdate("desired_area", event.target.value)}
                required
              />
            </label>
            <label>
              <FieldLabel required>입주시기</FieldLabel>
              <input
                type="date"
                value={form.move_in_date}
                onChange={(event) => onUpdate("move_in_date", event.target.value)}
                required
              />
            </label>
            <label>
              <FieldLabel required>지역</FieldLabel>
              <input
                placeholder="강남, 판교"
                value={form.preferred_region}
                onChange={(event) => onUpdate("preferred_region", event.target.value)}
                required
              />
            </label>
          </section>

          <section className="inquiryFormSection">
            <h3>예산 범위</h3>
            <label>
              <FieldLabel required>보증금</FieldLabel>
              <input
                placeholder="5천만 ~ 1억"
                value={form.desired_deposit}
                onChange={(event) => onUpdate("desired_deposit", event.target.value)}
                required
              />
            </label>
            <label>
              <FieldLabel required>임대료 + 관리비</FieldLabel>
              <input
                placeholder="월 300 ~ 500만"
                value={form.desired_rent}
                onChange={(event) => onUpdate("desired_rent", event.target.value)}
                required
              />
            </label>
          </section>

          <section className="inquiryFormSection">
            <h3>공간 이용</h3>
            <label>
              <FieldLabel>필요 주차대수(차종)</FieldLabel>
              <input
                placeholder="2대, SUV"
                value={form.parking}
                onChange={(event) => onUpdate("parking", event.target.value)}
              />
            </label>
            <label>
              <FieldLabel>방 개수</FieldLabel>
              <input
                placeholder="3개"
                value={form.room_count}
                onChange={(event) => onUpdate("room_count", event.target.value)}
              />
            </label>
            <BooleanField label="야근 여부" name="overtime" />
            <BooleanField label="내방객 유무" name="has_visitors" />
            <BooleanField label="인테리어 유무" name="has_interior" />
          </section>

          <section className="inquiryFormSection">
            <h3>추가 요청</h3>
            <label>
              <FieldLabel>요청사항</FieldLabel>
              <input
                placeholder="추가 요청사항"
                value={form.message}
                onChange={(event) => onUpdate("message", event.target.value)}
              />
            </label>
          </section>

          {error && <p className="inquiryError">{error}</p>}
          {success && <p className="inquirySuccess">{success}</p>}

          <div className="inquiryActions">
            <button type="submit" disabled={submitting}>
              {submitting ? "접수 중" : "문의하기"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
