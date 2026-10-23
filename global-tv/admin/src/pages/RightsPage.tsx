import { CheckCircle2, Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { RightsBadge } from '../components/RightsBadge';
import { Badge, Button, Card, DataList, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import { addDays, daysBetween, parseCountries, rightsHealth, todayIso, type RightsHealth } from '../lib/rights';
import type { BroadcastRight, Channel, RightInput, RightsStatus } from '../lib/types';

const STATUS_LABELS: Record<RightsStatus, string> = { pending: 'Beklemede', verified: 'Doğrulandı', rejected: 'Reddedildi', revoked: 'İptal edildi' };
const LICENSE_TYPES = [
  { value: 'direct_agreement', label: 'Doğrudan sözleşme' },
  { value: 'fast_partner', label: 'FAST ortağı' },
  { value: 'public_broadcaster', label: 'Kamu yayıncısı izni' },
  { value: 'demo_test', label: 'Demo / test içeriği' },
];

export function RightsPage() {
  const { api } = useAuth();
  const { data, error, reload } = useLoad(async () => {
    const [rights, channels] = await Promise.all([api.listRights(), api.listChannels()]);
    return { rights, channels };
  });

  return (
    <>
      <PageHeader title="Yayın hakları" description="Ülke bazlı yayın izinleri ve geçerlilik takibi. Yalnızca doğrulanmış ve süresi geçerli hakkı olan kanallar uygulamada görünür." />
      {!data ? <LoadState error={error} /> : (
        <div className="flex flex-col gap-4">
          <RightsList rights={data.rights} channels={data.channels} reload={reload} />
          <CountryView rights={data.rights} channels={data.channels} />
        </div>
      )}
    </>
  );
}

function RightsList({ rights, channels, reload }: { rights: BroadcastRight[]; channels: Channel[]; reload: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const today = todayIso();
  const [filter, setFilter] = useState<RightsHealth | ''>('');
  const [editing, setEditing] = useState<{ id: string | null; input: RightInput } | null>(null);
  const channelName = (id: string) => channels.find((c) => c.id === id)?.name ?? '—';

  const rows = useMemo(() => rights
    .filter((r) => !filter || rightsHealth(r, today) === filter)
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil)), [rights, filter, today]);

  async function quickStatus(r: BroadcastRight, status: RightsStatus) {
    try {
      await api.updateRight(r.id, { ...(({ id: _id, ...rest }) => rest)(r), status });
      toast.notify(`Durum: ${STATUS_LABELS[status]}`);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  const newRight = (): RightInput => ({
    channelId: channels[0]?.id ?? '', rightsHolder: '', licenseType: 'direct_agreement', allowedCountries: ['TR'],
    validFrom: today, validUntil: addDays(today, 365), status: 'pending', notes: null,
  });

  return (
    <Card title={`${rights.length} yayın hakkı kaydı`}
      actions={<Button variant="primary" size="sm" disabled={channels.length === 0} onClick={() => setEditing({ id: null, input: newRight() })}><Plus size={16} aria-hidden /> Hak ekle</Button>}>
      <div className="mb-3 max-w-xs">
        <Select aria-label="Durum filtresi" value={filter} onChange={(e) => setFilter(e.target.value as RightsHealth | '')}>
          <option value="">Tüm durumlar</option>
          <option value="valid">Geçerli</option>
          <option value="expiring">14 gün içinde bitiyor</option>
          <option value="expired">Süresi doldu</option>
          <option value="not_started">Henüz başlamadı</option>
          <option value="inactive">Doğrulanmamış / iptal</option>
        </Select>
      </div>
      <DataList rows={rows} rowKey={(r) => r.id} empty="Bu filtrede kayıt yok."
        columns={[
          { header: 'Kanal', primary: true, cell: (r) => <div><p className="font-medium">{channelName(r.channelId)}</p><p className="text-xs text-ink-3">{r.rightsHolder}</p></div> },
          { header: 'Ülkeler', cell: (r) => <div className="flex flex-wrap gap-1">{r.allowedCountries.map((c) => <Badge key={c}>{c}</Badge>)}</div> },
          { header: 'Geçerlilik', cell: (r) => <ValidityCell right={r} today={today} /> },
          { header: 'Durum', cell: (r) => <div className="flex flex-col items-start gap-1"><RightsBadge health={rightsHealth(r, today)} /><span className="text-xs text-ink-3">{STATUS_LABELS[r.status]}</span></div> },
        ]}
        actions={(r) => (
          <>
            {r.status === 'pending' && <Button size="sm" onClick={() => quickStatus(r, 'verified')}><CheckCircle2 size={14} aria-hidden /> Doğrula</Button>}
            {r.status === 'verified' && <Button size="sm" variant="danger" onClick={() => quickStatus(r, 'revoked')}>İptal et</Button>}
            <Button size="sm" aria-label="Hakkı düzenle" onClick={() => setEditing({ id: r.id, input: (({ id: _id, ...rest }) => rest)(r) })}><Pencil size={14} aria-hidden /> Düzenle</Button>
          </>
        )}
      />
      {editing && <RightForm initial={editing} channels={channels} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function ValidityCell({ right, today }: { right: BroadcastRight; today: string }) {
  const left = daysBetween(today, right.validUntil);
  return (
    <div className="tabular">
      <p>{right.validFrom} → {right.validUntil}</p>
      <p className="text-xs text-ink-3">{left >= 0 ? `${left} gün kaldı` : `${-left} gün önce bitti`}</p>
    </div>
  );
}

function RightForm({ initial, channels, onClose, onSaved }: { initial: { id: string | null; input: RightInput }; channels: Channel[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [v, setV] = useState(initial.input);
  const [countries, setCountries] = useState(initial.input.allowedCountries.join(', '));
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof RightInput>(k: K, val: RightInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    setError(null);
    const input = { ...v, allowedCountries: parseCountries(countries) };
    try {
      if (initial.id) await api.updateRight(initial.id, input);
      else await api.createRight(input);
      toast.notify('Yayın hakkı kaydedildi.');
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Modal open title={initial.id ? 'Yayın hakkını düzenle' : 'Yeni yayın hakkı'} onClose={onClose}
      footer={<><Button onClick={onClose}>Vazgeç</Button><Button variant="primary" onClick={save}>Kaydet</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Kanal">{(id) => (
            <Select id={id} value={v.channelId} onChange={(e) => set('channelId', e.target.value)}>
              {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>)}
          </Field>
        </div>
        <Field label="Hak sahibi">{(id) => <TextInput id={id} value={v.rightsHolder} onChange={(e) => set('rightsHolder', e.target.value)} />}</Field>
        <Field label="Lisans türü">{(id) => (
          <Select id={id} value={v.licenseType} onChange={(e) => set('licenseType', e.target.value)}>
            {LICENSE_TYPES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
          </Select>)}
        </Field>
        <div className="sm:col-span-2">
          <Field label="İzin verilen ülkeler" hint="ISO kodları, virgülle ayırın (ör. TR, DE, NL)">
            {(id) => <TextInput id={id} value={countries} onChange={(e) => setCountries(e.target.value)} />}
          </Field>
        </div>
        <Field label="Başlangıç">{(id) => <TextInput id={id} type="date" value={v.validFrom} onChange={(e) => set('validFrom', e.target.value)} />}</Field>
        <Field label="Bitiş">{(id) => <TextInput id={id} type="date" value={v.validUntil} onChange={(e) => set('validUntil', e.target.value)} />}</Field>
        <Field label="Durum">{(id) => (
          <Select id={id} value={v.status} onChange={(e) => set('status', e.target.value as RightsStatus)}>
            {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>)}
        </Field>
        <div className="sm:col-span-2">
          <Field label="Notlar" hint="Belge yükleme, Supabase Storage bağlandığında eklenecek.">
            {(id) => <TextArea id={id} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />}
          </Field>
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
    </Modal>
  );
}

/** Seçilen ülkede bugün hangi kanalların izlenebildiği. */
function CountryView({ rights, channels }: { rights: BroadcastRight[]; channels: Channel[] }) {
  const today = todayIso();
  const countries = useMemo(() => [...new Set(rights.flatMap((r) => r.allowedCountries))].sort(), [rights]);
  const [country, setCountry] = useState(countries.includes('TR') ? 'TR' : countries[0] ?? '');
  const available = channels.filter((c) => c.isActive && rights.some((r) =>
    r.channelId === c.id && r.allowedCountries.includes(country) && ['valid', 'expiring'].includes(rightsHealth(r, today))));

  return (
    <Card title="Ülke görünümü">
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-32">
          <Select aria-label="Ülke" value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <p className="text-sm text-ink-2">Bu ülkede bugün <strong>{available.length}</strong> kanal izlenebilir.</p>
      </div>
      {available.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {available.map((c) => <li key={c.id}><Badge tone="accent">{c.name}</Badge></li>)}
        </ul>
      )}
    </Card>
  );
}
