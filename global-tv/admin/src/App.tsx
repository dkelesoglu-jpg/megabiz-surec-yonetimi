import { ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import type { Permission } from './lib/permissions';
import { AdsPage } from './pages/AdsPage';
import { AuditPage } from './pages/AuditPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { ModerationPage } from './pages/ModerationPage';
import { RightsPage } from './pages/RightsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';

/** Sayfa düzeyinde izin kontrolü. Asıl kontrol sunucudadır; bu yalnızca arayüzü korur. */
function Guard({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = useAuth();
  if (!can(permission)) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md text-center">
        <ShieldOff className="mx-auto mb-3 text-ink-3" size={40} aria-hidden />
        <h1 className="text-lg font-semibold">Bu sayfaya erişim yetkiniz yok</h1>
        <p className="mt-1 text-sm text-ink-2">Gerekli izin: <code>{permission}</code>. Yetki için bir yöneticiye başvurun.</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function App() {
  const { user, loading } = useAuth();
  if (loading) return <p className="p-8 text-center text-sm text-ink-3">Yükleniyor…</p>;
  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Guard permission="dashboard.read"><DashboardPage /></Guard>} />
        <Route path="/channels" element={<Guard permission="channels.manage"><ChannelsPage /></Guard>} />
        <Route path="/rights" element={<Guard permission="rights.manage"><RightsPage /></Guard>} />
        <Route path="/users" element={<Guard permission="users.read"><UsersPage /></Guard>} />
        <Route path="/moderation" element={<Guard permission="reports.manage"><ModerationPage /></Guard>} />
        <Route path="/ads" element={<Guard permission="ads.manage"><AdsPage /></Guard>} />
        <Route path="/settings" element={<Guard permission="dashboard.read"><SettingsPage /></Guard>} />
        <Route path="/audit" element={<Guard permission="audit.read"><AuditPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
