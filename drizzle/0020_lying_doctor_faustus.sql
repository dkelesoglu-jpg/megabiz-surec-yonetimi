ALTER TABLE `departments` ADD `parent_department_id` integer;--> statement-breakpoint
ALTER TABLE `employees` ADD `department_id` integer;--> statement-breakpoint
UPDATE `employees`
SET `department_id` = (
  SELECT `departments`.`id`
  FROM `departments`
  WHERE `departments`.`company_id` = `employees`.`company_id`
    AND `departments`.`name` = `employees`.`department`
  LIMIT 1
)
WHERE `department_id` IS NULL;
