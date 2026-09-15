CREATE TABLE `lab_results` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`pregnancy_id` integer NOT NULL,
	`investigation` text NOT NULL,
	`examination` text NOT NULL,
	`result_date` text NOT NULL,
	`created_by` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`pregnancy_id`) REFERENCES `pregnancies`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_lab_results_pregnancy_date` ON `lab_results` (`pregnancy_id`,`result_date`);--> statement-breakpoint
ALTER TABLE `pregnancies` ADD `age` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `pregnancies` ADD `doctor_name` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `pregnancies` ADD `past_surgical_history` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `visit_number` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `visits` ADD `b_value` text DEFAULT '' NOT NULL;
--> statement-breakpoint
PRAGMA optimize;
