import { Lock, MapPin, Send } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as E from '../domain/engine';
import { go, useStore } from '../state/store';
import { Avatar, Button, clock, cx, Empty, TopBar, whenLabel } from '../ui/kit';

export function Messages() {
  const { db, userId } = useStore();
  const chats = E.chatsFor(db, userId);
  return (
    <>
      <TopBar title="Mesajlar" />
      <div className="flex flex-col gap-2 px-4 pt-4">
        <p className="text-xs text-ink-soft">Grup sohbetleri yalnızca plan sahibi ve onaylı katılımcılara açıktır.</p>
        {chats.length === 0 && <Empty emoji="💬" title="Henüz sohbetin yok" text="Bir plana onaylandığında ya da plan açtığında grup sohbeti burada belirir." />}
        {chats.map(({ plan, last }) => {
          const who = last?.userId ? E.getUser(db, last.userId) : undefined;
          return (
            <button key={plan.id} onClick={() => go(`/plan/${plan.id}/chat`)} data-testid={`chat-${plan.id}`} className="flex items-center gap-3 rounded-3xl border border-line bg-white p-3 text-left">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-100 text-xl">💬</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{plan.title}</span>
                <span className="block truncate text-sm text-ink-soft">
                  {plan.status === 'cancelled' ? '❌ İptal edildi · ' : ''}
                  {last ? `${who ? who.name.split(' ')[0] + ': ' : ''}${last.text}` : 'Henüz mesaj yok'}
                </span>
              </span>
              <span className="text-xs text-ink-soft">{whenLabel(plan.startAt, plan.endAt).split(' · ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

export function ChatRoom({ planId }: { planId: string }) {
  const { db, userId, run } = useStore();
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const plan = E.getPlan(db, planId);
  const res = E.readChat(db, planId, userId);
  const count = res.ok ? res.value.length : 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: 'end' }); }, [count]);

  if (!res.ok || !plan) {
    return (
      <>
        <TopBar title="Grup sohbeti" back={() => history.back()} />
        <div className="px-4 pt-8" data-testid="chat-denied">
          <Empty
            emoji="🔒"
            title="Bu sohbete erişimin yok"
            text={res.ok ? 'Plan bulunamadı.' : res.error}
            action={<Button variant="secondary" onClick={() => go(`/plan/${planId}`)}>Plana git</Button>}
          />
        </div>
      </>
    );
  }

  const v = E.viewPlan(db, plan, userId);
  const members = [plan.ownerId, ...E.approvedRequests(db, planId).map((r) => r.userId)];
  const closed = plan.status === 'cancelled';

  const send = () => {
    const r = run((d) => E.sendMessage(d, userId, planId, text));
    if (r.ok) setText('');
  };

  return (
    <div className="flex min-h-[calc(100dvh-60px)] flex-col">
      <TopBar title={plan.title} back={() => go(`/plan/${planId}`)} />
      <div className="border-b border-line bg-white px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">{members.map((m) => <Avatar key={m} user={E.getUser(db, m)} size={26} />)}</div>
          <span className="text-xs text-ink-soft">{members.length} kişi · {whenLabel(plan.startAt, plan.endAt)}</span>
        </div>
        <p className="mt-1.5 flex items-start gap-1.5 text-sm" data-testid="chat-meeting">
          {v.meetingPointExact ? <MapPin size={15} className="mt-0.5 shrink-0 text-emerald-700" /> : <Lock size={15} className="mt-0.5 shrink-0" />}
          <span><b>Buluşma:</b> {v.meetingPointExact ?? 'Henüz eklenmedi, burada netleştirin.'}</span>
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 py-4" data-testid="chat-log">
        {res.value.map((m) => {
          if (!m.userId) return <p key={m.id} className="mx-auto max-w-[85%] rounded-full bg-black/5 px-3 py-1 text-center text-xs text-ink-soft">{m.text}</p>;
          const mine = m.userId === userId;
          const u = E.getUser(db, m.userId);
          return (
            <div key={m.id} className={cx('flex items-end gap-2', mine && 'flex-row-reverse')}>
              {!mine && <Avatar user={u} size={28} />}
              <div className={cx('max-w-[75%] rounded-3xl px-3.5 py-2', mine ? 'rounded-br-md bg-brand-700 text-white' : 'rounded-bl-md bg-white')}>
                {!mine && <p className="text-xs font-bold" style={{ color: u?.avatarColor }}>{u?.name.split(' ')[0]}</p>}
                <p className="text-[15px]">{m.text}</p>
                <p className={cx('text-right text-[10px]', mine ? 'text-white/70' : 'text-ink-soft')}>{clock(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-[68px] border-t border-line bg-cream/95 px-3 py-2 backdrop-blur">
        {closed ? (
          <p className="py-2 text-center text-sm text-ink-soft">Plan iptal edildi; sohbet salt okunur.</p>
        ) : (
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); send(); }}>
            <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Mesaj yaz…" className="h-12 flex-1 rounded-full border border-line bg-white px-4 text-[16px] outline-none focus:border-brand-500" data-testid="chat-input" maxLength={1000} />
            <button type="submit" disabled={!text.trim()} aria-label="Gönder" className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-700 text-white disabled:opacity-40" data-testid="chat-send">
              <Send size={20} />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
