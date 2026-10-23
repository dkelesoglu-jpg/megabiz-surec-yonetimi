import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { DailyBars } from '../components/charts';
import { LoadState, useLoad } from '../components/feedback';
import { Card, PageHeader, cx } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';

function StatTile({ label, value, sub, tone, to }: { label: string; value: string; sub?: string; tone?: 'warning' | 'critical'; to?: string }) {
  const body = (
    <>
      <p className="text-sm text-ink-2">{label}</p>
      <p className="mt-1.5 text-3xl font-semibold tracking-tight">{value}</p>
      {sub && (
        <p className={cx('mt-1 flex items-center gap-1 text-xs', tone === 'warning' ? 'text-warning' : tone === 'critical' ? 'text-critical' : 'text-ink-3')}>
          {tone && <AlertTriangle size={12} aria-hidden />}
          {sub}
        </p>
      )}
    </>
  );
  const cls = 'card-shadow block rounded-2xl border border-line bg-surface p-4';
  return to ? <Link to={to} className={cx(cls, 'transition-colors hover:border-accent')}>{body}</Link> : <div className={cls}>{body}</div>;
}

export function DashboardPage() {
  const { api, can } = useAuth();
  const { t, fmtNumber } = useI18n();
  const { data, error } = useLoad(() => api.dashboardStats());

  return (
    <>
      <PageHeader title={t('dash.title')} description={t('dash.subtitle')} />
      {!data ? <LoadState error={error} /> : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatTile label={t('dash.users')} value={fmtNumber(data.usersTotal, true)} sub={t('dash.usersNew', { n: data.usersNew7d })}
              to={can('users.read') ? '/moderation' : undefined} />
            <StatTile label={t('dash.active')} value={fmtNumber(data.activeUsers1d, true)} sub={t('dash.active7', { n: data.activeUsers7d })}
              to={can('reports.read') ? '/reports' : undefined} />
            <StatTile label={t('dash.channels')} value={fmtNumber(data.channelsLive)} sub={t('dash.channelsTotal', { n: data.channelsTotal })}
              to={can('channels.manage') ? '/channels' : undefined} />
            <StatTile label={t('dash.watch')} value={fmtNumber(data.watchMinutes24h, true)} sub={t('dash.watchUnit')}
              to={can('reports.read') ? '/reports' : undefined} />
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Card title={t('dash.chartTitle')} className="lg:col-span-2">
              <DailyBars data={data.watchPerDay} label={t('dash.chartLabel')} />
            </Card>
            <Card title={t('dash.attention')}>
              <ul className="flex flex-col gap-3 text-sm">
                <AttentionItem show={data.rightsExpiring14d > 0} to="/licenses" enabled={can('rights.manage')}
                  text={t('dash.attnRights', { n: data.rightsExpiring14d })} />
                <AttentionItem show={data.reportsOpen > 0} to="/community" enabled={can('community.manage')}
                  text={t('dash.attnReports', { n: data.reportsOpen })} />
                <AttentionItem show={data.usersBanned > 0} to="/moderation" enabled={can('users.read')}
                  text={t('dash.attnBanned', { n: data.usersBanned })} tone="neutral" />
                {data.rightsExpiring14d === 0 && data.reportsOpen === 0 && data.usersBanned === 0 && (
                  <li className="text-ink-3">{t('dash.attnNone')}</li>
                )}
              </ul>
              <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">{t('dash.messages24', { n: data.messages24h })}</p>
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
