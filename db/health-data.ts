type DocumentLike = { category?: unknown; name?: unknown };

const normalize = (value: unknown) =>
  String(value ?? "").trim().toLocaleLowerCase("tr");

const healthDocumentTerms = [
  "sağlık",
  "saglik",
  "medical",
  "medikal",
  "hastalık",
  "hastalik",
  "teşhis",
  "teshis",
  "tedavi",
  "doktor",
  "klinik",
  "muayene",
  "istirahat",
];

const personalHealthFieldNames = new Set([
  "bloodtype",
  "blood_type",
  "health",
  "medical",
  "diagnosis",
  "disease",
  "treatment",
  "kan grubu",
  "kangrubu",
  "sağlık",
  "saglik",
  "teşhis",
  "teshis",
  "tedavi",
  "hastalık",
  "hastalik",
]);

export function isHealthDocument(value: DocumentLike): boolean {
  const searchable = `${normalize(value.category)} ${normalize(value.name)}`;
  return healthDocumentTerms.some((term) => searchable.includes(term));
}

export function containsPersonalHealthFields(payload: Record<string, unknown>): boolean {
  return Object.keys(payload).some((key) => personalHealthFieldNames.has(normalize(key)));
}

export function withoutHealthDocuments<T extends DocumentLike>(rows: T[]): T[] {
  return rows.filter((row) => !isHealthDocument(row));
}
