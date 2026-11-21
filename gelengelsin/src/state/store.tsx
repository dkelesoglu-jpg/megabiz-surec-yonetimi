import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createSeed } from '../domain/seed';
import type { DB, Result } from '../domain/types';

const KEY = 'gelengelsin-demo-v1';
const USER_KEY = 'gelengelsin-demo-user';

// Tarayıcı depolaması kapalıysa (ör. gömülü önizleme) bellekte çalışmaya devam eder.
const storage = {
  get(k: string) { try { return localStorage.getItem(k); } catch { return null; } },
  set(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* yoksay */ } },
  del(k: string) { try { localStorage.removeItem(k); } catch { /* yoksay */ } },
};

const load = (): DB => {
  const raw = storage.get(KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw) as DB;
      if (db.version === 1) return db;
    } catch { /* bozuksa yeniden kur */ }
  }
  return createSeed();
};

interface Toast { id: number; text: string; tone: 'ok' | 'error' }

interface Store {
  db: DB;
  userId: string;
  setUserId: (id: string) => void;
  /** Bir motor işlemi çalıştırır; başarılıysa kaydeder, değilse hatayı gösterir. */
  run: <T>(fn: (db: DB) => Result<T>, success?: string) => { ok: boolean; value?: T };
  toast: (text: string, tone?: Toast['tone']) => void;
  toasts: Toast[];
  reset: () => void;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<DB>(load);
  const dbRef = useRef(db);
  const [userId, setUserIdState] = useState(() => storage.get(USER_KEY) ?? 'u_ayse');
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => { storage.set(KEY, JSON.stringify(db)); }, [db]);

  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t.slice(-1), { id, text, tone }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const run = useCallback(<T,>(fn: (db: DB) => Result<T>, success?: string) => {
    const r = fn(dbRef.current);
    if (!r.ok) { toast(r.error, 'error'); return { ok: false }; }
    dbRef.current = r.db;
    setDb(r.db);
    if (success) toast(success);
    return { ok: true, value: r.value };
  }, [toast]);

  const setUserId = useCallback((id: string) => { storage.set(USER_KEY, id); setUserIdState(id); setToasts([]); }, []);

  const reset = useCallback(() => {
    storage.del(KEY);
    const fresh = createSeed();
    dbRef.current = fresh;
    setDb(fresh);
    toast('Demo verisi sıfırlandı.');
  }, [toast]);

  const value = useMemo(() => ({ db, userId, setUserId, run, toast, toasts, reset }), [db, userId, setUserId, run, toast, toasts, reset]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => {
  const s = useContext(Ctx);
  if (!s) throw new Error('StoreProvider eksik');
  return s;
};

// ---------- basit hash yönlendirici ----------

const readHash = () => (location.hash.replace(/^#/, '') || '/');

export function useRoute() {
  const [path, setPath] = useState(readHash);
  useEffect(() => {
    const on = () => { setPath(readHash()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}

export const go = (path: string) => { location.hash = path; };

export const shareUrl = (planId: string) => `https://gelengelsin.net/p/${planId}`;
export const localPlanUrl = (planId: string) => `${location.href.split('#')[0]}#/plan/${planId}`;
