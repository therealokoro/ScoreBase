import { implement, ORPCError } from "@orpc/server"

import type { APiContext } from "../context"
import { dashboardContract } from "../contracts/dashboard.contract"
import {
  fetchActiveSessionAndTerm,
  fetchDashboardCounts,
  fetchResultStatusCountsByTerm,
  fetchClassByTeacherId,
  fetchResultByTermAndClass
} from "../queries/dashboard.query"

const os = implement(dashboardContract).$context<APiContext>()

const getAdminSummary = os.getAdminSummary.handler(async () => {
  const [counts, { activeSession, activeTerm }] = await Promise.all([
    fetchDashboardCounts(),
    fetchActiveSessionAndTerm()
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
    resultStatusCounts
  }
})

const getTeacherSummary = os.getTeacherSummary.handler(async ({ context }) => {
  const teacherId = context.session?.user?.id
  if (!teacherId) throw new ORPCError("UNAUTHORIZED")

  const [klass, { activeSession, activeTerm }] = await Promise.all([
    fetchClassByTeacherId(teacherId),
    fetchActiveSessionAndTerm()
  ])

  // No class assigned yet — return early with everything else null/empty
  // rather than throwing, so the UI can show a clear "not assigned" state.
  if (!klass) {
    return {
      class: null,
      activeSession,
      activeTerm,
      result: null
    }
  }

  const classSummary = { id: klass.id, name: klass.name, studentCount: klass.students.length }

  // No active term configured at all — nothing further to resolve.
  if (!activeTerm) {
    return {
      class: classSummary,
      activeSession,
      activeTerm: null,
      result: null
    }
  }

  const result = await fetchResultByTermAndClass(activeTerm.id, klass.id)

  // Active term is set, but no result row exists yet for this class — the
  // admin hasn't created one. Distinct from a result existing in "draft".
  if (!result) {
    return {
      class: classSummary,
      activeSession,
      activeTerm,
      result: null
    }
  }

  return {
    class: classSummary,
    activeSession,
    activeTerm,
    result: { id: result.id, status: result.status }
  }
})

export const dashboardRouter = {
  getAdminSummary,
  getTeacherSummary
}
