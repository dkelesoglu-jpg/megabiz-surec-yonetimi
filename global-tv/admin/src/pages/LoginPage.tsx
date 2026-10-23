import { Tv } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../components/feedback';
import { Button, Field, TextInput } from '../components/ui';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demoData';
import { ROLE_LABELS } from '../lib/permissions';

export function LoginPage() {
  const { signIn, api } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="grid size-10 place-items-center rounded-xl bg-accent text-accent-ink"><Tv size={22} aria-hidden /></div>
          <div>
            <h1 className="text-lg font-semibold">Global TV Yönetim</h1>
            <p className="text-sm text-ink-3">Yetkili personel girişi</p>
          </div>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5">
          <Field label="E-posta">
            {(id) => <TextInput id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label="Şifre">
            {(id) => <TextInput id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          {error && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Giriş yapılıyor…' : 'Giriş yap'}</Button>
        </form>

        {api.mode === 'demo' && (
          <div className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm">
            <p className="mb-2 font-medium">Demo hesapları <span className="font-normal text-ink-3">(şifre: {DEMO_PASSWORD})</span></p>
            <ul className="flex flex-col gap-1">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.id}>
                  <button type="button" className="text-accent hover:underline"
                    onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}>
                    {a.email}
                  </button>
                  <span className="text-ink-3"> — {ROLE_LABELS[a.role]}{a.role === 'user' ? ' (erişimi yok)' : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
