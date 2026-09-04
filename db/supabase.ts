import { env } from "cloudflare:workers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";

type WorkerEnv = {
  SUPABASE_URL?: string;
  // Yeni Supabase API key sistemi: "sb_secret_..." — eski JWT tabanlı
  // service_role anahtarının yerini alır. Sadece server-side kullanılır,
  // asla NEXT_PUBLIC_ önekiyle client'a sızdırılmaz.
  SUPABASE_SECRET_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

function workerEnv(): WorkerEnv {
  return env as unknown as WorkerEnv;
}

/**
 * Sunucu tarafı, "secret key" (sb_secret_...) ile çalışan Supabase istemcisi.
 * RLS'yi bypass eder — yetkilendirme app katmanında (db/authorization.ts) yapılır.
 * hrms_pro şemasını hedefler.
 */
export function getServiceClient(): SupabaseClient {
  const e = workerEnv();
  const url = e.SUPABASE_URL || e.NEXT_PUBLIC_SUPABASE_URL;
  const key = e.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL / SUPABASE_SECRET_KEY tanımlı değil. .dev.vars dosyasını kontrol edin.",
    );
  }
  return createClient(url, key, {
    db: { schema: "hrms_pro" },
    auth: { persistSession: false },
  });
}

function parseCookies(request: Request): { name: string; value: string }[] {
  const header = request.headers.get("cookie") || "";
  if (!header) return [];
  return header
    .split(";")
    .map((part) => {
      const idx = part.indexOf("=");
      if (idx === -1) return null;
      const name = part.slice(0, idx).trim();
      const value = decodeURIComponent(part.slice(idx + 1).trim());
      return name ? { name, value } : null;
    })
    .filter((c): c is { name: string; value: string } => c !== null);
}

/**
 * Gelen isteğin çerezlerinden Supabase Auth oturumunu okuyan, sunucu tarafı
 * (anon key ile) istemci. Sadece oturum doğrulama için kullanılır, veri
 * sorguları getServiceClient() ile yapılır.
 */
export function getRequestAuthClient(request: Request) {
  const e = workerEnv();
  const url = e.NEXT_PUBLIC_SUPABASE_URL || e.SUPABASE_URL;
  const anonKey = e.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY tanımlı değil.",
    );
  }
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => parseCookies(request),
      setAll: () => {
        // Route handler'larda sadece oturum okunuyor; cookie yenileme istemci
        // tarafındaki Supabase kütüphanesi tarafından yönetiliyor.
      },
    },
  });
}

export type AuthenticatedIdentity = { email: string; fullName: string | null };

function getPlatformIdentity(request: Request): AuthenticatedIdentity | null {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  if (!email) return null;

  const encodedFullName = request.headers.get("oai-authenticated-user-full-name");
  let fullName: string | null = null;
  if (
    encodedFullName &&
    request.headers.get("oai-authenticated-user-full-name-encoding") ===
      "percent-encoded-utf-8"
  ) {
    try {
      fullName = decodeURIComponent(encodedFullName);
    } catch {
      fullName = null;
    }
  }

  return { email, fullName };
}

/**
 * İsteğin Supabase Auth çerezinden doğrulanmış kullanıcıyı döndürür.
 * Önceki ChatGPT header tabanlı identity() fonksiyonunun yerini alır.
 */
export async function getAuthenticatedIdentity(
  request: Request,
): Promise<AuthenticatedIdentity | null> {
  const supabase = getRequestAuthClient(request);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user || !user.email) return getPlatformIdentity(request);
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.fullName as string | undefined) ||
    null;
  return { email: user.email.trim().toLowerCase(), fullName };
}
