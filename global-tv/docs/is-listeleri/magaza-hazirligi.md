# İş Listesi — App Store ve Google Play Hazırlığı

⚠️ Hesap açma ve ödeme gerektiren adımlar **ürün sahibinin onayı** ile yapılır. Henüz hiçbir hesap açılmadı.

## Hesaplar (onay gerekli — ürün sahibi kararı 23 Ekim: henüz ücretli kayıt yok, şirket kuruluşu sonra)
- [x] Teknik altyapı kurumsal hesaba geçişe hazır (tek kimlik dosyası, git dışı imza ayarları) — bkz. docs/04
- [ ] Proje e-postası (ücretsiz) — tüm hesaplar bununla açılacak (D4)
- [ ] Apple Developer Program — 99 USD/yıl — bireysel / kurumsal kararı, son tarih 24 Kasım (D1)
- [ ] Google Play Console — 25 USD — son tarih 1 Aralık; yoksa Android betası APK ile (D3). Yeni kişisel hesaplarda üretime çıkmadan önce **12 test kullanıcısı × 14 gün kapalı test** şartı var
- [ ] AdMob hesabı (H5, onayla)

## Uygulama kimliği
- [ ] Kalıcı uygulama adı (mağazada benzersiz olmalı; "Global TV" çok yaygın) — **ürün sahibi onayı bekleniyor** (D2)
- [ ] Kalıcı paket kimliği — **ürün sahibi onayı bekleniyor** (D2). Şu an geçici: `com.placeholder.globaltv`; değişiklik tek dosyada (`app/identity/AppIdentity.xcconfig`)
- [ ] Uygulama simgesi ve açılış ekranı (H4)

## Mağaza politikası uyumu
- [ ] Apple 1.2 (Kullanıcı tarafından üretilen içerik): filtre, şikâyet, engelleme, iletişim bilgisi ✔ MVP'de
- [ ] Apple 4.8: üçüncü taraf giriş varsa **Apple ile Giriş** ✔ MVP'de
- [ ] Apple 5.1.1(v) & Google: uygulama içi hesap silme ✔ MVP'de
- [ ] Apple 5.2 (Fikri mülkiyet): yayın hakkı belgeleri incelemeye hazır tutulmalı
- [ ] Google Play *Data safety* formu ve Apple *Privacy Nutrition Label* (H7)
- [ ] iOS App Tracking Transparency metni, Google UMP (GDPR onayı) (H6)
- [ ] Yaş derecelendirmesi anketi (sohbet nedeniyle muhtemelen 12+/Teen veya 17+) (H7)
- [ ] Gizlilik politikası URL'si (herkese açık web sayfası) (H6)

## Mağaza içerikleri
- [ ] Kısa/uzun açıklama TR + EN (H7)
- [ ] Ekran görüntüleri: iPhone 6.9", 6.5"; Android telefon (H7)
- [ ] İnceleme ekibi için demo hesap + not (canlı yayının nasıl test edileceği) (H8)

## Dağıtım
- [ ] TestFlight dahili test grubu (H5)
- [ ] Google Play dahili test kanalı (H5)
- [ ] TestFlight harici test (Apple beta incelemesi 1–2 gün sürer → en geç 17 Aralık gönderim) (H8)
- [ ] Google Play kapalı test kanalı (H8)
