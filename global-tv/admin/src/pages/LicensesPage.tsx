import { CheckCircle2, ExternalLink, FileText, Pencil, Plus, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FormError, LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { RightsBadge } from '../components/RightsBadge';
import { Badge, Button, Card, DataList, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import { DOCUMENT_TYPES } from '../lib/api';
import { addDays, daysBetween, parseCountries, rightsHealth, todayIso, type RightsHealth } from '../lib/rights';
import type { BroadcastRight, Channel, RightInput, RightsStatus } from '../lib/types';

const STATUSES: RightsStatus[] = ['pending', 'verified', 'rejected', 'revoked'];
const LICENSE_TYPES = ['direct_agreement', 'fast_partner', 'public_broadcaster', 'demo_test'] as const;

export function LicensesPage() {
  const { api } = useAuth();
  const { t } = useI18n();
  const { data, error, reload } = useLoad(async () => {
    const [rights, channels] = await Promise.all([api.listRights(), api.listChannels()]);
    return { rights, channels };
  });

  return (
    <>
      <PageHeader title={t('lic.title')} description={t('lic.subtitle')} />
      {!data ? <LoadState error={error} /> : (
        <div className="flex flex-col gap-4">
          <RightsList rights={data.rights} channels={data.channels} reload={reload} />
          <CountryView rights={data.rights} channels={data.channels} />
        </div>
      )}
    </>
  );
}

function DocumentCell({ right, onUploaded }: { right: BroadcastRight; onUploaded: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);

  async function upload(file: File | undefined) {
    if (!file) return;
    try {
      await api.uploadRightDocument(right.id, file);
      toast.notify(t('lic.uploaded'));
      onUploaded();
    } catch (e) {
      toast.fail(e);
    } finally {
      if (input.current) input.current.value = '';
    }
  }

  async function open() {
    try {
      window.open(await api.rightDocumentUrl(right.id), '_blank', 'noopener');
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {right.documentName ? (
        <button type="button" onClick={open} className="inline-flex max-w-48 items-center gap-1 text-sm text-accent hover:underline">
          <FileText size={14} aria-hidden className="shrink-0" /><span className="truncate">{right.documentName}</span>
          <ExternalLink size={12} aria-hidden className="shrink-0" />
        </button>
      ) : <span className="text-xs text-ink-3">{t('lic.noDocument')}</span>}
      <input ref={input} type="file" accept={DOCUMENT_TYPES.join(',')} className="sr-only" aria-label={`${t('lic.upload')}: ${right.rightsHolder}`}
        onChange={(e) => upload(e.target.files?.[0])} />
      <Button size="sm" variant="ghost" onClick={() => input.current?.click()}><Upload size={14} aria-hidden /> {t('lic.upload')}</Button>
    </div>
  );
}

function RightsList({ rights, channels, reload }: { rights: BroadcastRight[]; channels: Channel[]; reload: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const today = todayIso();
  const [filter, setFilter] = useState<RightsHealth | ''>('');
  const [editing, setEditing] = useState<{ id: string | null; input: RightInput } | null>(null);
  const channelName = (id: string) => channels.find((c) => c.id === id)?.name ?? '—';
  const toInput = ({ id: _id, documentName: _d, ...rest }: BroadcastRight): RightInput => rest;

  const rows = useMemo(() => rights
    .filter((r) => !filter || rightsHealth(r, today) === filter)
    .sort((a, b) => a.validUntil.localeCompare(b.validUntil)), [rights, filter, today]);

  async function quickStatus(r: BroadcastRight, status: RightsStatus) {
    try {
      await api.updateRight(r.id, { ...toInput(r), status });
      toast.notify(t('lic.statusChanged', { status: t(`lic.st.${status}`) }));
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
    <Card title={t('lic.count', { n: rights.length })}
      actions={<Button variant="primary" size="sm" disabled={channels.length === 0} onClick={() => setEditing({ id: null, input: newRight() })}><Plus size={16} aria-hidden /> {t('lic.add')}</Button>}>
      <div className="mb-3 max-w-xs">
        <Select aria-label={t('common.status')} value={filter} onChange={(e) => setFilter(e.target.value as RightsHealth | '')}>
          <option value="">{t('lic.allStatuses')}</option>
          <option value="valid">{t('lic.fValid')}</option>
          <option value="expiring">{t('lic.fExpiring')}</option>
          <option value="expired">{t('lic.fExpired')}</option>
          <option value="not_started">{t('lic.fNotStarted')}</option>
          <option value="inactive">{t('lic.fInactive')}</option>
        </Select>
      </div>
      <DataList rows={rows} rowKey={(r) => r.id} empty={t('common.noMatch')}
        columns={[
          { header: t('common.channel'), primary: true, cell: (r) => <div><p className="font-medium">{channelName(r.channelId)}</p><p className="text-xs text-ink-3">{r.rightsHolder}</p></div> },
          { header: t('lic.colCountries'), cell: (r) => <div className="flex flex-wrap gap-1">{r.allowedCountries.map((c) => <Badge key={c}>{c}</Badge>)}</div> },
          { header: t('lic.colValidity'), cell: (r) => <ValidityCell right={r} today={today} /> },
          { header: t('common.status'), cell: (r) => <div className="flex flex-col items-start gap-1"><RightsBadge health={rightsHealth(r, today)} /><span className="text-xs text-ink-3">{t(`lic.st.${r.status}`)}</span></div> },
          { header: t('lic.colDocument'), cell: (r) => <DocumentCell right={r} onUploaded={reload} /> },
        ]}
        actions={(r) => (
          <>
            {r.status === 'pending' && <Button size="sm" onClick={() => quickStatus(r, 'verified')}><CheckCircle2 size={14} aria-hidden /> {t('lic.verify')}</Button>}
            {r.status === 'verified' && <Button size="sm" variant="danger" onClick={() => quickStatus(r, 'revoked')}>{t('lic.revoke')}</Button>}
            <Button size="sm" aria-label={`${t('common.edit')}: ${r.rightsHolder}`} onClick={() => setEditing({ id: r.id, input: toInput(r) })}><Pencil size={14} aria-hidden /> {t('common.edit')}</Button>
          </>
        )}
      />
      {editing && <RightForm initial={editing} channels={channels} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function ValidityCell({ right, today }: { right: BroadcastRight; today: string }) {
  const { t } = useI18n();
  const left = daysBetween(today, right.validUntil);
  return (
    <div className="tabular">
      <p className="whitespace-nowrap">{right.validFrom} → {right.validUntil}</p>
      <p className="text-xs text-ink-3">{left >= 0 ? t('common.daysLeft', { n: left }) : t('common.daysAgo', { n: -left })}</p>
    </div>
  );
}

function RightForm({ initial, channels, onClose, onSaved }: { initial: { id: string | null; input: RightInput }; channels: Channel[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
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
      toast.notify(t('lic.saved'));
      onSaved();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  return (
    <Modal open title={initial.id ? t('lic.editTitle') : t('lic.newTitle')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('common.cancel')}</Button><Button variant="primary" onClick={save}>{t('common.save')}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label={t('common.channel')}>{(id) => (
            <Select id={id} value={v.channelId} onChange={(e) => set('channelId', e.target.value)}>
              {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>)}
          </Field>
        </div>
        <Field label={t('lic.holder')}>{(id) => <TextInput id={id} value={v.rightsHolder} onChange={(e) => set('rightsHolder', e.target.value)} />}</Field>
        <Field label={t('lic.type')}>{(id) => (
          <Select id={id} value={v.licenseType} onChange={(e) => set('licenseType', e.target.value)}>
            {LICENSE_TYPES.map((l) => <option key={l} value={l}>{t(`lic.t.${l}`)}</option>)}
          </Select>)}
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('lic.countries')} hint={t('lic.countriesHint')}>
            {(id) => <TextInput id={id} value={countries} onChange={(e) => setCountries(e.target.value)} />}
          </Field>
        </div>
        <Field label={t('lic.from')}>{(id) => <TextInput id={id} type="date" value={v.validFrom} onChange={(e) => set('validFrom', e.target.value)} />}</Field>
        <Field label={t('lic.until')}>{(id) => <TextInput id={id} type="date" value={v.validUntil} onChange={(e) => set('validUntil', e.target.value)} />}</Field>
        <Field label={t('common.status')}>{(id) => (
          <Select id={id} value={v.status} onChange={(e) => set('status', e.target.value as RightsStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{t(`lic.st.${s}`)}</option>)}
          </Select>)}
        </Field>
        <div className="sm:col-span-2">
          <Field label={t('common.notes')} hint={t('lic.documentHint')}>
            {(id) => <TextArea id={id} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />}
          </Field>
        </div>
      </div>
      <FormError message={error} />
    </Modal>
  );
}

/** Seçilen ülkede bugün hangi kanalların izlenebildiği (coğrafi kısıt görünümü). */
function CountryView({ rights, channels }: { rights: BroadcastRight[]; channels: Channel[] }) {
  const { t } = useI18n();
  const today = todayIso();
  const countries = useMemo(() => [...new Set(rights.flatMap((r) => r.allowedCountries))].sort(), [rights]);
  const [country, setCountry] = useState(countries.includes('TR') ? 'TR' : countries[0] ?? '');
  const available = channels.filter((c) => c.isActive && rights.some((r) =>
    r.channelId === c.id && r.allowedCountries.includes(country) && ['valid', 'expiring'].includes(rightsHealth(r, today))));

  return (
    <Card title={t('lic.geoTitle')}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="w-32">
          <Select aria-label={t('common.country')} value={country} onChange={(e) => setCountry(e.target.value)}>
            {countries.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </div>
        <p className="text-sm text-ink-2">{t('lic.geoBody', { n: available.length })}</p>
      </div>
      {available.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {available.map((c) => <li key={c.id}><Badge tone="accent">{c.name}</Badge></li>)}
        </ul>
      )}
    </Card>
  );
}
