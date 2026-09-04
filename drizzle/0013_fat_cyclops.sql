ALTER TABLE `employees` ADD `net_salary` integer;--> statement-breakpoint
ALTER TABLE `employees` ADD `salary_basis` text DEFAULT 'Brüt' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `salary_period` text DEFAULT 'Aylık' NOT NULL;--> statement-breakpoint
ALTER TABLE `employees` ADD `weekly_hours` integer;