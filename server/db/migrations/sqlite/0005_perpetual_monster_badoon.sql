CREATE UNIQUE INDEX `academic_sessions_name_unique` ON `academic_sessions` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `results_term_class_unique` ON `results` (`term_id`,`class_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `scoresheets_result_student_unique` ON `scoresheets` (`result_id`,`student_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `terms_session_position_unique` ON `terms` (`session_id`,`position`);