CREATE TABLE `role_module_permissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`role` text NOT NULL,
	`module` text NOT NULL,
	`can_view` integer DEFAULT true NOT NULL,
	`can_edit` integer DEFAULT false NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `permission_company_role_module_unique` ON `role_module_permissions` (`company_id`,`role`,`module`);