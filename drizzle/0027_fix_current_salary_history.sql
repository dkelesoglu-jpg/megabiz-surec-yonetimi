UPDATE `employee_cost_histories`
SET
  `gross_salary` = (
    SELECT `employees`.`salary`
    FROM `employees`
    WHERE `employees`.`id` = `employee_cost_histories`.`employee_id`
      AND `employees`.`company_id` = `employee_cost_histories`.`company_id`
  ),
  `net_salary` = (
    SELECT `employees`.`net_salary`
    FROM `employees`
    WHERE `employees`.`id` = `employee_cost_histories`.`employee_id`
      AND `employees`.`company_id` = `employee_cost_histories`.`company_id`
  ),
  `salary_basis` = (
    SELECT `employees`.`salary_basis`
    FROM `employees`
    WHERE `employees`.`id` = `employee_cost_histories`.`employee_id`
      AND `employees`.`company_id` = `employee_cost_histories`.`company_id`
  )
WHERE `effective_to` IS NULL
  AND EXISTS (
    SELECT 1
    FROM `employees`
    WHERE `employees`.`id` = `employee_cost_histories`.`employee_id`
      AND `employees`.`company_id` = `employee_cost_histories`.`company_id`
  );
