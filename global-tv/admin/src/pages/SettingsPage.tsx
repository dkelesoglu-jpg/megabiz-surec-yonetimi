import { Pencil, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { FormError, LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { Announcement, AnnouncementInput, AppSettings } from '../lib/types';

/** Mobil uygulamada çevirisi bulunan diller. Yeni dil, çeviri dosyası eklendikten sonra açılabilir. */
const AVAILABLE_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', ready: true },
  { code: 'en', label: 'English', ready: true },
  { code: 'de', label: 'Deutsch', ready: false },
  { code: 'ar', label: 'العربية', ready: false },
];

export function SettingsPage() {
  const { api, can } = useAuth();
  const { t } = useI18n();
  const { data, error, reload } = useLoad(async () => {
    const [settings, announcements] = await Promise.all([api.getSettings(), api.listAnnouncements()]);
    return { settings, announcements };
  });

  return (
    <>
      <PageHeader title={t('set.title')} description={t('set.subtitle')} />
      {!data ? <LoadState error={error} /> : (
        <div className="flex flex-col gap-4">
          <SettingsForm initial={data.settings} readOnly={!can('settings.manage')} onSaved={reload} />
          <Announcements items={data.announcements} canEdit={can('announcements.manage')} reload={reload} />
        </div>
      )}
    </>
  );
}

function SettingsForm({ initial, readOnly, onSaved }: { initial: AppSettings; readOnly: boolean; onSaved: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setS(initial), [initial]);

  async function save() {
    setError(null);
    try {
      await api.saveSettings(s);
      toast.notify(t('set.saved'));
      onSaved();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }

  const toggleLang = (code: string, on: boolean) => setS((x) => ({
    ...x,
    languages: { ...x.languages, supported: on ? [...x.languages.supported, code] : x.languages.supported.filter((c) => c !== code) },
  }));
  const setVersion = (platform: 'android' | 'ios', field: 'latest' | 'minSupported', value: string) =>
    setS((x) => ({ ...x, appVersion: { ...x.appVersion, [platform]: { ...x.appVersion[platform], [field]: value } } }));

  return (
    <Card title={t('set.app')} actions={readOnly
      ? <Badge>{t('common.readOnly')}</Badge>
      : <Button variant="primary" size="sm" onClick={save}><Save size={16} aria-hidden /> {t('common.save')}</Button>}>
      <fieldset disabled={readOnly} className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('set.languages')}</h3>
          {AVAILABLE_LANGUAGES.map((l) => (
            <Checkbox key={l.code} label={`${l.label}${l.ready ? '' : ` ${t('set.noTranslation')}`}`} disabled={readOnly || !l.ready}
              checked={s.languages.supported.includes(l.code)} onChange={(on) => toggleLang(l.code, on)} />
          ))}
          <Field label={t('set.defaultLanguage')}>{(id) => (
            <Select id={id} value={s.languages.default} onChange={(e) => setS((x) => ({ ...x, languages: { ...x.languages, default: e.target.value } }))}>
              {s.languages.supported.map((c) => <option key={c} value={c}>{AVAILABLE_LANGUAGES.find((l) => l.code === c)?.label ?? c}</option>)}
            </Select>)}
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('set.version')}</h3>
          {(['android', 'ios'] as const).map((p) => (
            <div key={p} className="grid grid-cols-2 gap-2">
              <Field label={t('set.latest', { platform: p === 'ios' ? 'iOS' : 'Android' })}>{(id) => <TextInput id={id} value={s.appVersion[p].latest} onChange={(e) => setVersion(p, 'latest', e.target.value)} />}</Field>
              <Field label={t('set.minimum')}>{(id) => <TextInput id={id} value={s.appVersion[p].minSupported} onChange={(e) => setVersion(p, 'minSupported', e.target.value)} />}</Field>
            </div>
          ))}
          <p className="text-xs text-ink-3">{t('set.versionHint')}</p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">{t('set.maintenance')}</h3>
          <Checkbox label={t('set.maintenanceOn')} checked={s.maintenance.enabled} onChange={(on) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, enabled: on } }))} />
          <Field label={t('set.messageTr')}>{(id) => <TextInput id={id} value={s.maintenance.messageTr} onChange={(e) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, messageTr: e.target.value } }))} />}</Field>
          <Field label={t('set.messageEn')}>{(id) => <TextInput id={id} value={s.maintenance.messageEn} onChange={(e) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, messageEn: e.target.value } }))} />}</Field>
        </div>
      </fieldset>
      <FormError message={error} />
    </Card>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Announcements({ items, canEdit, reload }: { items: Announcement[]; canEdit: boolean; reload: () => void }) {
  const { api } = useAuth();
  const { t, fmtDateTime, lang } = useI18n();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string | null; input: AnnouncementInput } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    setError(null);
    try {
      await api.saveAnnouncement(editing.id, editing.input);
      toast.notify(t('ann.saved'));
      setEditing(null);
      reload();
    } catch (e) {
      setError(errorMessage(t, e));
    }
  }
  const set = <K extends keyof AnnouncementInput>(k: K, v: AnnouncementInput[K]) => setEditing((x) => x && { ...x, input: { ...x.input, [k]: v } });

  return (
    <Card title={t('ann.title')} actions={canEdit && (
      <Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { titleTr: '', titleEn: '', bodyTr: '', bodyEn: '', startsAt: new Date().toISOString(), endsAt: null, isActive: true } })}>
        <Plus size={16} aria-hidden /> {t('ann.add')}
      </Button>)}>
      <DataList rows={items} rowKey={(a) => a.id} empty={t('ann.empty')}
        columns={[
          { header: t('ann.colTitle'), primary: true, cell: (a) => <div><p className="font-medium">{lang === 'tr' ? a.titleTr : a.titleEn}</p><p className="text-xs text-ink-3">{lang === 'tr' ? a.titleEn : a.titleTr}</p></div> },
          { header: t('ann.colPeriod'), cell: (a) => <span className="tabular text-xs">{fmtDateTime(a.startsAt)} → {a.endsAt ? fmtDateTime(a.endsAt) : t('common.unlimited')}</span> },
          { header: t('common.status'), cell: (a) => a.isActive ? <Badge tone="good">{t('common.active')}</Badge> : <Badge>{t('common.inactive')}</Badge> },
        ]}
        actions={canEdit ? (a) => <Button size="sm" onClick={() => setEditing({ id: a.id, input: (({ id: _id, ...rest }) => rest)(a) })}><Pencil size={14} aria-hidden /> {t('common.edit')}</Button> : undefined}
      />
      {editing && (
        <Modal open title={editing.id ? t('ann.editTitle') : t('ann.newTitle')} onClose={() => setEditing(null)}
          footer={<><Button onClick={() => setEditing(null)}>{t('common.cancel')}</Button><Button variant="primary" onClick={save}>{t('common.save')}</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t('ann.titleTr')}>{(id) => <TextInput id={id} value={editing.input.titleTr} onChange={(e) => set('titleTr', e.target.value)} />}</Field>
            <Field label={t('ann.titleEn')}>{(id) => <TextInput id={id} value={editing.input.titleEn} onChange={(e) => set('titleEn', e.target.value)} />}</Field>
            <Field label={t('ann.bodyTr')}>{(id) => <TextArea id={id} value={editing.input.bodyTr} onChange={(e) => set('bodyTr', e.target.value)} />}</Field>
            <Field label={t('ann.bodyEn')}>{(id) => <TextArea id={id} value={editing.input.bodyEn} onChange={(e) => set('bodyEn', e.target.value)} />}</Field>
            <Field label={t('ann.start')}>{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(editing.input.startsAt)} onChange={(e) => e.target.value && set('startsAt', new Date(e.target.value).toISOString())} />}</Field>
            <Field label={t('ann.end')}>{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(editing.input.endsAt)} onChange={(e) => set('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} />}</Field>
            <Checkbox label={t('common.active')} checked={editing.input.isActive} onChange={(c) => set('isActive', c)} />
          </div>
          <FormError message={error} />
        </Modal>
      )}
    </Card>
  );
}
