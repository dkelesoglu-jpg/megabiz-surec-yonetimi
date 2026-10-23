# Rapor — Yönetim Paneli v2 (23 Ekim 2026)

Dal: `claude/global-tv-baslangic` · Ana dala birleştirme, canlıya dağıtım ve ücretli işlem **yok** ·
Supabase'de yeni proje **yok** · Gerçek/izinsiz TV yayını **yok** · Çalışma adı "Global TV" korunuyor.

## 1. GitHub güvenliği

Ayrıntı: [../07-github-guvenlik-denetimi.md](../07-github-guvenlik-denetimi.md) (§7.6 yeniden denetim)

| Kontrol | Sonuç |
|---|---|
| Depo görünürlüğü | ⚠️ **Herkese açık** (değiştirilmedi; onayınız bekleniyor) |
| Kod + tüm commit geçmişi (7 dal) | ✅ Gizli anahtar / erişim bilgisi / imza dosyası yok (gitleaks + hedefli tarama) |
| CI dosyası | ✅ Gizli değişken kullanılmıyor; **iş akışı izni yalnızca okuma** olacak şekilde sertleştirildi |
| Test APK'ları (9 adet) | ✅ Boş Supabase ayarıyla (demo modu) derleniyor; gizli bilgi içermiyor. Herkese açık depoda indirilebilir |
| Private yapmanın etkisi | Güvenli. Actions: aylık 2.000 dk / 500 MB kota (ödeme yöntemi yoksa ücret çıkmaz); Vercel kişisel hesapta gizli depoyu destekler |

## 2. Yönetim paneli — çalışan ilk sürüm

**Türkçe ve İngilizce** (anında geçiş, tarayıcıda hatırlanır) · **koyu premium tema varsayılan**, açık tema seçeneği ·
masaüstü ve mobil uyumlu · demo verisiyle çalışır, Supabase'e hazır.

| Modül | İçerik | Durum |
|---|---|---|
| Pano | Toplam kullanıcı, aktif kullanıcı (bugün / 7 gün), yayındaki kanallar, izlenme süresi, günlük izlenme grafiği, dikkat listesi | ✅ |
| Kanal yönetimi | Ekleme, düzenleme, ülke, yayın dili, kategori, yayın URL'si (yalnızca https) + kategori yönetimi | ✅ |
| Yayın lisansları | Hak belgesi yükleme (PDF/JPG/PNG, 10 MB, özel depo), geçerlilik tarihleri, ülke bazlı coğrafi kısıt, 14 gün uyarısı, ülke görünümü | ✅ |
| Topluluk yönetimi | Canlı sohbet odaları (kilitleme, yavaş mod, 24 saatlik mesaj/katılımcı/şikâyet), mesajlar ve yorumlar (gizle / kalıcı sil), kullanıcı şikâyetleri | ✅ |
| Moderasyon | Kullanıcı engelleme ve susturma, moderatör rolleri (rol atama), moderasyon işlem kayıtları | ✅ |
| Reklam yönetimi | AdMob reklam alanları (biçim, platform, sınır, test bayrağı) + sponsorlu içerik (yerleşim, kanal, dönem, https bağlantı) | ✅ (yalnızca test) |
| Raporlama | Kullanıcı (aktif, yeni kayıt, ülke), yayın (kanal ve platform bazlı izlenme), sohbet (mesaj, şikâyet nedenleri, moderasyon), reklam; 7/30/90 gün; CSV indirme | ✅ |
| Sistem ayarları | Uygulama dilleri, sürümler (en son / en düşük), bakım modu, TR/EN duyurular | ✅ |
| Denetim kaydı | Kim, ne, hangi kayıt, ne zaman; silinen mesajın içeriği kanıt olarak saklanır | ✅ |

### Rol bazlı yetkilendirme — üç katman
| Katman | Uygulama |
|---|---|
| Veritabanı (asıl) | `role_permissions` + `has_permission()`, RLS politikaları, profil koruma tetikleyicisi (kendi rolünü değiştirme, yöneticiyi kısıtlama, son yönetici koruması), oda kilidi / yavaş mod tetikleyicisi, özel belge deposu politikaları |
| Sunucu | `admin_*` fonksiyonları izni yeniden kontrol eder; denetim ve moderasyon kayıtları tetikleyiciyle tutulur, istemci değiştiremez veya silemez |
| Arayüz | Menü, düğmeler ve sayfalar izne göre; doğrudan adres yazılarak açılamaz |

| Rol | Erişim |
|---|---|
| Yönetici | Tümü |
| İçerik yöneticisi | Pano, kanallar, yayın lisansları, duyurular, raporlar (reklam hariç) |
| Moderatör | Pano, topluluk, moderasyon, raporlar (reklam hariç) |
| Kullanıcı | Panele giremez |

### Tasarım
Daha önce hazırlanan mobil konsept dosyası bulunamadı: depoda yok, Canva'da "Global TV" tasarımı yok, Drive'da ilgili dosya yok.
Panel, talimattaki tarife (modern, koyu, premium) ve mobil uygulamanın marka rengine (indigo `#3D5AFE`) göre tasarlandı.
Grafik rengi kontrast ve renk körlüğü doğrulamasından geçti. Konsept iletildiğinde renk ve tipografi tek dosyadan (`src/index.css`) uyarlanabilir.
**Mobil uygulama ekranları değiştirilmedi.**

## 3. Ekran görüntüleri

Klasör: [../ekran-goruntuleri/](../ekran-goruntuleri/)

| Dosya | İçerik |
|---|---|
| `01-giris.png` | Giriş (TR/EN ve tema seçici) |
| `02-pano.png` | Pano |
| `03-kanallar.png` | Kanal yönetimi |
| `04-yayin-lisanslari.png` | Yayın lisansları + belge + ülke görünümü |
| `05-topluluk.png`, `05b-topluluk-sikayetler.png` | Sohbet odaları, şikâyetler |
| `06-moderasyon.png` | Kullanıcılar ve roller |
| `07-reklam.png` | Reklam alanları |
| `08-raporlama.png` | Raporlama |
| `09-ayarlar.png` | Sistem ayarları |
| `10-denetim-kaydi.png` | Denetim kaydı |
| `11-pano-ingilizce.png` | İngilizce arayüz |
| `12-pano-acik-tema.png` | Açık tema |
| `13-mobil-pano.png`, `14-mobil-topluluk.png`, `15-mobil-menu.png` | Mobil |

## 4. Test sonuçları

| Alan | Sonuç |
|---|---|
| Veritabanı kuralları | ✅ **83/83** (yeni topluluk/analitik/sponsorluk/belge deposu 28 + yönetim 32 + önceki 23) |
| Panel tip kontrolü | ✅ |
| Panel birim + arayüz testleri | ✅ **61/61** (TR/EN sözlük tutarlılığı, izinlerin veritabanıyla birebir eşleşmesi dahil) |
| Panel tarayıcı testleri (masaüstü + mobil) | ✅ **11/11** (+1 yalnızca mobil test, masaüstünde atlanır) |
| Panel bağımlılık güvenliği | ✅ 0 açık |
| Gizli anahtar taraması | ✅ |
| Mobil analiz / testler | ✅ temiz / **21/21** (mobil kod değişmedi) |
| **Android** emülatörü, uçtan uca | ✅ 1/1 (CI, commit `dd70207`) |
| **iOS** simülatörü, derleme + uçtan uca | ✅ 1/1 (CI, commit `dd70207`) |

### Bulunan ve düzeltilen hatalar
| Hata | Neden | Düzeltme / kanıt |
|---|---|---|
| Mobil menünün altındaki tema ve dil düğmelerine dokunulamıyordu (CI'da yakalandı) | Çekmece, tarayıcının düzen yüksekliğine göre konumlanıyordu; geniş yazı tipi ve İngilizce metinlerle görünen ekranın dışına taşıyordu | Çekmece görünen ekran yüksekliğine (`dvh`) bağlandı ve kaydırılabilir yapıldı. Yeni test eklendi; düzeltme olmadan **düşüyor**, düzeltmeyle **geçiyor** |
| Yavaş mod seçicisinde "Kapalı" durumu kesik görünüyordu | Dar alan | Seçici genişletildi |

## 5. Eksik kalan işler
| İş | Bağımlılık |
|---|---|
| Panelin ve uygulamanın gerçek Supabase'e bağlanması; belge deposunun gerçek ortamda denenmesi | Ayrı Supabase hesabı (onay) |
| Yönetici hesapları için MFA zorunluluğu | Gerçek sunucuya geçiş |
| Mobil uygulamanın izlenme ve aktiflik verisi göndermesi; kilitli oda ve yavaş mod uyarılarını göstermesi (şu an genel hata mesajı gösterir) | Sonraki geliştirme adımı |
| Gerçek reklam istatistikleri | AdMob hesabı (onay) |
| Panelin barındırılması | Barındırma yeri kararı; canlıya dağıtım onaya bağlı |
| Tasarım konseptinin panele birebir uygulanması | Konsept dosyasının iletilmesi |
