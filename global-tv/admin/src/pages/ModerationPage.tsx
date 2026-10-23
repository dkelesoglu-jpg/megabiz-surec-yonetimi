import { Ban, MicOff, ShieldCheck, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad, useToast } from '../components/feedback';
import { ModerateDialog } from '../components/ModerateDialog';
import { Badge, Button, Card, DataList, Modal, PageHeader, Select, Tabs, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import { ROLES } from '../lib/permissions';
import type { ModerationAction, Profile, Role } from '../lib/types';

type Status = 'active' | 'muted' | 'banned';

export function userStatus(p: Profile, now = Date.now()): Status {
  if (p.isBanned) return 'banned';
  if (p.mutedUntil && Date.parse(p.mutedUntil) > now) return 'muted';
  return 'active';
}

const ROLE_TONE: Record<Role, 'neutral' | 'accent' | 'warning' | 'critical'> = { user: 'neutral', moderator: 'warning', editor: 'accent', admin: 'critical' };

export function ModerationPage() {
  const { t } = useI18n();
  const [tab, setTab] = useState<'users' | 'log'>('users');
  return (
    <>
      <PageHeader title={t('mod.title')} description={t('mod.subtitle')} />
      <Tabs value={tab} onChange={setTab} items={[{ value: 'users', label: t('mod.tabUsers') }, { value: 'log', label: t('mod.tabLog') }]} />
      {tab === 'users' ? <UsersTab /> : <LogTab />}
    </>
  );
}

function StatusBadge({ p }: { p: Profile }) {
  const { t, fmtDateTime } = useI18n();
  const s = userStatus(p);
  if (s === 'banned') return <Badge tone="critical" icon={<Ban size={12} aria-hidden />}>{t('mod.st.banned')}</Badge>;
  if (s === 'muted') return <Badge tone="warning" icon={<MicOff size={12} aria-hidden />}>{t('mod.st.muted', { until: fmtDateTime(p.mutedUntil!) })}</Badge>;
  return <Badge tone="good">{t('mod.st.active')}</Badge>;
}

function UsersTab() {
  const { api, user, can } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  const { data, error, reload } = useLoad(() => api.listProfiles());
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const [statusFilter, setStatusFilter] = useState<Status | ''>('');
  const [pending, setPending] = useState<{ profile: Profile; action: ModerationAction } | null>(null);
  const [roleChange, setRoleChange] = useState<{ profile: Profile; role: Role } | null>(null);

  const rows = useMemo(() => (data ?? []).filter((p) =>
    (!query || p.username.toLowerCase().includes(query.toLowerCase())) &&
    (!roleFilter || p.role === roleFilter) &&
    (!statusFilter || userStatus(p) === statusFilter)), [data, query, roleFilter, statusFilter]);

  async function applyRole() {
    if (!roleChange) return;
    try {
      await api.setRole(roleChange.profile.id, roleChange.role);
      toast.notify(t('mod.roleChanged', { name: roleChange.profile.username, role: t(`role.${roleChange.role}`) }));
      setRoleChange(null);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  const canModerate = can('users.moderate');
  const canRoles = can('users.manage_roles');
  if (!data) return <LoadState error={error} />;

  return (
    <>
      <Card title={t('mod.userCount', { n: data.length })}>
        <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_180px]">
          <TextInput aria-label={t('common.search')} placeholder={t('mod.searchUser')} value={query} onChange={(e) => setQuery(e.target.value)} />
          <Select aria-label={t('mod.colRole')} value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')}>
            <option value="">{t('mod.allRoles')}</option>
            {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
          </Select>
          <Select aria-label={t('common.status')} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | '')}>
            <option value="">{t('mod.allStatuses')}</option>
            <option value="active">{t('mod.st.active')}</option>
            <option value="muted">{t('mod.st.mutedShort')}</option>
            <option value="banned">{t('mod.st.banned')}</option>
          </Select>
        </div>
        <DataList rows={rows} rowKey={(p) => p.id} empty={t('common.noMatch')}
          columns={[
            { header: t('common.user'), primary: true, cell: (p) => <span className="font-medium">{p.username}{p.id === user?.id && <span className="text-ink-3"> {t('common.you')}</span>}</span> },
            { header: t('mod.colRole'), cell: (p) => <Badge tone={ROLE_TONE[p.role]}>{t(`role.${p.role}`)}</Badge> },
            { header: t('common.status'), cell: (p) => <StatusBadge p={p} /> },
            { header: t('common.country'), cell: (p) => p.countryCode ?? '—' },
            { header: t('mod.colJoined'), cell: (p) => <span className="tabular">{p.createdAt.slice(0, 10)}</span> },
          ]}
          actions={(p) => {
            if (p.id === user?.id) return <span className="text-xs text-ink-3">{t('common.ownAccount')}</span>;
            const s = userStatus(p);
            return (
              <>
                {canModerate && s === 'active' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'mute' })}><MicOff size={14} aria-hidden /> {t('mod.mute')}</Button>}
                {canModerate && s === 'muted' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'unmute' })}><Undo2 size={14} aria-hidden /> {t('mod.unmute')}</Button>}
                {canModerate && s !== 'banned' && <Button size="sm" variant="danger" onClick={() => setPending({ profile: p, action: 'ban' })}><Ban size={14} aria-hidden /> {t('mod.ban')}</Button>}
                {canModerate && s === 'banned' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'unban' })}><Undo2 size={14} aria-hidden /> {t('mod.unban')}</Button>}
                {canRoles && (
                  <Select aria-label={t('mod.roleOf', { name: p.username })} className="h-8 w-40 py-0 text-xs" value={p.role}
                    onChange={(e) => setRoleChange({ profile: p, role: e.target.value as Role })}>
                    {ROLES.map((r) => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
                  </Select>
                )}
              </>
            );
          }}
        />
      </Card>

      {pending && <ModerateDialog {...pending} onClose={() => setPending(null)} onDone={() => { setPending(null); reload(); }} />}

      {roleChange && (
        <Modal open title={t('mod.roleChange')} onClose={() => setRoleChange(null)}
          footer={<><Button onClick={() => setRoleChange(null)}>{t('common.cancel')}</Button><Button variant="primary" onClick={applyRole}><ShieldCheck size={16} aria-hidden /> {t('common.confirm')}</Button></>}>
          <p className="text-sm">{t('mod.roleChangeBody', { name: roleChange.profile.username, from: t(`role.${roleChange.profile.role}`), to: t(`role.${roleChange.role}`) })}</p>
          {roleChange.role !== 'user' && <p className="mt-2 text-sm text-ink-2">{t('mod.roleChangePanel')}</p>}
        </Modal>
      )}
    </>
  );
}

function LogTab() {
  const { api } = useAuth();
  const { t, fmtDateTime } = useI18n();
  const { data, error } = useLoad(() => api.listModerationLog());
  if (!data) return <LoadState error={error} />;
  return (
    <Card>
      <DataList rows={data} rowKey={(l) => l.id} empty={t('mod.logEmpty')}
        columns={[
          { header: t('mod.colAction'), primary: true, cell: (l) => <span className="font-medium">{t(`act.${l.action}`)}</span> },
          { header: t('mod.colTarget'), cell: (l) => l.targetName },
          { header: t('mod.colModerator'), cell: (l) => l.moderatorName },
          { header: t('common.reason'), cell: (l) => <span className="break-words text-ink-2">{l.reason ?? (l.messageExcerpt ? `“${l.messageExcerpt}”` : '—')}</span> },
          { header: t('common.time'), cell: (l) => <span className="tabular whitespace-nowrap text-xs">{fmtDateTime(l.createdAt)}</span> },
        ]}
      />
    </Card>
  );
}
