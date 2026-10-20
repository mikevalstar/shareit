CREATE TABLE `poll_options` (
	`id` text PRIMARY KEY NOT NULL,
	`poll_id` text NOT NULL,
	`content` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `poll_options_poll_idx` ON `poll_options` (`poll_id`);--> statement-breakpoint
CREATE TABLE `poll_votes` (
	`poll_id` text NOT NULL,
	`option_id` text NOT NULL,
	`voter_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	PRIMARY KEY(`option_id`, `voter_id`),
	FOREIGN KEY (`poll_id`) REFERENCES `polls`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`option_id`) REFERENCES `poll_options`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`voter_id`) REFERENCES `voters`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `poll_votes_poll_voter_idx` ON `poll_votes` (`poll_id`,`voter_id`);--> statement-breakpoint
CREATE TABLE `polls` (
	`id` text PRIMARY KEY NOT NULL,
	`slug` text NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`multi` integer DEFAULT false NOT NULL,
	`closes_at` integer,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `polls_slug_unique` ON `polls` (`slug`);--> statement-breakpoint
CREATE TABLE `voters` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
