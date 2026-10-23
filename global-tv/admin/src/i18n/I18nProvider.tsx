import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { en } from './en';
import { tr, type MessageKey } from './tr';

export type Lang = 'tr' | 'en';
export type Vars = Record<string, string | number>;
export type Translate = (key: MessageKey, vars?: Vars) => string;

const DICTS: Record<Lang, Record<MessageKey, string>> = { tr, en };
const LOCALES: Record<Lang, string> = { tr: 'tr-TR', en: 'en-GB' };

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  const text = DICTS[lang][key] ?? tr[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m)) : text;
}

function readStored<T extends string>(name: string, allowed: readonly T[]): T | null {
  try {
    const v = localStorage.getItem(name);
    return v && (allowed as readonly string[]).includes(v) ? (v as T) : null;
  } catch {
    return null;
  }
}

function store(name: string, value: string) {
  try {
    localStorage.setItem(name, value);
  } catch {
    /* gizli pencere vb.: tercih yalnızca bu oturumda kalır */
  }
}

export type Theme = 'dark' | 'light';

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translate;
  locale: string;
  fmtNumber: (n: number, compact?: boolean) => string;
  fmtDateTime: (iso: string) => string;
  fmtDay: (isoDay: string) => string;
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children, initialLang }: { children: ReactNode; initialLang?: Lang }) {
  const [lang, setLangState] = useState<Lang>(() => initialLang ?? readStored('gtv.lang', ['tr', 'en'] as const) ?? 'tr');
  const [theme, setThemeState] = useState<Theme>(() => readStored('gtv.theme', ['dark', 'light'] as const) ?? 'dark');

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  const setLang = useCallback((l: Lang) => { setLangState(l); store('gtv.lang', l); }, []);
  const setTheme = useCallback((t: Theme) => { setThemeState(t); store('gtv.theme', t); }, []);

  const value = useMemo<I18nValue>(() => {
    const locale = LOCALES[lang];
    const compact = new Intl.NumberFormat(locale, { notation: 'compact', maximumFractionDigits: 1 });
    const plain = new Intl.NumberFormat(locale);
    return {
      lang, setLang, theme, setTheme, locale,
      t: (key, vars) => translate(lang, key, vars),
      fmtNumber: (n, c = false) => (c ? compact : plain).format(n),
      fmtDateTime: (iso) => new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' }),
      fmtDay: (day) => new Date(`${day}T00:00:00Z`).toLocaleDateString(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }),
    };
  }, [lang, setLang, theme, setTheme]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const v = useContext(I18nContext);
  if (!v) throw new Error('useI18n, I18nProvider içinde kullanılmalı');
  return v;
}
