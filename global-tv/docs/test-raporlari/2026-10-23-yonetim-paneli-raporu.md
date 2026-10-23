# Rapor — GitHub Güvenliği ve Yönetim Paneli (23 Ekim 2026)

Dal: `claude/global-tv-baslangic` · Commit: `8c0a017` · Ana dala birleştirme ve canlıya dağıtım **yapılmadı** · Ücretli işlem **yok**
CI: [push #39947322142](https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/actions/runs/39947322142) ·
[cihaz testleri #39947327819](https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/actions/runs/39947327819)

## 1. GitHub güvenliği
Ayrıntı: [../07-github-guvenlik-denetimi.md](../07-github-guvenlik-denetimi.md)

- 7 dal, tüm git geçmişi ve zip arşivi tarandı: **sızmış anahtar, erişim bilgisi veya imza dosyası yok**; anahtar yenileme gerekmiyor.
- Depoyu gizli (private) yapmak **güvenli**. Etkiler ve adımlar raporda. Depoda hiçbir erişim değişikliği yapılmadı (onayınız bekleniyor).
- CI'a kalıcı **gizli anahtar taraması** eklendi; test APK'larının saklama süresi 7 güne indi.

## 2. Tamamlanan modüller (yönetim paneli)

| Modül | Durum |
|---|---|
| Pano: kullanıcı, kanal, sohbet istatistikleri + günlük mesaj grafiği + dikkat listesi | ✅ |
| Kanal yönetimi: ekleme, düzenleme, aktif/pasif, yayın adresi (yalnızca https), kategori yönetimi | ✅ |
| Yayın hakları: ülke bazlı izin, geçerlilik, 14 gün uyarısı, doğrula/iptal, ülke görünümü | ✅ |
| Kullanıcı yönetimi: durum (aktif/susturulmuş/yasaklı), susturma, yasaklama, rol atama | ✅ |
| Sohbet moderasyonu: şikâyet kuyruğu, mesajı gizleyip kapatma, mesaj inceleme, yazarı sustur/yasakla | ✅ |
| Reklam alanları: yerleşim, biçim, platform, gösterim sınırı, test bayrağı, aç/kapa | ✅ (yalnızca test kimlikleri) |
| Sistem ayarları: diller, uygulama sürümü (en son / en düşük), bakım modu, duyurular (TR/EN) | ✅ |
| Denetim kaydı: kim, ne, hangi kayıt, ne zaman | ✅ |
| Rol bazlı yetki: yönetici, içerik yöneticisi, moderatör (kullanıcı panele giremez) | ✅ |
| Mobil uyumlu düzen: menü çekmecesi, tablo → kart, yatay taşma yok | ✅ |

### Yetkilendirme üç katmanda
1. **Veritabanı:** izin tablosu + `has_permission()`, RLS politikaları, profil koruma tetikleyicisi, izni yeniden kontrol eden `admin_*` fonksiyonları
2. **Denetim kaydı:** tetikleyicilerle otomatik; istemci yazamaz, silemez (yönetici dahil)
3. **Arayüz:** menü, düğme ve sayfa koruması. Demo sunucu da aynı kuralları uygular

## 3. Test sonuçları

| Alan | Yerel | CI |
|---|---|---|
| Veritabanı kuralları | ✅ 55/55 (yeni 32 + önceki 23) | ✅ 55/55 |
| Panel tip kontrolü | ✅ | ✅ |
| Panel birim + arayüz testleri (Vitest) | ✅ 38/38 | ✅ 38/38 |
| Panel tarayıcı testleri (Playwright) | ✅ 8/8 (4 senaryo × masaüstü + mobil) | ✅ 8/8 |
| Panel bağımlılık güvenliği (`npm audit`) | ✅ 0 açık | ✅ (yüksek/kritik yok) |
| Gizli anahtar taraması | ✅ | ✅ |
| Mobil: `flutter analyze` | ✅ | ✅ |
| Mobil: `flutter test` | ✅ 21/21 | ✅ 21/21 |
| **Android** emülatörü, uçtan uca | — | ✅ 1/1 |
| **iOS** simülatörü, derleme + uçtan uca | — | ✅ 1/1 |
| Test APK'sı | — | ✅ |

### Test sırasında bulunup düzeltilenler
- **Güvenlik açığı olan geliştirme aracı:** Vitest 3'te bilinen kritik açıklar vardı → açıkları kapatan sürüme (5.0.5) geçildi.
- **Test yalıtımı:** veritabanı testleri aynı veritabanını paylaşıyordu → her test dosyası kendi temiz veritabanında koşuyor.
- **Yeni sunucu koruması eski bir test adımını engelledi:** test, sunucu işlemini kullanıcı oturumu açıkken yapıyordu. Koruma doğru çalışıyordu, test kurulumu düzeltildi.
- Arayüz: kullanıcı satırında rol seçicisinin taşması; site simgesi eksikliği.

## 4. Mobil uygulama
Mobil kodda değişiklik yok. Demo modu, canlı TV oynatıcısı, favoriler ve sohbet altyapısı çalışıyor. Android ve iOS uçtan uca testleri geçti.
Kategoriler artık veritabanında tablo; uygulama bilinmeyen kategoriyi zaten "Diğer" olarak gösteriyor.

## 5. Eksik kalanlar
| İş | Neden / bağımlılık |
|---|---|
| Panelin ve uygulamanın gerçek Supabase'e bağlanması | Ayrı Supabase hesabı (D4) |
| Yönetici hesapları için MFA zorunluluğu | Gerçek sunucuya geçişte |
| Yayın hakkı belge yükleme | Supabase Storage (D4) |
| Mobil uygulamanın ayarları/duyuruları/bakım modunu okuması | Sonraki geliştirme adımı |
| Panelin barındırılması | Barındırma yeri kararı (ücretsiz seçenekler var); canlıya dağıtım onaya bağlı |
| Gerçek reklam hesabı (AdMob) | Onay |
| Depoyu gizli yapma, ayrı depoya taşıma, Vercel önizleme derlemelerini durdurma | Onay (G1–G4) |
