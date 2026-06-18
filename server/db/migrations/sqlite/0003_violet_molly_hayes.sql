ALTER TABLE `user` ADD `class_id` text REFERENCES classes(id);--> statement-breakpoint
CREATE UNIQUE INDEX `user_class_id_unique` ON `user` (`class_id`);