"use client";
import { useEffect, useState } from "react";
type Perm = {
  role: string;
  module: string;
  canView: boolean;
  canEdit: boolean;
};
type Log = {
  id: number;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  oldValue: string;
  newValue: string;
};
export default function SecurityCenter() {
  const [open, setOpen] = useState(false),
    [tab, setTab] = useState<"permissions" | "audit">("permissions"),
    [role, setRole] = useState("hr"),
    [modules, setModules] = useState<string[]>([]),
    [permissions, setPermissions] = useState<Perm[]>([]),
    [logs, setLogs] = useState<Log[]>([]),
    [message, setMessage] = useState("");
  async function load() {
    const [p, a] = await Promise.all([
        fetch("/api/permissions"),
        fetch("/api/audit"),
      ]),
      pj = await p.json(),
      aj = await a.json();
    if (p.ok) {
      setModules(pj.modules || []);
      setPermissions(pj.permissions || []);
    } else setMessage("Yetki yönetimi için erişiminiz bulunmuyor.");
    if (a.ok) setLogs(aj.logs || []);
  }
  useEffect(() => {
    if (open) load();
  }, [open]);
  useEffect(() => {
    const openFromToolbar = () => setOpen(true);
    window.addEventListener("open-security-center", openFromToolbar);
    return () =>
      window.removeEventListener("open-security-center", openFromToolbar);
  }, []);
  function current(module: string) {
    const p = permissions.find((x) => x.role === role && x.module === module);
    if (p) return p;
    const defaults: Record<string, { view: boolean; edit: boolean }> = {
      hr: { view: true, edit: true },
      manager: {
        view: true,
        edit: [
          "Performans",
          "KPI & Hedefler",
          "İzin & Devam",
          "Eğitim & Oryantasyon",
        ].includes(module),
      },
      employee: {
        view: [
          "Personel",
          "Performans",
          "KPI & Hedefler",
          "İzin & Devam",
          "Eğitim & Oryantasyon",
        ].includes(module),
        edit: false,
      },
      payroll: {
        view: [
          "Personel",
          "Bordro Detayları",
          "Ücret / Maliyet / Bütçe",
          "Yasal Haklar",
          "Raporlar",
        ].includes(module),
        edit: [
          "Bordro Detayları",
          "Ücret / Maliyet / Bütçe",
          "Yasal Haklar",
        ].includes(module),
      },
    };
    return {
      role,
      module,
      ...(defaults[role] || { view: false, edit: false }),
      canView: (defaults[role] || { view: false }).view,
      canEdit: (defaults[role] || { edit: false }).edit,
    };
  }
  async function save(module: string, canView: boolean, canEdit: boolean) {
    const r = await fetch("/api/permissions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ role, module, canView, canEdit }),
      }),
      j = await r.json();
    if (r.ok) {
      setPermissions((x) => [
        ...x.filter((p) => !(p.role === role && p.module === module)),
        j.permission,
      ]);
      setMessage("Yetki kaydedildi.");
    } else setMessage(j.error || "Yetki kaydedilemedi.");
  }
  return (
    <>
      <button
        className="global-admin-launcher"
        onClick={() => setOpen(true)}
        style={launcher}
      >
        ⚿ Güvenlik Merkezi
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
                <small style={eyebrow}>MEGA HRMS GÜVENLİK</small>
                <h2 style={title}>Yetkiler ve İşlem Geçmişi</h2>
                <p style={sub}>
                  Rol bazlı modül erişimleri ve denetlenebilir değişiklik
                  kayıtları
                </p>
              </div>
              <button style={close} onClick={() => setOpen(false)}>
                ×
              </button>
            </header>
            <nav style={tabs}>
              <button
                style={tab === `permissions` ? activeTab : tabStyle}
                onClick={() => setTab("permissions")}
              >
                Modül Yetkileri
              </button>
              <button
                style={tab === `audit` ? activeTab : tabStyle}
                onClick={() => setTab("audit")}
              >
                Audit Log ({logs.length})
              </button>
            </nav>
            {message && <p style={notice}>{message}</p>}
            {tab === "permissions" ? (
              <div style={body}>
                <label style={roleBar}>
                  Yetkileri düzenlenen rol
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    style={select}
                  >
                    <option value="hr">İnsan Kaynakları</option>
                    <option value="manager">Yönetici</option>
                    <option value="employee">Çalışan</option>
                    <option value="payroll">Bordro Yetkilisi</option>
                  </select>
                </label>
                <div style={matrix}>
                  <div style={matrixHead}>
                    <span>MODÜL</span>
                    <span>GÖRÜNTÜLE</span>
                    <span>DÜZENLE</span>
                  </div>
                  {modules.map((m) => {
                    const p = current(m);
                    return (
                      <div style={matrixRow} key={m}>
                        <strong>{m}</strong>
                        <label>
                          <input
                            type="checkbox"
                            checked={p.canView}
                            onChange={(e) =>
                              save(
                                m,
                                e.target.checked,
                                e.target.checked ? p.canEdit : false,
                              )
                            }
                          />
                          <i style={toggle(p.canView)} />
                        </label>
                        <label>
                          <input
                            type="checkbox"
                            checked={p.canEdit}
                            disabled={!p.canView}
                            onChange={(e) =>
                              save(m, p.canView, e.target.checked)
                            }
                          />
                          <i style={toggle(p.canEdit)} />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={auditBody}>
                {logs.length === 0 ? (
                  <p style={empty}>Henüz kayıtlı bir işlem bulunmuyor.</p>
                ) : (
                  logs.map((l) => (
                    <article style={logRow} key={l.id}>
                      <span style={action(l.action)}>{l.action}</span>
                      <div style={logMain}>
                        <strong>
                          {labelEntity(l.entityType)} · #{l.entityId || "—"}
                        </strong>
                        <small>{l.userEmail}</small>
                      </div>
                      <time style={time}>
                        {new Date(l.createdAt).toLocaleString("tr-TR")}
                      </time>
                      <details style={details}>
                        <summary>Değişikliği incele</summary>
                        <pre>{formatChange(l)}</pre>
                      </details>
                    </article>
                  ))
                )}
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
function labelEntity(v: string) {
  return (
    (
      {
        employee: "Personel",
        module_record: "Modül Kaydı",
        company_membership: "Kullanıcı Rolü",
        module_permission: "Modül Yetkisi",
        company: "Şirket",
      } as Record<string, string>
    )[v] || v
  );
}
function formatChange(l: Log) {
  try {
    return JSON.stringify(
      {
        önce: l.oldValue ? JSON.parse(l.oldValue) : null,
        sonra: l.newValue ? JSON.parse(l.newValue) : null,
      },
      null,
      2,
    );
  } catch {
    return "Değişiklik ayrıntısı görüntülenemedi.";
  }
}
function action(v: string) {
  return {
    ...pill,
    background:
      v === "DELETE" ? "#fff0f2" : v === "CREATE" ? "#e9faf3" : "#eef5ff",
    color: v === "DELETE" ? "#c2475a" : v === "CREATE" ? "#218865" : "#3974bf",
  };
}
function toggle(on: boolean) {
  return {
    display: "block",
    width: 32,
    height: 18,
    borderRadius: 20,
    background: on ? "#17b5b8" : "#dce3eb",
    position: "relative" as const,
    boxShadow: on ? "inset 14px 0 0 transparent" : "none",
  };
}
const launcher = {
  position: "fixed" as const,
  right: 22,
  bottom: 22,
  zIndex: 40,
  border: 0,
  borderRadius: 10,
  background: "#0b2145",
  color: "white",
  height: 38,
  padding: "0 14px",
  fontSize: 8,
  boxShadow: "0 10px 25px #07172f42",
};
const backdrop = {
  position: "fixed" as const,
  inset: 0,
  zIndex: 120,
  background: "#061228b0",
  display: "grid",
  placeItems: "center",
  padding: 15,
};
const modal = {
  width: "min(850px,97vw)",
  height: "min(720px,94vh)",
  overflow: "auto",
  background: "#f6f8fb",
  borderRadius: 16,
};
const header = {
  display: "flex",
  justifyContent: "space-between",
  padding: "20px 22px",
  background: "white",
  borderBottom: "1px solid #e5eaf2",
};
const eyebrow = {
  fontSize: 8,
  color: "#12a3a8",
  letterSpacing: 1.4,
  fontWeight: 800,
};
const title = { fontSize: 21, margin: "4px 0 2px" };
const sub = { fontSize: 9, color: "#8290a4", margin: 0 };
const close = {
  border: 0,
  width: 31,
  height: 31,
  borderRadius: 8,
  fontSize: 18,
};
const tabs = {
  display: "flex",
  gap: 6,
  padding: "10px 18px",
  background: "white",
  borderBottom: "1px solid #e5eaf2",
};
const tabStyle = {
  border: 0,
  background: "transparent",
  padding: "8px 12px",
  fontSize: 9,
  color: "#758299",
};
const activeTab = {
  ...tabStyle,
  background: "#e9f9f9",
  color: "#159ba0",
  borderRadius: 7,
  fontWeight: 800,
};
const notice = {
  margin: "10px 18px 0",
  padding: 8,
  background: "#eaf8fb",
  borderRadius: 7,
  fontSize: 8,
  color: "#34757c",
};
const body = { padding: 16 };
const roleBar = {
  background: "white",
  border: "1px solid #e5eaf2",
  borderRadius: 9,
  padding: "10px 12px",
  fontSize: 8,
  color: "#68768b",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
};
const select = {
  height: 31,
  border: "1px solid #dfe5ed",
  borderRadius: 7,
  padding: "0 8px",
  fontSize: 8,
};
const matrix = {
  background: "white",
  border: "1px solid #e5eaf2",
  borderRadius: 10,
  overflow: "hidden",
};
const matrixHead = {
  display: "grid",
  gridTemplateColumns: "1fr 100px 100px",
  padding: "10px 14px",
  background: "#f3f6f9",
  fontSize: 7,
  color: "#7f8da0",
};
const matrixRow = {
  display: "grid",
  gridTemplateColumns: "1fr 100px 100px",
  alignItems: "center",
  padding: "9px 14px",
  borderTop: "1px solid #edf1f5",
  fontSize: 9,
};
const auditBody = { padding: 16 };
const empty = {
  textAlign: "center" as const,
  padding: 40,
  fontSize: 9,
  color: "#8190a4",
};
const logRow = {
  display: "grid",
  gridTemplateColumns: "70px 1fr 150px",
  alignItems: "center",
  gap: 10,
  background: "white",
  border: "1px solid #e5eaf2",
  borderRadius: 9,
  padding: 10,
  marginBottom: 7,
};
const pill = {
  fontSize: 7,
  fontWeight: 800,
  borderRadius: 20,
  padding: "5px 7px",
  textAlign: "center" as const,
};
const logMain = { display: "flex", flexDirection: "column" as const };
const time = { fontSize: 7, color: "#8090a4", textAlign: "right" as const };
const details = { gridColumn: "2/4", fontSize: 7, color: "#697a91" };
