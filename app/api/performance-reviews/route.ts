import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit } from "../../../db/authorization";
import { nextNumber } from "../../../db/number-series";
import { camelizeKeys } from "../../../db/case";

function score(p: Record<string, unknown>) {
  const competency = Math.max(0, Math.min(100, Number(p.competencyScore || 0))),
    kpi = Math.max(0, Math.min(100, Number(p.kpiScore || 0))),
    goal = Math.max(0, Math.min(100, Number(p.goalScore || 0))),
    overall = Math.round(competency * 0.3 + kpi * 0.4 + goal * 0.3),
    result =
      overall >= 90 ? "A Grubu – Üstün Performans" :
      overall >= 80 ? "B Grubu – Beklentinin Üzerinde" :
      overall >= 70 ? "C Grubu – Beklentiyi Karşılıyor" :
      overall >= 60 ? "D Grubu – Gelişim Gerekli" : "E Grubu – Yetersiz Performans";
  return { competency, kpi, goal, overall, result };
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Performans");
    const db = getDb();
    const [r, e] = await Promise.all([
      db.from("performance_reviews").select("*").eq("company_id", companyId).order("updated_at", { ascending: false }),
      db.from("employees").select("id, first_name, last_name, department, position, status").eq("company_id", companyId),
    ]);
    return Response.json({ reviews: camelizeKeys(r.data ?? []), employees: camelizeKeys(e.data ?? []) });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Performans", true);
    const p = await request.json() as Record<string, unknown>;
    if (!p.employeeId || !p.period || !p.evaluator) return Response.json({ error: "Çalışan, dönem ve değerlendirici zorunludur" }, { status: 400 });
    const s = score(p), now = new Date().toISOString(), reviewNo = await nextNumber(companyId, "performance_review");
    const { data: row, error } = await getDb()
      .from("performance_reviews")
      .insert({
        company_id: companyId,
        review_no: reviewNo,
        employee_id: Number(p.employeeId),
        period: String(p.period),
        evaluator: String(p.evaluator),
        competency_score: s.competency,
        kpi_score: s.kpi,
        goal_score: s.goal,
        overall_score: s.overall,
        result: s.result,
        outcome: String(p.outcome || "Gelişim Planı"),
        manager_note: String(p.managerNote || ""),
        status: String(p.status || "Taslak"),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "CREATE", "performance_review", row.id, null, row);
    return Response.json({ review: camelizeKeys(row) }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Performans", true);
    const p = await request.json() as Record<string, unknown>, id = Number(p.id);
    const db = getDb();
    const { data: old } = await db.from("performance_reviews").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Değerlendirme bulunamadı" }, { status: 404 });
    const s = score(p);
    const { data: row, error } = await db
      .from("performance_reviews")
      .update({
        employee_id: Number(p.employeeId || old.employee_id),
        period: String(p.period || old.period),
        evaluator: String(p.evaluator || old.evaluator),
        competency_score: s.competency,
        kpi_score: s.kpi,
        goal_score: s.goal,
        overall_score: s.overall,
        result: s.result,
        outcome: String(p.outcome || old.outcome),
        manager_note: String(p.managerNote ?? old.manager_note ?? ""),
        status: String(p.status || old.status),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPDATE", "performance_review", id, old, row);
    return Response.json({ review: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Performans", true);
    const id = Number(new URL(request.url).searchParams.get("id"));
    const db = getDb();
    const { data: old } = await db.from("performance_reviews").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Değerlendirme bulunamadı" }, { status: 404 });
    await db.from("performance_reviews").delete().eq("id", id).eq("company_id", companyId);
    await writeAudit(access, "DELETE", "performance_review", id, old, null);
    return Response.json({ ok: true });
  } catch (e) { return accessError(e); }
}
