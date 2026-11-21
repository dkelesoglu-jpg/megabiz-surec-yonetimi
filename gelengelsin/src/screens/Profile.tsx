import { Ban, Flag, RotateCcw, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { categoryOf } from '../domain/catalog';
import * as E from '../domain/engine';
import { go, useStore } from '../state/store';
import { Avatar, Button, Pill, Sheet, TopBar } from '../ui/kit';
import { PlanCard } from '../ui/PlanCard';
import { ReportSheet } from './PlanDetail';

export function Profile({ viewId }: { viewId?: string }) {
  const { db, userId, run, reset } = useStore();
  const id = viewId ?? userId;
  const u = E.getUser(db, id);
  const own = id === userId;
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  if (!u) return <p className="p-6">Kullanıcı bulunamadı.</p>;

  const hosted = db.plans.filter((p) => p.ownerId === id && p.status !== 'removed');
  const joinedCount = db.requests.filter((r) => r.userId === id && r.status === 'approved').length;
  const happened = db.outcomes.filter((o) => o.userId === id && o.happened).length;
  const blockedByMe = E.hasBlocked(db, userId, id);
  const openPlans = hosted.filter((p) => p.status === 'active' && !E.isPast(p));
  const myBlocks = db.blocks.filter((b) => b.blockerId === userId);

  return (
    <>
      <TopBar title={own ? 'Profilim' : 'Profil'} back={own ? undefined : () => history.back()} />
      <div className="px-4 pt-5">
        <div className="mb-4 flex items-center gap-4">
          <Avatar user={u} size={72} />
          <div className="flex-1">
            <h1 className="text-xl font-black">{u.name}</h1>
            <p className="text-sm text-ink-soft">{new Date().getFullYear() - u.birthYear} yaş · İstanbul</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {u.verified18 && <Pill tone="green"><ShieldCheck size={13} />18+ doğrulandı</Pill>}
              {u.isModerator && <Pill tone="dark">Moderatör</Pill>}
              {u.isDemo && <Pill>Demo kullanıcı</Pill>}
            </div>
          </div>
        </div>
        <p className="mb-4 text-[15px]">{u.bio}</p>

        <div className="mb-4 grid grid-cols-3 gap-2 text-center">
          {[['Açtığı plan', hosted.length], ['Katıldığı', joinedCount], ['Gerçekleşen', happened]].map(([l, n]) => (
            <div key={l as string} className="rounded-2xl border border-line bg-white p-3">
              <p className="text-xl font-black">{n}</p>
              <p className="text-xs text-ink-soft">{l}</p>
            </div>
          ))}
        </div>

        <p className="mb-2 text-sm font-semibold">İlgi alanları</p>
        <div className="mb-5 flex flex-wrap gap-1.5">
          {u.interests.map((i) => <Pill key={i}>{categoryOf(i).emoji} {categoryOf(i).label}</Pill>)}
        </div>

        {!own && (
          <>
            <p className="mb-2 text-sm font-semibold">Açık planları</p>
            <div className="mb-5 flex flex-col gap-3">
              {openPlans.length ? openPlans.map((p) => <PlanCard key={p.id} db={db} plan={p} userId={userId} />) : <p className="text-sm text-ink-soft">Şu an açık planı yok.</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setReportOpen(true)} data-testid="report-user"><Flag size={17} />Şikâyet et</Button>
              {blockedByMe ? (
                <Button variant="secondary" className="flex-1" onClick={() => run((d) => E.unblockUser(d, userId, id), 'Engel kaldırıldı.')}>Engeli kaldır</Button>
              ) : (
                <Button variant="danger" className="flex-1" onClick={() => setBlockOpen(true)} data-testid="block-user"><Ban size={17} />Engelle</Button>
              )}
            </div>
            <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} target={{ kind: 'user', userId: id }} title={`${u.name.split(' ')[0]} adlı kullanıcıyı şikâyet et`} />
            <Sheet open={blockOpen} onClose={() => setBlockOpen(false)} title="Engellemek istiyor musun?">
              <p className="mb-4 text-sm text-ink-soft">Birbirinizin planlarını görmezsiniz ve katılma isteği gönderemezsiniz. Aranızdaki bekleyen istekler kapanır. Karşı tarafa bildirim gitmez.</p>
              <Button variant="danger" block data-testid="confirm-block" onClick={() => { const r = run((d) => E.blockUser(d, userId, id), 'Kullanıcı engellendi.'); if (r.ok) setBlockOpen(false); }}>Engelle</Button>
            </Sheet>
          </>
        )}

        {own && (
          <div className="flex flex-col gap-3">
            {u.isModerator && (
              <Button variant="dark" block onClick={() => go('/admin')} data-testid="open-admin"><ShieldCheck size={18} />Şikâyetler ve pilot metrikleri</Button>
            )}
            {myBlocks.length > 0 && (
              <div className="rounded-3xl border border-line bg-white p-4">
                <p className="mb-2 text-sm font-semibold">Engellediklerin</p>
                {myBlocks.map((b) => {
                  const bu = E.getUser(db, b.blockedId);
                  return (
                    <div key={b.blockedId} className="flex items-center gap-2 py-1">
                      <Avatar user={bu} size={28} /><span className="flex-1 text-sm">{bu?.name}</span>
                      <Button size="sm" variant="secondary" onClick={() => run((d) => E.unblockUser(d, userId, b.blockedId), 'Engel kaldırıldı.')}>Kaldır</Button>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="rounded-3xl border-2 border-dashed border-sun-400 bg-sun-300/20 p-4 text-sm">
              <p className="mb-1 font-bold">🧪 Bu bir prototip</p>
              <ul className="list-disc space-y-1 pl-5 text-ink-soft">
                <li>Tüm kullanıcılar ve planlar demo verisidir; veriler yalnızca bu tarayıcıda saklanır.</li>
                <li>Üst bardaki <b>Demo</b> seçiciyle plan sahibi (Ayşe) ve katılımcı (Mert) arasında geçiş yap.</li>
                <li>Giriş, 18+ doğrulama, anlık bildirim ve gerçek zamanlı sohbet canlı sürümde Supabase ile gelecek.</li>
                <li>Ödeme, bilet satışı ve rezervasyon yok; herkes kendi biletini alır.</li>
              </ul>
            </div>
            <Button variant="secondary" block onClick={() => setResetOpen(true)} data-testid="reset-demo"><RotateCcw size={17} />Demo verisini sıfırla</Button>
            <Sheet open={resetOpen} onClose={() => setResetOpen(false)} title="Demo verisi sıfırlansın mı?">
              <p className="mb-4 text-sm text-ink-soft">Açtığın planlar, istekler ve mesajlar silinir; örnek veriler yeniden yüklenir.</p>
              <Button variant="danger" block data-testid="confirm-reset" onClick={() => { reset(); setResetOpen(false); }}>Sıfırla</Button>
            </Sheet>
          </div>
        )}
      </div>
    </>
  );
}
