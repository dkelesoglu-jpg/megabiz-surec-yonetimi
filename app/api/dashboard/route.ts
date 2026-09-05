import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess } from "../../../db/authorization";
import { buildDashboardPayload, dashboardEmployeeColumns } from "../../../db/dashboard-access";
import { camelizeKeys } from "../../../db/case";

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request);
    const access = await requireAccess(request, companyId);
    const db = getDb();
    const [employeeResult, reviewResult, assetResult, recordResult, documentResult] = await Promise.all([
      db.from("employees").select(dashboardEmployeeColumns(access.role)).eq("company_id", companyId),
      db.from("performance_reviews").select("id, company_id, employee_id, overall_score, status").eq("company_id", companyId),
      db.from("assets").select("id, company_id, assigned_employee_id, expected_return_date, status").eq("company_id", companyId),
      db.from("module_records").select("id, company_id, module, title, owner, department, due_date, status").eq("company_id", companyId),
      db.from("documents").select("id, company_id, name, category, related_id, expiry_date").eq("company_id", companyId),
    ]);

    return Response.json(buildDashboardPayload({
      access,
      employees: camelizeKeys(employeeResult.data ?? []),
      reviews: camelizeKeys(reviewResult.data ?? []),
      assets: camelizeKeys(assetResult.data ?? []),
      records: camelizeKeys(recordResult.data ?? []),
      documents: camelizeKeys(documentResult.data ?? []),
    }));
  } catch (error) {
    return accessError(error);
  }
}
