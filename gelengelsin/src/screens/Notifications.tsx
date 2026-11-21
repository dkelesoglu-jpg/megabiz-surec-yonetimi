import { useEffect, useState } from 'react';
import * as E from '../domain/engine';
import type { NotificationKind } from '../domain/types';
import { go, useStore } from '../state/store';
import { ago, cx, Empty, TopBar } from '../ui/kit';

const ICON: Record<NotificationKind, string> = {
  request_received: '🙋',
  request_withdrawn: '↩️',
  request_approved: '🎉',
  request_rejected: '🙅',
  participant_left: '👋',
  plan_updated: '📝',
  plan_cancelled: '❌',
  plan_removed: '🛡️',
};

export function Notifications() {
  const { db, userId, run } = useStore();
  const list = db.notifications.filter((n) => n.userId === userId).slice().reverse();
  // Açılışta okunmamış olanları vurgulamak için ilk durumu sakla, sonra okundu işaretle.
  const [fresh] = useState(() => new Set(list.filter((n) => !n.read).map((n) => n.id)));
  useEffect(() => {
    if (E.unreadCount(db, userId) > 0) run((d) => E.markAllRead(d, userId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <TopBar title="Bildirimler" back={() => history.back()} />
      <div className="flex flex-col gap-2 px-4 pt-4" data-testid="notifications">
        {list.length === 0 && <Empty emoji="🔔" title="Bildirim yok" text="İstekler, onaylar ve plan değişiklikleri burada görünür." />}
        {list.map((n) => (
          <button key={n.id} onClick={() => n.planId && go(`/plan/${n.planId}`)}
            className={cx('flex items-start gap-3 rounded-3xl border p-3 text-left', fresh.has(n.id) ? 'border-brand-200 bg-brand-50' : 'border-line bg-white')}>
            <span className="text-xl" aria-hidden>{ICON[n.kind]}</span>
            <span className="flex-1">
              <span className="block text-[15px]">{n.text}</span>
              <span className="text-xs text-ink-soft">{ago(n.createdAt)}</span>
            </span>
            {fresh.has(n.id) && <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-brand-600" aria-label="yeni" />}
          </button>
        ))}
      </div>
    </>
  );
}
