import * as E from '../domain/engine';
import { go, useStore } from '../state/store';
import { ago, Button, Empty, Pill, TopBar } from '../ui/kit';

const pct = (n: number) => `%${Math.round(n * 100)}`;

export function Admin() {
  const { db, userId, run } = useStore();
  const me = E.getUser(db, userId);
  if (!me?.isModerator) {
    return (
      <>
        <TopBar title="Moderasyon" back={() => history.back()} />
        <div className="p-6"><Empty emoji="🛡️" title="Bu alan yalnızca moderatörler içindir" text="Demo seçiciden “Deniz (Mod)” kullanıcısına geç." /></div>
      </>
    );
  }
  const m = E.pilotMetrics(db);
  const reports = db.reports.slice().reverse();

  return (
    <>
      <TopBar title="Moderasyon ve metrikler" back={() => history.back()} />
      <div className="px-4 pt-4">
        <h2 className="mb-2 text-base font-bold">İstanbul pilotu</h2>
        <div className="mb-2 grid grid-cols-2 gap-2" data-testid="metrics">
          <Metric label="Açılan plan" value={String(m.plansOpened)} sub={`${m.plansOpenedReal} demo dışı · ${m.cancelled} iptal`} />
          <Metric label="≥1 onaylı katılımcılı" value={pct(m.withApprovedRate)} sub={`${m.withApproved}/${m.plansOpened} plan`} />
          <Metric label="“Gerçekleşti” oranı" value={pct(m.happenedRate)} sub={`${m.happened}/${m.outcomeAnswered} yanıtlanan plan`} />
          <Metric label="Açık şikâyet" value={String(m.openReports)} sub={`${m.pastPlans} tarihi geçmiş plan`} />
        </div>
        <p className="mb-6 text-xs text-ink-soft">Canlıda bu değerler Postgres görünümlerinden (views) haftalık hesaplanır; bkz. docs/MVP-PLANI.md.</p>

        <h2 className="mb-2 text-base font-bold">Şikâyetler</h2>
        <div className="flex flex-col gap-2" data-testid="reports">
          {reports.length === 0 && <Empty emoji="✅" title="Şikâyet yok" />}
          {reports.map((r) => {
            const reporter = E.getUser(db, r.reporterId);
            const plan = r.target.kind === 'plan' ? E.getPlan(db, r.target.planId) : undefined;
            const target = r.target.kind === 'user' ? E.getUser(db, r.target.userId) : undefined;
            return (
              <div key={r.id} className="rounded-3xl border border-line bg-white p-4">
                <div className="mb-1 flex items-center gap-2">
                  <Pill tone={r.status === 'open' ? 'amber' : r.status === 'actioned' ? 'red' : 'neutral'}>
                    {r.status === 'open' ? 'Açık' : r.status === 'actioned' ? 'Plan kaldırıldı' : 'Kapatıldı'}
                  </Pill>
                  <span className="text-xs text-ink-soft">{r.target.kind === 'plan' ? 'Plan' : 'Kullanıcı'} · {ago(r.createdAt)}</span>
                </div>
                <button className="text-left font-bold underline-offset-2 hover:underline" onClick={() => go(plan ? `/plan/${plan.id}` : `/user/${target?.id}`)}>
                  {plan?.title ?? target?.name}
                </button>
                <p className="text-sm"><b>Neden:</b> {r.reason}</p>
                {r.note && <p className="text-sm text-ink-soft">“{r.note}”</p>}
                <p className="text-xs text-ink-soft">Bildiren: {reporter?.name}</p>
                {r.status === 'open' && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" variant="secondary" className="flex-1" onClick={() => run((d) => E.resolveReport(d, userId, r.id, 'dismiss'), 'Şikâyet kapatıldı.')}>İhlal yok, kapat</Button>
                    {r.target.kind === 'plan' && plan?.status !== 'removed' && (
                      <Button size="sm" variant="danger" className="flex-1" onClick={() => run((d) => E.resolveReport(d, userId, r.id, 'remove_plan'), 'Plan kaldırıldı.')} data-testid={`remove-${r.id}`}>Planı kaldır</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

const Metric = ({ label, value, sub }: { label: string; value: string; sub: string }) => (
  <div className="rounded-3xl border border-line bg-white p-3">
    <p className="text-xs font-semibold text-ink-soft">{label}</p>
    <p className="text-2xl font-black text-brand-700">{value}</p>
    <p className="text-[11px] text-ink-soft">{sub}</p>
  </div>
);
