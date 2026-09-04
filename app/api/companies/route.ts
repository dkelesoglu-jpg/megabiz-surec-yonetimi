import { getDb } from "../../../db";
import { accessError, requireAccess, writeAudit } from "../../../db/authorization";
import { moduleList } from "../../../db/modules";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    await requireAccess(request, "mega-global-energy");
    const { data } = await getDb().from("companies").select("*");
    return Response.json({ companies: camelizeKeys(data ?? []) });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const access = await requireAccess(request, "mega-global-energy", true);
    if (access.role !== "super_admin") return Response.json({ error: "SUPER_ADMIN_REQUIRED" }, { status: 403 });
    const p = await request.json() as Record<string, unknown>,
      name = String(p.name || "").trim(),
      id = String(
        p.id || name.toLocaleLowerCase("tr").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      ).trim(),
      packageName = String(p.packageName || "Professional");
    if (!id || !name) return Response.json({ error: "Şirket adı zorunludur" }, { status: 400 });
    const db = getDb(), now = new Date().toISOString();
    const { data: row, error: insertError } = await db
      .from("companies")
      .insert({ id, name, sector: String(p.sector || ""), employee_count: Number(p.employeeCount || 0), package_name: packageName, created_at: now })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);
    const enabled =
      packageName === "Basic"
        ? ["Genel Bakış", "Organizasyon", "Personel", "İzin & Devam", "Raporlar"]
        : packageName === "Professional"
          ? moduleList.filter((x) => !["Bordro Detayları", "Ücret / Maliyet / Bütçe", "Yasal Haklar"].includes(x))
          : moduleList;
    await db.from("company_modules").insert(
      moduleList.map((module) => ({ company_id: id, module, enabled: enabled.includes(module), updated_at: now })),
    );
    await db.from("company_memberships").insert({ company_id: id, user_email: access.email, role: "company_admin", created_at: now });
    await writeAudit({ ...access, companyId: id }, "CREATE", "company", row.id, null, row);
    return Response.json({ company: camelizeKeys(row) }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const p = await request.json() as Record<string, unknown>, id = String(p.id || ""),
      access = await requireAccess(request, id, true);
    if (access.role !== "super_admin") return Response.json({ error: "SUPER_ADMIN_REQUIRED" }, { status: 403 });
    const db = getDb();
    const { data: old } = await db.from("companies").select("*").eq("id", id).maybeSingle();
    const { data: row } = await db
      .from("companies")
      .update({
        name: String(p.name || old?.name),
        sector: String(p.sector || old?.sector || ""),
        employee_count: Number(p.employeeCount ?? old?.employee_count),
        package_name: String(p.packageName || old?.package_name),
        status: String(p.status || old?.status),
      })
      .eq("id", id)
      .select()
      .single();
    await writeAudit(access, "UPDATE", "company", id, old, row);
    return Response.json({ company: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}
