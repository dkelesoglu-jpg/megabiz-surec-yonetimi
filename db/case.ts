// Supabase, tablo kolon adlarını (snake_case) olduğu gibi döndürür.
// Önceki Drizzle şeması alanları camelCase (companyId, firstName, ...) olarak
// tanımlıyordu ve frontend bileşenleri hâlâ camelCase bekliyor.
// Bu yardımcılar, tasarıma dokunmadan API katmanında dönüşümü yapar.

function toCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

function toSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

function transform<T>(value: T, fn: (key: string) => string): T {
  if (Array.isArray(value)) {
    return value.map((item) => transform(item, fn)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        fn(k),
        transform(v, fn),
      ]),
    ) as T;
  }
  return value;
}

/** DB'den (snake_case) gelen satırları frontend'in beklediği camelCase'e çevirir. */
export function camelizeKeys<T>(value: T): T {
  return transform(value, toCamel);
}

/** Frontend'den (camelCase) gelen payload'ları DB kolon adlarına (snake_case) çevirir. */
export function snakeizeKeys<T>(value: T): T {
  return transform(value, toSnake);
}
