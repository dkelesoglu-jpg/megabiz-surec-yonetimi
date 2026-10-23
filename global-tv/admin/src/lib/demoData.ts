import { addDays, todayIso } from './rights';
import type {
  AdPlacement,
  AppSettings,
  BroadcastRight,
  Category,
  Channel,
  ChatMessage,
  Profile,
  Report,
  Role,
} from './types';

/** Demo hesapları. Yalnızca demo modunda geçerlidir; gerçek sunucuda kullanılmaz. */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_ACCOUNTS: { id: string; email: string; username: string; role: Role }[] = [
  { id: 'u-admin', email: 'admin@demo.local', username: 'yonetici', role: 'admin' },
  { id: 'u-editor', email: 'editor@demo.local', username: 'icerik_ekibi', role: 'editor' },
  { id: 'u-mod', email: 'moderator@demo.local', username: 'moderator_ayse', role: 'moderator' },
  { id: 'u-viewer', email: 'izleyici@demo.local', username: 'izleyici42', role: 'user' },
];

export interface DemoState {
  categories: Category[];
  channels: Channel[];
  rights: BroadcastRight[];
  profiles: (Profile & { email: string })[];
  messages: ChatMessage[];
  reports: (Report & { reporterId: string })[];
  ads: AdPlacement[];
  settings: AppSettings;
  announcements: import('./types').Announcement[];
}

/** supabase/seed.sql ile aynı demo kanallar + panel için örnek kullanıcı/sohbet verisi. */
export function createDemoState(now = new Date()): DemoState {
  const today = todayIso(now);
  const iso = (minutesAgo: number) => new Date(now.getTime() - minutesAgo * 60_000).toISOString();

  const channels: Channel[] = [
    ch('ch-1', 'demo-apple-bipbop', 'Apple HLS Test (BipBop)', 'US', 'other', 'en', 10,
      'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_adv_example_hevc/master.m3u8',
      'Apple HLS developer example stream'),
    ch('ch-2', 'demo-mux-bbb', 'Big Buck Bunny', 'NL', 'kids', 'en', 20,
      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', '© Blender Foundation, CC BY 3.0 · stream: Mux test streams'),
    ch('ch-3', 'demo-mux-tos', 'Tears of Steel', 'NL', 'entertainment', 'en', 30,
      'https://test-streams.mux.dev/tos_ismc/main.m3u8', '© Blender Foundation, CC BY 3.0 · stream: Mux test streams'),
    ch('ch-4', 'demo-tr-haber', 'Demo Haber TR', 'TR', 'news', 'tr', 40,
      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', 'Yer tutucu: lisanslı kanal bulunana kadar demo akış'),
    ch('ch-5', 'demo-expired', 'Süresi Dolmuş Demo', 'TR', 'sports', 'tr', 50,
      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', null),
  ];

  const rights: BroadcastRight[] = [
    rt('r-1', 'ch-1', 'Apple Inc. (HLS developer example)', ['TR', 'US', 'GB', 'DE', 'NL'], '2026-10-01', '2027-03-31'),
    rt('r-2', 'ch-2', 'Blender Foundation (CC BY 3.0)', ['TR', 'US', 'GB', 'DE', 'NL'], '2026-10-01', '2027-03-31'),
    rt('r-3', 'ch-3', 'Blender Foundation (CC BY 3.0)', ['TR', 'US', 'GB', 'DE', 'NL'], '2026-10-01', '2027-03-31'),
    // Bitişi yaklaşan hak (panel uyarısını göstermek için bugüne göre hesaplanır)
    rt('r-4', 'ch-4', 'Blender Foundation (CC BY 3.0)', ['TR'], addDays(today, -30), addDays(today, 9)),
    rt('r-5', 'ch-5', 'Test', ['TR'], '2025-01-01', '2025-12-31'),
  ];

  const profiles: DemoState['profiles'] = [
    ...DEMO_ACCOUNTS.map((a, i) => ({
      id: a.id, email: a.email, username: a.username, role: a.role, countryCode: 'TR',
      isBanned: false, mutedUntil: null, createdAt: iso(60 * 24 * (40 - i)),
    })),
    pr('u-5', 'spam_hesap', 'DE', iso(60 * 24 * 2)),
    pr('u-6', 'futbolsever', 'TR', iso(60 * 24 * 5)),
    pr('u-7', 'film_kurdu', 'NL', iso(60 * 24 * 12)),
    pr('u-8', 'night_owl', 'US', iso(60 * 3)),
  ];

  const messages: ChatMessage[] = [
    msg('m-1', 'ch-2', 'u-6', 'futbolsever', 'Bu bölüm çok güzel 👏', iso(20)),
    msg('m-2', 'ch-2', 'u-5', 'spam_hesap', 'Ücretsiz kripto için linke tıkla!!!', iso(15)),
    msg('m-3', 'ch-4', 'u-7', 'film_kurdu', 'Haber bülteni ne zaman başlıyor?', iso(60 * 5)),
    msg('m-4', 'ch-4', 'u-5', 'spam_hesap', 'Herkes aptal burada', iso(60 * 6)),
    msg('m-5', 'ch-3', 'u-8', 'night_owl', 'Great visuals!', iso(60 * 30)),
  ];

  const reports: DemoState['reports'] = [
    { id: 'rep-1', reporterId: 'u-6', reporterName: 'futbolsever', messageId: 'm-2', reportedUserId: 'u-5',
      reason: 'spam', details: null, status: 'open', createdAt: iso(10) },
    { id: 'rep-2', reporterId: 'u-7', reporterName: 'film_kurdu', messageId: 'm-4', reportedUserId: 'u-5',
      reason: 'abuse', details: 'Sürekli hakaret ediyor', status: 'open', createdAt: iso(60 * 5) },
  ];

  const ads: AdPlacement[] = [
    { id: 'ad-1', key: 'channel_list_banner', name: 'Kanal listesi banner', platform: 'all', format: 'banner',
      provider: 'admob', unitId: null, isTest: true, isEnabled: false, frequencyCap: null,
      notes: 'Beta: yalnızca test reklamı' },
    { id: 'ad-2', key: 'channel_open_interstitial', name: 'Kanal açılışı geçiş reklamı', platform: 'all',
      format: 'interstitial', provider: 'admob', unitId: null, isTest: true, isEnabled: false, frequencyCap: 3,
      notes: 'Oturum başına en fazla 3' },
  ];

  return {
    categories: [
      cat('news', 'Haber', 'News', 10), cat('sports', 'Spor', 'Sports', 20),
      cat('entertainment', 'Eğlence', 'Entertainment', 30), cat('kids', 'Çocuk', 'Kids', 40),
      cat('music', 'Müzik', 'Music', 50), cat('documentary', 'Belgesel', 'Documentary', 60),
      cat('other', 'Diğer', 'Other', 90),
    ],
    channels,
    rights,
    profiles,
    messages,
    reports,
    ads,
    settings: {
      languages: { supported: ['tr', 'en'], default: 'tr' },
      appVersion: { android: { latest: '1.0.0', minSupported: '1.0.0' }, ios: { latest: '1.0.0', minSupported: '1.0.0' } },
      maintenance: { enabled: false, messageTr: '', messageEn: '' },
    },
    announcements: [],
  };
}

/** Panodaki günlük mesaj grafiği için tutarlı demo dizisi (son 7 gün). */
export function demoMessagesPerDay(now = new Date()): { date: string; count: number }[] {
  const counts = [42, 57, 38, 71, 64, 88, 53];
  return counts.map((count, i) => ({ date: addDays(todayIso(now), i - 6), count }));
}

function ch(id: string, slug: string, name: string, countryCode: string, category: string, language: string,
  sortOrder: number, streamUrl: string, attribution: string | null): Channel {
  return { id, slug, name, countryCode, category, language, sortOrder, streamUrl, attribution, logoUrl: null, isActive: true };
}

function rt(id: string, channelId: string, rightsHolder: string, allowedCountries: string[], validFrom: string,
  validUntil: string): BroadcastRight {
  return { id, channelId, rightsHolder, licenseType: 'demo_test', allowedCountries, validFrom, validUntil,
    status: 'verified', notes: null };
}

function pr(id: string, username: string, countryCode: string, createdAt: string): DemoState['profiles'][number] {
  return { id, username, email: `${username}@ornek.local`, role: 'user', countryCode, isBanned: false,
    mutedUntil: null, createdAt };
}

function msg(id: string, channelId: string, userId: string, authorName: string, body: string, createdAt: string): ChatMessage {
  return { id, channelId, userId, authorName, body, isHidden: false, createdAt };
}

function cat(key: string, nameTr: string, nameEn: string, sortOrder: number): Category {
  return { key, nameTr, nameEn, sortOrder, isActive: true };
}
