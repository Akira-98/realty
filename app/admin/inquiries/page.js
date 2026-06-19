"use client";

import { useRouter } from "next/navigation";

import { AdminHeader } from "../_components/AdminHeader";
import { InquiryDetail } from "./_components/InquiryDetail";
import { InquiryList } from "./_components/InquiryList";
import { InquiryToolbar } from "./_components/InquiryToolbar";
import { useAdminInquiries } from "./_hooks/useAdminInquiries";

export default function AdminInquiriesPage() {
  const router = useRouter();
  const inquiries = useAdminInquiries(router);

  if (inquiries.sessionLoading) {
    return <main className="adminPage" />;
  }

  return (
    <main className="adminPage">
      <AdminHeader
        user={inquiries.user}
        onReset={() => router.push("/admin")}
        onLogout={inquiries.logout}
      />

      <InquiryToolbar
        error={inquiries.error}
        status={inquiries.status}
        setStatus={inquiries.setStatus}
      />

      <section className="adminWorkspace inquiryWorkspace">
        <InquiryList
          inquiries={inquiries.inquiries}
          selectedId={inquiries.selectedId}
          onSelect={inquiries.setSelectedId}
        />
        <InquiryDetail
          inquiry={inquiries.selectedInquiry}
          savingId={inquiries.savingId}
          onStatusChange={inquiries.updateStatus}
        />
      </section>
    </main>
  );
}
