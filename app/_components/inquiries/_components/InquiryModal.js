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
          <label>
            이름
            <input
              value={form.name}
              onChange={(event) => onUpdate("name", event.target.value)}
              required
            />
          </label>
          <label>
            연락처
            <input
              value={form.phone}
              onChange={(event) => onUpdate("phone", event.target.value)}
              required
            />
          </label>
          <label>
            회사명
            <input
              value={form.company}
              onChange={(event) => onUpdate("company", event.target.value)}
            />
          </label>
          <label>
            문의 내용
            <textarea
              value={form.message}
              onChange={(event) => onUpdate("message", event.target.value)}
              required
            />
          </label>

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
