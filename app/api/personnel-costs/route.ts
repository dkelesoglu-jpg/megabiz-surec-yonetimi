import { getDb } from "../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  requireModuleAccess,
  writeAudit,
} from "../../../db/authorization";
import {
  calculateMonthlyCost,
  dateOverlap,
  DEFAULT_LEGAL_PARAMETERS,
  median,
  monthlyBenefit,
  type CostBreakdown,
  type LegalParameters,
} from "../../../db/employer-cost-calculations";
import { camelizeKeys } from "../../../db/case";
import { FINANCIAL_ASSET_COLUMNS, FINANCIAL_BENEFIT_COLUMNS, FINANCIAL_BUDGET_COLUMNS, FINANCIAL_EMPLOYEE_COLUMNS, FINANCIAL_HEADCOUNT_COLUMNS, FINANCIAL_HISTORY_COLUMNS, FINANCIAL_PARAMETER_COLUMNS, FINANCIAL_SCENARIO_COLUMNS, PERSONNEL_COST_MODULE, assertFinancialReportRole, canViewCompanyFinancialPlanning, sanitizeFinancialPayloadForRole, scopeFinancialEmployees, scopeFinancialRows } from "../../../db/financial-access";

const empty = (): CostBreakdown => ({
  gross: 0, net: 0, employeeSgk: 0, employeeUnemployment: 0, incomeTax: 0, stampTax: 0,
  employerSgkBeforeIncentive: 0, sgkIncentive: 0, employerSgk: 0, employerUnemployment: 0,
  meal: 0, travel: 0, health: 0, bes: 0, vehicle: 0, phone: 0, bonus: 0, otherBenefits: 0,
  benefits: 0, employerCost: 0, activeDays: 0, periodDays: 0,
});
function add(a: CostBreakdown, b: CostBreakdown) {
  for (const k of Object.keys(a) as (keyof CostBreakdown)[]) a[k] = Math.round((a[k] + b[k]) * 100) / 100;
  return a;
}
function monthSlices(from: string, to: string) {
  const result: { from: string; to: string; year: number; month: number; days: number }[] = [], end = new Date(to + "T00:00:00Z");
  let d = new Date(from + "T00:00:00Z");
  while (d <= end) {
    const y = d.getUTCFullYear(), m = d.getUTCMonth(), monthEnd = new Date(Date.UTC(y, m + 1, 0)), sliceEnd = monthEnd < end ? monthEnd : end,
      fmt = (x: Date) => x.toISOString().slice(0, 10);
    result.push({ from: fmt(d), to: fmt(sliceEnd), year: y, month: m + 1, days: Math.floor((sliceEnd.getTime() - d.getTime()) / 86400000) + 1 });
    d = new Date(sliceEnd.getTime() + 86400000);
  }
  return result;
}
function legal(row: Record<string, any> | undefined): LegalParameters {
  if (!row) return DEFAULT_LEGAL_PARAMETERS;
  let brackets = DEFAULT_LEGAL_PARAMETERS.incomeTaxBrackets;
  try { brackets = JSON.parse(row.incomeTaxBrackets); } catch {}
  return {
    minimumWage: row.minimumWage, sgkFloor: row.sgkFloor, sgkCeiling: row.sgkCeiling,
    employeeSgkRate: row.employeeSgkRate, employerSgkRate: row.employerSgkRate,
    employeeUnemploymentRate: row.employeeUnemploymentRate, employerUnemploymentRate: row.employerUnemploymentRate,
    employerIncentiveRate: row.employerIncentiveRate,
    stampTaxRate: row.stampTaxRate > 100 ? row.stampTaxRate / 10 : row.stampTaxRate,
    employeeSgdpRate: row.employeeSgdpRate, employerSgdpRate: row.employerSgdpRate,
    incomeTaxBrackets: brackets,
    minimumWageIncomeTaxExemption: row.minimumWageIncomeTaxExemption, minimumWageStampTaxExemption: row.minimumWageStampTaxExemption,
    mealSgkDailyExemption: row.mealSgkDailyExemption, mealTaxDailyExemption: row.mealTaxDailyExemption,
    travelSgkDailyExemption: row.travelSgkDailyExemption, travelTaxDailyExemption: row.travelTaxDailyExemption,
  };
}
function percentToBasisPoints(value: unknown, name: string) {
  const text = String(value ?? "").trim().replace(",", "."), percent = Number(text);
  if (!Number.isFinite(percent) || percent < 0 || percent > 100) throw new Error(`${name} yüzde olarak 0–100 arasında girilmelidir`);
  return Math.round(percent * 100000) / 1000;
}
function pct(n: number, d: number) { return d ? Math.round((n / d) * 1000) / 10 : 0; }

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, PERSONNEL_COST_MODULE);
    assertFinancialReportRole(access.role);
    const url = new URL(request.url), now = new Date(),
      from = url.searchParams.get("from") || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
      to = url.searchParams.get("to") || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10),
      employeeId = Number(url.searchParams.get("employeeId") || 0),
      departmentFilter = url.searchParams.get("department") || "",
      positionFilter = url.searchParams.get("position") || "";
    const db = getDb();
    const [staffRes, histRes, benRes, assetRes, paramRes, budgetRes, scenarioRes, plannedRes] = await Promise.all([
      db.from("employees").select(FINANCIAL_EMPLOYEE_COLUMNS).eq("company_id", companyId).order("first_name", { ascending: true }),
      db.from("employee_cost_histories").select(FINANCIAL_HISTORY_COLUMNS).eq("company_id", companyId),
      db.from("employee_benefits").select(FINANCIAL_BENEFIT_COLUMNS).eq("company_id", companyId),
      db.from("assets").select(FINANCIAL_ASSET_COLUMNS).eq("company_id", companyId),
      db.from("payroll_legal_parameters").select(FINANCIAL_PARAMETER_COLUMNS).eq("company_id", companyId),
      db.from("personnel_cost_budgets").select(FINANCIAL_BUDGET_COLUMNS).eq("company_id", companyId),
      db.from("personnel_budget_scenarios").select(FINANCIAL_SCENARIO_COLUMNS).eq("company_id", companyId),
      db.from("planned_headcounts").select(FINANCIAL_HEADCOUNT_COLUMNS).eq("company_id", companyId),
    ]);
    const staff = scopeFinancialEmployees(camelizeKeys(staffRes.data ?? []), access), employeeIds = new Set(staff.map((row) => Number(row.id))),
      histories = scopeFinancialRows(camelizeKeys(histRes.data ?? []), employeeIds, companyId),
      benefits = scopeFinancialRows(camelizeKeys(benRes.data ?? []), employeeIds, companyId),
      assignedAssets = scopeFinancialRows(camelizeKeys(assetRes.data ?? []), employeeIds, companyId),
      parameters = camelizeKeys(paramRes.data ?? []),
      budgets = canViewCompanyFinancialPlanning(access.role) ? camelizeKeys(budgetRes.data ?? []) : [],
      scenarios = canViewCompanyFinancialPlanning(access.role) ? camelizeKeys(scenarioRes.data ?? []) : [],
      plannedHeads = canViewCompanyFinancialPlanning(access.role) ? camelizeKeys(plannedRes.data ?? []) : [];
    const slices = monthSlices(from, to), details = [] as Array<Record<string, unknown> & CostBreakdown>;
    for (const e of staff) {
      if ((employeeId && e.id !== employeeId) || (departmentFilter && e.department !== departmentFilter) || (positionFilter && e.position !== positionFilter)) continue;
      const employmentStart = e.startDate || from;
      if (dateOverlap(from, to, employmentStart, e.endDate) <= 0) continue;
      const total = empty();
      for (const slice of slices) {
        const historicalCandidate = histories
            .filter((h) => h.employeeId === e.id && dateOverlap(slice.from, slice.to, h.effectiveFrom, h.effectiveTo) > 0)
            .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0],
          activeDays = dateOverlap(slice.from, slice.to, employmentStart, e.endDate),
          ratio = activeDays / slice.days;
        if (ratio <= 0) continue;
        const applicable = benefits.filter((b) => b.employeeId === e.id && b.status === "Aktif" && b.includeInEmployerCost && dateOverlap(slice.from, slice.to, b.effectiveFrom, b.effectiveTo) > 0),
          benefitMap: Record<string, number> = {};
        for (const b of applicable) {
          const amount = b.frequency === "Tek Seferlik" ? (b.effectiveFrom >= slice.from && b.effectiveFrom <= slice.to ? b.amount : 0) : monthlyBenefit(b.amount, b.frequency);
          benefitMap[b.category] = (benefitMap[b.category] || 0) + amount;
        }
        const assetCost = assignedAssets
          .filter((asset) => asset.assignedEmployeeId === e.id && asset.includeInEmployerCost && asset.status === "Zimmetli" && dateOverlap(slice.from, slice.to, asset.assignedAt || slice.from, asset.returnedAt) > 0)
          .reduce((sum, asset) => sum + asset.monthlyCost, 0);
        if (assetCost) benefitMap.Diğer = (benefitMap.Diğer || 0) + assetCost;
        const params = parameters
            .filter((p) => p.year === slice.year && p.effectiveFrom <= slice.to && (!p.effectiveTo || p.effectiveTo >= slice.from))
            .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0],
          candidate = employeeId ? undefined : historicalCandidate,
          cost = calculateMonthlyCost(
            {
              gross: candidate?.grossSalary ?? e.salary,
              net: candidate?.netSalary ?? e.netSalary,
              salaryBasis: candidate?.salaryBasis ?? e.salaryBasis,
              employeeType: e.employeeType,
              cumulativeTaxBase: e.cumulativeTaxBase,
              incentiveRate: candidate?.sgkIncentiveRate || undefined,
              benefits: benefitMap,
              activeRatio: ratio,
            },
            legal(params),
          );
        cost.activeDays = activeDays;
        cost.periodDays = slice.days;
        add(total, cost);
      }
      details.push({
        ...total, id: e.id, employeeNo: e.employeeNo, departmentId: e.departmentId, name: `${e.firstName} ${e.lastName}`,
        department: e.department, position: e.position, workType: e.workType, salaryBasis: e.salaryBasis,
        salarySource: employeeId ? "employee_record" : "cost_history", storedGrossSalary: e.salary, storedNetSalary: e.netSalary,
        startDate: e.startDate, endDate: e.endDate,
      });
    }
    const summary = details.reduce((s, x) => add(s, x as unknown as CostBreakdown), empty()),
      group = (key: "department" | "position") =>
        Object.values(
          details.reduce((o, x) => {
            const name = String(x[key] || "Tanımsız"), row = o[name] || { name, count: 0, ...empty() };
            row.count++;
            add(row, x as unknown as CostBreakdown);
            o[name] = row;
            return o;
          }, {} as Record<string, { name: string; count: number } & CostBreakdown>),
        )
          .map((x) => ({ ...x, average: x.count ? x.employerCost / x.count : 0, share: pct(x.employerCost, summary.employerCost), personnelShare: pct(x.count, details.length) }))
          .sort((a, b) => b.employerCost - a.employerCost),
      departments = group("department"),
      positions = group("position").map((p) => {
        const same = details.filter((x) => x.position === p.name), nets = same.map((x) => x.net as number);
        return {
          ...p,
          minNet: nets.length ? Math.min(...nets) : 0,
          maxNet: nets.length ? Math.max(...nets) : 0,
          medianNet: median(nets),
          averageNet: nets.length ? nets.reduce((s, n) => s + n, 0) / nets.length : 0,
          employees: same.map((x) => ({ ...x, difference: pct((x.net as number) - nets.reduce((s, n) => s + n, 0) / nets.length, nets.reduce((s, n) => s + n, 0) / nets.length) })),
        };
      }),
      monthly = slices.map((s) => {
        const rows = details.length ? details : [];
        return {
          label: new Intl.DateTimeFormat("tr-TR", { month: "short", year: "2-digit" }).format(new Date(`${s.from}T00:00:00Z`)),
          cost: rows.reduce((n, x) => n + (x.employerCost as number) / slices.length, 0),
        };
      }),
      budget = budgets.filter((b) => b.year >= Number(from.slice(0, 4)) && b.year <= Number(to.slice(0, 4))).reduce((s, b) => s + b.amount, 0);
    const payload = {
      range: { from, to },
      summary: { ...summary, employeeCount: details.length, averageCost: details.length ? summary.employerCost / details.length : 0, annualProjection: summary.employerCost * (365 / Math.max(1, dateOverlap(from, to, from, to))) },
      details, departments, positions, monthly,
      budget: { budget, actual: summary.employerCost, difference: summary.employerCost - budget, differenceRate: pct(summary.employerCost - budget, budget) },
      parameters, benefits: access.role === "manager" ? [] : benefits, budgetRecords: budgets, scenarios, plannedHeadcounts: plannedHeads,
      filters: { departments: [...new Set(staff.map((e) => e.department))], positions: [...new Set(staff.map((e) => e.position))] },
    };
    return Response.json(sanitizeFinancialPayloadForRole(payload, access.role));
  } catch (e) {
    return accessError(e);
  }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, PERSONNEL_COST_MODULE, true);
    if (!["super_admin", "company_admin", "hr", "payroll"].includes(access.role)) throw new Error("MODULE_ACCESS_DENIED");
    const p = (await request.json()) as Record<string, unknown>, action = String(p.action || ""), now = new Date().toISOString(), db = getDb();

    if (action === "benefit") {
      const { data: row, error } = await db
        .from("employee_benefits")
        .insert({
          company_id: companyId, employee_id: Number(p.employeeId), category: String(p.category), name: String(p.name),
          amount: Number(p.amount), frequency: String(p.frequency || "Aylık"), effective_from: String(p.effectiveFrom),
          effective_to: p.effectiveTo ? String(p.effectiveTo) : null, status: "Aktif", created_by: access.email, created_at: now, updated_at: now,
        })
        .select(FINANCIAL_BENEFIT_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "employee_benefit", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }
    if (action === "budget") {
      const { data: row, error } = await db
        .from("personnel_cost_budgets")
        .insert({
          company_id: companyId, year: Number(p.year), month: p.month ? Number(p.month) : null,
          department_id: p.departmentId ? Number(p.departmentId) : null, position: p.position ? String(p.position) : null,
          amount: Number(p.amount), note: p.note ? String(p.note) : null, created_by: access.email, created_at: now, updated_at: now,
        })
        .select(FINANCIAL_BUDGET_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "personnel_cost_budget", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }
    if (action === "budget_scenario") {
      const { data: row, error } = await db
        .from("personnel_budget_scenarios")
        .insert({
          company_id: companyId, year: Number(p.year), name: String(p.name || "Yeni Senaryo"),
          salary_increase_rate: Number(p.salaryIncreaseRate || 0), increase_month: Number(p.increaseMonth || 1),
          benefit_increase_rate: Number(p.benefitIncreaseRate || 0), scope_type: String(p.scopeType || "Şirket"),
          scope_value: p.scopeValue ? String(p.scopeValue) : null, include_planned_heads: p.includePlannedHeads !== false,
          status: "Aktif", created_by: access.email, created_at: now, updated_at: now,
        })
        .select(FINANCIAL_SCENARIO_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "personnel_budget_scenario", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }
    if (action === "planned_headcount") {
      const departmentName = String(p.departmentName || "").trim();
      const { data: matchedDepartment } = departmentName
        ? await db.from("departments").select("id").eq("company_id", companyId).eq("name", departmentName).maybeSingle()
        : { data: null };
      const { data: row, error } = await db
        .from("planned_headcounts")
        .insert({
          company_id: companyId, year: Number(p.year), department_id: p.departmentId ? Number(p.departmentId) : (matchedDepartment?.id ?? null),
          position: String(p.position || "Planlanan Pozisyon"), planned_start_date: String(p.plannedStartDate),
          planned_net_salary: Number(p.plannedNetSalary || 0), planned_monthly_cost: Number(p.plannedMonthlyCost || 0),
          headcount: Number(p.headcount || 1), status: "Planlandı", note: p.note ? String(p.note) : null,
          created_by: access.email, created_at: now, updated_at: now,
        })
        .select(FINANCIAL_HEADCOUNT_COLUMNS)
        .single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "CREATE", "planned_headcount", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) }, { status: 201 });
    }
    if (action === "parameters") {
      const year = Number(p.year), effectiveFrom = String(p.effectiveFrom || ""), effectiveTo = p.effectiveTo ? String(p.effectiveTo) : null,
        minimumWage = Number(p.minimumWage), sgkFloor = Number(p.sgkFloor), sgkCeiling = Number(p.sgkCeiling);
      if (!year || !effectiveFrom) throw new Error("Yıl ve geçerlilik başlangıcı zorunludur");
      if (effectiveTo && effectiveTo < effectiveFrom) throw new Error("Bitiş tarihi başlangıçtan önce olamaz");
      if (minimumWage <= 0) throw new Error("Brüt asgari ücret 0 olamaz");
      if (sgkFloor <= 0 || sgkCeiling < sgkFloor) throw new Error("SGK alt ve üst sınırlarını kontrol edin");
      let brackets;
      try { brackets = JSON.parse(String(p.incomeTaxBrackets || "[]")); } catch { throw new Error("Gelir vergisi dilimleri geçerli değil"); }
      if (!Array.isArray(brackets) || !brackets.length) throw new Error("En az bir gelir vergisi dilimi girilmelidir");
      const values = {
        company_id: companyId, year, effective_from: effectiveFrom, effective_to: effectiveTo, minimum_wage: minimumWage, sgk_floor: sgkFloor, sgk_ceiling: sgkCeiling,
        employee_sgk_rate: percentToBasisPoints(p.employeeSgkRate, "İşçi SGK oranı"),
        employer_sgk_rate: percentToBasisPoints(p.employerSgkRate, "İşveren SGK oranı"),
        employee_unemployment_rate: percentToBasisPoints(p.employeeUnemploymentRate, "İşçi işsizlik oranı"),
        employer_unemployment_rate: percentToBasisPoints(p.employerUnemploymentRate, "İşveren işsizlik oranı"),
        employer_incentive_rate: percentToBasisPoints(p.employerIncentiveRate, "SGK teşvik oranı"),
        stamp_tax_rate: percentToBasisPoints(p.stampTaxRate, "Damga vergisi oranı"),
        employee_sgdp_rate: percentToBasisPoints(p.employeeSgdpRate, "İşçi SGDP oranı"),
        employer_sgdp_rate: percentToBasisPoints(p.employerSgdpRate, "İşveren SGDP oranı"),
        income_tax_brackets: JSON.stringify(brackets),
        minimum_wage_income_tax_exemption: Number(p.minimumWageIncomeTaxExemption || 0),
        minimum_wage_stamp_tax_exemption: Number(p.minimumWageStampTaxExemption || 0),
        meal_sgk_daily_exemption: Number(p.mealSgkDailyExemption || 0),
        meal_tax_daily_exemption: Number(p.mealTaxDailyExemption || 0),
        travel_sgk_daily_exemption: Number(p.travelSgkDailyExemption || 0),
        travel_tax_daily_exemption: Number(p.travelTaxDailyExemption || 0),
        honorarium_income_tax_exemption: Number(p.honorariumIncomeTaxExemption || 0),
        honorarium_stamp_tax_exemption: Number(p.honorariumStampTaxExemption || 0),
        honorarium_other_deduction_rate: percentToBasisPoints(p.honorariumOtherDeductionRate || 0, "Huzur hakkı diğer kesinti oranı"),
        updated_by: access.email, created_at: now, updated_at: now,
      };
      const previousDay = new Date(new Date(effectiveFrom + "T00:00:00Z").getTime() - 86400000).toISOString().slice(0, 10);
      await db.from("payroll_legal_parameters").update({ effective_to: previousDay, updated_at: now, updated_by: access.email }).eq("company_id", companyId).lt("effective_from", effectiveFrom);
      const { data: inserted, error: insertError } = await db.from("payroll_legal_parameters").insert(values).select(FINANCIAL_PARAMETER_COLUMNS).single();
      let row = inserted;
      if (insertError) {
        const { company_id, year: y, effective_from, ...updateFields } = values;
        const { data: updated, error: updateError } = await db
          .from("payroll_legal_parameters")
          .update(updateFields)
          .eq("company_id", companyId)
          .eq("year", year)
          .eq("effective_from", effectiveFrom)
          .select(FINANCIAL_PARAMETER_COLUMNS)
          .single();
        if (updateError) throw new Error(updateError.message);
        row = updated;
      }
      await writeAudit(access, "UPSERT", "payroll_legal_parameters", row.id, null, row);
      return Response.json({ record: camelizeKeys(row) });
    }
    return Response.json({ error: "Geçersiz işlem" }, { status: 400 });
  } catch (e) {
    return accessError(e);
  }
}
