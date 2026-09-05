import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, writeAudit } from "../../../db/authorization";
import { assertRoleAssignmentAllowed, ASSIGNABLE_ROLES } from "../../../db/role-assignment";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    if (access.role === "employee") return Response.json({ error: "USER_ACCESS_DENIED" }, { status: 403 });
    const db = getDb();
    const { data: memberships } = await db.from("company_memberships").select("user_email, role").eq("company_id", companyId);
    const emails = (memberships ?? []).map((m) => m.user_email);
    if (emails.length === 0) return Response.json({ users: [] });
    const { data: appUsers } = await db.from("app_users").select("email, full_name, status").in("email", emails);
    const byEmail = new Map((appUsers ?? []).map((u) => [u.email, u]));
    const users = (memberships ?? []).map((m) => {
      const u = byEmail.get(m.user_email);
      return { email: m.user_email, fullName: u?.full_name ?? null, status: u?.status ?? null, role: m.role };
    });
    return Response.json({ users });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    if (!["super_admin", "company_admin", "hr"].includes(access.role)) return Response.json({ error: "USER_MANAGEMENT_DENIED" }, { status: 403 });
    const p = await request.json() as Record<string, unknown>, email = String(p.email || "").trim().toLowerCase(),
      fullName = String(p.fullName || "").trim(), role = String(p.role || "employee");
    if (!email || !email.includes("@")) return Response.json({ error: "Geçerli e-posta giriniz" }, { status: 400 });
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return Response.json({ error: "Geçersiz rol" }, { status: 400 });
    const db = getDb(), now = new Date().toISOString();
    const [{ data: existingUser }, { data: existingMembership }] = await Promise.all([
      db.from("app_users").select("email, platform_role").eq("email", email).maybeSingle(),
      db.from("company_memberships").select("*").eq("company_id", companyId).eq("user_email", email).maybeSingle(),
    ]);
    const currentRole = existingUser?.platform_role === "super_admin" ? "super_admin" : existingMembership?.role ?? "employee";
    assertRoleAssignmentAllowed({ actorEmail: access.email, actorRole: access.role, targetEmail: email, targetCurrentRole: currentRole, requestedRole: role });

    const { error: insertError } = await db.from("app_users").insert({ email, full_name: fullName, platform_role: "user", created_at: now });
    if (insertError) await db.from("app_users").update({ full_name: fullName, status: "Aktif" }).eq("email", email);
    if (role === "super_admin") await db.from("app_users").update({ platform_role: "super_admin" }).eq("email", email);
    else if (existingUser?.platform_role === "super_admin") await db.from("app_users").update({ platform_role: "user" }).eq("email", email);
    const membershipRole = role === "super_admin" ? "company_admin" : role;
    const { data: insertedMember, error: memberInsertError } = await db.from("company_memberships")
      .insert({ company_id: companyId, user_email: email, role: membershipRole, created_at: now }).select().single();
    let member = insertedMember;
    if (memberInsertError) {
      const { data: updatedMember, error: updateError } = await db.from("company_memberships")
        .update({ role: membershipRole, status: "Aktif" }).eq("company_id", companyId).eq("user_email", email).select().single();
      if (updateError) throw new Error(updateError.message);
      member = updatedMember;
    }
    await writeAudit(access, "UPSERT", "company_membership", member.id, null, { email, fullName, role });
    return Response.json({ user: { email, fullName, role } }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true),
      p = await request.json() as Record<string, unknown>, email = String(p.email || "").trim().toLowerCase(), role = String(p.role || "");
    if (!["super_admin", "company_admin", "hr"].includes(access.role)) return Response.json({ error: "USER_MANAGEMENT_DENIED" }, { status: 403 });
    if (!(ASSIGNABLE_ROLES as readonly string[]).includes(role)) return Response.json({ error: "Geçersiz rol" }, { status: 400 });
    const db = getDb();
    const [{ data: old }, { data: targetUser }] = await Promise.all([
      db.from("company_memberships").select("*").eq("company_id", companyId).eq("user_email", email).maybeSingle(),
      db.from("app_users").select("email, platform_role").eq("email", email).maybeSingle(),
    ]);
    const currentRole = targetUser?.platform_role === "super_admin" ? "super_admin" : old?.role ?? "employee";
    assertRoleAssignmentAllowed({ actorEmail: access.email, actorRole: access.role, targetEmail: email, targetCurrentRole: currentRole, requestedRole: role });
    if (role === "super_admin") await db.from("app_users").update({ platform_role: "super_admin" }).eq("email", email);
    else if (targetUser?.platform_role === "super_admin") await db.from("app_users").update({ platform_role: "user" }).eq("email", email);
    const membershipRole = role === "super_admin" ? "company_admin" : role;
    await db.from("company_memberships").update({ role: membershipRole }).eq("company_id", companyId).eq("user_email", email);
    await writeAudit(access, "UPDATE", "company_membership", old?.id, old, { ...old, role });
    return Response.json({ ok: true });
  } catch (e) { return accessError(e); }
}
