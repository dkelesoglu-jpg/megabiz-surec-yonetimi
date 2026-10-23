import { Ban, Eye, EyeOff, Flag, MicOff, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, EmptyState, PageHeader, Select, Tabs, TextInput } from '../components/ui';
import type { ChatMessage, ModerationAction, Report, ReportReason, ReportStatus } from '../lib/types';
import { ModerateDialog } from './UsersPage';

const REASONS: Record<ReportReason, string> = { spam: 'Spam', abuse: 'Taciz / hakaret', hate: 'Nefret söylemi', sexual: 'Cinsel içerik', other: 'Diğer' };
const STATUS: Record<ReportStatus, string> = { open: 'Açık', actioned: 'İşlem yapıldı', dismissed: 'Reddedildi' };

export function ModerationPage() {
  const { api, can } = useAuth();
  const [tab, setTab] = useState<'reports' | 'messages'>('reports');
  const canMessages = can('chat.moderate');
  const { data, error, reload } = useLoad(async () => {
    const [reports, messages, channels] = await Promise.all([
      api.listReports(),
      canMessages ? api.listMessages() : Promise.resolve([] as ChatMessage[]),
      can('channels.manage') ? api.listChannels() : Promise.resolve([]),
    ]);
    return { reports, messages, channels };
  });
  const channelName = (id: string) => data?.channels.find((c) => c.id === id)?.name ?? 'Kanal';

  return (
    <>
      <PageHeader title="Sohbet moderasyonu" description="Şikâyetleri inceleyin, mesajları gizleyin, kuralları ihlal eden kullanıcıları susturun veya yasaklayın." />
      <Tabs value={tab} onChange={setTab} items={[
        { value: 'reports', label: `Şikâyetler${data ? ` (${data.reports.filter((r) => r.status === 'open').length} açık)` : ''}` },
        ...(canMessages ? [{ value: 'messages' as const, label: 'Mesaj inceleme' }] : []),
      ]} />
      {!data ? <LoadState error={error} /> : tab === 'reports'
        ? <ReportsTab reports={data.reports} messages={data.messages} channelName={channelName} reload={reload} />
        : <MessagesTab messages={data.messages} channelName={channelName} reload={reload} />}
    </>
  );
}

function ReportsTab({ reports, messages, channelName, reload }: { reports: Report[]; messages: ChatMessage[]; channelName: (id: string) => string; reload: () => void }) {
  const { api, can } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState<ReportStatus | ''>('open');
  const [moderate, setModerate] = useState<{ profile: { id: string; username: string }; action: ModerationAction } | null>(null);
  const rows = reports.filter((r) => !status || r.status === status);

  async function resolve(r: Report, s: ReportStatus, hide: boolean) {
    try {
      await api.resolveReport(r.id, s, hide);
      toast.notify(hide ? 'Mesaj gizlendi, şikâyet kapatıldı.' : s === 'dismissed' ? 'Şikâyet reddedildi.' : 'Şikâyet güncellendi.');
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <Card>
      <div className="mb-3 max-w-xs">
        <Select aria-label="Şikâyet durumu" value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | '')}>
          <option value="open">Açık</option>
          <option value="actioned">İşlem yapıldı</option>
          <option value="dismissed">Reddedildi</option>
          <option value="">Tümü</option>
        </Select>
      </div>
      {rows.length === 0 ? <EmptyState>Bu durumda şikâyet yok.</EmptyState> : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const m = messages.find((x) => x.id === r.messageId);
            return (
              <li key={r.id} className="rounded-lg border border-line p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone="critical" icon={<Flag size={12} aria-hidden />}>{REASONS[r.reason]}</Badge>
                  <Badge>{STATUS[r.status]}</Badge>
                  <span className="text-ink-3">Şikâyet eden: {r.reporterName} · {new Date(r.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</span>
                </div>
                {m ? (
                  <blockquote className="rounded-md bg-surface-2 px-3 py-2 text-sm">
                    <p className="mb-1 text-xs text-ink-3">{m.authorName} · {channelName(m.channelId)} {m.isHidden && <Badge tone="warning">Gizli</Badge>}</p>
                    <p className="break-words">{m.body}</p>
                  </blockquote>
                ) : <p className="text-sm text-ink-3">Mesaj içeriği görüntülenemiyor.</p>}
                {r.details && <p className="mt-2 text-sm text-ink-2">Not: {r.details}</p>}
                {r.status === 'open' && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {can('chat.moderate') && m && !m.isHidden && <Button size="sm" variant="primary" onClick={() => resolve(r, 'actioned', true)}><EyeOff size={14} aria-hidden /> Mesajı gizle ve kapat</Button>}
                    <Button size="sm" onClick={() => resolve(r, 'actioned', false)}>İşlem yapıldı</Button>
                    <Button size="sm" onClick={() => resolve(r, 'dismissed', false)}><XCircle size={14} aria-hidden /> Reddet</Button>
                    {can('users.moderate') && m?.userId && (
                      <>
                        <Button size="sm" onClick={() => setModerate({ profile: { id: m.userId!, username: m.authorName }, action: 'mute' })}><MicOff size={14} aria-hidden /> Yazarı sustur</Button>
                        <Button size="sm" variant="danger" onClick={() => setModerate({ profile: { id: m.userId!, username: m.authorName }, action: 'ban' })}><Ban size={14} aria-hidden /> Yazarı yasakla</Button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {moderate && <ModerateDialog {...moderate} onClose={() => setModerate(null)} onDone={() => { setModerate(null); reload(); }} />}
    </Card>
  );
}

function MessagesTab({ messages, channelName, reload }: { messages: ChatMessage[]; channelName: (id: string) => string; reload: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [onlyHidden, setOnlyHidden] = useState(false);
  const rows = useMemo(() => messages.filter((m) =>
    (!onlyHidden || m.isHidden) && (!query || `${m.body} ${m.authorName}`.toLowerCase().includes(query.toLowerCase()))), [messages, query, onlyHidden]);

  async function toggle(m: ChatMessage) {
    try {
      await api.setMessageHidden(m.id, !m.isHidden);
      toast.notify(m.isHidden ? 'Mesaj yeniden gösteriliyor.' : 'Mesaj gizlendi.');
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><TextInput aria-label="Mesaj ara" placeholder="Mesaj veya kullanıcı ara" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={onlyHidden} onChange={(e) => setOnlyHidden(e.target.checked)} /> Yalnızca gizlenenler</label>
      </div>
      {rows.length === 0 ? <EmptyState>Mesaj yok.</EmptyState> : (
        <ul className="divide-y divide-line">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-3">{m.authorName} · {channelName(m.channelId)} · {new Date(m.createdAt).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}</p>
                <p className={m.isHidden ? 'break-words text-sm text-ink-3 line-through' : 'break-words text-sm'}>{m.body}</p>
              </div>
              <Button size="sm" onClick={() => toggle(m)}>{m.isHidden ? <><Eye size={14} aria-hidden /> Göster</> : <><EyeOff size={14} aria-hidden /> Gizle</>}</Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
