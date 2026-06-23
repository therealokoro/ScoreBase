PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subject_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`scoresheet_id` text NOT NULL,
	`subject_id` text,
	`ca_scores` text DEFAULT (json_array()) NOT NULL,
	`exam` real,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`scoresheet_id`) REFERENCES `scoresheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_subject_scores`("id", "scoresheet_id", "subject_id", "ca_scores", "exam", "createdAt", "updatedAt") SELECT "id", "scoresheet_id", "subject_id", "ca_scores", "exam", "createdAt", "updatedAt" FROM `subject_scores`;--> statement-breakpoint
DROP TABLE `subject_scores`;--> statement-breakpoint
ALTER TABLE `__new_subject_scores` RENAME TO `subject_scores`;--> statement-breakpoint
PRAGMA foreign_keys=ON;