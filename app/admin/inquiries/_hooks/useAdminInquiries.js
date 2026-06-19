import { useCallback, useEffect, useMemo, useState } from "react";

import { isUnauthorized } from "../../_lib/admin-buildings";

export function useAdminInquiries(router) {
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("all");
  const [inquiries, setInquiries] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const selectedInquiry = useMemo(
    () => inquiries.find((inquiry) => inquiry.id === selectedId),
    [inquiries, selectedId],
  );

  const redirectToLogin = useCallback(() => {
    router.replace("/admin/login");
  }, [router]);

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ limit: "100" });
      if (status !== "all") {
        params.set("status", status);
      }

      const response = await fetch(`/api/admin/inquiries?${params}`);
      const payload = await response.json();
      if (isUnauthorized(response)) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error || "문의 목록을 불러오지 못했습니다.");
      }

      setInquiries(payload.inquiries);
      setSelectedId((currentId) =>
        payload.inquiries.some((inquiry) => inquiry.id === currentId)
          ? currentId
          : payload.inquiries[0]?.id ?? null,
      );
    } catch (listError) {
      setError(listError.message);
    } finally {
      setLoading(false);
    }
  }, [redirectToLogin, status]);

  useEffect(() => {
    async function checkSession() {
      try {
        const response = await fetch("/api/admin/session");
        const payload = await response.json();
        if (!response.ok) {
          redirectToLogin();
          return;
        }
        setUser(payload.user);
      } catch {
        redirectToLogin();
      } finally {
        setSessionLoading(false);
      }
    }

    checkSession();
  }, [redirectToLogin]);

  useEffect(() => {
    if (user) {
      fetchInquiries();
    }
  }, [fetchInquiries, user]);

  async function updateStatus(inquiry, nextStatus) {
    setSavingId(inquiry.id);
    setError("");

    try {
      const response = await fetch("/api/admin/inquiries", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: inquiry.id,
          status: nextStatus,
        }),
      });
      const payload = await response.json();
      if (isUnauthorized(response)) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error || "문의 상태를 변경하지 못했습니다.");
      }

      setInquiries((current) =>
        current.map((item) =>
          item.id === payload.inquiry.id ? payload.inquiry : item,
        ),
      );
    } catch (statusError) {
      setError(statusError.message);
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    redirectToLogin();
  }

  return {
    error,
    inquiries,
    logout,
    savingId,
    selectedId,
    selectedInquiry,
    sessionLoading,
    setSelectedId,
    setStatus,
    status,
    updateStatus,
    user,
  };
}
