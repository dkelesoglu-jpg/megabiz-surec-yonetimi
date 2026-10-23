import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AdminApi } from '../lib/api';
import { can, type Permission } from '../lib/permissions';
import type { AdminUser } from '../lib/types';

interface AuthValue {
  api: AdminApi;
  user: AdminUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ api, children }: { api: AdminApi; children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    api.currentUser().then((u) => {
      if (alive) {
        setUser(u);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [api]);

  const signIn = useCallback(async (email: string, password: string) => {
    setUser(await api.signIn(email, password));
  }, [api]);

  const signOut = useCallback(async () => {
    await api.signOut();
    setUser(null);
  }, [api]);

  const value = useMemo<AuthValue>(() => ({
    api, user, loading, signIn, signOut,
    can: (p) => can(user?.role, p),
  }), [api, user, loading, signIn, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const v = useContext(AuthContext);
  if (!v) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return v;
}
