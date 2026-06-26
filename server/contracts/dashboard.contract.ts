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

const RecentActivityItemSchema = z.object({
  id: z.string(),
  resultName: z.string(),
  status: z.enum(resultStatus),
  // Who triggered this status — submitter for "submitted", reviewer for
  // "reviewed"/"published". Null if no audit actor is recorded yet.
  actorName: z.string().nullable(),
  // The timestamp this activity actually happened at — submittedAt,
  // reviewedAt, or publishedAt depending on `status`.
  occurredAt: z.string()
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
    resultStatusCounts: ResultStatusCountsSchema,
    recentActivity: z.array(RecentActivityItemSchema)
  })
)

export const dashboardContract = {
  getAdminSummary
}
