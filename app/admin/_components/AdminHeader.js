"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function AdminHeader({ user, onReset, onLogout }) {
  const [newInquiryCount, setNewInquiryCount] = useState(0);

  useEffect(() => {
    if (!user) {
      return;
    }

    const controller = new AbortController();
    async function fetchNewInquiryCount() {
      try {
        const response = await fetch("/api/admin/inquiries?status=new&limit=1", {
          signal: controller.signal,
        });
        const payload = await response.json();
        if (response.ok) {
          setNewInquiryCount(payload.total ?? payload.count ?? 0);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          setNewInquiryCount(0);
        }
      }
    }

    fetchNewInquiryCount();
    return () => {
      controller.abort();
    };
  }, [user]);

  return (
    <header className="adminHeader">
      <div>
        <span className="adminEyebrow">REALTY FIND</span>
        <button type="button" className="adminTitleButton" onClick={onReset}>
          매물관리
        </button>
        <nav className="adminNav" aria-label="관리 메뉴">
          <Link href="/admin">매물</Link>
          <Link href="/admin/inquiries">
            문의
            {newInquiryCount > 0 && (
              <span className="adminNavBadge">{newInquiryCount}</span>
            )}
          </Link>
        </nav>
      </div>
      <div className="adminUser">
        <span>{user?.email}</span>
        <button
          type="button"
          className="adminLogoutButton"
          aria-label="로그아웃"
          title="로그아웃"
          onClick={onLogout}
        >
          ⏻
        </button>
      </div>
    </header>
  );
}
