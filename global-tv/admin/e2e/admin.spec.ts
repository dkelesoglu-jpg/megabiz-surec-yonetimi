import { expect, test, type Page } from '@playwright/test';

async function login(page: Page, email: string) {
  await page.goto('/');
  await page.getByLabel('E-posta').fill(email);
  await page.getByLabel('Şifre').fill('demo1234');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('heading', { name: 'Pano' })).toBeVisible();
}

/** Menüden bir sayfaya geçer (mobilde önce menüyü açar). Demo verisi bellekte olduğu için sayfa yenilenmez. */
async function go(page: Page, label: string) {
  const opener = page.getByRole('button', { name: 'Menüyü aç' });
  if (await opener.isVisible()) await opener.click();
  await page.getByRole('navigation', { name: 'Ana menü' }).getByRole('link', { name: label, exact: true }).click();
}

async function noHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test('yönetici tüm modüllerde gezinir; sayfa taşması ve konsol hatası yok', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await login(page, 'admin@demo.local');
  for (const [label, heading] of [
    ['Kanallar', 'Kanal yönetimi'], ['Yayın hakları', 'Yayın hakları'], ['Kullanıcılar', 'Kullanıcı yönetimi'],
    ['Sohbet moderasyonu', 'Sohbet moderasyonu'], ['Reklam alanları', 'Reklam alanları'],
    ['Sistem ayarları', 'Sistem ayarları'], ['Denetim kaydı', 'Denetim kaydı'], ['Pano', 'Pano'],
  ]) {
    await go(page, label!);
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await noHorizontalScroll(page);
  }
  expect(errors).toEqual([]);
});

test('içerik yöneticisi kanal ekler ve yayın hakkı tanımlar', async ({ page }) => {
  await login(page, 'editor@demo.local');
  await go(page, 'Kanallar');
  await page.getByRole('button', { name: 'Kanal ekle' }).click();
  const dialog = page.getByRole('dialog', { name: 'Yeni kanal' });
  await dialog.getByLabel('Kanal adı').fill('E2E Kanalı');
  await dialog.getByLabel('Kısa ad').fill('e2e-kanali');
  await dialog.getByLabel('HLS yayın adresi').fill('https://ornek.com/e2e.m3u8');
  await dialog.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Kanal eklendi.')).toBeVisible();
  await expect(page.getByText('E2E Kanalı').filter({ visible: true }).first()).toBeVisible();

  await go(page, 'Yayın hakları');
  await page.getByRole('button', { name: 'Hak ekle' }).click();
  const rights = page.getByRole('dialog', { name: 'Yeni yayın hakkı' });
  await rights.getByLabel('Kanal').selectOption({ label: 'E2E Kanalı' });
  await rights.getByLabel('Hak sahibi').fill('E2E Yayıncılık');
  await rights.getByLabel('İzin verilen ülkeler').fill('TR, DE');
  await rights.getByLabel('Durum').selectOption('verified');
  await rights.getByRole('button', { name: 'Kaydet' }).click();
  await expect(page.getByText('Yayın hakkı kaydedildi.')).toBeVisible();
  await expect(page.getByText('E2E Yayıncılık').filter({ visible: true }).first()).toBeVisible();
});

test('moderatör yetkisiz modülleri görmez ve doğrudan adresle açamaz', async ({ page }) => {
  await login(page, 'moderator@demo.local');
  const opener = page.getByRole('button', { name: 'Menüyü aç' });
  if (await opener.isVisible()) await opener.click();
  const menu = page.getByRole('navigation', { name: 'Ana menü' });
  await expect(menu.getByRole('link', { name: 'Kanallar', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'Denetim kaydı', exact: true })).toHaveCount(0);
  await expect(menu.getByRole('link', { name: 'Sohbet moderasyonu', exact: true })).toBeVisible();

  // Adres çubuğu: istemci yönlendirmesiyle aynı oturumda yetkisiz sayfa
  await page.evaluate(() => { history.pushState({}, '', '/audit'); dispatchEvent(new PopStateEvent('popstate')); });
  await expect(page.getByText('Bu sayfaya erişim yetkiniz yok')).toBeVisible();
});

test('yetkisiz hesap giriş yapamaz', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('E-posta').fill('izleyici@demo.local');
  await page.getByLabel('Şifre').fill('demo1234');
  await page.getByRole('button', { name: 'Giriş yap' }).click();
  await expect(page.getByRole('alert')).toContainText('erişim yetkisi yok');
});
