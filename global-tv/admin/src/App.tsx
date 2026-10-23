import { ShieldOff } from 'lucide-react';
import type { ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { useI18n } from './i18n/I18nProvider';
import type { Permission } from './lib/permissions';
import { AdsPage } from './pages/AdsPage';
import { AuditPage } from './pages/AuditPage';
import { ChannelsPage } from './pages/ChannelsPage';
import { CommunityPage } from './pages/CommunityPage';
import { DashboardPage } from './pages/DashboardPage';
import { LicensesPage } from './pages/LicensesPage';
import { LoginPage } from './pages/LoginPage';
import { ModerationPage } from './pages/ModerationPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

/** Sayfa düzeyinde izin kontrolü. Asıl kontrol sunucudadır; bu yalnızca arayüzü korur. */
function Guard({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { can } = useAuth();
  const { t } = useI18n();
  if (!can(permission)) {
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md text-center">
        <ShieldOff className="mx-auto mb-3 text-ink-3" size={40} aria-hidden />
        <h1 className="text-lg font-semibold">{t('shell.forbiddenTitle')}</h1>
        <p className="mt-1 text-sm text-ink-2">{t('shell.forbiddenBody', { permission })}</p>
      </div>
    );
  }
  return <>{children}</>;
}

export function App() {
  const { user, loading } = useAuth();
  const { t } = useI18n();
  if (loading) return <p className="p-8 text-center text-sm text-ink-3">{t('common.loading')}</p>;
  if (!user) return <LoginPage />;

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Guard permission="dashboard.read"><DashboardPage /></Guard>} />
        <Route path="/channels" element={<Guard permission="channels.manage"><ChannelsPage /></Guard>} />
        <Route path="/licenses" element={<Guard permission="rights.manage"><LicensesPage /></Guard>} />
        <Route path="/community" element={<Guard permission="community.manage"><CommunityPage /></Guard>} />
        <Route path="/moderation" element={<Guard permission="users.read"><ModerationPage /></Guard>} />
        <Route path="/ads" element={<Guard permission="ads.manage"><AdsPage /></Guard>} />
        <Route path="/reports" element={<Guard permission="reports.read"><ReportsPage /></Guard>} />
        <Route path="/settings" element={<Guard permission="dashboard.read"><SettingsPage /></Guard>} />
        <Route path="/audit" element={<Guard permission="audit.read"><AuditPage /></Guard>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
