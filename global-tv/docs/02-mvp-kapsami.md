# 2. MVP Kapsamı (20 Aralık 2026 kontrollü beta)

İlke: **Beta'da olmayan her şey "sonra" listesindedir.** Kapsama ekleme, ürün sahibinin onayıyla ve başka bir maddenin çıkarılmasıyla yapılır.

## 2.1 MVP'de VAR (Must)

| # | Modül | Kapsam | Kabul kriteri |
|---|---|---|---|
| M1 | Canlı TV | Kanal listesi, ülke ve kategori filtresi, arama, HLS oynatıcı (tam ekran, ses, yeniden bağlanma) | iOS ve Android'de aynı kanal 3 sn içinde oynamaya başlar; ağ kesilip gelince otomatik devam eder |
| M2 | Favoriler | Kanalı favoriye ekle/çıkar, favoriler sekmesi | Favori, çıkış/giriş sonrası korunur (sunucuda) |
| M3 | Giriş & hesap | E-posta + şifre, Apple ile giriş (iOS zorunlu), Google ile giriş; misafir olarak izleme (sohbet hariç) | Misafir izleyebilir; sohbete yazmak için giriş istenir |
| M4 | Profil | Kullanıcı adı, avatar (hazır set), dil, ülke | Kullanıcı adı benzersiz, uygunsuz kelime filtresi |
| M5 | Canlı sohbet | Kanal odası (program odası: kanal odası içinde program etiketiyle) | Mesaj < 1 sn içinde diğer cihazda görünür |
| M6 | Moderasyon | Mesaj şikâyeti, kullanıcı engelleme, küfür filtresi, hız sınırı, moderatör susturma/yasaklama | Engellenen kullanıcının mesajları görünmez; şikâyet panelde listelenir |
| M7 | Yönetim paneli | Giriş (admin/moderatör), kanal ekle/düzenle/pasifleştir, yayın hakkı kaydı ve belge yükleme, şikâyet kuyruğu | Hakkı süresi dolan kanal uygulamadan otomatik kalkar |
| M8 | Çok dil | Türkçe + İngilizce, cihaz diline göre otomatik, ayarlardan değiştirilebilir | Tüm ekran metinleri ARB dosyalarından gelir |
| M9 | Reklam | Banner + sınırlı geçiş reklamı (test kimlikleri) | Onay verilmezse kişiselleştirilmemiş reklam |
| M10 | Analitik | Temel olaylar (bkz. mimari 1.5), hata takibi | Onay yoksa olay gönderilmez |
| M11 | Gizlilik | Aydınlatma metni, onay ekranı, hesap silme, gizlilik politikası bağlantısı | Hesap silme uygulama içinden 3 adımda |

## 2.2 Sonraya bırakılanlar (Should / Could)

- Program bazlı ayrı sohbet odaları ve EPG (yayın akışı) ekranı → beta sonrası ilk sürüm
- Push bildirimleri ("favori kanalında X başladı")
- Chromecast / AirPlay (AirPlay iOS'ta oynatıcı ile kısmen hazır gelir)
- Arapça, İspanyolca vb. ek diller (RTL desteği)
- Özel mesajlaşma, arkadaşlık sistemi
- Video içi reklam (pre-roll / SSAI)
- Tablet ve TV (Android TV / tvOS) arayüzleri
- Kullanıcı tarafından eklenen kanallar — **asla** (yayın hakkı kuralı)

## 2.3 Haftalık plan

| Hafta | Tarih | Hedef |
|---|---|---|
| H1 | 23 – 31 Eki | Mimari, MVP, klasör yapısı, ilk ekranlar + navigasyon (demo veri), iş listeleri ✅ |
| H2 | 1 – 7 Kas | Supabase dev/staging projeleri, şema + RLS, gerçek giriş (e-posta), kanal listesi Supabase'den; yönetim paneli iskeleti |
| H3 | 8 – 14 Kas | Oynatıcı sağlamlaştırma (yeniden bağlanma, arka plan, ses), Apple/Google giriş, CI (analiz + test + derleme) |
| H4 | 15 – 21 Kas | Canlı sohbet (Realtime), hız sınırı, şikâyet/engelleme |
| H5 | 22 – 28 Kas | Yönetim paneli: kanal + yayın hakkı + şikâyet kuyruğu; **dahili test sürümü** (TestFlight + Play dahili test) |
| H6 | 29 Kas – 5 Ara | Reklam (test), analitik, onay ekranları, hesap silme |
| H7 | 6 – 12 Ara | Hata düzeltme, erişilebilirlik, performans, yük testi, mağaza metinleri |
| H8 | 13 – 19 Ara | Kod dondurma (15 Ara), regresyon testi, beta sürümü onayı |
| — | **20 Ara** | **Kontrollü beta başlar** (TestFlight harici test + Play kapalı test, ~50–200 kişi) |
| H9 | 20 – 30 Ara | Beta izleme, düzeltmeler, **test raporu (en geç 30 Ara)** |

## 2.4 Ürün sahibinden beklenen kararlar (sıralı)

1. **Apple Developer + Google Play hesaplarının açılması** (kurumsal mı bireysel mi?) — H1
2. Supabase organizasyonu/projelerinin açılması (ücretsiz katman) — H2 başı
3. Uygulamanın kesin adı ve paket kimliği (öneri: `com.globaltv.community`) — H2
4. Hedef ülkeler (beta) ve ilk kanal görüşmeleri — H2
5. Analitik aracı: Firebase mi PostHog mu? (öneri: Firebase — Crashlytics + AdMob ile tek konsol) — H3
6. Sohbet yaş sınırı ve mağaza yaş derecelendirmesi — H4
