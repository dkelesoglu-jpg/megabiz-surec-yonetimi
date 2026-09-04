CREATE TABLE `benefit_definitions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`default_amount` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`frequency` text DEFAULT 'Aylık' NOT NULL,
	`effective_from` text NOT NULL,
	`effective_to` text,
	`subject_to_sgk` integer DEFAULT false NOT NULL,
	`subject_to_income_tax` integer DEFAULT false NOT NULL,
	`subject_to_stamp_tax` integer DEFAULT false NOT NULL,
	`exemption_limit` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `benefit_definition_company_name_unique` ON `benefit_definitions` (`company_id`,`name`);--> statement-breakpoint
CREATE TABLE `benefit_templates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`definition_id` integer NOT NULL,
	`scope_type` text NOT NULL,
	`department_id` integer,
	`department` text,
	`position` text,
	`amount` integer,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `benefit_template_scope_unique` ON `benefit_templates` (`company_id`,`definition_id`,`scope_type`,`department_id`,`position`);--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `definition_id` integer;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `currency` text DEFAULT 'TRY' NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `subject_to_sgk` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `subject_to_income_tax` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `subject_to_stamp_tax` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `exemption_limit` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `source` text DEFAULT 'Personel' NOT NULL;