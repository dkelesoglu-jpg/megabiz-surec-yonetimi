import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { buildDashboardPayload, dashboardEmployeeColumns } from "../db/dashboard-access.ts";

const now = new Date("2026-09-05T12:00:00Z").getTime();
const employees = [
  { id: 1, companyId: "company-a", employeeNo: "A-1", firstName: "Own", lastName: "Employee", email: "employee@example.com", manager: "Manager User", department: "Sales", employeeType: "Normal", workType: "Tam Zamanlı", status: "Aktif", workPermitEnd: "2026-09-10", salary: 100, netSalary: 80, nationalId: "forbidden", passportNo: "forbidden", iban: "forbidden" },
  { id: 2, companyId: "company-a", employeeNo: "A-2", firstName: "Direct", lastName: "Report", email: "report@example.com", manager: "Manager User", department: "Sales", employeeType: "Normal", workType: "Tam Zamanlı", status: "Aktif", workPermitEnd: "2026-09-11", salary: 200, netSalary: 160 },
  { id: 3, companyId: "company-a", employeeNo: "A-3", firstName: "Other", lastName: "Worker", email: "other@example.com", manager: "Other Manager", department: "HR", employeeType: "Normal", workType: "Tam Zamanlı", status: "Aktif", workPermitEnd: "2026-09-12", salary: 300, netSalary: 240 },
  { id: 4, companyId: "company-b", employeeNo: "B-1", firstName: "Other", lastName: "Tenant", email: "tenant@example.com", manager: "Manager User", department: "Secret", employeeType: "Normal", workType: "Tam Zamanlı", status: "Aktif", workPermitEnd: "2026-09-09", salary: 9999, netSalary: 8888 },
];
const reviews = employees.map((employee) => ({ id: employee.id, companyId: employee.companyId, employeeId: employee.id, overallScore: 90, status: "Bekliyor" }));
const assets = employees.map((employee) => ({ id: employee.id, companyId: employee.companyId, assignedEmployeeId: employee.id, status: "Zimmetli", expectedReturnDate: "2026-09-01" }));
const records = employees.map((employee) => ({ id: employee.id, companyId: employee.companyId, module: "Belge / Evrak Takibi", title: `Record ${employee.id}`, owner: `${employee.firstName} ${employee.lastName}`, department: employee.department, dueDate: "2026-09-10", status: "Eksik" }));
const documents = employees.map((employee) => ({ id: employee.id, companyId: employee.companyId, name: `Document ${employee.id}`, category: "Sözleşme", relatedId: String(employee.id), expiryDate: "2026-09-10" }));

function payload(role, email, fullName = null) {
  return buildDashboardPayload({ access: { role, email, fullName, companyId: "company-a" }, employees, reviews, assets, records, documents, now });
}

test("dashboard employee sorgusu kimlik, banka ve sağlık sütunlarını seçmez", () => {
  for (const role of ["employee", "manager", "hr", "company_admin"]) {
    const columns = dashboardEmployeeColumns(role);
    assert.doesNotMatch(columns, /\*|national_id|passport|iban|bank|blood|health/i);
    assert.doesNotMatch(columns, /(^|,\s*)(salary|net_salary)(,|$)/i);
  }
});

test("Dashboard API tüm tablolarda açık sütun projeksiyonu kullanır", async () => {
  const source = await readFile(new URL("../app/api/dashboard/route.ts", import.meta.url), "utf8");
  assert.doesNotMatch(source, /\.select\(\s*["']\*["']\s*\)|\.select\(\s*\)/);
  assert.doesNotMatch(source, /national_id|passport_no|iban|bank|blood_type|health/i);
});

test("employee yalnızca kendi dashboard kapsamını ve uyarılarını görür", () => {
  const result = payload("employee", "employee@example.com", "Own Employee");
  assert.equal(result.employees.total, 1);
  assert.equal(result.alerts.some((alert) => alert.title === "Direct Report"), false);
  assert.equal(result.alerts.some((alert) => alert.title === "Own Employee"), true);
});

test("employee yanıtında ücret veya kimlik değeri bulunmaz", () => {
  const result = payload("employee", "employee@example.com");
  const serialized = JSON.stringify(result);
  assert.deepEqual(result.payroll, { gross: 0, net: 0 });
  for (const forbidden of ["forbidden", "100", "Other Worker", "Other Tenant"]) assert.equal(serialized.includes(forbidden), false);
});

test("manager yalnızca kendisi ve doğrudan bağlı çalışanları görür, ücret göremez", () => {
  const result = payload("manager", "manager@example.com", "Manager User");
  assert.equal(result.employees.total, 2);
  assert.deepEqual(result.payroll, { gross: 0, net: 0 });
  assert.equal(result.alerts.some((alert) => alert.title === "Other Worker"), false);
  assert.equal(result.alerts.some((alert) => alert.title === "Other Tenant"), false);
});

test("çalışma izni uyarısı yalnızca ad, sicil ve bitiş tarihini kullanır", () => {
  const alert = payload("employee", "employee@example.com").alerts.find((item) => item.kind === "Çalışma İzni");
  assert.equal(alert.title, "Own Employee");
  assert.equal(alert.detail, "Sicil: A-1");
  assert.equal(alert.date, "2026-09-10");
  assert.equal(JSON.stringify(alert).includes("forbidden"), false);
});

test("HR ve company_admin şirket operasyonunu görür fakat ücret toplamını görmez", () => {
  for (const role of ["hr", "company_admin"]) {
    const result = payload(role, `${role}@example.com`);
    assert.equal(result.employees.total, 3);
    assert.deepEqual(result.payroll, { gross: 0, net: 0 });
  }
});

test("payroll ücret özetini görür fakat kişisel operasyon uyarılarını görmez", () => {
  const result = payload("payroll", "payroll@example.com");
  assert.equal(result.employees.total, 3);
  assert.deepEqual(result.payroll, { gross: 600, net: 480 });
  assert.deepEqual(result.alerts, []);
});

test("super_admin şirket geneli dashboard ve ücret özetini korur", () => {
  const result = payload("super_admin", "root@example.com");
  assert.equal(result.employees.total, 3);
  assert.deepEqual(result.payroll, { gross: 600, net: 480 });
  assert.equal(result.alerts.length > 0, true);
});

test("hiçbir rol başka şirket verisini alamaz", () => {
  for (const role of ["employee", "manager", "hr", "payroll", "company_admin", "super_admin"]) {
    const result = payload(role, role === "employee" ? "employee@example.com" : `${role}@example.com`, role === "manager" ? "Manager User" : null);
    const serialized = JSON.stringify(result);
    assert.equal(serialized.includes("Other Tenant"), false);
    assert.equal(serialized.includes("9999"), false);
  }
});
