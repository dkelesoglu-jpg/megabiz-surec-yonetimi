import { Download, Info } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { BarList, DailyBars, downloadCsv } from '../components/charts';
import { LoadState, useLoad } from '../components/feedback';
import { Button, Card, PageHeader, Select } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import type { DayCount, ReportData } from '../lib/types';

const PERIODS = [7, 30, 90];

export function ReportsPage() {
  const { api } = useAuth();
  const { t } = useI18n();
  const [days, setDays] = useState(30);
  const { data, error } = useLoad(() => api.report(days), [days]);

  return (
    <>
      <PageHeader title={t('rpt.title')} description={t('rpt.subtitle')} actions={
        <div className="flex items-center gap-2">
          <Select aria-label={t('rpt.period')} className="w-40" value={days} onChange={(e) => setDays(Number(e.target.value))}>
            {PERIODS.map((p) => <option key={p} value={p}>{t('rpt.days', { n: p })}</option>)}
          </Select>
          {data && <Button size="md" onClick={() => exportAll(data, t)}><Download size={16} aria-hidden /> {t('common.exportCsv')}</Button>}
        </div>} />
      {!data ? <LoadState error={error} /> : <ReportBody data={data} />}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-3">{title}</h2>
      <div className="grid gap-4 lg:grid-cols-2">{children}</div>
    </section>
  );
}

const total = (d: DayCount[]) => d.reduce((n, x) => n + x.count, 0);

function ReportBody({ data }: { data: ReportData }) {
  const { t, fmtNumber } = useI18n();
  const minutes = (n: number) => t('common.minutes', { n: fmtNumber(n) });
  const country = (key: string) => (key === 'OTHER' ? t('rpt.otherCountries') : key === '??' ? t('rpt.unknownCountry') : key);

  return (
    <div className="flex flex-col gap-8">
      <Section title={t('rpt.users')}>
        <Card title={t('rpt.activeDaily')} actions={<span className="text-xs text-ink-3">{t('rpt.total', { n: fmtNumber(total(data.activePerDay)) })}</span>}>
          <DailyBars data={data.activePerDay} label={t('rpt.activeDaily')} />
        </Card>
        <Card title={t('rpt.signups')} actions={<span className="text-xs text-ink-3">{t('rpt.total', { n: fmtNumber(total(data.signupsPerDay)) })}</span>}>
          <DailyBars data={data.signupsPerDay} label={t('rpt.signups')} />
        </Card>
        <Card title={t('rpt.activeDevices')} actions={<span className="text-xs text-ink-3">{t('rpt.total', { n: fmtNumber(total(data.activeDevicesPerDay)) })}</span>}>
          <DailyBars data={data.activeDevicesPerDay} label={t('rpt.activeDevices')} />
        </Card>
        <Card title={t('rpt.byCountry')}>
          <BarList items={data.usersByCountry.slice(0, 8).map((c) => ({ label: country(c.key), value: c.count }))} />
        </Card>
      </Section>

      <Section title={t('rpt.broadcast')}>
        <Card title={t('rpt.byChannel')}>
          <BarList format={minutes} items={data.watchByChannel.map((c) => ({ label: c.channelName, value: c.minutes, sub: t('rpt.sessions', { n: fmtNumber(c.sessions) }) }))} />
        </Card>
        <Card title={t('rpt.byPlatform')}>
          <BarList format={minutes} items={data.watchByPlatform.map((p) => ({ label: p.key === 'ios' ? 'iOS' : p.key === 'android' ? 'Android' : p.key, value: p.count }))} />
        </Card>
        <Card title={t('rpt.byCountryWatch')}>
          <BarList format={minutes} items={data.watchByCountry.map((c) => ({ label: country(c.key), value: c.minutes, sub: t('rpt.devices', { n: fmtNumber(c.devices) }) }))} />
          <p className="mt-3 flex items-start gap-2 text-xs text-ink-3"><Info size={14} className="mt-0.5 shrink-0" aria-hidden />{t('rpt.anonNote')}</p>
        </Card>
      </Section>

      <Section title={t('rpt.chat')}>
        <Card title={t('rpt.messagesDaily')} actions={<span className="text-xs text-ink-3">{t('rpt.total', { n: fmtNumber(total(data.messagesPerDay)) })}</span>}>
          <DailyBars data={data.messagesPerDay} label={t('rpt.messagesDaily')} />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title={t('rpt.reportsByReason')}>
            <BarList items={data.reportsByReason.map((r) => ({ label: t(`reason.${r.key as 'spam'}`), value: r.count }))} />
          </Card>
          <Card title={t('rpt.moderationByAction')}>
            <BarList items={data.moderationByAction.map((r) => ({ label: t(`act.${r.key as 'mute'}`), value: r.count }))} />
          </Card>
        </div>
      </Section>

      {data.ads && (
        <Section title={t('rpt.ads')}>
          <Card title={t('rpt.ads')}>
            <dl className="grid grid-cols-3 gap-3">
              <div><dt className="text-xs text-ink-3">{t('rpt.impressions')}</dt><dd className="text-2xl font-semibold">{fmtNumber(data.ads.impressions)}</dd></div>
              <div><dt className="text-xs text-ink-3">{t('rpt.clicks')}</dt><dd className="text-2xl font-semibold">{fmtNumber(data.ads.clicks)}</dd></div>
              <div><dt className="text-xs text-ink-3">{t('rpt.ctr')}</dt><dd className="text-2xl font-semibold">{data.ads.impressions ? `${((data.ads.clicks / data.ads.impressions) * 100).toFixed(1)}%` : '—'}</dd></div>
            </dl>
            {data.ads.impressions === 0 && (
              <p className="mt-3 flex items-start gap-2 text-sm text-ink-2"><Info size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />{t('rpt.adsPending')}</p>
            )}
          </Card>
        </Section>
      )}
    </div>
  );
}

function exportAll(data: ReportData, t: ReturnType<typeof useI18n>['t']) {
  const rows: (string | number)[][] = [['section', 'key', 'value']];
  const days = (name: string, d: DayCount[]) => d.forEach((x) => rows.push([name, x.day, x.count]));
  days(t('rpt.activeDaily'), data.activePerDay);
  days(t('rpt.signups'), data.signupsPerDay);
  days(t('rpt.messagesDaily'), data.messagesPerDay);
  data.usersByCountry.forEach((c) => rows.push([t('rpt.byCountry'), c.key, c.count]));
  data.watchByChannel.forEach((c) => rows.push([t('rpt.byChannel'), c.channelName, c.minutes]));
  data.watchByPlatform.forEach((c) => rows.push([t('rpt.byPlatform'), c.key, c.count]));
  data.watchByCountry.forEach((c) => rows.push([t('rpt.byCountryWatch'), c.key, c.minutes]));
  days(t('rpt.activeDevices'), data.activeDevicesPerDay);
  data.reportsByReason.forEach((c) => rows.push([t('rpt.reportsByReason'), c.key, c.count]));
  data.moderationByAction.forEach((c) => rows.push([t('rpt.moderationByAction'), c.key, c.count]));
  downloadCsv(`globaltv-rapor-${data.days}g.csv`, rows);
}
