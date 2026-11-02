# Sabit Ürün Kararları (Karar Kaydı)

**Kaynak:** Ürün Konsepti ve Fizibilite Raporu — Ayrılık Sonrası Sosyal Destek Platformu (`urun-konsepti-ve-fizibilite-raporu.md`)
**Durum:** Onaylı. Bu belge, raporla çeliştiği her noktada **raporun önüne geçer.**
**Son güncelleme:** 2 Kasım 2026

Bu kararlar bundan sonraki tüm ürün, UX, teknik mimari, veri modeli ve geliştirme çalışmalarında sabittir. Yeniden tartışmaya açılmaz. Ciddi bir teknik, hukuki ya da güvenlik çelişkisi görülürse ilgili kararın altına **⚠️ Kritik uyarı** olarak eklenir.

---

## ÜK-01 · Konumlandırma

- **Kategori:** Community-first Social Discovery / Topluluk Öncelikli Sosyal Keşif. Uygulama "dating app" olarak konumlandırılmaz.
- **Vaat:** Ayrılık, boşanma ya da uzun bir ilişkinin bitişinden sonra konuşulabilecek, sosyalleşilebilecek, anlaşıldığını hissedilen güvenli bir topluluk.
- **Arkadaşlık, dostluk ve romantik ilişki** olası sonuçlardır; temel vaat "sevgili bulmak" değildir.
- **Ana ilke:** Önce konuşmak, sonra ilişkinin nereye gideceğine iki kişinin birlikte karar vermesi.

**Uygulamaya yansıması:**
- Mağaza kategorisi: Sosyal Ağ. Mağaza metinlerinde, görsellerde ve reklamlarda dating dili ve görseli kullanılmaz.
- Arayüz dili: "Eşleşme" yerine "Bağlantı", "Reddet" yerine "Nazikçe geç".

---

## ÜK-02 · Kademeli İletişim Modeli

| Seviye | Yetenek (`capability`) | İçerik |
|---|---|---|
| 1 | `text` | Metin, emoji, tepkiler, hazır sohbet başlatıcılar, mesaj yanıtlama. Bağlantı kurulunca açıktır (davetin kabulü = Seviye 1 onayı) |
| 1.5 | `voice_message` | Sesli mesaj |
| 2 | `photo` | Görsel paylaşım |
| 3 | `voice_call` | Sesli görüşme |
| 4 | `video_call` | Görüntülü görüşme |
| 5 | `meet` | Yüz yüze buluşma planlama |

**Değişmez kurallar:**
1. Hiçbir seviye sistem tarafından otomatik açılmaz.
2. Her seviye, iki tarafın **birbirinden bağımsız ve gizli** açık onayıyla açılır (kör onay).
3. Bir taraf kabul etmezse diğer tarafa ret bilgisi verilmez; yalnızca "henüz açılmadı" durumu görünür.
4. Her iki taraf da bir seviyeyi istediği zaman **tek taraflı** kapatabilir.
5. Sesli mesaj ile fotoğraf birbirinden bağımsızdır. Sesli mesajı açmış kullanıcı fotoğraf paylaşmak zorunda değildir.
6. Sistem yalnızca uygunluk oluştuğunda soruyu **sorar**: "Sesli mesajlaşmayı açmak ister misin?" Sormak, açmak anlamına gelmez.

**Teknik model:** Seviyeler veri modelinde **bağımsız, çift onaylı yetenek anahtarları** (`connection_permissions`) olarak tutulur. Seviye numarası yalnızca arayüzde önerilen sırayı ve uygunluk eşiklerini belirler. Tüm yetki kontrolleri sunucu tarafında yapılır (RLS + Edge Function).

**Netleştirilmesi gereken (karar değil, uygulama detayı):**
- *Sıra bağımlılığı:* Seviye 2'yi teklif edebilmek için Seviye 1.5'in açık olması gerekir mi? **Önerim: Hayır.** 1.5 ve 2 birbirinden bağımsız teklif edilebilsin, 3 ve sonrası ise sıralı ilerlesin. Böylece "fotoğraf istemiyorum ama sesli mesaj olur" ya da tersi mümkün olur.
- *Seviye 1.5 uygunluk eşiği (başlangıç hipotezi):* İki taraf da en az 10 mesaj yazmış ve bağlantı en az 24 saatlik olmalı. Beta verisiyle kalibre edilir.
- *Sesli mesaj moderasyonu:* Sesli mesajlar sunucuda Türkçe konuşmadan metne çevrilip (transkript) metin moderasyonundan geçirilir. Transkriptler yalnızca moderasyon için kısa süre saklanır. Bu işlem aydınlatma metninde belirtilir.

---

## ÜK-03 · MVP Kapsamı: Sosyal Akış Faz 2'de

**MVP hipotezi:**
> "Ayrılık sonrası insanlar güvenli, kontrollü ve kademeli bir ortamda birbirleriyle anlamlı sohbetler kurar ve platforma geri gelir mi?"

| MVP'de var | MVP'de yok |
|---|---|
| Kullanıcı kaydı · Doğrulama · Profil (avatar dahil) · Keşfet · Sohbet daveti · Birebir sohbet · Kademeli iletişim izinleri (1, 1.5, 2) · Odalar · 4–8 kişilik gruplar (masalar) · Sohbet başlatıcılar · Güvenlik · Moderasyon · Yönetim paneli | Sosyal akış (Faz 2) · Sesli/görüntülü görüşme, yani Seviye 3–4 (Faz 2) · Buluşma planlayıcı, yani Seviye 5 (Faz 3) · Sanal hediyeler · AI kişisel emoji · Premium ödeme (altyapı hazırlanır, beta ücretsiz) |

> Seviye 3–5 MVP'de arayüzde "yakında" olarak bile gösterilmez. Merdiven, MVP'de 1 → 1.5 → 2 olarak çalışır; veri modeli tüm seviyeleri baştan destekler.

**Hipotezin ölçümü (MVP başarı metrikleri):**
- *North Star:* Haftalık anlamlı sohbet sayısı. Tanım: iki taraflı, en az 3 farklı günde, karşılıklı 10+ mesaj içeren birebir ya da grup sohbeti.
- *Tutunma (retention):* D7 ve D30.
- *Güven:* "Burada kendimi güvende hissediyorum" anket skoru.

---

## ÜK-04 · Davet Hakkı Satılmaz

- Günlük sohbet daveti limiti **ücretsiz ve Premium için aynıdır.** Başlangıç değeri günde 10'dur; beta verisiyle ayarlanır, ama her iki grup için her zaman eşit kalır.
- **Etik ilke:** Para ödeyen kullanıcı insanlara daha fazla erişim satın alamaz.
- **Hiçbir zaman ücretli olmayacaklar:** Güvenlik, gizlilik, mesajlaşma, temel insan bağlantısı (keşfet, davet, tüm iletişim seviyeleri).
- **Premium gelir alanları:** Gelişmiş filtreler, gizli mod, avatar kişiselleştirme, özel soru desteleri, grup oluşturma araçları, gelişmiş grup özellikleri, kozmetik özellikler, Premium avatar ve emoji seçenekleri.

> ⚠️ **Kritik uyarı 1: "Gizli mod" iki karar arasında sınırda duruyor.**
> "Gizlilik asla ücretli olmaz" ilkesi ile "gizli mod Premium'dur" kararı çelişebilir. Ayrıca yanlış tasarlanırsa gizli mod bir **takip (stalking) aracına** dönüşür: kişi kendini göstermeden başkalarının profillerine bakabilir, örneğin eski eşini arayabilir.
> **Çözüm önerisi (kararı değiştirmeden):**
> - *Ücretsiz kalan temel gizlilik:* Keşfet'ten tamamen çıkma, mola modu, alan bazında gizleme, rehberden/eski eşten gizlenme, son görülme ve okundu gizleme.
> - *Premium "gizli mod":* Kullanıcı Keşfet'te başkalarına önerilmez; yalnızca kendi davet ettiği ya da bağlantı kurduğu kişiler onu görür.
> - *Zorunlu güvenlik kuralları:* Gizli moddaki kullanıcı (a) kendisini rehber eşleşmesiyle gizlemiş ya da engellemiş kişileri asla göremez, (b) profilleri "görünmez gezme" amacıyla sınırsız açamaz (günlük profil görüntüleme limiti herkesle aynı), (c) profil ziyaretleri hiçbir kullanıcıya zaten gösterilmediği için ek bir "görünmezlik" avantajı elde etmez.

> **Not:** Raporda önerilen *davranışa göre artan davet limiti* (ör. kabul oranı yüksek kullanıcıya ek hak) bu kararla çelişmez, çünkü parayla değil davranışla verilir ve herkese aynı kural uygulanır. Ancak MVP'de uygulanmayacak; sabit ve eşit limitle başlanacak.

---

## ÜK-05 · Avatar MVP'de

- Kullanıcı Keşfet'te gerçek fotoğraf yerine **avatarla** görünebilir.
- **Ön koşul:** Avatar kullanan kullanıcı arka planda canlı selfie (liveness) ile doğrulanmış olmalı ve profilinde **doğrulanmış rozeti** görünmelidir. Avatar, doğrulamadan kaçış yolu değildir.
- **Akış:** Keşfet'te avatar → Seviye 2 açıldıktan sonra kullanıcı **isterse** gerçek fotoğrafını o bağlantıya açar. Fotoğraf görünürlüğü bağlantı bazındadır, herkese birden açılmaz.
- **MVP avatar sistemi basit tutulur:** Hazır parçalı avatar oluşturucu (yüz şekli, ten tonu, saç, aksesuar, arka plan rengi) ya da kontrollü hazır avatar seti. AI avatar ve kişisel emoji üretimi sonraki fazlara bırakılır.

> ⚠️ **Kritik uyarı 2: Zorunlu selfie doğrulaması ve KVKK'da açık rıza.**
> Canlı selfie ve yüz eşleştirme **biyometrik veri**, yani özel nitelikli kişisel veridir. Bu veri büyük olasılıkla yalnızca **açık rızayla** işlenebilir. Açık rızanın geçerli olması için *özgür iradeyle* verilmesi gerekir; hizmetin tamamı rızaya bağlanırsa rıza sakatlanabilir.
> **Çözüm önerisi (kararı değiştirmeden):**
> - Uygulamaya giriş ve topluluk özellikleri (odaları okuma ve yazma, masalara katılma) **doğrulamasız** da kullanılabilir. Doğrulama ise **güvenlik gerektiren yeteneklerin** ön koşulu olur: avatarla Keşfet'te görünmek, davet göndermek, Seviye 2 ve sonrası. Bu ayrım, rızanın neden istendiğini meşru ve orantılı kılar.
> - Selfie verisi doğrulamadan hemen sonra silinir; yalnızca sonuç (doğrulandı/doğrulanmadı + tarih) saklanır. Sağlayıcı sözleşmesinde veriyi saklamama ve model eğitiminde kullanmama şartı aranır.
> - Doğrulama sağlayıcısı yurt dışındaysa KVKK m.9 kapsamında standart sözleşme imzalanır ve Kurul'a bildirim yapılır.
> - **MVP öncesi bir KVKK avukatından yazılı görüş alınmalı.** Bu uyarının hukuki kesinliği, avukat görüşüyle teyit edilmeden geliştirmeye başlanmamalı.

**Ek güvenlik önerisi:** Seviye 5'e (buluşma, Faz 3) geçebilmek için iki tarafın da ya en az bir görüntülü görüşme yapmış ya da birbirine gerçek fotoğraf açmış olması şartı koyulsun. Avatarla tanışılan birini ilk kez buluşmada görmek, güvenlik ve beklenti açısından risklidir.

---

## ÜK-06 · İlk Lansman İstanbul

- Kapalı beta ve kullanıcı yoğunluğu oluşturma çalışması **İstanbul merkezli** yürütülür.
- Teknik olarak Türkiye'nin her yerinden kayıt mümkündür. Ancak topluluk operasyonu, moderasyon, kullanıcı edinimi, masa organizasyonu, pilot etkinlikler ve kurucu topluluk İstanbul'da yoğunlaşır.
- **Beta hedefi:** İstanbul'da 500–1.000 kaliteli ve kontrollü (davetli) kullanıcı.
- **Sonraki şehirler:** 2. İzmir, 3. Ankara.

### İstanbul dışındaki kullanıcıların deneyimi (öneri)

Odalar ve masalar çevrimiçidir; konuma bağlı olan yalnızca Keşfet ve ileride buluşma/etkinliklerdir. Bu yüzden:
- İstanbul dışı kullanıcılar **odalara ve "Türkiye geneli" masalara** tam katılabilir. Böylece değer görürler ve elde tutulurlar.
- Keşfet'te kendi şehirlerinden yeterli öneri yoksa bunu dürüstçe gösteririz: "Şehrinde topluluk henüz büyüyor." Ayrıca şehir bekleme listesine katılma seçeneği sunulur. Uzak şehirlerden öneriler "Farklı şehir" etiketiyle, kullanıcı isterse gösterilir.
- Şehir bekleme listesi, bir sonraki şehrin hazır olup olmadığını gösteren talep sinyali olarak kullanılır.

### Şehir açılım kriterleri (ölçülebilir)

Yeni bir şehir, **(A) mevcut şehrin sağlıklı olduğu** ve **(B) yeni şehirde yeterli talep ve operasyon hazırlığı bulunduğu** durumda açılır. Eşikler, **art arda 4 hafta** boyunca sağlanmalıdır.

> Aşağıdaki sayılar **başlangıç hipotezleridir.** Kapalı betanın ilk 6 haftasındaki gerçek verilerle kalibre edilecek, ama kriterlerin *yapısı* sabittir.

**A. Mevcut şehir sağlığı (İstanbul)**

| # | Metrik | Tanım | Eşik |
|---|---|---|---|
| A1 | Haftalık aktif kullanıcı (WAU) | Hafta içinde en az 1 mesaj gönderen ya da masaya/odaya katılan kullanıcı | ≥ 2.500 (beta sonrası açık dönemde) |
| A2 | Günlük aktif sohbet | Gün içinde **iki tarafın da** mesaj yazdığı birebir sohbet sayısı / DAU | ≥ %25 |
| A3 | Haftalık anlamlı sohbet (North Star) | Bkz. ÜK-03 | Aktif kullanıcı başına ≥ 0,5 |
| A4 | Masa doluluk oranı | Talep edilen masaların 48 saat içinde ≥ 5 kişiyle başlama oranı | ≥ %80 |
| A5 | Masa tamamlama | Süresini en az 4 aktif üyeyle tamamlayan masa oranı | ≥ %60 |
| A6 | Davet kabul oranı | Kabul edilen davet / gönderilen davet | ≥ %25 (aşırı yüksek oran da spam/sahte hesap sinyali olarak izlenir) |
| A7 | Gelen davet yükü | Davet kotası dolan kullanıcı oranı (dikkat adaletsizliği göstergesi) | ≤ %5 |
| A8 | 7 günlük geri dönüş (D7) | Kayıttan sonraki 7. gün aktif olan kullanıcı oranı | ≥ %35 |
| A9 | 30 günlük geri dönüş (D30) | | ≥ %20 |
| A10 | Cinsiyet dengesi | Aktif kullanıcılarda en düşük temsil edilen cinsiyetin payı | ≥ %40 |
| A11 | Güven skoru | "Kendimi güvende hissediyorum" (5'li ölçekte 4–5 verenler) | ≥ %80 |

**Moderasyon yükü ve kapasitesi (açılış için zorunlu)**

| # | Metrik | Eşik |
|---|---|---|
| M1 | 1.000 WAU başına haftalık rapor | Sabit ya da azalan trend (mutlak eşik betada belirlenir) |
| M2 | Kritik rapor (kriz/tehdit) ilk müdahale süresi | %95'i ≤ 1 saat |
| M3 | Standart rapor çözüm süresi | %90'ı ≤ 24 saat |
| M4 | Moderasyon kapasite payı | Mevcut ekip kapasitesinin en fazla %70'i kullanılıyor (yeni şehre %30 boş kapasite) |
| M5 | Doğrulanmış sahte profil oranı | Aktif hesapların < %1'i |

**B. Yeni şehir hazırlığı (ör. İzmir)**

| # | Kriter | Eşik |
|---|---|---|
| B1 | Şehir bekleme listesi | ≥ 500 kişi (kendi şehrini seçmiş, telefonu doğrulanmış) |
| B2 | Şehirden halihazırda aktif kullanıcı | ≥ 150 WAU (odalar ve Türkiye geneli masalar üzerinden) |
| B3 | Kurucu topluluk | ≥ 30 gönüllü kurucu üye + 1 yerel topluluk sorumlusu |
| B4 | Masa yoğunluğu (matematik kontrolü) | Açılış haftasında her tema × yaş bandı hücresinde ≥ 6 talep. Örnek: 4 tema × 3 yaş bandı = 12 hücre → haftada en az ~72 masa talebi |
| B5 | Pilot etkinlik hazırlığı (Faz 3 ile) | ≥ 2 güvenli kamusal mekân iş ortağı |

**Durdurma (kırmızı çizgi) kriterleri:** Mevcut şehirde A8, A10, A11 ya da M2 eşiğin altına iki hafta üst üste düşerse yeni şehir açılışı ertelenir. Açılmış bir şehirde bu durum oluşursa o şehirde edinim (kullanıcı kazanımı) çalışmaları durdurulur. Sorun önce düzeltilir, büyüme sonra gelir.

---

## Veri Modeline Yansımalar (rapor Bölüm 25'e ek)

| Tablo / alan | Değişiklik |
|---|---|
| `connection_permissions.capability` | Değer kümesi: `text`, `voice_message`, `photo`, `voice_call`, `video_call`, `meet` |
| `consent_requests` | Her `capability` için ayrı kayıt; `a_response`/`b_response` birbirine gösterilmez; `cooldown_until` |
| `profiles.display_mode` | `avatar` / `photo` |
| `avatars` | Parça seçimleri (jsonb), sürüm, premium parça bayrağı |
| `photo_access` | `photo_id`, `connection_id`, `granted_at`, `revoked_at` (bağlantı bazlı gerçek fotoğraf erişimi) |
| `verifications` | Avatar ve davet için ön koşul kontrolü; ham biyometri saklanmaz |
| `entitlements` | Davet limitiyle **ilişkisizdir**; yalnızca kozmetik ve araç özellikleri. Davet limiti tek bir `app_config` değeridir |
| `user_settings.stealth_mode` | Premium gizli mod (Kritik uyarı 1'deki kurallarla) |
| `cities` | `status` (`active` / `waitlist` / `closed`), `launch_phase`, `opened_at` |
| `city_waitlist` | `user_id`, `city_id`, `created_at` |
| `groups.scope` | `city` / `national` (Türkiye geneli masalar) |
| `city_metrics_weekly` | A1–A11 ve M1–M5 metriklerinin haftalık anlık görüntüsü (yönetim panelinde "Şehir Sağlığı" panosu için) |

---

## ÜK-07 · İsim Araştırması

- Kısa liste: **Aralık · Usul · Masa · Yol Arkadaşı**. Ön araştırma `isim-arastirmasi.md` dosyasında.
- Ön araştırmanın sonucu (öneri; nihai karar Deniz'e ait):
  - **Finalistler:** Aralık ve Usul.
  - **Masa:** Elenmesi önerildi. Türkiye'de aynı kategoride "Masa App" adlı bir sosyalleşme uygulaması var. "Masa" yalnızca uygulama içinde küçük grup özelliğinin adı olarak kalabilir.
  - **Yol Arkadaşı:** Marka adı olarak zayıf. Mentor/gönüllü programının adı olarak kullanılması önerildi.
  - **Yedekler:** Arala, Usulca, Halhatır. Bunlar da TÜRKPATENT araştırmasına eklensin.
- Nihai isim kararı, marka vekili araştırması ve alan adı/kullanıcı adı kontrolünden sonra verilecek. O zamana kadar kodda ve dokümanlarda **teknik kod adı** kullanılır (ör. `aralik` yerine nötr bir ad: `project-a`). Böylece isim değişirse kodda değişiklik gerekmez.

---

## ÜK-08 · Geliştirme Modeli

| Rol | Kim | Sorumluluk |
|---|---|---|
| Kurucu / Product Owner | **Deniz** | Nihai ürün ve ticari kararlar, öncelikler, kabul testleri, hesap ve sözleşme işlemleri |
| Geliştirme | **Claude / Claude Code** | Kod, mimari, veri modeli, API, backend, mobil, admin, testler, refactoring, teknik dokümantasyon |
| İkinci görüş | **ChatGPT / Codex** | Ürün stratejisi, UX analizi, test senaryoları, güvenlik kontrolü, kod incelemesi, hata analizi |
| Zorunlu bağımsız kontrol | **Hukuk uzmanı** | KVKK, 5651, yaş doğrulama, kullanıcı içeriği, yurt dışı aktarım, kullanım koşulları, açık rıza, gizlilik politikası |
| Zorunlu bağımsız kontrol | **Güvenlik uzmanı** | Canlı öncesi güvenlik incelemesi, penetrasyon testi, RLS, API yetkilendirme, veri sızıntısı, dosya erişimi, admin yetkileri |
| Zorunlu bağımsız kontrol | **Ruh sağlığı uzmanı** | Kriz mesajları, intihar/kendine zarar sinyalleri, topluluk dili |

> ⚠️ **Kritik uyarı 3: 15 yaş sınırı ve yaş doğrulama yönetmeliği yürürlükte (1 Kasım 2026).**
> Güncel haberlere ve hukuki değerlendirmelere göre:
> - 5651 sayılı Kanun'un ek 4. maddesi (7578 sayılı Kanun ile değişik) ve 10 Ekim 2026'da yayımlanan *Sosyal Ağ Sağlayıcı Tarafından Çocuklara Özgü Ayrıştırılmış Hizmet Sunulmasına ve Yaş Doğrulamaya İlişkin Yönetmelik* ile 15 yaş altına sosyal ağ hizmeti yasaklandı.
> - Hesap açılışında **e-Devlet üzerinden üretilen bir yaş doğrulama belirteci** ile yaş kontrolü öngörülüyor. Belirteç 15 ve 18 yaş eşiklerine ilişkin bilgi taşıyor.
> - Mevcut kullanıcıların doğrulaması için son tarih 31 Mart 2027.
> - Kaynaklar, yükümlülüklerin hangi büyüklükteki platformlara uygulanacağı (ör. günlük 1 milyon erişim eşiği) konusunda ayrışıyor.
>
> **Etkisi:** Bu uygulama 5651 anlamında "sosyal ağ sağlayıcı" sayılabilir. Bu durumda yalnızca doğum tarihi beyanı yetmez. e-Devlet yaş belirteci (18+ eşiği) **kayıt akışının zorunlu adımı** olabilir. Belirteç aynı zamanda 18+ kuralımızı hukuken sağlam biçimde uygulamanın en iyi yolu olabilir.
>
> **Plan buna göre tasarlandı:** Yaş doğrulama, MVP'de kendi başına bir modül (M02). Entegrasyon yöntemi ve kapsam, **kodlamadan önce hukuk uzmanının ilk sorusu**dur. Belirtecin küçük platformlara teknik olarak açık olup olmadığı da teyit edilmeli.

> ⚠️ **Kritik uyarı 4: AI araçlarına gerçek kullanıcı verisi ve gizli anahtar verilmez.**
> Claude ve ChatGPT/Codex'e yalnızca kod, şema, sentetik veri ve anonim hata kayıtları verilir. Gerçek kullanıcı mesajları, fotoğrafları, telefon numaraları, rapor içerikleri ve API anahtarları **hiçbir zaman** AI sohbetlerine kopyalanmaz. Aksi durum KVKK'da özel nitelikli verinin izinsiz yurt dışına aktarımı ve güvenlik ihlali anlamına gelir. Üretim (production) erişimi yalnızca Deniz'de olur (bkz. MVP planı K).

> ⚠️ **Kritik uyarı 5: Tek kişilik operasyon, kriz müdahalesi için yetersiz.**
> Geliştirme Deniz + AI ile yapılabilir. Ama **canlı topluluk operasyonu** (moderasyon, kriz mesajları, şikâyetler) AI ile yürütülemez ve tek kişiyle sürdürülemez. Kapalı beta başlamadan önce **en az 2 yarı zamanlı moderatör**, nöbet çizelgesi ve uzman onaylı kriz protokolü hazır olmalı. Kriz ekranı (112 ve destek hatları yönlendirmesi) insan beklemeden **otomatik** gösterilmeli. Platformun 7/24 izlenmediği kullanıcıya dürüstçe söylenmeli.

> ⚠️ **Kritik uyarı 6: İki AI'ın aynı kod tabanında çalışması süreç gerektirir.**
> Kod yalnızca Claude Code tarafından, dal (branch) + pull request akışıyla yazılır. Codex **inceleyici** rolündedir: PR'a yorum yapar, doğrudan `main` dalına yazmaz. `main` dalı korunur (CI yeşil olmadan ve Deniz onaylamadan birleştirme yok). Aksi halde çakışan değişiklikler ve gözden kaçan güvenlik hataları oluşur.
