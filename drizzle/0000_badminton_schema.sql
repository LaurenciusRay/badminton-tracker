CREATE TABLE `attendances` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`session_id` integer NOT NULL,
	`member_id` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `play_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `attendances_member_idx` ON `attendances` (`member_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `attendances_session_member_unique` ON `attendances` (`session_id`,`member_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`normalized_name` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "members_name_nonempty" CHECK(length(trim("members"."name", char(9,10,11,12,13,32))) > 0),
	CONSTRAINT "members_normalized_name_nonempty" CHECK(length(trim("members"."normalized_name", char(9,10,11,12,13,32))) > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_normalized_name_unique` ON `members` (`normalized_name`);--> statement-breakpoint
CREATE TABLE `play_sessions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`play_date` text NOT NULL,
	`raw_text` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT "play_sessions_valid_date" CHECK("play_sessions"."play_date" glob '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' and date("play_sessions"."play_date", '+0 days') is "play_sessions"."play_date")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `play_sessions_play_date_unique` ON `play_sessions` (`play_date`);