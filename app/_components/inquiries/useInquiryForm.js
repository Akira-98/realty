"use client";

import { useState } from "react";

export const EMPTY_INQUIRY_FORM = {
  name: "",
  phone: "",
  company: "",
  desired_area: "",
  move_in_date: "",
  desired_deposit: "",
  desired_rent: "",
  preferred_region: "",
  parking: "",
  overtime: "",
  has_visitors: "",
  has_interior: "",
  room_count: "",
  message: "",
};

export function useInquiryForm({ building = null } = {}) {
  const [form, setForm] = useState(EMPTY_INQUIRY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function resetStatus() {
    setError("");
    setSuccess("");
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
      setForm(EMPTY_INQUIRY_FORM);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    error,
    form,
    resetStatus,
    submitInquiry,
    submitting,
    success,
    updateField,
  };
}
