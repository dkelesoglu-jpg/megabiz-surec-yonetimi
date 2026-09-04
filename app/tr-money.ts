export function parseTrMoney(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  let raw = String(value ?? "")
    .trim()
    .replace(/\s|₺|TL/gi, "");
  if (!raw) return null;
  if (raw.includes(",")) raw = raw.replaceAll(".", "").replace(",", ".");
  else if (/^-?\d{1,3}(\.\d{3})+$/.test(raw)) raw = raw.replaceAll(".", "");
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? Math.round(parsed * 100) / 100 : null;
}

export function formatTrMoney(value: unknown): string {
  const parsed = parseTrMoney(value);
  if (parsed === null) return "";
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(parsed);
}
