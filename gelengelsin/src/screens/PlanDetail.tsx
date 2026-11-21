import { CalendarDays, Copy, ExternalLink, Flag, Lock, MapPin, MessageCircle, Pencil, Users, Wallet, XCircle } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { categoryOf, REPORT_REASONS } from '../domain/catalog';
import * as E from '../domain/engine';
import type { DB, Plan, ReportTarget } from '../domain/types';
import { go, localPlanUrl, shareUrl, useStore } from '../state/store';
import { Avatar, Button, cx, DemoTag, inputCls, Pill, Sheet, Stepper, TopBar, TypeBadge, whenLong } from '../ui/kit';
import { spotsText } from '../ui/PlanCard';

export function PlanDetail({ planId }: { planId: string }) {
  const { db, userId } = useStore();
  const plan = E.getPlan(db, planId);
  if (!plan || plan.status === 'removed') {
    return (
      <>
        <TopBar title="Plan" back={() => history.back()} />
        <div className="p-6 text-center text-ink-soft">Bu plan bulunamadı ya da kaldırıldı.</div>
      </>
    );
  }
  const isOwner = plan.ownerId === userId;
  return isOwner ? <OwnerView db={db} plan={plan} /> : <VisitorView db={db} plan={plan} />;
}

// ---------- ortak plan bilgisi ----------

function PlanInfo({ db, plan, viewerId }: { db: DB; plan: Plan; viewerId: string }) {
  const v = E.viewPlan(db, plan, viewerId);
  const owner = E.getUser(db, plan.ownerId);
  const cat = categoryOf(plan.category);
  const approved = E.approvedRequests(db, plan.id);
  const phase = E.planPhase(db, plan);
  return (
    <div className="px-4 pt-4">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <TypeBadge type={plan.type} />
        <Pill>{cat.emoji} {cat.label}</Pill>
        {plan.isDemo && <DemoTag />}
        {phase === 'cancelled' && <Pill tone="red">İptal edildi</Pill>}
        {phase === 'full' && <Pill tone="dark">Dolu</Pill>}
      </div>
      <h1 className="mb-3 text-2xl font-black leading-tight" data-testid="plan-title">{plan.title}</h1>
      {plan.description && <p className="mb-4 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{plan.description}</p>}

      <div className="mb-4 divide-y divide-line overflow-hidden rounded-3xl border border-line bg-white">
        <Row icon={<CalendarDays size={18} />} label="Tarih">{whenLong(plan.startAt, plan.endAt)}</Row>
        <Row icon={<MapPin size={18} />} label={plan.destination ? 'Varış noktası' : 'Yaklaşık konum'}>
          {plan.destination ? `${plan.destination.city}${plan.destination.country ? `, ${plan.destination.country}` : ''}` : `${plan.district}, İstanbul`}
          {plan.areaLabel && <span className="block text-sm text-ink-soft">{plan.areaLabel}</span>}
        </Row>
        <Row icon={<Lock size={18} />} label="Kesin buluşma noktası">
          {v.meetingPointExact ? (
            <span data-testid="meeting-point" className="font-semibold text-emerald-800">{v.meetingPointExact}</span>
          ) : v.meetingPointHidden ? (
            <span data-testid="meeting-hidden" className="text-sm text-ink-soft">🔒 Onaylanan katılımcılara açılır.</span>
          ) : (
            <span className="text-sm text-ink-soft">Plan sahibi henüz eklemedi; sohbette netleşir.</span>
          )}
        </Row>
        <Row icon={<Users size={18} />} label="Kontenjan">
          <span data-testid="spots">{spotsText(db, plan)}</span>
          <span className="text-sm text-ink-soft"> · {approved.length}/{plan.capacity} katılımcı + plan sahibi</span>
        </Row>
        {(plan.costNote || plan.eventUrl) && (
          <Row icon={<Wallet size={18} />} label="Masraf ve bilet">
            {plan.costNote && <span className="block">{plan.costNote}</span>}
            {plan.eventUrl && (
              <a href={plan.eventUrl} target="_blank" rel="noreferrer noopener" className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 underline">
                Etkinlik / bilet bağlantısı <ExternalLink size={14} />
              </a>
            )}
            <span className="mt-1 block text-xs text-ink-soft">Herkes kendi biletini ve ulaşımını organize eder. GelenGelsin ödeme almaz.</span>
          </Row>
        )}
      </div>

      <button onClick={() => go(`/user/${owner?.id}`)} className="mb-4 flex w-full items-center gap-3 rounded-3xl border border-line bg-white p-3 text-left">
        <Avatar user={owner} size={44} />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-ink-soft">Plan sahibi</span>
          <span className="block font-bold">{owner?.name}</span>
          <span className="block truncate text-sm text-ink-soft">{owner?.bio}</span>
        </span>
        {owner?.verified18 && <Pill tone="green">18+ ✓</Pill>}
      </button>

      {approved.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-sm font-semibold">Katılanlar</p>
          <div className="flex flex-wrap gap-2">
            {approved.map((r) => {
              const u = E.getUser(db, r.userId);
              return (
                <button key={r.id} onClick={() => go(`/user/${u?.id}`)} className="flex items-center gap-2 rounded-full border border-line bg-white py-1 pl-1 pr-3 text-sm font-medium">
                  <Avatar user={u} size={26} />{u?.name.split(' ')[0]}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

const Row = ({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) => (
  <div className="flex gap-3 p-3.5">
    <span className="mt-0.5 text-brand-600">{icon}</span>
    <div className="flex-1">
      <p className="text-xs font-semibold text-ink-soft">{label}</p>
      <div className="text-[15px]">{children}</div>
    </div>
  </div>
);

function ShareButton({ plan }: { plan: Plan }) {
  const { toast } = useStore();
  const copy = async () => {
    const link = localPlanUrl(plan.id);
    try {
      await navigator.clipboard.writeText(link);
      toast('Bağlantı kopyalandı! Arkadaşlarına gönder.');
    } catch {
      window.prompt('Bağlantıyı kopyala:', link);
    }
  };
  return (
    <div className="px-4 pb-2">
      <button onClick={copy} data-testid="share" className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line bg-white/70 p-3 text-left">
        <Copy size={18} className="text-brand-600" />
        <span className="min-w-0 flex-1 text-sm">
          <span className="block font-semibold">Paylaşım bağlantısını kopyala</span>
          <span className="block truncate text-xs text-ink-soft">Canlıda: {shareUrl(plan.id)}</span>
        </span>
      </button>
    </div>
  );
}

export function ReportSheet({ open, onClose, target, title }: { open: boolean; onClose: () => void; target: ReportTarget; title: string }) {
  const { run, userId } = useStore();
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="flex flex-col gap-2">
        {REPORT_REASONS.map((r) => (
          <label key={r} className={cx('flex items-center gap-3 rounded-2xl border p-3 text-sm', reason === r ? 'border-brand-600 bg-brand-50' : 'border-line')}>
            <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />
            {r}
          </label>
        ))}
        <textarea className={cx(inputCls, 'min-h-20')} placeholder="Ek açıklama (isteğe bağlı)" value={note} onChange={(e) => setNote(e.target.value)} />
        <Button
          variant="dark"
          block
          disabled={!reason}
          onClick={() => {
            const r = run((db) => E.report(db, userId, target, reason, note), 'Şikâyetin moderatörlere iletildi. Teşekkürler.');
            if (r.ok) { onClose(); setReason(''); setNote(''); }
          }}
        >
          Şikâyeti gönder
        </Button>
        <p className="text-center text-xs text-ink-soft">Şikâyetler gizlidir; karşı taraf kimin bildirdiğini görmez.</p>
      </div>
    </Sheet>
  );
}

// ---------- ziyaretçi / katılımcı görünümü ----------

function VisitorView({ db, plan }: { db: DB; plan: Plan }) {
  const { run, userId } = useStore();
  const [askOpen, setAskOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const req = E.requestOf(db, plan.id, userId);
  const phase = E.planPhase(db, plan);
  const blocked = E.isBlockedBetween(db, userId, plan.ownerId);

  const steps = ['İstek gönder', 'Onay bekleniyor', 'Onaylandı', 'Buluşma'];
  const stage = req?.status === 'pending' ? 1 : req?.status === 'approved' ? 3 : 0;

  let status: ReactNode = null;
  if (req?.status === 'pending')
    status = <StatusBox tone="amber" title="İsteğin gönderildi ⏳" text="Plan sahibi onaylayınca sohbet ve kesin buluşma noktası açılacak." />;
  else if (req?.status === 'approved')
    status = <StatusBox tone="green" title="Onaylandın, ekiptesin! 🎉" text="Sohbete katıl, buluşmayı netleştir." />;
  else if (req?.status === 'rejected')
    status = <StatusBox tone="neutral" title="İsteğin bu sefer kabul edilmedi" text="Başka planlara göz atabilirsin." />;
  else if (req?.status === 'withdrawn')
    status = <StatusBox tone="neutral" title="İsteğini geri çektin" text="İstersen yeniden istek gönderebilirsin." />;
  else if (req?.status === 'left')
    status = <StatusBox tone="neutral" title="Bu plandan ayrıldın" text="Yerin başkasına açıldı. Yer varsa yeniden istek gönderebilirsin." />;

  return (
    <>
      <TopBar
        title="Plan detayı"
        back={() => history.back()}
        right={
          <button onClick={() => setReportOpen(true)} aria-label="Planı şikâyet et" className="flex h-10 w-10 items-center justify-center rounded-full text-ink-soft hover:bg-black/5" data-testid="report-plan">
            <Flag size={19} />
          </button>
        }
      />
      {phase !== 'cancelled' && (req?.status === 'pending' || req?.status === 'approved') && (
        <div className="mx-4 mt-4 rounded-3xl border border-line bg-white p-4" data-testid="visitor-stepper">
          <Stepper steps={steps} current={stage} />
        </div>
      )}
      {phase === 'cancelled' ? (
        <div className="px-4 pt-4"><StatusBox tone="red" title="Bu plan iptal edildi" text="Plan sahibi planı iptal etti. Yeni katılım alınmıyor." /></div>
      ) : (
        status && <div className="px-4 pt-3" data-testid="request-status">{status}</div>
      )}

      <PlanInfo db={db} plan={plan} viewerId={userId} />

      <ShareButton plan={plan} />

      {/* Sabit eylem alanı */}
      <div className="sticky bottom-[68px] z-10 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur">
        {phase === 'cancelled' ? (
          <Button block size="lg" disabled>Plan iptal edildi</Button>
        ) : phase === 'past' ? (
          <Button block size="lg" disabled>Bu planın tarihi geçti</Button>
        ) : blocked ? (
          <Button block size="lg" disabled>Bu plana katılamazsın</Button>
        ) : req?.status === 'approved' ? (
          <div className="flex gap-2">
            <Button size="lg" className="flex-1" onClick={() => go(`/plan/${plan.id}/chat`)} data-testid="open-chat"><MessageCircle size={20} />Sohbete git</Button>
            <Button size="lg" variant="danger" onClick={() => setConfirmLeave(true)} data-testid="leave">Ayrıl</Button>
          </div>
        ) : req?.status === 'pending' ? (
          <Button block size="lg" variant="secondary" onClick={() => run((d) => E.withdrawRequest(d, userId, plan.id), 'İsteğin geri çekildi.')} data-testid="withdraw">
            <XCircle size={20} />İsteği geri çek
          </Button>
        ) : req?.status === 'rejected' ? (
          <Button block size="lg" disabled>İstek kabul edilmedi</Button>
        ) : phase === 'full' ? (
          <Button block size="lg" disabled data-testid="join-disabled">Plan dolu</Button>
        ) : (
          <Button block size="lg" onClick={() => setAskOpen(true)} data-testid="join">Katılmak istiyorum</Button>
        )}
      </div>

      <Sheet open={askOpen} onClose={() => setAskOpen(false)} title="Katılma isteği">
        <p className="mb-3 text-sm text-ink-soft">Plan sahibine kısa bir not bırak. Onaylanırsan sohbet ve kesin buluşma noktası açılır.</p>
        <textarea className={cx(inputCls, 'mb-3 min-h-24')} maxLength={280} placeholder="Selam! Ben de geliyorum…" value={msg} onChange={(e) => setMsg(e.target.value)} data-testid="join-message" />
        <Button
          block
          size="lg"
          data-testid="send-request"
          onClick={() => {
            const r = run((d) => E.requestJoin(d, userId, plan.id, msg), 'İsteğin gönderildi!');
            if (r.ok) { setAskOpen(false); setMsg(''); }
          }}
        >
          İsteği gönder
        </Button>
      </Sheet>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title="Plandan ayrılmak istiyor musun?">
        <p className="mb-4 text-sm text-ink-soft">Yerin yeniden açılır; sohbete ve kesin buluşma noktasına erişimin kapanır.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmLeave(false)}>Vazgeç</Button>
          <Button variant="danger" className="flex-1" data-testid="confirm-leave" onClick={() => { run((d) => E.leavePlan(d, userId, plan.id), 'Plandan ayrıldın.'); setConfirmLeave(false); }}>Ayrıl</Button>
        </div>
      </Sheet>

      <ReportSheet open={reportOpen} onClose={() => setReportOpen(false)} target={{ kind: 'plan', planId: plan.id }} title="Planı şikâyet et" />
    </>
  );
}

function StatusBox({ tone, title, text }: { tone: 'amber' | 'green' | 'neutral' | 'red'; title: string; text: string }) {
  return (
    <div className={cx(
      'rounded-3xl border p-4',
      tone === 'amber' && 'border-amber-200 bg-amber-50',
      tone === 'green' && 'border-emerald-200 bg-emerald-50',
      tone === 'neutral' && 'border-line bg-white',
      tone === 'red' && 'border-red-200 bg-red-50',
    )}>
      <p className="font-bold">{title}</p>
      <p className="text-sm text-ink-soft">{text}</p>
    </div>
  );
}

// ---------- plan sahibi görünümü ----------

function OwnerView({ db, plan }: { db: DB; plan: Plan }) {
  const { run, userId } = useStore();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const pending = E.pendingRequests(db, plan.id);
  const approved = E.approvedRequests(db, plan.id);
  const phase = E.planPhase(db, plan);
  const cancelled = phase === 'cancelled';
  const stage = approved.length > 0 ? 3 : pending.length > 0 ? 1 : 0;

  return (
    <>
      <TopBar
        title="Senin planın"
        back={() => history.back()}
        right={!cancelled && (
          <button onClick={() => go(`/plan/${plan.id}/edit`)} aria-label="Planı düzenle" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5" data-testid="edit-plan">
            <Pencil size={19} />
          </button>
        )}
      />

      {!cancelled && (
        <div className="mx-4 mt-4 rounded-3xl border border-line bg-white p-4" data-testid="owner-stepper">
          <p className="mb-3 text-sm font-bold">{stage === 0 ? 'Plan yayında! İlk isteği bekliyorsun.' : stage === 1 ? 'İstek geldi, onaylamayı unutma.' : 'Ekip kuruldu, sohbet açık.'}</p>
          <Stepper steps={['Plan yayında', 'İstek geldi', 'Onayla', 'Sohbet açık']} current={stage} />
        </div>
      )}

      <PlanInfo db={db} plan={plan} viewerId={userId} />

      {/* İstekler */}
      {!cancelled && (
        <div className="px-4 pb-4">
          <h2 className="mb-2 flex items-center gap-2 text-base font-bold">
            Katılma istekleri <span className="rounded-full bg-sun-400 px-2 text-sm">{pending.length}</span>
          </h2>
          {pending.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line bg-white/60 p-4 text-sm text-ink-soft">Bekleyen istek yok. Bağlantıyı paylaşarak daha çok kişiye ulaş.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {pending.map((r) => {
                const u = E.getUser(db, r.userId);
                return (
                  <div key={r.id} className="rounded-3xl border border-line bg-white p-3" data-testid={`request-${r.userId}`}>
                    <div className="flex items-center gap-3">
                      <button onClick={() => go(`/user/${u?.id}`)}><Avatar user={u} size={40} /></button>
                      <div className="flex-1">
                        <p className="font-bold">{u?.name}</p>
                        <p className="text-xs text-ink-soft">{u ? new Date().getFullYear() - u.birthYear : ''} yaş · {u?.interests.map((i) => categoryOf(i).emoji).join(' ')}</p>
                      </div>
                    </div>
                    {r.message && <p className="mt-2 rounded-2xl bg-cream p-2.5 text-sm">“{r.message}”</p>}
                    <div className="mt-3 flex gap-2">
                      <Button variant="secondary" className="flex-1" size="sm" onClick={() => run((d) => E.rejectRequest(d, userId, r.id), 'İstek reddedildi.')} data-testid={`reject-${r.userId}`}>Reddet</Button>
                      <Button className="flex-1" size="sm" disabled={phase === 'full'} onClick={() => run((d) => E.approveRequest(d, userId, r.id), `${u?.name.split(' ')[0]} onaylandı!`)} data-testid={`approve-${r.userId}`}>
                        {phase === 'full' ? 'Kontenjan dolu' : 'Onayla'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {cancelled && <div className="px-4 pb-4"><StatusBox tone="red" title="Bu planı iptal ettin" text="Katılımcılara ve bekleyenlere bildirim gönderildi." /></div>}

      <ShareButton plan={plan} />

      <div className="sticky bottom-[68px] z-10 flex gap-2 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur">
        <Button size="lg" className="flex-1" onClick={() => go(`/plan/${plan.id}/chat`)} data-testid="open-chat"><MessageCircle size={20} />Grup sohbeti</Button>
        {!cancelled && <Button size="lg" variant="danger" onClick={() => setConfirmCancel(true)} data-testid="cancel-plan">İptal et</Button>}
      </div>

      <Sheet open={confirmCancel} onClose={() => setConfirmCancel(false)} title="Planı iptal et">
        <p className="mb-4 text-sm text-ink-soft">Tüm katılımcılara ve bekleyen isteklere bildirim gider. Bu işlem geri alınamaz.</p>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={() => setConfirmCancel(false)}>Vazgeç</Button>
          <Button variant="danger" className="flex-1" data-testid="confirm-cancel" onClick={() => { run((d) => E.cancelPlan(d, userId, plan.id), 'Plan iptal edildi.'); setConfirmCancel(false); }}>Evet, iptal et</Button>
        </div>
      </Sheet>
    </>
  );
}
