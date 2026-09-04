import { getDb } from ".";

export const SERIES = {
  employee: { label: "Personel Sicil No", key: "SIC", digits: 6, table: "employees", column: "employee_no" },
  department: { label: "Departman Kodu", key: "DEP", digits: 3, table: "departments", column: "code" },
  position: { label: "Pozisyon Kodu", key: "POS", digits: 3, table: "positions", column: "code" },
  asset: { label: "Zimmet No", key: "ZMT", digits: 5, table: "assets", column: "asset_code" },
  leave_request: { label: "İzin Talep No", key: "IZN", digits: 6 },
  advance_request: { label: "Avans/Borç Talep No", key: "AVN", digits: 6 },
  performance_review: { label: "Performans Değerlendirme No", key: "PRF", digits: 6 },
  candidate: { label: "İşe Alım/Aday No", key: "ADY", digits: 6 },
} as const;
export type SeriesType = keyof typeof SERIES;

const companyPrefix = (companyId: string) =>
  companyId === "mega-global-energy"
    ? "MG"
    : companyId === "megabiz"
      ? "MB"
      : companyId
          .split(/[^a-z0-9]+/i)
          .filter(Boolean)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .slice(0, 4) || "HR";
const parseCode = (value: string) => {
  const match = value.trim().match(/^(.*?)(\d+)$/);
  return match
    ? { prefix: match[1], number: Number(match[2]), digits: match[2].length }
    : null;
};
const format = (prefix: string, number: number, digits: number) =>
  `${prefix}${String(number).padStart(digits, "0")}`;

export async function ensureNumberSeries(companyId: string, type: SeriesType) {
  const config = SERIES[type], now = new Date().toISOString(), db = getDb();
  let existingValues: string[] = [];
  if ("table" in config) {
    const { data } = await db.from(config.table).select(config.column).eq("company_id", companyId);
    existingValues = (data || []).map((row: Record<string, unknown>) => String(row[config.column] || ""));
  }
  const parsed = existingValues.map(parseCode).filter((value): value is NonNullable<typeof value> => Boolean(value));
  const highest = parsed.sort((a, b) => b.number - a.number)[0];
  const prefix = highest?.prefix || `${companyPrefix(companyId)}-${config.key}-`;
  const digits = Math.max(config.digits, highest?.digits || 0);
  const lastUsed = highest?.number || 0;

  await db.from("number_series").upsert(
    { company_id: companyId, series_type: type, prefix, start_number: 1, last_used: lastUsed, digits, updated_at: now },
    { onConflict: "company_id,series_type", ignoreDuplicates: true },
  );
  await db
    .from("number_series")
    .update({ last_used: lastUsed, prefix, digits, updated_at: now })
    .eq("company_id", companyId)
    .eq("series_type", type)
    .lt("last_used", lastUsed);

  return getNumberSeries(companyId, type);
}

export async function getNumberSeries(companyId: string, type: SeriesType) {
  const { data: row } = await getDb()
    .from("number_series")
    .select("id, company_id, series_type, prefix, start_number, last_used, digits, updated_by, updated_at")
    .eq("company_id", companyId)
    .eq("series_type", type)
    .maybeSingle();
  if (!row) throw new Error("Numara serisi oluşturulamadı");
  const nextNumber = Math.max(Number(row.start_number), Number(row.last_used) + 1);
  return {
    id: row.id,
    companyId: row.company_id,
    seriesType: row.series_type,
    prefix: row.prefix,
    startNumber: row.start_number,
    lastUsed: row.last_used,
    digits: row.digits,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
    nextNumber,
    nextValue: format(String(row.prefix), nextNumber, Number(row.digits)),
    label: SERIES[type].label,
  };
}

export async function listNumberSeries(companyId: string) {
  return Promise.all((Object.keys(SERIES) as SeriesType[]).map((type) => ensureNumberSeries(companyId, type)));
}

export async function nextNumber(companyId: string, type: SeriesType) {
  const db = getDb();
  for (let attempt = 0; attempt < 30; attempt++) {
    const series = await ensureNumberSeries(companyId, type),
      current = Number(series.lastUsed),
      number = Math.max(Number(series.startNumber), current + 1),
      value = format(String(series.prefix), number, Number(series.digits)),
      now = new Date().toISOString();

    // İyimser eşzamanlılık kontrolü: last_used hâlâ beklenen değerdeyse güncelle.
    // Aynı anda başka bir istek numarayı almışsa 0 satır döner, tekrar denenir.
    const { data: updated } = await db
      .from("number_series")
      .update({ last_used: number, updated_at: now })
      .eq("company_id", companyId)
      .eq("series_type", type)
      .eq("last_used", current)
      .select("id")
      .maybeSingle();
    if (!updated) continue;

    const { error: historyError } = await db
      .from("number_series_history")
      .insert({ company_id: companyId, series_type: type, number, formatted_value: value, created_at: now });
    if (historyError) continue;
    return value;
  }
  throw new Error("Numara üretilemedi; lütfen tekrar deneyin");
}

export async function registerExistingNumber(companyId: string, type: SeriesType, value: string) {
  const parsed = parseCode(value);
  if (!parsed) return;
  const now = new Date().toISOString(), db = getDb();
  await ensureNumberSeries(companyId, type);
  await db
    .from("number_series_history")
    .upsert(
      { company_id: companyId, series_type: type, number: parsed.number, formatted_value: value, created_at: now },
      { onConflict: "company_id,series_type,formatted_value", ignoreDuplicates: true },
    );
  await db
    .from("number_series")
    .update({ last_used: parsed.number, prefix: parsed.prefix, digits: parsed.digits, updated_at: now })
    .eq("company_id", companyId)
    .eq("series_type", type)
    .lt("last_used", parsed.number);
}
