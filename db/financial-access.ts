export const PERSONNEL_COST_MODULE = "Ücret / Maliyet / Bütçe";
export const PAYROLL_MODULE = "Bordro Detayları";

export const FINANCIAL_EMPLOYEE_COLUMNS = [
  "id", "company_id", "employee_no", "first_name", "last_name", "email", "manager",
  "department_id", "department", "position", "employee_type", "work_type", "payroll_type",
  "status", "start_date", "end_date", "salary", "net_salary", "salary_basis", "cumulative_tax_base",
].join(", ");
export const FINANCIAL_BENEFIT_COLUMNS = "id, company_id, employee_id, category, name, amount, currency, frequency, effective_from, effective_to, include_in_employer_cost, status, created_by, created_at, updated_at";
export const FINANCIAL_ASSET_COLUMNS = "id, company_id, assigned_employee_id, assigned_at, returned_at, monthly_cost, include_in_employer_cost, status";
export const FINANCIAL_HISTORY_COLUMNS = "id, company_id, employee_id, effective_from, effective_to, salary_basis, gross_salary, net_salary, sgk_incentive_rate";
export const FINANCIAL_PARAMETER_COLUMNS = "id, company_id, year, effective_from, effective_to, minimum_wage, sgk_floor, sgk_ceiling, employee_sgk_rate, employer_sgk_rate, employee_unemployment_rate, employer_unemployment_rate, employer_incentive_rate, stamp_tax_rate, employee_sgdp_rate, employer_sgdp_rate, income_tax_brackets, minimum_wage_income_tax_exemption, minimum_wage_stamp_tax_exemption, meal_sgk_daily_exemption, meal_tax_daily_exemption, travel_sgk_daily_exemption, travel_tax_daily_exemption, honorarium_income_tax_exemption, honorarium_stamp_tax_exemption, honorarium_other_deduction_rate, updated_by, created_at, updated_at";
export const FINANCIAL_BUDGET_COLUMNS = "id, company_id, year, month, department_id, position, amount, note, created_by, created_at, updated_at";
export const FINANCIAL_SCENARIO_COLUMNS = "id, company_id, year, name, salary_increase_rate, increase_month, benefit_increase_rate, scope_type, scope_value, include_planned_heads, status, created_by, created_at, updated_at";
export const FINANCIAL_HEADCOUNT_COLUMNS = "id, company_id, year, department_id, position, planned_start_date, planned_net_salary, planned_monthly_cost, headcount, status, note, created_by, created_at, updated_at";

export type FinancialAccess = { email: string; fullName: string | null; role: string; companyId: string };
type Row = Record<string, any>;

export function assertFinancialReportRole(role: string): void {
  if (role === "employee") throw new Error("MODULE_ACCESS_DENIED");
}

export function scopeFinancialEmployees(rows: Row[], access: FinancialAccess): Row[] {
  assertFinancialReportRole(access.role);
  const tenantRows = rows.filter((row) => row.companyId === access.companyId);
  if (access.role !== "manager") return tenantRows;
  const email = access.email.trim().toLocaleLowerCase("tr");
  const name = (access.fullName ?? "").trim().toLocaleLowerCase("tr");
  return tenantRows.filter((row) => {
    const manager = String(row.manager ?? "").trim().toLocaleLowerCase("tr");
    return manager === email || Boolean(name && manager === name);
  });
}

export function scopeFinancialRows(rows: Row[], employeeIds: Set<number>, companyId: string): Row[] {
  return rows.filter((row) => row.companyId === companyId && employeeIds.has(Number(row.employeeId ?? row.assignedEmployeeId)));
}

export function canViewCompanyFinancialPlanning(role: string): boolean {
  return role !== "manager";
}

export function sanitizeFinancialPayloadForRole<T>(value: T, role: string): T {
  if (role !== "manager") return value;
  if (Array.isArray(value)) return value.map((item) => sanitizeFinancialPayloadForRole(item, role)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key.toLocaleLowerCase("tr") !== "health")
      .map(([key, item]) => [key, sanitizeFinancialPayloadForRole(item, role)])) as T;
  }
  return value;
}
