import { Pencil, Plus, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import type { AnnouncementInput, AppSettings } from '../lib/types';

/** Mobil uygulamada çevirisi bulunan diller. Yeni dil, çeviri dosyası eklendikten sonra açılabilir. */
const AVAILABLE_LANGUAGES = [
  { code: 'tr', label: 'Türkçe', ready: true },
  { code: 'en', label: 'English', ready: true },
  { code: 'de', label: 'Deutsch', ready: false },
  { code: 'ar', label: 'العربية', ready: false },
];

export function SettingsPage() {
  const { api, can } = useAuth();
  const { data, error, reload } = useLoad(async () => {
    const [settings, announcements] = await Promise.all([api.getSettings(), api.listAnnouncements()]);
    return { settings, announcements };
  });

  return (
    <>
      <PageHeader title="Sistem ayarları" description="Uygulama dilleri, sürüm gereksinimleri, bakım modu ve duyurular." />
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
  const toast = useToast();
  const [s, setS] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => setS(initial), [initial]);

  async function save() {
    setError(null);
    try {
      await api.saveSettings(s);
      toast.notify('Ayarlar kaydedildi.');
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  const toggleLang = (code: string, on: boolean) => setS((x) => ({
    ...x,
    languages: { ...x.languages, supported: on ? [...x.languages.supported, code] : x.languages.supported.filter((c) => c !== code) },
  }));
  const setVersion = (platform: 'android' | 'ios', field: 'latest' | 'minSupported', value: string) =>
    setS((x) => ({ ...x, appVersion: { ...x.appVersion, [platform]: { ...x.appVersion[platform], [field]: value } } }));

  return (
    <Card title="Uygulama ayarları" actions={readOnly
      ? <Badge>Yalnızca görüntüleme</Badge>
      : <Button variant="primary" size="sm" onClick={save}><Save size={16} aria-hidden /> Kaydet</Button>}>
      <fieldset disabled={readOnly} className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Diller</h3>
          {AVAILABLE_LANGUAGES.map((l) => (
            <Checkbox key={l.code} label={`${l.label}${l.ready ? '' : ' (çeviri yok)'}`} disabled={readOnly || !l.ready}
              checked={s.languages.supported.includes(l.code)} onChange={(on) => toggleLang(l.code, on)} />
          ))}
          <Field label="Varsayılan dil">{(id) => (
            <Select id={id} value={s.languages.default} onChange={(e) => setS((x) => ({ ...x, languages: { ...x.languages, default: e.target.value } }))}>
              {s.languages.supported.map((c) => <option key={c} value={c}>{AVAILABLE_LANGUAGES.find((l) => l.code === c)?.label ?? c}</option>)}
            </Select>)}
          </Field>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Uygulama sürümü</h3>
          {(['android', 'ios'] as const).map((p) => (
            <div key={p} className="grid grid-cols-2 gap-2">
              <Field label={`${p === 'ios' ? 'iOS' : 'Android'} en son`}>{(id) => <TextInput id={id} value={s.appVersion[p].latest} onChange={(e) => setVersion(p, 'latest', e.target.value)} />}</Field>
              <Field label="En düşük">{(id) => <TextInput id={id} value={s.appVersion[p].minSupported} onChange={(e) => setVersion(p, 'minSupported', e.target.value)} />}</Field>
            </div>
          ))}
          <p className="text-xs text-ink-3">“En düşük” altındaki sürümler güncellemeye yönlendirilir.</p>
        </div>
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-semibold">Bakım modu</h3>
          <Checkbox label="Bakım modu açık" checked={s.maintenance.enabled} onChange={(on) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, enabled: on } }))} />
          <Field label="Mesaj (TR)">{(id) => <TextInput id={id} value={s.maintenance.messageTr} onChange={(e) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, messageTr: e.target.value } }))} />}</Field>
          <Field label="Mesaj (EN)">{(id) => <TextInput id={id} value={s.maintenance.messageEn} onChange={(e) => setS((x) => ({ ...x, maintenance: { ...x.maintenance, messageEn: e.target.value } }))} />}</Field>
        </div>
      </fieldset>
      {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
    </Card>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

function Announcements({ items, canEdit, reload }: { items: (AnnouncementInput & { id: string })[]; canEdit: boolean; reload: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<{ id: string | null; input: AnnouncementInput } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!editing) return;
    setError(null);
    try {
      await api.saveAnnouncement(editing.id, editing.input);
      toast.notify('Duyuru kaydedildi.');
      setEditing(null);
      reload();
    } catch (e) {
      setError(errorMessage(e));
    }
  }
  const set = <K extends keyof AnnouncementInput>(k: K, v: AnnouncementInput[K]) => setEditing((x) => x && { ...x, input: { ...x.input, [k]: v } });

  return (
    <Card title="Duyurular" actions={canEdit && (
      <Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { titleTr: '', titleEn: '', bodyTr: '', bodyEn: '', startsAt: new Date().toISOString(), endsAt: null, isActive: true } })}>
        <Plus size={16} aria-hidden /> Duyuru ekle
      </Button>)}>
      <DataList rows={items} rowKey={(a) => a.id} empty="Henüz duyuru yok."
        columns={[
          { header: 'Başlık', primary: true, cell: (a) => <div><p className="font-medium">{a.titleTr}</p><p className="text-xs text-ink-3">{a.titleEn}</p></div> },
          { header: 'Yayın', cell: (a) => <span className="tabular text-xs">{a.startsAt.slice(0, 16).replace('T', ' ')} → {a.endsAt ? a.endsAt.slice(0, 16).replace('T', ' ') : 'süresiz'}</span> },
          { header: 'Durum', cell: (a) => a.isActive ? <Badge tone="good">Aktif</Badge> : <Badge>Pasif</Badge> },
        ]}
        actions={canEdit ? (a) => <Button size="sm" onClick={() => setEditing({ id: a.id, input: (({ id: _id, ...rest }) => rest)(a) })}><Pencil size={14} aria-hidden /> Düzenle</Button> : undefined}
      />
      {editing && (
        <Modal open title={editing.id ? 'Duyuruyu düzenle' : 'Yeni duyuru'} onClose={() => setEditing(null)}
          footer={<><Button onClick={() => setEditing(null)}>Vazgeç</Button><Button variant="primary" onClick={save}>Kaydet</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Başlık (TR)">{(id) => <TextInput id={id} value={editing.input.titleTr} onChange={(e) => set('titleTr', e.target.value)} />}</Field>
            <Field label="Başlık (EN)">{(id) => <TextInput id={id} value={editing.input.titleEn} onChange={(e) => set('titleEn', e.target.value)} />}</Field>
            <Field label="Metin (TR)">{(id) => <TextArea id={id} value={editing.input.bodyTr} onChange={(e) => set('bodyTr', e.target.value)} />}</Field>
            <Field label="Metin (EN)">{(id) => <TextArea id={id} value={editing.input.bodyEn} onChange={(e) => set('bodyEn', e.target.value)} />}</Field>
            <Field label="Başlangıç">{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(editing.input.startsAt)} onChange={(e) => set('startsAt', new Date(e.target.value).toISOString())} />}</Field>
            <Field label="Bitiş (isteğe bağlı)">{(id) => <TextInput id={id} type="datetime-local" value={toLocalInput(editing.input.endsAt)} onChange={(e) => set('endsAt', e.target.value ? new Date(e.target.value).toISOString() : null)} />}</Field>
            <Checkbox label="Aktif" checked={editing.input.isActive} onChange={(c) => set('isActive', c)} />
          </div>
          {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
        </Modal>
      )}
    </Card>
  );
}
