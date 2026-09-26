CREATE INDEX `results_created_at_idx` ON `results` (`createdAt`);--> statement-breakpoint
CREATE INDEX `students_created_at_idx` ON `students` (`createdAt`);--> statement-breakpoint
CREATE INDEX `students_class_id_created_at_idx` ON `students` (`class_id`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subject_lists_created_at_idx` ON `subject_lists` (`createdAt`);--> statement-breakpoint
CREATE INDEX `subjects_created_at_idx` ON `subjects` (`createdAt`);--> statement-breakpoint
CREATE INDEX `user_created_at_idx` ON `user` (`created_at`);