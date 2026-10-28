# Rapor — Depo güvenliği, Vercel, mobil topluluk ve gizlilik (28 Ekim 2026)

Dal: `claude/global-tv-baslangic` · Ana dala birleştirme, canlıya dağıtım ve ücretli işlem **yok** ·
Yeni hesap, organizasyon veya Supabase projesi **yok** · Hiçbir şey silinmedi · Çalışma adı "Global TV" korunuyor.

## 1. GitHub güvenliği — depoyu gizli yapma
Ayrıntı: [../08-depo-gizlilik-vercel-ve-tasima.md](../08-depo-gizlilik-vercel-ve-tasima.md)

| Kontrol | Sonuç |
|---|---|
| Depo | Hâlâ **herkese açık**. Görünürlüğü yalnızca depo sahibi değiştirebilir; adımlar §1.4'te |
| GitHub Actions | Gizli depoda aylık 2.000 dk ve 500 MB kota. Ölçülen tüketim: gönderim başına ~12 dk; cihaz testi ~130 dk (iOS macOS çarpanı 10×). Ödeme yöntemi yoksa ücret çıkmaz. CI'a "art arda gönderimde eskiyi iptal et" eklendi |
| Vercel | Kişisel hesapta gizli depo desteklenir; GitHub uygulamasının erişimi kontrol edilmeli (adım 1) |
| Claude GitHub uygulaması | Erişim listesi kontrol edilmeli (adım 1) |
| ⚠️ Test APK'ları | Hiçbiri silinmedi. Ancak 7 günlük saklama süresi nedeniyle `apk-7…12` **30 Ekim**'de, `apk-1…6` **22 Kasım**'da GitHub tarafından kendiliğinden silinecek. Saklamak istediklerinizi bu tarihlerden önce indirin |

## 2. Vercel bağlantıları

| Proje | Global TV'den etkileniyor mu? |
|---|---|
| **mega-hrms** (`megahr.com.tr`) | **Hayır**: bu depoya bağlı değil |
| **megabiz-surec-yonetimi** | **Evet**: her Global TV gönderimi bir Preview derlemesi başlatıyordu (üretim etkilenmedi) |
| 300-asistan, vakit-rezervasyon | Hayır |

**Yapılan (geri alınabilir):** Yalnızca Global TV dalına `vercel.json` eklendi; Vercel bu dalda derleme yapmıyor.
`main` dalına, proje ayarlarına ve alan adlarına **dokunulmadı**.

**Doğrulama:** Önceden her gönderimden ~12 sn sonra Vercel derlemesi başlıyordu. `67278a7` ve `efcbb81` gönderimlerinde Vercel durumu **0**; son Vercel derlemesi hâlâ 23 Ekim tarihli.

## 3. Ayrı depo taşıma planı
- **Yöntem:** `git filter-repo` ile yalnızca Global TV klasörü ve CI dosyası ayrıştırılır.
- **Kuru çalıştırma:** 9 commit aktarıldı (tarih, yazar ve mesajlar korundu), 197 dosya kaynakla **birebir aynı**, Megabiz dosyası 0. CI dosyası değişmeden çalışır.
- **Geri dönüş:** Eski depo ve dal doğrulama bitene kadar korunur. Tam yedek paket (`git bundle`) alınır. Yeni depo ileride şirket organizasyonuna "Transfer ownership" ile taşınabilir.
- **Onayınızı bekleyenler:**
  - hesap seçimi: mevcut GitHub hesabı **veya** proje e-postasıyla yeni hesap/organizasyon,
  - proje e-postası,
  - Supabase hesabı ve ücretsiz "globaltv-dev" projesi.

## 4. Mobil uygulama — yapılanlar

### Gizlilik ve açık rıza (KVKK / GDPR)
| Konu | Uygulama |
|---|---|
| Varsayılan | Analitik **kapalı**. Canlı TV listesinin başında "İzin ver" / "İzin verme" kartı; iki seçenek eşit ağırlıkta, uygulamayı engellemez |
| Yönetim | Profil > **Gizlilik ve veriler**: aç/kapat anahtarı, toplanan ve hiç toplanmayan veriler, saklama süresi |
| İzlenme kaydı | Kanal, süre, platform, cihazın bölge ayarındaki ülke, rastgele cihaz kimliği. **Kullanıcı kimliği, e-posta, konum, reklam kimliği yok** |
| Cihaz kimliği | Donanımdan türetilmez; rastgele üretilir, 30 günde bir yenilenir, izin kapatılınca silinir |
| Aktif kullanıcı | Yalnızca giriş yapmış ve izin vermiş kullanıcı için günde bir kayıt |
| Ölçüm kuralları | Yayın oynamaya başlayınca başlar; arka plana geçince kapanır ve gönderilir. 5 sn'den kısa geçişler sayılmaz; 24 saat üst sınırı var. İzin ölçüm sırasında geri çekilirse hiçbir şey gönderilmez |
| Raporlarda anonimlik | 5'ten az cihazı olan ülkeler "Diğer" altında birleşir (k-anonimlik, sunucuda uygulanır) |
| Saklama | Ham kayıtlar en fazla 13 ay (`purge_old_analytics`; gerçek ortamda günlük zamanlanacak) |

### Sohbet ve moderasyon kararlarının kullanıcıya yansıması
| Durum | Kullanıcının gördüğü |
|---|---|
| Kilitli oda | "Bu sohbet odası moderatörler tarafından geçici olarak kilitlendi. Mesajları okumaya devam edebilirsiniz." Yazma alanının yerinde gösterilir |
| Yavaş mod | Bilgi: "30 saniyede bir mesaj…". Gönderim sonrası canlı geri sayım ("18 sn bekleyin"); gönder düğmesi bekleme süresince kapalı, yazmaya devam edilebilir |
| Susturma | "Bir moderatör sizi sohbette susturdu. 23 dk sonra tekrar yazabilirsiniz." Süre dolunca otomatik açılır. Profilde "Hesap durumu" |
| Yasak | "…sohbete katılımınız kapatıldı. Yayınları izlemeye devam edebilirsiniz." |
| Gizlenen mesaj | Yazar mesajını "Bu mesajı yalnızca siz görüyorsunuz: bir moderatör … gizledi" notuyla görür; diğer kullanıcılar görmez |
| Sunucu hataları | `room_locked`, `slow_mode`, `rate_limited`, susturma/yasak (RLS) ayrı ayrı anlaşılır TR/EN mesaja çevrilir. Genel "bir sorun oluştu" metnine düşmez (testle doğrulandı) |

Moderatör panelden bir karar verdiğinde (kilit, yavaş mod, susturma) uygulama bunu **canlı** alır; yeniden açmak gerekmez.
Demo modunda "Demo Haber TR" odası kilitli, "Demo Spor TR" odası 30 sn yavaş modda: sunucusuz denenebilir.

### Veritabanı güvenliği — bulunan ve düzeltilen açık
**Bulgu:** Profil tablosu herkese açıktı. Giriş yapmış her kullanıcı, diğer kullanıcıların yasak ve susturma durumunu, rolünü ve ülkesini okuyabiliyordu.

**Düzeltme:**
- Kullanıcı artık yalnızca kendi profilini görür.
- Kullanıcı yönetimi yetkisi olan personel tüm profilleri görür.
- Başkalarının yalnızca **kullanıcı adı** alınabilir (`public_usernames`; en fazla 200 kayıt, misafire kapalı).
- Mobil engel listesi ve panel bu değişikliğe uyarlandı.

### Ayrıca düzeltilen
Canlı TV filtre satırı (arama + ülke seçici) büyük yazı tipi ve İngilizce arayüzde 8,7 piksel taşıyordu. Yeni testler bu hatayı yakaladı; düzeltildi.

## 5. Yönetim paneli
- Raporlama sayfasına iki grafik eklendi:
  - **Aktif cihaz (günlük, misafirler dahil)**,
  - **Ülkelere göre izlenme (anonim)**: dakika ve cihaz sayısıyla, 5 cihaz eşiği ve açıklama notu.
- Kullanıcı ülke dağılımına da aynı eşik uygulanır. CSV dışa aktarımına eklendi.

## 6. Test sonuçları

| Alan | Sonuç |
|---|---|
| Veritabanı kuralları | ✅ **105/105** (yeni 22: profil gizliliği, gizlenen mesaj, susturma, canlı yayın, k-anonimlik, saklama) |
| Mobil analiz | ✅ temiz |
| Mobil birim + arayüz | ✅ **48/48** (yeni 27: rıza, izlenme ölçümü, oda kilidi, yavaş mod geri sayımı, susturma/yasak, gizlenen mesaj, TR/EN, küçük/yatay/büyük yazı tipli ekranda taşma) |
| **Android** emülatörü, uçtan uca | ⏳ CI çalışması 14 sürüyor |
| **iOS** simülatörü, derleme + uçtan uca | ⏳ CI çalışması 14 sürüyor |
| Test APK'sı (Android, demo) | ⏳ CI çalışması 14 sürüyor |
| Panel tip kontrolü + birim/arayüz | ✅ **63/63** |
| Panel tarayıcı (masaüstü + mobil) | ✅ **11/11** |
| Panel bağımlılık güvenliği | ✅ 0 açık |
| Gizli anahtar taraması | ✅ İzlenen dosyalarda bulgu yok. 5 bulgunun tamamı depoya girmeyen yerel derleme önbelleğinde (test çerçevesinin örnek metinleri) |

### Test sırasında bulunan ve düzeltilen hatalar
| Hata | Düzeltme ve kanıt |
|---|---|
| Küçük ekranda (390×420) ve yatayda yasak/kilit uyarısı sohbet alanını 18–62 piksel taşırıyordu | Engelleyen uyarı artık yazma alanının **yerine** geçiyor; uyarı yüksekliği sınırlı. Test düzeltmeden önce düşüyordu, şimdi geçiyor |
| Filtre satırı büyük yazı tipinde taşıyordu (mevcut hata) | Ülke seçici esnek genişliğe alındı; test aynı şekilde önce düşüp sonra geçti |
| Profil tablosu herkese açıktı (gizlilik) | Bkz. §4. Erişim testleri eklendi |

## 7. Ekran görüntüleri
Klasör: [../ekran-goruntuleri/](../ekran-goruntuleri/). Mobil görüntüler koyu temada, Roboto yazı tipiyle test ortamında üretildi; video alanı test ortamında yükleniyor görünür.

| Dosya | İçerik |
|---|---|
| `16-mobil-izin-karti.png` | İlk açılışta analitik izin kartı |
| `17-mobil-gizlilik.png` | Gizlilik ve veriler ekranı |
| `18-mobil-kilitli-oda.png`, `24-mobil-kilitli-oda-ingilizce.png` | Kilitli oda (TR / EN) |
| `19-mobil-yavas-mod.png` | Yavaş mod geri sayımı |
| `20-mobil-susturuldu.png` | Susturma, kalan süre |
| `21-mobil-sohbet-kapali.png` | Yasak |
| `22-mobil-gizlenen-mesaj.png` | Yazarına gösterilen gizlenmiş mesaj |
| `23-mobil-profil-durum.png` | Profilde hesap durumu |
| `25-panel-ulke-analitigi.png` | Panel: aktif cihaz ve ülkeye göre anonim izlenme |

## 8. Test cihazına yeni sürüm
GitHub → Actions → "Global TV — CI" → son çalışma → **Artifacts** → `globaltv-staging-demo-apk-…` indirilir.
Zip'ten çıkan APK Android cihaza kurulur (bilinmeyen kaynaklara izin). Ayrıntı: [../05-cihaz-testi-rehberi.md](../05-cihaz-testi-rehberi.md)

İlk açılışta izin kartı görünür. Denemek için:
- "Demo Haber TR": kilitli oda,
- "Demo Spor TR": yavaş mod.

Sohbete yazmak için Profil'den herhangi bir e-posta ile demo girişi yapılır.

## 9. Sonraki adımlar ve sizden beklenenler
| # | İş | Kim | Son tarih |
|---|---|---|---|
| 1 | Depoyu gizli yapma (08 belgesi §1.4, 3 adım) | **Siz** | Bu hafta |
| 2 | Saklamak istediğiniz eski APK'ları indirme | **Siz** | 30 Ekim |
| 3 | Taşıma için hesap kararı + proje e-postası + Supabase hesabı onayı | **Siz** | 7 Kasım (D4) |
| 4 | Supabase dev'e migration'ların uygulanması; gerçek sunucuda uçtan uca test; `purge_old_analytics` zamanlaması | Ben (onaydan sonra) | Onay + 2 gün |
| 5 | Gizlilik politikası metni (izin kartından bağlantı) | Ben taslak, siz onay | 15 Kasım (D6) |
| 6 | Yönetici hesapları için MFA | Ben | Gerçek sunucuya geçiş |
| 7 | Apple/Google geliştirici hesapları | Siz (ücretli, onay) | 24 Kasım / 1 Aralık |

Beta (20 Aralık) için kritik yol değişmedi: kod dondurma 15 Aralık. En yakın bağımlılık 7 Kasım'daki proje e-postası ve Supabase hesabı.
