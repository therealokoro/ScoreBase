CREATE TABLE `results` (
	`id` text PRIMARY KEY NOT NULL,
	`term_id` text NOT NULL,
	`class_id` text NOT NULL,
	`score_config` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`submitted_by_id` text,
	`submitted_at` text,
	`reviewed_by_id` text,
	`reviewed_at` text,
	`published_at` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`class_id`) REFERENCES `classes`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`submitted_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`reviewed_by_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `scoresheets` (
	`id` text PRIMARY KEY NOT NULL,
	`result_id` text NOT NULL,
	`student_id` text NOT NULL,
	`student_name_snapshot` text NOT NULL,
	`student_id_snapshot` text NOT NULL,
	`teacher_remark` text,
	`principal_remark` text,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`result_id`) REFERENCES `results`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE TABLE `subject_scores` (
	`id` text PRIMARY KEY NOT NULL,
	`scoresheet_id` text NOT NULL,
	`subject_id` text,
	`subject_name_snapshot` text NOT NULL,
	`ca_scores` text DEFAULT (json_array()) NOT NULL,
	`exam` real,
	`createdAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updatedAt` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`scoresheet_id`) REFERENCES `scoresheets`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`subject_id`) REFERENCES `subjects`(`id`) ON UPDATE no action ON DELETE set null
);
