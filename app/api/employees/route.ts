import { getDb } from "../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  writeAudit,
} from "../../../db/authorization";
import { parseTrMoney } from "../../tr-money";
import { nextNumber } from "../../../db/number-series";
import { camelizeKeys, snakeizeKeys } from "../../../db/case";
import { listEmployeesForAccess } from "../../../db/employee-access";
import { upsertGatedEmployeeFields } from "../../../db/employee-access";

const required = [
  "firstName",
  "lastName",
  "nationalId",
  "departmentId",
  "position",
  "startDate",
] as const;
const company = getCompanyId;

export async function GET(request: Request) {
  try {
    const id = company(request);
    const access = await requireAccess(request, id);
    const requestedId = Number(new URL(request.url).searchParams.get("id"));
    const db = getDb();
    const rows = await listEmployeesForAccess(db, id, access, requestedId || undefined);
    return Response.json({
      employees: rows,
      employee: requestedId ? rows[0] || null : undefined,
    });
  } catch (e) {
    return accessError(e);
  }
}

export async function POST(request: Request) {
  try {
    const companyId = company(request),
      access = await requireAccess(request, companyId, true),
      p = (await request.json()) as Record<string, unknown>;
    for (const k of required)
      if (!String(p[k] || "").trim())
        return Response.json({ error: `${k} zorunludur` }, { status: 400 });
    const db = getDb();
    const departmentId = Number(p.departmentId);
    const { data: department } = departmentId
      ? await db
          .from("departments")
          .select("*")
          .eq("id", departmentId)
          .eq("company_id", companyId)
          .eq("status", "Aktif")
          .maybeSingle()
      : { data: null };
    if (!department)
      return Response.json(
        { error: "Aktif şirkete ait geçerli bir departman seçmelisiniz" },
        { status: 400 },
      );
    const { data: position } = await db
      .from("positions")
      .select("*")
      .eq("company_id", companyId)
      .eq("department_id", department.id)
      .eq("title", String(p.position))
      .eq("status", "Aktif")
      .maybeSingle();
    if (!position)
      return Response.json(
        { error: "Seçilen departmana ait geçerli bir pozisyon seçmelisiniz" },
        { status: 400 },
      );
    const now = new Date().toISOString(),
      employeeNo = await nextNumber(companyId, "employee");
    const insertValues = snakeizeKeys({
      ...p,
      companyId,
      firstName: String(p.firstName),
      lastName: String(p.lastName),
      nationalId: String(p.nationalId),
      employeeNo,
      departmentId: department.id,
      department: department.name,
      positionId: position.id,
      position: position.title,
      startDate: String(p.startDate),
      salary: parseTrMoney(p.salary),
      netSalary: parseTrMoney(p.netSalary),
      weeklyHours: p.weeklyHours ? Number(p.weeklyHours) : null,
      salaryBasis: String(p.salaryBasis || "Brüt"),
      salaryPeriod: String(p.salaryPeriod || "Aylık"),
      payrollType: String(
        p.payrollType ||
          (String(p.employeeType || "Normal") === "Emekli"
            ? "Emekli Personel"
            : "Normal Personel"),
      ),
      createdAt: now,
      updatedAt: now,
    });
    delete (insertValues as Record<string, unknown>).id;
    const { data: row, error: insertError } = await db
      .from("employees")
      .insert(insertValues)
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    // Kimlik/çalışma izni ve ücret/IBAN alanları listEmployeesForAccess'in
    // gerçek kaynağı olan employee_identity_legal/employee_compensation_private'a
    // da yazılır (bkz. db/employee-access.ts::upsertGatedEmployeeFields) —
    // aksi halde sicil kartı kaydedildikten hemen sonra bu alanlar boş görünür.
    await upsertGatedEmployeeFields(db, companyId, Number(row.id), camelizeKeys(row));
    await db
      .from("employee_cost_histories")
      .upsert(
        {
          company_id: companyId,
          employee_id: row.id,
          effective_from: row.start_date,
          department_id: row.department_id,
          department_snapshot: row.department,
          position_snapshot: row.position,
          work_type: row.work_type,
          salary_basis: row.salary_basis,
          gross_salary: row.salary,
          net_salary: row.net_salary,
          created_by: access.email,
          created_at: now,
        },
        { onConflict: "employee_id,effective_from", ignoreDuplicates: true },
      );
    await writeAudit(access, "CREATE", "employee", Number(row.id), null, row);
    return Response.json({ employee: camelizeKeys(row) }, { status: 201 });
  } catch (e) {
    return accessError(e);
  }
}

export async function PUT(request: Request) {
  try {
    const companyId = company(request),
      access = await requireAccess(request, companyId, true),
      p = (await request.json()) as Record<string, unknown>,
      id = Number(p.id);
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });
    const db = getDb();
    const { data: oldRaw } = await db
      .from("employees")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!oldRaw)
      return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    const old = camelizeKeys(oldRaw);
    const requestedDepartment = String(p.department ?? old.department ?? ""),
      departmentId = Number(p.departmentId || old.departmentId);
    const { data: departmentByName } = requestedDepartment
      ? await db
          .from("departments")
          .select("*")
          .eq("company_id", companyId)
          .eq("name", requestedDepartment)
          .maybeSingle()
      : { data: null };
    const { data: departmentById } = departmentId
      ? await db
          .from("departments")
          .select("*")
          .eq("id", departmentId)
          .eq("company_id", companyId)
          .maybeSingle()
      : { data: null };
    const department = p.departmentId
      ? departmentById || departmentByName
      : departmentByName || departmentById;
    const requestedPosition = String(p.position ?? old.position ?? "");
    const { data: position } =
      department && requestedPosition
        ? await db
            .from("positions")
            .select("*")
            .eq("company_id", companyId)
            .eq("department_id", department.id)
            .eq("title", requestedPosition)
            .maybeSingle()
        : { data: null };
    const { id: _, createdAt, companyId: __, ...values } = p,
      now = new Date().toISOString();
    const updateValues = snakeizeKeys({
      ...values,
      employeeNo:
        access.role === "super_admin" && p.employeeNo
          ? String(p.employeeNo)
          : old.employeeNo,
      nationalId: String(p.nationalId || old.nationalId),
      departmentId: department?.id || null,
      department: department?.name || requestedDepartment,
      positionId: position?.id || null,
      position: position?.title || requestedPosition,
      salary: parseTrMoney(p.salary),
      netSalary: parseTrMoney(p.netSalary),
      weeklyHours: p.weeklyHours ? Number(p.weeklyHours) : null,
      salaryBasis: String(p.salaryBasis || old.salaryBasis || "Brüt"),
      salaryPeriod: String(p.salaryPeriod || old.salaryPeriod || "Aylık"),
      payrollType: String(
        p.payrollType ||
          old.payrollType ||
          (String(p.employeeType || old.employeeType) === "Emekli"
            ? "Emekli Personel"
            : "Normal Personel"),
      ),
      updatedAt: now,
    });
    delete (updateValues as Record<string, unknown>).id;
    const { data: rowRaw, error: updateError } = await db
      .from("employees")
      .update(updateValues)
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);
    const row = camelizeKeys(rowRaw);
    // Kimlik/çalışma izni ve ücret/IBAN alanları listEmployeesForAccess'in
    // gerçek kaynağı olan employee_identity_legal/employee_compensation_private'a
    // da yazılır (bkz. db/employee-access.ts::upsertGatedEmployeeFields) —
    // aksi halde "Değişiklikleri Kaydet" sonrası doğrulama GET'i eski/boş
    // değeri gösterir.
    await upsertGatedEmployeeFields(db, companyId, id, row);
    const changed =
      old.departmentId !== row.departmentId ||
      old.position !== row.position ||
      old.workType !== row.workType ||
      old.salary !== row.salary ||
      old.netSalary !== row.netSalary ||
      old.salaryBasis !== row.salaryBasis;
    if (changed) {
      const effectiveFrom = String(p.costEffectiveFrom || now.slice(0, 10)),
        previousDay = new Date(
          new Date(effectiveFrom + "T00:00:00Z").getTime() - 86400000,
        )
          .toISOString()
          .slice(0, 10);
      const { data: historyRaw } = await db
        .from("employee_cost_histories")
        .select("*")
        .eq("company_id", companyId)
        .eq("employee_id", id);
      const history = camelizeKeys(historyRaw ?? []);
      for (const h of history.filter(
        (h) => !h.effectiveTo && h.effectiveFrom < effectiveFrom,
      ))
        await db
          .from("employee_cost_histories")
          .update({ effective_to: previousDay })
          .eq("id", h.id);
      const { data: existingHistory } = await db
        .from("employee_cost_histories")
        .select("id")
        .eq("employee_id", id)
        .eq("effective_from", effectiveFrom)
        .maybeSingle();
      const historyValues = {
        company_id: companyId,
        employee_id: id,
        effective_from: effectiveFrom,
        department_id: row.departmentId,
        department_snapshot: row.department,
        position_snapshot: row.position,
        work_type: row.workType,
        salary_basis: row.salaryBasis,
        gross_salary: row.salary,
        net_salary: row.netSalary,
        created_by: access.email,
        created_at: now,
      };
      if (existingHistory) {
        await db.from("employee_cost_histories").update(historyValues).eq("id", existingHistory.id);
      } else {
        await db.from("employee_cost_histories").insert(historyValues);
      }
    }
    await writeAudit(access, "UPDATE", "employee", id, old, row);
    return Response.json({ employee: row });
  } catch (e) {
    return accessError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = company(request),
      access = await requireAccess(request, companyId, true),
      id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return Response.json({ error: "Geçersiz kayıt" }, { status: 400 });
    const db = getDb();
    const { data: old } = await db
      .from("employees")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .maybeSingle();
    if (!old)
      return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    await db.from("employees").delete().eq("id", id).eq("company_id", companyId);
    await writeAudit(access, "DELETE", "employee", id, camelizeKeys(old), null);
    return Response.json({ ok: true });
  } catch (e) {
    return accessError(e);
  }
}
