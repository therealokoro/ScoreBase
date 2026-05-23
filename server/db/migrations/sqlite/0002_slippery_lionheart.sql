PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_subject_lists` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`subjectIds` text DEFAULT (json_array()),
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_subject_lists`("id", "name", "subjectIds", "createdAt", "updatedAt") SELECT "id", "name", "subjectIds", "createdAt", "updatedAt" FROM `subject_lists`;--> statement-breakpoint
DROP TABLE `subject_lists`;--> statement-breakpoint
ALTER TABLE `__new_subject_lists` RENAME TO `subject_lists`;--> statement-breakpoint
PRAGMA foreign_keys=ON;