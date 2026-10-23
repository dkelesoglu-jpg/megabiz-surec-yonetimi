# 7. GitHub Güvenlik Denetimi ve Depoyu Gizli Yapma Planı

Tarih: 23 Ekim 2026 · Depo: `dkelesoglu-jpg/megabiz-surec-yonetimi` (**herkese açık**)
Durum: Denetim tamamlandı. **Depoda hiçbir erişim, silme veya taşıma değişikliği yapılmadı.**

## 7.1 Kapsam

| Taranan | Ayrıntı |
|---|---|
| Dallar | 7 dalın tamamı: `main`, `claude/global-tv-baslangic`, `claude/supabase-leave-management-wcgb03`, `arena/019ffb84-…`, `mega-hrms-v86-backup`, `release/mega-hrms-v86-secure`, `security/tenant-isolation-v86` |
| Geçmiş | Tüm commitler (silinmiş/değiştirilmiş dosyalar dahil) |
| Arşiv | `pixel-perfect-design-implementation (3).zip` içindeki 36 dosya |
| Araçlar | gitleaks 8.24.3 (yaklaşık 150 kural) + hedefli elle tarama |

## 7.2 Bulgular

| # | Kontrol | Sonuç |
|---|---|---|
| 1 | API anahtarı / erişim bilgisi (gitleaks, tüm geçmiş + zip) | ✅ **Bulgu yok** |
| 2 | Supabase anahtarları (JWT `eyJ…`, `sb_publishable_…`, `sb_secret_…`), proje adresleri (`*.supabase.co`) | ✅ Yok. Yalnızca değişken adları ve şablonlar (`your-project.supabase.co`) |
| 3 | `service_role` | ✅ Yalnızca açıklama metinleri ve test rolleri; gerçek anahtar yok |
| 4 | Özel anahtar (`PRIVATE KEY`), AWS/Google/GitHub/Stripe/Slack anahtarları, parola atamaları | ✅ Yok |
| 5 | İmza dosyaları (`.jks`, `.keystore`, `.p12`, `.mobileprovision`, `key.properties`), `.env` | ✅ Yok. Yalnızca şablon `key.properties.example` (boş) |
| 6 | Bulut hesap kimlikleri | ✅ Yalnızca yer tutucular (`SITE_CREATOR_PLACEHOLDER_DATABASE_ID`, `globaltv-local`) |
| 7 | Kişisel veri: Megabiz örnek verisinde 12 kişi adı + `@megabiz.com` e-posta + telefon (`+90 532 000 0001…`) | ⚠️ **Sahte demo verisine benziyor** (yaygın örnek isimler, sıralı numaralar). **Gerçek kişi olmadığını ürün sahibi teyit etmeli** |
| 8 | Ticari açıdan hassas içerik | ⚠️ Şirket projelerinin kaynak kodu ve güvenlik tasarımı (`security/tenant-isolation-v86`, HRMS dalları) herkese açık |
| 9 | Global TV test APK'ları | ⚠️ 6 APK (her biri 26,8 MB) Actions artefaktı olarak duruyor; depo açık olduğu için GitHub'a giriş yapmış herkes indirebilir |
| 10 | **Vercel bağlantısı** | ⚠️ Depo, şirketinize ait Vercel projesine (`megabiz-surec-yonetimi`) bağlı. Global TV dalına yapılan **her gönderim orada bir Preview derlemesi tetikliyor** (23 Ekim'de 5 adet). Bunlar canlı ortam değil ve Megabiz uygulamasını derliyor |

**Sonuç:** Sızmış bir gizli anahtar veya imza dosyası yok. **Anahtar yenileme (rotation) gerekmiyor.**
Bulunan riskler gizlilik ve bağımsızlıkla ilgili; depoyu gizli yapmak ve Global TV'yi ayrı depoya taşımak bunları kapatır.

> Not: Depo bugüne kadar herkese açık olduğu için içeriği başkaları tarafından kopyalanmış olabilir. Depoyu gizli yapmak
> geçmişte görülmüş içeriği geri almaz. Gizli anahtar bulunmadığı için bunun pratik bir güvenlik etkisi yok.

## 7.3 Depoyu gizli yapmanın etkileri

| Sistem | Etki | Önlem |
|---|---|---|
| **GitHub Actions (Global TV CI)** | Gizli depolarda ücretsiz plan kotası: **ayda 2.000 dakika, 500 MB depolama**. Kota dolarsa işler durur. Ödeme yöntemi tanımlı değilse **ücret çıkmaz**. Tahmini kullanım: gönderim başına ~8 dk (Linux); Android emülatör testi ~7 dk; **iOS simülatör testi ~10 dk × 10 katsayı = ~100 dk** | iOS testi zaten elle tetikleniyor (ayda en fazla 4–6 kez). Artefakt saklama süresi 30 → **7 gün** indirildi (aşağıda) |
| **Actions artefaktları** | Mevcut 6 APK = 161 MB, 22 Kasım'a kadar duruyor; 500 MB kotasına sayılır | Saklama 7 güne indirildi. Eski APK'ların silinmesi **onayınıza bağlı** |
| **Vercel (Megabiz projesi)** | Hobby planda **kişisel hesaba ait** gizli depolar desteklenir; derlemeler devam eder. (Kuruluşa ait gizli depolar için Pro gerekir; bu depo kişisel hesapta) | Değişiklik gerekmez. Vercel GitHub uygulamasının depo erişimi sürer |
| **Claude GitHub uygulaması / bu oturum** | Etkilenmez (uygulama kurulumuyla erişir) | — |
| **Yerel klonlar** | Etkilenmez; gizli depoya erişim için GitHub girişi gerekir | — |
| Herkese açık bağlantılar | Depo, dosya ve APK bağlantıları yalnızca yetkili kişilere açılır | Test APK'sını paylaşacağınız kişiler depoya eklenmeli veya APK ayrı yoldan iletilmeli |
| Yıldız / izleyici / fork | 0 fork, 0 yıldız → kaybedilecek bir şey yok | — |
| Wiki | Açık; içerik varsa o da gizlenir | — |

**Değerlendirme: Depoyu gizli yapmak güvenli.** Kırılan bir sistem beklenmiyor. Tek dikkat noktası Actions kotası;
yukarıdaki önlemlerle kotanın altında kalınır.

## 7.4 Adımlar (onayınızla — sizin yapmanız gereken)

Görünürlük değişikliği yalnızca depo sahibi tarafından GitHub arayüzünden yapılabilir:

1. GitHub → `dkelesoglu-jpg/megabiz-surec-yonetimi` → **Settings** → **General**
2. En alttaki **Danger Zone** → **Change repository visibility** → **Change to private**
3. Uyarıları okuyup onaylayın (depo adını yazmanız istenir)
4. Bana "gizli yapıldı" yazın. Şunları doğrulayacağım: CI'ın çalıştığını (bir sonraki gönderimde), Vercel durumunun gelmeye devam ettiğini, artefaktların erişilebilir olduğunu
5. Geri alma: Aynı menüden **Change to public** (gerekirse)

### Ayrıca onay bekleyen ilgili işlemler
| # | İşlem | Etkisi | Geri alınabilir mi? |
|---|---|---|---|
| G1 | Depoyu gizli yapmak (yukarıdaki adımlar) | Kod ve APK'lar yalnızca yetkililere görünür | Evet |
| G2 | Eski 6 test APK'sını silmek | Herkese açık APK'lar kalkar, kota boşalır | Hayır (yeni APK her gönderimde üretilir) |
| G3 | Global TV dalının Vercel Preview derlemelerini durdurmak: dala `vercel.json` (`git.deploymentEnabled: {"claude/global-tv-baslangic": false}`) eklemek | Global TV gönderimleri şirket Vercel projenizde derleme başlatmaz. Diğer dallar etkilenmez | Evet (dosya silinir) |
| G4 | Global TV'yi geçmişiyle ayrı **gizli** depoya taşımak (bkz. 04 §4.4) | Tam bağımsızlık; G3 sorunu kalıcı olarak çözülür | Evet |
| G5 | Örnek verideki 12 kişinin gerçek olmadığını teyit | Gerçekse KVKK açısından geçmişten temizleme gerekir (geçmişi yeniden yazmak ayrı onay ister) | — |

## 7.5 Bu denetimle birlikte yapılan önleyici değişiklikler (yalnızca Global TV dalında)
- CI'a **gizli anahtar taraması** (gitleaks) eklendi: Global TV klasöründe anahtar bulunursa CI kırmızı olur
- Test APK'larının saklama süresi 30 günden **7 güne** indirildi
