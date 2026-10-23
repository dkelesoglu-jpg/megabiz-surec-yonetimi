import type { BroadcastRight } from './types';

export type RightsHealth = 'valid' | 'expiring' | 'expired' | 'not_started' | 'inactive';

export const EXPIRY_WARNING_DAYS = 14;

/** Tarihleri YYYY-MM-DD olarak karşılaştırır (saat dilimi kaymasından etkilenmez). */
export function todayIso(now = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(fromIso: string, toIso: string): number {
  return Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / 86_400_000);
}

/** Bir yayın hakkının bugünkü durumu. Sunucudaki channel_has_valid_rights ile aynı kural. */
export function rightsHealth(right: Pick<BroadcastRight, 'status' | 'validFrom' | 'validUntil'>, today: string): RightsHealth {
  if (right.status !== 'verified') return 'inactive';
  if (today < right.validFrom) return 'not_started';
  if (today > right.validUntil) return 'expired';
  if (daysBetween(today, right.validUntil) <= EXPIRY_WARNING_DAYS) return 'expiring';
  return 'valid';
}

/** Kanalın uygulamada görünüp görünmeyeceği (en az bir geçerli hak). */
export function channelHasValidRights(rights: BroadcastRight[], channelId: string, today: string): boolean {
  return rights.some((r) => r.channelId === channelId && ['valid', 'expiring'].includes(rightsHealth(r, today)));
}

export const COUNTRY_CODE = /^[A-Z]{2}$/;

export function parseCountries(text: string): string[] {
  return [...new Set(text.split(/[\s,;]+/).map((c) => c.trim().toUpperCase()).filter(Boolean))];
}
