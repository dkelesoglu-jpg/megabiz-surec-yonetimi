"use client";
import { useEffect, useMemo, useState } from "react";
import { strFromU8, unzipSync, zipSync, strToU8 } from "fflate";
import { personnelRecords } from "./personnel-import-parser";
import { formatTrMoney } from "./tr-money";
type Company = { id: string; name: string };
type Department = { id: number; name: string };
type Position = { id: number; departmentId: number; title: string };
type PreviewRow = {
  index: number;
  data: Record<string, unknown>;
  issues: { level: string; code: string; message: string }[];
  status: string;
  existingEmployeeId?: number | null;
  departmentId?: number | null;
  positionId?: number | null;
  providedFields?: string[];
  changes?: {
    field: string;
    label: string;
    current: unknown;
    next: unknown;
  }[];
};
type Preview = {
  rows: PreviewRow[];
  summary: Record<string, number>;
  departments: Department[];
  positions: Position[];
};
type Result = {
  total: number;
  imported: number;
  updated: number;
  skipped: number;
  errors: number;
  newDepartments: number;
  newPositions: number;
  unmatchedManagers: number;
  incomplete: number;
  verifiedCards: number;
  complete?: boolean;
  errorRows: Record<string, unknown>[];
};
const safeArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];
const safeNumber = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
function safePreview(value: unknown): Preview | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const rows = safeArray<Record<string, unknown>>(raw.rows).map((row, i) => ({
    index: safeNumber(row.index) || i + 1,
    data:
      row.data && typeof row.data === "object"
        ? (row.data as Record<string, unknown>)
        : {},
    issues: safeArray<Record<string, unknown>>(row.issues).map((issue) => ({
      level: String(issue.level ?? "warning"),
      code: String(issue.code ?? "unknown"),
      message: String(issue.message ?? "Kayıt kontrol edilmelidir"),
    })),
    status: String(row.status ?? "Eksik bilgi"),
    existingEmployeeId:
      row.existingEmployeeId == null
        ? null
        : safeNumber(row.existingEmployeeId),
    departmentId:
      row.departmentId == null ? null : safeNumber(row.departmentId),
    positionId: row.positionId == null ? null : safeNumber(row.positionId),
    providedFields: safeArray<unknown>(row.providedFields).map(String),
    changes: safeArray<Record<string, unknown>>(row.changes).map((change) => ({
      field: String(change.field ?? ""),
      label: String(change.label ?? "Alan"),
      current: change.current ?? "",
      next: change.next ?? "",
    })),
  }));
  const rawSummary =
    raw.summary && typeof raw.summary === "object"
      ? (raw.summary as Record<string, unknown>)
      : {};
  return {
    rows,
    summary: {
      total: safeNumber(rawSummary.total) || rows.length,
      valid: safeNumber(rawSummary.valid),
      errors: safeNumber(rawSummary.errors),
      incomplete: safeNumber(rawSummary.incomplete),
      existing: safeNumber(rawSummary.existing),
    },
    departments: safeArray<Department>(raw.departments),
    positions: safeArray<Position>(raw.positions),
  };
}
const decodeXml = (s: string) =>
  s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
const colIndex = (ref: string) =>
  [...ref.replace(/\d/g, "")].reduce(
    (n, c) => n * 26 + c.charCodeAt(0) - 64,
    0,
  ) - 1;
function csvRows(text: string) {
  if (typeof text !== "string") return [];
  const delimiter =
    (text.split("\n")[0].match(/;/g) || []).length >
    (text.split("\n")[0].match(/,/g) || []).length
      ? ";"
      : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    cell = "",
    quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && text[i + 1] === '"') {
      cell += '"';
      i++;
    } else if (c === '"') quoted = !quoted;
    else if (c === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if (
      (c === "\n" || (c === "\r" && text[i + 1] !== "\n")) &&
      !quoted
    ) {
      row.push(cell.trim());
      if (Array.isArray(row) && row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else if (c !== "\r") cell += c;
  }
  row.push(cell.trim());
  if (Array.isArray(row) && row.some(Boolean)) rows.push(row);
  return rows;
}
function xlsxRows(buffer: ArrayBuffer) {
  if (!(buffer instanceof ArrayBuffer) || buffer.byteLength === 0) return [];
  const files = unzipSync(new Uint8Array(buffer)),
    sharedXml = files["xl/sharedStrings.xml"]
      ? strFromU8(files["xl/sharedStrings.xml"])
      : "",
    shared = [...sharedXml.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((m) =>
      [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((x) => decodeXml(x[1]))
        .join(""),
    ),
    sheet = files["xl/worksheets/sheet1.xml"];
  if (!sheet)
    throw new Error(
      "Excel çalışma sayfası okunamadı. Lütfen geçerli bir XLSX dosyası seçin.",
    );
  const xml = strFromU8(sheet),
    rows: string[][] = [];
  for (const rm of xml.matchAll(/<row[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)) {
    const row: string[] = [];
    // Boş hücreler Excel/LibreOffice/Google E-Tablolar/openpyxl gibi birçok
    // yazıcı tarafından self-closing (<c r="D2" t="inlineStr" />) olarak
    // yazılır. Eski regex yalnızca <c ...>içerik</c> biçimini tanıyordu; bir
    // self-closing hücreyle karşılaşınca </c> arayışı BİR SONRAKİ dolu
    // hücrenin kapanışına kadar kayıyor, o hücrenin içeriğini yanlış sütuna
    // yazıyor ve o hücreyi tamamen atlıyordu (bkz. P6 kök neden raporu).
    // Aşağıdaki regex, self-closing (`/>`) ile açık/kapalı (`>...</c>`)
    // biçimleri ayrı alternatifler olarak ele alır; self-closing durumda
    // içerik grubu (cm[3]) hiç eşleşmez (undefined kalır).
    for (const cm of rm[2].matchAll(
      /<c[^>]*r="([A-Z]+\d+)"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const type = (cm[2].match(/t="([^"]+)"/) || [])[1],
        content = cm[3] ?? "",
        v =
          (content.match(/<v>([\s\S]*?)<\/v>/) || [])[1] ??
          [...content.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
            .map((x) => x[1])
            .join(""),
        value = type === "s" ? shared[Number(v)] || "" : decodeXml(v);
      row[colIndex(cm[1])] = value;
    }
    rows.push(row);
  }
  return rows;
}
const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
function errorWorkbook(rows: Record<string, unknown>[]) {
  const headers = [...new Set(rows.flatMap(Object.keys))],
    sheetRows = [headers, ...rows.map((r) => headers.map((h) => r[h]))]
      .map(
        (row, ri) =>
          `<row r="${ri + 1}">${row.map((v, ci) => `<c r="${String.fromCharCode(65 + ci)}${ri + 1}" t="inlineStr"><is><t>${esc(typeof v === "object" ? JSON.stringify(v) : v)}</t></is></c>`).join("")}</row>`,
      )
      .join(""),
    files: Record<string, Uint8Array> = {
      "[Content_Types].xml": strToU8(
        `<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`,
      ),
      "_rels/.rels": strToU8(
        `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
      ),
      "xl/workbook.xml": strToU8(
        `<?xml version="1.0"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Hatalı Kayıtlar" sheetId="1" r:id="rId1"/></sheets></workbook>`,
      ),
      "xl/_rels/workbook.xml.rels": strToU8(
        `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
      ),
      "xl/worksheets/sheet1.xml": strToU8(
        `<?xml version="1.0"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${sheetRows}</sheetData></worksheet>`,
      ),
    };
  return zipSync(files);
}
export default function ExcelPersonnelImport({
  close,
  done,
}: {
  close: () => void;
  done: (message: string) => void;
}) {
  const [companies, setCompanies] = useState<Company[]>([]),
    [target, setTarget] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [rawRows, setRawRows] = useState<Record<string, unknown>[]>([]),
    [preview, setPreview] = useState<Preview | null>(null),
    [result, setResult] = useState<Result | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [createDepartments, setCreateDepartments] = useState(false),
    [createPositions, setCreatePositions] = useState(false),
    [duplicatePolicy, setDuplicatePolicy] = useState("skip"),
    [skipRows, setSkipRows] = useState<number[]>([]),
    [departmentMappings, setDepartmentMappings] = useState<
      Record<string, number>
    >({}),
    [positionMappings, setPositionMappings] = useState<Record<string, number>>(
      {},
    );
  useEffect(() => {
    const active = decodeURIComponent(
      document.cookie.match(/(?:^|;\s*)mega_company=([^;]+)/)?.[1] ||
        "mega-global-energy",
    );
    setTarget(active);
    fetch("/api/companies")
      .then((r) => r.json())
      .then((j) => setCompanies(safeArray<Company>(j?.companies)))
      .catch(() => setCompanies([]));
  }, []);
  const targetName = companies.find((c) => c.id === target)?.name || target,
    missingDepartments = useMemo(
      () =>
        preview && Array.isArray(preview.rows)
          ? [
              ...new Set(
                preview.rows
                  .filter((r) => !r.departmentId)
                  .map((r) => String(r.data.department || ""))
                  .filter(Boolean),
              ),
            ]
          : [],
      [preview],
    ),
    missingPositions = useMemo(
      () =>
        preview && Array.isArray(preview.rows)
          ? [
              ...new Set(
                preview.rows
                  .filter((r) => r.departmentId && !r.positionId)
                  .map((r) => `${r.data.department}::${r.data.position}`),
              ),
            ]
          : [],
      [preview],
    );
  async function inspect() {
    if (!file || !target) {
      setError("Hedef şirketi ve Excel dosyasını seçin.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const buffer = await file.arrayBuffer(),
        table = file.name.toLowerCase().endsWith(".csv")
          ? csvRows(new TextDecoder().decode(buffer))
          : xlsxRows(buffer),
        rows = personnelRecords(table);
      setRawRows(rows);
      const r = await fetch("/api/employees/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "preview",
            targetCompanyId: target,
            rows,
          }),
        }),
        j = await r.json();
      if (!r.ok) throw new Error("preview_failed");
      const checked = safePreview(j);
      if (!checked || !checked.rows.length) throw new Error("preview_invalid");
      setPreview(checked);
      setResult(null);
    } catch (e) {
      const known =
        e instanceof Error &&
        /Excel başlık satırı|Excel çalışma sayfası|aktarılabilir satır/.test(
          e.message,
        );
      setError(
        known
          ? e.message
          : "Excel dosyası kontrol edilirken eksik veya uyumsuz alanlar bulundu. Lütfen dosyayı ve aşağıdaki kayıtları kontrol edin.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function commit() {
    if (!preview) return;
    if (
      preview.summary.incomplete > 0 &&
      !window.confirm(
        "Bazı personellerin eksik bilgileri bulunmaktadır. Personeller yine de sicil kartlarına aktarılacaktır. Eksik bilgileri daha sonra Personel Sicil Kartlarından tamamlayabilirsiniz. Devam etmek istiyor musunuz?",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      const reviewed = safeArray<PreviewRow>(preview.rows).map((r) => ({
          data: r.data,
          index: r.index,
          providedFields: r.providedFields,
        })),
        r = await fetch("/api/employees/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            action: "commit",
            targetCompanyId: target,
            rows: reviewed,
            settings: {
              createDepartments,
              createPositions,
              duplicatePolicy,
              skipRows,
              departmentMappings,
              positionMappings,
            },
          }),
        }),
        j = await r.json();
      if (!r.ok) {
        const businessMessage =
          typeof j?.error === "string" &&
          /Hedef şirket|yetkisi gereklidir|aktarılabilir satır|en fazla 2\.000|Geçersiz aktarım/.test(
            j.error,
          )
            ? j.error
            : "Aktarım tamamlanamadı. Lütfen ön izleme sonuçlarını kontrol edip tekrar deneyin.";
        setError(businessMessage);
        return;
      }
      const safeResult =
        j?.result && typeof j.result === "object" ? (j.result as Result) : null;
      if (!safeResult) throw new Error("invalid_result");
      safeResult.errorRows = safeArray<Record<string, unknown>>(
        safeResult.errorRows,
      );
      setResult(safeResult);
      window.dispatchEvent(new Event("employees-updated"));
      done(
        `${safeNumber(safeResult.verifiedCards)} sicil kartı ${targetName} şirketinde doğrulandı`,
      );
    } catch {
      setError(
        "Aktarım tamamlanamadı. Kayıtlar değiştirilmedi; lütfen ön izleme sonuçlarını kontrol edip tekrar deneyin.",
      );
    } finally {
      setBusy(false);
    }
  }
  function downloadErrors() {
    if (!result?.errorRows.length) return;
    const blob = new Blob([errorWorkbook(result.errorRows)], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      }),
      a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "mega-hrms-hatali-personel-kayitlari.xlsx";
    a.click();
    URL.revokeObjectURL(a.href);
  }
  return (
    <div className="modal-backdrop">
      <section className="excel-import-modal">
        <header>
          <div>
            <span>PERSONEL / TOPLU AKTARIM</span>
            <h2>Excel’den Personel Aktar</h2>
            <p>
              Dosyanızı kontrol edin, eşleştirmeleri tamamlayın ve onaydan sonra
              sicil kartlarını oluşturun.
            </p>
          </div>
          <button onClick={close}>×</button>
        </header>
        {!result && (
          <>
            <div className="excel-import-setup">
              <label>
                <span>Hedef Şirket *</span>
                <select
                  value={target}
                  onChange={(e) => {
                    setTarget(e.target.value);
                    setPreview(null);
                  }}
                >
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="excel-file">
                <span>Excel Dosyası *</span>
                <input
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={(e) => {
                    setFile(e.target.files?.[0] || null);
                    setPreview(null);
                  }}
                />
                <small>{file?.name || "XLSX veya CSV dosyası seçin"}</small>
              </label>
              <a href="/mega-hrms-personel-aktarim-sablonu.xlsx" download>
                ⇩ Excel Şablonunu İndir
              </a>
              <button
                className="primary"
                disabled={busy || !file}
                onClick={inspect}
              >
                {busy ? "Kontrol ediliyor…" : "Aktarım Ön İzleme"}
              </button>
            </div>
            {preview && (
              <>
                <div className="excel-target-note">
                  <strong>
                    {preview.summary.total} personel satırı {targetName} şirketi
                    için kontrol edildi.
                  </strong>
                  <span>
                    {preview.summary.valid} aktarılabilir ·{" "}
                    {preview.summary.incomplete} eksik bilgili ·{" "}
                    {preview.summary.errors} kritik hata ·{" "}
                    {preview.summary.existing} mevcut kayıt
                  </span>
                </div>
                <div className="excel-mapping">
                  <label>
                    <input
                      type="checkbox"
                      checked={createDepartments}
                      onChange={(e) => setCreateDepartments(e.target.checked)}
                    />{" "}
                    Eksik departmanları otomatik oluştur
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={createPositions}
                      onChange={(e) => setCreatePositions(e.target.checked)}
                    />{" "}
                    Eksik pozisyonları otomatik oluştur
                  </label>
                  <label>
                    Mevcut personel
                    <select
                      value={duplicatePolicy}
                      onChange={(e) => setDuplicatePolicy(e.target.value)}
                    >
                      <option value="skip">Atla</option>
                      <option value="use">Mevcut kaydı kullan</option>
                      <option value="update">
                        Değişen dolu alanları güncelle
                      </option>
                    </select>
                  </label>
                </div>
                {missingDepartments.length > 0 && !createDepartments && (
                  <div className="excel-match-panel">
                    <strong>Departman Eşleştirme</strong>
                    {missingDepartments.map((name) => (
                      <label key={name}>
                        <span>{name}</span>
                        <select
                          value={departmentMappings[name] ?? -2}
                          onChange={(e) =>
                            setDepartmentMappings({
                              ...departmentMappings,
                              [name]: Number(e.target.value),
                            })
                          }
                        >
                          <option value="-2">Şimdilik boş bırak</option>
                          <option value="-1">Yeni oluştur ve bağla</option>
                          {preview.departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                {missingPositions.length > 0 && !createPositions && (
                  <div className="excel-match-panel">
                    <strong>Pozisyon Eşleştirme</strong>
                    {missingPositions.map((name) => (
                      <label key={name}>
                        <span>{name.replace("::", " → ")}</span>
                        <select
                          value={positionMappings[name] ?? -2}
                          onChange={(e) =>
                            setPositionMappings({
                              ...positionMappings,
                              [name]: Number(e.target.value),
                            })
                          }
                        >
                          <option value="-2">Şimdilik boş bırak</option>
                          <option value="-1">Yeni oluştur ve bağla</option>
                          {preview.positions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      </label>
                    ))}
                  </div>
                )}
                <div className="excel-preview-table">
                  <div className="excel-tr head">
                    <span>Aktar</span>
                    <span>Satır / Personel</span>
                    <span>Departman / Pozisyon</span>
                    <span>Durum</span>
                    <span>Kontrol</span>
                  </div>
                  {preview.rows.map((row) => (
                    <div className="excel-tr" key={row.index}>
                      <span>
                        <input
                          type="checkbox"
                          checked={!skipRows.includes(row.index)}
                          onChange={() =>
                            setSkipRows(
                              skipRows.includes(row.index)
                                ? skipRows.filter((x) => x !== row.index)
                                : [...skipRows, row.index],
                            )
                          }
                        />
                      </span>
                      <span>
                        <b>
                          {row.index}. {String(row.data.firstName)}{" "}
                          {String(row.data.lastName)}
                        </b>
                        <small>
                          {String(row.data.employeeNo || "Sicil yok")} ·{" "}
                          {String(row.data.nationalId || "T.C. yok")}
                        </small>
                      </span>
                      <span>
                        <b>{String(row.data.department || "—")}</b>
                        <small>{String(row.data.position || "—")}</small>
                      </span>
                      <span>
                        <i
                          className={
                            row.status === "Aktarılabilir"
                              ? "valid"
                              : row.status === "Aktarılamaz – Kritik Hata"
                                ? "invalid"
                                : "warning"
                          }
                        >
                          {row.status}
                        </i>
                      </span>
                      <span>
                        <small>
                          {row.issues.map((x) => x.message).join(" · ") ||
                            "Kontroller başarılı"}
                        </small>
                        {row.existingEmployeeId &&
                          safeArray<NonNullable<PreviewRow["changes"]>[number]>(row.changes).length > 0 && (
                            <details className="excel-change-preview">
                              <summary>
                                Güncellenecek {safeArray<NonNullable<PreviewRow["changes"]>[number]>(row.changes).length}{" "}
                                alanı göster
                              </summary>
                              {safeArray<NonNullable<PreviewRow["changes"]>[number]>(row.changes).map((change) => {
                                const isMoney = change.field === "salary" || change.field === "netSalary";
                                const show = (v: unknown) =>
                                  isMoney && typeof v === "number" ? formatTrMoney(v) : String(v || "—");
                                return (
                                  <div key={change.field}>
                                    <b>{change.label}:</b>{" "}
                                    <span>{show(change.current)}</span>
                                    <em>→</em>
                                    <strong>{show(change.next)}</strong>
                                  </div>
                                );
                              })}
                            </details>
                          )}
                      </span>
                    </div>
                  ))}
                </div>
                <footer>
                  <button onClick={close}>İptal</button>
                  <button
                    className="primary"
                    disabled={busy || preview.summary.total === skipRows.length}
                    onClick={commit}
                  >
                    {busy
                      ? "Aktarılıyor…"
                      : preview.summary.incomplete > 0
                        ? `Eksik Bilgilerle Birlikte Aktar · ${preview.summary.total - skipRows.length} Personel`
                        : `Aktarımı Onayla · ${preview.summary.total - skipRows.length} Personel`}
                  </button>
                </footer>
              </>
            )}
          </>
        )}
        {result && (
          <div className="excel-result">
            <h3>
              {result.complete
                ? "Aktarım Tamamlandı"
                : "Aktarım Kontrollerle Tamamlandı"}
            </h3>
            <p>
              {result.total} satır {targetName} şirketi için işlendi.
            </p>
            <div>
              <Result label="Başarıyla Aktarılan" value={result.imported} />
              <Result
                label="Doğrulanan Sicil Kartı"
                value={result.verifiedCards}
              />
              <Result label="Güncellenen Personel" value={result.updated} />
              <Result label="Atlanan Personel" value={result.skipped} />
              <Result label="Hatalı Kayıt" value={result.errors} />
              <Result
                label="Eksik Bilgili Personel"
                value={result.incomplete}
              />
              <Result label="Yeni Departman" value={result.newDepartments} />
              <Result label="Yeni Pozisyon" value={result.newPositions} />
              <Result
                label="Yönetici Bulunamadı"
                value={result.unmatchedManagers}
              />
            </div>
            {result.errorRows.length > 0 && (
              <button onClick={downloadErrors}>
                ⇩ Hatalı Kayıtları Excel Olarak İndir
              </button>
            )}
            <button className="primary" onClick={close}>
              Oluşturulan Sicil Kartlarını Görüntüle
            </button>
          </div>
        )}
        {error && <div className="form-error excel-error">{error}</div>}
      </section>
    </div>
  );
}
function Result({ label, value }: { label: string; value: number }) {
  return (
    <article>
      <small>{label}</small>
      <strong>{value}</strong>
    </article>
  );
}
