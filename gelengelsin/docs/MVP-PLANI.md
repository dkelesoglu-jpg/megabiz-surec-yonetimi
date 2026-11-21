# GelenGelsin: Canlı MVP planı

> "Ben gidiyorum, gelen gelsin." · Planlanan alan adı: gelengelsin.net · Pilot: İstanbul, 18+

Bu belge, tıklanabilir prototipteki kuralların canlı sürüme nasıl taşınacağını anlatır.
Prototipteki kural motoru (`src/domain/engine.ts`) canlıdaki sunucu fonksiyonlarıyla
birebir aynı kuralları uygular. SQL taslağı: [`supabase-taslak.sql`](./supabase-taslak.sql).

## 1. Altyapı önerisi: Supabase (Auth + Postgres + Realtime)

| İhtiyaç | Supabase karşılığı | Neden uygun |
|---|---|---|
| Giriş | Auth (telefon OTP veya e-posta magic link, Apple/Google) | Şifresiz giriş, mobilde kolay |
| Plan, istek, şikâyet verisi | Postgres + RLS | Yetki kuralları veritabanında; istemci atlatamaz |
| Kontenjan tutarlılığı | `approve_join_request()` RPC, `FOR UPDATE` kilidi ve CHECK kısıtı | Eşzamanlı iki onay kontenjanı aşamaz |
| Grup sohbeti | Realtime (`messages` tablosu) | RLS sayesinde yalnızca üyeler yayını alır |
| Uygulama içi bildirim | `notifications` tablosu + Realtime | Ek servis gerekmez |
| Moderasyon | `reports` + `is_moderator` | Basit kuyruk; ileride ayrı panel |

Ön yüz Vite + React + TypeScript + Tailwind ile devam eder (repo yığını). Next.js'e geçiş
yalnızca SEO'lu herkese açık plan sayfaları (`gelengelsin.net/p/<id>`) gerekirse gerekir;
o sayfalar için bir Edge Function ile önizleme (OG) etiketi üretmek de yeterli olabilir.

**Maliyet:** Supabase'in ücretsiz katmanı pilot için yeterli. Ücretli plana geçmek, alan adı
bağlamak ve canlıya almak **senin onayınla** yapılacak.

## 2. Veri modeli

```
cities ─┐
        ├─< profiles ─┬─< plans ─┬── plan_secrets (kesin buluşma noktası, 1-1)
        │             │          ├─< join_requests >── profiles
        │             │          ├─< messages
        │             │          ├─< plan_outcomes ("Plan gerçekleşti mi?")
        │             │          └─< reports (plan hedefli)
        │             ├─< notifications
        │             ├─< blocks (blocker → blocked)
        │             └─< reports (kullanıcı hedefli)
```

- **Şehirden bağımsız:** `plans.city_id` ve `cities.active`. Yeni şehir = bir satır ekleyip `active=true`.
  Seyahat planı kullanıcının şehrinde listelenir; `destination_city/country` varış noktasıdır (yurt dışı dahil).
- **Plan türü:** `going` ("Ben gidiyorum"), `need_people` ("Ekibe kişi lazım"), `meet_there` ("Orada buluşalım").
  Tek tablo; tür yalnızca etiketi, kart vurgusunu ve oluşturma ekranındaki yardımcı metni değiştirir.
- **Kontenjan:** `capacity` sahip hariç katılımcı sayısıdır. `approved_count` sayacı yalnızca RPC'lerle değişir.
- **Kesin buluşma noktası** ayrı tablodadır (`plan_secrets`). Böylece herkese açık plan sorgusu onu hiç döndürmez.
- **İstek durumu:** `pending → approved | rejected | withdrawn`, `approved → left`. Aynı plan için tek "canlı" istek
  (benzersiz kısmi indeks). Geri çekilen ya da ayrılan kişi yeniden istek gönderebilir; reddedilen gönderemez.

## 3. Yetki kuralları

| Eylem | Kim | Ek koşul |
|---|---|---|
| Plan aç | 18+ doğrulanmış kullanıcı | Aktif şehir, gelecek tarih, kontenjan 1–30 |
| Planı düzenle / iptal et | Yalnızca plan sahibi | Kontenjan onaylı sayısının altına inemez |
| Katılma isteği | Sahip dışı, 18+ | Plan aktif, dolu değil, tarihi geçmemiş, aralarında engel yok |
| İsteği geri çek | İsteği gönderen | Yalnızca `pending` |
| Onayla / reddet | Yalnızca plan sahibi | Onayda kontenjan sunucuda, kilitli kontrol edilir |
| Plandan ayrıl | Onaylı katılımcı | Yer anında açılır, sohbet ve kesin yer erişimi kalkar |
| Sohbeti oku / yaz | Sahip + onaylılar | İptal edilen planda salt okunur |
| Kesin buluşma noktası | Sahip + onaylılar | Plan aktif olmalı |
| Şikâyet | Her kullanıcı | Bildiren gizli kalır |
| Şikâyet çöz / plan kaldır | Moderatör | Sahip ve katılımcılara bildirim |
| Engelle | Her kullanıcı | İki yönlü gizleme; aradaki bekleyen istekler kapanır |
| "Plan gerçekleşti mi?" | Sahip + onaylılar | Plan tarihi geçmiş olmalı |

**Bildirim tetikleri (uygulama içi):** yeni istek (sahibe), onay/ret (isteyene), ayrılma ve geri çekme (sahibe),
tarih/saat değişikliği (onaylı + bekleyen), buluşma yeri değişikliği (yalnızca onaylı; bekleyene yer bilgisi
sızdırılmaz), iptal (onaylı + bekleyen), moderasyonla kaldırma (sahip + üyeler).

**Basit şikâyet yönetimi akışı:** kullanıcı plan veya kişiyi şikâyet eder → `reports` (open) → moderatör
kuyruğu (prototipte Profil → "Şikâyetler ve pilot metrikleri") → "İhlal yok, kapat" ya da "Planı kaldır".
Kullanıcı şikâyetlerinde ilk sürümde hesap askıya alma elle yapılır (Supabase panelinden); 2. adımda
`profiles.suspended_at` ve otomatik eşik (ör. 3 bağımsız şikâyet → inceleme önceliği) eklenir.

## 4. Kısa geliştirme sırası (öneri: 4 sprint × 1 hafta)

1. **Temel ve giriş:** Supabase projesi, şema + RLS migration'ı, Auth (telefon OTP), profil oluşturma
   (doğum yılı, 18+ beyanı + KVKK aydınlatma/açık rıza metinleri), İstanbul ilçeleri.
2. **Planlar ve katılım:** Plan aç/düzenle/iptal RPC'leri, keşfet sorgusu (şehir/ilçe/kategori/tarih),
   istek → onay/ret/geri çek/ayrıl RPC'leri, eşzamanlı onay testi (iki paralel istemci), Planlarım.
3. **Sohbet ve bildirim:** Realtime sohbet, uygulama içi bildirim merkezi, paylaşım bağlantısı
   (`/p/<id>`, OG önizleme), kesin buluşma noktası erişimi.
4. **Güvenlik ve ölçüm:** şikâyet, engelleme, moderatör kuyruğu, "Plan gerçekleşti mi?" sorusu
   (plan bitiminden ~3 saat sonra bildirim), pilot metrik görünümü, hız sınırlama (istek/mesaj spam'i),
   kapalı beta.

Sonra: web push / mobil bildirim, PWA veya mağaza uygulaması (mağaza yayını **onayınla**), yeni şehirler.

## 5. İstanbul pilotunda başarı ölçütleri ve takibi

| Ölçüt | Tanım | Kaynak |
|---|---|---|
| Açılan plan | Haftada açılan demo dışı plan sayısı (iptaller ayrıca) | `plans` |
| Eşleşme oranı | En az bir onaylı katılımcısı olan planların oranı | `plans.approved_count > 0` |
| Gerçekleşme | "Plan gerçekleşti mi?" yanıtlarında "Evet" çoğunlukta olan planların oranı | `plan_outcomes` |
| Yanıt oranı | Tarihi geçmiş planlardan en az bir yanıt alanların oranı | `plan_outcomes` |
| Güvenlik | 100 plan başına şikâyet, çözülme süresi | `reports` |

- Haftalık görünüm: `pilot_weekly` (SQL taslağında). Supabase SQL editöründen ya da basit bir
  yönetici sayfasından okunur; ek analitik aracı gerekmez.
- "Plan gerçekleşti mi?" sorusu plan bitiminden ~3 saat sonra hem sahibe hem onaylılara uygulama
  içi bildirimle sorulur; prototipte Planlarım → Geçmiş sekmesindedir.
- Demo planlar `is_demo = true` ile işaretlidir ve metriklerden düşülür.
- Öneri hedefleri (pilotun ilk 8 haftası için tartışmaya açık): haftalık 50+ plan, eşleşme oranı ≥ %40,
  gerçekleşme ≥ %60 (yanıtlananlar içinde).

## 6. Bilinçli olarak kapsam dışı

Ödeme, bilet satışı, rezervasyon entegrasyonu (katılımcı kendi biletini ve ulaşımını organize eder),
GPS zorunluluğu, harita, öneri algoritması, mağaza yayını, alan adı bağlama.
