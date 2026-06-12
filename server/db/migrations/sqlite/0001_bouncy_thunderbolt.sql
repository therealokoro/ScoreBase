PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_students` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`student_id` text NOT NULL,
	`class_id` text NOT NULL,
	`phone_number` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
INSERT INTO `__new_students`("id", "name", "student_id", "class_id", "phone_number", "createdAt", "updatedAt") SELECT "id", "name", "student_id", "class_id", "phone_number", "createdAt", "updatedAt" FROM `students`;--> statement-breakpoint
DROP TABLE `students`;--> statement-breakpoint
ALTER TABLE `__new_students` RENAME TO `students`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `students_student_id_unique` ON `students` (`student_id`);