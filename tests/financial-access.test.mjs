import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { accessStatusForErrorMessage } from "../db/tenant-access.ts";
import { FINANCIAL_EMPLOYEE_COLUMNS, assertFinancialReportRole, canViewCompanyFinancialPlanning, sanitizeFinancialPayloadForRole, scopeFinancialEmployees, scopeFinancialRows } from "../db/financial-access.ts";

const staff = [
  { id: 1, companyId: "a", firstName: "Direct", manager: "Manager User", salary: 100 },
  { id: 2, companyId: "a", firstName: "By Email", manager: "manager@example.com", salary: 200 },
  { id: 3, companyId: "a", firstName: "Other", manager: "Other Manager", salary: 300 },
  { id: 4, companyId: "b", firstName: "Other Tenant", manager: "Manager User", salary: 9999 },
];
const manager = { role: "manager", email: "manager@example.com", fullName: "Manager User", companyId: "a" };

test("manager yalnızca doğrudan bağlı çalışanların finansal satırlarını görür", () => {
  assert.deepEqual(scopeFinancialEmployees(staff, manager).map((row) => row.id), [1, 2]);
});

test("manager toplamları yalnızca doğrudan ekibi üzerinden hesaplayabilir", () => {
  assert.equal(scopeFinancialEmployees(staff, manager).reduce((sum, row) => sum + row.salary, 0), 300);
  assert.equal(canViewCompanyFinancialPlanning("manager"), false);
});

test("employee bordro ve maliyet raporlarından 403 alır", () => {
  assert.throws(() => assertFinancialReportRole("employee"), (error) => {
    assert.equal(accessStatusForErrorMessage(error.message), 403);
    return true;
  });
});

test("company_admin modül yetkisini kapattığında mevcut yetki hatası 403 olur", () => {
  assert.equal(accessStatusForErrorMessage("MODULE_ACCESS_DENIED"), 403);
});

test("HR payroll company_admin ve super_admin kendi şirket personelini görür", () => {
  for (const role of ["hr", "payroll", "company_admin", "super_admin"]) {
    assert.deepEqual(scopeFinancialEmployees(staff, { ...manager, role }).map((row) => row.id), [1, 2, 3]);
  }
});

test("ilişkili finansal tablolar manager ekibi ve tenant ile sınırlanır", () => {
  const rows = [{ companyId: "a", employeeId: 1 }, { companyId: "a", employeeId: 3 }, { companyId: "b", employeeId: 1 }];
  assert.deepEqual(scopeFinancialRows(rows, new Set([1, 2]), "a"), [rows[0]]);
});

test("finansal personel projeksiyonu ilgisiz hassas alan içermez", () => {
  assert.doesNotMatch(FINANCIAL_EMPLOYEE_COLUMNS, /\*|national_id|passport|address|emergency|iban|bank|blood|health/i);
});

test("manager finansal yanıtından sağlık kırılımı çıkarılır", () => {
  const result = sanitizeFinancialPayloadForRole({ gross: 100, health: 25, nested: { health: 10, employerCost: 135 } }, "manager");
  assert.deepEqual(result, { gross: 100, nested: { employerCost: 135 } });
});

test("route'lar mevcut modül yetki kapılarını kullanır ve geniş select içermez", async () => {
  const routes = [
    ["../app/api/personnel-costs/route.ts", "PERSONNEL_COST_MODULE"],
    ["../app/api/personnel-cost-reports/route.ts", "PERSONNEL_COST_MODULE"],
    ["../app/api/payroll-report/route.ts", "PAYROLL_MODULE"],
  ];
  for (const [path, moduleName] of routes) {
    const source = await readFile(new URL(path, import.meta.url), "utf8");
    assert.match(source, /requireModuleAccess\(access,/);
    assert.equal(source.includes(moduleName), true);
    assert.doesNotMatch(source, /\.select\(\s*["']\*["']\s*\)|\.select\(\s*\)/);
  }
});
