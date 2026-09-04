CREATE TABLE `company_modules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`module` text NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `company_module_unique` ON `company_modules` (`company_id`,`module`);--> statement-breakpoint
ALTER TABLE `companies` ADD `employee_count` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `companies` ADD `package_name` text DEFAULT 'Professional' NOT NULL;