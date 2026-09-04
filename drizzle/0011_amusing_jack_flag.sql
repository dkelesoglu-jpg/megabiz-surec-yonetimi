CREATE TABLE `assets` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`asset_code` text NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`brand` text,
	`model` text,
	`serial_no` text,
	`purchase_date` text,
	`purchase_cost` integer,
	`assigned_employee_id` integer,
	`assigned_at` text,
	`expected_return_date` text,
	`returned_at` text,
	`condition` text DEFAULT 'İyi' NOT NULL,
	`status` text DEFAULT 'Stokta' NOT NULL,
	`notes` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `asset_company_code_unique` ON `assets` (`company_id`,`asset_code`);