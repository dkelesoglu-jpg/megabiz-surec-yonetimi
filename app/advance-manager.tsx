"use client";
import { FormEvent, useEffect, useMemo, useState } from "react";
import AdvanceDocuments from "./advance-documents";
type Emp = {
    id: number;
    employeeNo: string;
    nationalId: string;
    firstName: string;
    lastName: string;
    department: string;
    position: string;
    startDate: string;
    manager?: string;
    netSalary?: number;
    salary?: number;
    status: string;
};
type Req = {
    id: number;
    employeeId: number;
    employee?: Emp;
    requestType: string;
    requestDate: string;
    requestedAmount: number;
    requestedInstallments: number;
    firstDeductionMonth: string;
    urgent: boolean;
    eligibility: string;
    eligibilityDetails: string;
    status: string;
    currentStep: number;
    approvalSteps: string;
    approvedAmount: number;
    approvedInstallments: number;
    paidAmount: number;
    collectedAmount: number;
    balance: number;
    reason: string;
    description?: string;
};
type Policy = {
    salaryMultiplier: number;
    maxInstallments: number;
    maxDeductionRate: number;
    minTenureMonths: number;
    approvalMatrix: string;
    types: string;
    reminderDays: string;
};
type Installment = {
    id: number;
    requestId: number;
    sequence: number;
    dueMonth: string;
    openingBalance: number;
    amount: number;
    closingBalance: number;
    status: string;
    payrollTransferred: boolean;
    paidAt?: string;
};
type Payment = {
    id: number;
    requestId: number;
    paymentType: string;
    amount: number;
    paymentDate: string;
    method: string;
    bank?: string;
    receiptNo: string;
    note?: string;
};
type Detail = {
    request: Req;
    installments: {
        id: number;
        sequence: number;
        dueMonth: string;
        openingBalance: number;
        amount: number;
        closingBalance: number;
        status: string;
    }[];
    payments: {
        id: number;
        paymentType: string;
        amount: number;
        paymentDate: string;
        method: string;
        receiptNo: string;
    }[];
    logs: {
        id: number;
        step: string;
        action: string;
        userEmail: string;
        note: string;
        createdAt: string;
    }[];
};
const money = (n: number) => new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n), tabs = ["Dashboard", "Yeni Talep", "Bekleyen Onaylar", "Aktif Borç / Avanslar", "Kesinti Planları", "Ödeme & Tahsilatlar", "Kapanan Borç / Avanslar", "Raporlar", "Parametreler"];
export default function AdvanceManager({ act }: {
    act: (s: string) => void;
}) {
    const [rows, setRows] = useState<Req[]>([]), [employees, setEmployees] = useState<Emp[]>([]), [installments, setInstallments] = useState<Installment[]>([]), [payments, setPayments] = useState<Payment[]>([]), [policy, setPolicy] = useState<Policy | null>(null), [role, setRole] = useState("employee"), [tab, setTab] = useState("Dashboard"), [form, setForm] = useState(false), [detail, setDetail] = useState<Detail | null>(null), [query, setQuery] = useState(""), [busy, setBusy] = useState(false);
    async function load() {
        const r = await fetch("/api/advances"), j = await r.json();
        if (r.ok) {
            setRows(j.requests || []);
            setEmployees(j.employees || []);
            setInstallments(j.installments || []);
            setPayments(j.payments || []);
            setPolicy(j.policy);
            setRole(j.role || "employee");
        }
    }
    useEffect(() => { load(); }, []);
    async function open(id: number) {
        const r = await fetch(`/api/advances?id=${id}`), j = await r.json();
        if (r.ok)
            setDetail(j);
    }
    const visible = useMemo(() => rows.filter(r => {
        const e = r.employee, q = query.toLocaleLowerCase("tr"), hay = [e?.firstName, e?.lastName, e?.nationalId, e?.employeeNo, e?.department, r.requestType, r.status].join(" ").toLocaleLowerCase("tr");
        if (!hay.includes(q))
            return false;
        if (tab === "Bekleyen Onaylar")
            return ["Onay Bekliyor", "Revizyon"].includes(r.status);
        if (tab === "Aktif Borç / Avanslar")
            return ["Aktif", "Ödeme Bekliyor"].includes(r.status);
        if (tab === "Kapanan Borç / Avanslar")
            return ["Kapandı", "Reddedildi", "İptal"].includes(r.status);
        return true;
    }), [rows, query, tab]);
    const currentMonth = new Date().toISOString().slice(0, 7), requestById = new Map(rows.map(r => [r.id, r]));
    const summary = { open: rows.reduce((s, r) => s + r.balance, 0), active: rows.filter(r => r.status === "Aktif").length, pending: rows.filter(r => r.status === "Onay Bekliyor").length, late: installments.filter(x => x.status === "Planlandı" && x.dueMonth < currentMonth).length, monthGiven: rows.filter(r => r.requestDate.slice(0, 7) === currentMonth).reduce((s, r) => s + r.paidAmount, 0), monthCollected: payments.filter(x => x.paymentDate.slice(0, 7) === currentMonth && x.paymentType !== "Şirket Ödemesi").reduce((s, x) => s + x.amount, 0) };
    function csv() { const data = [["Sicil", "T.C.", "Ad Soyad", "Departman", "Tür", "Talep", "Kalan", "Durum"], ...visible.map(r => [r.employee?.employeeNo || "", r.employee?.nationalId || "", `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`, r.employee?.department || "", r.requestType, String(r.approvedAmount), String(r.balance), r.status])].map(x => x.map(v => `"${v.replaceAll('"', '""')}"`).join(",")).join("\n"), a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["\ufeff" + data], { type: "text/csv" })); a.download = "mega-hrms-borc-avans-raporu.csv"; a.click(); act("Excel raporu indirildi"); }
    ;
    return <div className="workspace advance"><div className="workspace-head"><div><span>MEGA HRMS / FİNANSAL PERSONEL İŞLEMLERİ</span><h2>Borç & Avans Yönetimi</h2><p>Talep, uygunluk, onay, ödeme, bordro kesintisi ve kapanış tek kayıt üzerinde.</p></div><button className="primary" onClick={() => setForm(true)}>＋ Borç / Avans Talebi</button></div><nav className="advance-tabs">{tabs.filter(x => x !== "Parametreler" || ["super_admin","company_admin","hr"].includes(role)).map(x => <button key={x} className={tab === x ? "active" : ""} onClick={() => {
                setTab(x);
                if (x === "Yeni Talep")
                    setForm(true);
            }}>{x}</button>)}</nav>{tab === "Dashboard" && <><section className="advance-cards"><Card n="Toplam Açık Borç" v={money(summary.open)}/><Card n="Aktif Avans" v={String(summary.active)}/><Card n="Bu Ay Verilen" v={money(summary.monthGiven)}/><Card n="Bu Ay Tahsil Edilen" v={money(summary.monthCollected)}/><Card n="Bekleyen Talep" v={String(summary.pending)}/><Card n="Geciken Taksit" v={String(summary.late)}/></section><section className="panel advance-chart"><header><div><h3>Departman Bazlı Açık Borç</h3><p>Personel kayıtlarından canlı toplam</p></div></header>{Object.entries(rows.reduce((o, r) => { const d = r.employee?.department || "Belirsiz"; o[d] = (o[d] || 0) + r.balance; return o; }, {} as Record<string, number>)).map(([d, v]) => <div key={d}><span>{d}</span><i><b style={{ width: summary.open ? v / summary.open * 100 + "%" : "0%" }}/></i><strong>{money(v)}</strong></div>)}</section></>}{tab === "Parametreler" && policy ? <PolicyForm policy={policy} done={async () => { await load(); act("Şirket borç/avans parametreleri güncellendi"); }}/> : <>{tab !== "Dashboard" && <div className="advance-tools"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="T.C., ad soyad, sicil, departman veya tür ara"/><button onClick={csv}>⇩ Excel</button><button onClick={() => window.print()}>▣ PDF / Yazdır</button></div>}{tab === "Kesinti Planları" ? <InstallmentPanel rows={installments} requests={requestById} query={query} open={open}/> : tab === "Ödeme & Tahsilatlar" ? <PaymentPanel rows={payments} requests={requestById} query={query} open={open}/> : tab === "Raporlar" ? <ReportPanel requests={visible}/> : tab !== "Dashboard" && tab !== "Parametreler" ? <RequestTable rows={visible} open={open}/> : null}</>}{form && policy && <RequestForm employees={employees} policy={policy} close={() => setForm(false)} done={async (s) => { setForm(false); await load(); act(s); }}/>}{detail && <DetailModal data={detail} close={() => setDetail(null)} run={async (action, p = {}) => {
                setBusy(true);
                const r = await fetch("/api/advances", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: detail.request.id, action, ...p }) }), j = await r.json();
                setBusy(false);
                if (r.ok) {
                    await load();
                    await open(detail.request.id);
                    act("İşlem kaydedildi");
                }
                else
                    act(j.error || "İşlem yapılamadı");
            }} busy={busy}/>}</div>;
}
function Card({ n, v }: {
    n: string;
    v: string;
}) { return <article><small>{n}</small><strong>{v}</strong></article>; }
function RequestTable({ rows, open }: {
    rows: Req[];
    open: (id: number) => void;
}) { return <section className="panel advance-table"><div className="advance-tr advance-th"><span>Personel</span><span>Tür / Talep</span><span>Uygunluk</span><span>Kalan / Taksit</span><span>Durum</span></div>{rows.length === 0 ? <div className="module-empty">Bu görünümde kayıt bulunmuyor.</div> : rows.map(r => <button className="advance-tr" key={r.id} onClick={() => open(r.id)}><span><i className="person-dot">{r.employee?.firstName?.slice(0, 1)}{r.employee?.lastName?.slice(0, 1)}</i><em><b>{r.employee?.firstName} {r.employee?.lastName}</b><small>{r.employee?.employeeNo} · {r.employee?.department}</small></em></span><span><b>{r.requestType}</b><small>{money(r.requestedAmount)} · {r.requestedInstallments} taksit</small></span><span><b className={`elig ${r.eligibility.replaceAll(" ", "-")}`}>{r.eligibility}</b></span><span><b>{money(r.balance)}</b><small>{r.approvedInstallments} taksit</small></span><span><b className="status-badge">{r.status}</b></span></button>)}</section>; }
function InstallmentPanel({ rows, requests, query, open }: { rows: Installment[]; requests: Map<number, Req>; query: string; open: (id: number) => void }) {
    const month = new Date().toISOString().slice(0, 7), filtered = rows.filter(x => { const r = requests.get(x.requestId), hay = `${r?.employee?.firstName} ${r?.employee?.lastName} ${r?.employee?.employeeNo} ${r?.employee?.nationalId} ${x.dueMonth}`.toLocaleLowerCase("tr"); return hay.includes(query.toLocaleLowerCase("tr")); });
    return <><section className="schedule-cards"><Card n="Planlanan Taksit" v={String(rows.filter(x => x.status === "Planlandı").length)}/><Card n="Bu Ay Kesilecek" v={money(rows.filter(x => x.status === "Planlandı" && x.dueMonth === month).reduce((s,x)=>s+x.amount,0))}/><Card n="Geciken" v={String(rows.filter(x => x.status === "Planlandı" && x.dueMonth < month).length)}/><Card n="Bordroya Aktarılan" v={String(rows.filter(x => x.payrollTransferred).length)}/></section><section className="panel ledger-table"><div className="ledger-row head"><span>Personel</span><span>Kesinti Ayı</span><span>Taksit</span><span>Açılış / Kalan</span><span>Durum</span></div>{filtered.length ? filtered.map(x => { const r=requests.get(x.requestId), late=x.status==="Planlandı"&&x.dueMonth<month; return <button className="ledger-row" key={x.id} onClick={()=>open(x.requestId)}><span><b>{r?.employee?.firstName} {r?.employee?.lastName}</b><small>{r?.employee?.employeeNo} · {r?.employee?.department}</small></span><span>{x.dueMonth}</span><span><b>{money(x.amount)}</b><small>{x.sequence}. taksit</small></span><span>{money(x.openingBalance)} → {money(x.closingBalance)}</span><span><b className={`status-badge ${late?"late":""}`}>{late?"Gecikmiş":x.status}</b></span></button>}) : <div className="module-empty">Kesinti planı bulunmuyor.</div>}</section></>;
}
function PaymentPanel({ rows, requests, query, open }: { rows: Payment[]; requests: Map<number, Req>; query: string; open: (id: number) => void }) {
    const filtered=rows.filter(x=>{const r=requests.get(x.requestId),hay=`${r?.employee?.firstName} ${r?.employee?.lastName} ${r?.employee?.employeeNo} ${r?.employee?.nationalId} ${x.paymentType} ${x.receiptNo}`.toLocaleLowerCase("tr");return hay.includes(query.toLocaleLowerCase("tr"));});
    return <section className="panel ledger-table"><div className="ledger-row payment head"><span>Personel</span><span>İşlem</span><span>Tutar</span><span>Tarih / Yöntem</span><span>Dekont</span></div>{filtered.length?filtered.map(x=>{const r=requests.get(x.requestId);return <button className="ledger-row payment" key={x.id} onClick={()=>open(x.requestId)}><span><b>{r?.employee?.firstName} {r?.employee?.lastName}</b><small>{r?.employee?.employeeNo} · {r?.employee?.department}</small></span><span><b>{x.paymentType}</b><small>{x.note||"Finansal hareket"}</small></span><span><b>{money(x.amount)}</b></span><span>{x.paymentDate}<small>{x.method||"—"} {x.bank?`· ${x.bank}`:""}</small></span><span>{x.receiptNo||"Belge bekleniyor"}</span></button>}) : <div className="module-empty">Ödeme veya tahsilat kaydı bulunmuyor.</div>}</section>;
}
function ReportPanel({requests}:{requests:Req[]}) { const departments=Object.entries(requests.reduce((o,r)=>{const d=r.employee?.department||"Belirsiz",v=o[d]||{people:new Set<number>(),open:0,paid:0};v.people.add(r.employeeId);v.open+=r.balance;v.paid+=r.collectedAmount;o[d]=v;return o},{} as Record<string,{people:Set<number>;open:number;paid:number}>)); return <section className="panel ledger-table"><div className="ledger-row report head"><span>Departman</span><span>Personel</span><span>Açık Bakiye</span><span>Tahsil Edilen</span></div>{departments.map(([d,v])=><div className="ledger-row report" key={d}><span><b>{d}</b></span><span>{v.people.size}</span><span><b>{money(v.open)}</b></span><span>{money(v.paid)}</span></div>)}</section>; }
function RequestForm({ employees, policy, close, done }: {
    employees: Emp[];
    policy: Policy;
    close: () => void;
    done: (s: string) => void;
}) {
    const [employeeId, setEmployeeId] = useState(""), [amount, setAmount] = useState(0), [count, setCount] = useState(1), [saving, setSaving] = useState(false), [error, setError] = useState(""), e = employees.find(x => String(x.id) === employeeId), limit = (e?.netSalary || 0) * policy.salaryMultiplier / 100, monthly = amount / Math.max(1, count), maxMonthly = (e?.netSalary || 0) * policy.maxDeductionRate / 100;
    async function save(ev: FormEvent<HTMLFormElement>) {
        ev.preventDefault();
        setSaving(true);
        const f = new FormData(ev.currentTarget), p = { ...Object.fromEntries(f.entries()), employeeId: Number(employeeId), requestedAmount: amount, requestedInstallments: count, urgent: f.get("urgent") === "on" }, r = await fetch("/api/advances", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }), j = await r.json();
        setSaving(false);
        if (!r.ok) {
            setError(j.error || "Talep oluşturulamadı");
            return;
        }
        done(`Talep oluşturuldu: ${j.eligibility.result}`);
    }
    return <div className="modal-backdrop"><form className="record-modal advance-form" onSubmit={save}><header><div><span>BORÇ & AVANS</span><h2>Yeni Talep</h2><p>Personel bilgileri sicil kartından otomatik getirilir.</p></div><button type="button" onClick={close}>×</button></header><div className="form-grid"><label className="field wide"><span>Personel *</span><select value={employeeId} onChange={x => setEmployeeId(x.target.value)} required><option value="">Seçiniz</option>{employees.map(x => <option key={x.id} value={x.id}>{x.firstName} {x.lastName} · {x.nationalId} · {x.employeeNo}</option>)}</select></label>{e && <div className="employee-auto wide"><span><b>Sicil / T.C.</b>{e.employeeNo} · {e.nationalId}</span><span><b>Şirket / Departman</b>{e.department} · {e.position}</span><span><b>Yönetici</b>{e.manager || "—"}</span><span><b>Ücret</b>Net {money(e.netSalary || 0)} · Brüt {money(e.salary || 0)}</span></div>}<Select label="Talep Türü" name="requestType" options={JSON.parse(policy.types)}/><Field label="Talep Tarihi" name="requestDate" type="date" value={new Date().toISOString().slice(0, 10)}/><label className="field"><span>Talep Edilen Tutar</span><input type="number" min="1" value={amount} onChange={x => setAmount(Number(x.target.value))} required/></label><Field label="Talep Nedeni" name="reason" required/><label className="field"><span>Taksit Sayısı</span><input type="number" min="1" max={policy.maxInstallments} value={count} onChange={x => setCount(Number(x.target.value))}/></label><Field label="İlk Kesinti Ayı" name="firstDeductionMonth" type="month" required/><label className="check-field"><input name="urgent" type="checkbox"/> Acil Talep</label><label className="field wide"><span>Açıklama</span><textarea name="description"/></label></div><div className={`eligibility-preview ${amount > limit || monthly > maxMonthly ? "warn" : "ok"}`}><b>Ön Uygunluk Kontrolü</b><span>Maksimum limit: {money(limit)} · Aylık kesinti sınırı: {money(maxMonthly)}</span><strong>{amount > limit ? "Limit Aşımı" : monthly > maxMonthly ? "Kesinti Oranı Aşılıyor" : "Uygun"}</strong></div>{error && <div className="form-error">{error}</div>}<footer><button type="button" onClick={close}>İptal</button><button className="primary" disabled={saving}>{saving ? "Kontrol Ediliyor…" : "Kontrol Et ve Talebi Oluştur"}</button></footer></form></div>;
}
function DetailModal({ data, close, run, busy, role }: {
    data: Detail;
    close: () => void;
    run: (a: string, p?: Record<string, unknown>) => void;
    busy: boolean;
    role: string;
}) { const r = data.request, steps = JSON.parse(r.approvalSteps) as string[], current = steps[r.currentStep] || "Tamamlandı", admin = ["super_admin", "company_admin"].includes(role), isHr = role === "hr", canApprove = admin || isHr && current === "İK" || role === "manager" && ["Yönetici", "Departman Müdürü"].includes(current) || role === "payroll" && current === "Mali İşler", canFinance = admin || role === "payroll"; return <div className="modal-backdrop"><section className="record-modal advance-detail"><header><div><span>TALEP #{r.id}</span><h2>{r.employee?.firstName} {r.employee?.lastName} · {r.requestType}</h2><p>{money(r.approvedAmount)} · {r.approvedInstallments} taksit · {r.status}</p></div><button onClick={close}>×</button></header><div className="detail-summary"><Card n="Açık Bakiye" v={money(r.balance)}/><Card n="Tahsil Edilen" v={money(r.collectedAmount)}/><Card n="Sıradaki Onay" v={current}/><Card n="Uygunluk" v={r.eligibility}/></div><div className="approval-flow">{steps.map((x, i) => <span className={i < r.currentStep ? "done" : i === r.currentStep ? "current" : ""} key={x}>{i < r.currentStep ? "✓ " : ""}{x}</span>)}</div><div className="detail-actions">{canApprove&&r.status==="Onay Bekliyor"&&<><button onClick={() => run("approve")}>Onayla</button><button onClick={() => run("reject", { note: prompt("Red gerekçesi") || "" })}>Reddet</button><button onClick={() => run("revision", { note: prompt("Revizyon notu") || "" })}>Revizyon İste</button></>}{(admin||isHr)&&["Onay Bekliyor","Revizyon"].includes(r.status)&&<><button onClick={() => run("revise", { amount: Number(prompt("Revize tutar", String(r.approvedAmount)) || r.approvedAmount), installments: Number(prompt("Revize taksit sayısı", String(r.approvedInstallments)) || r.approvedInstallments) })}>Tutar / Taksit Revize Et</button><button onClick={() => run("exception", { note: prompt("İstisna gerekçesi") || "" })}>Manuel İstisna</button></>}{canFinance&&r.status==="Ödeme Bekliyor"&&<button onClick={() => run("paid", paymentPrompt("Şirket Ödemesi"))}>Ödeme Yapıldı</button>}{canFinance&&r.status==="Aktif"&&<><button onClick={() => run("payroll")}>Sıradaki Taksiti Bordroya Aktar</button><button onClick={() => run("extra", paymentPrompt("Ara Ödeme"))}>Ara Ödeme</button><button onClick={() => run("close", paymentPrompt("Erken Kapama"))}>Borcu Kapat</button></>}{(admin||isHr)&&["Onay Bekliyor","Revizyon","Ödeme Bekliyor","Aktif"].includes(r.status)&&<button className="danger" onClick={() => run("cancel", { note: prompt("İptal gerekçesi") || "" })}>İptal / Pasif</button>}{!canApprove&&!canFinance&&!admin&&!isHr&&<span className="readonly-note">Salt okunur görünüm</span>}</div><h3>Kesinti Planı</h3><div className="installment-table"><div><b>#</b><b>Ay</b><b>Açılış</b><b>Kesinti</b><b>Kalan</b><b>Durum</b></div>{data.installments.map(x => <div key={x.id}><span>{x.sequence}</span><span>{x.dueMonth}</span><span>{money(x.openingBalance)}</span><span>{money(x.amount)}</span><span>{money(x.closingBalance)}</span><span>{x.status}</span></div>)}</div><h3>Ödeme & Tahsilatlar</h3>{data.payments.map(x => <p className="history-row" key={x.id}><b>{x.paymentType}</b><span>{money(x.amount)} · {x.paymentDate} · {x.method || "—"} · {x.receiptNo || "Dekont yok"}</span></p>)}<AdvanceDocuments requestId={r.id} employeeId={r.employeeId}/><h3>İşlem / Audit Geçmişi</h3>{data.logs.map(x => <p className="history-row" key={x.id}><b>{x.step} · {x.action}</b><span>{x.userEmail} · {new Date(x.createdAt).toLocaleString("tr-TR")} · {x.note || "—"}</span></p>)}{busy && <div className="saving-cover">İşlem kaydediliyor…</div>}</section></div>; }
function paymentPrompt(type: string) { const amount = type === "Ara Ödeme" ? Number(prompt("Ara ödeme tutarı") || 0) : undefined, planStrategy = type === "Ara Ödeme" ? prompt("Plan güncelleme yöntemi: Taksit Tutarını Düşür veya Vadeyi Azalt", "Taksit Tutarını Düşür") || "Taksit Tutarını Düşür" : undefined; return { amount, planStrategy, paymentDate: new Date().toISOString().slice(0, 10), method: prompt("Ödeme yöntemi") || "Banka", bank: prompt("Banka") || "", receiptNo: prompt("Dekont no") || "", note: type }; }
function PolicyForm({ policy, done }: {
    policy: Policy;
    done: () => void;
}) { const [saving, setSaving] = useState(false); async function save(e: FormEvent<HTMLFormElement>) { e.preventDefault(); setSaving(true); const f = new FormData(e.currentTarget), p = { action: "policy", salaryMultiplier: f.get("salaryMultiplier"), maxInstallments: f.get("maxInstallments"), maxDeductionRate: f.get("maxDeductionRate"), minTenureMonths: f.get("minTenureMonths"), approvalMatrix: f.get("approvalMatrix"), types: JSON.stringify(String(f.get("types")).split("\n").filter(Boolean)), reminderDays: f.get("reminderDays") }; await fetch("/api/advances", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(p) }); setSaving(false); done(); } return <form className="panel policy-form" onSubmit={save}><h3>Şirket Borç & Avans Parametreleri</h3><div className="form-grid"><Field label="Maaş Katsayısı (%)" name="salaryMultiplier" type="number" value={String(policy.salaryMultiplier)}/><Field label="Maksimum Taksit" name="maxInstallments" type="number" value={String(policy.maxInstallments)}/><Field label="Maksimum Aylık Kesinti (%)" name="maxDeductionRate" type="number" value={String(policy.maxDeductionRate)}/><Field label="Minimum Kıdem (Ay)" name="minTenureMonths" type="number" value={String(policy.minTenureMonths)}/><Field label="Hatırlatma Günleri" name="reminderDays" value={policy.reminderDays}/><label className="field wide"><span>Borç / Avans Türleri (satır başına bir tür)</span><textarea name="types" defaultValue={(JSON.parse(policy.types) as string[]).join("\n")}/></label><label className="field wide"><span>Onay Matrisi (JSON)</span><textarea name="approvalMatrix" defaultValue={policy.approvalMatrix}/></label></div><button className="primary" disabled={saving}>{saving ? "Kaydediliyor…" : "Parametreleri Kaydet"}</button></form>; }
function Field({ label, name, value, type = "text", required }: {
    label: string;
    name: string;
    value?: string;
    type?: string;
    required?: boolean;
}) { return <label className="field"><span>{label}</span><input name={name} type={type} defaultValue={value || ""} required={required}/></label>; }
function Select({ label, name, options }: {
    label: string;
    name: string;
    options: string[];
}) { return <label className="field"><span>{label}</span><select name={name}>{options.map(x => <option key={x}>{x}</option>)}</select></label>; }
