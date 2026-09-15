CREATE TABLE `otp_codes` (
	`email` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`expires_at` integer NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
PRAGMA optimize;
