"use client";

import { useState } from "react";

import { InquiryModal } from "./_components/InquiryModal";
import { useInquiryForm } from "./useInquiryForm";

export function InquiryForm({ building, buttonLabel = "온라인 문의" }) {
  const [open, setOpen] = useState(false);
  const inquiry = useInquiryForm({ building });

  function openForm() {
    setOpen(true);
    inquiry.resetStatus();
  }

  function closeForm() {
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="detailSecondaryAction"
        onClick={openForm}
      >
        {buttonLabel}
      </button>

      {open && (
        <InquiryModal
          building={building}
          error={inquiry.error}
          form={inquiry.form}
          onClose={closeForm}
          onSubmit={inquiry.submitInquiry}
          onUpdate={inquiry.updateField}
          submitting={inquiry.submitting}
          success={inquiry.success}
        />
      )}
    </>
  );
}
