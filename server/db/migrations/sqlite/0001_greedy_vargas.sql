PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_classes` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`teacher_id` text,
	`subject_list` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`teacher_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`subject_list`) REFERENCES `subject_lists`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_classes`("id", "name", "teacher_id", "subject_list", "createdAt", "updatedAt") SELECT "id", "name", "teacher_id", "subject_list", "createdAt", "updatedAt" FROM `classes`;--> statement-breakpoint
DROP TABLE `classes`;--> statement-breakpoint
ALTER TABLE `__new_classes` RENAME TO `classes`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `classes_name_unique` ON `classes` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `classes_teacher_id_unique` ON `classes` (`teacher_id`);