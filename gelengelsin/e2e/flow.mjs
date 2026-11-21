// Uçtan uca senaryo: iki demo kullanıcıyla (Ayşe = plan sahibi, Mert = katılımcı)
// mobil görünümde tıklayarak doğrular. Çalıştırma: npm run build && npm run e2e
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const PORT = 4179;
const BASE = `http://localhost:${PORT}/`;
const SHOTS = path.resolve('docs/ekranlar');
mkdirSync(SHOTS, { recursive: true });

const server = spawn(path.resolve('node_modules/.bin/vite'), ['preview', '--port', String(PORT), '--strictPort'], { stdio: 'pipe' });
await new Promise((res, rej) => {
  server.stdout.on('data', (d) => d.toString().includes(String(PORT)) && res());
  server.on('exit', (c) => rej(new Error('preview kapandı ' + c)));
  setTimeout(() => rej(new Error('preview zaman aşımı')), 20000);
});

const results = [];
const check = (name, cond) => {
  results.push({ name, ok: !!cond });
  console.log(`${cond ? '✅' : '❌'} ${name}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'tr-TR',
  permissions: ['clipboard-read', 'clipboard-write'],
});
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const tid = (id) => page.getByTestId(id);
const as = async (userId) => { await tid('demo-user').selectOption(userId); await page.waitForTimeout(150); };
const nav = async (hash) => { await page.evaluate((h) => { location.hash = h; }, hash); await page.waitForTimeout(200); };
// Görünür olana kadar kısa süre bekler (ekran geçişleri için).
const vis = (id) => tid(id).waitFor({ state: 'visible', timeout: 3000 }).then(() => true, () => false);
// Tek dosyalık derlemede JS kodu sayfaya gömülü; yalnızca görünen metni kontrol et.
const bodyText = () => page.evaluate(() => document.body.innerText);
const shot = (name) => page.screenshot({ path: path.join(SHOTS, `${name}.png`) });
const noOverflow = async (label) => {
  const o = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  check(`Mobil: yatay taşma yok (${label})`, o <= 0);
};

try {
  await page.goto(BASE);
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await as('u_ayse');

  // --- Keşfet ---
  check('Keşfet başlığı görünüyor', await page.getByText('Bugün nereye gidiyoruz?').isVisible());
  await shot('01-kesfet');
  await noOverflow('Keşfet');
  await tid('filter-today').click();
  check('“Bugün” filtresi sonuç veriyor', (await tid('result-count').innerText()).match(/^[1-9]/));
  await tid('filter-weekend').click();
  check('“Hafta sonu” filtresi sonuç veriyor', (await tid('result-count').innerText()).match(/^[1-9]/));
  await page.getByRole('button', { name: 'Tümü' }).click();

  // --- 1) Ayşe plan açar ---
  await tid('nav-/create').click();
  await tid('type-need_people').click();
  check('Plan türü yardımcı metni değişiyor', (await tid('type-helper').innerText()).includes('Ekibin eksik'));
  await tid('f-title').fill('Moda’da akşam basketboluna 1 kişi lazım');
  await tid('cat-spor').click();
  await tid('f-district').selectOption('Kadıköy');
  const tomorrow = await page.evaluate(() => { const d = new Date(Date.now() + 86400000); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  await tid('f-date').fill(tomorrow);
  await tid('f-time').fill('20:00');
  await page.getByRole('button', { name: 'Azalt' }).click();
  await page.getByRole('button', { name: 'Azalt' }).click();
  check('Kontenjan 1’e indi', (await tid('f-capacity').innerText()) === '1');
  await tid('more-toggle').click();
  await tid('f-meeting').fill('Moda Sahil basket sahası, kuzey pota');
  await tid('f-cost').fill('Ücretsiz, top bende');
  await shot('02-plan-ac');
  await noOverflow('Plan aç');
  await tid('submit-plan').click();
  await page.waitForTimeout(250);
  const planId = (await page.evaluate(() => location.hash)).split('/')[2];
  check('Plan oluşturuldu ve detayına gidildi', planId?.startsWith('plan_'));
  check('Plan sahibine aşama çubuğu gösteriliyor (Plan yayında)', (await tid('owner-stepper').innerText()).includes('Plan yayında'));
  await shot('03-plan-yayinda');

  // --- 2) Mert keşfetten bulur ---
  await as('u_mert');
  await nav('/');
  await tid('filter-district').selectOption('Kadıköy');
  check('Mert planı Keşfet’te görüyor', await vis(`plan-card-${planId}`));
  await tid(`plan-card-${planId}`).click();
  check('Onaysız kişi kesin buluşma noktasını görmüyor', await vis('meeting-hidden'));
  await noOverflow('Plan detayı (ziyaretçi)');
  check('Kesin adres sayfada yok', !(await bodyText()).includes('kuzey pota'));

  // Yetkisiz sohbet erişimi
  await nav(`/plan/${planId}/chat`);
  check('Yetkisiz sohbet erişimi engelleniyor', await vis('chat-denied'));
  check('Yetkisiz kişiye sohbet içeriği gösterilmiyor', !(await bodyText()).includes('planı açtı'));
  await shot('04-yetkisiz-sohbet');

  // 3) Katılma isteği
  await nav(`/plan/${planId}`);
  await tid('join').click();
  await tid('join-message').fill('Selam! Ben gelirim, orta seviyeyim.');
  await tid('send-request').click();
  await page.waitForTimeout(150);
  check('İstek gönderildi durumu görünüyor', (await tid('request-status').innerText()).includes('İsteğin gönderildi'));
  await shot('05-istek-bekliyor');

  // Geri çekme + yeniden gönderme
  await tid('withdraw').click();
  await page.waitForTimeout(150);
  check('İstek geri çekildi durumu görünüyor', (await tid('request-status').innerText()).includes('geri çektin'));
  await tid('join').click();
  await tid('send-request').click();
  await page.waitForTimeout(150);
  check('Geri çekilen istek yeniden gönderilebildi', (await tid('request-status').innerText()).includes('İsteğin gönderildi'));

  // 4) Ayşe onaylar
  await as('u_ayse');
  check('Ayşe’de okunmamış bildirim var', /[1-9]/.test(await tid('bell').innerText()));
  await nav(`/plan/${planId}`);
  check('Ayşe bekleyen isteği görüyor', await vis('request-u_mert'));
  await shot('06-istek-onay');
  await noOverflow('Plan detayı (sahip)');
  await tid('approve-u_mert').click();
  await page.waitForTimeout(150);
  check('Onay sonrası plan dolu', (await tid('spots').innerText()) === 'Dolu');

  // 5) Mert: sohbet + buluşma noktası açık
  await as('u_mert');
  await nav(`/plan/${planId}`);
  check('Mert onaylandı durumunu görüyor', (await tid('request-status').innerText()).includes('Onaylandın'));
  check('Kesin buluşma noktası açıldı', (await tid('meeting-point').innerText()).includes('kuzey pota'));
  await shot('07-onaylandi');
  await tid('open-chat').click();
  await tid('chat-input').fill('Topu ben de getirebilirim 🏀');
  await tid('chat-send').click();
  await page.waitForTimeout(150);
  check('Sohbette mesaj görünüyor', (await tid('chat-log').innerText()).includes('Topu ben de getirebilirim'));
  check('Sohbette buluşma noktası görünüyor', (await tid('chat-meeting').innerText()).includes('kuzey pota'));
  await shot('08-sohbet');
  await noOverflow('Sohbet');

  // Dolu plan: Can katılamaz
  await as('u_can');
  await nav(`/plan/${planId}`);
  check('Dolu plana “Katılmak istiyorum” yerine “Plan dolu”', await vis('join-disabled'));
  await shot('09-dolu-plan');

  // 6) Mert ayrılır → yer geri gelir, erişim kalkar
  await as('u_mert');
  await nav(`/plan/${planId}`);
  await tid('leave').click();
  await tid('confirm-leave').click();
  await page.waitForTimeout(150);
  check('Ayrılınca boş yer geri geldi', (await tid('spots').innerText()) === '1 kişi lazım');
  check('Ayrılınca kesin buluşma noktası gizlendi', await vis('meeting-hidden'));
  await nav(`/plan/${planId}/chat`);
  check('Ayrılınca sohbet erişimi kaldırıldı', await vis('chat-denied'));
  await nav('/messages');
  check('Ayrılan kişinin Mesajlar listesinde sohbet yok', (await page.getByTestId(`chat-${planId}`).count()) === 0);

  // Düzenleme bildirimi: Can bekleyen istek gönderir, Ayşe saati değiştirir
  await as('u_can');
  await nav(`/plan/${planId}`);
  await tid('join').click();
  await tid('send-request').click();
  await as('u_ayse');
  await nav(`/plan/${planId}/edit`);
  await tid('f-time').fill('21:00');
  await tid('submit-plan').click();
  await page.waitForTimeout(150);
  await as('u_can');
  await nav('/notifications');
  check('Saat değişince bekleyen kişiye uygulama içi bildirim', (await tid('notifications').innerText()).includes('tarihi/saati değişti'));

  // İptal
  await as('u_ayse');
  await nav(`/plan/${planId}`);
  await tid('cancel-plan').click();
  await tid('confirm-cancel').click();
  await page.waitForTimeout(150);
  await as('u_can');
  await nav('/notifications');
  check('İptal bildirimi katılım isteyene gitti', (await tid('notifications').innerText()).includes('iptal edildi'));
  await nav(`/plan/${planId}`);
  check('İptal edilen plana katılım kapalı', await page.getByRole('button', { name: 'Plan iptal edildi' }).isVisible());
  await nav('/');
  check('İptal edilen plan Keşfet’ten kalktı', (await tid(`plan-card-${planId}`).count()) === 0);

  // Seed’deki dolu plan (p_foto)
  await as('u_mert');
  await nav('/plan/p_foto');
  check('Örnek dolu plan: istek gönderilemiyor', await vis('join-disabled'));

  // Paylaşım bağlantısı
  await nav('/plan/p_belgrad');
  await tid('share').click();
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  check('Paylaşım bağlantısı kopyalandı', clip.includes('#/plan/p_belgrad'));

  // Şikâyet + engelleme + moderasyon
  await tid('report-plan').click();
  await page.getByLabel('Spam / reklam').check();
  await page.getByRole('button', { name: 'Şikâyeti gönder' }).click();
  await page.waitForTimeout(150);
  await nav('/user/u_zeynep');
  await tid('block-user').click();
  await tid('confirm-block').click();
  await nav('/');
  const zeynepVisible = await page.evaluate(() => document.body.innerText.includes('Balat’ta renkli sokaklar'));
  check('Engellenen kullanıcının planları Keşfet’te gizli', !zeynepVisible);
  await as('u_deniz');
  await nav('/admin');
  check('Moderatör şikâyet kuyruğunu görüyor', (await tid('reports').innerText()).includes('Pazar Belgrad'));
  await shot('10-moderasyon');
  await page.locator('[data-testid^="remove-rep_"]').first().click();
  await page.waitForTimeout(150);
  await as('u_mert');
  await nav('/admin');
  check('Moderatör olmayan yönetim ekranına giremiyor', await page.getByText('yalnızca moderatörler').isVisible());

  // Plan gerçekleşti mi?
  await nav('/my');
  await tid('tab-past').click();
  await tid('outcome-yes-p_gecmis').click();
  await page.waitForTimeout(150);
  check('“Plan gerçekleşti mi?” yanıtı kaydedildi', (await tid('past-p_gecmis').innerText()).includes('Gerçekleşti dedin'));
  await shot('11-planlarim-gecmis');
  await noOverflow('Planlarım');

  check('Tarayıcı konsolunda hata yok', errors.length === 0);
  if (errors.length) console.log(errors);
} catch (e) {
  console.error('Test kesildi:', e.message.split('\n')[0]);
  await page.screenshot({ path: path.join(process.env.E2E_DEBUG_DIR ?? SHOTS, 'hata.png') }).catch(() => {});
  if (process.env.E2E_DEBUG_DIR) console.log(await page.evaluate(() => ({ sy: scrollY, ih: innerHeight, vv: visualViewport?.offsetTop, bh: document.body.style.overflow })));
  results.push({ name: 'beklenmeyen hata', ok: false });
} finally {
  await browser.close();
  server.kill();
}

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} kontrol geçti.`);
process.exit(failed.length ? 1 : 0);
