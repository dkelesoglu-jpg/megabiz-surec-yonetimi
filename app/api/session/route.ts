import { getDb } from "../../../db";
import { getAuthenticatedIdentity } from "../../../db/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const who = await getAuthenticatedIdentity(request);
  if (!who) return Response.json({ error: "AUTH_REQUIRED" }, { status: 401 });

  const db = getDb();
  const now = new Date().toISOString();

  await db.from("companies").upsert(
    [
      { id: "megabiz", name: "Megabiz", sector: "Teknoloji", created_at: now },
      { id: "mega-global-energy", name: "Mega Global Energy", sector: "Enerji", created_at: now },
    ],
    { onConflict: "id", ignoreDuplicates: true },
  );

  let { data: user } = await db.from("app_users").select("*").eq("email", who.email).maybeSingle();

  if (!user) {
    const { count } = await db.from("app_users").select("*", { count: "exact", head: true });
    const role = (count ?? 0) === 0 ? "super_admin" : "user";
    const { data: inserted } = await db
      .from("app_users")
      .insert({ email: who.email, full_name: who.fullName ?? who.email, platform_role: role, created_at: now })
      .select()
      .single();
    user = inserted;
    if (role === "super_admin") {
      await db.from("company_memberships").upsert(
        [
          { company_id: "megabiz", user_email: who.email, role: "company_admin", created_at: now },
          { company_id: "mega-global-energy", user_email: who.email, role: "company_admin", created_at: now },
        ],
        { onConflict: "company_id,user_email", ignoreDuplicates: true },
      );
    }
  }

  let companiesList: Array<{ id: string; name: string; sector: string | null; status: string; created_at: string }>;
  if (user.platform_role === "super_admin") {
    const { data } = await db.from("companies").select("id, name, sector, status, created_at");
    companiesList = data ?? [];
  } else {
    const { data: memberships } = await db
      .from("company_memberships")
      .select("company_id")
      .eq("user_email", who.email);
    const ids = (memberships ?? []).map((m) => m.company_id);
    if (ids.length === 0) {
      companiesList = [];
    } else {
      const { data } = await db
        .from("companies")
        .select("id, name, sector, status, created_at")
        .in("id", ids);
      companiesList = data ?? [];
    }
  }

  return Response.json({
    user: { email: who.email, fullName: user.full_name, platformRole: user.platform_role },
    companies: companiesList.map((c) => ({
      id: c.id,
      name: c.name,
      sector: c.sector,
      status: c.status,
      createdAt: c.created_at,
    })),
  });
}
