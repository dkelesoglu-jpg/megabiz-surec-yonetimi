# 1. Teknik Fizibilite ve Uygulama Mimarisi

Hazırlanma: 23 Ekim 2026 · Durum: Taslak v1 (ürün sahibi onayı bekliyor)

## 1.1 Özet karar

| Konu | Değerlendirme | Sonuç |
|---|---|---|
| Flutter ile iOS + Android | Tek kod tabanı, `video_player` (iOS: AVPlayer, Android: ExoPlayer/Media3) iki platformda da yerel HLS desteği verir | ✅ Uygun |
| Supabase (Auth, Postgres, Realtime, Storage, Edge Functions) | Giriş, veritabanı, canlı sohbet ve dosya ihtiyaçlarının tamamını karşılar; RLS ile satır bazlı güvenlik | ✅ Uygun |
| Canlı sohbet | Supabase Realtime (Postgres değişiklikleri + Broadcast). Beta ölçeği (≤ 1.000 eşzamanlı kullanıcı) için yeterli | ✅ Uygun, yük testi gerekli |
| Güvenli HLS | Yalnızca HTTPS, yalnızca yönetim panelinde onaylı & hakkı geçerli kaynak URL'leri; istemci akış URL'sini sabit kodlamaz, sunucudan alır | ✅ Uygun |
| Yönetim paneli | Flutter Web veya React + Supabase. **Öneri: React (Vite) + Supabase** — ekip deneyimi (mevcut Megabiz projesi) ve tablo/form ağırlıklı ekranlar | ✅ Uygun |
| Takvim (20 Aralık beta) | ~8 hafta, ürün sahibi günde 1–2 saat. MVP kapsamı dar tutulursa gerçekçi | ⚠️ Riskli ama yapılabilir |
| **En büyük risk** | Uygulama teknik değil, **içerik**: yayın hakkı doğrulanmış ücretsiz kanal bulmak | ⚠️ Lisans iş listesi 1. haftadan başlıyor |

## 1.2 Mimari genel bakış

```
┌──────────────────────────┐         ┌───────────────────────────────────────┐
│  Mobil uygulama (Flutter)│  HTTPS  │  Supabase (proje başına ayrı ortam)    │
│  iOS + Android           │────────▶│  • Auth (e-posta, Apple, Google)       │
│  • Riverpod (durum)      │         │  • Postgres + RLS                      │
│  • go_router (navigasyon)│◀────────│  • Realtime (sohbet)                   │
│  • video_player (HLS)    │ WS/WSS  │  • Edge Functions (moderasyon,         │
│  • intl / ARB (TR, EN)   │         │    hesap silme, akış URL imzalama)     │
└───────────┬──────────────┘         └───────────────▲───────────────────────┘
            │ HLS (HTTPS)                            │ service_role YALNIZCA
            ▼                                        │ sunucu tarafında
┌──────────────────────────┐         ┌───────────────┴───────────────────────┐
│  Yayıncı / CDN            │         │  Yönetim paneli (web, React)           │
│  (yalnızca hakkı doğrulan-│         │  • Kanal, yayın hakkı, moderasyon      │
│   mış kaynaklar)          │         │  • Admin rolü + MFA zorunlu            │
└──────────────────────────┘         └───────────────────────────────────────┘
            Reklam: Google Mobile Ads (AdMob)  ·  Analitik: Firebase Analytics veya PostHog (karar 2. hafta)
            Hata takibi: Sentry veya Firebase Crashlytics
```

### Katmanlar (mobil)

| Katman | Sorumluluk | Klasör |
|---|---|---|
| Sunum | Ekranlar, widget'lar | `lib/features/*/` |
| Durum | Riverpod provider'ları | `lib/features/*/…_providers.dart` |
| Veri | Repository arayüzleri; `Demo…` (yerel) ve `Supabase…` (uzak) uygulamaları | `lib/data/` |
| Çekirdek | Ortam yapılandırması, router, tema | `lib/core/` |

Repository arayüzü sayesinde ekranlar, Supabase hazır olmadan demo veriyle geliştirilip test edilebilir; Supabase bağlantısı 2. haftada aynı arayüzün arkasına takılır.

## 1.3 Veri modeli (özet)

Tam şema: [`supabase/migrations/20261023000000_initial_schema.sql`](../supabase/migrations/20261023000000_initial_schema.sql)

| Tablo | Amaç | Kim okur / yazar |
|---|---|---|
| `profiles` | Kullanıcı adı, dil, ülke, rol | Herkes kendi kaydını; adminler tümünü |
| `channels` | Kanal adı, ülke, kategori, logo, aktiflik | Herkes **yalnızca aktif ve hakkı geçerli** kanalları okur; adminler yazar |
| `broadcast_rights` | Yayın hakkı belgesi, kapsam (ülke), başlangıç/bitiş, doğrulayan | Yalnızca adminler |
| `channel_streams` | HLS URL'si (kanal başına), birincil/yedek | İstemci doğrudan okuyamaz; Edge Function üzerinden verilir |
| `programs` | Yayın akışı (EPG) | Herkes okur; adminler yazar |
| `favorites` | Kullanıcı ↔ kanal | Yalnızca sahibi |
| `chat_rooms` / `chat_messages` | Kanal veya program odası, mesajlar | Giriş yapmış kullanıcılar okur/yazar; yasaklı kullanıcı yazamaz |
| `reports` | Mesaj/kullanıcı şikâyeti | Şikâyet eden oluşturur; moderatör/admin okur |
| `blocks` | Kullanıcının engellediği kişiler | Yalnızca sahibi |
| `moderation_actions` | Uyarı, susturma, yasaklama kaydı | Moderatör/admin |
| `account_deletion_requests` | Hesap silme talebi ve durumu | Sahibi oluşturur; sistem işler |

**Yayın hakkı kuralı veritabanında zorunlu:** bir kanalın kullanıcıya görünmesi için `channels.is_active = true` **ve** bugünün tarihini kapsayan, `status = 'verified'` olan bir `broadcast_rights` kaydı olmalıdır. Bu kontrol RLS politikasında yapılır; uygulama kodunda bir hata olsa bile hakkı olmayan kanal listelenmez.

## 1.4 Güvenlik ve gizlilik

| Konu | Uygulama |
|---|---|
| Gizli anahtarlar | Mobil uygulamada yalnızca Supabase **publishable (anon) key** bulunur (RLS ile korunur). `service_role` anahtarı yalnızca Edge Functions ve CI gizli değişkenlerinde. Anahtarlar `env/*.json` dosyalarında, bu dosyalar `.gitignore`'da |
| Ortam ayrımı | 3 ayrı Supabase projesi: `dev`, `staging` (test/beta), `prod`. Mobil uygulama `--dart-define-from-file` ile hangi ortama bağlanacağını bilir; uygulama içinde ortam etiketi gösterilir (prod hariç) |
| Akış URL'leri | İstemciye sabit URL gömülmez; `get-stream` Edge Function'ı kanal hakkını tekrar kontrol eder ve URL döner (CDN destekliyorsa kısa ömürlü imzalı URL) |
| DRM / şifreli yayın | **Kapsam dışı.** Ücretli veya şifreli yayınların kilidini açan hiçbir yöntem kullanılmaz. Yalnızca yayıncının açık/ücretsiz dağıtım izni verdiği HLS akışları |
| Coğrafi kısıtlama | `broadcast_rights.allowed_countries` alanı; ülke bilgisi cihaz bölgesi + IP (Edge Function) ile kontrol edilir |
| Sohbet güvenliği | Hız sınırı (ör. 5 mesaj / 10 sn), küfür/spam filtresi (Edge Function), şikâyet, engelleme, moderatör susturma/yasaklama, yaş sınırı (13+, mağaza derecelendirmesine göre 17+ değerlendirilecek) |
| Hesap silme | Uygulama içinden tek akışla (Apple ve Google zorunluluğu). Profil, favoriler, engeller silinir; mesajlar "silinmiş kullanıcı" olarak anonimleştirilir; 30 gün içinde tamamlanır |
| KVKK / GDPR | Aydınlatma metni, açık rıza (analitik + kişiselleştirilmiş reklam ayrı ayrı), veri dışa aktarma talebi, iOS ATT izni, Google UMP onay formu |
| Yönetim paneli | Yalnızca `admin`/`moderator` rolü, MFA zorunlu, tüm işlemler `audit_log` tablosuna |

## 1.5 Reklam ve analitik

- **Reklam:** Google Mobile Ads (AdMob). MVP'de yalnızca banner (kanal listesi altı) ve kanal açılışında en fazla 1 geçiş reklamı (frekans sınırı). Video içi reklam (pre-roll / SSAI) beta sonrası, yayıncı sözleşmeleri izin veriyorsa.
- **Analitik (temel):** uygulama açılışı, kanal izleme başlangıcı/süresi, oynatma hatası, sohbet mesajı sayısı, şikâyet. Kişisel veri içermeyen olay adları; kullanıcı onayı yoksa analitik kapalı.
- Beta'da reklamlar **test reklam kimlikleriyle** çalışır; gerçek reklam hesabı açılması onayınıza bağlıdır.

## 1.6 Riskler ve önlemler

| # | Risk | Olasılık | Etki | Önlem |
|---|---|---|---|---|
| R1 | Beta için yeterli lisanslı kanal bulunamaması | Yüksek | Yüksek | 1. haftadan lisans iş listesi; beta lisanslı demo akışlarla da yapılabilir; FAST kanal sağlayıcıları ve kamu yayıncılarıyla görüşme |
| R2 | Apple incelemesinde UGC (sohbet) reddi | Orta | Yüksek | Guideline 1.2 gereksinimleri MVP'de: şikâyet, engelleme, filtre, iletişim bilgisi, 24 saatte müdahale |
| R3 | Ürün sahibinin sınırlı zamanı | Orta | Orta | Haftalık rapor + karar listesi; her karar için öneri hazır sunulur |
| R4 | Realtime ölçek / maliyet | Düşük (beta) | Orta | Beta öncesi 500 sanal kullanıcı ile yük testi; oda başına mesaj sınırı |
| R5 | Bazı HLS akışlarının Android/iOS'ta farklı davranması | Orta | Orta | Her kanal için iki platformda otomatik "akış sağlık kontrolü" |
| R6 | Mağaza hesaplarının geç açılması (Apple D-U-N-S süreci 1–2 hafta) | Orta | Yüksek | Hesap açılışı **onayınızla** 1. hafta içinde başlatılmalı |

## 1.7 Ücretli servisler (onay gerektirir — henüz hiçbiri açılmadı)

| Servis | Ne için | Tahmini maliyet (beta) | Ne zaman gerekli |
|---|---|---|---|
| Apple Developer Program | TestFlight + App Store | 99 USD / yıl | **1. hafta** (D-U-N-S süresi nedeniyle) |
| Google Play Console | Dahili/kapalı test + yayın | 25 USD tek sefer | 2. hafta |
| Supabase | dev + staging ücretsiz katman yeterli; prod için Pro | 0 → 25 USD/ay | prod: Aralık |
| AdMob | Reklam | Ücretsiz (gelir paylaşımı) | 5. hafta |
| Sentry / Crashlytics | Hata takibi | Ücretsiz katman | 3. hafta |
| Codemagic veya GitHub Actions macOS | iOS derlemesi (Mac yoksa) | 0–~50 USD/ay | 3. hafta |
