CREATE TABLE `inbox` (
	`id` text PRIMARY KEY NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`storage_path` text NOT NULL,
	`note` text,
	`ip` text,
	`user_agent` text,
	`read_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `inbox_created_idx` ON `inbox` (`created_at`);--> statement-breakpoint
ALTER TABLE `files` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `shortlinks` ADD `page_title` text;--> statement-breakpoint
ALTER TABLE `shortlinks` ADD `description` text;--> statement-breakpoint
ALTER TABLE `shortlinks` ADD `image` text;--> statement-breakpoint
ALTER TABLE `shortlinks` ADD `expires_at` integer;--> statement-breakpoint
ALTER TABLE `snippets` ADD `expires_at` integer;