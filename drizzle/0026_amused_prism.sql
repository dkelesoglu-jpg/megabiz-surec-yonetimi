ALTER TABLE `employees` ADD `position_id` integer;
--> statement-breakpoint
UPDATE `employees`
SET `position_id` = (
  SELECT `positions`.`id`
  FROM `positions`
  WHERE `positions`.`company_id` = `employees`.`company_id`
    AND `positions`.`department_id` = `employees`.`department_id`
    AND `positions`.`title` = `employees`.`position`
  LIMIT 1
)
WHERE `position_id` IS NULL;
