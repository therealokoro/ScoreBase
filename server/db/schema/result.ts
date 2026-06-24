import { relations, sql } from "drizzle-orm"
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core"
import { typeid } from "typeid-js"
import { resultStatus } from "~~/shared/constants/extras"

import { user } from "."
import { classes, students, subjects, terms } from "./academic"
import { dateTimeSchema } from "./common"

// ---------------------------------------------------------------------------
// Score Config Snapshot type
//
// Captured once when a Result is created — a point-in-time copy of whatever
// the admin had configured at that moment. Stored as JSON on the Result row
// so report cards are always rendered against the rules that were in effect
// when scoring happened, regardless of later admin changes.
//
// caMaxScores: ordered array, one entry per CA slot (length = caCount).
//   e.g. caCount=3, caMaxScores=[10,10,10], examMax=70  → total = 100
// Invariant (enforced in app layer): sum(caMaxScores) + examMax === 100
// ---------------------------------------------------------------------------

type ScoreConfigSnapshot = {
  caCount: number // 1–5
  caMaxScores: number[] // length === caCount
  examMax: number
}

// ---------------------------------------------------------------------------
// Result
// One per (Term × Class). Carries a frozen snapshot of the scoring rules
// that were active when it was created.
// ---------------------------------------------------------------------------

export const results = sqliteTable("results", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("result").toString()),
  name: text("name").notNull(),
  termId: text("term_id")
    .notNull()
    .references(() => terms.id, { onDelete: "restrict" }),
  classId: text("class_id")
    .notNull()
    .references(() => classes.id, { onDelete: "restrict" }),

  // Frozen scoring rules — never mutated after creation.
  // Reading code must use this, not the live admin settings.
  scoreConfig: text("score_config", { mode: "json" }).$type<ScoreConfigSnapshot>().notNull(),

  status: text("status", { enum: resultStatus }).notNull().default("draft"),

  // Teacher who submitted
  submittedById: text("submitted_by_id").references(() => user.id, { onDelete: "set null" }),
  submittedAt: text("submitted_at"), // ISO-8601

  // Admin who reviewed / published
  reviewedById: text("reviewed_by_id").references(() => user.id, { onDelete: "set null" }),
  reviewedAt: text("reviewed_at"),
  publishedAt: text("published_at"),

  ...dateTimeSchema
})

// ---------------------------------------------------------------------------
// Scoresheet
// One per Student within a Result.
// Subjects are pre-populated from the class subject-list preset at creation
// time but can be individually added/removed per student.
// ---------------------------------------------------------------------------

export const scoresheets = sqliteTable("scoresheets", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("ssheet").toString()),
  resultId: text("result_id")
    .notNull()
    .references(() => results.id, { onDelete: "cascade" }),
  studentId: text("student_id")
    .notNull()
    .references(() => students.id, { onDelete: "restrict" }),

  teacherRemark: text("teacher_remark"),
  principalRemark: text("principal_remark"),

  ...dateTimeSchema
})

// ---------------------------------------------------------------------------
// SubjectScore
// One per subject offered on a scoresheet.
//
// CA scores are stored as a JSON array whose length matches
// result.scoreConfig.caCount. Each slot maps to the corresponding
// caMaxScores[i] ceiling. Null entries mean the score has not been
// entered yet.
//
//   e.g. caCount = 3  →  caScores = [8, null, 7]
//        caCount = 1  →  caScores = [15]
//
// exam follows the same nullable convention.
//
// Derived values (subject total, grade, class average, position) are
// computed on the fly from these raw scores and never persisted.
// ---------------------------------------------------------------------------

export const subjectScores = sqliteTable("subject_scores", {
  id: text("id")
    .primaryKey()
    .$default(() => typeid("sscore").toString()),
  scoresheetId: text("scoresheet_id")
    .notNull()
    .references(() => scoresheets.id, { onDelete: "cascade" }),

  // Soft FK — set to null if the subject is deleted; the snapshot keeps
  // report cards accurate regardless.
  subjectId: text("subject_id").references(() => subjects.id, { onDelete: "set null" }),

  // Variable-length CA scores — must match result.scoreConfig.caCount
  caScores: text("ca_scores", { mode: "json" })
    .$type<(number | null)[]>()
    .notNull()
    .default(sql`(json_array())`),

  exam: real("exam"), // null = not yet entered

  ...dateTimeSchema
})

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const resultsRelations = relations(results, ({ one, many }) => ({
  term: one(terms, {
    fields: [results.termId],
    references: [terms.id]
  }),
  class: one(classes, {
    fields: [results.classId],
    references: [classes.id]
  }),
  submittedBy: one(user, {
    fields: [results.submittedById],
    references: [user.id],
    relationName: "resultSubmittedBy"
  }),
  reviewedBy: one(user, {
    fields: [results.reviewedById],
    references: [user.id],
    relationName: "resultReviewedBy"
  }),
  scoresheets: many(scoresheets)
}))

export const scoresheetsRelations = relations(scoresheets, ({ one, many }) => ({
  result: one(results, {
    fields: [scoresheets.resultId],
    references: [results.id]
  }),
  student: one(students, {
    fields: [scoresheets.studentId],
    references: [students.id]
  }),
  subjectScores: many(subjectScores)
}))

export const subjectScoresRelations = relations(subjectScores, ({ one }) => ({
  scoresheet: one(scoresheets, {
    fields: [subjectScores.scoresheetId],
    references: [scoresheets.id]
  }),
  subject: one(subjects, {
    fields: [subjectScores.subjectId],
    references: [subjects.id]
  })
}))
