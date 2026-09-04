ALTER TABLE `payroll_legal_parameters` ADD `employee_sgdp_rate` integer DEFAULT 750 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `employer_sgdp_rate` integer DEFAULT 2475 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `meal_sgk_daily_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `meal_tax_daily_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `travel_sgk_daily_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `travel_tax_daily_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
UPDATE `payroll_legal_parameters`
SET `minimum_wage` = CASE WHEN `year` = 2026 AND `minimum_wage` <= 0 THEN 33030 ELSE `minimum_wage` END,
    `sgk_floor` = CASE WHEN `year` = 2026 THEN 33030 ELSE `sgk_floor` END,
    `sgk_ceiling` = CASE WHEN `year` = 2026 THEN 297270 ELSE `sgk_ceiling` END,
    `stamp_tax_rate` = CASE WHEN `stamp_tax_rate` = 759 THEN 75.9 ELSE `stamp_tax_rate` END;
