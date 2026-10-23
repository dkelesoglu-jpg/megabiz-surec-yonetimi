import { useState, type FormEvent } from 'react';
import { useAuth } from '../auth/AuthContext';
import { errorMessage } from '../components/feedback';
import { Brand, Preferences } from '../components/Layout';
import { Button, Field, TextInput } from '../components/ui';
import { useI18n } from '../i18n/I18nProvider';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../lib/demoData';

export function LoginPage() {
  const { signIn, api } = useAuth();
  const { t } = useI18n();
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
      setError(errorMessage(t, err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="-ml-4"><Brand /></div>
          <Preferences />
        </div>
        <form onSubmit={submit} className="card-shadow flex flex-col gap-4 rounded-2xl border border-line bg-surface p-6">
          <div>
            <h1 className="text-lg font-semibold">{t('app.title')}</h1>
            <p className="text-sm text-ink-3">{t('login.subtitle')}</p>
          </div>
          <Field label={t('login.email')}>
            {(id) => <TextInput id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />}
          </Field>
          <Field label={t('login.password')}>
            {(id) => <TextInput id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />}
          </Field>
          {error && <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">{error}</p>}
          <Button type="submit" variant="primary" disabled={busy}>{busy ? t('login.submitting') : t('login.submit')}</Button>
        </form>

        {api.mode === 'demo' && (
          <div className="mt-4 rounded-2xl border border-dashed border-line p-4 text-sm">
            <p className="mb-2 font-medium">{t('login.demoAccounts')} <span className="font-normal text-ink-3">{t('login.demoPassword', { password: DEMO_PASSWORD })}</span></p>
            <ul className="flex flex-col gap-1">
              {DEMO_ACCOUNTS.map((a) => (
                <li key={a.id}>
                  <button type="button" className="text-accent hover:underline" onClick={() => { setEmail(a.email); setPassword(DEMO_PASSWORD); }}>
                    {a.email}
                  </button>
                  <span className="text-ink-3"> — {t(`role.${a.role}`)}{a.role === 'user' ? ` ${t('login.noAccess')}` : ''}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
