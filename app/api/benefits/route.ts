import { getDb } from "../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  requireModuleAccess,
  writeAudit,
  type Access,
} from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

const roles = ["super_admin", "company_admin", "hr", "payroll"];
const standardBenefits = [
  "Yemek",
  "Yol",
  "Yakıt",
  "Şirket Aracı",
  "Özel Sağlık Sigortası",
  "Tamamlayıcı Sağlık Sigortası",
  "Telefon/İletişim",
  "Prim/Bonus",
  "Diğer",
];
const bool = (value: unknown, fallback = false) =>
  value === undefined || value === null
    ? fallback
    : value === true || value === "true" || value === "on" || value === 1;
function costCategory(value: string) {
  if (["Özel Sağlık Sigortası", "Tamamlayıcı Sağlık Sigortası"].includes(value))
    return "Sağlık";
  if (value === "Şirket Aracı") return "Araç";
  if (value === "Telefon/İletişim") return "Telefon";
  if (value === "Prim/Bonus") return "Prim";
  return ["Yakıt", "Diğer"].includes(value) ? "Diğer" : value;
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Ücret / Maliyet / Bütçe");
    const employeeId = Number(new URL(request.url).searchParams.get("employeeId") || 0),
      db = getDb(),
      [defRes, tplRes, assignRes, staffRes, deptRes] = await Promise.all([
        db.from("benefit_definitions").select("*").eq("company_id", companyId),
        db.from("benefit_templates").select("*").eq("company_id", companyId),
        db.from("employee_benefits").select("*").eq("company_id", companyId),
        db.from("employees").select("*").eq("company_id", companyId),
        db.from("departments").select("*").eq("company_id", companyId),
      ]);
    const definitions = camelizeKeys(defRes.data ?? []),
      templates = camelizeKeys(tplRes.data ?? []),
      assignments = camelizeKeys(assignRes.data ?? []),
      staff = camelizeKeys(staffRes.data ?? []),
      depts = camelizeKeys(deptRes.data ?? []),
      employee = staff.find((item) => item.id === employeeId),
      suggestions = employee
        ? templates
            .filter(
              (template) =>
                template.status === "Aktif" &&
                ((template.scopeType === "Departman" &&
                  (template.departmentId === employee.departmentId ||
                    template.department === employee.department)) ||
                  (template.scopeType === "Pozisyon" &&
                    template.position === employee.position)),
            )
            .map((template) => ({
              ...template,
              definition: definitions.find((item) => item.id === template.definitionId),
              alreadyAssigned: assignments.some(
                (item) =>
                  item.employeeId === employeeId &&
                  item.definitionId === template.definitionId &&
                  item.status === "Aktif",
              ),
            }))
        : [];
    return Response.json({
      definitions,
      templates,
      assignments: employeeId
        ? assignments.filter((item) => item.employeeId === employeeId)
        : assignments,
      employees: staff.map((item) => ({
        id: item.id,
        name: `${item.firstName} ${item.lastName}`,
        employeeNo: item.employeeNo,
        department: item.department,
        departmentId: item.departmentId,
        position: item.position,
        status: item.status,
      })),
      departments: depts,
      suggestions,
      standardBenefits,
    });
  } catch (error) {
    return accessError(error);
  }
}

async function employeeBenefit(
  payload: Record<string, unknown>,
  companyId: string,
  email: string,
  access: Access,
) {
  const db = getDb(),
    now = new Date().toISOString(),
    employeeId = Number(payload.employeeId),
    id = Number(payload.id || 0);
  const { data: employee } = await db
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .eq("company_id", companyId)
    .maybeSingle();
  if (!employee) throw new Error("Çalışan bu şirkete ait değil");
  let definitionId = Number(payload.definitionId || 0);
  let definition = definitionId
    ? camelizeKeys(
        (
          await db
            .from("benefit_definitions")
            .select("*")
            .eq("id", definitionId)
            .eq("company_id", companyId)
            .maybeSingle()
        ).data,
      )
    : undefined;
  const name = String(payload.name || definition?.name || "").trim();
  if (!name) throw new Error("Yan hak adı zorunludur");
  if (!definition) {
    const insertValues = {
      company_id: companyId,
      name,
      category: String(payload.category || name),
      default_amount: Number(payload.amount || 0),
      currency: String(payload.currency || "TRY"),
      frequency: String(payload.frequency || "Aylık"),
      effective_from: String(payload.effectiveFrom || now.slice(0, 10)),
      effective_to: payload.effectiveTo ? String(payload.effectiveTo) : null,
      subject_to_sgk: bool(payload.subjectToSgk),
      subject_to_income_tax: bool(payload.subjectToIncomeTax),
      subject_to_stamp_tax: bool(payload.subjectToStampTax),
      exemption_limit: Number(payload.exemptionLimit || 0),
      status: "Aktif",
      created_by: email,
      created_at: now,
      updated_at: now,
    };
    const { data: inserted, error: insertError } = await db
      .from("benefit_definitions")
      .insert(insertValues)
      .select()
      .single();
    if (insertError) {
      // Aynı isimde tanım zaten var: sadece updated_at güncellenir (orijinal davranış).
      await db.from("benefit_definitions").update({ updated_at: now }).eq("company_id", companyId).eq("name", name);
      const { data: existing } = await db.from("benefit_definitions").select("*").eq("company_id", companyId).eq("name", name).single();
      definition = camelizeKeys(existing);
    } else {
      definition = camelizeKeys(inserted);
    }
    definitionId = definition.id;
  }
  const values = {
    company_id: companyId,
    employee_id: employeeId,
    definition_id: definitionId,
    category: costCategory(String(payload.category || definition.category)),
    name,
    amount: Number(payload.amount ?? definition.defaultAmount ?? 0),
    currency: String(payload.currency || definition.currency || "TRY"),
    frequency: String(payload.frequency || definition.frequency || "Aylık"),
    effective_from: String(payload.effectiveFrom || definition.effectiveFrom || now.slice(0, 10)),
    effective_to: payload.effectiveTo ? String(payload.effectiveTo) : definition.effectiveTo,
    subject_to_sgk: bool(payload.subjectToSgk, definition.subjectToSgk),
    subject_to_income_tax: bool(payload.subjectToIncomeTax, definition.subjectToIncomeTax),
    subject_to_stamp_tax: bool(payload.subjectToStampTax, definition.subjectToStampTax),
    exemption_limit: Number(payload.exemptionLimit ?? definition.exemptionLimit ?? 0),
    include_in_employer_cost: bool(payload.includeInEmployerCost, true),
    description: String(payload.description || ""),
    detail_data: JSON.stringify({
      vehicleInfo: String(payload.vehicleInfo || ""),
      ownershipType: String(payload.ownershipType || ""),
      policyStart: String(payload.policyStart || ""),
      policyEnd: String(payload.policyEnd || ""),
    }),
    source: String(payload.source || "Personel"),
    status: String(payload.status || "Aktif"),
    updated_at: now,
  };
  if (id) {
    const { data: old } = await db
      .from("employee_benefits")
      .select("*")
      .eq("id", id)
      .eq("company_id", companyId)
      .eq("employee_id", employeeId)
      .maybeSingle();
    if (!old) throw new Error("Yan hak kaydı bulunamadı");
    const { data: row, error } = await db.from("employee_benefits").update(values).eq("id", id).select().single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "UPDATE", "employee_benefit", id, old, row);
    return camelizeKeys(row);
  }
  const { data: row, error } = await db
    .from("employee_benefits")
    .insert({ ...values, created_by: email, created_at: now })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await writeAudit(access, "CREATE", "employee_benefit", row.id, null, row);
  return camelizeKeys(row);
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Ücret / Maliyet / Bütçe", true);
    if (!roles.includes(access.role)) throw new Error("MODULE_ACCESS_DENIED");
    const payload = (await request.json()) as Record<string, unknown>,
      action = String(payload.action || ""),
      db = getDb(),
      now = new Date().toISOString();
    if (action === "assign" || action === "employeeBenefit")
      return Response.json({
        record: await employeeBenefit(payload, companyId, access.email, access),
      });
    if (action === "status") {
      const id = Number(payload.id);
      const { data: old } = await db.from("employee_benefits").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      if (!old) throw new Error("Yan hak kaydı bulunamadı");
      const { data: row, error } = await db
        .from("employee_benefits")
        .update({ status: String(payload.status || "Pasif"), updated_at: now })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "UPDATE", "employee_benefit", id, old, row);
      return Response.json({ record: camelizeKeys(row) });
    }
    if (action === "definition") {
      const values = {
        company_id: companyId,
        name: String(payload.name || "").trim(),
        category: String(payload.category || payload.name || "Diğer"),
        default_amount: Number(payload.defaultAmount || 0),
        currency: String(payload.currency || "TRY"),
        frequency: String(payload.frequency || "Aylık"),
        effective_from: String(payload.effectiveFrom || now.slice(0, 10)),
        effective_to: payload.effectiveTo ? String(payload.effectiveTo) : null,
        subject_to_sgk: bool(payload.subjectToSgk),
        subject_to_income_tax: bool(payload.subjectToIncomeTax),
        subject_to_stamp_tax: bool(payload.subjectToStampTax),
        exemption_limit: Number(payload.exemptionLimit || 0),
        status: String(payload.status || "Aktif"),
        created_by: access.email,
        created_at: now,
        updated_at: now,
      };
      if (!values.name) throw new Error("Yan hak adı zorunludur");
      const { data: inserted, error: insertError } = await db.from("benefit_definitions").insert(values).select().single();
      let row = inserted;
      if (insertError) {
        const { name, ...updateFields } = values;
        const { data: updated, error: updateError } = await db
          .from("benefit_definitions")
          .update(updateFields)
          .eq("company_id", companyId)
          .eq("name", values.name)
          .select()
          .single();
        if (updateError) throw new Error(updateError.message);
        row = updated;
      }
      return Response.json({ record: camelizeKeys(row) });
    }
    if (action === "template") {
      const definitionId = Number(payload.definitionId),
        scopeType = String(payload.scopeType);
      const { data: row, error } = await db
        .from("benefit_templates")
        .insert({
          company_id: companyId,
          definition_id: definitionId,
          scope_type: scopeType,
          department_id: payload.departmentId ? Number(payload.departmentId) : null,
          department: payload.department ? String(payload.department) : null,
          position: payload.position ? String(payload.position) : null,
          amount: payload.amount ? Number(payload.amount) : null,
          status: "Aktif",
          created_by: access.email,
          created_at: now,
          updated_at: now,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return Response.json({ record: camelizeKeys(row) });
    }
    return Response.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (error) {
    return accessError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request),
      access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Ücret / Maliyet / Bütçe", true);
    const id = Number(new URL(request.url).searchParams.get("id") || 0),
      db = getDb();
    const { data: old } = await db.from("employee_benefits").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) throw new Error("Yan hak kaydı bulunamadı");
    await db.from("employee_benefits").delete().eq("id", id);
    await writeAudit(access, "DELETE", "employee_benefit", id, old, null);
    return Response.json({ ok: true });
  } catch (error) {
    return accessError(error);
  }
}
