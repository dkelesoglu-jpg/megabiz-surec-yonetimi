# İş Listesi — Test

Sorumlu: Geliştirme · Onay: Ürün sahibi · Son tarih: Beta test raporu 30 Aralık 2026

## Otomatik testler
- [x] Widget testi: uygulama açılır, alt navigasyon 3 sekme gösterir (H1)
- [x] Birim testi: kanal filtresi (ülke + kategori + arama) (H1)
- [x] Birim testi: favori ekle/çıkar (H1)
- [ ] Repository sözleşme testleri (Demo ve Supabase uygulamaları aynı davranır) (H2)
- [ ] RLS testleri: hakkı olmayan / süresi dolmuş kanal anon kullanıcıya görünmez (pgTAP) (H2)
- [ ] RLS testleri: kullanıcı başkasının favorisini / engellerini okuyamaz (H2)
- [ ] Sohbet: yasaklı kullanıcı mesaj yazamaz; hız sınırı çalışır (H4)
- [ ] Hesap silme Edge Function testi (H6)
- [ ] CI: her PR'da `flutter analyze` + `flutter test` + APK derlemesi (H3)

## Manuel test
- [ ] Test cihaz matrisi belirle: en az 2 iOS (biri eski, ör. iPhone 11 / iOS 17) + 3 Android (biri düşük donanım, Android 9–10) (H2)
- [ ] Oynatıcı senaryoları: Wi-Fi ↔ mobil veri geçişi, uçak modu aç/kapat, arka plana alma, telefon çağrısı, kulaklık çıkarma (H3)
- [ ] Sohbet senaryoları: iki cihaz arası gecikme, uzun mesaj, emoji, uygunsuz kelime, şikâyet → panelde görünme (H4)
- [ ] Çok dil: tüm ekranlar TR ve EN, uzun metin taşması (H6)
- [ ] Erişilebilirlik: büyük yazı tipi, VoiceOver/TalkBack etiketleri, kontrast (H7)
- [ ] Gizlilik: onay reddedilince analitik/reklam kişiselleştirme kapalı mı? (H6)

## Performans ve yük
- [ ] Kanal açılış süresi ölçümü (hedef < 3 sn, 4G) (H7)
- [ ] Sohbet yük testi: 500 sanal kullanıcı, tek oda (H7)
- [ ] Bellek: 30 dk kesintisiz izleme sonrası çökme / sızıntı yok (H7)

## Beta (20–30 Aralık)
- [ ] Beta test kullanıcı listesi (50–200 kişi) ve davet metni (H7)
- [ ] Uygulama içi geri bildirim bağlantısı (form) (H6)
- [ ] Günlük metrik takibi: çökme oranı (hedef > %99,5 çökmesiz), oynatma hata oranı, sohbet şikâyet sayısı
- [ ] **Beta test raporu**: kapsam, cihazlar, bulunan hatalar (önem derecesiyle), metrikler, yayına hazırlık kararı
