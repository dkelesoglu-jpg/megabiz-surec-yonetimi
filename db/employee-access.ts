import type { SupabaseClient } from "@supabase/supabase-js";
import type { Access } from "./authorization";
import { camelizeKeys } from "./case.ts";

/**
 * hrms_pro.employee_identity_legal RLS matrisiyle (identity_company_select /
 * identity_self_select politikaları) birebir eşleşen rol listesi: bu roller
 * ŞİRKETTEKİ HERKESİN kimlik/çalışma izni alanlarını görebilir.
 * Diğer roller yalnızca kendi kaydını görebilir (self-select).
 */
export const IDENTITY_PRIVILEGED_ROLES = ["hr", "company_admin", "payroll"] as const;

export function canViewAnyIdentity(role: string): boolean {
  return role === "super_admin" || (IDENTITY_PRIVILEGED_ROLES as readonly string[]).includes(role);
}

/**
 * hrms_pro.employee_compensation_private RLS matrisiyle (comp_payroll_hr_select /
 * comp_self_select politikaları) birebir eşleşen rol listesi: bu roller
 * ŞİRKETTEKİ HERKESİN ücret/IBAN/banka alanlarını görebilir. Diğer roller
 * (manager dahil) yalnızca kendi kaydını görebilir (self-select). Kimlik
 * tablosuyla bugün aynı rol setini paylaşsa da, hrms_pro'da bağımsız bir RLS
 * politikası olduğu için ayrı tutulur — biri değişirse diğerini sessizce
 * etkilemez.
 */
export const COMPENSATION_PRIVILEGED_ROLES = ["hr", "company_admin", "payroll"] as const;

export function canViewAnyCompensation(role: string): boolean {
  return role === "super_admin" || (COMPENSATION_PRIVILEGED_ROLES as readonly string[]).includes(role);
}

/**
 * employees tablosundan yalnızca temel sicil/organizasyon alanları — kimlik
 * (national_id, passport_no, nationality, sgk_no, occupation_code,
 * work_permit_*) ve ücret/banka (salary, net_salary, iban, ...) alanları
 * burada YOK. SELECT * kullanılmaz.
 */
export const EMPLOYEE_BASE_COLUMNS = [
  "id",
  "company_id",
  "employee_no",
  "first_name",
  "last_name",
  "email",
  "phone",
  "department_id",
  "department",
  "position_id",
  "position",
  "manager",
  "second_manager",
  "acting_manager",
  "delegation_start",
  "delegation_end",
  "start_date",
  "end_date",
  "work_type",
  "employee_type",
  "payroll_type",
  "status",
  "weekly_hours",
  "birth_date",
  "birth_place",
  "gender",
  "address",
  "emergency_contact",
  "emergency_phone",
  "created_at",
  "updated_at",
].join(", ");

const IDENTITY_COLUMNS = [
  "employee_id",
  "national_id",
  "passport_no",
  "nationality",
  "sgk_no",
  "occupation_code",
  "work_permit_no",
  "work_permit_start",
  "work_permit_end",
  "work_permit_status",
  "work_permit_renewal_status",
  "work_permit_reminder_days",
].join(", ");

// employee_compensation_private: yalnızca ücret/IBAN/banka alanları — SELECT * yok.
const COMPENSATION_COLUMNS = [
  "employee_id",
  "iban",
  "salary",
  "net_salary",
  "cumulative_tax_base",
  "salary_basis",
  "salary_period",
].join(", ");

type EmployeeRow = Record<string, unknown> & { id: number; email?: string | null };

// Önceden bu iki tip, gerçek istemciyi taklit eden elle yazılmış (duck-typed)
// arayüzlerdi. supabase-js'in gerçek PostgrestFilterBuilder/PostgrestBuilder
// tipleri çok sayıda jenerik parametre ve aşırı yüklü (overloaded) `then`
// imzası taşıdığından, TypeScript bu tipleri elle yazılmış bir arayüze karşı
// yapısal olarak doğrularken "Type instantiation is excessively deep and
// possibly infinite" (TS2589) hatası veriyordu — arayüzün şekli ne olursa
// olsun. Çözüm: gerçek `SupabaseClient` tipini doğrudan kullanmak; bu şekilde
// çağrı noktalarında (getDb() sonucu zaten SupabaseClient) kimlik doğrulaması
// gerekir, yapısal (structural) karşılaştırma hiç tetiklenmez. Testlerdeki
// sahte istemciler .test.mjs (düz JS, tip denetimi yok) olduğundan bundan
// etkilenmez — çalışma zamanı davranışı değişmez.
export type EmployeeAccessDb = SupabaseClient;
export type EmployeeWriteDb = SupabaseClient;

/**
 * app/api/employees/route.ts POST/PUT'un employees tablosuna yazdığı satırdan
 * (dual-write; employees kolonları employee_cost_histories ve Excel aktarımının
 * mükerrer-kayıt eşlemesi tarafından hâlâ okunduğu için kaldırılmadı), kimlik/
 * çalışma izni ve ücret/IBAN alanlarını listEmployeesForAccess'in GERÇEKTEN
 * okuduğu employee_identity_legal / employee_compensation_private tablolarına
 * employee_id üzerinden upsert eder. Bu olmadan, sicil kartı kaydedildikten
 * sonra bu alanlar (nationalId hariç base kolonlarda olmayanlar) listEmployeesForAccess
 * üzerinden hiç dönmez / eski değerde kalır — çünkü o fonksiyon employees'ten
 * bu kolonları hiç seçmez.
 */
export async function upsertGatedEmployeeFields(
  db: EmployeeWriteDb,
  companyId: string,
  employeeId: number,
  row: Record<string, unknown>,
): Promise<void> {
  const now = new Date().toISOString();
  const identityValues = {
    employee_id: employeeId,
    company_id: companyId,
    national_id: (row.nationalId as string | undefined) || null,
    // Yabancı çalışan uyruğu (Excel "Yabancı Çalışan Bilgisi" sütunu ve
    // Çalışma İzni Merkezi'ndeki "Uyruğu" alanı) — IDENTITY_COLUMNS'ta zaten
    // okunuyordu ama buraya hiç yazılmıyordu (bkz. P8/P9 bulgusu).
    nationality: (row.nationality as string | undefined) || null,
    sgk_no: (row.sgkNo as string | undefined) || null,
    occupation_code: (row.occupationCode as string | undefined) || null,
    work_permit_no: (row.workPermitNo as string | undefined) || null,
    work_permit_start: (row.workPermitStart as string | undefined) || null,
    work_permit_end: (row.workPermitEnd as string | undefined) || null,
    updated_at: now,
  };
  const compensationValues = {
    employee_id: employeeId,
    company_id: companyId,
    iban: (row.iban as string | undefined) || null,
    salary: (row.salary as number | null | undefined) ?? null,
    net_salary: (row.netSalary as number | null | undefined) ?? null,
    salary_basis: (row.salaryBasis as string | undefined) || null,
    salary_period: (row.salaryPeriod as string | undefined) || null,
    updated_at: now,
  };
  const [identityResult, compensationResult] = await Promise.all([
    db.from("employee_identity_legal").upsert(identityValues, { onConflict: "employee_id" }),
    db.from("employee_compensation_private").upsert(compensationValues, { onConflict: "employee_id" }),
  ]);
  if (identityResult.error) throw new Error(identityResult.error.message);
  if (compensationResult.error) throw new Error(compensationResult.error.message);
}

/**
 * Belirli bir hassas-veri tablosundan (employee_identity_legal /
 * employee_compensation_private), yalnızca verilen employee_id kümesi için,
 * verilen kolonları okur ve employee_id -> alanlar (employee_id hariç) eşlemi
 * döner. targetIds boşsa hiç sorgu atmaz.
 */
async function fetchGatedFields(
  db: EmployeeAccessDb,
  table: string,
  columns: string,
  companyId: string,
  targetIds: number[],
): Promise<Map<number, Record<string, unknown>>> {
  if (!targetIds.length) return new Map();
  const { data, error } = await db.from(table).select(columns).eq("company_id", companyId).in("employee_id", targetIds);
  if (error) throw new Error(error.message);
  const rows = camelizeKeys(data ?? []) as unknown as Array<Record<string, unknown>>;
  return new Map(
    rows.map((row) => {
      const { employeeId, ...fields } = row;
      return [employeeId as number, fields];
    }),
  );
}

/**
 * Rol kontrollü, merkezi personel okuma fonksiyonu.
 *
 * - Kimlik/çalışma izni alanlarını yalnızca yetkili rol
 *   (super_admin/hr/company_admin/payroll) veya kendi kaydına bakan çağıran
 *   için employee_identity_legal'dan ekler (hrms_pro identity_* politikaları).
 * - Ücret/IBAN/banka alanlarını aynı şekilde yalnızca yetkili rol veya kendi
 *   kaydına bakan çağıran için employee_compensation_private'tan ekler
 *   (hrms_pro comp_* politikaları). Manager dahil diğer roller başkasının
 *   ücret/IBAN bilgisini hiçbir şekilde alamaz.
 *
 * Yetkisiz görünümde bu alanlar hiç dönmez — `nationalId` istisna: mevcut ön
 * yüz (app/page.tsx) onu zorunlu string olarak `.startsWith()` ile doğrudan
 * kullandığından, yetkisiz durumda gerçek değer yerine "" döner (sızıntı
 * yok, ekran çökmez). Ücret/IBAN alanları ön yüzde zaten optional olarak
 * kullanıldığından (MoneyField `value?: number`, Select'ler `||` varsayılanlı,
 * IBAN `defaultValue`) böyle bir yer tutucuya ihtiyaç yoktur — tamamen
 * dönmezler.
 */
export async function listEmployeesForAccess(
  db: EmployeeAccessDb,
  companyId: string,
  access: Access,
  filterId?: number,
): Promise<EmployeeRow[]> {
  let query = db.from("employees").select(EMPLOYEE_BASE_COLUMNS).eq("company_id", companyId);
  if (filterId) query = query.eq("id", filterId);
  const { data, error } = await query.order("first_name", { ascending: true });
  if (error) throw new Error(error.message);
  const base = camelizeKeys(data ?? []) as unknown as EmployeeRow[];
  if (!base.length) return base;

  const callerEmail = access.email.toLowerCase();
  const ownEmployeeId =
    base.find((e) => String(e.email ?? "").toLowerCase() === callerEmail)?.id ?? null;
  const allIds = base.map((e) => e.id);
  const selfOnlyIds = ownEmployeeId != null ? [ownEmployeeId] : [];

  const identityTargetIds = canViewAnyIdentity(access.role) ? allIds : selfOnlyIds;
  const compensationTargetIds = canViewAnyCompensation(access.role) ? allIds : selfOnlyIds;

  const [identityById, compensationById] = await Promise.all([
    fetchGatedFields(db, "employee_identity_legal", IDENTITY_COLUMNS, companyId, identityTargetIds),
    fetchGatedFields(db, "employee_compensation_private", COMPENSATION_COLUMNS, companyId, compensationTargetIds),
  ]);

  return base.map((employee) => {
    const identity = identityById.get(employee.id) ?? {};
    const compensation = compensationById.get(employee.id) ?? {};
    const restIdentityFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(identity)) {
      if (key !== "nationalId") restIdentityFields[key] = value;
    }
    const nationalId = identity.nationalId;
    return {
      ...employee,
      ...restIdentityFields,
      ...compensation,
      nationalId: typeof nationalId === "string" ? nationalId : "",
    };
  });
}
