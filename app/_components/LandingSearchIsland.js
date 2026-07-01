"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { useSearchSubmit } from "../_hooks/useSearchSubmit";
import { SearchForm } from "./SearchForm";

export function LandingSearchIsland() {
  const router = useRouter();
  const latestBoundsKeyRef = useRef("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const handleSearch = useSearchSubmit({
    latestBoundsKeyRef,
    query,
    router,
    setError,
    setLoading,
  });

  return (
    <>
      <SearchForm
        query={query}
        setQuery={setQuery}
        onSearch={handleSearch}
        loading={loading}
      />
      {error && <p className="heroSearchError">{error}</p>}
    </>
  );
}
