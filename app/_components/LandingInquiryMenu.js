"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function LandingInquiryMenu({ className = "" }) {
  const menuRef = useRef(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [open]);

  return (
    <span ref={menuRef} className={className || undefined}>
      <button
        type="button"
        className="headerMenuButton"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        문의하기
      </button>
      {open && (
        <div className="inquiryMenu" role="dialog" aria-label="문의 유형">
          <button type="button">임대</button>
          <Link href="/inquiries/tenant">임차</Link>
          <button type="button">매입</button>
        </div>
      )}
    </span>
  );
}
