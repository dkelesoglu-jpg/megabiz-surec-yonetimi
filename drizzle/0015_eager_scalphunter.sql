CREATE TABLE `advance_approval_logs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`request_id` integer NOT NULL,
	`step` text NOT NULL,
	`action` text NOT NULL,
	`user_email` text NOT NULL,
	`old_value` text,
	`new_value` text,
	`note` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `advance_installments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`request_id` integer NOT NULL,
	`sequence` integer NOT NULL,
	`due_month` text NOT NULL,
	`opening_balance` integer NOT NULL,
	`amount` integer NOT NULL,
	`closing_balance` integer NOT NULL,
	`status` text DEFAULT 'Planlandı' NOT NULL,
	`payroll_transferred` integer DEFAULT false NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `advance_installment_request_sequence_unique` ON `advance_installments` (`request_id`,`sequence`);--> statement-breakpoint
CREATE TABLE `advance_payments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`request_id` integer NOT NULL,
	`payment_type` text NOT NULL,
	`amount` integer NOT NULL,
	`payment_date` text NOT NULL,
	`method` text,
	`bank` text,
	`receipt_no` text,
	`note` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `advance_policies` (
	`company_id` text PRIMARY KEY NOT NULL,
	`salary_multiplier` integer DEFAULT 150 NOT NULL,
	`max_installments` integer DEFAULT 12 NOT NULL,
	`max_deduction_rate` integer DEFAULT 20 NOT NULL,
	`min_tenure_months` integer DEFAULT 3 NOT NULL,
	`approval_matrix` text DEFAULT '[{"limit":20000,"steps":["Yönetici","İK"]},{"limit":50000,"steps":["Yönetici","İK","Mali İşler"]},{"limit":999999999,"steps":["Yönetici","İK","Mali İşler","Genel Müdür"]}]' NOT NULL,
	`types` text DEFAULT '["Maaş Avansı","Personel Avansı","İş Avansı","Seyahat Avansı","Masraf Avansı","Personel Borcu","Şirket Tarafından Verilen Borç","Diğer"]' NOT NULL,
	`reminder_days` text DEFAULT '7,15,30' NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `advance_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`employee_id` integer NOT NULL,
	`request_type` text NOT NULL,
	`request_date` text NOT NULL,
	`requested_amount` integer NOT NULL,
	`reason` text NOT NULL,
	`description` text,
	`requested_installments` integer NOT NULL,
	`first_deduction_month` text NOT NULL,
	`urgent` integer DEFAULT false NOT NULL,
	`eligibility` text NOT NULL,
	`eligibility_details` text,
	`status` text DEFAULT 'Onay Bekliyor' NOT NULL,
	`current_step` integer DEFAULT 0 NOT NULL,
	`approval_steps` text NOT NULL,
	`approved_amount` integer DEFAULT 0 NOT NULL,
	`approved_installments` integer DEFAULT 0 NOT NULL,
	`paid_amount` integer DEFAULT 0 NOT NULL,
	`collected_amount` integer DEFAULT 0 NOT NULL,
	`balance` integer DEFAULT 0 NOT NULL,
	`exception_reason` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
