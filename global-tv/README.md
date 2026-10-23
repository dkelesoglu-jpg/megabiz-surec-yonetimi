# Global TV & Community

Ücretsiz, yayın hakkı doğrulanmış televizyon kanallarını izleme ve kanal/program bazlı canlı sohbet uygulaması.
Flutter (iOS + Android), Supabase ve web tabanlı yönetim paneli.

| Kilometre taşı | Tarih |
|---|---|
| Proje başlangıcı | 23 Ekim 2026 |
| Kapalı iç test (dahili) | 27 Kasım 2026 |
| Kontrollü beta | **20 Aralık 2026** |
| Beta test raporu | **31 Aralık 2026 öncesi** |

> Bu proje mevcut şirketlerden **tamamen bağımsızdır** ve depodaki Megabiz uygulamasının dosyalarını kullanmaz.
> Ayrı (özel) bir depoya taşınması planlanmıştır — bkz. [docs/04-bagimsizlik-ve-hesap-gecisi.md](docs/04-bagimsizlik-ve-hesap-gecisi.md).

## Klasör yapısı

```
global-tv/
├── app/                    Flutter mobil uygulama (iOS + Android)
│   ├── lib/
│   │   ├── main.dart       Giriş noktası (ortam bilgisini --dart-define ile alır)
│   │   ├── app.dart        MaterialApp.router, tema, dil
│   │   ├── core/           Ortam yapılandırması, yönlendirme (router), tema
│   │   ├── data/           Modeller + repository arayüzleri ve demo veri
│   │   ├── features/       Ekranlar: auth, live_tv, player, chat, favorites, profile
│   │   ├── l10n/           Türkçe / İngilizce metinler (ARB)
│   │   └── shared/         Ortak bileşenler
│   ├── test/               Birim ve widget testleri
│   ├── identity/           Uygulama adı + paket kimliği (tek kaynak, şimdilik GEÇİCİ)
│   └── integration_test/   Cihaz/emülatör/simülatör uçtan uca testi
├── supabase/
│   ├── migrations/         Veritabanı şeması, RLS politikaları (sürüm kontrollü)
│   ├── functions/          Edge Functions: get-stream, delete-account
│   ├── tests/              RLS testleri (düz PostgreSQL üzerinde, CI'da)
│   ├── seed.sql            Demo kanallar (yalnızca dev/staging)
│   └── config.toml         Yerel Supabase (supabase start)
├── admin/                  Web yönetim paneli (2. hafta başlıyor)
├── env/                    Ortam şablonları (*.example.json) — gerçek anahtarlar ASLA commit edilmez
└── docs/
    ├── 01-fizibilite-ve-mimari.md
    ├── 02-mvp-kapsami.md
    ├── 03-ortamlar-ve-surum-sureci.md
    ├── 04-bagimsizlik-ve-hesap-gecisi.md
    ├── 05-cihaz-testi-rehberi.md
    ├── 06-beta-bagimliliklari.md
    ├── is-listeleri/       Test, yayın lisansı, mağaza hazırlığı iş listeleri
    └── haftalik-raporlar/  Her hafta bir rapor
```

## Hızlı başlangıç (geliştirici)

```bash
cd global-tv/app
cp ../env/dev.example.json ../env/dev.json     # değerleri doldurun; dev.json git'e girmez
flutter pub get
flutter gen-l10n
flutter run --dart-define-from-file=../env/dev.json
```

`--dart-define-from-file` verilmeden (`flutter run`) veya Supabase değerleri boş bırakılırsa uygulama **demo modunda** açılır: Supabase'e bağlanmaz, yerel demo kanal listesi ve
lisanslı test akışlarıyla çalışır. Bu sayede ilk ekranlar hiçbir hesap açılmadan denenebilir.

Testler:

```bash
cd global-tv/app && flutter test                       # birim + widget
cd global-tv/app && flutter test integration_test      # bağlı cihaz/emülatörde uçtan uca
PGURL=postgres://... global-tv/supabase/tests/run_pg_tests.sh   # veritabanı kuralları
```

Yerel Supabase (hesap gerekmez, Docker gerekir): `cd global-tv && npx supabase start` → çıktıdaki
API URL ve publishable key'i `env/dev.json`'a yazın.

Test cihazına kurulum: [docs/05-cihaz-testi-rehberi.md](docs/05-cihaz-testi-rehberi.md).
