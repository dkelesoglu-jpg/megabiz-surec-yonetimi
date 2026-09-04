"use client";

import { strToU8, zipSync } from "fflate";
import { FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import "./payroll-report.css";

type PayrollType = "Normal Personel" | "Emekli Personel" | "Huzur Hakkı";
type Row = {
  id: number;
  employeeNo: string;
  name: string;
  company: string;
  department: string;
  position: string;
  payrollType: PayrollType;
  status: string;
  net: number;
  netWithoutExemption: number;
  gross: number;
  employeeSgk: number;
  employeeUnemployment: number;
  incomeTaxBase: number;
  incomeTax: number;
  stampTax: number;
  incomeTaxExemption: number;
  stampTaxExemption: number;
  paidIncomeTax: number;
  paidStampTax: number;
  totalDeduction: number;
  netPaid: number;
  employerSgk: number;
  employerUnemployment: number;
  employerSgdp: number;
  costWithoutIncentive: number;
  costWith5510: number;
  benefits: number;
  employerCost: number;
};
type Data = {
  companyName: string;
  period: string;
  range: { from: string; to: string };
  rows: Row[];
  summary: Record<string, number>;
  filters: {
    departments: string[];
    positions: string[];
    employees: { id: number; name: string; employeeNo: string }[];
    statuses: string[];
  };
  parameterSnapshot: Record<string, unknown>;
  appliedFilters: Record<string, unknown>;
};
type ViewMode = "Kişi" | "Departman" | "Pozisyon" | "Şirket" | "Bordro Türü";
const currency = (value = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
const number = (value = 0) =>
  new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 }).format(value);
const today = new Date().toISOString().slice(0, 7);
const detailColumns = [
  "Sicil No",
  "Ad Soyad",
  "Şirket",
  "Departman",
  "Pozisyon",
  "Bordro / Ödeme Türü",
  "Net Ücret",
  "İstisnasız Net",
  "Brüt Ücret",
  "SGK İşçi",
  "İşsizlik İşçi",
  "Gelir Vergisi Matrahı",
  "Gelir Vergisi",
  "Damga Vergisi",
  "Gelir Vergisi İstisnası",
  "Damga Vergisi İstisnası",
  "Ödenen Gelir Vergisi",
  "Ödenen Damga Vergisi",
  "Toplam Kesinti",
  "Net Ödenen",
  "SGK İşveren",
  "İşsizlik İşveren",
  "SGDP İşveren",
  "Teşviksiz Maliyet",
  "5510 Teşvikli Maliyet",
  "Yan Haklar",
  "Toplam İşveren Maliyeti",
];
const rowCells = (row: Row): (string | number)[] => [
  row.employeeNo,
  row.name,
  row.company,
  row.department,
  row.position,
  row.payrollType,
  row.net,
  row.netWithoutExemption,
  row.gross,
  row.employeeSgk,
  row.employeeUnemployment,
  row.incomeTaxBase,
  row.incomeTax,
  row.stampTax,
  row.incomeTaxExemption,
  row.stampTaxExemption,
  row.paidIncomeTax,
  row.paidStampTax,
  row.totalDeduction,
  row.netPaid,
  row.employerSgk,
  row.employerUnemployment,
  row.employerSgdp,
  row.costWithoutIncentive,
  row.costWith5510,
  row.benefits,
  row.employerCost,
];

export default function PayrollReport({
  act,
}: {
  act: (message: string) => void;
}) {
  const [period, setPeriod] = useState(today),
    [department, setDepartment] = useState(""),
    [position, setPosition] = useState(""),
    [employeeId, setEmployeeId] = useState(""),
    [payrollType, setPayrollType] = useState("Tümü"),
    [status, setStatus] = useState(""),
    [viewMode, setViewMode] = useState<ViewMode>("Kişi"),
    [data, setData] = useState<Data | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [tab, setTab] = useState<"Rapor" | "Parametreler">("Rapor"),
    [saving, setSaving] = useState(false);
  async function load() {
    setLoading(true);
    try {
      const query = new URLSearchParams({ period, payrollType });
      if (department) query.set("department", department);
      if (position) query.set("position", position);
      if (employeeId) query.set("employeeId", employeeId);
      if (status) query.set("status", status);
      const response = await fetch(`/api/payroll-report?${query}`, {
          cache: "no-store",
        }),
        result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setData(result);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Bordro verileri alınamadı",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    // Veri kaynağı, seçili bordro filtreleri değiştiğinde yeniden hesaplanır.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    window.addEventListener("employees-updated", load);
    return () => window.removeEventListener("employees-updated", load);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, department, position, employeeId, payrollType, status]);

  const table = useMemo(
    () => makeTable(data?.rows || [], viewMode),
    [data, viewMode],
  );
  async function saveParameters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = Object.fromEntries(
          new FormData(event.currentTarget).entries(),
        ),
        response = await fetch("/api/personnel-costs", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ ...payload, action: "parameters" }),
        }),
        result = await response.json();
      if (!response.ok) throw new Error(result.error);
      await load();
      act("Yeni bordro parametre sürümü kaydedildi");
    } catch (reason) {
      act(
        reason instanceof Error ? reason.message : "Parametreler kaydedilemedi",
      );
    } finally {
      setSaving(false);
    }
  }
  function excel() {
    if (!data) return;
    downloadXlsx(data, table);
    act("Bordro raporu Excel olarak indirildi");
  }
  function pdf() {
    if (!data) return;
    downloadPdf(data, table);
    act("Bordro raporu PDF olarak indirildi");
  }
  return (
    <div className="workspace payroll-shell">
      <div className="workspace-head payroll-head">
        <div>
          <span>MEGA HRMS / BORDRO</span>
          <h2>Bordro Hesaplama ve Raporlama</h2>
          <p>
            Gerçek sicil ücretleri, dönem parametreleri ve yan haklarla netten
            brüte merkezi hesaplama.
          </p>
        </div>
        <div className="payroll-actions">
          <button onClick={load}>Rapor Al</button>
          <button onClick={excel} disabled={!data}>
            Excel
          </button>
          <button className="primary" onClick={pdf} disabled={!data}>
            PDF
          </button>
        </div>
      </div>
      <div className="payroll-tabs">
        <button
          className={tab === "Rapor" ? "active" : ""}
          onClick={() => setTab("Rapor")}
        >
          Bordro Raporu
        </button>
        <button
          className={tab === "Parametreler" ? "active" : ""}
          onClick={() => setTab("Parametreler")}
        >
          Parametreler
        </button>
      </div>
      {tab === "Parametreler" ? (
        <Parameters data={data} saving={saving} save={saveParameters} />
      ) : (
        <>
          <section className="panel payroll-filters">
            <Filter label="Şirket">
              <input
                className="company-filter"
                value={data?.companyName || "Yükleniyor…"}
                readOnly
              />
            </Filter>
            <Filter label="Dönem">
              <input
                type="month"
                value={period}
                onChange={(event) => setPeriod(event.target.value)}
              />
            </Filter>
            <Filter label="Departman">
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
              >
                <option value="">Tümü</option>
                {data?.filters.departments.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Filter>
            <Filter label="Pozisyon">
              <select
                value={position}
                onChange={(event) => setPosition(event.target.value)}
              >
                <option value="">Tümü</option>
                {data?.filters.positions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Filter>
            <Filter label="Çalışan">
              <select
                value={employeeId}
                onChange={(event) => setEmployeeId(event.target.value)}
              >
                <option value="">Tümü</option>
                {data?.filters.employees.map((item) => (
                  <option value={item.id} key={item.id}>
                    {item.name} · {item.employeeNo}
                  </option>
                ))}
              </select>
            </Filter>
            <Filter label="Bordro / Ödeme Türü">
              <select
                value={payrollType}
                onChange={(event) => setPayrollType(event.target.value)}
              >
                {[
                  "Tümü",
                  "Normal Personel",
                  "Emekli Personel",
                  "Huzur Hakkı",
                ].map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Filter>
            <Filter label="Personel Durumu">
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value)}
              >
                <option value="">Tümü</option>
                {data?.filters.statuses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </Filter>
            <Filter label="Rapor Görünümü">
              <select
                value={viewMode}
                onChange={(event) =>
                  setViewMode(event.target.value as ViewMode)
                }
              >
                {["Kişi", "Departman", "Pozisyon", "Şirket", "Bordro Türü"].map(
                  (item) => (
                    <option key={item}>{item}</option>
                  ),
                )}
              </select>
            </Filter>
          </section>
          {error && <div className="form-error">{error}</div>}
          {loading || !data ? (
            <div className="panel payroll-loading">Bordro hesaplanıyor…</div>
          ) : (
            <>
              <Summary summary={data.summary} />
              <section className="panel payroll-table-panel">
                <header>
                  <div>
                    <strong>{viewMode} Bazında Bordro Raporu</strong>
                    <small>
                      {data.companyName} · {data.range.from} – {data.range.to}
                    </small>
                  </div>
                  <span>{data.rows.length} kayıt</span>
                </header>
                <div className="payroll-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        {table.columns.map((column) => (
                          <th key={column}>{column}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.rows.map((row, index) => (
                        <tr key={index}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex}>
                              {typeof cell === "number"
                                ? cell === 0
                                  ? "—"
                                  : number(cell)
                                : cell || "—"}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer>
                  <b>Genel Toplam</b>
                  <span>Net: {currency(data.summary.totalNet)}</span>
                  <span>Brüt: {currency(data.summary.totalGross)}</span>
                  <span>Vergi: {currency(data.summary.totalTax)}</span>
                  <span>
                    İşveren Maliyeti: {currency(data.summary.totalEmployerCost)}
                  </span>
                </footer>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}

function Filter({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label>
      <span>{label}</span>
      {children}
    </label>
  );
}
function Summary({ summary }: { summary: Record<string, number> }) {
  const cards = [
    ["Toplam Personel", summary.totalCount],
    ["Normal Personel", summary.normalCount],
    ["Emekli Personel", summary.retiredCount],
    ["Huzur Hakkı", summary.honorariumCount],
    ["Toplam Net Ödeme", currency(summary.totalNet)],
    ["Toplam Brüt", currency(summary.totalGross)],
    ["SGK / SGDP İşveren", currency(summary.totalEmployerSgk)],
    ["Toplam Vergi", currency(summary.totalTax)],
    ["Toplam Yan Hak", currency(summary.totalBenefits)],
    ["Toplam İşveren Maliyeti", currency(summary.totalEmployerCost)],
    ["Normal Maliyeti", currency(summary.normalCost)],
    ["Emekli Maliyeti", currency(summary.retiredCost)],
    ["Huzur Hakkı Maliyeti", currency(summary.honorariumCost)],
  ];
  return (
    <section className="payroll-kpis">
      {cards.map(([label, value]) => (
        <article key={String(label)}>
          <small>{label}</small>
          <strong>{value}</strong>
        </article>
      ))}
    </section>
  );
}
function makeTable(rows: Row[], mode: ViewMode) {
  if (mode === "Kişi")
    return { columns: detailColumns, rows: rows.map(rowCells) };
  const key = (row: Row) =>
      mode === "Departman"
        ? row.department
        : mode === "Pozisyon"
          ? row.position
          : mode === "Şirket"
            ? row.company
            : row.payrollType,
    groups = Object.values(
      rows.reduce(
        (result, row) => {
          const name = key(row) || "Tanımsız";
          (result[name] ||= []).push(row);
          return result;
        },
        {} as Record<string, Row[]>,
      ),
    ),
    sum = (group: Row[], field: keyof Row) =>
      Math.round(
        group.reduce((total, row) => total + Number(row[field] || 0), 0) * 100,
      ) / 100;
  return {
    columns: [
      mode,
      "Kayıt Sayısı",
      "Toplam Net",
      "Toplam Brüt",
      "SGK / SGDP İşveren",
      "Toplam Vergi",
      "Yan Haklar",
      "Toplam İşveren Maliyeti",
    ],
    rows: groups.map((group) => [
      key(group[0]),
      group.length,
      sum(group, "netPaid"),
      sum(group, "gross"),
      sum(group, "employerSgk") + sum(group, "employerSgdp"),
      sum(group, "paidIncomeTax") + sum(group, "paidStampTax"),
      sum(group, "benefits"),
      sum(group, "employerCost"),
    ]),
  };
}

function Parameters({
  data,
  saving,
  save,
}: {
  data: Data | null;
  saving: boolean;
  save: (event: FormEvent<HTMLFormElement>) => void;
}) {
  const p = data?.parameterSnapshot || {},
    bp = (name: string, fallback: number) =>
      String(Number(p[name] ?? fallback * 100) / 100);
  return (
    <form className="panel payroll-parameters" onSubmit={save}>
      <header>
        <div>
          <strong>Bordro Parametreleri</strong>
          <small>
            Yeni kayıt tarihsel bir sürüm oluşturur; geçmiş dönemler korunur.
          </small>
        </div>
      </header>
      <div className="payroll-parameter-grid">
        <Filter label="Yıl">
          <input
            name="year"
            type="number"
            defaultValue={Number(p.year || new Date().getFullYear())}
            required
          />
        </Filter>
        <Filter label="Geçerlilik Başlangıcı">
          <input
            name="effectiveFrom"
            type="date"
            defaultValue={String(p.effectiveFrom || "")}
            required
          />
        </Filter>
        <Filter label="Geçerlilik Bitişi">
          <input
            name="effectiveTo"
            type="date"
            defaultValue={String(p.effectiveTo || "")}
          />
        </Filter>
        <Filter label="Asgari Aylık Brüt Ücret">
          <input
            name="minimumWage"
            type="number"
            defaultValue={String(p.minimumWage || 33030)}
            required
          />
        </Filter>
        <Filter label="SGK Alt Sınırı">
          <input
            name="sgkFloor"
            type="number"
            defaultValue={String(p.sgkFloor || 33030)}
            required
          />
        </Filter>
        <Filter label="SGK Tavanı">
          <input
            name="sgkCeiling"
            type="number"
            defaultValue={String(p.sgkCeiling || 297270)}
            required
          />
        </Filter>
        <Filter label="SGK İşçi %">
          <input
            name="employeeSgkRate"
            type="number"
            step="0.001"
            defaultValue={bp("employeeSgkRate", 14)}
            required
          />
        </Filter>
        <Filter label="SGK İşveren %">
          <input
            name="employerSgkRate"
            type="number"
            step="0.001"
            defaultValue={bp("employerSgkRate", 21.75)}
            required
          />
        </Filter>
        <Filter label="İşsizlik İşçi %">
          <input
            name="employeeUnemploymentRate"
            type="number"
            step="0.001"
            defaultValue={bp("employeeUnemploymentRate", 1)}
            required
          />
        </Filter>
        <Filter label="İşsizlik İşveren %">
          <input
            name="employerUnemploymentRate"
            type="number"
            step="0.001"
            defaultValue={bp("employerUnemploymentRate", 2)}
            required
          />
        </Filter>
        <Filter label="5510 Teşvik %">
          <input
            name="employerIncentiveRate"
            type="number"
            step="0.001"
            defaultValue={bp("employerIncentiveRate", 5)}
            required
          />
        </Filter>
        <Filter label="Damga Vergisi %">
          <input
            name="stampTaxRate"
            type="number"
            step="0.001"
            defaultValue={bp("stampTaxRate", 0.759)}
            required
          />
        </Filter>
        <Filter label="Emekli İşçi SGDP %">
          <input
            name="employeeSgdpRate"
            type="number"
            step="0.001"
            defaultValue={bp("employeeSgdpRate", 7.5)}
            required
          />
        </Filter>
        <Filter label="Emekli İşveren SGDP %">
          <input
            name="employerSgdpRate"
            type="number"
            step="0.001"
            defaultValue={bp("employerSgdpRate", 24.75)}
            required
          />
        </Filter>
        <Filter label="Gelir Vergisi İstisnası">
          <input
            name="minimumWageIncomeTaxExemption"
            type="number"
            defaultValue={String(p.minimumWageIncomeTaxExemption || 0)}
          />
        </Filter>
        <Filter label="Damga Vergisi İstisnası">
          <input
            name="minimumWageStampTaxExemption"
            type="number"
            defaultValue={String(p.minimumWageStampTaxExemption || 0)}
          />
        </Filter>
        <Filter label="Huzur Hakkı Gelir Vergisi İstisnası">
          <input
            name="honorariumIncomeTaxExemption"
            type="number"
            defaultValue={String(p.honorariumIncomeTaxExemption || 0)}
          />
        </Filter>
        <Filter label="Huzur Hakkı Damga İstisnası">
          <input
            name="honorariumStampTaxExemption"
            type="number"
            defaultValue={String(p.honorariumStampTaxExemption || 0)}
          />
        </Filter>
        <Filter label="Huzur Hakkı Diğer Kesinti %">
          <input
            name="honorariumOtherDeductionRate"
            type="number"
            step="0.001"
            defaultValue={bp("honorariumOtherDeductionRate", 0)}
          />
        </Filter>
      </div>
      <input
        type="hidden"
        name="mealSgkDailyExemption"
        value={String(p.mealSgkDailyExemption || 0)}
      />
      <input
        type="hidden"
        name="mealTaxDailyExemption"
        value={String(p.mealTaxDailyExemption || 0)}
      />
      <input
        type="hidden"
        name="travelSgkDailyExemption"
        value={String(p.travelSgkDailyExemption || 0)}
      />
      <input
        type="hidden"
        name="travelTaxDailyExemption"
        value={String(p.travelTaxDailyExemption || 0)}
      />
      <label className="payroll-brackets">
        <span>Gelir Vergisi Dilimleri (JSON)</span>
        <textarea
          name="incomeTaxBrackets"
          defaultValue={JSON.stringify(
            p.incomeTaxBrackets || [
              { limit: 190000, rate: 15 },
              { limit: 400000, rate: 20 },
              { limit: 1500000, rate: 27 },
              { limit: 5300000, rate: 35 },
              { limit: null, rate: 40 },
            ],
            null,
            2,
          )}
        />
      </label>
      <button className="primary" disabled={saving}>
        {saving ? "Kaydediliyor…" : "Yeni Parametre Sürümünü Kaydet"}
      </button>
    </form>
  );
}

function xml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
function col(index: number) {
  let result = "";
  for (let value = index + 1; value; value = Math.floor((value - 1) / 26))
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  return result;
}
function download(blob: Blob, name: string) {
  const link = document.createElement("a"),
    url = URL.createObjectURL(blob);
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function downloadXlsx(
  data: Data,
  table: { columns: string[]; rows: (string | number)[][] },
) {
  const titleRows: (string | number)[][] = [
      ["MEGA HRMS Professional"],
      ["Bordro Hesaplama ve Raporlama"],
      [data.companyName],
      [`Dönem: ${data.period}`],
      [`Filtreler: ${JSON.stringify(data.appliedFilters)}`],
      [],
      table.columns,
      ...table.rows,
      [],
      [
        "GENEL TOPLAM",
        `Net: ${data.summary.totalNet}`,
        `Brüt: ${data.summary.totalGross}`,
        `Maliyet: ${data.summary.totalEmployerCost}`,
      ],
    ],
    sheet = `<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${titleRows.map((row, ri) => `<row r="${ri + 1}">${row.map((value, ci) => (typeof value === "number" ? `<c r="${col(ci)}${ri + 1}"><v>${value}</v></c>` : `<c r="${col(ci)}${ri + 1}" t="inlineStr"><is><t>${xml(value)}</t></is></c>`)).join("")}</row>`).join("")}</sheetData></worksheet>`,
    files = {
      "[Content_Types].xml": strToU8(
        `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ),
      "_rels/.rels": strToU8(
        `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
      "xl/workbook.xml": strToU8(
        `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Bordro" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
      "xl/_rels/workbook.xml.rels": strToU8(
        `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ),
      "xl/worksheets/sheet1.xml": strToU8(sheet),
    };
  download(
    new Blob([zipSync(files)], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Bordro_Raporu_${data.period}.xlsx`,
  );
}
function ascii(value: unknown) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ıİ]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[çÇ]/g, "c")
    .replace(/[öÖ]/g, "o")
    .replace(/[üÜ]/g, "u")
    .replace(/[()\\]/g, " ");
}
function downloadPdf(
  data: Data,
  table: { columns: string[]; rows: (string | number)[][] },
) {
  const width = 1191,
    height = 842,
    perPage = 26,
    pages = Math.max(1, Math.ceil(table.rows.length / perPage)),
    objects: string[] = [
      "",
      "<< /Type /Catalog /Pages 2 0 R >>",
      "",
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ],
    pageIds: number[] = [];
  for (let page = 0; page < pages; page++) {
    const pageId = objects.length,
      contentId = pageId + 1;
    pageIds.push(pageId);
    objects.push("");
    const lines = [
      `BT /F1 15 Tf 28 ${height - 30} Td (MEGA HRMS Professional) Tj /F1 11 Tf 0 -18 Td (Bordro Hesaplama ve Raporlama) Tj /F1 8 Tf 0 -14 Td (${ascii(`${data.companyName} | Donem ${data.period} | ${new Date().toLocaleString("tr-TR")}`)}) Tj`,
      `0 -18 Td (${ascii(table.columns.join(" | ")).slice(0, 245)}) Tj`,
    ];
    table.rows
      .slice(page * perPage, (page + 1) * perPage)
      .forEach((row) =>
        lines.push(
          `0 -22 Td (${ascii(row.map((value) => (typeof value === "number" ? value.toFixed(2) : value)).join(" | ")).slice(0, 245)}) Tj`,
        ),
      );
    lines.push(
      `0 -22 Td (${ascii(`TOPLAM Net ${data.summary.totalNet} | Brut ${data.summary.totalGross} | Maliyet ${data.summary.totalEmployerCost}`)}) Tj`,
      "ET",
      `BT /F1 8 Tf ${width - 100} 20 Td (Sayfa ${page + 1} / ${pages}) Tj ET`,
    );
    const stream = lines.join("\n");
    objects.push(
      `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    );
    objects[pageId] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${width} ${height}] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`;
  }
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages} >>`;
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  for (let index = 1; index < objects.length; index++) {
    offsets[index] = pdf.length;
    pdf += `${index} 0 obj\n${objects[index]}\nendobj\n`;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n${offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`)
    .join(
      "",
    )}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  download(
    new Blob([pdf], { type: "application/pdf" }),
    `Bordro_Raporu_${data.period}.pdf`,
  );
}
