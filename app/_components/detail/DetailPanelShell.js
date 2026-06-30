"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function DetailPanelShell({ action, children, copyHref = "" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [copyState, setCopyState] = useState("idle");
  const currentSearch = searchParams.toString();
  const closeHref = `/${currentSearch ? `?${currentSearch}` : ""}`;

  async function copyCurrentUrl() {
    try {
      const copyUrl = copyHref
        ? new URL(copyHref, window.location.origin).toString()
        : `${window.location.origin}${window.location.pathname}`;
      await navigator.clipboard.writeText(copyUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1600);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 1600);
    }
  }

  return (
    <aside className="detailPanel" aria-label="매물 상세 패널">
      <div className="detailPanelHeader">
        <strong>매물 상세</strong>
        <div className="detailPanelHeaderActions">
          <button
            type="button"
            className="detailPanelIconButton"
            aria-label="상세 매물 URL 복사"
            title={copyState === "copied" ? "복사됨" : "URL 복사"}
            onClick={copyCurrentUrl}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <path d="m8.7 10.7 6.6-4.4M8.7 13.3l6.6 4.4" />
            </svg>
          </button>
          <button
            type="button"
            className="detailPanelCloseButton"
            aria-label="상세 패널 닫기"
            onClick={() => router.replace(closeHref)}
          >
            ×
          </button>
          <span
            className={
              copyState === "idle"
                ? "detailCopyStatus"
                : "detailCopyStatus visible"
            }
            aria-live="polite"
          >
            {copyState === "copied" ? "URL이 복사되었습니다." : ""}
            {copyState === "failed" ? "URL 복사에 실패했습니다." : ""}
          </span>
        </div>
      </div>
      <div className="detailPanelBody">{children}</div>
      {action && <div className="detailPanelActionBar">{action}</div>}
    </aside>
  );
}
