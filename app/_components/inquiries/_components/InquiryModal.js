import { InquiryFields } from "./InquiryFields";

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
            <h2 id="inquiry-title">{building?.building_name || "일반 문의"}</h2>
          </div>
          <button type="button" aria-label="닫기" onClick={onClose}>
            ×
          </button>
        </div>

        <InquiryFields
          error={error}
          form={form}
          onSubmit={onSubmit}
          onUpdate={onUpdate}
          submitting={submitting}
          success={success}
        />
      </section>
    </div>
  );
}
