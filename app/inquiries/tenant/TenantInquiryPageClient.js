"use client";

import { InquiryFields } from "../../_components/inquiries/_components/InquiryFields";
import { useInquiryForm } from "../../_components/inquiries/useInquiryForm";

export function TenantInquiryPageClient() {
  const inquiry = useInquiryForm({
    building: {
      building_name: "임차 문의",
    },
  });

  return (
    <main className="inquiryPage">
      <section className="inquiryPageShell">
        <header className="inquiryPageHeader">
          <h1>전문가와 함께 최적의 사무실을 찾아보세요</h1>
        </header>
        <InquiryFields
          error={inquiry.error}
          form={inquiry.form}
          onSubmit={inquiry.submitInquiry}
          onUpdate={inquiry.updateField}
          submitting={inquiry.submitting}
          success={inquiry.success}
        />
      </section>
    </main>
  );
}
