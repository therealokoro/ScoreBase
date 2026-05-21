import { relations, sql } from "drizzle-orm"
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { typeid } from "typeid-js"

import { user } from "."
import { dateTimeSchema } from "./common"

export const academicSessions = sqliteTable("academic_sessions", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("aca").toString()),
  name: text("name").notNull(),
  ...dateTimeSchema
})

export const terms = sqliteTable("terms", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("term").toString()),
  name: text("name").notNull(),
  position: integer("position").notNull(), // 1-based index into preset
  sessionId: text("session_id")
    .notNull()
    .references(() => academicSessions.id),
  ...dateTimeSchema
})

export const classes = sqliteTable("classes", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("class").toString()),
  name: text("name").notNull().unique(),
  teacherId: text("teacher_id")
    .unique() // enforces the one-to-one
    .references(() => user.id, { onDelete: "set null" }),
  subjectList: text("subject_list").references(() => subjectLists.id),
  ...dateTimeSchema
})

export const subjects = sqliteTable("subjects", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("subject").toString()),
  name: text("name").notNull(),
  tags: text("tags", { mode: "json" })
    .$type<string[]>()
    .notNull()
    .default(sql`(json_array())`),
  ...dateTimeSchema
})

export const subjectLists = sqliteTable("subject_lists", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("subprst").toString()),
  name: text("name").notNull(),
  subjectIds: text("subjectIds", { mode: "json" }).$type<string[]>(),
  ...dateTimeSchema
})

export const academicSessionsRelations = relations(academicSessions, ({ many }) => ({
  terms: many(terms)
}))

export const termsRelations = relations(terms, ({ one }) => ({
  session: one(academicSessions, {
    fields: [terms.sessionId],
    references: [academicSessions.id]
  })
}))

export const classesRelations = relations(classes, ({ one }) => ({
  teacher: one(user, {
    fields: [classes.teacherId],
    references: [user.id]
  })
}))
