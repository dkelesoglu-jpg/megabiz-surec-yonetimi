# Yönetim Paneli (web)

Durum: **H2'de başlıyor** — bu klasör şimdilik yer tutucudur.

Plan: React + Vite + TypeScript + Supabase JS. Yalnızca `admin` / `moderator` rolü, MFA zorunlu.

MVP ekranları:
1. Giriş (Supabase Auth + MFA)
2. Kanallar — liste, ekle/düzenle, aktif/pasif, logo
3. Yayın hakları — kanal başına hak kaydı, belge yükleme (Storage: `rights-documents`, özel bucket), geçerlilik tarihleri, doğrulama
4. Şikâyet kuyruğu — mesajı gör, gizle, kullanıcıyı sustur/yasakla, şikâyeti kapat
5. Denetim kaydı (audit log)

Panel `service_role` anahtarı **kullanmaz**; yetki, admin kullanıcısının oturumu ve RLS ile sağlanır.
Hassas işlemler (ör. hesap silme kuyruğunu işlemek) Edge Function'larda yapılır.
