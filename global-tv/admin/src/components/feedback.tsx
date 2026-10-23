import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ForbiddenError, ValidationError } from '../lib/api';
import { cx } from './ui';

interface Toast {
  id: number;
  tone: 'good' | 'critical';
  text: string;
}

const ToastContext = createContext<{ notify: (text: string) => void; fail: (error: unknown) => void } | null>(null);

export function errorMessage(error: unknown): string {
  if (error instanceof ForbiddenError || error instanceof ValidationError) return error.message;
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const seq = useRef(0);

  const push = useCallback((tone: Toast['tone'], text: string) => {
    const id = ++seq.current;
    setToasts((t) => [...t, { id, tone, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  }, []);

  const notify = useCallback((text: string) => push('good', text), [push]);
  const fail = useCallback((error: unknown) => push('critical', errorMessage(error)), [push]);

  return (
    <ToastContext.Provider value={{ notify, fail }}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} role={t.tone === 'critical' ? 'alert' : 'status'}
            className={cx('pointer-events-auto flex max-w-sm items-start gap-2 rounded-lg border px-3 py-2 text-sm shadow-lg',
              t.tone === 'good' ? 'border-good/30 bg-good-soft text-good' : 'border-critical/30 bg-critical-soft text-critical')}>
            {t.tone === 'good' ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertTriangle size={16} className="mt-0.5 shrink-0" />}
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const v = useContext(ToastContext);
  if (!v) throw new Error('useToast, ToastProvider içinde kullanılmalı');
  return v;
}

/** Veri yükleme: yükleniyor / hata / veri + yeniden yükle. */
export function useLoad<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    let alive = true;
    load().then(
      (d) => { if (alive) { setData(d); setError(null); } },
      (e) => { if (alive) setError(e); },
    );
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version, ...deps]);
  return { data, error, reload: () => setVersion((v) => v + 1) };
}

export function LoadState({ error }: { error: unknown }) {
  if (error) {
    return <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{errorMessage(error)}</p>;
  }
  return <p className="py-8 text-center text-sm text-ink-3">Yükleniyor…</p>;
}
