# 10 — Gerçek cihaz test protokolü: Android ve iPhone (2 Kasım 2026)

**Kural:** Gerçek telefonda denenmemiş bir özellik "tamamlandı" sayılmaz.
Emülatör ve simülatör testleri yalnızca ön kontroldür.

## 1. Bugünkü durum

| Özellik | Otomatik test | Emülatör / simülatör | Gerçek Android | Gerçek iPhone |
|---|---|---|---|---|
| Canlı TV (liste, filtre, oynatma) | ✅ | ✅ uçtan uca | ⏳ yapılmadı | ⏳ yapılmadı |
| Favoriler | ✅ | ✅ | ⏳ | ⏳ |
| Kullanıcı girişi (gerçek sunucu) | ✅ gerçek Supabase yığını | — | ⏳ globaltv-dev bekleniyor | ⏳ |
| Sohbet (iki cihaz arası) | ✅ gerçek Supabase yığını | — | ⏳ globaltv-dev bekleniyor | ⏳ |
| Moderasyon (kilit, yavaş mod, susturma, yasak, gizleme) | ✅ | — | ⏳ (demo: kilit + yavaş mod denenebilir) | ⏳ |
| Gizlilik izni ve ayarı | ✅ | ✅ (izin kartı, gizlilik ekranı) | ⏳ | ⏳ |
| Hesap silme | ✅ gerçek Supabase yığını | — | ⏳ globaltv-dev bekleniyor | ⏳ |

**Özet:** Hiçbir özellik henüz gerçek cihazda doğrulanmadı. Hepsi "tamamlanmadı" kabul edilir.

## 2. Test aşamaları

| Aşama | Ne zaman | Bağlantı | Kurulum |
|---|---|---|---|
| **A — Demo** | Hemen | Sunucusuz (demo modu) | Android: test APK'sı ([05 §5.1](05-cihaz-testi-rehberi.md)). iPhone: Mac + Xcode + ücretsiz Apple kimliği ([05 §5.2-c](05-cihaz-testi-rehberi.md)) |
| **B — Gerçek sunucu** | globaltv-dev açıldıktan sonra | Supabase dev | Ben `env/dev.json` ile yeni APK üretirim; iPhone aynı yöntemle |
| **C — Beta adayı** | 15 Aralık kod dondurma sonrası | Supabase staging | Android: APK veya Play kapalı test. iPhone: TestFlight (Apple hesabı onayınızla) |

**Gereken cihazlar (en az):**
- 1 Android (güncel) + 1 iPhone (güncel)
- Sohbet testleri için **ikinci bir cihaz**: herhangi bir telefon, emülatör veya ikinci hesapla aynı telefon
- Mümkünse eski bir cihaz: Android 9–10 / iPhone 11 sınıfı

## 3. Test senaryoları

Her senaryo iki platformda da yapılır. Sonuç tablosuna (§4) **Geçti / Kaldı / Engellendi** yazılır.

### 3.1 Canlı TV (Aşama A'dan itibaren)
| ID | Adım | Beklenen |
|---|---|---|
| TV-1 | Uygulamayı ilk kez aç | Canlı TV listesi; üstte izin kartı; köşede DEV/BETA etiketi |
| TV-2 | "Big Buck Bunny"yi aç | 3 sn içinde oynar; CANLI etiketi; ses aç/kapa çalışır |
| TV-3 | Arama "tears", ülke NL, kategori Eğlence | Liste doğru süzülür |
| TV-4 | İzlerken Wi-Fi'yi kapat, mobil veriye geç | Oynatma sürer veya "Tekrar dene" ile döner |
| TV-5 | Uçak modu 10 sn → kapat → Tekrar dene | Oynatma döner; uygulama çökmez |
| TV-6 | İzlerken uygulamayı arka plana al, 1 dk sonra dön | Uygulama açık; ekran bozuk değil |
| TV-7 | Telefonu yatay çevir; klavyeyi aç | Taşma yok; sohbet görünür |
| TV-8 | 30 dk kesintisiz izle | Çökme, aşırı ısınma, ses kayması yok |

### 3.2 Favoriler
| ID | Adım | Beklenen |
|---|---|---|
| FV-1 | Kanalda kalbe dokun → Favoriler sekmesi | Kanal listede |
| FV-2 | Uygulamayı kapat/aç (misafir) | Misafir favorisi yalnızca o oturum için (beklenen davranış) |
| FV-3 | (Aşama B) Giriş yap → favori ekle → çıkış → başka cihazda giriş | Favori ikinci cihazda görünür |

### 3.3 Kullanıcı girişi ve hesap (Aşama B)
| ID | Adım | Beklenen |
|---|---|---|
| GR-1 | Profil → Hesap oluştur (gerçek e-posta) | Doğrulama e-postası gelir; doğrulayınca giriş |
| GR-2 | Yanlış şifre | "E-posta veya şifre hatalı." |
| GR-3 | Aynı e-postayla ikinci kayıt | "Bu e-posta ile kayıtlı bir hesap zaten var." |
| GR-4 | Uygulamayı kapat/aç | Oturum açık kalır |
| GR-5 | Çıkış yap | Profil "Misafir"e döner |
| GR-6 | Hesabı sil → onayla | Hesap silinir; aynı e-postayla giriş başarısız; eski mesajlar "[deleted]" |

### 3.4 Sohbet (Aşama B, iki cihaz)
| ID | Adım | Beklenen |
|---|---|---|
| SH-1 | Misafir sohbete yazmaya çalışır | "Sohbete katılmak için giriş yapın." |
| SH-2 | Cihaz 1 mesaj yazar | Cihaz 2'de **1 saniyeden kısa sürede** görünür |
| SH-3 | 10 sn'de 6 mesaj | "Çok hızlı mesaj gönderiyorsunuz…" |
| SH-4 | Cihaz 2, Cihaz 1'in mesajını uzun basıp şikâyet eder | "Teşekkürler…"; şikâyet panelde görünür |
| SH-5 | Cihaz 2, Cihaz 1'i engeller | Cihaz 1'in mesajları Cihaz 2'de kaybolur; Profil → Engellenenler'de kullanıcı adı görünür |
| SH-6 | Uzun mesaj, emoji, Türkçe karakter (ğüşıöç) | Doğru görünür |

### 3.5 Moderasyon (Aşama A'da kısmen; Aşama B'de panelden)
| ID | Adım | Beklenen |
|---|---|---|
| MD-1 | (A) "Demo Haber TR" sohbeti | Kilitli oda uyarısı; yazma alanı yok |
| MD-2 | (A) "Demo Spor TR"de mesaj gönder | Yavaş mod geri sayımı 30 → 0; sonra yeniden gönderilebilir |
| MD-3 | (B) Panelden oda kilitle | Telefonda **yeniden açmadan** uyarı belirir |
| MD-4 | (B) Panelden kullanıcıyı 5 dk sustur | Telefonda kalan süre görünür; süre bitince yazma açılır; Profil'de hesap durumu |
| MD-5 | (B) Panelden mesajı gizle | Yazarında "yalnızca siz görüyorsunuz…"; diğer cihazda mesaj kaybolur |
| MD-6 | (B) Panelden yasakla | "…sohbete katılımınız kapatıldı. Yayınları izlemeye devam edebilirsiniz." Kanallar oynamaya devam eder |

### 3.6 Gizlilik izinleri
| ID | Adım | Beklenen |
|---|---|---|
| GZ-1 | İlk açılış: izin kartında "İzin verme" | Kart kaybolur; yeniden açılışta tekrar sorulmaz |
| GZ-2 | Profil → Gizlilik ve veriler | Anahtar kapalı; toplanan/toplanmayan veriler listesi |
| GZ-3 | (B) İzni aç, 2 dk izle, panel → Raporlama | İzlenme süresi gelir; **ad, e-posta, kullanıcı kimliği yok** |
| GZ-4 | (B) İzni kapat, 2 dk izle | Raporda yeni kayıt yok |
| GZ-5 | Uygulamayı silip yeniden kur | İzin yeniden sorulur |
| GZ-6 | iOS: Ayarlar → Gizlilik → İzleme | Uygulama izleme izni **istemez** (reklam kimliği kullanılmıyor) |

### 3.7 Dil ve erişilebilirlik
| ID | Adım | Beklenen |
|---|---|---|
| DL-1 | Profil → Dil → English | Tüm ekranlar ve uyarılar İngilizce |
| DL-2 | Telefonun yazı boyutunu en büyüğe al | Taşma yok; metinler okunur |
| DL-3 | TalkBack / VoiceOver açık, kanal aç ve favorile | Düğmeler sesli okunur |

## 4. Sonuç kaydı
Her tur için `docs/test-raporlari/cihaz-<tarih>.md` dosyası:

| ID | Android (model / sürüm) | iPhone (model / iOS) | Not / ekran görüntüsü |
|---|---|---|---|

Hata kaydında şunlar yazılır:
- Cihaz ve işletim sistemi
- Uygulama sürümü (Profil'in altındaki ortam etiketi + APK numarası)
- Adımlar, beklenen, gerçekleşen
- Ekran görüntüsü veya kayıt

**Önem derecesi:**
- **P0:** Çökme, veri kaybı, güvenlik ya da gizlilik ihlali
- **P1:** Ana akış çalışmıyor
- **P2:** Görsel veya küçük sorun

## 5. Size düşen (Aşama A, bugün yapılabilir, yaklaşık 30 dk)
1. Son test APK'sını Android telefonunuza kurun (05 §5.1). ⚠️ `apk-19` **4 Kasım**'da silinir. Bu aşamanın yeni APK'sı 30 gün saklanacak.
2. TV-1…TV-7, FV-1, MD-1, MD-2, GZ-1, GZ-2, DL-1, DL-2 senaryolarını deneyin.
3. Sonuçları kısa bir mesajla bana iletin; ben rapora işlerim.
