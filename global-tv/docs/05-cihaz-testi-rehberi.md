# 5. Cihaz Testi Rehberi (şirket ve ücretli hesap olmadan)

Bu rehberdeki yöntemlerin hiçbiri şirket kuruluşu veya ücretli geliştirici hesabı gerektirmez.

## 5.1 Android — telefona test APK'sı kurma (önerilen, ~5 dakika)

Her değişiklikte CI otomatik olarak bir **test APK'sı** üretir (staging ortamı, demo veri, hata ayıklama imzası).

1. GitHub'da depoya girin → **Actions** → **Global TV — CI** → en üstteki yeşil çalıştırma.
2. Sayfanın altındaki **Artifacts** bölümünden `globaltv-staging-demo-apk-<numara>` dosyasını indirin (zip).
3. Zip'i açın, `app-release.apk` dosyasını telefona gönderin (Google Drive, e-posta veya USB).
4. Telefonda dosyaya dokunun → "Bu kaynaktan yüklemeye izin ver" → **Yükle**.
5. Ana ekranda **Global TV BETA** simgesi görünür.

Güncelleme: yeni APK'yı aynı şekilde kurun; eski sürümün üzerine yüklenir, veriler korunur.

> Uyarı: Bu depo şu an herkese açık olduğu için APK'yı GitHub'a giriş yapmış herkes indirebilir.
> Özel depoya taşınınca yalnızca yetkili kişiler indirebilir (bkz. 04, bölüm 4.4).

Ayrıca bilgisayarda USB ile: telefonda *Geliştirici seçenekleri → USB hata ayıklama* açık, sonra
`cd global-tv/app && flutter run --release --dart-define-from-file=../env/staging.json`.

## 5.2 iOS — seçenekler

| Yöntem | Gereken | Sınır |
|---|---|---|
| **a) CI'da iOS simülatörü** | Hiçbir şey (GitHub Actions → *Run workflow* → `ios_simulator` işaretli) | Gerçek cihaz değil; derleme + uçtan uca test doğrular |
| **b) Mac'te iOS simülatörü** | Mac + Xcode (ücretsiz) | Gerçek cihaz değil |
| **c) Kendi iPhone'unuz, ücretsiz Apple kimliği** | Mac + Xcode + normal Apple kimliği | Kurulum **7 gün** geçerli, sonra yeniden kurulmalı; az sayıda cihaz; TestFlight yok; başkasına dağıtılamaz |
| d) TestFlight | Ücretli Apple Developer hesabı | Onayınız gerekir — bkz. 06 |

**(c) adımları:**
1. Xcode → Settings → Accounts → Apple kimliğinizle giriş → "Personal Team" oluşur.
2. `global-tv/app/ios/Flutter/LocalSigning.xcconfig.example` dosyasını `LocalSigning.xcconfig` olarak kopyalayın,
   `DEVELOPMENT_TEAM` satırına Personal Team kimliğini yazın.
3. Ücretsiz takımda paket kimliği benzersiz olmalı; gerekirse `identity/AppIdentity.xcconfig` içindeki
   geçici kimliğin sonuna kendi adınızı ekleyin (yalnızca yerel, commit etmeyin).
4. iPhone'u bağlayın: `cd global-tv/app && flutter run --release --dart-define-from-file=../env/staging.json`
5. iPhone'da *Ayarlar → Genel → VPN ve Cihaz Yönetimi* → geliştiriciye güvenin.

## 5.3 Uçtan uca otomatik test

`app/integration_test/app_smoke_test.dart`: kanal listesi → gerçek HLS oynatma → misafir sohbet kuralı → favori → profil.

| Nerede | Nasıl |
|---|---|
| Bağlı telefon / emülatör | `cd global-tv/app && flutter test integration_test` |
| CI — Android emülatörü | Actions → **Run workflow** → `android_emulator` ✓ |
| CI — iOS simülatörü | Actions → **Run workflow** → `ios_simulator` ✓ |

## 5.4 Önerilen test cihazları (ürün sahibinin elindeki cihazlarla başlanır)

| # | Platform | Örnek | Neden |
|---|---|---|---|
| 1 | Android güncel | Android 14–15, orta/üst segment | Ana hedef |
| 2 | Android eski / düşük donanım | Android 9–10, 2–3 GB RAM | Performans, video çözücü uyumu |
| 3 | iOS güncel | iPhone, iOS 18+ | Ana hedef |
| 4 | iOS eski | iPhone 11 sınıfı, iOS 17 | Eski cihaz uyumu |

## 5.5 Her test turunda kontrol listesi

- [ ] Uygulama açılıyor, köşede ortam etiketi (DEV/STAGING) görünüyor
- [ ] Kanal listesi, arama, ülke ve kategori filtresi
- [ ] 3 farklı kanal oynuyor (3 sn içinde başlıyor), ses aç/kapa
- [ ] Wi-Fi ↔ mobil veri geçişi, uçak modu aç/kapa sonrası "Tekrar dene"
- [ ] Favoriye ekle/çıkar, Favoriler sekmesi
- [ ] Dil değiştir (Türkçe ↔ English)
- [ ] Giriş yap → sohbete mesaj → başka cihazdan görünüyor (Supabase bağlandıktan sonra)
- [ ] Mesaj şikâyet / kullanıcı engelleme
- [ ] Hesap silme akışı
- [ ] Sorun bulunduysa: cihaz modeli, işletim sistemi sürümü, adımlar, ekran görüntüsü
