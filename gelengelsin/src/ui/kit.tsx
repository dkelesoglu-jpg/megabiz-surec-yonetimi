import { Check, ChevronLeft, X } from 'lucide-react';
import { useEffect, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { PLAN_TYPES } from '../domain/catalog';
import type { PlanType, User } from '../domain/types';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

// ---------- tarih biçimleri ----------

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
const timeFmt = new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit' });
const dayFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'short', day: 'numeric', month: 'short' });
const longFmt = new Intl.DateTimeFormat('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
const shortDate = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' });

export const whenLabel = (iso: string, endIso?: string) => {
  const d = new Date(iso);
  if (endIso) return `${shortDate.format(d)} – ${shortDate.format(new Date(endIso))}`;
  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
  const day = sameDay(d, today) ? 'Bugün' : sameDay(d, tomorrow) ? 'Yarın' : dayFmt.format(d);
  return `${day} · ${timeFmt.format(d)}`;
};
export const whenLong = (iso: string, endIso?: string) =>
  endIso
    ? `${longFmt.format(new Date(iso))} – ${longFmt.format(new Date(endIso))}`
    : `${longFmt.format(new Date(iso))}, ${timeFmt.format(new Date(iso))}`;
export const clock = (iso: string) => timeFmt.format(new Date(iso));
export const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'şimdi';
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} sa önce`;
  return `${Math.round(h / 24)} gün önce`;
};

// ---------- temel bileşenler ----------

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'dark';
  size?: 'md' | 'lg' | 'sm';
  block?: boolean;
};
export function Button({ variant = 'primary', size = 'md', block, className, ...rest }: BtnProps) {
  return (
    <button
      {...rest}
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50',
        size === 'lg' && 'h-14 px-6 text-[17px]',
        size === 'md' && 'h-11 px-4 text-[15px]',
        size === 'sm' && 'h-9 px-3 text-sm',
        variant === 'primary' && 'bg-brand-700 text-white shadow-[0_6px_18px_-6px_rgba(191,58,16,.6)] hover:bg-brand-800',
        variant === 'secondary' && 'border border-line bg-white text-ink hover:bg-brand-50',
        variant === 'ghost' && 'text-ink-soft hover:bg-black/5',
        variant === 'danger' && 'border border-red-200 bg-white text-red-700 hover:bg-red-50',
        variant === 'dark' && 'bg-ink text-white hover:bg-black',
        block && 'w-full',
        className,
      )}
    />
  );
}

export function Avatar({ user, size = 36 }: { user?: User; size?: number }) {
  const initials = (user?.name ?? '?').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toLocaleUpperCase('tr-TR');
  return (
    <span
      aria-hidden
      className="inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ring-2 ring-white"
      style={{ width: size, height: size, background: user?.avatarColor ?? '#999', fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
}

const TYPE_STYLE: Record<PlanType, string> = {
  going: 'bg-going-bg text-going',
  need_people: 'bg-need-bg text-need',
  meet_there: 'bg-meet-bg text-meet',
};
export function TypeBadge({ type, className }: { type: PlanType; className?: string }) {
  const t = PLAN_TYPES[type];
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold', TYPE_STYLE[type], className)}>
      <span aria-hidden>{t.emoji}</span>
      {t.label}
    </span>
  );
}

export function Pill({ children, tone = 'neutral', className }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'dark' | 'brand'; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
        tone === 'neutral' && 'bg-black/5 text-ink-soft',
        tone === 'green' && 'bg-emerald-100 text-emerald-800',
        tone === 'amber' && 'bg-amber-100 text-amber-900',
        tone === 'red' && 'bg-red-100 text-red-800',
        tone === 'dark' && 'bg-ink text-white',
        tone === 'brand' && 'bg-brand-100 text-brand-800',
        className,
      )}
    >
      {children}
    </span>
  );
}

export const DemoTag = () => (
  <span className="rounded-md border border-dashed border-ink-soft/40 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-soft">
    Demo
  </span>
);

export function TopBar({ title, back, right }: { title: string; back?: () => void; right?: ReactNode }) {
  return (
    <div className="sticky top-[60px] z-20 flex h-14 items-center gap-2 border-b border-line bg-cream/95 px-2 backdrop-blur">
      {back && (
        <button onClick={back} aria-label="Geri" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5">
          <ChevronLeft size={24} />
        </button>
      )}
      <h1 className={cx('flex-1 truncate text-lg font-bold', !back && 'pl-2')}>{title}</h1>
      {right}
    </div>
  );
}

export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  // Mobilde alttan açılan pencere açıkken arka sayfa kaymasın; Esc ile kapansın.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose} role="dialog" aria-modal aria-label={title}>
      <div className="anim-rise w-full max-w-md rounded-t-3xl bg-white p-5 pb-safe" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} aria-label="Kapat" className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Kullanıcının hangi aşamada olduğunu gösteren adım çubuğu. */
export function Stepper({ steps, current, tone = 'brand' }: { steps: string[]; current: number; tone?: 'brand' | 'red' }) {
  return (
    <ol className="flex items-start gap-1" aria-label="Aşama">
      {steps.map((s, i) => {
        const doneStep = i < current;
        const active = i === current;
        return (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5 text-center" aria-current={active ? 'step' : undefined}>
            <div className="flex w-full items-center">
              <span className={cx('h-1 flex-1 rounded-full', i === 0 ? 'opacity-0' : doneStep || active ? 'bg-brand-600' : 'bg-line')} />
              <span
                className={cx(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  doneStep && 'bg-brand-600 text-white',
                  active && (tone === 'red' ? 'bg-red-600 text-white' : 'bg-sun-400 text-ink ring-4 ring-sun-300/50'),
                  !doneStep && !active && 'bg-line text-ink-soft',
                )}
              >
                {doneStep ? <Check size={15} strokeWidth={3} /> : i + 1}
              </span>
              <span className={cx('h-1 flex-1 rounded-full', i === steps.length - 1 ? 'opacity-0' : doneStep ? 'bg-brand-600' : 'bg-line')} />
            </div>
            <span className={cx('text-[11px] leading-tight', active ? 'font-bold text-ink' : 'text-ink-soft')}>{s}</span>
          </li>
        );
      })}
    </ol>
  );
}

export function Empty({ emoji, title, text, action }: { emoji: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <span className="text-4xl" aria-hidden>{emoji}</span>
      <p className="font-bold">{title}</p>
      {text && <p className="text-sm text-ink-soft">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export const Field = ({ label, hint, children, optional }: { label: string; hint?: string; children: ReactNode; optional?: boolean }) => (
  <label className="block">
    <span className="mb-1.5 flex items-baseline gap-2 text-sm font-semibold">
      {label}
      {optional && <span className="text-xs font-normal text-ink-soft">isteğe bağlı</span>}
    </span>
    {children}
    {hint && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
  </label>
);

export const inputCls =
  'w-full rounded-2xl border border-line bg-white px-4 py-3 text-[16px] outline-none transition placeholder:text-ink-soft/60 focus:border-brand-500 focus:ring-4 focus:ring-brand-100';
