import { Info, Pencil, Plus } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, TextArea, TextInput } from '../components/ui';
import type { AdPlacement, AdPlacementInput } from '../lib/types';

const FORMATS: Record<AdPlacement['format'], string> = { banner: 'Banner', interstitial: 'Geçiş reklamı', native: 'Yerel (native)', preroll: 'Video öncesi (pre-roll)' };
const PLATFORMS: Record<AdPlacement['platform'], string> = { all: 'Android + iOS', android: 'Android', ios: 'iOS' };

export function AdsPage() {
  const { api } = useAuth();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => api.listAdPlacements());
  const [editing, setEditing] = useState<{ id: string | null; input: AdPlacementInput } | null>(null);

  async function toggle(ad: AdPlacement) {
    try {
      await api.saveAdPlacement(ad.id, { ...(({ id: _id, ...rest }) => rest)(ad), isEnabled: !ad.isEnabled });
      toast.notify(`${ad.name} ${ad.isEnabled ? 'kapatıldı' : 'açıldı'}.`);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <>
      <PageHeader title="Reklam alanları" description="Gelecekteki gelir modeli için reklam yerleşimleri. Uygulama yalnızca açık alanları okur." />
      <p className="mb-4 flex items-start gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink-2">
        <Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
        Beta süresince yalnızca <strong>test reklam kimlikleri</strong> kullanılır. Gerçek reklam hesabı (AdMob) açılması ürün sahibinin onayına bağlıdır.
      </p>
      {!data ? <LoadState error={error} /> : (
        <Card title={`${data.length} reklam alanı`} actions={
          <Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { key: '', name: '', platform: 'all', format: 'banner', provider: 'admob', unitId: null, isTest: true, isEnabled: false, frequencyCap: null, notes: null } })}>
            <Plus size={16} aria-hidden /> Alan ekle
          </Button>}>
          <DataList rows={data} rowKey={(a) => a.id} empty="Reklam alanı yok."
            columns={[
              { header: 'Alan', primary: true, cell: (a) => <div><p className="font-medium">{a.name}</p><code className="text-xs text-ink-3">{a.key}</code></div> },
              { header: 'Biçim', cell: (a) => FORMATS[a.format] },
              { header: 'Platform', cell: (a) => PLATFORMS[a.platform] },
              { header: 'Sınır', cell: (a) => a.frequencyCap ? `Oturumda ${a.frequencyCap}` : '—' },
              { header: 'Durum', cell: (a) => <div className="flex flex-wrap gap-1">{a.isEnabled ? <Badge tone="good">Açık</Badge> : <Badge>Kapalı</Badge>}{a.isTest && <Badge tone="warning">Test</Badge>}</div> },
            ]}
            actions={(a) => (
              <>
                <Button size="sm" onClick={() => toggle(a)}>{a.isEnabled ? 'Kapat' : 'Aç'}</Button>
                <Button size="sm" onClick={() => setEditing({ id: a.id, input: (({ id: _id, ...rest }) => rest)(a) })}><Pencil size={14} aria-hidden /> Düzenle</Button>
              </>
            )}
          />
        </Card>
      )}
      {editing && <AdForm initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </>
  );
}

function AdForm({ initial, onClose, onSaved }: { initial: { id: string | null; input: AdPlacementInput }; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [v, setV] = useState(initial.input);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof AdPlacementInput>(k: K, val: AdPlacementInput[K]) => setV((s) => ({ ...s, [k]: val }));

  async function save() {
    try {
      await api.saveAdPlacement(initial.id, v);
      toast.notify('Reklam alanı kaydedildi.');
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Modal open title={initial.id ? 'Reklam alanını düzenle' : 'Yeni reklam alanı'} onClose={onClose}
      footer={<><Button onClick={onClose}>Vazgeç</Button><Button variant="primary" onClick={save}>Kaydet</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Ad">{(id) => <TextInput id={id} value={v.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label="Anahtar" hint="Uygulamadaki yerleşim kodu">{(id) => <TextInput id={id} value={v.key} onChange={(e) => set('key', e.target.value.toLowerCase())} />}</Field>
        <Field label="Biçim">{(id) => (
          <Select id={id} value={v.format} onChange={(e) => set('format', e.target.value as AdPlacement['format'])}>
            {Object.entries(FORMATS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>)}
        </Field>
        <Field label="Platform">{(id) => (
          <Select id={id} value={v.platform} onChange={(e) => set('platform', e.target.value as AdPlacement['platform'])}>
            {Object.entries(PLATFORMS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </Select>)}
        </Field>
        <Field label="Reklam birimi kimliği" hint="Boşsa uygulama test kimliğini kullanır">
          {(id) => <TextInput id={id} value={v.unitId ?? ''} onChange={(e) => set('unitId', e.target.value || null)} />}
        </Field>
        <Field label="Oturum başına sınır">{(id) => (
          <TextInput id={id} type="number" min={1} max={100} value={v.frequencyCap ?? ''} onChange={(e) => set('frequencyCap', e.target.value ? Number(e.target.value) : null)} />)}
        </Field>
        <div className="sm:col-span-2"><Field label="Notlar">{(id) => <TextArea id={id} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value || null)} />}</Field></div>
        <Checkbox label="Test reklamı" checked={v.isTest} onChange={(c) => set('isTest', c)} />
        <Checkbox label="Açık" checked={v.isEnabled} onChange={(c) => set('isEnabled', c)} />
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
    </Modal>
  );
}
