import { oc } from "@orpc/contract"
import z from "zod"
import {
  CreateScoresheetsSchema,
  ScoresheetSchema,
  SubjectScoreSchema,
  UpdateScoresheetRemarksSchema
} from "~~/shared/validators/results"

// ---------------------------------------------------------------------------
// Composed output schemas
// (select schemas extended with nested relations for detail views)
// ---------------------------------------------------------------------------

export const ScoresheetWithScoresSchema = ScoresheetSchema.extend({
  subjectScores: z.array(SubjectScoreSchema)
})

/**
 * Bulk-create scoresheets for a result — one per supplied student ID. Server resolves name/ID
 * snapshots from the DB.
 */
export const createScoresheets = oc
  .input(CreateScoresheetsSchema)
  .output(z.array(ScoresheetSchema))
  .errors({
    NOT_FOUND: { message: "The result or one or more students were not found" },
    CONFLICT: { message: "A scoresheet already exists for one or more of these students" },
    PRECONDITION_FAILED: { message: "Scoresheets can only be added to a draft result" },
    FORBIDDEN: { message: "You are not allowed to do that" }
  })

/** Single scoresheet with its subject scores */
export const getOneScoresheet = oc
  .input(ScoresheetSchema.pick({ id: true }))
  .output(ScoresheetWithScoresSchema)
  .errors({ NOT_FOUND: { message: "The scoresheet was not found" } })

/** Update teacher and/or principal remarks */
export const updateScoresheetRemarks = oc
  .input(UpdateScoresheetRemarksSchema)
  .output(ScoresheetSchema)
  .errors({
    NOT_FOUND: { message: "The scoresheet was not found" },
    FORBIDDEN: { message: "You do not have permission to edit remarks on this scoresheet" }
  })

export const scoresheetContract = {
  createScoresheets,
  getOneScoresheet,
  updateScoresheetRemarks
}
