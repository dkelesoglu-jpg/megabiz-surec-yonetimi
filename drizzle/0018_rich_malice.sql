CREATE TABLE `performance_settings` (
	`company_id` text PRIMARY KEY NOT NULL,
	`goal_weight` integer DEFAULT 40 NOT NULL,
	`kpi_weight` integer DEFAULT 30 NOT NULL,
	`competency_weight` integer DEFAULT 20 NOT NULL,
	`manager_weight` integer DEFAULT 10 NOT NULL,
	`self_weight` integer DEFAULT 0 NOT NULL,
	`feedback_360_weight` integer DEFAULT 0 NOT NULL,
	`reminder_days` text DEFAULT '10,5,3,0' NOT NULL,
	`performance_scale` text DEFAULT '[{"min":90,"code":"A","label":"Üstün Performans"},{"min":80,"code":"B","label":"Beklentinin Üzerinde"},{"min":70,"code":"C","label":"Beklentiyi Karşılıyor"},{"min":60,"code":"D","label":"Gelişim Gerekli"},{"min":0,"code":"E","label":"Yetersiz Performans"}]' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
