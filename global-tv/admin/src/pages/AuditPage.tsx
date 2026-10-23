import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad } from '../components/feedback';
import { Badge, Card, DataList, PageHeader, Select, TextInput } from '../components/ui';
import type { AuditEntry } from '../lib/types';

const ENTITY_LABELS: Record<string, string> = {
  channels: 'Kanal', channel_categories: 'Kategori', broadcast_rights: 'Yayın hakkı', channel_streams: 'Yayın adresi',
  profiles: 'Kullanıcı', moderation_actions: 'Moderasyon', reports: 'Şikâyet', chat_messages: 'Mesaj',
  ad_placements: 'Reklam alanı', app_settings: 'Ayar', announcements: 'Duyuru',
};
const ACTION_LABELS: Record<AuditEntry['action'], string> = { insert: 'Ekleme', update: 'Güncelleme', delete: 'Silme' };

export function AuditPage() {
  const { api } = useAuth();
  const { data, error } = useLoad(() => api.listAudit());
  const [entity, setEntity] = useState('');
  const [query, setQuery] = useState('');
  const entities = useMemo(() => [...new Set((data ?? []).map((a) => a.entity))].sort(), [data]);
  const rows = (data ?? []).filter((a) => (!entity || a.entity === entity) &&
    (!query || `${a.summary} ${a.actorName ?? ''}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <>
      <PageHeader title="Denetim kaydı" description="Yönetici işlemleri sunucuda otomatik kaydedilir; kayıtlar panelden değiştirilemez veya silinemez." />
      {!data ? <LoadState error={error} /> : (
        <Card title={`${data.length} kayıt`}>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
            <TextInput aria-label="Kayıtlarda ara" placeholder="İşlem veya kişi ara" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select aria-label="Kayıt türü" value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">Tüm kayıt türleri</option>
              {entities.map((e) => <option key={e} value={e}>{ENTITY_LABELS[e] ?? e}</option>)}
            </Select>
          </div>
          <DataList rows={rows} rowKey={(a) => a.id} empty="Henüz kayıt yok. Panelde yapılan her değişiklik burada görünür."
            columns={[
              { header: 'İşlem', primary: true, cell: (a) => <span className="break-words">{a.summary}</span> },
              { header: 'Tür', cell: (a) => <div className="flex flex-wrap gap-1"><Badge>{ENTITY_LABELS[a.entity] ?? a.entity}</Badge><Badge tone="accent">{ACTION_LABELS[a.action]}</Badge></div> },
              { header: 'Kişi', cell: (a) => a.actorName ?? 'Sistem' },
              { header: 'Zaman', cell: (a) => <span className="tabular whitespace-nowrap text-xs">{new Date(a.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'medium' })}</span> },
            ]}
          />
        </Card>
      )}
    </>
  );
}
