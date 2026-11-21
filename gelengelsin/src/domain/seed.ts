// DEMO VERİ — tüm kullanıcılar ve planlar örnektir (isDemo: true).
// Tarihler bugüne göre hesaplanır; "Bugün" ve "Hafta sonu" filtreleri hep dolu görünür.

import { CITIES } from './catalog';
import type { ChatMessage, DB, JoinRequest, Plan, User } from './types';

const at = (base: Date, dayOffset: number, h: number, m = 0) =>
  new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset, h, m).toISOString();

/** "Bugün" planı: hedef saat yakınsa ya da geçtiyse ~45 dk sonrasına (çeyrek saate yuvarlı) kayar. */
const todayAt = (base: Date, h: number) => {
  const t = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h);
  if (t.getTime() - base.getTime() > 60 * 60_000) return t.toISOString();
  const later = new Date(base.getTime() + 45 * 60_000);
  later.setMinutes(Math.ceil(later.getMinutes() / 15) * 15, 0, 0);
  return later.toISOString();
};

const nextDow = (base: Date, dow: number) => {
  const d = (dow - base.getDay() + 7) % 7;
  return d; // 0 = bugün
};

export const DEMO_USERS: User[] = [
  { id: 'u_ayse', name: 'Ayşe Kaya', birthYear: 1996, cityId: 'istanbul', bio: 'Kadıköylü. Tiyatro, caz ve yeni kahveciler.', interests: ['kultur', 'muzik', 'yeme', 'seyahat'], avatarColor: '#E14D1F', verified18: true, isDemo: true, joinedAt: '2026-09-02T10:00:00.000Z' },
  { id: 'u_mert', name: 'Mert Demir', birthYear: 1994, cityId: 'istanbul', bio: 'Hafta sonları doğa, hafta içi halı saha.', interests: ['spor', 'acikhava', 'yeme'], avatarColor: '#2F6FEB', verified18: true, isDemo: true, joinedAt: '2026-09-10T10:00:00.000Z' },
  { id: 'u_zeynep', name: 'Zeynep Arslan', birthYear: 1999, cityId: 'istanbul', bio: 'Etkinlik kovalayan bir topluluk insanı.', interests: ['kultur', 'topluluk', 'hobi'], avatarColor: '#8B3FD9', verified18: true, isDemo: true, joinedAt: '2026-08-21T10:00:00.000Z' },
  { id: 'u_can', name: 'Can Yılmaz', birthYear: 1991, cityId: 'istanbul', bio: 'Maç günü stadyumdayım, gerisi caz.', interests: ['spor', 'muzik'], avatarColor: '#0F8A6B', verified18: true, isDemo: true, joinedAt: '2026-07-30T10:00:00.000Z' },
  { id: 'u_elif', name: 'Elif Şahin', birthYear: 1998, cityId: 'istanbul', bio: 'Yürüyüş rotaları ve fotoğraf.', interests: ['acikhava', 'hobi', 'kesif'], avatarColor: '#C2185B', verified18: true, isDemo: true, joinedAt: '2026-10-01T10:00:00.000Z' },
  { id: 'u_deniz', name: 'Deniz (Moderatör)', birthYear: 1990, cityId: 'istanbul', bio: 'GelenGelsin topluluk ekibi. Şikâyetleri inceler.', interests: ['topluluk'], avatarColor: '#3D3A36', verified18: true, isModerator: true, isDemo: true, joinedAt: '2026-06-01T10:00:00.000Z' },
];

export function createSeed(base = new Date()): DB {
  const sat = nextDow(base, 6);
  const sunday = nextDow(base, 0);
  // Hafta sonu saati geçtiyse bir sonraki haftaya kaydır.
  const future = (off: number, h: number, m = 0) => {
    const t = at(base, off, h, m);
    return new Date(t) > base ? t : at(base, off + 7, h, m);
  };
  const created = new Date(base.getTime() - 2 * 86400_000).toISOString();

  const P = (p: Omit<Plan, 'status' | 'createdAt' | 'updatedAt' | 'isDemo' | 'cityId'> & Partial<Plan>): Plan => ({
    cityId: 'istanbul', status: 'active', createdAt: created, updatedAt: created, isDemo: true, ...p,
  });

  const plans: Plan[] = [
    P({ id: 'p_mac', ownerId: 'u_can', type: 'going', category: 'spor', title: 'Kadıköy’de maç öncesi buluşup stada geçelim',
      description: 'Maçtan 2 saat önce buluşup bir şeyler yiyelim, sonra birlikte stada yürüyelim. Taraftar havası garanti.',
      district: 'Kadıköy', areaLabel: 'Kadıköy çarşı, Boğa heykeli civarı', meetingPointExact: 'Boğa heykelinin önü, Kadıköy Rıhtım tarafı',
      startAt: todayAt(base, 18), capacity: 4,
      costNote: 'Maç bileti kişi başı ~750 TL (demo). Herkes kendi biletini alır.', eventUrl: 'https://example.com/demo-bilet' }),
    P({ id: 'p_tiyatro', ownerId: 'u_zeynep', type: 'going', category: 'kultur', title: 'Cumartesi tiyatroya gidiyorum, gelen gelsin',
      description: 'Beyoğlu’nda yeni bir komedi oyunu. Oyundan sonra kısa bir sohbet-yürüyüş planım var.',
      district: 'Beyoğlu', areaLabel: 'İstiklal Caddesi, Tünel tarafı', meetingPointExact: 'Tünel meydanı, eski tramvay durağı',
      startAt: future(sat, 20, 0), capacity: 3,
      costNote: 'Bilet ~600 TL (demo). Gişeden veya online kendin alıyorsun.', eventUrl: 'https://example.com/demo-tiyatro' }),
    P({ id: 'p_halisaha', ownerId: 'u_can', type: 'need_people', category: 'spor', title: 'Halı sahaya iki kişi lazım',
      description: '7’ye 7 oynuyoruz, iki kişi eksiğiz. Seviye orta, keyif odaklı.',
      district: 'Ataşehir', areaLabel: 'Ataşehir, Atatürk Mah. spor tesisleri', meetingPointExact: 'Yıldız Halı Saha, 3 numaralı saha (demo)',
      startAt: at(base, 1, 21, 0), capacity: 2, costNote: 'Saha ücreti kişi başı ~250 TL, maç sonunda bölüşülür (demo).' }),
    P({ id: 'p_belgrad', ownerId: 'u_elif', type: 'going', category: 'acikhava', title: 'Pazar Belgrad Ormanı’nda yürüyüş',
      description: '7 km’lik kolay parkur. Su ve atıştırmalık getir, sonra gözlemeye otururuz.',
      district: 'Sarıyer', areaLabel: 'Belgrad Ormanı', meetingPointExact: 'Neşet Suyu girişi, otopark yanı',
      startAt: future(sunday, 9, 30), capacity: 6 }),
    P({ id: 'p_kahve', ownerId: 'u_mert', type: 'going', category: 'yeme', title: 'İş çıkışı yeni bir kahveci deneyelim',
      description: 'Beşiktaş’ta yeni açılan üçüncü dalga bir yer var, birlikte deneyelim.',
      district: 'Beşiktaş', areaLabel: 'Beşiktaş çarşı', meetingPointExact: 'Beşiktaş iskelesi önü, saat kulesi',
      startAt: at(base, 2, 18, 30), capacity: 3, costNote: 'Herkes kendi kahvesini öder.' }),
    P({ id: 'p_community', ownerId: 'u_zeynep', type: 'meet_there', category: 'topluluk', title: 'Three Hundred Community etkinliği öncesi kahve içelim',
      description: 'Etkinliğe gidenlerle önce tanışalım, sonra birlikte salona geçelim.',
      district: 'Şişli', areaLabel: 'Şişli, Mecidiyeköy', meetingPointExact: 'Etkinlik binasının yanındaki kahveci (demo)',
      startAt: at(base, 5, 18, 0), capacity: 4, eventUrl: 'https://example.com/demo-etkinlik', costNote: 'Etkinlik kaydı ücretsiz (demo).' }),
    P({ id: 'p_roma', ownerId: 'u_ayse', type: 'meet_there', category: 'seyahat', title: 'Aynı tarihlerde Roma’da olanlarla kahve içelim',
      description: 'Bu tarihlerde Roma’dayım. Orada olan İstanbullularla bir sabah Trastevere’de kahve içmek isterim.',
      district: 'Kadıköy', areaLabel: 'Roma, Trastevere', meetingPointExact: 'Piazza di Santa Maria in Trastevere, çeşmenin önü',
      destination: { city: 'Roma', country: 'İtalya' },
      startAt: at(base, 12, 10, 0), endAt: at(base, 16, 18, 0), capacity: 5,
      costNote: 'Uçuş ve konaklama herkesin kendine ait. Kahve kişi başı ~4 € (demo).' }),
    P({ id: 'p_foto', ownerId: 'u_elif', type: 'need_people', category: 'hobi', title: 'Moda sahilinde gün batımı fotoğraf yürüyüşü',
      description: 'Telefon kamerası da olur. Kompozisyon üzerine konuşa konuşa yürüyelim.',
      district: 'Kadıköy', areaLabel: 'Moda sahili', meetingPointExact: 'Moda iskelesi, çay bahçesi girişi',
      startAt: future(sat, 16, 30), capacity: 2 }),
    P({ id: 'p_caz', ownerId: 'u_can', type: 'going', category: 'muzik', title: 'Salı akşamı caz konserine gidiyorum',
      description: 'Küçük bir kulüpte trio konseri. Erken gelirsek iyi masa buluruz.',
      district: 'Beyoğlu', areaLabel: 'Asmalımescit', meetingPointExact: 'Asmalımescit, kulübün kapısı (demo)',
      startAt: at(base, nextDow(base, 2) || 7, 21, 0), capacity: 2, costNote: 'Giriş ~400 TL (demo).', eventUrl: 'https://example.com/demo-caz' }),
    P({ id: 'p_sahil', ownerId: 'u_mert', type: 'need_people', category: 'topluluk', title: 'Kadıköy’de sahil temizliğine 5 gönüllü lazım',
      description: 'Eldiven ve çuval bizden. 2 saat sürecek, sonra çay ısmarlıyoruz.',
      district: 'Kadıköy', areaLabel: 'Kalamış sahili', meetingPointExact: 'Kalamış Parkı, büyük çınarın altı',
      startAt: future(sunday, 11, 0), capacity: 5 }),
    P({ id: 'p_kesif', ownerId: 'u_zeynep', type: 'going', category: 'kesif', title: 'Balat’ta renkli sokaklar turu',
      description: 'Fener-Balat arası yavaş bir keşif yürüyüşü, bol fotoğraf molası.',
      district: 'Fatih', areaLabel: 'Fener-Balat', meetingPointExact: 'Fener iskelesi önü',
      startAt: at(base, 3, 14, 0), capacity: 4 }),
    // Geçmiş plan: "Plan gerçekleşti mi?" sorusunu ve metrikleri göstermek için.
    P({ id: 'p_gecmis', ownerId: 'u_ayse', type: 'going', category: 'yeme', title: 'Karaköy’de sokak lezzetleri turu',
      description: 'Balık ekmekten midyeye küçük bir lezzet turu.',
      district: 'Beyoğlu', areaLabel: 'Karaköy', meetingPointExact: 'Karaköy iskelesi',
      startAt: at(base, -3, 19, 0), capacity: 3, createdAt: at(base, -6, 10, 0), updatedAt: at(base, -6, 10, 0) }),
  ];

  const R = (id: string, planId: string, userId: string, status: JoinRequest['status'], msg?: string): JoinRequest => ({
    id, planId, userId, status, message: msg, createdAt: created, updatedAt: created,
  });

  const requests: JoinRequest[] = [
    R('r1', 'p_tiyatro', 'u_elif', 'approved', 'Ben de çoktan beri gitmek istiyordum!'),
    R('r2', 'p_belgrad', 'u_zeynep', 'approved'),
    R('r3', 'p_foto', 'u_zeynep', 'approved'),
    R('r4', 'p_foto', 'u_can', 'approved'),
    R('r5', 'p_roma', 'u_zeynep', 'pending', 'O tarihlerde ben de Roma’dayım!'),
    R('r6', 'p_mac', 'u_elif', 'approved'),
    R('r7', 'p_gecmis', 'u_mert', 'approved'),
    R('r8', 'p_gecmis', 'u_zeynep', 'approved'),
    R('r9', 'p_sahil', 'u_can', 'approved'),
  ];

  const M = (planId: string, userId: string | null, text: string, minsAgo: number): ChatMessage => ({
    id: `m_${planId}_${minsAgo}`, planId, userId, text, createdAt: new Date(base.getTime() - minsAgo * 60_000).toISOString(),
  });

  const messages: ChatMessage[] = [
    M('p_tiyatro', null, 'Zeynep Arslan planı açtı. Onaylanan katılımcılar bu sohbete katılacak.', 2900),
    M('p_tiyatro', null, 'Elif Şahin ekibe katıldı. Hoş geldin!', 2000),
    M('p_tiyatro', 'u_zeynep', 'Selam Elif! Biletini aldın mı?', 1900),
    M('p_tiyatro', 'u_elif', 'Aldım, 7. sıra. Görüşürüz 🎭', 1850),
    M('p_gecmis', null, 'Ayşe Kaya planı açtı. Onaylanan katılımcılar bu sohbete katılacak.', 8000),
    M('p_gecmis', 'u_ayse', 'Harika bir akşamdı, teşekkürler!', 4000),
    M('p_mac', null, 'Can Yılmaz planı açtı. Onaylanan katılımcılar bu sohbete katılacak.', 2800),
    M('p_mac', 'u_can', 'Formaları unutmayın 💛💙', 300),
  ];

  return {
    version: 1,
    cities: CITIES,
    users: DEMO_USERS,
    plans,
    requests,
    messages,
    notifications: [],
    reports: [
      { id: 'rep_demo', reporterId: 'u_elif', target: { kind: 'plan', planId: 'p_kesif' }, reason: 'Spam / reklam', note: 'Demo şikâyet: açıklamada reklam var mı kontrol edin.', status: 'open', createdAt: created },
    ],
    blocks: [],
    outcomes: [{ planId: 'p_gecmis', userId: 'u_zeynep', happened: true, createdAt: created }],
  };
}
