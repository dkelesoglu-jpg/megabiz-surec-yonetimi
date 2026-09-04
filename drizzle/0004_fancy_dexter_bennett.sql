CREATE TABLE `app_users` (
	`email` text PRIMARY KEY NOT NULL,
	`full_name` text,
	`platform_role` text DEFAULT 'user' NOT NULL,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `audit_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`user_email` text NOT NULL,
	`action` text NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text,
	`old_value` text,
	`new_value` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`sector` text,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `company_memberships` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`user_email` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `membership_company_user_unique` ON `company_memberships` (`company_id`,`user_email`);--> statement-breakpoint
ALTER TABLE `employees` ADD `company_id` text DEFAULT 'mega-global-energy' NOT NULL;--> statement-breakpoint
ALTER TABLE `module_records` ADD `company_id` text DEFAULT 'mega-global-energy' NOT NULL;