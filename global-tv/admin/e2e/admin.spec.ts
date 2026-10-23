import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill('demo1234');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('heading', { name: 'Pano' })).toBeVisible();
}

/** Menüden bir sayfaya geçer (mobilde önce menüyü açar). Demo verisi bellekte olduğu için sayfa yenilenmez. */
async function go(page: Page, label: string, menu = 'Ana menü', opener = 'Menüyü aç') {
  const open = page.getByRole('button', { name: opener });
  if (await open.isVisible() && (await open.getAttribute('aria-expanded')) !== 'true') await open.click();
  await page.getByRole('navigation', { name: menu }).getByRole('link', { name: label, exact: true }).click();
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('yönetici 9 modülün hepsinde gezinir; taşma ve konsol hatası yok', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await login(page, 'admin@demo.local');
  for (const [label, heading] of [
    ['Kanallar', 'Kanal yönetimi'], ['Yayın lisansları', 'Yayın lisansları'], ['Topluluk', 'Topluluk yönetimi'],
    ['Moderasyon', 'Moderasyon'], ['Reklam yönetimi', 'Reklam yönetimi'], ['Raporlama', 'Raporlama'],
    ['Sistem ayarları', 'Sistem ayarları'], ['Denetim kaydı', 'Denetim kaydı'], ['Pano', 'Pano'],
  ]) {
    await go(page, label!);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await noHorizontalScroll(page);
  }
  expect(errors).toEqual([]);
});

test('içerik yöneticisi kanal ekler ve yayın lisansı tanımlar', async ({ page }) => {
  await login(page, 'editor@demo.local');
  await go(page, 'Kanallar');
  await page.getByRole('button', { name: 'Kanal ekle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Yeni kanal' });
  await dialog.getByLabel('Kanal adı').fill('E2E Kanalı');
  await dialog.getByLabel('Kısa ad').fill('e2e-kanali');
  await dialog.getByLabel('Yayın adresi (HLS)').fill('https://ornek.com/e2e.m3u8');
  await dialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Kanal kaydedildi.')).toBeVisible();
  await expect(page.getByText('E2E Kanalı').filter({ visible: true }).first()).toBeVisible();

  await go(page, 'Yayın lisansları');
  await page.getByRole('button', { name: 'Lisans ekle' }).click();
  const rights = page.getByRole('dialog', { name: 'Yeni yayın lisansı' });
  await rights.getByLabel('Kanal').selectOption({ label: 'E2E Kanalı' });
  await rights.getByLabel('Hak sahibi').fill('E2E Yayıncılık');
  await rights.getByLabel('İzin verilen ülkeler').fill('TR, DE');
  await rights.getByLabel('Durum').selectOption('verified');
  await rights.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Lisans kaydedildi.')).toBeVisible();
  await expect(page.getByText('E2E Yayıncılık').filter({ visible: true }).first()).toBeVisible();
});

test('moderatör yetkisiz modülleri görmez ve doğrudan adresle açamaz', async ({ page }) => {
  await login(page, 'moderator@demo.local');
  const opener = page.getByRole('button', { name: 'Menüyü aç' });
  if (await opener.isVisible()) await opener.click();
  const menu = page.getByRole('navigation', { name: 'Ana menü' });
  await expect(menu.getByRole('link', { name: 'Kanallar', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'Denetim kaydı', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'Topluluk', exact: true })).toBeVisible();

  await page.evaluate(() => { history.pushState({}, '', '/audit'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByText('Bu sayfaya erişim yetkiniz yok')).toBeVisible();
});

test('dil (TR/EN) ve tema (koyu/açık) seçimi', async ({ page }) => {
  await login(page, 'admin@demo.local');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const opener = page.getByRole('button', { name: 'Menüyü aç' });
  if (await opener.isVisible()) await opener.click();
  await page.getByRole('button', { name: 'en', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: /^Theme:/ }).filter({ visible: true }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await go(page, 'Reports', 'Main menu', 'Open menu');
  await expect(page.getByRole('heading', { level: 1, name: 'Reports' })).toBeVisible();
  await noHorizontalScroll(page);
});

test('yetkisiz hesap giriş yapamaz', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-posta').fill('izleyici@demo.local');
  await page.getByLabel('Şifre').fill('demo1234');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('alert')).toContainText('erişim yetkisi yok');
});
