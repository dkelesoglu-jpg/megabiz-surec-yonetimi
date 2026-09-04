CREATE TABLE `number_series` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` text NOT NULL,
  `series_type` text NOT NULL,
  `prefix` text NOT NULL,
  `start_number` integer DEFAULT 1 NOT NULL,
  `last_used` integer DEFAULT 0 NOT NULL,
  `digits` integer DEFAULT 3 NOT NULL,
  `updated_by` text,
  `updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `number_series_company_type_unique` ON `number_series` (`company_id`,`series_type`);
--> statement-breakpoint
CREATE TABLE `number_series_history` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `company_id` text NOT NULL,
  `series_type` text NOT NULL,
  `number` integer NOT NULL,
  `formatted_value` text NOT NULL,
  `created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `number_series_history_value_unique` ON `number_series_history` (`company_id`,`series_type`,`formatted_value`);
--> statement-breakpoint
ALTER TABLE `performance_reviews` ADD `review_no` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `performance_review_company_no_unique` ON `performance_reviews` (`company_id`,`review_no`);
--> statement-breakpoint
ALTER TABLE `advance_requests` ADD `request_no` text;
--> statement-breakpoint
CREATE UNIQUE INDEX `advance_request_company_no_unique` ON `advance_requests` (`company_id`,`request_no`);
