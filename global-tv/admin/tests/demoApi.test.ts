import { AppError, ForbiddenError, ValidationError } from '../src/lib/api';
import { DemoAdminApi, MIN_GROUP, minGroup } from '../src/lib/demoApi';
import { DEMO_PASSWORD, createDemoState } from '../src/lib/demoData';

// Demo sunucu, gerçek sunucudaki yetki kurallarının aynısını uygulamalı:
// arayüz bir düğmeyi göstermeyi unutsa bile işlem burada reddedilir.

const NOW = new Date('2026-10-23T12:00:00Z');

async function as(email: string) {
  const api = new DemoAdminApi({ now: () => NOW });
  await api.signIn(email, DEMO_PASSWORD);
  return api;
}

/** Hata anahtarını (dil sözlüğündeki kod) doğrular. */
async function rejectsWith(p: Promise<unknown>, key: string) {
  const err = await p.then(() => null, (e: unknown) => e);
  expect(err).toBeInstanceOf(AppError);
  expect((err as AppError).key).toBe(key);
}

const channel = {
  slug: 'yeni-kanal', name: 'Yeni Kanal', countryCode: 'TR', category: 'news', language: 'tr', logoUrl: null,
  attribution: null, isActive: true, sortOrder: 100, streamUrl: 'https://ornek.com/a.m3u8',
};

describe('oturum', () => {
  it('normal kullanıcı panele giremez', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await rejectsWith(api.signIn('izleyici@demo.local', DEMO_PASSWORD), 'err.noPanelAccess');
  });

  it('hatalı şifre reddedilir', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await rejectsWith(api.signIn('admin@demo.local', 'yanlis'), 'err.credentials');
  });

  it('oturum yoksa hiçbir işlem yapılamaz', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await expect(api.dashboardStats()).rejects.toThrow(ForbiddenError);
  });
});

describe('içerik yöneticisi (editor)', () => {
  it('kanal ve yayın lisansı yönetir', async () => {
    const api = await as('editor@demo.local');
    const ch = await api.createChannel(channel);
    await api.createRight({ channelId: ch.id, rightsHolder: 'Yayıncı', licenseType: 'direct_agreement', allowedCountries: ['TR'],
      validFrom: '2026-10-01', validUntil: '2027-10-01', status: 'verified', notes: null });
    expect((await api.listChannels()).some((c) => c.slug === 'yeni-kanal')).toBe(true);
  });

  it('kullanıcı, topluluk, reklam, ayar ve denetim kaydına erişemez', async () => {
    const api = await as('editor@demo.local');
    await expect(api.listProfiles()).rejects.toThrow(ForbiddenError);
    await expect(api.moderateUser('u-5', 'ban')).rejects.toThrow(ForbiddenError);
    await expect(api.listRooms()).rejects.toThrow(ForbiddenError);
    await expect(api.deleteMessage('m-2')).rejects.toThrow(ForbiddenError);
    await expect(api.listAdPlacements()).rejects.toThrow(ForbiddenError);
    await expect(api.listSponsorships()).rejects.toThrow(ForbiddenError);
    await expect(api.saveSettings(await api.getSettings())).rejects.toThrow(ForbiddenError);
    await expect(api.listAudit()).rejects.toThrow(ForbiddenError);
  });

  it('raporları görür ama reklam istatistiklerini göremez', async () => {
    const api = await as('editor@demo.local');
    const r = await api.report(30);
    expect(r.watchByChannel.length).toBeGreaterThan(0);
    expect(r.ads).toBeNull();
  });

  it('kısa ad tekrarı ve tanımsız kategori reddedilir', async () => {
    const api = await as('editor@demo.local');
    await rejectsWith(api.createChannel({ ...channel, slug: 'demo-mux-bbb' }), 'err.slugTaken');
    await rejectsWith(api.createChannel({ ...channel, category: 'yok' }), 'err.categoryUnknown');
  });
});

describe('yayın lisansı belgeleri', () => {
  const pdf = (size = 1000, type = 'application/pdf') => new File([new Uint8Array(size)], 'sozlesme.pdf', { type });

  it('PDF yüklenir, belge adı kayda işlenir ve denetlenir', async () => {
    const api = await as('editor@demo.local');
    const r = await api.uploadRightDocument('r-1', pdf());
    expect(r.documentName).toBe('sozlesme.pdf');
    expect(await api.rightDocumentUrl('r-1')).toBeTruthy();
  });

  it('izin verilmeyen tür ve 10 MB üstü reddedilir', async () => {
    const api = await as('editor@demo.local');
    await rejectsWith(api.uploadRightDocument('r-1', pdf(10, 'application/zip')), 'err.fileType');
    await rejectsWith(api.uploadRightDocument('r-1', pdf(10 * 1024 * 1024 + 1)), 'err.fileSize');
  });

  it('moderatör belge yükleyemez', async () => {
    const api = await as('moderator@demo.local');
    await expect(api.uploadRightDocument('r-1', pdf())).rejects.toThrow(ForbiddenError);
  });
});

describe('moderatör ve topluluk', () => {
  it('susturur, şikâyet çözer; işlemler moderasyon kaydına düşer', async () => {
    const api = await as('moderator@demo.local');
    await api.moderateUser('u-5', 'mute', 'spam', 60);
    await api.resolveReport('rep-1', 'actioned', true);
    const msgs = await api.listMessages();
    expect(msgs.find((m) => m.id === 'm-2')?.isHidden).toBe(true);
    const log = await api.listModerationLog();
    expect(log.slice(0, 2).map((l) => l.action)).toEqual(['hide_message', 'mute']);
    expect(log[1]!.reason).toBe('spam');
  });

  it('mesajı kalıcı siler; şikâyet bağlantısı kopar, kayıt kalır', async () => {
    const api = await as('moderator@demo.local');
    await api.deleteMessage('m-4');
    expect((await api.listMessages()).some((m) => m.id === 'm-4')).toBe(false);
    expect((await api.listReports()).find((r) => r.id === 'rep-2')?.messageId).toBeNull();
    expect((await api.listModerationLog())[0]).toMatchObject({ action: 'delete_message', messageExcerpt: 'Herkes aptal burada' });
  });

  it('sohbet odasını kilitler ve yavaş modu ayarlar', async () => {
    const api = await as('moderator@demo.local');
    await api.updateRoom('ch-2', { isLocked: true, slowModeSeconds: 30 });
    const room = (await api.listRooms()).find((r) => r.channelId === 'ch-2')!;
    expect(room).toMatchObject({ isLocked: true, slowModeSeconds: 30 });
    expect(room.openReports).toBe(1);
    await rejectsWith(api.updateRoom('ch-2', { isLocked: false, slowModeSeconds: 999 }), 'err.slowMode');
  });

  it('kanal değiştiremez, rol veremez, yöneticiyi kısıtlayamaz, kendini değiştiremez', async () => {
    const api = await as('moderator@demo.local');
    await expect(api.createChannel(channel)).rejects.toThrow(ForbiddenError);
    await expect(api.setRole('u-5', 'admin')).rejects.toThrow(ForbiddenError);
    await rejectsWith(api.moderateUser('u-admin', 'ban'), 'err.adminOnly');
    await rejectsWith(api.moderateUser('u-mod', 'mute'), 'err.selfChange');
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
  });

  it('kendi rolünü değiştiremez ve son yönetici korunur', async () => {
    const admin = await as('admin@demo.local');
    await rejectsWith(admin.setRole('u-admin', 'user'), 'err.selfChange');
    await expect(admin.moderateUser('u-admin', 'ban')).rejects.toThrow(ForbiddenError);
  });

  it('her yönetici işlemi kim tarafından yapıldığıyla kaydedilir', async () => {
    const admin = await as('admin@demo.local');
    await admin.createChannel(channel);
    await admin.moderateUser('u-5', 'ban', 'tekrarlayan spam');
    await admin.saveSponsorship(null, { sponsorName: 'Sponsor', titleTr: 'Başlık', titleEn: 'Title', placement: 'home_featured',
      channelId: null, clickUrl: null, startsAt: '2026-11-01T00:00:00Z', endsAt: '2026-12-01T00:00:00Z', isActive: false, notes: null });
    const audit = await admin.listAudit();
    expect(audit.map((a) => a.entity)).toEqual(['sponsorships', 'profiles', 'channels']);
    expect(audit.every((a) => a.actorName === 'yonetici')).toBe(true);
    expect(audit[1]!.detail).toContain('tekrarlayan spam');
  });

  it('silinen mesajın tam içeriği denetim kaydında kanıt olarak kalır', async () => {
    const admin = await as('admin@demo.local');
    await admin.deleteMessage('m-2');
    expect((await admin.listAudit())[0]).toMatchObject({ entity: 'chat_messages', action: 'delete', detail: 'Ücretsiz kripto için linke tıkla!!!' });
  });

  it('ayar doğrulaması: varsayılan dil desteklenmeli, sürüm sırası doğru olmalı', async () => {
    const admin = await as('admin@demo.local');
    const s = await admin.getSettings();
    await expect(admin.saveSettings({ ...s, languages: { supported: ['tr'], default: 'en' } })).rejects.toThrow(ValidationError);
    await rejectsWith(admin.saveSettings({ ...s, appVersion: { ...s.appVersion, ios: { latest: '1.0.0', minSupported: '2.0.0' } } }), 'err.versionOrder');
  });

  it('reklam istatistiklerini görür (AdMob bağlanana kadar sıfır)', async () => {
    const admin = await as('admin@demo.local');
    expect((await admin.report(7)).ads).toEqual({ impressions: 0, clicks: 0 });
  });
});

describe('pano ve raporlar', () => {
  it('istatistikler demo veriyle tutarlı', async () => {
    const api = await as('moderator@demo.local');
    const s = await api.dashboardStats();
    expect(s.channelsTotal).toBe(5);
    expect(s.channelsLive).toBe(4); // süresi dolmuş lisansı olan kanal sayılmaz
    expect(s.rightsExpiring14d).toBe(1);
    expect(s.reportsOpen).toBe(2);
    expect(s.usersTotal).toBe(48);
    expect(s.activeUsers1d).toBeGreaterThan(0);
    expect(s.activeUsers1d).toBeLessThanOrEqual(s.activeUsers7d);
    expect(s.activeUsers7d).toBeLessThanOrEqual(s.usersTotal);
    expect(s.watchPerDay).toHaveLength(7);
    expect(s.watchMinutes24h).toBe(s.watchPerDay[6]!.count);
  });

  it('rapor dönemi gün sayısıyla tutarlı ve aynı veride kararlı', async () => {
    const a = await (await as('admin@demo.local')).report(30);
    const b = await (await as('admin@demo.local')).report(30);
    expect(a.activePerDay).toHaveLength(30);
    expect(a.signupsPerDay).toHaveLength(30);
    expect(a.messagesPerDay).toHaveLength(30);
    expect(a).toEqual(b); // sabit tohumlu demo verisi
    const platformTotal = a.watchByPlatform.reduce((n, p) => n + p.count, 0);
    const channelTotal = a.watchByChannel.reduce((n, c) => n + c.minutes, 0);
    expect(platformTotal).toBe(channelTotal);
  });

  it('normal kullanıcının oturumu olsa bile rapor alınamaz', async () => {
    const api = new DemoAdminApi({ now: () => NOW });
    await expect(api.report(7)).rejects.toThrow(ForbiddenError);
  });
});

describe('anonim ülke analitiği (sunucudaki admin_report ile aynı kural)', () => {
  it('eşiğin altındaki ülkeler OTHER altında birleşir', () => {
    expect(MIN_GROUP).toBe(5);
    expect(minGroup([{ key: 'TR', count: 9 }, { key: 'DE', count: 2 }, { key: 'US', count: 1 }]))
      .toEqual([{ key: 'TR', count: 9 }, { key: 'OTHER', count: 3 }]);
  });

  it('raporda hiçbir ülke 5 cihazdan az görünmez; aktif cihaz serisi dönem uzunluğunda', async () => {
    const r = await (await as('admin@demo.local')).report(30);
    expect(r.watchByCountry.length).toBeGreaterThan(1);
    for (const c of r.watchByCountry) if (c.key !== 'OTHER') expect(c.devices).toBeGreaterThanOrEqual(MIN_GROUP);
    expect(r.activeDevicesPerDay).toHaveLength(30);
  });
});
