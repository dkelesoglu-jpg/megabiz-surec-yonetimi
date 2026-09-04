import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

const company = getCompanyId;

export async function GET(request: Request) {
  try {
    const companyId = company(request), module = new URL(request.url).searchParams.get("module");
    await requireAccess(request, companyId);
    let query = getDb().from("module_records").select("*").eq("company_id", companyId);
    if (module) query = query.eq("module", module);
    const { data } = await query.order("title", { ascending: true });
    return Response.json({ records: camelizeKeys(data ?? []) });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = company(request), access = await requireAccess(request, companyId, true),
      p = await request.json() as Record<string, unknown>;
    if (!p.module || !p.title) return Response.json({ error: "Modül ve kayıt adı zorunludur" }, { status: 400 });
    const now = new Date().toISOString(),
      target = Number(p.targetValue || 0), actual = Number(p.actualValue || 0), weight = Number(p.weight || 0),
      score = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : Number(p.score || 0);
    const { data: row, error } = await getDb()
      .from("module_records")
      .insert({
        company_id: companyId,
        module: String(p.module),
        title: String(p.title),
        owner: String(p.owner || ""),
        department: String(p.department || ""),
        due_date: String(p.dueDate || ""),
        status: String(p.status || "Aktif"),
        progress: Number(p.progress || score || 0),
        description: String(p.description || ""),
        period: String(p.period || ""),
        evaluator: String(p.evaluator || ""),
        metric: String(p.metric || ""),
        target_value: target,
        actual_value: actual,
        weight,
        score,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "CREATE", "module_record", row.id, null, row);
    return Response.json({ record: camelizeKeys(row) }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = company(request), access = await requireAccess(request, companyId, true),
      p = await request.json() as Record<string, unknown>, id = Number(p.id);
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });
    const db = getDb();
    const { data: old } = await db.from("module_records").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    const target = Number(p.targetValue || 0), actual = Number(p.actualValue || 0),
      score = target > 0 ? Math.min(100, Math.round((actual / target) * 100)) : Number(p.score || 0);
    const { data: row, error } = await db
      .from("module_records")
      .update({
        title: String(p.title || ""),
        owner: String(p.owner || ""),
        department: String(p.department || ""),
        due_date: String(p.dueDate || ""),
        status: String(p.status || "Aktif"),
        progress: Number(p.progress || score || 0),
        description: String(p.description || ""),
        period: String(p.period || ""),
        evaluator: String(p.evaluator || ""),
        metric: String(p.metric || ""),
        target_value: target,
        actual_value: actual,
        weight: Number(p.weight || 0),
        score,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPDATE", "module_record", id, old, row);
    return Response.json({ record: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}

export async function DELETE(request: Request) {
  try {
    const companyId = company(request), access = await requireAccess(request, companyId, true),
      id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });
    const db = getDb();
    const { data: old } = await db.from("module_records").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    await requireModuleAccess(access, old.module, true);
    await db.from("module_records").delete().eq("id", id).eq("company_id", companyId);
    await writeAudit(access, "DELETE", "module_record", id, old, null);
    return Response.json({ ok: true });
  } catch (e) { return accessError(e); }
}
