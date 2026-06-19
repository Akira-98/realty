"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";

import { AdminHeader } from "./_components/AdminHeader";
import { AdminFooter } from "./_components/AdminFooter";
import { AdminToolbar } from "./_components/AdminToolbar";
import { BuildingEditor } from "./_components/BuildingEditor";
import { BuildingList } from "./_components/BuildingList";
import {
  EMPTY_FILTERS,
  appendFilters,
  normalizeFilters,
} from "../_lib/search-filters";
import {
  PAGE_SIZE,
  emptyDraft,
  isUnauthorized,
  pageWindow,
} from "./_lib/admin-buildings";

function AdminPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const urlQuery = searchParams.get("q") ?? "";
  const urlVisibility = ["public", "private"].includes(searchParams.get("visibility"))
    ? searchParams.get("visibility")
    : "all";
  const urlFilters = useMemo(
    () => {
      const params = new URLSearchParams(searchParamsKey);
      return normalizeFilters(
        Object.fromEntries(
          Object.keys(EMPTY_FILTERS).map((key) => [
            key,
            params.get(key) ?? "",
          ]),
        ),
      );
    },
    [searchParamsKey],
  );
  const urlPage = Math.max(1, Number(searchParams.get("page")) || 1);
  const urlOffset = (urlPage - 1) * PAGE_SIZE;
  const [sessionLoading, setSessionLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState(urlQuery);
  const [filters, setFilters] = useState(urlFilters);
  const [buildings, setBuildings] = useState([]);
  const [total, setTotal] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState({});
  const [error, setError] = useState("");

  const currentPage = urlPage;
  const totalPages = total ? Math.max(1, Math.ceil(total / PAGE_SIZE)) : 1;
  const pages = useMemo(
    () => pageWindow(currentPage, totalPages),
    [currentPage, totalPages],
  );
  const editingBuilding = useMemo(
    () => buildings.find((building) => building.id === editingId),
    [buildings, editingId],
  );
  const hasActiveAdminSearch = Boolean(
    urlQuery.trim() ||
      urlVisibility !== "all" ||
      Object.values(urlFilters).some(Boolean),
  );

  const redirectToLogin = useCallback(() => {
    router.replace("/admin/login");
  }, [router]);

  const updateAdminUrl = useCallback(
    ({
      nextQuery = query,
      nextVisibility = urlVisibility,
      nextFilters = filters,
      nextPage = 1,
    } = {}) => {
      const params = new URLSearchParams();
      const trimmedQuery = nextQuery.trim();
      if (trimmedQuery) {
        params.set("q", trimmedQuery);
      }
      if (nextVisibility !== "all") {
        params.set("visibility", nextVisibility);
      }
      appendFilters(params, normalizeFilters(nextFilters));
      if (nextPage > 1) {
        params.set("page", String(nextPage));
      }
      const nextUrl = params.toString() ? `/admin?${params}` : "/admin";
      router.push(nextUrl);
    },
    [filters, query, router, urlVisibility],
  );

  const resetAdminSearch = useCallback(() => {
    setQuery("");
    setFilters(EMPTY_FILTERS);
    updateAdminUrl({
      nextQuery: "",
      nextVisibility: "all",
      nextFilters: EMPTY_FILTERS,
      nextPage: 1,
    });
  }, [updateAdminUrl]);

  const fetchBuildings = useCallback(
    async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          limit: String(PAGE_SIZE),
          offset: String(urlOffset),
        });
        if (urlQuery.trim()) {
          params.set("q", urlQuery.trim());
        }
        if (urlVisibility !== "all") {
          params.set("visibility", urlVisibility);
        }
        appendFilters(params, urlFilters);

        const response = await fetch(`/api/admin/buildings?${params}`);
        const payload = await response.json();
        if (isUnauthorized(response)) {
          redirectToLogin();
          return;
        }
        if (!response.ok) {
          throw new Error(payload.error || "매물 목록을 불러오지 못했습니다.");
        }

        setBuildings(payload.buildings);
        setTotal(payload.total);
        setEditingId((currentId) =>
          payload.buildings.some((building) => building.id === currentId)
            ? currentId
            : null,
        );
      } catch (listError) {
        setError(listError.message);
      } finally {
        setLoading(false);
      }
    },
    [redirectToLogin, urlFilters, urlOffset, urlQuery, urlVisibility],
  );

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
      fetchBuildings();
    }
  }, [fetchBuildings, user]);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    setFilters(urlFilters);
  }, [urlFilters]);

  function startEdit(building) {
    setEditingId(building.id);
    setDraft(emptyDraft(building));
  }

  function updateDraft(key, value) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function saveBuilding(building, patch) {
    setSavingId(building.id);
    setError("");

    try {
      const response = await fetch("/api/admin/buildings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: building.id,
          ...patch,
        }),
      });
      const payload = await response.json();
      if (isUnauthorized(response)) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        throw new Error(payload.error || "매물을 수정하지 못했습니다.");
      }

      setBuildings((current) =>
        current.map((item) =>
          item.id === payload.building.id ? payload.building : item,
        ),
      );
      if (editingId === building.id) {
        setDraft(emptyDraft(payload.building));
      }
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    redirectToLogin();
  }

  if (sessionLoading) {
    return <main className="adminPage" />;
  }

  return (
    <main className="adminPage">
      <AdminHeader
        user={user}
        onReset={() => router.push("/admin")}
        onLogout={handleLogout}
      />

      <AdminToolbar
        error={error}
        loading={loading}
        query={query}
        filters={filters}
        setQuery={setQuery}
        setFilters={setFilters}
        hasActiveSearch={hasActiveAdminSearch}
        onFiltersChange={(nextFilters) => {
          setFilters(nextFilters);
          updateAdminUrl({ nextFilters, nextPage: 1 });
        }}
        onResetSearch={resetAdminSearch}
        visibility={urlVisibility}
        setVisibility={(value) => updateAdminUrl({ nextVisibility: value })}
        onSearch={() => updateAdminUrl({ nextPage: 1 })}
      />

      <section className="adminWorkspace">
        <BuildingList
          buildings={buildings}
          currentPage={currentPage}
          editingId={editingId}
          loading={loading}
          offset={urlOffset}
          pages={pages}
          savingId={savingId}
          total={total}
          totalPages={totalPages}
          onEdit={startEdit}
          onPage={(page) => updateAdminUrl({ nextPage: page })}
          onTogglePublic={(building) =>
            saveBuilding(building, { is_public: !building.is_public })
          }
        />

        <BuildingEditor
          building={editingBuilding}
          draft={draft}
          saving={savingId === editingBuilding?.id}
          onChange={updateDraft}
          onSave={() => saveBuilding(editingBuilding, draft)}
        />
      </section>
      <AdminFooter />
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<main className="adminPage" />}>
      <AdminPageContent />
    </Suspense>
  );
}
