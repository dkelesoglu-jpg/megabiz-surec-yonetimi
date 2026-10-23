import {
  BarChart3,
  FileClock,
  FileBadge,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessagesSquare,
  Moon,
  Settings,
  ShieldAlert,
  Sun,
  Tv,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/tr';
import type { Permission } from '../lib/permissions';
import { Badge, Button, cx } from './ui';

export interface NavItem {
  to: string;
  label: MessageKey;
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'nav.dashboard', icon: LayoutDashboard, permission: 'dashboard.read' },
  { to: '/channels', label: 'nav.channels', icon: Tv, permission: 'channels.manage' },
  { to: '/licenses', label: 'nav.licenses', icon: FileBadge, permission: 'rights.manage' },
  { to: '/community', label: 'nav.community', icon: MessagesSquare, permission: 'community.manage' },
  { to: '/moderation', label: 'nav.moderation', icon: ShieldAlert, permission: 'users.read' },
  { to: '/ads', label: 'nav.ads', icon: Megaphone, permission: 'ads.manage' },
  { to: '/reports', label: 'nav.reports', icon: BarChart3, permission: 'reports.read' },
  { to: '/settings', label: 'nav.settings', icon: Settings, permission: 'dashboard.read' },
  { to: '/audit', label: 'nav.audit', icon: FileClock, permission: 'audit.read' },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();
  const { t } = useI18n();
  return (
    <nav aria-label={t('shell.menu')} className="flex flex-col gap-0.5">
      {NAV_ITEMS.filter((i) => can(i.permission)).map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate}
          className={({ isActive }) => cx('flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            isActive ? 'bg-accent-soft text-ink shadow-[inset_3px_0_0_var(--accent)]' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}>
          <Icon size={18} aria-hidden className="shrink-0" />
          {t(label)}
        </NavLink>
      ))}
    </nav>
  );
}

/** Dil ve tema seçicileri (giriş ekranında da kullanılır). */
export function Preferences() {
  const { lang, setLang, theme, setTheme, t } = useI18n();
  return (
    <div className="flex items-center gap-1">
      <div role="group" aria-label={t('shell.language')} className="flex rounded-lg border border-line p-0.5 text-xs">
        {(['tr', 'en'] as const).map((l) => (
          <button key={l} type="button" aria-pressed={lang === l} onClick={() => setLang(l)}
            className={cx('rounded-md px-2 py-1 font-semibold uppercase', lang === l ? 'bg-accent-soft text-ink' : 'text-ink-3 hover:text-ink')}>
            {l}
          </button>
        ))}
      </div>
      <Button variant="ghost" size="sm" aria-label={`${t('shell.theme')}: ${theme === 'dark' ? t('shell.themeLight') : t('shell.themeDark')}`}
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
        {theme === 'dark' ? <Sun size={16} aria-hidden /> : <Moon size={16} aria-hidden />}
      </Button>
    </div>
  );
}

function UserBox() {
  const { user, signOut, api } = useAuth();
  const { t } = useI18n();
  if (!user) return null;
  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="grid size-8 shrink-0 place-items-center rounded-full bg-accent-soft text-xs font-semibold uppercase text-ink">
            {user.username.slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.username}</p>
            <p className="truncate text-xs text-ink-3">{t(`role.${user.role}`)}</p>
          </div>
        </div>
        {api.mode === 'demo' && <Badge tone="warning">{t('common.demo')}</Badge>}
      </div>
      {/* Dar ekranda (mobil menü) ve geniş yazı tiplerinde sığmazsa alt satıra geçer; düğmeler üst üste binmez. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button variant="ghost" size="sm" className="shrink-0" onClick={signOut}><LogOut size={16} aria-hidden /> {t('shell.signOut')}</Button>
        <div className="shrink-0"><Preferences /></div>
      </div>
    </div>
  );
}

export function Brand() {
  const { t } = useI18n();
  return (
    <div className="flex items-center gap-2.5 px-4 py-4">
      <div className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[#3d5afe] to-[#7186ff] text-white shadow-lg shadow-[#3d5afe]/30">
        <Tv size={18} aria-hidden />
      </div>
      <div className="leading-tight">
        <p className="text-sm font-semibold tracking-tight">{t('app.brand')}</p>
        <p className="text-xs text-ink-3">{t('app.subtitle')}</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { api } = useAuth();
  const { t } = useI18n();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface/80 backdrop-blur lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto px-2"><Nav /></div>
        <UserBox />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/90 px-4 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label={t('shell.openMenu')} aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={20} />
          </Button>
          <span className="text-sm font-semibold">{t('app.title')}</span>
        </div>
        <div className="flex items-center gap-2">
          {api.mode === 'demo' && <Badge tone="warning">{t('common.demo')}</Badge>}
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside role="dialog" aria-label={t('shell.menu')}
            className="absolute left-0 top-0 flex h-dvh w-72 max-w-[85vw] flex-col overflow-y-auto bg-surface shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <Button variant="ghost" size="sm" aria-label={t('shell.closeMenu')} onClick={() => setOpen(false)}><X size={20} /></Button>
            </div>
            <div className="flex-1 px-2"><Nav onNavigate={() => setOpen(false)} /></div>
            <UserBox />
          </aside>
        </div>
      )}

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6 lg:py-8">
        {api.mode === 'demo' && (
          <p className="mb-5 rounded-xl border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">{t('shell.demoNotice')}</p>
        )}
        {children}
      </main>
    </div>
  );
}
