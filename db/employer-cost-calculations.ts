export type TaxBracket = { limit: number | null; rate: number };
export type LegalParameters = {
  minimumWage: number;
  sgkFloor: number;
  sgkCeiling: number;
  employeeSgkRate: number;
  employerSgkRate: number;
  employeeUnemploymentRate: number;
  employerUnemploymentRate: number;
  employerIncentiveRate: number;
  stampTaxRate: number;
  employeeSgdpRate: number;
  employerSgdpRate: number;
  incomeTaxBrackets: TaxBracket[];
  minimumWageIncomeTaxExemption: number;
  minimumWageStampTaxExemption: number;
  mealSgkDailyExemption: number;
  mealTaxDailyExemption: number;
  travelSgkDailyExemption: number;
  travelTaxDailyExemption: number;
};
export type CostBreakdown = {
  gross: number;
  net: number;
  employeeSgk: number;
  employeeUnemployment: number;
  incomeTax: number;
  stampTax: number;
  employerSgkBeforeIncentive: number;
  sgkIncentive: number;
  employerSgk: number;
  employerUnemployment: number;
  meal: number;
  travel: number;
  health: number;
  bes: number;
  vehicle: number;
  phone: number;
  bonus: number;
  otherBenefits: number;
  benefits: number;
  employerCost: number;
  activeDays: number;
  periodDays: number;
};

export const DEFAULT_LEGAL_PARAMETERS: LegalParameters = {
  minimumWage: 33030,
  sgkFloor: 33030,
  sgkCeiling: 297270,
  employeeSgkRate: 1400,
  employerSgkRate: 2175,
  employeeUnemploymentRate: 100,
  employerUnemploymentRate: 200,
  employerIncentiveRate: 500,
  stampTaxRate: 75.9,
  employeeSgdpRate: 750,
  employerSgdpRate: 2475,
  incomeTaxBrackets: [
    { limit: 190000, rate: 15 },
    { limit: 400000, rate: 20 },
    { limit: 1500000, rate: 27 },
    { limit: 5300000, rate: 35 },
    { limit: null, rate: 40 },
  ],
  minimumWageIncomeTaxExemption: 0,
  minimumWageStampTaxExemption: 0,
  mealSgkDailyExemption: 0,
  mealTaxDailyExemption: 0,
  travelSgkDailyExemption: 0,
  travelTaxDailyExemption: 0,
};
const money = (n: number) =>
  Math.max(0, Math.round((Number.isFinite(n) ? n : 0) * 100) / 100);
const rate = (basisPoints: number) => basisPoints / 10000;
export function progressiveTax(
  base: number,
  cumulative: number,
  brackets: TaxBracket[],
) {
  let tax = 0,
    remaining = Math.max(0, base),
    previous = 0;
  const cursor = Math.max(0, cumulative);
  for (const bracket of brackets) {
    const ceiling = bracket.limit ?? Infinity,
      available = Math.max(0, ceiling - Math.max(previous, cursor)),
      slice = Math.min(remaining, available);
    tax += (slice * bracket.rate) / 100;
    remaining -= slice;
    if (remaining <= 0) break;
    previous = ceiling;
  }
  return money(tax);
}
export function grossToNet(
  gross: number,
  p: LegalParameters,
  cumulativeTaxBase = 0,
  retired = false,
) {
  const sgkBase = Math.min(
      p.sgkCeiling || gross,
      Math.max(p.sgkFloor || 0, gross),
    ),
    employeeSgk =
      sgkBase * rate(retired ? p.employeeSgdpRate : p.employeeSgkRate),
    employeeUnemployment = retired
      ? 0
      : sgkBase * rate(p.employeeUnemploymentRate),
    taxBase = Math.max(0, gross - employeeSgk - employeeUnemployment),
    incomeTax = Math.max(
      0,
      progressiveTax(taxBase, cumulativeTaxBase, p.incomeTaxBrackets) -
        p.minimumWageIncomeTaxExemption,
    ),
    stampTax = Math.max(
      0,
      gross * rate(p.stampTaxRate) - p.minimumWageStampTaxExemption,
    );
  return {
    net: money(
      gross - employeeSgk - employeeUnemployment - incomeTax - stampTax,
    ),
    employeeSgk: money(employeeSgk),
    employeeUnemployment: money(employeeUnemployment),
    incomeTax: money(incomeTax),
    stampTax: money(stampTax),
  };
}
export function netToGross(
  net: number,
  p: LegalParameters,
  cumulativeTaxBase = 0,
  retired = false,
) {
  let low = Math.max(0, net),
    high = Math.max(net * 2, net + 10000);
  while (grossToNet(high, p, cumulativeTaxBase, retired).net < net) high *= 1.5;
  for (let i = 0; i < 55; i++) {
    const mid = (low + high) / 2;
    if (grossToNet(mid, p, cumulativeTaxBase, retired).net < net) low = mid;
    else high = mid;
  }
  return money(high);
}
export function monthlyBenefit(amount: number, frequency: string) {
  return frequency === "Günlük"
    ? amount * 22
    : frequency === "Yıllık"
    ? amount / 12
    : frequency === "Tek Seferlik"
      ? 0
      : amount;
}
export function calculateMonthlyCost(
  input: {
    gross?: number | null;
    net?: number | null;
    salaryBasis?: string;
    employeeType?: string;
    cumulativeTaxBase?: number;
    incentiveRate?: number;
    benefits?: Record<string, number>;
    activeRatio?: number;
  },
  p: LegalParameters,
): CostBreakdown {
  const retired = input.employeeType === "Emekli",
    gross =
      input.salaryBasis === "Net" && input.net
        ? netToGross(input.net, p, input.cumulativeTaxBase, retired)
        : Number(input.gross || 0) ||
          netToGross(
            Number(input.net || 0),
            p,
            input.cumulativeTaxBase,
            retired,
          ),
    pay = grossToNet(gross, p, input.cumulativeTaxBase, retired),
    net = input.salaryBasis === "Net" && input.net ? input.net : pay.net,
    sgkBase = Math.min(p.sgkCeiling || gross, Math.max(p.sgkFloor || 0, gross)),
    employerBefore =
      sgkBase * rate(retired ? p.employerSgdpRate : p.employerSgkRate),
    incentive = retired
      ? 0
      : sgkBase * rate(input.incentiveRate ?? p.employerIncentiveRate),
    employerSgk = Math.max(0, employerBefore - incentive),
    employerUnemployment = retired
      ? 0
      : sgkBase * rate(p.employerUnemploymentRate),
    b = input.benefits || {},
    ratio = Math.max(0, Math.min(1, input.activeRatio ?? 1)),
    fields = {
      meal: b.Yemek || 0,
      travel: b.Yol || 0,
      health: b.Sağlık || 0,
      bes: b.BES || 0,
      vehicle: b.Araç || 0,
      phone: b.Telefon || 0,
      bonus: b.Prim || 0,
      otherBenefits: b.Diğer || 0,
    },
    benefits = Object.values(fields).reduce((s, n) => s + n, 0),
    scaled = (n: number) => money(n * ratio);
  return {
    gross: scaled(gross),
    net: scaled(net),
    employeeSgk: scaled(pay.employeeSgk),
    employeeUnemployment: scaled(pay.employeeUnemployment),
    incomeTax: scaled(pay.incomeTax),
    stampTax: scaled(pay.stampTax),
    employerSgkBeforeIncentive: scaled(employerBefore),
    sgkIncentive: scaled(incentive),
    employerSgk: scaled(employerSgk),
    employerUnemployment: scaled(employerUnemployment),
    meal: scaled(fields.meal),
    travel: scaled(fields.travel),
    health: scaled(fields.health),
    bes: scaled(fields.bes),
    vehicle: scaled(fields.vehicle),
    phone: scaled(fields.phone),
    bonus: scaled(fields.bonus),
    otherBenefits: scaled(fields.otherBenefits),
    benefits: scaled(benefits),
    employerCost: scaled(gross + employerSgk + employerUnemployment + benefits),
    activeDays: 0,
    periodDays: 0,
  };
}
export function dateOverlap(
  from: string,
  to: string,
  activeFrom: string,
  activeTo?: string | null,
) {
  const start = new Date(
      Math.max(
        new Date(from + "T00:00:00Z").getTime(),
        new Date(activeFrom + "T00:00:00Z").getTime(),
      ),
    ),
    end = new Date(
      Math.min(
        new Date(to + "T00:00:00Z").getTime(),
        new Date((activeTo || to) + "T00:00:00Z").getTime(),
      ),
    );
  return end < start
    ? 0
    : Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
}
export function median(values: number[]) {
  if (!values.length) return 0;
  const a = [...values].sort((x, y) => x - y),
    m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}
