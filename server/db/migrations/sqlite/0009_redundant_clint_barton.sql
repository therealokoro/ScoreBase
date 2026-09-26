DROP INDEX `results_class_id_index`;--> statement-breakpoint
CREATE INDEX `results_class_id_created_at_idx` ON `results` (`class_id`,`createdAt`);--> statement-breakpoint
CREATE INDEX `subject_scores_subject_id_index` ON `subject_scores` (`subject_id`);