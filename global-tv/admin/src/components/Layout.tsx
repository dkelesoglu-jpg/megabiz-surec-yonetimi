import {
  FileClock,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  MessageSquareWarning,
  Settings,
  ShieldCheck,
  Tv,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { ROLE_LABELS, type Permission } from '../lib/permissions';
import { Badge, Button, cx } from './ui';

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  permission: Permission;
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Pano', icon: LayoutDashboard, permission: 'dashboard.read' },
  { to: '/channels', label: 'Kanallar', icon: Tv, permission: 'channels.manage' },
  { to: '/rights', label: 'Yayın hakları', icon: ShieldCheck, permission: 'rights.manage' },
  { to: '/users', label: 'Kullanıcılar', icon: Users, permission: 'users.read' },
  { to: '/moderation', label: 'Sohbet moderasyonu', icon: MessageSquareWarning, permission: 'reports.manage' },
  { to: '/ads', label: 'Reklam alanları', icon: Megaphone, permission: 'ads.manage' },
  { to: '/settings', label: 'Sistem ayarları', icon: Settings, permission: 'dashboard.read' },
  { to: '/audit', label: 'Denetim kaydı', icon: FileClock, permission: 'audit.read' },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  const { can } = useAuth();
  return (
    <nav aria-label="Ana menü" className="flex flex-col gap-0.5">
      {NAV_ITEMS.filter((i) => can(i.permission)).map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'} onClick={onNavigate}
          className={({ isActive }) => cx('flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium',
            isActive ? 'bg-accent-soft text-accent' : 'text-ink-2 hover:bg-surface-2 hover:text-ink')}>
          <Icon size={18} aria-hidden />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}

function UserBox() {
  const { user, signOut, api } = useAuth();
  if (!user) return null;
  return (
    <div className="border-t border-line p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user.username}</p>
          <p className="truncate text-xs text-ink-3">{ROLE_LABELS[user.role]}</p>
        </div>
        {api.mode === 'demo' && <Badge tone="warning">Demo</Badge>}
      </div>
      <Button variant="ghost" size="sm" className="w-full justify-start" onClick={signOut}>
        <LogOut size={16} aria-hidden /> Çıkış yap
      </Button>
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2 px-4 py-4">
      <div className="grid size-8 place-items-center rounded-lg bg-accent text-accent-ink"><Tv size={18} aria-hidden /></div>
      <div className="leading-tight">
        <p className="text-sm font-semibold">Global TV</p>
        <p className="text-xs text-ink-3">Yönetim paneli</p>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { api } = useAuth();
  useEffect(() => setOpen(false), [location.pathname]);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <Brand />
        <div className="flex-1 overflow-y-auto px-2"><Nav /></div>
        <UserBox />
      </aside>

      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" aria-label="Menüyü aç" aria-expanded={open} onClick={() => setOpen(true)}>
            <Menu size={20} />
          </Button>
          <span className="text-sm font-semibold">Global TV Yönetim</span>
        </div>
        {api.mode === 'demo' && <Badge tone="warning">Demo</Badge>}
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden />
          <aside role="dialog" aria-label="Menü" className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <Button variant="ghost" size="sm" aria-label="Menüyü kapat" onClick={() => setOpen(false)}><X size={20} /></Button>
            </div>
            <div className="flex-1 overflow-y-auto px-2"><Nav onNavigate={() => setOpen(false)} /></div>
            <UserBox />
          </aside>
        </div>
      )}

      <main className="mx-auto w-full min-w-0 max-w-6xl px-4 py-6 sm:px-6">
        {api.mode === 'demo' && (
          <p className="mb-4 rounded-lg border border-warning/30 bg-warning-soft px-3 py-2 text-xs text-warning">
            Demo modu: sunucu bağlantısı yok. Veriler örnektir ve sayfa yenilenince sıfırlanır.
          </p>
        )}
        {children}
      </main>
    </div>
  );
}
