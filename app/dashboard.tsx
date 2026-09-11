"use client";
import { useEffect, useMemo, useState } from "react";
import OtherActionsMenu from "./quick-actions";
type Alert = {
  kind: string;
  title: string;
  detail: string;
  date: string;
  days: number;
  module: string;
  severity: string;
};
type D = {
  employees: {
    total: number;
    active: number;
    leave: number;
    foreign: number;
    partTime: number;
    terminated: number;
  };
  performance: {
    count: number;
    average: number;
    pending: number;
    high: number;
  };
  assets: { total: number; assigned: number; late: number };
  actions: { pending: number; permits: number; missingDocuments: number };
  payroll: { gross: number; net: number };
  departments: [string, number][];
  types: [string, number][];
  alerts: Alert[];
  alertSummary: {
    expired: number;
    seven: number;
    thirty: number;
    ninety: number;
  };
};
const money = (n: number) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
export default function Dashboard({
  go,
  newEmployee,
  notify,
  importEmployees,
}: {
  go: (s: string) => void;
  newEmployee: () => void;
  notify: (s: string) => void;
  importEmployees: () => void;
}) {
  const [data, setData] = useState<D | null>(null),
    [period, setPeriod] = useState("2026 · 2. Yarıyıl"),
    [loading, setLoading] = useState(true),
    [alertFilter, setAlertFilter] = useState("Tümü");
  async function load() {
    setLoading(true);
    const r = await fetch("/api/dashboard"),
      j = await r.json();
    if (r.ok) setData(j);
    setLoading(false);
  }
  useEffect(() => {
    load();
  }, []);
  const max = useMemo(
      () => Math.max(1, ...(data?.departments.map((x) => x[1]) || [1])),
      [data],
    ),
    shownAlerts = (data?.alerts || []).filter(
      (a) =>
        alertFilter === "Tümü" ||
        (alertFilter === "Süresi Geçen" && a.days < 0) ||
        (alertFilter === "7 Gün" && a.days >= 0 && a.days <= 7) ||
        (alertFilter === "30 Gün" && a.days > 7 && a.days <= 30) ||
        (alertFilter === "90 Gün" && a.days > 30),
    );
  if (loading)
    return (
      <div className="dashboard-loading">Dashboard verileri hazırlanıyor…</div>
    );
  if (!data)
    return (
      <div className="dashboard-loading">
        Dashboard verileri görüntülenemedi.
      </div>
    );
  const cards = [
    [
      "Toplam Personel",
      data.employees.total,
      "Kayıtlı sicil kartı",
      "Personel",
    ],
    ["Aktif Personel", data.employees.active, "Aktif çalışan", "Personel"],
    ["İzinli", data.employees.leave, "İzinli çalışan", "İzin & Devam"],
    [
      "İşten Ayrılan",
      data.employees.terminated,
      "Pasif sicil kaydı",
      "Personel",
    ],
  ];
  return (
    <div className="live-dashboard">
      <section className="dashboard-welcome">
        <div>
          <span>MEGA HRMS PROFESSIONAL</span>
          <h2>Ana Ekran</h2>
          <p>
            Personel, izin, çalışma izni, belge, zimmet ve ücret verileri tek
            ekranda.
          </p>
        </div>
        <div className="dashboard-header-actions">
          <div className="dashboard-quick-actions">
            <button className="primary" onClick={newEmployee}>
              ＋ Yeni Personel
            </button>
            <button onClick={importEmployees}>⇧ Excel’den Aktar</button>
            <OtherActionsMenu />
          </div>
          <div className="dashboard-period-tools">
            <select
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                notify(e.target.value + " dönemi seçildi");
              }}
            >
              <option>2026 · 1. Yarıyıl</option>
              <option>2026 · 2. Yarıyıl</option>
              <option>2026 Yıllık</option>
            </select>
            <button onClick={load}>↻ Verileri Yenile</button>
          </div>
        </div>
      </section>
      <section className="dashboard-cards">
        {cards.map((c) => (
          <button key={String(c[0])} onClick={() => go(String(c[3]))}>
            <small>{c[0]}</small>
            <strong>{c[1]}</strong>
            <span>{c[2]}</span>
            <i>Modülü aç →</i>
          </button>
        ))}
      </section>
      <section className="panel expiry-center">
        <header>
          <div>
            <h3>Süreli İş ve Belge Bildirim Merkezi</h3>
            <p>
              Çalışma izni, sözleşme, sertifika ve tüm geçerlilik
              tarihleri
            </p>
          </div>
          <div className="expiry-summary">
            <b className="expired">{data.alertSummary.expired} geçmiş</b>
            <b className="critical">{data.alertSummary.seven} · 7 gün</b>
            <b className="warning">{data.alertSummary.thirty} · 30 gün</b>
            <b>{data.alertSummary.ninety} · 90 gün</b>
          </div>
        </header>
        <div className="expiry-filters">
          {["Tümü", "Süresi Geçen", "7 Gün", "30 Gün", "90 Gün"].map((x) => (
            <button
              className={alertFilter === x ? "active" : ""}
              key={x}
              onClick={() => setAlertFilter(x)}
            >
              {x}
            </button>
          ))}
        </div>
        <div className="expiry-list">
          {shownAlerts.length === 0 ? (
            <p>Bu aralıkta takip edilmesi gereken süreli kayıt bulunmuyor.</p>
          ) : (
            shownAlerts.slice(0, 8).map((a, i) => (
              <button
                key={`${a.kind}-${a.title}-${i}`}
                onClick={() => go(a.module)}
              >
                <span className={a.severity}>{a.days < 0 ? "!" : a.days}</span>
                <div>
                  <strong>{a.title}</strong>
                  <small>
                    {a.kind} · {a.detail}
                  </small>
                </div>
                <time>
                  {a.days < 0
                    ? `${Math.abs(a.days)} gün geçti`
                    : a.days === 0
                      ? "Bugün"
                      : `${a.days} gün kaldı`}
                  <small>{a.date}</small>
                </time>
                <i>›</i>
              </button>
            ))
          )}
        </div>
      </section>
      <div className="dashboard-grid">
        <section className="panel department-chart">
          <header>
            <div>
              <h3>Departman Bazlı Çalışan Dağılımı</h3>
              <p>Aktif şirketin personel kayıtları</p>
            </div>
            <button onClick={() => go("Organizasyon")}>
              Organizasyonu Aç →
            </button>
          </header>
          {data.departments.length ? (
            data.departments.slice(0, 8).map(([name, count]) => (
              <div className="department-bar" key={name}>
                <span>{name}</span>
                <i>
                  <b style={{ width: (count / max) * 100 + "%" }} />
                </i>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <p className="chart-empty">
              Departman verisi için personel ekleyin.
            </p>
          )}
        </section>
        <section className="panel dashboard-actions">
          <header>
            <div>
              <h3>Onay Bekleyen İşlemler</h3>
              <p>İlgilenmeniz gereken güncel kayıtlar</p>
            </div>
            <b>
              {data.performance.pending +
                data.actions.permits +
                data.assets.late}
            </b>
          </header>
          <Action
            color="red"
            count={data.performance.pending}
            title="Performans değerlendirmeleri"
            text="Tamamlanmayı bekleyen değerlendirmeler"
            click={() => go("Performans")}
          />
          <Action
            color="orange"
            count={data.actions.permits}
            title="Çalışma izni uyarıları"
            text="90 gün içinde bitecek veya süresi geçen"
            click={() => go("Personel")}
          />
          <Action
            color="blue"
            count={data.actions.missingDocuments}
            title="Eksik personel belgeleri"
            text="Tamamlanması gereken evrak kayıtları"
            click={() => go("Belge / Evrak Takibi")}
          />
          <Action
            color="purple"
            count={data.assets.late}
            title="Geciken zimmet iadeleri"
            text="Planlanan iade tarihi geçen demirbaşlar"
            click={() => go("Zimmet Yönetimi")}
          />
        </section>
      </div>
      <div className="dashboard-grid lower">
        <section className="panel payroll-summary">
          <header>
            <div>
              <h3>Ücret ve Maliyet Özeti</h3>
              <p>Kayıtlı personelin aylık ücret toplamları</p>
            </div>
            <button onClick={() => go("Ücret / Maliyet / Bütçe")}>
              Bütçe Modülü →
            </button>
          </header>
          <div>
            <article>
              <small>Toplam Brüt Ücret</small>
              <strong>{money(data.payroll.gross)}</strong>
            </article>
            <article>
              <small>Toplam Net Ücret</small>
              <strong>{money(data.payroll.net)}</strong>
            </article>
          </div>
        </section>
        <section className="panel workforce-mix">
          <header>
            <div>
              <h3>Çalışan Profili</h3>
              <p>Personel türlerine göre dağılım</p>
            </div>
            <button onClick={() => go("Personel")}>Sicil Kartları →</button>
          </header>
          <div>
            {data.types.map(([name, count], i) => (
              <button key={name} onClick={() => go("Personel")}>
                <i className={"mix-" + i} />
                <span>{name}</span>
                <strong>{count}</strong>
              </button>
            ))}
          </div>
        </section>
      </div>
      <section className="dashboard-info-grid">
        <article className="panel">
          <h3>Yaklaşan Doğum Günleri</h3>
          <p>Yaklaşan kayıtlar personel sicil kartlarından otomatik izlenir.</p>
          <button onClick={() => go("Personel")}>Personeli aç →</button>
        </article>
        <article className="panel">
          <h3>Duyurular</h3>
          <p>Yayınlanan şirket duyuruları bu alanda görüntülenir.</p>
          <button onClick={() => go("Duyurular")}>Duyuruları aç →</button>
        </article>
        <article className="panel">
          <h3>Son Hareketler</h3>
          <p>
            Güncel personel ve onay hareketlerini güvenli biçimde takip edin.
          </p>
          <button onClick={() => go("Personel")}>Kayıtları aç →</button>
        </article>
      </section>
    </div>
  );
}
function Action({
  color,
  count,
  title,
  text,
  click,
}: {
  color: string;
  count: number;
  title: string;
  text: string;
  click: () => void;
}) {
  return (
    <button className="dashboard-action" onClick={click}>
      <b className={color}>{count}</b>
      <span>
        <strong>{title}</strong>
        <small>{text}</small>
      </span>
      <i>›</i>
    </button>
  );
}
