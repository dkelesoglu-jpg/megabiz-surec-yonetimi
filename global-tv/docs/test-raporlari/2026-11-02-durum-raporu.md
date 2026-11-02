# Rapor — 2 Kasım 2026: GitHub, Supabase, cihaz testleri, beta hazırlığı

Dal: `claude/global-tv-baslangic` · Ana dala birleştirme, canlıya dağıtım, veri silme ve ücretli işlem **yok**.
Şirket projelerinde değişiklik **yok**. Yeni hesap, organizasyon veya proje **yok**.
Marka adı ve paket kimliği **değişmedi**.

## 1. GitHub
| Kontrol | Durum |
|---|---|
| Depo görünürlüğü | ⚠️ **Hâlâ herkese açık**. Adımlar aşağıda; değişikliği yalnızca siz yapabilirsiniz |
| Commit geçmişi ve dallar | ✅ Korunuyor: 8 dal; Global TV dalı temiz ve gönderildi |
| Test APK'ları | ⚠️ 28 Ekim raporunda uyarıldığı gibi `apk-7…12`, **30 Ekim**'de GitHub tarafından kendiliğinden silindi. Güncel `apk-14…19` **4 Kasım**'da, `apk-1…6` **22 Kasım**'da silinecek. Bu oturumun ağ politikası indirme sunucusunu engellediği için kopyalayamadım |
| APK koruma önlemi | ✅ Elle tetiklenen (cihaz testli) sürüm adaylarının APK'ları artık **30 gün** saklanıyor; bu aşamanın APK'sı da öyle üretildi |
| Vercel | ✅ Global TV gönderimleri Megabiz projesinde derleme başlatmıyor (doğrulandı). Not: `docs/aralik-urun-raporu` dalı ("Aralık" ürünü) Megabiz projesinde önizleme başlatıyor. Bu dal Global TV'nin değil, dokunulmadı |
| Mega HRMS ve diğer projeler | ✅ Bağlantılarına dokunulmadı |

### Depoyu gizli yapma adımları (yaklaşık 3 dakika)
1. **Erişim kontrolü:** https://github.com/settings/installations sayfasında **Vercel** ve **Claude** satırlarında *Configure*'a basın. "Repository access" bölümünde *All repositories* seçili olmalı veya `megabiz-surec-yonetimi` listede bulunmalı.
2. **Görünürlük:** https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/settings sayfasının en altında *Danger Zone → Change repository visibility → Change visibility → Change to private* yolunu izleyin. Onaylayın; istenirse depo adını yazın ve doğrulama yapın.
3. **Bana "private yapıldı" yazın.** Ben şunları doğrularım:
   - gönderim çalışıyor mu,
   - CI'ın tamamı yeşil mi,
   - Vercel'de Megabiz'in son üretim yayını "Ready" mi,
   - APK'lar duruyor mu.

**Etki:** Commit'ler, dallar ve APK'lar silinmez. Actions aylık 2.000 dk / 500 MB ücretsiz kotaya girer; ödeme yöntemi yoksa ücret çıkmaz. **Geri alma:** aynı ekrandan *Change to public*.

## 2. Supabase: gerçek sunucu provası (hesapsız, ücretsiz)
Supabase'in kendi sunucu yazılımı bu ortamda ve CI'da çalıştırıldı. Ayrıntı: [../09-supabase-kurulum-plani.md](../09-supabase-kurulum-plani.md)

| Test | Sonuç |
|---|---|
| 6 migration + demo veri, gerçek Supabase Postgres imajında | ✅ hatasız |
| Sunucu güvenlik testleri, yeni (`remote-tests`) | ✅ **31/31**: kayıt/giriş, kanal hakları, profil gizliliği, sohbet + Realtime, engelleme, şikâyet, oda kilidi, yavaş mod, gizleme, susturma, anonim analitik, k-anonim rapor, belge deposu, denetim kaydı, yayın adresi fonksiyonu, hesap silme fonksiyonu |
| Uygulamanın kendi Supabase kodu, yeni (`app/test_remote`) | ✅ **8/8** |
| CI'da gerçek Supabase yığını işi (her gönderimde) | ✅ ilk çalışmada geçti |

### Prova sayesinde gerçek sunucuya geçmeden bulunan hatalar
| Hata | Etkisi olacaktı | Durum |
|---|---|---|
| Yeni `sb_publishable_` anahtarı JWT değil; yayın adresi fonksiyonunda JWT kontrolü açıktı | **Misafirler hiçbir kanalı izleyemeyecekti** | ✅ Düzeltildi ve test edildi |
| Edge Functions eski anahtarları okuyordu; Supabase bunları 2026 sonunda kapatıyor | Betadan ~11 gün sonra yayın ve hesap silme duracaktı | ✅ Yeni anahtarlara geçildi (eskiler yedek); yalnızca yeni anahtarlarla test edildi |
| Yayın adresi fonksiyonu, CDN ülke başlığı yoksa uygulamanın bildirdiği ülkeye güveniyor | Yurt dışından TR yayınına erişim (lisans riski) | ⏳ Gerçek projede ölçülüp düzeltilecek (P0) |
| Realtime soğuk başlangıçta ilk saniyelerde olay kaçırabiliyor | Sunucu yeni açıldığında bir mesaj canlı görünmeyebilir | ⏳ Gerçek projede ölçülecek |

### Hesap açma: onay bekleniyor
Önerim **A seçeneği**:
- Proje e-postası açılır.
- Bu e-postayla yeni Supabase hesabı ve ücretsiz organizasyon kurulur, kart eklenmez.
- `globaltv-dev` projesi Frankfurt bölgesinde açılır.

Adımlar ve kimin ne yapacağı 09 belgesinin 3. bölümünde. Şirket organizasyonuna proje **açılmaz**. Mevcut hesabınızla açılırsa ücretsiz kota mega-hrms nedeniyle 1 projeyle sınırlı kalır.

## 3. Gerçek cihaz testleri
Protokol: [../10-gercek-cihaz-test-protokolu.md](../10-gercek-cihaz-test-protokolu.md)
- 38 senaryo: canlı TV, favoriler, giriş/hesap, sohbet, moderasyon, gizlilik, dil/erişilebilirlik.
- Her senaryo Android ve iPhone'da yapılır; sonuçlar kayıt şablonuna işlenir.
- **Hiçbir özellik henüz gerçek cihazda doğrulanmadı. Hepsi "tamamlanmadı" sayılır.**
- Emülatör ve simülatör sonuçları yalnızca ön kontroldür.
- Bugün demo APK ile yapılabilecek ilk tur: yaklaşık 30 dk (10 §5).

## 4. Beta hazırlığı
Ayrıntı: [../11-beta-hazirlik.md](../11-beta-hazirlik.md)

**P0 (beta için zorunlu):**
- Gerçek sunucu ve gerçek cihaz testleri
- Sunucu tarafı ülke tespiti
- Şifre sıfırlama
- Uygunsuz içerik filtresi
- Oynatıcıda otomatik yeniden bağlanma
- Gizlilik ve hukuki belgeler
- RTÜK/KVKK değerlendirmesi

P0 geliştirme toplamı yaklaşık 4,5 gün; 15 Aralık kod dondurmasına göre süre yeterli.

## 5. Test sonuçları (bu aşama)
| Alan | Sonuç |
|---|---|
| Veritabanı kuralları (yerel Postgres) | ✅ 105/105 |
| Gerçek Supabase yığını: sunucu testleri | ✅ 31/31 (yerel) · ✅ CI |
| Gerçek Supabase yığını: uygulama depoları | ✅ 8/8 (yerel) · ✅ CI |
| Mobil analiz + birim/arayüz | ✅ temiz · 48/48 |
| Yönetim paneli birim/arayüz | ✅ 63/63 |
| Android emülatörü, uçtan uca | ANDROID_SONUC |
| iOS simülatörü, derleme + uçtan uca | IOS_SONUC |
| Test APK'sı (30 gün saklanır) | APK_SONUC |
| Panel tarayıcı testleri | PANEL_E2E |

**CI'da bulunan ve düzeltilen:**
- GitHub `ubuntu-latest`'i Ubuntu 26.04'e geçirdi; panelin tarayıcı testleri bu yüzden kuruluma bile başlayamadı (Playwright desteklemiyor). Panel işi `ubuntu-24.04`'e sabitlendi.
- Yeni test dosyasında gereksiz bir içe aktarma analiz uyarısı veriyordu; düzeltildi.

## 6. Riskler
| Risk | Etki | Önlem / karar |
|---|---|---|
| Depo hâlâ herkese açık | Kod ve APK'lar herkese açık | Siz: §1 adımları |
| APK'lar süre dolunca siliniyor | Eski sürümler kaybolur (kod geçmişi korunuyor, her sürüm yeniden derlenebilir) | Sürüm adayları artık 30 gün saklanıyor |
| Supabase hesabı gecikirse | Gerçek giriş/sohbet cihaz testi kısalır (D4: 7 Kasım) | A seçeneği onayı |
| **RTÜK lisansı** (yalnızca şirkete veriliyor) | Türkiye'de TV yayını sunumu lisansa tabi olabilir | Karar + hukukçu (11 §3) |
| **KVKK yurt dışı aktarım** | AB'deki sunucuya gerçek kullanıcı verisi | Gerçek kullanıcı verisi öncesi standart sözleşme + 5 iş günü bildirim (hukukçu) |
| Ülke tespiti istemciye güveniyor | Lisans ihlali | P0, gerçek projede |
| Ücretsiz Supabase 7 gün hareketsizlikte duraklar | Beta kesintisi | Betada staging Pro (25 USD/ay, onayınızla) veya düzenli kullanım |
| Apple hesabı kararı | 24 Kasım'dan sonra iOS betası yetişmez | Karar |

## 7. Sizden beklenen kararlar
1. Depoyu gizli yapın (§1, 3 adım) ve bana haber verin.
2. Saklamak istediğiniz APK'ları 4 Kasım'dan önce indirin (Actions → çalışma 19 → Artifacts).
3. Supabase **A seçeneği** onayı: proje e-postası + yeni ücretsiz hesap + `globaltv-dev`.
4. Veri sorumlusu ve şirket kuruluş zamanı (RTÜK/KVKK için).
5. RTÜK ve KVKK için hukukçuya danışılacak mı? Beta yalnızca test/açık lisanslı içerikle mi yapılacak?
6. Apple hesabı: bireysel / kurumsal / iOS betası ertelensin (son tarih 24 Kasım).
7. P0 geliştirme sırası (önerim: şifre sıfırlama → otomatik yeniden bağlanma → içerik filtresi → ülke tespiti → hukuki taslaklar).
8. İlk gerçek cihaz turu (demo APK, ~30 dk, 10 §5).

## Kaynaklar (mevzuat bilgisi için; hukuki görüş değildir)
- [Mondaq: Turkey regulates broadcasting services provided through the internet](https://www.mondaq.com/turkey/broadcasting-film-tv-radio/687420/turkey-regulates-broadcasting-services-provided-through-the-internet)
- [Gün + Partners: RTÜK'ün yetkisi internet yayınlarına genişledi](https://gun.av.tr/insights/updates/rtuk-s-supervising-and-monitoring-authority-extended-to-internet-broadcasts)
- [KVKK: Yurt dışı aktarımda standart sözleşmeler duyurusu](https://www.kvkk.gov.tr/Icerik/8170/Yurt-Disina-Kisisel-Veri-Aktariminda-Kullanilacak-Standart-Sozlesmelerde-Dikkat-Edilmesi-Gereken-Hususlara-Iliskin-Kamuoyu-Duyurusu)
- [Supabase: Yeni API anahtarlarına geçiş](https://supabase.com/docs/guides/getting-started/migrating-to-new-api-keys) · [Ücretsiz proje duraklatma](https://supabase.com/docs/guides/platform/free-project-pausing)
