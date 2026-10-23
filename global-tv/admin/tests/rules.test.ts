import { ValidationError } from '../src/lib/api';
import { addDays, channelHasValidRights, daysBetween, parseCountries, rightsHealth } from '../src/lib/rights';
import type { BroadcastRight } from '../src/lib/types';
import { compareVersions, validateChannel, validateRight, validateRoom, validateSponsorship, validateVersion } from '../src/lib/validation';

const right = (over: Partial<BroadcastRight> = {}): BroadcastRight => ({
  id: 'r', channelId: 'c', rightsHolder: 'Yayıncı A.Ş.', licenseType: 'direct_agreement', allowedCountries: ['TR'],
  validFrom: '2026-10-01', validUntil: '2026-12-31', status: 'verified', notes: null, documentName: null, ...over,
});

describe('yayın hakkı durumu', () => {
  it('sınır günleri dahil (sunucudaki between ile aynı)', () => {
    expect(rightsHealth(right(), '2026-10-01')).toBe('valid');
    expect(rightsHealth(right(), '2026-12-31')).toBe('expiring');
    expect(rightsHealth(right(), '2027-01-01')).toBe('expired');
    expect(rightsHealth(right(), '2026-09-30')).toBe('not_started');
  });

  it('14 gün uyarısı', () => {
    expect(rightsHealth(right(), '2026-12-16')).toBe('valid');
    expect(rightsHealth(right(), '2026-12-17')).toBe('expiring');
  });

  it('doğrulanmamış hak geçersiz sayılır', () => {
    expect(rightsHealth(right({ status: 'pending' }), '2026-11-01')).toBe('inactive');
    expect(channelHasValidRights([right({ status: 'revoked' })], 'c', '2026-11-01')).toBe(false);
    expect(channelHasValidRights([right()], 'c', '2026-11-01')).toBe(true);
  });

  it('tarih yardımcıları', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(daysBetween('2026-10-23', '2026-11-02')).toBe(10);
    expect(parseCountries('tr, de;nl  TR')).toEqual(['TR', 'DE', 'NL']);
  });
});

describe('doğrulama', () => {
  const channel = {
    slug: 'kanal-1', name: 'Kanal', countryCode: 'TR', category: 'news', language: 'tr', logoUrl: null,
    attribution: null, isActive: true, sortOrder: 1, streamUrl: 'https://ornek.com/a.m3u8',
  };

  it('yalnızca https yayın adresi kabul edilir', () => {
    expect(() => validateChannel(channel)).not.toThrow();
    expect(() => validateChannel({ ...channel, streamUrl: 'http://ornek.com/a.m3u8' })).toThrow(ValidationError);
  });

  it('geçersiz kısa ad ve ülke kodu reddedilir', () => {
    expect(() => validateChannel({ ...channel, slug: 'Büyük Harf' })).toThrow(ValidationError);
    expect(() => validateChannel({ ...channel, countryCode: 'TUR' })).toThrow(ValidationError);
  });

  it('yayın hakkı tarih ve ülke kuralları', () => {
    expect(() => validateRight(right({ validUntil: '2026-01-01' }))).toThrow('err.dateOrder');
    expect(() => validateRight(right({ allowedCountries: [] }))).toThrow('err.countriesRequired');
    expect(() => validateRight(right({ allowedCountries: ['TRK'] }))).toThrow('err.countryInvalid');
  });

  it('sürüm karşılaştırma', () => {
    expect(compareVersions('1.10.0', '1.9.9')).toBe(1);
    expect(() => validateVersion('1.0.0', '1.1.0')).toThrow(ValidationError);
    expect(() => validateVersion('1.2', '1.0.0')).toThrow(ValidationError);
    expect(() => validateVersion('1.2.0', '1.0.0')).not.toThrow();
  });
});

describe('topluluk ve sponsorluk kuralları', () => {
  it('yavaş mod 0–300 saniye (sunucudaki CHECK ile aynı)', () => {
    expect(() => validateRoom({ isLocked: false, slowModeSeconds: 300 })).not.toThrow();
    expect(() => validateRoom({ isLocked: false, slowModeSeconds: 301 })).toThrow('err.slowMode');
    expect(() => validateRoom({ isLocked: false, slowModeSeconds: -1 })).toThrow('err.slowMode');
  });

  it('sponsor bağlantısı https olmalı ve bitiş başlangıçtan sonra olmalı', () => {
    const sp = { sponsorName: 'Sponsor', titleTr: 'Başlık', titleEn: 'Title', placement: 'home_featured' as const, channelId: null,
      clickUrl: 'https://ornek.com', startsAt: '2026-11-01T00:00:00Z', endsAt: '2026-12-01T00:00:00Z', isActive: true, notes: null };
    expect(() => validateSponsorship(sp)).not.toThrow();
    expect(() => validateSponsorship({ ...sp, clickUrl: 'http://ornek.com' })).toThrow('err.httpsLink');
    expect(() => validateSponsorship({ ...sp, endsAt: sp.startsAt })).toThrow('err.endAfterStart');
  });
});
