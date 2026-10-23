# İş Listesi — Yayın Lisansı ve İçerik Hakları

Kural: **Uygulamada yalnızca yayın hakkı doğrulanmış kaynaklar yer alır.** Ücretli, şifreli veya izinsiz yeniden dağıtılan yayınlar hiçbir koşulda eklenmez. Herkese açık "IPTV listeleri" kullanılmaz.

## Geliştirme ve test içerikleri (hemen)
- [x] Yalnızca test amaçlı yayımlanmış demo akışlar kullanılır (H1):
  - Apple geliştirici örnek HLS akışları (`devstreaming-cdn.apple.com` — Apple'ın HLS test amacıyla yayımladığı örnekler)
  - Mux test akışları (`test-streams.mux.dev` — Mux'un oynatıcı testi için sunduğu akışlar)
  - Blender Foundation açık filmleri (Big Buck Bunny, Sintel, Tears of Steel — CC BY lisansı, atıf gerekli)
- [ ] Demo akışların kullanım koşullarını tek tek kontrol edip bu listeye kaynak bağlantısıyla kaydetmek; beta'da kalacaklar için atıf ekranı (H2)

## Gerçek kanallar (beta ve sonrası)
- [ ] Hedef ülke listesi (öneri: Türkiye + 2–3 Avrupa ülkesi) — **ürün sahibi kararı** (H2)
- [ ] Aday kaynak türleri araştırması (H2):
  - FAST kanal sağlayıcıları / toplayıcıları (reklam destekli ücretsiz kanallar; gelir paylaşımlı sözleşme)
  - Kamu yayıncılarının yeniden dağıtım politikaları (çoğu yalnızca kendi uygulamasında izin verir — yazılı izin şart)
  - Yerel/bağımsız kanallar ve üniversite TV'leri (doğrudan anlaşma)
- [ ] Yayın hakkı sözleşme şablonu: kapsam ülkeleri, süre, cihaz türleri, reklam ekleme izni, sohbet/topluluk özelliğine izin, logo kullanımı, sonlandırma (avukat incelemesi gerekli) (H3)
- [ ] İlk 3 kanalla görüşme / niyet mektubu (H3–H5)
- [ ] Yönetim panelinde her kanal için belge yükleme + doğrulayan kişi + geçerlilik tarihleri (teknik: H5)

## Teknik güvenceler
- [x] Veritabanı: hakkı geçerli olmayan kanal RLS ile kullanıcıya görünmez (şema H1'de yazıldı)
- [ ] Hak bitiş tarihinden 14 gün önce panelde uyarı (H5)
- [ ] Coğrafi kısıtlama: `allowed_countries` dışındaki kullanıcıya kanal listelenmez (H5)
- [ ] Hak sahibinden gelen kaldırma talebi için prosedür ve iletişim adresi (24 saat içinde pasifleştirme) (H6)

## Hukuki
- [ ] Kullanım koşulları ve gizlilik politikası taslağı (KVKK + GDPR) — avukat onayı (H5)
- [ ] Telif şikâyeti (DMCA benzeri) iletişim sayfası (H6)
