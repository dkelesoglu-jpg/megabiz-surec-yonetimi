import { useState } from 'react';
import { useI18n } from '../i18n/I18nProvider';
import type { DayCount } from '../lib/types';
import { EmptyState } from './ui';

/**
 * Tek seriden oluşan günlük sütun grafiği. Üzerine gelince / odaklanınca değer gösterir;
 * ekran okuyucular için gizli tablo içerir. Renk: --series-1 (kontrast ve CVD doğrulandı).
 */
export function DailyBars({ data, label, height = 180 }: { data: DayCount[]; label: string; height?: number }) {
  const { fmtDay, fmtNumber, t } = useI18n();
  const [hover, setHover] = useState<number | null>(null);
  if (data.length === 0 || data.every((d) => d.count === 0)) return <EmptyState>{t('rpt.noData')}</EmptyState>;

  const W = 640;
  const H = height;
  const pad = { top: 14, right: 8, bottom: 24, left: 40 };
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;
  const band = plotW / data.length;
  const gap = data.length > 40 ? 1 : 2;
  const barW = Math.max(2, Math.min(36, band - gap * 2 - (data.length > 14 ? 1 : 8)));
  const y = (v: number) => pad.top + plotH - (v / top) * plotH;
  const ticks = [0, top / 2, top];
  const labelEvery = Math.ceil(data.length / 8);
  const active = hover === null ? null : data[hover];

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={label}>
        {ticks.map((tk) => (
          <g key={tk}>
            <line x1={pad.left} x2={W - pad.right} y1={y(tk)} y2={y(tk)} stroke="var(--grid)" strokeWidth={1} />
            <text x={pad.left - 6} y={y(tk)} dy="0.32em" textAnchor="end" fontSize={11} fill="var(--text-3)" className="tabular">
              {fmtNumber(tk, true)}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = pad.left + i * band + (band - barW) / 2;
          const yTop = y(d.count);
          const h = pad.top + plotH - yTop;
          const r = Math.min(4, h, barW / 2);
          return (
            <g key={d.day} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(i)}
              onBlur={() => setHover(null)} tabIndex={0} aria-label={t('rpt.chartDay', { day: fmtDay(d.day), n: d.count })}>
              <rect x={pad.left + i * band} y={pad.top} width={band} height={plotH} fill="transparent" />
              {h > 0 && (
                <path
                  d={`M${x},${yTop + h} V${yTop + r} Q${x},${yTop} ${x + r},${yTop} H${x + barW - r} Q${x + barW},${yTop} ${x + barW},${yTop + r} V${yTop + h} Z`}
                  fill="var(--series-1)" opacity={hover === null || hover === i ? 1 : 0.55}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={H - 6} textAnchor="middle" fontSize={11} fill="var(--text-2)">{fmtDay(d.day)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {active && hover !== null && (
        <div className="pointer-events-none absolute top-0 rounded-md border border-line bg-surface px-2 py-1 text-xs shadow"
          style={{ left: `${((pad.left + hover * band + band / 2) / W) * 100}%`, transform: 'translateX(-50%)' }}>
          <span className="text-ink-2">{fmtDay(active.day)}</span> <strong className="tabular">{fmtNumber(active.count)}</strong>
        </div>
      )}
      <table className="sr-only">
        <caption>{label}</caption>
        <tbody>{data.map((d) => <tr key={d.day}><th>{d.day}</th><td>{d.count}</td></tr>)}</tbody>
      </table>
    </figure>
  );
}

/** Kategorik karşılaştırma için yatay çubuk listesi: değer her zaman metin olarak da yazılır. */
export function BarList({ items, format }: { items: { label: string; value: number; sub?: string }[]; format?: (n: number) => string }) {
  const { t, fmtNumber } = useI18n();
  if (items.length === 0 || items.every((i) => i.value === 0)) return <EmptyState>{t('rpt.noData')}</EmptyState>;
  const max = Math.max(...items.map((i) => i.value));
  const f = format ?? ((n: number) => fmtNumber(n));
  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((i) => (
        <li key={i.label}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate">{i.label}{i.sub && <span className="ml-1.5 text-xs text-ink-3">{i.sub}</span>}</span>
            <span className="tabular shrink-0 text-ink-2">{f(i.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-surface-2" aria-hidden>
            <div className="h-2 rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: 'var(--series-1)' }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function niceStep(max: number): number {
  const raw = max / 2;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const n = raw / pow;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
}

/** Basit CSV dışa aktarma (tarayıcıda, sunucuya gönderilmez). */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const blob = new Blob([`﻿${rows.map((r) => r.map(esc).join(',')).join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
