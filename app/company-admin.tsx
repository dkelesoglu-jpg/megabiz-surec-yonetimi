"use client";
import { FormEvent, useEffect, useState } from "react";
type Company = {
  id: string;
  name: string;
  sector?: string;
  employeeCount?: number;
  packageName?: string;
  status: string;
};
type Module = { module: string; enabled: boolean };
export default function CompanyAdmin() {
  const [allowed, setAllowed] = useState(false),
    [open, setOpen] = useState(false),
    [companies, setCompanies] = useState<Company[]>([]),
    [modules, setModules] = useState<Module[]>([]),
    [message, setMessage] = useState("");
  const active =
    typeof document !== "undefined"
      ? document.cookie.match(/(?:^|;\s*)mega_company=([^;]+)/)?.[1] ||
        "mega-global-energy"
      : "mega-global-energy";
  useEffect(() => {
    fetch("/api/session")
      .then((r) => r.json())
      .then((j) => setAllowed(j.user?.platformRole === "super_admin"));
    const openFromToolbar = () => show();
    window.addEventListener("open-company-admin", openFromToolbar);
    return () =>
      window.removeEventListener("open-company-admin", openFromToolbar);
  }, []);
  async function load() {
    const [c, m] = await Promise.all([
      fetch("/api/companies").then((r) => r.json()),
      fetch("/api/company-modules").then((r) => r.json()),
    ]);
    setCompanies(c.companies || []);
    setModules(m.modules || []);
  }
  async function show() {
    setOpen(true);
    setMessage("");
    await load();
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget,
      data = Object.fromEntries(new FormData(form).entries()),
      r = await fetch("/api/companies", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data),
      }),
      j = await r.json();
    if (!r.ok) {
      setMessage(j.error || "Şirket oluşturulamadı.");
      return;
    }
    setMessage("Şirket ve modül paketi oluşturuldu. Yeni şirkete geçiliyor…");
    form.reset();
    document.cookie = `mega_company=${encodeURIComponent(j.company.id)}; path=/; max-age=31536000; SameSite=Lax`;
    setTimeout(() => location.reload(), 650);
  }
  async function toggle(item: Module) {
    const next = !item.enabled;
    setModules((list) =>
      list.map((x) => (x.module === item.module ? { ...x, enabled: next } : x)),
    );
    const r = await fetch("/api/company-modules", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ module: item.module, enabled: next }),
    });
    if (!r.ok) {
      setModules((list) =>
        list.map((x) => (x.module === item.module ? item : x)),
      );
      setMessage("Modül güncellenemedi.");
    } else
      setMessage(
        `${item.module} ${next ? "etkinleştirildi" : "devre dışı bırakıldı"}.`,
      );
  }
  if (!allowed) return null;
  const current = companies.find((c) => c.id === active);
  return (
    <>
      <button className="global-admin-launcher" style={launcher} onClick={show}>
        ▦ Şirket Yönetimi
      </button>
      {open && (
        <div
          style={backdrop}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <section style={modal}>
            <header style={header}>
              <div>
                <small style={eyebrow}>SUPER ADMIN</small>
                <h2 style={title}>Şirket ve Paket Yönetimi</h2>
                <p style={sub}>
                  Yeni tenant açın; aktif şirketin kullanabileceği modülleri
                  yönetin.
                </p>
              </div>
              <button style={close} onClick={() => setOpen(false)}>
                ×
              </button>
            </header>
            <div style={body}>
              <form style={form} onSubmit={create}>
                <h3 style={sectionTitle}>Yeni Şirket Açılışı</h3>
                <input
                  style={input}
                  name="name"
                  placeholder="Şirket unvanı"
                  required
                />
                <input style={input} name="sector" placeholder="Sektör" />
                <input
                  style={input}
                  name="employeeCount"
                  type="number"
                  min="0"
                  placeholder="Çalışan sayısı"
                />
                <select
                  style={input}
                  name="packageName"
                  defaultValue="Professional"
                >
                  <option>Basic</option>
                  <option>Professional</option>
                  <option>Enterprise</option>
                </select>
                <div style={packages}>
                  <b>Basic</b> temel İK · <b>Professional</b> gelişmiş İK ·{" "}
                  <b>Enterprise</b> tüm modüller
                </div>
                <button style={primary}>＋ Şirketi Oluştur</button>
              </form>
              <div>
                <div style={moduleHead}>
                  <div>
                    <h3 style={sectionTitle}>Aktif Modüller</h3>
                    <p style={caption}>
                      {current?.name || active} ·{" "}
                      {current?.packageName || "Professional"}
                    </p>
                  </div>
                  <span style={counter}>
                    {modules.filter((x) => x.enabled).length}/{modules.length}{" "}
                    aktif
                  </span>
                </div>
                <div style={grid}>
                  {modules.map((item) => (
                    <button
                      type="button"
                      key={item.module}
                      onClick={() => toggle(item)}
                      style={{
                        ...moduleCard,
                        ...(item.enabled ? enabled : disabled),
                      }}
                    >
                      <span>{item.module}</span>
                      <i
                        style={{
                          ...switchBase,
                          ...(item.enabled ? switchOn : switchOff),
                        }}
                      >
                        <em style={{ ...knob, left: item.enabled ? 18 : 2 }} />
                      </i>
                    </button>
                  ))}
                </div>
              </div>
              {message && <p style={notice}>{message}</p>}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
const launcher = {
  position: "fixed" as const,
  right: 18,
  bottom: 116,
  zIndex: 40,
  border: 0,
  borderRadius: 10,
  background: "#10284d",
  color: "white",
  padding: "11px 13px",
  fontSize: 8,
  fontWeight: 800,
  boxShadow: "0 8px 24px #10284d42",
  cursor: "pointer",
};
const backdrop = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 110,
  background: "#061228b8",
  display: "grid",
  placeItems: "center",
  padding: 14,
};
const modal = {
  width: "min(900px,97vw)",
  maxHeight: "92vh",
  overflow: "auto",
  background: "#f5f7fa",
  borderRadius: 17,
  boxShadow: "0 30px 90px #020b1f80",
};
const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px 22px",
  background: "white",
  borderBottom: "1px solid #e5eaf1",
};
const eyebrow = {
  fontSize: 8,
  color: "#0ca4a8",
  fontWeight: 800,
  letterSpacing: 1.5,
};
const title = { fontSize: 21, color: "#14213d", margin: "4px 0 2px" };
const sub = { fontSize: 9, color: "#8793a5", margin: 0 };
const close = {
  border: 0,
  background: "#edf1f5",
  width: 32,
  height: 32,
  borderRadius: 8,
  fontSize: 18,
  cursor: "pointer",
};
const body = { padding: 18 };
const form = {
  display: "grid",
  gridTemplateColumns: "1.4fr 1fr .7fr 1fr auto",
  gap: 8,
  alignItems: "end",
  background: "white",
  padding: 15,
  border: "1px solid #e4e9f0",
  borderRadius: 12,
  marginBottom: 16,
};
const sectionTitle = {
  gridColumn: "1/-1",
  fontSize: 12,
  color: "#203650",
  margin: "0 0 2px",
};
const input = {
  height: 37,
  border: "1px solid #dae2eb",
  borderRadius: 8,
  padding: "0 9px",
  fontSize: 9,
  background: "white",
};
const packages = { gridColumn: "1/-2", fontSize: 8, color: "#8491a2" };
const primary = {
  height: 37,
  border: 0,
  borderRadius: 8,
  background: "#12a3a8",
  color: "white",
  fontSize: 8,
  fontWeight: 800,
  padding: "0 13px",
  cursor: "pointer",
};
const moduleHead = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 9,
};
const caption = { fontSize: 8, color: "#8b96a7", margin: "3px 0 0" };
const counter = {
  fontSize: 8,
  color: "#087f84",
  background: "#dcf7f6",
  padding: "6px 9px",
  borderRadius: 20,
  fontWeight: 800,
};
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(185px,1fr))",
  gap: 7,
};
const moduleCard = {
  height: 43,
  borderRadius: 9,
  padding: "0 10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  fontSize: 8,
  fontWeight: 700,
  cursor: "pointer",
  textAlign: "left" as const,
};
const enabled = {
  background: "white",
  border: "1px solid #bfe7e5",
  color: "#234259",
};
const disabled = {
  background: "#eef1f5",
  border: "1px solid #e1e5ea",
  color: "#9aa4b1",
};
const switchBase = {
  position: "relative" as const,
  width: 34,
  height: 18,
  borderRadius: 20,
  flex: "0 0 auto",
};
const switchOn = { background: "#11a4a8" };
const switchOff = { background: "#c8cfd8" };
const knob = {
  position: "absolute" as const,
  top: 2,
  width: 14,
  height: 14,
  borderRadius: "50%",
  background: "white",
  transition: "left .15s",
};
const notice = {
  margin: "12px 0 0",
  padding: 10,
  borderRadius: 8,
  background: "#e5f8f7",
  color: "#28787d",
  fontSize: 8,
};
