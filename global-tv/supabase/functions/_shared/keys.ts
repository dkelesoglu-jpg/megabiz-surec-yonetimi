// Supabase API anahtarları. Yeni anahtarlar (sb_publishable_ / sb_secret_) Edge Functions ortamına
// SUPABASE_PUBLISHABLE_KEYS / SUPABASE_SECRET_KEYS adıyla JSON olarak gelir. Eski JWT anahtarları
// (SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY) 2026 sonunda kapanacağı için yalnızca yedek olarak okunur.
function fromJson(name: string): string | undefined {
  const raw = Deno.env.get(name);
  if (!raw) return undefined;
  try {
    return (JSON.parse(raw) as Record<string, string>)['default'];
  } catch {
    return undefined;
  }
}

export const supabaseUrl = (): string => Deno.env.get('SUPABASE_URL')!;

export function secretKey(): string {
  const key = fromJson('SUPABASE_SECRET_KEYS') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!key) throw new Error('Sunucu anahtarı tanımlı değil');
  return key;
}

export function publishableKey(): string {
  const key = fromJson('SUPABASE_PUBLISHABLE_KEYS') ?? Deno.env.get('SUPABASE_ANON_KEY');
  if (!key) throw new Error('Yayınlanabilir anahtar tanımlı değil');
  return key;
}
