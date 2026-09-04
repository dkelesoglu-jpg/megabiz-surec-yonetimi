CREATE TABLE `performance_reviews` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` integer NOT NULL,
	`period` text NOT NULL,
	`evaluator` text NOT NULL,
	`competency_score` integer DEFAULT 0 NOT NULL,
	`kpi_score` integer DEFAULT 0 NOT NULL,
	`goal_score` integer DEFAULT 0 NOT NULL,
	`overall_score` integer DEFAULT 0 NOT NULL,
	`result` text NOT NULL,
	`outcome` text DEFAULT 'Gelişim Planı' NOT NULL,
	`manager_note` text,
	`status` text DEFAULT 'Taslak' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `review_company_employee_period_unique` ON `performance_reviews` (`company_id`,`employee_id`,`period`);