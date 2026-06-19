"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function DetailPanelShell({ action, children }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const closeHref = `/${currentSearch ? `?${currentSearch}` : ""}`;

  return (
    <aside className="detailPanel" aria-label="매물 상세 패널">
      <div className="detailPanelHeader">
        <strong>매물 상세</strong>
        <button
          type="button"
          aria-label="상세 패널 닫기"
          onClick={() => router.replace(closeHref)}
        >
          ×
        </button>
      </div>
      <div className="detailPanelBody">{children}</div>
      {action && <div className="detailPanelActionBar">{action}</div>}
    </aside>
  );
}
