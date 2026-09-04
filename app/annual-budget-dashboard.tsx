"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import "./annual-budget-dashboard.css";
type Cost = {
  id: number;
  departmentId?: number;
  employeeNo: string;
  name: string;
  department: string;
  position: string;
  net: number;
  gross: number;
  employeeSgk: number;
  employeeUnemployment: number;
  incomeTax: number;
  stampTax: number;
  employerSgk: number;
  employerUnemployment: number;
  sgkIncentive: number;
  meal: number;
  travel: number;
  health: number;
  bes: number;
  vehicle: number;
  phone: number;
  bonus: number;
  otherBenefits: number;
  benefits: number;
  employerCost: number;
};
type Group = {
  name: string;
  count: number;
  net: number;
  gross: number;
  incomeTax: number;
  stampTax: number;
  employerSgk: number;
  employerUnemployment: number;
  benefits: number;
  employerCost: number;
  average: number;
};
type Budget = {
  id: number;
  year: number;
  month?: number | null;
  departmentId?: number | null;
  position?: string | null;
  amount: number;
  note?: string | null;
};
type Scenario = {
  id: number;
  year: number;
  name: string;
  salaryIncreaseRate: number;
  increaseMonth: number;
  benefitIncreaseRate: number;
  scopeType: string;
  scopeValue?: string;
  includePlannedHeads: boolean;
};
type Planned = {
  id: number;
  year: number;
  departmentId?: number | null;
  position: string;
  plannedStartDate: string;
  plannedNetSalary: number;
  plannedMonthlyCost: number;
  headcount: number;
  status: string;
};
type Data = {
  range: { from: string; to: string };
  summary: { employeeCount: number; employerCost: number; averageCost: number };
  details: Cost[];
  departments: Group[];
  monthly: { label: string; cost: number }[];
  budgetRecords: Budget[];
  scenarios: Scenario[];
  plannedHeadcounts: Planned[];
  filters: { departments: string[]; positions: string[] };
};
const emptyBudgetData: Data = {
  range: { from: "", to: "" },
  summary: { employeeCount: 0, employerCost: 0, averageCost: 0 },
  details: [],
  departments: [],
  monthly: [],
  budgetRecords: [],
  scenarios: [],
  plannedHeadcounts: [],
  filters: { departments: [], positions: [] },
};
function normalizeBudgetData(value: unknown): Data {
  const v = value && typeof value === "object" ? (value as Partial<Data>) : {};
  return {
    range: v.range || emptyBudgetData.range,
    summary: { ...emptyBudgetData.summary, ...(v.summary || {}) },
    details: Array.isArray(v.details) ? v.details : [],
    departments: Array.isArray(v.departments) ? v.departments : [],
    monthly: Array.isArray(v.monthly) ? v.monthly : [],
    budgetRecords: Array.isArray(v.budgetRecords) ? v.budgetRecords : [],
    scenarios: Array.isArray(v.scenarios) ? v.scenarios : [],
    plannedHeadcounts: Array.isArray(v.plannedHeadcounts)
      ? v.plannedHeadcounts
      : [],
    filters: {
      departments: Array.isArray(v.filters?.departments)
        ? v.filters.departments
        : [],
      positions: Array.isArray(v.filters?.positions)
        ? v.filters.positions
        : [],
    },
  };
}
const money = (n = 0) =>
    new Intl.NumberFormat("tr-TR", {
      style: "currency",
      currency: "TRY",
      maximumFractionDigits: 0,
    }).format(n),
  pct = (n: number, d: number) => (d ? Math.round((n / d) * 1000) / 10 : 0),
  months = [
    "Ocak",
    "Şubat",
    "Mart",
    "Nisan",
    "Mayıs",
    "Haziran",
    "Temmuz",
    "Ağustos",
    "Eylül",
    "Ekim",
    "Kasım",
    "Aralık",
  ];
function mergeData(all: Data[]): Data {
  const base = all[0] || {
      range: { from: "", to: "" },
      summary: { employeeCount: 0, employerCost: 0, averageCost: 0 },
      details: [],
      departments: [],
      monthly: [],
      budgetRecords: [],
      scenarios: [],
      plannedHeadcounts: [],
      filters: { departments: [], positions: [] },
    },
    details = all.flatMap((x) => x.details || []),
    departmentMap = new Map<string, Group>();
  for (const d of all.flatMap((x) => x.departments || [])) {
    const old = departmentMap.get(d.name);
    departmentMap.set(
      d.name,
      old
        ? {
            ...d,
            count: old.count + d.count,
            net: old.net + d.net,
            gross: old.gross + d.gross,
            incomeTax: old.incomeTax + d.incomeTax,
            stampTax: old.stampTax + d.stampTax,
            employerSgk: old.employerSgk + d.employerSgk,
            employerUnemployment:
              old.employerUnemployment + d.employerUnemployment,
            benefits: old.benefits + d.benefits,
            employerCost: old.employerCost + d.employerCost,
            average:
              (old.employerCost + d.employerCost) / (old.count + d.count),
          }
        : d,
    );
  }
  const employerCost = all.reduce(
    (s, x) => s + (x.summary?.employerCost || 0),
    0,
  );
  return {
    ...base,
    summary: {
      employeeCount: details.length,
      employerCost,
      averageCost: details.length ? employerCost / details.length : 0,
    },
    details,
    departments: [...departmentMap.values()],
    monthly: months.map((_, i) => ({
      label: months[i],
      cost: all.reduce((s, x) => s + (x.monthly?.[i]?.cost || 0), 0),
    })),
    budgetRecords: all.flatMap((x) => x.budgetRecords || []),
    scenarios: all.flatMap((x) => x.scenarios || []),
    plannedHeadcounts: all.flatMap((x) => x.plannedHeadcounts || []),
    filters: {
      departments: [
        ...new Set(all.flatMap((x) => x.filters?.departments || [])),
      ],
      positions: [...new Set(all.flatMap((x) => x.filters?.positions || []))],
    },
  };
}
export default function AnnualBudgetDashboard({
  initialData,
  reload,
}: {
  initialData: Record<string, unknown>;
  reload: () => void;
}) {
  const yearNow = new Date().getFullYear(),
    [year, setYear] = useState(yearNow),
    [scope, setScope] = useState("active"),
    [companies, setCompanies] = useState<{ id: string; name: string }[]>([]),
    [tab, setTab] = useState("Bütçe"),
    [department, setDepartment] = useState(""),
    [month, setMonth] = useState(""),
    [person, setPerson] = useState(""),
    [position, setPosition] = useState(""),
    [data, setData] = useState<Data>(() => normalizeBudgetData(initialData)),
    [loading, setLoading] = useState(false),
    [selectedDept, setSelectedDept] = useState<string | null>(null),
    [selectedPerson, setSelectedPerson] = useState<Cost | null>(null),
    [form, setForm] = useState<"budget" | "scenario" | "head" | null>(null),
    [message, setMessage] = useState("");
  async function load() {
    setLoading(true);
    const selectedMonth = Number(month),
      from = selectedMonth
        ? `${year}-${String(selectedMonth).padStart(2, "0")}-01`
        : `${year}-01-01`,
      end = selectedMonth
        ? new Date(year, selectedMonth, 0).toISOString().slice(0, 10)
        : year === yearNow
          ? new Date().toISOString().slice(0, 10)
          : year < yearNow
            ? `${year}-12-31`
            : `${year}-01-01`,
      query = (company?: string) => {
        const q = new URLSearchParams({ from, to: end });
        if (company) q.set("company", company);
        if (department) q.set("department", department);
        if (position) q.set("position", position);
        if (person && scope !== "group") q.set("employeeId", person);
        return q;
      };
    try {
      if (scope === "group") {
        const list = companies.length
            ? companies
            : (await (await fetch("/api/companies")).json()).companies || [],
          results = await Promise.all(
            list.map(async (c: { id: string }) => {
              const r = await fetch(`/api/personnel-costs?${query(c.id)}`);
              return r.ok ? await r.json() : null;
            }),
          );
        setData(mergeData(results.filter(Boolean).map(normalizeBudgetData)));
      } else {
        const r = await fetch(
            `/api/personnel-costs?${query(scope === "active" ? undefined : scope)}`,
          ),
          j = await r.json();
        if (!r.ok) throw new Error(j.error);
        setData(normalizeBudgetData(j));
      }
      setMessage("");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Bütçe verileri alınamadı");
    }
    setLoading(false);
  }
  useEffect(() => {
    fetch("/api/companies")
      .then((r) => r.json())
      .then((j) => setCompanies(Array.isArray(j.companies) ? j.companies : []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [year, scope, department, month, position, person]);
  const yearBudgets = (data.budgetRecords || []).filter((x) => x.year === year),
    annualBudget = yearBudgets.reduce((s, x) => s + x.amount, 0),
    elapsed =
      year < yearNow ? 12 : year > yearNow ? 0 : new Date().getMonth() + 1,
    actual = data.summary.employerCost,
    runRate = elapsed ? actual / elapsed : data.summary.averageCost || 0,
    remaining = Math.max(0, 12 - elapsed),
    planned = (data.plannedHeadcounts || [])
      .filter((x) => x.year === year && x.status === "Planlandı")
      .reduce((s, x) => {
        const start = Math.max(
          0,
          12 - Number(String(x.plannedStartDate || "").slice(5, 7)) + 1,
        );
        return s + x.plannedMonthlyCost * x.headcount * start;
      }, 0),
    forecast = actual + runRate * remaining + planned,
    variance = forecast - annualBudget,
    varianceRate = pct(variance, annualBudget),
    filteredDetails = data.details.filter((x) => !month || true),
    departments = useMemo(
      () =>
        data.departments.map((d) => {
          const ids = data.details
              .filter((x) => x.department === d.name)
              .map((x) => x.departmentId)
              .filter(Boolean),
            explicit = yearBudgets
              .filter((b) => b.departmentId && ids.includes(b.departmentId))
              .reduce((s, b) => s + b.amount, 0),
            shared =
              yearBudgets
                .filter((b) => !b.departmentId)
                .reduce((s, b) => s + b.amount, 0) *
              (d.count / Math.max(data.summary.employeeCount, 1)),
            budget = explicit + shared,
            estimate =
              d.employerCost +
              (elapsed ? (d.employerCost / elapsed) * remaining : 0),
            diff = estimate - budget;
          return { ...d, budget, estimate, diff, rate: pct(diff, budget) };
        }),
      [data, yearBudgets, elapsed],
    ),
    selectedGroup = departments.find((d) => d.name === selectedDept),
    deptPeople = data.details.filter((x) => x.department === selectedDept),
    maxMonth = Math.max(
      1,
      ...data.monthly.map((x) => x.cost),
      annualBudget / 12,
    );
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const p = Object.fromEntries(new FormData(e.currentTarget).entries()),
      action =
        form === "budget"
          ? "budget"
          : form === "scenario"
            ? "budget_scenario"
            : "planned_headcount",
      r = await fetch("/api/personnel-costs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...p, year, action }),
      }),
      j = await r.json();
    if (!r.ok) {
      setMessage(j.error || "Kayıt tamamlanamadı");
      return;
    }
    setForm(null);
    setMessage("Kayıt bütçe planına eklendi.");
    await load();
    reload();
  }
  const status =
    variance > annualBudget * 0.03
      ? "warn"
      : variance < -annualBudget * 0.03
        ? "good"
        : "normal";
  return (
    <div className="annual-budget">
      <header className="budget-head">
        <div>
          <span>PERSONEL MALİYET BÜTÇESİ</span>
          <h2>
            {scope === "group" ? "Tüm Şirketler / Grup" : "Aktif Şirket"} ·{" "}
            {year}
          </h2>
          <p>Bütçe, gerçekleşen, tahmin ve sapma tek yönetim ekranında</p>
        </div>
        <div>
          <button onClick={() => setForm("budget")}>＋ Bütçe</button>
          <button onClick={() => setForm("head")}>＋ Planlanan Kadro</button>
          <button className="primary" onClick={() => setForm("scenario")}>
            ＋ Senaryo
          </button>
        </div>
      </header>
      <section className="budget-filters">
        <label>
          Şirket
          <select value={scope} onChange={(e) => setScope(e.target.value)}>
            <option value="active">Aktif Şirket</option>
            <option value="group">Tüm Şirketler / Grup</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Yıl
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {[yearNow - 1, yearNow, yearNow + 1, yearNow + 2].map((y) => (
              <option key={y}>{y}</option>
            ))}
          </select>
        </label>
        <label>
          Departman
          <select
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <option value="">Tümü</option>
            {data.filters.departments.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          Ay
          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">Tümü</option>
            {months.map((x, i) => (
              <option value={i + 1} key={x}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <label>
          Personel
          <select value={person} onChange={(e) => setPerson(e.target.value)}>
            <option value="">Tümü</option>
            {data.details.map((x) => (
              <option value={x.id} key={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Pozisyon
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
          >
            <option value="">Tümü</option>
            {data.filters.positions.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <nav className="budget-tabs">
        {["Bütçe", "Gerçekleşen", "Tahmini", "Sapma Analizi"].map((x) => (
          <button
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
            key={x}
          >
            {x}
          </button>
        ))}
      </nav>
      {message && <p className="budget-message">{message}</p>}
      {loading ? (
        <div className="panel loading">Yıllık bütçe hesaplanıyor…</div>
      ) : (
        <>
          <section className="budget-kpis">
            <Kpi n="Yıllık Personel Bütçesi" v={money(annualBudget)} />
            <Kpi n="Yıl İçinde Gerçekleşen" v={money(actual)} />
            <Kpi n="Yıl Sonu Tahmini" v={money(forecast)} />
            <Kpi
              n="Bütçe Sapması"
              v={`${variance >= 0 ? "+" : ""}${money(variance)}`}
              c={status}
            />
            <Kpi
              n="Sapma Oranı"
              v={`${varianceRate >= 0 ? "+" : ""}%${varianceRate}`}
              c={status}
            />
            <Kpi n="Toplam Çalışan" v={String(data.summary.employeeCount)} />
            <Kpi n="Kişi Başı Ortalama" v={money(data.summary.averageCost)} />
          </section>
          <section className="budget-layout">
            <article className="panel annual-chart">
              <header>
                <div>
                  <h3>Ocak–Aralık Maliyet Seyri</h3>
                  <p>Bütçe · Gerçekleşen · Tahmini</p>
                </div>
              </header>
              <div className="annual-bars">
                {months.map((m, i) => {
                  const actualMonth =
                      i < elapsed
                        ? data.monthly[i]?.cost || actual / Math.max(elapsed, 1)
                        : 0,
                    forecastMonth = i >= elapsed ? runRate : 0,
                    budgetMonth = annualBudget / 12;
                  return (
                    <button key={m} onClick={() => setMonth(String(i + 1))}>
                      <div>
                        <i
                          style={{
                            height: `${(budgetMonth / maxMonth) * 100}%`,
                          }}
                        />
                        <i
                          className="actual"
                          style={{
                            height: `${(actualMonth / maxMonth) * 100}%`,
                          }}
                        />
                        <i
                          className="forecast"
                          style={{
                            height: `${(forecastMonth / maxMonth) * 100}%`,
                          }}
                        />
                      </div>
                      <b>{m.slice(0, 3)}</b>
                      <small>{money(actualMonth || forecastMonth)}</small>
                    </button>
                  );
                })}
              </div>
            </article>
            <article className="panel variance-reasons">
              <h3>Sapma Analizi</h3>
              <strong className={status}>
                {varianceRate >= 0 ? "+" : ""}%{varianceRate}
              </strong>
              <p>
                {variance > 0
                  ? "Yıl sonu tahmini bütçenin üzerinde."
                  : "Yıl sonu tahmini bütçe sınırları içinde."}
              </p>
              <ul>
                {planned > 0 && (
                  <li>Planlanan yeni kadrolar: {money(planned)}</li>
                )}
                {(data.scenarios || [])
                  .filter((x) => x.year === year)
                  .map((x) => (
                    <li key={x.id}>
                      {x.name}: %{x.salaryIncreaseRate} ücret, %
                      {x.benefitIncreaseRate} yan hak artışı
                    </li>
                  ))}
                {data.summary.employeeCount > 0 && (
                  <li>Mevcut çalışan ve bordro maliyetleri</li>
                )}
              </ul>
            </article>
          </section>
          <section className="panel budget-departments">
            <header>
              <div>
                <h3>Departman Bazlı Yıllık Maliyet</h3>
                <p>Şirket → Departman → Personel</p>
              </div>
            </header>
            {departments.map((d) => (
              <button key={d.name} onClick={() => setSelectedDept(d.name)}>
                <span>
                  <b>{d.name}</b>
                  <small>{d.count} personel</small>
                </span>
                <span>
                  Bütçe <b>{money(d.budget)}</b>
                </span>
                <span>
                  Gerçekleşen <b>{money(d.employerCost)}</b>
                </span>
                <span>
                  Tahmini <b>{money(d.estimate)}</b>
                </span>
                <strong
                  className={
                    d.rate > 3 ? "warn" : d.rate < -3 ? "good" : "normal"
                  }
                >
                  {d.diff >= 0 ? "+" : ""}
                  {money(d.diff)} / {d.rate >= 0 ? "+" : ""}%{d.rate}
                </strong>
              </button>
            ))}
          </section>
          <section className="scenario-compare">
            <h3>Senaryo Karşılaştırması</h3>
            <div>
              <article>
                <b>Baz Senaryo</b>
                <strong>{money(forecast)}</strong>
                <small>Mevcut kayıtlar</small>
              </article>
              {(data.scenarios || [])
                .filter((x) => x.year === year)
                .map((x) => {
                  const monthsAffected = Math.max(0, 13 - x.increaseMonth),
                    value =
                      forecast +
                      (runRate * monthsAffected * x.salaryIncreaseRate) / 100 +
                      (data.summary.employerCost * x.benefitIncreaseRate) / 100;
                  return (
                    <article key={x.id}>
                      <b>{x.name}</b>
                      <strong>{money(value)}</strong>
                      <small>
                        {x.scopeType}
                        {x.scopeValue ? ` · ${x.scopeValue}` : ""}
                      </small>
                    </article>
                  );
                })}
            </div>
          </section>
        </>
      )}
      {selectedGroup && (
        <DepartmentBudgetDetail
          year={year}
          group={selectedGroup}
          people={deptPeople}
          elapsed={elapsed}
          close={() => setSelectedDept(null)}
          select={setSelectedPerson}
        />
      )}{" "}
      {selectedPerson && (
        <PersonAnnualDetail
          year={year}
          row={selectedPerson}
          close={() => setSelectedPerson(null)}
        />
      )}{" "}
      {form && (
        <BudgetForm
          type={form}
          year={year}
          departments={data.filters.departments}
          positions={data.filters.positions}
          submit={save}
          close={() => setForm(null)}
        />
      )}
    </div>
  );
}
function Kpi({ n, v, c = "" }: { n: string; v: string; c?: string }) {
  return (
    <article className={c}>
      <small>{n}</small>
      <strong>{v}</strong>
    </article>
  );
}
function DepartmentBudgetDetail({
  year,
  group,
  people,
  elapsed,
  close,
  select,
}: {
  year: number;
  group: Group & {
    budget: number;
    estimate: number;
    diff: number;
    rate: number;
  };
  people: Cost[];
  elapsed: number;
  close: () => void;
  select: (x: Cost) => void;
}) {
  return (
    <div className="modal-backdrop">
      <section className="annual-detail">
        <header>
          <div>
            <span>DEPARTMAN BÜTÇE DETAYI</span>
            <h2>
              {group.name.toLocaleUpperCase("tr-TR")} DEPARTMANI – {year}
            </h2>
          </div>
          <button onClick={close}>×</button>
        </header>
        <section className="budget-kpis">
          <Kpi n="Personel Sayısı" v={String(group.count)} />
          <Kpi n="Yıllık Bütçe" v={money(group.budget)} />
          <Kpi n="Gerçekleşen" v={money(group.employerCost)} />
          <Kpi n="Yıl Sonu Tahmini" v={money(group.estimate)} />
          <Kpi n="Bütçe Sapması" v={money(group.diff)} />
          <Kpi n="Sapma Oranı" v={`%${group.rate}`} />
          <Kpi n="Kişi Başı Ortalama" v={money(group.average)} />
        </section>
        <div className="annual-table">
          <div className="annual-row head">
            <span>Personel / Pozisyon</span>
            <span>Yıllık Bütçe</span>
            <span>Gerçekleşen</span>
            <span>Tahmini</span>
            <span>Sapma</span>
          </div>
          {people.map((p) => {
            const estimate =
                p.employerCost +
                (elapsed ? (p.employerCost / elapsed) * (12 - elapsed) : 0),
              budget = group.budget / Math.max(group.count, 1);
            return (
              <button
                className="annual-row"
                key={p.id}
                onClick={() => select(p)}
              >
                <span>
                  <b>{p.name}</b>
                  <small>{p.position}</small>
                </span>
                <span>{money(budget)}</span>
                <span>{money(p.employerCost)}</span>
                <span>{money(estimate)}</span>
                <strong>{money(estimate - budget)}</strong>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
function PersonAnnualDetail({
  year,
  row,
  close,
}: {
  year: number;
  row: Cost;
  close: () => void;
}) {
  const [monthsData, setMonthsData] = useState<Cost[]>([]);
  useEffect(() => {
    Promise.all(
      months.map(async (_, i) => {
        const start = `${year}-${String(i + 1).padStart(2, "0")}-01`,
          end = new Date(year, i + 1, 0).toISOString().slice(0, 10),
          r = await fetch(
            `/api/personnel-costs?from=${start}&to=${end}&employeeId=${row.id}`,
          ),
          j = await r.json();
        return (
          j.details?.[0] || {
            ...row,
            net: 0,
            gross: 0,
            employerSgk: 0,
            employerUnemployment: 0,
            incomeTax: 0,
            stampTax: 0,
            benefits: 0,
            employerCost: 0,
          }
        );
      }),
    ).then(setMonthsData);
  }, [year, row.id]);
  return (
    <div className="modal-backdrop top">
      <section className="annual-detail person">
        <header>
          <div>
            <span>PERSONEL YILLIK MALİYET ANALİZİ</span>
            <h2>{row.name.toLocaleUpperCase("tr-TR")}</h2>
            <p>
              {row.position} · {row.department}
            </p>
          </div>
          <button onClick={close}>×</button>
        </header>
        <div className="annual-table">
          <div className="annual-month-row head">
            <span>Ay</span>
            <span>Net</span>
            <span>Brüt</span>
            <span>SGK İşveren</span>
            <span>Vergi</span>
            <span>Yan Hak</span>
            <span>Toplam</span>
            <span>Bütçe</span>
            <span>Sapma</span>
          </div>
          {months.map((m, i) => {
            const x = monthsData[i],
              budget = row.employerCost;
            return (
              <div className="annual-month-row" key={m}>
                <span>{m}</span>
                <span>{money(x?.net)}</span>
                <span>{money(x?.gross)}</span>
                <span>
                  {money(
                    (x?.employerSgk || 0) + (x?.employerUnemployment || 0),
                  )}
                </span>
                <span>{money((x?.incomeTax || 0) + (x?.stampTax || 0))}</span>
                <span>{money(x?.benefits)}</span>
                <strong>{money(x?.employerCost)}</strong>
                <span>{money(budget)}</span>
                <span>{money((x?.employerCost || 0) - budget)}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
function BudgetForm({
  type,
  year,
  departments,
  positions,
  submit,
  close,
}: {
  type: "budget" | "scenario" | "head";
  year: number;
  departments: string[];
  positions: string[];
  submit: (e: FormEvent<HTMLFormElement>) => void;
  close: () => void;
}) {
  return (
    <div className="modal-backdrop top">
      <form className="record-modal budget-form" onSubmit={submit}>
        <header>
          <div>
            <span>YILLIK BÜTÇE PLANLAMA</span>
            <h2>
              {type === "budget"
                ? "Bütçe Kaydı"
                : type === "scenario"
                  ? "Yeni Senaryo"
                  : "Planlanan Personel / Açık Pozisyon"}
            </h2>
          </div>
          <button type="button" onClick={close}>
            ×
          </button>
        </header>
        <input type="hidden" name="year" value={year} />
        {type === "budget" ? (
          <>
            <label>
              Bütçe Tutarı
              <input name="amount" type="number" min="0" required />
            </label>
            <label>
              Ay (boşsa yıllık)
              <input name="month" type="number" min="1" max="12" />
            </label>
            <label>
              Not
              <input name="note" />
            </label>
          </>
        ) : type === "scenario" ? (
          <>
            <label>
              Senaryo Adı
              <input name="name" placeholder="Senaryo 1 – %15 Zam" required />
            </label>
            <label>
              Ücret Artışı %
              <input
                name="salaryIncreaseRate"
                type="number"
                min="0"
                step="0.1"
                required
              />
            </label>
            <label>
              Artış Ayı
              <select name="increaseMonth">
                {months.map((x, i) => (
                  <option value={i + 1} key={x}>
                    {x}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Yan Hak Artışı %
              <input
                name="benefitIncreaseRate"
                type="number"
                min="0"
                step="0.1"
              />
            </label>
            <label>
              Uygulama Seviyesi
              <select name="scopeType">
                <option>Şirket</option>
                <option>Departman</option>
                <option>Pozisyon</option>
                <option>Personel</option>
              </select>
            </label>
            <label>
              Seçim / Açıklama
              <input name="scopeValue" />
            </label>
          </>
        ) : (
          <>
            <label>
              Departman
              <select name="departmentName">
                <option value="">Seçiniz</option>
                {departments.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              Pozisyon
              <input name="position" list="positions" required />
              <datalist id="positions">
                {positions.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </datalist>
            </label>
            <label>
              Planlanan İşe Giriş
              <input name="plannedStartDate" type="date" required />
            </label>
            <label>
              Planlanan Net Ücret
              <input name="plannedNetSalary" type="number" min="0" />
            </label>
            <label>
              Planlanan Aylık İşveren Maliyeti
              <input name="plannedMonthlyCost" type="number" min="0" required />
            </label>
            <label>
              Kadro Sayısı
              <input name="headcount" type="number" min="1" defaultValue="1" />
            </label>
            <label>
              Not
              <input name="note" />
            </label>
          </>
        )}
        <footer>
          <button type="button" onClick={close}>
            İptal
          </button>
          <button className="primary">Kaydet</button>
        </footer>
      </form>
    </div>
  );
}
