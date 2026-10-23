import { ValidationError } from './api';
import { COUNTRY_CODE } from './rights';
import type { AdPlacementInput, AnnouncementInput, ChannelInput, RightInput, RoomSettingsInput, SponsorshipInput } from './types';

// Sunucudaki CHECK kısıtlarıyla aynı kurallar; kullanıcıya erken ve anlaşılır hata verir.
// Hata metinleri dil sözlüğündeki anahtarlarla verilir (i18n/tr.ts, i18n/en.ts).

export function validateChannel(input: ChannelInput): void {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(input.slug)) throw new ValidationError('err.slug');
  if (input.name.trim().length < 2) throw new ValidationError('err.name');
  if (!COUNTRY_CODE.test(input.countryCode)) throw new ValidationError('err.countryCode');
  if (!/^[a-z]{2}$/.test(input.language)) throw new ValidationError('err.languageCode');
  if (input.streamUrl && !input.streamUrl.startsWith('https://')) throw new ValidationError('err.httpsStream');
  if (input.logoUrl && !input.logoUrl.startsWith('https://')) throw new ValidationError('err.httpsLogo');
}

export function validateRight(input: RightInput): void {
  if (input.rightsHolder.trim().length < 2) throw new ValidationError('err.rightsHolder');
  if (input.allowedCountries.length === 0) throw new ValidationError('err.countriesRequired');
  const bad = input.allowedCountries.find((c) => !COUNTRY_CODE.test(c));
  if (bad) throw new ValidationError('err.countryInvalid', { code: bad });
  if (!input.validFrom || !input.validUntil) throw new ValidationError('err.datesRequired');
  if (input.validUntil < input.validFrom) throw new ValidationError('err.dateOrder');
}

export function validateAdPlacement(input: AdPlacementInput): void {
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(input.key)) throw new ValidationError('err.adKey');
  if (input.name.trim().length < 2) throw new ValidationError('err.name');
  if (input.frequencyCap !== null && (input.frequencyCap < 1 || input.frequencyCap > 100)) {
    throw new ValidationError('err.frequencyCap');
  }
}

export function validateSponsorship(input: SponsorshipInput): void {
  if (input.sponsorName.trim().length < 2) throw new ValidationError('err.name');
  if (!input.titleTr.trim() || !input.titleEn.trim()) throw new ValidationError('err.bilingualTitle');
  if (input.titleTr.length > 120 || input.titleEn.length > 120) throw new ValidationError('err.titleLength');
  if (input.clickUrl && !input.clickUrl.startsWith('https://')) throw new ValidationError('err.httpsLink');
  if (!input.startsAt || !input.endsAt) throw new ValidationError('err.datesRequired');
  if (input.endsAt <= input.startsAt) throw new ValidationError('err.endAfterStart');
}

export function validateRoom(input: RoomSettingsInput): void {
  if (!Number.isInteger(input.slowModeSeconds) || input.slowModeSeconds < 0 || input.slowModeSeconds > 300) {
    throw new ValidationError('err.slowMode');
  }
}

export function validateAnnouncement(input: AnnouncementInput): void {
  if (!input.titleTr.trim() || !input.titleEn.trim()) throw new ValidationError('err.bilingualTitle');
  if (input.titleTr.length > 120 || input.titleEn.length > 120) throw new ValidationError('err.titleLength');
  if (input.bodyTr.length > 1000 || input.bodyEn.length > 1000) throw new ValidationError('err.bodyLength');
  if (input.endsAt && input.endsAt <= input.startsAt) throw new ValidationError('err.endAfterStart');
}

const VERSION = /^\d+\.\d+\.\d+$/;

export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return Math.sign(d);
  }
  return 0;
}

export function validateVersion(latest: string, minSupported: string): void {
  if (!VERSION.test(latest) || !VERSION.test(minSupported)) throw new ValidationError('err.versionFormat');
  if (compareVersions(minSupported, latest) > 0) throw new ValidationError('err.versionOrder');
}
