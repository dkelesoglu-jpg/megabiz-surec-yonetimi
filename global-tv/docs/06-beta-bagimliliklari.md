# 6. 20 Aralık Betası — Bağımlılık Raporu

Durum: 23 Ekim 2026 · Beta hedefi **korunuyor**. Yazılım geliştirme hiçbir hesaba bağımlı değildir;
aşağıdaki bağımlılıklar yalnızca **dağıtım kanalını** etkiler.

## 6.1 Beta dağıtımı: neye bağlı?

| Kanal | Şirket gerekir mi? | Ücretli hesap gerekir mi? | 20 Aralık'a hazır olabilir mi? |
|---|---|---|---|
| Android — doğrudan APK (davetli kişilere bağlantı) | Hayır | Hayır | ✅ Evet — bağımlılık yok |
| Android — Google Play dahili/kapalı test | Hayır (kişisel hesap yeterli) | Evet, 25 USD | ✅ Hesap ≤ 1 Aralık açılırsa |
| iOS — TestFlight (harici test, ~200 kişiye kadar sorunsuz) | Hayır (bireysel hesap yeterli) | Evet, 99 USD/yıl | ✅ Hesap ≤ 24 Kasım açılırsa |
| iOS — TestFlight, kurumsal hesap | **Evet** (şirket + D-U-N-S) | Evet | ⚠️ Şirket Kasım başında kurulmazsa yetişmez |
| iOS — mağazasız | — | — | ❌ Yalnızca geliştiricinin Mac'ine bağlı birkaç cihaz; geniş beta mümkün değil |

## 6.2 Bağımlılık listesi

| ID | Bağımlılık | Etkilediği | Son karar tarihi | Karar yoksa ne olur |
|---|---|---|---|---|
| **D1** | Apple Developer Program kaydı (bireysel veya kurumsal) | iOS betası | **24 Kasım 2026** (bireysel); kurumsal için şirket + D-U-N-S **10 Kasım**'a kadar | Beta 20 Aralık'ta **yalnızca Android** başlar, iOS ertelenir |
| **D2** | Kalıcı uygulama adı + paket kimliği | Mağazaya ilk yükleme (sonradan değiştirilemez) | D1 ile aynı gün | Mağazaya yükleme yapılamaz; APK betası etkilenmez |
| **D3** | Google Play Console | Android'in mağaza üzerinden betası | 1 Aralık 2026 | Android betası APK ile yapılır (çalışır, ama kurulum biraz daha zahmetli) |
| **D4** | Proje e-postası + yeni Supabase hesabı (ücretsiz) | Gerçek giriş ve sohbetin cihazlarda test edilmesi | **7 Kasım 2026** | Sohbet/giriş yalnızca demo modda; beta öncesi gerçek ortam testi kısalır |
| **D5** | Özel depo (ücretsiz) | Kodun ve test APK'larının gizliliği | Mümkün olan en erken | Kod ve APK'lar herkese açık kalır |
| **D6** | Gizlilik politikası yayını (ücretsiz barındırma) | Mağaza başvuruları, beta onay ekranı | 1 Aralık 2026 | TestFlight harici test başvurusu yapılamaz |

## 6.3 Zaman çizelgesi (D1 bireysel seçilirse)

```
24 Kas  Apple bireysel kayıt (1–2 gün)            → D1
25 Kas  App Store Connect'te uygulama kaydı (kalıcı kimlik) → D2
27 Kas  İlk TestFlight dahili sürüm (inceleme yok)
15 Ara  Kod dondurma
16 Ara  TestFlight harici test başvurusu (beta incelemesi ~1–2 gün)
20 Ara  Beta: iOS (TestFlight) + Android (APK veya Play kapalı test)
```

## 6.4 Ürün sahibinden beklenen kararlar

1. **D1:** Apple — (A) şimdi bireysel hesap, sonra şirkete aktarım / (B) şirket kurulana kadar iOS betası yok / (C) şirketi Kasım başında kur.
2. **D4:** Proje e-postası açılsın mı? (Supabase, GitHub ve ileride mağaza hesapları bununla açılır.)
3. **D5:** Kod yeni özel depoya taşınsın mı?
4. **D2:** Kalıcı ad ve paket kimliği — en geç D1 ile aynı gün.

Ücretli hiçbir adım onayınız olmadan atılmayacaktır.
