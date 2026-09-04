ALTER TABLE `employees` ADD `payroll_type` text DEFAULT 'Normal Personel' NOT NULL;
--> statement-breakpoint
UPDATE `employees`
SET `payroll_type` = CASE
  WHEN `employee_type` = 'Emekli' THEN 'Emekli Personel'
  ELSE 'Normal Personel'
END;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `honorarium_income_tax_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `honorarium_stamp_tax_exemption` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `payroll_legal_parameters` ADD `honorarium_other_deduction_rate` integer DEFAULT 0 NOT NULL;
