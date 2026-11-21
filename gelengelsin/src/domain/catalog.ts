import type { CategoryId, City, PlanType } from './types';

export const PLAN_TYPES: Record<
  PlanType,
  { label: string; short: string; helper: string; titleHint: string; emoji: string }
> = {
  going: {
    label: 'Ben gidiyorum',
    short: 'Gidiyorum',
    helper: 'Zaten gidiyorsun; isteyen sana katılsın. Gelen gelsin!',
    titleHint: 'Cumartesi tiyatroya gidiyorum, gelen gelsin',
    emoji: '🚶',
  },
  need_people: {
    label: 'Ekibe kişi lazım',
    short: 'Kişi lazım',
    helper: 'Ekibin eksik mi? Kaç kişi lazım olduğunu yaz, kalan yer kartta açıkça görünsün.',
    titleHint: 'Halı sahaya iki kişi lazım',
    emoji: '🙋',
  },
  meet_there: {
    label: 'Orada buluşalım',
    short: 'Buluşalım',
    helper: 'Aynı etkinliğe ya da şehre gidenler orada buluşsun. Herkes kendi gelir.',
    titleHint: 'Aynı tarihlerde Roma’da olanlarla kahve içelim',
    emoji: '📍',
  },
};

export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'spor', label: 'Spor ve maç', emoji: '⚽' },
  { id: 'kultur', label: 'Kültür ve sanat', emoji: '🎭' },
  { id: 'muzik', label: 'Müzik ve etkinlik', emoji: '🎵' },
  { id: 'yeme', label: 'Yeme içme', emoji: '☕' },
  { id: 'acikhava', label: 'Açık hava', emoji: '🌲' },
  { id: 'kesif', label: 'Şehir keşfi', emoji: '🏙️' },
  { id: 'seyahat', label: 'Seyahat', emoji: '✈️' },
  { id: 'hobi', label: 'Hobi ve öğrenme', emoji: '🎨' },
  { id: 'topluluk', label: 'Topluluk ve gönüllülük', emoji: '🤝' },
];

export const categoryOf = (id: CategoryId) => CATEGORIES.find((c) => c.id === id)!;

export const CITIES: City[] = [
  {
    id: 'istanbul',
    name: 'İstanbul',
    country: 'Türkiye',
    active: true,
    districts: [
      'Adalar', 'Ataşehir', 'Bakırköy', 'Beşiktaş', 'Beykoz', 'Beyoğlu', 'Eyüpsultan',
      'Fatih', 'Kadıköy', 'Kartal', 'Maltepe', 'Sarıyer', 'Şişli', 'Üsküdar', 'Zeytinburnu',
    ],
  },
  // Veri modeli şehirden bağımsız: yeni şehir eklemek için active: true yapmak yeterli.
  { id: 'ankara', name: 'Ankara', country: 'Türkiye', active: false, districts: ['Çankaya', 'Kızılay'] },
  { id: 'izmir', name: 'İzmir', country: 'Türkiye', active: false, districts: ['Alsancak', 'Karşıyaka'] },
];

export const REPORT_REASONS = [
  'Sahte veya yanıltıcı plan',
  'Taciz ya da rahatsız edici davranış',
  'Spam / reklam',
  'Ticari satış veya ücretli hizmet',
  '18 yaş altı kullanıcı şüphesi',
  'Diğer',
];
