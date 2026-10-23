# Test Raporu — 23 Ekim 2026

Kapsam: uçtan uca testteki geri dönüş adımının düzeltilmesi, oynatıcı ekranındaki yerleşim taşmasının düzeltilmesi
ve tüm test setinin yeniden doğrulanması.
Test edilen sürüm: `claude/global-tv-baslangic` dalı, commit `3733f9f`.
CI çalıştırmaları: [push #39938716002](https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/actions/runs/39938716002) ·
[cihaz testleri #39938721053](https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/actions/runs/39938721053)

## 1. Özet

| Alan | Sonuç |
|---|---|
| Kod analizi (`flutter analyze`) | ✅ Sorun yok (yerel + CI) |
| Uygulama testleri (`flutter test`) | ✅ **21 / 21** — önceki 13 test + 8 yeni oynatıcı ekranı testi |
| Veritabanı güvenlik testleri (RLS) | ✅ **23 / 23** (yerel PostgreSQL 16 + CI PostgreSQL 17) |
| Edge Functions tip kontrolü | ✅ (yerel + CI) |
| Android test APK'sı derlemesi | ✅ |
| **Android** emülatörü — uçtan uca | ✅ 1 / 1 |
| **iOS** simülatörü — derleme + uçtan uca | ✅ 1 / 1 |

## 2. Önceki başarısızlığın nedeni

Önceki turda (commit `6e4242a`) uçtan uca test iki platformda da **aynı adımda** düştü: oynatıcıdan geri dönüş.
Video oynatma, CANLI etiketi ve misafir sohbet kuralı adımları ikisinde de **geçmişti**.

| | |
|---|---|
| Belirti | `pageBack()`: "One back button expected on screen", 0 eşleşme |
| Kök neden | Flutter'ın `tester.pageBack()` yardımcısı geri tuşunu İngilizce **"Back"** araç ipucuyla arar. Test Türkçe arayüzde çalıştığı için ipucu **"Geri"** ve tuş bulunamaz |
| Uygulama hatası mı? | **Hayır.** Geri tuşu iki platformda da mevcut (Android ve iOS görünümünde 1 adet `BackButton`, ipucu "Geri" — yerelde doğrulandı) |

### Değerlendirilen düzeltmeler
| Yöntem | Karar |
|---|---|
| `Navigator.of(...).pop()` (bekleyen değişiklik) | Çalışır ama geri tuşunu **atlar**; kullanıcının dokunduğu düğmeyi sınamaz → kullanılmadı |
| Uygulama çubuğundaki `BackButton`'a dokunmak | Kullanıcı davranışının aynısı; Android ve iOS'ta aynı bileşen → **seçildi** |

## 3. Bu sırada bulunan ve düzeltilen gerçek hata

| | |
|---|---|
| Hata | Oynatıcı ekranında video alanı genişliğe göre büyüyordu; ekran kısa olduğunda sohbet paneli **taşıyordu** (sarı-siyah şerit, içerik görünmez) |
| Etkilenen durumlar | Telefon **yatay** tutulduğunda (21 piksel taşma), **klavye açıkken** sohbete yazarken (179 piksel taşma). Her iki platformda |
| Düzeltme | Video yüksekliği ekranın kullanılabilir alanının en fazla %45'i; lisans atıf metni tek satır |
| Kanıt | Yeni test, düzeltme geçici olarak geri alındığında 4 senaryoda **düştü**, düzeltmeyle 8/8 **geçti** |

## 4. Android sonuçları

| Test | Ortam | Sonuç | Not |
|---|---|---|---|
| Uçtan uca: kanal listesi → **gerçek HLS oynatma** → CANLI etiketi → misafir sohbet kuralı → favoriye ekle → **geri tuşu** → Favoriler → Profil | Android 14 (API 34) emülatörü, x86_64 | ✅ Geçti | Yaklaşık 7 dk (derleme dahil) |
| Oynatıcı ekranı: taşma yok + geri tuşu (4 ekran boyutu, Android görünümü) | Widget testi | ✅ 4 / 4 | Dikey 390×844, klavye açık 390×420, yatay 844×390, tablet 1024×768 |
| Test APK'sı (staging, demo veri) | CI derlemesi | ✅ | Actions → Artifacts: `globaltv-staging-demo-apk-…` |

Bilinen zararsız uyarı: test sonunda `adb uninstall com.globaltv.global_tv` başarısız görünüyor. Flutter aracı,
derlemeden önce kimliği kaynak koddaki eski ad alanından tahmin ediyor. Kurulan uygulamanın kimliği farklı
(geçici kimlik + ortam soneki) olduğu için o adla kurulu uygulama yok. Test kurulu uygulamada sorunsuz çalıştı.
Sonuca etkisi yok.

## 5. iOS sonuçları

| Test | Ortam | Sonuç | Not |
|---|---|---|---|
| Xcode derlemesi (simülatör) | macOS, GitHub Actions | ✅ | 135 sn. Tek kimlik dosyası (`AppIdentity.xcconfig`) ve imza ayarı yapısı iOS'ta doğrulandı |
| Uçtan uca: Android ile aynı senaryo (gerçek HLS oynatma dahil) | iPhone simülatörü | ✅ Geçti | — |
| Oynatıcı ekranı: taşma yok + geri tuşu (4 ekran boyutu, iOS görünümü) | Widget testi | ✅ 4 / 4 | — |

## 6. Henüz test edilmeyenler (dürüst sınırlar)

| Konu | Neden | Ne zaman |
|---|---|---|
| Gerçek Android telefon | Ürün sahibinin cihazında APK kurulumu bekleniyor | Bu hafta |
| Gerçek iPhone | Mac + Xcode gerekir (veya ücretli Apple hesabı → TestFlight) | Karar D1 |
| Giriş, sohbet, favori **sunucuyla** | Ayrı Supabase hesabı henüz yok (D4); kod ve veritabanı kuralları ayrı ayrı test edildi, birlikte değil | D4 sonrası |
| Ağ değişimi, arka plan, uzun izleme, düşük donanım | Gerçek cihaz gerektirir | Cihaz testlerinde |

## 7. Değişmeyenler (kurallara uygunluk)
- Demo modu korunuyor (bütün uçtan uca testler demo modunda koştu)
- Uygulama adı ve paket kimliği **değiştirilmedi** (geçici `com.placeholder.globaltv`)
- Supabase'de yeni proje yok; mevcut şirket sistemlerine erişilmedi
- Apple/Google hesabı yok, ücretli işlem yok
- Ana dala birleştirme ve canlıya dağıtım yok
