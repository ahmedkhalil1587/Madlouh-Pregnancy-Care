CREATE TABLE `pregnancies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`patient_name` text NOT NULL,
	`medical_record_number` text NOT NULL,
	`mobile` text NOT NULL,
	`date_of_birth` text NOT NULL,
	`nationality` text DEFAULT '' NOT NULL,
	`blood_type` text DEFAULT '' NOT NULL,
	`rh_factor` text DEFAULT '' NOT NULL,
	`height_cm` integer,
	`pre_pregnancy_weight_kg` text,
	`allergies` text DEFAULT '' NOT NULL,
	`chronic_diseases` text DEFAULT '' NOT NULL,
	`current_medications` text DEFAULT '' NOT NULL,
	`gravida` integer DEFAULT 1 NOT NULL,
	`para` integer DEFAULT 0 NOT NULL,
	`abortions` integer DEFAULT 0 NOT NULL,
	`living_children` integer DEFAULT 0 NOT NULL,
	`previous_pregnancy_notes` text DEFAULT '' NOT NULL,
	`last_menstrual_period` text NOT NULL,
	`estimated_due_date` text NOT NULL,
	`fetus_count` integer DEFAULT 1 NOT NULL,
	`pregnancy_risk` text DEFAULT 'منخفض' NOT NULL,
	`doctor_user_id` text NOT NULL,
	`patient_user_id` text,
	`invite_code` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_pregnancies_mrn` ON `pregnancies` (`medical_record_number`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_pregnancies_invite_code` ON `pregnancies` (`invite_code`);--> statement-breakpoint
CREATE INDEX `idx_pregnancies_doctor_user_id` ON `pregnancies` (`doctor_user_id`);--> statement-breakpoint
CREATE INDEX `idx_pregnancies_patient_user_id` ON `pregnancies` (`patient_user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`auth_user_id` text NOT NULL,
	`email` text NOT NULL,
	`display_name` text NOT NULL,
	`role` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_auth_user_id` ON `users` (`auth_user_id`);--> statement-breakpoint
CREATE TABLE `visits` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pregnancy_id` integer NOT NULL,
	`visit_type` text NOT NULL,
	`visit_date` text NOT NULL,
	`gestational_week` integer NOT NULL,
	`weight_kg` text,
	`blood_pressure` text,
	`pulse` integer,
	`temperature` text,
	`symptoms` text DEFAULT '' NOT NULL,
	`fetal_heart_rate` integer,
	`fetal_movement` text DEFAULT '' NOT NULL,
	`fundal_height_cm` text,
	`fetal_presentation` text DEFAULT '' NOT NULL,
	`ultrasound_summary` text DEFAULT '' NOT NULL,
	`lab_results` text DEFAULT '' NOT NULL,
	`assessment` text DEFAULT '' NOT NULL,
	`plan` text DEFAULT '' NOT NULL,
	`medications` text DEFAULT '' NOT NULL,
	`emergency_reason` text DEFAULT '' NOT NULL,
	`emergency_outcome` text DEFAULT '' NOT NULL,
	`next_visit_date` text,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`pregnancy_id`) REFERENCES `pregnancies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_visits_pregnancy_date` ON `visits` (`pregnancy_id`,`visit_date`);
--> statement-breakpoint
PRAGMA optimize;
