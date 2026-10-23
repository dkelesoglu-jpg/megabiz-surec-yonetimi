import { ForbiddenError, ValidationError } from '../src/lib/api';
import { DemoAdminApi } from '../src/lib/demoApi';
import { DEMO_PASSWORD, createDemoState } from '../src/lib/demoData';

// Demo sunucu, gerçek sunucudaki yetki kurallarının aynısını uygulamalı:
// arayüz bir düğmeyi göstermeyi unutsa bile işlem burada reddedilir.

const NOW = new Date('2026-10-23T12:00:00Z');

async function as(email: string) {
  const api = new DemoAdminApi({ now: () => NOW });
  await api.signIn(email, DEMO_PASSWORD);
  return api;
}

const channel = {
  slug: 'yeni-kanal', name: 'Yeni Kanal', countryCode: 'TR', category: 'news', language: 'tr', logoUrl: null,
  attribution: null, isActive: true, sortOrder: 100, streamUrl: 'https://ornek.com/a.m3u8',
};

describe('oturum', () => {
  it('normal kullanıcı panele giremez', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await expect(api.signIn('izleyici@demo.local', DEMO_PASSWORD)).rejects.toThrow(ForbiddenError);
  });

  it('hatalı şifre reddedilir', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await expect(api.signIn('admin@demo.local', 'yanlis')).rejects.toThrow(ValidationError);
  });

  it('oturum yoksa hiçbir işlem yapılamaz', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await expect(api.dashboardStats()).rejects.toThrow(ForbiddenError);
  });
});

describe('içerik yöneticisi (editor)', () => {
  it('kanal ve yayın hakkı yönetir', async () => {
    const api = await as('editor@demo.local');
    const ch = await api.createChannel(channel);
    await api.createRight({ channelId: ch.id, rightsHolder: 'Yayıncı', licenseType: 'direct_agreement', allowedCountries: ['TR'],
      validFrom: '2026-10-01', validUntil: '2027-10-01', status: 'verified', notes: null });
    expect((await api.listChannels()).some((c) => c.slug === 'yeni-kanal')).toBe(true);
  });

  it('kullanıcı, reklam, ayar ve denetim kaydına erişemez', async () => {
    const api = await as('editor@demo.local');
    await expect(api.listProfiles()).rejects.toThrow(ForbiddenError);
    await expect(api.moderateUser('u-5', 'ban')).rejects.toThrow(ForbiddenError);
    await expect(api.listAdPlacements()).rejects.toThrow(ForbiddenError);
    await expect(api.saveSettings(await api.getSettings())).rejects.toThrow(ForbiddenError);
    await expect(api.listAudit()).rejects.toThrow(ForbiddenError);
  });

  it('kısa ad tekrarı ve tanımsız kategori reddedilir', async () => {
    const api = await as('editor@demo.local');
    await expect(api.createChannel({ ...channel, slug: 'demo-mux-bbb' })).rejects.toThrow('başka bir kanalda');
    await expect(api.createChannel({ ...channel, category: 'yok' })).rejects.toThrow('Kategori tanımlı değil');
  });
});

describe('moderatör', () => {
  it('susturur, yasaklar, şikâyet çözer', async () => {
    const api = await as('moderator@demo.local');
    await api.moderateUser('u-5', 'mute', 'spam', 60);
    await api.resolveReport('rep-1', 'actioned', true);
    const msgs = await api.listMessages();
    expect(msgs.find((m) => m.id === 'm-2')?.isHidden).toBe(true);
    expect((await api.listProfiles()).find((p) => p.id === 'u-5')?.mutedUntil).not.toBeNull();
  });

  it('kanal değiştiremez, rol veremez, yöneticiyi kısıtlayamaz, kendini değiştiremez', async () => {
    const api = await as('moderator@demo.local');
    await expect(api.createChannel(channel)).rejects.toThrow(ForbiddenError);
    await expect(api.setRole('u-5', 'admin')).rejects.toThrow(ForbiddenError);
    await expect(api.moderateUser('u-admin', 'ban')).rejects.toThrow('Yöneticileri');
    await expect(api.moderateUser('u-mod', 'mute')).rejects.toThrow('Kendi durumunuzu');
  });
});

describe('yönetici', () => {
  it('rol atar; rolü düşürülen kişinin yetkisi açık oturumda bile anında kalkar', async () => {
    const state = createDemoState(NOW); // iki oturum aynı sunucu verisini paylaşır
    const admin = new DemoAdminApi({ now: () => NOW, state });
    const mod = new DemoAdminApi({ now: () => NOW, state });
    await admin.signIn('admin@demo.local', DEMO_PASSWORD);
    await mod.signIn('moderator@demo.local', DEMO_PASSWORD);
    await expect(mod.listReports()).resolves.toHaveLength(2);

    await admin.setRole('u-mod', 'user');
    await expect(mod.listReports()).rejects.toThrow(ForbiddenError);

    await admin.setRole('u-5', 'moderator');
    expect((await admin.listProfiles()).find((p) => p.id === 'u-5')?.role).toBe('moderator');
  });

  it('kendi rolünü değiştiremez ve son yönetici korunur', async () => {
    const admin = await as('admin@demo.local');
    await expect(admin.setRole('u-admin', 'user')).rejects.toThrow('Kendi rolünüzü');
    await expect(admin.moderateUser('u-admin', 'ban')).rejects.toThrow(ForbiddenError);
  });

  it('her yönetici işlemi kim tarafından yapıldığıyla kaydedilir', async () => {
    const admin = await as('admin@demo.local');
    await admin.createChannel(channel);
    await admin.moderateUser('u-5', 'ban', 'tekrarlayan spam');
    await admin.saveAdPlacement(null, { key: 'test_alan', name: 'Test', platform: 'all', format: 'banner', provider: 'admob',
      unitId: null, isTest: true, isEnabled: false, frequencyCap: null, notes: null });
    const audit = await admin.listAudit();
    expect(audit.map((a) => a.entity)).toEqual(['ad_placements', 'profiles', 'channels']);
    expect(audit.every((a) => a.actorName === 'yonetici')).toBe(true);
    expect(audit[1]!.summary).toContain('tekrarlayan spam');
  });

  it('ayar doğrulaması: varsayılan dil desteklenmeli, sürüm sırası doğru olmalı', async () => {
    const admin = await as('admin@demo.local');
    const s = await admin.getSettings();
    await expect(admin.saveSettings({ ...s, languages: { supported: ['tr'], default: 'en' } })).rejects.toThrow(ValidationError);
    await expect(admin.saveSettings({ ...s, appVersion: { ...s.appVersion, ios: { latest: '1.0.0', minSupported: '2.0.0' } } }))
      .rejects.toThrow(ValidationError);
  });
});

describe('pano', () => {
  it('istatistikler demo veriyle tutarlı', async () => {
    const api = await as('moderator@demo.local');
    const s = await api.dashboardStats();
    expect(s.channelsTotal).toBe(5);
    expect(s.channelsLive).toBe(4); // süresi dolmuş hakkı olan kanal sayılmaz
    expect(s.rightsExpiring14d).toBe(1);
    expect(s.reportsOpen).toBe(2);
    expect(s.messagesPerDay).toHaveLength(7);
  });
});
