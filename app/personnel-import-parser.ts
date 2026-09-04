export const normalizeExcelHeader = (value: unknown) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("tr-TR");

export function personnelRecords(rows: unknown): Record<string, unknown>[] {
  const safeRows = Array.isArray(rows)
    ? rows.filter((row): row is unknown[] => Array.isArray(row))
    : [];
  const headerIndex = safeRows.findIndex(
    (row) =>
      row.some((cell) => normalizeExcelHeader(cell) === "sicil no") ||
      row.some((cell) => normalizeExcelHeader(cell) === "t.c. kimlik no"),
  );
  if (headerIndex < 0)
    throw new Error(
      "Excel başlık satırı bulunamadı. Sistem şablonunu kullanın.",
    );
  const headers = (safeRows[headerIndex] ?? []).map((value) =>
    String(value ?? "")
      .trim()
      .replace(/\s+/g, " "),
  );
  return safeRows
    .slice(headerIndex + 1)
    .filter((row) => row.some((value) => String(value ?? "").trim()))
    .map((row) =>
      Object.fromEntries(
        headers
          .map((header, index) => [header, row[index] ?? ""])
          .filter(([header]) => Boolean(header)),
      ),
    );
}
