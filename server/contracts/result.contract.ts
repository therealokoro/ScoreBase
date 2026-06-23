import { oc } from "@orpc/contract"
import { z } from "zod"
import { AcademicSessionSchema, ClassSchema } from "~~/shared/validators/academic"
import {
  CreateResultSchema,
  ResultSchema,
  UpdateResultScoreConfigSchema,
  UpdateResultStatusSchema
} from "~~/shared/validators/results"
import { ScoresheetWithDetailsSchema } from "~~/shared/validators/scoresheet"

const ExtendedResultSchema = ResultSchema.extend({
  name: z.string(),
  term: z.object({
    name: z.string(),
    session: AcademicSessionSchema.pick({ name: true })
  }),
  class: ClassSchema.pick({ name: true, id: true })
})

const ResultDetailSchema = ExtendedResultSchema.extend({
  scoresheets: z.array(ScoresheetWithDetailsSchema.omit({ result: true }))
})

// ---------------------------------------------------------------------------
// Result procedures
// ---------------------------------------------------------------------------

/** Admin sees all results; teacher sees only their assigned class's results */
export const listResults = oc.output(z.array(ExtendedResultSchema))

/** Single result with all scoresheets and subject scores nested */
export const getOneResult = oc
  .input(ResultSchema.pick({ id: true }))
  .output(ResultDetailSchema)
  .errors({ NOT_FOUND: { message: "The result was not found" } })

/** Admin creates a result for a term + class, snapshotting the current score config */
export const createResult = oc
  .input(CreateResultSchema)
  .output(ResultSchema)
  .errors({
    NOT_FOUND: { message: "The term or class was not found" },
    CONFLICT: { message: "A result already exists for this term and class" }
  })

/** Admin-only: edit the frozen scoreConfig snapshot. Only allowed while status is draft or reviewed. */
export const updateResultScoreConfig = oc
  .input(UpdateResultScoreConfigSchema)
  .output(ResultSchema)
  .errors({
    NOT_FOUND: { message: "The result was not found" },
    FORBIDDEN: { message: "Only admins can edit the score configuration" },
    PRECONDITION_FAILED: { message: "Score config cannot be changed on a published result" }
  })

/**
 * Advance or revert result status. Teacher: draft → submitted. Admin: submitted → reviewed →
 * published, or any → draft to reject.
 */
export const updateResultStatus = oc
  .input(UpdateResultStatusSchema)
  .output(ResultSchema)
  .errors({
    NOT_FOUND: { message: "The result was not found" },
    FORBIDDEN: { message: "You do not have permission to perform this status transition" },
    PRECONDITION_FAILED: { message: "Invalid status transition" }
  })

/** Only draft results can be deleted */
export const deleteResult = oc
  .input(ResultSchema.pick({ id: true }))
  .output(z.object({ success: z.boolean() }))
  .errors({
    NOT_FOUND: { message: "The result was not found" },
    PRECONDITION_FAILED: { message: "Only draft results can be deleted" }
  })

// ---------------------------------------------------------------------------
// Contract
// ---------------------------------------------------------------------------

export const resultContract = {
  list: listResults,
  getOne: getOneResult,
  create: createResult,
  updateScoreConfig: updateResultScoreConfig,
  updateStatus: updateResultStatus,
  delete: deleteResult
}
