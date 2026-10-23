import { Ban, MicOff, ShieldCheck, Undo2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { LoadState, errorMessage, useLoad, useToast } from '../components/feedback';
import { Badge, Button, Card, DataList, Field, Modal, PageHeader, Select, TextInput } from '../components/ui';
import { ROLE_LABELS } from '../lib/permissions';
import type { ModerationAction, Profile, Role } from '../lib/types';

type Status = 'active' | 'muted' | 'banned';

export function userStatus(p: Profile, now = Date.now()): Status {
  if (p.isBanned) return 'banned';
  if (p.mutedUntil && Date.parse(p.mutedUntil) > now) return 'muted';
  return 'active';
}

function StatusBadge({ p }: { p: Profile }) {
  const s = userStatus(p);
  if (s === 'banned') return <Badge tone="critical" icon={<Ban size={12} aria-hidden />}>Yasaklı</Badge>;
  if (s === 'muted') {
    const until = new Date(p.mutedUntil!).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });
    return <Badge tone="warning" icon={<MicOff size={12} aria-hidden />}>Susturuldu · {until}</Badge>;
  }
  return <Badge tone="good">Aktif</Badge>;
}

const ROLE_TONE: Record<Role, 'neutral' | 'accent' | 'warning' | 'critical'> = { user: 'neutral', moderator: 'warning', editor: 'accent', admin: 'critical' };

export function UsersPage() {
  const { api, user, can } = useAuth();
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
      toast.notify(`${roleChange.profile.username} artık ${ROLE_LABELS[roleChange.role]}.`);
      setRoleChange(null);
      reload();
    } catch (e) {
      toast.fail(e);
    }
  }

  const canModerate = can('users.moderate');
  const canRoles = can('users.manage_roles');

  return (
    <>
      <PageHeader title="Kullanıcı yönetimi" description="Kullanıcı durumları ve yetkiler. Susturma ve yasaklama denetim kaydına işlenir." />
      {!data ? <LoadState error={error} /> : (
        <Card title={`${data.length} kullanıcı`}>
          <div className="mb-3 grid gap-2 sm:grid-cols-[1fr_180px_180px]">
            <TextInput aria-label="Kullanıcı ara" placeholder="Kullanıcı adı ile ara" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select aria-label="Rol filtresi" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as Role | '')}>
              <option value="">Tüm roller</option>
              {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
            </Select>
            <Select aria-label="Durum filtresi" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as Status | '')}>
              <option value="">Tüm durumlar</option>
              <option value="active">Aktif</option>
              <option value="muted">Susturulmuş</option>
              <option value="banned">Yasaklı</option>
            </Select>
          </div>
          <DataList rows={rows} rowKey={(p) => p.id} empty="Filtreye uyan kullanıcı yok."
            columns={[
              { header: 'Kullanıcı', primary: true, cell: (p) => <span className="font-medium">{p.username}{p.id === user?.id && <span className="text-ink-3"> (siz)</span>}</span> },
              { header: 'Rol', cell: (p) => <Badge tone={ROLE_TONE[p.role]}>{ROLE_LABELS[p.role]}</Badge> },
              { header: 'Durum', cell: (p) => <StatusBadge p={p} /> },
              { header: 'Ülke', cell: (p) => p.countryCode ?? '—' },
              { header: 'Kayıt', cell: (p) => <span className="tabular">{p.createdAt.slice(0, 10)}</span> },
            ]}
            actions={(p) => {
              if (p.id === user?.id) return <span className="text-xs text-ink-3">Kendi hesabınız</span>;
              const s = userStatus(p);
              return (
                <>
                  {canModerate && s === 'active' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'mute' })}><MicOff size={14} aria-hidden /> Sustur</Button>}
                  {canModerate && s === 'muted' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'unmute' })}><Undo2 size={14} aria-hidden /> Susturmayı kaldır</Button>}
                  {canModerate && s !== 'banned' && <Button size="sm" variant="danger" onClick={() => setPending({ profile: p, action: 'ban' })}><Ban size={14} aria-hidden /> Yasakla</Button>}
                  {canModerate && s === 'banned' && <Button size="sm" onClick={() => setPending({ profile: p, action: 'unban' })}><Undo2 size={14} aria-hidden /> Yasağı kaldır</Button>}
                  {canRoles && (
                    <Select aria-label={`${p.username} rolü`} className="h-8 w-40 py-0 text-xs" value={p.role}
                      onChange={(e) => setRoleChange({ profile: p, role: e.target.value as Role })}>
                      {(Object.keys(ROLE_LABELS) as Role[]).map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                  )}
                </>
              );
            }}
          />
        </Card>
      )}

      {pending && <ModerateDialog {...pending} onClose={() => setPending(null)} onDone={() => { setPending(null); reload(); }} />}

      {roleChange && (
        <Modal open title="Rol değişikliği" onClose={() => setRoleChange(null)}
          footer={<><Button onClick={() => setRoleChange(null)}>Vazgeç</Button><Button variant="primary" onClick={applyRole}><ShieldCheck size={16} aria-hidden /> Onayla</Button></>}>
          <p className="text-sm">
            <strong>{roleChange.profile.username}</strong> kullanıcısının rolü <strong>{ROLE_LABELS[roleChange.profile.role]}</strong> →{' '}
            <strong>{ROLE_LABELS[roleChange.role]}</strong> olarak değiştirilecek.
          </p>
          {roleChange.role !== 'user' && <p className="mt-2 text-sm text-ink-2">Bu kişi yönetim paneline erişebilecek.</p>}
        </Modal>
      )}
    </>
  );
}

const ACTION_TEXT: Record<ModerationAction, { title: string; button: string }> = {
  mute: { title: 'Kullanıcıyı sustur', button: 'Sustur' },
  unmute: { title: 'Susturmayı kaldır', button: 'Kaldır' },
  ban: { title: 'Kullanıcıyı yasakla', button: 'Yasakla' },
  unban: { title: 'Yasağı kaldır', button: 'Kaldır' },
};

export function ModerateDialog({ profile, action, onClose, onDone }: { profile: Pick<Profile, 'id' | 'username'>; action: ModerationAction; onClose: () => void; onDone: () => void }) {
  const { api } = useAuth();
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [minutes, setMinutes] = useState(60 * 24);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    try {
      await api.moderateUser(profile.id, action, reason || undefined, minutes);
      toast.notify(`${profile.username}: ${ACTION_TEXT[action].title.toLowerCase()} uygulandı.`);
      onDone();
    } catch (e) {
      setError(errorMessage(e));
    }
  }

  return (
    <Modal open title={ACTION_TEXT[action].title} onClose={onClose}
      footer={<><Button onClick={onClose}>Vazgeç</Button><Button variant={action === 'ban' ? 'danger' : 'primary'} onClick={submit}>{ACTION_TEXT[action].button}</Button></>}>
      <p className="mb-3 text-sm">Kullanıcı: <strong>{profile.username}</strong></p>
      <div className="grid gap-3">
        {action === 'mute' && (
          <Field label="Süre">{(id) => (
            <Select id={id} value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={60}>1 saat</option>
              <option value={60 * 24}>24 saat</option>
              <option value={60 * 24 * 7}>7 gün</option>
            </Select>)}
          </Field>
        )}
        {(action === 'mute' || action === 'ban') && (
          <Field label="Gerekçe" hint="Denetim kaydına yazılır">{(id) => <TextInput id={id} value={reason} onChange={(e) => setReason(e.target.value)} />}</Field>
        )}
      </div>
      {error && <p role="alert" className="mt-3 rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
    </Modal>
  );
}
