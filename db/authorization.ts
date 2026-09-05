import { getDb } from ".";
import { getAuthenticatedIdentity, type AuthenticatedIdentity } from "./supabase";
import { accessStatusForErrorMessage, loadTenantMembershipRole } from "./tenant-access";

export type Access = {
  email: string;
  fullName: string | null;
  role: string;
  companyId: string;
};

export function getCompanyId(request: Request) {
  const url = new URL(request.url),
    direct = url.searchParams.get("company") || request.headers.get("x-company-id");
  if (direct) return direct;
  const cookie = request.headers.get("cookie") || "",
    match = cookie.match(/(?:^|;\s*)mega_company=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "mega-global-energy";
}

async function identity(request: Request): Promise<AuthenticatedIdentity> {
  const who = await getAuthenticatedIdentity(request);
  return who ?? { email: "", fullName: null };
}

export async function requireAccess(
  request: Request,
  companyId: string,
  write = false,
): Promise<Access> {
  const who = await identity(request);
  if (!who.email) throw new Error("AUTH_REQUIRED");
  const db = getDb();

  let { data: user } = await db.from("app_users").select("*").eq("email", who.email).maybeSingle();

  if (!user) {
    const now = new Date().toISOString();
    const { data: inserted, error: insertError } = await db
      .from("app_users")
      .insert({ email: who.email, full_name: who.fullName, platform_role: "user", created_at: now })
      .select()
      .single();
    if (insertError) {
      // Muhtemel eşzamanlı istek: kayıt az önce oluşturuldu. full_name'i güncelleyip tekrar oku
      // (orijinal davranış: sadece full_name alanı conflict'te güncellenir).
      await db.from("app_users").update({ full_name: who.fullName }).eq("email", who.email);
      const { data: existing } = await db.from("app_users").select("*").eq("email", who.email).single();
      user = existing;
    } else {
      user = inserted;
    }
  }

  if (user.status !== "Aktif") throw new Error("ACCOUNT_DISABLED");
  if (user.platform_role === "super_admin") {
    return { ...who, email: who.email, role: "super_admin", companyId };
  }

  const role = await loadTenantMembershipRole(db, companyId, who.email);
  const access: Access = { ...who, email: who.email, role, companyId };
  const path = new URL(request.url).pathname;

  if (path.includes("/api/employees")) await requireModuleAccess(access, "Personel", write);
  if (path.includes("/api/records")) {
    let module = new URL(request.url).searchParams.get("module");
    if (!module && write) {
      try {
        module = String((await request.clone().json()).module || "");
      } catch {
        /* ignore */
      }
    }
    if (module) await requireModuleAccess(access, module, write);
  }
  return access;
}

export async function requireModuleAccess(access: Access, module: string, write = false) {
  if (access.role === "super_admin") return;
  const db = getDb();

  const { data: licensed } = await db
    .from("company_modules")
    .select("*")
    .eq("company_id", access.companyId)
    .eq("module", module)
    .maybeSingle();
  if (licensed && !licensed.enabled) throw new Error("MODULE_NOT_LICENSED");
  if (access.role === "company_admin") return;

  const { data: row } = await db
    .from("role_module_permissions")
    .select("*")
    .eq("company_id", access.companyId)
    .eq("role", access.role)
    .eq("module", module)
    .maybeSingle();
  if (row) {
    if (!row.can_view || (write && !row.can_edit)) throw new Error("MODULE_ACCESS_DENIED");
    return;
  }

  const defaults: Record<string, { view: boolean; edit: boolean }> = {
    hr: { view: true, edit: true },
    manager: {
      view: true,
      edit: ["Performans", "KPI & Hedefler", "İzin & Devam", "Eğitim & Oryantasyon", "Borç & Avans"].includes(
        module,
      ),
    },
    employee: {
      view: ["Personel", "Performans", "KPI & Hedefler", "İzin & Devam", "Eğitim & Oryantasyon", "Borç & Avans"].includes(
        module,
      ),
      edit: module === "Borç & Avans",
    },
    payroll: {
      view: ["Personel", "Bordro Detayları", "Ücret / Maliyet / Bütçe", "Yasal Haklar", "Raporlar", "Borç & Avans"].includes(
        module,
      ),
      edit: ["Bordro Detayları", "Ücret / Maliyet / Bütçe", "Yasal Haklar", "Borç & Avans"].includes(module),
    },
  };
  const d = defaults[access.role] || { view: false, edit: false };
  if (!d.view || (write && !d.edit)) throw new Error("MODULE_ACCESS_DENIED");
}

export async function writeAudit(
  access: Access,
  action: string,
  entityType: string,
  entityId: string | number | undefined,
  oldValue: unknown,
  newValue: unknown,
) {
  await getDb()
    .from("audit_logs")
    .insert({
      company_id: access.companyId,
      user_email: access.email,
      action,
      entity_type: entityType,
      entity_id: entityId == null ? null : String(entityId),
      old_value: oldValue == null ? null : JSON.stringify(oldValue),
      new_value: newValue == null ? null : JSON.stringify(newValue),
      created_at: new Date().toISOString(),
    });
}

export function accessError(error: unknown) {
  const m = error instanceof Error ? error.message : "UNKNOWN";
  const status = accessStatusForErrorMessage(m);
  return Response.json(
    { error: m === "ADVANCE_INVALID_STATE" ? "Bu işlem kaydın mevcut durumunda yapılamaz" : m },
    { status },
  );
}
