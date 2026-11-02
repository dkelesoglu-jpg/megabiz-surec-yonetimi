# 11 — 20 Aralık kontrollü beta hazırlığı (2 Kasım 2026)

Kalıcı marka adı ve paket kimliği **değiştirilmedi**: çalışma adı "Global TV", geçici kimlik `com.placeholder.globaltv`.

## 1. Eksik özellikler — önem sırasıyla

**P0** = beta için zorunlu · **P1** = beta için güçlü öneri · **P2** = beta sonrası.
Süreler geliştirme süresidir.

| # | Öncelik | İş | Neden | Bağımlılık | Süre |
|---|---|---|---|---|---|
| 1 | P0 | globaltv-dev + staging projeleri ve gerçek sunucu testleri | Giriş, sohbet ve moderasyon gerçek ortamda doğrulanmadı | **Onayınız** (09) | 1 gün |
| 2 | P0 | Tüm özelliklerin gerçek Android + iPhone testi | Gerçek cihazda denenmeyen özellik tamamlanmış sayılmaz | 1 ve cihazlar (10) | 2 × yarım gün |
| 3 | P0 | Sunucu tarafında ülke tespiti (`get-stream`) | Şu an CDN başlığı yoksa uygulamanın bildirdiği ülkeye güveniliyor: yurt dışı kullanıcı TR yayınına erişebilir (**lisans ihlali riski**) | 1 (gelen başlıklar ölçülecek) | 0,5 gün |
| 4 | P0 | Şifre sıfırlama akışı | Şifresini unutan beta kullanıcısı hesabına giremez | 1 | 0,5 gün |
| 5 | P0 | Uygunsuz içerik filtresi (TR/EN kelime listesi, sunucuda) | MVP kabul kriteri (M4, M6); Apple 1.2 kullanıcı içeriği kuralı | — | 1 gün |
| 6 | P0 | Oynatıcıda otomatik yeniden bağlanma | MVP kabul kriteri (M1): ağ kesilip gelince kendiliğinden devam etmeli. Şu an "Tekrar dene" düğmesi var | — | 0,5 gün |
| 7 | P0 | Gizlilik politikası, aydınlatma metni, kullanım koşulları + topluluk kuralları (§2) ve uygulama içi bağlantılar | KVKK, mağaza başvuruları, izin kartından bağlantı | Hukuki inceleme | 1 gün (taslak) |
| 8 | P0 | RTÜK / yayın mevzuatı değerlendirmesi (§3) | Türkiye'de internetten TV yayını lisansa tabi; lisans yalnızca şirketlere veriliyor | **Kararınız + hukukçu** | — |
| 9 | P1 | Çökme ve hata takibi | Beta raporunda çökme oranı (%99,5 hedefi) ölçülemez | Ücretsiz katmanlı servis hesabı (**onay**) | 0,5 gün |
| 10 | P1 | Yönetim panelinin barındırılması (moderatörler için) | Betada moderasyon panelden yapılacak | Barındırma kararı (**onay**, canlıya dağıtım) | 0,5 gün |
| 11 | P1 | Yönetici hesaplarında iki adımlı doğrulama (MFA) | Panel gerçek veriye bağlanınca zorunlu güvenlik | 1 | 0,5 gün |
| 12 | P1 | Uygulama simgesi ve açılış ekranı | Şu an Flutter varsayılan simgesi | Görsel (çalışma adıyla geçici) | 0,5 gün |
| 13 | P1 | Uygulama içi geri bildirim bağlantısı | Beta geri bildirimi toplamak | — | 0,25 gün |
| 14 | P1 | Kullanıcı adı ve avatar düzenleme | MVP M4 | — | 0,5 gün |
| 15 | P1 | Tam ekran oynatma | Beklenen temel davranış | — | 0,5 gün |
| 16 | P1 | Özel SMTP (kayıt e-postaları) | Supabase dahili e-postası saatte çok az e-posta gönderir | Hesap (**onay**) | 0,25 gün |
| 17 | P2 | Apple / Google ile giriş | Beta yalnızca e-postayla olursa Apple 4.8 gerekmez | Mağaza hesapları | 1 gün |
| 18 | P2 | Reklam (AdMob) | Önerim: betaya reklam koyulmaması (kapsam ve onay yükü) | AdMob hesabı (**onay**) | 1 gün |
| 19 | P2 | EPG, bildirimler, Chromecast, ek diller | MVP dışı | — | — |

**P0 geliştirme toplamı:** ~4,5 gün. 1., 7. ve 8. maddeler sizin onay ve kararlarınıza bağlı. 15 Aralık kod dondurmasına göre süre yeterli.

## 2. Gizlilik ve hukuki belgeler

| Belge | İçerik | Durum | Not |
|---|---|---|---|
| **Aydınlatma metni** (KVKK m.10) | Veri sorumlusu, amaç, hukuki sebep, aktarım (yurt dışı dahil), haklar | Yok | Veri sorumlusu kim olacak: şirket kurulana kadar siz (gerçek kişi)? → **karar** |
| **Açık rıza metni** (analitik) | Uygulamadaki izin kartının yasal metni | Kart var, metin yok | İzin kartı ve Gizlilik ekranı buna bağlanacak |
| **Gizlilik politikası** (mağazalar için herkese açık URL) | Toplanan veriler, saklama (13 ay), silme, iletişim | Yok | Ücretsiz statik sayfa yeterli; yayınlamak **onayınızla** |
| **Kullanım koşulları + topluluk kuralları** | Sohbet kuralları, yaptırımlar (susturma/yasak), yaş sınırı, sorumluluk | Yok | Apple 1.2: kullanıcı içeriği olan uygulamalarda zorunlu |
| **Çerez / izleme beyanı** | — | Gerekmiyor | Reklam kimliği ve izleme yok |
| **Mağaza veri beyanları** | Google Data Safety, Apple Privacy Label | Yok | 1. ve 2. maddelerden türetilir |

Taslakları ben hazırlayabilirim. **Yayından önce hukuki inceleme şart.** Bu belgeler hukuki danışmanlık yerine geçmez.

## 3. Türkiye mevzuatı: karar gerektiren konular
> Aşağıdakiler bilgilendirmedir, hukuki görüş değildir. Güncel durum bir hukukçuyla teyit edilmelidir.

| Konu | Özet | Etkisi |
|---|---|---|
| **RTÜK: internetten yayın** (6112 s. Kanun m.29/A; 1 Ağustos 2019 tarihli internet yayınları yönetmeliği) | İnternetten radyo/TV sunan medya hizmet sağlayıcıları için lisans, platform işletmecileri için yayın iletim yetkisi öngörülüyor. Lisans **yalnızca Türk Ticaret Kanunu'na göre kurulmuş şirketlere** veriliyor; lisanssız yayına erişim engeli kararı verilebiliyor | Herkese açık yayın öncesi **şirket + RTÜK değerlendirmesi** gerekebilir. Betanın kapsamı (davetli, demo/açık lisanslı test içerikleri) hukukçuyla netleştirilmeli |
| **KVKK: yurt dışına aktarım** (m.9, 2024 değişikliği) | Supabase'in AB bölgesi kişisel verinin yurt dışına aktarılması demek. Standart sözleşme mekanizması ve imzadan sonra **5 iş günü içinde Kurul'a bildirim** gerekiyor | globaltv-dev'e **gerçek kullanıcı verisi** girmeden önce çözülmeli. Testler sahte verilerle sürebilir |
| **5651: yer sağlayıcı** | Kullanıcı içeriği (sohbet) barındırıldığı için uyar-kaldır yükümlülükleri | Şikâyet ve moderasyon altyapısı hazır; iletişim adresi gerekir |
| Yayın hakları | Her kanal için hak belgesi (panelde yükleniyor), ülke kısıtı | Şu an yalnızca açık lisanslı / test akışları var |

## 4. Mağaza hazırlığı (hesap açmak onayınıza bağlı)
| İş | Son tarih | Not |
|---|---|---|
| Apple Developer (99 USD/yıl): bireysel veya kurumsal | **24 Kasım** | Yoksa iOS betası 20 Aralık'a yetişmez (yalnızca Android başlar) |
| Kalıcı ad + paket kimliği (D2) | Apple hesabıyla aynı gün | Mağazaya ilk yüklemeden sonra değiştirilemez; şu an geçici kimlik korunuyor |
| Google Play Console (25 USD) | 1 Aralık | Yoksa Android betası APK ile (çalışır) |
| Gizlilik politikası URL'si | 1 Aralık | TestFlight harici testi için gerekli |
| Yaş derecelendirmesi | 1 Aralık | Sohbet nedeniyle muhtemelen 12+ / Teen |
| Mağaza ekran görüntüleri ve açıklamalar (TR/EN) | 10 Aralık | Mevcut ekran görüntüleri temel alınır |
| TestFlight harici test başvurusu | **16 Aralık** | Apple beta incelemesi 1–2 gün sürer |

## 5. Mimari: Türkiye odaklı, globale hazır (korunuyor)
- Tüm metinler TR/EN dosyalarında; yeni dil = yeni dosya.
- Yayın hakları kanal ve ülke bazında; ülke dağılımı anonim raporlanıyor.
- Para birimi, saat dilimi ve tarih biçimi cihaz diline göre.
- Supabase bölgesi Frankfurt (Türkiye'ye düşük gecikme). İleride bölge eklemek için şema değişikliği gerekmez.
- Kimlik dosyası tek yerde: marka adı kararı tek dosyalık bir değişiklik.

## 6. Sizden beklenen kararlar
1. **Supabase:** A seçeneği (proje e-postasıyla yeni hesap) onaylanıyor mu? (09 §2)
2. **Veri sorumlusu:** Şirket kurulana kadar kim? Beta öncesi şirket kurulacak mı? (RTÜK ve KVKK için önemli)
3. **Hukuk:** RTÜK ve KVKK değerlendirmesi için hukukçuya danışılacak mı? Beta, gerçek TV kanalı olmadan yalnızca test/açık lisanslı içerikle mi yapılacak?
4. **Apple hesabı:** bireysel mi, kurumsal mı, iOS betası ertelensin mi? (son tarih 24 Kasım)
5. **P0 sırası:** Önerim 4 → 6 → 5 → 3 → 7 (taslak). 1 ve 2 onayınızla paralel yürür.
6. **Betaya reklam:** Önerim reklamsız beta.
