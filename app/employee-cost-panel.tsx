"use client";
import { useEffect, useState } from "react";
import "./cost-management.css";
type Summary = {
  payrollType: "Normal Personel" | "Emekli Personel" | "Huzur Hakkı";
  net: number;
  gross: number;
  employeeSgk: number;
  employeeUnemployment: number;
  incomeTaxBase: number;
  incomeTax: number;
  stampTax: number;
  incomeTaxExemption: number;
  stampTaxExemption: number;
  paidIncomeTax: number;
  paidStampTax: number;
  otherDeduction: number;
  totalDeduction: number;
  netPaid: number;
  employerSgk: number;
  employerUnemployment: number;
  employerSgdp: number;
  benefits: number;
  employerCost: number;
};
const tl = (n = 0) =>
  new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
export default function EmployeeCostPanel({
  employeeId,
}: {
  employeeId: number;
}) {
  const [data, setData] = useState<Summary | null>(null);
  useEffect(() => {
    const load = () => {
      const d = new Date(),
        period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      fetch(`/api/payroll-report?employeeId=${employeeId}&period=${period}`, {
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => setData(j?.rows?.[0] || null))
        .catch(() => {});
    };
    load();
    window.addEventListener("employees-updated", load);
    return () => window.removeEventListener("employees-updated", load);
  }, [employeeId]);
  return (
    <section className="employee-cost-mini">
      <header>
        <div>
          <h3>Ücret ve İşveren Maliyeti</h3>
          <small>Bu ay · merkezi bordro/maliyet hesaplaması</small>
        </div>
        <span>{data ? data.payrollType : "Hesaplanıyor"}</span>
      </header>
      {data && (
        <>
          <div className="employee-cost-mini-grid">
            <Cost label="Net Ücret" value={data.net} />
            <Cost label="Brüt Ücret" value={data.gross} />
            <Cost
              label={
                data.payrollType === "Emekli Personel"
                  ? "SGDP İşveren"
                  : "SGK İşveren"
              }
              value={
                data.employerSgk + data.employerSgdp + data.employerUnemployment
              }
              empty={data.payrollType === "Huzur Hakkı"}
            />
            <Cost label="Yan Haklar" value={data.benefits} />
            <Cost label="Toplam Aylık" value={data.employerCost} />
            <Cost label="Yıllık Tahmin" value={data.employerCost * 12} />
          </div>
          <div className="employee-deduction-head">
            <div>
              <strong>Vergi ve Çalışan Kesintileri</strong>
              <small>
                Seçili dönemin bordro türüne göre hesaplanan detayları
              </small>
            </div>
            <b>Toplam Kesinti {tl(data.totalDeduction)}</b>
          </div>
          <div className="employee-deduction-grid">
            <Cost
              label={
                data.payrollType === "Emekli Personel"
                  ? "SGDP İşçi"
                  : "SGK İşçi"
              }
              value={data.employeeSgk}
              empty={data.payrollType === "Huzur Hakkı"}
            />
            <Cost
              label="İşsizlik İşçi"
              value={data.employeeUnemployment}
              empty={data.payrollType !== "Normal Personel"}
            />
            <Cost label="Gelir Vergisi Matrahı" value={data.incomeTaxBase} />
            <Cost label="Hesaplanan Gelir Vergisi" value={data.incomeTax} />
            <Cost
              label="Gelir Vergisi İstisnası"
              value={data.incomeTaxExemption}
            />
            <Cost label="Ödenen Gelir Vergisi" value={data.paidIncomeTax} />
            <Cost label="Hesaplanan Damga Vergisi" value={data.stampTax} />
            <Cost
              label="Damga Vergisi İstisnası"
              value={data.stampTaxExemption}
            />
            <Cost label="Ödenen Damga Vergisi" value={data.paidStampTax} />
            <Cost
              label="Diğer Yasal Kesinti"
              value={data.otherDeduction}
              empty={!data.otherDeduction}
            />
            <Cost label="Toplam Kesinti" value={data.totalDeduction} emphasis />
            <Cost label="Net Ödenen" value={data.netPaid} emphasis />
          </div>
        </>
      )}
    </section>
  );
}

function Cost({
  label,
  value,
  empty = false,
  emphasis = false,
}: {
  label: string;
  value: number;
  empty?: boolean;
  emphasis?: boolean;
}) {
  return (
    <span className={emphasis ? "emphasis" : ""}>
      {label}
      <b>{empty ? "—" : tl(value)}</b>
    </span>
  );
}
