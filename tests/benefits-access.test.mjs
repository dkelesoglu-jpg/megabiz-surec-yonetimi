import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { accessStatusForErrorMessage } from "../db/tenant-access.ts";
import {
  PERSONNEL_COST_MODULE,
  assertFinancialReportRole,
  scopeFinancialEmployees,
  scopeFinancialRows,
} from "../db/financial-access.ts";

const staff = [
  { id: 1, companyId: "company-a", manager: "Manager User", departmentId: 10 },
  { id: 2, companyId: "company-a", manager: "manager@example.com", departmentId: 10 },
  { id: 3, companyId: "company-a", manager: "Other Manager", departmentId: 20 },
  { id: 4, companyId: "company-b", manager: "Manager User", departmentId: 30 },
];
const assignments = [
  { id: 11, companyId: "company-a", employeeId: 1, amount: 100 },
  { id: 12, companyId: "company-a", employeeId: 2, amount: 200 },
  { id: 13, companyId: "company-a", employeeId: 3, amount: 300 },
  { id: 14, companyId: "company-b", employeeId: 1, amount: 9999 },
];
const manager = { role: "manager", email: "manager@example.com", fullName: "Manager User", companyId: "company-a" };

test("manager yalnızca doğrudan bağlı çalışanların yan haklarını görür", () => {
  const employees = scopeFinancialEmployees(staff, manager);
  const rows = scopeFinancialRows(assignments, new Set(employees.map((row) => row.id)), manager.companyId);
  assert.deepEqual(employees.map((row) => row.id), [1, 2]);
  assert.deepEqual(rows.map((row) => row.id), [11, 12]);
});

test("manager başka çalışanın yan hakkına erişemez", () => {
  const employeeIds = new Set(scopeFinancialEmployees(staff, manager).map((row) => row.id));
  assert.equal(employeeIds.has(3), false);
  assert.deepEqual(scopeFinancialRows(assignments.filter((row) => row.employeeId === 3), employeeIds, manager.companyId), []);
});

test("employee şirket geneli yan hak finansal verilerinden 403 alır", () => {
  assert.throws(() => assertFinancialReportRole("employee"), (error) => {
    assert.equal(accessStatusForErrorMessage(error.message), 403);
    return true;
  });
});

test("HR payroll company_admin ve super_admin yalnızca seçili şirket satırlarını görür", () => {
  for (const role of ["hr", "payroll", "company_admin", "super_admin"]) {
    const access = { ...manager, role };
    const employees = scopeFinancialEmployees(staff, access);
    const rows = scopeFinancialRows(assignments, new Set(employees.map((row) => row.id)), access.companyId);
    assert.deepEqual(employees.map((row) => row.id), [1, 2, 3]);
    assert.deepEqual(rows.map((row) => row.id), [11, 12, 13]);
  }
});

test("manager erişimi mevcut finans modülü üzerinden açılıp kapatılır", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.equal(PERSONNEL_COST_MODULE, "Ücret / Maliyet / Bütçe");
  assert.match(source, /requireModuleAccess\(access, PERSONNEL_COST_MODULE\)/);
});

test("GET istenen employeeId manager kapsamı dışında ise 403 kapısını kullanır", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.match(source, /if \(employeeId && !employee\) throw new Error\("COMPANY_ACCESS_DENIED"\)/);
  assert.equal(accessStatusForErrorMessage("COMPANY_ACCESS_DENIED"), 403);
});

test("yazma ve silme işlemleri manager ile employee rollerine kapalıdır", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.match(source, /const roles = \["super_admin", "company_admin", "hr", "payroll"\]/);
  assert.equal((source.match(/if \(!roles\.includes\(access\.role\)\) throw new Error\("MODULE_ACCESS_DENIED"\)/g) ?? []).length, 2);
});

test("tüm sorgular tenant koşulu taşır ve mutasyonlar şirket ile sınırlandırılır", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.match(source, /update\(values\)\.eq\("id", id\)\.eq\("company_id", companyId\)\.eq\("employee_id", employeeId\)/);
  assert.match(source, /delete\(\)\.eq\("id", id\)\.eq\("company_id", companyId\)/);
  assert.match(source, /select\("id, company_id"\)\.eq\("id", definitionId\)\.eq\("company_id", companyId\)/);
});

test("Benefits sorguları geniş seçim veya gereksiz hassas personel alanı içermez", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.select\(\s*["']\*["']\s*\)|\.select\(\s*\)/);
  const employeeColumns = source.match(/const EMPLOYEE_COLUMNS = "([^"]+)"/)?.[1] ?? "";
  assert.doesNotMatch(employeeColumns, /national_id|passport|iban|address|salary|net_salary|bank|blood|health/i);
  assert.match(employeeColumns, /manager/);
});

test("PUT tanımlı değildir ve mevcut HTTP yöntemi davranışı korunur", async () => {
  const source = await readFile(new URL("../app/api/benefits/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /export async function PUT/);
});
