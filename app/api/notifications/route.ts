import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess } from "../../../db/authorization";
import { camelizeKeys } from "../../../db/case";

type Notice = {
    id: string;
    kind: string;
    level: "critical" | "warning" | "info";
    title: string;
    body: string;
    module: string;
    date: string;
};

export async function GET(request: Request) {
    try {
        const companyId = getCompanyId(request), access = await requireAccess(request, companyId);
        const db = getDb();
        const [reqRes, instRes, docRes, empRes, perfRes, cycleRes, actionRes] = await Promise.all([
            db.from("advance_requests").select("*").eq("company_id", companyId).order("request_date", { ascending: true }),
            db.from("advance_installments").select("*").eq("company_id", companyId).order("due_month", { ascending: true }),
            db.from("documents").select("*").eq("company_id", companyId),
            db.from("employees").select("*").eq("company_id", companyId),
            db.from("performance_assignments").select("*").eq("company_id", companyId),
            db.from("performance_cycles").select("*").eq("company_id", companyId),
            db.from("performance_actions").select("*").eq("company_id", companyId),
        ]);
        const allRequests = camelizeKeys(reqRes.data ?? []),
            allInstallments = camelizeKeys(instRes.data ?? []),
            allDocs = camelizeKeys(docRes.data ?? []),
            people = camelizeKeys(empRes.data ?? []),
            allPerformance = camelizeKeys(perfRes.data ?? []),
            performanceCyclesRows = camelizeKeys(cycleRes.data ?? []),
            performanceActionRows = camelizeKeys(actionRes.data ?? []),
            email = access.email.toLocaleLowerCase("tr"),
            name = (access.fullName || "").toLocaleLowerCase("tr"),
            allowedPeople = new Set(
                people
                    .filter(
                        (x) =>
                            !["employee", "manager"].includes(access.role) ||
                            x.email?.toLocaleLowerCase("tr") === email ||
                            (access.role === "manager" && [email, name].includes((x.manager || "").toLocaleLowerCase("tr"))),
                    )
                    .map((x) => x.id),
            ),
            requests = allRequests.filter((x) => allowedPeople.has(x.employeeId)),
            performanceRows = allPerformance.filter((x) => allowedPeople.has(x.employeeId)),
            performanceIds = new Set(performanceRows.map((x) => x.id)),
            performanceTasks = performanceActionRows.filter((x) => performanceIds.has(x.assignmentId)),
            requestIds = new Set(requests.map((x) => x.id)),
            installments = allInstallments.filter((x) => requestIds.has(x.requestId)),
            docs = allDocs.filter((x) => (x.relatedType?.startsWith("advance:") ? requestIds.has(Number(x.relatedType.split(":")[1])) : true)),
            person = new Map(people.map((x) => [x.id, `${x.firstName} ${x.lastName}`])),
            today = new Date().toISOString().slice(0, 10),
            month = today.slice(0, 7),
            nextMonth = addMonth(month),
            notices: Notice[] = [];
        for (const r of requests) {
            const rname = person.get(r.employeeId) || `Personel #${r.employeeId}`;
            if (r.status === "Onay Bekliyor")
                notices.push({ id: `approval-${r.id}`, kind: "Onay", level: "warning", title: "Borç/avans onayı bekliyor", body: `${rname} · ${r.requestType} · ${money(r.approvedAmount)}`, module: "Borç & Avans", date: r.updatedAt });
            if (r.status === "Ödeme Bekliyor")
                notices.push({ id: `payment-${r.id}`, kind: "Ödeme", level: "critical", title: "Mali İşler ödemesi bekleniyor", body: `${rname} için ${money(r.approvedAmount)} ödeme bekliyor.`, module: "Borç & Avans", date: r.updatedAt });
            if (["Aktif", "Ödeme Bekliyor"].includes(r.status) && !docs.some((d) => d.relatedType === `advance:${r.id}`))
                notices.push({ id: `document-${r.id}`, kind: "Belge", level: "info", title: "Borç/avans belgesi eksik", body: `${rname} kaydına sözleşme, talep formu veya dekont yüklenmedi.`, module: "Borç & Avans", date: r.updatedAt });
        }
        for (const x of installments) {
            if (x.status !== "Planlandı") continue;
            const r = requests.find((y) => y.id === x.requestId), iname = r ? person.get(r.employeeId) : "Personel";
            if (x.dueMonth < month)
                notices.push({ id: `late-${x.id}`, kind: "Gecikme", level: "critical", title: "Geciken tahsilat", body: `${iname} · ${x.dueMonth} · ${money(x.amount)}`, module: "Borç & Avans", date: `${x.dueMonth}-01` });
            else if (x.dueMonth === month)
                notices.push({ id: `payroll-${x.id}`, kind: "Bordro", level: "warning", title: "Bu ay bordroya aktarılacak", body: `${iname} · ${money(x.amount)} borç/avans kesintisi`, module: "Borç & Avans", date: today });
            if (x.closingBalance === 0 && [month, nextMonth].includes(x.dueMonth))
                notices.push({ id: `final-${x.id}`, kind: "Son Taksit", level: "info", title: "Son taksit yaklaşıyor", body: `${iname} kaydı ${x.dueMonth} döneminde kapanacak.`, module: "Borç & Avans", date: today });
        }
        for (const x of performanceRows) {
            const cycle = performanceCyclesRows.find((c) => c.id === x.cycleId), days = cycle ? daysUntil(cycle.reviewEndDate) : 999;
            if (!x.locked && days < 0) notices.push({ id: `performance-late-${x.id}`, kind: "Performans", level: "critical", title: "Performans değerlendirmesi gecikti", body: `${x.employeeName} · ${cycle?.name || "Aktif dönem"}`, module: "Performans", date: cycle?.reviewEndDate || today });
            else if (!x.locked && days <= 5) notices.push({ id: `performance-due-${x.id}`, kind: "Performans", level: "warning", title: "Performans değerlendirmesi tamamlanmalı", body: `${x.employeeName} · ${Math.max(0, days)} gün kaldı`, module: "Performans", date: cycle?.reviewEndDate || today });
        }
        for (const x of performanceTasks) {
            const days = x.targetDate ? daysUntil(x.targetDate) : 999, employee = performanceRows.find((r) => r.id === x.assignmentId)?.employeeName || "Personel";
            if (["PIP", "Gelişim Planı", "Performans Görüşmesi"].includes(x.actionType) && x.status !== "Kapandı" && days <= 7) notices.push({ id: `performance-action-${x.id}`, kind: x.actionType, level: days < 0 ? "critical" : "info", title: `${x.actionType} kontrol tarihi yaklaşıyor`, body: `${employee} · ${x.title}`, module: "Performans", date: x.targetDate || today });
        }
        notices.sort((a, b) => priority(a.level) - priority(b.level) || b.date.localeCompare(a.date));
        return Response.json({ notifications: notices, summary: { total: notices.length, critical: notices.filter((x) => x.level === "critical").length, warning: notices.filter((x) => x.level === "warning").length, info: notices.filter((x) => x.level === "info").length } });
    }
    catch (e) {
        return accessError(e);
    }
}
function priority(x: Notice["level"]) { return x === "critical" ? 0 : x === "warning" ? 1 : 2; }
function money(n: number) { return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n); }
function addMonth(value: string) { const [y, m] = value.split("-").map(Number), d = new Date(Date.UTC(y, m, 1)); return d.toISOString().slice(0, 7); }
function daysUntil(value: string) { return Math.ceil((new Date(value + "T23:59:59").getTime() - Date.now()) / 86400000); }
