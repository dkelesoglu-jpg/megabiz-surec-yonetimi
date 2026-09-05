export type DashboardAccess = { email: string; fullName: string | null; role: string; companyId: string };
type Row = Record<string, any>;

export const DASHBOARD_EMPLOYEE_BASE_COLUMNS = [
  "id", "company_id", "employee_no", "first_name", "last_name", "email", "manager",
  "department", "employee_type", "work_type", "status", "work_permit_end",
].join(", ");

export function dashboardEmployeeColumns(role: string): string {
  return ["super_admin", "payroll"].includes(role)
    ? `${DASHBOARD_EMPLOYEE_BASE_COLUMNS}, salary, net_salary`
    : DASHBOARD_EMPLOYEE_BASE_COLUMNS;
}

export function canViewDashboardPayroll(role: string): boolean {
  return role === "super_admin" || role === "payroll";
}

function same(value: unknown, expected: string): boolean {
  return String(value ?? "").trim().toLocaleLowerCase("tr") === expected;
}

function tenantRows(rows: Row[], access: DashboardAccess): Row[] {
  return rows.filter((row) => row.companyId === access.companyId);
}

function scopedEmployees(rows: Row[], access: DashboardAccess): Row[] {
  const companyRows = tenantRows(rows, access);
  if (!["employee", "manager"].includes(access.role)) return companyRows;
  const email = access.email.trim().toLocaleLowerCase("tr");
  const name = (access.fullName ?? "").trim().toLocaleLowerCase("tr");
  return companyRows.filter((row) =>
    same(row.email, email) ||
    (access.role === "manager" && (same(row.manager, email) || Boolean(name && same(row.manager, name))))
  );
}

export function buildDashboardPayload(input: {
  access: DashboardAccess;
  employees: Row[];
  reviews: Row[];
  assets: Row[];
  records: Row[];
  documents: Row[];
  now?: number;
}) {
  const { access } = input;
  const employees = scopedEmployees(input.employees, access);
  const employeeIds = new Set(employees.map((row) => Number(row.id)));
  const restricted = ["employee", "manager"].includes(access.role);
  const operational = access.role !== "payroll";
  const reviews = tenantRows(input.reviews, access).filter((row) => !restricted || employeeIds.has(Number(row.employeeId)));
  const assets = tenantRows(input.assets, access).filter((row) => !restricted || employeeIds.has(Number(row.assignedEmployeeId)));
  const allowedOwners = new Set(employees.flatMap((row) => [row.email, `${row.firstName ?? ""} ${row.lastName ?? ""}`])
    .map((value) => String(value ?? "").trim().toLocaleLowerCase("tr")).filter(Boolean));
  const records = operational
    ? tenantRows(input.records, access).filter((row) => !restricted || allowedOwners.has(String(row.owner ?? "").trim().toLocaleLowerCase("tr")))
    : [];
  const documents = operational
    ? tenantRows(input.documents, access).filter((row) => !restricted || employeeIds.has(Number(row.relatedId)))
    : [];
  const now = input.now ?? Date.now();
  const days = (date: string | null | undefined) => date
    ? Math.ceil((new Date(`${date}T23:59:59`).getTime() - now) / 86400000)
    : null;
  const severity = (value: number) => value < 0 ? "expired" : value <= 7 ? "critical" : value <= 30 ? "warning" : "info";
  const alerts: Array<{ kind: string; title: string; detail: string; date: string; days: number; module: string; severity: string }> = [];

  if (operational) {
    for (const employee of employees) {
      const left = days(employee.workPermitEnd);
      if (left !== null && left <= 90) alerts.push({ kind: "Çalışma İzni", title: `${employee.firstName} ${employee.lastName}`,
        detail: `Sicil: ${employee.employeeNo || "—"}`, date: employee.workPermitEnd || "", days: left, module: "Personel", severity: severity(left) });
    }
    for (const document of documents) {
      const left = days(document.expiryDate);
      if (left !== null && left <= 90) alerts.push({ kind: document.category, title: document.name,
        detail: `Personel / Sicil bağlantısı: ${document.relatedId || "—"}`, date: document.expiryDate || "", days: left,
        module: "Belge / Evrak Takibi", severity: severity(left) });
    }
    for (const record of records) {
      if (!["Belge / Evrak Takibi", "Eğitim & Oryantasyon", "İş Talimatları", "Yasal Haklar"].includes(record.module)) continue;
      const left = days(record.dueDate);
      if (left !== null && left <= 90) alerts.push({ kind: record.module, title: record.title,
        detail: record.owner || record.department || "Sorumlu atanmamış", date: record.dueDate || "", days: left,
        module: record.module, severity: severity(left) });
    }
  }

  alerts.sort((a, b) => a.days - b.days);
  const departments = Object.entries(employees.reduce((out: Record<string, number>, row) => ({ ...out, [row.department]: (out[row.department] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const types = Object.entries(employees.reduce((out: Record<string, number>, row) => ({ ...out, [row.employeeType]: (out[row.employeeType] || 0) + 1 }), {}));
  const active = employees.filter((row) => row.status === "Aktif").length;
  const average = reviews.length ? Math.round(reviews.reduce((sum, row) => sum + Number(row.overallScore || 0), 0) / reviews.length) : 0;
  const assigned = assets.filter((row) => row.status === "Zimmetli").length;
  const canViewPayroll = canViewDashboardPayroll(access.role);

  return {
    employees: { total: employees.length, active, leave: employees.filter((row) => row.status === "İzinli").length,
      foreign: employees.filter((row) => row.employeeType === "Yabancı").length,
      partTime: employees.filter((row) => row.employeeType === "Part Time" || row.workType === "Yarı Zamanlı").length,
      terminated: employees.filter((row) => ["İşten Ayrıldı", "Pasif"].includes(row.status)).length },
    performance: { count: reviews.length, average, pending: reviews.filter((row) => row.status !== "Tamamlandı").length,
      high: reviews.filter((row) => Number(row.overallScore) >= 90).length },
    assets: { total: assets.length, assigned, late: assets.filter((row) => row.status === "Zimmetli" && (days(row.expectedReturnDate) ?? 1) < 0).length },
    actions: { pending: records.filter((row) => ["Taslak", "Bekliyor", "Talep Edildi", "Planlandı", "Hazırlanıyor", "Onay Bekliyor", "Riskli"].includes(row.status)).length,
      permits: alerts.filter((row) => row.kind === "Çalışma İzni").length,
      missingDocuments: records.filter((row) => row.module === "Belge / Evrak Takibi" && row.status === "Eksik").length },
    payroll: { gross: canViewPayroll ? employees.reduce((sum, row) => sum + Number(row.salary || 0), 0) : 0,
      net: canViewPayroll ? employees.reduce((sum, row) => sum + Number(row.netSalary || 0), 0) : 0 },
    departments, types, alerts: alerts.slice(0, 20),
    alertSummary: { expired: alerts.filter((row) => row.days < 0).length,
      seven: alerts.filter((row) => row.days >= 0 && row.days <= 7).length,
      thirty: alerts.filter((row) => row.days > 7 && row.days <= 30).length,
      ninety: alerts.filter((row) => row.days > 30 && row.days <= 90).length },
  };
}
