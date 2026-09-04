PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_performance_metrics` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`company_id` text NOT NULL,
	`cycle_id` integer,
	`assignment_id` integer,
	`metric_type` text NOT NULL,
	`goal_type` text DEFAULT 'Bireysel Hedef' NOT NULL,
	`source_type` text DEFAULT 'Bireysel' NOT NULL,
	`name` text NOT NULL,
	`code` text,
	`description` text,
	`department` text,
	`position` text,
	`unit` text DEFAULT '%' NOT NULL,
	`direction` text DEFAULT 'Yüksek değer iyi' NOT NULL,
	`start_value` integer DEFAULT 0 NOT NULL,
	`target_value` integer DEFAULT 100 NOT NULL,
	`actual_value` integer DEFAULT 0 NOT NULL,
	`minimum_value` integer,
	`maximum_value` integer,
	`weight` integer DEFAULT 0 NOT NULL,
	`raw_progress` integer DEFAULT 0 NOT NULL,
	`weighted_contribution` integer DEFAULT 0 NOT NULL,
	`risk_level` text DEFAULT 'Normal' NOT NULL,
	`checkpoint_data` text DEFAULT '[]' NOT NULL,
	`parent_metric_id` integer,
	`carried_from_metric_id` integer,
	`priority` text DEFAULT 'Orta' NOT NULL,
	`data_source` text DEFAULT 'Manuel' NOT NULL,
	`frequency` text,
	`approver` text,
	`start_date` text,
	`end_date` text,
	`score` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'Taslak' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_performance_metrics`("id", "company_id", "cycle_id", "assignment_id", "metric_type", "source_type", "name", "code", "description", "department", "position", "unit", "direction", "start_value", "target_value", "actual_value", "minimum_value", "maximum_value", "weight", "priority", "data_source", "frequency", "approver", "start_date", "end_date", "score", "status", "created_at", "updated_at") SELECT "id", "company_id", "cycle_id", "assignment_id", "metric_type", "source_type", "name", "code", "description", "department", "position", "unit", "direction", "start_value", "target_value", "actual_value", "minimum_value", "maximum_value", "weight", "priority", "data_source", "frequency", "approver", "start_date", "end_date", "score", "status", "created_at", "updated_at" FROM `performance_metrics`;--> statement-breakpoint
DROP TABLE `performance_metrics`;--> statement-breakpoint
ALTER TABLE `__new_performance_metrics` RENAME TO `performance_metrics`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE TABLE `__new_performance_settings` (
	`company_id` text PRIMARY KEY NOT NULL,
	`goal_weight` integer DEFAULT 40 NOT NULL,
	`kpi_weight` integer DEFAULT 30 NOT NULL,
	`competency_weight` integer DEFAULT 20 NOT NULL,
	`manager_weight` integer DEFAULT 10 NOT NULL,
	`self_weight` integer DEFAULT 0 NOT NULL,
	`feedback_360_weight` integer DEFAULT 0 NOT NULL,
	`reminder_days` text DEFAULT '30,15,7,0' NOT NULL,
	`goal_score_cap` integer DEFAULT 120 NOT NULL,
	`goal_approval_enabled` integer DEFAULT false NOT NULL,
	`performance_scale` text DEFAULT '[{"min":90,"code":"A","label":"Üstün Performans"},{"min":80,"code":"B","label":"Beklentinin Üzerinde"},{"min":70,"code":"C","label":"Beklentiyi Karşılıyor"},{"min":60,"code":"D","label":"Gelişim Gerekli"},{"min":0,"code":"E","label":"Yetersiz Performans"}]' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_performance_settings`("company_id", "goal_weight", "kpi_weight", "competency_weight", "manager_weight", "self_weight", "feedback_360_weight", "reminder_days", "performance_scale", "updated_by", "updated_at") SELECT "company_id", "goal_weight", "kpi_weight", "competency_weight", "manager_weight", "self_weight", "feedback_360_weight", "reminder_days", "performance_scale", "updated_by", "updated_at" FROM `performance_settings`;--> statement-breakpoint
DROP TABLE `performance_settings`;--> statement-breakpoint
ALTER TABLE `__new_performance_settings` RENAME TO `performance_settings`;
