import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess } from "../../../db/authorization";
import { calculateMonthlyCost, DEFAULT_LEGAL_PARAMETERS, median, type LegalParameters } from "../../../db/employer-cost-calculations";
import { camelizeKeys } from "../../../db/case";

const reportKeys = ["personnel_cost", "department_cost", "company_cost", "position_salary_comparison", "benefits_cost", "sgk_employer_cost", "tax_cost", "budget_vs_actual"] as const;
type ReportKey = typeof reportKeys[number];
type Cell = string | number;
type Detail = ReturnType<typeof detail>;
type EmployeeRow = Record<string, any>;
type LegalParamsRow = Record<string, any>;
type BudgetRow = Record<string, any>;
const money = (n: number) => Math.round((n || 0) * 100) / 100;
const sum = (rows: Detail[], key: keyof Detail) => money(rows.reduce((t, r) => t + Number(r[key] || 0), 0));
function legal(row: LegalParamsRow | undefined): LegalParameters {
  if (!row) return DEFAULT_LEGAL_PARAMETERS;
  let incomeTaxBrackets = DEFAULT_LEGAL_PARAMETERS.incomeTaxBrackets;
  try { incomeTaxBrackets = JSON.parse(row.incomeTaxBrackets); } catch {}
  return { ...DEFAULT_LEGAL_PARAMETERS, ...row, stampTaxRate: row.stampTaxRate > 100 ? row.stampTaxRate / 10 : row.stampTaxRate, incomeTaxBrackets };
}
function detail(e: EmployeeRow, p: LegalParameters, benefits: Record<string, number>) {
  const c = calculateMonthlyCost({ gross: e.salary, net: e.netSalary, salaryBasis: e.salaryBasis, employeeType: e.employeeType, cumulativeTaxBase: e.cumulativeTaxBase, benefits }, p),
    sgkBase = Math.min(p.sgkCeiling || c.gross, Math.max(p.sgkFloor || 0, c.gross));
  return {
    employeeId: e.id, employeeNo: e.employeeNo, name: `${e.firstName} ${e.lastName}`, department: e.department, position: e.position,
    net: c.net, gross: c.gross, employeeSgk: c.employeeSgk, employeeUnemployment: c.employeeUnemployment,
    incomeTaxBase: money(c.gross - c.employeeSgk - c.employeeUnemployment), incomeTax: c.incomeTax, stampTax: c.stampTax,
    employerSgk: c.employerSgk, employerUnemployment: c.employerUnemployment, employerSgkBeforeIncentive: c.employerSgkBeforeIncentive,
    sgkIncentive: c.sgkIncentive, sgkBase, benefits: c.benefits, meal: c.meal, travel: c.travel, health: c.health, bes: c.bes,
    vehicle: c.vehicle, phone: c.phone, bonus: c.bonus, otherBenefits: c.otherBenefits, employerCost: c.employerCost,
    cumulativeTaxBase: e.cumulativeTaxBase || 0, taxBracket: taxBracket(c.incomeTaxBase, e.cumulativeTaxBase || 0, p),
    minimumWageTaxExemption: p.minimumWageIncomeTaxExemption + p.minimumWageStampTaxExemption,
  };
}
function taxBracket(base: number, cumulative: number, p: LegalParameters) {
  const total = base + cumulative;
  return p.incomeTaxBrackets.find((x) => x.limit === null || total <= x.limit)?.rate || 0;
}
function group(rows: Detail[], key: "department" | "position") {
  return Object.values(rows.reduce((o, r) => { const k = (r[key] as string) || "Tanımsız"; (o[k] ??= []).push(r); return o; }, {} as Record<string, Detail[]>));
}
function report(key: ReportKey, rows: Detail[], companyName: string, budgets: BudgetRow[]) {
  const company = (r: Detail) => companyName;
  if (key === "personnel_cost")
    return pack(key, "Personel Maliyet Raporu", ["Sicil No", "Ad Soyad", "Şirket", "Departman", "Pozisyon", "Net Ücret", "Brüt Ücret", "İşçi SGK", "İşçi İşsizlik", "Gelir Vergisi", "Damga Vergisi", "İşveren SGK", "İşveren İşsizlik", "Yan Haklar", "Toplam İşveren Maliyeti"],
      rows.map((r) => [r.employeeNo, r.name, company(r), r.department, r.position, r.net, r.gross, r.employeeSgk, r.employeeUnemployment, r.incomeTax, r.stampTax, r.employerSgk, r.employerUnemployment, r.benefits, r.employerCost]), totals(rows));
  if (key === "department_cost")
    return pack(key, "Departman Maliyet Raporu", ["Departman", "Çalışan Sayısı", "Toplam Brüt", "İşveren SGK", "Toplam Vergi", "Toplam Yan Hak", "Toplam Şirket Maliyeti", "Kişi Başı Ortalama"],
      group(rows, "department").map((g) => [g[0].department, g.length, sum(g, "gross"), money(sum(g, "employerSgk") + sum(g, "employerUnemployment")), money(sum(g, "incomeTax") + sum(g, "stampTax")), sum(g, "benefits"), sum(g, "employerCost"), money(sum(g, "employerCost") / g.length)]), totals(rows));
  if (key === "company_cost")
    return pack(key, "Şirket Personel Maliyet Raporu", ["Şirket", "Personel Sayısı", "Toplam Net Ücret", "Toplam Brüt Ücret", "SGK", "Vergi", "Yan Hak", "Diğer Maliyet", "Toplam İşveren Maliyeti", "Aylık Toplam", "Yıllık Toplam"],
      [[companyName, rows.length, sum(rows, "net"), sum(rows, "gross"), money(sum(rows, "employerSgk") + sum(rows, "employerUnemployment")), money(sum(rows, "incomeTax") + sum(rows, "stampTax")), sum(rows, "benefits"), 0, sum(rows, "employerCost"), sum(rows, "employerCost"), money(sum(rows, "employerCost") * 12)]], totals(rows));
  if (key === "position_salary_comparison") {
    const groups = group(rows, "position"), out: Cell[][] = [];
    for (const g of groups) {
      const vals = g.map((x) => x.net), avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      for (const r of g) out.push([r.position, r.name, r.department, companyName, vals.length, Math.min(...vals), Math.max(...vals), money(avg), money(median(vals)), r.net, money(((r.net - avg) / Math.max(avg, 1)) * 100)]);
    }
    return pack(key, "Pozisyon Ücret Karşılaştırma Raporu", ["Pozisyon", "Çalışan", "Departman", "Şirket", "Kişi Sayısı", "Min Ücret", "Maks Ücret", "Ortalama", "Medyan", "Kişinin Ücreti", "Ort. Sapma %"], out, totals(rows));
  }
  if (key === "benefits_cost")
    return pack(key, "Yan Haklar Maliyet Raporu", ["Sicil No", "Çalışan", "Departman", "Şirket", "Yemek", "Yol", "Özel Sağlık", "Hayat Sigortası/BES", "Prim/İkramiye", "Telefon", "Araç", "Diğer", "Toplam Yan Hak"],
      rows.map((r) => [r.employeeNo, r.name, r.department, companyName, r.meal, r.travel, r.health, r.bes, r.bonus, r.phone, r.vehicle, r.otherBenefits, r.benefits]), totals(rows));
  if (key === "sgk_employer_cost")
    return pack(key, "SGK İşveren Maliyet Raporu", ["Sicil No", "Çalışan", "Departman", "SGK Matrahı", "Teşvik Öncesi", "Teşvik", "İşveren SGK", "İşveren İşsizlik", "Teşvik Sonrası"],
      rows.map((r) => [r.employeeNo, r.name, r.department, r.sgkBase, r.employerSgkBeforeIncentive, r.sgkIncentive, r.employerSgk, r.employerUnemployment, money(r.employerSgk + r.employerUnemployment)]), totals(rows));
  if (key === "tax_cost")
    return pack(key, "Vergi Maliyet Raporu", ["Sicil No", "Çalışan", "Departman", "Gelir Vergisi Matrahı", "Gelir Vergisi", "Damga Vergisi", "Vergi Dilimi %", "Kümülatif Matrah", "Asgari Ücret İstisnası", "Toplam Vergi"],
      rows.map((r) => [r.employeeNo, r.name, r.department, r.incomeTaxBase, r.incomeTax, r.stampTax, r.taxBracket, r.cumulativeTaxBase, r.minimumWageTaxExemption, money(r.incomeTax + r.stampTax)]), totals(rows));
  const grouped = group(rows, "department");
  return pack(key, "Bütçe / Gerçekleşen Raporu", ["Şirket", "Departman", "Pozisyon", "Planlanan Maliyet", "Gerçekleşen Maliyet", "Fark TL", "Fark %", "Aylık Gerçekleşen", "Yıllık Gerçekleşen"],
    grouped.map((g) => {
      const planned = budgets.filter((b) => !b.departmentId || b.departmentId === null).reduce((s, b) => s + b.amount, 0) / Math.max(grouped.length, 1),
        actual = sum(g, "employerCost"), diff = actual - planned;
      return [companyName, g[0].department, "Tüm Pozisyonlar", money(planned), actual, money(diff), money((diff / Math.max(planned, 1)) * 100), actual, money(actual * 12)];
    }), { budget: budgets.reduce((s, b) => s + b.amount, 0), actual: sum(rows, "employerCost") });
}
function totals(rows: Detail[]) {
  return { employeeCount: rows.length, net: sum(rows, "net"), gross: sum(rows, "gross"), tax: money(sum(rows, "incomeTax") + sum(rows, "stampTax")), sgk: money(sum(rows, "employerSgk") + sum(rows, "employerUnemployment")), benefits: sum(rows, "benefits"), employerCost: sum(rows, "employerCost") };
}
function pack(reportKey: ReportKey, title: string, columns: string[], rows: Cell[][], totals: Record<string, number>) {
  return { reportKey, title, columns, rows, totals };
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, "Ücret / Maliyet / Bütçe");
    if (access.role === "employee") throw new Error("MODULE_ACCESS_DENIED");
    const u = new URL(request.url), key = u.searchParams.get("reportKey") as ReportKey;
    if (!reportKeys.includes(key)) return Response.json({ error: "Geçersiz reportKey" }, { status: 400 });
    const department = u.searchParams.get("department") || "", position = u.searchParams.get("position") || "", employeeId = Number(u.searchParams.get("employeeId") || 0);
    const db = getDb();
    const [staffRes, benefitsRes, paramsRes, budgetsRes, companyRes] = await Promise.all([
      db.from("employees").select("*").eq("company_id", companyId),
      db.from("employee_benefits").select("*").eq("company_id", companyId),
      db.from("payroll_legal_parameters").select("*").eq("company_id", companyId),
      db.from("personnel_cost_budgets").select("*").eq("company_id", companyId),
      db.from("companies").select("*").eq("id", companyId),
    ]);
    const staff = camelizeKeys(staffRes.data ?? []), benefits = camelizeKeys(benefitsRes.data ?? []),
      params = camelizeKeys(paramsRes.data ?? []), budgets = camelizeKeys(budgetsRes.data ?? []),
      companyRows = camelizeKeys(companyRes.data ?? []);
    const p = legal(params.sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0]),
      filtered = staff.filter((e) => (!department || e.department === department) && (!position || e.position === position) && (!employeeId || e.id === employeeId)),
      rows = filtered.map((e) => {
        const b = benefits.filter((x) => x.employeeId === e.id && x.status === "Aktif").reduce((o, x) => { o[x.category] = (o[x.category] || 0) + x.amount; return o; }, {} as Record<string, number>);
        return detail(e, p, b);
      });
    const result = report(key, rows, companyRows[0]?.name || companyId, budgets);
    return Response.json({ ...result, companyName: companyRows[0]?.name || companyId, range: { from: u.searchParams.get("from"), to: u.searchParams.get("to") }, filters: { department, position, employeeId } });
  } catch (e) { return accessError(e); }
}
