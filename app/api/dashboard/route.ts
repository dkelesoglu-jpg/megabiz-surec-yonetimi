import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

type Alert = {
  kind: string;
  title: string;
  detail: string;
  date: string;
  days: number;
  module: string;
  severity: "expired" | "critical" | "warning" | "info";
};

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request);
    await requireAccess(request, companyId);
    const db = getDb();
    const [emp, perf, ast, mod, doc] = await Promise.all([
      db.from("employees").select("*").eq("company_id", companyId),
      db.from("performance_reviews").select("*").eq("company_id", companyId),
      db.from("assets").select("*").eq("company_id", companyId),
      db.from("module_records").select("*").eq("company_id", companyId),
      db.from("documents").select("*").eq("company_id", companyId),
    ]);
    const e = camelizeKeys(emp.data ?? []),
      r = camelizeKeys(perf.data ?? []),
      a = camelizeKeys(ast.data ?? []),
      m = camelizeKeys(mod.data ?? []),
      d = camelizeKeys(doc.data ?? []);
    const now = Date.now(),
      days = (date: string | null) =>
        date
          ? Math.ceil((new Date(date + "T23:59:59").getTime() - now) / 86400000)
          : null,
      severity = (v: number): Alert["severity"] =>
        v < 0 ? "expired" : v <= 7 ? "critical" : v <= 30 ? "warning" : "info",
      alerts: Alert[] = [];
    for (const x of e) {
      const left = days(x.workPermitEnd);
      if (left !== null && left <= 90)
        alerts.push({
          kind: "Çalışma İzni",
          title: `${x.firstName} ${x.lastName}`,
          detail: `T.C./Pasaport: ${x.passportNo || x.nationalId}`,
          date: x.workPermitEnd || "",
          days: left,
          module: "Personel",
          severity: severity(left),
        });
    }
    for (const x of d) {
      const left = days(x.expiryDate);
      if (left !== null && left <= 90)
        alerts.push({
          kind: x.category,
          title: x.name,
          detail: `Personel / Sicil bağlantısı: ${x.relatedId || "—"}`,
          date: x.expiryDate || "",
          days: left,
          module: "Belge / Evrak Takibi",
          severity: severity(left),
        });
    }
    for (const x of m) {
      if (
        ![
          "Belge / Evrak Takibi",
          "Eğitim & Oryantasyon",
          "İş Talimatları",
          "Yasal Haklar",
        ].includes(x.module)
      )
        continue;
      const left = days(x.dueDate);
      if (left !== null && left <= 90)
        alerts.push({
          kind: x.module,
          title: x.title,
          detail: x.owner || x.department || "Sorumlu atanmamış",
          date: x.dueDate || "",
          days: left,
          module: x.module,
          severity: severity(left),
        });
    }
    alerts.sort((x, y) => x.days - y.days);
    const departments = Object.entries(
        e.reduce(
          (o: Record<string, number>, x) => ({ ...o, [x.department]: (o[x.department] || 0) + 1 }),
          {} as Record<string, number>,
        ),
      ).sort((x, y) => y[1] - x[1]),
      types = Object.entries(
        e.reduce(
          (o: Record<string, number>, x) => ({ ...o, [x.employeeType]: (o[x.employeeType] || 0) + 1 }),
          {} as Record<string, number>,
        ),
      ),
      active = e.filter((x) => x.status === "Aktif").length,
      leave = e.filter((x) => x.status === "İzinli").length,
      foreign = e.filter((x) => x.employeeType === "Yabancı"),
      avg = r.length
        ? Math.round(r.reduce((s: number, x) => s + x.overallScore, 0) / r.length)
        : 0,
      pendingReviews = r.filter((x) => x.status !== "Tamamlandı").length,
      assigned = a.filter((x) => x.status === "Zimmetli").length,
      lateAssets = a.filter(
        (x) => x.status === "Zimmetli" && (days(x.expectedReturnDate) ?? 1) < 0,
      ).length,
      pending = m.filter((x) =>
        [
          "Taslak",
          "Bekliyor",
          "Talep Edildi",
          "Planlandı",
          "Hazırlanıyor",
          "Onay Bekliyor",
          "Riskli",
        ].includes(x.status),
      ).length,
      gross = e.reduce((s: number, x) => s + (x.salary || 0), 0),
      net = e.reduce((s: number, x) => s + (x.netSalary || 0), 0);
    return Response.json({
      employees: {
        total: e.length,
        active,
        leave,
        foreign: foreign.length,
        partTime: e.filter(
          (x) =>
            x.employeeType === "Part Time" || x.workType === "Yarı Zamanlı",
        ).length,
        terminated: e.filter((x) => ["İşten Ayrıldı", "Pasif"].includes(x.status))
          .length,
      },
      performance: {
        count: r.length,
        average: avg,
        pending: pendingReviews,
        high: r.filter((x) => x.overallScore >= 90).length,
      },
      assets: { total: a.length, assigned, late: lateAssets },
      actions: {
        pending,
        permits: alerts.filter((x) => x.kind === "Çalışma İzni").length,
        missingDocuments: m.filter(
          (x) => x.module === "Belge / Evrak Takibi" && x.status === "Eksik",
        ).length,
      },
      payroll: { gross, net },
      departments,
      types,
      alerts: alerts.slice(0, 20),
      alertSummary: {
        expired: alerts.filter((x) => x.days < 0).length,
        seven: alerts.filter((x) => x.days >= 0 && x.days <= 7).length,
        thirty: alerts.filter((x) => x.days > 7 && x.days <= 30).length,
        ninety: alerts.filter((x) => x.days > 30 && x.days <= 90).length,
      },
    });
  } catch (e) {
    return accessError(e);
  }
}
