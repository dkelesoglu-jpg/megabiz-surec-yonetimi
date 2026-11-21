import { Plus } from 'lucide-react';
import { useState } from 'react';
import * as E from '../domain/engine';
import { go, useStore } from '../state/store';
import { Button, cx, Empty, Pill, TopBar, whenLabel } from '../ui/kit';
import { PlanCard } from '../ui/PlanCard';

type Tab = 'hosting' | 'pending' | 'joined' | 'past';

let lastTab: Tab = 'hosting';

export function MyPlans() {
  const { db, userId, run } = useStore();
  const [tab, setTabState] = useState<Tab>(lastTab);
  const setTab = (t: Tab) => { lastTab = t; setTabState(t); };
  const m = E.myPlans(db, userId);

  const tabs: { id: Tab; label: string; n: number }[] = [
    { id: 'hosting', label: 'Açtıklarım', n: m.hosting.length },
    { id: 'pending', label: 'Bekleyen', n: m.pending.length },
    { id: 'joined', label: 'Katıldıklarım', n: m.joined.length },
    { id: 'past', label: 'Geçmiş', n: m.past.length },
  ];

  return (
    <>
      <TopBar title="Planlarım" />
      <div className="no-scrollbar flex gap-1 overflow-x-auto px-4 pt-3" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} data-testid={`tab-${t.id}`}
            className={cx('shrink-0 rounded-full px-3.5 py-2 text-sm font-bold', tab === t.id ? 'bg-brand-700 text-white' : 'bg-white text-ink-soft')}>
            {t.label} <span className={cx('ml-1 rounded-full px-1.5 text-xs', tab === t.id ? 'bg-white/25' : 'bg-black/5')}>{t.n}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-4">
        {tab === 'hosting' && (m.hosting.length ? m.hosting.map((p) => {
          const pend = E.pendingRequests(db, p.id).length;
          return (
            <div key={p.id} className="relative">
              {pend > 0 && p.status === 'active' && (
                <span className="absolute -top-2 right-3 z-10 rounded-full bg-sun-400 px-2.5 py-0.5 text-xs font-bold shadow">{pend} yeni istek</span>
              )}
              <PlanCard db={db} plan={p} userId={userId} />
            </div>
          );
        }) : <Empty emoji="🪄" title="Henüz plan açmadın" text="Gideceğin bir yer mi var? Paylaş, gelen gelsin." action={<Button onClick={() => go('/create')}><Plus size={18} />Plan aç</Button>} />)}

        {tab === 'pending' && (m.pending.length ? m.pending.map(({ plan }) => (
          <PlanCard key={plan.id} db={db} plan={plan} userId={userId} />
        )) : <Empty emoji="⏳" title="Bekleyen isteğin yok" text="Keşfet’ten bir plana katılma isteği gönder." action={<Button variant="secondary" onClick={() => go('/')}>Keşfet’e git</Button>} />)}

        {tab === 'joined' && (m.joined.length ? m.joined.map(({ plan }) => (
          <PlanCard key={plan.id} db={db} plan={plan} userId={userId} />
        )) : <Empty emoji="🎟️" title="Onaylandığın plan yok" text="Onaylandığında plan burada görünür; sohbet açılır." />)}

        {tab === 'past' && (m.past.length ? m.past.map((p) => {
          const mine = db.outcomes.find((o) => o.planId === p.id && o.userId === userId);
          return (
            <div key={p.id} className="rounded-3xl border border-line bg-white p-4" data-testid={`past-${p.id}`}>
              <p className="text-xs text-ink-soft">{whenLabel(p.startAt, p.endAt)}</p>
              <button onClick={() => go(`/plan/${p.id}`)} className="mb-3 text-left font-bold">{p.title}</button>
              {mine ? (
                <Pill tone={mine.happened ? 'green' : 'neutral'}>{mine.happened ? '✓ Gerçekleşti dedin' : 'Gerçekleşmedi dedin'}</Pill>
              ) : (
                <div>
                  <p className="mb-2 text-sm font-semibold">Plan gerçekleşti mi?</p>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1" onClick={() => run((d) => E.answerOutcome(d, userId, p.id, true), 'Teşekkürler! 🙌')} data-testid={`outcome-yes-${p.id}`}>Evet, buluştuk</Button>
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => run((d) => E.answerOutcome(d, userId, p.id, false), 'Yanıtın kaydedildi.')}>Hayır</Button>
                  </div>
                </div>
              )}
            </div>
          );
        }) : <Empty emoji="📸" title="Geçmiş plan yok" />)}

        {tab !== 'past' && m.closed.length > 0 && (tab === 'pending' || tab === 'joined') && (
          <div className="mt-2">
            <p className="mb-2 text-xs font-semibold uppercase text-ink-soft">Kapanan istekler</p>
            {m.closed.map(({ plan, request }) => (
              <button key={plan.id} onClick={() => go(`/plan/${plan.id}`)} className="mb-2 flex w-full items-center justify-between rounded-2xl bg-white/70 p-3 text-left text-sm">
                <span className="truncate">{plan.title}</span>
                <Pill>{request.status === 'withdrawn' ? 'Geri çekildi' : request.status === 'left' ? 'Ayrıldın' : 'Kabul edilmedi'}</Pill>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
