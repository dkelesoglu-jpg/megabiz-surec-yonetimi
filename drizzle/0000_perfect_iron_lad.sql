CREATE TABLE `employees` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`last_name` text NOT NULL,
	`national_id` text NOT NULL,
	`employee_no` text NOT NULL,
	`birth_date` text,
	`birth_place` text,
	`gender` text,
	`blood_type` text,
	`email` text,
	`phone` text,
	`address` text,
	`department` text NOT NULL,
	`position` text NOT NULL,
	`manager` text,
	`start_date` text NOT NULL,
	`work_type` text DEFAULT 'Tam Zamanlı' NOT NULL,
	`employee_type` text DEFAULT 'Normal' NOT NULL,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`sgk_no` text,
	`occupation_code` text,
	`iban` text,
	`salary` integer,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_national_id_unique` ON `employees` (`national_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);