UPDATE `payroll_legal_parameters`
SET `income_tax_brackets` = '[{"limit":190000,"rate":15},{"limit":400000,"rate":20},{"limit":1500000,"rate":27},{"limit":5300000,"rate":35},{"limit":null,"rate":40}]',
    `updated_at` = CURRENT_TIMESTAMP
WHERE `year` = 2026
  AND `income_tax_brackets` = '[{"limit":158000,"rate":15},{"limit":330000,"rate":20},{"limit":1200000,"rate":27},{"limit":4300000,"rate":35},{"limit":null,"rate":40}]';
