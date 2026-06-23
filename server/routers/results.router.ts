import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { and, eq, inArray } from "drizzle-orm"

import type { APiContext } from "../context"
import { resultContract } from "../contracts/result.contract"
import { classes, results, scoresheets, students, subjectScores, terms } from "../db/schema"
import { getResultScoreConfig } from "../kv/result-settings"
import {
  fetchResultWithScoresheets,
  fetchSingleResult,
  listResultsByClass,
  listAllResults
} from "../queries/result.query"

const TEACHER_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"]
}

const ADMIN_TRANSITIONS: Record<string, string[]> = {
  draft: ["submitted"],
  submitted: ["reviewed", "draft"],
  reviewed: ["published", "draft"],
  published: ["reviewed"]
}

const os = implement(resultContract).$context<APiContext>()

// ---------------------------------------------------------------------------
// Result handlers
// ---------------------------------------------------------------------------

const listResults = os.list.handler(async ({ context }) => {
  const user = context.session!.user
  if (user.role === "teacher") {
    return user.classId ? await listResultsByClass(user.classId) : []
  }
  return await listAllResults()
})

const getOneResult = os.getOne.handler(async ({ input, errors, context }) => {
  const user = context.session!.user
  const result = await fetchResultWithScoresheets(input.id)
  if (!result) throw errors.NOT_FOUND()
  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.NOT_FOUND()
  }
  return result
})

/**
 * CREATE — admin/teacher creates a result for a given term + class, and in the same transaction: 1.
 * Snapshots the current ResultSettings into scoreConfig 2. Creates the result row (status: draft)
 * 3. Bulk-creates a scoresheet for every student currently enrolled in the class 4. Pre-populates
 * each scoresheet's subject scores from the class's subject list preset, seeding caScores as an
 * array of 0 (length = caCount)
 *
 * This keeps "create a result" a single atomic action from the admin's point of view — a result is
 * never left in a state with zero scoresheets.
 */
const createResult = os.create.handler(async ({ input, errors }) => {
  // Guard: check the term and class actually exist
  // (fixed — previously checked results.id instead of terms.id / classes.id)
  const [term, cls] = await Promise.all([
    db.query.terms.findFirst({ where: eq(terms.id, input.termId) }),
    db.query.classes.findFirst({ where: eq(classes.id, input.classId) })
  ])
  if (!term || !cls) throw errors.NOT_FOUND()

  // Guard: enforce the one-result-per-term-per-class rule
  const existing = await db.query.results.findFirst({
    where: and(eq(results.termId, input.termId), eq(results.classId, input.classId))
  })
  if (existing) throw errors.CONFLICT()

  // Snapshot the current admin-configured score distribution
  const scoreConfig = await getResultScoreConfig()
  const emptyCaScores = Array<null>(scoreConfig.caCount).fill(null) // caScores defaults to null

  // Fetch the class's enrolled students and its subject list preset up front,
  // outside the transaction, since these are just reads
  const [enrolledStudents, classWithSubjects] = await Promise.all([
    db.query.students.findMany({ where: eq(students.classId, input.classId) }),
    db.query.classes.findFirst({
      where: eq(classes.id, input.classId),
      with: { subjectList: true }
    })
  ])

  // check and get subjects from the class's subject list
  const presetSubjects = classWithSubjects?.subjectList?.subjects ?? []

  // Everything below happens atomically — if any step fails, nothing is
  // persisted, so we never end up with a result that has no scoresheets
  const newResult = await db.transaction(async (tx) => {
    // 1. Insert the result row
    const [result] = await tx
      .insert(results)
      .values({ ...input, scoreConfig })
      .returning()

    // 2. Bulk-create one scoresheet per enrolled student
    if (enrolledStudents.length > 0) {
      const insertedSheets = await tx
        .insert(scoresheets)
        .values(
          enrolledStudents.map((student) => ({
            resultId: result!.id,
            studentId: student.id
          }))
        )
        .returning()

      // 3. Pre-populate subject scores from the class preset for every new scoresheet
      if (presetSubjects.length > 0) {
        await tx.insert(subjectScores).values(
          insertedSheets.flatMap((sheet) =>
            presetSubjects.map((subject) => ({
              scoresheetId: sheet.id,
              subjectId: subject.id,
              caScores: emptyCaScores,
              exam: null // exam score defaults to null
            }))
          )
        )
      }
    }

    return result!
  })

  return newResult
})

/** UPDATE SCORE CONFIG — unchanged from before */
const updateResultScoreConfig = os.updateScoreConfig.handler(async ({ input, errors, context }) => {
  const user = context.session!.user
  if (user.role !== "admin") throw errors.FORBIDDEN()

  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()

  if (result.status === "published") throw errors.PRECONDITION_FAILED()
  if (result.status === "submitted")
    throw errors.PRECONDITION_FAILED({
      message: "Score config cannot be changed while a result is under review"
    })

  const newCaCount = input.scoreConfig.caCount
  const oldCaCount = result.scoreConfig.caCount
  const caCountChanged = newCaCount !== oldCaCount

  const [updatedResult] = await db.transaction(async (tx) => {
    const updated = await tx
      .update(results)
      .set({ scoreConfig: input.scoreConfig })
      .where(eq(results.id, input.id))
      .returning()

    if (caCountChanged) {
      const resultScoresheets = await tx.query.scoresheets.findMany({
        where: eq(scoresheets.resultId, input.id),
        columns: { id: true }
      })
      const scoresheetIds = resultScoresheets.map((s) => s.id)

      if (scoresheetIds.length > 0) {
        const existingScores = await tx.query.subjectScores.findMany({
          where: inArray(subjectScores.scoresheetId, scoresheetIds),
          columns: { id: true, caScores: true }
        })

        await Promise.all(
          existingScores.map((row) => {
            const resized = Array.from({ length: newCaCount }, (_, i) =>
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

/** UPDATE STATUS — unchanged from before */
const updateResultStatus = os.updateStatus.handler(async ({ input, errors, context }) => {
  const user = context.session!.user
  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()

  const allowedTransitions = user.role === "admin" ? ADMIN_TRANSITIONS : TEACHER_TRANSITIONS
  const validNextStatuses = allowedTransitions[result.status] ?? []

  if (!validNextStatuses.includes(input.status)) {
    throw errors.PRECONDITION_FAILED({
      message: `Cannot move a result from "${result.status}" to "${input.status}"`
    })
  }

  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  const now = new Date().toISOString()
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

/** DELETE — unchanged from before */
const deleteResult = os.delete.handler(async ({ input, errors }) => {
  const result = await fetchSingleResult(input.id)
  if (!result) throw errors.NOT_FOUND()
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
