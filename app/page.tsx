"use client";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import OrganizationManager from "./organization-manager";
import AssetManager from "./asset-manager";
import ModuleWorkspace from "./module-workspace";
import PerformanceManager from "./performance-hub";
import Dashboard from "./dashboard";
import LeaveManager from "./leave-manager";
import PayrollOperations from "./payroll-operations";
import AdvanceManager from "./advance-manager";
import EmployeeAdvancePanel from "./employee-advance-panel";
import EmployeePerformancePanel from "./employee-performance-panel";
import CostManagement from "./cost-management";
import PayrollReport from "./payroll-report";
import EmployeeBenefitsAssets from "./employee-benefits-assets";
import NumberSeriesManager from "./number-series-manager";
import ExcelPersonnelImport from "./excel-personnel-import";
import BulkPersonnelDelete from "./bulk-personnel-delete";
import OtherActionsMenu from "./quick-actions";
import NotificationCenter from "./notification-center";
import "./notification-center.css";
import { formatTrMoney } from "./tr-money";
const modules = [
  ["Organizasyon", "Şema, departman ve pozisyon yönetimi", "ORG", "Canlı yapı"],
  ["Personel", "Sicil kartları ve özlük bilgileri", "PER", "Gerçek siciller"],
  [
    "Görev Tanımları",
    "Rol, sorumluluk ve yetkinlikler",
    "GÖR",
    "Canlı kayıtlar",
  ],
  ["İş Analizleri", "Süreç, çıktı ve iş yükü analizi", "İŞA", "Canlı kayıtlar"],
  ["Performans", "Dönemsel değerlendirme süreçleri", "PRF", "Canlı kayıtlar"],
  ["KPI & Hedefler", "Kişi ve departman hedefleri", "KPI", "Canlı kayıtlar"],
];
const nav = [
  "Genel Bakış",
  "Organizasyon",
  "Departman",
  "Personel",
  "Performans",
  "KPI & Hedefler",
  "İş Analizleri",
  "Görev Tanımları",
  "İş Talimatları",
  "Belge / Evrak Takibi",
  "Yasal Haklar",
  "Bordro Detayları",
  "Ücret / Maliyet / Bütçe",
  "Mesai Takibi",
  "BES Takibi",
  "Borç & Avans",
  "Sistem Parametreleri",
];
export default function Home() {
  const router = useRouter();
  const [active, setActive] = useState("Genel Bakış"),
    [query, setQuery] = useState(""),
    [notice, setNotice] = useState(""),
    [employeeModal, setEmployeeModal] = useState(false),
    [globalImportOpen, setGlobalImportOpen] = useState(false),
    [mobileNavOpen, setMobileNavOpen] = useState(false),
    [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking"),
    [sessionUser, setSessionUser] = useState({
      fullName: "Oturum Kullanıcısı",
      platformRole: "user",
    });
  useEffect(() => {
    fetch("/api/session")
      .then((r) => {
        if (r.status === 401) {
          setAuthStatus("unauthenticated");
          router.replace("/login");
          return null;
        }
        return r.json();
      })
      .then((j) => {
        if (!j) return;
        if (j.user) setSessionUser(j.user);
        setAuthStatus("authenticated");
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, [router]);
  useEffect(() => {
    document.body.dataset.activeModule = active;
    return () => {
      delete document.body.dataset.activeModule;
    };
  }, [active]);
  const filtered = useMemo(
    () =>
      modules.filter((m) =>
        m[0].toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
      ),
    [query],
  );
  function choose(s: string) {
    setActive(s);
    setNotice(`${s} modülü seçildi`);
    setTimeout(() => setNotice(""), 1800);
  }
  function newEmployee() {
    setActive("Personel");
    setEmployeeModal(true);
  }
  if (authStatus !== "authenticated") {
    return (
      <div className="app-shell" style={{ alignItems: "center", justifyContent: "center", display: "flex" }}>
        {authStatus === "checking" ? <span>Oturum kontrol ediliyor…</span> : null}
      </div>
    );
  }
  return (
    <div className={mobileNavOpen ? "app-shell mobile-nav-open" : "app-shell"}>
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">M</span>
          <div>
            <strong>MEGA</strong>
            <small>HRMS PROFESSIONAL</small>
          </div>
        </div>
        <nav>
          <p className="nav-label">YÖNETİM</p>
          {nav.map((x, i) => (
            <button
              key={x}
              className={active === x ? "nav-item active" : "nav-item"}
              onClick={() => choose(x)}
            >
              <span>{["⌂", "◇", "◎", "↗", "✓", "≡", "▤", "□"][i]}</span>
              {x}
            </button>
          ))}
          <p className="nav-label spaced">OPERASYON</p>
          {[
            "İzin & Devam",
            "Eğitim & Oryantasyon",
            "Zimmet Yönetimi",
            "Raporlar",
          ].map((x) => (
            <button key={x} className="nav-item" onClick={() => choose(x)}>
              <span>·</span>
              {x}
            </button>
          ))}
        </nav>
        <div className="sidebar-card">
          <small>YASAL HAKLAR</small>
          <strong>Kıdem & İhbar</strong>
          <p>Kişi ve departman bazlı güncel yükümlülük analizi</p>
          <button onClick={() => choose("Yasal Haklar")}>İncele →</button>
        </div>
        <div className="user">
          <span>
            {sessionUser.fullName
              .split(/\s+/)
              .map((x) => x[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </span>
          <div>
            <strong>{sessionUser.fullName}</strong>
            <small>
              {sessionUser.platformRole === "super_admin"
                ? "Sistem Yöneticisi"
                : "Kullanıcı"}
            </small>
          </div>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <button
              className="mobile-nav-toggle"
              aria-label="Menüyü aç veya kapat"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
            >
              ☰
            </button>
            <p>23 Ağustos 2026, Pazar</p>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              ⌕
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Modül veya çalışan ara..."
              />
            </label>
            <NotificationCenter go={choose} />
            {!["Personel", "Genel Bakış"].includes(active) && (
              <OtherActionsMenu className="topbar-more" />
            )}
          </div>
        </header>
        {active === "Genel Bakış" ? (
          <Dashboard
            go={choose}
            newEmployee={newEmployee}
            importEmployees={() => setGlobalImportOpen(true)}
            notify={setNotice}
          />
        ) : (
          <Workspace
            active={active}
            query={query}
            act={setNotice}
            openEmployee={() => setEmployeeModal(true)}
          />
        )}
        <footer>
          <span>
            MEGA HRMS · İnsan kaynaklarının tüm süreçleri tek merkezde
          </span>
          <span>Canlı şirket verileri</span>
        </footer>
      </main>
      {employeeModal && (
        <EmployeeForm
          close={() => setEmployeeModal(false)}
          done={(m) => {
            setEmployeeModal(false);
            setNotice(m);
          }}
        />
      )}
      {globalImportOpen && (
        <ExcelPersonnelImport
          close={() => setGlobalImportOpen(false)}
          done={async (m) => {
            setGlobalImportOpen(false);
            setNotice(m);
          }}
        />
      )}
      {notice && <div className="toast">✓ {notice}</div>}
    </div>
  );
}
function Title({
  h,
  p,
  action,
  badge,
}: {
  h: string;
  p: string;
  action?: string;
  badge?: string;
}) {
  return (
    <div className="section-title">
      <div>
        <h3>{h}</h3>
        <p>{p}</p>
      </div>
      {action && (
        <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          {action}
        </button>
      )}
      {badge && <span>{badge}</span>}
    </div>
  );
}

const content: Record<
  string,
  { desc: string; stats: string[][]; columns: string[]; rows: string[][] }
> = {
  Personel: {
    desc: "Çalışan sicil kartları, özlük bilgileri ve çalışma durumları",
    stats: [],
    columns: ["Çalışan", "Unvan", "Departman", "Durum"],
    rows: [],
  },
  Performans: {
    desc: "Dönemsel değerlendirmeler, yetkinlikler ve sonuç takibi",
    stats: [],
    columns: ["Çalışan", "Değerlendirme", "Yönetici Puanı", "Durum"],
    rows: [],
  },
  "KPI & Hedefler": {
    desc: "Şirket, departman ve kişi bazlı ölçülebilir hedefler",
    stats: [
      ["Aktif KPI", "96"],
      ["Ortalama İlerleme", "%72"],
      ["Riskli Hedef", "11"],
      ["Tamamlanan", "24"],
    ],
    columns: ["KPI / Hedef", "Sorumlu", "İlerleme", "Durum"],
    rows: [
      ["İşe alım süresini 30 güne düşür", "İnsan Kaynakları", "%78", "İyi"],
      ["Yeni müşteri gelirini artır", "Satış", "%65", "Takip"],
      ["Bütçe sapmasını azalt", "Mali İşler", "%84", "İyi"],
      ["Proje teslim süresi", "Proje", "%52", "Riskli"],
    ],
  },
  "Görev Tanımları": {
    desc: "Pozisyon sorumlulukları, yetkinlikler ve onay süreçleri",
    stats: [
      ["Toplam Pozisyon", "86"],
      ["Onaylanan", "72"],
      ["Taslak", "9"],
      ["Güncellenecek", "5"],
    ],
    columns: ["Pozisyon", "Departman", "Revizyon", "Durum"],
    rows: [
      ["İnsan Kaynakları Müdürü", "İnsan Kaynakları", "12.08.2026", "Onaylı"],
      ["Satış Müdürü", "Satış", "08.08.2026", "Onaylı"],
      ["Satın Alma Uzmanı", "Satın Alma", "21.07.2026", "Güncellenecek"],
      ["Proje Mühendisi", "Proje", "16.08.2026", "Taslak"],
    ],
  },
  "İş Analizleri": {
    desc: "İşin amacı, süreçleri, çıktıları, yetkinlikleri ve iş yükü",
    stats: [
      ["Toplam Analiz", "0"],
      ["Tamamlanan", "0"],
      ["İncelemede", "0"],
      ["Taslak", "0"],
    ],
    columns: ["Analiz", "Departman", "Sorumlu", "Durum"],
    rows: [],
  },
  "İş Talimatları": {
    desc: "Standart operasyon adımları, sorumlular ve revizyonlar",
    stats: [
      ["Toplam Talimat", "54"],
      ["Yayında", "46"],
      ["Onay Bekleyen", "6"],
      ["Revizyon", "2"],
    ],
    columns: ["Talimat", "Birim", "Son Revizyon", "Durum"],
    rows: [
      ["Sabit kıymet girişi", "Mali İşler", "18.08.2026", "Yayında"],
      ["Yeni çalışan işe giriş", "İnsan Kaynakları", "10.08.2026", "Yayında"],
      ["Teklif onay süreci", "Satış", "02.08.2026", "Onay Bekliyor"],
      ["Zimmet iade süreci", "İdari İşler", "24.07.2026", "Revizyon"],
    ],
  },
  "Yasal Haklar": {
    desc: "Kıdem ve ihbar yükümlülüklerinin kişi ve departman bazlı analizi",
    stats: [
      ["Toplam Kıdem Yükü", "₺18,4 Mn"],
      ["İhbar Yükü", "₺3,2 Mn"],
      ["Hak Kazanan", "196"],
      ["Bu Ay Değişim", "+%2,1"],
    ],
    columns: ["Departman", "Çalışan", "Kıdem Yükü", "İhbar Yükü"],
    rows: [
      ["Satış", "42", "₺3,8 Mn", "₺680 Bin"],
      ["Üretim", "76", "₺5,9 Mn", "₺1,1 Mn"],
      ["Mali İşler", "24", "₺2,4 Mn", "₺410 Bin"],
      ["İnsan Kaynakları", "12", "₺1,1 Mn", "₺190 Bin"],
    ],
  },
};
function Workspace({
  active,
  query,
  act,
  openEmployee,
}: {
  active: string;
  query: string;
  act: (s: string) => void;
  openEmployee: () => void;
}) {
  if (active === "Organizasyon" || active === "Departman")
    return (
      <OrganizationManager
        act={act}
        initialView={active === "Departman" ? "departments" : "chart"}
      />
    );
  if (active === "Personel")
    return <Personnel query={query} act={act} open={openEmployee} />;
  if (active === "İzin & Devam") return <LeaveManager act={act} />;
  if (active === "Borç & Avans") return <AdvanceManager act={act} />;
  if (active === "Ücret / Maliyet / Bütçe") return <CostManagement act={act} />;
  if (active === "Bordro Detayları") return <PayrollReport act={act} />;
  if (active === "Mesai Takibi" || active === "BES Takibi")
    return <PayrollOperations module={active} act={act} />;
  if (active === "Zimmet Yönetimi") return <AssetManager act={act} />;
  if (active === "Sistem Parametreleri") return <NumberSeriesManager act={act} />;
  if (active === "Performans") return <PerformanceManager act={act} />;
  if (active === "KPI & Hedefler")
    return <PerformanceWorkspace active={active} query={query} act={act} />;
  return <ModuleWorkspace active={active} query={query} act={act} />;
}
type ModuleRecord = {
  id: number;
  module: string;
  title: string;
  owner: string;
  department: string;
  dueDate: string;
  status: string;
  progress: number;
  description: string;
  period?: string;
  evaluator?: string;
  metric?: string;
  targetValue?: number;
  actualValue?: number;
  weight?: number;
  score?: number;
};
function PerformanceWorkspace({
  active,
  query,
  act,
}: {
  active: string;
  query: string;
  act: (s: string) => void;
}) {
  const [records, setRecords] = useState<ModuleRecord[]>([]),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState<ModuleRecord | null>(null);
  async function load() {
    const r = await fetch(`/api/records?module=${encodeURIComponent(active)}`),
      j = await r.json();
    setRecords(j.records || []);
  }
  useEffect(() => {
    load();
  }, [active]);
  const visible = records.filter((r) =>
    Object.values(r)
      .join(" ")
      .toLocaleLowerCase("tr")
      .includes(query.toLocaleLowerCase("tr")),
  );
  const avg = records.length
    ? Math.round(
        records.reduce((a, r) => a + (r.score || 0), 0) / records.length,
      )
    : 0;
  async function remove(r: ModuleRecord) {
    if (!confirm(`“${r.title}” kaydı silinsin mi?`)) return;
    await fetch(`/api/records?id=${r.id}`, { method: "DELETE" });
    await load();
    act("Kayıt silindi");
  }
  return (
    <div className="workspace">
      <div className="workspace-head">
        <div>
          <span>MEGA HRMS / {active.toUpperCase()}</span>
          <h2>{active}</h2>
          <p>
            {active === "Performans"
              ? "Çalışan değerlendirme dönemleri, yetkinlik ve sonuç yönetimi"
              : "Şirket, departman ve kişi bazlı ölçülebilir hedef yönetimi"}
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          ＋ {active === "Performans" ? "Değerlendirme" : "KPI / Hedef"} Ekle
        </button>
      </div>
      <section className="module-stats">
        <article>
          <small>Aktif Kayıt</small>
          <strong>{records.length}</strong>
        </article>
        <article>
          <small>Ortalama Başarı</small>
          <strong>%{avg}</strong>
        </article>
        <article>
          <small>Tamamlanan</small>
          <strong>
            {records.filter((r) => r.status === "Tamamlandı").length}
          </strong>
        </article>
        <article>
          <small>Riskli / Bekleyen</small>
          <strong>
            {
              records.filter((r) => ["Riskli", "Bekliyor"].includes(r.status))
                .length
            }
          </strong>
        </article>
      </section>
      <section className="panel data-panel">
        <div className="table-tools">
          <div>
            <strong>{active} Kayıtları</strong>
            <small>{visible.length} sonuç</small>
          </div>
          <div>
            <button onClick={() => act("Dönem filtresi açıldı")}>
              ≡ Dönem / Durum
            </button>
          </div>
        </div>
        <div className="data-table">
          <div className="tr th">
            <span>
              {active === "Performans"
                ? "Çalışan / Değerlendirme"
                : "KPI / Hedef"}
            </span>
            <span>
              {active === "Performans" ? "Değerlendirici" : "Sorumlu"}
            </span>
            <span>Başarı</span>
            <span>Durum</span>
            <span>İşlem</span>
          </div>
          {visible.map((r) => (
            <div className="tr" key={r.id}>
              <span>
                <i className="person-dot">{r.title.slice(0, 2)}</i>
                {r.title}
              </span>
              <span>{r.evaluator || r.owner || "—"}</span>
              <span>
                <b className={(r.score || 0) < 60 ? "score low" : "score"}>
                  %{r.score || 0}
                </b>
              </span>
              <span>{r.status}</span>
              <span className="record-actions">
                <button
                  onClick={() => {
                    setEditing(r);
                    setModal(true);
                  }}
                >
                  Düzenle
                </button>
                <button onClick={() => remove(r)}>Sil</button>
              </span>
            </div>
          ))}
        </div>
      </section>
      {modal && (
        <PerformanceForm
          module={active}
          current={editing}
          close={() => setModal(false)}
          done={async (m) => {
            setModal(false);
            await load();
            act(m);
          }}
        />
      )}
    </div>
  );
}
function PerformanceForm({
  module,
  current,
  close,
  done,
}: {
  module: string;
  current: ModuleRecord | null;
  close: () => void;
  done: (m: string) => void;
}) {
  const [saving, setSaving] = useState(false),
    [target, setTarget] = useState(current?.targetValue || 100),
    [actual, setActual] = useState(current?.actualValue || 0),
    [error, setError] = useState("");
  const score =
    target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : 0;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const p = {
      ...Object.fromEntries(new FormData(e.currentTarget).entries()),
      module,
      id: current?.id,
      targetValue: target,
      actualValue: actual,
      score,
      progress: score,
    };
    try {
      const r = await fetch("/api/records", {
          method: current ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(p),
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      done(
        current ? "Değerlendirme güncellendi" : "Yeni değerlendirme kaydedildi",
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kayıt yapılamadı");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="record-modal performance-form" onSubmit={submit}>
        <header>
          <div>
            <span>{module.toUpperCase()}</span>
            <h2>
              {current
                ? "Kaydı Düzenle"
                : module === "Performans"
                  ? "Yeni Değerlendirme"
                  : "Yeni KPI / Hedef"}
            </h2>
            <p>
              Hedef ve gerçekleşen değer üzerinden başarı otomatik hesaplanır.
            </p>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <div className="score-preview">
          <span>Hesaplanan Başarı</span>
          <strong>%{score}</strong>
          <div>
            <i style={{ width: `${score}%` }} />
          </div>
        </div>
        <div className="form-grid">
          <Field
            label={
              module === "Performans"
                ? "Çalışan / Değerlendirme Adı *"
                : "KPI / Hedef Adı *"
            }
            name="title"
            required
            defaultValue={current?.title}
          />
          <Field
            label="Sorumlu Çalışan"
            name="owner"
            defaultValue={current?.owner}
          />
          <Field
            label="Değerlendirici / Yönetici"
            name="evaluator"
            defaultValue={current?.evaluator}
          />
          <Select
            label="Dönem"
            name="period"
            value={current?.period}
            options={["2026 / 1. Dönem", "2026 / 2. Dönem", "2026 Yıllık"]}
          />
          <Field
            label="Ölçüm Birimi"
            name="metric"
            defaultValue={current?.metric || "%"}
          />
          <Field
            label="Ağırlık (%)"
            name="weight"
            type="number"
            defaultValue={String(current?.weight || 0)}
          />
          <label className="field">
            <span>Hedef Değer</span>
            <input
              type="number"
              value={target}
              onChange={(e) => setTarget(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Gerçekleşen Değer</span>
            <input
              type="number"
              value={actual}
              onChange={(e) => setActual(Number(e.target.value))}
            />
          </label>
          <Select
            label="Durum"
            name="status"
            value={current?.status}
            options={["Aktif", "Bekliyor", "Tamamlandı", "Riskli", "Onaylandı"]}
          />
          <label className="field wide">
            <span>Açıklama / Yönetici Notu</span>
            <textarea name="description" defaultValue={current?.description} />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <footer>
          <button type="button" onClick={close}>
            İptal
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet ve Hesapla"}
          </button>
        </footer>
      </form>
    </div>
  );
}
function GenericWorkspace({
  active,
  query,
  act,
}: {
  active: string;
  query: string;
  act: (s: string) => void;
}) {
  const d = content[active] || {
    desc: `${active} süreçlerinin merkezi yönetimi`,
    stats: [
      ["Aktif Kayıt", "0"],
      ["Bekleyen", "0"],
      ["Tamamlanan", "0"],
      ["Uyarı", "0"],
    ],
    columns: ["Kayıt", "Birim", "Tarih", "Durum"],
    rows: [],
  };
  const [records, setRecords] = useState<ModuleRecord[]>([]),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState<ModuleRecord | null>(null),
    [loading, setLoading] = useState(true);
  async function load() {
    setLoading(true);
    try {
      const r = await fetch(
          `/api/records?module=${encodeURIComponent(active)}`,
        ),
        j = await r.json();
      setRecords(j.records || []);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, [active]);
  const dynamic = records.map((r) => [
    r.title,
    r.owner || r.department,
    r.progress ? `%${r.progress}` : r.dueDate || "—",
    r.status,
  ]);
  const rows = dynamic.filter((r) =>
    r.join(" ").toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr")),
  );
  function exportCsv() {
    const csv = [d.columns, ...rows]
      .map((r) =>
        r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob(["\ufeff" + csv], { type: "text/csv" }),
    );
    a.download = `mega-hrms-${active}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    act("Rapor indirildi");
  }
  async function remove(r: ModuleRecord) {
    if (!confirm(`“${r.title}” kaydı silinsin mi?`)) return;
    await fetch(`/api/records?id=${r.id}`, { method: "DELETE" });
    await load();
    act("Kayıt silindi");
  }
  return (
    <div className="workspace">
      <div className="workspace-head">
        <div>
          <span>MEGA HRMS / {active}</span>
          <h2>{active}</h2>
          <p>{d.desc}</p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          ＋ Yeni Kayıt
        </button>
      </div>
      <section className="module-stats">
        {d.stats.map((s, i) => (
          <article key={s[0]}>
            <small>{s[0]}</small>
            <strong>
              {i === 0 && records.length
                ? String(Number.parseInt(s[1]) || 0 + records.length)
                : s[1]}
            </strong>
          </article>
        ))}
      </section>
      <section className="panel data-panel">
        <div className="table-tools">
          <div>
            <strong>Kayıtlar</strong>
            <small>
              {loading ? "Yükleniyor…" : `${rows.length} sonuç gösteriliyor`}
            </small>
          </div>
          <div>
            <button
              onClick={() => act("Arama alanına yazarak filtreleyebilirsiniz")}
            >
              ≡ Filtrele
            </button>
            <button onClick={exportCsv}>⇩ Dışa Aktar</button>
          </div>
        </div>
        <div className="data-table">
          <div className="tr th">
            {d.columns.map((x) => (
              <span key={x}>{x}</span>
            ))}
            <span>İşlem</span>
          </div>
          {records
            .filter((r) =>
              [r.title, r.owner, r.department, r.status]
                .join(" ")
                .toLocaleLowerCase("tr")
                .includes(query.toLocaleLowerCase("tr")),
            )
            .map((r) => (
              <div className="tr" key={r.id}>
                <span>
                  <i className="person-dot">
                    {r.title.slice(0, 2).toUpperCase()}
                  </i>
                  {r.title}
                </span>
                <span>{r.owner || r.department || "—"}</span>
                <span>{r.progress ? `%${r.progress}` : r.dueDate || "—"}</span>
                <span>{r.status}</span>
                <span className="record-actions">
                  <button
                    onClick={() => {
                      setEditing(r);
                      setModal(true);
                    }}
                  >
                    Düzenle
                  </button>
                  <button onClick={() => remove(r)}>Sil</button>
                </span>
              </div>
            ))}
        </div>
      </section>
      {modal && (
        <RecordForm
          module={active}
          current={editing}
          close={() => setModal(false)}
          done={async (m) => {
            setModal(false);
            await load();
            act(m);
          }}
        />
      )}
    </div>
  );
}
function RecordForm({
  module,
  current,
  close,
  done,
}: {
  module: string;
  current: ModuleRecord | null;
  close: () => void;
  done: (m: string) => void;
}) {
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const r = await fetch("/api/records", {
          method: current ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...data, module, id: current?.id }),
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      done(current ? "Kayıt güncellendi" : "Yeni kayıt oluşturuldu");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İşlem tamamlanamadı");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="modal-backdrop">
      <form className="record-modal" onSubmit={submit}>
        <header>
          <div>
            <span>{module.toUpperCase()}</span>
            <h2>{current ? "Kaydı Düzenle" : "Yeni Kayıt"}</h2>
            <p>{module} sürecine ait kayıt bilgileri</p>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <div className="form-grid">
          <Field
            label="Kayıt / Hedef Adı *"
            name="title"
            required
            defaultValue={current?.title}
          />
          <Field label="Sorumlu" name="owner" defaultValue={current?.owner} />
          <Select
            label="Departman"
            name="department"
            value={current?.department}
            options={[
              "İnsan Kaynakları",
              "Satış",
              "Mali İşler",
              "Satın Alma",
              "Proje",
              "Üretim & Operasyon",
            ]}
          />
          <Field
            label="Hedef / Bitiş Tarihi"
            name="dueDate"
            type="date"
            defaultValue={current?.dueDate}
          />
          <Select
            label="Durum"
            name="status"
            value={current?.status}
            options={[
              "Aktif",
              "Taslak",
              "Bekliyor",
              "Tamamlandı",
              "Riskli",
              "Onaylandı",
            ]}
          />
          <Field
            label="İlerleme (%)"
            name="progress"
            type="number"
            defaultValue={String(current?.progress || 0)}
          />
          <label className="field wide">
            <span>Açıklama</span>
            <textarea name="description" defaultValue={current?.description} />
          </label>
        </div>
        {error && <div className="form-error">{error}</div>}
        <footer>
          <button type="button" onClick={close}>
            İptal
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        </footer>
      </form>
    </div>
  );
}
function DataTable({
  d,
  rows,
  act,
}: {
  d: { columns: string[] };
  rows: string[][];
  act: (s: string) => void;
}) {
  function exportCsv() {
    const csv = [d.columns, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["\ufeff" + csv]));
    a.download = "mega-hrms-personel.csv";
    a.click();
    act("Personel raporu indirildi");
  }
  return (
    <section className="panel data-panel">
      <div className="table-tools">
        <div>
          <strong>Kayıtlar</strong>
          <small>{rows.length} sonuç gösteriliyor</small>
        </div>
        <div>
          <button
            onClick={() => act("Arama alanına yazarak filtreleyebilirsiniz")}
          >
            ≡ Filtrele
          </button>
          <button onClick={exportCsv}>⇩ Dışa Aktar</button>
        </div>
      </div>
      <div className="data-table">
        <div className="tr th">
          {d.columns.map((x) => (
            <span key={x}>{x}</span>
          ))}
          <span>İşlem</span>
        </div>
        {rows.map((r, i) => (
          <button
            className="tr"
            key={i}
            onClick={() => act(`${r[0]} ayrıntıları açıldı`)}
          >
            {r.map((x, j) => (
              <span key={j}>
                {j === 0 ? (
                  <>
                    <i className="person-dot">
                      {x
                        .split(" ")
                        .map((v) => v[0])
                        .slice(0, 2)
                        .join("")}
                    </i>
                    {x}
                  </>
                ) : (
                  x
                )}
              </span>
            ))}
            <span className="row-action">Görüntüle</span>
          </button>
        ))}
      </div>
    </section>
  );
}
type Employee = {
  id: number;
  departmentId?: number | null;
  positionId?: number | null;
  firstName: string;
  lastName: string;
  employeeNo: string;
  nationalId: string;
  department: string;
  position: string;
  status: string;
  startDate: string;
  employeeType: string;
  payrollType?: string;
  email?: string;
  phone?: string;
  manager?: string;
  workType?: string;
  sgkNo?: string;
  occupationCode?: string;
  iban?: string;
  salary?: number;
  netSalary?: number;
  salaryBasis?: string;
  salaryPeriod?: string;
  weeklyHours?: number;
  workPermitNo?: string;
  workPermitStart?: string;
  workPermitEnd?: string;
};
function employeeHasMissingInfo(employee: Employee) {
  return (
    !employee.firstName ||
    !employee.lastName ||
    !employee.employeeNo ||
    employee.employeeNo.startsWith("AUTO-") ||
    !employee.nationalId ||
    employee.nationalId.startsWith("IMPORT-") ||
    !employee.departmentId ||
    !employee.positionId ||
    !employee.startDate ||
    !employee.manager
  );
}
function Personnel({
  query,
  act,
  open,
}: {
  query: string;
  act: (s: string) => void;
  open: () => void;
}) {
  const [records, setRecords] = useState<Employee[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState<Employee | null>(null),
    [importOpen, setImportOpen] = useState(false),
    [incompleteOnly, setIncompleteOnly] = useState(false),
    [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  function openCompanyAdmin() {
    window.dispatchEvent(new Event("open-company-admin"));
  }
  function openSecurityCenter() {
    window.dispatchEvent(new Event("open-security-center"));
  }
  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/employees"),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setRecords(j.employees || []);
      setError("");
    } catch {
      setError(
        "Personel verileri yüklenemedi. Lütfen bağlantıyı kontrol edin.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    const h = () => load();
    window.addEventListener("employees-updated", h);
    return () => window.removeEventListener("employees-updated", h);
  }, []);
  const visible = records.filter(
    (e) =>
      (!incompleteOnly || employeeHasMissingInfo(e)) &&
      Object.values(e)
        .join(" ")
        .toLocaleLowerCase("tr")
        .includes(query.toLocaleLowerCase("tr")),
  );
  return (
    <div className="workspace">
      <div className="workspace-head">
        <div>
          <span>MEGA HRMS / PERSONEL</span>
          <h2>Personel Yönetimi</h2>
          <p>
            Çalışan sicillerini, özlük bilgilerini ve çalışma durumlarını
            yönetin.
          </p>
        </div>
        <div
          className="personnel-actions desktop-actions"
          aria-label="Hızlı İşlemler"
        >
          <button
            className="primary"
            onClick={open}
            title="Yeni personel sicil kartı oluştur"
          >
            <span aria-hidden="true">＋</span> Yeni Personel
          </button>
          <button
            onClick={() => setImportOpen(true)}
            title="Excel dosyasından personel aktar"
          >
            <span aria-hidden="true">⇧</span> Excel’den Aktar
          </button>
          <details className="personnel-more">
            <summary title="Diğer personel işlemlerini aç">
              <span aria-hidden="true">⋯</span> Diğer İşlemler <i>⌄</i>
            </summary>
            <div className="personnel-menu" role="menu">
              <button
                className="danger-menu-item"
                role="menuitem"
                onClick={() => setBulkDeleteOpen(true)}
              >
                <span>⌫</span>
                <b>Toplu Personel Sil</b>
              </button>
              <button role="menuitem" onClick={openCompanyAdmin}>
                <span>▦</span>
                <b>Şirket Yönetimi</b>
              </button>
              <button role="menuitem" onClick={openSecurityCenter}>
                <span>⚿</span>
                <b>Güvenlik Merkezi</b>
              </button>
            </div>
          </details>
        </div>
        <details className="mobile-personnel-actions">
          <summary>
            <span>＋</span> İşlemler <i>⌄</i>
          </summary>
          <div>
            <button onClick={open}>
              <span>＋</span> Yeni Personel
            </button>
            <button onClick={() => setImportOpen(true)}>
              <span>⇧</span> Excel’den Aktar
            </button>
            <button
              className="danger-menu-item"
              onClick={() => setBulkDeleteOpen(true)}
            >
              <span>⌫</span> Toplu Personel Sil
            </button>
            <button onClick={openCompanyAdmin}>
              <span>▦</span> Şirket Yönetimi
            </button>
            <button onClick={openSecurityCenter}>
              <span>⚿</span> Güvenlik Merkezi
            </button>
          </div>
        </details>
      </div>
      <section className="module-stats">
        <article>
          <small>Toplam Personel</small>
          <strong>{records.length}</strong>
        </article>
        <article>
          <small>Aktif Personel</small>
          <strong>{records.filter((e) => e.status === "Aktif").length}</strong>
        </article>
        <article>
          <small>İzinli</small>
          <strong>{records.filter((e) => e.status === "İzinli").length}</strong>
        </article>
        <article>
          <small>İşten Ayrılan</small>
          <strong>
            {
              records.filter((e) =>
                ["İşten Ayrıldı", "Pasif"].includes(e.status),
              ).length
            }
          </strong>
        </article>
      </section>
      {error && <div className="data-note">ⓘ {error}</div>}
      {loading ? (
        <div className="panel loading">Personel kayıtları yükleniyor…</div>
      ) : (
        <section className="panel data-panel">
          <div className="table-tools">
            <div>
              <strong>Personel Kayıtları</strong>
              <small>{visible.length} sonuç gösteriliyor</small>
            </div>
            <div>
              <button
                className={incompleteOnly ? "active" : ""}
                onClick={() => setIncompleteOnly((value) => !value)}
              >
                ⚠ Eksik Bilgili Personeller
              </button>
              <button onClick={() => act("Personel raporu hazırlandı")}>
                ⇩ Dışa Aktar
              </button>
            </div>
          </div>
          <div className="data-table">
            <div className="tr th">
              <span>Çalışan</span>
              <span>Unvan</span>
              <span>Departman</span>
              <span>Durum</span>
              <span>İşlem</span>
            </div>
            {visible.map((e) => (
              <button className="tr" key={e.id} onClick={() => setSelected(e)}>
                <span>
                  <i className="person-dot">
                    {e.firstName[0]}
                    {e.lastName[0]}
                  </i>
                  {e.firstName} {e.lastName}
                </span>
                <span>
                  {e.position || <i className="missing-badge">Eksik</i>}
                </span>
                <span>
                  {e.department || <i className="missing-badge">Eksik</i>}
                </span>
                <span>
                  {e.status}
                  {employeeHasMissingInfo(e) && (
                    <i className="missing-badge">Eksik Bilgi</i>
                  )}
                </span>
                <span className="row-action">Sicil Kartı</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {importOpen && (
        <ExcelPersonnelImport
          close={() => setImportOpen(false)}
          done={async (m) => {
            await load();
            act(m);
          }}
        />
      )}
      {bulkDeleteOpen && (
        <BulkPersonnelDelete
          records={records}
          close={() => setBulkDeleteOpen(false)}
          done={async (m) => {
            setBulkDeleteOpen(false);
            await load();
            act(m);
          }}
        />
      )}
      {selected && (
        <EmployeeDetail
          employee={selected}
          close={() => setSelected(null)}
          done={async (m) => {
            await load();
            act(m);
          }}
        />
      )}
    </div>
  );
}
function EmployeeForm({
  close,
  done,
}: {
  close: () => void;
  done: (m: string) => void;
}) {
  const [saving, setSaving] = useState(false),
    [error, setError] = useState("");
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const payload = Object.fromEntries(form.entries());
    try {
      const r = await fetch("/api/employees", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      window.dispatchEvent(new Event("employees-updated"));
      done(`${payload.firstName} ${payload.lastName} sicil kartı kaydedildi`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kayıt oluşturulamadı");
    } finally {
      setSaving(false);
    }
  }
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <form className="employee-modal" onSubmit={submit}>
        <header>
          <div>
            <span>PERSONEL SİCİL KARTI</span>
            <h2>Yeni Çalışan</h2>
            <p>Zorunlu alanları doldurarak çalışan kaydını oluşturun.</p>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <div className="form-tabs">
          <b>Kişisel Bilgiler</b>
          <span>Şirket & Görev</span>
          <span>Özlük & Finansal</span>
        </div>
        <div className="form-section">
          <h3>Kişisel Bilgiler</h3>
          <div className="form-grid">
            <Field label="Ad *" name="firstName" required />
            <Field label="Soyad *" name="lastName" required />
            <Field
              label="T.C. Kimlik No *"
              name="nationalId"
              required
              maxLength={11}
            />
            <Field label="Doğum Tarihi" name="birthDate" type="date" />
            <Field label="Doğum Yeri" name="birthPlace" />
            <Select
              label="Cinsiyet"
              name="gender"
              options={["Kadın", "Erkek", "Belirtmek İstemiyor"]}
            />
            <Select
              label="Kan Grubu"
              name="bloodType"
              options={["A Rh+", "A Rh-", "B Rh+", "B Rh-", "AB Rh+", "0 Rh+"]}
            />
            <Field label="Telefon" name="phone" type="tel" />
            <Field label="E-posta" name="email" type="email" />
          </div>
        </div>
        <div className="form-section">
          <h3>Şirket & Görev</h3>
          <div className="form-grid">
            <Field label="Sicil No" name="employeeNo" placeholder="Otomatik oluşturulacak" readOnly />
            <Select
              label="Departman *"
              name="department"
              required
              options={[
                "İnsan Kaynakları",
                "Satış",
                "Mali İşler",
                "Satın Alma",
                "Proje",
                "Üretim & Operasyon",
              ]}
            />
            <Select label="Pozisyon *" name="position" required options={[]} />
            <Field label="Yönetici / Amir" name="manager" />
            <Field label="İkinci Yönetici" name="secondManager" />
            <Field label="Vekaleten Yönetici" name="actingManager" />
            <Field
              label="İşe Başlama *"
              name="startDate"
              type="date"
              required
            />
            <Select
              label="Çalışma Şekli"
              name="workType"
              options={["Tam Zamanlı", "Yarı Zamanlı", "Hibrit", "Uzaktan"]}
            />
            <Select
              label="Personel Türü"
              name="employeeType"
              options={["Normal", "Emekli", "Yabancı", "Stajyer"]}
            />
            <Select
              label="Bordro / Ödeme Türü"
              name="payrollType"
              options={["Normal Personel", "Emekli Personel", "Huzur Hakkı"]}
            />
            <Select
              label="Durum"
              name="status"
              options={["Aktif", "İzinli", "Pasif"]}
            />
          </div>
        </div>
        <div className="form-section">
          <h3>Özlük & Finansal</h3>
          <div className="form-grid">
            <Field label="SGK Sicil No" name="sgkNo" />
            <Field label="SGK Meslek Kodu" name="occupationCode" />
            <Select
              label="Ücret Esası"
              name="salaryBasis"
              value="Brüt"
              options={["Brüt", "Net"]}
            />
            <MoneyField label="Aylık Net Ücret" name="netSalary" />
            <MoneyField label="Aylık Brüt Ücret" name="salary" />
            <Select
              label="Ücret Dönemi"
              name="salaryPeriod"
              value="Aylık"
              options={["Aylık", "Günlük", "Saatlik"]}
            />
            <Field
              label="Haftalık Çalışma Saati"
              name="weeklyHours"
              type="number"
            />
            <Field label="IBAN" name="iban" />
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <footer>
          <button type="button" onClick={close}>
            İptal
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Kaydet ve Sicil Kartını Oluştur"}
          </button>
        </footer>
      </form>
    </div>
  );
}
function EmployeeDetail({
  employee: initialEmployee,
  close,
  done,
}: {
  employee: Employee;
  close: () => void;
  done: (m: string) => void;
}) {
  const [employee, setEmployee] = useState(initialEmployee),
    [saving, setSaving] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [dirty, setDirty] = useState(false),
    [closePrompt, setClosePrompt] = useState(false),
    [formVersion, setFormVersion] = useState(0);
  const formRef = useRef<HTMLFormElement>(null),
    closeAfterSave = useRef(false);
  function requestClose() {
    if (dirty) setClosePrompt(true);
    else close();
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    const p = {
      ...employee,
      ...Object.fromEntries(new FormData(e.currentTarget).entries()),
    };
    try {
      const r = await fetch("/api/employees", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(p),
        }),
        j = await r.json();
      if (!r.ok) throw new Error(j.error);
      const verifyResponse = await fetch(`/api/employees?id=${employee.id}`, {
          cache: "no-store",
        }),
        verified = await verifyResponse.json();
      if (!verifyResponse.ok || !verified.employee)
        throw new Error("Güncel sicil kaydı doğrulanamadı");
      setEmployee(verified.employee);
      setDirty(false);
      setFormVersion((value) => value + 1);
      setSuccess("Personel sicil kartı başarıyla güncellendi.");
      window.dispatchEvent(new Event("employees-updated"));
      done("Personel sicil kartı başarıyla güncellendi.");
      if (closeAfterSave.current) close();
    } catch (e) {
      closeAfterSave.current = false;
      setError("Değişiklikler kaydedilemedi. Lütfen tekrar deneyin.");
    } finally {
      setSaving(false);
    }
  }
  async function remove() {
    if (
      !confirm(`${employee.firstName} ${employee.lastName} kaydı silinsin mi?`)
    )
      return;
    const r = await fetch(`/api/employees?id=${employee.id}`, {
      method: "DELETE",
    });
    if (r.ok) {
      window.dispatchEvent(new Event("employees-updated"));
      close();
      done("Personel kaydı silindi");
    } else setError("Kayıt silinemedi");
  }
  return (
    <div className="modal-backdrop">
      <form
        key={formVersion}
        ref={formRef}
        className="employee-modal detail-modal"
        onSubmit={save}
        onChange={() => {
          setDirty(true);
          setSuccess("");
        }}
      >
        <header>
          <div>
            <span>PERSONEL SİCİL KARTI · {employee.employeeNo}</span>
            <h2>
              {employee.firstName} {employee.lastName}
            </h2>
            <p>
              {employee.position || "Pozisyon Eksik"} ·{" "}
              {employee.department || "Departman Eksik"}
            </p>
          </div>
          <button type="button" onClick={requestClose}>
            ×
          </button>
        </header>
        <div className="profile-band">
          <i>
            {employee.firstName[0]}
            {employee.lastName?.[0] || ""}
          </i>
          <div>
            <strong>
              {employee.firstName} {employee.lastName}
            </strong>
            <small>
              {employee.employeeType} personel · {employee.status}
            </small>
          </div>
          <span>İşe giriş: {employee.startDate || "Eksik"}</span>
        </div>
        <div className="form-section">
          <h3>Temel Sicil Bilgileri</h3>
          <div className="form-grid">
            <Field
              label={`Ad${employee.firstName ? "" : " · Eksik"}`}
              name="firstName"
              defaultValue={employee.firstName}
            />
            <Field
              label={`Soyad${employee.lastName ? "" : " · Eksik"}`}
              name="lastName"
              defaultValue={employee.lastName}
            />
            <Field
              label={`Sicil No${employee.employeeNo.startsWith("AUTO-") ? " · Eksik" : ""}`}
              name="employeeNo"
              defaultValue={
                employee.employeeNo.startsWith("AUTO-")
                  ? ""
                  : employee.employeeNo
              }
              readOnly
            />
            <Field
              label={`T.C. Kimlik No${employee.nationalId.startsWith("IMPORT-") ? " · Eksik" : ""}`}
              name="nationalId"
              defaultValue={
                employee.nationalId.startsWith("IMPORT-")
                  ? ""
                  : employee.nationalId
              }
            />
            <Field
              label={`İşe Giriş Tarihi${employee.startDate ? "" : " · Eksik"}`}
              name="startDate"
              type="date"
              defaultValue={employee.startDate}
            />
          </div>
        </div>
        <div className="form-section">
          <h3>Şirket ve Görev Bilgileri</h3>
          <div className="form-grid">
            <Select
              label={`Pozisyon${employee.position ? "" : " · Eksik"}`}
              name="position"
              value={employee.position}
              options={employee.position ? [employee.position] : []}
            />
            <Select
              label={`Departman${employee.department ? "" : " · Eksik"}`}
              name="department"
              value={employee.department}
              options={[
                "İnsan Kaynakları",
                "Satış",
                "Mali İşler",
                "Satın Alma",
                "Proje",
                "Üretim & Operasyon",
              ]}
            />
            <Field
              label={`Yönetici / Amir${employee.manager ? "" : " · Eksik"}`}
              name="manager"
              defaultValue={employee.manager}
            />
            <Field label="İkinci Yönetici" name="secondManager" defaultValue={employee.secondManager} />
            <Field label="Vekaleten Yönetici" name="actingManager" defaultValue={employee.actingManager} />
            <Field label="Vekalet Başlangıcı" name="delegationStart" type="date" defaultValue={employee.delegationStart} />
            <Field label="Vekalet Bitişi" name="delegationEnd" type="date" defaultValue={employee.delegationEnd} />
            <Select
              label="Çalışma Şekli"
              name="workType"
              value={employee.workType}
              options={["Tam Zamanlı", "Yarı Zamanlı", "Hibrit", "Uzaktan"]}
            />
            <Select
              label="Personel Türü"
              name="employeeType"
              value={employee.employeeType}
              options={["Normal", "Emekli", "Yabancı", "Stajyer"]}
            />
            <Select
              label="Bordro / Ödeme Türü"
              name="payrollType"
              value={
                employee.payrollType ||
                (employee.employeeType === "Emekli"
                  ? "Emekli Personel"
                  : "Normal Personel")
              }
              options={["Normal Personel", "Emekli Personel", "Huzur Hakkı"]}
            />
            <Select
              label="Durum"
              name="status"
              value={employee.status}
              options={["Aktif", "İzinli", "Pasif"]}
            />
          </div>
        </div>
        <div className="form-section">
          <h3>01 · Ücret Bilgileri ve Özlük Bilgileri</h3>
          <div className="form-grid">
            <Field
              label="E-posta"
              name="email"
              type="email"
              defaultValue={employee.email}
            />
            <Field label="Telefon" name="phone" defaultValue={employee.phone} />
            <Field
              label="SGK Sicil No"
              name="sgkNo"
              defaultValue={employee.sgkNo}
            />
            <Field
              label="Meslek Kodu"
              name="occupationCode"
              defaultValue={employee.occupationCode}
            />
            <Select
              label="Ücret Esası"
              name="salaryBasis"
              value={employee.salaryBasis || "Brüt"}
              options={["Brüt", "Net"]}
            />
            <MoneyField
              label="Aylık Net Ücret"
              name="netSalary"
              value={employee.netSalary}
            />
            <MoneyField
              label="Aylık Brüt Ücret"
              name="salary"
              value={employee.salary}
            />
            <Select
              label="Ücret Dönemi"
              name="salaryPeriod"
              value={employee.salaryPeriod || "Aylık"}
              options={["Aylık", "Günlük", "Saatlik"]}
            />
            <Field
              label="Haftalık Çalışma Saati"
              name="weeklyHours"
              type="number"
              defaultValue={String(employee.weeklyHours || "")}
            />
            <Field label="IBAN" name="iban" defaultValue={employee.iban} />
          </div>
        </div>
        <EmployeeBenefitsAssets employeeId={employee.id} />
        <EmployeeAdvancePanel
          employeeId={employee.id}
          employeeStatus={employee.status}
        />
        <EmployeePerformancePanel employeeId={employee.id} />
        {employee.employeeType === "Yabancı" && (
          <div className="form-section permit">
            <h3>Çalışma İzni Takibi</h3>
            <div className="form-grid">
              <Field
                label="Çalışma İzni No"
                name="workPermitNo"
                defaultValue={employee.workPermitNo}
              />
              <Field
                label="İzin Başlangıcı"
                name="workPermitStart"
                type="date"
                defaultValue={employee.workPermitStart}
              />
              <Field
                label="İzin Bitişi"
                name="workPermitEnd"
                type="date"
                defaultValue={employee.workPermitEnd}
              />
            </div>
          </div>
        )}
        {success && <div className="form-success">{success}</div>}
        {error && <div className="form-error">{error}</div>}
        <footer>
          <button type="button" className="danger-button" onClick={remove}>
            Kaydı Sil
          </button>
          <button type="button" onClick={requestClose}>
            Kapat
          </button>
          <button className="primary" disabled={saving}>
            {saving ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
          </button>
        </footer>
      </form>
      {closePrompt && (
        <div className="modal-backdrop unsaved-changes-dialog">
          <div className="record-modal">
            <header>
              <div>
                <span>KAYDEDİLMEMİŞ DEĞİŞİKLİK</span>
                <h2>Çıkmak istiyor musunuz?</h2>
                <p>Kaydedilmemiş değişiklikleriniz var.</p>
              </div>
            </header>
            <footer>
              <button type="button" onClick={() => setClosePrompt(false)}>
                İptal
              </button>
              <button type="button" onClick={close}>
                Kaydetmeden Çık
              </button>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  closeAfterSave.current = true;
                  setClosePrompt(false);
                  formRef.current?.requestSubmit();
                }}
              >
                Kaydet ve Çık
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
function MoneyField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value?: number;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        name={name}
        inputMode="decimal"
        defaultValue={formatTrMoney(value)}
        placeholder="35.000,00"
        onBlur={(event) => {
          event.currentTarget.value = formatTrMoney(event.currentTarget.value);
        }}
      />
    </label>
  );
}
function Field({
  label,
  ...props
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  maxLength?: number;
  defaultValue?: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input {...props} />
    </label>
  );
}
function Select({
  label,
  name,
  options,
  required,
  value,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  value?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select name={name} required={required} defaultValue={value || ""}>
        <option value="">Seçiniz</option>
        {options.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
    </label>
  );
}
function Org({ act }: { act: (s: string) => void }) {
  const [modal, setModal] = useState(false),
    [full, setFull] = useState(false),
    [view, setView] = useState<"chart" | "list">("chart"),
    [records, setRecords] = useState<ModuleRecord[]>([]),
    [editing, setEditing] = useState<ModuleRecord | null>(null);
  async function load() {
    const r = await fetch("/api/records?module=Organizasyon"),
      j = await r.json();
    setRecords(j.records || []);
  }
  useEffect(() => {
    load();
  }, []);
  async function remove(r: ModuleRecord) {
    if (!confirm(`“${r.title}” pozisyonu silinsin mi?`)) return;
    await fetch(`/api/records?id=${r.id}`, { method: "DELETE" });
    await load();
    act("Pozisyon silindi");
  }
  const base = [
    ["SA", "Satış & Pazarlama", "42 çalışan"],
    ["ÜR", "Üretim & Operasyon", "76 çalışan"],
    ["MA", "Mali İşler", "24 çalışan"],
    ["İK", "İK & İdari İşler", "18 çalışan"],
    ["PR", "Proje", "31 çalışan"],
  ];
  return (
    <div className={full ? "workspace org-full" : "workspace"}>
      <div className="workspace-head">
        <div>
          <span>MEGA HRMS / ORGANİZASYON</span>
          <h2>Organizasyon Yönetimi</h2>
          <p>
            Şirket, departman, pozisyon ve raporlama ilişkilerinin canlı
            görünümü
          </p>
        </div>
        <button
          className="primary"
          onClick={() => {
            setEditing(null);
            setModal(true);
          }}
        >
          ＋ Pozisyon Ekle
        </button>
      </div>
      <section className="org-summary">
        <span>
          {12 + new Set(records.map((r) => r.department).filter(Boolean)).size}{" "}
          Departman
        </span>
        <span>{86 + records.length} Pozisyon</span>
        <span>Canlı Personel Verisi</span>
        <button onClick={() => setView(view === "chart" ? "list" : "chart")}>
          ☷ {view === "chart" ? "Liste Görünümü" : "Şema Görünümü"}
        </button>
        <button
          onClick={() => {
            setFull(!full);
            act(full ? "Normal görünüme dönüldü" : "Şema genişletildi");
          }}
        >
          ⛶ {full ? "Normal Görünüm" : "Tam Ekran"}
        </button>
      </section>
      {view === "chart" ? (
        <section className="panel org-canvas">
          <div className="org-node top">
            <i>YK</i>
            <strong>Yönetim Kurulu</strong>
            <small>Stratejik Yönetim</small>
          </div>
          <div className="connector" />
          <div className="org-node gm">
            <i>GM</i>
            <strong>Genel Müdür</strong>
            <small>Üst Yönetim</small>
          </div>
          <div className="org-branches">
            {base.map((x) => (
              <button
                className="org-node"
                key={x[0]}
                onClick={() => act(`${x[1]} departmanı seçildi`)}
              >
                <i>{x[0]}</i>
                <strong>{x[1]}</strong>
                <small>{x[2]}</small>
              </button>
            ))}
          </div>
          {records.length > 0 && (
            <div className="saved-positions">
              {records.map((r) => (
                <button
                  className="org-node saved"
                  key={r.id}
                  onClick={() => {
                    setEditing(r);
                    setModal(true);
                  }}
                >
                  <i>{r.title.slice(0, 2).toUpperCase()}</i>
                  <strong>{r.title}</strong>
                  <small>{r.department || r.owner || "Yeni pozisyon"}</small>
                </button>
              ))}
            </div>
          )}
        </section>
      ) : (
        <section className="panel data-panel">
          <div className="table-tools">
            <div>
              <strong>Departman ve Pozisyonlar</strong>
              <small>{records.length} özel kayıt</small>
            </div>
          </div>
          <div className="data-table">
            <div className="tr th">
              <span>Pozisyon</span>
              <span>Departman</span>
              <span>Üst Yönetici</span>
              <span>Durum</span>
              <span>İşlem</span>
            </div>
            {records.map((r) => (
              <div className="tr" key={r.id}>
                <span>
                  <i className="person-dot">{r.title.slice(0, 2)}</i>
                  {r.title}
                </span>
                <span>{r.department || "—"}</span>
                <span>{r.owner || "—"}</span>
                <span>{r.status}</span>
                <span className="record-actions">
                  <button
                    onClick={() => {
                      setEditing(r);
                      setModal(true);
                    }}
                  >
                    Düzenle
                  </button>
                  <button onClick={() => remove(r)}>Sil</button>
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
      {modal && (
        <RecordForm
          module="Organizasyon"
          current={editing}
          close={() => setModal(false)}
          done={async (m) => {
            setModal(false);
            await load();
            act(m);
          }}
        />
      )}
    </div>
  );
}
