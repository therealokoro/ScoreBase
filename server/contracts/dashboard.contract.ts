import { oc } from "@orpc/contract"
import { z } from "zod"
import { resultStatus } from "~~/shared/constants/extras"

// One count per result status, always present even if zero, so the UI
// can render a fixed set of pills/cards without conditional checks.
const ResultStatusCountsSchema = z.object({
  draft: z.number(),
  submitted: z.number(),
  reviewed: z.number(),
  published: z.number()
})
export const getAdminSummary = oc.output(
  z.object({
    counts: z.object({
      students: z.number(),
      classes: z.number(),
      teachers: z.number()
    }),
    // Null when no active session/term has been set yet in school settings —
    // the UI should show a "not set" state rather than a misleading label.
    activeSession: z.object({ id: z.string(), name: z.string() }).nullable(),
    activeTerm: z.object({ id: z.string(), name: z.string() }).nullable(),
    // Status breakdown scoped to the active term only — this is what makes
    // the pipeline numbers meaningful ("results this term"), not a
    // school-wide-forever count that never resets.
    resultStatusCounts: ResultStatusCountsSchema
  })
)
export const getTeacherSummary = oc.output(
  z.object({
    // Null if this teacher has no class assigned yet — UI should show a
    // setup-needed state rather than crashing on missing fields.
    class: z.object({ id: z.string(), name: z.string(), studentCount: z.number() }).nullable(),
    activeSession: z.object({ id: z.string(), name: z.string() }).nullable(),
    activeTerm: z.object({ id: z.string(), name: z.string() }).nullable(),
    // Null when no result row exists yet for (activeTerm, theirClass) — the
    // admin hasn't created one yet. Distinct from status:"draft", which
    // means a result DOES exist but hasn't been submitted.
    result: z
      .object({
        id: z.string(),
        status: z.enum(resultStatus)
      })
      .nullable()
  })
)

export const dashboardContract = {
  getAdminSummary,
  getTeacherSummary
}
