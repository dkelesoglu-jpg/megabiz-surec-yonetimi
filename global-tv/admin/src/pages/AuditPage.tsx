import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad } from '../components/feedback';
import { Badge, Card, DataList, PageHeader, Select, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { MessageKey } from '../i18n/tr';

export function AuditPage() {
  const { api } = useAuth();
  const { t, fmtDateTime } = useI18n();
  const { data, error } = useLoad(() => api.listAudit());
  const [entity, setEntity] = useState('');
  const [query, setQuery] = useState('');
  const entityLabel = (e: string) => t(`ent.${e}` as MessageKey);
  const entities = useMemo(() => [...new Set((data ?? []).map((a) => a.entity))].sort(), [data]);
  const rows = (data ?? []).filter((a) => (!entity || a.entity === entity) &&
    (!query || `${a.label} ${a.detail ?? ''} ${a.actorName ?? ''}`.toLowerCase().includes(query.toLowerCase())));

  return (
    <>
      <PageHeader title={t('aud.title')} description={t('aud.subtitle')} />
      {!data ? <LoadState error={error} /> : (
        <Card title={t('aud.count', { n: data.length })}>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_200px]">
            <TextInput aria-label={t('common.search')} placeholder={t('aud.search')} value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select aria-label={t('aud.colType')} value={entity} onChange={(e) => setEntity(e.target.value)}>
              <option value="">{t('aud.allTypes')}</option>
              {entities.map((e) => <option key={e} value={e}>{entityLabel(e)}</option>)}
            </Select>
          </div>
          <DataList rows={rows} rowKey={(a) => a.id} empty={t('aud.empty')}
            columns={[
              { header: t('aud.colAction'), primary: true, cell: (a) => (
                <div className="min-w-0">
                  <p className="break-words font-medium">{a.label}</p>
                  {a.detail && <p className="break-words text-xs text-ink-3">{a.detail}</p>}
                </div>) },
              { header: t('aud.colType'), cell: (a) => <div className="flex flex-wrap gap-1"><Badge>{entityLabel(a.entity)}</Badge><Badge tone="accent">{t(`aud.a.${a.action}`)}</Badge></div> },
              { header: t('aud.colActor'), cell: (a) => a.actorName ?? t('aud.system') },
              { header: t('common.time'), cell: (a) => <span className="tabular whitespace-nowrap text-xs">{fmtDateTime(a.createdAt)}</span> },
            ]}
          />
        </Card>
      )}
    </>
  );
}
