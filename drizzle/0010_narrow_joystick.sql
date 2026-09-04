ALTER TABLE `employees` ADD `nationality` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `passport_no` text;--> statement-breakpoint
ALTER TABLE `employees` ADD `work_permit_status` text DEFAULT 'Aktif';--> statement-breakpoint
ALTER TABLE `employees` ADD `work_permit_renewal_status` text DEFAULT 'Takipte';--> statement-breakpoint
ALTER TABLE `employees` ADD `work_permit_reminder_days` integer DEFAULT 60;