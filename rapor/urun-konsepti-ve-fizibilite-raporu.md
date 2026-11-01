# Ürün Konsepti ve Fizibilite Raporu

**Çalışma adı:** "Aralık" (isim önerileri Bölüm 33'te)
**Belge türü:** Ürün konsepti, fizibilite ve MVP öncesi değerlendirme
**Tarih:** 1 Kasım 2026
**Durum:** Taslak v1. Birlikte değerlendirilecek. Kod yok, servis satın alımı yok.

---

## Yönetici Özeti

Bu ürün, ayrılık, boşanma ya da uzun bir ilişkinin bitişinden sonra yalnız kalan yetişkinler için güvenli bir sosyal platform. İnsanlar önce konuşuyor, sonra ilişkinin nereye gideceğine kendileri karar veriyor. Ürünü iki şey ayırıyor:

1. **Kademeli ve karşılıklı rızaya dayalı iletişim.** Yazı, fotoğraf, ses, görüntü ve buluşma sırayla açılıyor. Her seviye iki tarafın açık onayını istiyor ve her an geri alınabiliyor.
2. **Topluluk öncelikli yapı.** Odalar, 4–8 kişilik küçük gruplar ve paylaşım akışı sayesinde insanlar birbirini fotoğrafla değil, sohbetle tanıyor.

**Konumlandırma önerisi:** "Dating app" değil. **Topluluk öncelikli sosyal keşif (Community-led Social Discovery)** olarak konumlanmalı. Arkadaşlık ve romantik ilişki de doğal bir sonuç olarak mümkün olmalı. Mağaza kategorisi: *Sosyal Ağ*.

**Fizibilite kararı:** Evet, mevcut teknolojiyle profesyonel ve ölçeklenebilir şekilde geliştirilebilir. Asıl riskler teknik değil. Şunlar:
(a) güven ve güvenlik operasyonu (moderasyon ekibi ve süreçler),
(b) yerel kullanıcı yoğunluğu, yani "boş uygulama" sorunu,
(c) uygulama mağazası incelemeleri ve KVKK/GDPR uyumu,
(d) kadın/erkek kullanıcı dengesi.
Bu riskler ürün tasarımıyla ve odaklı bir lansman stratejisiyle yönetilebilir (ayrıntısı Bölüm 37'de).

---

## 1. Projenin Temel Konsepti

**Tek cümlelik tanım:**
> Zor bir ayrılıktan sonra yalnız kalmadan konuşabileceğin, benzer yollardan geçmiş insanlarla güvenle tanışabileceğin ve bağın nereye gideceğine senin karar verdiğin sosyal alan.

**Ürün ilkeleri (tüm kararların süzgeci):**

| # | İlke | Pratikteki anlamı |
|---|---|---|
| 1 | **Önce konuşma** | Fotoğraf değil sohbet öne çıkar. Mesajlaşma, davet kabul edilmeden açılmaz. |
| 2 | **Her adımda rıza** | Hiçbir iletişim kanalı otomatik açılmaz. Her seviye çift taraflı onay ister ve tek taraflı geri alınabilir. |
| 3 | **Kırılganlığı sömürme** | Bağımlılık yaratan döngü yok, yapay kıtlık yok, "seni beğenenleri görmek için öde" yok. |
| 4 | **Varsayılan gizlilik** | Profil detayları, konum ve ilişki geçmişi kapalı başlar. Kullanıcı kendisi açar. |
| 5 | **Umut, keder değil** | Ton sıcak ve ileriye bakan. "Terapi" iddiası yok. |
| 6 | **Şeffaf algoritma** | Her öneri bir gerekçeyle gelir: "Neden bu kişi?" |

---

## 2. Hedef Kullanıcı Kitlesi

### 2.1 Birincil segmentler

| Segment | Tahmini yaş | Temel ihtiyaç | Hassasiyet |
|---|---|---|---|
| **Yeni boşanmış / boşanma sürecinde** | 30–55 | Sosyal çevre yeniden kurma, anlaşılma | Çok yüksek (hukuki süreç, çocuklar, eski eş) |
| **Çocuklu boşanmış ebeveynler** | 32–55 | Benzer durumdaki ebeveynlerle bağ, kısıtlı zaman | Yüksek (çocuk mahremiyeti) |
| **Uzun ilişkisi bitmiş** | 25–45 | Kimliğini yeniden bulma, yalnızlıkla baş etme | Yüksek |
| **Yeni ayrılmış (sevgili)** | 20–35 | Hemen konuşacak biri, dikkat dağıtma | Orta–yüksek (duygusal dürtüsellik) |
| **Yalnızlık yaşayanlar** | 25–60+ | Arkadaşlık, sohbet, ait olma | Orta |
| **"Yolun ilerisindekiler"** | 30–60 | Yaşadığını paylaşma, destek olma, yeniden başlama | Düşük–orta |

### 2.2 Önemli içgörüler

- **Yaş profili klasik dating uygulamalarından yüksek.** Çekirdek kitle büyük olasılıkla 30–50 yaş arası. Tasarım buna göre olmalı: daha büyük punto, sakin arayüz, net dil, oyunlaştırma yerine anlam.
- **"Yolun ilerisindekiler" kritik bir segment.** Ayrılığın üzerinden 1–3 yıl geçmiş, hayatını toparlamış kişiler topluluğun "sıcaklık kaynağı" olur. Bunları ürünün içinde ayrıca teşvik edin. Öneri: "Yol arkadaşı" rozeti (Bölüm 34).
- **Cinsiyet dengesi en büyük pazar riski.** Dating'e yakın uygulamalar erkek ağırlıklı kitleye kayar. Kadın kullanıcıların güvenlik ve "istenmeyen ilgi" kaygıları ürünün DNA'sında çözülmezse topluluk dağılır. Öneriler: davet limitleri, gelen davet kotası, topluluk önceliği (Bölüm 9 ve 19).

### 2.3 Persona örnekleri

- **Elif, 38, İstanbul:** 1 yıl önce boşandı, 7 yaşında bir kızı var. Arkadaş çevresi "çiftler" çevresiydi ve dağıldı. Önce benzer ebeveynlerle konuşmak istiyor, ilişkiye henüz hazır değil.
- **Murat, 44, Ankara:** 15 yıllık evliliği bitti. Akşamları evde yalnız. Sohbet ve yürüyüş/spor arkadaşı arıyor, ileride ciddi ilişkiye açık.
- **Zeynep, 27, İzmir:** 5 yıllık sevgilisinden yeni ayrıldı. Gece geç saatlerde konuşacak birine ihtiyaç duyuyor. Duygusal olarak kırılgan; ürünün onu korumalı.

---

## 3. Temel Kullanıcı Problemi

1. **Sosyal çevre kaybı:** Boşanma ve uzun ilişki bitişlerinde ortak arkadaş çevresi bölünür. Kişi bir anda "konuşacak kimsem yok" noktasına düşer.
2. **Yanlış araçlar:** Mevcut seçenekler ikiye ayrılıyor.
   - *Dating uygulamaları:* Fotoğraf odaklı, yüzeysel ve hızlı. Kırılgan dönemde reddedilmek ve "pazar" hissi kötü gelir.
   - *Forumlar / Facebook grupları / Reddit:* Destek var ama birebir bağa dönüşmüyor. Güvenlik ve kimlik doğrulama zayıf.
3. **Güvensizlik:** Sahte profiller, romantik dolandırıcılık (para isteme), taciz, ilk mesajda uygunsuz fotoğraf. Duygusal olarak kırılgan kişiler bu risklere daha açık.
4. **Hız baskısı:** Birçok platform "hemen numara ver, hemen buluşalım" dinamiği yaratıyor. Hazır olmayan kişi için bu itici ve riskli.
5. **Utanç ve mahremiyet:** "Boşandım" demek birçok kişi için hâlâ zor. Eski eşin, ailenin ya da iş çevresinin profili görmesi ciddi bir kaygı.

---

## 4. Uygulamanın Çözümü

| Problem | Çözüm |
|---|---|
| Sosyal çevre kaybı | Odalar, 4–8 kişilik küçük gruplar ve sosyal akış ile çok sayıda düşük riskli temas |
| Yanlış araçlar | Destek ve tanışmanın aynı yerde olduğu, ilişkinin yönünü kullanıcıların belirlediği yapı |
| Güvensizlik | Selfie/canlılık doğrulaması, AI destekli moderasyon, dolandırıcılık sinyalleri, güvenlik merkezi |
| Hız baskısı | Kademeli iletişim: her seviye çift onaylı, geri alınabilir, baskı koruması (cooldown) var |
| Utanç ve mahremiyet | Rumuz, alan bazında gizleme, rehberdeki kişilerden gizlenme (eski eş, aile, iş), gizli bildirimler, uygulama kilidi |

---

## 5. Rakiplerden Ayrışma

### 5.1 Rekabet haritası (kategoriler)

| Kategori | Örnekler | Güçlü yanı | Bizim için boşluk |
|---|---|---|---|
| Klasik dating | Tinder, Badoo, Happn | Kitle büyüklüğü | Yüzeysel, fotoğraf odaklı, hassas döneme uygun değil |
| "İlişki odaklı" dating | Hinge, Bumble | Daha nitelikli profil, prompt'lar | Yine eşleşme odaklı. Topluluk yok, destek yok |
| Arkadaşlık keşfi | Bumble For Friends, Meetup, Timeleft (yabancılarla akşam yemeği) | Romantik olmayan bağ | Ayrılık bağlamı ve kademeli birebir iletişim yok |
| Ayrılık iyileşme uygulamaları | Mend, Breakup Buddy benzeri | Ayrılığa özel içerik ve günlük | Bireysel ve içerik odaklılar. İnsanlarla bağ kurma yok ya da zayıf |
| Topluluklar | Facebook grupları, Reddit (r/divorce), forumlar | Samimi destek | Kimlik doğrulama yok, birebir güvenli geçiş yok, Türkçe ve yerel değil |

> Not: Rakip özellikleri sık değişir. MVP öncesinde güncel bir rakip özellik taraması yapılmalı.

### 5.2 Farklılaştırıcılar (savunulabilirlik sırasıyla)

1. **Kademeli rıza motoru.** Rakiplerde "fotoğraf göndermeyi kapat" gibi tekil ayarlar var. Rıza üzerine kurulu, çift onaylı ve geri alınabilir bir *ilişki ilerleme modeli* yok. Bu hem ürün özelliği hem marka vaadi.
2. **Bağlama özel topluluk.** "Boşanma sonrası", "çocuklu ebeveynler", "yeniden başlamak". Tanışma bu ortak hikâye üzerinden gerçekleşiyor.
3. **4–8 kişilik "Masa" grupları.** Küçük ve zamanlı (ör. 4 haftalık) gruplar, kalabalık odaların anonimliğiyle birebir sohbetin baskısı arasında güvenli bir orta alan sunuyor. Türkiye pazarında bu formatta bir ürün görünmüyor.
4. **Mahremiyet ve "eski eşten gizlen" özellikleri.** Boşanma bağlamında rakiplerin pek odaklanmadığı, ama kitle için hayati olan özellikler.
5. **Etik gelir modeli.** "Yalnızlığı sömürmeyiz" taahhüdü kamuya açık bir manifesto olarak yayınlanabilir. Güven inşa eder ve basında konuşulur.

---

## 6. Kullanıcı Yolculuğu

### 6.1 Uçtan uca akış

```
Keşif (mağaza/sosyal medya/tavsiye)
  → Karşılama ("Burada yalnız değilsin" + 3 ekranlık değer anlatımı)
  → Kayıt (telefon OTP + 18+ beyanı + doğum tarihi)
  → Topluluk kuralları sözü (kısa, onaylanır)
  → Profil (3 adım, minimum zorunlu alan)
  → "Şu an ne arıyorsun?" (çoklu seçim; ör. sohbet, dertleşme, arkadaşlık…)
  → Selfie doğrulaması (önerilir; doğrulanmamış hesabın davet gönderme hakkı sınırlı)
  → Gizlilik kurulumu (rehberden gizlen, alan gizleme)
  → İlk değer anı: önerilen 2–3 oda + "Bu haftanın masası" grubuna katıl
  → Keşfet'te öneriler + "Neden bu kişi?" açıklamaları
  → Davet gönder / al → Eşleşme → Seviye 1 sohbet
  → Zamanla Seviye 2–5 (çift onay)
  → Bağ: arkadaşlık / dostluk / ilişki — ya da nazik vedalaşma
```

### 6.2 "İlk 10 dakika" hedefi

Kullanıcı ilk oturumda **en az bir gerçek insanla etkileşmeli**: bir odada mesaja yanıt, bir masa grubuna katılım ya da bir gönderiye yorum. Boş Keşfet ekranı yerine *canlı topluluk* gösterilmeli. Birebir eşleşme zaman alır, topluluk ise anında değer üretir.

### 6.3 Duygusal duruma göre uyarlanan başlangıç

Onboarding'de "Ayrılığın üzerinden ne kadar zaman geçti?" diye sorulur (isteğe bağlı, gizli tutulur). Cevaba göre:
- **0–3 ay:** Varsayılan mod "Önce konuşmak istiyorum". Topluluk ve destek odaları öne çıkar, romantik amaçlı Keşfet geri plana çekilir. Kullanıcı bunu tek dokunuşla değiştirebilir; zorlama yoktur.
- **3+ ay:** Dengeli varsayılanlar.

Böylece kırılgan dönemdeki kişinin dürtüsel ve riskli bağlantılara itilmesi azaltılır.

---

## 7. Kademeli İletişim Sisteminin Tasarımı

Ürünün kalbi bu bölüm.

### 7.1 Seviyeler

| Seviye | Ad (kullanıcıya görünen) | Açılan yetenekler |
|---|---|---|
| 0 | **Davet** | Davet mesajı (tek seferlik, en fazla 300 karakter, görsel yok) |
| 1 | **Yazışma** | Metin, emoji, kişisel emoji, sohbet başlatıcılar, sesli mesaj (*ayrıca açılabilir, aşağıya bakın*) |
| 2 | **Görseller** | Fotoğraf paylaşımı (varsayılan bulanık, dokununca açılır) |
| 3 | **Sesli görüşme** | Uygulama içi sesli arama (numara paylaşılmaz) |
| 4 | **Görüntülü görüşme** | Uygulama içi görüntülü arama |
| 5 | **Buluşma** | Buluşma planlayıcı + güvenlik araçları |

> **Sesli mesaj nereye ait?** Ses, kişiyi tanımlayan biyometrik niteliğe yakın bir veri ve taciz için de kullanılabiliyor. Öneri: Seviye 1'de **kapalı başlasın**. Seviye 1 içinde "sesli mesajlara izin ver" diye ayrı bir çift onaylı anahtar olsun, ya da sesli mesaj Seviye 2 ile birlikte açılsın. Birlikte karar verelim.

### 7.2 Durum makinesi (her ilişki çifti için)

```
           ┌──────── teklif (A) ────────┐
Seviye N ──┤                            ├─ B kabul → Seviye N+1
           └─ B "şimdilik değil" ───────┘   (cooldown başlar)

Herhangi bir anda: A veya B → "Seviyeyi düşür" → istenen seviye (tek taraflı, anında)
Herhangi bir anda: A veya B → "Bağlantıyı sonlandır" / "Engelle"
```

**Kurallar:**
1. **Uygunluk (eligibility):** Bir sonraki seviyeyi teklif etme seçeneği, yalnızca *minimum etkileşim* sağlandığında görünür. Örnek eşikler (A/B testiyle ayarlanmalı):
   - Seviye 2 için: iki taraf da en az 20 mesaj yazmış ve sohbet en az 2 farklı günde sürmüş olmalı.
   - Seviye 3 için: Seviye 2'de en az 3 gün.
   - Seviye 4 için: en az 1 sesli görüşme ya da Seviye 3'te 5 gün.
   - Seviye 5 için: iki tarafın da doğrulanmış (selfie) hesabı olmalı.
   Eşikler *güvenlik zemini* işlevi görür, oyun hedefi değildir. Kullanıcıya sayaç olarak **gösterilmez**.
2. **Sistem teklifi:** Uygunluk oluştuğunda sistem iki tarafa da ayrı ayrı ve *özel olarak* sorar: "Görsel paylaşımını açmak ister misiniz?"
   - Seçenekler: **Evet** · **Şimdilik değil** · **Bana bir daha sorma**.
   - Bir taraf "Evet", diğeri "Şimdilik değil" derse, "Evet" diyen taraf **red bilgisini görmez**. Yalnızca "Henüz açılmadı" görür. Böylece reddetmenin sosyal maliyeti sıfırlanır.
3. **Kör onay (blind consent):** Taraflar birbirinin cevabını *önceden* görmez. İki taraf da evet dediğinde seviye açılır ve ikisine birden "Görsel paylaşımı açıldı ✨" bildirilir. Bu yapı "o istedi, ben hayır dersem kırılır" baskısını ortadan kaldırır.
4. **Cooldown:** "Şimdilik değil" cevabından sonra aynı seviye en erken 7 gün sonra tekrar sorulabilir. "Bir daha sorma" seçildiyse yalnızca o kişi bu teklifi yeniden başlatabilir.
5. **Tek taraflı geri alma:** Seviye düşürmek açıklama gerektirmez ve anında uygulanır. Karşı tarafa nötr bir mesaj gider: "İletişim tercihleri güncellendi." Kim düşürdüğü vurgulanmaz, ama bilgi gizlenmez de (şeffaflık).
6. **Geri alma sonrası içerik:** Seviye 2'den düşülürse daha önce gönderilen fotoğraflar iki tarafta da bulanıklaştırılır. Gönderen isterse fotoğraflarını tamamen silebilir.
7. **Seviye atlama yok:** Seviye 1'den doğrudan 4'e geçilemez. İstisna: iki taraf da belirli bir seviyeyi "atlamak" isterse (ör. fotoğraf istemeyip sesli görüşme isteyenler), bir sonraki seviye *ayrı bir anahtar* olarak sunulabilir. Seviyeler katı bir merdiven değil, **çift onaylı yetenek anahtarları** olarak modellenmeli; arayüzde ise önerilen bir sıra olarak gösterilmeli.

### 7.3 Seviye bazında güvenlik önlemleri

| Seviye | Ek önlem |
|---|---|
| 1 | İlk mesajlarda dış bağlantı (link), telefon numarası, IBAN, sosyal medya kullanıcı adı tespiti → nazik uyarı ("Erken aşamada kişisel bilgi paylaşmamanı öneririz") |
| 2 | Tüm görseller AI ile çıplaklık ve şiddet taramasından geçer. Varsayılan bulanık önizleme. Android'de ekran görüntüsü engeli (FLAG_SECURE). iOS'ta ekran görüntüsü alındığında karşı tarafa bildirim. İsteğe bağlı "tek görüntülemelik" fotoğraf |
| 3–4 | Görüşmeler sunucu üzerinden yönlendirilir; **IP adresi karşı tarafa sızmaz** (Bölüm 27). Görüşme içinde "raporla ve bitir" düğmesi. Kayıt alınmaz |
| 5 | Yalnızca kamusal alan önerileri, güvenilir kişiyle plan paylaşımı, "İyiyim" kontrolü (Bölüm 18) |

### 7.4 Tasarım dili

Seviyeler sohbet ekranının üstünde **ince ve zarif bir "kapı aralığı" göstergesi** olarak yer alır. Kilit ikonları yerine açılan kapı ve aralanan perde gibi metaforlar kullanılır. "Kazandın" ya da "rozet aldın" dili yasaktır.

---

## 8. Keşfet Ekranı

### 8.1 Kart tasarımı (kaydırmalı "swipe" değil, dikey liste ya da sakin kart ızgarası)

- Profil fotoğrafı (isteğe bağlı olarak **avatar**; Bölüm 15)
- Rumuz/isim, yaş (ya da yaş aralığı: "30'ların ortası"), şehir (ilçe değil)
- 2–3 cümlelik kısa tanıtım
- En fazla 5 ilgi alanı
- **"Açık olduğu iletişim":** 💬 Sohbet · 🤝 Arkadaşlık · 🫂 Dertleşme · ❤️ İlişkiye açık · 🤷 Henüz bilmiyorum
- **"Neden önerildi?"** satırı: "3 ortak ilgi alanı · İkiniz de *Yeniden Başlamak* odasındasınız"
- Doğrulama rozeti (selfie ✔)
- Aksiyonlar: **Tanışma daveti gönder** · Kaydet · Bu kişiyi gösterme

### 8.2 Kurallar

- **Doğrudan mesaj yok.** Yalnızca davet.
- **Günlük davet limiti herkes için aynı** (öneri: 5–10). Bu sınır kalite ve güvenlik içindir. Bu yüzden *para ile artırılmamalı* (Bölüm 22'deki tartışmaya bakın).
- **Gelen davet kotası:** Bir kullanıcıya günde gelebilecek davet sayısı sınırlanır (ör. 15). Kota dolduğunda o profil Keşfet'te geçici olarak daha az gösterilir. Bu, popüler profillerin (çoğunlukla kadınların) boğulmasını engeller ve dikkati daha adil dağıtır.
- **Sonsuz kaydırma yok.** Günde sınırlı sayıda (ör. 20–30) özenle seçilmiş öneri. "Bugünlük bu kadar, odalara göz atmak ister misin?"
- Keşfet sekmesi istenirse tamamen gizlenebilir ("Şimdilik sadece topluluk").

### 8.3 Davet akışı

1. Davet eden, isteğe bağlı kısa bir not yazar ya da hazır bir sohbet başlatıcı seçer ("Profilindeki kitap önerini merak ettim").
2. Alıcı daveti **Kabul et / Nazikçe geç / Raporla** seçenekleriyle yanıtlar. "Geç" seçildiğinde davet eden kişiye bildirim gitmez; davet bir süre sonra sessizce "yanıtlanmadı" olur.
3. Davetler 7 gün sonra kendiliğinden düşer.

---

## 9. Eşleşme Sistemi

### 9.1 İki katmanlı model

**Katman 1: Kurallar ve filtreler (sert kısıtlar)**
- Yaş aralığı tercihleri (çift yönlü uyum)
- Şehir / mesafe (kaba konum; ilçe düzeyinde bile kesin konum tutulmaz)
- Cinsiyet ve tercih (ilişki amaçlı eşleşmede; arkadaşlık modunda isteğe bağlı)
- Engellenen ve gizlenen kişiler (rehber eşleşmesi dahil)
- "Ne arıyorum" uyumu (ör. biri yalnızca arkadaşlık, diğeri yalnızca ilişki arıyorsa düşük öncelik)

**Katman 2: Uyum skoru (yumuşak sıralama)**
- Ortak ilgi alanları ve hobiler
- Ortak oda ve grup katılımı, aynı gönderilere etkileşim
- Benzer yaşam evresi (ör. çocuklu ebeveyn ↔ çocuklu ebeveyn, kullanıcı izin verdiyse)
- Sohbet tercihleri (yazıyı seven / sesi seven, sabahçı / gececi)
- Grup içindeki karşılıklı olumlu etkileşimler ("bu kişiyle aynı masada iyi sohbet ettiniz")
- Embedding tabanlı benzerlik: profil metni ve "hakkımda" cevapları vektörlenir (pgvector)

### 9.2 Etik ilkeler

1. **Açıklanabilirlik:** Her öneri en az bir insan diliyle yazılmış gerekçeyle gelir. Gerekçeler kural katmanından üretilir; AI'ın "kara kutu" skoru tek başına gerekçe olarak gösterilmez.
2. **Çekicilik skoru yok.** Fotoğraf tabanlı "popülerlik" ya da gizli ELO puanı tutulmaz. Fotoğraf eşleşmede sinyal olarak kullanılmaz.
3. **Paraya bağlı görünürlük manipülasyonu yok.** Ücretsiz kullanıcının eşleşme şansı yapay olarak düşürülmez.
4. **Çeşitlilik:** Öneri listesi aynı tip profillerle dolmaz; keşif payı korunur.
5. **Kullanıcı kontrolü:** "Bana daha çok/az bu tür öneri göster" geri bildirimi. Ayrıca kişiselleştirmeyi tamamen kapatma seçeneği (GDPR/KVKK açısından da güçlü bir duruş).

### 9.3 Grup tabanlı eşleşme (öneri)

En değerli eşleşmeler *grup içinde birbirini tanımış* kişiler arasında oluşacaktır. Masa grubu bittiğinde sistem şunu sorar: "Bu gruptan biriyle birebir sohbete devam etmek ister misin?" İki taraf da evet derse **davet adımı atlanarak** eşleşme oluşur (kör onay). Bu mekanizma ürünün "önce konuş" ilkesini doğrudan uygular.

---

## 10. Sohbet Sistemi

### 10.1 Birebir sohbet özellikleri

| Özellik | Seviye | Not |
|---|---|---|
| Metin, emoji, tepkiler | 1 | Okundu bilgisi **kullanıcı tercihine bağlı** (varsayılan kapalı önerilir) |
| Kişisel emojiler / çıkartmalar | 1 | Bölüm 15 |
| Sohbet başlatıcı kartları | 1 | "Bir soru çek" düğmesi |
| Mini oyunlar (ikili) | 1 | "İki doğru bir yalan", "Bu mu o mu?" |
| Sesli mesaj | 1+ (ayrı anahtar) | Süre limiti (ör. 2 dk); sunucu tarafında transkript ile moderasyon |
| Fotoğraf | 2 | Bulanık önizleme, AI tarama, tek görüntülemelik seçeneği |
| Sesli / görüntülü görüşme | 3 / 4 | Bölüm 17 |
| Buluşma planı | 5 | Bölüm 18 |
| Mesaj silme (iki taraftan) | — | 24 saat içinde; raporlanmış mesajlar delil olarak saklanır |
| "Nazikçe bitir" | — | Hazır, saygılı veda mesajı şablonları. Ghosting yerine kibar kapanış |

### 10.2 Akıllı güvenlik katmanı (arka planda)

- **Dolandırıcılık sinyalleri:** Para, IBAN, kripto, "acil durum", hediye kartı, yatırım fırsatı, "WhatsApp'a geçelim" (erken aşamada) → kullanıcıya bağlam içi uyarı + risk skoruna katkı.
- **Taciz ve cinsel içerik:** Metin sınıflandırma. Eşik aşılırsa mesaj alıcıya "Bu mesaj rahatsız edici olabilir, görmek ister misin?" şeklinde gizlenmiş olarak gelir.
- **Kriz dili:** Bölüm 19.4.

### 10.3 Gece modu (öneri)

Gece 00:00–05:00 arasında, ilk mesajlarda "Bunu yarın sabah da göndermek ister misin?" şeklinde hafif bir dürtü (nudge) gösterilebilir. Ayrılık dönemindeki dürtüsel mesajları yumuşatır. İsteğe bağlıdır ve kapatılabilir.

---

## 11. Sosyal Ana Sayfa (Akış)

### 11.1 İçerik türleri

Kısa yazı, düşünce, soru, fotoğraf, motivasyon, "bugün başardığım küçük şey" (öneri: **"Küçük Zaferler"** etiketi; umut tonunu destekler), anket.

### 11.2 Etkileşim

Beğeni (kalp yerine **çoklu nazik tepki**: 🤗 Yanındayım · 💪 Güçlüsün · 😂 · ☕ · 💡), yorum, kaydet, "tanışma daveti gönder" (yazarın Keşfet ayarları buna izin veriyorsa).

### 11.3 Önemli tasarım kararları

1. **Beğeni sayıları herkese açık gösterilmez.** Yalnızca yazar görür. Kırılgan kitlede sosyal karşılaştırmayı ve "beğeni avcılığını" azaltır.
2. **Rumuzla paylaşım:** Hassas gönderiler profil yerine *o gönderiye özel bir rumuzla* paylaşılabilir. Bu gönderiler moderasyon için yine hesaba bağlıdır ama herkese anonim görünür. Bu gönderiler üzerinden tanışma daveti gönderilemez.
3. **Üçüncü kişi koruması (kritik):**
   - Eski eş ya da eski sevgilinin adını, fotoğrafını veya tanımlayıcı bilgisini paylaşmak yasaktır (iftira/hakaret, KVKK ve "intikam içeriği" riski).
   - **Çocukların yüzlerinin genel akışta paylaşılması yasaktır** (çocuk güvenliği). AI ile çocuk yüzü tespit edilen görseller otomatik olarak incelemeye alınır.
4. **Akış sıralaması:** Kronolojik + takip edilen odalar + "yeni gelenlere hoş geldin" önceliği. Öfke ve dram içerikli gönderileri büyütecek bir etkileşim optimizasyonu yapılmaz.
5. **Yeni üye sıcaklığı:** Yeni kullanıcının ilk gönderisi, ona "hoş geldin" demesi için gönüllü "Yol arkadaşları"na gösterilir. Böylece ilk paylaşım asla yanıtsız kalmaz.

---

## 12. Odalar

### 12.1 Oda türleri

| Tür | Örnek | Katılım | Moderasyon |
|---|---|---|---|
| **Destek odaları** | Yeni Ayrıldım, Boşanma Sonrası Hayat, Çocuklu Boşanmış Ebeveynler, Yeniden Başlamak | Açık, ama yeni hesaplar için yavaş mod | Sıkı. Oda rehberi + AI |
| **Yaş / evre odaları** | 40+ Sohbet, 50+ Yeni Başlangıçlar | Açık (yaş beyanına göre) | Standart |
| **Şehir odaları** | İstanbul, Ankara, İzmir | Açık (şehir eşleşmesi) | Standart + buluşma kuralları |
| **İlgi odaları** | Spor, Sinema, Seyahat, Kitap | Açık | Standart |
| **Zaman odaları** | Akşam Sohbeti (20:00–24:00), Kahve Odası (sabah) | Belirli saatlerde açık | Standart |
| **Özel / kontrollü odalar** | Premium ya da davetli | Başvuru / onay | Oda sahibi + platform |

### 12.2 Oda mekanikleri

- Mesaj akışı + sabitlenmiş kurallar + "günün sorusu"
- Yavaş mod (ör. 30 saniyede bir mesaj) ve yeni hesaplar için ek kısıtlar (ilk 48 saatte bağlantı/görsel paylaşamama)
- **Oda içi doğrudan mesaj yok.** Odada tanışılan kişiye *davet* gönderilir.
- **Oda rehberleri:** Güvenilir, deneyimli gönüllü kullanıcılar. Eğitim, rozet, sınırlı moderasyon yetkisi (mesaj gizleme, yavaş mod açma); tüm işlemleri log'lanır.
- Odalar MVP'de **yalnızca platform tarafından oluşturulur.** Kullanıcıların oda açması sonraki fazlara bırakılır (spam ve moderasyon yükü nedeniyle).

---

## 13. 4–8 Kişilik Küçük Gruplar ("Masalar")

Önerim, bu özelliği ürünün en sıcak ve en ayırt edici deneyimi haline getirmek.

### 13.1 İki tür grup

1. **Sistemin kurduğu "Masa"lar (öncelikli):**
   - Kullanıcı "Bu hafta bir masaya katılmak istiyorum" der ve tema seçer (ör. "Yeniden başlamaya çalışanlar", "Çocuklu ebeveynler", "Sinema severler").
   - Sistem benzer yaş aralığı ve ilgi alanlarına sahip, *dengeli* (cinsiyet/yaş açısından makul dağılımlı) 6 kişilik masalar kurar.
   - Masanın **süresi vardır** (ör. 7 gün ya da 4 hafta). Her gün bir moderatör-bot sohbet başlatıcısı ya da mini oyun önerir.
   - Süre bitince: "Masa kapanıyor. Biriyle birebir devam etmek ister misin?" (kör onay, Bölüm 9.3) ve "Bu masa devam etsin mi?" (çoğunluk evet derse kalıcı gruba dönüşür).
2. **Kullanıcıların kurduğu gruplar (sonraki faz):**
   - Doğrulanmış ve belirli bir süredir aktif kullanıcılar açabilir.
   - Yalnızca davetle ya da başvuruyla katılım.

### 13.2 Kurallar

- **Minimum 4:** Grup 4 kişiye ulaşınca "açılır". Masa grupları zaten 6 kişiyle kurulur; ayrılmalarla 4'ün altına düşülürse sistem 48 saat içinde uygun bekleyen kişilerle tamamlamayı önerir, olmazsa grubu nazikçe kapatır ya da birleştirir.
- **Maksimum 8:** Sert sınır.
- **Aynı anda katılım limiti:** Ücretsiz kullanıcı 2 aktif masa, Premium 4–5 (kalite için üst sınır şart).
- Grup içinde fotoğraf paylaşımı **grup ayarına bağlıdır** (varsayılan kapalı; grubun çoğunluk onayıyla açılır).
- Grupta sesli oda (Phase 3): "Masa sesli sohbeti" (mikrofonu açma gönüllü).

### 13.3 Neden bu kadar önemli?

- Bir kişiyle birebir konuşma baskısı yok, kalabalık odanın soğukluğu da yok.
- Kadın kullanıcılar için güvenli bir tanışma ortamı sağlar.
- Yeni kullanıcıya "ilk günden bir yere ait olma" hissi verir. Bu, elde tutma (retention) açısından en güçlü kaldıraçtır.

---

## 14. Oyunlar ve Sohbet Başlatıcılar

### 14.1 Soru kartı destesi (kategorize, derinlik seviyeli)

| Deste | Derinlik | Örnek |
|---|---|---|
| **Hafif** | 🌱 | "Son zamanlarda seni en çok ne güldürdü?" · "Mükemmel bir pazar sabahı nasıl geçer?" |
| **Yeniden başlamak** | 🌿 | "Bir şehirde yeniden başlayacak olsaydın neresi olurdu?" · "Bu yıl kendine verdiğin bir söz?" |
| **Derin** | 🌳 | "Bir ilişkide senin için vazgeçilmez üç şey nedir?" · "Geçmişe dönüp kendine bir şey söyleyebilseydin?" |
| **Eğlenceli** | 🎈 | "Bir gün süper gücün olsa?" · "Hayatının film müziği hangi şarkı?" |

- **Derinlik kuralı:** Derin desteler, iki taraf da istediğinde açılır. Kırılgan kullanıcıya "eski ilişkin neden bitti" gibi sorular *varsayılan olarak* sorulmaz.
- **İkisi de cevaplasın:** Bir soruyu iki taraf da cevaplamadan cevaplar görünmez (eşit açılma).

### 14.2 Grup oyunları

- **Doğru mu yanlış mı** (kişisel cümlelerle)
- **Seni tanıyalım**: Her gün bir üye "sıcak koltuğa" oturur, diğerleri soru sorar (gönüllü)
- **Ortak noktalar avı**: Grubun ortak 5 özelliğini bulma
- **Kelime oyunları**: Kelime zinciri, "tek kelimeyle anlat"
- **Mini quiz**: Film, müzik, şehir kültürü
- **Bu mu o mu?**: Hızlı tercih oyunu; sonuçlarda grup içi uyum görünür

### 14.3 Teknik not

Oyunlar MVP'de **mesaj tipleri** olarak (yapılandırılmış kart mesajları) modellenmeli. Ayrı bir oyun motoruna gerek yok. Soru içerikleri yönetim panelinden yönetilir; AI ile yeni soru taslağı üretilip **editör onayıyla** yayına alınır.

---

## 15. Kişisel Emojiler / Avatarlar

### 15.1 Seçenekler (aşamalı)

| Faz | Özellik | Teknik yaklaşım | Maliyet / Risk |
|---|---|---|---|
| MVP | Hazır avatar oluşturucu (yüz şekli, saç, aksesuar) + markaya özel çıkartma paketi | Vektör parça kütüphanesi (ör. DiceBear benzeri açık kaynak yaklaşımlar ya da özel çizim) | Düşük |
| Faz 2 | Avatarın 8–12 ruh hali varyasyonu (😊 Mutluyum · ☕ Kahve? · 🤗 Sarılma · 😂 Çok iyi · ❤️ Yanındayım · 🌧️ Bugün zor) | Parçalı avatar sisteminde ifade şablonları | Düşük |
| Faz 3 | **AI ile fotoğraftan kişisel emoji** | Görsel üretim modeli (stilize, karikatür tarzı) | Orta (maliyet + mahremiyet) |

### 15.2 AI kişisel emoji: değerlendirme

**Artıları:** Çok güçlü bir "wow" anı, premium için doğal bir değer, paylaşılabilirlik (viral potansiyel).
**Riskleri ve önlemleri:**
1. **Başkasının yüzünden emoji üretme (deepfake/taciz riski):** Yalnızca *selfie doğrulamasından geçmiş kullanıcının kendi yüzünden* üretim yapılır. Kaynak fotoğraf, doğrulama selfiesiyle yüz eşleştirmesinden geçer.
2. **Biyometrik veri:** Yüz verisi KVKK'da özel nitelikli kişisel veri (biyometrik) sayılabilir. Açık rıza alınmalı. Kaynak fotoğraf üretim sonrası silinmeli; yalnızca üretilen stilize görseller saklanmalı.
3. **Stil:** Fotogerçekçi değil, belirgin şekilde stilize (karikatür/illüstrasyon) olmalı. Hem kötüye kullanımı azaltır hem marka dilini güçlendirir.
4. **Maliyet:** Bir paket (8–12 görsel) üretmek bir kerelik bir maliyettir. Premium'a dahil edilebilir ya da tek seferlik bir satın alma olabilir.
5. **Model sağlayıcı:** Üretim için verinin model eğitimine kullanılmadığı (zero data retention / no-training) sözleşme koşulları aranmalı.

### 15.3 Profil fotoğrafı yerine avatar

Kullanıcı Keşfet'te **avatar ile görünmeyi** seçebilir. Gerçek fotoğraf Seviye 2'de (karşılıklı onayla) açılır. Bu, "önce konuşma" ilkesinin en güçlü ifadesi olabilir ve mahremiyet kaygısı yüksek boşanmış kullanıcılar için büyük bir rahatlık sağlar. Selfie doğrulaması yine zorunlu olduğu için sahte profil riski artmaz.

---

## 16. Sanal Hediyeler

### 16.1 Katalog önerisi

| Kategori | Örnekler | Bağlam |
|---|---|---|
| Günlük | ☕ Kahve, 🍵 Çay, 🍪 Kurabiye | "Seni düşündüm" |
| Destek | 🫂 Sarılma, 🕯️ Mum, 🌻 Ayçiçeği, **Destek rozeti** | Zor günler |
| Kutlama | 🎂 Doğum günü pastası, 🎉 Konfeti, 🏅 "Başardın" | Küçük zaferler |
| Romantik (yalnızca Seviye 2+) | 🌹 Gül, 💌 Mektup | İlişkiye açık eşleşmeler |
| Kültürel | 📚 Kitap, 🎵 Şarkı ithafı, 🎬 Film önerisi | İlgi alanı |

### 16.2 Etik kurallar

- **Hediyeler paraya çevrilemez (cash-out yok).** Bu kural, "hediye için sohbet eden" profilleri ve dolandırıcılık ekonomisini engeller. Ayrıca hukuki ve mağaza risklerini (ödeme kuruluşu lisansı, Apple 3.1.1) dramatik biçimde azaltır.
- Hediye gönderimi, alıcıda **hiçbir yükümlülük ya da seviye avantajı** doğurmaz.
- Günlük hediye gönderme limiti (dürtüsel harcamaya karşı) ve harcama özeti.
- Hediye **almak** her zaman ücretsiz. Kullanıcı hediye almayı kapatabilir.
- Para isteme ve hediye pazarlığı moderasyon sinyalidir.

### 16.3 Gelir mekaniği

Uygulama içi satın alma (IAP) ile "jeton" paketleri ya da doğrudan hediye satın alma. Dijital ürünlerde Apple/Google ödeme sistemi zorunludur ve %15–30 komisyon alınır (küçük işletme programlarında %15).

### 16.4 Fiziksel hediyeler (Faz 4): adres paylaşmadan

**Kod / kupon (voucher) modeli:**
1. Gönderen fiziksel bir hediye seçer (kahve, çiçek, kitap, hediye kartı).
2. Platform, iş ortağından **tek kullanımlık bir kod** satın alır.
3. Alıcı kodu kendisi kullanır: kahve dükkânında okutur ya da çiçek/kitap için kendi adresini **yalnızca iş ortağının sitesinde** girer.
4. Gönderen hiçbir zaman alıcının adresini görmez. Platform da adresi saklamaz.

**Notlar:**
- Fiziksel ürün ve hizmetlerde Apple/Google, uygulama dışı ödeme yöntemine izin verir (Apple 3.1.3(e) "uygulama dışında tüketilen ürün/hizmet"). Bu, gelir marjı için avantajdır. Kesin yorum lansman öncesi güncel kurallarla teyit edilmeli.
- Türkiye'de dijital hediye kodu sağlayıcıları, kahve zincirleri ve çiçek/e-ticaret platformlarıyla iş ortaklığı ya da toplayıcı (aggregator) API'leri araştırılmalı.
- Alıcı, fiziksel hediye almayı ayrıca açmalı (varsayılan kapalı).

---

## 17. Sesli / Görüntülü Görüşme

### 17.1 Ürün kuralları

- Yalnızca ilgili seviye çift onaylıysa görüşme açılır.
- Arama başlatmak yerine önce **"Şimdi müsait misin?" ön-davet** gönderilir. Ani çağrı baskısı olmaz.
- Görüntülü görüşmede **"kamerasız başla"** ve **arka plan bulanıklaştırma** varsayılan olarak sunulur (ev içi mahremiyeti).
- Görüşme içinde: Raporla & bitir, sessize al, kamerayı kapat.
- **Kayıt yok.** Platform görüşmeleri kaydetmez. Bu, gizlilik politikasında açıkça belirtilir.
- **Telefon numarası ya da IP sızmaz.** Tüm medya bir sunucu (SFU/TURN) üzerinden yönlendirilir.
- Süre ve kalite telemetrisi tutulur (içerik değil).

### 17.2 Gerçek zamanlı içerik moderasyonu

Canlı görüşmede içerik denetimi teknik olarak zor ve mahremiyet açısından hassastır. Öneri:
- MVP'de görüşme içeriği izlenmez. Raporlama sonrası iş akışı işler (kullanıcının beyanı, görüşme meta verisi, geçmiş raporlar).
- Görüntülü görüşmede ilk saniyelerde **istemci tarafında (cihaz üzerinde)** çıplaklık tespiti + otomatik bulanıklaştırma sonraki faz için değerlendirilebilir. Görüntü sunucuya gitmeden cihazda işlenir.

Teknik altyapı Bölüm 27'de.

---

## 18. Buluşma Sistemi

### 18.1 Akış

1. Seviye 5 çift onaylı olmalı ve **iki taraf da selfie doğrulamalı** olmalı.
2. Bir taraf "Yüz yüze buluşmak ister misin?" teklifini gönderir (kör onay mekanizması).
3. Planlayıcı:
   - **Tarih / saat:** Öneri olarak gündüz ve akşam erken saatler vurgulanır.
   - **Bölge:** İki tarafın kaba konumu arasında *orta noktaya* yakın, **kamusal alan kategorileri** (kafe, park, müze, AVM, kitapçı). Uygulama belirli bir mekân önerebilir (harita/mekân API'si) ama hiçbir zaman ev adresi ya da konut alanı önermez.
   - Kesin konum paylaşımı isteğe bağlıdır ve yalnızca buluşma günü, süreli olarak (ör. 2 saat) açılır.
4. **Güvenlik araçları:**
   - **Güvenilir kişiye plan paylaşımı:** Uygulama dışındaki bir yakına (SMS ya da WhatsApp linki) "Buluşma planım: Kim (rumuz + profil fotoğrafı), nerede, ne zaman".
   - **"İyiyim" kontrolü:** Buluşmanın başlangıcından X saat sonra uygulama sorar: "Her şey yolunda mı?" Yanıt gelmezse güvenilir kişiye otomatik mesaj gider (isteğe bağlı).
   - **Acil durum düğmesi:** 112'yi arama kısayolu. Konum, yalnızca kullanıcı onaylarsa güvenilir kişiyle paylaşılır.
   - **Buluşma sonrası geri bildirim:** "Nasıl geçti?" (özel). Olumsuz deneyimler gizli raporlama kanalına gider.
5. **İlk buluşma ipuçları:** Kısa güvenlik rehberi ("Kendi ulaşımını kullan", "Para isteyen kişiye dikkat").

### 18.2 Toplu buluşmalar (Faz 3 önerisi)

Masa gruplarının ya da şehir odalarının **platform organizasyonlu kamusal etkinlikleri** (ör. "Pazar kahvaltısı – 6 kişi", "Sergi gezisi"). Birebir buluşmadan çok daha güvenli bir ilk yüz yüze temas sağlar. Aynı zamanda güçlü bir gelir kalemi olabilir (bilet). Bkz. Bölüm 34.

---

## 19. Güvenlik ve Moderasyon

### 19.1 Katmanlı savunma modeli

```
[Önleme]        Kayıt kontrolleri · doğrulama · kademeli yetkiler · yeni hesap kısıtları
     ↓
[Otomatik tespit] Metin/görsel/ses sınıflandırma · risk skoru · davranış analizi · cihaz parmak izi
     ↓
[Kullanıcı sinyali] Engelle · raporla · "rahatsız edici mesaj" gizleme
     ↓
[İnsan incelemesi] Moderasyon kuyruğu · öncelik (kritik → 1 saat SLA) · karar şablonları
     ↓
[Yaptırım]       Uyarı · içerik kaldırma · özellik kısıtlama · geçici askı · kalıcı ban · cihaz/telefon banı
     ↓
[İtiraz & şeffaflık] İtiraz süreci · karar gerekçesi · şeffaflık raporu
```

### 19.2 Risk bazında önlemler

| Risk | Tespit | Önlem |
|---|---|---|
| **Sahte profil** | Selfie canlılık + yüz eşleşmesi, tersine görsel arama (stok/ünlü fotoğrafı), aynı cihazdan çoklu hesap, VoIP/sanal numara tespiti, IP–şehir tutarsızlığı | Doğrulanmamış hesaplara sınırlı yetki; şüpheli hesap gizli incelemede |
| **Fotoğraf manipülasyonu / AI üretimi fotoğraf** | AI-üretim tespit modelleri, profil fotoğrafı ile selfie yüz eşleşmesi | Eşleşmeyen fotoğraf profilde kullanılamaz |
| **Taciz** | Metin sınıflandırma (hakaret, aşağılama, ısrarlı mesaj), tek taraflı mesaj oranı | Uyarı → mesajı gizleme → kısıtlama |
| **Spam** | Hız limitleri, kopya mesaj tespiti, link oranı | Otomatik kısıtlama |
| **Çıplaklık / cinsel içerik** | Görsel moderasyon API'si (her yükleme) | İstenmeyen çıplaklık otomatik engellenir; tekrarında ban. Platform cinsel içerik paylaşımına izin vermez (mağaza kuralları da gerektirir) |
| **Tehdit / şiddet** | Metin sınıflandırma + anahtar sinyaller | Kritik kuyruk; gerekirse yasal mercilerle iş birliği süreci |
| **Romantik dolandırıcılık / para isteme** | Para/IBAN/kripto/hediye kartı/yatırım dili, hızlı duygusal yoğunlaşma ("love bombing" kalıpları), yurt dışı ya da asker/doktor hikâyesi kalıpları, erken platform dışına çekme | Alıcıya bağlam içi uyarı; risk skoru yükselir; kritik eşikte hesap askıya alınıp incelenir |
| **Kimlik avı (phishing)** | Link itibar kontrolü (Safe Browsing benzeri), kısaltılmış link açılımı | Şüpheli link engellenir |
| **Israrlı takip (stalking)** | Engelledikten sonra yeni hesap açma (cihaz/telefon/yüz eşleşmesi ile), ısrarlı profil ziyareti | Engelleme cihaz ve yüz düzeyinde de uygulanır; profil ziyaretleri gizli; konum asla kesin değil |
| **Eski eş / tanıdık tarafından bulunma** | — | **Rehberden gizlen** (telefon numarası hash'leri ile, cihazda), belirli kişiyi önceden engelleme (numara ile), profili tamamen gizleme |
| **Reşit olmayan kullanıcı** | Doğum tarihi, selfie yaş tahmini (sinyal olarak), raporlama | 18 yaş altı şüphesinde hesap dondurma + doğrulama |
| **Çocuk güvenliği (CSAM)** | Bilinen CSAM hash eşleştirme (ör. PhotoDNA benzeri hizmetler), çocuk görseli tespiti | Sıfır tolerans; yasal bildirim süreci; Google Play "Child Safety Standards" politikası uyarınca yayınlanmış standartlar |

### 19.3 Kırılgan kullanıcıya özel tasarım

- **Duygusal sömürüye karşı:** Hızlı yoğunlaşan, para ya da hediye isteyen, platform dışına çeken davranışlar için "Güvenlik ipucu" kartları sohbet içinde nazikçe gösterilir. Kullanıcı aşağılanmaz, bilgilendirilir.
- **Bağımlılık karşıtı:** Bildirim yoğunluğu sınırlıdır. "Seni özlediler" türü manipülatif bildirimler yasaktır. Günlük kullanım özeti isteğe bağlı.
- **Reddedilme yumuşatma:** Davetlerde ve seviye tekliflerinde ret bilgisi görünmez (bkz. 7.2).

### 19.4 Kriz akışı (kendine zarar, intihar, şiddet, ciddi tehdit)

**İlke:** Uygulama terapi vermez, ama yalnız da bırakmaz. Amaç, kişiyi doğru profesyonel kaynağa hızlı ve şefkatle yönlendirmek.

**Akış:**
1. **Tespit:** Metin sınıflandırıcı (çok dilli, Türkçe ince ayarlı) + anahtar ifade listesi + kullanıcı raporu ("Bu kişi için endişeleniyorum").
2. **Kullanıcıya özel, yargısız müdahale ekranı** (yalnızca o kullanıcıya görünür):
   > "Yazdıkların, şu an çok zor bir yerde olduğunu düşündürüyor. Yalnız değilsin. Şu an tehlikedeysen lütfen **112**'yi ara. Bir uzmanla konuşmak da iyi gelebilir."
   - Doğrudan arama düğmeleri: 112 Acil, ayrıca güncel ve doğrulanmış destek hatları (lansman öncesi Türkiye'deki güncel resmi hatlar teyit edilmeli; ör. ALO 183 Sosyal Destek Hattı).
   - "Güvendiğin birine yaz" kısayolu.
   - Profesyonel destek bulma rehberi (rehber niteliğinde, tavsiye değil).
3. **Sohbet karşı tarafı için:** Rapor eden kullanıcıya "Endişeni bizimle paylaştığın için teşekkürler. İşte nasıl destek olabileceğin ve nerelere yönlendirebileceğin" rehberi. Sorumluluk ona yüklenmez.
4. **İnsan incelemesi:** Kritik kuyruk (hedef SLA: 1 saat, 7/24 kapsama hedefi). Eğitimli moderatör.
5. **Acil ve somut risk** (zaman, yöntem, plan ifadesi): Yasal çerçeve dahilinde yetkili mercilerle iletişim protokolü. Bu protokol avukat ve bir ruh sağlığı danışmanıyla birlikte yazılmalı.
6. **Başkasına yönelik tehdit:** Kritik kuyruk, hesap kısıtlama, delillerin korunması, yasal süreç.
7. **Takip:** 24–48 saat sonra nazik bir kontrol mesajı ("Nasılsın? Buradayız."), isteğe bağlı.
8. **Veri:** Kriz verisi **sağlık verisi** niteliğindedir (KVKK özel nitelikli). Erişim çok sınırlı rolle, ayrıca log'lanır. Saklama süresi kısadır.

**Yapılmaması gerekenler:** Kriz mesajını otomatik olarak engellemek ya da silmek (kişi susturulmuş hisseder), hesabı ceza olarak kapatmak, AI'ın "terapist gibi" uzun konuşmalar yapması.

**Önerilen dış danışmanlık:** Bir klinik psikolog ya da psikiyatristten kriz akışı ve dil incelemesi; topluluk kurallarının uzman gözüyle gözden geçirilmesi.

### 19.5 Moderasyon operasyonu (kritik ama sık unutulur)

- MVP'de bile **insan moderasyon kapasitesi** gerekir. Başlangıç: kurucu ekip + 1–2 yarı zamanlı moderatör. Ölçekle birlikte dış kaynaklı T&S (trust & safety) hizmeti.
- Moderatör refahı: Ağır içerik maruziyeti için rotasyon ve destek.
- **Topluluk Kuralları**, **Güvenlik Merkezi** sayfası ve **şeffaflık raporu** (yıllık ya da altı aylık).
- Gönüllü "Oda rehberleri" topluluk moderasyonunu güçlendirir.

---

## 20. Kullanıcı Doğrulama Sistemi

### 20.1 Katmanlar

| Katman | Zorunlu mu? | Açtığı yetenek | Yöntem |
|---|---|---|---|
| **Telefon OTP** | Evet | Hesap oluşturma | SMS OTP. Sanal/VoIP numara filtresi; tek numaraya tek hesap |
| **Yaş beyanı** | Evet | Uygulamaya giriş | Doğum tarihi + 18+ onayı. Tutarsızlıkta selfie yaş tahmini sinyal olarak kullanılır |
| **Selfie canlılık + yüz eşleşmesi** | Önerilir (davet göndermek ve Seviye 3+ için zorunlu) | ✔ rozet, davet gönderme, görüşme, buluşma | Canlılık tespiti (liveness) ve profil fotoğraflarıyla yüz eşleşmesi. Hazır sağlayıcılar: AWS Rekognition Face Liveness, FaceTec, Veriff, Persona, iDenfy vb. |
| **Kimlik doğrulama (NFC çipli T.C. kimlik)** | İsteğe bağlı | "Kimliği doğrulanmış" ek rozeti | KYC sağlayıcısının NFC okuma özelliği. Kimlik verisi **saklanmaz**; yalnızca doğrulama sonucu ve yaş teyidi tutulur |

### 20.2 Gizlilik notları

- Yüz verisi biyometrik veridir, açık rıza gerektirir. Sağlayıcı seçiminde veri yerleşimi, saklama süresi ve eğitimde kullanılmama şartı aranmalı.
- Doğrulama selfiesi profilde **gösterilmez**. Doğrulama sonrası silinir ya da kısa süre şifreli saklanır (yeniden doğrulama ve itiraz için).
- Periyodik yeniden doğrulama: Şüpheli davranışta ya da profil fotoğrafı değiştiğinde.

---

## 21. AI Kullanım Alanları

| Alan | Kullanım | Faz | Not |
|---|---|---|---|
| **Moderasyon** | Metin (taciz, tehdit, dolandırıcılık, kriz), görsel (çıplaklık, şiddet, çocuk), ses (transkript + sınıflandırma) | MVP | En kritik AI kullanımı |
| **Dolandırıcılık/risk skoru** | Davranış + içerik sinyallerinin birleşimi | MVP (kural tabanlı) → Faz 2 (ML) | |
| **Eşleşme önerileri** | Embedding benzerliği + açıklanabilir gerekçe üretimi | MVP (kural + basit embedding) | Gerekçeler kural katmanından üretilir |
| **Sohbet başlatıcı** | İki profilin ortak noktalarına göre kişiselleştirilmiş soru önerisi | Faz 2 | Hazır desteden seçim + hafif kişiselleştirme |
| **Profil yazım yardımcısı** | "Hakkımda" metnini taslak olarak yazma ve iyileştirme | Faz 2 | Kullanıcı onayı; abartı/yalan üretmez |
| **Kişisel emoji üretimi** | Stilize görsel üretim | Faz 3 | Bölüm 15 |
| **Masa grupları kurgusu** | Grup dengesi optimizasyonu | Faz 2 | |
| **Moderatör yardımcısı** | Rapor özetleme, bağlam toplama, karar önerisi | Faz 2 | Son karar insanda |
| **Topluluk içerik editörü** | Günün sorusu, oda konuları, oyun içerikleri taslakları | MVP (iç kullanım) | Editör onayıyla yayın |
| **Çeviri** | Ülke genişlemesinde | Faz 4 | |

**AI kırmızı çizgileri:**
- AI kullanıcıyı **taklit eden** ya da sahte kullanıcı gibi davranan bot olarak kullanılmaz. Boş uygulama sorununu "sahte profillerle" çözmek kesinlikle yasaktır. Hem etik hem de hukuki/mağaza riski taşır.
- AI "terapist" olarak konumlanmaz. Bir "Asistan" eklenirse rolü açıkça "uygulama rehberi" ile sınırlanır.
- Özel mesajlar **model eğitiminde kullanılmaz**. Sağlayıcılarla veri saklamama ve eğitimde kullanmama sözleşmeleri yapılır.
- Model sağlayıcı seçimi: Moderasyon, eşleşme gerekçesi ve metin üretimi için Claude (Anthropic) veya OpenAI modelleri uygundur. Maliyet için sınıflandırma işlerinde küçük ve hızlı modeller (ör. Claude Haiku sınıfı) tercih edilmeli. Görsel moderasyonda özelleşmiş API'ler (Hive, Sightengine, AWS Rekognition, Google Cloud Vision SafeSearch) genellikle daha ucuz ve hızlıdır. Kesin seçim, Türkçe performans testleriyle (pilot veri seti) yapılmalı.

---

## 22. Gelir Modeli

### 22.1 Etik çerçeve ("Yalnızlığı sömürmeme sözü")

Yapılmayacaklar:
- ❌ "Seni kimler beğendi, görmek için öde" (merak ve özlemi sömürür)
- ❌ Ücretsiz kullanıcının görünürlüğünü ya da eşleşme şansını gizlice düşürme
- ❌ Mesajlaşmayı paywall arkasına koyma ("cevap vermek için premium")
- ❌ Daha fazla davet satmak (aşağıdaki tartışmaya bakın)
- ❌ Kişisel veri satışı, hedefli reklam için hassas veri kullanımı
- ❌ İptali zorlaştıran abonelik akışları

### 22.2 Gelir kalemleri

| Kalem | Açıklama | Önem |
|---|---|---|
| **1. Abonelik (Premium)** | Konfor, ifade ve derinlik özellikleri (bkz. Bölüm 23) | Ana gelir |
| **2. Sanal hediyeler** | IAP; paraya çevrilemez | Destekleyici |
| **3. Etkinlikler (Faz 3)** | Platformun organize ettiği küçük grup buluşmaları için bilet ve iş ortağı mekânlardan komisyon | **Yüksek potansiyel**, güçlü farklılaştırıcı |
| **4. Tek seferlik satın almalar** | AI emoji paketi, profil teması | Destekleyici |
| **5. B2B / iş ortaklıkları (Faz 4)** | Doğrulanmış uzman (avukat, psikolog, koç) içerik ve AMA etkinlikleri; sponsorlu kaynak dizinleri | Dikkatli ve şeffaf olmalı; kullanıcı verisi paylaşılmaz |

> **"Daha fazla davet" tartışması:** Taslağınızda Premium'da "daha fazla tanışma daveti" var. Önerim, bunu **satmamak**. Davet limiti spam ve tacizi önleyen bir güvenlik aracı. Para ile genişletilirse (1) alıcı tarafında, özellikle kadın kullanıcılarda davet bombardımanı oluşur, (2) "ödeyen daha çok şansa sahip" algısı etik vaadi zayıflatır. Alternatif: Davet limiti herkes için aynı kalsın, ama davet kabul oranı yüksek olan kullanıcıların limiti *davranışa göre* artsın (iyi davranışı ödüllendirmek, parayı değil).

### 22.3 Fiyatlandırma

Türkiye'de enflasyon ve kur dinamikleri nedeniyle fiyat **lansman öncesi test edilmeli** (fiyat anketleri ve A/B). Öneri:
- Aylık, 3 aylık ve yıllık paketler (yıllıkta belirgin indirim)
- **Premium deneme süresi:** 7 gün
- Destek odaklı segment için "dayanışma fiyatı" ya da sponsorluk modeli (ör. bir kullanıcının aboneliği, zor durumdaki birinin ücretsiz premium'unu finanse eder) marka için değerli olabilir.

### 22.4 Birim ekonomisi uyarısı

Ana maliyet kalemleri: SMS OTP, selfie doğrulama (hesap başına ücretli), görsel/metin moderasyon API'leri, video dakikaları, AI çağrıları, moderasyon personeli. MVP'de **ücretli doğrulama yalnızca davet göndermek isteyenlere** uygulanırsa (hepsine değil) maliyet kontrol altında kalır.

---

## 23. Ücretsiz / Premium Özellik Dağılımı

| Özellik | Ücretsiz | Premium |
|---|---|---|
| Profil, doğrulama, gizlilik araçları | ✅ Tam | ✅ |
| **Tüm güvenlik özellikleri** (engelle, raporla, rehberden gizlen, buluşma güvenliği) | ✅ **Her zaman ücretsiz** | ✅ |
| Keşfet (günlük öneri) | ✅ 20 öneri/gün | ✅ 40 öneri/gün + daha önce "geç"tiklerine geri dönme |
| Temel filtreler (yaş, şehir, ne arıyor) | ✅ | ✅ |
| Gelişmiş filtreler (ilgi, çocuk durumu, yaşam tarzı, sohbet tarzı) | — | ✅ |
| Davet gönderme | ✅ (davranışa göre artan limit) | ✅ Aynı limit |
| Mesajlaşma ve tüm seviyeler (fotoğraf, ses, görüntü, buluşma) | ✅ **Tam** | ✅ |
| Görüntülü görüşme süresi | ✅ (makul sınır, ör. 30 dk/görüşme) | ✅ Sınırsız + HD |
| Odalara katılım | ✅ Tüm açık odalar | ✅ + Premium/özel odalar |
| Masa grupları | ✅ 2 aktif | ✅ 4–5 aktif + tema seçimi önceliği |
| Kendi grubunu kurma | — | ✅ (doğrulanmış kullanıcı) |
| Avatar oluşturucu | ✅ Temel | ✅ Gelişmiş parçalar ve ruh hali paketleri |
| AI kişisel emoji paketi | — (tek seferlik satın alınabilir) | ✅ Aylık 1 paket |
| Profil öne çıkarma | — | ✅ Haftalık 1 (**yalnızca** ilgili odalarda/Keşfet'te "yeni yüzler" bölümünde, şeffaf olarak "öne çıkan" etiketiyle) |
| Gizli mod (yalnızca senin davet ettiklerin seni görür) | — | ✅ |
| Okundu bilgisi / son görülme kontrolü | ✅ (gizlilik ücretsiz) | ✅ |
| Profil temaları, özel tepkiler | — | ✅ |
| Etkinliklere erken erişim / indirim | — | ✅ |

**Kural:** *Güvenlik ve temel bağ kurma asla ücretli değil. Premium, konfor ve kendini ifade etmeyi satar.*

---

## 24. Teknik Mimari

### 24.1 Önerilen altyapının değerlendirmesi

| Katman | Önerdiğiniz | Değerlendirme | Tavsiye |
|---|---|---|---|
| Mobil | React Native + Expo | ✅ Doğru seçim. Tek kod tabanı, EAS Build/Update, olgun ekosistem. Yeni mimari (Fabric/TurboModules) artık varsayılan | **Kalsın.** Expo Router, TanStack Query, Zustand; WebRTC için development build (Expo Go yetmez) |
| Backend | Supabase | ✅ MVP ve orta ölçek için çok uygun: Postgres, Auth, RLS, Storage, Realtime, Edge Functions, pgvector, pg_cron, Queues (pgmq) | **Kalsın.** Pro plan + **AB bölgesi** (ör. Frankfurt) |
| DB | PostgreSQL | ✅ | Kalsın. Satır düzeyi güvenlik (RLS) her tabloda zorunlu |
| Auth | Supabase Auth | ✅ Telefon OTP için SMS sağlayıcı entegrasyonu (Twilio, Vonage, MessageBird vb. ya da Türkiye'de yerel bir SMS sağlayıcısı. Türkçe operatör teslimat oranları test edilmeli) | Kalsın + Apple/Google ile giriş (**telefon doğrulaması yine zorunlu**) |
| Realtime | Supabase Realtime | ⚠️ MVP için yeterli. Yüksek ölçekte maliyet ve kanal sınırları izlenmeli | Bölüm 26 |
| Storage | Supabase Storage | ✅ Özel bucket'lar + imzalı (signed) URL'ler + görsel dönüştürme | Kalsın. Medya CDN'i ölçekle değerlendirilir |
| Video/Ses | WebRTC | ⚠️ **Kendi WebRTC altyapınızı kurmayın.** TURN/SFU işletmek uzmanlık ister | **LiveKit Cloud** (açık kaynak; ileride kendi sunucunuza taşınabilir) ya da Agora / Daily. Bölüm 27 |
| AI | OpenAI / Claude | ✅ | Sağlayıcı soyutlama katmanı; moderasyonda özelleşmiş API'ler |
| Push | Expo / Firebase | ✅ Expo Notifications (arka planda APNs/FCM) | Kalsın. **Bildirim içeriği gizli** varsayılan |
| Deployment | Vercel | ⚠️ Mobil uygulama Vercel'e deploy edilmez. Vercel yalnızca **yönetim paneli (Next.js)** ve **web sitesi/landing** için uygun | Mobil: **EAS Build + EAS Submit + EAS Update**. Panel ve web: Vercel |
| Repo | GitHub | ✅ | Monorepo (pnpm/Turborepo): `apps/mobile`, `apps/admin`, `packages/shared`, `supabase/` |

### 24.2 Eklenmesi önerilen bileşenler

| İhtiyaç | Öneri |
|---|---|
| Arka plan işleri (moderasyon kuyruğu, eşleşme hesaplama, bildirim fan-out) | Supabase Queues (pgmq) + pg_cron + Edge Functions. Yoğunlaşınca ayrı bir worker servisi (ör. Cloud Run / Fly.io / Railway) |
| Hata ve performans izleme | Sentry (mobil + panel + fonksiyonlar) |
| Ürün analitiği (gizlilik dostu) | PostHog (AB bölgesi ya da self-host). Hassas alanlar analitiğe **gönderilmez** |
| Abonelik yönetimi | **RevenueCat**: iOS/Android abonelik ve IAP yönetimini ciddi ölçüde kolaylaştırır |
| Özellik bayrakları / A-B | PostHog feature flags |
| Medya moderasyonu | Hive / Sightengine / AWS Rekognition (Türkçe kalite ve maliyet testleriyle seçim) |
| E-posta (bildirim, veri dışa aktarım) | Resend / Postmark |
| Gizli bilgi yönetimi | Supabase Vault + CI secrets |
| Arama (ileride) | Postgres full-text + pg_trgm; ölçekte Typesense/Meilisearch |

### 24.3 Mimari şema (mantıksal)

```
┌───────────────────────────── Mobil (Expo / React Native) ─────────────────────────────┐
│  UI · Expo Router · TanStack Query · Realtime client · LiveKit SDK · RevenueCat SDK    │
└───────────────┬───────────────────────────┬─────────────────────────────┬─────────────┘
                │ HTTPS (PostgREST/RPC)      │ WebSocket (Realtime)        │ WebRTC (SFU)
        ┌───────▼───────────────────────────▼──────────┐            ┌─────▼──────────┐
        │                   SUPABASE (AB)               │            │ LiveKit Cloud  │
        │  Auth · Postgres(+RLS, pgvector) · Storage    │◄── token ──┤ (SFU + TURN)   │
        │  Realtime (Broadcast/Presence) · Edge Funcs   │            └────────────────┘
        │  Queues(pgmq) · pg_cron · Vault               │
        └───────┬──────────────────────────┬────────────┘
                │ webhook / queue           │
      ┌─────────▼─────────┐       ┌────────▼────────────┐      ┌─────────────────────┐
      │ Moderasyon worker │──────►│ AI / Moderasyon API │      │ Admin Panel (Next.js│
      │ Eşleşme worker    │       │ (LLM, görsel, ses)  │      │ on Vercel) + RBAC   │
      │ Bildirim worker   │──────►│ Expo Push / APNs/FCM│      └─────────────────────┘
      └───────────────────┘       └─────────────────────┘
      Yan servisler: SMS sağlayıcı · KYC/liveness · RevenueCat · Sentry · PostHog
```

### 24.4 Güvenlik mimarisi ilkeleri

- **RLS her tabloda.** İstemci asla service-role anahtarı taşımaz.
- **Seviye yetkileri sunucuda doğrulanır:** Fotoğraf yükleme ve görüşme token'ı üretimi, Edge Function içinde `connection_permissions` kontrolüyle yapılır. İstemcideki bir hata, yetki atlatmaya yol açamaz.
- Medya **özel bucket'larda** tutulur, kısa ömürlü imzalı URL'lerle servis edilir. Yüklenen görseller EXIF/GPS verisinden **temizlenir** (konum sızıntısını önler).
- Rate limiting: Edge Function ve DB düzeyinde (davet, mesaj, rapor, OTP).
- Admin panelde rol tabanlı erişim (RBAC), 2FA zorunlu, her işlem audit log'a yazılır.
- Penetrasyon testi lansman öncesi zorunlu.

---

## 25. Veritabanı Ana Tabloları

> Kavramsal model. Kesin şema MVP planında detaylanacak.

### 25.1 Kimlik ve profil
| Tablo | Amaç | Önemli alanlar |
|---|---|---|
| `profiles` | Temel profil | user_id, display_name, birth_date, gender, city_id, bio, relationship_status, separation_since (gizli), has_children (ops.), intents[], conversation_style, created_at, status |
| `profile_visibility` | Alan bazında görünürlük | user_id, field, visibility (herkes/eşleşme/seviye2/gizli) |
| `profile_photos` | Fotoğraflar | id, user_id, storage_path, order, moderation_status, face_match_ok |
| `interests`, `user_interests` | İlgi alanları | |
| `preferences` | Eşleşme tercihleri | age_min/max, distance, genders[], intent_filters |
| `verifications` | Doğrulama sonuçları | user_id, type (phone/selfie/id), status, provider_ref, verified_at (ham biyometri yok) |
| `user_settings` | Gizlilik ve bildirim | read_receipts, last_seen, discreet_notifications, app_lock, explore_hidden, mode ("önce konuş" vb.) |
| `hidden_contacts` | Rehberden gizlenme | user_id, phone_hash (tuzlu hash) |
| `profile_embeddings` | Eşleşme vektörü | user_id, embedding (pgvector), updated_at |

### 25.2 Bağlantılar ve rıza
| Tablo | Amaç |
|---|---|
| `invitations` | from, to, note, source (keşfet/oda/grup/akış), status (pending/accepted/passed/expired), expires_at |
| `connections` | Eşleşmiş çift: user_a, user_b (sıralı), status (active/ended/blocked), created_at, ended_by |
| `connection_permissions` | Çift başına yetenek anahtarları: connection_id, capability (text/voice_msg/photo/voice_call/video_call/meet), enabled, enabled_at |
| `consent_requests` | Teklif ve kör onay: connection_id, capability, requested_by, a_response, b_response, cooldown_until |
| `consent_events` | Değiştirilemez (append-only) rıza geçmişi: kim, ne zaman, hangi yetenek, açtı/kapattı (hukuki delil ve şeffaflık için) |
| `connection_journey` | Yumuşak yakınlık göstergesi: stage, visible_to_both (her iki tarafın gösterim rızası) |

### 25.3 Mesajlaşma (birleşik model)
| Tablo | Amaç |
|---|---|
| `conversations` | type (direct/group/room), ref_id (connection/group/room), created_at |
| `conversation_members` | conversation_id, user_id, role, joined_at, last_read_at, muted |
| `messages` | id (ULID/zaman sıralı), conversation_id, sender_id, kind (text/voice/image/prompt_card/game/gift/system), body (şifreli), metadata (jsonb), moderation_status, created_at, deleted_at — **zaman bazlı bölümleme (partitioning)** |
| `message_attachments` | message_id, storage_path, mime, blur_hash, view_once, viewed_at |
| `message_reactions` | message_id, user_id, reaction |

### 25.4 Topluluk
| Tablo | Amaç |
|---|---|
| `rooms`, `room_members`, `room_rules` | Odalar |
| `groups` (masalar) | theme, type (system/user), min=4, max=8, starts_at, ends_at, status |
| `group_members`, `group_continue_votes` | |
| `posts`, `post_media`, `post_reactions`, `comments` | Akış; `posts.pseudonym_id` (rumuzlu paylaşım) |
| `prompts`, `prompt_answers` | Soru kartları ve cevaplar |
| `games`, `game_sessions`, `game_moves` | Oyunlar |

### 25.5 Kişiselleştirme ve gelir
| Tablo | Amaç |
|---|---|
| `avatars`, `emoji_packs`, `emoji_items` | Avatar ve kişisel emojiler |
| `gift_catalog`, `gift_transactions` | Hediyeler |
| `coin_ledger` | Jeton defteri (append-only, çift kayıt mantığı) |
| `subscriptions`, `entitlements` | RevenueCat webhook'u ile senkron |
| `events`, `event_tickets` (Faz 3) | Etkinlikler |

### 25.6 Güvenlik, moderasyon, uyum
| Tablo | Amaç |
|---|---|
| `blocks` | blocker, blocked, created_at |
| `reports` | reporter, target_type (user/message/post/comment/room/group), target_id, reason, details, evidence_snapshot, status |
| `moderation_cases` | Birden çok raporu tek vakada toplar: priority, assignee, sla_due |
| `moderation_actions` | **Değiştirilemez audit kaydı**: case_id, admin_id, action, reason, created_at |
| `risk_signals` | user_id, signal_type, score, source, created_at |
| `devices` | user_id, device_fingerprint_hash, push_token, platform |
| `safety_events` | Kriz/tehdit olayları (kısıtlı erişim, kısa saklama) |
| `meet_plans`, `safety_checkins`, `trusted_contacts` | Buluşma güvenliği |
| `legal_consents` | user_id, consent_type (KVKK aydınlatma, açık rıza: özel nitelikli veri, biyometri, yurt dışı aktarım, pazarlama), version, granted_at, revoked_at |
| `data_requests` | Veri indirme/silme talepleri ve durumları |
| `admin_users`, `admin_roles`, `audit_logs` | Yönetim |
| `feature_flags`, `app_config` | Yapılandırma |

---

## 26. Realtime Mesajlaşma Mimarisi

### 26.1 MVP mimarisi (Supabase üzerinde)

**Yazma yolu:**
1. İstemci mesajı `send_message` RPC'si (ya da Edge Function) ile gönderir.
2. Sunucu: üyelik + yetki + rate limit + hızlı içerik kontrolü (regex: IBAN, telefon, link) → `messages` tablosuna yazar.
3. Yazma sonrası **Realtime Broadcast** ile konuşma kanalına (`conv:{id}`) yayın yapılır. Postgres Changes yerine Broadcast tercih edilir, çünkü Postgres Changes her abone için RLS kontrolü yapar ve ölçekte darboğaz olur.
4. Asenkron: moderasyon kuyruğu (AI sınıflandırma), push bildirim kuyruğu.

**Okuma yolu:**
- Sohbet açılırken son N mesaj sorgulanır (imleç tabanlı sayfalama).
- Canlı mesajlar Broadcast ile gelir. Yeniden bağlanmada "son görülen mesaj ID'sinden sonrası" çekilir (boşluk doldurma).
- Çevrimiçi durumu ve yazıyor göstergesi: **Presence**. Kullanıcının "son görülme" ayarına saygı duyulur.

**Kanal yetkilendirmesi:** Özel (private) Realtime kanalları + `realtime.messages` üzerinde RLS politikaları. Yalnızca konuşma üyeleri abone olabilir.

**Çevrimdışı ve dayanıklılık:**
- İstemci tarafında yerel önbellek (SQLite/MMKV) + gönderim kuyruğu (offline'da yazılan mesaj, bağlantı gelince gönderilir; idempotency key ile çift kayıt önlenir).
- Push bildirimleri: Uygulama arka plandayken Expo Push. İçerik varsayılan olarak gizli ("Yeni bir mesajın var").

### 26.2 Ölçeklenebilirlik değerlendirmesi

| Ölçek (aylık aktif) | Tahmini durum | Aksiyon |
|---|---|---|
| 0 – 50 bin | Supabase Pro rahatça taşır | Doğru indeksler, bölümleme, Broadcast |
| 50 bin – 300 bin | Eşzamanlı bağlantı ve mesaj/sn sınırları izlenmeli; daha büyük compute, okuma replikası | Supabase Team/Enterprise plan; `messages` için zaman bölümleme + arşiv |
| 300 bin + | Mesajlaşmanın ayrı bir servise taşınması değerlendirilir | Seçenek A: Yönetilen sohbet API'si (Stream Chat, Sendbird). Seçenek B: Kendi WebSocket katmanınız (Elixir/Phoenix ya da Go + Redis/NATS) ve mesajlar için ayrı bir depolama |

**Kritik tasarım kararı:** İlk günden **mesajlaşma için bir soyutlama katmanı** kurmak (`ChatService` arayüzü). Böylece ileride arka uç değiştirilirse mobil uygulamada büyük bir yeniden yazım gerekmez.

**Neden baştan Stream/Sendbird değil?** Bu servisler hızlı başlatır ama (1) kademeli yetki modeli gibi özel iş kurallarını sunucu tarafında uygulamak zorlaşır, (2) maliyetleri kullanıcı başına artar, (3) hassas mesaj verisi üçüncü tarafta tutulur (KVKK yurt dışı aktarım yükü artar). MVP için Supabase daha uygun ve kontrollü.

---

## 27. Video Görüşme Altyapısı

### 27.1 Seçenekler

| Seçenek | Artı | Eksi | Değerlendirme |
|---|---|---|---|
| **Saf P2P WebRTC (kendi sinyalleşmeniz + kiralık TURN)** | Ucuz | **IP adresi karşı tarafa sızar** (stalking riski!), NAT sorunları, kalite yönetimi zor | ❌ Bu ürün için uygun değil |
| **LiveKit Cloud** | Açık kaynak (vendor lock-in düşük), React Native SDK, E2EE desteği, AB bölgesi, ileride kendi sunucunuzda çalıştırma imkânı | Kullanım bazlı maliyet | ✅ **Önerilen** |
| **Agora** | Olgun, küresel ağ, RN SDK | Kapalı kaynak, fiyatlandırma karmaşık | ✅ Alternatif |
| **Daily** | Kolay entegrasyon | RN desteği LiveKit kadar kapsamlı değil | Alternatif |
| Twilio Video | — | Ürünün geleceği konusunda belirsizlik geçmişi var | Önerilmez |

### 27.2 Önerilen akış (LiveKit)

1. Kullanıcı "Ara"ya basar → Edge Function `connection_permissions` kontrolü yapar (Seviye 3/4 açık mı, engel var mı).
2. Sunucu kısa ömürlü (ör. 2 dk geçerli) bir **oda token'ı** üretir. Oda adı tahmin edilemez.
3. Karşı tarafa VoIP push ile **çağrı bildirimi**: iOS'ta CallKit, Android'de ConnectionService. Gerçek çağrı deneyimi sağlar.
4. Medya **SFU üzerinden** akar → IP gizliliği sağlanır.
5. İsteğe bağlı **uçtan uca şifreleme** (insertable streams). Böylece sunucu bile medyayı göremez. Bu, güçlü bir gizlilik mesajıdır.
6. Görüşme bitince yalnızca meta veri kaydedilir (süre, katılımcılar, kalite). İçerik kaydedilmez.

### 27.3 Maliyet ve ölçek

- Bire bir görüşmeler **katılımcı-dakika** bazında fiyatlanır. Yalnızca Seviye 3–4'e ulaşmış çiftler görüşebildiği için hacim doğal olarak sınırlı ve öngörülebilir olur. Bu, kademeli sistemin bir yan faydası.
- Ücretsiz kullanıcıya makul görüşme süresi sınırı (ör. 30 dk/görüşme, yeniden başlatılabilir) maliyet kontrolü sağlar ve kullanıcıyı cezalandırmaz.
- Grup sesli odaları (Faz 3) aynı altyapıyla mümkün.
- Çok yüksek ölçekte LiveKit'i kendi Kubernetes kümenizde çalıştırmak maliyeti ciddi ölçüde düşürebilir.

---

## 28. KVKK / GDPR

### 28.1 Veri sınıflandırması

| Veri | Sınıf | Hukuki dayanak (öneri) |
|---|---|---|
| Ad/rumuz, yaş, şehir | Kişisel veri | Sözleşmenin ifası |
| Telefon numarası | Kişisel veri | Sözleşmenin ifası + güvenlik (meşru menfaat) |
| İlişki durumu, boşanma durumu, ayrılık süresi | Kişisel veri; bağlama göre **"cinsel hayat"** kapsamında yorumlanabilir | **Açık rıza** (temkinli yaklaşım) |
| Cinsiyet tercihi / yönelim (eşleşme tercihi) | **Özel nitelikli** (cinsel hayat / yönelim) | **Açık rıza** |
| Selfie / yüz eşleşmesi | **Biyometrik — özel nitelikli** | **Açık rıza** |
| Kriz ifadeleri / sağlık beyanları | **Sağlık verisi — özel nitelikli** | Açık rıza / hayati menfaat; çok sınırlı işleme |
| Özel mesajlar, fotoğraflar | Kişisel veri (yüksek hassasiyet) | Sözleşmenin ifası; moderasyon için meşru menfaat |
| Konum (kaba) | Kişisel veri | Açık rıza / sözleşme |
| Cihaz bilgisi, IP | Kişisel veri | Güvenlik (meşru menfaat) |

> Not: Dating ve sosyal keşif uygulamaları Avrupa'da hassas veri ve üçüncü taraflarla paylaşım konularında ağır cezalar almıştır (ör. bir dating uygulamasının Norveç'te reklam ortaklarıyla veri paylaşımı nedeniyle aldığı ceza). **Hassas veriler reklam veya analitik SDK'larına asla gönderilmemeli.**

### 28.2 Uyum gereklilikleri (Türkiye)

1. **Aydınlatma metni** (katmanlı: kısa özet + detay) ve **ayrı açık rıza metinleri.** Açık rıza hizmet şartına bağlanamaz; reddedildiğinde yalnızca ilgili özellik kapanır.
2. **VERBİS kaydı:** Eşik/istisna durumu hukuki danışmanla netleştirilmeli; özel nitelikli veri işleme nedeniyle kayıt yükümlülüğü büyük olasılıkla doğar.
3. **Yurt dışına aktarım (KVKK m.9, 2024 değişikliği):** Supabase AB bölgesi, AI sağlayıcıları ve doğrulama sağlayıcıları yurt dışında. **Standart sözleşmeler** imzalanmalı ve imzadan sonra **5 iş günü içinde Kurum'a bildirilmeli.** Alternatif: Hassas veriler için Türkiye'de barındırma seçeneği değerlendirilebilir (maliyet ve karmaşıklık artar).
4. **Özel nitelikli veri güvenlik önlemleri:** Kurul'un özel nitelikli veriler için belirlediği yeterli önlemler (şifreleme, erişim yetkilendirme, log, eğitim vb.).
5. **Veri ihlali bildirimi:** 72 saat içinde Kurul'a bildirim, ilgili kişilere bildirim prosedürü.
6. **5651 sayılı Kanun:** Sosyal ağ sağlayıcısı yükümlülükleri. Türkiye'den günlük erişimi **1 milyonun üzerindeki** sosyal ağ sağlayıcıları için temsilci atama, raporlama ve içerik kaldırma talebi yükümlülükleri var. Başlangıçta eşik altında kalınacak olsa da büyüme planlamasında dikkate alınmalı. Yer sağlayıcı yükümlülükleri ilk günden geçerli.
7. **Ticari elektronik ileti (İYS):** Pazarlama SMS/e-postaları için onay ve İYS kaydı.
8. **Mesafeli satış / tüketici mevzuatı:** Abonelik koşulları, cayma hakkı bilgilendirmesi (mağaza ödemeleri kendi süreçlerine tabi ama bilgilendirme metinleri gerekir).

### 28.3 GDPR (AB kullanıcıları ya da AB'de barındırma)

Türkiye'de başlansa bile AB'deki Türk diasporası kullanıcı olabilir. Bu durumda GDPR doğrudan uygulanır: DPIA (Veri Koruma Etki Değerlendirmesi) **zorunlu** düzeyde önerilir (özel nitelikli veri + yeni teknoloji + kırılgan kişiler). Ayrıca AB temsilcisi (Madde 27) ve DPO değerlendirmesi gerekir. **AB'nin Dijital Hizmetler Yasası (DSA)** da online platform yükümlülükleri getirir (şikâyet mekanizması, karar gerekçesi, şeffaflık).

### 28.4 Ürün içi gizlilik özellikleri

| Özellik | Açıklama |
|---|---|
| **Veri minimizasyonu** | Kesin konum tutulmaz (şehir/ilçe kaba konum). Doğum tarihi tutulur ama yaş gösterilir. Çocuk bilgisi isteğe bağlıdır |
| **Profil gizleme** | Keşfet'ten tamamen çekilme; "yalnızca topluluk" modu; geçici "mola" modu |
| **Son görülme / okundu gizleme** | Varsayılan kapalı (karşılıklı: kapatan, karşı tarafınkini de görmez) |
| **Konum gizleme** | Şehir bile gizlenebilir (bu durumda şehir bazlı öneri yapılmaz) |
| **Fotoğraf erişim izinleri** | Fotoğraf başına görünürlük: herkes / eşleşmeler / Seviye 2+ / yalnızca ben. iOS sınırlı fotoğraf kütüphanesi erişimi desteklenir |
| **Rehberden gizlen** | Rehber numaraları **cihazda** hash'lenir, yalnızca hash gönderilir, eşleşme sonrası silinir |
| **Gizli bildirimler** | "Yeni bildirim" gibi nötr metin; uygulama adı yerine nötr bildirim başlığı seçeneği |
| **Uygulama kilidi** | Face ID / parmak izi / PIN |
| **Veri indirme** | Uygulama içinden JSON + medya arşivi; e-posta ile güvenli link (30 gün içinde yasal süre; hedef 48 saat) |
| **Hesap silme** | Uygulama içinden (Apple zorunluluğu). 30 günlük geri alma penceresi, ardından kalıcı silme. Karşı taraftaki sohbetlerde "Silinmiş kullanıcı". Yasal saklama gerektiren moderasyon kayıtları anonimleştirilip sınırlı süre tutulur |
| **Saklama politikası** | Ör. silinmiş mesajlar 30 gün, doğrulama selfiesi doğrulamadan hemen sonra (ya da en geç 30 gün), log'lar 1–2 yıl (5651 trafik verisi yükümlülükleri ayrıca değerlendirilir) |

### 28.5 Özel mesajların korunması: uçtan uca şifreleme (E2EE) mi?

**İkilem:** E2EE, mahremiyeti en üst düzeye taşır, ama platformun taciz, dolandırıcılık ve kriz tespiti yapmasını **imkânsız hale getirir.** Bu ürünün kitlesi kırılgan ve dolandırıcılık riski yüksek.

**Önerilen model ("Korunan mesajlaşma"):**
1. **Aktarımda şifreleme:** TLS 1.2+ (sertifika sabitleme değerlendirilir).
2. **Depoda şifreleme:** Disk düzeyi (sağlayıcı) + **uygulama düzeyinde alan şifreleme.** `messages.body`, anahtarı ayrı tutulan (KMS/Vault) bir anahtar ile şifrelenir. Veritabanı dökümü sızsa bile mesajlar okunamaz.
3. **İnsan erişimi yasak (varsayılan):** Hiçbir çalışan mesajları serbestçe okuyamaz. Moderatör yalnızca **raporlanan** içeriğe ve raporun bağlamına (raporlanan mesajın öncesi/sonrası sınırlı pencere) erişir. Her erişim audit log'a yazılır.
4. **Otomatik tarama:** Makine sınıflandırması yapılır (insan okumaz). Bu kullanıcıya şeffafça anlatılır.
5. **Görüntülü görüşmeler:** E2EE açık (sunucu medyayı göremez; kayıt yok).
6. **Gelecek:** "Gizli sohbet" (E2EE) seçeneği, Seviye 4+ ve uzun süreli güvenilir bağlantılar için sonraki fazda sunulabilir. Bu modda raporlama, kullanıcının cihazından mesajları **kendi isteğiyle** iletmesiyle çalışır.

Bu yaklaşım kullanıcıya dürüstçe anlatılmalı: *"Mesajların şifreli saklanır, kimse okumaz. Yalnızca sen bir mesajı raporlarsan, o mesaj güvenlik ekibimizce incelenir."*

---

## 29. App Store ve Google Play Riskleri

| Risk | İlgili kural (özet) | Önlem |
|---|---|---|
| **Kullanıcı içeriği (UGC) gereklilikleri** | Apple 1.2: Filtreleme, raporlama, engelleme, iletişim bilgisi, kötüye kullanana karşı aksiyon zorunlu | Tümü MVP'de var. İnceleme notlarında demo hesap + moderasyon açıklaması |
| **Dating kategorisi ve "spam" (4.3)** | Apple dating/hookup uygulamalarında doymuş kategori nedeniyle sıkı | Konumlandırma: topluluk + sosyal keşif. Benzersiz özellikler (masalar, kademeli rıza) inceleme notunda vurgulanır. **Cinsel çağrışımlı dil ve görseller kullanılmaz** |
| **Yaş derecelendirmesi** | Apple'ın güncellenmiş yaş derecelendirme sistemi (18+), Google Play IARC | 18+ derecelendirme; uygulama içi yaş beyanı/doğrulama; Apple'ın Declared Age Range ve benzeri yaş sinyali API'leri ile ülkeye özel yaş doğrulama mevzuatı takip edilmeli |
| **Hesap silme** | Apple 5.1.1(v), Google Play hesap silme politikası (uygulama içi + web'den silme linki) | Uygulama içi silme + web formu |
| **Dijital ürün ödemeleri** | Apple 3.1.1 / Google Play Billing: Dijital içerik, abonelik ve sanal hediye **IAP ile** satılmalı | RevenueCat + IAP. Hediyeler paraya çevrilmez (aksi halde "creator payout" kuralları ve ödeme kuruluşu lisansı devreye girer) |
| **Fiziksel hediye ve etkinlik biletleri** | Uygulama dışında tüketilen ürün/hizmetler IAP dışı ödenebilir | Ayrı ödeme sağlayıcı (iyzico vb.). Kurallar lansman öncesi teyit edilmeli |
| **Çocuk güvenliği** | Google Play Child Safety Standards politikası (sosyal ve dating uygulamaları için yayınlanmış CSAE standartları, raporlama mekanizması, iletişim noktası) | Politika sayfası + süreç + iletişim kişisi |
| **Sağlık iddiaları** | "Terapi", "tedavi", "iyileştirir" ifadeleri tıbbi iddia sayılabilir | Dil denetimi: "destek", "topluluk", "dayanışma". Açık feragatname: "Profesyonel tedavinin yerini tutmaz" |
| **Gizlilik beyanları** | Apple Privacy Nutrition Label, Google Data Safety, Privacy Manifest (SDK'lar) | Doğru ve eksiksiz doldurulmalı; SDK envanteri |
| **İzin talepleri** | Kamera, mikrofon, rehber, konum, bildirim izinleri gerekçesiz istenirse red | İzinler yalnızca ilgili özelliğe ilk girişte ve açıklamalı (just-in-time) istenir. Rehber izni tamamen isteğe bağlıdır |
| **AI üretimi içerik** | Mağazalar AI ile üretilen içerik için raporlama ve filtre bekliyor | AI emoji üretiminde güvenlik filtresi + raporlama |
| **VoIP push** | iOS'ta VoIP push yalnızca gerçek arama için kullanılmalı, aksi halde uygulama cezalandırılır | Sadece görüşmelerde CallKit ile |

**İnceleme stratejisi:** İlk sürüm sakin ve topluluk odaklı olmalı. İnceleme ekibine ayrıntılı not, demo hesaplar ve moderasyon akış açıklaması verilmeli. Görüntülü görüşme ve hediye gibi "riskli algılanan" özellikler ilk incelemeden geçtikten sonra güncellemelerle eklenebilir.

---

## 30. İlk MVP'de Olması Gereken Özellikler

**MVP hedefi:** "İnsanlar burada güvende hissediyor, gerçek sohbetler başlıyor ve geri geliyorlar mı?" sorusunu **tek bir şehirde** (öneri: İstanbul, ya da İstanbul + Ankara + İzmir) cevaplamak.

### 30.1 MVP kapsamı

**Hesap ve profil**
- [ ] Telefon OTP ile kayıt, 18+ beyanı, Apple/Google ile giriş (telefon yine zorunlu)
- [ ] Sade profil (zorunlu: rumuz, doğum tarihi, şehir, ne arıyor; diğerleri isteğe bağlı)
- [ ] Alan bazında gizleme, avatar ya da fotoğraf seçimi (hazır avatar seti)
- [ ] Selfie canlılık doğrulaması (davet göndermek için zorunlu)
- [ ] Rehberden gizlenme, gizli bildirimler, uygulama kilidi

**Keşfet ve eşleşme**
- [ ] Günlük sınırlı öneri listesi + "Neden önerildi?"
- [ ] Davet gönder / kabul / nazikçe geç (gelen ve giden kotaları)
- [ ] Kural tabanlı eşleşme (embedding'e hazır şema)

**Birebir sohbet + kademeli iletişim**
- [ ] Seviye 1: Metin, emoji, tepki, sohbet başlatıcı kartları
- [ ] Seviye 2: Fotoğraf (kör çift onay, bulanık önizleme, AI tarama, geri alma)
- [ ] Sesli mesaj (ayrı çift onaylı anahtar)
- [ ] Rıza motoru: Uygunluk, kör onay, cooldown, tek taraflı geri alma, rıza log'u
- [ ] Yumuşak yakınlık göstergesi (yalnızca iki taraf görür, kapatılabilir)
- [ ] "Nazikçe bitir"

**Topluluk**
- [ ] 8–12 platform odası (destek, şehir, ilgi, akşam sohbeti)
- [ ] **Masa grupları** (sistem kurulumlu, 6 kişi, 7 günlük; günlük soru kartı; masa sonu kör onaylı birebir devam)
- [ ] Basit grup oyunları (soru kartları + "Bu mu o mu?")

**Güvenlik**
- [ ] Engelle, raporla (kullanıcı/mesaj/oda mesajı), rahatsız edici mesaj gizleme
- [ ] AI metin moderasyonu (taciz, cinsel içerik, dolandırıcılık, kriz) + görsel moderasyon
- [ ] Dolandırıcılık uyarı kartları, link/IBAN/telefon tespiti
- [ ] Kriz akışı (müdahale ekranı + kritik kuyruk)
- [ ] Rate limit, yeni hesap kısıtları, cihaz bazlı ban
- [ ] Topluluk kuralları + Güvenlik Merkezi

**Gizlilik ve uyum**
- [ ] Aydınlatma metni + ayrık açık rızalar + rıza kaydı
- [ ] Uygulama içi veri indirme ve hesap silme
- [ ] Şifreli mesaj saklama, EXIF temizleme, imzalı URL'ler

**Yönetim paneli (web)**
- [ ] Kullanıcı arama/görüntüleme (hassas alanlar maskeli)
- [ ] Rapor kuyruğu → vaka yönetimi → aksiyon (uyarı, kısıtlama, askı, ban) + **değiştirilemez audit log**
- [ ] Oda/masa yönetimi, soru kartı içerik yönetimi
- [ ] Güvenlik olayları (kriz) ekranı, kısıtlı rol
- [ ] Temel metrikler panosu
- [ ] RBAC + 2FA

**Ölçüm**
- [ ] Gizlilik dostu analitik, hata izleme, temel KPI'lar (Bölüm 34.4)

### 30.2 MVP'de bilinçli olarak **olmayacaklar**

Sesli/görüntülü görüşme, buluşma planlayıcı, sosyal akış (ana sayfa), hediyeler, AI emoji, kullanıcı tarafından oluşturulan gruplar/odalar, premium abonelik (ödeme altyapısı hazırlanır, ama lansmanda **ücretsiz beta**).

> **Tartışmaya açık nokta: Sosyal akış MVP'de olmalı mı?**
> Önerim: **Hayır, Faz 2'de.** Akış, moderasyon yükünü en çok artıran özellik ve az kullanıcıyla "boş" görünür. MVP'de topluluk ihtiyacını odalar ve masalar karşılar. Ancak sizin vizyonunuzda akış merkezi bir yere sahip. Alternatif: MVP'de yalnızca metin tabanlı, oda içine gömülü "günün sorusu" cevap akışı. Bu, akışın hafif bir prototipi olur.

---

## 31. Sonraki Fazlara Bırakılabilecek Özellikler

| Faz | Özellikler |
|---|---|
| **Faz 2: Derinleşme** | Sosyal akış (rumuzlu paylaşım, nazik tepkiler, Küçük Zaferler), Seviye 3 sesli görüşme, Seviye 4 görüntülü görüşme (LiveKit, E2EE), Premium abonelik (RevenueCat), gelişmiş filtreler, avatar ruh hali paketleri, AI kişiselleştirilmiş sohbet başlatıcı, profil yazım yardımcısı, ML tabanlı risk skoru, moderatör AI yardımcısı, NFC kimlik rozeti |
| **Faz 3: Bağ ve gerçek dünya** | Seviye 5 buluşma planlayıcı + güvenlik araçları, platform etkinlikleri (küçük grup buluşmaları, bilet), sanal hediyeler (IAP), AI kişisel emoji, kullanıcı grupları, masa sesli odaları, oda rehberi programı, "Yol arkadaşı" mentor eşleşmesi |
| **Faz 4: Ekosistem ve büyüme** | Fiziksel hediyeler (kupon modeli), doğrulanmış uzman içerikleri ve AMA'lar, "Yeni Başlangıç" 30 günlük programları, E2EE "gizli sohbet", web sürümü, yeni şehirler ve ülkeler (Almanya'daki Türk diasporası, Azerbaycan vb.), çok dillilik |

---

## 32. Tahmini Geliştirme Aşamaları

> Varsayım: Küçük ve odaklı bir ekip (1 kıdemli full-stack/mobil geliştirici + 1 mobil geliştirici + yarı zamanlı tasarımcı + ürün sahibi olarak siz; AI destekli geliştirme araçlarıyla). Süreler tahminidir ve kapsam netleştikçe güncellenir.

| Aşama | İçerik | Süre (tahmini) |
|---|---|---|
| **0. Keşif ve doğrulama** | 15–25 hedef kullanıcıyla görüşme, isim/marka, rakip taraması, hukuki ön danışmanlık (KVKK, sözleşmeler), fiyat hipotezi, bekleme listesi (landing page) | 3–4 hafta |
| **1. Tasarım** | Bilgi mimarisi, kullanıcı akışları, tasarım sistemi (renk, tipografi, ton), MVP ekranlarının yüksek doğruluklu tasarımı, tıklanabilir prototip, kullanıcı testleri | 4–6 hafta (Aşama 0 ile kısmen paralel) |
| **2. Teknik temel** | Monorepo, Supabase şeması + RLS, auth, CI/CD (EAS), ortamlar (dev/staging/prod), gözlemlenebilirlik, admin panel iskeleti | 2–3 hafta |
| **3. MVP çekirdeği** | Profil, doğrulama, keşfet, davet, sohbet, rıza motoru, odalar, masalar, oyun kartları | 8–10 hafta |
| **4. Güvenlik ve panel** | Moderasyon boru hattı, raporlama, kriz akışı, admin vaka yönetimi, gizlilik özellikleri, veri indirme/silme | 4–5 hafta (3 ile kısmen paralel) |
| **5. Sertleştirme** | Penetrasyon testi, performans ve yük testi, erişilebilirlik, KVKK dokümantasyonu, mağaza hazırlığı | 2–3 hafta |
| **6. Kapalı beta** | 200–500 davetli kullanıcı (tek şehir), haftalık iterasyon | 4–6 hafta |
| **7. Halka açık lansman (tek şehir)** | Mağaza yayını, topluluk lansmanı | — |
| **Faz 2** | Akış, görüşmeler, premium | +3–4 ay |
| **Faz 3** | Buluşma, etkinlikler, hediyeler, AI emoji | +3–4 ay |

**Toplam:** Fikirden kapalı betaya yaklaşık **5–7 ay**, halka açık MVP lansmanına **6–8 ay.**

**Tahmini aylık işletme maliyeti (MVP, ~5–10 bin kullanıcı; kabaca):** Supabase Pro + compute ek ücretleri, SMS OTP, selfie doğrulama (en büyük değişken kalem, kullanıcı başı ücret), moderasyon API'leri, Sentry/PostHog (ücretsiz katmanlar), Apple Developer (yıllık) + Google Play (tek seferlik). Altyapı tarafı düşük yüzlerce dolar düzeyinde başlar. Doğrulama ve SMS kullanıcı artışıyla doğrusal büyür. **Asıl maliyet insan: geliştirme ve moderasyon.** Kesin rakamlar sağlayıcı teklifleriyle MVP planında çıkarılacak.

---

## 33. Uygulama için 20 İsim Önerisi ve Sloganları

> ⚠️ Tüm isimler için **TÜRKPATENT marka araştırması, alan adı (.com / .com.tr / .app) ve mağaza adı uygunluğu** kontrol edilmeli. Aşağıdakiler henüz kontrol edilmedi.

| # | İsim | Slogan | Neden |
|---|---|---|---|
| 1 | **Aralık** | "Kapı yavaşça aralanır." | Kademeli iletişimin birebir metaforu. Kısa, Türkçe, akılda kalıcı. **Favorim** |
| 2 | **Usul** | "Usul usul, yeniden." | Acelesiz tanışma vaadi; sakin ve olgun bir ton |
| 3 | **Yeniden** | "Yeniden başlamak, yalnız değil." | Doğrudan değer önerisi; umut tonu |
| 4 | **Liman** | "Fırtınadan sonra güvenli bir liman." | Güven ve sığınak hissi |
| 5 | **Masa** | "Bir masa, altı sandalye, yeni dostluklar." | Küçük grup özelliğine vurgu; sıcak ve sosyal |
| 6 | **Yol Arkadaşı** | "Bu yolu yalnız yürüme." | Destek + arkadaşlık; ilişkiyi zorlamıyor |
| 7 | **Kıyı** | "Dalgalar dinince, kıyıda buluşalım." | Sakinlik, yeni başlangıç |
| 8 | **Demlik** | "Bir çay demlik sohbet." | Çok yerel ve samimi; Türk sohbet kültürü |
| 9 | **Filiz** | "Her bitiş, bir filizle başlar." | Umut, büyüme. (Yaygın bir isim olduğu için marka koruması zor olabilir) |
| 10 | **Ferah** | "İçin ferahlasın." | Hafiflik, nefes alma hissi |
| 11 | **Pusula** | "Yönünü yeniden bul." | Ayrılık sonrası yön bulma; nötr ve olgun |
| 12 | **Köprü** | "Yalnızlıktan bağa." | Geçiş ve bağ |
| 13 | **Halka** | "Senin halkan, senin hızın." | Topluluk çemberi |
| 14 | **Nefes** | "Derin bir nefes, yeni bir sohbet." | Rahatlama; ancak yaygın kullanılan bir kelime |
| 15 | **Sonra** | "Bitişten sonra, hikâyenin devamı." | Düşündürücü, özgün |
| 16 | **Kapı Aralığı** | "Ne zaman açacağına sen karar ver." | Rıza ilkesinin doğrudan anlatımı |
| 17 | **Dostane** | "Önce dost, sonrası sizin hikâyeniz." | Ürünün temel felsefesi |
| 18 | **Bahar** | "Her mevsimin bir baharı var." | Yeni başlangıç; "ikinci bahar" çağrışımı (40+ için olumlu) |
| 19 | **Afterglow** | "Life after the ending." | Uluslararası genişleme için İngilizce seçenek |
| 20 | **Kindred** | "Find your people, again." | Uluslararası; "ruh akrabası" anlamı |

**Kısa listem:** Aralık, Usul, Masa, Yol Arkadaşı. Aralık'ı bu raporun çalışma adı olarak kullandım.

---

## 34. Ürün Yöneticisi Önerileri (Sizin Düşünmediğiniz Ama Başarıyı Belirleyecek Özellikler)

### 34.1 Kritik (MVP'ye girmeli)

1. **Rehberden / eski eşten gizlenme.** Boşanma bağlamının en büyük kaygısı "eski eşim, ailem ya da iş arkadaşım beni burada görür mü?". Telefon numarası hash'iyle karşılıklı gizlenme ve belirli bir numarayı önceden engelleme. *Bu özellik tek başına kayıt oranını artırabilir.*
2. **Kör (çift körlü) onay mekanizması.** Seviye teklifleri, masa sonu birebir devam ve buluşma tekliflerinde kimin hayır dediği asla görünmez. Kırılgan kitlede reddedilme acısını sıfırlar.
3. **"Önce konuşmak istiyorum" modu.** Yeni ayrılmışlar için varsayılan olarak romantik keşfi geri plana alan mod. Ürünün "seni koruruz" vaadinin somut hali.
4. **Gelen davet kotası ve dikkat adaleti.** Popüler profillerin boğulmasını, ve dolayısıyla kadın kullanıcıların kaçmasını engeller.
5. **"Nazikçe bitir" şablonları.** Ghosting yerine saygılı vedalaşma. Topluluk kültürünü ilk günden belirler.
6. **Gizli bildirim + uygulama kilidi.** Telefonu başkasıyla paylaşan ya da çocuklarının eline veren ebeveynler için kritik.

### 34.2 Yüksek değer (Faz 2–3)

7. **"Yol Arkadaşı" programı (mentorluk).** Ayrılığın üzerinden 1+ yıl geçmiş, gönüllü ve doğrulanmış kullanıcılar, yeni gelenlere (romantik olmayan modda) destek olur. Topluluğun kalbi haline gelir, yeni kullanıcı tutundurmayı güçlendirir.
8. **Platform etkinlikleri (küçük grup, kamusal alan).** "Pazar kahvaltısı – 6 kişi" gibi. Birebir buluşmadan daha güvenli bir ilk temas; etik ve güçlü bir gelir kalemi.
9. **"Küçük Zaferler" ve ilerleme günlüğü (özel).** Kullanıcının kendi iyileşme yolculuğunu not edebileceği özel bir alan: "Bu hafta ilk kez yalnız sinemaya gittim." İsterse toplulukla paylaşır. Ürüne "sadece insanlar değil, ben de iyileşiyorum" boyutu katar.
10. **Hukuki ve pratik kaynak kütüphanesi.** Boşanma süreci, velayet, ortak ebeveynlik hakkında **genel bilgi** içerikleri ve doğrulanmış uzman AMA'ları. Hukuki tavsiye olmadığı açıkça belirtilir. Boşanma sürecindeki kullanıcı için güçlü bir giriş kapısı.
11. **Ortak ebeveyn takvimi uyumu.** Çocuklu kullanıcılar "çocuklarla olduğum haftalar" bilgisini işaretleyebilir (özel). Masa etkinlik önerileri ve buluşma planlayıcısı buna göre filtrelenir. Küçük ama çok anlamlı bir detay.
12. **Mola modu.** "Bir süre ara vermek istiyorum": Profil gizlenir, sohbetler korunur, karşı tarafa nazik bir durum mesajı gider. Uygulamayı silmek yerine ara vermeyi mümkün kılar.

### 34.3 Büyüme ve topluluk stratejisi

13. **Tek şehirde yoğunluk, sonra genişleme.** Sosyal ürünlerde ilk 6 ay boyunca yoğunluk, genişlikten daha önemli. İstanbul'da 5.000 aktif kullanıcı, Türkiye geneline dağılmış 20.000 kullanıcıdan daha değerlidir.
14. **Kurucu topluluk (founding members).** İlk 500 kullanıcı davetle gelsin; "Kurucu üye" rozeti ve geri bildirim kanalı olsun. Kültürü onlar belirler.
15. **İçerik odaklı edinim.** Instagram/TikTok'ta "ayrılıktan sonra hayat" konulu sıcak ve umutlu içerik serisi. Boşanma avukatları ve terapistler gibi profesyonellerle (etik çerçevede) farkındalık iş birlikleri. Podcast.
16. **Sahte profil yasağının kamuya ilanı.** "Burada bot yok, sahte profil yok, satın alınmış etkileşim yok" sözü. Rakiplerden ayrışan bir güven mesajı.

### 34.4 Ölçüm (North Star)

17. **North Star metriği: "Haftalık anlamlı sohbet sayısı".** Tanım: İki taraflı, en az 3 farklı günde, karşılıklı 10+ mesaj içeren sohbetler (birebir ya da masa). Eşleşme sayısı ya da uygulamada geçirilen süre kullanılmamalı; bunlar bağımlılık optimizasyonuna iter.
   - Destek metrikleri: İlk gün gerçek etkileşim oranı, D7/D30 tutunma, masa tamamlama oranı, davet kabul oranı (cinsiyet kırılımlı), **1.000 kullanıcı başına güvenlik raporu**, rapor çözüm süresi, "kendimi güvende hissediyorum" anket skoru.
   - **Sağlıklı ayrılış (healthy churn) metriği:** "İlişki/arkadaşlık bulduğum için ayrılıyorum" çıkış anketi oranı. Başarının ölçüsü ve pazarlama hikâyesi.

---

## 35. Konumlandırma Analizi

| Seçenek | Artı | Eksi | Sonuç |
|---|---|---|---|
| **Dating App** | Net pazar, bilinen gelir modelleri | Kalabalık kategori, Apple 4.3 riski, kırılgan kitleye "pazar" hissi, vizyonla çelişki | ❌ |
| **Social Discovery** | Geniş, nötr; arkadaşlık ve ilişkiyi kapsar | Tek başına duygusal bağlamı ve "neden biz" sorusunu anlatmaz | ✅ (kategori olarak) |
| **Relationship Recovery Community** | Çok net hedefleme, derin empati | "Hasta / iyileşme" çağrışımı; insanlar bir süre sonra kendini "iyileşmiş" görüp ayrılır; büyüme tavanı düşük | ⚠️ (giriş kapısı olarak) |
| **Community + Dating** | Vizyona yakın | "Dating" kelimesi algıyı domine eder | ⚠️ |

**Önerilen konumlandırma:**
> **"Ayrılıktan sonra yeniden bağ kurmak için güvenli bir topluluk."**
> *Kategori:* Topluluk öncelikli sosyal keşif (Social Networking).
> *Giriş kapısı:* Ayrılık ve boşanma deneyimi (empati).
> *Uzun vadeli değer:* Arkadaşlık, dostluk ve isteyene ilişki (umut).

Bu konumlandırma, kullanıcı "iyileştikten" sonra da ürünün değerli kalmasını sağlar: Kullanıcı artık "Yol arkadaşı"dır, etkinliklere katılır, dostlarıyla buradadır. **Mesaj hiyerarşisi:** 1) Yalnız değilsin → 2) Güvendesin → 3) Hızını sen belirlersin → 4) Nereye gideceğine sen karar verirsin.

---

## 36. Tasarım Dili Önerisi

- **Duygu:** Sıcak, sakin, umutlu, olgun. "Akşam güneşi" değil, **"sabah ışığı"**.
- **Renk paleti önerisi:** Sıcak kum/krem zemin; ana renk olarak **gün doğumu terrakotası** ya da **sıcak mercan**; ikincil renk olarak **adaçayı yeşili** (iyileşme, büyüme); vurgu olarak yumuşak altın. Klasik dating pembesi/kırmızısı ve neon renklerden kaçınılmalı. Koyu mod: lacivert-mürdüm tonlarında sıcak bir gece paleti.
- **Tipografi:** Okunaklı, yuvarlak hatlı bir sans-serif. Başlıklarda karakterli bir serif. 30–55 yaş kitlesi için **büyük temel punto** (17pt+) ve yüksek kontrast.
- **İllüstrasyon:** Yarı soyut, sıcak, insan figürleri (fotoğraf yerine). Kapılar, pencereler, masalar, yollar gibi motifler.
- **Mikro metinler:** "Eşleşme" yerine "Bağlantı"; "Beğen" yerine "Yanındayım / Güzel"; "Reddet" yerine "Nazikçe geç".
- **Kaçınılacaklar:** Kaydırma (swipe) kartları, ateş/alev ikonları, "sıcak profiller", geri sayım ve kıtlık dili ("son 2 saat!").

---

## 37. Net Cevap: Bu Uygulamayı Mevcut Teknoloji İmkânlarıyla Profesyonel ve Ölçeklenebilir Şekilde Geliştirebilir miyiz?

# **Evet.**

**Teknik açıdan:** Önerdiğiniz yığın (React Native + Expo, Supabase/PostgreSQL, Supabase Auth/Storage/Realtime) birkaç düzeltmeyle (video için LiveKit, mobil dağıtım için EAS, Vercel yalnızca panel ve web için, abonelik için RevenueCat, mesajlaşmada soyutlama katmanı) **MVP'den yüz binlerce kullanıcıya kadar** profesyonel ve ölçeklenebilir bir temel sağlar. Daha büyük ölçekte mesajlaşma ve video katmanları, mobil uygulama yeniden yazılmadan ayrı servislere taşınabilir. Kademeli rıza motoru, moderasyon boru hattı ve gizlilik özellikleri, bugün hazır bulunan araçlarla (pgvector, LLM moderasyonu, canlılık doğrulama API'leri, SFU tabanlı WebRTC) kurulabilir. Bilinmeyen ya da araştırma gerektiren bir teknoloji yok.

**Başarıyı belirleyecek asıl faktörler teknik değil:**

1. **Güven ve güvenlik operasyonu:** Moderasyonun insan tarafı (7/24 kriz kapsaması dahil) ilk günden bütçelenmeli.
2. **Yoğunluk:** Tek şehir + kurucu topluluk + masa grupları ile "boş uygulama" sorunu aşılmalı. Sahte profille asla.
3. **Denge:** Kadın kullanıcıların güvende hissetmesi, ürünün yaşaması için ön koşul.
4. **Hukuk ve mağaza:** KVKK (özel nitelikli veri, yurt dışı aktarım), mağaza UGC ve ödeme kuralları lansman öncesi hukuki danışmanlıkla kapatılmalı.
5. **Disiplinli kapsam:** MVP'de kademeli sohbet + odalar + masalar + güvenlik. Gerisi kanıtlandıkça.

Bu riskler bilinçli olarak yönetilirse ürün, Türkiye'de belirgin bir boşluğu dolduran, savunulabilir farklılaştırıcılara (rıza motoru, masalar, mahremiyet) sahip ve etik gelir modeliyle güven kazanabilecek bir platform olabilir.

---

## Sonraki Adım: Birlikte Karar Vermemiz Gerekenler

1. **Konumlandırma:** "Topluluk öncelikli sosyal keşif" önerisini onaylıyor musunuz?
2. **Sesli mesaj:** Seviye 1'de ayrı anahtar mı, yoksa Seviye 2 ile birlikte mi açılsın?
3. **Sosyal akış:** MVP'de mi (hafif sürüm), Faz 2'de mi?
4. **Davet satışı:** "Daha fazla davet" premium özelliğini kaldırma önerisine katılıyor musunuz?
5. **Avatar ile görünme:** Keşfet'te fotoğraf yerine avatar seçeneği MVP'de olsun mu?
6. **Lansman şehri:** İstanbul tek başına mı, yoksa üç büyük şehir mi?
7. **İsim:** Kısa liste (Aralık, Usul, Masa, Yol Arkadaşı) üzerinde marka araştırması yapalım mı?
8. **Ekip ve bütçe:** Geliştirmeyi kim yapacak (siz + AI destekli geliştirme / ekip / ajans)? Bu karar, süre ve MVP kapsamını doğrudan etkiliyor.

Bu kararlar netleştiğinde **MVP Geliştirme Planı**na geçebiliriz: ekran listesi, detaylı veri şeması, API/RPC listesi, sprint planı ve kabul kriterleri.
