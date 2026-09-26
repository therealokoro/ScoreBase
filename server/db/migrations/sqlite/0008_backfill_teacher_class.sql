-- Backfill `user.class_id` for teachers from the authoritative `classes.teacher_id`.
-- Seeded teachers previously had class_id = NULL, which made every class-scoped
-- guard / student list treat them as having no class. See docs/PERF_IMPROVEMENTS.md.
UPDATE `user`
SET `class_id` = (SELECT `id` FROM `classes` WHERE `classes`.`teacher_id` = `user`.`id`)
WHERE `class_id` IS NULL
  AND EXISTS (SELECT 1 FROM `classes` WHERE `classes`.`teacher_id` = `user`.`id`);
