import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { and, eq, inArray } from "drizzle-orm"

import type { APiContext } from "../context"
import { resultContract } from "../contracts/result.contract"
import { results, scoresheets, subjectScores } from "../db/schema"
import { getResultScoreConfig } from "../kv/result-settings"
import {
  fetchResultWithScoresheets,
  fetchSingleResult,
  fetchScoresheetWithResult,
  listResultsByClass,
  listAllResults
} from "../queries/result.query"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Resolves the result that owns a given scoresheet, then returns both. Used in
 * scoresheet/subjectScore procedures that need to check result status and role permissions without
 * the caller having to do two separate lookups.
 */
async function getResultForScoresheet(scoresheetId: string) {
  // fetchScoresheetWithResult joins scoresheets → results in one query
  const scoresheet = await fetchScoresheetWithResult(scoresheetId)
  return scoresheet ?? null
}

/**
 * Valid status transitions per role.
 *
 * Teacher may only move a result from draft → submitted (i.e. hand it to admin). Admin can move it
 * forward (submitted → reviewed → published) or reject it back to draft from any non-published
 * state for corrections.
 *
 * The object maps: currentStatus → set of statuses the given role may move to.
 */
const TEACHER_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"]
}

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"], // admin can also submit on behalf of a teacher
  submitted: ["reviewed", "draft"], // draft = reject back for corrections
  reviewed: ["published", "draft"] // draft = reject back for corrections
}

// ---------------------------------------------------------------------------
// Router setup
// ---------------------------------------------------------------------------

// `implement` binds the contract so TypeScript knows the exact input/output/error
// shapes for each procedure handler. APiContext gives us `context.session`.
const os = implement(resultContract).$context<APiContext>()

// ---------------------------------------------------------------------------
// Result handlers
// ---------------------------------------------------------------------------

/**
 * LIST — returns all results. Admin sees every result across all classes. Teacher sees only the
 * result(s) for their assigned class.
 */
const listResults = os.list.handler(async ({ context }) => {
  const user = context.session!.user

  // Teachers are scoped to their class — listResultsByClass filters by teacher's classId
  if (user.role === "teacher") {
    return user.classId ? await listResultsByClass(user.classId) : []
  }

  // Admins get the full picture
  return await listAllResults()
})

/**
 * GET ONE — returns a single result with all scoresheets and subject scores nested. Used by the
 * scoresheet entry page and the report card preview.
 */
const getOneResult = os.getOne.handler(async ({ input, errors, context }) => {
  const user = context.session!.user

  const result = await fetchResultWithScoresheets(input.id)
  if (!result) throw errors.NOT_FOUND()

  // Teachers may only view results for their own class
  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.NOT_FOUND() // intentionally vague — don't reveal other classes exist
  }

  return result
})

/**
 * CREATE — admin creates a result for a given term + class.
 *
 * The scoreConfig supplied by the client is the snapshot — a copy of whatever the admin currently
 * has configured. It is validated by the contract input schema (sum-to-100, caCount matches array
 * length) before reaching here.
 *
 * Only one result is allowed per (term × class) pair.
 */
const createResult = os.create.handler(async ({ input, errors }) => {
  // Guard: check the term and class actually exist
  const [term, cls] = await Promise.all([
    db.query.terms.findFirst({ where: eq(results.id, input.termId) }),
    db.query.classes.findFirst({ where: eq(results.id, input.classId) })
  ])

  if (!term || !cls) throw errors.NOT_FOUND()

  // Guard: enforce the one-result-per-term-per-class rule
  const existing = await db.query.results.findFirst({
    // check if a result exists with the current term, for current class
    where: and(eq(results.termId, input.termId), eq(results.classId, input.classId))
  })
  if (existing) throw errors.CONFLICT()

  const scoreConfig = await getResultScoreConfig()

  // Insert the result — status defaults to "draft" (set in schema)
  // scoreConfig is persisted as-is; it will never be touched by score changes
  const [newResult] = await db
    .insert(results)
    .values({ ...input, scoreConfig })
    .returning()

  return newResult!
})

/**
 * UPDATE SCORE CONFIG — admin edits the frozen scoreConfig snapshot on a result.
 *
 * Allowed only while status is draft or reviewed (not submitted or published), since a submitted
 * result is "in admin's hands" and published is final.
 *
 * If caCount changes, all existing subjectScores.caScores arrays on this result are resized in the
 * same transaction: - Growing (e.g. 2 → 3 CAs): new slots are appended as null - Shrinking (e.g. 3
 * → 2 CAs): trailing slots are dropped (scores lost — by design)
 */
const updateResultScoreConfig = os.updateScoreConfig.handler(async ({ input, errors, context }) => {
  const user = context.session!.user

  // Only admins may touch the score config
  if (user.role !== "admin") throw errors.FORBIDDEN()

  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()

  // Published results are final — score config is locked
  if (result.status === "published") throw errors.PRECONDITION_FAILED()

  // Also block edits on submitted results — they're in admin review, not open for changes
  if (result.status === "submitted")
    throw errors.PRECONDITION_FAILED({
      message: "Score config cannot be changed while a result is under review"
    })

  const newCaCount = input.scoreConfig.caCount
  const oldCaCount = result.scoreConfig.caCount
  const caCountChanged = newCaCount !== oldCaCount

  // Run everything in a transaction so the config and all caScores arrays
  // are always in sync — no partial state if something fails mid-way
  const [updatedResult] = await db.transaction(async (tx) => {
    // 1. Update the scoreConfig snapshot on the result row itself
    const updated = await tx
      .update(results)
      .set({ scoreConfig: input.scoreConfig })
      .where(eq(results.id, input.id))
      .returning()

    // 2. If caCount changed, resize every subjectScore's caScores array
    //    across all scoresheets belonging to this result
    if (caCountChanged) {
      // Collect all scoresheet IDs for this result
      const resultScoresheets = await tx.query.scoresheets.findMany({
        where: eq(scoresheets.resultId, input.id),
        columns: { id: true }
      })
      const scoresheetIds = resultScoresheets.map((s) => s.id)

      if (scoresheetIds.length > 0) {
        // Collect all subjectScore rows for those scoresheets
        const existingScores = await tx.query.subjectScores.findMany({
          where: inArray(subjectScores.scoresheetId, scoresheetIds),
          columns: { id: true, caScores: true }
        })

        // Resize each caScores array to match the new caCount
        await Promise.all(
          existingScores.map((row) => {
            const resized = Array.from({ length: newCaCount }, (_, i) =>
              // Preserve existing scores where slots overlap; fill new slots with null
              i < row.caScores.length ? row.caScores[i]! : null
            )
            return tx
              .update(subjectScores)
              .set({ caScores: resized })
              .where(eq(subjectScores.id, row.id))
          })
        )
      }
    }

    return updated
  })

  return updatedResult!
})

/**
 * UPDATE STATUS — advances or reverts the result lifecycle.
 *
 * Teacher can only move: draft → submitted Admin can move: submitted → reviewed → published
 * submitted → draft (reject for corrections) reviewed → draft (reject for corrections)
 *
 * Timestamps (submittedAt, reviewedAt, publishedAt) and actor IDs (submittedById, reviewedById) are
 * set automatically based on the transition.
 */
const updateResultStatus = os.updateStatus.handler(async ({ input, errors, context }) => {
  const user = context.session!.user

  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()

  // Determine which transition map to use for this user's role
  const allowedTransitions = user.role === "admin" ? ADMIN_TRANSITIONS : TEACHER_TRANSITIONS

  const validNextStatuses = allowedTransitions[result.status] ?? []

  // Check the requested target status is a permitted next step
  if (!validNextStatuses.includes(input.status)) {
    throw errors.PRECONDITION_FAILED({
      message: `Cannot move a result from "${result.status}" to "${input.status}"`
    })
  }

  // Teachers may only act on results for their assigned class
  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  const now = new Date().toISOString()

  // Build the extra audit fields that go with each transition
  const auditFields: Partial<typeof results.$inferInsert> = {}

  if (input.status === "submitted") {
    auditFields.submittedById = user.id
    auditFields.submittedAt = now
  } else if (input.status === "reviewed" || input.status === "published") {
    auditFields.reviewedById = user.id
    auditFields.reviewedAt = now
    if (input.status === "published") auditFields.publishedAt = now
  }

  const [updated] = await db
    .update(results)
    .set({ status: input.status, ...auditFields })
    .where(eq(results.id, input.id))
    .returning()

  return updated!
})

/**
 * DELETE — removes a result and all its scoresheets/subject scores via cascade. Only permitted
 * while the result is still a draft — once submitted it belongs to the review process.
 */
const deleteResult = os.delete.handler(async ({ input, errors }) => {
  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()

  // Prevent deleting results that have entered the review lifecycle
  if (result.status !== "draft") throw errors.PRECONDITION_FAILED()

  await db.delete(results).where(eq(results.id, input.id))

  return { success: true }
})

export const resultRouter = {
  list: listResults,
  getOne: getOneResult,
  create: createResult,
  updateScoreConfig: updateResultScoreConfig,
  updateStatus: updateResultStatus,
  delete: deleteResult
}
