"use client";

import { useState } from "react";

import { InquiryModal } from "./_components/InquiryModal";

const EMPTY_FORM = {
  name: "",
  phone: "",
  company: "",
  message: "",
};

export function InquiryForm({ building, buttonLabel = "온라인 문의" }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function openForm() {
    setOpen(true);
    setError("");
    setSuccess("");
  }

  function closeForm() {
    setOpen(false);
  }

  async function submitInquiry(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/inquiries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...form,
          building_id: building?.id ?? null,
          building_name: building?.building_name ?? null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(
          payload.details?.message || payload.error || "문의 접수에 실패했습니다.",
        );
      }

      setSuccess("문의가 접수되었습니다.");
      setForm(EMPTY_FORM);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
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
          error={error}
          form={form}
          onClose={closeForm}
          onSubmit={submitInquiry}
          onUpdate={updateField}
          submitting={submitting}
          success={success}
        />
      )}
    </>
  );
}
