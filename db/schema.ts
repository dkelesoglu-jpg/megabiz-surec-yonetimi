import {
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
export const companies = sqliteTable("companies", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  sector: text("sector"),
  employeeCount: integer("employee_count").default(0),
  packageName: text("package_name").notNull().default("Professional"),
  status: text("status").notNull().default("Aktif"),
  createdAt: text("created_at").notNull(),
});
export const companyModules = sqliteTable(
  "company_modules",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    module: text("module").notNull(),
    enabled: integer("enabled", { mode: "boolean" }).notNull().default(true),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [uniqueIndex("company_module_unique").on(t.companyId, t.module)],
);
export const numberSeries = sqliteTable(
  "number_series",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    seriesType: text("series_type").notNull(),
    prefix: text("prefix").notNull(),
    startNumber: integer("start_number").notNull().default(1),
    lastUsed: integer("last_used").notNull().default(0),
    digits: integer("digits").notNull().default(3),
    updatedBy: text("updated_by"),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [uniqueIndex("number_series_company_type_unique").on(t.companyId, t.seriesType)],
);
export const numberSeriesHistory = sqliteTable(
  "number_series_history",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    seriesType: text("series_type").notNull(),
    number: integer("number").notNull(),
    formattedValue: text("formatted_value").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("number_series_history_value_unique").on(
      t.companyId,
      t.seriesType,
      t.formattedValue,
    ),
  ],
);
export const departments = sqliteTable(
  "departments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    name: text("name").notNull(),
    code: text("code").notNull(),
    parentDepartmentId: integer("parent_department_id"),
    managerName: text("manager_name"),
    status: text("status").notNull().default("Aktif"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("department_company_name_unique").on(t.companyId, t.name),
    uniqueIndex("department_company_code_unique").on(t.companyId, t.code),
  ],
);
export const positions = sqliteTable(
  "positions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    departmentId: integer("department_id").notNull(),
    title: text("title").notNull(),
    code: text("code").notNull(),
    reportsToId: integer("reports_to_id"),
    level: text("level").notNull().default("Uzman"),
    status: text("status").notNull().default("Aktif"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [uniqueIndex("position_company_code_unique").on(t.companyId, t.code)],
);
export const assets = sqliteTable(
  "assets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    assetCode: text("asset_code").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    brand: text("brand"),
    model: text("model"),
    serialNo: text("serial_no"),
    purchaseDate: text("purchase_date"),
    purchaseCost: integer("purchase_cost"),
    monthlyCost: integer("monthly_cost").notNull().default(0),
    includeInEmployerCost: integer("include_in_employer_cost", {
      mode: "boolean",
    })
      .notNull()
      .default(false),
    ownershipType: text("ownership_type").notNull().default("Şirket"),
    assignedEmployeeId: integer("assigned_employee_id"),
    assignedAt: text("assigned_at"),
    expectedReturnDate: text("expected_return_date"),
    returnedAt: text("returned_at"),
    condition: text("condition").notNull().default("İyi"),
    status: text("status").notNull().default("Stokta"),
    notes: text("notes"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("asset_company_code_unique").on(t.companyId, t.assetCode),
  ],
);
export const performanceReviews = sqliteTable(
  "performance_reviews",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    reviewNo: text("review_no"),
    employeeId: integer("employee_id").notNull(),
    period: text("period").notNull(),
    evaluator: text("evaluator").notNull(),
    competencyScore: integer("competency_score").notNull().default(0),
    kpiScore: integer("kpi_score").notNull().default(0),
    goalScore: integer("goal_score").notNull().default(0),
    overallScore: integer("overall_score").notNull().default(0),
    result: text("result").notNull(),
    outcome: text("outcome").notNull().default("Gelişim Planı"),
    managerNote: text("manager_note"),
    status: text("status").notNull().default("Taslak"),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("review_company_employee_period_unique").on(
      t.companyId,
      t.employeeId,
      t.period,
    ),
  ],
);
export const performanceCycles = sqliteTable(
  "performance_cycles",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    name: text("name").notNull(),
    cycleType: text("cycle_type").notNull().default("Yıllık"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date").notNull(),
    reviewStartDate: text("review_start_date").notNull(),
    reviewEndDate: text("review_end_date").notNull(),
    departments: text("departments").notNull().default("[]"),
    minTenureMonths: integer("min_tenure_months").notNull().default(3),
    goalWeight: integer("goal_weight").notNull().default(40),
    kpiWeight: integer("kpi_weight").notNull().default(30),
    competencyWeight: integer("competency_weight").notNull().default(20),
    managerWeight: integer("manager_weight").notNull().default(10),
    selfWeight: integer("self_weight").notNull().default(0),
    feedback360Weight: integer("feedback_360_weight").notNull().default(0),
    reminderDays: text("reminder_days").notNull().default("10,5,3,0"),
    status: text("status").notNull().default("Aktif"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("performance_cycle_company_name_unique").on(
      t.companyId,
      t.name,
    ),
  ],
);
export const performanceSettings = sqliteTable("performance_settings", {
  companyId: text("company_id").primaryKey(),
  goalWeight: integer("goal_weight").notNull().default(40),
  kpiWeight: integer("kpi_weight").notNull().default(30),
  competencyWeight: integer("competency_weight").notNull().default(20),
  managerWeight: integer("manager_weight").notNull().default(10),
  selfWeight: integer("self_weight").notNull().default(0),
  feedback360Weight: integer("feedback_360_weight").notNull().default(0),
  reminderDays: text("reminder_days").notNull().default("30,15,7,0"),
  goalScoreCap: integer("goal_score_cap").notNull().default(120),
  goalApprovalEnabled: integer("goal_approval_enabled", { mode: "boolean" })
    .notNull()
    .default(false),
  performanceScale: text("performance_scale")
    .notNull()
    .default(
      '[{"min":90,"code":"A","label":"Üstün Performans"},{"min":80,"code":"B","label":"Beklentinin Üzerinde"},{"min":70,"code":"C","label":"Beklentiyi Karşılıyor"},{"min":60,"code":"D","label":"Gelişim Gerekli"},{"min":0,"code":"E","label":"Yetersiz Performans"}]',
    ),
  updatedBy: text("updated_by").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const performanceAssignments = sqliteTable(
  "performance_assignments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    cycleId: integer("cycle_id").notNull(),
    employeeId: integer("employee_id").notNull(),
    employeeName: text("employee_name").notNull(),
    departmentSnapshot: text("department_snapshot").notNull(),
    positionSnapshot: text("position_snapshot").notNull(),
    managerSnapshot: text("manager_snapshot"),
    goalScore: integer("goal_score").notNull().default(0),
    kpiScore: integer("kpi_score").notNull().default(0),
    competencyScore: integer("competency_score").notNull().default(0),
    managerScore: integer("manager_score").notNull().default(0),
    selfScore: integer("self_score").notNull().default(0),
    feedback360Score: integer("feedback_360_score").notNull().default(0),
    overallScore: integer("overall_score").notNull().default(0),
    potentialScore: integer("potential_score").notNull().default(50),
    calibratedScore: integer("calibrated_score"),
    performanceClass: text("performance_class").notNull().default("E"),
    status: text("status").notNull().default("Başlamadı"),
    locked: integer("locked", { mode: "boolean" }).notNull().default(false),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("performance_assignment_cycle_employee_unique").on(
      t.cycleId,
      t.employeeId,
    ),
  ],
);
export const performanceMetrics = sqliteTable("performance_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  cycleId: integer("cycle_id"),
  assignmentId: integer("assignment_id"),
  metricType: text("metric_type").notNull(),
  goalType: text("goal_type").notNull().default("Bireysel Hedef"),
  sourceType: text("source_type").notNull().default("Bireysel"),
  name: text("name").notNull(),
  code: text("code"),
  description: text("description"),
  department: text("department"),
  position: text("position"),
  unit: text("unit").notNull().default("%"),
  direction: text("direction").notNull().default("Yüksek değer iyi"),
  startValue: integer("start_value").notNull().default(0),
  targetValue: integer("target_value").notNull().default(100),
  actualValue: integer("actual_value").notNull().default(0),
  minimumValue: integer("minimum_value"),
  maximumValue: integer("maximum_value"),
  weight: integer("weight").notNull().default(0),
  rawProgress: integer("raw_progress").notNull().default(0),
  weightedContribution: integer("weighted_contribution").notNull().default(0),
  riskLevel: text("risk_level").notNull().default("Normal"),
  checkpointData: text("checkpoint_data").notNull().default("[]"),
  parentMetricId: integer("parent_metric_id"),
  carriedFromMetricId: integer("carried_from_metric_id"),
  priority: text("priority").notNull().default("Orta"),
  dataSource: text("data_source").notNull().default("Manuel"),
  frequency: text("frequency"),
  approver: text("approver"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  score: integer("score").notNull().default(0),
  status: text("status").notNull().default("Taslak"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const performanceCompetencies = sqliteTable("performance_competencies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  assignmentId: integer("assignment_id"),
  name: text("name").notNull(),
  category: text("category").notNull().default("Temel Yetkinlik"),
  position: text("position"),
  description: text("description"),
  weight: integer("weight").notNull().default(0),
  selfScore: integer("self_score").notNull().default(0),
  managerScore: integer("manager_score").notNull().default(0),
  finalScore: integer("final_score").notNull().default(0),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const performanceFeedback = sqliteTable("performance_feedback", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  assignmentId: integer("assignment_id").notNull(),
  reviewerEmail: text("reviewer_email").notNull(),
  reviewerType: text("reviewer_type").notNull(),
  score: integer("score").notNull().default(0),
  strengths: text("strengths"),
  developmentAreas: text("development_areas"),
  comment: text("comment"),
  anonymous: integer("anonymous", { mode: "boolean" }).notNull().default(false),
  status: text("status").notNull().default("Taslak"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const performanceActions = sqliteTable("performance_actions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  assignmentId: integer("assignment_id").notNull(),
  actionType: text("action_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  owner: text("owner"),
  startDate: text("start_date"),
  targetDate: text("target_date"),
  checkDates: text("check_dates"),
  employeeComment: text("employee_comment"),
  managerComment: text("manager_comment"),
  oldScore: integer("old_score"),
  newScore: integer("new_score"),
  reason: text("reason"),
  acknowledged: integer("acknowledged", { mode: "boolean" })
    .notNull()
    .default(false),
  status: text("status").notNull().default("Taslak"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const appUsers = sqliteTable("app_users", {
  email: text("email").primaryKey(),
  fullName: text("full_name"),
  platformRole: text("platform_role").notNull().default("user"),
  status: text("status").notNull().default("Aktif"),
  createdAt: text("created_at").notNull(),
});
export const companyMemberships = sqliteTable(
  "company_memberships",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    userEmail: text("user_email").notNull(),
    role: text("role").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("membership_company_user_unique").on(t.companyId, t.userEmail),
  ],
);
export const roleModulePermissions = sqliteTable(
  "role_module_permissions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    role: text("role").notNull(),
    module: text("module").notNull(),
    canView: integer("can_view", { mode: "boolean" }).notNull().default(true),
    canEdit: integer("can_edit", { mode: "boolean" }).notNull().default(false),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("permission_company_role_module_unique").on(
      t.companyId,
      t.role,
      t.module,
    ),
  ],
);
export const auditLogs = sqliteTable("audit_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  userEmail: text("user_email").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: text("created_at").notNull(),
});
export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  name: text("name").notNull(),
  storageKey: text("storage_key").notNull().unique(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  category: text("category").notNull(),
  relatedType: text("related_type"),
  relatedId: text("related_id"),
  version: text("version").notNull().default("1.0"),
  documentDate: text("document_date"),
  expiryDate: text("expiry_date"),
  uploadedBy: text("uploaded_by").notNull(),
  createdAt: text("created_at").notNull(),
});
export const employees = sqliteTable(
  "employees",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull().default("mega-global-energy"),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    nationalId: text("national_id").notNull(),
    employeeNo: text("employee_no").notNull(),
    birthDate: text("birth_date"),
    birthPlace: text("birth_place"),
    gender: text("gender"),
    bloodType: text("blood_type"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    emergencyContact: text("emergency_contact"),
    emergencyPhone: text("emergency_phone"),
    departmentId: integer("department_id"),
    department: text("department").notNull(),
    positionId: integer("position_id"),
    position: text("position").notNull(),
    manager: text("manager"),
    secondManager: text("second_manager"),
    actingManager: text("acting_manager"),
    delegationStart: text("delegation_start"),
    delegationEnd: text("delegation_end"),
    startDate: text("start_date").notNull(),
    endDate: text("end_date"),
    workType: text("work_type").notNull().default("Tam Zamanlı"),
    employeeType: text("employee_type").notNull().default("Normal"),
    payrollType: text("payroll_type").notNull().default("Normal Personel"),
    status: text("status").notNull().default("Aktif"),
    sgkNo: text("sgk_no"),
    occupationCode: text("occupation_code"),
    iban: text("iban"),
    salary: integer("salary"),
    netSalary: integer("net_salary"),
    salaryBasis: text("salary_basis").notNull().default("Brüt"),
    salaryPeriod: text("salary_period").notNull().default("Aylık"),
    weeklyHours: integer("weekly_hours"),
    cumulativeTaxBase: integer("cumulative_tax_base").notNull().default(0),
    nationality: text("nationality"),
    passportNo: text("passport_no"),
    workPermitNo: text("work_permit_no"),
    workPermitStart: text("work_permit_start"),
    workPermitEnd: text("work_permit_end"),
    workPermitStatus: text("work_permit_status").default("Aktif"),
    workPermitRenewalStatus: text("work_permit_renewal_status").default(
      "Takipte",
    ),
    workPermitReminderDays: integer("work_permit_reminder_days").default(60),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("employee_company_national_id_unique").on(
      t.companyId,
      t.nationalId,
    ),
    uniqueIndex("employee_company_no_unique").on(t.companyId, t.employeeNo),
  ],
);
export const moduleRecords = sqliteTable("module_records", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  module: text("module").notNull(),
  companyId: text("company_id").notNull().default("mega-global-energy"),
  title: text("title").notNull(),
  owner: text("owner"),
  department: text("department"),
  dueDate: text("due_date"),
  status: text("status").notNull().default("Aktif"),
  progress: integer("progress").default(0),
  description: text("description"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
  period: text("period"),
  evaluator: text("evaluator"),
  metric: text("metric"),
  targetValue: integer("target_value"),
  actualValue: integer("actual_value"),
  weight: integer("weight"),
  score: integer("score"),
});
export const advancePolicies = sqliteTable("advance_policies", {
  companyId: text("company_id").primaryKey(),
  salaryMultiplier: integer("salary_multiplier").notNull().default(150),
  maxInstallments: integer("max_installments").notNull().default(12),
  maxDeductionRate: integer("max_deduction_rate").notNull().default(20),
  minTenureMonths: integer("min_tenure_months").notNull().default(3),
  approvalMatrix: text("approval_matrix")
    .notNull()
    .default(
      '[{"limit":20000,"steps":["Yönetici","İK"]},{"limit":50000,"steps":["Yönetici","İK","Mali İşler"]},{"limit":999999999,"steps":["Yönetici","İK","Mali İşler","Genel Müdür"]}]',
    ),
  types: text("types")
    .notNull()
    .default(
      '["Maaş Avansı","Personel Avansı","İş Avansı","Seyahat Avansı","Masraf Avansı","Personel Borcu","Şirket Tarafından Verilen Borç","Diğer"]',
    ),
  reminderDays: text("reminder_days").notNull().default("7,15,30"),
  updatedAt: text("updated_at").notNull(),
});
export const advanceRequests = sqliteTable("advance_requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  requestNo: text("request_no"),
  employeeId: integer("employee_id").notNull(),
  requestType: text("request_type").notNull(),
  requestDate: text("request_date").notNull(),
  requestedAmount: integer("requested_amount").notNull(),
  reason: text("reason").notNull(),
  description: text("description"),
  requestedInstallments: integer("requested_installments").notNull(),
  firstDeductionMonth: text("first_deduction_month").notNull(),
  urgent: integer("urgent", { mode: "boolean" }).notNull().default(false),
  eligibility: text("eligibility").notNull(),
  eligibilityDetails: text("eligibility_details"),
  status: text("status").notNull().default("Onay Bekliyor"),
  currentStep: integer("current_step").notNull().default(0),
  approvalSteps: text("approval_steps").notNull(),
  approvedAmount: integer("approved_amount").notNull().default(0),
  approvedInstallments: integer("approved_installments").notNull().default(0),
  paidAmount: integer("paid_amount").notNull().default(0),
  collectedAmount: integer("collected_amount").notNull().default(0),
  balance: integer("balance").notNull().default(0),
  exceptionReason: text("exception_reason"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const advanceInstallments = sqliteTable(
  "advance_installments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    requestId: integer("request_id").notNull(),
    sequence: integer("sequence").notNull(),
    dueMonth: text("due_month").notNull(),
    openingBalance: integer("opening_balance").notNull(),
    amount: integer("amount").notNull(),
    closingBalance: integer("closing_balance").notNull(),
    status: text("status").notNull().default("Planlandı"),
    payrollTransferred: integer("payroll_transferred", { mode: "boolean" })
      .notNull()
      .default(false),
    paidAt: text("paid_at"),
  },
  (t) => [
    uniqueIndex("advance_installment_request_sequence_unique").on(
      t.requestId,
      t.sequence,
    ),
  ],
);
export const advancePayments = sqliteTable("advance_payments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  requestId: integer("request_id").notNull(),
  paymentType: text("payment_type").notNull(),
  amount: integer("amount").notNull(),
  paymentDate: text("payment_date").notNull(),
  method: text("method"),
  bank: text("bank"),
  receiptNo: text("receipt_no"),
  note: text("note"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
});
export const advanceApprovalLogs = sqliteTable("advance_approval_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  requestId: integer("request_id").notNull(),
  step: text("step").notNull(),
  action: text("action").notNull(),
  userEmail: text("user_email").notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  note: text("note"),
  createdAt: text("created_at").notNull(),
});

export const payrollLegalParameters = sqliteTable(
  "payroll_legal_parameters",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    year: integer("year").notNull(),
    effectiveFrom: text("effective_from").notNull(),
    effectiveTo: text("effective_to"),
    minimumWage: integer("minimum_wage").notNull().default(33030),
    sgkFloor: integer("sgk_floor").notNull().default(33030),
    sgkCeiling: integer("sgk_ceiling").notNull().default(297270),
    employeeSgkRate: integer("employee_sgk_rate").notNull().default(1400),
    employerSgkRate: integer("employer_sgk_rate").notNull().default(2175),
    employeeUnemploymentRate: integer("employee_unemployment_rate")
      .notNull()
      .default(100),
    employerUnemploymentRate: integer("employer_unemployment_rate")
      .notNull()
      .default(200),
    employerIncentiveRate: integer("employer_incentive_rate")
      .notNull()
      .default(500),
    stampTaxRate: integer("stamp_tax_rate").notNull().default(75.9),
    employeeSgdpRate: integer("employee_sgdp_rate").notNull().default(750),
    employerSgdpRate: integer("employer_sgdp_rate").notNull().default(2475),
    incomeTaxBrackets: text("income_tax_brackets")
      .notNull()
      .default(
        '[{"limit":190000,"rate":15},{"limit":400000,"rate":20},{"limit":1500000,"rate":27},{"limit":5300000,"rate":35},{"limit":null,"rate":40}]',
      ),
    minimumWageIncomeTaxExemption: integer("minimum_wage_income_tax_exemption")
      .notNull()
      .default(0),
    minimumWageStampTaxExemption: integer("minimum_wage_stamp_tax_exemption")
      .notNull()
      .default(0),
    mealSgkDailyExemption: integer("meal_sgk_daily_exemption")
      .notNull()
      .default(0),
    mealTaxDailyExemption: integer("meal_tax_daily_exemption")
      .notNull()
      .default(0),
    travelSgkDailyExemption: integer("travel_sgk_daily_exemption")
      .notNull()
      .default(0),
    travelTaxDailyExemption: integer("travel_tax_daily_exemption")
      .notNull()
      .default(0),
    honorariumIncomeTaxExemption: integer("honorarium_income_tax_exemption")
      .notNull()
      .default(0),
    honorariumStampTaxExemption: integer("honorarium_stamp_tax_exemption")
      .notNull()
      .default(0),
    honorariumOtherDeductionRate: integer("honorarium_other_deduction_rate")
      .notNull()
      .default(0),
    updatedBy: text("updated_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("legal_parameter_company_period_unique").on(
      t.companyId,
      t.year,
      t.effectiveFrom,
    ),
  ],
);

export const employeeCostHistories = sqliteTable(
  "employee_cost_histories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    employeeId: integer("employee_id").notNull(),
    effectiveFrom: text("effective_from").notNull(),
    effectiveTo: text("effective_to"),
    departmentId: integer("department_id"),
    departmentSnapshot: text("department_snapshot").notNull(),
    positionSnapshot: text("position_snapshot").notNull(),
    workType: text("work_type").notNull(),
    salaryBasis: text("salary_basis").notNull(),
    grossSalary: integer("gross_salary"),
    netSalary: integer("net_salary"),
    sgkIncentiveRate: integer("sgk_incentive_rate").notNull().default(0),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (t) => [
    uniqueIndex("employee_cost_history_period_unique").on(
      t.employeeId,
      t.effectiveFrom,
    ),
  ],
);

export const employeeBenefits = sqliteTable("employee_benefits", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  employeeId: integer("employee_id").notNull(),
  definitionId: integer("definition_id"),
  category: text("category").notNull(),
  name: text("name").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull().default("TRY"),
  frequency: text("frequency").notNull().default("Aylık"),
  effectiveFrom: text("effective_from").notNull(),
  effectiveTo: text("effective_to"),
  subjectToSgk: integer("subject_to_sgk", { mode: "boolean" })
    .notNull()
    .default(false),
  subjectToIncomeTax: integer("subject_to_income_tax", { mode: "boolean" })
    .notNull()
    .default(false),
  subjectToStampTax: integer("subject_to_stamp_tax", { mode: "boolean" })
    .notNull()
    .default(false),
  exemptionLimit: integer("exemption_limit").notNull().default(0),
  includeInEmployerCost: integer("include_in_employer_cost", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  description: text("description"),
  detailData: text("detail_data"),
  source: text("source").notNull().default("Personel"),
  status: text("status").notNull().default("Aktif"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const benefitDefinitions = sqliteTable(
  "benefit_definitions",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    name: text("name").notNull(),
    category: text("category").notNull(),
    defaultAmount: integer("default_amount").notNull().default(0),
    currency: text("currency").notNull().default("TRY"),
    frequency: text("frequency").notNull().default("Aylık"),
    effectiveFrom: text("effective_from").notNull(),
    effectiveTo: text("effective_to"),
    subjectToSgk: integer("subject_to_sgk", { mode: "boolean" })
      .notNull()
      .default(false),
    subjectToIncomeTax: integer("subject_to_income_tax", { mode: "boolean" })
      .notNull()
      .default(false),
    subjectToStampTax: integer("subject_to_stamp_tax", { mode: "boolean" })
      .notNull()
      .default(false),
    exemptionLimit: integer("exemption_limit").notNull().default(0),
    status: text("status").notNull().default("Aktif"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("benefit_definition_company_name_unique").on(
      t.companyId,
      t.name,
    ),
  ],
);

export const benefitTemplates = sqliteTable(
  "benefit_templates",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    companyId: text("company_id").notNull(),
    definitionId: integer("definition_id").notNull(),
    scopeType: text("scope_type").notNull(),
    departmentId: integer("department_id"),
    department: text("department"),
    position: text("position"),
    amount: integer("amount"),
    status: text("status").notNull().default("Aktif"),
    createdBy: text("created_by").notNull(),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (t) => [
    uniqueIndex("benefit_template_scope_unique").on(
      t.companyId,
      t.definitionId,
      t.scopeType,
      t.departmentId,
      t.position,
    ),
  ],
);

export const personnelCostBudgets = sqliteTable("personnel_cost_budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month"),
  departmentId: integer("department_id"),
  position: text("position"),
  amount: integer("amount").notNull(),
  note: text("note"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const personnelBudgetScenarios = sqliteTable("personnel_budget_scenarios", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  year: integer("year").notNull(),
  name: text("name").notNull(),
  salaryIncreaseRate: integer("salary_increase_rate").notNull().default(0),
  increaseMonth: integer("increase_month").notNull().default(1),
  benefitIncreaseRate: integer("benefit_increase_rate").notNull().default(0),
  scopeType: text("scope_type").notNull().default("Şirket"),
  scopeValue: text("scope_value"),
  includePlannedHeads: integer("include_planned_heads", { mode: "boolean" }).notNull().default(true),
  status: text("status").notNull().default("Aktif"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
export const plannedHeadcounts = sqliteTable("planned_headcounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  companyId: text("company_id").notNull(),
  year: integer("year").notNull(),
  departmentId: integer("department_id"),
  position: text("position").notNull(),
  plannedStartDate: text("planned_start_date").notNull(),
  plannedNetSalary: integer("planned_net_salary").notNull().default(0),
  plannedMonthlyCost: integer("planned_monthly_cost").notNull().default(0),
  headcount: integer("headcount").notNull().default(1),
  status: text("status").notNull().default("Planlandı"),
  note: text("note"),
  createdBy: text("created_by").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});
