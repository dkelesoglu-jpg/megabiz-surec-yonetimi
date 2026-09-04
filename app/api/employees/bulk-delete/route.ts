import { getDb } from "../../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  requireModuleAccess,
  writeAudit,
} from "../../../../db/authorization";
import { camelizeKeys } from "../../../../db/case";

const roles = ["super_admin", "company_admin", "hr"];
function ids(value: unknown) {
  return Array.isArray(value)
    ? [
        ...new Set(
          value
            .map(Number)
            .filter(Number.isInteger)
            .filter((x) => x > 0),
        ),
      ]
    : [];
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Personel", true);
    if (!roles.includes(access.role)) throw new Error("MODULE_ACCESS_DENIED");
    const body = (await request.json()) as Record<string, unknown>,
      employeeIds = ids(body.employeeIds);
    if (!employeeIds.length)
      return Response.json({ error: "Silinecek personel seçilmedi" }, { status: 400 });
    const db = getDb();
    const [peopleRes, companyRes] = await Promise.all([
      db.from("employees").select("id, employee_no, first_name, last_name, department, position").eq("company_id", companyId).in("id", employeeIds),
      db.from("companies").select("name").eq("id", companyId).maybeSingle(),
    ]);
    const people = camelizeKeys(peopleRes.data ?? []);
    if (people.length !== employeeIds.length)
      return Response.json({ error: "Seçimde başka şirkete ait veya bulunamayan personel var" }, { status: 400 });
    const signature = people.map((x) => x.id).sort((a, b) => a - b).join("-");
    return Response.json({
      companyId,
      companyName: companyRes.data?.name || companyId,
      count: people.length,
      employees: people,
      confirmationPhrase: `${companyRes.data?.name || companyId} / ${people.length} PERSONELİ SİL`,
      signature,
    });
  } catch (e) {
    return accessError(e);
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Personel", true);
    if (!roles.includes(access.role)) throw new Error("MODULE_ACCESS_DENIED");
    const body = (await request.json()) as Record<string, unknown>,
      employeeIds = ids(body.employeeIds),
      db = getDb();
    if (!employeeIds.length)
      return Response.json({ error: "Silinecek personel seçilmedi" }, { status: 400 });
    const [peopleRes, companyRes] = await Promise.all([
      db.from("employees").select("*").eq("company_id", companyId).in("id", employeeIds),
      db.from("companies").select("name").eq("id", companyId).maybeSingle(),
    ]);
    const people = camelizeKeys(peopleRes.data ?? []);
    const expected = `${companyRes.data?.name || companyId} / ${people.length} PERSONELİ SİL`,
      signature = people.map((x) => x.id).sort((a, b) => a - b).join("-");
    if (people.length !== employeeIds.length || body.signature !== signature || body.confirmationPhrase !== expected)
      return Response.json({ error: "İkinci onay doğrulanamadı; silme özeti yeniden açılmalıdır" }, { status: 409 });

    const { data: assignmentsData } = await db.from("performance_assignments").select("id").eq("company_id", companyId).in("employee_id", employeeIds);
    const assignmentIds = (assignmentsData ?? []).map((x) => x.id);
    if (assignmentIds.length) {
      await db.from("performance_metrics").delete().eq("company_id", companyId).in("assignment_id", assignmentIds);
      await db.from("performance_competencies").delete().eq("company_id", companyId).in("assignment_id", assignmentIds);
      await db.from("performance_feedback").delete().eq("company_id", companyId).in("assignment_id", assignmentIds);
      await db.from("performance_actions").delete().eq("company_id", companyId).in("assignment_id", assignmentIds);
    }

    const { data: advancesData } = await db.from("advance_requests").select("id").eq("company_id", companyId).in("employee_id", employeeIds);
    const advanceIds = (advancesData ?? []).map((x) => x.id);
    if (advanceIds.length) {
      await db.from("advance_installments").delete().eq("company_id", companyId).in("request_id", advanceIds);
      await db.from("advance_payments").delete().eq("company_id", companyId).in("request_id", advanceIds);
      await db.from("advance_approval_logs").delete().eq("company_id", companyId).in("request_id", advanceIds);
    }

    await db
      .from("assets")
      .update({ assigned_employee_id: null, assigned_at: null, expected_return_date: null, status: "Stokta", updated_at: new Date().toISOString() })
      .eq("company_id", companyId)
      .in("assigned_employee_id", employeeIds);
    await db
      .from("documents")
      .delete()
      .eq("company_id", companyId)
      .eq("related_type", "employee")
      .in("related_id", employeeIds.map(String));
    await db.from("performance_reviews").delete().eq("company_id", companyId).in("employee_id", employeeIds);
    await db.from("performance_assignments").delete().eq("company_id", companyId).in("employee_id", employeeIds);
    await db.from("advance_requests").delete().eq("company_id", companyId).in("employee_id", employeeIds);
    await db.from("employee_benefits").delete().eq("company_id", companyId).in("employee_id", employeeIds);
    await db.from("employee_cost_histories").delete().eq("company_id", companyId).in("employee_id", employeeIds);

    await writeAudit(
      access,
      "DELETE",
      "employee_batch",
      companyId,
      people.map((x) => ({ id: x.id, employeeNo: x.employeeNo, name: `${x.firstName} ${x.lastName}` })),
      { deletedCount: people.length },
    );
    await db.from("employees").delete().eq("company_id", companyId).in("id", employeeIds);
    return Response.json({ ok: true, deleted: people.length });
  } catch (e) {
    return accessError(e);
  }
}
