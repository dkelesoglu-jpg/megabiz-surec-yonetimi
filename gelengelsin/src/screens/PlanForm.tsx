import { ChevronDown, Lock, Minus, Plus } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CATEGORIES, PLAN_TYPES } from '../domain/catalog';
import * as E from '../domain/engine';
import type { CategoryId, PlanType } from '../domain/types';
import { go, useStore } from '../state/store';
import { Button, cx, Field, inputCls, TopBar } from '../ui/kit';

const pad = (n: number) => String(n).padStart(2, '0');
const toDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const toTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const combine = (date: string, time: string) => {
  if (!date) return '';
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = (time || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, h, mi).toISOString();
};

export function PlanForm({ editId }: { editId?: string }) {
  const { db, userId, run } = useStore();
  const editing = editId ? E.getPlan(db, editId) : undefined;
  const tomorrow = new Date(Date.now() + 86400_000);
  const start = editing ? new Date(editing.startAt) : new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 19, 0);

  const [type, setType] = useState<PlanType>(editing?.type ?? 'going');
  const [category, setCategory] = useState<CategoryId | ''>(editing?.category ?? '');
  const [title, setTitle] = useState(editing?.title ?? '');
  const [district, setDistrict] = useState(editing?.district ?? '');
  const [date, setDate] = useState(toDate(start));
  const [time, setTime] = useState(toTime(start));
  const [endDate, setEndDate] = useState(editing?.endAt ? toDate(new Date(editing.endAt)) : '');
  const [capacity, setCapacity] = useState(editing?.capacity ?? 3);
  const [destCity, setDestCity] = useState(editing?.destination?.city ?? '');
  const [destCountry, setDestCountry] = useState(editing?.destination?.country ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [costNote, setCostNote] = useState(editing?.costNote ?? '');
  const [eventUrl, setEventUrl] = useState(editing?.eventUrl ?? '');
  const [areaLabel, setAreaLabel] = useState(editing?.areaLabel ?? '');
  const [meetingPoint, setMeetingPoint] = useState(editing?.meetingPointExact ?? '');
  const [more, setMore] = useState(!!editing);

  if (editId && (!editing || editing.ownerId !== userId)) {
    return (
      <>
        <TopBar title="Planı düzenle" back={() => history.back()} />
        <p className="p-6 text-center text-ink-soft">Bu planı yalnızca plan sahibi düzenleyebilir.</p>
      </>
    );
  }

  const city = db.cities.find((c) => c.id === 'istanbul')!;
  const travel = category === 'seyahat';
  const minApproved = editing ? E.approvedRequests(db, editing.id).length : 0;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const input: E.PlanInput = {
      type, category: (category || 'kesif') as CategoryId, title, cityId: 'istanbul', district,
      startAt: combine(date, time), endAt: travel && endDate ? combine(endDate, '23:00') : undefined,
      capacity, description, costNote, eventUrl, areaLabel, meetingPointExact: meetingPoint,
      destination: travel ? { city: destCity, country: destCountry } : undefined,
    };
    if (!category) { run(() => ({ ok: false, error: 'Bir kategori seç.' })); return; }
    if (editing) {
      const r = run((d) => E.updatePlan(d, userId, editing.id, input), 'Plan güncellendi. Katılımcılara haber verildi.');
      if (r.ok) go(`/plan/${editing.id}`);
    } else {
      const r = run((d) => E.createPlan(d, userId, input), 'Plan yayında! Gelen gelsin 🎉');
      if (r.ok && r.value) go(`/plan/${r.value}`);
    }
  };

  return (
    <>
      <TopBar title={editing ? 'Planı düzenle' : 'Plan aç'} back={editing ? () => history.back() : undefined} />
      <form onSubmit={submit} className="flex flex-col gap-5 px-4 pt-4" noValidate>
        {!editing && <p className="-mb-1 text-sm text-ink-soft">Kısa tut: başlık, tür, zaman ve kontenjan yeter. Gerisi isteğe bağlı.</p>}

        {/* Tür */}
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Plan türü</legend>
          <div className="grid grid-cols-3 gap-2">
            {(Object.keys(PLAN_TYPES) as PlanType[]).map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                aria-pressed={type === t}
                data-testid={`type-${t}`}
                className={cx('flex flex-col items-center gap-1 rounded-2xl border-2 p-2.5 text-center text-[13px] font-bold leading-tight transition', type === t ? 'border-brand-600 bg-brand-50' : 'border-line bg-white')}
              >
                <span className="text-2xl" aria-hidden>{PLAN_TYPES[t].emoji}</span>
                {PLAN_TYPES[t].label}
              </button>
            ))}
          </div>
          <p className="mt-2 rounded-2xl bg-sun-300/30 px-3 py-2 text-sm" data-testid="type-helper">💡 {PLAN_TYPES[type].helper}</p>
        </fieldset>

        <Field label="Başlık">
          <input className={inputCls} value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`ör. ${PLAN_TYPES[type].titleHint}`} maxLength={90} data-testid="f-title" />
        </Field>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold">Kategori</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <button type="button" key={c.id} onClick={() => setCategory(c.id)} aria-pressed={category === c.id} data-testid={`cat-${c.id}`}
                className={cx('rounded-full border px-3 py-2 text-sm font-semibold', category === c.id ? 'border-ink bg-ink text-white' : 'border-line bg-white')}>
                {c.emoji} {c.label}
              </button>
            ))}
          </div>
        </fieldset>

        {travel && (
          <div className="grid grid-cols-2 gap-2 rounded-3xl border border-meet/20 bg-meet-bg/60 p-3">
            <p className="col-span-2 text-sm font-semibold text-meet">✈️ Seyahat detayları</p>
            <Field label="Varış şehri"><input className={inputCls} value={destCity} onChange={(e) => setDestCity(e.target.value)} placeholder="ör. Roma" data-testid="f-dest-city" /></Field>
            <Field label="Ülke"><input className={inputCls} value={destCountry} onChange={(e) => setDestCountry(e.target.value)} placeholder="ör. İtalya" /></Field>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Field label="Şehir">
            <select className={inputCls} value="istanbul" disabled><option value="istanbul">{city.name}</option></select>
          </Field>
          <Field label={travel ? 'Senin ilçen' : 'İlçe'}>
            <select className={inputCls} value={district} onChange={(e) => setDistrict(e.target.value)} data-testid="f-district">
              <option value="">Seç</option>
              {city.districts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field label={travel ? 'Başlangıç' : 'Tarih'}><input type="date" className={inputCls} value={date} onChange={(e) => setDate(e.target.value)} data-testid="f-date" /></Field>
          {travel ? (
            <Field label="Bitiş" optional><input type="date" className={inputCls} value={endDate} min={date} onChange={(e) => setEndDate(e.target.value)} data-testid="f-end-date" /></Field>
          ) : (
            <Field label="Saat"><input type="time" className={inputCls} value={time} onChange={(e) => setTime(e.target.value)} data-testid="f-time" /></Field>
          )}
        </div>

        <Field label={type === 'need_people' ? 'Kaç kişi lazım?' : 'Kontenjan'} hint={`Sen hariç kaç kişi katılabilir?${minApproved ? ` Şu an ${minApproved} onaylı katılımcı var.` : ''}`}>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Azalt" onClick={() => setCapacity((c) => Math.max(Math.max(1, minApproved), c - 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white"><Minus size={20} /></button>
            <span className="w-12 text-center text-2xl font-black" data-testid="f-capacity">{capacity}</span>
            <button type="button" aria-label="Artır" onClick={() => setCapacity((c) => Math.min(30, c + 1))} className="flex h-12 w-12 items-center justify-center rounded-2xl border border-line bg-white" data-testid="cap-plus"><Plus size={20} /></button>
            <span className="text-sm text-ink-soft">kişi</span>
          </div>
        </Field>

        <button type="button" onClick={() => setMore((m) => !m)} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-white px-4 py-3 text-left" aria-expanded={more} data-testid="more-toggle">
          <span>
            <span className="block text-sm font-semibold">Daha fazla detay</span>
            <span className="block text-xs text-ink-soft">Açıklama, masraf, bilet bağlantısı, buluşma noktası</span>
          </span>
          <ChevronDown size={18} className={cx('shrink-0 transition', more && 'rotate-180')} />
        </button>

        {more && (
          <div className="flex flex-col gap-4">
            <Field label="Açıklama" optional>
              <textarea className={cx(inputCls, 'min-h-24')} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ne yapacağız, nasıl biri gelsin?" maxLength={600} />
            </Field>
            <Field label="Genel mekân" optional hint="Herkese açık kartta görünür, ör. “Moda sahili civarı”.">
              <input className={inputCls} value={areaLabel} onChange={(e) => setAreaLabel(e.target.value)} placeholder="Semt / genel bölge" />
            </Field>
            <Field label="Kesin buluşma noktası" optional hint="🔒 Yalnızca onayladığın katılımcılar görür.">
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-soft" />
                <input className={cx(inputCls, 'pl-10')} value={meetingPoint} onChange={(e) => setMeetingPoint(e.target.value)} placeholder="ör. Moda iskelesi, çay bahçesi girişi" data-testid="f-meeting" />
              </div>
            </Field>
            <Field label="Tahmini masraf" optional hint="Bilet, ulaşım, giriş… Katılımcı kendi biletini ve ulaşımını organize eder.">
              <input className={inputCls} value={costNote} onChange={(e) => setCostNote(e.target.value)} placeholder="ör. Bilet kişi başı ~600 TL" data-testid="f-cost" />
            </Field>
            <Field label="Etkinlik / bilet bağlantısı" optional>
              <input type="url" inputMode="url" className={inputCls} value={eventUrl} onChange={(e) => setEventUrl(e.target.value)} placeholder="https://" />
            </Field>
          </div>
        )}

        <div className="sticky bottom-[68px] -mx-4 border-t border-line bg-cream/95 px-4 py-3 backdrop-blur">
          <Button type="submit" block size="lg" data-testid="submit-plan">{editing ? 'Değişiklikleri kaydet' : 'Planı yayınla'}</Button>
        </div>
      </form>
    </>
  );
}
