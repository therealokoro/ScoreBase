import { implement } from "@orpc/server"

import type { APiContext } from "../context"
import { dashboardContract } from "../contracts/dashboard.contract"
import {
  fetchActiveSessionAndTerm,
  fetchDashboardCounts,
  fetchRecentResultActivity,
  fetchResultStatusCountsByTerm
} from "../queries/dashboard.query"

const os = implement(dashboardContract).$context<APiContext>()

const getAdminSummary = os.getAdminSummary.handler(async () => {
  const [counts, { activeSession, activeTerm }, recentActivity] = await Promise.all([
    fetchDashboardCounts(),
    fetchActiveSessionAndTerm(),
    fetchRecentResultActivity()
  ])

  // Result status counts are scoped to the active term — if there's no
  // active term set yet, every count is 0 rather than throwing or guessing
  // a fallback term.
  const resultStatusCounts = activeTerm
    ? await fetchResultStatusCountsByTerm(activeTerm.id)
    : { draft: 0, submitted: 0, reviewed: 0, published: 0 }

  return {
    counts,
    activeSession,
    activeTerm,
    resultStatusCounts,
    recentActivity
  }
})

export const dashboardRouter = {
  getAdminSummary
}
