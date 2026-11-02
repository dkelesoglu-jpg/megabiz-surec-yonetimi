# MVP Geliştirme Planı

**Proje kod adı:** `project-a` (nihai isim belirlenene kadar; bkz. ÜK-07)
**Sürüm:** Plan v1 · 2 Kasım 2026
**Dayanak:** `urun-kararlari.md` (ÜK-01 – ÜK-08) ve `urun-konsepti-ve-fizibilite-raporu.md`
**Hazırlayan bakış açısı:** Ürün yöneticisi + CTO + güvenlik mimarı
**Durum:** Onay bekliyor. Kod yok.

---

## 0. Bu Planı Okurken

### 0.1 Değişmez tasarım ilkeleri

1. **Sunucu karar verir, uygulama yalnızca gösterir.** Hiçbir yetki ya da kural yalnızca mobil uygulamada kontrol edilmez. Uygulamadaki kontroller kullanıcı deneyimi içindir; asıl kontrol veritabanında (RLS, trigger, fonksiyon) ve Edge Function'larda yapılır.
2. **Varsayılan: kapalı.** Yeni tablo RLS açık ve politikasız başlar (kimse erişemez). Yeni yetenek kapalı başlar. Yeni dosya özel (private) başlar.
3. **Güven çekirdeği önce.** İlk kodlanacak şey ekranlar değil; rıza motoru, mesaj yetkileri ve bunların testleridir.
4. **Kör onay her yerde.** Kimin "hayır" dediği hiçbir API'den, hiçbir sorguyla öğrenilemez. Bu yalnızca arayüz kuralı değil, veritabanı garantisidir.
5. **Her hassas işlem iz bırakır.** Rıza değişiklikleri, moderasyon işlemleri ve admin erişimleri değiştirilemez (append-only) kayıtlara yazılır.

### 0.2 Bu plandaki kritik uyarılar (özet)

| # | Uyarı | Planı nasıl etkiliyor |
|---|---|---|
| K3 | **15 yaş / yaş doğrulama yönetmeliği 1 Kasım 2026'da yürürlüğe girdi** (e-Devlet yaş belirteci) | Yaş doğrulama ayrı modül (M02). Kodlamadan önce ilk hukuk sorusu |
| K4 | AI araçlarına gerçek veri ve gizli anahtar verilmez | Ortam yapısı (K): Production erişimi yalnızca Deniz'de; sentetik seed verisi |
| K5 | Tek kişilik operasyon kriz müdahalesi için yetersiz | Beta planında (O) moderatör ve nöbet şartı; kriz ekranı otomatik |
| K6 | İki AI aynı repoda çalışıyor | PR akışı, korumalı `main`, Codex inceleyici rolünde |
| K1–K2 | Gizli mod takip aracına dönüşebilir; selfie doğrulamasında açık rıza | Gizli mod MVP dışı. Doğrulama özellik bazlı zorunlu, uygulamaya girişte değil |

Ayrıntılar `urun-kararlari.md` dosyasında.

---

## A. MVP Kapsamı

### A.1 Modül listesi (kesin)

**Etiketler:**
- **Zorunlu:** Bu olmadan beta başlamaz.
- **Opsiyonel:** Takvim sıkışırsa betadan sonraya kayabilir. Kaydırma kararı Deniz'indir.

| Kod | Modül | Amaç | Kullanıcıya değeri | Durum | Bağımlılık | Güvenlik gereksinimi |
|---|---|---|---|---|---|---|
| **M01** | Kayıt ve oturum | Telefon numarasıyla hesap oluşturma ve giriş (SMS OTP) | Şifre derdi yok; tek numara = tek hesap | Zorunlu | — | Yalnızca +90 numaralar (MVP), OTP deneme/istek limiti, bot koruması (CAPTCHA), VoIP numara filtresi, SMS kaçakçılığı (toll fraud) koruması |
| **M02** | Yaş doğrulama | 18+ kuralının hukuken geçerli şekilde uygulanması | Güvenli ve yetişkin bir topluluk | Zorunlu | M01 | e-Devlet yaş belirteci (hukuk teyidine bağlı; bkz. K3). Belirteç sonucunun yalnızca "18+ evet/hayır" olarak saklanması. Doğum tarihi beyanı ile tutarlılık kontrolü |
| **M03** | Onboarding ve topluluk sözü | Ürünü anlatmak, kuralları kabul ettirmek, "ne arıyorum" ve mod seçimi | "Burası farklı" hissi; beklenti netliği | Zorunlu | M01, M02 | Kural kabulü sürümlü olarak kaydedilir |
| **M04** | Profil | Sade profil: rumuz, yaş, şehir, ilişki durumu, çocuk (ops.), ilgi alanları, ne aradığı, kısa tanıtım | Kendini anlatabilmek | Zorunlu | M03 | Alan bazında görünürlük; hassas alanlar ayrı tabloda; metin moderasyonu |
| **M05** | Avatar | Keşfet'te fotoğraf yerine avatar ile görünme. Basit parçalı oluşturucu | Yabancılara yüz göstermeden katılım | Zorunlu | M04 | Avatar ile Keşfet'te görünmek için doğrulama (M06) şart |
| **M06** | Selfie doğrulama | Canlılık testi (liveness) + profil fotoğrafıyla yüz eşleşmesi → doğrulanmış rozeti | Sahte profil yok güvencesi | Zorunlu | M04 | Açık rıza; selfie doğrulamadan sonra silinir; sonuç sunucu tarafında, sağlayıcı webhook'u imza doğrulamasıyla yazılır |
| **M07** | Profil fotoğrafları | Gerçek fotoğraf yükleme ve fotoğraf başına görünürlük | İsteyen için gerçek fotoğraf | Zorunlu | M04, M06 | Görsel moderasyon, EXIF/GPS temizleme, özel bucket, kısa ömürlü imzalı URL |
| **M08** | Gizlilik kontrolleri | Alan gizleme, Keşfet'ten çıkma, son görülme/okundu gizleme, gizli bildirim, uygulama kilidi | Kontrol hissi, mahremiyet | Zorunlu | M04 | Tüm görünürlük kuralları RLS ile uygulanır |
| **M09** | Rehberden gizlenme ve eski partner engelleme | Rehberdeki kişilerden ya da belirli bir numaradan önceden gizlenme | Eski eş, aile, iş çevresi kaygısının giderilmesi | Zorunlu | M01 | Numaralar cihazda tuzlu hash'e çevrilir; ham numara sunucuya gelmez; karşılıklı görünmezlik |
| **M10** | Keşfet | Günlük sınırlı ve açıklamalı öneriler | Doğru insanlarla tanışma | Zorunlu | M04–M09 | Engellenen ve gizlenen kişiler sunucuda filtrelenir; profil görüntüleme limiti |
| **M11** | Sohbet daveti | Davet gönder, kabul et, nazikçe geç, raporla | Baskısız ilk adım | Zorunlu | M10, M06 (göndermek için) | Günlük limit (herkese eşit), gelen davet kotası, davet notu moderasyonu, red bilgisinin gizlenmesi |
| **M12** | Bağlantılar (matches) | Kabul edilen davetten doğan iki kişilik bağ | Güvenli birebir alan | Zorunlu | M11 | Bağlantı sonlandırma ve engelleme anında tüm yetenekleri kapatır |
| **M13** | Birebir sohbet (Seviye 1) | Metin, emoji, tepki, yanıtlama, hazır sohbet başlatıcılar | Tanışma | Zorunlu | M12 | Mesaj gönderimi yalnızca RPC ile; üyelik + engel + kısıtlama kontrolü; hız limiti; içerik tarama |
| **M14** | İzin motoru | Seviye 1.5 / 2 tekliflerinin uygunluk, kör onay, cooldown ve tek taraflı kapatma kuralları | Her adımda rıza | Zorunlu | M12 | Tüm durum geçişleri yalnızca `SECURITY DEFINER` fonksiyonlarla; oy satırları yalnızca sahibine görünür; değiştirilemez olay kaydı |
| **M15** | Sesli mesaj (Seviye 1.5) | İzin varsa 2 dakikaya kadar sesli mesaj | Ses tonuyla daha sıcak iletişim | Zorunlu | M14 | Yetenek kontrolü trigger ile; konuşmadan metne çeviri + moderasyon; format ve süre kontrolü |
| **M16** | Fotoğraf paylaşımı (Seviye 2) | İzin varsa sohbette fotoğraf; bulanık önizleme; tek görüntülemelik seçenek | Daha derin tanışma | Zorunlu | M14, M07 altyapısı | Yetenek kontrolü yükleme URL'si verilirken ve satır yazılırken (iki katman); görsel moderasyon; izin kapanınca erişim kesilir |
| **M17** | Bağlantıya özel gerçek fotoğraf | Avatar kullanıcının Seviye 2 sonrası gerçek fotoğrafını o kişiye açması | Kademeli kimlik açılımı | Zorunlu | M05, M07, M14 | `photo_access` satırı; imzalı URL verilirken kontrol |
| **M18** | Odalar | 8–12 platform odası; metin sohbeti; yavaş mod | Anında topluluk değeri | Zorunlu | M04 | Odada doğrudan mesaj yok; yeni hesap kısıtı; oda bazında susturma |
| **M19** | Masalar (4–8 kişilik gruplar) | Sistemin kurduğu 6 kişilik, 7 günlük tema grupları; günlük soru kartı; kapanışta kör onaylı birebir devam | Güvenli küçük topluluk | Zorunlu | M04, M18 altyapısı | Grup üyeliği sunucuda atanır; grupta fotoğraf kapalı; üye limiti DB kısıtıyla |
| **M20** | Sohbet başlatıcılar ve mini oyunlar | Soru desteleri ("ikisi de cevaplayınca açılır"), "Bu mu o mu?" | Konuşmakta zorlanmamak | Zorunlu (desteler) / Opsiyonel (oyun) | M13, M19 | İçerik yalnızca admin panelinden; cevaplar mesaj gibi modere edilir |
| **M21** | Yakınlık göstergesi | "Tanıştınız → Sohbet ediyorsunuz → …" yumuşak ilerleme | İlişkinin seyrini görmek | **Opsiyonel** | M12, M14 | Yalnızca iki taraf görür; ikisinin de açmasıyla görünür |
| **M22** | Bildirimler | Push ve uygulama içi bildirim merkezi | Kaçırmamak | Zorunlu | M11–M19 | Varsayılan gizli içerik ("Yeni bir mesajın var"); kullanıcı başına sıklık limiti |
| **M23** | Güvenlik merkezi | Raporla, engelle, rahatsız edici mesaj gizleme, güvenlik ipuçları, kriz kaynakları | Güvende hissetmek | Zorunlu | M13 | Raporlar delil anlık görüntüsüyle saklanır; engelleme anında ve her yerde |
| **M24** | Otomatik moderasyon hattı | Metin, görsel ve ses taraması; risk sinyalleri; kuyruk | Kötü niyetlinin erken durdurulması | Zorunlu | M13, M15, M16, M18 | Asenkron kuyruk; insan onayı olmadan kalıcı ban yok |
| **M25** | Kriz akışı | Kendine zarar ve intihar sinyalinde otomatik destek ekranı + kritik kuyruk | Yalnız bırakılmamak | Zorunlu | M24 | Sağlık verisi niteliği; en kısıtlı rol erişimi; kısa saklama; uzman onaylı metin |
| **M26** | Hesap yönetimi | Hesabı duraklatma (mola), silme, veri indirme, oturum yönetimi | Kontrol ve yasal hak | Zorunlu | M01 | Silme: 30 gün geri alma + kalıcı silme işi; dışa aktarım: imzalı ve süreli link |
| **M27** | Yasal metinler ve rızalar | Aydınlatma, açık rızalar (biyometri, özel nitelikli veri, yurt dışı aktarım), kullanım koşulları | Şeffaflık | Zorunlu | M01 | Sürümlü rıza kaydı; rıza geri alınınca ilgili özellik kapanır |
| **M28** | Şehir ve bekleme listesi | İstanbul aktif; diğer şehirler bekleme listesinde; "Türkiye geneli" masalar | Boş uygulama hissinin önlenmesi | Zorunlu | M04 | — |
| **M29** | Beta davet kodu | Kapalı beta için tek kullanımlık ve kanal etiketli davet kodları | Kontrollü büyüme | Zorunlu | M01 | Kod denemeye karşı limit; kod sahibine bağlı kotalar |
| **M30** | Uygulama içi geri bildirim | Her ekrandan kısa geri bildirim + haftalık mini anket | Ürünü birlikte geliştirmek | Zorunlu | — | Ekran görüntüsü eklenirse otomatik bulanıklaştırma uyarısı |
| **M31** | Yönetim paneli (web) | Kullanıcı, rapor, vaka, oda, masa, içerik, güvenlik olayı, metrik yönetimi | Topluluğun güvenle işletilmesi | Zorunlu | M23–M25 | RBAC, MFA zorunlu, hassas veri maskeleme, her işlem audit log'a yazılır |
| **M32** | Ölçüm ve gözlemlenebilirlik | Ürün analitiği, hata izleme, KPI panosu | Hipotezi test etmek | Zorunlu | — | Analitiğe hassas veri gönderilmez (mesaj içeriği, ilişki durumu, sağlık sinyali yok) |

### A.2 MVP'ye kesinlikle dahil edilmeyecek özellikler

Bu liste **kapsam kayması (scope creep) sözleşmesidir.** Buradaki bir özelliği MVP'ye almak için Deniz'in yazılı kararı ve karşılığında MVP'den bir şey çıkarılması gerekir.

| Özellik | Neden dışarıda | Ne zaman |
|---|---|---|
| Sosyal akış (gönderi, yorum, beğeni) | ÜK-03 | Faz 2 |
| Sesli görüşme (Seviye 3) | Altyapı ve maliyet; hipotez için gerekli değil | Faz 2 |
| Görüntülü görüşme (Seviye 4) | Aynı | Faz 2 |
| Buluşma planlayıcı (Seviye 5) | Güvenlik araçları ve hukuki hazırlık gerektiriyor | Faz 3 |
| Premium abonelik ve ödeme | Beta ücretsiz; fiyatlama verisi yok | Faz 2 (altyapı Faz 2 başında) |
| Gizli mod | Premium özelliği; takip riski tasarımı (K1) ayrıca yapılmalı | Faz 2 |
| Gelişmiş filtreler | Premium | Faz 2 |
| Sanal hediyeler, jeton | Mağaza ödeme kuralları ve dolandırıcılık riski | Faz 3 |
| Fiziksel hediyeler | — | Faz 4 |
| AI kişisel emoji, AI avatar | Biyometri ve maliyet | Faz 3 |
| Premium avatar parçaları, kozmetikler | Premium | Faz 2 |
| Kullanıcıların oda veya grup açması | Moderasyon yükü | Faz 2–3 |
| Gruplarda fotoğraf ve ses | Moderasyon yükü | Faz 2 |
| Odalarda sesli sohbet | — | Faz 3 |
| AI ile kişiselleştirilmiş soru, profil yazım yardımcısı | Hipotez için gerekli değil | Faz 2 |
| AI sohbet asistanı veya "AI arkadaş" | Ürün ilkesine aykırı (terapi algısı) | Planlanmıyor |
| Uçtan uca şifreli "gizli sohbet" | Moderasyonla çelişir | Faz 4 değerlendirmesi |
| Kimlik kartı (NFC) doğrulaması | e-Devlet yaş belirteci ve selfie yeterli | Faz 2 değerlendirmesi |
| Apple / Google ile giriş | Telefon OTP yeterli; Apple ile giriş kuralı nedeniyle ikisi birlikte gelir | Faz 2 |
| Etkinlikler, bilet | — | Faz 3 |
| Web uygulaması (kullanıcı tarafı) | Yalnızca mobil | Faz 4 |
| Çoklu dil | Yalnızca Türkçe | Faz 4 |
| Uzman içerikleri, kaynak kütüphanesi | — | Faz 3 |
| "Yol Arkadaşı" mentor programı | Topluluk oluştuktan sonra | Faz 2–3 |
| Konum tabanlı mesafe (km) | Şehir yeterli; konum izni istenmez | Planlanmıyor (MVP'de) |
| Okundu bilgisini zorla gösterme, "çevrimiçi" baskısı | Ürün ilkesine aykırı | — |

### A.3 Kapsam koruma kuralları

1. Her sprint planında "Bu iş hangi modüle ait?" sorusu sorulur. Cevap A.1 tablosunda yoksa iş backlog'a gider.
2. "Küçük bir şey" diye eklenen her özellik için şu üç soru cevaplanır: Güvenlik etkisi var mı? Moderasyon yükü getiriyor mu? Veri modeli değişikliği gerektiriyor mu? Herhangi biri "evet" ise MVP dışıdır.
3. Opsiyonel modüller (M20 oyunları, M21) en sona planlanır ve gerekirse ilk kesilenlerdir.

---

## B. Uygulamadaki Tüm Ekranlar

### B.1 Navigasyon yapısı

Alt sekme çubuğu (4 sekme):
1. **Topluluk** (ana sayfa): Masalarım, odalar, günün sorusu
2. **Keşfet**
3. **Sohbetler**: Bağlantılar ve davetler
4. **Ben**: Profil, gizlilik, güvenlik, ayarlar

Sağ üstte kalıcı **bildirim zili**. Her sohbet ve profil ekranında **güvenlik menüsü (⋯)**: raporla, engelle, bağlantıyı bitir.

### B.2 Ekran listesi

**Giriş ve kayıt**

| Kod | Ekran | Amaç | Temel bileşenler | Ana CTA | Gidebileceği yerler |
|---|---|---|---|---|---|
| S01 | Splash | Açılış, oturum ve sürüm kontrolü | Logo, yükleniyor | — | S02 / S40 / Zorunlu güncelleme |
| S02 | Karşılama (3 kart) | Değer önerisi: Yalnız değilsin · Hızını sen belirle · Güvendesin | Kaydırmalı kartlar, "Nasıl çalışır?" | Başla | S03, S01 (giriş yap) |
| S03 | Beta davet kodu | Kapalı beta erişimi | Kod alanı, "Kodum yok → bekleme listesi" | Devam | S04, S03b |
| S03b | Bekleme listesi | Kodsuz kullanıcıyı kaydetmek | Şehir, telefon, onay | Listeye katıl | Çıkış |
| S04 | Telefon girişi | Numara alma | +90 alanı, CAPTCHA, aydınlatma linki | Kod gönder | S05 |
| S05 | OTP doğrulama | Kod doğrulama | 6 haneli alan, yeniden gönder (sayaçlı) | Doğrula | S06 (yeni) / S40 (mevcut) |
| S06 | Yasal metinler ve rızalar | Kullanım koşulları, aydınlatma, açık rızalar | Ayrı onay kutuları (zorunlu ve isteğe bağlı ayrımı net), metin bağlantıları | Kabul et ve devam | S07 |
| S07 | Yaş doğrulama | 18+ teyidi | Doğum tarihi + e-Devlet yaş doğrulama yönlendirmesi (K3'e bağlı) | e-Devlet ile doğrula | S08 / S07b |
| S07b | Yaş doğrulanamadı | 18 yaş altı ya da başarısız doğrulama | Nazik açıklama, destek linki | Çıkış | — |
| S08 | Topluluk sözü | 5 temel kural | Kural kartları, "Söz veriyorum" | Söz veriyorum | S09 |

**Profil kurulumu**

| Kod | Ekran | Amaç | Temel bileşenler | Ana CTA | Gidebileceği yerler |
|---|---|---|---|---|---|
| S09 | Temel bilgiler | Rumuz, cinsiyet, şehir | Form, şehir seçici ("İstanbul dışı → bekleme listesi bilgisi") | Devam | S10 |
| S10 | Hayat durumu | İlişki durumu, ayrılık süresi (gizli), çocuk (ops.) | Seçim kartları, her alanda "kim görebilir" işareti | Devam | S11 |
| S11 | Ne arıyorsun? | Niyet ve mod | Çoklu seçim (sohbet, dertleşme, arkadaşlık, sosyal çevre, ciddi ilişki, henüz bilmiyorum); "Önce konuşmak istiyorum" modu | Devam | S12 |
| S12 | İlgi alanları | Eşleşme sinyali | Etiket ızgarası (en az 3, en fazla 10) | Devam | S13 |
| S13 | Kısa tanıtım | Bio | Metin alanı + 3 örnek ipucu | Devam / Atla | S14 |
| S14 | Görünüm seçimi | Avatar mı, fotoğraf mı? | İki büyük kart + açıklama | Seç | S15 / S16 |
| S15 | Avatar oluşturucu | Basit avatar | Parça sekmeleri (yüz, ten, saç, aksesuar, arka plan), rastgele düğmesi | Kaydet | S17 |
| S16 | Fotoğraf yükleme | Gerçek fotoğraf (1–4) | Galeri/kamera seçici, kırpma, fotoğraf başına görünürlük | Yükle | S17 |
| S17 | Selfie doğrulama girişi | Neden doğruluyoruz? Rıza | Açıklama, açık rıza kutusu, "Şimdi değil" | Doğrulamaya başla | S18 / S20 |
| S18 | Canlılık testi | Sağlayıcı SDK ekranı | Kamera, yönlendirmeler | — | S19 |
| S19 | Doğrulama sonucu | Başarılı / inceleniyor / başarısız | Durum, rozet önizlemesi, tekrar dene | Devam | S20 |
| S20 | Gizlilik kurulumu | Rehberden gizlenme, eski partner engelleme, bildirim gizliliği | Üç anahtar + açıklama | Tamamla | S21 |
| S21 | İlk adım | Masa ya da oda önerisi (ilk değer anı) | 1 masa teması + 2 oda önerisi | Masaya katıl | S22, S30, S33 |

**Ana sekmeler**

| Kod | Ekran | Amaç | Temel bileşenler | Ana CTA | Gidebileceği yerler |
|---|---|---|---|---|---|
| S22 | Topluluk (ana sayfa) | Günlük merkez | Masalarım, günün sorusu, aktif odalar, bekleyen davet kartı | Masaya gir | S30, S33, S35, S27 |
| S23 | Keşfet | Günlük öneriler | Profil kartları (avatar/fotoğraf, yaş, şehir, ilgi alanları, açık olduğu iletişim, "Neden önerildi?"), günlük kalan öneri | Profili gör | S24, S22 |
| S24 | Profil detayı (başkası) | Kişiyi tanımak | Kart detayları, ortak noktalar, doğrulama rozeti, ⋯ menü | Sohbet daveti gönder | S25, S45, S46 |
| S25 | Davet gönderme (sayfa) | Not ya da hazır soru ile davet | Not alanı (300 karakter), soru seçici, kalan günlük hak | Gönder | S24, S23 |
| S26 | Sohbetler listesi | Bağlantılar | Sohbet listesi (son mesaj, okunmamış), "Davetler" sekmesi | Sohbeti aç | S28, S27 |
| S27 | Davetler | Gelen ve giden davetler | Gelen davet kartı (profil özeti + not), giden davet durumu ("Bekliyor" / "Süresi doldu") | Kabul et / Nazikçe geç | S28, S24, S45 |
| S28 | Birebir sohbet | Konuşma | Mesaj balonları, yanıtla, tepki, soru kartı düğmesi, kapı aralığı göstergesi (üstte), ses/foto düğmesi (izne göre), ⋯ menü | Gönder | S29, S24, S45, S46, S47 |
| S29 | İletişim izinleri (bağlantı ayarı) | Bu kişiyle açık yetenekler | Yetenek listesi (Yazışma ✓, Sesli mesaj, Fotoğraf, Gerçek profil fotoğrafım), durum ("Açık" / "Henüz açılmadı" / "Kapalı"), aç/kapat | Kapat / Teklif et | S28 |
| S29b | İzin teklifi (alt sayfa) | "Sesli mesajlaşmayı açmak ister misin?" | Açıklama, Evet / Şimdilik değil / Bir daha sorma | Seç | S28 |
| S29c | Seviye açıldı (kutlama değil, bilgilendirme) | "Sesli mesajlaşma artık açık" | Kısa bilgi, güvenlik ipucu | Tamam | S28 |
| S29d | Fotoğraf görüntüleyici | Bulanık önizlemeden açma | Tam ekran, tek görüntülemelik sayaç, raporla | Kapat | S28 |
| S29e | Ses kaydı | Sesli mesaj kaydı | Basılı tut, 2 dk sayaç, dinle ve gönder/iptal | Gönder | S28 |

**Topluluk**

| Kod | Ekran | Amaç | Temel bileşenler | Ana CTA | Gidebileceği yerler |
|---|---|---|---|---|---|
| S30 | Odalar listesi | Oda keşfi | Kategoriler (destek, şehir, ilgi, zaman), aktiflik göstergesi | Odaya katıl | S31 |
| S31 | Oda sohbeti | Topluluk sohbeti | Sabit kurallar, günün sorusu, mesaj akışı, yavaş mod göstergesi | Gönder | S32, S24 (davet için), S45 |
| S32 | Oda bilgisi | Kurallar ve ayarlar | Kurallar, bildirim ayarı, odadan ayrıl | Ayrıl | S30 |
| S33 | Masa talebi | Bir masaya katılmak | Tema seçimi, şehir/Türkiye geneli, "6 kişi, 7 gün" açıklaması | Talep et | S34 |
| S34 | Masa bekleme | Eşleştirme sürüyor | Tahmini süre, iptal | — | S35 (masa kurulunca) |
| S35 | Masa sohbeti | Küçük grup | Üyeler (avatarlar), günün soru kartı, oyun kartı, kalan gün | Gönder | S36, S24, S45 |
| S36 | Masa bilgisi | Üyeler ve kurallar | Üye listesi, masadan ayrıl, raporla | Ayrıl | S35 |
| S37 | Masa kapanışı | Devam kararları | "Biriyle birebir devam etmek ister misin?" (kişi başına gizli seçim), "Masa devam etsin mi?" oyu | Seçimlerimi gönder | S22, S28 |
| S38 | Soru destesi seçici | Sohbet başlatıcılar | Desteler (Hafif, Yeniden başlamak, Derin*, Eğlenceli), soru kartları | Soruyu gönder | S28, S35 |

**Bildirim, güvenlik ve hesap**

| Kod | Ekran | Amaç | Temel bileşenler | Ana CTA | Gidebileceği yerler |
|---|---|---|---|---|---|
| S39 | Bildirim merkezi | Tüm bildirimler | Liste (davet, izin teklifi, masa, sistem) | İlgili ekrana git | İlgili ekran |
| S40 | Ben (profil özeti) | Kendi profilim | Profil önizleme ("Başkaları nasıl görüyor?"), doğrulama durumu | Profili düzenle | S41, S42, S43, S48, S50 |
| S41 | Profil düzenleme | Bilgileri güncelleme | S09–S16 alanları, alan bazında görünürlük | Kaydet | S40 |
| S42 | Gizlilik ayarları | Görünürlük kontrolleri | Keşfet'te görün, son görülme, okundu bilgisi, şehir gizle, rehberden gizlen, gizli bildirim, uygulama kilidi | — | S43, S44 |
| S43 | Engellenenler ve gizlenenler | Liste yönetimi | Engellenen kişiler, numarayla engellenenler (maskeli), rehber gizleme durumu | Engeli kaldır | S42 |
| S44 | Numara ile engelle (eski partner) | Belirli kişiden önceden gizlenme | Numara girişi (cihazda hash'lenir), açıklama | Engelle | S43 |
| S45 | Raporla | Kişi, mesaj ya da içerik raporlama | Neden kategorileri, açıklama, "Bu kişiyi de engelle" seçeneği | Gönder | S45b |
| S45b | Rapor alındı | Geri bildirim | Teşekkür, ne olacağı, destek kaynakları | Tamam | Önceki ekran |
| S46 | Engelle (onay) | Engelleme | Sonuçları (görünmezlik, sohbetin kapanması), "Raporla da" seçeneği | Engelle | S26 |
| S47 | Bağlantıyı bitir | Nazik veda | Hazır veda mesajları, sessiz bitirme seçeneği | Bitir | S26 |
| S48 | Güvenlik merkezi | Güvenlik bilgi merkezi | Güvenlik ipuçları, dolandırıcılık uyarıları, raporlarım (durum), destek hatları | — | S49, S45 |
| S49 | Destek kaynakları (kriz ekranı) | Acil destek | 112, doğrulanmış destek hatları, "Güvendiğin birine yaz" | Ara | — |
| S50 | Ayarlar | Genel ayarlar | Bildirim tercihleri, oturumlar, yasal metinler, geri bildirim, yardım | — | S51–S56 |
| S51 | Bildirim tercihleri | Kategori bazında bildirim | Anahtarlar, sessiz saatler | — | S50 |
| S52 | Oturumlar ve cihazlar | Güvenlik | Aktif oturumlar, "Diğer tüm oturumları kapat" | Oturumu kapat | S50 |
| S53 | Hesabı duraklat (mola) | Ara verme | Açıklama, süre seçimi (süresiz/1 hafta/1 ay), bağlantılara gösterilecek durum | Molaya geç | S54 |
| S54 | Mola modunda (ana durum) | Duraklatılmış hesap | Mola bilgisi, "Geri dön" | Geri dön | S22 |
| S55 | Verilerimi indir | KVKK hakkı | Açıklama, talep durumu | Talep et | S50 |
| S56 | Hesabı sil | Kalıcı silme | Sonuçlar, 30 gün geri alma bilgisi, neden (ops.), OTP ile onay | Hesabımı sil | S57 |
| S57 | Silme planlandı | Bilgilendirme | Silme tarihi, "Vazgeç" | Çıkış | S02 |
| S58 | Geri bildirim | Uygulama içi geri bildirim | Kategori, metin, (ops.) ekran görüntüsü | Gönder | Önceki ekran |
| S59 | Kısıtlı hesap durumu | Moderasyon kararı bildirimi | Kararın nedeni, süre, itiraz | İtiraz et | S59b |
| S59b | İtiraz | Karara itiraz | Metin alanı | Gönder | S59 |
| S60 | Yasal metinler | Görüntüleme ve rıza yönetimi | Metinler, verilen rızalar, rızayı geri al | Rızayı geri al | S50 |
| S61 | Zorunlu güncelleme / bakım | Sürüm uyumluluğu | Mesaj, mağaza linki | Güncelle | Mağaza |
| S62 | Çevrimdışı durumu | Bağlantı yok | Banner + yeniden dene | Tekrar dene | — |

**Toplam: 62 ekran ve alt ekran.** Derin deste (*): Bağlantıda iki taraf da "derin sorulara açığım" demeden görünmez.

### B.3 Yönetim paneli ekranları

Bkz. Bölüm H.

---

## C. Kullanıcı Yolculukları

Gösterim: **K** = kullanıcı, **S** = sistem (sunucu), **[Sxx]** = ekran.

### J1. İlk kayıt

1. K uygulamayı açar → [S01] → [S02] karşılama kartları → "Başla".
2. [S03] Beta davet kodu girilir. S: Kod geçerli, kullanılmamış ve süresi dolmamış mı? Kodun kanal etiketi (ör. "kurucu-topluluk", "partner-dernek") kullanıcıya yazılır.
3. [S04] Numara girilir. S: CAPTCHA, +90 kontrolü, numara başına ve IP/cihaz başına OTP limiti.
4. [S05] OTP girilir. S: En fazla 5 deneme; sonra 15 dk kilit.
5. [S06] Yasal metinler. Zorunlu: kullanım koşulları + aydınlatma. Ayrı açık rızalar: (a) hassas profil bilgileri, (b) biyometrik doğrulama (doğrulama adımında tekrar sorulur), (c) yurt dışı aktarım. S: `legal_consents` tablosuna sürümle birlikte yazar.
6. [S07] Yaş doğrulama: e-Devlet yaş belirteci (K3 teyidine bağlı). S: Belirteci sunucuda doğrular, yalnızca `age_verified_18 = true` + tarih + yöntem saklar. Başarısızsa [S07b] ve hesap `age_blocked` durumuna geçer.
7. [S08] Topluluk sözü kabul edilir (sürüm kaydı).
8. [S09–S13] Profil adımları. Her adımda "kim görebilir" işareti gösterilir. Atlanabilir alanlar açıkça belirtilir.
9. [S14] Görünüm: Avatar seçilirse [S15], fotoğraf seçilirse [S16]. S: Fotoğraf yüklemesi önce karantina bucket'ına gider, moderasyon onayından sonra görünür olur.
10. [S17–S19] Selfie doğrulama. K "Şimdi değil" diyebilir: odalar ve masalar açık kalır, ama Keşfet'te görünme ve davet gönderme kapalı olur (K2 uyarısı). S: Sağlayıcı sonucunu imzalı webhook ile alır, `verifications` tablosuna yazar, selfie'yi siler.
11. [S20] Gizlilik kurulumu: "Rehberimdeki kişilerden gizlen" (rehber izni burada, açıklamayla istenir), "Belirli bir numaradan gizlen", "Bildirimlerde içerik gösterme" (varsayılan açık).
12. [S21] İlk adım önerisi → J2.

**Başarı ölçütü:** Kaydın %70'i 6 dakika içinde tamamlanır; doğrulama başlatanların %80'i başarılı olur.

### J2. İlk topluluğa giriş

1. [S21] S, profile göre 1 masa teması ("Yeniden başlamaya çalışanlar") ve 2 oda ("Yeni Ayrıldım", "Akşam Sohbeti") önerir. "Önce konuşmak istiyorum" modundaki kullanıcıya destek odaları öne çıkarılır.
2. K "Masaya katıl" der → [S33] tema onaylanır → [S34] bekleme. S: Masa oluşturucu (zamanlanmış iş, her 30 dk) uygun 6 kişiyi bulunca masayı açar ve push gönderir.
3. Masa beklenirken K odaya girer → [S31]. Yeni hesap kısıtları: ilk 48 saat link/görsel yok, yavaş mod daha sıkı.
4. Odada **yeni gelen karşılaması:** İlk mesajı gönderen yeni kullanıcı odanın sabit "Hoş geldin" listesinde görünür. Oda rehberleri (beta: kurucu ekip ve moderatörler) karşılar.
5. Masa açılınca [S35] günün soru kartı otomatik olarak masaya düşer. İlk soru hafif destedendir.

**Başarı ölçütü:** Yeni kullanıcının ilk 24 saatte bir odada ya da masada en az 1 mesaj yazması (hedef ≥ %60).

### J3. Keşfet → sohbet daveti

1. K [S23] Keşfet'i açar. S: Günlük öneri listesini sunucuda hesaplar. Sert filtreler (yaş tercihleri, şehir, engeller, rehber gizleme, mola modundakiler, Keşfet'ten çıkanlar, doğrulanmamışlar) uygulanır, sonra uyum sıralaması yapılır. Her öneri "Neden?" gerekçesiyle gelir.
2. K bir karta dokunur → [S24]. S: Profil görüntüleme sayacı artar (günlük limit herkese eşit). Görünürlük kuralları RLS/view ile uygulanır; gizli alanlar istemciye hiç gelmez.
3. K "Sohbet daveti gönder" der → [S25].
   - Doğrulanmamışsa: "Davet göndermek için doğrulama gerekli" → [S17].
   - Günlük limit dolmuşsa: "Bugünkü davetlerin bitti, yarın yenilenir." Para teklifi yoktur.
   - Alıcının gelen davet kotası dolmuşsa: Gönderen bunu **görmez**; profil zaten Keşfet'ten geçici olarak düşmüştür. Davet yine de sıraya alınabilir (tasarım kararı: kotası dolan kişiye davet gönderilemez, düğme "Şu an yeni davet almıyor" der).
4. K not yazar ya da hazır soru seçer → "Gönder". S: `send_invitation` RPC çalışır: doğrulama, limit, engel ve gizleme kontrolü + notun hızlı içerik taraması (telefon, IBAN, link) → davet oluşur → alıcıya push ("Yeni bir sohbet davetin var").
5. [S27] Giden davetlerde "Bekliyor" görünür. Davet 7 gün sonra "Süresi doldu" olur. Hiçbir zaman "Reddedildi" yazmaz.

### J4. Davet kabulü

1. Alıcı push'a dokunur → [S27] gelen davet kartı (profil özeti, not, ortak noktalar).
2. Seçenekler: **Kabul et** · **Nazikçe geç** · **Raporla**.
3. *Kabul:* S `accept_invitation` RPC'sini çalıştırır: daveti kabul eder, `matches` kaydı oluşturur (kullanıcılar sıralı, tekil), `match_permissions` satırlarını oluşturur (`text` = açık, diğerleri = kapalı), `conversations` kaydını açar ve sistem mesajı ekler ("Bağlantı kuruldu. Acele yok. Hızınızı birlikte belirlersiniz."). İki tarafa push gider. → [S28]
4. *Nazikçe geç:* Davet `passed` olur. Gönderene bildirim gitmez; davet onun tarafında süre sonunda "Süresi doldu" olur. Aynı kişiye 30 gün yeniden davet gönderilemez (sunucu kuralı).
5. *Raporla:* → [S45], davet kapanır, gönderen gizlice risk sinyali alır.

### J5. İlk yazılı sohbet

1. [S28] Boş sohbette S, iki profilin ortak noktalarına göre 3 hafif soru kartı önerir.
2. K bir soru kartı gönderir. Kart "ikisi de cevaplayınca açılır" modundadır: Cevaplar iki taraf da cevaplayınca görünür.
3. Mesajlaşma: Metin, emoji, tepki, yanıtla. S: `send_message` RPC → üyelik, engel, kısıtlama, hız limiti, `text` yeteneği kontrolü → yazma → Realtime yayın → asenkron moderasyon.
4. **Hızlı içerik uyarıları:** Telefon numarası, IBAN, sosyal medya kullanıcı adı ya da "WhatsApp'a geçelim" ifadesi ilk 3 günde tespit edilirse, *gönderene* gönderim öncesinde nazik bir uyarı çıkar ("Erken aşamada kişisel bilgi paylaşmamanı öneririz. Yine de gönder / Vazgeç"). *Alıcıya* ise mesaj altında bir güvenlik ipucu gösterilir.
5. Moderasyon taraması bir mesajı "rahatsız edici olabilir" diye işaretlerse alıcı onu bulanık görür: "Görmek ister misin? · Raporla".

### J6. Sesli mesaj izninin açılması (Seviye 1.5)

1. **Uygunluk:** S her mesajda (trigger veya periyodik iş) uygunluğu hesaplar. Başlangıç eşiği: iki taraf da ≥ 10 mesaj yazmış ve bağlantı ≥ 24 saatlik; aktif kısıtlama ya da açık rapor yok. Uygunluk oluşunca `match_permissions.voice_message.state = eligible` olur.
2. **Teklif iki yoldan gelir:**
   - (a) Sistem, iki tarafa da ayrı ayrı ve sohbetin içinde (özel kart olarak) sorar: "Sesli mesajlaşmayı açmak ister misin?"
   - (b) Bir taraf [S29]'dan kendisi teklif eder. Bu durumda karşı tarafa *aynı nötr soru* gider; kimin başlattığı ifade edilmez.
3. Her kullanıcı **Evet / Şimdilik değil / Bir daha sorma** seçer. S: `respond_permission` RPC → `permission_votes` tablosuna kullanıcının kendi oyunu yazar. RLS: Kullanıcı yalnızca kendi oyunu okuyabilir.
4. İki oy da "Evet" ise S aynı işlemde (transaction) yeteneği açar (`state = enabled`), `permission_events` kaydı ekler, iki tarafa aynı anda "Sesli mesajlaşma artık açık" [S29c] bildirimini gönderir.
5. Bir oy "Şimdilik değil" ise: Turu kapatır, `cooldown_until = now() + 7 gün`. Evet diyen taraf "Henüz açılmadı" görür. Bekleyen tur 7 gün içinde cevapsız kalırsa sessizce kapanır (aynı görünüm).
6. "Bir daha sorma": Sistem bu kişiye bu bağlantıda bu yeteneği bir daha teklif etmez. Ancak kişi istediği zaman kendisi teklif başlatabilir. Karşı taraf hiçbir zaman "bir daha sorma" bilgisini görmez; yalnızca "Henüz açılmadı" görünür.
7. Açıldıktan sonra [S28]'de mikrofon düğmesi görünür → [S29e].

### J7. Fotoğraf izninin açılması (Seviye 2)

1. Akış J6 ile aynıdır, `capability = photo` ile. **Seviye 1.5'in açık olması şart değildir** (ÜK-02 uygulama notu).
2. Uygunluk eşiği (başlangıç): İki taraf da ≥ 20 mesaj, en az 2 farklı günde sohbet, iki taraf da doğrulanmış.
3. Açıldıktan sonra kamera ve galeri düğmesi görünür.
4. **Gönderim:** K fotoğraf seçer → S: `request_media_upload` Edge Function'ı izni kontrol eder ve kısa ömürlü (60 sn), tek dosyalık imzalı yükleme URL'si üretir (karantina bucket'ı). Yükleme biter → moderasyon işi: çıplaklık, şiddet ve çocuk tespiti, EXIF temizleme, yeniden kodlama → temizse `message_media` satırı (trigger izni **tekrar** kontrol eder) + mesaj yayınlanır. Reddedilirse gönderene "Bu görsel topluluk kurallarına uymuyor" bildirimi gider ve risk sinyali oluşur.
5. Alıcı bulanık önizleme görür → dokununca [S29d] açılır. "Tek görüntülemelik" seçildiyse görüntülendikten sonra erişim kapanır.
6. **Gerçek profil fotoğrafı:** Avatar kullanan K, [S29]'da "Gerçek profil fotoğrafımı bu kişiye göster" anahtarını açabilir (`photo_access` satırı). Bu tek taraflı bir karardır; karşı tarafın da açması gerekmez.

### J8. Bir kişinin izni geri kapatması

1. K [S29]'da "Fotoğraf: Açık" satırında "Kapat"a basar. Onay: "Bu bağlantıda fotoğraf paylaşımı kapanacak. Daha önce paylaşılan fotoğraflar iki taraf için de gizlenecek."
2. S: `revoke_permission` RPC → `state = disabled`, `disabled_by` (yalnızca sistem ve admin görür), `permission_events` kaydı. Aynı işlemde bu bağlantıdaki `message_media` satırları `hidden_by_revoke = true` olur. İmzalı URL üretimi artık reddeder; zaten açılmış URL'lerin ömrü en fazla 60 saniyedir.
3. Karşı tarafa nötr bir sistem mesajı gider: "İletişim tercihleri güncellendi. Fotoğraf paylaşımı şu an kapalı."
4. Yeniden açmak için: Kapatan kişi istediği zaman teklif başlatabilir. Diğer taraf kapatma tarihinden itibaren 14 gün teklif başlatamaz (baskı koruması).
5. Gerçek profil fotoğrafı erişimi de aynı ekrandan anında geri alınabilir (`photo_access.revoked_at`).

### J9. Küçük gruba (masaya) katılım

1. [S33] K tema seçer ("Yeniden başlamaya çalışanlar"), kapsam seçer (İstanbul / Türkiye geneli).
2. S `masa_requests` tablosuna yazar. Zamanlanmış eşleştirici: aynı tema ve kapsam, ±7 yaş bandı, cinsiyet dengesi (6 kişide en fazla 4–2), aralarında engel veya gizleme yok, aynı anda en fazla 2 aktif masa.
3. 6 kişi bulunduğunda grup oluşur (`groups.status = active`, `ends_at = +7 gün`). Üyeler sunucu tarafından eklenir; istemci üye ekleyemez.
4. 72 saatte 6 kişi bulunamazsa 5 ya da 4 kişiyle açılır. 4'ten azsa K'ya "Bu tema için yeterli kişi yok, şunu dene" mesajı gider.
5. Masada her sabah 10:00'da bir soru kartı ve ikinci gün bir "Bu mu o mu?" oyunu gelir.
6. Üye ayrılırsa ve kişi sayısı 4'ün altına düşerse: 48 saat içinde bekleyen talepten tamamlama yapılır, olmazsa masa nazikçe kapanır.
7. 7. gün [S37]: Her üye diğer üyeler için gizlice "Birebir devam etmek isterim" seçebilir. Karşılıklı seçimlerde davet adımı atlanır ve bağlantı oluşur (yalnızca iki taraf da doğrulanmışsa). Masa devam oyu çoğunlukla "evet" çıkarsa masa 7 gün uzar (MVP'de en fazla 4 hafta).

### J10. Şikâyet (raporlama)

1. K mesajı uzun basar → "Raporla" ([S45]) ya da profil ⋯ → Raporla.
2. Kategori seçer: Taciz/hakaret · Cinsel içerik · Tehdit · Dolandırıcılık/para isteme · Sahte profil · Reşit olmayan şüphesi · Kendine zarar riski (endişeleniyorum) · Spam · Diğer. İsteğe bağlı açıklama. "Bu kişiyi de engelle" kutusu (varsayılan işaretli, kriz kategorisi hariç).
3. S: `create_report` RPC → `reports` + **delil anlık görüntüsü** (raporlanan mesaj ve öncesindeki/sonrasındaki en fazla 20 mesaj, medya referansları; raporlayan sonradan silse bile korunur) → öncelik hesaplanır → `moderation_queue` vakasına eklenir (aynı hedefe ait raporlar tek vakada birleşir).
4. Öncelik: Tehdit, reşit olmayan, kriz → **P0** (hedef 1 saat). Cinsel içerik ve dolandırıcılık → **P1** (4 saat). Diğer → **P2** (24 saat).
5. Kriz kategorisi raporlanırsa: Raporlayana [S49] destek rehberi gösterilir; raporlanan kişiye otomatik ve yargısız destek ekranı gönderilir (bkz. G.10).
6. [S45b] onay ekranı gösterilir. Karar verildiğinde raporlayana nötr bir bilgi gider: "Raporun incelendi, gerekli işlem yapıldı." Detay verilmez.

### J11. Engelleme

1. Profil ya da sohbet ⋯ → "Engelle" → [S46] onay.
2. S: `block_user` RPC aynı işlemde şunları yapar:
   - `blocks` kaydı oluşturur.
   - Aktif bağlantıyı `blocked` durumuna alır.
   - Tüm yetenekleri kapatır.
   - Bekleyen davetleri iptal eder.
   - Ortak masada iki kişiyi birbirine **görünmez** yapar (mesajları birbirine gizlenir). MVP'de masa terk zorunlu değildir; seçenek olarak sunulur.
   - Gelecek masa eşleşmelerinden ve Keşfet'ten karşılıklı dışlar.
3. Engellenen kişiye bildirim gitmez. Onun tarafında sohbet "Bu sohbet artık kullanılamıyor" olur ve profil "bulunamadı" görünür.
4. Engellenen kişi yeni hesap açarsa: Aynı cihaz parmak izi, aynı telefon hash'i ya da (doğrulamada) aynı yüz eşleşmesi tespit edilirse engel otomatik olarak yeni hesaba da uygulanır ve risk sinyali oluşur.

### J12. Eski partneri engelleme (numara ile)

1. [S42] → "Belirli bir numaradan gizlen" → [S44].
2. K numarayı girer. Numara cihazda standart biçime (E.164) çevrilir ve şifreli bağlantıyla (TLS) `contact_hide` Edge Function'ına gönderilir. Fonksiyon numarayı **gizli anahtarlı HMAC** ile özetler ve ham numarayı hiçbir yere yazmadan (veritabanı, log, hata kaydı) atar.
   - *Neden cihazda düz hash değil?* Türkiye'deki telefon numarası uzayı küçük olduğu için düz hash kaba kuvvetle saatler içinde çözülebilir. Bu yüzden gerçek koruma, anahtarı yalnızca sunucuda bulunan HMAC'tir. Detaylar F.9'da.
   - *Kullanıcıya dürüst açıklama:* "Girdiğin numara saklanmaz, yalnızca geri çevrilemeyen bir şifreli özeti tutulur." 
3. S: `contact_blocks` tablosuna HMAC değerini yazar. O numara sistemde kayıtlıysa ya da gelecekte kayıt olursa iki kişi **karşılıklı olarak** birbirini hiçbir yerde göremez: Keşfet, odalarda isim (rumuz yerine "Gizli üye" değil, mesajlar tamamen filtrelenir), masa eşleşmesi, davet.
4. K'ya o numaranın kayıtlı olup olmadığı **söylenmez** (aksi halde "eski eşim burada mı?" sorgu aracına dönüşür).
5. Rehber gizleme de aynı mekanizmayla çalışır (toplu, izinli, isteğe bağlı).

### J13. Hesap duraklatma (mola)

1. [S53] K süre seçer (1 hafta / 1 ay / süresiz) ve bağlantılara gösterilecek mesajı seçer ("Bir süre ara veriyorum").
2. S: `profiles.status = paused`. Keşfet'ten, masa eşleşmelerinden ve oda üye listelerinden çıkar; bekleyen davetler askıya alınır; push bildirimleri durur (güvenlik bildirimleri hariç).
3. Bağlantılar sohbet listesinde K'yı "Molada" olarak görür; mesaj gönderebilirler, ama K dönene kadar push gitmez. (Karar: Mesaj gönderimi açık kalsın mı? Önerim **evet**, çünkü bağlantı koparılmamalı.)
4. Aktif masadan otomatik ayrılır (masa 4'ün altına düşerse J9.6 uygulanır).
5. K uygulamayı açınca [S54] → "Geri dön" → durum `active` olur.

### J14. Hesap silme

1. [S56] Sonuçlar listelenir. Neden sorulur (isteğe bağlı; "Birini buldum" seçeneği de var, sağlıklı ayrılış metriği için). OTP ile onay alınır.
2. S: `request_account_deletion` → `profiles.status = pending_deletion`, `delete_after = +30 gün`. Hesap anında her yerden gizlenir. Oturumlar kapatılır.
3. 30 gün içinde giriş yapılırsa [S57] "Vazgeç" seçeneği sunulur.
4. 30. gün zamanlanmış iş çalışır:
   - Profil, fotoğraflar, avatar, ses ve görsel medya, ilgi alanları, gizleme hash'leri ve cihaz kayıtları **kalıcı silinir**.
   - Mesajlar: Karşı tarafın sohbet geçmişi korunur, ama gönderen "Silinmiş kullanıcı" olarak anonimleşir. Medya silinir.
   - Moderasyon vakaları, ban kayıtları ve audit log'lar: Yasal ve güvenlik amaçlı olarak (ör. yasaklı kişinin tekrar kaydını engellemek için) **sınırlı alanlarla ve süreyle** saklanır. Telefon ve cihaz HMAC'i ban listesinde tutulur. Saklama süresi hukuk uzmanının onayına bağlıdır.
5. Silme tamamlanınca (telefon numarasına SMS ya da kayıtlı e-posta varsa e-posta ile) bilgilendirme yapılır.

---

## D. Kullanıcı Hikâyeleri

Format: **US-xx** · *Kullanıcı olarak … istiyorum, böylece …*
Her hikâye altında **Kabul kriterleri (AC)** bulunur. Kabul kriterleri test senaryolarının da temelidir.

### D.1 Kayıt, yaş ve onboarding (M01–M03, M29)

**US-01** · Bir kullanıcı olarak telefon numaramla kayıt olmak istiyorum, böylece şifre hatırlamak zorunda kalmam.
- AC1: Yalnızca +90 ile başlayan, geçerli formatta numaralar kabul edilir.
- AC2: Aynı numaraya 1 saatte en fazla 5 OTP gönderilir; aynı cihaz ya da IP'den 1 saatte en fazla 10.
- AC3: Yanlış OTP 5 kez girilirse numara 15 dakika kilitlenir.
- AC4: Bir numara yalnızca bir aktif hesaba bağlanabilir.
- AC5: OTP isteğinden önce CAPTCHA doğrulaması geçilmeden SMS gönderilmez.

**US-02** · Bir beta adayı olarak davet koduyla katılmak istiyorum, böylece kapalı topluluğa girebilirim.
- AC1: Geçersiz, kullanılmış ya da süresi dolmuş kod reddedilir; mesaj kodun hangi nedenle reddedildiğini açık etmez ("Bu kod kullanılamıyor").
- AC2: Aynı cihazdan 10 hatalı kod denemesinden sonra 1 saat bekleme uygulanır.
- AC3: Kullanılan kodun kanal etiketi kullanıcı kaydına yazılır.

**US-03** · Bir kullanıcı olarak 18 yaşından büyük olduğumu güvenli bir yöntemle kanıtlamak istiyorum, böylece yalnızca yetişkinlerin olduğu bir ortamda olurum.
- AC1: Yaş doğrulaması tamamlanmadan profil oluşturulamaz.
- AC2: Sunucu yalnızca "18+ doğrulandı (evet/hayır), yöntem, tarih" saklar.
- AC3: 18 yaş altı sonucunda hesap `age_blocked` olur ve aynı numara ve cihazla 30 gün yeniden kayıt denenemez.
- AC4: Beyan edilen doğum tarihi ile doğrulama sonucu çelişirse hesap incelemeye düşer.

**US-04** · Bir kullanıcı olarak hangi verimin neden işlendiğini ayrı ayrı onaylamak istiyorum, böylece neye izin verdiğimi bilirim.
- AC1: Zorunlu ve isteğe bağlı rızalar ayrı onay kutularıdır; isteğe bağlı olanlar varsayılan olarak işaretsizdir.
- AC2: Her rıza metin sürümüyle birlikte kaydedilir.
- AC3: İsteğe bağlı bir rıza verilmezse yalnızca ilgili özellik kapanır; uygulama kullanılabilir kalır.

**US-05** · Bir kullanıcı olarak topluluk kurallarını kısa ve anlaşılır biçimde görmek istiyorum, böylece burada ne beklendiğini bilirim.
- AC1: 5 kural kartı gösterilir; kabul edilmeden devam edilemez.
- AC2: Kurallar güncellendiğinde bir sonraki açılışta yeniden onay istenir.

### D.2 Profil, avatar, fotoğraf (M04, M05, M07)

**US-06** · Bir kullanıcı olarak yalnızca istediğim bilgileri paylaşmak istiyorum, böylece mahremiyetimi korurum.
- AC1: Zorunlu alanlar yalnızca: rumuz, doğum tarihi (gösterimde yaş), cinsiyet, şehir, en az 1 niyet.
- AC2: Her isteğe bağlı alan için görünürlük seçilebilir: Herkes / Bağlantılarım / Yalnızca ben.
- AC3: "Yalnızca ben" işaretli bir alan, başka bir kullanıcının hiçbir API çağrısında dönmez (RLS testiyle doğrulanır).
- AC4: Ayrılık süresi alanı hiçbir zaman başkasına gösterilmez; yalnızca eşleşme ve mod önerisi için kullanılır.

**US-07** · Bir kullanıcı olarak Keşfet'te avatarla görünmek istiyorum, böylece yabancılara yüzümü göstermeden katılabilirim.
- AC1: Avatar oluşturucu en az 5 parça kategorisi ve rastgele oluşturma sunar.
- AC2: `display_mode = avatar` iken Keşfet ve profil kartında yalnızca avatar ve doğrulama rozeti görünür.
- AC3: Doğrulanmamış kullanıcı `avatar` modunda Keşfet'te listelenmez (sunucu filtresi).
- AC4: Avatar kullanan kullanıcının gerçek fotoğrafının yolu (storage path) diğer kullanıcılara hiçbir yanıtta dönmez.

**US-08** · Bir kullanıcı olarak gerçek fotoğraf yüklemek istiyorum, böylece istersem kendimi gösterebilirim.
- AC1: En fazla 4 fotoğraf; JPEG/PNG/HEIC; en fazla 10 MB; sunucuda yeniden kodlanır ve EXIF silinir.
- AC2: Fotoğraf moderasyondan geçmeden kimseye görünmez (kullanıcı kendisi "İnceleniyor" görür).
- AC3: Çıplaklık tespit edilen fotoğraf reddedilir ve risk sinyali oluşur.
- AC4: Fotoğrafın yüzü doğrulama selfiesiyle eşleşmiyorsa profil fotoğrafı olarak kullanılamaz (doğrulanmış hesaplarda).

**US-09** · Avatar kullanan bir kullanıcı olarak gerçek fotoğrafımı yalnızca güvendiğim bağlantıya açmak istiyorum, böylece kimliğimi kademeli paylaşırım.
- AC1: Seçenek yalnızca o bağlantıda `photo` yeteneği açıkken görünür.
- AC2: Açma ve kapatma anında geçerlidir; kapatıldıktan sonra imzalı URL üretilmez.
- AC3: Karşı taraf yalnızca o bağlantı bağlamında görür; Keşfet'te görmez.

### D.3 Doğrulama ve gizlilik (M06, M08, M09)

**US-10** · Bir kullanıcı olarak canlı selfie ile doğrulanmak istiyorum, böylece gerçek bir insan olduğum güvenini veririm.
- AC1: Doğrulamadan önce biyometrik veri için ayrı açık rıza alınır.
- AC2: Sonuç yalnızca sağlayıcının imzalı webhook'u ile yazılır; istemci "doğrulandım" diye yazamaz (RLS + kolon izni).
- AC3: Selfie görüntüsü sağlayıcıda ve bizde sonuç alındıktan sonra silinir (sağlayıcı sözleşmesiyle).
- AC4: Doğrulama başarısızsa kullanıcı 24 saatte en fazla 3 kez yeniden deneyebilir; sonra manuel incelemeye düşer.
- AC5: Doğrulanmamış kullanıcı odaları ve masaları kullanabilir; Keşfet'te görünemez ve davet gönderemez.

**US-11** · Bir kullanıcı olarak rehberimdeki kişilerden gizlenmek istiyorum, böylece ailem ya da iş arkadaşlarım beni burada görmez.
- AC1: Rehber izni yalnızca bu özellik açılırken istenir ve izin vermemek uygulamayı kısıtlamaz.
- AC2: Ham numaralar sunucuda hiçbir yere (veritabanı, log, hata izleme) yazılmaz; yalnızca gizli anahtarlı HMAC özetleri saklanır ve eşlenir (F.9).
- AC3: Eşleşen kişilerle karşılıklı görünmezlik: Keşfet, davet, masa eşleşmesi ve oda üye listesi.
- AC4: Kullanıcıya kimlerle eşleştiği söylenmez.
- AC5: Özellik kapatıldığında gizleme kayıtları silinir.

**US-12** · Bir kullanıcı olarak eski partnerimin numarasını girerek ondan gizlenmek istiyorum, böylece onunla bu uygulamada asla karşılaşmam.
- AC1: J12'deki tüm adımlar.
- AC2: Numaranın sistemde kayıtlı olup olmadığı hiçbir yanıtta, zamanlama farkında ya da hata mesajında belli olmaz.
- AC3: Kayıt sonradan olursa kural yine uygulanır.

**US-13** · Bir kullanıcı olarak bildirimlerde mesaj içeriğinin görünmemesini istiyorum, böylece telefonuma bakan biri neler konuştuğumu görmez.
- AC1: Varsayılan: "Yeni bir mesajın var". İçerik gösterme kullanıcı tarafından açılabilir.
- AC2: "Gizli bildirim" modunda uygulama adı bile bildirimde görünmez ("Yeni bildirim").

**US-14** · Bir kullanıcı olarak uygulamayı Face ID/PIN ile kilitlemek istiyorum.
- AC1: Kilit açıkken uygulama arka plandan dönünce kilit ekranı gelir; uygulama değiştirici önizlemesi bulanık olur.

**US-15** · Bir kullanıcı olarak son görülme ve okundu bilgimi gizlemek istiyorum.
- AC1: Varsayılan olarak ikisi de kapalıdır.
- AC2: Kapatan kişi, karşı tarafın bilgisini de göremez (karşılıklılık sunucuda uygulanır).

### D.4 Keşfet ve davet (M10, M11)

**US-16** · Bir kullanıcı olarak bana neden önerildiğini anlayabileceğim kişiler görmek istiyorum, böylece algoritmaya güvenirim.
- AC1: Her önerinin en az bir gerekçesi vardır (ortak ilgi sayısı, ortak oda/masa, benzer niyet).
- AC2: Günlük en fazla 20 öneri; liste sunucuda üretilir ve gün içinde sabittir.
- AC3: Engellenmiş, gizlenmiş, molada, Keşfet'ten çıkmış ve doğrulanmamış profiller hiçbir zaman listede yer almaz.
- AC4: Fotoğraf, sıralama sinyali olarak kullanılmaz.

**US-17** · Bir kullanıcı olarak birine kısa bir notla davet göndermek istiyorum, böylece doğrudan mesaj baskısı olmadan tanışabilirim.
- AC1: Günlük davet limiti herkes için aynı ve `app_config` değeridir (başlangıç: 10).
- AC2: Not en fazla 300 karakterdir; link, telefon ve IBAN içeremez (sunucu reddeder).
- AC3: Aynı kişiye aynı anda yalnızca 1 bekleyen davet olabilir; "geç" sonrası 30 gün yeniden davet gönderilemez.
- AC4: Doğrulanmamış kullanıcı davet gönderemez.

**US-18** · Bir kullanıcı olarak gelen davetleri sakin bir şekilde değerlendirmek istiyorum, böylece baskı hissetmem.
- AC1: "Nazikçe geç" seçildiğinde gönderene bildirim gitmez ve gönderenin hiçbir API çağrısında "passed" durumu görünmez (gönderen yalnızca `pending` ya da `expired` görür).
- AC2: Bir kullanıcının günlük gelen davet kotası (başlangıç: 15) dolunca yeni davet alınmaz ve profil Keşfet'ten geçici olarak düşer.
- AC3: Davetler 7 gün sonra otomatik olarak `expired` olur.

### D.5 Sohbet ve izinler (M12–M17)

**US-19** · Bir kullanıcı olarak bağlantımla yazışmak istiyorum, böylece birbirimizi tanırız.
- AC1: Mesaj yalnızca `send_message` RPC ile yazılabilir; `messages` tablosuna doğrudan INSERT yetkisi yoktur.
- AC2: Engel, bağlantı sonlanması ya da hesap kısıtlaması varsa mesaj reddedilir.
- AC3: Mesaj 4.000 karakteri geçemez; kullanıcı başına dakikada 30, saatte 300 mesaj sınırı uygulanır.
- AC4: Yanıtlama yalnızca aynı konuşmadaki mesaja yapılabilir.
- AC5: Mesajlar 24 saat içinde "herkesten silinebilir"; raporlanmış mesajın delil kopyası korunur.

**US-20** · Bir kullanıcı olarak sesli mesajlaşmanın ancak ikimiz de istersek açılmasını istiyorum, böylece hazır olmadığım bir iletişim biçimine zorlanmam.
- AC1: `voice_message` yeteneği `enabled` değilse ses mesajı oluşturulamaz (RPC + trigger).
- AC2: Teklif uygunluk eşiği sağlanmadan başlatılamaz.
- AC3: Oylar karşı tarafa hiçbir şekilde görünmez (RLS testi: B kullanıcısı A'nın `permission_votes` satırını okuyamaz).
- AC4: Bir taraf "Şimdilik değil" derse 7 gün cooldown başlar; diğer taraf yalnızca "Henüz açılmadı" görür.
- AC5: İki taraf da "Evet" derse yetenek aynı transaction içinde açılır ve iki tarafa aynı anda bildirilir.

**US-21** · Bir kullanıcı olarak sesli mesaj göndermek istiyorum, böylece duygumu daha iyi aktarırım.
- AC1: En fazla 2 dakika ve 5 MB; yalnızca AAC/M4A.
- AC2: Ses mesajı moderasyon (konuşmadan metne çeviri + metin sınıflandırma) tamamlanmadan karşı tarafa "işleniyor" olarak görünür (hedef ≤ 10 sn).
- AC3: Yetenek kapatılınca bu bağlantıdaki ses mesajları oynatılamaz.

**US-22** · Bir kullanıcı olarak fotoğraf paylaşımının ayrı bir onayla açılmasını istiyorum, böylece sesli mesajı açtım diye fotoğraf göndermek zorunda kalmam.
- AC1: `photo` yeteneği `voice_message`'dan bağımsız teklif edilir ve açılır.
- AC2: `photo` kapalıyken `message_media` tablosuna görsel satırı yazılamaz; **service role ile bile** (trigger tüm rollerde kontrol eder).
- AC3: Yükleme URL'si yalnızca izin varken üretilir, 60 saniye geçerlidir ve tek dosyalıktır.

**US-23** · Bir kullanıcı olarak paylaşılan fotoğrafların bulanık gelmesini istiyorum, böylece ne zaman bakacağıma ben karar veririm.
- AC1: Önizleme sunucuda üretilmiş bulanık sürümdür (blurhash); orijinale erişim dokununca imzalı URL ile açılır.
- AC2: Tek görüntülemelik fotoğraf bir kez açıldıktan sonra yeniden imzalı URL üretilmez.
- AC3: Android'de sohbet ve görüntüleyici ekranında ekran görüntüsü engellenir; iOS'ta ekran görüntüsü alındığında karşı tarafa sistem mesajı gider.

**US-24** · Bir kullanıcı olarak açtığım bir izni istediğim an tek başıma kapatmak istiyorum, böylece kontrol hep bende olur.
- AC1: Kapatma için karşı tarafın onayı gerekmez ve açıklama istenmez.
- AC2: Kapatma anında ilgili içerik (fotoğraf/ses) iki taraf için de erişilemez olur.
- AC3: Kapatan kişi istediği zaman yeniden teklif edebilir; diğer taraf 14 gün teklif başlatamaz.
- AC4: Kapatma işlemi `permission_events` tablosuna değiştirilemez şekilde kaydedilir.

**US-25** · Bir kullanıcı olarak bir bağlantıyı nazikçe bitirmek istiyorum, böylece ghosting yapmadan ayrılabilirim.
- AC1: 3 hazır veda mesajı + "sessizce bitir" seçeneği.
- AC2: Bitirince sohbet iki taraf için de salt okunur olur ve tüm yetenekler kapanır.

**US-26** *(Opsiyonel M21)* · Bir kullanıcı olarak bağlantımızın nasıl ilerlediğini yumuşak bir dille görmek istiyorum.
- AC1: Gösterge yalnızca iki taraf da "göster" seçerse görünür; puan ya da sayı içermez.

### D.6 Odalar, masalar, sohbet başlatıcılar (M18–M20)

**US-27** · Bir kullanıcı olarak konuya göre odalara katılmak istiyorum, böylece hemen birileriyle konuşabilirim.
- AC1: MVP'de 8–12 oda yalnızca admin tarafından oluşturulur.
- AC2: Odada kullanıcıya doğrudan mesaj gönderilemez; profilden davet akışı kullanılır.
- AC3: Yeni hesaplar (ilk 48 saat) odada link ve görsel paylaşamaz; yavaş mod 60 saniyedir.
- AC4: Oda mesajları da `send_message` ve moderasyon hattından geçer.
- AC5: Engellediğim ya da gizlendiğim kişilerin mesajlarını odada görmem; onlar da benimkileri görmez.

**US-28** · Bir kullanıcı olarak tema seçip küçük bir masaya katılmak istiyorum, böylece kalabalıkta kaybolmadan tanışırım.
- AC1: Masa üye sayısı veritabanı kısıtıyla 4–8 arasındadır; istemci üye ekleyemez.
- AC2: Bir kullanıcı aynı anda en fazla 2 aktif masada olabilir.
- AC3: Birbirini engellemiş ya da gizlemiş kişiler aynı masaya atanmaz.
- AC4: Masa 7 gün sonra kapanış akışına girer.

**US-29** · Bir masa üyesi olarak masa bittiğinde beğendiğim kişiyle birebir devam etmek istiyorum, böylece tanışma doğal yoldan olur.
- AC1: Seçimler gizlidir; yalnızca karşılıklı seçimler bağlantıya dönüşür.
- AC2: Karşılıklı olmayan seçim hiçbir şekilde karşı tarafa gösterilmez.
- AC3: İki taraf da doğrulanmış değilse bağlantı oluşmaz; doğrulanmamış tarafa "Doğrulama yaparsan bağlantı kurulabilir" bilgisi verilir (karşı tarafın kim olduğu söylenmez).

**US-30** · Bir kullanıcı olarak hazır sorular kullanmak istiyorum, böylece ne yazacağımı düşünmem.
- AC1: Soru kartı "ikisi de cevaplayınca açılır" modunda gönderilebilir; karşı tarafın cevabı, ben cevaplayana kadar istemciye hiç gönderilmez (sunucu kuralı).
- AC2: "Derin" deste, iki taraf da "derin sorulara açığım" seçmeden listelenmez.
- AC3: Soru içerikleri yalnızca admin panelinden eklenir ve yayınlanır.

### D.7 Güvenlik, kriz, hesap (M22–M27)

**US-31** · Bir kullanıcı olarak rahatsız edici bir mesajı birkaç dokunuşla raporlamak istiyorum, böylece güvende hissederim.
- AC1: Her mesaj, profil, davet ve oda mesajı için "Raporla" en fazla 2 dokunuş uzaklıktadır.
- AC2: Rapor, delil anlık görüntüsünü içerir ve raporlanan kişi mesajı silse bile korunur.
- AC3: P0 raporları (tehdit, reşit olmayan, kriz) panelde anında kırmızı alarm üretir.
- AC4: Aynı kullanıcı bir hedefi 24 saatte bir kez raporlayabilir (spam rapor koruması); kötüye kullanılan raporlama da risk sinyalidir.

**US-32** · Bir kullanıcı olarak birini engellediğimde benimle hiçbir şekilde iletişim kuramamasını istiyorum.
- AC1: J11'deki tüm sonuçlar aynı transaction'da gerçekleşir.
- AC2: Engellenen kişinin sorgularında engelleyen kişi hiçbir tabloda görünmez.

**US-33** · Zor bir an yaşayan bir kullanıcı olarak yalnız bırakılmamak ve doğru yere yönlendirilmek istiyorum.
- AC1: Kriz sinyali tespit edildiğinde kullanıcıya özel destek ekranı (S49) insan beklemeden gösterilir.
- AC2: Mesaj silinmez ya da engellenmez; karşı tarafa iletilir (karşı taraf ayrıca "Endişeleniyorsan…" rehberi görür).
- AC3: Vaka P0 olarak kriz rolüne düşer; vaka verisine yalnızca yetkili roller erişir ve her erişim log'lanır.
- AC4: Ekrandaki metin ve hat listesi ruh sağlığı uzmanınca onaylanmış sürümdür (sürüm numarası kodda kontrol edilir).

**US-34** · Bir kullanıcı olarak hesabıma ara vermek istiyorum, böylece silmeden uzaklaşabilirim. → J13 kriterleri.

**US-35** · Bir kullanıcı olarak hesabımı ve verilerimi kalıcı olarak silmek istiyorum. → J14 kriterleri.
- Ek AC: Silme sonrası yedeklerden geri dönüş hukuken izin verilen süre içinde dönen yedeklerle sınırlıdır ve aydınlatma metninde açıklanır.

**US-36** · Bir kullanıcı olarak verilerimin kopyasını indirmek istiyorum.
- AC1: Talepten sonra en geç 30 gün (hedef 48 saat) içinde JSON + medya arşivi hazırlanır.
- AC2: İndirme linki 7 gün geçerli, tek kullanımlık ve OTP onaylıdır.
- AC3: Arşivde başkalarının yalnızca bana gönderdiği mesajlar bulunur; başkalarının profil gizli alanları bulunmaz.

**US-37** · Bir kullanıcı olarak hakkımda verilen moderasyon kararını görmek ve itiraz etmek istiyorum.
- AC1: Kısıtlanan kullanıcı [S59]'da nedeni, süreyi ve itiraz düğmesini görür.
- AC2: İtiraz, kararı veren moderatörden farklı bir kişiye gider.

**US-38** · Bir kullanıcı olarak aktif oturumlarımı görmek ve kapatmak istiyorum.
- AC1: Oturum listesi cihaz modeli, son kullanım tarihi ve yaklaşık şehri gösterir; "Diğer tüm oturumları kapat" anında etkili olur.

### D.8 Admin ve moderasyon (M31)

**US-39** · Bir moderatör olarak raporları öncelik sırasına göre görmek istiyorum, böylece en riskli vakaya önce bakarım.
- AC1: Kuyruk önceliğe (P0–P2) ve SLA kalan süresine göre sıralanır.
- AC2: Vaka sayfasında delil, kullanıcı geçmişi (önceki raporlar ve yaptırımlar) ve risk sinyalleri bulunur; telefon numarası maskelidir.
- AC3: Moderatör yalnızca vakaya bağlı mesajları görür; kullanıcının diğer sohbetlerine erişemez.

**US-40** · Bir moderatör olarak bir vakada işlem yapmak istiyorum (uyarı, içerik gizleme, özellik kısıtlama, askıya alma).
- AC1: Her işlem bir neden kodu ve açıklama zorunluluğu ile yapılır.
- AC2: Kalıcı ban ve cihaz banı yalnızca Security Admin onayıyla yapılır (dört göz ilkesi).
- AC3: Her işlem `audit_logs` tablosuna değiştirilemez şekilde yazılır.

**US-41** · Bir Security Admin olarak gerekirse hassas bir veriyi görmek istiyorum, ama bu her zaman kayıt altında olmalı.
- AC1: Hassas alan açma ("break-glass") bir neden metni ister, 15 dakika geçerlidir ve log'lanır.
- AC2: Haftalık break-glass raporu Super Admin'e otomatik gider.

**US-42** · Bir Community Manager olarak odaları, masa temalarını ve soru destelerini yönetmek istiyorum.
- AC1: Yeni içerik taslak → onay → yayın akışıyla çalışır.
- AC2: Community Manager kullanıcı mesajlarına ve kişisel verilere erişemez.

**US-43** · Bir Support Agent olarak kullanıcının hesap durumu sorularını yanıtlamak istiyorum.
- AC1: Support yalnızca hesap durumu, doğrulama durumu, rapor ve itiraz durumu gibi meta verileri görür; içerik göremez.

---

## E. Veri Modeli

### E.1 Şema düzeni

| Şema | İçerik | API'den erişim |
|---|---|---|
| `public` | Kullanıcının kendi verisi ve RLS ile süzülmüş paylaşılan veri | Evet (RLS zorunlu) |
| `api` | Kullanıcıya açık **RPC fonksiyonları** ve **maskeli view'lar** | Evet (yalnızca `EXECUTE` / `SELECT`) |
| `private` | Risk sinyalleri, gizleme HMAC'leri, delil, hız limitleri, kriz olayları | **Hayır** (PostgREST'e açılmaz) |
| `admin` | Panelin RPC fonksiyonları (rol kontrolü içeride) | Yalnızca admin JWT + MFA |
| `audit` | Değiştirilemez kayıtlar | Hayır (yalnızca `admin` fonksiyonları üzerinden okunur) |

**Genel kurallar:**
- Tüm tablolarda RLS **açık**. Politikası olmayan tablo kimseye açık değildir.
- İstemcinin doğrudan `INSERT/UPDATE/DELETE` yaptığı tablo sayısı minimumdur: yalnızca kendi ayarları, profil alanları ve taslaklar. Diğer tüm yazmalar `api.*` RPC'leri (`SECURITY DEFINER`, `search_path` sabitlenmiş) üzerinden yapılır.
- Kimlik alanları `uuid`. Sıralı akışlarda (mesajlar) zaman sıralı UUIDv7 kullanılır.
- Zaman damgaları `timestamptz`, UTC.
- "Silme" iş kuralı olan tablolarda `deleted_at`; kalıcı silme zamanlanmış işlerle yapılır.

### E.2 Enum ve katalog: yetenek modeli (Seviye 1.5'in doğru modellenmesi)

**Tasarım kararı:** Seviyeler tamsayı olarak **modellenmez**. Her iletişim biçimi bağımsız bir **yetenek** (`capability`) olarak tutulur. "Seviye" yalnızca arayüzdeki sıralamayı belirleyen bir katalog özelliğidir. Böylece 1.5 gibi ara seviyeler, sıradan bağımsız açılma ve ileride yeni yetenekler (ör. "konum paylaşımı") veri modelini bozmadan eklenebilir.

```
enum capability = 'text' | 'voice_message' | 'photo' | 'voice_call' | 'video_call' | 'meet'
```

**`capability_catalog`** (herkes okuyabilir; yalnızca migration ile değişir)

| Alan | Örnek (`voice_message`) | Açıklama |
|---|---|---|
| `capability` (PK) | `voice_message` | |
| `ui_level` `numeric(2,1)` | `1.5` | Arayüz sırası ve adı ("Seviye 1.5") |
| `display_name_tr` | "Sesli mesaj" | |
| `mvp_enabled` | `true` | `voice_call`, `video_call`, `meet` için `false` → tüm RPC'ler reddeder |
| `auto_enabled_on_match` | `false` | Yalnızca `text` için `true` (davet kabulü = Seviye 1 onayı) |
| `prerequisites` `jsonb` | `{"all":["text"]}` | `photo`: `{"all":["text"]}` (1.5 şart değil) · `voice_call`: `{"all":["text"]}` · `video_call`: `{"all":["voice_call"]}` · `meet`: `{"all":["text"],"any":["video_call","photo_real_shared"]}` |
| `eligibility` `jsonb` | `{"min_msgs_each":10,"min_hours":24}` | `photo`: `{"min_msgs_each":20,"min_distinct_days":2,"both_verified":true}` |
| `round_ttl_days` | `7` | Teklif turunun ömrü |
| `cooldown_days_after_decline` | `7` | |
| `counterparty_cooldown_days_after_revoke` | `14` | İzni kapatanın karşısındaki kişi bu süre teklif edemez |
| `media_kinds` | `{voice}` | Bu yeteneğe bağlı mesaj türleri (`photo` → `{image}`) |

### E.3 Ana tablolar

> Gösterim: **PK** birincil anahtar · **FK** yabancı anahtar · RLS sütununda "sahip" = `auth.uid()` ile eşleşen kullanıcı.

#### Kimlik ve profil

**`profiles`** (`public`)
- **Görev:** Kullanıcının herkese açılabilir profil çekirdeği.
- **Kritik alanlar:**
  - `id` (PK = `auth.users.id`), `display_name`, `gender`, `city_id` (FK), `bio`
  - `intents text[]`, `mode` (`talk_first` / `balanced`), `display_mode` (`avatar` / `photo`)
  - `primary_photo_id` (FK), `is_verified` (**salt okunur**, trigger ile `verifications`'tan türetilir)
  - `status` (`onboarding` / `active` / `paused` / `restricted` / `pending_deletion` / `age_blocked` / `banned`)
  - `discoverable bool`, `last_active_day date` (gün hassasiyeti; saat tutulmaz), `created_at`
- **İlişkiler:** 1–1 `profile_private`, `user_settings`, `avatars`; 1–N `profile_photos`, `verifications`, `user_interests`.
- **RLS:**
  - Sahip kendi satırını okur.
  - Sahip yalnızca izinli kolonları günceller (kolon bazlı `GRANT UPDATE (display_name, bio, intents, mode, display_mode, city_id, discoverable)`). `is_verified` ve `status` istemciden değiştirilemez.
  - Başka kullanıcılar tabloyu **doğrudan okuyamaz.** Yalnızca `api.profile_card(user_id)` ve `api.discover_feed()` üzerinden okurlar. Bu fonksiyonlar engel, gizleme, durum ve alan görünürlüğü kurallarını uygular ve gizli alanları hiç döndürmez.

**`profile_private`** (`public`, yalnızca sahip)
- **Görev:** Hassas profil verisi.
- **Kritik alanlar:** `user_id` (PK/FK), `birth_date`, `relationship_status`, `separation_since`, `has_children`, `phone_hmac` (F.9), `age_verified_18 bool`, `age_verified_at`, `age_verification_method`.
- **RLS:** Yalnızca sahip okur. `age_*` ve `phone_hmac` kolonları istemciden yazılamaz. Eşleştirme fonksiyonları `SECURITY DEFINER` olarak okur ve yalnızca türetilmiş sinyal döndürür.

**`profile_field_visibility`**: `user_id`, `field` (enum), `visibility` (`everyone` / `connections` / `only_me`). RLS: Yalnızca sahip okur ve yazar.

**`avatars`**: `user_id` (PK), `config jsonb` (parça seçimleri; şema doğrulamalı), `version`, `updated_at`. RLS: Sahip yazar; başkaları yalnızca `profile_card` aracılığıyla görür.

**`profile_photos`**
- **Görev:** Gerçek fotoğraflar.
- **Kritik alanlar:** `id`, `user_id`, `storage_path` (özel bucket), `blurhash`, `status` (`quarantine` / `approved` / `rejected`), `face_match` (`pass` / `fail` / `unknown`), `sort_order`, `created_at`.
- **RLS:** Sahip okur. Ekleme yalnızca Edge Function (service role) ile, moderasyon sonrası yapılır. Başkalarına görünürlük yalnızca `api.photo_url(photo_id)` ile sağlanır; bu fonksiyon görünürlük kuralı + `photo_access` + engel kontrolü yapar ve 60 saniyelik imzalı URL üretir.

**`photo_access`** (bağlantıya özel gerçek fotoğraf)
- **Kritik alanlar:** `owner_id`, `match_id`, `granted_at`, `revoked_at`.
- **Kurallar:** PK (`owner_id`, `match_id`). Ekleme koşulu: Bağlantıda `photo` yeteneği `enabled` olmalı (fonksiyonda kontrol edilir).
- **RLS:** Sahip okur ve yazar (RPC üzerinden); karşı taraf yalnızca kendi bağlantısına ait aktif satırın varlığını fonksiyon üzerinden öğrenir.

**`user_settings`**: `user_id`, `show_last_seen`, `show_read_receipts` (varsayılan `false`), `notif_preview` (`hidden` / `generic` / `full`), `notif_categories jsonb`, `quiet_hours`, `app_lock` (yalnızca istemci tercihi), `deep_questions_ok bool`. RLS: Yalnızca sahip.

**`verifications`**
- **Görev:** Yaş (e-Devlet) ve selfie/canlılık doğrulama geçmişi.
- **Kritik alanlar:** `id`, `user_id`, `type` (`age_token` / `liveness` / `face_match`), `status` (`pending` / `passed` / `failed` / `manual_review` / `expired`), `provider`, `provider_ref`, `attempt_no`, `created_at`, `decided_at`, `expires_at`, `consent_id` (FK `legal_consents`).
- **Saklanmayanlar:** Görüntü, biyometrik şablon, kimlik numarası, doğum tarihi (yalnızca türetilmiş "18+").
- **İlişkiler:** `profiles.is_verified` bu tablodan trigger ile güncellenir.
- **RLS:** Sahip kendi kayıtlarının `type` ve `status` alanlarını okur. **Yazma yok.** Yazma yalnızca imzası doğrulanmış sağlayıcı webhook'u (Edge Function, service role) ile yapılır.

**`legal_consents`**: `id`, `user_id`, `consent_type` (`terms` / `privacy_notice` / `sensitive_profile` / `biometric` / `cross_border` / `marketing` / `community_pledge`), `text_version`, `granted_at`, `revoked_at`. RLS: Sahip okur; yazma `api.grant_consent` / `api.revoke_consent` ile. Satırlar silinmez, geri alma yeni zaman damgasıyla işaretlenir.

#### Keşfet ve davet

**`invitations`**
- **Görev:** Tanışma daveti.
- **Kritik alanlar:**
  - `id`, `sender_id`, `recipient_id`, `note` (≤ 300), `prompt_id`
  - `source` (`discover` / `room` / `group` / `profile`)
  - `status` (`pending` / `accepted` / `passed` / `expired` / `cancelled` / `reported`)
  - `created_at`, `expires_at`, `responded_at`
- **Kısıtlar:** (`sender_id`, `recipient_id`) için yalnızca bir `pending` (kısmi unique index); `sender_id <> recipient_id`.
- **RLS:**
  - *Alıcı:* Kendisine gelen `pending` davetleri okur.
  - *Gönderen:* Tabloyu **doğrudan okuyamaz.** `api.my_sent_invitations` view'ı `passed` durumunu süre bitene kadar `pending`, sonra `expired` gösterir (kör ret).
  - *Yazma:* Yalnızca `api.send_invitation`, `api.respond_invitation`, `api.cancel_invitation`.

**`invitation_counters`** (`private`): Kullanıcı başına günlük gönderilen ve alınan davet sayaçları; profil görüntüleme sayacı.

**`discover_daily`** (`private`): Kullanıcı başına günlük üretilen öneri listesi ve gerekçe kodları (gün içinde sabit liste; denetlenebilirlik).

#### Bağlantı ve rıza motoru

**`matches`**
- **Görev:** İki kişi arasındaki bağlantı (arayüzde "Bağlantı").
- **Kritik alanlar:**
  - `id`, `user_low`, `user_high` (CHECK `user_low < user_high`, UNIQUE çift)
  - `source` (`invitation` / `group_followup`), `source_id`
  - `status` (`active` / `ended` / `blocked`), `created_at`, `ended_at`
  - `ended_by` (karşı tarafa gösterilmez), `conversation_id` (FK)
- **RLS:** İki taraf da `id`, `status`, `created_at`, `conversation_id` alanlarını okur (view üzerinden; `ended_by` hariç). Yazma yalnızca RPC.

**`match_permissions`**
- **Görev:** Her bağlantıdaki **her yeteneğin ortak durumu.**
- **Kritik alanlar:**
  - PK (`match_id`, `capability`)
  - `state` (`locked` / `eligible` / `in_round` / `enabled` / `disabled`)
  - `enabled_at`, `disabled_at`, `disabled_by` (gizli), `current_round_id`
  - `next_proposal_allowed_at` (iki taraf için genel cooldown)
- **Oluşturma:** Bağlantı kurulunca `capability_catalog`'daki her satır için bir kayıt oluşur (`text` → `enabled`, diğerleri → `locked`). `mvp_enabled = false` olanlar `locked` kalır.
- **RLS:** Tablo doğrudan okunamaz. Kullanıcı `api.my_match_permissions(match_id)` fonksiyonuyla **kendine özgü (viewer-specific)** bir durum görür: `enabled` / `not_enabled` / `you_can_propose` / `awaiting_your_answer` / `not_yet_available`. Karşı tarafın oyu, kimin teklif ettiği ve kimin kapattığı **hiçbir zaman** dönmez.

**`permission_user_state`**: (`match_id`, `capability`, `user_id`) PK, `never_ask bool`, `can_propose_after timestamptz` (izni kapatanın karşısındaki kişi için +14 gün). RLS: Yalnızca sahip kendi satırını okur.

**`permission_rounds`**
- **Görev:** Bir teklif turu.
- **Kritik alanlar:** `id`, `match_id`, `capability`, `started_by` (`system` ya da kullanıcı; gizli), `started_at`, `closes_at` (`started_at + round_ttl_days`), `outcome` (`open` / `enabled` / `not_enabled`), `decided_at`.
- **Zamanlama sızıntısına karşı kural:** Tur, bir taraf "Şimdilik değil" dese bile kullanıcılara **ancak `closes_at` zamanında** "kapandı" olarak yansır. Böylece "hemen kapandıysa hayır dedi" çıkarımı yapılamaz. İki taraf da "Evet" derse tur anında `enabled` olur (olumlu sonuç gizlenmez).
- **RLS:** Doğrudan erişim yok.

**`permission_votes`**
- **Görev:** Kör onay oyları.
- **Kritik alanlar:** PK (`round_id`, `user_id`), `vote` (`yes` / `not_now` / `never_ask`), `voted_at`.
- **RLS:** `SELECT` yalnızca `user_id = auth.uid()`. `INSERT/UPDATE` yalnızca `api.respond_permission`. Oy, tur kapanana kadar sahibi tarafından değiştirilebilir.

**`permission_events`** (`public` tablosu ama **append-only**)
- **Görev:** Rıza değişikliklerinin değiştirilemez geçmişi (hukuki delil ve şeffaflık).
- **Kritik alanlar:** `id`, `match_id`, `capability`, `event` (`eligible` / `round_started` / `vote_cast` / `enabled` / `revoked` / `round_closed` / `auto_disabled_block` / `auto_disabled_end` / `admin_disabled`), `actor_id` (null = sistem), `created_at`, `meta jsonb`.
- **Koruma:** `UPDATE/DELETE` her rol için trigger ile engellenir. `vote_cast` olaylarında oy değeri saklanmaz, yalnızca "oy verildi" bilgisi tutulur.
- **RLS:** Kullanıcı yalnızca **kendi yaptığı** olayları okuyabilir. Panelde yalnızca Security Admin vaka bağlamında görür.

**Durum geçiş fonksiyonları** (hepsi `api` şemasında, `SECURITY DEFINER`, tek transaction, `SELECT … FOR UPDATE` ile satır kilidi):

| Fonksiyon | Kontroller | Sonuç |
|---|---|---|
| `api.propose_permission(match_id, cap)` | Üyelik, bağlantı aktif, engel yok, `mvp_enabled`, ön koşullar, uygunluk, cooldown, `can_propose_after`, açık tur yok, hız limiti | Tur açılır; iki tarafa nötr soru kartı (sistem mesajı + push) |
| `api.respond_permission(round_id, vote)` | Tur açık, oy veren taraf mı | İki oy da `yes` → `enabled` + olaylar + bildirim. Oy `not_now`/`never_ask` → tur kapanışı `closes_at`'te yansıtılır, cooldown ayarlanır |
| `api.revoke_permission(match_id, cap)` | Üyelik, durum `enabled` | `disabled` + karşı tarafa `can_propose_after = +14 gün` + medya gizleme + olay + nötr sistem mesajı |
| `private.recompute_eligibility(match_id)` | Mesaj sayıları, gün sayısı, doğrulama | `locked` → `eligible`; sistem teklifini zamanlar |
| `private.disable_all(match_id, reason)` | Engel, bağlantı bitişi, admin | Tüm yetenekler (`text` dahil) kapanır; olay kaydı |

#### Mesajlaşma

**`conversations`**
- **Kritik alanlar:** `id`, `type` (`direct` / `group` / `room`), `match_id` | `group_id` | `room_id` (CHECK: türe göre tam olarak biri dolu), `is_readonly`, `created_at`.
- **RLS:** Yalnızca üyeler okur (`conversation_members` üzerinden). Yazma yok (RPC ve sistem).

**`conversation_members`**
- **Kritik alanlar:** PK (`conversation_id`, `user_id`), `role` (`member` / `guide`), `joined_at`, `left_at`, `last_read_at`, `muted_until`.
- **RLS:** Kullanıcı kendi üyelik satırlarını okur; aynı konuşmanın diğer üyelerini, **engel ve gizleme filtreli** view üzerinden görür. Yalnızca `last_read_at` ve `muted_until` kendi satırında güncellenebilir.

**`messages`**
- **Görev:** Tüm mesajlar (birebir, masa, oda).
- **Kritik alanlar:**
  - `id` (UUIDv7), `conversation_id`, `sender_id`
  - `kind` (`text` / `voice` / `image` / `prompt_card` / `prompt_answer` / `game` / `system`)
  - `body_enc bytea` (bkz. E.5), `reply_to_id`, `client_msg_id` (idempotency; UNIQUE (`sender_id`, `client_msg_id`))
  - `moderation` (`pending` / `ok` / `soft_hidden` / `removed`), `created_at`, `edited_at`, `deleted_at`
- **Bölümleme:** `created_at` ile aylık bölümleme (partition). MVP'de tek bölümle başlanabilir, ama şema bölümlemeye hazır kurulur.
- **Zorlayıcı trigger `enforce_message_rules` (BEFORE INSERT, tüm roller):**
  - Gönderen konuşmanın aktif üyesi mi, kısıtlaması var mı?
  - `direct` türünde: Bağlantı `active` mi ve `text` yeteneği `enabled` mı? `kind = voice` → `voice_message` `enabled` olmalı. `kind = image` → `photo` `enabled` olmalı.
  - `group` ve `room` türünde: MVP'de `voice` ve `image` **reddedilir.**
  - Herhangi bir koşul sağlanmazsa `RAISE EXCEPTION`. Bu trigger service role ile yapılan yazmalarda da çalışır (savunma derinliği).
- **RLS:**
  - `SELECT`: Konuşma üyesi + mesaj `removed` değil + gönderen, okuyanı engellememiş ya da okuyan tarafından engellenmemiş (oda ve masa için).
  - **Doğrudan `INSERT` yetkisi yok;** yalnızca `api.send_message`.
  - İçerik okuma `api.get_messages(conversation_id, before, limit)` ile yapılır; şifre çözme burada gerçekleşir.

**`message_media`**
- **Görev:** Mesaja bağlı ses ve görsel dosyaların meta verisi.
- **Kritik alanlar:** `id`, `message_id` (FK), `conversation_id` (denormalize), `owner_id`, `media_type` (`image` / `voice`), `storage_path`, `blurhash`, `duration_ms`, `bytes`, `width`, `height`, `view_once bool`, `viewed_at`, `moderation_status`, `hidden_by_revoke bool`, `created_at`.
- **Zorlayıcı trigger `enforce_media_capability` (BEFORE INSERT, tüm roller):** `media_type = image` ise bağlantıda `photo` `enabled` olmalı, `voice` ise `voice_message` `enabled` olmalı. Değilse `RAISE EXCEPTION 'capability_not_enabled'`.
  → **İki kullanıcı arasında fotoğraf izni yoksa `message_media` tablosuna fotoğraf yazılması teknik olarak mümkün değildir;** istemci, Edge Function ya da yanlış yapılandırılmış bir service role çağrısı fark etmez.
- **RLS:** `SELECT` yalnızca konuşma üyelerine, `hidden_by_revoke = false`, `moderation_status = approved` ve (`view_once` ise) henüz görüntülenmemişse. Dosyanın kendisine erişim yalnızca `api.media_url(media_id)` ile sağlanır: Aynı kontroller **yeniden** yapılır, 60 saniyelik imzalı URL üretilir, `view_once` ise `viewed_at` işaretlenir.

**`message_reactions`**: PK (`message_id`, `user_id`, `emoji`). RLS: Konuşma üyesi okur; ekleme ve silme yalnızca kendi satırı için ve yalnızca `text` yeteneği açıkken.

**`message_transcripts`** (`private`): `media_id`, `text_enc`, `created_at`, `delete_after` (+30 gün). Yalnızca moderasyon içindir.

#### Topluluk

**`rooms`**: `id`, `slug`, `title`, `category` (`support` / `city` / `interest` / `time`), `description`, `rules_md`, `city_id`, `open_hours`, `slow_mode_seconds`, `new_user_slow_mode_seconds`, `is_active`, `conversation_id`. RLS: Aktif kullanıcılar okur; yazma yalnızca `admin` fonksiyonlarıyla (Community Manager).

**`room_members`**: PK (`room_id`, `user_id`), `joined_at`, `muted_until` (moderasyon), `notif_level`. RLS: Kullanıcı kendi satırını okur. Katılma ve ayrılma `api.join_room` / `api.leave_room` ile yapılır.

**`group_themes`**: `id`, `title`, `description`, `scope_allowed`, `is_active`, `starter_deck_id`. Admin yönetir.

**`masa_requests`**: `id`, `user_id`, `theme_id`, `scope` (`city` / `national`), `city_id`, `status` (`waiting` / `matched` / `cancelled` / `expired`), `created_at`. RLS: Sahip okur; RPC ile yazılır.

**`groups`** (masalar)
- **Kritik alanlar:** `id`, `theme_id`, `scope`, `city_id`, `status` (`forming` / `active` / `closing` / `closed`), `min_members` = 4, `max_members` = 8 (CHECK `4 <= min <= max <= 8`), `starts_at`, `ends_at`, `extensions` (≤ 3), `conversation_id`.
- **RLS:** Üyeler okur. Oluşturma yalnızca eşleştirici iş (service role).

**`group_members`**: PK (`group_id`, `user_id`), `joined_at`, `left_at`. Trigger'lar: (a) aktif üye sayısı ≤ `max_members`; (b) kullanıcının aktif masa sayısı ≤ 2; (c) yeni üye ile mevcut üyeler arasında engel ya da gizleme varsa ekleme reddedilir. RLS: Üyeler, aynı grubun üye listesini engel filtreli view ile görür.

**`group_followup_choices`**: PK (`group_id`, `chooser_id`, `target_id`), `created_at`. RLS: Yalnızca `chooser_id = auth.uid()`. Kapanışta `private.resolve_followups(group_id)` karşılıklı seçimlerden bağlantı oluşturur.

**`group_continue_votes`**: PK (`group_id`, `user_id`), `vote`. RLS: Yalnızca sahip.

**`prompt_decks`, `prompts`**: Admin içerikleri (`depth`: `light` / `restart` / `deep` / `fun`). Herkes okuyabilir (`deep` filtrelemesi fonksiyonda yapılır).

**`prompt_rounds`, `prompt_answers`**: "İkisi de cevaplayınca açılır" mekanizması. Cevap metni, okuyan kişi kendi cevabını vermeden `api.get_prompt_round` tarafından döndürülmez.

#### Güvenlik ve moderasyon

**`blocks`**
- **Kritik alanlar:** PK (`blocker_id`, `blocked_id`), `created_at`, `source` (`manual` / `report` / `admin`).
- **RLS:** Engelleyen kendi satırlarını okur. **Engellenen kişi hiçbir satırı göremez.** Yazma `api.block_user` / `api.unblock_user` ile.
- **Kullanım:** `private.is_blocked_either(a, b)` fonksiyonu tüm görünürlük kurallarında kullanılır (indeksli).

**`contact_hides`** (`private`): `owner_id`, `phone_hmac`, `kind` (`contacts` / `specific`), `created_at`. Eşleştirme `private.is_hidden_either(a, b)` ile yapılır: `owner.contact_hides ∩ other.profile_private.phone_hmac`. Bu fonksiyon `is_blocked_either` ile birleşik bir `private.cannot_see(a, b)` fonksiyonunda kullanılır.

**`reports`**
- **Kritik alanlar:** `id`, `reporter_id`, `target_type` (`user` / `message` / `invitation` / `room_message` / `group_message` / `profile_photo`), `target_id`, `target_user_id`, `category`, `details`, `status` (`received` / `in_review` / `actioned` / `no_action`), `priority`, `case_id` (FK `moderation_queue`), `created_at`.
- **RLS:** Raporlayan kendi raporunun yalnızca `status` alanını görür (`api.my_reports`). Raporlanan kişi rapor varlığını hiçbir şekilde göremez. Yazma `api.create_report` ile.

**`report_evidence`** (`private`): `report_id`, `snapshot_enc` (mesaj penceresi, profil anlık görüntüsü), `media_refs` (medya dosyaları delil süresince silinmeye karşı kilitlenir: `legal_hold`), `created_at`, `retain_until`.

**`moderation_queue`** (`private`; vaka)
- **Kritik alanlar:** `id`, `subject_user_id`, `primary_category`, `priority` (`P0`–`P3`), `status` (`open` / `in_review` / `pending_second_review` / `resolved` / `appealed`), `assigned_to`, `sla_due_at`, `source` (`user_report` / `auto_text` / `auto_image` / `auto_voice` / `risk_threshold` / `appeal` / `age_suspect`), `risk_score_at_open`, `created_at`, `resolved_at`, `resolution_code`.
- **İlişkiler:** 1–N `reports`, `moderation_actions`, `risk_signals` (bağlam).
- **Erişim:** Yalnızca `admin.*` fonksiyonları, role göre süzülmüş olarak. P0 kriz vakaları yalnızca `crisis` yetkisi olanlara görünür.

**`moderation_actions`** (append-only): `id`, `case_id`, `admin_id`, `action` (`warn` / `hide_content` / `remove_content` / `restrict_feature` / `suspend` / `ban` / `device_ban` / `unban` / `dismiss` / `escalate`), `reason_code`, `note`, `requires_second_approval`, `approved_by`, `created_at`.

**`user_restrictions`**: `id`, `user_id`, `restriction` (`no_invites` / `no_media` / `no_rooms` / `read_only` / `suspended` / `banned`), `starts_at`, `ends_at`, `case_id`, `created_by`. RLS: Kullanıcı kendi aktif kısıtlamalarının türünü ve bitişini görür (S59).

**`risk_signals`** (`private`)
- **Kritik alanlar:** `id`, `user_id`, `signal` (enum, G bölümündeki sinyaller), `weight`, `source` (`rule` / `classifier` / `report` / `admin`), `ref_type`, `ref_id`, `created_at`, `expires_at`.
- **Türetilmiş tablo:** `private.risk_scores` (`user_id`, `score`, `band` (`low` / `elevated` / `high` / `critical`), `updated_at`). Bant değişimleri otomatik eylem tetikler (G bölümü).

**`ban_registry`** (`private`): `phone_hmac`, `device_hmac`, `face_ref` (yalnızca sağlayıcı tarafı referans, varsa), `reason_code`, `created_at`, `expires_at`. Yasaklının yeniden kaydını engeller; saklama süresi hukuk onayına bağlıdır.

**`safety_events`** (`private`; kriz)
- **Kritik alanlar:** `id`, `user_id`, `source` (`classifier` / `report`), `severity`, `message_ref`, `created_at`, `case_id`, `outcome`, `retain_until` (kısa; ör. 90 gün).
- **Erişim:** Yalnızca `crisis` yetkisi. Her okuma `audit_logs`'a yazılır.

**`audit_logs`** (`audit` şeması, append-only)
- **Görev:** Kim, neyi, ne zaman, neden yaptı?
- **Kritik alanlar:** `id bigserial`, `occurred_at`, `actor_type` (`admin` / `system` / `user`), `actor_id`, `action`, `target_type`, `target_id`, `reason`, `meta jsonb`, `ip_hmac`, `prev_hash`, `row_hash` (zincirleme hash: kayıtlarla oynanması tespit edilebilir).
- **Kapsam:** Tüm admin işlemleri, hassas veri görüntülemeleri (break-glass), rol değişiklikleri, ban/unban, yasal talep işlemleri, kriz vakası erişimi, yapılandırma (`app_config`) değişiklikleri.
- **Koruma:** `UPDATE/DELETE/TRUNCATE` trigger ve yetki ile engelli. Günlük olarak ayrı ve değiştirilemez bir depolamaya dışa aktarım (Faz 2: object lock).

#### Hesap, cihaz, operasyon

| Tablo | Görev | Kritik alanlar | RLS |
|---|---|---|---|
| `devices` | Cihaz ve push | `id`, `user_id`, `device_hmac`, `platform`, `push_token`, `app_version`, `last_seen_at` | Sahip okur ve yazar (kendi cihazı); `device_hmac` istemciden değiştirilemez |
| `notifications` | Uygulama içi bildirimler | `id`, `user_id`, `type`, `payload` (hassas içerik yok), `read_at` | Yalnızca sahip |
| `cities` | Şehirler | `id`, `name`, `status` (`active` / `waitlist`), `opened_at` | Herkes okur |
| `city_waitlist` | Bekleme listesi | `user_id`/`phone_hmac`, `city_id`, `created_at` | Sahip |
| `beta_invite_codes` | Beta kodları | `code_hash`, `channel`, `max_uses`, `used_count`, `expires_at`, `created_by` | Yok (RPC) |
| `feedback` | Geri bildirim | `id`, `user_id`, `screen`, `category`, `text`, `created_at` | Sahip yazar; panel okur |
| `data_requests` | KVKK talepleri | `id`, `user_id`, `type` (`export` / `delete`), `status`, `requested_at`, `completed_at`, `artifact_path` | Sahip okur |
| `app_config` | Sayısal kurallar (davet limiti vb.) | `key`, `value jsonb`, `updated_by`, `updated_at` | Herkes okur (yalnızca istemciye açık anahtarlar); yazma Super Admin + audit |
| `admin_users` | Panel kullanıcıları | `user_id`, `role`, `is_active`, `mfa_required` | Yok (yalnızca `admin` fonksiyonları) |
| `rate_limit_buckets` | Hız limiti | `key`, `window_start`, `count` | Yok (`private`) |

### E.4 İleride eklenecek tablolar (MVP'de oluşturulmaz, model hazır)

| Tablo | Bağlandığı yer | Not |
|---|---|---|
| `calls` (`id`, `match_id`, `type`: `voice`/`video`, `provider_room`, `started_by`, `started_at`, `ended_at`, `end_reason`, `duration_s`) | `matches`, `match_permissions` (`voice_call` / `video_call`) | `capability` enum'u ve kataloğu hazır; `mvp_enabled` açılınca devreye girer |
| `call_participants`, `call_reports` | `calls` | |
| `meet_plans`, `safety_checkins`, `trusted_contacts` | `matches` (`meet`) | Faz 3 |
| `posts`, `post_reactions`, `comments`, `post_pseudonyms` | `profiles` | Faz 2. `reports.target_type` enum'u genişletilir |
| `subscriptions`, `entitlements` | `profiles` | Faz 2. Davet limitiyle **ilişkisiz** (ÜK-04) |
| `user_groups` (kullanıcı kurulu gruplar) | `groups.type` alanı eklenir | Faz 2–3 |

### E.5 Mesaj içeriğinin korunması (karar noktası)

**Hedef:** Veritabanı dökümü ya da yedeği sızsa bile mesaj içerikleri okunamasın; hiçbir çalışan mesajları serbestçe okuyamasın.

**MVP önerisi:**
1. `body_enc` alanı, `pgcrypto` ile **Supabase Vault'ta saklanan bir anahtarla** şifrelenir. Şifreleme ve çözme yalnızca `api.send_message` ve `api.get_messages` (ve moderasyon worker'ı) içinde yapılır. Vault anahtarı veritabanı dökümünde açık halde bulunmaz.
2. Realtime yayını, gönderim fonksiyonu sonrası TLS üzerinden düz metin olarak, yalnızca kanal üyelerine yapılır (yayın içeriği kalıcı saklanmaz).
3. Admin panelinde mesaj içeriği **yalnızca** vaka delili (`report_evidence`) olarak görünür.

**Risk ve karar kapısı:** Şifreleme okuma ve yazma maliyetini artırır ve arama yapılamaz. Sprint 5'te 10.000 mesajlık yük testiyle ölçülecek. p95 okuma süresi 150 ms'yi aşarsa alternatif değerlendirilir: disk şifrelemesi + sıkı erişim, gizlilik metni de buna göre dürüstçe güncellenir. Bu karar Deniz'e sunulur.

---

## F. Yetki ve Güvenlik Mimarisi

### F.1 Güven sınırları

```
[Mobil uygulama]  → güvenilmez (her şey sahtelenebilir)
      │  anon/authenticated JWT
      ▼
[PostgREST + RLS] → yalnızca okuma ve izinli küçük yazmalar
[api.* RPC]       → tüm iş kuralları (SECURITY DEFINER, search_path sabit)
[Edge Functions]  → dış servisler, dosya yükleme izni, webhook, kriptografi
      │  service role (yalnızca sunucu tarafında, gizli)
      ▼
[DB trigger'ları] → son savunma hattı: service role'de de çalışan değişmez kurallar
```

**İlke:** Bir kural ne kadar kritikse o kadar aşağıda (veritabanına yakın) uygulanır. Rıza ve mesaj yetkileri **üç katmanda** kontrol edilir: RPC/Edge Function → trigger → okuma RLS'i.

### F.2 Roller

| Rol | Ne | Nasıl tanınır |
|---|---|---|
| `anon` | Oturum açmamış | Supabase anon anahtarı. Yalnızca davet kodu doğrulama ve bekleme listesi RPC'leri |
| `authenticated` (kullanıcı) | Normal kullanıcı | JWT `sub` |
| `authenticated` + `profiles.status` | Durum bazlı kısıt | Her RPC'nin başında `private.assert_active(uid)`: `paused`, `restricted`, `banned`, `age_blocked` durumlarında ilgili işlemler reddedilir |
| `admin_*` | Panel kullanıcıları | Ayrı Supabase Auth kullanıcısı + `admin_users` kaydı + **MFA (AAL2) zorunlu.** Admin fonksiyonları `admin.assert_role(permission)` ile başlar ve `auth.jwt()->>'aal' = 'aal2'` kontrol eder |
| `service_role` | Edge Functions ve worker'lar | Yalnızca sunucu ortam değişkeninde. İstemcide ve panelin tarayıcı tarafında **asla** bulunmaz |

### F.3 RLS desenleri

| Desen | Uygulama |
|---|---|
| **Sahiplik** | `using (user_id = auth.uid())` |
| **Üyelik** | `using (exists (select 1 from conversation_members m where m.conversation_id = … and m.user_id = auth.uid() and m.left_at is null))`. Performans için `private.is_member(conv_id)` `STABLE SECURITY DEFINER` fonksiyonu + indeks |
| **Karşılıklı görünmezlik** | Diğer kullanıcıya ait her satırın okunmasında `not private.cannot_see(auth.uid(), other_id)` |
| **Gizli kolonlar** | Tabloya `SELECT` yetkisi verilmez; maskeli view veya fonksiyon üzerinden erişilir (`ended_by`, `disabled_by`, `started_by` gibi) |
| **Kolon bazlı güncelleme** | `REVOKE UPDATE ON profiles FROM authenticated; GRANT UPDATE (izinli kolonlar) …` |
| **Yazma yasak** | Mesaj, davet, rıza, rapor, engel gibi tablolarda `INSERT` politikası yazılmaz; yalnızca RPC yazar |
| **Append-only** | `BEFORE UPDATE OR DELETE` trigger'ı → `RAISE EXCEPTION` (`permission_events`, `moderation_actions`, `audit_logs`) |

**RLS test kuralı:** Her tablo için "yetkisiz kullanıcı okuyamaz / yazamaz" testleri (pgTAP) olmadan migration birleştirilemez (bkz. M).

### F.4 RPC ve Edge Function haritası

**Veritabanı RPC'leri (`api` şeması):**
`send_invitation`, `respond_invitation`, `cancel_invitation`, `my_sent_invitations`, `discover_feed`, `profile_card`, `send_message`, `get_messages`, `mark_read`, `delete_message`, `react`, `propose_permission`, `respond_permission`, `revoke_permission`, `my_match_permissions`, `grant_photo_access`, `revoke_photo_access`, `end_match`, `block_user`, `unblock_user`, `create_report`, `my_reports`, `join_room`, `leave_room`, `request_masa`, `cancel_masa_request`, `leave_group`, `submit_followup_choices`, `vote_continue`, `answer_prompt`, `get_prompt_round`, `pause_account`, `resume_account`, `request_account_deletion`, `cancel_account_deletion`, `request_data_export`, `grant_consent`, `revoke_consent`, `submit_feedback`, `submit_appeal`, `redeem_beta_code`, `join_waitlist`.

**Edge Functions (dış servis, kriptografi ya da dosya gerektirenler):**

| Fonksiyon | Görev | Güvenlik notu |
|---|---|---|
| `otp-guard` | OTP isteğinden önce CAPTCHA + numara/cihaz/IP limiti + VoIP kontrolü | Supabase Auth hook (send SMS) ile birlikte |
| `age-verify` | e-Devlet yaş belirtecini doğrulama | Belirteç imzası sunucuda doğrulanır; yalnızca 18+ sonucu yazılır |
| `liveness-session` / `liveness-webhook` | Doğrulama oturumu başlatma; sonuç webhook'u | Webhook imzası (HMAC) + zaman damgası + tekrar saldırısı (replay) koruması |
| `request-media-upload` | Fotoğraf/ses için tek dosyalık imzalı yükleme URL'si | Yetenek kontrolü, boyut ve tür, kullanıcı başı kota |
| `media-ingest` (worker) | Karantinadan alma, doğrulama, yeniden kodlama, EXIF silme, moderasyon, `message_media` yazma | Trigger yetkiyi yeniden kontrol eder |
| `media-url` | Medya için 60 sn imzalı indirme URL'si | Görüntüleme sırasında yetki yeniden kontrol edilir |
| `contact-hide` | Rehber/numara → HMAC | Ham numara yazılmaz ve log'lanmaz |
| `moderation-worker` | Metin, görsel ve ses sınıflandırma; risk sinyali; vaka açma | Sağlayıcıya yalnızca gerekli içerik gönderilir; kimlik bilgisi gönderilmez |
| `push-dispatch` | Bildirim gönderimi | İçerik varsayılan gizli |
| `masa-matcher` (zamanlanmış) | Masa oluşturma | Engel ve gizleme kontrolü |
| `daily-jobs` (zamanlanmış) | Davet süresi, tur kapanışı, silme, saklama süresi temizliği | |
| `data-export` | KVKK dışa aktarım paketi | İmzalı ve süreli link; OTP onayı |

### F.5 Storage mimarisi

| Bucket | İçerik | Erişim |
|---|---|---|
| `quarantine` | Moderasyon öncesi tüm yüklemeler | İstemci yalnızca imzalı yükleme URL'si ile yazar; **okuma yok.** 24 saat yaşam döngüsü |
| `profile-photos` | Onaylı profil fotoğrafları | Özel. Yalnızca `media-url` / `photo_url` imzalı URL'si |
| `chat-media` | Onaylı sohbet fotoğrafları ve sesleri | Özel. Yol: `{conversation_id}/{media_id}`. İmzalı URL 60 sn |
| `exports` | KVKK dışa aktarım paketleri | Özel; 7 gün yaşam döngüsü |
| `public-assets` | Avatar parçaları, oda ikonları | Herkese açık, salt okunur |

**Storage politikaları:**
- `authenticated` rolü için hiçbir özel bucket'ta `INSERT/SELECT/UPDATE/DELETE` politikası **yoktur.** Tüm erişim imzalı URL'lerle yapılır.
- Yüklenen dosyanın gerçek türü sunucuda içerik baytlarından (magic bytes) doğrulanır; uzantıya güvenilmez.
- Görseller sunucuda yeniden kodlanır (EXIF/GPS dahil tüm meta veri silinir).
- Boyut sınırları: Görsel ≤ 10 MB; ses ≤ 5 MB ve ≤ 120 sn.
- Dosya adları her zaman sunucu tarafından üretilen UUID'lerdir (kullanıcı dosya adı kullanılmaz).

### F.6 Admin ve moderatör yetkileri (teknik)

- Panel kullanıcıları **ayrı bir Supabase Auth havuzunda değil, aynı projede ama `admin_users` tablosuyla** tanımlanır. Mobil uygulama hesabı ile admin hesabı **aynı kişi için bile ayrı** olmalıdır (ayrı e-posta).
- Admin girişi: E-posta + parola + TOTP (MFA zorunlu). Oturum 8 saat; 30 dk hareketsizlikte kilit.
- Panel (Next.js) **yalnızca `admin.*` RPC'lerini** kullanıcının kendi JWT'siyle çağırır. Service role anahtarı panelde yoktur. Toplu işler gerekiyorsa ayrı ve dar yetkili Edge Function'lar kullanılır.
- Her `admin.*` fonksiyonu: (1) rol yetkisini kontrol eder, (2) MFA seviyesini kontrol eder, (3) işlemi yapar, (4) `audit_logs`'a yazar. Hepsi tek transaction içinde (log yazılamazsa işlem de olmaz).
- **Dört göz ilkesi:** Kalıcı ban, cihaz banı, admin rol değişikliği ve hassas veri dışa aktarımı ikinci bir yetkilinin onayını gerektirir.
- **Break-glass:** Telefon numarası (maskesiz), doğum tarihi ve kriz vakası detayı gibi alanlar yalnızca gerekçe girilerek 15 dakikalığına açılır ve loglanır.
- Panel erişimi IP izin listesi ve Vercel koruması ile sınırlandırılabilir (öneri: beta döneminde açık).

### F.7 Hız limitleri (rate limiting)

| İşlem | Limit (başlangıç) | Uygulama yeri |
|---|---|---|
| OTP isteği | Numara: 5/saat · Cihaz/IP: 10/saat · Ülke kodu yalnızca +90 | `otp-guard` + Supabase Auth ayarı |
| OTP doğrulama | 5 deneme → 15 dk kilit | Supabase Auth + `otp-guard` |
| Beta kodu deneme | 10/saat/cihaz | `api.redeem_beta_code` |
| Davet gönderme | 10/gün (herkese eşit) + 3/dakika | `api.send_invitation` |
| Gelen davet | 15/gün | `api.send_invitation` |
| Profil görüntüleme | 60/gün | `api.profile_card` |
| Mesaj | 30/dk, 300/saat; odalarda yavaş mod | `api.send_message` |
| Medya yükleme | 20/saat, 100/gün | `request-media-upload` |
| Rapor | Aynı hedefe 1/24 saat; toplam 20/gün | `api.create_report` |
| İzin teklifi | Katalog kuralları + 5/gün | `api.propose_permission` |
| Hesap silme / dışa aktarım | 1 aktif talep | RPC'ler |

**Uygulama:** `private.rate_limit_hit(key, window, max)` fonksiyonu (sabit pencere sayacı, `rate_limit_buckets`). Edge Function'larda aynı fonksiyon çağrılır. Ölçek büyüyünce Redis (Upstash) tabanlı limitleyiciye geçilir.

### F.8 Cihaz, oturum ve kaba kuvvet koruması

- **Oturum:** Supabase Auth JWT (kısa ömürlü, 1 saat) + yenileme belirteci rotasyonu (refresh token rotation + yeniden kullanım tespiti). Hesap başına en fazla 3 aktif cihaz oturumu.
- **Cihaz kaydı:** Uygulama ilk açılışta rastgele bir cihaz kimliği üretir ve güvenli depoda (Keychain/Keystore) saklar. Sunucuda HMAC'lenmiş olarak tutulur. Ban kaçışı tespitinde kullanılır.
- **Uygulama bütünlüğü (Faz 2'de zorunlu, MVP'de değerlendirme):** iOS App Attest ve Android Play Integrity ile sahte istemci tespiti. Supabase'te bu doğrulama Edge Function'da yapılabilir.
- **Kaba kuvvet:** OTP ve beta kodu limitleri yukarıda. Admin girişinde 5 hatalı denemede 30 dk kilit + bildirim.
- **Kritik değişikliklerde yeniden doğrulama:** Telefon numarası değişikliği, hesap silme ve veri dışa aktarma için OTP gerekir.
- **Şüpheli giriş:** Yeni cihazdan giriş yapıldığında kullanıcıya uygulama içi ve SMS bildirimi gider.

### F.9 Telefon numarası HMAC tasarımı

- `phone_hmac = HMAC-SHA256(secret_k1, E.164 numara)`. `secret_k1` yalnızca Edge Function ortamında (Supabase secrets) bulunur, veritabanında bulunmaz.
- Kullanıcının kendi numarası `auth.users` tablosunda (Supabase Auth) kalır. `profile_private.phone_hmac` yalnızca eşleştirme içindir.
- Rehber ve eski partner numaraları aynı fonksiyonla HMAC'lenir. Ham numara bellekte işlenir, log'lanmaz (fonksiyonda log maskeleme zorunlu).
- **Anahtar rotasyonu:** Yılda bir ya da sızıntı şüphesinde. Rotasyon sırasında iki anahtar birlikte kullanılır ve tüm HMAC'ler yeniden hesaplanır (kullanıcı numaralarından; rehber HMAC'leri ise kullanıcıdan yeniden senkronizasyon istenerek).

### F.10 Gizli anahtar ve yapılandırma yönetimi

- Her ortamın (bkz. K) kendi anahtarları vardır; ortamlar arasında anahtar paylaşılmaz.
- Anahtarlar: Supabase secrets (Edge Functions), Vercel environment variables (panel; yalnızca publishable anahtarlar), EAS secrets (mobil derleme; yalnızca publishable anahtarlar), GitHub Actions secrets (CI).
- Mobil uygulamada yalnızca **publishable (anon) anahtar** bulunur.
- Repoda `.env` dosyası bulunmaz; `gitleaks` CI'da çalışır.
- **AI araçlarına anahtar ve gerçek veri verilmez** (K4).

---

## G. Moderasyon Mimarisi

### G.1 Genel akış

```
Önleme (Prevention) → Tespit (Detection) → Eylem (Action) → İnsan incelemesi (Human review)
                                   │
                         risk_signals + risk_scores
                                   │
                    moderation_queue (öncelik + SLA)
```

**Ortak kurallar:**
- **Kalıcı yaptırım (ban) her zaman insan kararıdır.** Otomatik eylemler geri alınabilir ve geçicidir (gizleme, geçici kısıtlama, inceleme bekletmesi).
- Otomatik sınıflandırıcılar **eşik + güven skoru** ile çalışır. Belirsiz bölge insana gider.
- Her otomatik eylem `audit_logs`'a `actor_type = system` olarak yazılır ve gerekçe kodu içerir.
- Sınıflandırıcı sağlayıcılarına (metin/görsel/ses) kimlik bilgisi gönderilmez; yalnızca içerik ve dil gönderilir. Sağlayıcı sözleşmelerinde veri saklamama ve eğitimde kullanmama şartı aranır.
- **Öncelik ve SLA:**
  - **P0:** Tehdit, reşit olmayan, kriz → 1 saat
  - **P1:** Cinsel içerik, dolandırıcılık → 4 saat
  - **P2:** Taciz, sahte profil → 24 saat
  - **P3:** Spam, diğer → 72 saat

**Risk skoru bantları ve otomatik eylemler:**

| Bant | Otomatik eylem |
|---|---|
| `low` | — |
| `elevated` | Davet ve medya hız limitleri yarıya iner; yeni bağlantılarda güvenlik ipucu gösterilir |
| `high` | Davet gönderme ve medya askıya alınır; vaka P1 olarak açılır |
| `critical` | Hesap `restricted` (salt okunur) olur; vaka P0 olarak açılır; insan kararı beklenir |

### G.2 Taciz

| Aşama | Tasarım |
|---|---|
| **Önleme** | Kademeli izinler (medya yok); davet limiti; topluluk sözü; "nazikçe geç" (ısrar için kanal yok); aynı kişiye 30 gün yeniden davet yasağı |
| **Tespit** | Metin sınıflandırıcı (hakaret, aşağılama, cinsel taciz, nefret söylemi; Türkçe argo sözlüğü + LLM tabanlı sınıflandırma). Davranış sinyalleri: tek taraflı mesaj oranı (karşı taraf yanıt vermezken art arda 10+ mesaj), bir kullanıcı hakkında 7 günde farklı kişilerden 3+ rapor, sık engellenme |
| **Eylem** | Mesaj alıcıya bulanık gelir ("rahatsız edici olabilir"). Gönderene "Bu mesaj topluluk kurallarına aykırı olabilir" uyarısı. Tekrarında `harassment` sinyali; `high` bantta davet ve oda kısıtı |
| **İnsan incelemesi** | P2 (tehdit içeriyorsa P0). Moderatör delile bakar; uyarı → geçici kısıtlama → askıya alma → (Security Admin onayıyla) ban |

### G.3 Tehdit

| Aşama | Tasarım |
|---|---|
| **Önleme** | Kesin konum asla gösterilmez; ev adresi, iş yeri gibi bilgiler paylaşımı için uyarılar; engellemenin her yerde etkili olması |
| **Tespit** | Sınıflandırıcı "şiddet tehdidi" kategorisi + kalıplar (öldürmek, bulmak, adresini biliyorum vb.) + raporlar |
| **Eylem** | Yüksek güvenle: mesaj gizlenir, gönderen anında `restricted` olur, alıcıya güvenlik kaynakları ve 112 bilgisi gösterilir. Delil `legal_hold` ile kilitlenir |
| **İnsan incelemesi** | **P0.** Security Admin karar verir; ciddi ve somut tehditte hukuki prosedüre göre yetkili mercilerle iş birliği protokolü (hukuk uzmanının yazacağı süreç) |

### G.4 Çıplaklık / cinsel içerik

| Aşama | Tasarım |
|---|---|
| **Önleme** | Fotoğraf yalnızca Seviye 2 çift onayıyla; odalarda ve masalarda görsel yok; profil fotoğrafları moderasyon onayı olmadan görünmez; topluluk kuralında açıkça yasak |
| **Tespit** | Her görsel karantinada sınıflandırıcıdan geçer (çıplaklık, cinsel içerik, şiddet, **çocuk varlığı**). Metinde cinsel taciz sınıflandırması. Ses transkriptinde aynı metin kontrolleri |
| **Eylem** | Çıplaklık → görsel **teslim edilmez**, gönderene bildirim gider, `nudity_attempt` sinyali oluşur. 2. denemede medya yeteneği 7 gün kısıtlanır, 3. denemede vaka açılır. **Çocuk varlığı + çıplaklık şüphesi → sıfır tolerans:** hesap anında askıya alınır, P0 vaka açılır, delil kilitlenir (yasal bildirim prosedürü hukuk uzmanınca yazılır) |
| **İnsan incelemesi** | P1 (çocuk şüphesi P0). Yanlış pozitifler (ör. mayolu tatil fotoğrafı) moderatörce serbest bırakılır; sınıflandırıcı eşik ayarı için kayıt tutulur |

### G.5 Dolandırıcılık (romantik dolandırıcılık)

| Aşama | Tasarım |
|---|---|
| **Önleme** | Selfie doğrulaması (davet için zorunlu); ilk günlerde dış iletişim uyarıları; güvenlik merkezinde "Para isteyen herkes dolandırıcıdır" mesajı; hediye ve ödeme özelliği yok |
| **Tespit** | Kural seti + sınıflandırıcı: duygusal yoğunlaştırma kalıpları ("seni ilk gördüğümde…", erken "aşk" söylemi), acil durum hikâyeleri (hastane, gümrük, miras), yatırım ve kazanç teklifleri. Davranış: kısa sürede çok sayıda bağlantıya benzer mesaj kopyalama, yeni hesap + yüksek davet hızı, yüz eşleşmesi başarısız fotoğraf girişimi, VoIP numara |
| **Eylem** | Alıcıya bağlam içinde uyarı kartı. Gönderene `scam_pattern` sinyali. Kopya mesaj tespitinde hız limiti. `high` bantta davetler askıya alınır |
| **İnsan incelemesi** | P1. Moderatör hesabın tüm bağlantılarındaki **yalnızca raporlanmış ya da otomatik işaretlenmiş** mesajlara erişir. Kanıtlanırsa ban + ban kaydı + o kişiyle bağlantısı olan herkese nötr bir güvenlik bildirimi ("Bağlantılarından biri topluluk kurallarını ihlal ettiği için kaldırıldı. Kimseye para göndermemeni hatırlatırız.") |

### G.6 IBAN / kripto / para talebi

| Aşama | Tasarım |
|---|---|
| **Önleme** | Davet notunda IBAN, kart numarası ve kripto adresi **yasak** (sunucu reddeder). Sohbette gönderim öncesi uyarı ("Para ile ilgili bilgi paylaşmak üzeresin…") |
| **Tespit** | Deterministik desenler: `TR\d{24}` IBAN (MOD-97 doğrulamalı), kart numarası (Luhn doğrulamalı), kripto adres desenleri (BTC/ETH/TRX/USDT), "papara", "havale", "EFT", "borç", "kira", "bilet parası" gibi anahtar kelimeler + sınıflandırıcı |
| **Eylem** | Alıcıya kırmızı uyarı kartı: "Bu mesaj para talebi içeriyor olabilir. Tanımadığın kişilere asla para gönderme." Gönderene `money_request` sinyali (yüksek ağırlık). Bağlantının ilk 14 gününde tekrarlanırsa → `critical` → otomatik kısıtlama + P1 vaka |
| **İnsan incelemesi** | P1. Bağlam değerlendirilir (ör. iki yakın arkadaşın restoran hesabı paylaşımı ile dolandırıcılık ayrılır) |

### G.7 Platform dışına çekme

| Aşama | Tasarım |
|---|---|
| **Önleme** | Kademeli iletişim zaten platform içinde ses, fotoğraf ve ileride görüşme sağlıyor (dışarı çıkma ihtiyacı azalır). İlk 72 saatte telefon numarası ve kullanıcı adı paylaşımında gönderim öncesi uyarı |
| **Tespit** | Telefon numarası desenleri (yazıyla yazılmış rakamlar dahil: "beş üç iki…"), "WhatsApp", "Telegram", "Insta", "@kullanıcıadı", link kısaltıcılar |
| **Eylem** | Yasaklanmaz (yetişkin özgürlüğü), ama **erken aşamada** alıcıya güvenlik ipucu gösterilir. Aynı numarayı ya da kullanıcı adını çok sayıda kişiye gönderme → `off_platform_mass` sinyali (dolandırıcılık ve spam göstergesi) |
| **İnsan incelemesi** | Yalnızca diğer sinyallerle birleşince (P2) |

### G.8 Spam

| Aşama | Tasarım |
|---|---|
| **Önleme** | Beta kodu; OTP limitleri; davet ve mesaj limitleri; yeni hesap kısıtları (48 saat link/görsel yok) |
| **Tespit** | Kopya veya benzer içerik (n-gram/simhash) farklı konuşmalarda; link oranı; reklam kalıpları; aynı cihazdan çok hesap |
| **Eylem** | Otomatik hız düşürme, mesajların "spam olabilir" olarak gizlenmesi, hesap `restricted` |
| **İnsan incelemesi** | P3; toplu kampanyalarda Security Admin |

### G.9 Sahte profil

| Aşama | Tasarım |
|---|---|
| **Önleme** | Telefon OTP (VoIP filtresi); e-Devlet yaş belirteci; canlılık testi + profil fotoğrafı yüz eşleşmesi; avatar kullanıcıları da doğrulanmış olmak zorunda |
| **Tespit** | Yüz eşleşmesi başarısız fotoğraf denemeleri; aynı yüzün birden fazla hesapta görülmesi (sağlayıcı destekliyorsa); tersine görsel arama (stok/ünlü fotoğrafı — Faz 2); AI üretimi görsel tespiti; profil metni kopyaları; cihaz kümelenmesi; "sahte profil" raporları |
| **Eylem** | Şüpheli hesap Keşfet'ten gizlenir ve yeniden doğrulama istenir. Başarısız olursa `restricted` |
| **İnsan incelemesi** | P2. Moderatör doğrulama sonuçlarını (görüntü değil, sonuç ve skorları) ve profil fotoğraflarını karşılaştırır |

### G.10 Reşit olmayan kullanıcı

| Aşama | Tasarım |
|---|---|
| **Önleme** | e-Devlet yaş belirteci (18+) kayıt şartı (K3); 18+ mağaza derecelendirmesi; pazarlamada 18 yaş altını hedeflememe |
| **Tespit** | Kullanıcı raporları ("reşit olmayan şüphesi"); metinde yaş beyanı ("16 yaşındayım", "lise", "dershane"); selfie sağlayıcısının yaş tahmini (yalnızca sinyal olarak) |
| **Eylem** | Şüphe sinyali → hesap anında **dondurulur** (P0), aktif bağlantıların medya yetenekleri kapanır. Kullanıcıdan yeniden yaş doğrulaması istenir |
| **İnsan incelemesi** | P0. Doğrulanamazsa hesap kapatılır ve ban kaydı oluşur. Bu kişiyle etkileşmiş yetişkin hesaplar ayrıca incelenir |

### G.11 Kendine zarar verme / kriz sinyali

| Aşama | Tasarım |
|---|---|
| **Önleme** | Topluluk odalarında "Burası bir destek topluluğu, profesyonel yardımın yerini tutmaz" bilgisi; güvenlik merkezinde destek hatları; gece moduna yumuşak dürtüler (opsiyonel) |
| **Tespit** | Türkçe kriz sınıflandırıcısı (intihar düşüncesi, kendine zarar, plan/yöntem/zaman ifadesi → **yüksek şiddet**) + anahtar ifade listesi (uzman onaylı) + "Bu kişi için endişeleniyorum" raporu |
| **Eylem** (otomatik, insan beklemeden) | (1) Kişiye özel, yargısız destek ekranı (S49): 112 ve doğrulanmış destek hatları, "Güvendiğin birine yaz". (2) Mesaj **silinmez, engellenmez**. (3) Konuşmanın karşı tarafına (ya da masa/oda üyelerinden raporlayana) "Endişeleniyorsan nasıl destek olabilirsin" rehberi. (4) `safety_events` kaydı + P0 vaka. (5) Yüksek şiddette vaka "acil" etiketiyle nöbetçi moderatöre push/SMS ile bildirilir |
| **İnsan incelemesi** | **P0, hedef 1 saat.** Kriz eğitimli moderatör uzman onaylı protokolü uygular: uygulama içi destek mesajı → ciddi ve somut risk varsa hukuk uzmanının belirlediği çerçevede yetkili mercilerle iletişim. 24–48 saat sonra nazik takip mesajı (opsiyonel). **Uygulama asla terapi yürütmez; AI kişiyle uzun "destek sohbeti" yapmaz.** |

### G.12 Moderasyon kapasite planı (beta)

| Ölçek | Tahmini haftalık vaka | İnsan kapasitesi |
|---|---|---|
| 500 kullanıcı | 30–80 | Deniz + 2 yarı zamanlı moderatör (nöbet: 09:00–01:00) |
| 1.000 kullanıcı | 60–160 | + 1 moderatör; kriz nöbeti 7/24 telefona bildirim |

Nöbet dışı saatlerde: Otomatik eylemler ve kriz ekranı çalışır, P0 vakalar nöbetçinin telefonuna alarm gönderir. Kullanıcıya şu dürüst bilgi verilir: "Ekibimiz her an çevrimiçi olmayabilir. Acil bir durumda lütfen 112'yi ara."

---

## H. Yönetim Paneli

### H.1 Modüller

| # | Modül | İçerik | Ana işlemler |
|---|---|---|---|
| P1 | **Gösterge paneli** | Günlük KPI'lar (N bölümü), açık vakalar (öncelik ve SLA), kriz alarmları, şehir sağlığı | Filtrele, dışa aktar (anonim) |
| P2 | **Moderasyon kuyruğu** | Vaka listesi (öncelik, SLA geri sayımı, kategori, atanan kişi) | Vakayı üstlen, ata, yükselt |
| P3 | **Vaka detayı** | Raporlar, delil anlık görüntüsü (mesaj penceresi, medya), kullanıcının geçmiş vakaları ve yaptırımları, risk sinyalleri, doğrulama durumu | Uyar, içerik gizle/kaldır, özellik kısıtla, askıya al, ban öner/onayla, kapat; karar şablonları |
| P4 | **Kriz vakaları** | Yalnızca `crisis` yetkisi. Kriz olayları, şiddet seviyesi, protokol kontrol listesi | Protokol adımlarını işaretle, takip mesajı gönder, yükselt |
| P5 | **Kullanıcılar** | Arama (rumuz, kullanıcı ID, maskeli telefon son 2 hane), profil özeti, durum, doğrulama, kısıtlamalar, cihazlar (maskeli) | Durum değiştir (role göre), yeniden doğrulama iste, oturumları kapat, not ekle |
| P6 | **İtirazlar** | Kısıtlanan kullanıcıların itirazları | Kabul/ret (kararı veren moderatör dışında biri) |
| P7 | **Odalar** | Oda listesi, kurallar, yavaş mod, açık saatler, oda rehberleri | Oluştur, düzenle, arşivle, mesaj gizle, kullanıcıyı odada sustur |
| P8 | **Masalar** | Aktif ve bekleyen masalar, tema doluluk, bekleyen talepler, eşleştirici sağlığı | Tema yönet, masayı kapat, üyeyi çıkar |
| P9 | **İçerik** | Soru desteleri, sohbet başlatıcılar, oyun içerikleri, sistem mesajları, güvenlik ipuçları | Taslak → onay → yayın |
| P10 | **Beta yönetimi** | Davet kodları (kanal, kota, kullanım), bekleme listesi (şehir bazlı), kullanıcı dağılımı (cinsiyet, yaş bandı, kanal) | Kod üret, iptal et, bekleme listesinden davet et |
| P11 | **Geri bildirim** | Uygulama içi geri bildirimler, anket sonuçları | Etiketle, ürün backlog'una aktar |
| P12 | **KVKK talepleri** | Veri dışa aktarım ve silme talepleri, durumları, süre takibi | Durumu izle, istisna (yasal saklama) notu ekle |
| P13 | **Güvenlik olayları** | Şüpheli giriş, ban kaçışı tespitleri, hız limiti aşımları, admin girişleri | İncele, hesap kısıtla |
| P14 | **Yapılandırma** | `app_config` (davet limiti, uygunluk eşikleri, cooldown süreleri), özellik bayrakları | Değiştir (Super Admin + dört göz + audit) |
| P15 | **Admin kullanıcıları** | Panel kullanıcıları ve roller | Ekle, rol ver, devre dışı bırak (dört göz) |
| P16 | **Denetim kayıtları** | `audit_logs` görüntüleyici, break-glass raporu | Filtrele, dışa aktar (Super Admin) |

### H.2 RBAC tablosu

**Gösterim:**
- ✅ tam
- 👁 görüntüleme
- 🔒 yalnızca break-glass (gerekçe + log + 15 dk)
- ✳️ dört göz (ikinci onay)
- — erişim yok

**Veri erişimi**

| Veri | Super Admin | Security Admin | Moderator | Community Manager | Support Agent |
|---|---|---|---|---|---|
| Kullanıcı temel profil (rumuz, şehir, yaş, durum) | 👁 | 👁 | 👁 (yalnızca vakadaki) | 👁 (yalnızca oda/masa bağlamı) | 👁 |
| Telefon numarası | 🔒 | 🔒 | Maskeli (son 2 hane) | — | Maskeli |
| Doğum tarihi, ilişki/ayrılık bilgisi, çocuk durumu | 🔒 | 🔒 | — | — | — |
| Doğrulama sonucu (görüntü yok) | 👁 | 👁 | 👁 | — | 👁 (durum) |
| Birebir mesajlar | — (vaka dışı **hiç kimse**) | Yalnızca vaka delili | Yalnızca vaka delili | — | — |
| Oda/masa mesajları | Vaka delili | Vaka delili | Vaka delili + oda akışı (moderasyon için) | Oda akışı (yalnızca kendi odaları) | — |
| Rapor ve vaka verisi | 👁 | ✅ | ✅ (atanan ve kuyruk) | — | Durum bilgisi |
| Kriz vakaları (`safety_events`) | 🔒 | ✅ (`crisis` yetkisi) | Yalnızca `crisis` eğitimli moderatör | — | — |
| Risk sinyalleri ve skorları | 👁 | ✅ | 👁 (vakadaki kullanıcı) | — | — |
| Cihaz ve oturum bilgisi | 👁 (maskeli) | 👁 | — | — | — |
| Audit log | ✅ | 👁 (kendi alanı) | — | — | — |
| KVKK talepleri | ✅ | 👁 | — | — | 👁 (durum) |
| Ürün metrikleri (anonim, toplu) | ✅ | ✅ | ✅ | ✅ | ✅ |

**İşlemler**

| İşlem | Super Admin | Security Admin | Moderator | Community Manager | Support Agent |
|---|---|---|---|---|---|
| Uyarı, içerik gizleme/kaldırma | ✅ | ✅ | ✅ | Oda içinde gizleme | — |
| Özellik kısıtlama (≤ 7 gün) | ✅ | ✅ | ✅ | — | — |
| Askıya alma (≤ 30 gün) | ✅ | ✅ | ✳️ (öneri + Security Admin onayı) | — | — |
| Kalıcı ban, cihaz banı | ✳️ | ✳️ | — | — | — |
| Ban kaldırma | ✳️ | ✳️ | — | — | — |
| İtiraz sonuçlandırma | ✅ | ✅ | ✅ (kendi kararı değilse) | — | — |
| Kriz protokolü yürütme | ✅ | ✅ | `crisis` yetkisi ile | — | — |
| Yeniden doğrulama isteme | ✅ | ✅ | ✅ | — | — |
| Oturumları kapatma | ✅ | ✅ | — | — | ✅ (kullanıcı talebiyle) |
| Oda, masa teması, içerik yönetimi | ✅ | — | — | ✅ | — |
| Beta kodları, bekleme listesi | ✅ | — | — | ✅ | 👁 |
| Yapılandırma (`app_config`) | ✳️ | — | — | — | — |
| Admin kullanıcı ve rol yönetimi | ✳️ | — | — | — | — |
| KVKK talebi işleme | ✅ | — | — | — | Talep kaydetme |
| Audit log dışa aktarma | ✳️ | — | — | — | — |

**İlkeler:**
- **Birebir mesajlara serbest erişim hiçbir rolde yok.** Super Admin dahil. Mesajlar yalnızca bir rapor ya da otomatik işaret sonucunda oluşan vaka delili olarak görülür.
- Beta döneminde Deniz, Super Admin olarak bulunur, ama günlük moderasyonu Moderator hesabıyla yapar (en az yetki).
- Her rol değişikliği dört göz ilkesine tabidir. Tek admin varken (erken dönem) rol değişikliği için yazılı not + audit yeterlidir; ikinci admin geldiğinde dört göz zorunlu hale gelir.

### H.3 Panel güvenliği

- Next.js (App Router), Vercel'de; **sunucu tarafında service role yok.**
- Giriş: Supabase Auth (e-posta + parola + TOTP), AAL2 zorunlu.
- Oturum 8 saat; hareketsizlikte 30 dakikada kilit.
- Hassas alanlar varsayılan maskeli; ekran görüntüsü uyarısı ve filigran (moderatör ID'si ekranda soluk yazılır; sızıntı caydırıcılığı).
- Panel ayrı bir alan adında (`admin.…`), arama motorlarına kapalı, Vercel deployment protection açık.

---

## I. Teknik Mimari

### I.1 Bileşen analizi

| Teknoloji | Neden | Risk | Alternatif | Ölçek sorunu ne zaman çıkar |
|---|---|---|---|---|
| **React Native** | Tek kod tabanıyla iOS + Android; büyük ekosistem; Claude'un en verimli olduğu yığınlardan | Yerel modül gerektiren özelliklerde (CallKit, ekran görüntüsü engeli) native kod ihtiyacı | Flutter (iyi, ama TypeScript paylaşımı kaybolur); native Swift/Kotlin (iki kat maliyet) | Ölçek sorunu değil, karmaşıklık sorunu: çok büyük sohbet listelerinde performans → FlashList, sanallaştırma |
| **Expo** (SDK güncel, development build + EAS) | Derleme, imzalama, mağaza gönderimi, OTA güncelleme; yerel modüller config plugin ile | Expo Go yetmez (canlılık SDK'sı, ileride WebRTC). EAS ücretli katmanlar | Çıplak React Native CLI + Fastlane | Ölçek sorunu yok. OTA güncellemeler kritik güvenlik düzeltmeleri için bir avantaj |
| **Supabase** (Pro, AB bölgesi) | Postgres + Auth + Storage + Realtime + Edge Functions tek yerde; RLS ile güvenlik modelini veritabanında kurabilmek | Tedarikçi bağımlılığı (açık kaynak olduğu için azaltılmış); Edge Function soğuk başlangıçları; yurt dışı aktarım (KVKK m.9) | Firebase (NoSQL, RLS modeli yok); kendi Postgres + Node API (daha çok iş); AWS (Cognito + RDS + AppSync; karmaşık) | Eşzamanlı Realtime bağlantıları ve DB bağlantıları (pooler ile yönetilir). ~50 bin MAU'ya kadar Pro + compute yükseltmesi; ~300 bin+ MAU'da mesajlaşmanın ayrılması değerlendirilir |
| **PostgreSQL** | İlişkisel model (bağlantılar, izinler, rızalar) doğal; transaction garantisi; RLS; pgTAP ile test; pgvector | Kötü indeksler ve RLS alt sorguları performansı öldürebilir | — | `messages` tablosu en büyük tablo olur → aylık bölümleme; okuma replikası; arşivleme |
| **Supabase Auth** | Telefon OTP, JWT, MFA, refresh token rotasyonu, Auth hook'ları | SMS maliyeti ve kötüye kullanım (toll fraud); Türk operatörlerine teslim oranları | Firebase Auth (telefon), Twilio Verify + kendi auth | SMS hacmi arttıkça maliyet; yerel SMS sağlayıcısına geçiş (Auth "send SMS hook" ile mümkün) |
| **Supabase Storage** | Özel bucket'lar, imzalı URL, S3 uyumlu | Görsel işleme ve moderasyon için ek worker gerekir | Cloudflare R2 + Images; AWS S3 + CloudFront | Medya trafiği arttıkça CDN ve egress maliyeti → R2/S3'e taşıma (soyutlama katmanı sayesinde kolay) |
| **Supabase Realtime** | Broadcast + Presence; özel kanallarda RLS ile yetkilendirme | Postgres Changes ölçekte pahalı (bu yüzden Broadcast kullanılacak); bağlantı kotası; mesaj teslim garantisi yok (istemci boşluk doldurma gerekir) | Ably, Pusher, Stream Chat, kendi WebSocket sunucusu (Elixir/Go) | Plan kotasına bağlı eşzamanlı bağlantı ve mesaj/sn sınırları. MVP'de sorun yok. Yüz binlerce eşzamanlı kullanıcıda ayrı servis |
| **Edge Functions** (Deno) | Webhook, kriptografi (HMAC), dış API çağrıları, imzalı URL | Soğuk başlangıç, çalışma süresi ve bellek sınırları; ağır görsel işleme için uygun olmayabilir | Ayrı worker servisi (Cloud Run / Fly.io); Vercel Functions | Görsel yeniden kodlama ve toplu işlerde süre sınırı → `media-ingest` gerekirse Faz 2'de ayrı worker'a taşınır |
| **Next.js admin** | React bilgisinin ve tiplerin paylaşımı; sunucu bileşenleri | Panelde yanlışlıkla service role kullanma riski (bu plan yasaklıyor) | Retool (hızlı ama veri üçüncü tarafa gider); Refine | Ölçek sorunu yok (az kullanıcı) |
| **Vercel** | Next.js için en kolay dağıtım, önizleme ortamları, koruma | Fonksiyonlar AB'de çalıştırılmalı (bölge ayarı); maliyet | Netlify, Cloudflare Pages, kendi sunucu | Panel için yok |
| **GitHub** | PR akışı, Actions CI, branch koruma, Dependabot | Gizli anahtar sızıntısı (gitleaks ile önlenir) | GitLab | — |

**Ek bileşenler (MVP'de gerekli):**

| İhtiyaç | Öneri | Not |
|---|---|---|
| SMS | Supabase Auth'un desteklediği bir sağlayıcı ya da Türkiye'de yerel bir SMS sağlayıcısı (Auth hook ile) | Türk operatörlerinde teslim oranı test edilmeli; İYS'nin işlemsel SMS'ler için gerekmediği teyit edilmeli |
| Canlılık doğrulama | AWS Rekognition Face Liveness / FaceTec / Veriff / iDenfy (değerlendirme Sprint 0'da) | KVKK, veri yerleşimi, saklamama sözleşmesi, fiyat |
| e-Devlet yaş belirteci | Resmî entegrasyon (K3) | Teknik erişim ve kapsam hukukla teyit edilmeli |
| Metin moderasyonu | LLM tabanlı sınıflandırıcı (ör. Claude'un küçük ve hızlı modelleri) + deterministik kurallar | Türkçe test veri seti ile seçilir; veri saklamama |
| Görsel moderasyonu | Hive / Sightengine / AWS Rekognition | Türk kullanıcı fotoğraflarında doğruluk testi |
| Konuşmadan metne çeviri | Türkçe destekli bir STT API'si (ör. Whisper sınıfı modeller) | Yalnızca moderasyon; transkript 30 gün |
| CAPTCHA | Cloudflare Turnstile / hCaptcha | OTP öncesi |
| Hata izleme | Sentry (AB) | PII temizleme (scrubbing) zorunlu |
| Ürün analitiği | PostHog (AB bulutu) | Hassas olay ve özellik gönderilmez |
| Push | Expo Notifications | İçerik gizli |

### I.2 Mobil uygulama mimarisi

- Expo Router (dosya tabanlı navigasyon), TypeScript strict modu.
- Sunucu durumu: TanStack Query. Yerel durum: Zustand. Formlar: React Hook Form + Zod (şemalar `packages/shared` içinde, sunucuyla ortak).
- Yerel önbellek: MMKV (ayarlar) + SQLite (sohbet önbelleği, şifreli) + gönderim kuyruğu (çevrimdışı mesaj, `client_msg_id` ile idempotent).
- Güvenli depolama: `expo-secure-store` (oturum belirteçleri, cihaz kimliği).
- Ekran görüntüsü engeli (Android `FLAG_SECURE`) ve iOS ekran görüntüsü olayı: yerel modül / config plugin.
- Erişilebilirlik: Dinamik yazı boyutu, ekran okuyucu etiketleri, minimum dokunma alanı 44 pt.
- Tasarım sistemi: `packages/ui` içinde tema belirteçleri (design tokens); açık ve koyu tema.

### I.3 Realtime mesajlaşma (MVP)

1. İstemci `api.send_message` çağırır (idempotent).
2. Fonksiyon yazar ve `realtime.send()` ile konuşmanın özel kanalına (`conv:{id}`) olay yayınlar.
3. İstemci kanal aboneliğini, Realtime yetkilendirme politikasıyla (yalnızca üyeler) yapar.
4. Uygulama ön plana gelince ya da yeniden bağlanınca, son bilinen mesajdan sonrası `api.get_messages` ile çekilir (boşluk doldurma).
5. Uygulama arka plandayken push gönderilir (sıklık sınırlı).

**Soyutlama:** Mobilde `ChatTransport` arayüzü (`send`, `subscribe`, `fetchSince`). Mesajlaşma ileride başka bir servise taşınırsa yalnızca bu katman değişir.

### I.4 Sesli/görüntülü görüşme için hazırlık (kod yok)

- `capability` enum ve kataloğunda `voice_call` ve `video_call` var (`mvp_enabled = false`).
- `calls` tabloları E.4'teki tasarıma göre Faz 2'de eklenir.
- Planlanan sağlayıcı LiveKit (SFU, IP gizliliği, E2EE desteği). Token üretimi `request-call-token` Edge Function'ı ile, `match_permissions` kontrolü sonrasında yapılır.
- Mobil uygulamada `CallKit/ConnectionService` için yer ayrılır (development build zaten kullanılıyor).

---

## J. Repository Yapısı

**Öneri:** Tek monorepo, pnpm workspaces + Turborepo.

```
project-a/
├── apps/
│   ├── mobile/                     # Expo (React Native) uygulaması
│   │   ├── app/                    # Expo Router ekranları (S01–S62)
│   │   │   ├── (auth)/             # Kayıt, OTP, yaş, rızalar
│   │   │   ├── (onboarding)/       # Profil kurulumu, avatar, doğrulama
│   │   │   ├── (tabs)/             # Topluluk, Keşfet, Sohbetler, Ben
│   │   │   └── (modals)/           # Rapor, engelle, izin teklifi, kriz ekranı
│   │   ├── src/
│   │   │   ├── features/           # Modül bazlı: invitations/, chat/, permissions/, rooms/, masa/, safety/ …
│   │   │   ├── lib/                # supabase istemcisi, ChatTransport, secure storage
│   │   │   └── native/             # Config plugin'ler (ekran görüntüsü, ileride CallKit)
│   │   ├── app.config.ts           # Ortama göre (dev/staging/prod) uygulama kimlikleri
│   │   └── eas.json
│   └── admin/                      # Next.js yönetim paneli
│       ├── app/                    # Rotalar (P1–P16)
│       └── src/
├── packages/
│   ├── shared/                     # Zod şemaları, sabitler, hata kodları, iş kuralı yardımcıları (istemci tarafı ön kontrol için)
│   ├── db-types/                   # Supabase'den üretilen TypeScript tipleri (otomatik)
│   ├── ui/                         # Tasarım belirteçleri ve ortak bileşenler (mobil öncelikli)
│   ├── moderation-rules/           # Deterministik kurallar (IBAN, kart, telefon, kripto desenleri) + test veri seti
│   └── config/                     # ESLint, TSConfig, Prettier ortak ayarları
├── supabase/
│   ├── config.toml                 # Yerel geliştirme yapılandırması
│   ├── migrations/                 # Sıralı SQL migration'ları (tek doğruluk kaynağı)
│   ├── functions/                  # Edge Functions (Deno)
│   │   ├── _shared/                # Ortak: auth doğrulama, rate limit, log maskeleme, HMAC
│   │   ├── request-media-upload/
│   │   ├── media-ingest/
│   │   └── …
│   ├── tests/                      # pgTAP testleri: rls/, rpc/, triggers/, abuse/
│   └── seed/                       # Yalnızca SENTETİK veri (gerçek kişi yok)
├── tests/
│   ├── e2e-mobile/                 # Maestro akışları
│   ├── e2e-admin/                  # Playwright
│   ├── api/                        # RPC ve Edge Function entegrasyon testleri (Vitest)
│   └── load/                       # k6 senaryoları
├── docs/
│   ├── product/                    # Ürün kararları, bu plan, isim araştırması
│   ├── adr/                        # Mimari karar kayıtları (ADR-001 …)
│   ├── security/                   # Tehdit modeli, RLS matrisi, olay müdahale planı
│   ├── moderation/                 # Politikalar, karar şablonları, kriz protokolü (uzman onaylı)
│   ├── legal/                      # Hukuk uzmanı çıktılarının referansları (metinlerin kendisi değil)
│   └── runbooks/                   # Deploy, rollback, yedekten dönüş, anahtar rotasyonu
├── .github/
│   ├── workflows/                  # ci.yml, db-tests.yml, deploy-*.yml
│   ├── CODEOWNERS
│   └── pull_request_template.md
├── CLAUDE.md                       # Claude Code için proje kuralları (bu planın güvenlik ilkeleri dahil)
├── AGENTS.md                       # Codex inceleyici talimatları
├── package.json, pnpm-workspace.yaml, turbo.json
└── README.md
```

**Neden bu yapı:**
- **Tek doğruluk kaynağı:** Veritabanı şeması → `db-types` → mobil ve panel. Tip uyuşmazlığı derleme anında yakalanır.
- `supabase/tests` en önemli test klasörüdür; güvenlik kuralları burada kanıtlanır.
- `CLAUDE.md` ve `AGENTS.md`: İki AI'ın aynı kurallarla çalışmasını sağlar (K6).

---

## K. Ortam Yapısı

### K.1 Ortamlar

| Ortam | Nerede | Veri | Kim erişir | Mobil uygulama | Amaç |
|---|---|---|---|---|---|
| **local** | Geliştiricinin makinesi (Supabase CLI + Docker), Claude Code oturumu | Sentetik seed | Deniz, Claude Code | Expo development build → yerel API | Geliştirme ve tüm testler |
| **development** | Supabase projesi `project-a-dev` (AB), Vercel preview | Sentetik seed (otomatik yenilenir) | Deniz, CI, Claude Code (dev anahtarlarıyla) | `com.projecta.dev` (EAS channel `development`) | Entegrasyon, dış servislerin **test/sandbox** anahtarları |
| **staging** | Supabase projesi `project-a-staging` (AB), Vercel staging | Sentetik + test kullanıcıları (ekip, gönüllü test grubu, sahte kişiler) | Deniz, test kullanıcıları | `com.projecta.staging` (TestFlight / Play Internal Testing) | Üretimle birebir yapılandırma; sürüm öncesi kabul ve penetrasyon testi |
| **production** | Supabase projesi `project-a-prod` (AB), Vercel prod | **Gerçek kullanıcı verisi** | Yalnızca Deniz (+ ileride yetkili admin); CI yalnızca migration rolüyle | `com.projecta` | Beta ve canlı |

### K.2 Temel kurallar

1. **Üretim verisi hiçbir zaman** local, development ya da staging'e kopyalanmaz. Üretim dökümü alınmaz (yedekler yalnızca Supabase'in kendi PITR/backup sistemindedir).
2. Hata ayıklama için üretim verisi gerekiyorsa: Yalnızca Deniz, yalnızca panel üzerinden ve audit'li biçimde bakar. **AI araçlarına aktarmaz** (K4).
3. Her ortamın anahtarları ayrıdır. Üretim anahtarları yalnızca GitHub Actions'ın `production` environment'ında (onay gerektiren) ve Supabase/Vercel/EAS panellerinde bulunur.
4. Dış servisler: Development ve staging'de **sandbox/test modları** kullanılır (canlılık sağlayıcısının test modu, SMS test numaraları).
5. Staging ve production yapılandırması aynıdır (aynı migration'lar, aynı Edge Function sürümleri, aynı RLS).

### K.3 Migration süreci

```
1. Claude Code yerelde migration yazar:  supabase migration new <ad>
2. Yerelde uygulanır:                     supabase db reset (tüm migration'lar + seed)
3. pgTAP testleri yerelde çalışır:        supabase test db
4. Tipler üretilir:                       supabase gen types → packages/db-types
5. PR açılır → CI:
     - temiz bir Supabase örneğinde tüm migration'lar sıfırdan uygulanır
     - pgTAP (RLS + RPC + trigger + abuse) testleri
     - tip üretimi farkı kontrolü (commit edilmemiş tip değişikliği = hata)
     - lint (squawk ile tehlikeli migration tespiti: tablo kilidi, NOT NULL ekleme vb.)
6. Codex PR incelemesi + Deniz onayı → main'e birleştirme
7. main → otomatik development'a uygulanır
8. Sürüm etiketi (v0.x.y) → staging'e uygulanır → kabul testleri
9. Production: GitHub "production" environment onayı (Deniz) → migration uygulanır → duman testi (smoke test)
```

**Kurallar:**
- **Yalnızca ileri (forward-only) migration.** Geri alma, yeni bir düzeltme migration'ı ile yapılır.
- Yıkıcı değişiklikler (kolon silme, tür değiştirme) **iki aşamalı** yapılır: genişlet → veri taşı → (bir sonraki sürümde) daralt.
- Üretimde migration öncesi Supabase yedeği (PITR noktası) not edilir.
- Migration'lar elle (dashboard'dan) **asla** yapılmaz. Dashboard'dan yapılan değişiklik "sürüklenme (drift)" sayılır ve CI'daki `supabase db diff` kontrolüyle yakalanır.

### K.4 Mobil sürüm akışı

| Değişiklik türü | Yol |
|---|---|
| JS/TS değişikliği (yerel modül değişmedi) | EAS Update (OTA), kanal: `staging` → test → `production`. Kritik güvenlik düzeltmeleri için hızlı yol |
| Yerel modül, izin ya da SDK değişikliği | EAS Build → TestFlight / Internal Testing → mağaza incelemesi |
| Zorunlu güncelleme | `app_config.min_supported_version` → S61 ekranı |

---

## L. Sprint Planı

### L.1 Varsayımlar (takvimi buna göre okuyun)

- **Sprint süresi:** 2 hafta.
- **Deniz:** Haftada ortalama 20–30 saat. Ürün kararları, PR incelemesi ve onayı, cihazda test, hesap/servis/sözleşme işleri, uzmanlarla koordinasyon.
- **Claude Code:** Kodun büyük kısmı. Ama her sprint, Deniz'in inceleme ve test kapasitesiyle sınırlıdır. Gerçek darboğaz kod yazmak değil; **karar, test ve doğrulama.**
- **Codex:** Her PR için ikinci inceleme; sprint sonunda güvenlik gözden geçirmesi.
- **Dış bağımlılıklar** (hukuk görüşü, canlılık sağlayıcısı sözleşmesi, e-Devlet entegrasyonu, Apple/Google geliştirici hesapları, şirket kuruluşu) takvimi sprint içi işlerden daha çok etkileyebilir. Bunlar ayrıca izlenir.
- Her sprint sonunda **çalışan, test edilmiş, staging'e dağıtılmış** bir artış hedeflenir.
- **Tampon:** S16 kısmen tampondur. Ayrıca L.3'te dış bağımlılıklar için +1–2 ay risk payı ayrıldı.

### L.2 Sprintler

| Sprint | Amaç | Yapılacak işler | Tamamlanma kriteri | Testler | Bağımlılık |
|---|---|---|---|---|---|
| **S0** (2 hf) | **Temel ve kararlar** | Monorepo iskeleti; CI (lint, tip, pgTAP, gitleaks); yerel Supabase; `CLAUDE.md` / `AGENTS.md`; ADR-001…005 (yığın, şema düzeni, yetenek modeli, mesaj şifreleme, HMAC); tehdit modeli v1; RLS matrisi taslağı; tasarım belirteçleri; dış servis kısa listeleri (SMS, canlılık, görsel moderasyon) | `pnpm i && supabase start && pnpm test` temiz makinede çalışır; CI yeşil; ADR'ler Deniz onaylı | CI'ın kendisi; boş pgTAP iskeleti | Plan v1 onayı; GitHub reposu |
| **S1** | **Güven çekirdeği: veritabanı** | `profiles`, `profile_private`, `matches`, `capability_catalog`, `match_permissions`, `permission_*`, `conversations`, `messages`, `message_media`, `blocks` tabloları; tüm RLS; trigger'lar (`enforce_message_rules`, `enforce_media_capability`, append-only); `propose/respond/revoke_permission`, `send_message`, `block_user` RPC'leri; sentetik seed | **Rıza motoru ve mesaj yetkileri yalnızca veritabanı seviyesinde, arayüz olmadan kanıtlanmış** | pgTAP: ≥ 120 test (RLS her tablo, kör onay, zamanlama sızıntısı, cooldown, trigger'ın service role'de de engellemesi, engel sonrası her şeyin kapanması) | S0 |
| **S2** | **Kayıt ve oturum** | Supabase Auth telefon OTP (dev: test numaraları); `otp-guard` (CAPTCHA, limit, +90); beta kodu; rızalar (`legal_consents`); S01–S06, S08; oturum ve cihaz kaydı | Gerçek cihazda kayıt → giriş → çıkış; limitler çalışıyor | Auth entegrasyon testleri; kaba kuvvet testleri; Maestro kayıt akışı | SMS sağlayıcısı (dev/test hesabı) |
| **S3** | **Yaş doğrulama + profil** | `age-verify` (K3 sonucuna göre gerçek entegrasyon ya da arayüzü hazır, sağlayıcıya takılabilir "adaptör"); S07/S07b; profil adımları S09–S13; alan görünürlüğü; şehir ve bekleme listesi | Profil oluşturulur; gizli alanlar başka kullanıcıya hiçbir API'de dönmez | RLS görünürlük testleri; Zod şema testleri; Maestro onboarding | **Hukuk görüşü (yaş doğrulama)** — gelmezse adaptör + geçici yöntem, beta öncesi zorunlu |
| **S4** | **Avatar, fotoğraf, doğrulama** | Avatar oluşturucu (S14–S15); `quarantine` → `media-ingest` (yeniden kodlama, EXIF silme, görsel moderasyon); S16; canlılık entegrasyonu (S17–S19) + webhook; `is_verified` trigger'ı | Avatar ile profil; fotoğraf moderasyondan geçmeden görünmüyor; doğrulama webhook'u imza kontrollü | Storage politika testleri; EXIF testi (GPS'li örnek dosya); webhook sahteleme testi | Canlılık sağlayıcısı sözleşmesi + sandbox; görsel moderasyon API'si |
| **S5** | **Gizlilik + Keşfet** | Gizlilik ayarları (S42), engellenenler (S43), numara ile engelleme (S44) + `contact-hide`; rehber gizleme; `discover_feed` (kurallar + gerekçeler); S23–S24; profil görüntüleme limiti; mesaj şifreleme yük testi (E.5 karar kapısı) | Keşfet sert filtreleri doğru; gizlenen kişi hiçbir yerde görünmüyor | Karşılıklı görünmezlik testleri; numara varlığı sızıntısı testi (yanıt ve zamanlama); k6 ile mesaj şifreleme benchmark'ı | S1, S3 |
| **S6** | **Davet ve bağlantı** | `send/respond/cancel_invitation`, kör ret view'ı, kotalar; S25, S27; bağlantı oluşumu + sohbet açılışı; bildirim altyapısı (push token, `push-dispatch`, gizli içerik) | Uçtan uca: Keşfet → davet → kabul → boş sohbet | Kör ret testi (gönderen hiçbir zaman `passed` göremez); limitler; push içeriği testi | S5 |
| **S7** | **Birebir sohbet (Seviye 1)** | S26, S28; Realtime Broadcast; `ChatTransport`; çevrimdışı kuyruk; yanıtla, tepki, silme; soru kartları ("ikisi de cevaplayınca"); hızlı içerik uyarıları (IBAN, telefon, link) | İki cihaz arasında gerçek zamanlı sohbet; yeniden bağlanmada mesaj kaybı yok | Realtime yetkilendirme testi (üye olmayan kanala abone olamaz); idempotency; `moderation-rules` birim testleri (IBAN MOD-97, Luhn) | S6 |
| **S8** | **İzin motoru arayüzü + sesli mesaj** | S29, S29b, S29c; sistem teklif kartları; uygunluk hesaplayıcı; ses kaydı (S29e); `request-media-upload` (ses); STT + moderasyon; S47 (bağlantıyı bitir) | J6 ve J8 uçtan uca çalışıyor; izin kapanınca ses oynatılamıyor | Abuse testleri: izinsiz ses yükleme (doğrudan API, sahte istemci); tur zamanlama sızıntısı; cooldown | S7; STT sağlayıcısı |
| **S9** | **Fotoğraf paylaşımı (Seviye 2)** | Fotoğraf akışı (J7); bulanık önizleme; tek görüntülemelik; ekran görüntüsü engeli/bildirimi; `photo_access` (gerçek profil fotoğrafı); geri kapatmada medya gizleme | J7 ve J8 uçtan uca; izin yokken `message_media` yazılamıyor (service role dahil) | Storage erişim testleri (süresi geçmiş URL, başka konuşmanın yolu); trigger testleri; görsel moderasyon yanlış pozitif ve negatif seti | S8 |
| **S10** | **Odalar** | `rooms`, üyelik, oda sohbeti (S30–S32); yavaş mod; yeni hesap kısıtları; odadan profile ve davete geçiş; oda rehberi rolü | 10 oda yayında, mesajlaşma ve moderasyon çalışıyor | Odada medya reddi; engel filtreleri; yavaş mod; yük testi (oda başına 200 eşzamanlı) | S7 |
| **S11** | **Masalar** | Temalar; `masa_requests`; `masa-matcher` (denge, engel/gizleme, 2 aktif masa sınırı); masa sohbeti (S33–S37); günlük soru kartı; kapanış: kör onaylı birebir devam + devam oyu | Simülasyonda 60 sentetik kullanıcıdan doğru masalar kuruluyor; kapanış akışı bağlantı üretiyor | Eşleştirici birim testleri (özellik tabanlı testler); kapasite sınırları; karşılıklı olmayan seçimin sızmaması | S10 |
| **S12** | **Güvenlik merkezi + moderasyon hattı** | Rapor (S45, J10) + delil anlık görüntüsü; `moderation-worker` (metin ve kriz sınıflandırma); risk sinyalleri ve skorları; otomatik eylemler; kriz ekranı (S49) ve akışı; kısıtlı hesap (S59) ve itiraz | Her G kategorisi için en az bir uçtan uca senaryo çalışıyor | Moderasyon değerlendirme seti (Türkçe, ≥ 500 etiketli örnek); kriz akışı testleri; delilin silmeye dayanıklılığı | Metin moderasyonu sağlayıcısı; **ruh sağlığı uzmanının kriz metni (taslak)** |
| **S13** | **Yönetim paneli** | P1–P16 (önce P2/P3/P4/P5/P7/P8/P10/P14/P16); admin MFA; RBAC fonksiyonları; break-glass; dört göz; audit görüntüleyici | Moderatör bir vakayı uçtan uca kapatabiliyor; her işlem audit'te | RBAC matris testleri (her rol × her işlem); MFA olmadan erişim reddi; audit zincir bütünlüğü testi | S12 |
| **S14** | **Hesap yönetimi, KVKK, tamamlama** | Mola (J13), silme (J14) + zamanlanmış işler, veri dışa aktarım, oturumlar (S52), geri bildirim (S58), bildirim tercihleri; saklama süresi temizlik işleri; analitik olay planı; erişilebilirlik geçişi | J13 ve J14 uçtan uca; dışa aktarım paketi doğru ve eksiksiz | Silme sonrası veri kalıntısı testi (tüm tablolar ve storage); dışa aktarımda başkalarının gizli verisinin olmaması | Hukuk: saklama süreleri |
| **S15** | **Sertleştirme + bağımsız güvenlik testi** | Penetrasyon testi (dış uzman) + bulguların düzeltilmesi; yük testi; Sentry ve PostHog PII temizliği; mağaza materyalleri; gizlilik etiketleri; demo hesaplar; olay müdahale runbook'u | Kritik ve yüksek bulgu sıfır; mağaza incelemesine gönderilebilir build | Pentest; k6 yük testi (1.000 eşzamanlı kullanıcı senaryosu); tam E2E regresyon | Güvenlik uzmanı; hukuk metinlerinin nihai hali |
| **S16** | **Beta hazırlığı (tampon dahil)** | Mağaza incelemeleri; moderatör eğitimi ve nöbet çizelgesi; içerik (oda kuralları, soru desteleri); davet kodları; geri bildirim kanalları; sürüm notları | **Beta Çıkış Kontrol Listesi** (O.11) tamamen işaretli | Staging'de "beta provası" (20 test kullanıcısıyla 1 hafta) | Mağaza onayları; moderatörler |

### L.3 Tahmini takvim

| Dönem | Süre | Kümülatif |
|---|---|---|
| Ön hazırlık (P bölümü; kodlama öncesi) | 3–5 hafta (kodlamayla kısmen paralel) | — |
| S0–S16 (17 sprint × 2 hafta) | 34 hafta | ~8 ay |
| Dış bağımlılık gecikmesi riski | +1–2 ay | **Kapalı beta: 8–10 ay sonra** |

**Neden bu kadar?** Ürünün "basit" ekranlarının altında rıza motoru, moderasyon, KVKK ve güvenlik testleri var. Bunlar AI ile hızlı yazılır, ama **doğrulanması** insan zamanı ister. Daha kısa bir takvim, güvenlik testlerini ya da moderasyon hazırlığını kısmak anlamına gelir ve bu ürünün kitlesi için kabul edilemez bir risktir.

**Hızlandırma seçenekleri** (Deniz'in kararı):
1. M20'nin oyun kısmı ve M21 kapsam dışı bırakılırsa: −1 sprint.
2. Yarı zamanlı bir QA/test kişisi (S7'den itibaren): −1–2 sprint (Deniz'in test yükü azalır).
3. Panel modüllerinden P11, P13 ve P16'nın betadan sonraya bırakılması: −0,5 sprint (güvenlik açısından riskli; önerilmez).

---

## M. Test Stratejisi

### M.1 Test piramidi ve araçlar

| Katman | Araç | Kapsam | Ne zaman çalışır |
|---|---|---|---|
| **Birim** | Vitest (TS), Deno test (Edge Functions) | `packages/shared`, `moderation-rules`, eşleştirici algoritması, yardımcılar | Her commit (CI) |
| **Veritabanı** | pgTAP (`supabase test db`) | Şema, kısıtlar, trigger'lar, RPC iş kuralları | Her PR |
| **RLS** | pgTAP + rol değiştirme (`set local role authenticated; set request.jwt.claims …`) | **Her tablo × her rol × her işlem** (RLS matrisi) | Her PR; matris dışı tablo = CI hatası |
| **Kimlik doğrulama** | Vitest + yerel Supabase Auth | OTP akışı, limitler, kilit, oturum iptali, token rotasyonu, AAL2 kontrolü | Her PR |
| **Storage** | Vitest + yerel Supabase Storage | Bucket politikaları, imzalı URL ömrü, yol tahmini, tür doğrulama, EXIF temizliği | Her PR |
| **Entegrasyon (API)** | Vitest (gerçek yerel Supabase'e karşı) | RPC zincirleri, Edge Function'lar, webhook imzaları | Her PR |
| **E2E mobil** | Maestro (iOS simülatörü ve Android emülatörü) | J1–J14 yolculukları | `main`'e her birleştirmede + gece |
| **E2E panel** | Playwright | Moderasyon vakası, RBAC, break-glass | `main`'e her birleştirmede |
| **Mobil cihaz testi** | Gerçek cihazlar (Deniz + test grubu): en az 1 eski Android (Android 10 sınıfı), 1 yeni Android, 1 eski iPhone, 1 yeni iPhone | Performans, kamera ve mikrofon, ekran görüntüsü engeli, push, çevrimdışı | Her sprint sonu |
| **Güvenlik** | Semgrep + gitleaks + `pnpm audit` / Dependabot + Supabase güvenlik danışmanı (advisors) + OWASP MASVS kontrol listesi; bağımsız pentest | Statik analiz, bağımlılıklar, gizli anahtar, yapılandırma | Her PR + sprint sonu + S15 |
| **Moderasyon** | Etiketli Türkçe değerlendirme seti (sentetik + uzman tarafından yazılmış), hassasiyet ve duyarlılık (precision/recall) raporu | Sınıflandırıcı ve kurallar | Model ya da eşik değişikliğinde + sprint sonu |
| **Yük** | k6 | Mesaj gönderimi, Realtime yayın, Keşfet, masa eşleştirici, şifreli mesaj okuma | S5 (benchmark), S10, S15 |
| **Erişilebilirlik** | Ekran okuyucu manuel test + otomatik kontroller | Ana akışlar | S14 |

**Kapsam hedefleri:**
- `packages/shared` ve `moderation-rules` için %90 satır kapsamı.
- RLS matrisi %100 (her hücre testli).
- Her RPC için en az bir "mutlu yol" ve her reddetme nedeni için bir test.

### M.2 RLS test matrisi (örnek)

| Tablo | anon | Kendi satırı | Bağlantılı kullanıcı | Engellenmiş kullanıcı | Yabancı kullanıcı | Admin (rol) |
|---|---|---|---|---|---|---|
| `profiles` (doğrudan) | ✗ | R / U (izinli kolonlar) | ✗ (yalnızca `profile_card`) | ✗ | ✗ | Fonksiyon üzerinden |
| `profile_private` | ✗ | R | ✗ | ✗ | ✗ | 🔒 |
| `permission_votes` | ✗ | R (kendi oyu) | **✗ (kör onay)** | ✗ | ✗ | ✗ |
| `messages` | ✗ | R (üyeyse) | R | ✗ | ✗ | Yalnızca delil |
| `message_media` | ✗ | R (izin + onay) | R (izin + onay) | ✗ | ✗ | Yalnızca delil |
| `blocks` | ✗ | R (engelleyen) | ✗ | **✗ (engellenen göremez)** | ✗ | Fonksiyon |
| `reports` | ✗ | R (durum) | ✗ | ✗ | ✗ | Role göre |

Her ✗ hücresi için en az bir "okuyamaz" ve bir "yazamaz" testi bulunur.

### M.3 Abuse-case (kötüye kullanım) testleri

İnsan ilişkileri ve güvenlik ürünü olduğu için aşağıdaki senaryolar **zorunlu** test setidir. Her biri otomatik testtir; Maestro, pgTAP ya da API seviyesinde yazılır.

| # | Senaryo | Beklenen |
|---|---|---|
| AB-01 | Kullanıcı A, B ile fotoğraf izni yokken doğrudan `message_media` INSERT dener (PostgREST) | RLS reddi |
| AB-02 | Edge Function hatalı biçimde (service role) izin yokken `message_media` yazar | Trigger reddi |
| AB-03 | A, imzalı yükleme URL'sini alıp izin kapandıktan sonra kullanır | `media-ingest` yetkiyi yeniden kontrol eder, dosya silinir, satır yazılmaz |
| AB-04 | A, B'nin oyunu okumak için `permission_votes` sorgular | Boş sonuç |
| AB-05 | A, "Şimdilik değil" kararını öğrenmek için teklifin ne zaman kapandığını ve cooldown sürelerini izler | Kapanış her zaman `closes_at` zamanında; zamanlama farkı yok |
| AB-06 | A, gönderdiği davetin `passed` olduğunu öğrenmeye çalışır (view, RPC hata mesajları, yeniden davet denemesi) | Davet `expired` olana kadar `pending` görünür; yeniden davet hatası "bekleyen davet var" der, ret ima edilmez |
| AB-07 | Engellenen kişi, engelleyeni Keşfet'te, odada, masa listesinde ya da eski sohbette arar | Hiçbir yerde görünmez; eski sohbet salt okunur ve profil "bulunamadı" |
| AB-08 | Eski partner numarasıyla gizlenmiş kişi, numaranın sistemde olup olmadığını öğrenmek için yanıt sürelerini ölçer | Yanıt içeriği ve süresi aynı (sabit zamanlı akış) |
| AB-09 | Engellenen kişi yeni numarayla ve aynı cihazla yeniden kayıt olur | `device_hmac` eşleşmesi → engel otomatik uygulanır + risk sinyali |
| AB-10 | Banlı kişi yeni cihaz ve yeni numarayla döner, aynı yüzle doğrulanır | Yüz eşleşmesi destekleniyorsa engellenir; değilse moderasyon vakası |
| AB-11 | Bir kullanıcı 1 saatte 50 farklı kişiye aynı mesajı atmaya çalışır | Hız limiti + kopya tespiti + `restricted` |
| AB-12 | Davet notuna IBAN, kart numarası, kripto adresi ya da "beş üç iki…" yazıyla telefon yazılır | Sunucu reddeder (IBAN/kart/kripto); telefonda uyarı |
| AB-13 | Doğrulanmamış kullanıcı API'yi doğrudan çağırarak davet gönderir | Reddedilir |
| AB-14 | Kullanıcı `profiles.is_verified = true` güncellemesi dener | Kolon yetkisi reddi |
| AB-15 | Kullanıcı başka bir konuşmanın Realtime kanalına abone olmaya çalışır | Realtime yetkilendirme reddi |
| AB-16 | Kullanıcı başka bir konuşmanın medya yolunu tahmin ederek imzalı URL ister | Reddedilir |
| AB-17 | Süresi dolmuş imzalı URL ile erişim | 403 |
| AB-18 | Tek görüntülemelik fotoğraf ikinci kez açılmaya çalışılır | URL üretilmez |
| AB-19 | GPS bilgisi içeren fotoğraf yüklenir | Teslim edilen dosyada meta veri yok |
| AB-20 | Masa eşleştiricisi, birbirini engellemiş iki kişiyi aynı masaya koymaya zorlanır (sentetik veri) | Atama reddedilir |
| AB-21 | Masa kapanışında karşılıklı olmayan seçimin varlığı başka bir yoldan öğrenilmeye çalışılır | Hiçbir yanıtta sızmaz |
| AB-22 | Moderatör, vakası olmayan bir kullanıcının birebir mesajlarını okumaya çalışır | Reddedilir + audit kaydı |
| AB-23 | Admin MFA olmadan (AAL1) admin fonksiyonu çağırır | Reddedilir |
| AB-24 | Audit log satırı silinmeye ya da değiştirilmeye çalışılır (service role dahil) | Trigger reddi; hash zinciri bütün |
| AB-25 | Kriz ifadesi içeren mesaj gönderilir | Mesaj iletilir + destek ekranı + P0 vaka + nöbetçi alarmı |
| AB-26 | Rapor sistemi kötüye kullanılır (bir kişiyi 20 farklı sahte hesapla raporlama) | Rapor ağırlığı raporlayanın güven skoruna göre; yeni hesap raporlarının ağırlığı düşük; toplu rapor tespiti |
| AB-27 | Kullanıcı 18 yaş altı doğum tarihi beyan eder ya da sohbette "16 yaşındayım" der | Kayıt reddi / hesap dondurma + P0 |
| AB-28 | Hesap silindikten 30 gün sonra kişisel veri kalıntısı aranır (tüm tablolar ve storage) | Yalnızca hukuken izinli anonim kayıtlar kalır |
| AB-29 | SMS kaçakçılığı: Yabancı ülke kodlu numaralara toplu OTP isteği | +90 dışı reddedilir; CAPTCHA |
| AB-30 | Kullanıcı izni kapattıktan sonra karşı taraf 14 gün içinde yeniden teklif eder | Reddedilir ("Henüz mümkün değil") |

### M.4 Sürüm kalite kapısı

`main` → staging → production geçişi için şunların hepsi yeşil olmalı: tüm otomatik testler, açık kritik veya yüksek güvenlik bulgusu yok, RLS matrisi eksiksiz, Deniz'in kabul testi.

---

## N. MVP Başarı Metrikleri

### N.1 North Star Metric

> **Haftalık Anlamlı Bağ Kuran Kullanıcı (HABK):** Bir hafta içinde en az bir *anlamlı sohbet* yaşayan aktif kullanıcı sayısı.
>
> **Anlamlı sohbet:** İki taraflı (birebir ya da masa içinde iki kişi arasında karşılıklı), en az 3 farklı günde, her iki tarafın da en az 10 mesaj yazdığı konuşma.

**Neden bu?** MVP hipotezini doğrudan ölçüyor: "Güvenli, kademeli ortamda anlamlı sohbetler kuruluyor mu ve insanlar geri geliyor mu?" Eşleşme sayısı ya da uygulamada geçen süre gibi bağımlılığı ödüllendiren metrikler bilinçli olarak seçilmedi.

**Pilot hedefi:** Aktif kullanıcıların ≥ %35'i HABK olsun (beta 8. hafta).

### N.2 Huni ve ürün KPI'ları

| Alan | KPI | Tanım | Pilot hedefi (hipotez) |
|---|---|---|---|
| Kayıt | Onboarding tamamlama | Kodu kullananlardan profil tamamlayan oranı | ≥ %75 |
| Kayıt | Yaş doğrulama tamamlama | Yaş adımına gelenlerden geçen oranı | ≥ %90 |
| Doğrulama | Selfie doğrulama tamamlama | Profil tamamlayanlardan doğrulanan oranı (7 gün içinde) | ≥ %70 |
| Doğrulama | Avatar kullanım oranı | Doğrulanmışlar içinde Keşfet'te avatar kullanan | (izlenir; hedef yok) |
| İlk değer | İlk 24 saatte topluluk etkileşimi | Odada ya da masada ≥ 1 mesaj | ≥ %60 |
| İlk değer | İlk 24 saatte sohbet oranı | 24 saatte ≥ 1 birebir ya da masa sohbetinde karşılıklı mesaj | ≥ %40 |
| Davet | Davet kabul oranı | Kabul / gönderilen (cinsiyet kırılımlı) | %25–%50 (bunun dışı sinyal: çok düşük = kalite sorunu, çok yüksek = spam/sahte olabilir) |
| Davet | İlk mesaja geçiş | Kabulden sonra 24 saatte ilk mesaj | ≥ %80 |
| Sohbet | Sohbet derinliği | Bağlantıların 7 gün içinde anlamlı sohbete dönüşme oranı | ≥ %30 |
| İzinler | Sesli mesaj dönüşümü | Uygun olan bağlantılarda Seviye 1.5'in açılma oranı | (izlenir) |
| İzinler | Fotoğraf dönüşümü | Uygun olan bağlantılarda Seviye 2'nin açılma oranı | (izlenir) |
| İzinler | İzin geri kapatma oranı | Açılan yeteneklerin 14 günde kapatılma oranı | < %10 (yüksekse: güvenlik sinyali) |
| Masa | Masa doluluk | Talep edilen masaların 48 saatte ≥ 5 kişiyle açılması | ≥ %80 |
| Masa | Masa tamamlama | 7 günü ≥ 4 aktif üyeyle tamamlayan | ≥ %60 |
| Masa | Masadan bağlantı | Kapanışta en az bir karşılıklı devam seçimi olan masa oranı | ≥ %40 |
| Tutunma | D1 / D7 / D30 | Kayıttan sonra aktif olma | ≥ %50 / ≥ %35 / ≥ %20 |
| Tutunma | Haftalık aktif / aylık aktif oranı (WAU/MAU) | Alışkanlık göstergesi | ≥ %50 |
| Denge | Cinsiyet dengesi | Aktif kullanıcıda azınlık cinsiyetin payı | ≥ %40 |
| Denge | Gelen davet yükü | Gelen davet kotasını dolduranların oranı | ≤ %5 |
| Güven | Güven skoru | "Kendimi güvende hissediyorum" (4–5/5) | ≥ %80 |
| Güven | Kalite skoru | "Burada anlamlı sohbetler yaşadım" (4–5/5) | ≥ %60 |

### N.3 Güvenlik KPI'ları (karşı metrikler)

| KPI | Tanım | Eşik |
|---|---|---|
| Rapor / 1.000 mesaj | Rapor yoğunluğu | Betada belirlenir; artış trendi = alarm |
| Engelleme oranı | Bağlantıların 7 günde engelle sonuçlanma oranı | < %5 |
| Otomatik yakalama oranı | Vakaların otomatik tespitle (rapordan önce) açılma oranı | ≥ %50 |
| P0 SLA | 1 saatte ilk müdahale | ≥ %95 |
| P1 SLA | 4 saatte | ≥ %90 |
| Yanlış pozitif | Moderatörün geri aldığı otomatik eylem oranı | ≤ %15 |
| Sahte profil | Doğrulanmış sahte hesap / aktif | < %1 |
| Kriz akışı | Kriz ekranının gösterildiği olaylarda nöbetçi müdahale süresi | Medyan ≤ 30 dk |
| Dolandırıcılık | Para talebi tespiti / 1.000 bağlantı | İzlenir; trend |

### N.4 Ölçüm ilkeleri

- Analitikte **yalnızca davranış olayları** (ekran, düğme, durum geçişi) tutulur. Mesaj içeriği, ilişki durumu, ayrılık süresi ve sağlık sinyalleri analitiğe gönderilmez.
- KPI'lar veritabanından **toplu ve anonim** olarak (gece işi) hesaplanır ve `city_metrics_weekly` tablosuna yazılır.
- Haftalık "Beta Nabzı" raporu: KPI'lar + 5 kullanıcı görüşmesinden notlar + en sık 3 sorun.

---

## O. İstanbul Beta Planı

### O.1 Beta yapısı

| Dalga | Süre | Kullanıcı | Amaç |
|---|---|---|---|
| **Dalga 0: Prova** | 1 hafta (S16) | 20–30 (yakın çevre + gönüllü testçiler) | Teknik hatalar, moderasyon provası |
| **Dalga 1: Kurucu topluluk** | 3 hafta | 100–150 | Kültürü belirlemek; oda ve masa dinamiklerini görmek |
| **Dalga 2: Genişleme** | 4 hafta | +250–350 (toplam ~400–500) | Masa yoğunluğu; davet ve izin dönüşümleri |
| **Dalga 3: Hedef** | 4–6 hafta | +300–500 (toplam 500–1.000) | KPI'ları istatistiksel anlamlılığa yaklaştırmak; şehir sağlığı kriterleri |

**Dalga geçiş kuralı:** Bir sonraki dalga ancak şu koşullarla açılır: P0 SLA ≥ %95, güven skoru ≥ %75, cinsiyet dengesi ≥ %40 ve kritik hata yok.

### O.2 Kullanıcı edinme

| Kanal | Taktik | Kod kanalı etiketi |
|---|---|---|
| Kurucu çevre | Deniz'in ve gönüllülerin kişisel davetleri (her kurucu üyeye 3 davet kodu) | `founder` |
| Topluluk ortaklıkları | Boşanma sonrası destek grupları, ebeveyn toplulukları, yürüyüş ve kitap kulüpleri (İstanbul) | `partner-<ad>` |
| Profesyonel ağ (etik çerçevede) | Aile hukuku avukatları, terapistler ve yaşam koçlarına bilgilendirme ("danışanınıza önerebileceğiniz güvenli bir sosyal alan"); komisyon yok | `pro-referral` |
| İçerik | Instagram ve TikTok'ta "ayrılıktan sonra yeni başlangıçlar" sıcak içerik serisi + bekleme listesi | `waitlist-social` |
| Bekleme listesi | Dalgalar halinde, denge ve yaş dağılımına göre seçilerek davet | `waitlist` |
| Etkinlik (Faz 3'e hazırlık) | 1–2 küçük kurucu buluşması (kamusal alan, platform organizasyonu) | `event` |

**Yapılmayacaklar:** Ücretli toplu reklam (beta için erken), sahte profil, bot, satın alınmış etkileşim.

### O.3 Kadın/erkek dengesi

- **Hedef:** Aktif kullanıcıda her cinsiyet ≥ %40.
- **Önlem 1:** Bekleme listesinden davet **dengeli kotayla** yapılır. Dengesizlik büyürse fazla temsil edilen cinsiyetin davetleri bekletilir.
- **Önlem 2:** İlk dalgada kadın kullanıcı oranı ≥ %50 hedeflenir. Topluluk kültürü erken oluşur ve güvenlik algısı ürünün kaderini belirler.
- **Önlem 3:** Kadın kullanıcılara yönelik ortaklıklar (ebeveyn toplulukları, kadın dayanışma ağları); güvenlik özellikleri iletişimde ön planda.
- **Önlem 4:** Gelen davet kotası ve dikkat adaleti (ürün içi).
- **İzleme:** Davet kabul oranı ve engelleme oranı cinsiyet kırılımlı haftalık izlenir. Kadın kullanıcıların engelleme ve rapor oranı belirgin şekilde yüksekse büyüme durdurulur ve neden analiz edilir.

### O.4 Yaş dağılımı

| Yaş bandı | Hedef pay |
|---|---|
| 25–34 | %30 |
| 35–44 | %40 |
| 45–55 | %25 |
| 18–24 ve 55+ | ≤ %5 (kabul edilir, hedeflenmez) |

Masalar ±7 yaş bandıyla kurulduğundan her bantta yeterli yoğunluk gerekir. Dalga davetleri bu dağılıma göre ayarlanır.

### O.5 Topluluk yoğunluğu (matematik)

- 500 kayıtlı kullanıcı → ~%50 WAU → ~250 haftalık aktif.
- Bunların %40'ı haftada bir masa isterse → ~100 talep → 4 tema × 3 yaş bandı = 12 hücre → hücre başına ~8 talep → **hücre başına ~1 masa.** Bu, sınırda bir yoğunluk demek.
- **Sonuç:** Dalga 1–2'de **tema sayısı 2–3 ile sınırlı tutulmalı** ve yaş bantları geniş tutulmalı (25–40 / 38–55). Tema sayısı kullanıcı sayısı arttıkça açılır.
- Keşfet için: 250 haftalık aktif kullanıcıyla günlük 20 öneri bir süre sonra tekrar eder. Bu nedenle betada günlük öneri **10** ile başlar (az ama nitelikli). "Bugünlük bu kadar, odalara göz at" mesajı bu tasarımın parçasıdır.

### O.6 Moderatör ihtiyacı

| Dönem | Moderasyon kadrosu | Nöbet |
|---|---|---|
| Dalga 0–1 | Deniz + 2 yarı zamanlı moderatör (kriz eğitimli) | 09:00–01:00 aktif; 01:00–09:00 P0 alarmı telefonla |
| Dalga 2 | + 1 yarı zamanlı moderatör + 4–6 gönüllü oda rehberi | Aynı |
| Dalga 3 | 3–4 yarı zamanlı moderatör; haftalık vaka kalibrasyon toplantısı | 7/24 P0 nöbeti (rotasyon) |

**Eğitim:** Topluluk kuralları, karar şablonları, panel kullanımı, KVKK ve gizlilik, **kriz protokolü (ruh sağlığı uzmanının vereceği eğitim)**, moderatör refahı (ağır içeriğe maruziyet, rotasyon, destek).

### O.7 İlk odalar (Dalga 1: 8 oda)

| Oda | Kategori | Not |
|---|---|---|
| Yeni Ayrıldım | Destek | Yavaş mod 60 sn; rehber zorunlu |
| Boşanma Sonrası Hayat | Destek | |
| Çocuklu Ebeveynler | Destek | Çocuk fotoğrafı yasağı (zaten görsel yok) |
| Yeniden Başlamak | Destek / umut | "Küçük Zaferler" günlük sorusu |
| İstanbul | Şehir | Etkinlik ve mekân sohbeti (buluşma organizasyonu yok) |
| Akşam Sohbeti | Zaman | 20:00–00:00 açık |
| Kahve Odası | Zaman | 08:00–11:00 açık |
| Kitap, Film ve Dizi | İlgi | |

Dalga 2'de: 40+ Sohbet, Spor ve Yürüyüş, Seyahat (kullanım verisine göre).

### O.8 İlk masa temaları (Dalga 1: 3 tema)

1. **"Bu hafta yeniden başlıyorum"** (genel)
2. **"Çocuklu ebeveynler masası"**
3. **"Hafif sohbet: Film, müzik, şehir"** (romantik olmayan, düşük duygusal yük)

Her tema için 7 günlük soru planı (günde 1 kart) ve 2 mini oyun hazırlanır. İçerik Community Manager (betada Deniz) tarafından yazılır, ruh sağlığı uzmanı derin ve destek temalı soruları gözden geçirir.

### O.9 Davet (invite) sistemi

- **Kod türleri:** Tek kullanımlık kişisel kodlar (kurucu üyeler için 3'er adet), kanal kodları (ortaklıklar için çok kullanımlık ama kotalı), bekleme listesi davetleri (kişiye özel SMS linki).
- **Kod sahipliği:** Bir kodla gelen kullanıcı, kodu verene bağlanır (yalnızca analitik ve kötüye kullanım takibi için; kullanıcılara gösterilmez). Bir davet edenin getirdiği birden fazla kişi banlanırsa davet hakları kapanır.
- **Davet hakkı:** Dalga 2'den itibaren aktif ve sorunsuz kullanıcılara 2 davet kodu. Bu bir ödül değil, "güvendiğin birini getir" çağrısıdır.

### O.10 Geri bildirim sistemi

| Kanal | Sıklık | Amaç |
|---|---|---|
| Uygulama içi geri bildirim (S58) | Sürekli | Hata ve fikir |
| Mikro anket (uygulama içi, 2 soru) | Haftalık | Güven ve kalite skoru |
| Masa kapanış anketi | Her masa sonunda | Masa deneyimi (1 soru + yorum) |
| Kullanıcı görüşmeleri | Haftada 5 kişi (30 dk, gönüllü) | Derin içgörü |
| Kurucu topluluk kanalı | Sürekli (özel bir oda: "Birlikte geliştiriyoruz") | Topluluğu ürüne dahil etmek |
| Çıkış anketi | Silme ve mola anında | Neden ayrılıyor? (sağlıklı ayrılış dahil) |

### O.11 Beta Çıkış Kontrol Listesi (beta başlamadan önce)

- [ ] Hukuk: KVKK metinleri, açık rızalar, kullanım koşulları, yaş doğrulama yöntemi onaylı; yurt dışı aktarım sözleşmeleri imzalı ve bildirimleri yapılmış; VERBİS durumu netleşmiş
- [ ] Güvenlik: Pentest tamamlandı; kritik ve yüksek bulgu yok; RLS matrisi %100
- [ ] Ruh sağlığı: Kriz ekranı metni, hat listesi, moderatör kriz protokolü ve eğitim tamamlandı
- [ ] Operasyon: 2 moderatör eğitimli; nöbet çizelgesi; P0 alarmı test edildi
- [ ] Ürün: J1–J14 E2E testleri yeşil; mağaza onayları alındı
- [ ] İçerik: 8 oda, 3 masa teması, en az 150 soru kartı yayında
- [ ] Ölçüm: KPI panosu çalışıyor; Beta Nabzı şablonu hazır
- [ ] Olay müdahale: Veri ihlali runbook'u (72 saat bildirim süreci) hazır

---

## P. İlk Kodlamaya Geçmeden Önce Yapılacaklar

### P.1 Claude'un yapabilecekleri

- [ ] Bu planın Deniz'in yorumlarıyla v1.1'e güncellenmesi
- [ ] ADR taslakları: ADR-001 yığın · ADR-002 şema düzeni · ADR-003 yetenek modeli ve rıza motoru · ADR-004 mesaj şifreleme · ADR-005 telefon HMAC · ADR-006 moderasyon hattı
- [ ] Tehdit modeli v1 (STRIDE; özellikle stalking, ban kaçışı, kör onayı kırma ve dolandırıcılık senaryoları)
- [ ] RLS matrisinin tam hali (her tablo × rol × işlem)
- [ ] Rıza motorunun durum diyagramı ve tüm geçiş kuralları (ayrıntılı spesifikasyon)
- [ ] `CLAUDE.md` ve `AGENTS.md` taslakları (güvenlik ilkeleri, PR kuralları, AI'a veri verme yasağı)
- [ ] Dış servis karşılaştırma tabloları (SMS, canlılık, görsel moderasyon, STT): fiyat, veri yerleşimi, KVKK uygunluğu, Türkçe desteği. **Satın alma yok, yalnızca karşılaştırma.**
- [ ] Hukuk uzmanına gidecek **soru listesi** (aşağıdaki maddeleri içeren, cevaplanabilir sorular)
- [ ] Ruh sağlığı uzmanına gidecek **taslak** kriz ekranı metinleri ve topluluk kuralları
- [ ] Moderasyon değerlendirme setinin yapısı (etiket şeması; sentetik örnek üretimi)
- [ ] Ekran akış diyagramı (S01–S62) ve düşük çözünürlüklü wireframe taslakları

### P.2 Deniz'in yapması gerekenler

- [ ] **Bu planı onaylamak** ya da değişiklik istemek (özellikle A.2, E, L)
- [ ] Bu plandaki açık soruları cevaplamak:
  - Molada mesaj alma açık mı?
  - Seviye 1.5 ve 2 birbirinden bağımsız mı?
  - Hızlandırma seçenekleri kullanılacak mı?
- [ ] Şirket yapısı (mağaza hesapları, sözleşmeler ve KVKK veri sorumlusu kimliği için)
- [ ] Apple Developer Program ve Google Play Console hesapları (şirket adına; **henüz açılmayabilir**, ama ön hazırlık)
- [ ] Yeni GitHub reposunun adı ve görünürlüğü (özel), ayrıca reponun **ne zaman** oluşturulacağı
- [ ] Hukuk, güvenlik ve ruh sağlığı uzmanlarının bulunması ve tekliflerin alınması
- [ ] İsim için TÜRKPATENT araştırması (marka vekili) ve alan adı/kullanıcı adı kontrolü
- [ ] Bütçe tavanının belirlenmesi: aylık altyapı + doğrulama + SMS + uzmanlar + moderatörler
- [ ] Beta için 2 moderatör adayı ve kurucu topluluk listesi (ilk 30 kişi)
- [ ] 15–20 hedef kullanıcıyla keşif görüşmeleri (isim çağrışım testi dahil)

### P.3 Hukuk uzmanının yapması gerekenler

- [ ] **(Öncelik 1) Yaş doğrulama:** 5651 ek 4 ve 1 Kasım 2026'da yürürlüğe giren yönetmelik bu uygulamaya uygulanıyor mu? e-Devlet yaş belirteci zorunlu mu, bu ölçekteki bir platform için teknik erişim nasıl sağlanır? 18+ kuralı için yeterli bir yöntem mi?
- [ ] Platformun 5651 kapsamındaki niteliği (sosyal ağ sağlayıcı / yer sağlayıcı) ve yükümlülükleri (içerik kaldırma, temsilci, raporlama eşikleri, trafik verisi saklama)
- [ ] KVKK: Veri envanteri, işleme amaçları, hukuki sebepler. Özel nitelikli veriler: biyometri, "cinsel hayat" kapsamı (ilişki durumu ve tercihler), sağlık (kriz sinyali)
- [ ] Açık rıza metinleri ve özellik bazlı zorunlu doğrulamanın (K2) "özgür irade" açısından değerlendirilmesi
- [ ] Yurt dışı aktarım (KVKK m.9): Supabase (AB), canlılık sağlayıcısı, moderasyon ve AI sağlayıcıları, SMS, analitik; standart sözleşmeler ve Kurul'a bildirim
- [ ] VERBİS kaydı gerekliliği
- [ ] Aydınlatma metni, gizlilik politikası, kullanım koşulları, topluluk kuralları (hukuki dil)
- [ ] Saklama süreleri: Mesajlar, delil, ban kaydı, audit log, kriz verisi, silinen hesaplar
- [ ] Kullanıcı içeriği sorumluluğu; içerik kaldırma ve kullanıcı itiraz süreci
- [ ] Ciddi tehdit, çocuk istismarı şüphesi ve somut intihar riski durumlarında **yetkili mercilerle iletişim protokolü** ve yasal bildirim yükümlülükleri
- [ ] Veri ihlali bildirim prosedürü (72 saat)
- [ ] "Masa" kelimesinin özellik adı olarak kullanımı ve nihai marka için tescil stratejisi

### P.4 Güvenlik uzmanının yapması gerekenler

**Kodlama öncesi:**
- [ ] Tehdit modeli ve mimarinin gözden geçirilmesi (F bölümü)
- [ ] Rıza motoru tasarımının incelenmesi (kör onay ve zamanlama sızıntısı)
- [ ] HMAC ve mesaj şifreleme tasarımının incelenmesi

**Sprint 1 sonu (önerilir):**
- [ ] RLS ve trigger'ların erken incelemesi (en ucuz düzeltme anı)

**Canlı öncesi (S15, zorunlu):**
- [ ] Bağımsız penetrasyon testi: mobil (OWASP MASVS) + API (OWASP API Top 10)
- [ ] RLS kontrolü (her tablo, her rol)
- [ ] API yetkilendirme testi (RPC'ler, Edge Functions, IDOR)
- [ ] Veri sızıntısı testi (hata mesajları, zamanlama, loglar, analitik, Sentry)
- [ ] Dosya erişimi testi (bucket'lar, imzalı URL'ler, yol tahmini, meta veri)
- [ ] Admin yetkilendirmesi (RBAC, MFA, break-glass, audit bütünlüğü)
- [ ] Gizli anahtar yönetimi ve ortam ayrımı denetimi
- [ ] Bulgu raporu → düzeltme → yeniden test

### P.5 Ruh sağlığı uzmanının kontrol etmesi gerekenler

- [ ] Kriz ekranı metni (S49) ve tonu
- [ ] Doğru ve güncel destek hatları listesi (Türkiye)
- [ ] Kriz sinyali anahtar ifade listesi ve şiddet seviyeleri (Türkçe)
- [ ] Moderatör kriz protokolü: ne yazılır, ne yazılmaz, ne zaman yükseltilir
- [ ] "Bu kişi için endişeleniyorum" diyen kullanıcıya verilecek rehber
- [ ] Takip mesajı (24–48 saat) uygun mu, nasıl olmalı?
- [ ] Topluluk kuralları ve oda açıklamalarının dili (yargısız, damgalamayan, terapi iddiası taşımayan)
- [ ] "Derin" soru destesi ve destek odalarının günlük soruları (tetikleyici içerik kontrolü)
- [ ] "Önce konuşmak istiyorum" modu ve yeni ayrılmışlar için varsayılanların uygunluğu
- [ ] Moderatör eğitimi (kriz modülü) ve moderatör refahı önerileri

---

## İlk Geliştirme Adımı

### Öneri: "Güven Çekirdeği" veritabanı prototipi (yerel, ücretsiz, geri alınabilir)

**Ne:** Yalnızca yerel Supabase ortamında (Docker), hiçbir bulut hesabı ve ücretli servis olmadan şunları oluşturmak:
1. Monorepo iskeleti (yalnızca `supabase/` ve `docs/` klasörleri + CI tanımı).
2. Rıza motorunun çekirdek tabloları: `profiles` (minimal), `matches`, `capability_catalog`, `match_permissions`, `permission_user_state`, `permission_rounds`, `permission_votes`, `permission_events`, `conversations`, `conversation_members`, `messages`, `message_media`, `blocks`.
3. Bu tabloların RLS politikaları, `enforce_message_rules` ve `enforce_media_capability` trigger'ları, append-only korumalar.
4. RPC'ler: `propose_permission`, `respond_permission`, `revoke_permission`, `my_match_permissions`, `send_message`, `block_user`.
5. **pgTAP test seti:** Kör onay, zamanlama sızıntısı, cooldown, tek taraflı kapatma, izin yokken medya yazılamaması (service role dahil), engel sonrası her şeyin kapanması (AB-01, 02, 04, 05, 07, 14, 30).

**Neden ilk bu?**
- Ürünün **ayırt edici ve en riskli** kısmı bu. Burada bir tasarım hatası varsa ekranlar yazılmadan önce yakalanır.
- Kullanıcı verisi, dış servis, mağaza hesabı ya da hukuki onay gerektirmez. Tamamen yerel ve sentetiktir.
- Sonuç, güvenlik uzmanının erken inceleyebileceği somut bir çıktıdır.
- Testler başarısız olursa tasarım değişir. Bu, ileride ekranlar yazıldıktan sonra değiştirmekten çok daha ucuz.

**Çıktı:** Bir PR (yeni repoda): migration'lar + pgTAP testleri + `docs/adr/ADR-003` + test raporu. Süre: ~1 sprint (S1'in ilk yarısı; S0 iskeleti ile birlikte).

---

## Kodlamaya Başlamak İçin Gereken Onay

Kod yazmaya başlamadan önce Deniz'den **açıkça şu dört onayı** bekliyorum:

1. **"MVP Geliştirme Planı v1 onaylandı"** (ya da değişiklik listesi). Özellikle kapsam (A), veri modeli (E) ve güvenlik mimarisi (F) bölümleri için.
2. **Repo kararı:** "Yeni bir **özel** GitHub reposu `<ad>` adıyla oluşturulabilir." (Şu anki `megabiz-surec-yonetimi` reposu başka bir projeye ait. Uygulama kodu oraya yazılmamalı.) Repoyu Deniz oluşturup bu oturuma ekleyebilir ya da oluşturma yetkisini bana verebilir.
3. **İlk adım onayı:** "Güven Çekirdeği veritabanı prototipi **yalnızca yerel ortamda**, sentetik veriyle başlatılabilir."
4. **Sınır teyidi:** "Bu aşamada bulut hesabı (Supabase/Vercel/EAS), ücretli servis, mağaza işlemi ve gerçek kullanıcı verisi **yok**."

Bu dört onay geldiğinde S0 iskeleti ve Güven Çekirdeği ile başlarım. Hukuk, güvenlik ve ruh sağlığı uzmanı onayları kodlamanın başlaması için değil, **ilgili sprintler (S3, S12, S15) ve beta için** kapı (gate) olarak bekleniyor.
