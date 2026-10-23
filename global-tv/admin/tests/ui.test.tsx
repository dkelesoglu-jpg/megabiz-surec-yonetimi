import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App';
import { AuthProvider } from '../src/auth/AuthContext';
import { ToastProvider } from '../src/components/feedback';
import { I18nProvider, type Lang } from '../src/i18n/I18nProvider';
import { DemoAdminApi } from '../src/lib/demoApi';
import { DEMO_PASSWORD } from '../src/lib/demoData';

async function renderAs(email: string | null, path = '/', lang: Lang = 'tr') {
  const api = new DemoAdminApi();
  if (email) await api.signIn(email, DEMO_PASSWORD);
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider initialLang={lang}>
        <AuthProvider api={api}>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
  return { api, user };
}

const nav = (name = 'Ana menü') => screen.getAllByRole('navigation', { name })[0]!;
const navLinks = (name?: string) => within(nav(name)).getAllByRole('link').map((a) => a.textContent);

describe('giriş', () => {
  it('yetkisiz hesap girişte reddedilir', async () => {
    const { user } = await renderAs(null);
    await user.type(await screen.findByLabelText('E-posta'), 'izleyici@demo.local');
    await user.type(screen.getByLabelText('Şifre'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('erişim yetkisi yok');
  });

  it('yetkili hesap panoya girer', async () => {
    const { user } = await renderAs(null);
    await user.type(await screen.findByLabelText('E-posta'), 'admin@demo.local');
    await user.type(screen.getByLabelText('Şifre'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Giriş yap' }));
    expect(await screen.findByRole('heading', { name: 'Pano' })).toBeInTheDocument();
  });
});

describe('Türkçe / İngilizce', () => {
  it('İngilizce arayüz ve hata mesajları', async () => {
    const { user } = await renderAs(null, '/', 'en');
    await user.type(await screen.findByLabelText('Email'), 'izleyici@demo.local');
    await user.type(screen.getByLabelText('Password'), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: 'Sign in' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('does not have access');
  });

  it('dil seçici arayüzü anında değiştirir', async () => {
    const { user } = await renderAs('admin@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    await user.click(screen.getAllByRole('button', { name: 'en' })[0]!);
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    expect(navLinks('Main menu')).toContain('Broadcast licenses');
  });
});

describe('rol bazlı menü ve sayfa koruması', () => {
  it('moderatör yalnızca kendi modüllerini görür', async () => {
    await renderAs('moderator@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    expect(navLinks()).toEqual(['Pano', 'Topluluk', 'Moderasyon', 'Raporlama', 'Sistem ayarları']);
  });

  it('içerik yöneticisi yalnızca içerik modüllerini görür', async () => {
    await renderAs('editor@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    expect(navLinks()).toEqual(['Pano', 'Kanallar', 'Yayın lisansları', 'Raporlama', 'Sistem ayarları']);
  });

  it('yönetici tüm modülleri görür', async () => {
    await renderAs('admin@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    expect(navLinks()).toHaveLength(9);
  });

  it('adres çubuğundan yetkisiz sayfaya gidilemez', async () => {
    await renderAs('moderator@demo.local', '/channels');
    expect(await screen.findByText('Bu sayfaya erişim yetkiniz yok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kanal ekle/ })).not.toBeInTheDocument();
  });

  it('içerik yöneticisi ayarları yalnızca görüntüler ama duyuru ekleyebilir', async () => {
    await renderAs('editor@demo.local', '/settings');
    expect(await screen.findByText('Yalnızca görüntüleme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Kaydet$/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Duyuru ekle/ })).toBeInTheDocument();
  });
});

describe('pano', () => {
  it('toplam ve aktif kullanıcı, kanal ve izlenme kutuları', async () => {
    await renderAs('admin@demo.local');
    for (const label of ['Toplam kullanıcı', 'Aktif kullanıcı (bugün)', 'Yayındaki kanallar', 'İzlenme (son 24 saat)']) {
      expect(await screen.findByText(label)).toBeInTheDocument();
    }
    expect(screen.getByRole('img', { name: /izlenme süresi/ })).toBeInTheDocument();
  });
});

describe('iş akışları', () => {
  it('içerik yöneticisi kanal ekler; yönetici bunu denetim kaydında görür', async () => {
    const { user, api } = await renderAs('editor@demo.local', '/channels');
    await user.click(await screen.findByRole('button', { name: /Kanal ekle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Yeni kanal' });
    await user.type(within(dialog).getByLabelText('Kanal adı'), 'Test Kanalı');
    await user.type(within(dialog).getByLabelText('Kısa ad'), 'test-kanali');
    await user.selectOptions(within(dialog).getByLabelText('Yayın dili'), 'de');
    await user.type(within(dialog).getByLabelText('Yayın adresi (HLS)'), 'https://ornek.com/test.m3u8');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText('Kanal kaydedildi.')).toBeInTheDocument();
    expect(screen.getAllByText('Test Kanalı').length).toBeGreaterThan(0);

    await api.signOut();
    await api.signIn('admin@demo.local', DEMO_PASSWORD);
    const created = (await api.listChannels()).find((c) => c.slug === 'test-kanali');
    expect(created?.language).toBe('de');
    expect((await api.listAudit())[0]).toMatchObject({ entity: 'channels', action: 'insert', actorName: 'icerik_ekibi' });
  });

  it('http yayın adresi formda reddedilir', async () => {
    const { user } = await renderAs('editor@demo.local', '/channels');
    await user.click(await screen.findByRole('button', { name: /Kanal ekle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Yeni kanal' });
    await user.type(within(dialog).getByLabelText('Kanal adı'), 'Güvensiz');
    await user.type(within(dialog).getByLabelText('Kısa ad'), 'guvensiz');
    await user.type(within(dialog).getByLabelText('Yayın adresi (HLS)'), 'http://ornek.com/a.m3u8');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('https://');
  });

  it('içerik yöneticisi yayın hakkı belgesi yükler', async () => {
    const { user, api } = await renderAs('editor@demo.local', '/licenses');
    const input = (await screen.findAllByLabelText(/Belge yükle: Apple Inc/))[0]!;
    await user.upload(input, new File(['%PDF'], 'apple-lisans.pdf', { type: 'application/pdf' }));
    expect(await screen.findByText('Belge yüklendi.')).toBeInTheDocument();
    await waitFor(async () => expect((await api.listRights()).find((r) => r.id === 'r-1')?.documentName).toBe('apple-lisans.pdf'));
  });

  it('moderatör şikâyeti işleyip mesajı gizler', async () => {
    const { user, api } = await renderAs('moderator@demo.local', '/community');
    await user.click(await screen.findByRole('tab', { name: /Şikâyetler/ }));
    const buttons = await screen.findAllByRole('button', { name: /Mesajı gizle ve kapat/ });
    await user.click(buttons[0]!);
    expect(await screen.findByText('Mesaj gizlendi, şikâyet kapatıldı.')).toBeInTheDocument();
    await waitFor(async () => expect((await api.listReports()).filter((r) => r.status === 'open')).toHaveLength(1));
  });

  it('moderatör onayla mesaj siler ve sohbet odasını kilitler', async () => {
    const { user, api } = await renderAs('moderator@demo.local', '/community');
    const table = (await screen.findAllByRole('table'))[0]!;
    const row = within(table).getByText('Big Buck Bunny').closest('tr')!;
    await user.click(within(row).getByRole('button', { name: /Kilitle/ }));
    await waitFor(async () => expect((await api.listRooms()).find((r) => r.channelId === 'ch-2')?.isLocked).toBe(true));

    await user.click(screen.getByRole('tab', { name: 'Mesajlar ve yorumlar' }));
    await user.click(await screen.findByRole('button', { name: /Mesajı sil: Herkes aptal/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Mesajı sil' });
    await user.click(within(dialog).getByRole('button', { name: /Sil/ }));
    expect(await screen.findByText('Mesaj silindi.')).toBeInTheDocument();
    expect((await api.listModerationLog())[0]).toMatchObject({ action: 'delete_message' });
  });

  it('moderatör kullanıcıyı gerekçeyle engeller ve işlem kayıtlarında görür', async () => {
    const { user, api } = await renderAs('moderator@demo.local', '/moderation');
    await user.type(await screen.findByPlaceholderText('Kullanıcı adı ile ara'), 'spam');
    const table = screen.getAllByRole('table')[0]!;
    await user.click(within(table).getByRole('button', { name: /Engelle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Kullanıcıyı engelle' });
    await user.type(within(dialog).getByLabelText('Gerekçe'), 'reklam spamı');
    await user.click(within(dialog).getByRole('button', { name: 'Engelle' }));
    await waitFor(async () => expect((await api.listProfiles()).find((p) => p.username === 'spam_hesap')?.isBanned).toBe(true));

    await user.click(screen.getByRole('tab', { name: 'İşlem kayıtları' }));
    expect((await screen.findAllByText('reklam spamı')).length).toBeGreaterThan(0);
  });

  it('moderatör rol seçicisini görmez', async () => {
    await renderAs('moderator@demo.local', '/moderation');
    await screen.findByPlaceholderText('Kullanıcı adı ile ara');
    expect(screen.queryAllByLabelText('spam_hesap rolü')).toHaveLength(0);
  });

  it('yönetici moderatör rolü atar', async () => {
    const { user, api } = await renderAs('admin@demo.local', '/moderation');
    const select = (await screen.findAllByLabelText('spam_hesap rolü'))[0]!;
    await user.selectOptions(select, 'moderator');
    const dialog = await screen.findByRole('dialog', { name: 'Rol değişikliği' });
    await user.click(within(dialog).getByRole('button', { name: /Onayla/ }));
    await waitFor(async () => expect((await api.listProfiles()).find((p) => p.username === 'spam_hesap')?.role).toBe('moderator'));
  });

  it('yönetici sponsorlu içerik ekler (https zorunlu)', async () => {
    const { user, api } = await renderAs('admin@demo.local', '/ads');
    await user.click(await screen.findByRole('tab', { name: 'Sponsorlu içerik' }));
    await user.click(await screen.findByRole('button', { name: /Sponsorluk ekle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Yeni sponsorlu içerik' });
    await user.type(within(dialog).getByLabelText('Sponsor adı'), 'Test Sponsor');
    await user.type(within(dialog).getByLabelText('Başlık (TR)'), 'Kampanya');
    await user.type(within(dialog).getByLabelText('Başlık (EN)'), 'Campaign');
    await user.type(within(dialog).getByLabelText('Bağlantı (https)'), 'http://guvensiz.com');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('https://');
    await user.clear(within(dialog).getByLabelText('Bağlantı (https)'));
    await user.type(within(dialog).getByLabelText('Bağlantı (https)'), 'https://ornek.com');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    await waitFor(async () => expect((await api.listSponsorships()).some((s) => s.sponsorName === 'Test Sponsor')).toBe(true));
  });

  it('raporlama sayfası tüm bölümleri gösterir; editöre reklam bölümü gösterilmez', async () => {
    await renderAs('editor@demo.local', '/reports');
    for (const h of ['Kullanıcılar', 'Yayın', 'Sohbet']) expect(await screen.findByRole('heading', { name: h })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reklam' })).not.toBeInTheDocument();
    expect(screen.getByText('Kanallara göre izlenme (dakika)')).toBeInTheDocument();
  });
});
