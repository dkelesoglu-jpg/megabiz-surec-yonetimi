CREATE TABLE `departments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`manager_name` text,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `department_company_name_unique` ON `departments` (`company_id`,`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `department_company_code_unique` ON `departments` (`company_id`,`code`);--> statement-breakpoint
CREATE TABLE `positions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`department_id` integer NOT NULL,
	`title` text NOT NULL,
	`code` text NOT NULL,
	`reports_to_id` integer,
	`level` text DEFAULT 'Uzman' NOT NULL,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `position_company_code_unique` ON `positions` (`company_id`,`code`);