DROP INDEX `employees_national_id_unique`;--> statement-breakpoint
DROP INDEX `employees_employee_no_unique`;--> statement-breakpoint
CREATE UNIQUE INDEX `employee_company_national_id_unique` ON `employees` (`company_id`,`national_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `employee_company_no_unique` ON `employees` (`company_id`,`employee_no`);