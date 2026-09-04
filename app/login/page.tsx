"use client";
import { FormEvent, useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "../supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/session").then((response) => {
      if (response.ok) window.location.replace("/");
    });
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Giriş sırasında bir hata oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        padding: 16,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 360,
          background: "#ffffff",
          borderRadius: 12,
          padding: 32,
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              width: 48,
              height: 48,
              margin: "0 auto",
              borderRadius: 10,
              background: "#1d4ed8",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            M
          </div>
          <h1 style={{ marginTop: 12, fontSize: 18, fontWeight: 700 }}>MEGA HRMS PROFESSIONAL</h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>Devam etmek için giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>E-posta</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 13, marginBottom: 4 }}>Şifre</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", borderRadius: 8 }}
            />
          </div>

          {error && <p style={{ color: "#dc2626", fontSize: 13 }}>{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            style={{
              marginTop: 8,
              padding: "10px 12px",
              background: "#1d4ed8",
              color: "#fff",
              borderRadius: 8,
              fontWeight: 600,
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Giriş yapılıyor…" : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
