"use client";

import { useRouter } from "next/navigation";

import { AdminFooter } from "../_components/AdminFooter";
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
          currentPage={inquiries.currentPage}
          inquiries={inquiries.inquiries}
          loading={inquiries.loading}
          offset={inquiries.offset}
          pages={inquiries.pages}
          selectedId={inquiries.selectedId}
          total={inquiries.total}
          totalPages={inquiries.totalPages}
          onPage={inquiries.setCurrentPage}
          onSelect={inquiries.setSelectedId}
        />
      </section>
      <InquiryDetail
        inquiry={inquiries.selectedInquiry}
        savingId={inquiries.savingId}
        onClose={() => inquiries.setSelectedId(null)}
        onStatusChange={inquiries.updateStatus}
      />
      <AdminFooter />
    </main>
  );
}
