import { CalendarDays, MapPin, Users } from 'lucide-react';
import { categoryOf } from '../domain/catalog';
import * as E from '../domain/engine';
import type { DB, Plan } from '../domain/types';
import { go } from '../state/store';
import { Avatar, cx, DemoTag, Pill, TypeBadge, whenLabel } from './kit';

export function spotsText(db: DB, plan: Plan) {
  const left = E.spotsLeft(db, plan);
  if (left === 0) return 'Dolu';
  if (plan.type === 'need_people') return `${left} kişi lazım`;
  return `${left} boş yer`;
}

export function ViewerStatus({ db, plan, userId }: { db: DB; plan: Plan; userId: string }) {
  if (plan.ownerId === userId) return <Pill tone="dark">Senin planın</Pill>;
  const r = E.requestOf(db, plan.id, userId);
  if (r?.status === 'approved') return <Pill tone="green">✓ Katılıyorsun</Pill>;
  if (r?.status === 'pending') return <Pill tone="amber">⏳ Onay bekliyor</Pill>;
  return null;
}

export function PlanCard({ db, plan, userId }: { db: DB; plan: Plan; userId: string }) {
  const owner = E.getUser(db, plan.ownerId);
  const cat = categoryOf(plan.category);
  const phase = E.planPhase(db, plan);
  const approved = E.approvedRequests(db, plan.id).length;
  const left = E.spotsLeft(db, plan);
  const place = plan.destination ? `${plan.destination.city}${plan.destination.country ? `, ${plan.destination.country}` : ''}` : plan.district;

  return (
    <button
      onClick={() => go(`/plan/${plan.id}`)}
      data-testid={`plan-card-${plan.id}`}
      className={cx(
        'anim-pop block w-full rounded-3xl border border-line bg-white p-4 text-left shadow-[0_2px_0_rgba(35,28,23,.04)] transition hover:-translate-y-0.5 hover:shadow-md',
        phase === 'cancelled' && 'opacity-60',
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        <TypeBadge type={plan.type} />
        <span className="text-xs text-ink-soft">{cat.emoji} {cat.label}</span>
        <span className="ml-auto flex items-center gap-1.5">
          {plan.isDemo && <DemoTag />}
        </span>
      </div>

      <h3 className="mb-2 text-[17px] font-bold leading-snug">{plan.title}</h3>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><CalendarDays size={15} />{whenLabel(plan.startAt, plan.endAt)}</span>
        <span className="inline-flex items-center gap-1.5"><MapPin size={15} />{place}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Avatar user={owner} size={28} />
        <span className="min-w-0 truncate text-sm font-medium">{owner?.name.split(' ')[0]}</span>
        <span className="text-xs text-ink-soft">+{approved} kişi</span>
        <span className="ml-auto flex items-center gap-1.5">
          <ViewerStatus db={db} plan={plan} userId={userId} />
          {phase === 'cancelled' ? (
            <Pill tone="red">İptal edildi</Pill>
          ) : (
            <span
              className={cx(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold',
                left === 0 ? 'bg-ink/10 text-ink-soft' : plan.type === 'need_people' ? 'bg-need text-white' : 'bg-sun-400 text-ink',
              )}
            >
              <Users size={13} />
              {spotsText(db, plan)}
            </span>
          )}
        </span>
      </div>
    </button>
  );
}
