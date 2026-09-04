import { getDb } from "../../../db";
import { accessError, requireAccess } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url), companyId = url.searchParams.get("company") || "mega-global-energy",
      access = await requireAccess(request, companyId);
    if (access.role === "employee") return Response.json({ error: "AUDIT_ACCESS_DENIED" }, { status: 403 });
    const entity = url.searchParams.get("entity");
    let query = getDb().from("audit_logs").select("*").eq("company_id", companyId);
    if (entity) query = query.eq("entity_type", entity);
    const { data: logs } = await query.order("created_at", { ascending: false }).limit(100);
    return Response.json({ logs: camelizeKeys(logs ?? []) });
  } catch (e) { return accessError(e); }
}
