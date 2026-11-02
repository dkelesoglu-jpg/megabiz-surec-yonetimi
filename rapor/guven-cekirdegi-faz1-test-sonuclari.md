# Güven Çekirdeği — Veritabanı Test Sonuçları

Çalıştırma: 2026-11-02 10:04:47 · Ortam: yerel PostgreSQL 16 + pgTAP + Supabase rol emülasyonu · Veri: yalnızca sentetik

**Toplam doğrulama: 145 · PASS: 145 · FAIL: 0**

## İstenen 15 güvenlik senaryosu

| # | Senaryo | Doğrulama sayısı | Sonuç |
|---|---|---|---|
| T01 | Eşleşmeden mesaj gönderme | 4 | **PASS** |
| T02 | media_share kapalıyken fotoğraf yükleme | 5 | **PASS** |
| T03 | Yalnızca A media_share onayı | 4 | **PASS** |
| T04 | Yalnızca B media_share onayı | 3 | **PASS** |
| T05 | İki taraf da onay verdi | 5 | **PASS** |
| T06 | Açıldıktan sonra A geri çekti | 10 | **PASS** |
| T07 | Engellenmiş kullanıcı mesaj gönderimi | 6 | **PASS** |
| T08 | Engellenmiş kullanıcı davet gönderimi | 3 | **PASS** |
| T09 | Başka conversation_id ile yazma | 4 | **PASS** |
| T10 | Başkasının medya kaydına erişim | 4 | **PASS** |
| T11 | API üzerinden capability atlatma | 7 | **PASS** |
| T12 | Yetkisiz consent okuma | 7 | **PASS** |
| T13 | "Hayır" cevabını API’den çıkarma | 12 | **PASS** |
| T14 | Zamanlamadan karar vereni çıkarma | 5 | **PASS** |
| T15 | Yetkili backend’in medya kuralını atlaması | 12 | **PASS** |

## Ek kontroller

| Grup | Doğrulama sayısı | Sonuç |
|---|---|---|
| INV-01 | 1 | **PASS** |
| INV-02 | 1 | **PASS** |
| INV-03 | 1 | **PASS** |
| INV-04 | 1 | **PASS** |
| INV-05 | 1 | **PASS** |
| INV-06 | 1 | **PASS** |
| INV-07 | 2 | **PASS** |
| INV-08 | 5 | **PASS** |
| INV-09 | 1 | **PASS** |
| INV-10 | 2 | **PASS** |
| INV-11 | 1 | **PASS** |
| INV-12 | 2 | **PASS** |
| INV-13 | 1 | **PASS** |
| CAP-01 | 1 | **PASS** |
| CAP-02 | 3 | **PASS** |
| CAP-03 | 1 | **PASS** |
| CAP-04 | 2 | **PASS** |
| CAP-05 | 1 | **PASS** |
| CAP-06 | 3 | **PASS** |
| MSG-01 | 2 | **PASS** |
| MSG-02 | 1 | **PASS** |
| MSG-03 | 1 | **PASS** |
| MSG-04 | 3 | **PASS** |
| SEC-01 | 1 | **PASS** |
| SEC-02 | 1 | **PASS** |
| SEC-03 | 2 | **PASS** |
| SEC-04 | 1 | **PASS** |
| SEC-05 | 3 | **PASS** |
| SEC-06 | 1 | **PASS** |
| SEC-07 | 2 | **PASS** |
| SEC-08 | 1 | **PASS** |
| SEC-09 | 3 | **PASS** |
| SEC-10 | 1 | **PASS** |

## Tüm doğrulamalar

| Dosya | Sonuç | Açıklama |
|---|---|---|
| 01_invitations_and_matching.test.sql | PASS | [T01] Eşleşmesi olmayan kullanıcı başka bir çiftin konuşmasına RPC ile mesaj gönderemez |
| 01_invitations_and_matching.test.sql | PASS | [T01] Uydurma conversation_id ile mesaj gönderilemez |
| 01_invitations_and_matching.test.sql | PASS | [T01] messages tablosuna doğrudan INSERT yetkisi yok |
| 01_invitations_and_matching.test.sql | PASS | [T01] A hiçbir eşleşme göremiyor |
| 01_invitations_and_matching.test.sql | PASS | [INV-01] Kabul eşleşme oluşturur |
| 01_invitations_and_matching.test.sql | PASS | [INV-02] Kabulde yalnızca text_message açık; MVP dışı yetenekler unavailable |
| 01_invitations_and_matching.test.sql | PASS | [INV-03] Konuşmada tam olarak iki üye var |
| 01_invitations_and_matching.test.sql | PASS | [INV-04] B "şimdilik değil" diyebilir |
| 01_invitations_and_matching.test.sql | PASS | [T13] "Şimdilik değil" alan davet gönderene pending görünür |
| 01_invitations_and_matching.test.sql | PASS | [T13] Ret alan ve cevapsız davet gönderen için aynı görünür |
| 01_invitations_and_matching.test.sql | PASS | [T13] Gönderen görünümünde responded_at veya gerçek durum kolonu yok |
| 01_invitations_and_matching.test.sql | PASS | [T13] Ret sonrası yeniden davet: genel hata |
| 01_invitations_and_matching.test.sql | PASS | [T13] Cevapsız davette yeniden davet: AYNI genel hata (ret ima edilmez) |
| 01_invitations_and_matching.test.sql | PASS | [INV-05] Gönderen davetler tablosunu doğrudan okuyamaz (RLS: 0 satır) |
| 01_invitations_and_matching.test.sql | PASS | [INV-06] status kolonu istemciye hiç açılmamış (kolon yetkisi) |
| 01_invitations_and_matching.test.sql | PASS | [T13] Ret alan davet süre sonunda expired görünür |
| 01_invitations_and_matching.test.sql | PASS | [T13] Cevapsız davet de süre sonunda expired görünür (ayırt edilemez) |
| 01_invitations_and_matching.test.sql | PASS | [INV-07] Aynı kişiye 30 gün içinde tekrar davet yok (ret alan) |
| 01_invitations_and_matching.test.sql | PASS | [INV-07] Aynı kişiye 30 gün içinde tekrar davet yok (cevapsız) — aynı hata |
| 01_invitations_and_matching.test.sql | PASS | [INV-08] B daveti raporlayabilir |
| 01_invitations_and_matching.test.sql | PASS | [INV-08] Rapor varsayılan olarak engeller |
| 01_invitations_and_matching.test.sql | PASS | [INV-08] Rapor güvenlik kaydı oluşturur |
| 01_invitations_and_matching.test.sql | PASS | [INV-08] Raporlanan gönderen yine pending görür (rapor sızmaz) |
| 01_invitations_and_matching.test.sql | PASS | [INV-08] Engellenen kişi engel kaydını göremez |
| 01_invitations_and_matching.test.sql | PASS | [T08] Engellenmiş kullanıcı engelleyene davet gönderemez |
| 01_invitations_and_matching.test.sql | PASS | [T08] Engellenen kişi engel kaydını göremez |
| 01_invitations_and_matching.test.sql | PASS | [T08] Engelleyen de engellediğine davet gönderemez |
| 01_invitations_and_matching.test.sql | PASS | [INV-09] Kimliği doğrulanmamış kullanıcı davet gönderemez |
| 01_invitations_and_matching.test.sql | PASS | [INV-10] Davet notunda IBAN yasak |
| 01_invitations_and_matching.test.sql | PASS | [INV-10] Davet notunda telefon numarası yasak |
| 01_invitations_and_matching.test.sql | PASS | [INV-11] Dakikada 3'ten fazla davet gönderilemez |
| 01_invitations_and_matching.test.sql | PASS | [INV-12] Günde 10 davet gönderilebilir |
| 01_invitations_and_matching.test.sql | PASS | [INV-12] 11. davet reddedilir (günlük limit) |
| 01_invitations_and_matching.test.sql | PASS | [INV-13] Askıya alınmış hesap davet gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T03] Yalnızca A "evet" dedi → media_share kapalı kalır |
| 02_capabilities_and_consent.test.sql | PASS | [T03] Backend ön kontrolü: A medya gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T03] A fotoğraf gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T03] B fotoğraf gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T04] Yalnızca B "evet" dedi → media_share kapalı kalır |
| 02_capabilities_and_consent.test.sql | PASS | [T04] A video gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T04] B dosya gönderemez |
| 02_capabilities_and_consent.test.sql | PASS | [T05] İki taraf da "evet" → media_share anında açılır |
| 02_capabilities_and_consent.test.sql | PASS | [T05] opened_at yazıldı |
| 02_capabilities_and_consent.test.sql | PASS | [T05] "opened" olayında kimin son onayı verdiği kaydedilmez |
| 02_capabilities_and_consent.test.sql | PASS | [T05] A fotoğraf gönderebilir |
| 02_capabilities_and_consent.test.sql | PASS | [T05] B gönderilen fotoğrafı görebilir |
| 02_capabilities_and_consent.test.sql | PASS | [T06] A tek taraflı geri çekebilir |
| 02_capabilities_and_consent.test.sql | PASS | [T06] media_share → off |
| 02_capabilities_and_consent.test.sql | PASS | [T06] revoked_at yazıldı |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Önceki medya A için gizlendi |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Önceki medya B için de gizlendi |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Geri çekmeden sonra yeni medya anında engellenir |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Geri çekmede iki tarafın kararı sıfırlanır (yeniden açmak için iki taze "evet" gerekir) |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Geri çekmeden sonra tek "evet" yetmez |
| 02_capabilities_and_consent.test.sql | PASS | [T06] İki taze "evet" ile yeniden açılır |
| 02_capabilities_and_consent.test.sql | PASS | [T06] Yeniden açılsa da geri çekilmiş eski medya geri gelmez (DK-04) |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Eşleşme üyesi olmayan kullanıcı yetenek görünümünü okuyamaz |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Yabancı match_capabilities satırlarını göremez (RLS) |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Yabancı karar tablosuna erişemez (private şeması kapalı) |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Eşleşmedeki karşı taraf bile karar tablosunu okuyamaz |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Olay kaydı kullanıcıya kapalı |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Backend (service_role) bile karar tablosunu doğrudan okuyamaz |
| 02_capabilities_and_consent.test.sql | PASS | [T12] Anonim kullanıcı API'ye erişemez |
| 02_capabilities_and_consent.test.sql | PASS | [T13] B "şimdilik değil" dedikten sonra A'nın gördüğü HER ŞEY cevapsız durumla birebir aynı |
| 02_capabilities_and_consent.test.sql | PASS | [T13] B "bir daha sorma" dedikten sonra da A'nın görünümü değişmez |
| 02_capabilities_and_consent.test.sql | PASS | [T13] A tekrar "evet" dese de yanıt yalnızca "off" (cevapsız durumla aynı) |
| 02_capabilities_and_consent.test.sql | PASS | [T13] my_capabilities çıktısında karşı tarafın kararına ait hiçbir alan yok |
| 02_capabilities_and_consent.test.sql | PASS | [T13] Kişi yalnızca KENDİ kararını görür |
| 02_capabilities_and_consent.test.sql | PASS | [T14] B'nin kararından sonra A'nın görebildiği hiçbir zaman damgası değişmedi |
| 02_capabilities_and_consent.test.sql | PASS | [T14] "Şimdilik değil" olay kaydına hiç yazılmaz (iç kayıtlarda bile) |
| 02_capabilities_and_consent.test.sql | PASS | [T14] Olay kaydında yalnızca ortak durum değişiklikleri var |
| 02_capabilities_and_consent.test.sql | PASS | [T14] Hiçbir "opened" olayı son onayı vereni kaydetmiyor |
| 02_capabilities_and_consent.test.sql | PASS | [T14] Denetim kaydında da onay kararı izi yok |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-01] Uygunluk eşiği sağlanmadan "evet" denemez (sesli mesaj) |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-02] MVP dışı yetenek (video_call) açılamaz |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-02] MVP dışı yetenek (meetup) açılamaz |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-02] MVP dışı yetenek (voice_call) açılamaz |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-03] Süresi dolmuş "evet" ile yetenek açılmaz |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-04] Sesli mesaj ayrı çift onayla açılır (Seviye 1.5) |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-04] Sesli mesaj gönderilebilir |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-05] Sesli mesaj açık olsa da fotoğraf gönderilemez (bağımsız yetenekler) |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-06] Yazışma da tek taraflı kapatılabilir |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-06] Yazışma kapanınca sesli mesaj ve görsel paylaşımı da kapanır |
| 02_capabilities_and_consent.test.sql | PASS | [CAP-06] Yazışma kapalıyken metin mesajı gönderilemez |
| 03_message_permissions.test.sql | PASS | [MSG-01] Aktif eşleşmede metin mesajı gönderilebilir |
| 03_message_permissions.test.sql | PASS | [MSG-01] Mesaj yazıldı ve gönderen tarafından okunabiliyor |
| 03_message_permissions.test.sql | PASS | [MSG-02] Aynı client_msg_id ile yeniden deneme çift kayıt oluşturmaz (idempotent) |
| 03_message_permissions.test.sql | PASS | [T02] Kullanıcı medya kayıt fonksiyonunu doğrudan çağıramaz (yalnızca backend) |
| 03_message_permissions.test.sql | PASS | [T02] Kullanıcı media türünde mesajı doğrudan yazamaz |
| 03_message_permissions.test.sql | PASS | [T02] Kullanıcı message_media tablosuna doğrudan yazamaz |
| 03_message_permissions.test.sql | PASS | [T02] Yükleme öncesi backend ön kontrolü reddeder |
| 03_message_permissions.test.sql | PASS | [T02] media_share kapalıyken fotoğraf kaydı reddedilir |
| 03_message_permissions.test.sql | PASS | [T09] A, B–C konuşmasına mesaj yazamaz |
| 03_message_permissions.test.sql | PASS | [T09] A, B–C konuşmasının mesajlarını göremez |
| 03_message_permissions.test.sql | PASS | [T09] Backend bile üyesi olmayan kişi adına başka konuşmaya medya yazamaz |
| 03_message_permissions.test.sql | PASS | [T09] Doğrudan yazma (tablo sahibi) bile üyelik kuralını aşamaz |
| 03_message_permissions.test.sql | PASS | [T10] A, B–C arasındaki fotoğraf kaydını göremez (RLS) |
| 03_message_permissions.test.sql | PASS | [T10] A hiçbir yabancı medya kaydı göremez |
| 03_message_permissions.test.sql | PASS | [T10] A medya kaydını değiştiremez |
| 03_message_permissions.test.sql | PASS | [T10] Kontrol: konuşmanın üyesi C aynı kaydı görebiliyor (test geçerli) |
| 03_message_permissions.test.sql | PASS | [T11] Kullanıcı yetenek durumunu doğrudan değiştiremez |
| 03_message_permissions.test.sql | PASS | [T11] Kullanıcı karşı taraf adına onay kaydı yazamaz |
| 03_message_permissions.test.sql | PASS | [T11] Kullanıcı iç fonksiyonları çağıramaz |
| 03_message_permissions.test.sql | PASS | [T11] MVP dışı yetenek API üzerinden açılamaz |
| 03_message_permissions.test.sql | PASS | [T11] Başkasının eşleşmesinde onay verilemez |
| 03_message_permissions.test.sql | PASS | [T11] Mesaj türü değiştirilerek yetenek atlanamaz |
| 03_message_permissions.test.sql | PASS | [T11] Tek taraflı onay API'de açılış sağlamaz |
| 03_message_permissions.test.sql | PASS | [T07] E, D'yi engeller |
| 03_message_permissions.test.sql | PASS | [T07] Engellenen kullanıcı mesaj gönderemez |
| 03_message_permissions.test.sql | PASS | [T07] Eşleşme "blocked" durumunda |
| 03_message_permissions.test.sql | PASS | [T07] Engel sonrası hiçbir yetenek açık değil |
| 03_message_permissions.test.sql | PASS | [T07] Engelleyen taraf da artık mesaj gönderemez |
| 03_message_permissions.test.sql | PASS | [T07] Engellenen kişi adına backend de medya yazamaz |
| 03_message_permissions.test.sql | PASS | [T15] service_role message_media'ya doğrudan yazamaz (yetki yok; RLS atlaması işe yaramaz) |
| 03_message_permissions.test.sql | PASS | [T15] service_role yetenek durumunu doğrudan açamaz |
| 03_message_permissions.test.sql | PASS | [T15] service_role kural tetikleyicisini kapatamaz |
| 03_message_permissions.test.sql | PASS | [T15] service_role resmi API ile de izinsiz medya yazamaz |
| 03_message_permissions.test.sql | PASS | [T15] Tablo sahibi bile izinsiz medya mesajı yazamaz (tetikleyici) |
| 03_message_permissions.test.sql | PASS | [T15] Tablo sahibi bile metin mesajına fotoğraf iliştiremez |
| 03_message_permissions.test.sql | PASS | [T15] Tablo sahibi bile çift onay olmadan media_share'i açamaz |
| 03_message_permissions.test.sql | PASS | [T15] Tablo sahibi bile medya satırının içeriğini değiştiremez |
| 03_message_permissions.test.sql | PASS | [T15] Kontrol: geri çekme sonrası medya gizli |
| 03_message_permissions.test.sql | PASS | [T15] Tablo sahibi bile gizlenmiş medyayı geri açamaz |
| 03_message_permissions.test.sql | PASS | [T15] Olay kaydı silinemez (append-only) |
| 03_message_permissions.test.sql | PASS | [T15] Denetim kaydı değiştirilemez (append-only) |
| 03_message_permissions.test.sql | PASS | [MSG-03] Askıdaki hesap mesaj gönderemez |
| 03_message_permissions.test.sql | PASS | [MSG-04] Eşleşme tek taraflı bitirilebilir |
| 03_message_permissions.test.sql | PASS | [MSG-04] Bitmiş eşleşmede mesaj gönderilemez |
| 03_message_permissions.test.sql | PASS | [MSG-04] Geçmiş metin mesajları salt okunur olarak görünür kalır |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-01] public şemasındaki her tabloda RLS açık |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-02] anon / authenticated / service_role hiçbir public tabloya INSERT/DELETE/TRUNCATE/TRIGGER yetkisine sahip değil |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-03] Tablo düzeyinde UPDATE yetkisi yok |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-03] Kolon düzeyinde UPDATE yalnızca profiles.display_name için |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-04] anon rolünün public tablolarda hiçbir yetkisi yok |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-05] private şeması anon'a kapalı |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-05] private şeması authenticated'a kapalı |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-05] private şeması service_role'a kapalı |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-06] api şeması anon'a kapalı |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-07] authenticated medya kayıt fonksiyonunu çalıştıramaz |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-07] service_role medya kayıt fonksiyonunu çalıştırabilir |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-08] Her SECURITY DEFINER fonksiyonunda search_path sabit |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-09] message_media kural tetikleyicisi etkin |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-09] messages kural tetikleyicisi etkin |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-09] match_capabilities değişmez kural tetikleyicisi etkin |
| 04_grants_and_rls_audit.test.sql | PASS | [SEC-10] Hiçbir tablonun sahibi istemci rolü değil |
