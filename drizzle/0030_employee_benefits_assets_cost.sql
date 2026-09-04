ALTER TABLE `employee_benefits` ADD `include_in_employer_cost` integer DEFAULT true NOT NULL;
--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `description` text;
--> statement-breakpoint
ALTER TABLE `employee_benefits` ADD `detail_data` text;
--> statement-breakpoint
ALTER TABLE `assets` ADD `monthly_cost` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `assets` ADD `include_in_employer_cost` integer DEFAULT false NOT NULL;
--> statement-breakpoint
ALTER TABLE `assets` ADD `ownership_type` text DEFAULT 'Şirket' NOT NULL;
