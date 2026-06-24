import { createSelectSchema, createUpdateSchema } from "drizzle-zod"
import z from "zod"
import { scoresheets } from "~~/server/db/schema"

import { StudentSchema } from "./academic"
import { SubjectScoreSchema, ResultSchema } from "./results"

export const ScoresheetSchema = createSelectSchema(scoresheets)
export type Scoresheet = z.infer<typeof ScoresheetSchema>

/**
 * Scoresheets are bulk-created — one per student. Server resolves name/ID snapshots from the DB;
 * client only supplies the student IDs.
 */
export const CreateScoresheetsSchema = z.object({
  resultId: z.string().min(1),
  studentIds: z.array(z.string().min(1)).min(1, "At least one student is required")
})
export type CreateScoresheetsInput = z.infer<typeof CreateScoresheetsSchema>

export const UpdateScoresheetRemarksSchema = createUpdateSchema(scoresheets)
  .pick({ id: true, teacherRemark: true, principalRemark: true })
  .required({ id: true })
  .extend({
    teacherRemark: z.string().max(500).nullable().optional(),
    principalRemark: z.string().max(500).nullable().optional()
  })

export type UpdateScoresheetRemarksInput = z.infer<typeof UpdateScoresheetRemarksSchema>

export const ScoresheetWithDetailsSchema = ScoresheetSchema.extend({
  subjectScores: z.array(SubjectScoreSchema),
  result: ResultSchema,
  student: StudentSchema.pick({
    id: true,
    name: true,
    studentId: true
  })
})

export type ScoresheetWithDetails = z.infer<typeof ScoresheetWithDetailsSchema>

// Moved here from results.ts to avoid a circular import: this schema needs
// ScoresheetWithDetailsSchema (defined above), and results.ts already gets
// imported by this file for ResultSchema/SubjectScoreSchema. Keeping it here
// means the dependency only flows one way: academic -> results -> scoresheet.
export const ResultDetailSchema = ResultSchema.extend({
  scoresheets: z.array(ScoresheetWithDetailsSchema.omit({ result: true }))
})

export type ResultWithDetail = z.infer<typeof ResultDetailSchema>
