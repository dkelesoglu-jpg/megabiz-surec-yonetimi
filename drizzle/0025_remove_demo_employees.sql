DELETE FROM performance_metrics WHERE assignment_id IN (SELECT id FROM performance_assignments WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM performance_competencies WHERE assignment_id IN (SELECT id FROM performance_assignments WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM performance_feedback WHERE assignment_id IN (SELECT id FROM performance_assignments WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM performance_actions WHERE assignment_id IN (SELECT id FROM performance_assignments WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM advance_installments WHERE request_id IN (SELECT id FROM advance_requests WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM advance_payments WHERE request_id IN (SELECT id FROM advance_requests WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
DELETE FROM advance_approval_logs WHERE request_id IN (SELECT id FROM advance_requests WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy')));
--> statement-breakpoint
UPDATE assets SET assigned_employee_id = NULL, assigned_at = NULL, expected_return_date = NULL, status = 'Stokta' WHERE assigned_employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM documents WHERE related_type = 'employee' AND CAST(related_id AS INTEGER) IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM performance_reviews WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM performance_assignments WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM advance_requests WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM employee_benefits WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM employee_cost_histories WHERE employee_id IN (SELECT id FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy'));
--> statement-breakpoint
DELETE FROM employees WHERE first_name || ' ' || last_name IN ('Deniz Keleşoğlu','Ayşe Yılmaz','Emre Kaya','Selin Arslan','Mert Demir','Zeynep Aksoy');
