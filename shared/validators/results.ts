import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-zod"
import { z } from "zod"
import { results, subjectScores } from "~~/server/db/schema"

import { SubjectSchema } from "./academic"

// ---------------------------------------------------------------------------
// ScoreConfigSnapshot
// Validated on result creation and on admin snapshot edits.
// Kept as a hand-written schema since it is a JSON column with cross-field
// invariants that drizzle-zod cannot express.
// ---------------------------------------------------------------------------

export const ScoreConfigSnapshotSchema = z
  .object({
    caCount: z.number().int().min(1).max(5),
    caMaxScores: z.array(z.number().int().min(1)).min(1).max(5),
    examMax: z.number().int().min(1)
  })
  .refine((val) => val.caMaxScores.length === val.caCount, {
    message: "caMaxScores must have exactly caCount entries",
    path: ["caMaxScores"]
  })
  .refine((val) => val.caMaxScores.reduce((sum, n) => sum + n, 0) + val.examMax === 100, {
    message: "CA scores and exam max must sum to 100",
    path: ["examMax"]
  })

export type ScoreConfigSnapshot = z.infer<typeof ScoreConfigSnapshotSchema>

// ---------------------------------------------------------------------------
// Result
// ---------------------------------------------------------------------------

export const ResultSchema = createSelectSchema(results, {
  // Override the generic JSON column type with the validated snapshot shape
  scoreConfig: ScoreConfigSnapshotSchema,
  status: z.enum(["draft", "submitted", "reviewed", "published"])
})
export type Result = z.infer<typeof ResultSchema>

export const CreateResultSchema = createInsertSchema(results, {
  // termId and classId are required on creation — strip the optional wrapper
  // drizzle-zod adds for columns that have no notNull in insert position
  termId: z.string().min(1, "Please select a term"),
  classId: z.string().min(1, "Please select a class")
}).pick({
  termId: true,
  classId: true
})
export type CreateResultInput = z.infer<typeof CreateResultSchema>

/**
 * Admin-only: edit the frozen scoreConfig snapshot. Router enforces status !== published and
 * handles caScores array resizing if caCount changes.
 */
export const UpdateResultScoreConfigSchema = createUpdateSchema(results, {
  scoreConfig: ScoreConfigSnapshotSchema
})
  .pick({ id: true, scoreConfig: true })
  .required({ id: true, scoreConfig: true })
export type UpdateResultScoreConfigInput = z.infer<typeof UpdateResultScoreConfigSchema>

/** Status transition — role-based transition rules enforced in the router. */
export const UpdateResultStatusSchema = createUpdateSchema(results, {
  status: z.enum(["draft", "submitted", "reviewed", "published"])
})
  .pick({ id: true, status: true })
  .required({ id: true, status: true })
export type UpdateResultStatusInput = z.infer<typeof UpdateResultStatusSchema>

export const DeleteResultSchema = ResultSchema.pick({ id: true })
export type DeleteResultInput = z.infer<typeof DeleteResultSchema>

// ---------------------------------------------------------------------------
// SubjectScore
// ---------------------------------------------------------------------------

/**
 * CaScores is a JSON column — drizzle-zod gives it z.unknown(), so we override it with the correct
 * typed array shape.
 */
const CaScoresArraySchema = z.array(z.number().min(0)).min(1).max(5)

export const SubjectScoreSchema = createSelectSchema(subjectScores, {
  caScores: CaScoresArraySchema
}).extend({
  subject: SubjectSchema.nullable()
})

export type SubjectScore = z.infer<typeof SubjectScoreSchema>

/**
 * Server adds a subject row; caScores is seeded with nulls server-side based on
 * result.scoreConfig.caCount — not supplied by the client.
 */
export const AddSubjectScoreSchema = createInsertSchema(subjectScores)
  .pick({ scoresheetId: true, subjectId: true })
  .required({ scoresheetId: true })
  .extend({
    scoresheetId: z.string().min(1),
    subjectId: z.string().min(1).optional()
  })
export type AddSubjectScoreInput = z.infer<typeof AddSubjectScoreSchema>

export const RemoveSubjectScoreSchema = SubjectScoreSchema.pick({ id: true })
export type RemoveSubjectScoreInput = z.infer<typeof RemoveSubjectScoreSchema>

/**
 * Partial score update — upper-bound checks against scoreConfig happen in the router once the
 * snapshot is loaded.
 */
export const UpdateSubjectScoreSchema = createUpdateSchema(subjectScores, {
  caScores: CaScoresArraySchema
})
  .pick({ id: true, caScores: true, exam: true })
  .required({ id: true })
  .refine((val) => val.caScores !== undefined || val.exam !== undefined, {
    message: "At least one of caScores or exam must be provided"
  })
export type UpdateSubjectScoreInput = z.infer<typeof UpdateSubjectScoreSchema>

/** Save all subject scores on a scoresheet in one round-trip. */
export const BulkUpdateSubjectScoresSchema = z.object({
  scoresheetId: z.string().min(1),
  scores: z
    .array(
      createUpdateSchema(subjectScores, { caScores: CaScoresArraySchema })
        .pick({ id: true, caScores: true, exam: true })
        .required()
    )
    .min(1, "At least one score entry is required")
})
export type BulkUpdateSubjectScoresInput = z.infer<typeof BulkUpdateSubjectScoresSchema>
