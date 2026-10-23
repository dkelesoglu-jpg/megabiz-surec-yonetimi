# Uygulama kimliği (tek kaynak)

`AppIdentity.xcconfig` uygulamanın **görünen adını** ve **paket kimliğini** tek yerde tutar.
Hem Android (Gradle) hem iOS (Xcode) bu dosyayı okur. Dosyaya yorum satırı eklemeyin
(iki sistem farklı yorum sözdizimi kullanır).

| Anahtar | Şu anki değer | Durum |
|---|---|---|
| `APP_DISPLAY_NAME` | `Global TV` | **Geçici** — ürün sahibinin onayı bekleniyor |
| `APP_ID_BASE` | `com.placeholder.globaltv` | **Geçici** — ürün sahibinin onayı bekleniyor |

## Ortama göre kimlik (Android)

| Ortam (`APP_ENV`) | Android paket kimliği | Ana ekrandaki ad |
|---|---|---|
| `dev` | `<APP_ID_BASE>.dev` | Global TV DEV |
| `staging` | `<APP_ID_BASE>.staging` | Global TV BETA |
| `prod` | `<APP_ID_BASE>` | Global TV |

Böylece test ve canlı sürüm aynı telefonda yan yana kurulabilir. iOS'ta şimdilik tek kimlik
kullanılır (ortam ayrımı uygulama içi etiketle görünür); Apple hesabı açılınca iOS'a da eklenecek.

## Güvenlik kilitleri

- `prod` derlemesi, kimlik hâlâ `placeholder` içeriyorsa **derlenmez**.
- `prod` derlemesi, `android/key.properties` (yükleme anahtarı) yoksa **derlenmez**;
  dev/staging test APK'ları hata ayıklama anahtarıyla imzalanır.

## Kalıcı kimliğe / kurumsal hesaba geçiş

1. Onaylanan ad ve kimliği bu dosyaya yazın (tek değişiklik).
2. iOS: `ios/Flutter/LocalSigning.xcconfig` dosyasına `DEVELOPMENT_TEAM = <Takım Kimliği>` yazın
   (bu dosya git'e girmez; şablon: `LocalSigning.xcconfig.example`). Bireysel → kurumsal takıma
   geçişte yalnızca bu satır değişir.
3. Android: yükleme anahtarını (`upload-keystore.jks`) oluşturup `android/key.properties`'i doldurun
   (şablon: `android/key.properties.example`). Google Play App Signing açık olacağı için bu anahtar
   ileride hesap değişse de güvenle sıfırlanabilir/aktarılabilir.

⚠️ Paket kimliği mağazada **ilk yüklemeden sonra değiştirilemez**. Bu yüzden kalıcı kimlik
mağazaya ilk gönderimden önce onaylanmalıdır.
