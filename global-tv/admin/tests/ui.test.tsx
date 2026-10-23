import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { App } from '../src/App';
import { AuthProvider } from '../src/auth/AuthContext';
import { ToastProvider } from '../src/components/feedback';
import { DemoAdminApi } from '../src/lib/demoApi';
import { DEMO_PASSWORD } from '../src/lib/demoData';

async function renderAs(email: string | null, path = '/') {
  const api = new DemoAdminApi();
  if (email) await api.signIn(email, DEMO_PASSWORD);
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider api={api}>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
  return { api, user };
}

const nav = () => screen.getAllByRole('navigation', { name: 'Ana menü' })[0]!;

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

describe('rol bazlı menü ve sayfa koruması', () => {
  it('moderatör yalnızca kendi modüllerini görür', async () => {
    await renderAs('moderator@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    const links = within(nav()).getAllByRole('link').map((a) => a.textContent);
    expect(links).toEqual(['Pano', 'Kullanıcılar', 'Sohbet moderasyonu', 'Sistem ayarları']);
  });

  it('içerik yöneticisi yalnızca içerik modüllerini görür', async () => {
    await renderAs('editor@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    const links = within(nav()).getAllByRole('link').map((a) => a.textContent);
    expect(links).toEqual(['Pano', 'Kanallar', 'Yayın hakları', 'Sistem ayarları']);
  });

  it('yönetici tüm modülleri görür', async () => {
    await renderAs('admin@demo.local');
    await screen.findByRole('heading', { name: 'Pano' });
    expect(within(nav()).getAllByRole('link')).toHaveLength(8);
  });

  it('adres çubuğundan yetkisiz sayfaya gidilemez', async () => {
    await renderAs('moderator@demo.local', '/channels');
    expect(await screen.findByText('Bu sayfaya erişim yetkiniz yok')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kanal ekle/ })).not.toBeInTheDocument();
  });

  it('içerik yöneticisi ayarları yalnızca görüntüler ama duyuru ekleyebilir', async () => {
    await renderAs('editor@demo.local', '/settings');
    expect(await screen.findByText('Yalnızca görüntüleme')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Kaydet/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Duyuru ekle/ })).toBeInTheDocument();
  });
});

describe('iş akışları', () => {
  it('içerik yöneticisi kanal ekler; yönetici bunu denetim kaydında görür', async () => {
    const { user, api } = await renderAs('editor@demo.local', '/channels');
    await user.click(await screen.findByRole('button', { name: /Kanal ekle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Yeni kanal' });
    await user.type(within(dialog).getByLabelText('Kanal adı'), 'Test Kanalı');
    await user.type(within(dialog).getByLabelText('Kısa ad'), 'test-kanali');
    await user.type(within(dialog).getByLabelText('HLS yayın adresi'), 'https://ornek.com/test.m3u8');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    expect(await screen.findByText('Kanal eklendi.')).toBeInTheDocument();
    expect(screen.getAllByText('Test Kanalı').length).toBeGreaterThan(0);

    await api.signOut();
    await api.signIn('admin@demo.local', DEMO_PASSWORD);
    const audit = await api.listAudit();
    expect(audit[0]).toMatchObject({ entity: 'channels', action: 'insert', actorName: 'icerik_ekibi' });
  });

  it('http yayın adresi formda reddedilir', async () => {
    const { user } = await renderAs('editor@demo.local', '/channels');
    await user.click(await screen.findByRole('button', { name: /Kanal ekle/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Yeni kanal' });
    await user.type(within(dialog).getByLabelText('Kanal adı'), 'Güvensiz');
    await user.type(within(dialog).getByLabelText('Kısa ad'), 'guvensiz');
    await user.type(within(dialog).getByLabelText('HLS yayın adresi'), 'http://ornek.com/a.m3u8');
    await user.click(within(dialog).getByRole('button', { name: 'Kaydet' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('https://');
  });

  it('moderatör şikâyeti işleyip mesajı gizler', async () => {
    const { user, api } = await renderAs('moderator@demo.local', '/moderation');
    const buttons = await screen.findAllByRole('button', { name: /Mesajı gizle ve kapat/ });
    await user.click(buttons[0]!);
    expect(await screen.findByText('Mesaj gizlendi, şikâyet kapatıldı.')).toBeInTheDocument();
    await waitFor(async () => expect((await api.listReports()).filter((r) => r.status === 'open')).toHaveLength(1));
  });

  it('moderatör kullanıcıyı gerekçeyle yasaklar', async () => {
    const { user, api } = await renderAs('moderator@demo.local', '/users');
    await user.type(await screen.findByLabelText('Kullanıcı ara'), 'spam');
    const table = screen.getAllByRole('table')[0]!;
    await user.click(within(table).getByRole('button', { name: /Yasakla/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Kullanıcıyı yasakla' });
    await user.type(within(dialog).getByLabelText('Gerekçe'), 'reklam spamı');
    await user.click(within(dialog).getByRole('button', { name: 'Yasakla' }));
    await waitFor(async () => expect((await api.listProfiles()).find((p) => p.username === 'spam_hesap')?.isBanned).toBe(true));
  });

  it('moderatör rol seçicisini görmez', async () => {
    await renderAs('moderator@demo.local', '/users');
    await screen.findByLabelText('Kullanıcı ara');
    expect(screen.queryAllByLabelText('spam_hesap rolü')).toHaveLength(0);
  });

  it('yönetici rol seçicisini görür ve onayla rol değiştirir', async () => {
    const { user, api } = await renderAs('admin@demo.local', '/users');
    const select = (await screen.findAllByLabelText('spam_hesap rolü'))[0]!;
    await user.selectOptions(select, 'moderator');
    const dialog = await screen.findByRole('dialog', { name: 'Rol değişikliği' });
    await user.click(within(dialog).getByRole('button', { name: /Onayla/ }));
    await waitFor(async () => expect((await api.listProfiles()).find((p) => p.username === 'spam_hesap')?.role).toBe('moderator'));
  });
});
