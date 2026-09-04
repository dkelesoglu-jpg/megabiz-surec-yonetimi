CREATE TABLE `documents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`name` text NOT NULL,
	`storage_key` text NOT NULL,
	`mime_type` text NOT NULL,
	`size` integer NOT NULL,
	`category` text NOT NULL,
	`related_type` text,
	`related_id` text,
	`version` text DEFAULT '1.0' NOT NULL,
	`expiry_date` text,
	`uploaded_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `documents_storage_key_unique` ON `documents` (`storage_key`);