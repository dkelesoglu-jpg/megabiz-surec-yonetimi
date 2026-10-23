import { addDays, todayIso } from './rights';
import type {
  AdPlacement,
  Announcement,
  AppSettings,
  BroadcastRight,
  Category,
  Channel,
  ChatMessage,
  DayCount,
  ModerationLogEntry,
  Profile,
  Report,
  Role,
  RoomSettingsInput,
  Sponsorship,
} from './types';

/** Demo hesapları. Yalnızca demo modunda geçerlidir; gerçek sunucuda kullanılmaz. */
export const DEMO_PASSWORD = 'demo1234';
export const DEMO_ACCOUNTS: { id: string; email: string; username: string; role: Role }[] = [
  { id: 'u-admin', email: 'admin@demo.local', username: 'yonetici', role: 'admin' },
  { id: 'u-editor', email: 'editor@demo.local', username: 'icerik_ekibi', role: 'editor' },
  { id: 'u-mod', email: 'moderator@demo.local', username: 'moderator_ayse', role: 'moderator' },
  { id: 'u-viewer', email: 'izleyici@demo.local', username: 'izleyici42', role: 'user' },
];

export interface WatchRow {
  day: string;
  channelId: string;
  platform: 'android' | 'ios';
  minutes: number;
  sessions: number;
}

export interface DemoState {
  categories: Category[];
  channels: Channel[];
  rights: BroadcastRight[];
  documents: Record<string, { name: string; url: string }>;
  profiles: (Profile & { email: string })[];
  activity: { userId: string; day: string }[];
  watch: WatchRow[];
  messageHistory: DayCount[];
  messages: ChatMessage[];
  reports: (Report & { reporterId: string })[];
  rooms: Record<string, RoomSettingsInput>;
  modLog: ModerationLogEntry[];
  ads: AdPlacement[];
  sponsorships: Sponsorship[];
  settings: AppSettings;
  announcements: Announcement[];
}

/** Sabit tohumlu sözde rastgele sayı üreteci: demo verisi her açılışta aynıdır. */
function prng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COUNTRIES = ['TR', 'TR', 'TR', 'TR', 'TR', 'DE', 'DE', 'NL', 'GB', 'US'];

/** supabase/seed.sql ile aynı demo kanallar + panel için örnek kullanıcı, izlenme ve sohbet verisi. */
export function createDemoState(now = new Date()): DemoState {
  const rnd = prng(20261023);
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
    // Bitişi yaklaşan lisans (panel uyarısını göstermek için bugüne göre hesaplanır)
    rt('r-4', 'ch-4', 'Blender Foundation (CC BY 3.0)', ['TR'], addDays(today, -30), addDays(today, 9)),
    rt('r-5', 'ch-5', 'Test', ['TR'], '2025-01-01', '2025-12-31'),
  ];

  // Personel + gerçekçi büyüklükte örnek izleyici topluluğu (son 60 günde kaydolmuş)
  const profiles: DemoState['profiles'] = [
    ...DEMO_ACCOUNTS.map((a, i) => ({
      id: a.id, email: a.email, username: a.username, role: a.role, countryCode: 'TR',
      isBanned: false, mutedUntil: null, createdAt: iso(60 * 24 * (75 - i)),
    })),
    pr('u-5', 'spam_hesap', 'DE', iso(60 * 24 * 2)),
    pr('u-6', 'futbolsever', 'TR', iso(60 * 24 * 5)),
    pr('u-7', 'film_kurdu', 'NL', iso(60 * 24 * 12)),
    pr('u-8', 'night_owl', 'US', iso(60 * 3)),
  ];
  for (let i = 1; i <= 40; i++) {
    const daysAgo = Math.floor(rnd() * 60);
    profiles.push(pr(`u-s${i}`, `izleyici_${String(i).padStart(2, '0')}`, COUNTRIES[Math.floor(rnd() * COUNTRIES.length)]!,
      iso(60 * 24 * daysAgo + Math.floor(rnd() * 600))));
  }

  // Günlük aktiflik: her kullanıcı kayıt gününden itibaren bazı günlerde uygulamayı açar
  const activity: DemoState['activity'] = [];
  for (const p of profiles) {
    const joined = p.createdAt.slice(0, 10);
    const habit = 0.15 + rnd() * 0.6;
    for (let d = 89; d >= 0; d--) {
      const day = addDays(today, -d);
      if (day >= joined && rnd() < habit) activity.push({ userId: p.id, day });
    }
  }

  // İzlenme: kanal ve platform başına günlük toplam (kullanıcılar + misafirler), hafta sonu artışıyla
  const popularity: Record<string, number> = { 'ch-1': 0.6, 'ch-2': 1.4, 'ch-3': 1.0, 'ch-4': 1.8 };
  const watch: WatchRow[] = [];
  for (let d = 89; d >= 0; d--) {
    const day = addDays(today, -d);
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 1.35 : 1;
    const growth = 0.55 + (89 - d) / 120;
    for (const [channelId, pop] of Object.entries(popularity)) {
      for (const [platform, share] of [['android', 0.62], ['ios', 0.38]] as const) {
        const sessions = Math.round(pop * weekend * growth * share * (18 + rnd() * 10));
        watch.push({ day, channelId, platform, sessions, minutes: Math.round(sessions * (14 + rnd() * 12)) });
      }
    }
  }

  const messageHistory: DayCount[] = [];
  for (let d = 89; d >= 1; d--) {
    messageHistory.push({ day: addDays(today, -d), count: Math.round((25 + rnd() * 40) * (0.6 + (89 - d) / 110)) });
  }

  const messages: ChatMessage[] = [
    msg('m-1', 'ch-2', 'u-6', 'futbolsever', 'Bu bölüm çok güzel 👏', iso(20)),
    msg('m-2', 'ch-2', 'u-5', 'spam_hesap', 'Ücretsiz kripto için linke tıkla!!!', iso(15)),
    msg('m-3', 'ch-4', 'u-7', 'film_kurdu', 'Haber bülteni ne zaman başlıyor?', iso(60 * 5)),
    msg('m-4', 'ch-4', 'u-5', 'spam_hesap', 'Herkes aptal burada', iso(60 * 6)),
    msg('m-5', 'ch-3', 'u-8', 'night_owl', 'Great visuals!', iso(60 * 30)),
    msg('m-6', 'ch-4', 'u-s3', 'izleyici_03', 'Hava durumu kısmını kaçırdım, tekrar var mı?', iso(45)),
    msg('m-7', 'ch-2', 'u-s7', 'izleyici_07', 'Çocuklar bayılıyor bu kanala', iso(90)),
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

  const sponsorships: Sponsorship[] = [
    { id: 'sp-1', sponsorName: 'Örnek Sponsor A.Ş.', titleTr: 'Dünya Kupası özel yayınları', titleEn: 'World Cup specials',
      placement: 'home_featured', channelId: null, clickUrl: 'https://ornek.com/kampanya',
      startsAt: new Date(`${addDays(today, 30)}T00:00:00Z`).toISOString(), endsAt: new Date(`${addDays(today, 60)}T00:00:00Z`).toISOString(),
      isActive: false, notes: 'Örnek kayıt — sözleşme yok' },
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
    documents: {},
    profiles,
    activity,
    watch,
    messageHistory,
    messages,
    reports,
    rooms: { 'ch-4': { isLocked: false, slowModeSeconds: 10 } },
    modLog: [
      { id: 'log-1', moderatorName: 'moderator_ayse', targetName: 'spam_hesap', action: 'mute', reason: 'Tekrarlayan bağlantı paylaşımı',
        messageExcerpt: null, createdAt: iso(60 * 24 * 2) },
    ],
    ads,
    sponsorships,
    settings: {
      languages: { supported: ['tr', 'en'], default: 'tr' },
      appVersion: { android: { latest: '1.0.0', minSupported: '1.0.0' }, ios: { latest: '1.0.0', minSupported: '1.0.0' } },
      maintenance: { enabled: false, messageTr: '', messageEn: '' },
    },
    announcements: [],
  };
}

function ch(id: string, slug: string, name: string, countryCode: string, category: string, language: string,
  sortOrder: number, streamUrl: string, attribution: string | null): Channel {
  return { id, slug, name, countryCode, category, language, sortOrder, streamUrl, attribution, logoUrl: null, isActive: true };
}

function rt(id: string, channelId: string, rightsHolder: string, allowedCountries: string[], validFrom: string,
  validUntil: string): BroadcastRight {
  return { id, channelId, rightsHolder, licenseType: 'demo_test', allowedCountries, validFrom, validUntil,
    status: 'verified', notes: null, documentName: null };
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
