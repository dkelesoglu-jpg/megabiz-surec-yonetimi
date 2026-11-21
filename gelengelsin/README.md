# GelenGelsin: tıklanabilir prototip

**"Ben gidiyorum, gelen gelsin."** Mobil öncelikli sosyal plan uygulaması. Pilot: İstanbul, 18+.

Bu klasör, repodaki Megabiz projesinden bağımsızdır; aynı teknoloji yığınını kullanır
(Vite + React 19 + TypeScript + Tailwind 4). Canlı hesap ya da ücretli servis gerekmez.
Tüm veriler demo verisidir ve yalnızca tarayıcıda (localStorage) saklanır.

## Çalıştırma

```bash
cd gelengelsin
npm install
npm run dev        # http://localhost:5173 (telefondan aynı ağdaki IP ile de açılır)
npm test           # kural motoru senaryo testleri (Vitest)
npm run build      # tip kontrolü + tek dosyalık derleme → dist/index.html
npm run e2e        # iki demo kullanıcıyla uçtan uca tarayıcı testi (önce build)
```

`dist/index.html` tek dosyadır; sunucu olmadan doğrudan tarayıcıda açılabilir.

## Demo kullanıcılar

Üst bardaki sarı **DEMO** seçicisiyle kullanıcı değiştirilir:

| Kullanıcı | Rol |
|---|---|
| Ayşe | Plan sahibi senaryosu (Roma seyahat planı ve geçmiş bir planı var) |
| Mert | Katılımcı senaryosu |
| Zeynep, Can, Elif | Diğer plan sahipleri/katılımcılar |
| Deniz (Mod) | Moderatör: şikâyet kuyruğu ve pilot metrikleri (Profil sekmesi) |

Profil → "Demo verisini sıfırla" ile başa dönülür.

## Yapı

```
src/domain/   types.ts (veri modeli) · engine.ts (tüm kurallar) · seed.ts (demo veri) · engine.test.ts
src/state/    store.tsx (durum, localStorage, hash yönlendirme)
src/screens/  Discover · PlanDetail · PlanForm · MyPlans · Messages/ChatRoom · Notifications · Profile · Admin
src/ui/       kit.tsx (bileşenler) · PlanCard.tsx
e2e/flow.mjs  Playwright uçtan uca senaryo
docs/         MVP-PLANI.md · supabase-taslak.sql · ekranlar/
```

Canlı sürüm planı: [docs/MVP-PLANI.md](docs/MVP-PLANI.md)
