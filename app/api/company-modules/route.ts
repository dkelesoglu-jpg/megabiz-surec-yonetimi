import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, writeAudit } from "../../../db/authorization";
import { moduleList } from "../../../db/modules";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    const { data: saved } = await getDb().from("company_modules").select("*").eq("company_id", companyId);
    return Response.json({
      modules: moduleList.map((module) => ({
        module,
        enabled: (saved ?? []).find((x) => x.module === module)?.enabled ?? true,
      })),
      canManage: ["super_admin", "company_admin"].includes(access.role),
    });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    if (!["super_admin", "company_admin"].includes(access.role)) return Response.json({ error: "MODULE_MANAGEMENT_DENIED" }, { status: 403 });
    const p = await request.json() as Record<string, unknown>, module = String(p.module || "");
    if (!moduleList.includes(module)) return Response.json({ error: "Geçersiz modül" }, { status: 400 });
    const now = new Date().toISOString();
    const { data: row, error } = await getDb()
      .from("company_modules")
      .upsert({ company_id: companyId, module, enabled: Boolean(p.enabled), updated_at: now }, { onConflict: "company_id,module" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPSERT", "company_module", row.id, null, row);
    return Response.json({ module: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}
