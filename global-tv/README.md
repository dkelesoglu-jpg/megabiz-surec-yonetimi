# Global TV & Community

Ücretsiz, yayın hakkı doğrulanmış televizyon kanallarını izleme ve kanal/program bazlı canlı sohbet uygulaması.
Flutter (iOS + Android), Supabase ve web tabanlı yönetim paneli.

| Kilometre taşı | Tarih |
|---|---|
| Proje başlangıcı | 23 Ekim 2026 |
| Kapalı iç test (dahili) | 27 Kasım 2026 |
| Kontrollü beta | **20 Aralık 2026** |
| Beta test raporu | **31 Aralık 2026 öncesi** |

> Bu klasör, depodaki mevcut Megabiz süreç yönetimi uygulamasından **bağımsızdır**. İki proje birbirinin dosyalarını kullanmaz.

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
│   └── test/               Birim ve widget testleri
├── supabase/
│   └── migrations/         Veritabanı şeması, RLS politikaları (sürüm kontrollü)
├── admin/                  Web yönetim paneli (2. hafta başlıyor)
├── env/                    Ortam şablonları (*.example.json) — gerçek anahtarlar ASLA commit edilmez
└── docs/
    ├── 01-fizibilite-ve-mimari.md
    ├── 02-mvp-kapsami.md
    ├── 03-ortamlar-ve-surum-sureci.md
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

`env/dev.json` yoksa uygulama **demo modunda** açılır: Supabase'e bağlanmaz, yerel demo kanal listesi ve
lisanslı test akışlarıyla çalışır. Bu sayede ilk ekranlar hiçbir hesap açılmadan denenebilir.

Test cihazına sürüm aktarımı için: [docs/03-ortamlar-ve-surum-sureci.md](docs/03-ortamlar-ve-surum-sureci.md).
