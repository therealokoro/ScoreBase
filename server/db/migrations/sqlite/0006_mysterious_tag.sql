CREATE INDEX `results_class_id_index` ON `results` (`class_id`);--> statement-breakpoint
CREATE INDEX `scoresheets_student_id_index` ON `scoresheets` (`student_id`);--> statement-breakpoint
CREATE INDEX `students_class_id_index` ON `students` (`class_id`);--> statement-breakpoint
CREATE INDEX `subject_scores_scoresheet_id_index` ON `subject_scores` (`scoresheet_id`);