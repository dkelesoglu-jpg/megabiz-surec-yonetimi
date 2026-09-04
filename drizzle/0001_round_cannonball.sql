CREATE TABLE `module_records` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`module` text NOT NULL,
	`title` text NOT NULL,
	`owner` text,
	`department` text,
	`due_date` text,
	`status` text DEFAULT 'Aktif' NOT NULL,
	`progress` integer DEFAULT 0,
	`description` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
