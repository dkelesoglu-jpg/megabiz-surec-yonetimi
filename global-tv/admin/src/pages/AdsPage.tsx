import { Info, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FormError, LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, Tabs, TextArea, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { AdPlacement, AdPlacementInput, Channel, SponsorPlacement, Sponsorship, SponsorshipInput } from '../lib/types';

const FORMATS: AdPlacement['format'][] = ['banner', 'interstitial', 'native', 'preroll'];
const PLATFORMS: AdPlacement['platform'][] = ['all', 'android', 'ios'];
const SPONSOR_PLACEMENTS: SponsorPlacement[] = ['home_featured', 'channel_banner', 'chat_pinned'];

export function AdsPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'placements' | 'sponsors'>('placements');
  return (
    <>
      <PageHeader title={t('ads.title')} description={t('ads.subtitle')} />
      <p className="mb-4 flex items-start gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm text-ink-2">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{t('ads.notice')}
      </p>
      <Tabs value={tab} onChange={setTab} items={[{ value: 'placements', label: t('ads.tabPlacements') }, { value: 'sponsors', label: t('ads.tabSponsors') }]} />
      {tab === 'placements' ? <PlacementsTab /> : <SponsorsTab />}
    </>
  );
}

function PlacementsTab() {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => api.listAdPlacements());
  const [editing, setEditing] = useState<{ id: string | null; input: AdPlacementInput } | null>(null);
  const toInput = ({ id: _id, ...rest }: AdPlacement): AdPlacementInput => rest;

  async function toggle(ad: AdPlacement) {
    try {
      await api.saveAdPlacement(ad.id, { ...toInput(ad), isEnabled: !ad.isEnabled });
      toast.notify(t('ads.toggled', { name: ad.name, state: ad.isEnabled ? t('common.off') : t('common.on') }));
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  if (!data) return <LoadState error={error} />;
  return (
    <Card title={t('ads.count', { n: data.length })} actions={
      <Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { key: '', name: '', platform: 'all', format: 'banner', provider: 'admob', unitId: null, isTest: true, isEnabled: false, frequencyCap: null, notes: null } })}>
        <Plus size={16} aria-hidden /> {t('ads.add')}
      </Button>}>
      <DataList rows={data} rowKey={(a) => a.id} empty={t('common.empty')}
        columns={[
          { header: t('ads.colPlacement'), primary: true, cell: (a) => <div><p className="font-medium">{a.name}</p><code className="text-xs text-ink-3">{a.key}</code></div> },
          { header: t('ads.colFormat'), cell: (a) => t(`ads.f.${a.format}`) },
          { header: t('ads.colPlatform'), cell: (a) => t(`ads.p.${a.platform}`) },
          { header: t('ads.colCap'), cell: (a) => a.frequencyCap ? t('ads.capValue', { n: a.frequencyCap }) : '—' },
          { header: t('common.status'), cell: (a) => <div className="flex flex-wrap gap-1">{a.isEnabled ? <Badge tone="good">{t('common.on')}</Badge> : <Badge>{t('common.off')}</Badge>}{a.isTest && <Badge tone="warning">{t('common.test')}</Badge>}</div> },
        ]}
        actions={(a) => (
          <>
            <Button size="sm" onClick={() => toggle(a)}>{a.isEnabled ? t('ads.disable') : t('ads.enable')}</Button>
            <Button size="sm" onClick={() => setEditing({ id: a.id, input: toInput(a) })}><Pencil size={14} aria-hidden /> {t('common.edit')}</Button>
          </>
        )}
      />
      {editing && <AdForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function AdForm({ initial, onClose, onSaved }: { initial: { id: string | null; input: AdPlacementInput }; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [v, setV] = useState(initial.input);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof AdPlacementInput>(k: K, val: AdPlacementInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    try {
      await api.saveAdPlacement(initial.id, v);
      toast.notify(t('ads.saved'));
      onSaved();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  return (
    <Modal open title={initial.id ? t('ads.editTitle') : t('ads.newTitle')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('common.cancel')}</Button><Button variant="primary" onClick={save}>{t('common.save')}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('ads.name')}>{(id) => <TextInput id={id} value={v.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label={t('ads.key')} hint={t('ads.keyHint')}>{(id) => <TextInput id={id} value={v.key} onChange={(e) => set('key', e.target.value.toLowerCase())} />}</Field>
        <Field label={t('ads.colFormat')}>{(id) => (
          <Select id={id} value={v.format} onChange={(e) => set('format', e.target.value as AdPlacement['format'])}>
            {FORMATS.map((f) => <option key={f} value={f}>{t(`ads.f.${f}`)}</option>)}
          </Select>)}
        </Field>
        <Field label={t('ads.colPlatform')}>{(id) => (
          <Select id={id} value={v.platform} onChange={(e) => set('platform', e.target.value as AdPlacement['platform'])}>
            {PLATFORMS.map((p) => <option key={p} value={p}>{t(`ads.p.${p}`)}</option>)}
          </Select>)}
        </Field>
        <Field label={t('ads.unitId')} hint={t('ads.unitHint')}>
          {(id) => <TextInput id={id} value={v.unitId ?? ''} onChange={(e) => set('unitId', e.target.value || null)} />}
        </Field>
        <Field label={t('ads.cap')}>{(id) => (
          <TextInput id={id} type="number" min={1} max={100} value={v.frequencyCap ?? ''} onChange={(e) => set('frequencyCap', e.target.value ? Number(e.target.value) : null)} />)}
        </Field>
        <div className="sm:col-span-2"><Field label={t('common.notes')}>{(id) => <TextArea id={id} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />}</Field></div>
        <Checkbox label={t('ads.isTest')} checked={v.isTest} onChange={(c) => set('isTest', c)} />
        <Checkbox label={t('common.on')} checked={v.isEnabled} onChange={(c) => set('isEnabled', c)} />
      </div>
      <FormError message={error} />
    </Modal>
  );
}

function sponsorState(s: Sponsorship, now = Date.now()): 'live' | 'scheduled' | 'ended' | 'off' {
  if (!s.isActive) return 'off';
  if (now < Date.parse(s.startsAt)) return 'scheduled';
  if (now > Date.parse(s.endsAt)) return 'ended';
  return 'live';
}

function SponsorsTab() {
  const { api } = useAuth();
  const { t, fmtDateTime, lang } = useI18n();
  const { data, error, reload } = useLoad(async () => {
    const [sponsorships, channels] = await Promise.all([api.listSponsorships(), api.listChannels().catch(() => [] as Channel[])]);
    return { sponsorships, channels };
  });
  const [editing, setEditing] = useState<{ id: string | null; input: SponsorshipInput } | null>(null);

  if (!data) return <LoadState error={error} />;
  const blank = (): SponsorshipInput => {
    const start = new Date();
    return { sponsorName: '', titleTr: '', titleEn: '', placement: 'home_featured', channelId: null, clickUrl: null,
      startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 30 * 86_400_000).toISOString(), isActive: false, notes: null };
  };

  return (
    <Card title={t('sp.count', { n: data.sponsorships.length })} actions={
      <Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: blank() })}><Plus size={16} aria-hidden /> {t('sp.add')}</Button>}>
      <DataList rows={data.sponsorships} rowKey={(s) => s.id} empty={t('common.empty')}
        columns={[
          { header: t('sp.colSponsor'), primary: true, cell: (s) => <div><p className="font-medium">{lang === 'tr' ? s.titleTr : s.titleEn}</p><p className="text-xs text-ink-3">{s.sponsorName}</p></div> },
          { header: t('sp.colPlacement'), cell: (s) => t(`sp.pl.${s.placement}`) },
          { header: t('sp.colPeriod'), cell: (s) => <span className="tabular text-xs">{fmtDateTime(s.startsAt)} → {fmtDateTime(s.endsAt)}</span> },
          { header: t('common.status'), cell: (s) => {
            const st = sponsorState(s);
            return st === 'live' ? <Badge tone="good">{t('sp.live')}</Badge> : st === 'scheduled' ? <Badge tone="accent">{t('sp.scheduled')}</Badge>
              : st === 'ended' ? <Badge>{t('sp.ended')}</Badge> : <Badge>{t('common.off')}</Badge>;
          } },
        ]}
        actions={(s) => <Button size="sm" onClick={() => setEditing({ id: s.id, input: (({ id: _id, ...rest }) => rest)(s) })}><Pencil size={14} aria-hidden /> {t('common.edit')}</Button>}
      />
      {editing && <SponsorForm initial={editing} channels={data.channels} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function toLocalInput(iso: string): string {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function SponsorForm({ initial, channels, onClose, onSaved }: { initial: { id: string | null; input: SponsorshipInput }; channels: Channel[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [v, setV] = useState(initial.input);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof SponsorshipInput>(k: K, val: SponsorshipInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    try {
      await api.saveSponsorship(initial.id, v);
      toast.notify(t('sp.saved'));
      onSaved();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  return (
    <Modal open title={initial.id ? t('sp.editTitle') : t('sp.newTitle')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('common.cancel')}</Button><Button variant="primary" onClick={save}>{t('common.save')}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Field label={t('sp.sponsor')}>{(id) => <TextInput id={id} value={v.sponsorName} onChange={(e) => set('sponsorName', e.target.value)} />}</Field></div>
        <Field label={t('sp.titleTr')}>{(id) => <TextInput id={id} value={v.titleTr} onChange={(e) => set('titleTr', e.target.value)} />}</Field>
        <Field label={t('sp.titleEn')}>{(id) => <TextInput id={id} value={v.titleEn} onChange={(e) => set('titleEn', e.target.value)} />}</Field>
        <Field label={t('sp.placement')}>{(id) => (
          <Select id={id} value={v.placement} onChange={(e) => set('placement', e.target.value as SponsorPlacement)}>
            {SPONSOR_PLACEMENTS.map((p) => <option key={p} value={p}>{t(`sp.pl.${p}`)}</option>)}
          </Select>)}
        </Field>
        <Field label={t('sp.channel')}>{(id) => (
          <Select id={id} value={v.channelId ?? ''} onChange={(e) => set('channelId', e.target.value || null)}>
            <option value="">{t('sp.anyChannel')}</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>)}
        </Field>
        <div className="sm:col-span-2"><Field label={t('sp.link')}>{(id) => <TextInput id={id} value={v.clickUrl ?? ''} placeholder="https://" onChange={(e) => set('clickUrl', e.target.value || null)} />}</Field></div>
        <Field label={t('ann.start')}>{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(v.startsAt)} onChange={(e) => e.target.value && set('startsAt', new Date(e.target.value).toISOString())} />}</Field>
        <Field label={t('lic.until')}>{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(v.endsAt)} onChange={(e) => e.target.value && set('endsAt', new Date(e.target.value).toISOString())} />}</Field>
        <div className="sm:col-span-2"><Field label={t('common.notes')}>{(id) => <TextArea id={id} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />}</Field></div>
        <Checkbox label={t('common.active')} checked={v.isActive} onChange={(c) => set('isActive', c)} />
      </div>
      <FormError message={error} />
    </Modal>
  );
}
