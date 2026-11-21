import { MapPin, Plus } from 'lucide-react';
import { useState } from 'react';
import { CATEGORIES } from '../domain/catalog';
import * as E from '../domain/engine';
import { go, useStore } from '../state/store';
import { Button, cx, Empty } from '../ui/kit';
import { PlanCard } from '../ui/PlanCard';

// Ekranlar arası gezinmede filtreler korunur.
let saved: E.DiscoverFilters = { cityId: 'istanbul', district: 'all', category: 'all', date: { kind: 'all' } };

const chip = (active: boolean) =>
  cx(
    'shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition',
    active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink/30',
  );

export function Discover() {
  const { db, userId } = useStore();
  const [f, setF] = useState<E.DiscoverFilters>(saved);
  const update = (p: Partial<E.DiscoverFilters>) => { const n = { ...f, ...p }; saved = n; setF(n); };
  const city = db.cities.find((c) => c.id === f.cityId)!;
  const plans = E.discoverPlans(db, userId, f);
  const me = E.getUser(db, userId);

  return (
    <div className="px-4 pt-5">
      <p className="text-sm font-semibold text-brand-700">Merhaba {me?.name.split(' ')[0]} 👋</p>
      <h1 className="mb-1 text-[28px] font-black leading-tight tracking-tight">Bugün nereye gidiyoruz?</h1>
      <p className="mb-4 text-sm text-ink-soft">Ben gidiyorum, gelen gelsin. Bir plan seç ya da kendin aç.</p>

      {/* Konum: GPS gerekmeden şehir/ilçe seçimi */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <label className="flex items-center gap-2 rounded-2xl border border-line bg-white px-3 py-2.5">
          <MapPin size={16} className="text-brand-600" />
          <span className="sr-only">Şehir</span>
          <select value={f.cityId} onChange={(e) => update({ cityId: e.target.value, district: 'all' })} className="w-full bg-transparent text-sm font-semibold outline-none" data-testid="filter-city">
            {db.cities.map((c) => (
              <option key={c.id} value={c.id} disabled={!c.active}>{c.name}{c.active ? '' : ' (yakında)'}</option>
            ))}
          </select>
        </label>
        <label className="flex items-center rounded-2xl border border-line bg-white px-3 py-2.5">
          <span className="sr-only">İlçe</span>
          <select value={f.district} onChange={(e) => update({ district: e.target.value })} className="w-full bg-transparent text-sm font-semibold outline-none" data-testid="filter-district">
            <option value="all">Tüm ilçeler</option>
            {city.districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
      </div>

      {/* Tarih */}
      <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Tarih filtresi">
        <button className={chip(f.date.kind === 'all')} onClick={() => update({ date: { kind: 'all' } })}>Tümü</button>
        <button className={chip(f.date.kind === 'today')} onClick={() => update({ date: { kind: 'today' } })} data-testid="filter-today">Bugün</button>
        <button className={chip(f.date.kind === 'weekend')} onClick={() => update({ date: { kind: 'weekend' } })} data-testid="filter-weekend">Hafta sonu</button>
        <label className={cx(chip(f.date.kind === 'date'), 'flex items-center gap-1')}>
          <span>Tarih:</span>
          <input
            type="date"
            aria-label="Tarih seç"
            className="bg-transparent outline-none"
            value={f.date.kind === 'date' ? f.date.date : ''}
            onChange={(e) => update({ date: e.target.value ? { kind: 'date', date: e.target.value } : { kind: 'all' } })}
          />
        </label>
      </div>

      {/* Kategori */}
      <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label="Kategori filtresi">
        <button className={chip(f.category === 'all')} onClick={() => update({ category: 'all' })}>Hepsi</button>
        {CATEGORIES.map((c) => (
          <button key={c.id} className={chip(f.category === c.id)} onClick={() => update({ category: c.id })}>
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      <p className="mb-3 text-sm font-semibold text-ink-soft" data-testid="result-count">{plans.length} plan bulundu</p>

      <div className="flex flex-col gap-3">
        {plans.map((p) => <PlanCard key={p.id} db={db} plan={p} userId={userId} />)}
        {plans.length === 0 && (
          <Empty
            emoji="🧭"
            title="Bu filtrelerle plan yok"
            text="Filtreleri genişlet ya da ilk planı sen aç. Gelen gelsin!"
            action={<Button onClick={() => go('/create')}><Plus size={18} />Plan aç</Button>}
          />
        )}
      </div>
    </div>
  );
}
