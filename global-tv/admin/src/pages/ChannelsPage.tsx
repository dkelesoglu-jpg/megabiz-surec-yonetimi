import { Pencil, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { RightsBadge } from '../components/RightsBadge';
import { Badge, Button, Card, Checkbox, DataList, Field, Modal, PageHeader, Select, Tabs, TextInput } from '../components/ui';
import { rightsHealth, todayIso, type RightsHealth } from '../lib/rights';
import type { BroadcastRight, Category, Channel, ChannelInput } from '../lib/types';

const EMPTY: ChannelInput = {
  slug: '', name: '', countryCode: 'TR', category: 'news', language: 'tr', logoUrl: null, attribution: null,
  isActive: false, sortOrder: 100, streamUrl: null,
};

/** Kanalın en iyi hak durumu (uygulamada görünürlük bununla belirlenir). */
export function bestHealth(rights: BroadcastRight[], channelId: string, today: string): RightsHealth | 'none' {
  const order: RightsHealth[] = ['valid', 'expiring', 'not_started', 'inactive', 'expired'];
  const hs = rights.filter((r) => r.channelId === channelId).map((r) => rightsHealth(r, today));
  if (hs.length === 0) return 'none';
  return order.find((h) => hs.includes(h)) ?? 'expired';
}

export function ChannelsPage() {
  const { api } = useAuth();
  const [tab, setTab] = useState<'channels' | 'categories'>('channels');
  const { data, error, reload } = useLoad(async () => {
    const [channels, categories, rights] = await Promise.all([api.listChannels(), api.listCategories(), api.listRights()]);
    return { channels, categories, rights };
  });

  return (
    <>
      <PageHeader title="Kanal yönetimi" description="Kanalları ve kategorileri yönetin. Bir kanal yalnızca aktifse ve geçerli yayın hakkı varsa uygulamada görünür." />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'channels', label: 'Kanallar' }, { value: 'categories', label: 'Kategoriler' }]} />
      {!data ? <LoadState error={error} /> : tab === 'channels'
        ? <ChannelsTab {...data} reload={reload} />
        : <CategoriesTab categories={data.categories} channels={data.channels} reload={reload} />}
    </>
  );
}

function ChannelsTab({ channels, categories, rights, reload }: { channels: Channel[]; categories: Category[]; rights: BroadcastRight[]; reload: () => void }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<{ id: string | null; input: ChannelInput } | null>(null);
  const today = todayIso();
  const catName = (k: string) => categories.find((c) => c.key === k)?.nameTr ?? k;

  const rows = useMemo(() => channels.filter((c) =>
    (!category || c.category === category) &&
    (!query || `${c.name} ${c.slug}`.toLowerCase().includes(query.toLowerCase()))), [channels, category, query]);

  return (
    <Card actions={<Button variant="primary" size="sm" onClick={() => setEditing({ id: null, input: { ...EMPTY, category: categories[0]?.key ?? 'other' } })}><Plus size={16} aria-hidden /> Kanal ekle</Button>}
      title={`${channels.length} kanal`}>
      <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
        <TextInput aria-label="Kanal ara" placeholder="Ad veya kısa ad ile ara" value={query} onChange={(e) => setQuery(e.target.value)} />
        <Select aria-label="Kategori filtresi" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Tüm kategoriler</option>
          {categories.map((c) => <option key={c.key} value={c.key}>{c.nameTr}</option>)}
        </Select>
      </div>
      <DataList
        rows={rows}
        rowKey={(c) => c.id}
        empty="Filtreye uyan kanal yok."
        columns={[
          { header: 'Kanal', primary: true, cell: (c) => <div><p className="font-medium">{c.name}</p><p className="text-xs text-ink-3">{c.slug}</p></div> },
          { header: 'Ülke', cell: (c) => c.countryCode },
          { header: 'Kategori', cell: (c) => catName(c.category) },
          { header: 'Yayın hakkı', cell: (c) => <RightsBadge health={bestHealth(rights, c.id, today)} /> },
          { header: 'Durum', cell: (c) => c.isActive ? <Badge tone="accent">Aktif</Badge> : <Badge>Pasif</Badge> },
        ]}
        actions={(c) => (
          <Button size="sm" aria-label={`${c.name} düzenle`} onClick={() => setEditing({ id: c.id, input: (({ id: _id, ...rest }) => rest)(c) })}>
            <Pencil size={14} aria-hidden /> Düzenle
          </Button>
        )}
      />
      {editing && <ChannelForm initial={editing} categories={categories} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </Card>
  );
}

function ChannelForm({ initial, categories, onClose, onSaved }: { initial: { id: string | null; input: ChannelInput }; categories: Category[]; onClose: () => void; onSaved: () => void }) {
  const { api } = useAuth();
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
      toast.notify(initial.id ? 'Kanal güncellendi.' : 'Kanal eklendi.');
      onSaved();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open title={initial.id ? 'Kanalı düzenle' : 'Yeni kanal'} onClose={onClose}
      footer={<><Button onClick={onClose}>Vazgeç</Button><Button variant="primary" onClick={save} disabled={busy}>Kaydet</Button></>}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kanal adı">{(id) => <TextInput id={id} value={v.name} onChange={(e) => set('name', e.target.value)} />}</Field>
        <Field label="Kısa ad" hint="Küçük harf, rakam, tire">{(id) => <TextInput id={id} value={v.slug} onChange={(e) => set('slug', e.target.value.toLowerCase())} />}</Field>
        <Field label="Ülke kodu">{(id) => <TextInput id={id} maxLength={2} value={v.countryCode} onChange={(e) => set('countryCode', e.target.value.toUpperCase())} />}</Field>
        <Field label="Dil kodu">{(id) => <TextInput id={id} maxLength={2} value={v.language} onChange={(e) => set('language', e.target.value.toLowerCase())} />}</Field>
        <Field label="Kategori">{(id) => (
          <Select id={id} value={v.category} onChange={(e) => set('category', e.target.value)}>
            {categories.filter((c) => c.isActive || c.key === v.category).map((c) => <option key={c.key} value={c.key}>{c.nameTr}</option>)}
          </Select>)}
        </Field>
        <Field label="Sıra">{(id) => <TextInput id={id} type="number" value={v.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />}</Field>
        <div className="sm:col-span-2">
          <Field label="HLS yayın adresi" hint="Yalnızca yayın hakkı doğrulanmış, https:// ile başlayan kaynak. Kullanıcılara doğrudan gösterilmez.">
            {(id) => <TextInput id={id} value={v.streamUrl ?? ''} placeholder="https://…/master.m3u8" onChange={(e) => set('streamUrl', e.target.value || null)} />}
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Lisans atıf metni">{(id) => <TextInput id={id} value={v.attribution ?? ''} onChange={(e) => set('attribution', e.target.value || null)} />}</Field>
        </div>
        <div className="sm:col-span-2">
          <Checkbox label="Aktif (geçerli yayın hakkı da gerekir)" checked={v.isActive} onChange={(c) => set('isActive', c)} />
        </div>
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
    </Modal>
  );
}

function CategoriesTab({ categories, channels, reload }: { categories: Category[]; channels: Channel[]; reload: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<{ isNew: boolean; value: Category } | null>(null);
  const count = (k: string) => channels.filter((c) => c.category === k).length;

  async function save() {
    if (!editing) return;
    try {
      await api.saveCategory(editing.value);
      toast.notify('Kategori kaydedildi.');
      setEditing(null);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  const set = <K extends keyof Category>(k: K, val: Category[K]) => setEditing((s) => s && { ...s, value: { ...s.value, [k]: val } });

  return (
    <Card title={`${categories.length} kategori`} actions={<Button variant="primary" size="sm" onClick={() => setEditing({ isNew: true, value: { key: '', nameTr: '', nameEn: '', sortOrder: 100, isActive: true } })}><Plus size={16} aria-hidden /> Kategori ekle</Button>}>
      <DataList rows={categories} rowKey={(c) => c.key} empty="Kategori yok."
        columns={[
          { header: 'Kategori', primary: true, cell: (c) => <span className="font-medium">{c.nameTr} <span className="font-normal text-ink-3">/ {c.nameEn}</span></span> },
          { header: 'Anahtar', cell: (c) => <code className="text-xs">{c.key}</code> },
          { header: 'Kanal sayısı', cell: (c) => <span className="tabular">{count(c.key)}</span> },
          { header: 'Durum', cell: (c) => c.isActive ? <Badge tone="accent">Aktif</Badge> : <Badge>Pasif</Badge> },
        ]}
        actions={(c) => <Button size="sm" onClick={() => setEditing({ isNew: false, value: { ...c } })}><Pencil size={14} aria-hidden /> Düzenle</Button>}
      />
      {editing && (
        <Modal open title={editing.isNew ? 'Yeni kategori' : 'Kategoriyi düzenle'} onClose={() => setEditing(null)}
          footer={<><Button onClick={() => setEditing(null)}>Vazgeç</Button><Button variant="primary" onClick={save}>Kaydet</Button></>}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Anahtar" hint="Uygulamada kullanılan kod; sonradan değiştirilemez">
              {(id) => <TextInput id={id} value={editing.value.key} disabled={!editing.isNew} onChange={(e) => set('key', e.target.value.toLowerCase())} />}
            </Field>
            <Field label="Sıra">{(id) => <TextInput id={id} type="number" value={editing.value.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />}</Field>
            <Field label="Türkçe ad">{(id) => <TextInput id={id} value={editing.value.nameTr} onChange={(e) => set('nameTr', e.target.value)} />}</Field>
            <Field label="İngilizce ad">{(id) => <TextInput id={id} value={editing.value.nameEn} onChange={(e) => set('nameEn', e.target.value)} />}</Field>
            <Checkbox label="Aktif" checked={editing.value.isActive} onChange={(c) => set('isActive', c)} />
          </div>
        </Modal>
      )}
    </Card>
  );
}
