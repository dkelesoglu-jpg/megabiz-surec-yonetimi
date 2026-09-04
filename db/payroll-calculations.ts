import {
  calculateMonthlyCost,
  grossToNet,
  progressiveTax,
  type LegalParameters,
} from "./employer-cost-calculations.ts";

export type PayrollType = "Normal Personel" | "Emekli Personel" | "Huzur Hakkı";

export type PayrollInput = {
  payrollType: PayrollType;
  salaryBasis: string;
  netSalary?: number | null;
  grossSalary?: number | null;
  cumulativeTaxBase?: number;
  benefits?: number;
};

export type PayrollParameters = LegalParameters & {
  honorariumIncomeTaxExemption?: number;
  honorariumStampTaxExemption?: number;
  honorariumOtherDeductionRate?: number;
};

const money = (value: number) =>
  Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
const rate = (basisPoints: number) => basisPoints / 10000;

function honorariumGrossFromNet(
  net: number,
  p: PayrollParameters,
  cumulativeTaxBase: number,
) {
  const calculateNet = (gross: number) => {
    const incomeTaxBase = gross;
    const incomeTax = Math.max(
      0,
      progressiveTax(incomeTaxBase, cumulativeTaxBase, p.incomeTaxBrackets) -
        (p.honorariumIncomeTaxExemption || 0),
    );
    const stampTax = Math.max(
      0,
      gross * rate(p.stampTaxRate) - (p.honorariumStampTaxExemption || 0),
    );
    const otherDeduction = gross * rate(p.honorariumOtherDeductionRate || 0);
    return gross - incomeTax - stampTax - otherDeduction;
  };
  let low = Math.max(0, net),
    high = Math.max(net * 2, net + 10000);
  while (calculateNet(high) < net) high *= 1.5;
  for (let index = 0; index < 60; index++) {
    const middle = (low + high) / 2;
    if (calculateNet(middle) < net) low = middle;
    else high = middle;
  }
  return money(high);
}

export function calculatePayroll(input: PayrollInput, p: PayrollParameters) {
  const benefits = money(input.benefits || 0),
    cumulativeTaxBase = input.cumulativeTaxBase || 0;
  if (input.payrollType === "Huzur Hakkı") {
    const gross =
        input.salaryBasis === "Net" && input.netSalary
          ? honorariumGrossFromNet(input.netSalary, p, cumulativeTaxBase)
          : money(input.grossSalary || 0),
      incomeTaxBase = gross,
      incomeTax = money(
        progressiveTax(incomeTaxBase, cumulativeTaxBase, p.incomeTaxBrackets),
      ),
      incomeTaxExemption = money(p.honorariumIncomeTaxExemption || 0),
      paidIncomeTax = money(Math.max(0, incomeTax - incomeTaxExemption)),
      stampTax = money(gross * rate(p.stampTaxRate)),
      stampTaxExemption = money(p.honorariumStampTaxExemption || 0),
      paidStampTax = money(Math.max(0, stampTax - stampTaxExemption)),
      otherDeduction = money(gross * rate(p.honorariumOtherDeductionRate || 0)),
      totalDeduction = money(paidIncomeTax + paidStampTax + otherDeduction),
      calculatedNet = money(gross - totalDeduction),
      netPaid =
        input.salaryBasis === "Net" && input.netSalary
          ? money(input.netSalary)
          : calculatedNet,
      employerCost = money(gross + benefits);
    return {
      payrollType: input.payrollType,
      net: netPaid,
      netWithoutExemption: money(gross - incomeTax - stampTax - otherDeduction),
      gross,
      employeeSgk: 0,
      employeeUnemployment: 0,
      incomeTaxBase,
      incomeTax,
      stampTax,
      incomeTaxExemption,
      stampTaxExemption,
      paidIncomeTax,
      paidStampTax,
      otherDeduction,
      totalDeduction,
      netPaid,
      employerSgk: 0,
      employerUnemployment: 0,
      employerSgdp: 0,
      employerSgkBeforeIncentive: 0,
      incentive5510: 0,
      costWithoutIncentive: employerCost,
      costWith5510: employerCost,
      benefits,
      employerCost,
    };
  }

  const retired = input.payrollType === "Emekli Personel",
    employeeType = retired ? "Emekli" : "Normal",
    cost = calculateMonthlyCost(
      {
        gross: input.grossSalary,
        net: input.netSalary,
        salaryBasis: input.salaryBasis,
        employeeType,
        cumulativeTaxBase,
        benefits: benefits ? { Diğer: benefits } : {},
      },
      p,
    ),
    grossDetails = grossToNet(cost.gross, p, cumulativeTaxBase, retired),
    incomeTaxBase = money(
      cost.gross - grossDetails.employeeSgk - grossDetails.employeeUnemployment,
    ),
    incomeTaxBeforeExemption = money(
      progressiveTax(incomeTaxBase, cumulativeTaxBase, p.incomeTaxBrackets),
    ),
    stampTaxBeforeExemption = money(cost.gross * rate(p.stampTaxRate)),
    incomeTaxExemption = money(p.minimumWageIncomeTaxExemption),
    stampTaxExemption = money(p.minimumWageStampTaxExemption),
    paidIncomeTax = money(
      Math.max(0, incomeTaxBeforeExemption - incomeTaxExemption),
    ),
    paidStampTax = money(
      Math.max(0, stampTaxBeforeExemption - stampTaxExemption),
    ),
    totalDeduction = money(
      cost.employeeSgk +
        cost.employeeUnemployment +
        paidIncomeTax +
        paidStampTax,
    ),
    netPaid =
      input.salaryBasis === "Net" && input.netSalary
        ? money(input.netSalary)
        : money(cost.gross - totalDeduction),
    employerSgdp = retired ? cost.employerSgk : 0,
    employerSgk = retired ? 0 : cost.employerSgk,
    incentive5510 = retired ? 0 : cost.sgkIncentive,
    costWithoutIncentive = money(
      cost.gross +
        cost.employerSgkBeforeIncentive +
        cost.employerUnemployment +
        benefits,
    );
  return {
    payrollType: input.payrollType,
    net: netPaid,
    netWithoutExemption: money(
      cost.gross -
        cost.employeeSgk -
        cost.employeeUnemployment -
        incomeTaxBeforeExemption -
        stampTaxBeforeExemption,
    ),
    gross: cost.gross,
    employeeSgk: cost.employeeSgk,
    employeeUnemployment: cost.employeeUnemployment,
    incomeTaxBase,
    incomeTax: incomeTaxBeforeExemption,
    stampTax: stampTaxBeforeExemption,
    incomeTaxExemption,
    stampTaxExemption,
    paidIncomeTax,
    paidStampTax,
    otherDeduction: 0,
    totalDeduction,
    netPaid,
    employerSgk,
    employerUnemployment: cost.employerUnemployment,
    employerSgdp,
    employerSgkBeforeIncentive: cost.employerSgkBeforeIncentive,
    incentive5510,
    costWithoutIncentive,
    costWith5510: cost.employerCost,
    benefits,
    employerCost: cost.employerCost,
  };
}
