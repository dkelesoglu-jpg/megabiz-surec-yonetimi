import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { LoadState, useLoad } from '../components/feedback';
import { Card, PageHeader, cx } from '../components/ui';
import type { DashboardStats } from '../lib/types';

const nf = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });

function StatTile({ label, value, sub, tone, to }: { label: string; value: number; sub?: string; tone?: 'warning' | 'critical'; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">{nf.format(value)}</p>
      {sub && (
        <p className={cx('mt-1 flex items-center gap-1 text-xs', tone === 'warning' ? 'text-warning' : tone === 'critical' ? 'text-critical' : 'text-ink-3')}>
          {tone && <AlertTriangle size={12} aria-hidden />}
          {sub}
        </p>
      )}
    </>
  );
  const cls = 'block rounded-xl border border-line bg-surface p-4';
  return to ? <Link to={to} className={cx(cls, 'hover:border-accent')}>{body}</Link> : <div className={cls}>{body}</div>;
}

/** Tek seriden oluşan sütun grafiği: son 7 günün mesaj sayısı. Üzerine gelince değer gösterir. */
function MessagesChart({ data }: { data: DashboardStats['messagesPerDay'] }) {
  const [hover, setHover] = useState<number | null>(null);
  const W = 560;
  const H = 180;
  const pad = { top: 12, right: 8, bottom: 24, left: 32 };
  const max = Math.max(10, ...data.map((d) => d.count));
  const niceMax = Math.ceil(max / 10) * 10;
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const band = plotW / data.length;
  const barW = Math.min(36, band - 2 * 2 - 8);
  const y = (v: number) => pad.top + plotH - (v / niceMax) * plotH;
  const ticks = [0, niceMax / 2, niceMax];
  const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString('tr-TR', { weekday: 'short', timeZone: 'UTC' });
  const active = hover === null ? null : data[hover];

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Son 7 günde günlük sohbet mesajı sayısı">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(t)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--text-3)" className="tabular">{t}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * band + (band - barW) / 2;
          const top = y(d.count);
          const h = pad.top + plotH - top;
          const r = Math.min(4, h);
          return (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)}
              onBlur={() => setHover(null)} tabIndex={0} aria-label={`${day(d.date)}: ${d.count} mesaj`}>
              {/* Hedef alanı sütundan geniştir */}
              <rect x={pad.left + i * band} y={pad.top} width={band} height={plotH} fill="transparent" />
              <path
                d={`M${x},${top + h} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${top + h} Z`}
                fill="var(--series-1)" opacity={hover === null || hover === i ? 1 : 0.55}
              />
              <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--text-2)">{day(d.date)}</text>
            </g>
          );
        })}
      </svg>
      {active && hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-line bg-surface px-2 py-1 text-xs shadow"
          style={{ left: `${((pad.left + hover * band + band / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <span className="text-ink-2">{day(active.date)}</span> <strong className="tabular">{active.count}</strong>
        </div>
      )}
      <table className="sr-only">
        <caption>Günlük mesaj sayısı</caption>
        <tbody>{data.map((d) => <tr key={d.date}><th>{d.date}</th><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

export function DashboardPage() {
  const { api, can } = useAuth();
  const { data, error } = useLoad(() => api.dashboardStats());

  return (
    <>
      <PageHeader title="Pano" description="Kullanıcı, kanal ve sohbet durumuna genel bakış." />
      {!data ? <LoadState error={error} /> : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label="Kullanıcılar" value={data.usersTotal} sub={`Son 7 günde +${data.usersNew7d}`} to={can('users.read') ? '/users' : undefined} />
            <StatTile label="Yayındaki kanallar" value={data.channelsLive} sub={`Toplam ${data.channelsTotal} kanal`} to={can('channels.manage') ? '/channels' : undefined} />
            <StatTile label="Son 24 saatte mesaj" value={data.messages24h} />
            <StatTile label="Açık şikâyetler" value={data.reportsOpen} tone={data.reportsOpen > 0 ? 'critical' : undefined}
              sub={data.reportsOpen > 0 ? 'İnceleme bekliyor' : 'Bekleyen yok'} to={can('reports.manage') ? '/moderation' : undefined} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title="Günlük sohbet mesajı (son 7 gün)" className="lg:col-span-2">
              <MessagesChart data={data.messagesPerDay} />
            </Card>
            <Card title="Dikkat gerektirenler">
              <ul className="flex flex-col gap-3 text-sm">
                <AttentionItem show={data.rightsExpiring14d > 0} to="/rights" enabled={can('rights.manage')}
                  text={`${data.rightsExpiring14d} yayın hakkı 14 gün içinde bitiyor`} />
                <AttentionItem show={data.reportsOpen > 0} to="/moderation" enabled={can('reports.manage')}
                  text={`${data.reportsOpen} şikâyet inceleme bekliyor`} />
                <AttentionItem show={data.usersBanned > 0} to="/users" enabled={can('users.read')}
                  text={`${data.usersBanned} yasaklı kullanıcı`} tone="neutral" />
                {data.rightsExpiring14d === 0 && data.reportsOpen === 0 && data.usersBanned === 0 && (
                  <li className="text-ink-3">Şu an dikkat gerektiren bir şey yok.</li>
                )}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}

function AttentionItem({ show, to, enabled, text, tone = 'warning' }: { show: boolean; to: string; enabled: boolean; text: string; tone?: 'warning' | 'neutral' }) {
  if (!show) return null;
  const content = (
    <span className="flex items-center gap-2">
      <AlertTriangle size={16} aria-hidden className={tone === 'warning' ? 'text-warning' : 'text-ink-3'} />
      <span className="flex-1">{text}</span>
      {enabled && <ArrowRight size={14} aria-hidden className="text-ink-3" />}
    </span>
  );
  return <li>{enabled ? <Link to={to} className="hover:text-accent">{content}</Link> : content}</li>;
}
