# 4. Bağımsızlık ve Kurumsal Hesaba Geçiş Planı

Hazırlanma: 23 Ekim 2026 · Ürün sahibi kararı: Proje mevcut şirketlerden **tamamen bağımsız**
geliştirilecek; ileride ayrı bir şirket kurulacak, şu anda kurulmayacak. Şirket kuruluşu
yazılım geliştirmeyi **durdurmaz**. Ücretli her adım önceden onaya tabidir.

## 4.1 İlke: "Proje kimliği" şirketten ve kişiden ayrı tutulur

Tüm hesaplar, ileride kurulacak şirkete **devredilebilecek** şekilde, projeye özel bir kimlikle açılır:

| Varlık | Şu anki durum | Öneri | Ücret | Onay |
|---|---|---|---|---|
| Proje e-postası | Yok | Projeye özel yeni e-posta (ör. ücretsiz bir Gmail). Tüm hesaplar bununla açılır, şirkete devirde e-posta da devredilir | Ücretsiz | ✅ Gerekli (hesap açma) |
| Kaynak kod deposu | `megabiz-surec-yonetimi` deposunda `global-tv/` klasörü. **Depo herkese açık** → Global TV kodu ve test APK'ları şu an herkese açık | Projeye ait **özel (private)** yeni depo; geçmişiyle taşınır (aşağıda komut) | Ücretsiz | ✅ Gerekli |
| Supabase | Mevcut tek organizasyon **"DK İK DANIŞMANLIK"** (mevcut şirket). Global TV için orada **hiçbir proje açılmadı ve açılmayacak** | Proje e-postasıyla yeni Supabase hesabı + `globaltv` organizasyonu; içinde `globaltv-dev` ve `globaltv-staging` (ücretsiz plan) | Ücretsiz | ✅ Gerekli |
| Apple Developer | Yok | Karar bekliyor (bkz. 4.3 ve [06-beta-bagimliliklari.md](06-beta-bagimliliklari.md)) | 99 USD/yıl | ✅ Gerekli |
| Google Play Console | Yok | Karar bekliyor | 25 USD tek sefer | ✅ Gerekli |
| Alan adı (gizlilik politikası, destek e-postası) | Yok | Beta öncesi gerekli değil; gizlilik politikası ücretsiz barındırılabilir (GitHub Pages) | ~10–20 USD/yıl | ✅ Gerekli |
| Parolalar / anahtarlar | — | Projeye özel parola kasası (ör. Bitwarden ücretsiz); yükleme anahtarı + parolası burada | Ücretsiz | ✅ Gerekli |

> Not: Supabase ücretsiz planı, kullanıcı başına sınırlı sayıda aktif ücretsiz projeye izin verir.
> Mevcut hesabınızda zaten aktif proje(ler) var. Ayrı proje e-postasıyla açılacak yeni hesap hem
> bu sınırı hem de bağımsızlık gereğini aynı anda çözer.

### Hesap açılana kadar ne yapılıyor? (geliştirme durmuyor)

| İhtiyaç | Hesapsız çözüm (şu an çalışıyor) |
|---|---|
| Uygulamayı çalıştırma | **Demo modu**: sunucu yok, lisanslı test akışları |
| Veritabanı ve güvenlik kuralları | Migration'lar düz PostgreSQL'de otomatik test ediliyor (23 test, CI'da her değişiklikte) |
| Tam Supabase (giriş, sohbet) | Supabase CLI ile **yerel** Supabase (`supabase start`, Docker gerekir) — hesap gerekmez |
| Android cihaz testi | CI'ın ürettiği test APK'sı telefona doğrudan kurulur |
| iOS testi | CI'da iOS simülatörü (elle tetiklenir); Mac varsa ücretsiz Apple kimliğiyle kendi iPhone'unuza kurulum |

Ayrıntı: [05-cihaz-testi-rehberi.md](05-cihaz-testi-rehberi.md)

## 4.2 Kurumsal hesaba geçişe hazır teknik altyapı (yapıldı)

| Konu | Ne yapıldı | Geçişte ne değişir |
|---|---|---|
| Uygulama adı ve paket kimliği | Tek dosyada: `app/identity/AppIdentity.xcconfig` (Android + iOS ortak). Şimdilik **geçici**: `com.placeholder.globaltv` | Onaylanan değer bu dosyaya yazılır — tek satır |
| Canlı (prod) derleme kilidi | Geçici kimlikle veya imza anahtarı olmadan prod derlemesi **yapılamaz** | — |
| Ortam ayrımı | Android'de `dev` / `staging` / `prod` farklı paket kimliği ve ad (aynı telefonda yan yana) | — |
| iOS imza takımı | Depoya yazılmaz; `ios/Flutter/LocalSigning.xcconfig` (git dışı) | Bireysel takım kimliği → kurumsal takım kimliği: tek satır |
| Android imza | `android/key.properties` (git dışı) + yükleme anahtarı; Google Play App Signing kullanılacak | Yükleme anahtarı kaybolsa/değişse bile Google üzerinden sıfırlanabilir |
| Sunucu adresleri / anahtarlar | `env/<ortam>.json` (git dışı); kodda sabit değer yok | Yeni Supabase projesinin adresi bu dosyalara yazılır |
| Veritabanı | Tamamen migration dosyalarıyla kurulur | Yeni organizasyonda yeni proje → aynı migration'lar uygulanır; veri taşıma gerekmez (beta öncesi) |

## 4.3 Mağaza hesapları için seçenekler

Mağazada **paket kimliği ilk yüklemeden sonra değiştirilemez**; uygulama ise hesaplar arasında aktarılabilir.

| Seçenek | Açıklama | Artı | Eksi |
|---|---|---|---|
| **A. Şimdi bireysel hesap, sonra şirkete aktarım** | Apple (bireysel) + Google Play (kişisel) hesabı ürün sahibinin adına açılır | Beta tarihini korur; Apple bireysel kayıt genelde 1–2 gün | Mağazada geliştirici adı olarak kişi adı görünür. Şirkete geçişte uygulama aktarımı veya hesap türü dönüşümü gerekir (Apple ve Google bunu destekler; Apple'da bazı koşullar ve geçici kısıtlar vardır). Google'ın yeni kişisel hesaplarında üretime çıkmadan önce **12 test kullanıcısı × 14 gün kapalı test** şartı var (beta ile zaten karşılanır) |
| **B. Şirket kurulana kadar mağaza yok** | Android beta mağazasız (APK); iOS beta yalnızca Mac'e bağlı cihazlarda | Ücretsiz; aktarım işi yok | iOS'ta geniş beta **yapılamaz**; 20 Aralık beta yalnızca Android + sınırlı iOS olur |
| **C. Şirket + kurumsal hesap** | Şirket kuruluşu + D-U-N-S (1–2 hafta+) + Apple kurumsal kayıt | En temiz yapı | 20 Aralık'a yetişmesi çok riskli |

**Öneri:** Beta tarihi kritikse **A** (önce yalnızca Apple bireysel, Google Play'i şirket kurulunca da açabiliriz — Android betası mağazasız yapılabilir). Bağımsızlık ve isim görünürlüğü öncelikliyse **B**. Karar ve son tarih: [06-beta-bagimliliklari.md](06-beta-bagimliliklari.md).

## 4.4 Kodu ayrı depoya taşıma (onayla, ücretsiz)

Geçmişi koruyarak yalnızca `global-tv/` klasörünü yeni depoya taşır:

```bash
cd megabiz-surec-yonetimi
git subtree split --prefix=global-tv -b global-tv-only
# Yeni özel depo oluşturulduktan sonra:
git push https://github.com/<proje-hesabi>/global-tv.git global-tv-only:main
```

Taşımadan sonra `.github/workflows/global-tv-ci.yml` yeni depoya kopyalanır (yollar `global-tv/` öneki olmadan güncellenir)
ve bu depodaki `global-tv/` klasörü kaldırılır. Özel depoda GitHub Actions ücretsiz planda aylık dakika kotasıyla çalışır;
macOS (iOS) işleri kotayı 10 kat hızlı tüketir, bu yüzden iOS işi elle tetiklenecek şekilde ayarlandı.
