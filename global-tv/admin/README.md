# Global TV — Yönetim Paneli (web)

Flutter uygulamasından bağımsız, mobil uyumlu web yönetim paneli.
React 19 + TypeScript + Vite + Tailwind CSS; veri katmanı Supabase'e hazır.

## Çalıştırma

```bash
cd global-tv/admin
npm ci
npm run dev          # http://localhost:5173 — demo modu
```

`.env.local` yoksa panel **demo modunda** açılır: sunucu yok, veriler bellekte, sayfa yenilenince sıfırlanır.
Demo hesapları (şifre `demo1234`): `admin@demo.local`, `editor@demo.local`, `moderator@demo.local`,
`izleyici@demo.local` (yetkisiz — girişi reddedilir).

Gerçek sunucu: `.env.example` → `.env.local`, `VITE_SUPABASE_URL` ve `VITE_SUPABASE_PUBLISHABLE_KEY` doldurulur.
Panel **yalnızca publishable key** kullanır; `service_role` / secret anahtar panele konmaz.

## Modüller

| Modül | Yol | Gerekli izin |
|---|---|---|
| Pano (kullanıcı, kanal, sohbet istatistikleri) | `/` | `dashboard.read` |
| Kanal yönetimi + kategoriler | `/channels` | `channels.manage` |
| Yayın hakları (ülke bazlı izin, geçerlilik, 14 gün uyarısı, ülke görünümü) | `/rights` | `rights.manage` |
| Kullanıcı yönetimi (durum, susturma, yasaklama, rol) | `/users` | `users.read` (+ `users.moderate`, `users.manage_roles`) |
| Sohbet moderasyonu (şikâyet kuyruğu, mesaj inceleme) | `/moderation` | `reports.manage` (+ `chat.moderate`) |
| Reklam alanları | `/ads` | `ads.manage` |
| Sistem ayarları (dil, sürüm, bakım modu) + duyurular | `/settings` | görüntüleme `dashboard.read`; düzenleme `settings.manage` / `announcements.manage` |
| Denetim kaydı | `/audit` | `audit.read` |

## Roller

| Rol | Yetkiler |
|---|---|
| Yönetici (`admin`) | Hepsi |
| İçerik yöneticisi (`editor`) | Pano, kanallar, yayın hakları, duyurular |
| Moderatör (`moderator`) | Pano, kullanıcıları görme, susturma/yasaklama, şikâyetler, mesaj gizleme |
| Kullanıcı (`user`) | Panele giremez |

## Güvenlik — üç katman

1. **Veritabanı (asıl kontrol):** `role_permissions` + `has_permission()`, RLS politikaları,
   `guard_profile_update` tetikleyicisi (rol/durum değişikliği, kendini değiştirme, yöneticiyi kısıtlama,
   son yönetici koruması), `admin_*` RPC'leri (izni yeniden kontrol eder). Bkz. `supabase/migrations/20261025000100_admin_panel.sql`.
2. **Denetim kaydı:** yönetim tablolarındaki her değişiklik tetikleyiciyle `audit_log`'a yazılır
   (kim, ne, hangi kayıt, önce/sonra). İstemcinin yazma/silme izni yoktur.
3. **Arayüz:** menü ve düğmeler izne göre gösterilir, sayfalar `Guard` ile korunur. Demo API de
   veritabanındaki kuralların aynısını uygular; arayüz bir düğmeyi gizlemeyi unutsa bile işlem reddedilir.

`src/lib/permissions.ts` ile sunucudaki izin tablosunun aynı olduğu testle doğrulanır.

## Testler

```bash
npm run typecheck
npm test                                              # birim + arayüz (Vitest)
PW_CHROMIUM_PATH=/opt/pw-browsers/chromium npm run test:e2e   # tarayıcı: masaüstü + mobil (Playwright)
```

## Henüz yapılmayanlar
- Gerçek Supabase'e karşı çalıştırma (ayrı Supabase hesabı bekleniyor)
- Yönetici hesapları için MFA zorunluluğu (Supabase MFA, gerçek sunucuya geçişte)
- Yayın hakkı belge yükleme (Supabase Storage, özel bucket)
- Panelin dağıtımı (barındırma yeri ürün sahibinin kararı; canlıya dağıtım yapılmadı)
