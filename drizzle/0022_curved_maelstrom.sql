CREATE TABLE `employee_benefits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` integer NOT NULL,
	`category` text NOT NULL,
	`name` text NOT NULL,
	`amount` integer NOT NULL,
	`frequency` text DEFAULT 'Aylık' NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `employee_cost_histories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` integer NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`department_id` integer,
	`department_snapshot` text NOT NULL,
	`position_snapshot` text NOT NULL,
	`work_type` text NOT NULL,
	`salary_basis` text NOT NULL,
	`gross_salary` integer,
	`net_salary` integer,
	`sgk_incentive_rate` integer DEFAULT 0 NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employee_cost_history_period_unique` ON `employee_cost_histories` (`employee_id`,`effective_from`);--> statement-breakpoint
CREATE TABLE `payroll_legal_parameters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`year` integer NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`minimum_wage` integer DEFAULT 0 NOT NULL,
	`sgk_floor` integer DEFAULT 0 NOT NULL,
	`sgk_ceiling` integer DEFAULT 0 NOT NULL,
	`employee_sgk_rate` integer DEFAULT 1400 NOT NULL,
	`employer_sgk_rate` integer DEFAULT 2075 NOT NULL,
	`employee_unemployment_rate` integer DEFAULT 100 NOT NULL,
	`employer_unemployment_rate` integer DEFAULT 200 NOT NULL,
	`employer_incentive_rate` integer DEFAULT 500 NOT NULL,
	`stamp_tax_rate` integer DEFAULT 759 NOT NULL,
	`income_tax_brackets` text DEFAULT '[{"limit":158000,"rate":15},{"limit":330000,"rate":20},{"limit":1200000,"rate":27},{"limit":4300000,"rate":35},{"limit":null,"rate":40}]' NOT NULL,
	`minimum_wage_income_tax_exemption` integer DEFAULT 0 NOT NULL,
	`minimum_wage_stamp_tax_exemption` integer DEFAULT 0 NOT NULL,
	`updated_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `legal_parameter_company_period_unique` ON `payroll_legal_parameters` (`company_id`,`year`,`effective_from`);--> statement-breakpoint
CREATE TABLE `personnel_cost_budgets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`year` integer NOT NULL,
	`month` integer,
	`department_id` integer,
	`position` text,
	`amount` integer NOT NULL,
	`note` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `employees` ADD `end_date` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `cumulative_tax_base` integer DEFAULT 0 NOT NULL;