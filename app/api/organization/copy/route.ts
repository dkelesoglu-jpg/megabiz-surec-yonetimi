import { getDb } from "../../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit } from "../../../../db/authorization";
import { nextNumber } from "../../../../db/number-series";
import { camelizeKeys } from "../../../../db/case";

type Policy = "skip" | "use" | "update";
const key = (value: string) => value.trim().toLocaleLowerCase("tr");

export async function GET(request: Request) {
  try {
    const url = new URL(request.url), targetCompanyId = getCompanyId(request), sourceCompanyId = String(url.searchParams.get("sourceCompanyId") || "");
    const targetAccess = await requireAccess(request, targetCompanyId);
    await requireModuleAccess(targetAccess, "Organizasyon");
    if (!sourceCompanyId) return Response.json({ error: "Kaynak şirket seçilmelidir" }, { status: 400 });
    const sourceAccess = await requireAccess(request, sourceCompanyId);
    await requireModuleAccess(sourceAccess, "Organizasyon");
    const db = getDb();
    const [companyRes, deptRes, posRes] = await Promise.all([
      db.from("companies").select("*").eq("id", sourceCompanyId).limit(1),
      db.from("departments").select("*").eq("company_id", sourceCompanyId).order("name", { ascending: true }),
      db.from("positions").select("*").eq("company_id", sourceCompanyId).order("title", { ascending: true }),
    ]);
    if (!(companyRes.data ?? []).length) return Response.json({ error: "Kaynak şirket bulunamadı" }, { status: 404 });
    return Response.json({
      company: camelizeKeys(companyRes.data![0]),
      departments: camelizeKeys(deptRes.data ?? []),
      positions: camelizeKeys(posRes.data ?? []),
    });
  } catch (error) { return accessError(error); }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json() as Record<string, unknown>,
      sourceCompanyId = String(payload.sourceCompanyId || ""),
      targetCompanyId = String(payload.targetCompanyId || getCompanyId(request)),
      policy = (["skip", "use", "update"].includes(String(payload.policy)) ? String(payload.policy) : "skip") as Policy;
    if (!sourceCompanyId || !targetCompanyId || sourceCompanyId === targetCompanyId)
      return Response.json({ error: "Kaynak ve hedef şirketler farklı olmalıdır" }, { status: 400 });
    const targetAccess = await requireAccess(request, targetCompanyId, true);
    await requireModuleAccess(targetAccess, "Organizasyon", true);
    const sourceAccess = await requireAccess(request, sourceCompanyId);
    await requireModuleAccess(sourceAccess, "Organizasyon");
    const selectedDepartmentIds = Array.isArray(payload.departmentIds) ? payload.departmentIds.map(Number).filter(Boolean) : [];
    const selectedPositionIds = Array.isArray(payload.positionIds) ? payload.positionIds.map(Number).filter(Boolean) : [];
    const includeAllDepartments = Boolean(payload.includeAllDepartments), includePositions = Boolean(payload.includePositions);
    const db = getDb(), now = new Date().toISOString();
    const [srcDeptRes, srcPosRes, tgtDeptRes, tgtPosRes] = await Promise.all([
      db.from("departments").select("*").eq("company_id", sourceCompanyId),
      db.from("positions").select("*").eq("company_id", sourceCompanyId),
      db.from("departments").select("*").eq("company_id", targetCompanyId),
      db.from("positions").select("*").eq("company_id", targetCompanyId),
    ]);
    const sourceDepartments = camelizeKeys(srcDeptRes.data ?? []),
      sourcePositions = camelizeKeys(srcPosRes.data ?? []),
      targetDepartments = camelizeKeys(tgtDeptRes.data ?? []),
      targetPositions = camelizeKeys(tgtPosRes.data ?? []);

    let pickedDepartments = sourceDepartments.filter((d) => includeAllDepartments || selectedDepartmentIds.includes(d.id));
    if (includePositions) {
      const positionDepartmentIds = new Set(
        sourcePositions.filter((p) => !selectedPositionIds.length || selectedPositionIds.includes(p.id)).map((p) => p.departmentId),
      );
      pickedDepartments = sourceDepartments.filter((d) => pickedDepartments.some((x) => x.id === d.id) || positionDepartmentIds.has(d.id));
    }
    const departmentMap = new Map<number, number>(), createdDepartments: number[] = [], updatedDepartments: number[] = [], skippedDepartments: string[] = [];
    for (const source of pickedDepartments) {
      const existing = targetDepartments.find((d) => key(d.name) === key(source.name));
      if (existing) {
        departmentMap.set(source.id, existing.id);
        skippedDepartments.push(source.name);
        if (policy === "update") {
          await db.from("departments").update({ manager_name: source.managerName, status: source.status, updated_at: now }).eq("id", existing.id).eq("company_id", targetCompanyId);
          updatedDepartments.push(existing.id);
        }
        continue;
      }
      const { data: row, error } = await db
        .from("departments")
        .insert({
          company_id: targetCompanyId,
          name: source.name,
          code: await nextNumber(targetCompanyId, "department"),
          parent_department_id: null,
          manager_name: source.managerName,
          status: source.status,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const camelRow = camelizeKeys(row);
      targetDepartments.push(camelRow);
      departmentMap.set(source.id, camelRow.id);
      createdDepartments.push(camelRow.id);
    }
    for (const source of pickedDepartments) {
      const targetId = departmentMap.get(source.id), parentId = source.parentDepartmentId ? departmentMap.get(source.parentDepartmentId) : undefined;
      if (targetId && parentId) await db.from("departments").update({ parent_department_id: parentId, updated_at: now }).eq("id", targetId).eq("company_id", targetCompanyId);
    }
    const pickedDepartmentIds = new Set(pickedDepartments.map((d) => d.id));
    const pickedPositions = includePositions
      ? sourcePositions.filter((p) => pickedDepartmentIds.has(p.departmentId) && (!selectedPositionIds.length || selectedPositionIds.includes(p.id)))
      : [];
    const positionMap = new Map<number, number>(), createdPositions: number[] = [], updatedPositions: number[] = [], skippedPositions: string[] = [];
    for (const source of pickedPositions) {
      const departmentId = departmentMap.get(source.departmentId);
      if (!departmentId) continue;
      const existing = targetPositions.find((p) => p.departmentId === departmentId && key(p.title) === key(source.title));
      if (existing) {
        positionMap.set(source.id, existing.id);
        skippedPositions.push(source.title);
        if (policy === "update") {
          await db.from("positions").update({ level: source.level, status: source.status, updated_at: now }).eq("id", existing.id).eq("company_id", targetCompanyId);
          updatedPositions.push(existing.id);
        }
        continue;
      }
      const { data: row, error } = await db
        .from("positions")
        .insert({
          company_id: targetCompanyId,
          department_id: departmentId,
          title: source.title,
          code: await nextNumber(targetCompanyId, "position"),
          reports_to_id: null,
          level: source.level,
          status: source.status,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      const camelRow = camelizeKeys(row);
      targetPositions.push(camelRow);
      positionMap.set(source.id, camelRow.id);
      createdPositions.push(camelRow.id);
    }
    for (const source of pickedPositions) {
      const targetId = positionMap.get(source.id), reportsToId = source.reportsToId ? positionMap.get(source.reportsToId) : undefined;
      if (targetId && reportsToId) await db.from("positions").update({ reports_to_id: reportsToId, updated_at: now }).eq("id", targetId).eq("company_id", targetCompanyId);
    }
    const summary = {
      departments: { created: createdDepartments.length, updated: updatedDepartments.length, existing: skippedDepartments.length },
      positions: { created: createdPositions.length, updated: updatedPositions.length, existing: skippedPositions.length },
      personnelCopied: 0,
    };
    await writeAudit(targetAccess, "COPY", "organization", targetCompanyId, null, { sourceCompanyId, targetCompanyId, policy, summary });
    return Response.json({
      ok: true,
      summary,
      warnings: [...skippedDepartments.map((name) => `Departman mevcut: ${name}`), ...skippedPositions.map((name) => `Pozisyon mevcut: ${name}`)],
    });
  } catch (error) { return accessError(error); }
}
