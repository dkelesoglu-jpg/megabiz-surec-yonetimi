import { ValidationError } from './api';
import { COUNTRY_CODE } from './rights';
import type { AdPlacementInput, AnnouncementInput, ChannelInput, RightInput } from './types';

// Sunucudaki CHECK kısıtlarıyla aynı kurallar; kullanıcıya erken ve anlaşılır hata verir.

export function validateChannel(input: ChannelInput): void {
  if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(input.slug)) {
    throw new ValidationError('Kısa ad yalnızca küçük harf, rakam ve tire içerebilir (2–41 karakter).');
  }
  if (input.name.trim().length < 2) throw new ValidationError('Kanal adı en az 2 karakter olmalı.');
  if (!COUNTRY_CODE.test(input.countryCode)) throw new ValidationError('Ülke kodu 2 büyük harf olmalı (ör. TR).');
  if (!/^[a-z]{2}$/.test(input.language)) throw new ValidationError('Dil kodu 2 küçük harf olmalı (ör. tr).');
  if (input.streamUrl && !input.streamUrl.startsWith('https://')) {
    throw new ValidationError('Yayın adresi https:// ile başlamalı.');
  }
  if (input.logoUrl && !input.logoUrl.startsWith('https://')) {
    throw new ValidationError('Logo adresi https:// ile başlamalı.');
  }
}

export function validateRight(input: RightInput): void {
  if (input.rightsHolder.trim().length < 2) throw new ValidationError('Hak sahibi zorunlu.');
  if (input.allowedCountries.length === 0) throw new ValidationError('En az bir ülke seçilmeli.');
  const bad = input.allowedCountries.find((c) => !COUNTRY_CODE.test(c));
  if (bad) throw new ValidationError(`Geçersiz ülke kodu: ${bad}`);
  if (!input.validFrom || !input.validUntil) throw new ValidationError('Başlangıç ve bitiş tarihi zorunlu.');
  if (input.validUntil < input.validFrom) throw new ValidationError('Bitiş tarihi başlangıçtan önce olamaz.');
}

export function validateAdPlacement(input: AdPlacementInput): void {
  if (!/^[a-z][a-z0-9_]{2,40}$/.test(input.key)) {
    throw new ValidationError('Anahtar küçük harfle başlamalı; harf, rakam ve alt çizgi içerebilir.');
  }
  if (input.name.trim().length < 2) throw new ValidationError('Ad zorunlu.');
  if (input.frequencyCap !== null && (input.frequencyCap < 1 || input.frequencyCap > 100)) {
    throw new ValidationError('Gösterim sınırı 1–100 arasında olmalı.');
  }
}

export function validateAnnouncement(input: AnnouncementInput): void {
  if (!input.titleTr.trim() || !input.titleEn.trim()) throw new ValidationError('Türkçe ve İngilizce başlık zorunlu.');
  if (input.titleTr.length > 120 || input.titleEn.length > 120) throw new ValidationError('Başlık en fazla 120 karakter.');
  if (input.bodyTr.length > 1000 || input.bodyEn.length > 1000) throw new ValidationError('Metin en fazla 1000 karakter.');
  if (input.endsAt && input.endsAt <= input.startsAt) throw new ValidationError('Bitiş, başlangıçtan sonra olmalı.');
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
  if (!VERSION.test(latest) || !VERSION.test(minSupported)) {
    throw new ValidationError('Sürüm biçimi 1.2.3 olmalı.');
  }
  if (compareVersions(minSupported, latest) > 0) {
    throw new ValidationError('En düşük desteklenen sürüm, en son sürümden büyük olamaz.');
  }
}
