"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminFooter } from "../_components/AdminFooter";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.error || "로그인하지 못했습니다.");
      }
      router.push("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="adminLoginPage">
      <section className="adminLoginIntro" aria-label="REALTY FIND 관리자">
        <span>REALTY FIND ADMIN</span>
        <h1>오피스 매물 관리</h1>
        <p>APLUS REALTY 업무용 관리자 영역</p>
      </section>
      <section className="adminLoginPanel">
        <div>
          <span className="adminEyebrow">SECURE ACCESS</span>
          <h1>관리자 로그인</h1>
        </div>
        <form className="adminLoginForm" onSubmit={handleSubmit}>
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="adminError">{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "로그인 중" : "로그인"}
          </button>
        </form>
      </section>
      <AdminFooter />
    </main>
  );
}
