CREATE TABLE `personnel_budget_scenarios` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` text NOT NULL,
  `year` integer NOT NULL,
  `name` text NOT NULL,
  `salary_increase_rate` integer DEFAULT 0 NOT NULL,
  `increase_month` integer DEFAULT 1 NOT NULL,
  `benefit_increase_rate` integer DEFAULT 0 NOT NULL,
  `scope_type` text DEFAULT 'Şirket' NOT NULL,
  `scope_value` text,
  `include_planned_heads` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'Aktif' NOT NULL,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `planned_headcounts` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` text NOT NULL,
  `year` integer NOT NULL,
  `department_id` integer,
  `position` text NOT NULL,
  `planned_start_date` text NOT NULL,
  `planned_net_salary` integer DEFAULT 0 NOT NULL,
  `planned_monthly_cost` integer DEFAULT 0 NOT NULL,
  `headcount` integer DEFAULT 1 NOT NULL,
  `status` text DEFAULT 'Planlandı' NOT NULL,
  `note` text,
  `created_by` text NOT NULL,
  `created_at` text NOT NULL,
  `updated_at` text NOT NULL
);
