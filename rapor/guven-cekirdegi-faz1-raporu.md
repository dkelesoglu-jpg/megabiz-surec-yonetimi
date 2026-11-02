# Güven Çekirdeği – Faz 1 Raporu

**Proje:** Project Aralık (`aralik-social`, geçici çalışma adı)
**Tarih:** 2 Kasım 2026
**Ortam:** Yalnızca yerel ortam: PostgreSQL 16, pgTAP ve Supabase rol emülasyonu (bkz. ADR-001)
**Veri:** Yalnızca sentetik test kullanıcıları ("Test A", "Hedef 3" gibi). Gerçek kişi, telefon, e-posta, fotoğraf ya da mesaj kullanılmadı.
**Kullanılmayanlar:** Bulut kaynağı, ücretli servis, gerçek API anahtarı, GitHub reposu

> **Sonuç:** İstenen 15 güvenlik senaryosunun tamamı **PASS**: 145 doğrulamanın 145'i geçti. Ayrıca 5 mutasyon senaryosu çalıştırıldı (korumalar bilerek zayıflatıldı) ve **5'i de test paketi tarafından yakalandı.**

---

## 1. Oluşturulan dosyalar

```
aralik-social/
├── README.md                     Proje özeti ve çalıştırma
├── CLAUDE.md                     Claude Code kuralları (AI çalışma modeli, veri yasağı, güvenlik ilkeleri)
├── AGENTS.md                     Codex/ChatGPT inceleyici kuralları
├── .gitignore
├── local/
│   └── supabase-shim.sql         Düz PostgreSQL için Supabase emülasyonu (migration değil)
├── supabase/
│   ├── migrations/
│   │   ├── 20261102120000_core_foundation.sql                 Şemalar, yapılandırma, hız limiti, denetim kaydı
│   │   ├── 20261102120100_profiles_and_account_status.sql     Profil, hesap durumu, yaş doğrulama sonucu
│   │   ├── 20261102120200_connections.sql                     Engel, davet, eşleşme, konuşma, rapor
│   │   ├── 20261102120300_capabilities_and_consent.sql        Yetenek kataloğu, kör onay, değişmez kurallar
│   │   ├── 20261102120400_messages_and_media.sql              Mesaj/medya tabloları ve zorlayıcı tetikleyiciler
│   │   ├── 20261102120500_api_invitations_and_safety.sql      Davet, kabul, engel, rapor, bitirme API'leri
│   │   └── 20261102120600_api_capabilities_and_messages.sql   Onay, geri çekme, mesaj, medya API'leri
│   └── tests/
│       ├── helpers/test_helpers.sql                            Sentetik kullanıcı, rol değiştirme, anlık görüntü
│       └── database/
│           ├── 01_invitations_and_matching.test.sql            T01, T08, T13 (davet) + INV-01…13
│           ├── 02_capabilities_and_consent.test.sql            T03–T06, T12–T14 + CAP-01…06
│           ├── 03_message_permissions.test.sql                 T02, T07, T09–T11, T15 + MSG-01…04
│           └── 04_grants_and_rls_audit.test.sql                SEC-01…10 (yapısal yetki denetimi)
├── packages/age-verification/src/AgeVerificationProvider.ts    Sağlayıcıdan bağımsız arayüz + sahte sağlayıcı
├── scripts/
│   ├── db-reset.sh               Veritabanını sıfırdan kur
│   ├── db-test.sh                Testleri çalıştır → PASS/FAIL raporu
│   └── mutation-test.sh          Korumaları zayıflat → testler yakalıyor mu?
├── reports/db-test-results.md    Son test çalıştırmasının PASS/FAIL tablosu
└── docs/
    ├── product/                  Ürün kararları, MVP planı, konsept raporu, isim araştırması (kopya)
    ├── adr/                      ADR-001 yerel ortam · ADR-002 kör onay · ADR-003 DB seviyesinde zorlama
    ├── architecture/guven-cekirdegi-mimari.md   Mimari ve akış diyagramları
    └── reports/guven-cekirdegi-faz1-raporu.md   Bu rapor
```

---

## 2. Veri modeli

### Şemalar

| Şema | İçerik | Kim erişir |
|---|---|---|
| `public` | RLS korumalı tablolar | İstemci: yalnızca `SELECT`, RLS süzgeçli |
| `api` | İş kurallarını uygulayan RPC fonksiyonları | `authenticated`, bazı fonksiyonlar yalnızca `service_role` |
| `private` | Kör kararlar, olay kaydı, raporlar, denetim, hız limiti, yapılandırma | **Hiçbir istemci rolü** (service_role dahil) |
| `rls` | RLS politikalarının çağırdığı küçük yardımcılar | Yalnızca `EXECUTE` |

### Tablolar

| Tablo | Görev | Önemli alanlar | RLS / yetki |
|---|---|---|---|
| `auth.users` | Kimlik (Supabase Auth) | `id` | Supabase yönetir |
| `public.profiles` | Kullanıcı temel modeli | `display_name`, `account_status`, `is_age_verified`, `is_identity_verified` | Yalnızca kendi satırı; yalnızca `display_name` güncellenebilir |
| `public.blocks` | Engeller | `blocker_id`, `blocked_id` | Engelleyen görür; **engellenen hiçbir satırı göremez** |
| `public.invitations` | Sohbet daveti | `sender_id`, `recipient_id`, `note`, `status`, `expires_at`, `responded_at` | Alıcı bekleyen davetini görür (yalnızca güvenli kolonlar). **Gönderen tabloyu okuyamaz**; maskeli fonksiyonu kullanır |
| `public.matches` | Bağlantı | `user_low`, `user_high`, `status` (`active` / `ended` / `blocked`) | İki üye görür |
| `public.conversations` / `conversation_members` | Birebir konuşma | `kind` (şimdilik yalnızca `direct`), `match_id` | Yalnızca üyeler |
| `public.capability_catalog` | Yetenek kuralları | `ui_level`, `mvp_enabled`, `prerequisite`, `yes_ttl`, uygunluk eşikleri, `media_types` | Okunabilir |
| `public.match_capabilities` | Ortak yetenek durumu | `status`, `opened_at`, `revoked_at` | İki üye görür |
| `private.capability_consents` | **Kör bireysel kararlar** | `user_id`, `decision`, `decided_at` | Kapalı; kişi yalnızca kendi kararını fonksiyonla görür |
| `private.capability_events` | Durum değişikliği kaydı (append-only) | `event`, `actor_id` | Kapalı |
| `public.messages` | Mesajlar | `kind` (`text` / `media` / `voice` / `system`), `body`, `client_msg_id` | Üyeler okur; yazma yalnızca API |
| `public.message_media` | Medya meta verisi | `media_type` (`image` / `video` / `file` / `audio`), `storage_path`, `hidden_by_revoke` | Üyeler okur (gizli olmayanları); yazma yalnızca backend API |
| `private.reports` | Güvenlik kaydı (append-only) | `target_user_id`, `category`, `target_type` | Kapalı |
| `private.age_verifications` | Yaş doğrulama sonucu | `provider`, `outcome` (doğum tarihi **yok**) | Kapalı |
| `private.audit_log` | Denetim kaydı (append-only) | `actor`, `action`, `meta` | Kapalı |
| `private.rate_limits`, `private.app_config` | Hız limiti ve sayısal kurallar | — | Kapalı |

### Hesap durumu

`onboarding`, `active`, `paused`, `restricted`, `suspended`, `banned`, `pending_deletion`, `age_blocked`.
Tüm yazma API'leri `active` ister. Durum yalnızca `private.set_account_status` ile ve denetim kaydıyla değişir.

---

## 3. Capability (yetenek) modeli

| Yetenek | Seviye | MVP | Önkoşul | Uygunluk ("evet" diyebilmek için) | Bağlı medya |
|---|---|---|---|---|---|
| `text_message` | 1 | ✅ | — | Davet + kabul = iki açık onay | — |
| `voice_message` | 1.5 | ✅ | `text_message` | İki taraf da ≥ 10 mesaj, bağlantı ≥ 24 saat | `audio` |
| `media_share` | 2 | ✅ | `text_message` | İki taraf da ≥ 20 mesaj, ≥ 2 farklı gün, iki taraf da kimliği doğrulanmış | `image`, `video`, `file` |
| `voice_call` | 3 | — (`unavailable`) | `text_message` | — | — |
| `video_call` | 4 | — (`unavailable`) | `voice_call` | — | — |
| `meetup` | 5 | — (`unavailable`) | `text_message` | — | — |

- **Seviye bir sayı değil.** Her yetenek bağımsız bir anahtardır. `ui_level` yalnızca arayüzdeki sırayı belirler.
- **Bağımsızlık:** `voice_message` açıkken `media_share` kapalı kalabilir (CAP-05 testi).
- **MVP dışı yetenekler:** Veri modelinde hazırdır, ama `unavailable` durumundadır. Hem API hem değişmez kural tetikleyicisi bunların açılmasını reddeder (CAP-02, T11).
- Eşikler katalogda tutulur. Beta verisiyle migration yoluyla ayarlanabilir.

---

## 4. Consent (onay) motoru

Gereksinimdeki "A kararı, B kararı, durum, opened_at, revoked_at" modeli şöyle karşılandı:

| Gereksinim | Uygulama |
|---|---|
| User A decision | `private.capability_consents` içinde A'nın satırı |
| User B decision | Aynı tabloda B'nin ayrı satırı |
| Capability status | `public.match_capabilities.status` |
| opened_at / revoked_at | Aynı tabloda |

**Kurallar:**
1. **Kör karar:** Her kullanıcı `api.set_capability_consent(match, capability, yes | not_now | never_ask)` ile yalnızca kendi kararını verir. Kararlar `private` şemasındadır; karşı taraf, yabancılar, backend (`service_role`) ve anonim kullanıcı okuyamaz (T12).
2. **Açılış:** İki geçerli (7 gün içinde verilmiş) `yes` olduğu anda yetenek `on` olur. İki tarafa da "… artık açık" sistem mesajı gider. `opened` olayında kimin son onayı verdiği **kaydedilmez** (T05, T14).
3. **Olumsuz ya da cevapsız karar hiçbir şey değiştirmez:** Ortak duruma, zaman damgalarına, mesajlara, olay kaydına ve denetim kaydına dokunmaz. Bu yüzden A'nın görebildiği her şey, B "şimdilik değil" dese de hiç cevap vermese de **byte byte aynıdır.** Bu, T13 ve T14'te tam anlık görüntü karşılaştırmasıyla doğrulandı.
4. **Kendi görünümü:** `api.my_capabilities(match)` yalnızca ortak durumu, kişinin **kendi** kararını ve "evet diyebilir miyim?" bilgisini döner. Karşı tarafa ait hiçbir alan yoktur.
5. **Değişmez kural (savunma derinliği):** `match_capabilities` satırı `on` durumuna, **hangi rol yazarsa yazsın**, ancak şu koşullarla geçebilir:
   - iki geçerli `yes` var,
   - eşleşme aktif,
   - engel yok,
   - önkoşul açık.

   Tablo sahibi seviyesinde yapılan deneme de reddedildi (T15).
6. **Hız limiti:** Kullanıcı başına, bağlantı başına günde en fazla 20 karar değişikliği.

**Bilinçli olarak görünen (olumlu) bilgiler:**
- Açılış anı (`opened_at`), iki tarafın da "evet" dediğini gösterir.
- Geri çekme görünür bir olaydır. İki kişilik bağlantıda kimin kapattığı dolaylı olarak anlaşılabilir.

Bunlar "hayır"ı sızdırmaz ve ADR-002'de belgelendi.

---

## 5. Mesaj izin modeli

| Mesaj / medya | Gereken yetenek | Kim yazabilir |
|---|---|---|
| Metin (`text`) | `text_message` | Kullanıcı → `api.send_message` (üyelik, aktif hesap, hız limiti 30/dk, idempotent `client_msg_id`) |
| Fotoğraf / video / dosya (`media` + `image` / `video` / `file`) | `media_share` | **Yalnızca backend** → `api.register_media_message` (gelecekteki yükleme ve tarama Edge Function'ı) |
| Ses (`voice` + `audio`) | `voice_message` | **Yalnızca backend** → aynı fonksiyon |
| Sistem (`system`) | — | Yalnızca API'nin iç akışları |

**Her yazmada tetikleyicilerin kontrol ettiği kurallar (rol fark etmez):**
- Gönderen konuşmanın aktif üyesi mi?
- Konuşma birebir mi? (Faz 1: oda ve masa yok.)
- Eşleşme aktif mi, engel var mı?
- Gerekli yetenek ve önkoşulu açık mı?
- Medya satırı doğru mesaja ve doğru türe mi bağlı? (Örneğin bir metin mesajına fotoğraf iliştirilemez.)
- Mesajın konuşması, göndereni, türü ve tarihi sonradan değiştirilemez. Medya satırı içerik olarak değiştirilemez.

### Daha önce gönderilmiş medyanın davranışı (geri çekme sonrası) — DK-04

1. Bir taraf `media_share`'i kapattığında o bağlantıdaki tüm fotoğraf, video ve dosya kayıtları **iki taraf için de anında gizlenir** (`hidden_by_revoke = true`; RLS artık döndürmez). `voice_message` kapanırsa ses kayıtları gizlenir.
2. **İzin yeniden açılsa bile eski medya geri gelmez.** Geri çekilen rıza geçmiş içeriği de kapsar. Gizlenmiş bir medyayı geri açmak tablo sahibi için bile imkânsızdır (T15).
3. Yeni medya gönderimi anında engellenir (T06).
4. `text_message` kapatılırsa ona bağlı `voice_message` ve `media_share` da kapanır (CAP-06). Geçmiş **metin** mesajları salt okunur olarak görünür kalır.
5. Engelleme ve bağlantıyı bitirme de tüm yetenekleri kapatır, dolayısıyla medya gizlenir.
6. **Henüz yapılmayan:** Dosyaların depolamadan (Storage) fiziksel olarak silinmesi, saklama süresi ve imzalı URL'lerin iptali. Faz 1'de Storage yok; bu konu Storage sprintinde tasarlanacak (bkz. Bölüm 9).

---

## 6. RLS / DB güvenlik yaklaşımı

1. **Varsayılan kapalı:** Her `public` tablosunda RLS açık. Supabase'in cömert varsayılan yetkileri her tabloda `revoke all … from anon, authenticated, service_role` ile geri alındı, ardından yalnızca `SELECT` verildi (SEC-01…04).
2. **İstemci doğrudan yazamaz:** Hiçbir istemci rolünün `INSERT`, `UPDATE`, `DELETE` ya da `TRUNCATE` yetkisi yok. Tek istisna `profiles.display_name` kolon güncellemesi (SEC-02, SEC-03).
3. **Tüm yazmalar `api.*` üzerinden:** Bu fonksiyonlar `SECURITY DEFINER` olarak tanımlı, `search_path` sabit (SEC-08) ve tüm adlar tam nitelikli.
4. **`service_role` ≠ sınırsız yetki:** RLS'i atlayabilir, ama tablo yetkisi olmadığı için doğrudan yazamaz ve tetikleyici kapatamaz (T15). Medya yalnızca kuralları uygulayan fonksiyonla yazılabilir.
5. **Tetikleyiciler son savunma hattı:** Tablo sahibi seviyesindeki yazmalarda bile çalışır (T09, T15). Etkin oldukları SEC-09 ile denetleniyor.
6. **Bilgi sızdırmayan hatalar:**
   - Alıcıya bağlı tüm davet reddi nedenleri tek bir `invitation_not_allowed` hatası döner (engel, ret, rapor, cooldown, kota).
   - Başkasının konuşması ya da eşleşmesi için `conversation_not_found` / `match_not_found` döner; kaydın var olup olmadığı açıklanmaz.
7. **Kör ret (davetler):** "Şimdilik değil", rapor ve engel nedeniyle kapanan davetler gönderene süre bitene kadar `pending`, sonra `expired` görünür. Bu, cevapsız bir davetle **birebir aynı**dır (T13).
8. **Append-only kayıtlar:** Olay kaydı, raporlar ve denetim kaydı hiçbir rol tarafından değiştirilemez ya da silinemez.
9. **Kalan tehdit:** Süper kullanıcı veya migration rolü tetikleyicileri kapatabilir. Bu rol uygulamada kullanılmaz; süreç ve CI ile korunacak (ADR-003).

---

## 7. Test edilen saldırı senaryoları

| # | Senaryo | Nasıl test edildi |
|---|---|---|
| T01 | Eşleşmeden mesaj gönderme | Başka çiftin konuşmasına RPC ile yazma, uydurma konuşma kimliği, doğrudan INSERT |
| T02 | media_share kapalıyken fotoğraf | Kullanıcı medya fonksiyonunu çağırma, doğrudan INSERT (`messages` / `message_media`), backend ön kontrolü, backend kaydı |
| T03 | Yalnızca A onay verdi | Durum `off`; iki taraf da medya gönderemez |
| T04 | Yalnızca B onay verdi | Durum `off`; video ve dosya da reddedilir |
| T05 | İkisi de onay verdi | Anında `on`; `opened_at` dolu; olayda son onaylayan kayıtlı değil; medya gönderilir ve karşı taraf görür |
| T06 | Açıldıktan sonra A geri çekti | `off`, `revoked_at`; eski medya iki taraf için gizli; yeni medya engelli; kararlar sıfırlandı; tek "evet" yetmiyor; yeniden açılınca eski medya geri gelmiyor |
| T07 | Engellenmiş kullanıcı mesaj gönderiyor | Engellenen ve engelleyen mesaj gönderemez; eşleşme `blocked`; hiçbir yetenek açık değil; backend de medya yazamaz |
| T08 | Engellenmiş kullanıcı davet gönderiyor | İki yönde de genel hata; engellenen kişi engel kaydını göremez |
| T09 | Başka conversation_id | RPC reddi; mesajlar görünmüyor; backend ve tablo sahibi seviyesinde üyelik kuralı |
| T10 | Başkasının medyasına erişim | RLS 0 satır; değiştirme yetkisi yok; kontrol grubu (üye görebiliyor) |
| T11 | API üzerinden yetenek atlatma | Durumu doğrudan değiştirme, karşı taraf adına onay yazma, iç fonksiyon çağırma, MVP dışı yetenek, başkasının eşleşmesi, mesaj türünü değiştirme |
| T12 | Yetkisiz consent okuma | Yabancı, karşı taraf, backend ve anonim kullanıcı için karar ve olay tablolarına erişim reddi |
| T13 | "Hayır"ı API cevabından çıkarma | A'nın görebildiği her şeyin **tam anlık görüntüsü** (tüm tablolar ve API çıktıları) B cevapsızken ve B "şimdilik değil" / "bir daha sorma" dedikten sonra birebir aynı; A'nın tekrar "evet" demesine verilen yanıt aynı; davet tarafında ret alan ve cevapsız davet aynı görünüyor; yeniden davet hatası aynı |
| T14 | Zamanlamadan karar vereni çıkarma | B'nin kararı öncesi ve sonrası arasına gerçek zaman aralığı (1,2 sn) konuldu; A'nın görebildiği **hiçbir zaman damgası değişmedi**; olumsuz karar olay ve denetim kaydına hiç yazılmadı; "opened" olaylarında aktör yok |
| T15 | Yetkili backend medya kuralını atlıyor | `service_role`: doğrudan INSERT/UPDATE yok, tetikleyici kapatamıyor, resmi API ile de izinsiz yazamıyor. Tablo sahibi: izinsiz medya mesajı, metne fotoğraf iliştirme, çift onaysız açma, medya içeriğini değiştirme, gizli medyayı geri açma ve kayıt silme reddedildi |

**Ek kontroller (67 doğrulama):**
- **INV-01…13:** Kabul akışı, maskeleme, 30 gün ısrar koruması, raporun engel ve güvenlik kaydı oluşturması, doğrulanmamış kullanıcının davet gönderememesi, notta IBAN veya telefon yasağı, dakika ve gün limitleri (herkese eşit), askıdaki hesap.
- **CAP-01…06:** Uygunluk eşiği, MVP dışı yetenekler, 7 günlük "evet" süresi, sesli mesaj (1.5) ile medyanın (2) bağımsızlığı, yazışma kapanınca bağımlı yeteneklerin kapanması.
- **MSG-01…04:** Metin mesajı, idempotent gönderim, askıdaki hesap, bitmiş eşleşme.
- **SEC-01…10:** RLS her tabloda, istemci rollerinde yazma yetkisi yok, `private` şeması kapalı, `search_path` sabit, tetikleyiciler etkin, tablo sahipliği.

---

## 8. Test sonuçları

```
scripts/db-test.sh
Toplam 145 doğrulama · PASS 145 · FAIL 0
  T01 PASS  (4)   T02 PASS  (5)   T03 PASS  (4)   T04 PASS  (3)   T05 PASS  (5)
  T06 PASS (10)   T07 PASS  (6)   T08 PASS  (3)   T09 PASS  (4)   T10 PASS  (4)
  T11 PASS  (7)   T12 PASS  (7)   T13 PASS (12)   T14 PASS  (5)   T15 PASS (12)
```

Ayrıntılı tablo: [`reports/db-test-results.md`](../../reports/db-test-results.md)

**Mutasyon testi** (`scripts/mutation-test.sh`): Testlerin gerçekten koruma sağladığını kanıtlamak için korumalar bilerek bozuldu.

| Bilerek yapılan zayıflatma | Sonuç |
|---|---|
| Medya tetikleyicisi kaldırıldı + service_role'e INSERT verildi | ✓ Yakalandı (FAIL) |
| Kör karar tablosu kullanıcılara açıldı | ✓ Yakalandı |
| Olumsuz karar ortak satıra zaman damgası yazıyor (zamanlama sızıntısı) | ✓ Yakalandı |
| Gönderen davet tablosunu okuyabiliyor | ✓ Yakalandı |
| Çift onay değişmez kuralı kaldırıldı | ✓ Yakalandı |

**Geliştirme sırasında yakalanan hatalar** (dürüst kayıt):
- İlk çalıştırmada 10 doğrulama başarısız oldu.
- Biri gerçek bir tasarım ayrıntısıydı: Dakika başına davet limiti, yeniden davet denemelerinde genel hatadan **önce** devreye giriyor. Bu bir sızıntı değil, çünkü yalnızca göndericinin kendi durumunu açıklıyor; test bu davranışa göre düzeltildi.
- Diğerleri test kodu hatalarıydı: sıralama, bir yardımcı fonksiyonun yetkisi, pgTAP'in kendi nesnelerinin denetime girmesi.
- Hiçbir güvenlik kuralı test geçsin diye gevşetilmedi.

---

## 9. Bilinen riskler ve eksikler

| # | Risk / eksik | Etki | Öneri / ne zaman |
|---|---|---|---|
| R1 | **Kod yalnızca bu oturumun geçici diskinde.** GitHub reposu yok (onay bekleniyor). Konteyner kapanınca kaybolur | Yüksek | Deniz'in repo onayı. O zamana kadar arşiv dosyası teslim edildi |
| R2 | Testler **emülasyonla** çalıştı, gerçek Supabase CLI ile değil (Docker yok). Farklar: `postgres` rolünün yetkileri, `api` şemasının PostgREST'e açılması, varsayılan yetkiler | Orta | Sonraki sprintin ilk kabul kriteri: `supabase db reset && supabase test db` |
| R3 | Süper kullanıcı / migration rolü tetikleyicileri kapatabilir | Orta | Uygulamada kullanılmayacak; CI'da SEC-09; üretim erişimi yalnızca Deniz'de |
| R4 | Hata veren isteklerde hız limiti sayacı da geri alınıyor (transaction geri dönüşü). Başarısız denemeler sayılmıyor | Düşük–orta | S2'de bağımsız sayaç (Edge Function / Redis) |
| R5 | Storage yok: Medya dosyalarının fiziksel silinmesi, imzalı URL'ler ve bucket politikaları henüz uygulanmadı. Gizlenen medyanın **dosyası** hâlâ depoda kalacak | Yüksek (Storage gelince) | Storage sprinti (S4/S9). Kural: imzalı URL üretimi `api.can_send_media` ve RLS ile aynı kontrolü yapacak |
| R6 | Mesaj gövdesi düz metin (yalnızca sentetik veri) | Orta | DK-11: Şifreleme kararı S5'te |
| R7 | `private.reports` append-only + profil silinince kaskad silme çakışması: Raporu olan bir profil şu an silinemez | Orta | Hesap silme sprintinde (S14) anonimleştirme tasarımı |
| R8 | Süresi dolan davetler yalnızca istek anında `expired` yapılıyor; zamanlanmış iş yok | Düşük | S6: `pg_cron` |
| R9 | Davetin kendisi iptal edilse de 30 günlük ısrar koruması işliyor (iptal → yeniden gönder spam'ini önlemek için bilinçli) | Düşük | Ürün kararı olarak onay bekliyor |
| R10 | Uygunluk hesabı her "evet"te mesajları sayıyor; ölçekte maliyetli | Düşük | Sayaç tablosu (S7) |
| R11 | "Farklı gün" hesabı Europe/Istanbul saat dilimine sabit | Düşük | Çok şehir/ülke aşamasında |
| R12 | Başkalarının profil kartı, rehberden gizlenme (HMAC) ve tekrar sorma baskısı kuralları henüz yok | Plan gereği | S5, bildirim sprinti |
| R13 | CI yok (repo yok) | Orta | Repo sonrası GitHub Actions |

---

## 10. Sonraki sprint önerisi

**Öneri: "Güven Çekirdeği Faz 2 + S0 tamamlama"** (2 hafta; hâlâ mobil arayüz yok)

**Ön koşul:** Deniz'in özel GitHub reposu `aralik-social` için onayı (R1, R13).

| # | İş | Neden |
|---|---|---|
| 1 | Reponun oluşturulması, korumalı `main` ve GitHub Actions CI (migration + pgTAP + mutasyon testi + gitleaks) | Kaybolma riski ve sürekli güvenlik doğrulaması |
| 2 | **Gerçek Supabase CLI (Docker) ile doğrulama:** Aynı 145 doğrulama `supabase test db` ile | R2'nin kapatılması |
| 3 | Monorepo iskeleti (pnpm + Turborepo): `apps/mobile` ve `apps/admin` yalnızca boş iskelet; `packages/db-types` otomatik tip üretimi | S0 tamamlama |
| 4 | Storage tasarımı ve yerel uygulaması: Karantina ve özel bucket'lar, Storage RLS, `request-media-upload` ve `media-url` Edge Function'ları (yerel, sahte tarama) + testler | R5 |
| 5 | Profil görünürlüğü: `api.profile_card` + alan bazında görünürlük + engel/gizleme süzgeci | M04, M08 |
| 6 | Hız limitinin bağımsız sayaca taşınması | R4 |
| 7 | Yeni kötüye kullanım testleri: Storage yol tahmini, süresi geçmiş imzalı URL, gizli medyanın dosyasına erişim | Güvenlik |

**Bu sprintte de olmayacaklar:** Bulut projesi, gerçek SMS/KYC/e-Devlet, push bildirimi, gerçek AI moderasyonu, mağaza işlemleri.

---

> **DURMA NOKTASI:** Faz 1 tamamlandı. Bir sonraki sprint Deniz'in onayı olmadan başlatılmayacak.
