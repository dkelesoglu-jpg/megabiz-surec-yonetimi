import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess } from "../../../db/authorization";
import { moduleList as modules } from "../../../db/modules";

export const dynamic = "force-dynamic";

function fallback(role: string, module: string) {
  if (["super_admin", "company_admin", "hr"].includes(role)) return { canView: true, canEdit: true };
  if (role === "manager")
    return {
      canView: true,
      canEdit: ["Performans", "KPI & Hedefler", "İzin & Devam", "Eğitim & Oryantasyon"].includes(module),
    };
  if (role === "employee")
    return {
      canView: ["Personel", "Performans", "KPI & Hedefler", "İzin & Devam", "Eğitim & Oryantasyon"].includes(module),
      canEdit: false,
    };
  if (role === "payroll")
    return {
      canView: ["Personel", "Bordro Detayları", "Ücret / Maliyet / Bütçe", "Yasal Haklar", "Raporlar"].includes(
        module,
      ),
      canEdit: ["Bordro Detayları", "Ücret / Maliyet / Bütçe", "Yasal Haklar"].includes(module),
    };
  return { canView: false, canEdit: false };
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId),
      db = getDb(),
      [{ data: custom }, { data: licensed }] = await Promise.all([
        db.from("role_module_permissions").select("*").eq("company_id", companyId).eq("role", access.role),
        db.from("company_modules").select("*").eq("company_id", companyId),
      ]);
    const permissions = modules.map((module) => {
      const active = access.role === "super_admin" || ((licensed ?? []).find((x) => x.module === module)?.enabled ?? true),
        p = (custom ?? []).find((x) => x.module === module),
        base = p ? { canView: p.can_view, canEdit: p.can_edit } : fallback(access.role, module);
      return { module, canView: active && base.canView, canEdit: active && base.canEdit, licensed: active };
    });
    return Response.json({ role: access.role, companyId, permissions });
  } catch (e) {
    return accessError(e);
  }
}
