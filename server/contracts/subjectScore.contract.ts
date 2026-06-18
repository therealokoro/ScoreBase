import { oc } from "@orpc/contract"
import z from "zod"
import {
  AddSubjectScoreSchema,
  SubjectScoreSchema,
  RemoveSubjectScoreSchema,
  UpdateSubjectScoreSchema,
  BulkUpdateSubjectScoresSchema
} from "~~/shared/validators/results"

/** Add a subject row to a scoresheet. caScores seeded with nulls server-side. */
export const addSubjectScore = oc
  .input(AddSubjectScoreSchema)
  .output(SubjectScoreSchema)
  .errors({
    NOT_FOUND: { message: "The scoresheet was not found" },
    CONFLICT: { message: "This subject is already on the scoresheet" },
    PRECONDITION_FAILED: { message: "Subjects can only be added to a draft result" },
    FORBIDDEN: { message: "You are not allowed to do that" }
  })

/** Remove a subject row from a scoresheet */
export const removeSubjectScore = oc
  .input(RemoveSubjectScoreSchema)
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The subject score was not found" },
    PRECONDITION_FAILED: { message: "Subjects can only be removed from a draft result" },
    FORBIDDEN: { message: "You are not allowed to do that" }
  })

/**
 * Update CA and/or exam scores on a single subject score row. Upper-bound checks against
 * scoreConfig happen in the router.
 */
export const updateSubjectScore = oc
  .input(UpdateSubjectScoreSchema)
  .output(SubjectScoreSchema)
  .errors({
    NOT_FOUND: { message: "The subject score was not found" },
    FORBIDDEN: { message: "You do not have permission to edit scores on this result" },
    PRECONDITION_FAILED: { message: "Scores cannot be edited on a published result" },
    BAD_REQUEST: { message: "One or more scores exceed the configured maximum" }
  })

/** Save all subject scores on a scoresheet in one round-trip */
export const bulkUpdateSubjectScores = oc
  .input(BulkUpdateSubjectScoresSchema)
  .output(z.array(SubjectScoreSchema))
  .errors({
    NOT_FOUND: { message: "The scoresheet or one or more subject scores were not found" },
    FORBIDDEN: { message: "You do not have permission to edit scores on this result" },
    PRECONDITION_FAILED: { message: "Scores cannot be edited on a published result" },
    BAD_REQUEST: { message: "One or more scores exceed the configured maximum" }
  })

export const subjectScoreContract = {
  addSubjectScore,
  removeSubjectScore,
  updateSubjectScore,
  bulkUpdateSubjectScores
}
