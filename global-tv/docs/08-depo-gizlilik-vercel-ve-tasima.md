# 08 — Depoyu gizli yapma, Vercel bağlantıları ve ayrı depoya taşıma (28 Ekim 2026)

Bu belge salt okunur kontrollere dayanır. Silme, taşıma veya hesap açma işlemi **yapılmadı**.
Yapılan tek değişiklik, Global TV dalına eklenen ve geri alınabilir bir `vercel.json` dosyasıdır (§2.3).

## 1. Depoyu gizli (private) yapma

### 1.1 Mevcut durum
| Kontrol | Sonuç |
|---|---|
| `dkelesoglu-jpg/megabiz-surec-yonetimi` | **Herkese açık** (public). Varsayılan dal `main` |
| Hesabınızdaki diğer depo | `mega-hrms-professional`: zaten gizli |
| Dallar | `main`, `claude/global-tv-baslangic`, `claude/supabase-leave-management-wcgb03`, `mega-hrms-v86-backup`, `release/mega-hrms-v86-secure`, `security/tenant-isolation-v86`, `arena/019ffb84-…` |

### 1.2 Etkiler
| Bağlantı | Gizli olunca ne olur | Risk |
|---|---|---|
| **GitHub Actions (Global TV CI)** | Ücretsiz planda aylık **2.000 dakika** ve **500 MB** depolama kotasına girer. Ödeme yöntemi tanımlı değilse ücret çıkmaz; kota dolarsa iş akışları ay sonuna kadar durur | Düşük. Aşağıdaki hesaba bakın |
| Actions dakika tüketimi (ölçülen) | Her kod gönderimi yaklaşık **12 dk** (Linux). Cihaz testi tetiklemesi: Android 9 dk + **iOS 11 dk × 10 (macOS çarpanı) = 110 dk**; toplam yaklaşık **130 dk** | Ayda ~60 gönderim + ~6 cihaz testi kotaya sığar. iOS testi haftada 1–2 kez çalıştırılmalı |
| Actions depolama | 12 test APK'sı × 26,8 MB = **322 MB** (kota 500 MB) | Orta. Yeni APK'lar 7 gün saklanır, eskiler kendiliğinden silinir; tavan ~15 APK |
| **Vercel** (`megabiz-surec-yonetimi` projesi) | Kişisel hesaptaki gizli depolardan derleme desteklenir. Vercel GitHub uygulamasının depoya erişimi sürmelidir | Düşük. Adım 1'de kontrol edilir |
| Vercel Hobby kuralı | Gizli depoda, commit yazarı hesap sahibi olmayan gönderimler Vercel'de **engellenebilir** (BLOCKED). Global TV commit'lerinin yazarı "Claude" | Yok: Global TV dalı için Vercel derlemesi zaten kapatıldı (§2.3). `main` commit'leri sizin adınızla olduğu sürece Megabiz etkilenmez |
| **Claude GitHub uygulaması** | Bu oturum gizli depoya uygulama yetkisiyle erişir; gönderim ve CI izleme sürer | Düşük. Adım 1'de erişim listesi kontrol edilir |
| Herkese açık API ile okuma | Kimliksiz erişim (dış bağlantılar, rozetler, README'deki ham dosya linkleri) çalışmaz | Bilinen bir kullanım yok |
| Çatallar (fork) | Çatal yok (0) | — |

### 1.3 ⚠️ Eski test APK'ları için önemli not
"Eski APK'ları silme" talimatı gereği hiçbir APK silinmedi. Ancak GitHub, APK'ları süreleri dolunca **kendiliğinden** siler:
- `apk-7` … `apk-12` (6 adet) → **30 Ekim 2026**
- `apk-1` … `apk-6` (6 adet) → **22 Kasım 2026**

Bu süre, ilk denetimde APK'ların herkese açık kalma süresini kısaltmak için 7 güne indirilmişti. Mevcut APK'ların süresi uzatılamaz.
Saklamak istediğiniz APK'lar varsa bu tarihlerden önce Actions → ilgili çalışma → **Artifacts** bölümünden indirin.
Tümü aynı demo verisiyle derlendiği için yalnızca en yenisi (`apk-12` ve bu aşamanın yeni APK'sı) test için yeterlidir.

### 1.4 Sizin yapmanız gereken adımlar
Bu işlem yalnızca depo sahibi tarafından GitHub ekranından yapılabilir. Benim araçlarımda depo ayarı değiştirme yetkisi yok.

**Adım 1 — Bağlı uygulamaların erişimini kontrol edin (1 dk)**
1. https://github.com/settings/installations adresini açın.
2. **Vercel** satırında **Configure**'a basın. "Repository access" bölümünde **All repositories** seçili olmalı veya listede `megabiz-surec-yonetimi` bulunmalı. Değişiklik gerekmiyorsa çıkın.
3. **Claude** satırı için de aynı kontrolü yapın.

**Adım 2 — Görünürlüğü değiştirin (1 dk)**
1. https://github.com/dkelesoglu-jpg/megabiz-surec-yonetimi/settings adresini açın.
2. Sayfanın en altındaki **Danger Zone** bölümünde **Change repository visibility** → **Change visibility** → **Change to private**'ı seçin.
3. Uyarıları onaylayın, istenirse depo adını yazın ve şifre veya iki adımlı doğrulamayı girin.

**Adım 3 — Bana "private yapıldı" yazın.** Ben şunları doğrularım:
- deponun gizli göründüğünü,
- Global TV dalına gönderim yapabildiğimi,
- CI'ın çalıştığını,
- Vercel'de `main` için son üretim yayınının hâlâ "Ready" olduğunu.

**Geri alma:** Aynı ekrandan **Change to public**. Not: Gizliyken verilen yıldız ve izleyiciler gizliliğe geçişte sıfırlanır; bu depoda yıldız ve izleyici yok.

## 2. Vercel bağlantıları

### 2.1 Projeler (Vercel hesabı `denizkelesoglu`; yalnızca okundu)
| Proje | Bağlı depo | Alan adları | Global TV'den etkileniyor mu? |
|---|---|---|---|
| **mega-hrms** | Bu depo **değil** | `megahr.com.tr`, `www.megahr.com.tr`, `mega-hrms.vercel.app` | **Hayır** |
| **megabiz-surec-yonetimi** | **Bu depo** (`main` = üretim) | `megabiz-surec-yonetimi.vercel.app` | **Evet**: her Global TV gönderimi bir *Preview* derlemesi başlatıyordu |
| 300-asistan | Bu depo değil | `300-asistan.vercel.app` | Hayır |
| vakit-rezervasyon | Bu depo değil | — | Hayır |

### 2.2 Ölçülen etki
- 23 Ekim'de Global TV dalındaki 9 gönderimin her biri `megabiz-surec-yonetimi` projesinde bir Preview derlemesi açtı.
- Bu derlemeler **üretimi etkilemedi**: hedef "Preview" idi; `main` ve alan adı değişmedi.
- Ancak bu derlemeler Megabiz uygulamasının kodunu gereksiz yere derleyerek Vercel derleme süresi harcadı ve proje geçmişini kalabalıklaştırdı.

### 2.3 Yapılan değişiklik (yalnızca Global TV dalı)
`claude/global-tv-baslangic` dalının köküne şu dosya eklendi (commit `67278a7`):
```json
{ "git": { "deploymentEnabled": { "claude/global-tv-baslangic": false } } }
```
- Vercel bu dosyayı yalnızca **o dalın** commit'lerinde okur. `main` ve diğer dallarda `vercel.json` yok; Megabiz ve Mega HRMS yayınları, alan adları ve proje ayarları **değişmedi**.
- **Doğrulama:** Önceki gönderimlerde Vercel derlemesi yaklaşık 12 saniyede başlıyordu. `67278a7` gönderiminden sonra 90 saniye boyunca yeni derleme veya durum kaydı oluşmadı. Sonraki gönderimlerde de kontrol edilecek.
- **Geri alma:** dosyayı silmek yeterli.
- Vercel proje ayarlarına ve alan adlarına **dokunulmadı**. Silme işlemi yapılmadı.

### 2.4 Kalıcı çözüm
Global TV ayrı depoya taşındığında (§3) Megabiz projesiyle hiçbir bağı kalmaz; o zaman bu dosyaya da gerek kalmaz.
Global TV yönetim paneli için ileride ayrı bir Vercel projesi açılması, barındırma kararına ve **onayınıza** bağlıdır.

## 3. Ayrı ve gizli depoya taşıma planı

### 3.1 Hedef
- Global TV'ye ait **tüm commit geçmişi** (tarih, yazar, mesaj), CI iş akışı, testler ve belgeler korunur.
- Megabiz dosyaları yeni depoya **taşınmaz**.

### 3.2 Yöntem (kuru çalıştırmayla doğrulandı)
`git filter-repo` ile yalnızca `global-tv/` ve `.github/workflows/global-tv-ci.yml` yolları ayrıştırılır. Klasör yapısı aynı kaldığı için CI dosyası **değiştirilmeden** çalışır.

| Kuru çalıştırma sonucu (28 Ekim) | |
|---|---|
| Aktarılan commit | **9** (Global TV'nin tamamı; yalnızca Vercel dosyası commit'i boş kaldığı için düştü) |
| Dosya ağacı | Kaynak daldaki Global TV dosyalarıyla **birebir aynı** (197 dosya, içerik özetleri karşılaştırıldı) |
| Megabiz dosyası | **0** |
| Eski → yeni commit eşlemesi | `filter-repo/commit-map` dosyasında tutulur (raporlardaki eski commit numaraları izlenebilir) |

### 3.3 Adımlar
| # | Adım | Kim | Onay |
|---|---|---|---|
| 1 | Hesap kararı: (a) mevcut kişisel GitHub hesabında yeni gizli depo **veya** (b) projeye özel e-postayla yeni ücretsiz GitHub hesabı ya da organizasyonu | Siz | **Gerekli** (dış kayıt) |
| 2 | Boş gizli depo oluşturma (önerilen ad: `global-tv`; README eklenmeden) | Siz veya ben (onayla) | **Gerekli** |
| 3 | Yedek: eski deponun tam kopyası `git bundle create megabiz-yedek.bundle --all` ile alınır ve sizin bilgisayarınızda saklanır | Ben hazırlarım, siz indirirsiniz | — |
| 4 | Ayrıştırma (§3.2) ve yeni depoya `main` + `develop` olarak gönderim | Ben | — |
| 5 | Claude GitHub uygulamasına yeni depo erişimi verilmesi | Siz (Settings → Installations) | — |
| 6 | Doğrulama: CI'ın tamamı yeşil, Android ve iOS cihaz testleri yeşil, commit sayısı ve dosya özetleri eşleşiyor, test APK'sı kuruluyor | Ben | — |
| 7 | Eski depoda geçiş notu (`global-tv/TASINDI.md`); eski dal bir süre **silinmeden** kalır | Ben | — |
| 8 | En az 2 hafta sonra eski depodaki Global TV dalının kaldırılması | Siz | **Gerekli** (silme) |

### 3.4 Geri dönüş yöntemi
- **4.–6. adımlar** eski depoya dokunmaz. Doğrulama başarısız olursa yeni depo kullanılmaz; çalışma eski dalda kaldığı yerden sürer.
- **7. adım** sonrası: eski dal ve yedek paket (`.bundle`) korunduğu için `git clone megabiz-yedek.bundle` ile depo tüm dallarıyla geri kurulabilir.
- Yeni depo, GitHub "Transfer ownership" ile ileride kurulacak şirket organizasyonuna geçmiş, sorunlar (issue) ve Actions ayarlarıyla birlikte taşınabilir. Eski adres otomatik yönlendirilir.

### 3.5 Projeye özel e-posta ve Supabase
| İş | Not | Onay |
|---|---|---|
| Proje e-postası | Ücretsiz bir adres (örn. Gmail) veya alan adı alındıktan sonra alan adı e-postası. GitHub, Supabase, Apple ve Google hesapları bu adresle açılır | **Gerekli** (dış kayıt) |
| Supabase geliştirme ve test | Proje e-postasıyla yeni Supabase hesabı ve **ücretsiz** planda "globaltv-dev" projesi. Mevcut "DK İK DANIŞMANLIK" organizasyonuna **proje açılmaz** | **Gerekli** (hesap ve organizasyon oluşturma) |
| Bağlantı | Migration'lar `supabase db push` ile uygulanır; anahtarlar yalnızca `env/dev.json` ve CI gizli değişkenlerinde tutulur (depoya girmez) | — |
