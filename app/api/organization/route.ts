import { getDb } from "../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  requireModuleAccess,
  writeAudit,
} from "../../../db/authorization";
import { nextNumber } from "../../../db/number-series";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Organizasyon");
    const group = new URL(request.url).searchParams.get("scope") === "group";
    if (group && access.role !== "super_admin")
      return Response.json({ error: "Grup organizasyon şeması için Süper Admin yetkisi gerekir" }, { status: 403 });
    const db = getDb();
    const { data: companyRows } = await db.from("companies").select("*").order("name", { ascending: true });
    let deptQuery = db.from("departments").select("*").order("name", { ascending: true });
    let posQuery = db.from("positions").select("*").order("title", { ascending: true });
    let empQuery = db
      .from("employees")
      .select(
        "id, company_id, first_name, last_name, department_id, department, position, manager, second_manager, acting_manager, delegation_start, delegation_end, employee_no, employee_type, email, position_id, start_date, end_date, status",
      );
    if (!group) {
      deptQuery = deptQuery.eq("company_id", companyId);
      posQuery = posQuery.eq("company_id", companyId);
      empQuery = empQuery.eq("company_id", companyId);
    }
    const [d, p, e] = await Promise.all([deptQuery, posQuery, empQuery]);
    return Response.json({
      companies: camelizeKeys(companyRows ?? []),
      departments: camelizeKeys(d.data ?? []),
      positions: camelizeKeys(p.data ?? []),
      employees: camelizeKeys(e.data ?? []),
      group,
    });
  } catch (e) {
    return accessError(e);
  }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Organizasyon", true);
    const db = getDb();
    const p = (await request.json()) as Record<string, unknown>,
      kind = String(p.kind || ""),
      now = new Date().toISOString();

    if (kind === "move_department") {
      const sourceDepartmentId = Number(p.sourceDepartmentId),
        targetDepartmentId = Number(p.targetDepartmentId);
      if (!sourceDepartmentId || !targetDepartmentId || sourceDepartmentId === targetDepartmentId)
        return Response.json({ error: "Kaynak ve hedef departman farklı seçilmelidir" }, { status: 400 });
      const { data: source } = await db.from("departments").select("*").eq("id", sourceDepartmentId).eq("company_id", companyId).maybeSingle();
      const { data: target } = await db.from("departments").select("*").eq("id", targetDepartmentId).eq("company_id", companyId).maybeSingle();
      if (!source || !target) return Response.json({ error: "Şirkete ait kaynak veya hedef departman bulunamadı" }, { status: 404 });

      const { data: employeeRows } = await db
        .from("employees")
        .select("*")
        .eq("company_id", companyId)
        .or(`department_id.eq.${source.id},department.eq.${source.name}`);
      const { data: positionRows } = await db.from("positions").select("*").eq("company_id", companyId).eq("department_id", source.id);
      const { data: childRows } = await db.from("departments").select("*").eq("company_id", companyId).eq("parent_department_id", source.id);

      await db
        .from("employees")
        .update({ department_id: target.id, department: target.name, updated_at: now })
        .eq("company_id", companyId)
        .or(`department_id.eq.${source.id},department.eq.${source.name}`);
      await db.from("positions").update({ department_id: target.id, updated_at: now }).eq("company_id", companyId).eq("department_id", source.id);
      await db
        .from("departments")
        .update({ parent_department_id: target.id, updated_at: now })
        .eq("company_id", companyId)
        .eq("parent_department_id", source.id);
      await db.from("departments").delete().eq("id", source.id).eq("company_id", companyId);

      const summary = {
        employees: (employeeRows ?? []).length,
        positions: (positionRows ?? []).length,
        children: (childRows ?? []).length,
      };
      await writeAudit(access, "MOVE_DELETE", "department", source.id, source, { targetDepartmentId: target.id, summary });
      return Response.json({ ok: true, summary, target: camelizeKeys(target) });
    }

    if (kind === "department") {
      const name = String(p.name || "").trim(),
        code = await nextNumber(companyId, "department");
      if (!name) return Response.json({ error: "Departman adı zorunludur" }, { status: 400 });
      const { data: row, error } = await db
        .from("departments")
        .insert({
          company_id: companyId,
          name,
          code,
          parent_department_id: p.parentDepartmentId ? Number(p.parentDepartmentId) : null,
          manager_name: String(p.managerName || ""),
          status: String(p.status || "Aktif"),
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "department", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }

    if (kind === "position") {
      const title = String(p.title || "").trim(),
        code = await nextNumber(companyId, "position"),
        departmentId = Number(p.departmentId);
      if (!title || !departmentId) return Response.json({ error: "Pozisyon ve departman zorunludur" }, { status: 400 });
      const { data: row, error } = await db
        .from("positions")
        .insert({
          company_id: companyId,
          title,
          code,
          department_id: departmentId,
          reports_to_id: p.reportsToId ? Number(p.reportsToId) : null,
          level: String(p.level || "Uzman"),
          status: String(p.status || "Aktif"),
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "position", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }
    return Response.json({ error: "Geçersiz kayıt türü" }, { status: 400 });
  } catch (e) {
    return accessError(e);
  }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Organizasyon", true);
    const db = getDb();
    const p = (await request.json()) as Record<string, unknown>,
      kind = String(p.kind || ""),
      id = Number(p.id),
      now = new Date().toISOString();
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });

    if (kind === "department") {
      const { data: old } = await db.from("departments").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      if (!old) return Response.json({ error: "Departman bulunamadı" }, { status: 404 });
      const { data: row, error } = await db
        .from("departments")
        .update({
          name: String(p.name || old.name),
          code: old.code,
          parent_department_id: p.parentDepartmentId ? Number(p.parentDepartmentId) : null,
          manager_name: String(p.managerName ?? old.manager_name ?? ""),
          status: String(p.status || old.status),
          updated_at: now,
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await db
        .from("employees")
        .update({ department_id: row.id, department: row.name, updated_at: now })
        .eq("company_id", companyId)
        .or(`department_id.eq.${id},department.eq.${old.name}`);
      await writeAudit(access, "UPDATE", "department", id, old, row);
      return Response.json({ record: camelizeKeys(row) });
    }

    if (kind === "position") {
      const { data: old } = await db.from("positions").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      if (!old) return Response.json({ error: "Pozisyon bulunamadı" }, { status: 404 });
      const { data: row, error } = await db
        .from("positions")
        .update({
          title: String(p.title || old.title),
          code: old.code,
          department_id: Number(p.departmentId || old.department_id),
          reports_to_id: p.reportsToId ? Number(p.reportsToId) : null,
          level: String(p.level || old.level),
          status: String(p.status || old.status),
          updated_at: now,
        })
        .eq("id", id)
        .eq("company_id", companyId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      const { data: targetDepartment } = await db.from("departments").select("*").eq("id", row.department_id).eq("company_id", companyId).maybeSingle();
      if (targetDepartment)
        await db
          .from("employees")
          .update({ department_id: targetDepartment.id, department: targetDepartment.name, position: row.title, updated_at: now })
          .eq("company_id", companyId)
          .eq("department_id", old.department_id)
          .eq("position", old.title);
      await writeAudit(access, "UPDATE", "position", id, old, row);
      return Response.json({ record: camelizeKeys(row) });
    }
    return Response.json({ error: "Geçersiz kayıt türü" }, { status: 400 });
  } catch (e) {
    return accessError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Organizasyon", true);
    const db = getDb();
    const u = new URL(request.url),
      kind = u.searchParams.get("kind"),
      id = Number(u.searchParams.get("id"));
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });

    if (kind === "department") {
      const { data: old } = await db.from("departments").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      if (!old) return Response.json({ error: "Departman bulunamadı" }, { status: 404 });
      const [usedPosition, usedEmployee, child] = await Promise.all([
        db.from("positions").select("id, title").eq("company_id", companyId).eq("department_id", id),
        db
          .from("employees")
          .select("id, first_name, last_name, employee_no")
          .eq("company_id", companyId)
          .or(`department_id.eq.${id},department.eq.${old.name}`),
        db.from("departments").select("id, name").eq("company_id", companyId).eq("parent_department_id", id),
      ]);
      if ((usedPosition.data ?? []).length || (usedEmployee.data ?? []).length || (child.data ?? []).length)
        return Response.json(
          {
            error: "Bu departmana bağlı kayıtlar bulunmaktadır.",
            code: "department_in_use",
            dependencies: {
              employees: camelizeKeys(usedEmployee.data ?? []),
              positions: camelizeKeys(usedPosition.data ?? []),
              children: camelizeKeys(child.data ?? []),
            },
          },
          { status: 409 },
        );
      await db.from("departments").delete().eq("id", id).eq("company_id", companyId);
      await writeAudit(access, "DELETE", "department", id, old, null);
      return Response.json({ ok: true });
    }

    if (kind === "position") {
      const { data: old } = await db.from("positions").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      await db.from("positions").delete().eq("id", id).eq("company_id", companyId);
      await writeAudit(access, "DELETE", "position", id, old, null);
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Geçersiz kayıt türü" }, { status: 400 });
  } catch (e) {
    return accessError(e);
  }
}
