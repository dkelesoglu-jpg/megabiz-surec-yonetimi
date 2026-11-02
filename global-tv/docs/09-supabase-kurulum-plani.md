# 09 — Supabase geliştirme ve test ortamı kurulum planı (2 Kasım 2026)

Durum: Global TV için **hiçbir Supabase hesabı, organizasyonu veya projesi açılmadı**.
Mevcut tek organizasyon "DK İK DANIŞMANLIK" (mega-hrms, vakit-rezervasyon). Bu organizasyona **dokunulmayacak**.

## 1. Gerçek sunucu provası — tamamlandı (hesapsız, ücretsiz)

Supabase'in kendi sunucu yazılımı (Postgres, kimlik, REST, Realtime, Storage) yerelde ve CI'da çalıştırıldı:

| Doğrulanan | Sonuç |
|---|---|
| 6 migration + demo veri gerçek Supabase Postgres imajında | ✅ hatasız |
| Sunucu güvenlik testleri (`supabase/remote-tests`) | ✅ **31/31**: kimlik, RLS, sohbet + Realtime, oda kilidi/yavaş mod, moderasyon, profil gizliliği, analitik, belge deposu, Edge Functions |
| Uygulamanın Supabase kodu (`app/test_remote`) | ✅ **8/8** (+1 gerçek projeye bırakıldı) |
| CI | Her gönderimde aynı testler GitHub Actions'ta gerçek yığınla çalışır |

### Bu provada bulunan ve düzeltilen hatalar
| Hata | Etkisi | Düzeltme |
|---|---|---|
| Yeni `sb_publishable_` anahtarı JWT değil; Edge Function JWT kontrolü varsayılan açık | Gerçek sunucuda **misafirler hiçbir kanalı izleyemeyecekti** (401) | `get-stream` için `verify_jwt = false`; kurallar fonksiyonun içinde uygulanıyor |
| Edge Functions eski `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` okuyordu | Supabase eski anahtarları **2026 sonunda kapatıyor**: betadan 11 gün sonra yayın ve hesap silme duracaktı | Yeni `SUPABASE_SECRET_KEYS` / `SUPABASE_PUBLISHABLE_KEYS` okunuyor, eskiler yalnızca yedek |

## 2. Hesap seçenekleri

| Seçenek | Bağımsızlık | Ücretsiz proje kotası | Öneri |
|---|---|---|---|
| **A. Proje e-postasıyla yeni Supabase hesabı + yeni ücretsiz organizasyon** | Tam: şirket hesaplarıyla hiçbir bağ yok | 2 ücretsiz proje (dev + staging) sıfırdan | ✅ **Önerilen** |
| B. Mevcut hesabınızla yeni ücretsiz organizasyon | Kısmi: aynı giriş | Ücretsiz kota kişi başına: mega-hrms aktif olduğu için **yalnızca 1 ücretsiz proje** kalır | Yalnızca geçici |
| C. Şirket organizasyonuna proje | Yok | — | ❌ Talimat gereği yapılmaz |

## 3. Kurulum adımları (A seçeneği)

| # | Adım | Kim | Onay | Süre |
|---|---|---|---|---|
| 1 | Proje e-postası (örn. Gmail; ileride alan adı e-postası) | Siz | **Gerekli** | 10 dk |
| 2 | Bu e-postayla supabase.com hesabı + **iki adımlı doğrulama** | Siz | **Gerekli** | 5 dk |
| 3 | Organizasyon: "Global TV" · plan: **Free** · kart eklenmez | Siz | **Gerekli** | 2 dk |
| 4 | Proje `globaltv-dev` · bölge **eu-central-1 (Frankfurt)** · güçlü veritabanı şifresi (parola yöneticisinde) | Siz | **Gerekli** | 3 dk |
| 5 | Bana verilecekler: proje referansı (URL) ve **yayınlanabilir anahtar**. Gizli anahtar sohbete yazılmaz; GitHub → Settings → Secrets bölümüne siz eklersiniz | Siz | — | 5 dk |
| 6 | Migration'lar ve demo veri: `supabase link` + `supabase db push`; Edge Functions dağıtımı | Ben | Sizin "başla" demeniz | 15 dk |
| 7 | Kimlik ayarları: e-posta doğrulama **açık**, şifre ≥ 8, yönlendirme `globaltv://login-callback`, oturum süresi | Ben | — | 10 dk |
| 8 | Güvenlik denetimi: Supabase Security Advisor + `remote-tests` gerçek projeye karşı (31 test) + `app/test_remote` | Ben | — | 15 dk |
| 9 | Test APK'sı `env/dev.json` ile gerçek sunucuya bağlanır; panel `.env.local` ile | Ben | — | 15 dk |
| 10 | Gerçek cihaz testleri ([10-gercek-cihaz-test-protokolu.md](10-gercek-cihaz-test-protokolu.md)) | Siz + ben | — | 1–2 saat |

Staging (`globaltv-staging`): beta öncesi, dev doğrulandıktan sonra aynı adımlarla açılır. Beta kullanıcıları staging'e bağlanır.

## 4. Gizli bilgilerin yönetimi
- Uygulama ve panelde **yalnızca yayınlanabilir anahtar** bulunur (zaten böyle).
- Gizli anahtar yalnızca iki yerde tutulur: GitHub Actions secrets ve Supabase Edge Functions ortamı. Depoya ve sohbete girmez.
- `remote-tests` şirket projelerinde (mega-hrms, vakit-rezervasyon) **çalışmayı reddeder**. Açık izin bayrağı olmadan da çalışmaz.

## 5. Bilinen sınırlar ve riskler
| Konu | Etki | Önlem |
|---|---|---|
| Ücretsiz projeler 7 gün az kullanımda **duraklatılır** (veri korunur, 90 gün içinde geri açılır) | Beta sırasında kesinti | Betada staging'i Pro'ya geçirmek (25 USD/ay, **onayınızla**) veya düzenli kullanım |
| Dahili e-posta servisi saatte çok az e-posta gönderir | Beta kayıt doğrulama e-postaları gecikir | Özel SMTP (ücretsiz katmanlı bir sağlayıcı; hesap açmak **onayınızla**) |
| Ücretsiz planda indirilebilir yedek yok | Veri kaybı riski (betada düşük) | Beta öncesi günlük `pg_dump` CI işi |
| Realtime soğuk başlangıç | Sunucu yeni başladığında ilk saniyelerde canlı mesaj kaçabilir (yerelde ölçüldü) | Gerçek sunucuda ölçülecek; tekrarlanırsa sohbet açılışında kısa bir gecikmeyle listeyi yeniden çekme eklenecek |
| `get-stream` ülke tespiti | CDN ülke başlığı yoksa uygulamanın bildirdiği ülke kullanılıyor: yurt dışındaki kullanıcı "TR" diyebilir (lisans ihlali riski) | globaltv-dev'de gelen başlıklar ölçülecek; gerekirse IP'den sunucu tarafı ülke tespiti — **beta öncesi zorunlu** |
| Bölge | Kişisel veri yurt dışında (AB) tutulur | KVKK m.9 yurt dışı aktarım yükümlülükleri: bkz. [11-beta-hazirlik.md](11-beta-hazirlik.md) §3 |

## 6. Geri dönüş
- Proje sorun çıkarırsa yeni proje açılır, aynı migration'lar uygulanır: şema tamamen koddadır.
- Uygulama, ortam dosyası boş bırakılınca **demo moduna** döner. Mevcut testler ve demo bu süreçten etkilenmez.
