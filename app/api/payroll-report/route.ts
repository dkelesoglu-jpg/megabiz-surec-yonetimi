import { getDb } from "../../../db";
import {
  accessError,
  getCompanyId,
  requireAccess,
  requireModuleAccess,
} from "../../../db/authorization";
import {
  DEFAULT_LEGAL_PARAMETERS,
  dateOverlap,
  monthlyBenefit,
} from "../../../db/employer-cost-calculations";
import {
  calculatePayroll,
  type PayrollParameters,
  type PayrollType,
} from "../../../db/payroll-calculations";
import { camelizeKeys } from "../../../db/case";
import { FINANCIAL_ASSET_COLUMNS, FINANCIAL_BENEFIT_COLUMNS, FINANCIAL_EMPLOYEE_COLUMNS, FINANCIAL_HISTORY_COLUMNS, FINANCIAL_PARAMETER_COLUMNS, PAYROLL_MODULE, assertFinancialReportRole, scopeFinancialEmployees, scopeFinancialRows } from "../../../db/financial-access";

const payrollTypes: PayrollType[] = ["Normal Personel", "Emekli Personel", "Huzur Hakkı"];
const money = (value: number) => Math.round(value * 100) / 100;
function legal(row: Record<string, any> | undefined): PayrollParameters {
  if (!row) return DEFAULT_LEGAL_PARAMETERS;
  let incomeTaxBrackets = DEFAULT_LEGAL_PARAMETERS.incomeTaxBrackets;
  try { incomeTaxBrackets = JSON.parse(row.incomeTaxBrackets); } catch {}
  return { ...DEFAULT_LEGAL_PARAMETERS, ...row, stampTaxRate: row.stampTaxRate > 100 ? row.stampTaxRate / 10 : row.stampTaxRate, incomeTaxBrackets };
}
function automaticPayrollType(employeeType: string): PayrollType {
  return employeeType === "Emekli" ? "Emekli Personel" : "Normal Personel";
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
    await requireModuleAccess(access, PAYROLL_MODULE);
    assertFinancialReportRole(access.role);
    const url = new URL(request.url),
      period = url.searchParams.get("period") || new Date().toISOString().slice(0, 7),
      from = `${period}-01`,
      to = new Date(Number(period.slice(0, 4)), Number(period.slice(5, 7)), 0).toISOString().slice(0, 10),
      department = url.searchParams.get("department") || "",
      position = url.searchParams.get("position") || "",
      employeeId = Number(url.searchParams.get("employeeId") || 0),
      payrollTypeFilter = url.searchParams.get("payrollType") || "Tümü",
      status = url.searchParams.get("status") || "";
    const db = getDb();
    const [staffRes, benRes, assetRes, histRes, paramRes, companyRes] = await Promise.all([
      db.from("employees").select(FINANCIAL_EMPLOYEE_COLUMNS).eq("company_id", companyId).order("first_name", { ascending: true }),
      db.from("employee_benefits").select(FINANCIAL_BENEFIT_COLUMNS).eq("company_id", companyId),
      db.from("assets").select(FINANCIAL_ASSET_COLUMNS).eq("company_id", companyId),
      db.from("employee_cost_histories").select(FINANCIAL_HISTORY_COLUMNS).eq("company_id", companyId),
      db.from("payroll_legal_parameters").select(FINANCIAL_PARAMETER_COLUMNS).eq("company_id", companyId),
      db.from("companies").select("id, name").eq("id", companyId),
    ]);
    const staff = scopeFinancialEmployees(camelizeKeys(staffRes.data ?? []), access), employeeIds = new Set(staff.map((row) => Number(row.id))),
      benefits = scopeFinancialRows(camelizeKeys(benRes.data ?? []), employeeIds, companyId),
      assignedAssets = scopeFinancialRows(camelizeKeys(assetRes.data ?? []), employeeIds, companyId),
      histories = scopeFinancialRows(camelizeKeys(histRes.data ?? []), employeeIds, companyId),
      parameterRows = camelizeKeys(paramRes.data ?? []),
      companyRows = camelizeKeys(companyRes.data ?? []);
    const parameterRow = parameterRows
        .filter((row) => row.effectiveFrom <= to && (!row.effectiveTo || row.effectiveTo >= from))
        .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0],
      parameters = legal(parameterRow),
      filteredStaff = staff.filter((employee) => {
        const payrollType = payrollTypes.includes(employee.payrollType as PayrollType) ? (employee.payrollType as PayrollType) : automaticPayrollType(employee.employeeType);
        return (
          (!department || employee.department === department) &&
          (!position || employee.position === position) &&
          (!employeeId || employee.id === employeeId) &&
          (!status || employee.status === status) &&
          (payrollTypeFilter === "Tümü" || payrollType === payrollTypeFilter) &&
          dateOverlap(from, to, employee.startDate || from, employee.endDate) > 0
        );
      }),
      rows = filteredStaff.map((employee) => {
        const payrollType = payrollTypes.includes(employee.payrollType as PayrollType) ? (employee.payrollType as PayrollType) : automaticPayrollType(employee.employeeType),
          salaryVersion = histories
            .filter((history) => history.employeeId === employee.id && dateOverlap(from, to, history.effectiveFrom, history.effectiveTo) > 0)
            .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0],
          benefitTotal = benefits
            .filter((benefit) => benefit.employeeId === employee.id && benefit.status === "Aktif" && benefit.includeInEmployerCost && dateOverlap(from, to, benefit.effectiveFrom, benefit.effectiveTo) > 0)
            .reduce((sum, benefit) => sum + monthlyBenefit(benefit.amount, benefit.frequency), 0),
          assetTotal = assignedAssets
            .filter((asset) => asset.assignedEmployeeId === employee.id && asset.includeInEmployerCost && asset.status === "Zimmetli" && dateOverlap(from, to, asset.assignedAt || from, asset.returnedAt) > 0)
            .reduce((sum, asset) => sum + asset.monthlyCost, 0),
          payroll = calculatePayroll(
            {
              payrollType,
              salaryBasis: salaryVersion?.salaryBasis ?? employee.salaryBasis,
              netSalary: salaryVersion?.netSalary ?? employee.netSalary,
              grossSalary: salaryVersion?.grossSalary ?? employee.salary,
              cumulativeTaxBase: employee.cumulativeTaxBase,
              benefits: benefitTotal + assetTotal,
            },
            parameters,
          );
        return {
          id: employee.id, employeeNo: employee.employeeNo, name: `${employee.firstName} ${employee.lastName}`,
          company: companyRows[0]?.name || companyId, department: employee.department, position: employee.position,
          employeeType: employee.employeeType, status: employee.status, salaryBasis: employee.salaryBasis, ...payroll,
        };
      });
    const sum = (key: keyof (typeof rows)[number]) => money(rows.reduce((total, row) => total + Number(row[key] || 0), 0)),
      count = (type: PayrollType) => rows.filter((row) => row.payrollType === type).length,
      cost = (type: PayrollType) => money(rows.filter((row) => row.payrollType === type).reduce((total, row) => total + row.employerCost, 0));
    return Response.json({
      companyName: companyRows[0]?.name || companyId,
      period,
      range: { from, to },
      rows,
      summary: {
        totalCount: rows.length,
        normalCount: count("Normal Personel"),
        retiredCount: count("Emekli Personel"),
        honorariumCount: count("Huzur Hakkı"),
        totalNet: sum("netPaid"),
        totalGross: sum("gross"),
        totalEmployerSgk: money(sum("employerSgk") + sum("employerSgdp")),
        totalTax: money(sum("paidIncomeTax") + sum("paidStampTax")),
        totalBenefits: sum("benefits"),
        totalEmployerCost: sum("employerCost"),
        normalCost: cost("Normal Personel"),
        retiredCost: cost("Emekli Personel"),
        honorariumCost: cost("Huzur Hakkı"),
      },
      filters: {
        departments: [...new Set(staff.map((item) => item.department).filter(Boolean))],
        positions: [...new Set(staff.map((item) => item.position).filter(Boolean))],
        employees: staff.map((item) => ({ id: item.id, name: `${item.firstName} ${item.lastName}`, employeeNo: item.employeeNo })),
        statuses: [...new Set(staff.map((item) => item.status).filter(Boolean))],
      },
      parameterSnapshot: {
        year: Number(period.slice(0, 4)),
        effectiveFrom: parameterRow?.effectiveFrom || null,
        effectiveTo: parameterRow?.effectiveTo || null,
        minimumWage: parameters.minimumWage,
        sgkFloor: parameters.sgkFloor,
        sgkCeiling: parameters.sgkCeiling,
        employeeSgkRate: parameters.employeeSgkRate,
        employerSgkRate: parameters.employerSgkRate,
        employeeUnemploymentRate: parameters.employeeUnemploymentRate,
        employerUnemploymentRate: parameters.employerUnemploymentRate,
        employeeSgdpRate: parameters.employeeSgdpRate,
        employerSgdpRate: parameters.employerSgdpRate,
        stampTaxRate: parameters.stampTaxRate,
        incomeTaxBrackets: parameters.incomeTaxBrackets,
        minimumWageIncomeTaxExemption: parameters.minimumWageIncomeTaxExemption,
        minimumWageStampTaxExemption: parameters.minimumWageStampTaxExemption,
        employerIncentiveRate: parameters.employerIncentiveRate,
        mealSgkDailyExemption: parameters.mealSgkDailyExemption,
        mealTaxDailyExemption: parameters.mealTaxDailyExemption,
        travelSgkDailyExemption: parameters.travelSgkDailyExemption,
        travelTaxDailyExemption: parameters.travelTaxDailyExemption,
        honorariumIncomeTaxExemption: parameters.honorariumIncomeTaxExemption || 0,
        honorariumStampTaxExemption: parameters.honorariumStampTaxExemption || 0,
        honorariumOtherDeductionRate: parameters.honorariumOtherDeductionRate || 0,
      },
      appliedFilters: { department, position, employeeId, payrollType: payrollTypeFilter, status },
    });
  } catch (error) {
    return accessError(error);
  }
}
