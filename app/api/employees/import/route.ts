import { getDb } from "../../../../db";
import {
  accessError,
  requireAccess,
  requireModuleAccess,
  writeAudit,
} from "../../../../db/authorization";
import { nextNumber, registerExistingNumber } from "../../../../db/number-series";
import { camelizeKeys, snakeizeKeys } from "../../../../db/case";
import { upsertGatedEmployeeFields } from "../../../../db/employee-access";
import { parseTrMoney } from "../../../tr-money";

type Raw = Record<string, unknown>;
type Issue = { level: "error" | "warning"; code: string; message: string };
const tr = (value: string) =>
  value
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replaceAll("ı", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .replace(/[^a-z0-9]/g, "");
const aliases: Record<string, string> = {
  sicilno: "employeeNo", ad: "firstName", soyad: "lastName", adsoyad: "fullName",
  tckimlikno: "nationalId", tc: "nationalId", departman: "department",
  pozisyonunvan: "position", pozisyon: "position", unvan: "position",
  isegiristarihi: "startDate", bagliolduguyonetici: "managerName", kimebagli: "managerName",
  yoneticisicilno: "managerEmployeeNo", epostaadresi: "email", eposta: "email",
  telefonnumarasi: "phone", telefon: "phone", iban: "iban", netucret: "netSalary",
  brutucret: "salary", calismasekli: "workType", personelturu: "employeeType",
  sgksicilno: "sgkNo", sgkmeslekkodu: "occupationCode", dogumtarihi: "birthDate",
  dogumyeri: "birthPlace", cinsiyet: "gender", adres: "address",
  acildurumkisisi: "emergencyContact", acildurumtelefonu: "emergencyPhone",
  yabancicalisanbilgisi: "foreignInfo", calismaiznibitistarihi: "workPermitEnd",
  istencikistarihi: "endDate", cikistarihi: "endDate", calismadurumu: "status",
  durum: "status", personeltipi: "employeeType", nettbrutucrettipi: "salaryBasis",
  netbrutucrettipi: "salaryBasis", ucrettipi: "salaryBasis", ucret: "salaryValue",
};
const text = (v: unknown) => String(v ?? "").trim();
// Manuel sicil kartı oluşturma/düzenleme (app/api/employees/route.ts) ile AYNI
// ortak parseTrMoney (app/tr-money.ts) kullanılır — iki ayrı, birbirinden
// sapabilen ücret ayrıştırıcısı olmasın diye. parseTrMoney zaten kuruş
// hassasiyetini (2 ondalık) koruyor; burada AYRICA tam sayıya yuvarlama
// yapılmaz (bkz. aşağıdaki values.salary/net_salary ataması).
function moneyWithIssue(v: unknown, fieldLabel: string): { value: number | null; issue: Issue | null } {
  const raw = text(v);
  if (!raw) return { value: null, issue: null };
  const value = parseTrMoney(raw);
  if (value === null) {
    return {
      value: null,
      issue: {
        level: "warning",
        code: "invalid_money",
        message: `${fieldLabel} ayrıştırılamadı: "${raw}" geçerli bir tutar değil; sicil kartından tamamlanabilir`,
      },
    };
  }
  // Yalnızca virgül var (nokta yok) ve virgülden sonra TAM 3 hane: TR
  // kuralına göre ondalık (ör. "35,000" -> 35 TL, 0.000 kuruş) olarak
  // ayrıştırılır, ama kaynağın ABD tarzı binlik virgülüyle yazılmış olma
  // ihtimali de var (35 bin mi demek istendi?). Tutarlılık için TR kuralı
  // uygulanır (item 4), ama satır bazında uyarı verilir ki insan kontrol etsin.
  const cleaned = raw.replace(/\s|₺|TL/gi, "");
  if (/^-?\d{1,3},\d{3}$/.test(cleaned)) {
    return {
      value,
      issue: {
        level: "warning",
        code: "ambiguous_money",
        message: `${fieldLabel} belirsiz biçim: "${raw}" TR biçimine göre ${value} olarak yorumlandı; ABD binlik ayracıyla yazılmışsa sicil kartından kontrol edin`,
      },
    };
  }
  return { value, issue: null };
}
// Sicil Kartı'nın (app/page.tsx EmployeeForm/EmployeeDetail) kabul ettiği
// TEK 4 kanonik "Çalışma Şekli" değeri — Excel'den gelen serbest metin
// bunlardan birine normalize edilir. `tr()` zaten büyük/küçük harf, Türkçe
// karakter (ı/ş/ğ/ü/ö/ç) ve boşluk/tire farklarını sildiği için
// "Full-Time"/"full time"/"tam zamanli"/"TAM ZAMANLI" gibi varyantların
// hepsi aynı anahtara düşer.
const WORK_TYPE_ALIASES: Record<string, string> = {
  tamzamanli: "Tam Zamanlı", fulltime: "Tam Zamanlı",
  yarizamanli: "Yarı Zamanlı", parttime: "Yarı Zamanlı",
  hibrit: "Hibrit", hybrid: "Hibrit",
  uzaktan: "Uzaktan", remote: "Uzaktan",
};
// NOT: Bu yalnızca "Çalışma Şekli" (workType) alanı içindir — "Personel
// Türü" (employeeType: Normal/Emekli/Yabancı/Stajyer) TAMAMEN AYRI bir
// alandır, burada dokunulmaz/karıştırılmaz (bkz. normalize()'daki
// employeeType ataması, aşağıda değişmedi).
function normalizeWorkType(v: unknown): { value: string; issue: Issue | null } {
  const raw = text(v);
  if (!raw) return { value: "", issue: null };
  const canonical = WORK_TYPE_ALIASES[tr(raw)];
  if (canonical) return { value: canonical, issue: null };
  // Eşleşmeyen değer TAHMİN EDİLMEZ: Excel'deki ham metin olduğu gibi
  // korunur (sessizce "Tam Zamanlı"ya düşürülmez) ve satır bazında uyarı
  // üretilir; kullanıcı sicil kartından manuel düzeltebilir.
  return {
    value: raw,
    issue: {
      level: "warning",
      code: "unrecognized_work_type",
      message: `Çalışma Şekli tanınamadı: "${raw}" — Tam Zamanlı/Yarı Zamanlı/Hibrit/Uzaktan değerlerinden biri değil; sicil kartından düzeltilebilir`,
    },
  };
}
const date = (v: unknown) => {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  const s = text(v);
  if (!s) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
};
const phone = (v: unknown) => {
  let n = text(v).replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("0090")) n = n.slice(2);
  if (n.startsWith("90") && n.length === 12) return `+${n}`;
  if (n.startsWith("0") && n.length === 11) n = n.slice(1);
  return n.length === 10 ? `+90${n}` : `+${n}`;
};
function iban(v: unknown) {
  const value = text(v).replace(/\s/g, "").toUpperCase();
  if (!value) return { value: "", valid: true };
  if (!/^TR\d{24}$/.test(value)) return { value, valid: false };
  const converted = (value.slice(4) + value.slice(0, 4)).split("").map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c)).join("");
  let mod = 0;
  for (const c of converted) mod = (mod * 10 + Number(c)) % 97;
  return { value, valid: mod === 1 };
}
type NormalizedEmployeeData = {
  employeeNo: string; firstName: string; lastName: string; nationalId: string;
  department: string; position: string; startDate: string; managerName: string;
  managerEmployeeNo: string; email: string; phone: string; iban: string;
  netSalary: number | null; salary: number | null; workType: string; employeeType: string;
  sgkNo: string; occupationCode: string; birthDate: string; birthPlace: string;
  gender: string; address: string; emergencyContact: string; emergencyPhone: string;
  nationality: string; workPermitEnd: string; endDate: string; status: string;
  salaryBasis: string; salaryValue: number | null;
};
function normalize(raw: Raw): { data: NormalizedEmployeeData; issues: Issue[] } {
  const mapped: Raw = {};
  for (const [k, v] of Object.entries(raw)) {
    const field = aliases[tr(k)] || k;
    mapped[field] = v;
  }
  let firstName = text(mapped.firstName), lastName = text(mapped.lastName);
  if ((!firstName || !lastName) && text(mapped.fullName)) {
    const parts = text(mapped.fullName).split(/\s+/);
    if (parts.length === 1) firstName = parts[0];
    else { lastName = parts.pop() || ""; firstName = parts.join(" "); }
  }
  const foreign = /evet|yes|yabanci/i.test(text(mapped.foreignInfo));
  const netSalaryResult = moneyWithIssue(mapped.netSalary, "Net Ücret"),
    salaryResult = moneyWithIssue(mapped.salary, "Brüt Ücret"),
    salaryValueResult = moneyWithIssue(mapped.salaryValue, "Ücret"),
    // "Çalışma Şekli" (workType) — "Personel Türü" (employeeType) İLE
    // KARIŞTIRILMAZ: aşağıda employeeType tamamen ayrı, kendi mantığıyla
    // (Normal/Emekli/Yabancı/Stajyer) hesaplanır, workTypeResult'a hiç
    // dokunmaz.
    workTypeResult = normalizeWorkType(mapped.workType);
  const issues = [netSalaryResult.issue, salaryResult.issue, salaryValueResult.issue, workTypeResult.issue].filter(
    (issue): issue is Issue => issue !== null,
  );
  const data: NormalizedEmployeeData = {
    employeeNo: text(mapped.employeeNo), firstName, lastName,
    nationalId: text(mapped.nationalId).replace(/\D/g, ""),
    department: text(mapped.department), position: text(mapped.position),
    startDate: date(mapped.startDate), managerName: text(mapped.managerName),
    managerEmployeeNo: text(mapped.managerEmployeeNo), email: text(mapped.email).toLowerCase(),
    phone: phone(mapped.phone), iban: iban(mapped.iban).value,
    netSalary: netSalaryResult.value, salary: salaryResult.value,
    workType: workTypeResult.value,
    employeeType: text(mapped.employeeType) || (foreign ? "Yabancı" : "Normal"),
    sgkNo: text(mapped.sgkNo), occupationCode: text(mapped.occupationCode),
    birthDate: date(mapped.birthDate), birthPlace: text(mapped.birthPlace),
    gender: text(mapped.gender), address: text(mapped.address),
    emergencyContact: text(mapped.emergencyContact), emergencyPhone: phone(mapped.emergencyPhone),
    nationality: foreign ? text(mapped.foreignInfo) : "",
    workPermitEnd: date(mapped.workPermitEnd), endDate: date(mapped.endDate),
    status: text(mapped.status) || "Aktif",
    salaryBasis: /net/i.test(text(mapped.salaryBasis)) ? "Net" : /br[uü]t/i.test(text(mapped.salaryBasis)) ? "Brüt" : "",
    salaryValue: salaryValueResult.value,
  };
  return { data, issues };
}
function providedFields(raw: Raw) {
  const fields = new Set<string>();
  for (const [key, value] of Object.entries(raw)) {
    const field = aliases[tr(key)] || key;
    if (text(value)) fields.add(field);
  }
  return fields;
}
function findExistingEmployee(employeeRows: Array<Record<string, any>>, data: NormalizedEmployeeData) {
  if (data.nationalId) {
    const match = employeeRows.find((row) => row.nationalId === data.nationalId);
    if (match) return match;
  }
  if (data.employeeNo) {
    const match = employeeRows.find((row) => row.employeeNo === data.employeeNo);
    if (match) return match;
  }
  if (data.email) return employeeRows.find((row) => row.email?.toLowerCase() === data.email);
}
const changeLabels: Record<string, string> = {
  employeeNo: "Sicil No", firstName: "Ad", lastName: "Soyad", nationalId: "T.C. Kimlik No",
  department: "Departman", position: "Pozisyon", startDate: "İşe Giriş Tarihi", endDate: "İşten Çıkış Tarihi",
  status: "Çalışma Durumu", workType: "Çalışma Şekli", employeeType: "Personel Tipi", email: "E-posta",
  phone: "Telefon", iban: "IBAN", birthDate: "Doğum Tarihi", sgkNo: "SGK Sicil No", occupationCode: "SGK Meslek Kodu",
  salary: "Brüt Ücret", netSalary: "Net Ücret", salaryBasis: "Ücret Tipi",
};
function validate(data: NormalizedEmployeeData) {
  const issues: Issue[] = [];
  if (!data.firstName && !data.lastName) issues.push({ level: "error", code: "missing_name", message: "Ad veya Ad Soyad bulunamadı" });
  // Sicil No BİLEREK bu listede DEĞİL: boşsa commit() sırasında nextNumber()
  // (bkz. db/number-series.ts) HER ZAMAN ya geçerli bir numara döner ya da
  // exception fırlatır (30 denemeden sonra "Numara üretilemedi" hatasıyla) —
  // hiçbir zaman sessizce boş bırakmaz. Bir exception fırlarsa tüm istek
  // accessError ile açıkça başarısız olur (gerçek hata gizlenmez); satır
  // bazında bir "başarısız numaralandırma" durumu yoktur. Bu yüzden boş
  // Sicil No, department/position/startDate/workType'ın aksine, gerçekten
  // "eksik kalabilecek" bir alan değildir — missing_employeeNo uyarısı
  // önizleme ve aktarım sonucunda YANILTICI olurdu, bu yüzden üretilmez.
  for (const [field, label] of [["department", "Departman"], ["position", "Pozisyon"], ["startDate", "İşe Giriş Tarihi"], ["workType", "Çalışma Şekli"]] as const)
    if (!data[field]) issues.push({ level: "warning", code: `missing_${field}`, message: `${label} eksik; sicil kartından tamamlanabilir` });
  if (data.nationalId && !/^\d{11}$/.test(data.nationalId)) issues.push({ level: "warning", code: "invalid_national_id", message: "T.C. Kimlik No 11 haneli olmalıdır" });
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) issues.push({ level: "warning", code: "invalid_email", message: "E-posta formatı hatalı" });
  if (data.iban && !iban(data.iban).valid) issues.push({ level: "warning", code: "invalid_iban", message: "TR IBAN formatı veya kontrol basamağı hatalı" });
  if (!data.nationalId) issues.push({ level: "warning", code: "missing_national_id", message: "T.C. Kimlik No girilmedi" });
  // Eksik ücret aktarımı DURDURULMAZ — uyarı üretilir, sicil kartından
  // sonradan manuel tamamlanabilir (bkz. Net/Brüt Ücret/Ücret sütunlarının
  // üçü de boşsa).
  if (data.netSalary == null && data.salary == null && data.salaryValue == null)
    issues.push({ level: "warning", code: "missing_wage", message: "Net veya Brüt Ücret girilmedi; sicil kartından tamamlanabilir" });
  return issues;
}
function rowStatus(issues: Issue[], duplicate: boolean, newDepartment: boolean, newPosition: boolean, managerMissing: boolean) {
  const safeIssues = Array.isArray(issues) ? issues : [];
  if (safeIssues.some((x) => x.level === "error")) return "Aktarılamaz – Kritik Hata";
  if (duplicate) return "Mevcut kayıt";
  if (newDepartment) return "Yeni departman";
  if (newPosition) return "Yeni pozisyon";
  if (managerMissing) return "Yönetici bulunamadı";
  if (safeIssues.length) return "Aktarılabilir – Eksik Bilgi";
  return "Aktarılabilir";
}
async function context(companyId: string) {
  const db = getDb();
  const [deptRes, posRes, empRes] = await Promise.all([
    db.from("departments").select("*").eq("company_id", companyId),
    db.from("positions").select("*").eq("company_id", companyId),
    db.from("employees").select("*").eq("company_id", companyId),
  ]);
  return {
    departmentRows: camelizeKeys(deptRes.data ?? []),
    positionRows: camelizeKeys(posRes.data ?? []),
    employeeRows: camelizeKeys(empRes.data ?? []),
  };
}

export async function POST(request: Request) {
  try {
    const parsed = await request.json(),
      payload = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Raw) : {},
      companyId = text(payload.targetCompanyId),
      action = text(payload.action) || "preview";
    if (!companyId) return Response.json({ error: "Hedef şirket seçilmelidir" }, { status: 400 });
    const access = await requireAccess(request, companyId, true);
    await requireModuleAccess(access, "Personel", true);
    if (!["super_admin", "company_admin", "hr"].includes(access.role))
      return Response.json({ error: "Toplu personel aktarımı için İK veya yönetici yetkisi gereklidir" }, { status: 403 });
    const rows = Array.isArray(payload.rows) ? payload.rows.filter((row): row is Raw => Boolean(row) && typeof row === "object" && !Array.isArray(row)) : [];
    if (!rows.length) return Response.json({ error: "Excel dosyasında aktarılabilir satır bulunamadı" }, { status: 400 });
    if (rows.length > 2000) return Response.json({ error: "Tek aktarımda en fazla 2.000 personel yüklenebilir" }, { status: 400 });
    const { departmentRows, positionRows, employeeRows } = await context(companyId);

    if (action === "preview") {
      const seenEmployeeNos = new Set<string>(), seenNationalIds = new Set<string>(), seenEmails = new Set<string>();
      const reviewed = rows.map((raw, index) => {
        const { data, issues: normalizeIssues } = normalize(raw),
          supplied = providedFields(raw), issues = [...normalizeIssues, ...validate(data)],
          department = departmentRows.find((d) => tr(d.name) === tr(data.department)),
          position = department && positionRows.find((p) => p.departmentId === department.id && tr(p.title) === tr(data.position)),
          duplicate = findExistingEmployee(employeeRows, data),
          manager = data.managerEmployeeNo
            ? employeeRows.find((e) => e.employeeNo === data.managerEmployeeNo)
            : employeeRows.find((e) => (data.managerName.includes("@") ? e.email?.toLowerCase() === data.managerName.toLowerCase() : `${e.firstName} ${e.lastName}`.toLocaleLowerCase("tr") === data.managerName.toLocaleLowerCase("tr")));
        const managerMissing = Boolean((data.managerEmployeeNo || data.managerName) && !manager);
        if (!department) issues.push({ level: "warning", code: "new_department", message: `${data.department || "Departman"} hedef şirkette bulunamadı` });
        else if (!position) issues.push({ level: "warning", code: "new_position", message: `${data.position || "Pozisyon"} departmanda bulunamadı` });
        if (duplicate) issues.push({ level: "warning", code: "duplicate", message: "Personel T.C., sicil no veya e-posta ile mevcut kayda eşleşti" });
        if (managerMissing) issues.push({ level: "warning", code: "manager_missing", message: "Yönetici bulunamadı" });
        if (data.employeeNo && seenEmployeeNos.has(data.employeeNo)) issues.push({ level: "warning", code: "duplicate_excel_employee_no", message: "Aynı sicil numarası Excel içinde birden fazla satırda bulunuyor" });
        if (data.nationalId && seenNationalIds.has(data.nationalId)) issues.push({ level: "warning", code: "duplicate_excel_national_id", message: "Aynı T.C. Kimlik No Excel içinde birden fazla satırda bulunuyor" });
        if (data.email && seenEmails.has(data.email)) issues.push({ level: "warning", code: "duplicate_excel_email", message: "Aynı e-posta Excel içinde birden fazla satırda bulunuyor" });
        seenEmployeeNos.add(data.employeeNo);
        if (data.nationalId) seenNationalIds.add(data.nationalId);
        if (data.email) seenEmails.add(data.email);
        const previewValues: Record<string, unknown> = { ...data, department: department?.name || data.department, position: position?.title || data.position };
        const changes = duplicate
          ? Object.entries(changeLabels)
              .filter(([field]) => supplied.has(field))
              .map(([field, label]) => ({ field, label, current: duplicate[field as keyof typeof duplicate] ?? "", next: previewValues[field] ?? "" }))
              .filter((change) => String(change.current) !== String(change.next))
          : [];
        return {
          index: index + 1, data, issues,
          status: rowStatus(issues, Boolean(duplicate), !department, Boolean(department && !position), managerMissing),
          existingEmployeeId: duplicate?.id || null, providedFields: [...supplied], changes,
          departmentId: department?.id || null, positionId: position?.id || null,
        };
      });
      return Response.json({
        rows: reviewed,
        summary: {
          total: reviewed.length,
          valid: reviewed.filter((r) => !r.issues.some((i) => i.level === "error")).length,
          errors: reviewed.filter((r) => r.issues.some((i) => i.level === "error")).length,
          incomplete: reviewed.filter((r) => r.issues.some((i) => i.level === "warning")).length,
          existing: reviewed.filter((r) => r.existingEmployeeId).length,
          newDepartments: new Set(reviewed.filter((r) => !r.departmentId).map((r) => r.data.department).filter(Boolean)).size,
          newPositions: new Set(reviewed.filter((r) => r.departmentId && !r.positionId).map((r) => `${r.data.department}::${r.data.position}`)).size,
        },
        departments: departmentRows,
        positions: positionRows,
      });
    }
    if (action !== "commit") return Response.json({ error: "Geçersiz aktarım işlemi" }, { status: 400 });

    const settings = payload.settings && typeof payload.settings === "object" && !Array.isArray(payload.settings) ? (payload.settings as Raw) : {},
      duplicatePolicy = text(settings.duplicatePolicy) || "skip",
      createDepartments = Boolean(settings.createDepartments),
      createPositions = Boolean(settings.createPositions),
      departmentMappings = (settings.departmentMappings && typeof settings.departmentMappings === "object" ? settings.departmentMappings : {}) as Record<string, number>,
      positionMappings = (settings.positionMappings && typeof settings.positionMappings === "object" ? settings.positionMappings : {}) as Record<string, number>,
      skipRows = new Set(Array.isArray(settings.skipRows) ? settings.skipRows.map(Number) : []),
      db = getDb(), now = new Date().toISOString(),
      departmentMap = new Map(departmentRows.map((d) => [tr(d.name), d])),
      positionMap = new Map(positionRows.map((p) => [`${p.departmentId}::${tr(p.title)}`, p])),
      result = {
        total: rows.length, imported: 0, updated: 0, skipped: 0, errors: 0, newDepartments: 0, newPositions: 0,
        unmatchedManagers: 0, incomplete: 0, verifiedCards: 0, errorRows: [] as Raw[],
      },
      createdEmployees = new Map<string, { id: number; name: string; email: string }>();
    const processedEmployeeIds = new Set<number>(), committedNos = new Set<string>(), committedNationalIds = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      if (skipRows.has(i + 1)) { result.skipped++; continue; }
      const rawData = ((rows[i] as Raw).data as Raw) || rows[i],
        { data, issues: normalizeIssues } = normalize(rawData),
        supplied = new Set(Array.isArray((rows[i] as Raw).providedFields) ? ((rows[i] as Raw).providedFields as unknown[]).map(text) : [...providedFields(rawData)]),
        issues = [...normalizeIssues, ...validate(data)];
      if (!data.employeeNo) data.employeeNo = await nextNumber(companyId, "employee");
      else await registerExistingNumber(companyId, "employee", data.employeeNo);
      if (committedNos.has(data.employeeNo)) issues.push({ level: "warning", code: "duplicate_excel_employee_no", message: "Aynı sicil numarası Excel içinde birden fazla satırda bulunuyor" });
      if (data.nationalId && committedNationalIds.has(data.nationalId)) issues.push({ level: "warning", code: "duplicate_excel_national_id", message: "Aynı T.C. Kimlik No Excel içinde birden fazla satırda bulunuyor" });
      committedNos.add(data.employeeNo);
      if (data.nationalId) committedNationalIds.add(data.nationalId);
      if (issues.some((x) => x.level === "error")) {
        result.errors++;
        result.errorRows.push({ ...rows[i], "Aktarım Hatası": issues.map((x) => x.message).join("; ") });
        continue;
      }
      if (issues.some((x) => x.level === "warning")) result.incomplete++;

      let department = departmentMap.get(tr(data.department));
      const mappedDepartmentId = departmentMappings[data.department];
      if (!department && mappedDepartmentId > 0) department = departmentRows.find((d) => d.id === Number(mappedDepartmentId));
      if (!department && data.department && (createDepartments || mappedDepartmentId === -1)) {
        const { data: newDept, error } = await db
          .from("departments")
          .insert({ company_id: companyId, name: data.department, code: await nextNumber(companyId, "department"), status: "Aktif", created_at: now, updated_at: now })
          .select()
          .single();
        if (error) throw new Error(error.message);
        department = camelizeKeys(newDept);
        departmentRows.push(department);
        departmentMap.set(tr(data.department), department);
        result.newDepartments++;
      }

      let position = department ? positionMap.get(`${department.id}::${tr(data.position)}`) : undefined;
      const mappedPositionId = positionMappings[`${data.department}::${data.position}`];
      if (!position && mappedPositionId > 0) position = positionRows.find((p) => p.id === Number(mappedPositionId));
      if (!position && department && data.position && (createPositions || mappedPositionId === -1)) {
        const { data: newPos, error } = await db
          .from("positions")
          .insert({ company_id: companyId, department_id: department.id, title: data.position, code: await nextNumber(companyId, "position"), level: "Uzman", status: "Aktif", created_at: now, updated_at: now })
          .select()
          .single();
        if (error) throw new Error(error.message);
        position = camelizeKeys(newPos);
        positionRows.push(position);
        positionMap.set(`${department.id}::${tr(data.position)}`, position);
        result.newPositions++;
      }

      const existing = findExistingEmployee(employeeRows, data),
        selectedSalaryBasis = data.salaryBasis || (data.netSalary != null && !data.salary ? "Net" : "Brüt"),
        grossSalary = data.salary ?? (selectedSalaryBasis === "Brüt" ? data.salaryValue : null),
        netSalary = data.netSalary ?? (selectedSalaryBasis === "Net" ? data.salaryValue : null),
        values: Record<string, unknown> = {
          employee_no: data.employeeNo, first_name: data.firstName, last_name: data.lastName,
          national_id: data.nationalId || `IMPORT-${companyId}-${data.employeeNo}`, company_id: companyId,
          department_id: department?.id || null, department: department?.name || "",
          position_id: position?.id || null, position: position?.title || "",
          manager: data.managerName || null, start_date: data.startDate, end_date: data.endDate || null,
          status: data.status, work_type: data.workType, employee_type: data.employeeType,
          payroll_type: data.employeeType === "Emekli" ? "Emekli Personel" : "Normal Personel",
          email: data.email || null, phone: data.phone || null, iban: data.iban || null,
          birth_date: data.birthDate || null, birth_place: data.birthPlace || null, gender: data.gender || null,
          address: data.address || null, emergency_contact: data.emergencyContact || null, emergency_phone: data.emergencyPhone || null,
          sgk_no: data.sgkNo || null, occupation_code: data.occupationCode || null, nationality: data.nationality || null,
          // parseTrMoney zaten kuruşa (2 ondalık) yuvarlıyor — burada AYRICA
          // tam sayıya yuvarlama yapılmaz (item 5: gereksiz hassasiyet kaybı).
          work_permit_end: data.workPermitEnd || null, salary: grossSalary,
          net_salary: netSalary, salary_basis: selectedSalaryBasis,
          salary_period: "Aylık", updated_at: now,
        };

      if (existing) {
        if (duplicatePolicy === "update") {
          const fieldMap: Record<string, string> = {
            employeeNo: "employee_no", firstName: "first_name", lastName: "last_name", nationalId: "national_id",
            department: "department", position: "position", managerName: "manager", startDate: "start_date",
            endDate: "end_date", status: "status", workType: "work_type", employeeType: "employee_type",
            email: "email", phone: "phone", iban: "iban", birthDate: "birth_date", birthPlace: "birth_place",
            gender: "gender", address: "address", emergencyContact: "emergency_contact", emergencyPhone: "emergency_phone",
            sgkNo: "sgk_no", occupationCode: "occupation_code", foreignInfo: "nationality", workPermitEnd: "work_permit_end",
            salary: "salary", netSalary: "net_salary", salaryBasis: "salary_basis",
            salaryValue: selectedSalaryBasis === "Net" ? "net_salary" : "salary",
          };
          const updateValues: Record<string, unknown> = { updated_at: now };
          for (const field of supplied) {
            const target = fieldMap[field];
            if (target && values[target] !== null && values[target] !== "") updateValues[target] = values[target];
          }
          if (supplied.has("department") || supplied.has("position")) {
            updateValues.department_id = department?.id || null;
            updateValues.department = department?.name || "";
            updateValues.position_id = position?.id || null;
            updateValues.position = position?.title || "";
          }
          const { data: updatedRaw, error: updateError } = await db
            .from("employees")
            .update(updateValues)
            .eq("id", existing.id)
            .eq("company_id", companyId)
            .select()
            .single();
          if (updateError) {
            result.errors++;
            result.errorRows.push({ ...rows[i], "Aktarım Hatası": "Mevcut sicil güncellenemedi; T.C. Kimlik No veya sicil numarası başka kayıtla çakışıyor olabilir" });
            continue;
          }
          const updated = camelizeKeys(updatedRaw);
          // Kimlik/çalışma izni ve ücret/IBAN alanları listEmployeesForAccess'in
          // gerçek kaynağı olan employee_identity_legal/employee_compensation_
          // private'a da yazılır — aksi halde Excel'den güncellenen bu alanlar
          // Sicil Kartı'nda eski/boş görünür (bkz. P8 bulgusu, app/api/
          // employees/route.ts'nin PUT'u ile AYNI çağrı). `updated` (bu satırın
          // DEĞİL, employees tablosundaki GÜNCEL TAM satırın) kullanılması
          // kasıtlı: bu Excel satırında "supplied" olmayan alanlar updateValues'a
          // hiç girmediği için employees'te değişmeden kalır ve `updated` da
          // onları eski/doğru değeriyle döner — böylece gated tabloya boş/null
          // yazıp mevcut veriyi silme riski oluşmaz.
          try {
            await upsertGatedEmployeeFields(db, companyId, updated.id, updated);
          } catch (gatedError) {
            // Kısmi kayıt riski: employees satırı zaten güncellendi ama kimlik/
            // ücret verisi güvenli tabloya yazılamadı. Kod tabanında çoklu
            // tablo transaction'ı yok (aynı desen app/api/employees/route.ts'te
            // de yok); en dar telafi employees satırını BU İSTEĞİN değiştirdiği
            // kolonlarda güncelleme öncesi değerlere geri almaktır (best-effort).
            // Geri alma da başarısız olursa satır yine HATA olarak raporlanır —
            // hiçbir durumda başarılı aktarılmış gibi sayılmaz.
            const revertValues: Record<string, unknown> = {};
            const existingSnake = snakeizeKeys(existing as Record<string, unknown>);
            for (const key of Object.keys(updateValues)) revertValues[key] = existingSnake[key] ?? null;
            const { error: revertError } = await db
              .from("employees")
              .update(revertValues)
              .eq("id", existing.id)
              .eq("company_id", companyId);
            result.errors++;
            result.errorRows.push({
              ...rows[i],
              "Aktarım Hatası": revertError
                ? `Kimlik/ücret bilgileri güvenli tabloya yazılamadı VE sicil kartı eski haline döndürülemedi; manuel kontrol gerekir: ${(gatedError as Error).message}`
                : `Kimlik/ücret bilgileri güvenli tabloya yazılamadı; sicil kartı değişiklik öncesi haline döndürüldü: ${(gatedError as Error).message}`,
            });
            continue;
          }
          await writeAudit(access, "UPDATE", "employee", updated.id, existing, updatedRaw);
          await db
            .from("employee_cost_histories")
            .upsert(
              {
                company_id: companyId, employee_id: updated.id, effective_from: updated.startDate, department_id: updated.departmentId,
                department_snapshot: updated.department, position_snapshot: updated.position, work_type: updated.workType,
                salary_basis: updated.salaryBasis, gross_salary: updated.salary, net_salary: updated.netSalary,
                created_by: access.email, created_at: now,
              },
              { onConflict: "employee_id,effective_from", ignoreDuplicates: true },
            );
          result.updated++;
          processedEmployeeIds.add(updated.id);
          createdEmployees.set(data.employeeNo, { id: updated.id, name: `${updated.firstName} ${updated.lastName}`, email: updated.email || "" });
        } else {
          result.skipped++;
          processedEmployeeIds.add(existing.id);
          createdEmployees.set(data.employeeNo, { id: existing.id, name: `${existing.firstName} ${existing.lastName}`, email: existing.email || "" });
        }
        continue;
      }

      const { data: createdRaw, error: createError } = await db.from("employees").insert({ ...values, created_at: now }).select().single();
      if (createError) {
        result.errors++;
        result.errorRows.push({ ...rows[i], "Aktarım Hatası": "Personel Sicil Kartı oluşturulamadı" });
        continue;
      }
      const created = camelizeKeys(createdRaw);
      // Aynı upsertGatedEmployeeFields çağrısı (bkz. yukarıdaki UPDATE dalı ve
      // app/api/employees/route.ts POST'u) — yeni oluşturulan sicilin kimlik/
      // ücret alanları da gated tablolara yazılmadan Sicil Kartı'nda görünmez.
      try {
        await upsertGatedEmployeeFields(db, companyId, created.id, created);
      } catch (gatedError) {
        // Kısmi kayıt riski: employees satırı zaten oluşturuldu ama kimlik/
        // ücret verisi güvenli tabloya yazılamadı. En dar telafi: az önce
        // oluşturulan employees satırını best-effort SİL — gated verisi eksik,
        // "yarı kayıtlı" bir sicil kartı bırakılmaz. Silme de başarısız olursa
        // satır yine HATA olarak raporlanır, hiçbir durumda başarılı sayılmaz.
        const { error: deleteError } = await db
          .from("employees")
          .delete()
          .eq("id", created.id)
          .eq("company_id", companyId);
        result.errors++;
        result.errorRows.push({
          ...rows[i],
          "Aktarım Hatası": deleteError
            ? `Kimlik/ücret bilgileri güvenli tabloya yazılamadı VE geri alınamadı; manuel kontrol gerekir (sicil no: ${data.employeeNo}): ${(gatedError as Error).message}`
            : `Kimlik/ücret bilgileri güvenli tabloya yazılamadı; personel kaydı oluşturulmadı: ${(gatedError as Error).message}`,
        });
        continue;
      }
      employeeRows.push(created);
      processedEmployeeIds.add(created.id);
      createdEmployees.set(data.employeeNo, { id: created.id, name: `${created.firstName} ${created.lastName}`, email: created.email || "" });
      await writeAudit(access, "CREATE", "employee", created.id, null, createdRaw);
      await db
        .from("employee_cost_histories")
        .upsert(
          {
            company_id: companyId, employee_id: created.id, effective_from: created.startDate, department_id: created.departmentId,
            department_snapshot: created.department, position_snapshot: created.position, work_type: created.workType,
            salary_basis: created.salaryBasis, gross_salary: created.salary, net_salary: created.netSalary,
            created_by: access.email, created_at: now,
          },
          { onConflict: "employee_id,effective_from", ignoreDuplicates: true },
        );
      result.imported++;
    }

    const { data: allEmployeesRaw } = await db.from("employees").select("*").eq("company_id", companyId);
    const allEmployees = camelizeKeys(allEmployeesRaw ?? []);
    for (const raw of rows) {
      const { data } = normalize(((raw as Raw).data as Raw) || raw);
      if (!data.managerEmployeeNo && !data.managerName) continue;
      const employee = allEmployees.find((e) => e.employeeNo === data.employeeNo);
      if (!employee) continue;
      const manager = data.managerEmployeeNo
        ? allEmployees.find((e) => e.employeeNo === data.managerEmployeeNo)
        : allEmployees.find((e) => `${e.firstName} ${e.lastName}`.toLocaleLowerCase("tr") === data.managerName.toLocaleLowerCase("tr") || (data.managerName && e.email?.toLowerCase() === data.managerName.toLowerCase()));
      if (manager) await db.from("employees").update({ manager: `${manager.firstName} ${manager.lastName}`, updated_at: now }).eq("id", employee.id).eq("company_id", companyId);
      else result.unmatchedManagers++;
    }

    const { data: verifiedEmployeesRaw } = await db.from("employees").select("id").eq("company_id", companyId);
    result.verifiedCards = (verifiedEmployeesRaw ?? []).filter((employee) => processedEmployeeIds.has(employee.id)).length;
    const complete = result.errors === 0 && result.verifiedCards === processedEmployeeIds.size;
    await writeAudit(access, "IMPORT", "employee_batch", companyId, null, { ...result, errorRows: undefined });
    if (result.verifiedCards === 0) return Response.json({ error: "Personel Sicil Kartları oluşturulamadı. Aktarım tamamlanmadı.", result }, { status: 422 });
    return Response.json({ ok: complete, result: { ...result, complete } });
  } catch (error) {
    return accessError(error);
  }
}
