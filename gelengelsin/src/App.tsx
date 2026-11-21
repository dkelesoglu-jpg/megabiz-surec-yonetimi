import { Bell, CalendarCheck, Compass, MessageCircle, Plus, UserRound } from 'lucide-react';
import * as E from './domain/engine';
import { Admin } from './screens/Admin';
import { ChatRoom, Messages } from './screens/Messages';
import { Discover } from './screens/Discover';
import { MyPlans } from './screens/MyPlans';
import { Notifications } from './screens/Notifications';
import { PlanDetail } from './screens/PlanDetail';
import { PlanForm } from './screens/PlanForm';
import { Profile } from './screens/Profile';
import { go, useRoute, useStore } from './state/store';
import { Avatar, cx } from './ui/kit';

function Header() {
  const { db, userId, setUserId } = useStore();
  const me = E.getUser(db, userId);
  const unread = E.unreadCount(db, userId);
  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center gap-2 border-b border-line bg-cream/95 px-3 backdrop-blur">
      <button onClick={() => go('/')} className="flex items-center gap-1.5" aria-label="GelenGelsin ana sayfa">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-lg font-black text-white">G</span>
        <span className="text-[17px] font-black tracking-tight">
          Gelen<span className="text-brand-600">Gelsin</span>
        </span>
      </button>

      <label className="ml-auto flex items-center gap-1.5 rounded-full border-2 border-dashed border-sun-400 bg-sun-300/30 py-0.5 pl-1 pr-1" title="Demo kullanıcı değiştir">
        <Avatar user={me} size={26} />
        <span className="sr-only">Demo kullanıcı</span>
        <span aria-hidden className="text-[10px] font-black uppercase text-ink-soft">Demo</span>
        <select
          data-testid="demo-user"
          value={userId}
          onChange={(e) => { setUserId(e.target.value); }}
          className="max-w-[92px] bg-transparent text-sm font-bold outline-none"
        >
          {db.users.map((u) => (
            <option key={u.id} value={u.id}>{u.name.split(' ')[0]}{u.isModerator ? ' (Mod)' : ''}</option>
          ))}
        </select>
      </label>

      <button onClick={() => go('/notifications')} className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5" aria-label={`Bildirimler${unread ? `, ${unread} okunmamış` : ''}`} data-testid="bell">
        <Bell size={22} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-bold text-white">{unread}</span>
        )}
      </button>
    </header>
  );
}

const NAV = [
  { path: '/', label: 'Keşfet', icon: Compass, match: (p: string) => p === '/' || p.startsWith('/plan/') && !p.endsWith('/chat') },
  { path: '/my', label: 'Planlarım', icon: CalendarCheck, match: (p: string) => p.startsWith('/my') },
  { path: '/create', label: 'Plan Aç', icon: Plus, match: (p: string) => p.startsWith('/create'), center: true },
  { path: '/messages', label: 'Mesajlar', icon: MessageCircle, match: (p: string) => p.startsWith('/messages') || p.endsWith('/chat') },
  { path: '/profile', label: 'Profil', icon: UserRound, match: (p: string) => p.startsWith('/profile') || p.startsWith('/user') || p.startsWith('/admin') },
];

function BottomNav({ path }: { path: string }) {
  return (
    <nav className="pb-safe fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-line bg-white/95 backdrop-blur" aria-label="Ana gezinme">
      <ul className="grid grid-cols-5">
        {NAV.map((n) => {
          const active = n.match(path);
          const Icon = n.icon;
          return (
            <li key={n.path}>
              <button
                onClick={() => go(n.path)}
                aria-current={active ? 'page' : undefined}
                data-testid={`nav-${n.path}`}
                className={cx('flex w-full flex-col items-center gap-0.5 pt-2 text-[11px] font-semibold', active ? 'text-brand-700' : 'text-ink-soft')}
              >
                {n.center ? (
                  <span className={cx('-mt-5 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg', active ? 'bg-brand-800' : 'bg-brand-600')}>
                    <Icon size={26} strokeWidth={2.6} />
                  </span>
                ) : (
                  <Icon size={22} strokeWidth={active ? 2.6 : 2} />
                )}
                {n.label}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Toasts() {
  const { toasts } = useStore();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-[68px] z-50 flex flex-col items-center gap-2 px-4" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} data-testid="toast" className={cx('anim-rise max-w-sm rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg', t.tone === 'error' ? 'bg-red-700 text-white' : 'bg-ink text-white')}>
          {t.text}
        </div>
      ))}
    </div>
  );
}

function Screen({ path }: { path: string }) {
  const seg = path.split('/').filter(Boolean);
  if (seg.length === 0) return <Discover />;
  if (seg[0] === 'plan' && seg[1]) {
    if (seg[2] === 'edit') return <PlanForm editId={seg[1]} />;
    if (seg[2] === 'chat') return <ChatRoom planId={seg[1]} />;
    return <PlanDetail planId={seg[1]} />;
  }
  if (seg[0] === 'create') return <PlanForm />;
  if (seg[0] === 'my') return <MyPlans />;
  if (seg[0] === 'messages') return <Messages />;
  if (seg[0] === 'profile') return <Profile />;
  if (seg[0] === 'user' && seg[1]) return <Profile viewId={seg[1]} />;
  if (seg[0] === 'notifications') return <Notifications />;
  if (seg[0] === 'admin') return <Admin />;
  return <Discover />;
}

export default function App() {
  const path = useRoute();
  const { userId } = useStore();
  return (
    <div className="mx-auto min-h-dvh max-w-md bg-cream shadow-[0_0_60px_rgba(0,0,0,.08)]">
      <Header />
      {/* Kullanıcı değişince ekran durumu sıfırlansın diye key */}
      <main key={userId} className="pb-28">
        <Screen path={path} />
      </main>
      <BottomNav path={path} />
      <Toasts />
    </div>
  );
}
