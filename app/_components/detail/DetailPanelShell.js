"use client";

import { useRouter } from "next/navigation";

export function DetailPanelShell({ action, children }) {
  const router = useRouter();

  return (
    <aside className="detailPanel" aria-label="매물 상세 패널">
      <div className="detailPanelHeader">
        <strong>매물 상세</strong>
        <button
          type="button"
          aria-label="상세 패널 닫기"
          onClick={() => router.back()}
        >
          ×
        </button>
      </div>
      <div className="detailPanelBody">{children}</div>
      {action && <div className="detailPanelActionBar">{action}</div>}
    </aside>
  );
}
