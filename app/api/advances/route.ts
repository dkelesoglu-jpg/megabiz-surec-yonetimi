import { getDb } from "../../../db";
import { accessError, getCompanyId, requireAccess, requireModuleAccess, writeAudit, type Access } from "../../../db/authorization";
import { approvalSteps, eligibility, installmentPlan } from "../../../db/advance-calculations";
import { nextNumber } from "../../../db/number-series";
import { camelizeKeys } from "../../../db/case";

function scopedPeople<T extends { id: number; email?: string | null; manager?: string | null }>(people: T[], access: { role: string; email: string; fullName: string | null }) {
  if (!["employee", "manager"].includes(access.role)) return people;
  const email = access.email.toLocaleLowerCase("tr"), name = (access.fullName || "").toLocaleLowerCase("tr");
  return people.filter((x) => x.email?.toLocaleLowerCase("tr") === email || (access.role === "manager" && [email, name].includes((x.manager || "").toLocaleLowerCase("tr"))));
}
function assertAction(role: string, action: string, step: string) {
  if (["super_admin", "company_admin"].includes(role)) return;
  if (role === "hr" && (["exception", "revise", "cancel"].includes(action) || (["approve", "reject", "revision"].includes(action) && step === "İK"))) return;
  if (role === "manager" && ["approve", "reject", "revision"].includes(action) && ["Yönetici", "Departman Müdürü"].includes(step)) return;
  if (role === "payroll" && (["paid", "extra", "close", "payroll"].includes(action) || (["approve", "reject", "revision"].includes(action) && step === "Mali İşler"))) return;
  throw new Error("ADVANCE_ACCESS_DENIED");
}
function assertState(status: string, action: string) {
  const allowed: Record<string, string[]> = { approve: ["Onay Bekliyor"], reject: ["Onay Bekliyor", "Revizyon"], revision: ["Onay Bekliyor"], exception: ["Onay Bekliyor", "Revizyon"], revise: ["Onay Bekliyor", "Revizyon"], paid: ["Ödeme Bekliyor"], payroll: ["Aktif"], extra: ["Aktif"], close: ["Aktif"], cancel: ["Onay Bekliyor", "Revizyon", "Ödeme Bekliyor", "Aktif"] };
  if (!allowed[action]?.includes(status)) throw new Error("ADVANCE_INVALID_STATE");
}
async function policy(companyId: string) {
  const db = getDb();
  const { data: existing } = await db.from("advance_policies").select("*").eq("company_id", companyId).maybeSingle();
  if (existing) return camelizeKeys(existing);
  const { data: created, error } = await db.from("advance_policies").insert({ company_id: companyId, updated_at: new Date().toISOString() }).select().single();
  if (error) throw new Error(error.message);
  return camelizeKeys(created);
}

export async function GET(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId), url = new URL(request.url), id = Number(url.searchParams.get("id"));
    await requireModuleAccess(access, "Borç & Avans");
    const db = getDb(), p = await policy(companyId);
    const { data: allPeopleRaw } = await db.from("employees").select("*").eq("company_id", companyId);
    const allPeople = camelizeKeys(allPeopleRaw ?? []), people = scopedPeople(allPeople, access), allowed = new Set(people.map((x) => x.id));
    if (id) {
      const { data: recordRaw } = await db.from("advance_requests").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
      if (!recordRaw) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
      const record = camelizeKeys(recordRaw);
      if (!allowed.has(record.employeeId)) throw new Error("ADVANCE_ACCESS_DENIED");
      const [instRes, payRes, logRes] = await Promise.all([
        db.from("advance_installments").select("*").eq("request_id", id).eq("company_id", companyId).order("sequence", { ascending: true }),
        db.from("advance_payments").select("*").eq("request_id", id).eq("company_id", companyId).order("payment_date", { ascending: true }),
        db.from("advance_approval_logs").select("*").eq("request_id", id).eq("company_id", companyId).order("created_at", { ascending: true }),
      ]);
      return Response.json({
        request: { ...record, employee: people.find((x) => x.id === record.employeeId) },
        installments: camelizeKeys(instRes.data ?? []),
        payments: camelizeKeys(payRes.data ?? []),
        logs: camelizeKeys(logRes.data ?? []),
        policy: p,
        role: access.role,
      });
    }
    const [reqRes, instRes, payRes] = await Promise.all([
      db.from("advance_requests").select("*").eq("company_id", companyId).order("request_date", { ascending: true }),
      db.from("advance_installments").select("*").eq("company_id", companyId).order("due_month", { ascending: true }),
      db.from("advance_payments").select("*").eq("company_id", companyId).order("payment_date", { ascending: true }),
    ]);
    const requests = camelizeKeys(reqRes.data ?? []), installments = camelizeKeys(instRes.data ?? []), payments = camelizeKeys(payRes.data ?? []);
    const visibleRequests = requests.filter((x) => allowed.has(x.employeeId)), visibleIds = new Set(visibleRequests.map((x) => x.id));
    return Response.json({
      requests: visibleRequests.map((x) => ({ ...x, employee: people.find((e) => e.id === x.employeeId) })),
      employees: people,
      installments: installments.filter((x) => visibleIds.has(x.requestId)),
      payments: payments.filter((x) => visibleIds.has(x.requestId)),
      policy: p,
      role: access.role,
    });
  } catch (e) { return accessError(e); }
}

export async function POST(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true), body = await request.json() as Record<string, unknown>, db = getDb(), action = String(body.action || "create"), now = new Date().toISOString();
    await requireModuleAccess(access, "Borç & Avans", true);
    if (action === "policy") {
      if (!["super_admin", "company_admin", "hr"].includes(access.role)) throw new Error("ADVANCE_ACCESS_DENIED");
      const values = {
        salary_multiplier: Number(body.salaryMultiplier || 150),
        max_installments: Number(body.maxInstallments || 12),
        max_deduction_rate: Number(body.maxDeductionRate || 20),
        min_tenure_months: Number(body.minTenureMonths || 3),
        approval_matrix: String(body.approvalMatrix),
        types: String(body.types),
        reminder_days: String(body.reminderDays || "7,15,30"),
        updated_at: now,
      };
      const { data: row, error } = await db.from("advance_policies").update(values).eq("company_id", companyId).select().single();
      if (error) throw new Error(error.message);
      await writeAudit(access, "UPDATE", "advance_policy", companyId, null, row);
      return Response.json({ policy: camelizeKeys(row) });
    }
    const employeeId = Number(body.employeeId);
    const { data: employeeRaw } = await db.from("employees").select("*").eq("id", employeeId).eq("company_id", companyId).maybeSingle();
    if (!employeeRaw) return Response.json({ error: "Personel seçiniz" }, { status: 400 });
    const employee = camelizeKeys(employeeRaw);
    if (["employee", "manager"].includes(access.role) && !scopedPeople([employee], access).length) throw new Error("ADVANCE_ACCESS_DENIED");
    const p = await policy(companyId), requestedAmount = Number(body.requestedAmount), requestedInstallments = Number(body.requestedInstallments);
    const { data: openRaw } = await db.from("advance_requests").select("*").eq("company_id", companyId).eq("employee_id", employeeId);
    const open = camelizeKeys(openRaw ?? []);
    const firstDeductionMonth = String(body.firstDeductionMonth),
      check = eligibility(
        {
          active: employee.status === "Aktif",
          startDate: employee.startDate,
          netSalary: Number(employee.netSalary || 0),
          amount: requestedAmount,
          installments: requestedInstallments,
          openBalance: open.filter((x) => ["Aktif", "Ödeme Bekliyor", "Onay Bekliyor"].includes(x.status)).reduce((s, x) => s + x.balance, 0),
          samePeriod: open.some((x) => x.firstDeductionMonth === firstDeductionMonth && !["Kapandı", "Reddedildi", "İptal"].includes(x.status)),
        },
        { salaryMultiplier: p.salaryMultiplier, maxInstallments: p.maxInstallments, maxDeductionRate: p.maxDeductionRate, minTenureMonths: p.minTenureMonths, approvalMatrix: p.approvalMatrix },
      );
    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0 || !/^\d{4}-\d{2}$/.test(firstDeductionMonth) || !String(body.reason || "").trim())
      return Response.json({ error: "Tutar, talep nedeni ve ilk kesinti ayı zorunludur" }, { status: 400 });
    if (requestedInstallments < 1 || requestedInstallments > p.maxInstallments)
      return Response.json({ error: `Taksit sayısı 1-${p.maxInstallments} arasında olmalıdır` }, { status: 400 });
    const steps = approvalSteps(requestedAmount, p.approvalMatrix), requestNo = await nextNumber(companyId, "advance_request");
    const { data: row, error } = await db
      .from("advance_requests")
      .insert({
        company_id: companyId,
        request_no: requestNo,
        employee_id: employeeId,
        request_type: String(body.requestType),
        request_date: String(body.requestDate || now.slice(0, 10)),
        requested_amount: requestedAmount,
        reason: String(body.reason || ""),
        description: String(body.description || ""),
        requested_installments: requestedInstallments,
        first_deduction_month: firstDeductionMonth,
        urgent: Boolean(body.urgent),
        eligibility: check.result,
        eligibility_details: JSON.stringify(check),
        status: "Onay Bekliyor",
        approval_steps: JSON.stringify(steps),
        approved_amount: requestedAmount,
        approved_installments: requestedInstallments,
        balance: requestedAmount,
        created_by: access.email,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    await db.from("advance_approval_logs").insert({ company_id: companyId, request_id: row.id, step: "Talep", action: "Oluşturuldu", user_email: access.email, new_value: JSON.stringify(row), note: String(body.description || ""), created_at: now });
    await writeAudit(access, "CREATE", "advance_request", row.id, null, row);
    return Response.json({ request: camelizeKeys(row), eligibility: check }, { status: 201 });
  } catch (e) { return accessError(e); }
}

export async function PUT(request: Request) {
  try {
    const companyId = getCompanyId(request), access = await requireAccess(request, companyId, true), body = await request.json() as Record<string, unknown>, id = Number(body.id), action = String(body.action), db = getDb(), now = new Date().toISOString();
    const { data: oldRaw } = await db.from("advance_requests").select("*").eq("id", id).eq("company_id", companyId).maybeSingle();
    await requireModuleAccess(access, "Borç & Avans", true);
    if (!oldRaw) return Response.json({ error: "Kayıt bulunamadı" }, { status: 404 });
    const old = camelizeKeys(oldRaw);
    if (access.role === "manager") {
      const { data: personRaw } = await db.from("employees").select("*").eq("id", old.employeeId).eq("company_id", companyId).maybeSingle();
      const person = camelizeKeys(personRaw);
      const managerKey = (person?.manager || "").toLocaleLowerCase("tr"), managerName = (access.fullName || "").toLocaleLowerCase("tr");
      if (!person || ![access.email.toLocaleLowerCase("tr"), managerName].includes(managerKey)) throw new Error("ADVANCE_ACCESS_DENIED");
    }
    let patch: Record<string, unknown> = { updated_at: now };
    const steps = JSON.parse(old.approvalSteps) as string[], step = steps[old.currentStep] || "Tamamlandı";
    assertAction(access.role, action, step);
    assertState(old.status, action);
    if (action === "approve") {
      const next = old.currentStep + 1;
      if (next >= steps.length) {
        patch = { ...patch, current_step: next, status: "Ödeme Bekliyor" };
        await createPlan(id, companyId, old.approvedAmount, old.approvedInstallments, old.firstDeductionMonth);
      } else patch = { ...patch, current_step: next, status: "Onay Bekliyor" };
    } else if (action === "reject") patch = { ...patch, status: "Reddedildi" };
    else if (action === "revision") patch = { ...patch, status: "Revizyon" };
    else if (action === "exception") patch = { ...patch, eligibility: "Manuel İstisna", exception_reason: String(body.note || ""), status: "Onay Bekliyor" };
    else if (action === "revise") {
      const amount = Number(body.amount || old.approvedAmount), count = Number(body.installments || old.approvedInstallments);
      const p = await policy(companyId);
      if (amount <= 0 || count < 1 || count > p.maxInstallments) return Response.json({ error: "Revize tutar veya taksit sayısı geçersiz" }, { status: 400 });
      patch = { ...patch, approved_amount: amount, approved_installments: count, balance: Math.max(0, amount - old.collectedAmount), approval_steps: JSON.stringify(approvalSteps(amount, p.approvalMatrix)), current_step: 0, status: "Onay Bekliyor" };
    } else if (action === "paid") {
      patch = { ...patch, status: "Aktif", paid_amount: old.approvedAmount };
      await addPayment(companyId, id, "Şirket Ödemesi", old.approvedAmount, body, access.email);
    } else if (action === "extra" || action === "close") {
      const amount = action === "close" ? old.balance : Number(body.amount), collected = Math.min(old.approvedAmount, old.collectedAmount + amount), balance = Math.max(0, old.approvedAmount - collected);
      if (!Number.isFinite(amount) || amount <= 0 || amount > old.balance) return Response.json({ error: "Ödeme tutarı açık bakiyeden büyük veya sıfır olamaz" }, { status: 400 });
      patch = { ...patch, collected_amount: collected, balance, status: balance === 0 ? "Kapandı" : "Aktif" };
      await addPayment(companyId, id, action === "close" ? "Erken Kapama" : "Ara Ödeme", amount, body, access.email);
      await rebuildOutstanding(id, companyId, balance, String(body.planStrategy || "Taksit Tutarını Düşür"));
    } else if (action === "payroll") {
      const { data: instRaw } = await db.from("advance_installments").select("*").eq("request_id", id).eq("company_id", companyId).order("sequence", { ascending: true });
      const installments = camelizeKeys(instRaw ?? []), due = installments.find((x) => x.status === "Planlandı");
      if (!due) return Response.json({ error: "Bekleyen taksit bulunamadı" }, { status: 400 });
      await db.from("advance_installments").update({ status: "Bordroya Aktarıldı", payroll_transferred: true, paid_at: now }).eq("id", due.id);
      const collected = old.collectedAmount + due.amount, balance = Math.max(0, old.approvedAmount - collected);
      patch = { ...patch, collected_amount: collected, balance, status: balance === 0 ? "Kapandı" : "Aktif" };
      await addPayment(companyId, id, "Bordro Kesintisi", due.amount, { paymentDate: now.slice(0, 10), note: `${due.dueMonth} bordrosuna aktarıldı` }, access.email);
    } else if (action === "cancel") patch = { ...patch, status: "İptal" };
    else return Response.json({ error: "Geçersiz işlem" }, { status: 400 });
    const { data: row, error } = await db.from("advance_requests").update(patch).eq("id", id).eq("company_id", companyId).select().single();
    if (error) throw new Error(error.message);
    await db.from("advance_approval_logs").insert({ company_id: companyId, request_id: id, step, action, user_email: access.email, old_value: JSON.stringify(oldRaw), new_value: JSON.stringify(row), note: String(body.note || ""), created_at: now });
    await writeAudit(access, "ADVANCE_" + action.toUpperCase(), "advance_request", id, oldRaw, row);
    return Response.json({ request: camelizeKeys(row) });
  } catch (e) { return accessError(e); }
}

async function createPlan(requestId: number, companyId: string, amount: number, count: number, first: string) {
  const db = getDb();
  await db.from("advance_installments").delete().eq("request_id", requestId).eq("company_id", companyId);
  await db.from("advance_installments").insert(
    installmentPlan(amount, count, first).map((x) => ({
      company_id: companyId,
      request_id: requestId,
      sequence: x.sequence,
      due_month: x.dueMonth,
      opening_balance: x.openingBalance,
      amount: x.amount,
      closing_balance: x.closingBalance,
      status: "Planlandı",
    })),
  );
}
async function rebuildOutstanding(requestId: number, companyId: string, balance: number, strategy: string) {
  const db = getDb();
  const { data: rowsRaw } = await db.from("advance_installments").select("*").eq("request_id", requestId).eq("company_id", companyId).order("sequence", { ascending: true });
  const rows = camelizeKeys(rowsRaw ?? []);
  const planned = rows.filter((x) => x.status === "Planlandı"), completed = rows.filter((x) => x.status !== "Planlandı"),
    first = planned[0]?.dueMonth || new Date().toISOString().slice(0, 7),
    baseAmount = planned[0]?.amount || balance,
    count = strategy === "Vadeyi Azalt" ? Math.max(1, Math.ceil(balance / Math.max(1, baseAmount))) : Math.max(1, planned.length),
    offset = completed.reduce((m, x) => Math.max(m, x.sequence), 0);
  await db.from("advance_installments").delete().eq("request_id", requestId).eq("company_id", companyId).eq("status", "Planlandı");
  if (balance > 0)
    await db.from("advance_installments").insert(
      installmentPlan(balance, count, first).map((x) => ({
        company_id: companyId,
        request_id: requestId,
        sequence: x.sequence + offset,
        due_month: x.dueMonth,
        opening_balance: x.openingBalance,
        amount: x.amount,
        closing_balance: x.closingBalance,
        status: "Planlandı",
      })),
    );
}
async function addPayment(companyId: string, requestId: number, type: string, amount: number, body: Record<string, unknown>, user: string) {
  await getDb()
    .from("advance_payments")
    .insert({
      company_id: companyId,
      request_id: requestId,
      payment_type: type,
      amount,
      payment_date: String(body.paymentDate || new Date().toISOString().slice(0, 10)),
      method: String(body.method || ""),
      bank: String(body.bank || ""),
      receipt_no: String(body.receiptNo || ""),
      note: String(body.note || ""),
      created_by: user,
      created_at: new Date().toISOString(),
    });
}
