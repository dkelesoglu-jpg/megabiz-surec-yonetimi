import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FormError, LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { RightsBadge } from '../components/RightsBadge';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, Tabs, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import { rightsHealth, todayIso, type RightsHealth } from '../lib/rights';
import type { BroadcastRight, Category, Channel, ChannelInput } from '../lib/types';

const EMPTY: ChannelInput = {
  slug: '', name: '', countryCode: 'TR', category: 'news', language: 'tr', logoUrl: null, attribution: null,
  isActive: false, sortOrder: 100, streamUrl: null,
};

const LANGUAGES = ['tr', 'en', 'de', 'ar', 'fr', 'es', 'nl'];

/** Kanalın en iyi lisans durumu (uygulamada görünürlük bununla belirlenir). */
export function bestHealth(rights: BroadcastRight[], channelId: string, today: string): RightsHealth | 'none' {
  const order: RightsHealth[] = ['valid', 'expiring', 'not_started', 'inactive', 'expired'];
  const hs = rights.filter((r) => r.channelId === channelId).map((r) => rightsHealth(r, today));
  if (hs.length === 0) return 'none';
  return order.find((h) => hs.includes(h)) ?? 'expired';
}

export function ChannelsPage() {
  const { api } = useAuth();
  const { t } = useI18n();
  const [tab, setTab] = useState<'channels' | 'categories'>('channels');
  const { data, error, reload } = useLoad(async () => {
    const [channels, categories, rights] = await Promise.all([api.listChannels(), api.listCategories(), api.listRights()]);
    return { channels, categories, rights };
  });

  return (
    <>
      <PageHeader title={t('ch.title')} description={t('ch.subtitle')} />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'channels', label: t('ch.tabChannels') }, { value: 'categories', label: t('ch.tabCategories') }]} />
      {!data ? <LoadState error={error} /> : tab === 'channels'
        ? <ChannelsTab {...data} reload={reload} />
        : <CategoriesTab categories={data.categories} channels={data.channels} reload={reload} />}
    </>
  );
}

export function useCategoryName() {
  const { lang } = useI18n();
  return (categories: Category[], key: string) => {
    const c = categories.find((x) => x.key === key);
    return c ? (lang === 'tr' ? c.nameTr : c.nameEn) : key;
  };
}

function ChannelsTab({ channels, categories, rights, reload }: { channels: Channel[]; categories: Category[]; rights: BroadcastRight[]; reload: () => void }) {
  const { t } = useI18n();
  const catName = useCategoryName();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; input: ChannelInput } | null>(null);
  const today = todayIso();

  const rows = useMemo(() => channels.filter((c) =>
    (!category || c.category === category) &&
    (!query || `${c.name} ${c.slug}`.toLowerCase().includes(query.toLowerCase()))), [channels, category, query]);

  return (
    <Card actions={<Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { ...EMPTY, category: categories[0]?.key ?? 'other' } })}><Plus size={16} aria-hidden /> {t('ch.add')}</Button>}
      title={t('ch.count', { n: channels.length })}>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
        <TextInput aria-label={t('common.search')} placeholder={t('ch.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select aria-label={t('common.category')} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('ch.allCategories')}</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{catName(categories, c.key)}</option>)}
        </Select>
      </div>
      <DataList
        rows={rows}
        rowKey={(c) => c.id}
        empty={t('common.noMatch')}
        columns={[
          { header: t('ch.colChannel'), primary: true, cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-ink-3">{c.slug}</p></div> },
          { header: t('common.country'), cell: (c) => c.countryCode },
          { header: t('common.language'), cell: (c) => c.language.toUpperCase() },
          { header: t('common.category'), cell: (c) => catName(categories, c.category) },
          { header: t('ch.colLicense'), cell: (c) => <RightsBadge health={bestHealth(rights, c.id, today)} /> },
          { header: t('common.status'), cell: (c) => c.isActive ? <Badge tone="accent">{t('common.active')}</Badge> : <Badge>{t('common.inactive')}</Badge> },
        ]}
        actions={(c) => (
          <Button size="sm" aria-label={`${t('common.edit')}: ${c.name}`} onClick={() => setEditing({ id: c.id, input: (({ id: _id, ...rest }) => rest)(c) })}>
            <Pencil size={14} aria-hidden /> {t('common.edit')}
          </Button>
        )}
      />
      {editing && <ChannelForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function ChannelForm({ initial, categories, onClose, onSaved }: { initial: { id: string | null; input: ChannelInput }; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const catName = useCategoryName();
  const toast = useToast();
  const [v, setV] = useState<ChannelInput>(initial.input);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof ChannelInput>(k: K, val: ChannelInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    setBusy(true);
    setError(null);
    try {
      if (initial.id) await api.updateChannel(initial.id, v);
      else await api.createChannel(v);
      toast.notify(t('ch.saved'));
      onSaved();
    } catch (e) {
      setError(errorMessage(t, e));
    } finally {
      setBusy(false);
    }
  }

  const languages = LANGUAGES.includes(v.language) ? LANGUAGES : [v.language, ...LANGUAGES];

  return (
    <Modal open title={initial.id ? t('ch.editTitle') : t('ch.newTitle')} onClose={onClose}
      footer={<><Button onClick={onClose}>{t('common.cancel')}</Button><Button variant="primary" onClick={save} disabled={busy}>{t('common.save')}</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label={t('ch.name')}>{(id) => <TextInput id={id} value={v.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label={t('ch.slug')} hint={t('ch.slugHint')}>{(id) => <TextInput id={id} value={v.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} />}</Field>
        <Field label={t('ch.countryCode')}>{(id) => <TextInput id={id} maxLength={2} value={v.countryCode} onChange={(e) => set('countryCode', e.target.value.toUpperCase())} />}</Field>
        <Field label={t('ch.languageCode')}>{(id) => (
          <Select id={id} value={v.language} onChange={(e) => set('language', e.target.value)}>
            {languages.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </Select>)}
        </Field>
        <Field label={t('common.category')}>{(id) => (
          <Select id={id} value={v.category} onChange={(e) => set('category', e.target.value)}>
            {categories.filter((c) => c.isActive || c.key === v.category).map((c) => <option key={c.key} value={c.key}>{catName(categories, c.key)}</option>)}
          </Select>)}
        </Field>
        <Field label={t('common.order')}>{(id) => <TextInput id={id} type="number" value={v.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />}</Field>
        <div className="sm:col-span-2">
          <Field label={t('ch.streamUrl')} hint={t('ch.streamHint')}>
            {(id) => <TextInput id={id} value={v.streamUrl ?? ''} placeholder="https://…/master.m3u8" onChange={(e) => set('streamUrl', e.target.value || null)} />}
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label={t('ch.attribution')}>{(id) => <TextInput id={id} value={v.attribution ?? ''} onChange={(e) => set('attribution', e.target.value || null)} />}</Field>
        </div>
        <div className="sm:col-span-2">
          <Checkbox label={t('ch.activeLabel')} checked={v.isActive} onChange={(c) => set('isActive', c)} />
        </div>
      </div>
      <FormError message={error} />
    </Modal>
  );
}

function CategoriesTab({ categories, channels, reload }: { categories: Category[]; channels: Channel[]; reload: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState<{ isNew: boolean; value: Category } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const count = (k: string) => channels.filter((c) => c.category === k).length;

  async function save() {
    if (!editing) return;
    setError(null);
    try {
      await api.saveCategory(editing.value);
      toast.notify(t('cat.saved'));
      setEditing(null);
      reload();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  const set = <K extends keyof Category>(k: K, val: Category[K]) => setEditing((s) => s && { ...s, value: { ...s.value, [k]: val } });

  return (
    <Card title={t('cat.count', { n: categories.length })} actions={<Button variant="primary" size="sm" onClick={() => setEditing({ isNew: true, value: { key: '', nameTr: '', nameEn: '', sortOrder: 100, isActive: true } })}><Plus size={16} aria-hidden /> {t('cat.add')}</Button>}>
      <DataList rows={categories} rowKey={(c) => c.key} empty={t('common.empty')}
        columns={[
          { header: t('common.category'), primary: true, cell: (c) => <span className="font-medium">{c.nameTr} <span className="font-normal text-ink-3">/ {c.nameEn}</span></span> },
          { header: t('cat.key'), cell: (c) => <code className="text-xs">{c.key}</code> },
          { header: t('cat.channelCount'), cell: (c) => <span className="tabular">{count(c.key)}</span> },
          { header: t('common.status'), cell: (c) => c.isActive ? <Badge tone="accent">{t('common.active')}</Badge> : <Badge>{t('common.inactive')}</Badge> },
        ]}
        actions={(c) => <Button size="sm" onClick={() => setEditing({ isNew: false, value: { ...c } })}><Pencil size={14} aria-hidden /> {t('common.edit')}</Button>}
      />
      {editing && (
        <Modal open title={editing.isNew ? t('cat.newTitle') : t('cat.editTitle')} onClose={() => setEditing(null)}
          footer={<><Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button><Button variant="primary" onClick={save}>{t('common.save')}</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('cat.key')} hint={t('cat.keyHint')}>
              {(id) => <TextInput id={id} value={editing.value.key} disabled={!editing.isNew} onChange={(e) => set('key', e.target.value.toLowerCase())} />}
            </Field>
            <Field label={t('common.order')}>{(id) => <TextInput id={id} type="number" value={editing.value.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />}</Field>
            <Field label={t('cat.nameTr')}>{(id) => <TextInput id={id} value={editing.value.nameTr} onChange={(e) => set('nameTr', e.target.value)} />}</Field>
            <Field label={t('cat.nameEn')}>{(id) => <TextInput id={id} value={editing.value.nameEn} onChange={(e) => set('nameEn', e.target.value)} />}</Field>
            <Checkbox label={t('common.active')} checked={editing.value.isActive} onChange={(c) => set('isActive', c)} />
          </div>
          <FormError message={error} />
        </Modal>
      )}
    </Card>
  );
}
