# 3. Ortamlar ve Sürüm Süreci

## 3.1 Üç ayrı ortam

| Ortam | Amaç | Supabase projesi | Mobil dağıtım | Kim değiştirir |
|---|---|---|---|---|
| `dev` | Geliştirme | `globaltv-dev` (veya yerel `supabase start`) | Geliştirici cihazı / emülatör | Geliştirici serbestçe |
| `staging` | Test ve beta | `globaltv-staging` | TestFlight + Google Play dahili/kapalı test | Yalnızca `main` dalına birleşen ve CI'dan geçen kod |
| `prod` | Canlı | `globaltv-prod` | App Store + Google Play üretim | **Yalnızca ürün sahibinin yazılı onayıyla** |

- Her ortamın anahtarları ayrıdır; bir ortamın anahtarı başka ortamda kullanılmaz.
- Uygulama hangi ortamda olduğunu `APP_ENV` değeriyle bilir; `dev` ve `staging` sürümlerinde ekranın köşesinde ortam etiketi görünür.
- Android'de ortam başına farklı paket kimliği planlanır (`…dev`, `…staging`), böylece test ve canlı sürüm aynı cihazda yan yana kurulabilir (H3'te flavor olarak eklenecek).

## 3.2 Gizli bilgiler

- `env/dev.example.json`, `env/staging.example.json`, `env/prod.example.json` → **şablon**, commit edilir, gerçek değer içermez.
- `env/dev.json` vb. → gerçek değerler, `.gitignore` ile dışlanır.
- CI'da değerler GitHub Actions *Secrets* olarak tutulur; `service_role` anahtarı mobil uygulamaya **hiçbir zaman** girmez.
- Mağaza imzalama anahtarları (Android keystore, Apple sertifikaları) depoda tutulmaz; parola yöneticisi + CI gizli değişkeni.

## 3.3 Değişiklik akışı

```
özellik dalı ──PR──▶ main ──(CI: analiz + test + derleme)──▶ staging derlemesi ──(manuel onay)──▶ prod
                       │                                         │
                       └ Veritabanı: migration dosyası            └ Supabase staging'e migration
                         (supabase/migrations)                      (CI veya elle, onaylı)
```

1. Her değişiklik bir dalda yapılır ve Pull Request ile `main`'e girer.
2. CI: `flutter analyze`, `flutter test`, Android derlemesi. Kırmızı CI ile birleştirme yapılmaz.
3. Veritabanı değişiklikleri yalnızca `supabase/migrations/` altındaki dosyalarla yapılır; panelden elle tablo değişikliği yapılmaz.
4. **Üretime gönderim:** sürüm notu + test sonucu ürün sahibine sunulur, yazılı onay ("prod'a gönder") alınmadan yapılmaz.

## 3.4 Test cihazına yeni sürüm aktarma

### Hemen şimdi (hesap açılmadan, geliştirici makinesinden)

**Android (en kolayı):**
1. Telefonda *Ayarlar → Telefon hakkında → Yapım numarası*'na 7 kez dokunun → *Geliştirici seçenekleri → USB hata ayıklama* açın.
2. Bilgisayarda: `cd global-tv/app && flutter build apk --release --dart-define-from-file=../env/staging.json`
3. `build/app/outputs/flutter-apk/app-release.apk` dosyasını telefona aktarın (USB, Google Drive veya `flutter install`). Telefonda "bilinmeyen kaynaklardan yükleme" iznini verin.

**iOS:** Mac + Xcode gerekir. Telefon USB ile bağlıyken `flutter run --release --dart-define-from-file=../env/staging.json`. Ücretsiz Apple kimliğiyle imzalanan sürüm 7 gün çalışır.

### Hesaplar açıldıktan sonra (H5'ten itibaren, önerilen yol)

| Platform | Kanal | Test eden ne yapar |
|---|---|---|
| iOS | **TestFlight** | App Store'dan *TestFlight* uygulamasını kurar, e-postadaki davet bağlantısına dokunur, "Yükle"ye basar. Yeni sürüm gelince TestFlight bildirim gönderir, "Güncelle" der |
| Android | **Google Play dahili test** (en fazla 100 kişi, dakikalar içinde yayılır) | Davet bağlantısını açar, "Test kullanıcısı ol"a dokunur, Play Store'dan kurar. Güncellemeler normal uygulama gibi gelir |

Her yeni test sürümünde ürün sahibine şu bilgiler gönderilir: sürüm numarası (`1.0.0+N`), değişiklik listesi, bilinen sorunlar, test edilmesi istenen senaryolar.
