import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, writeAudit } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

const modules = ["Genel Bakış", "Organizasyon", "Personel", "Performans", "KPI & Hedefler", "İş Analizleri", "Görev Tanımları", "İş Talimatları", "İzin & Devam", "Eğitim & Oryantasyon", "Zimmet Yönetimi", "Belge / Evrak Takibi", "Raporlar", "Yasal Haklar", "Bordro Detayları", "Ücret / Maliyet / Bütçe", "Borç & Avans"];

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    if (!["super_admin", "company_admin", "hr"].includes(access.role)) return Response.json({ error: "PERMISSION_ACCESS_DENIED" }, { status: 403 });
    const { data } = await getDb().from("role_module_permissions").select("*").eq("company_id", companyId);
    return Response.json({ modules, permissions: camelizeKeys(data ?? []) });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    if (!["super_admin", "company_admin"].includes(access.role)) return Response.json({ error: "PERMISSION_MANAGEMENT_DENIED" }, { status: 403 });
    const p = await request.json() as Record<string, unknown>, role = String(p.role || ""), module = String(p.module || "");
    if (!["hr", "manager", "employee", "payroll"].includes(role) || !modules.includes(module)) return Response.json({ error: "Geçersiz rol veya modül" }, { status: 400 });
    const now = new Date().toISOString();
    const canView = Boolean(p.canView), canEdit = Boolean(p.canEdit) && canView;
    const { data: row, error } = await getDb()
      .from("role_module_permissions")
      .upsert({ company_id: companyId, role, module, can_view: canView, can_edit: canEdit, updated_at: now }, { onConflict: "company_id,role,module" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPSERT", "module_permission", row.id, null, row);
    return Response.json({ permission: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}
