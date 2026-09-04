import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit } from "../../../db/authorization";
import { nextNumber } from "../../../db/number-series";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Zimmet Yönetimi");
    const employeeId = Number(new URL(request.url).searchParams.get("employeeId") || 0);
    const db = getDb();
    const [a, e] = await Promise.all([
      db.from("assets").select("*").eq("company_id", companyId).order("name", { ascending: true }),
      db.from("employees").select("id, first_name, last_name, department, position, status").eq("company_id", companyId),
    ]);
    const assets = camelizeKeys(a.data ?? []);
    return Response.json({
      assets: employeeId ? assets.filter((x) => x.assignedEmployeeId === employeeId) : assets,
      employees: camelizeKeys(e.data ?? []),
    });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Zimmet Yönetimi", true);
    const p = await request.json() as Record<string, unknown>, now = new Date().toISOString();
    if (!p.name || !p.category) return Response.json({ error: "Demirbaş adı ve kategorisi zorunludur" }, { status: 400 });
    const employeeId = p.assignedEmployeeId ? Number(p.assignedEmployeeId) : null,
      assetCode = await nextNumber(companyId, "asset");
    const { data: row, error } = await getDb()
      .from("assets")
      .insert({
        company_id: companyId,
        asset_code: assetCode,
        name: String(p.name),
        category: String(p.category),
        brand: String(p.brand || ""),
        model: String(p.model || ""),
        serial_no: String(p.serialNo || ""),
        purchase_date: String(p.purchaseDate || ""),
        purchase_cost: p.purchaseCost ? Number(p.purchaseCost) : null,
        monthly_cost: Number(p.monthlyCost || 0),
        include_in_employer_cost: Boolean(p.includeInEmployerCost),
        ownership_type: String(p.ownershipType || "Şirket"),
        assigned_employee_id: employeeId,
        assigned_at: employeeId ? String(p.assignedAt || now.slice(0, 10)) : null,
        expected_return_date: String(p.expectedReturnDate || ""),
        condition: String(p.condition || "İyi"),
        status: employeeId ? "Zimmetli" : String(p.status || "Stokta"),
        notes: String(p.notes || ""),
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, "CREATE", "asset", row.id, null, row);
    return Response.json({ asset: camelizeKeys(row) }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Zimmet Yönetimi", true);
    const p = await request.json() as Record<string, unknown>, id = Number(p.id);
    const db = getDb();
    const { data: old } = await db.from("assets").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Demirbaş bulunamadı" }, { status: 404 });
    const returned = Boolean(p.returnAsset),
      employeeId = returned ? null : p.assignedEmployeeId ? Number(p.assignedEmployeeId) : null;
    const { data: row, error } = await db
      .from("assets")
      .update({
        asset_code: String(p.assetCode || old.asset_code).toUpperCase(),
        name: String(p.name || old.name),
        category: String(p.category || old.category),
        brand: String(p.brand ?? old.brand ?? ""),
        model: String(p.model ?? old.model ?? ""),
        serial_no: String(p.serialNo ?? old.serial_no ?? ""),
        purchase_date: String(p.purchaseDate ?? old.purchase_date ?? ""),
        purchase_cost: p.purchaseCost ? Number(p.purchaseCost) : old.purchase_cost,
        monthly_cost: p.monthlyCost === undefined ? old.monthly_cost : Number(p.monthlyCost || 0),
        include_in_employer_cost: p.includeInEmployerCost === undefined ? old.include_in_employer_cost : Boolean(p.includeInEmployerCost),
        ownership_type: String(p.ownershipType || old.ownership_type || "Şirket"),
        assigned_employee_id: employeeId,
        assigned_at: returned ? null : employeeId ? String(p.assignedAt || old.assigned_at || new Date().toISOString().slice(0, 10)) : null,
        expected_return_date: returned ? null : String(p.expectedReturnDate ?? old.expected_return_date ?? ""),
        returned_at: returned ? new Date().toISOString().slice(0, 10) : old.returned_at,
        condition: String(p.condition || old.condition),
        status: returned ? "Stokta" : employeeId ? "Zimmetli" : String(p.status || old.status),
        notes: String(p.notes ?? old.notes ?? ""),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("company_id", companyId)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await writeAudit(access, returned ? "RETURN" : "UPDATE", "asset", id, old, row);
    return Response.json({ asset: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}

export async function DELETE(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Zimmet Yönetimi", true);
    const id = Number(new URL(request.url).searchParams.get("id"));
    const db = getDb();
    const { data: old } = await db.from("assets").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    if (!old) return Response.json({ error: "Demirbaş bulunamadı" }, { status: 404 });
    if (old.status === "Zimmetli") return Response.json({ error: "Zimmetli demirbaş önce iade alınmalıdır" }, { status: 409 });
    await db.from("assets").delete().eq("id", id).eq("company_id", companyId);
    await writeAudit(access, "DELETE", "asset", id, old, null);
    return Response.json({ ok: true });
  } catch (e) { return accessError(e); }
}
