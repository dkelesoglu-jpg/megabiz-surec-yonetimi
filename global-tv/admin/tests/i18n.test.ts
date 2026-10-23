import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { en } from '../src/i18n/en';
import { translate } from '../src/i18n/I18nProvider';
import { tr } from '../src/i18n/tr';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? sourceFiles(p) : /\.tsx?$/.test(f) ? [p] : [];
  });
}

describe('dil sözlükleri (TR/EN)', () => {
  it('İngilizce sözlük tüm anahtarları içerir ve boş metin yoktur', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(tr).sort());
    for (const [k, v] of Object.entries(en)) expect(v.trim(), k).not.toBe('');
  });

  it('yer tutucular iki dilde aynıdır', () => {
    for (const k of Object.keys(tr) as (keyof typeof tr)[]) {
      expect(placeholders(en[k]), k).toEqual(placeholders(tr[k]));
    }
  });

  it('kaynak koddaki sabit t(...) anahtarlarının hepsi sözlükte vardır', () => {
    const files = sourceFiles(resolve(__dirname, '../src'));
    const missing: string[] = [];
    for (const f of files) {
      for (const m of readFileSync(f, 'utf8').matchAll(/\bt\('([a-z][\w.]+)'/g)) {
        if (!(m[1]! in tr)) missing.push(`${f}: ${m[1]}`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('çeviri ve yer tutucu doldurma', () => {
    expect(translate('tr', 'ch.count', { n: 5 })).toBe('5 kanal');
    expect(translate('en', 'ch.count', { n: 5 })).toBe('5 channels');
    expect(translate('en', 'nav.licenses')).toBe('Broadcast licenses');
  });
});
