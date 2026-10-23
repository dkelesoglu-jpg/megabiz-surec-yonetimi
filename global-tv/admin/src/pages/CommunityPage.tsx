import { Ban, Eye, EyeOff, Flag, Lock, LockOpen, MicOff, Timer, Trash2, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad, useToast } from '../components/feedback';
import { ModerateDialog } from '../components/ModerateDialog';
import { Badge, Button, Card, Checkbox, DataList, EmptyState, Modal, PageHeader, Select, Tabs, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { ChatMessage, ChatRoom, ModerationAction, Report, ReportStatus } from '../lib/types';

type Tab = 'rooms' | 'messages' | 'reports';
const SLOW_OPTIONS = [0, 5, 10, 30, 60, 120, 300];

export function CommunityPage() {
  const { api, can } = useAuth();
  const { t } = useI18n();
  const canMessages = can('chat.moderate');
  const canReports = can('reports.manage');
  const [tab, setTab] = useState<Tab>('rooms');
  const { data, error, reload } = useLoad(async () => {
    const [rooms, messages, reports] = await Promise.all([
      api.listRooms(),
      canMessages ? api.listMessages() : Promise.resolve([] as ChatMessage[]),
      canReports ? api.listReports() : Promise.resolve([] as Report[]),
    ]);
    return { rooms, messages, reports };
  });
  const roomName = (id: string) => data?.rooms.find((r) => r.channelId === id)?.channelName ?? id;
  const openReports = data?.reports.filter((r) => r.status === 'open').length ?? 0;

  return (
    <>
      <PageHeader title={t('com.title')} description={t('com.subtitle')} />
      <Tabs value={tab} onChange={setTab} items={[
        { value: 'rooms', label: t('com.tabRooms') },
        ...(canMessages ? [{ value: 'messages' as const, label: t('com.tabMessages') }] : []),
        ...(canReports ? [{ value: 'reports' as const, label: t('com.reportsOpen', { n: openReports }) }] : []),
      ]} />
      {!data ? <LoadState error={error} /> : (
        <>
          {tab === 'rooms' && <RoomsTab rooms={data.rooms} reload={reload} />}
          {tab === 'messages' && <MessagesTab messages={data.messages} roomName={roomName} reload={reload} />}
          {tab === 'reports' && <ReportsTab reports={data.reports} messages={data.messages} roomName={roomName} reload={reload} />}
        </>
      )}
    </>
  );
}

function RoomsTab({ rooms, reload }: { rooms: ChatRoom[]; reload: () => void }) {
  const { api } = useAuth();
  const { t } = useI18n();
  const toast = useToast();

  async function update(room: ChatRoom, patch: Partial<Pick<ChatRoom, 'isLocked' | 'slowModeSeconds'>>) {
    try {
      await api.updateRoom(room.channelId, { isLocked: room.isLocked, slowModeSeconds: room.slowModeSeconds, ...patch });
      toast.notify(t('com.roomSaved'));
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <Card>
      <DataList rows={rooms} rowKey={(r) => r.channelId} empty={t('common.empty')}
        columns={[
          { header: t('com.colRoom'), primary: true, cell: (r) => <span className="font-medium">{r.channelName}</span> },
          { header: t('com.colMessages24'), cell: (r) => <span className="tabular">{r.messages24h}</span> },
          { header: t('com.colParticipants'), cell: (r) => <span className="tabular">{r.participants24h}</span> },
          { header: t('com.colOpenReports'), cell: (r) => r.openReports > 0 ? <Badge tone="critical" icon={<Flag size={12} aria-hidden />}>{r.openReports}</Badge> : <span className="tabular text-ink-3">0</span> },
          { header: t('com.colRoomState'), cell: (r) => (
            <div className="flex flex-wrap gap-1">
              {r.isLocked ? <Badge tone="warning" icon={<Lock size={12} aria-hidden />}>{t('com.locked')}</Badge> : <Badge tone="good">{t('com.open')}</Badge>}
              {r.slowModeSeconds > 0 && <Badge icon={<Timer size={12} aria-hidden />}>{t('com.slow', { n: r.slowModeSeconds })}</Badge>}
            </div>) },
        ]}
        actions={(r) => (
          <>
            <Button size="sm" onClick={() => update(r, { isLocked: !r.isLocked })}>
              {r.isLocked ? <><LockOpen size={14} aria-hidden /> {t('com.unlock')}</> : <><Lock size={14} aria-hidden /> {t('com.lock')}</>}
            </Button>
            <Select aria-label={`${t('com.slowMode')}: ${r.channelName}`} className="h-8 w-44 py-0 text-xs" value={r.slowModeSeconds}
              onChange={(e) => update(r, { slowModeSeconds: Number(e.target.value) })}>
              {SLOW_OPTIONS.map((s) => <option key={s} value={s}>{s === 0 ? `${t('com.slowMode')}: ${t('com.slowOff')}` : t('com.slowSeconds', { n: s })}</option>)}
            </Select>
          </>
        )}
      />
    </Card>
  );
}

function MessagesTab({ messages, roomName, reload }: { messages: ChatMessage[]; roomName: (id: string) => string; reload: () => void }) {
  const { api } = useAuth();
  const { t, fmtDateTime } = useI18n();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [onlyHidden, setOnlyHidden] = useState(false);
  const [deleting, setDeleting] = useState<ChatMessage | null>(null);
  const rows = useMemo(() => messages.filter((m) =>
    (!onlyHidden || m.isHidden) && (!query || `${m.body} ${m.authorName}`.toLowerCase().includes(query.toLowerCase()))), [messages, query, onlyHidden]);

  async function toggle(m: ChatMessage) {
    try {
      await api.setMessageHidden(m.id, !m.isHidden);
      toast.notify(m.isHidden ? t('com.shownToast') : t('com.hiddenToast'));
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  async function remove() {
    if (!deleting) return;
    try {
      await api.deleteMessage(deleting.id);
      toast.notify(t('com.deleted'));
      setDeleting(null);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <Card>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1"><TextInput aria-label={t('common.search')} placeholder={t('com.searchMessages')} value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <Checkbox label={t('com.onlyHidden')} checked={onlyHidden} onChange={setOnlyHidden} />
      </div>
      {rows.length === 0 ? <EmptyState>{t('com.noMessages')}</EmptyState> : (
        <ul className="divide-y divide-line">
          {rows.map((m) => (
            <li key={m.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-ink-3">{m.authorName} · {roomName(m.channelId)} · {fmtDateTime(m.createdAt)} {m.isHidden && <Badge tone="warning">{t('common.hidden')}</Badge>}</p>
                <p className={m.isHidden ? 'break-words text-sm text-ink-3 line-through' : 'break-words text-sm'}>{m.body}</p>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" onClick={() => toggle(m)}>{m.isHidden ? <><Eye size={14} aria-hidden /> {t('com.show')}</> : <><EyeOff size={14} aria-hidden /> {t('com.hide')}</>}</Button>
                <Button size="sm" variant="danger" aria-label={`${t('com.deleteMessage')}: ${m.body.slice(0, 30)}`} onClick={() => setDeleting(m)}>
                  <Trash2 size={14} aria-hidden /> {t('common.delete')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {deleting && (
        <Modal open title={t('com.deleteMessage')} onClose={() => setDeleting(null)}
          footer={<><Button onClick={() => setDeleting(null)}>{t('common.cancel')}</Button><Button variant="danger" onClick={remove}><Trash2 size={14} aria-hidden /> {t('common.delete')}</Button></>}>
          <blockquote className="mb-3 rounded-md bg-surface-2 px-3 py-2 text-sm"><p className="text-xs text-ink-3">{deleting.authorName}</p>{deleting.body}</blockquote>
          <p className="text-sm text-ink-2">{t('com.deleteConfirm')}</p>
        </Modal>
      )}
    </Card>
  );
}

function ReportsTab({ reports, messages, roomName, reload }: { reports: Report[]; messages: ChatMessage[]; roomName: (id: string) => string; reload: () => void }) {
  const { api, can } = useAuth();
  const { t, fmtDateTime } = useI18n();
  const toast = useToast();
  const [status, setStatus] = useState<ReportStatus | ''>('open');
  const [moderate, setModerate] = useState<{ profile: { id: string; username: string }; action: ModerationAction } | null>(null);
  const rows = reports.filter((r) => !status || r.status === status);

  async function resolve(r: Report, s: ReportStatus, hide: boolean) {
    try {
      await api.resolveReport(r.id, s, hide);
      toast.notify(hide ? t('rep.closedHidden') : s === 'dismissed' ? t('rep.dismissed') : t('rep.updated'));
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  return (
    <Card>
      <div className="mb-3 max-w-xs">
        <Select aria-label={t('common.status')} value={status} onChange={(e) => setStatus(e.target.value as ReportStatus | '')}>
          <option value="open">{t('rep.st.open')}</option>
          <option value="actioned">{t('rep.st.actioned')}</option>
          <option value="dismissed">{t('rep.st.dismissed')}</option>
          <option value="">{t('common.all')}</option>
        </Select>
      </div>
      {rows.length === 0 ? <EmptyState>{t('rep.none')}</EmptyState> : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => {
            const m = messages.find((x) => x.id === r.messageId);
            return (
              <li key={r.id} className="rounded-xl border border-line p-3">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
                  <Badge tone="critical" icon={<Flag size={12} aria-hidden />}>{t(`reason.${r.reason}`)}</Badge>
                  <Badge>{t(`rep.st.${r.status}`)}</Badge>
                  <span className="text-ink-3">{t('rep.reporter', { name: r.reporterName })} · {fmtDateTime(r.createdAt)}</span>
                </div>
                {m ? (
                  <blockquote className="rounded-md bg-surface-2 px-3 py-2 text-sm">
                    <p className="mb-1 text-xs text-ink-3">{m.authorName} · {roomName(m.channelId)} {m.isHidden && <Badge tone="warning">{t('common.hidden')}</Badge>}</p>
                    <p className="break-words">{m.body}</p>
                  </blockquote>
                ) : <p className="text-sm text-ink-3">{t('rep.messageUnavailable')}</p>}
                {r.details && <p className="mt-2 text-sm text-ink-2">{t('rep.note', { text: r.details })}</p>}
                {r.status === 'open' && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {can('chat.moderate') && m && !m.isHidden && <Button size="sm" variant="primary" onClick={() => resolve(r, 'actioned', true)}><EyeOff size={14} aria-hidden /> {t('rep.hideAndClose')}</Button>}
                    <Button size="sm" onClick={() => resolve(r, 'actioned', false)}>{t('rep.actioned')}</Button>
                    <Button size="sm" onClick={() => resolve(r, 'dismissed', false)}><XCircle size={14} aria-hidden /> {t('rep.dismiss')}</Button>
                    {can('users.moderate') && m?.userId && (
                      <>
                        <Button size="sm" onClick={() => setModerate({ profile: { id: m.userId!, username: m.authorName }, action: 'mute' })}><MicOff size={14} aria-hidden /> {t('rep.muteAuthor')}</Button>
                        <Button size="sm" variant="danger" onClick={() => setModerate({ profile: { id: m.userId!, username: m.authorName }, action: 'ban' })}><Ban size={14} aria-hidden /> {t('rep.banAuthor')}</Button>
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
