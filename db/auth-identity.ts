export type AuthenticatedIdentity = { email: string; fullName: string | null };

type SupabaseAuthUser = {
  email?: string | null;
  user_metadata?: Record<string, unknown> | null;
};

type SupabaseAuth = {
  getUser(): Promise<{
    data: { user: SupabaseAuthUser | null };
    error: unknown;
  }>;
};

/**
 * API kimliğini yalnızca Supabase'in doğruladığı kullanıcıdan üretir.
 * Request parametresi platform header'larının kimlik kaynağı olmadığını açık
 * tutmak için alınır; hiçbir header değeri okunmaz.
 */
export async function getSupabaseIdentity(
  auth: SupabaseAuth,
  _request: Pick<Request, "headers">,
): Promise<AuthenticatedIdentity | null> {
  try {
    const {
      data: { user },
      error,
    } = await auth.getUser();

    const email = user?.email?.trim();
    if (error || !user || !email) return null;

    const metadataName = user.user_metadata?.full_name ?? user.user_metadata?.fullName;
    const fullName = typeof metadataName === "string" ? metadataName : null;

    return { email: email.toLowerCase(), fullName };
  } catch {
    return null;
  }
}
