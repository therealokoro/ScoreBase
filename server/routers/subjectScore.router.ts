import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { and, count, eq, inArray, isNull, sql } from "drizzle-orm"

import type { APiContext } from "../context"
import { subjectScoreContract } from "../contracts/subjectScore.contract"
import { subjectScores } from "../db/schema"
import {
  fetchSingleScoresheet,
  fetchSingleResult,
  fetchSingleSubjectScore
} from "../queries/result.query"
import { requireSession } from "../utils/auth-guard"

/**
 * Validates that every CA score in the incoming array is within the ceiling defined by the result's
 * scoreConfig snapshot.
 *
 * CaScores[i] must be ≤ scoreConfig.caMaxScores[i] . Returns the first out-of-bounds slot index, or
 * -1 if all are valid.
 */
function findExceedingCaSlot(caScores: (number | null)[], caMaxScores: number[]): number {
  for (let i = 0; i < caScores.length; i++) {
    const score = caScores[i] as number | null
    // null means "not entered yet" — skip ceiling check for empty slots
    if (score !== null && score > caMaxScores[i]!) {
      return i
    }
  }
  return -1
}

const os = implement(subjectScoreContract).$context<APiContext>()

/**
 * ADD SUBJECT SCORE — adds a subject row to a scoresheet.
 *
 * CaScores is initialised server-side as an array of nulls whose length matches the result's
 * scoreConfig.caCount. The client never supplies caScores.
 *
 * A duplicate check prevents the same subject being added twice to one sheet. Only allowed on draft
 * results.
 */
const addSubjectScore = os.addSubjectScore.handler(async ({ input, errors, context }) => {
  const user = requireSession(context)

  const scoresheet = await fetchSingleScoresheet(input.scoresheetId)
  if (!scoresheet) throw errors.NOT_FOUND()

  const result = await fetchSingleResult(scoresheet.resultId)
  if (!result) throw errors.NOT_FOUND()

  // Subjects can only be added while scores are still being entered
  if (result.status !== "draft") throw errors.PRECONDITION_FAILED()

  // Teachers are scoped to their class
  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  // Guard: prevent duplicate subject on the same scoresheet
  if (input.subjectId) {
    const duplicate = await db.query.subjectScores.findFirst({
      where: and(
        eq(subjectScores.scoresheetId, input.scoresheetId),
        eq(subjectScores.subjectId, input.subjectId)
      )
    })
    if (duplicate) throw errors.CONFLICT()
  } else {
    // Custom (subject-less) rows have no natural unique key, so cap them to keep a
    // scoresheet from being spammed with rows that skew averages/positions.
    const MAX_CUSTOM_SUBJECTS = 20
    const [customCount] = await db
      .select({ value: count() })
      .from(subjectScores)
      .where(and(eq(subjectScores.scoresheetId, input.scoresheetId), isNull(subjectScores.subjectId)))

    if ((customCount?.value ?? 0) >= MAX_CUSTOM_SUBJECTS) {
      throw errors.PRECONDITION_FAILED({ message: "This scoresheet has too many custom subjects" })
    }
  }

  // Seed caScores with one null slot per CA defined in the snapshot.
  // exam is seeded as null ("not yet entered"), matching result/scoresheet creation.
  const emptyCaScores = Array<null>(result.scoreConfig.caCount).fill(null)

  const [newScore] = await db
    .insert(subjectScores)
    .values({
      scoresheetId: input.scoresheetId,
      subjectId: input.subjectId ?? null,
      caScores: emptyCaScores,
      exam: null
    })
    .returning()

  return newScore!
})

/**
 * REMOVE SUBJECT SCORE — removes a subject row from a scoresheet. Only allowed on draft results;
 * published results are immutable.
 */
const removeSubjectScore = os.removeSubjectScore.handler(async ({ input, errors, context }) => {
  const user = requireSession(context)

  // Walk up: subjectScore → scoresheet → result
  const score = await fetchSingleSubjectScore(input.id)
  if (!score) throw errors.NOT_FOUND()

  const scoresheet = await fetchSingleScoresheet(score.scoresheetId)
  const result = await fetchSingleResult(scoresheet!.resultId)
  if (!result) throw errors.NOT_FOUND()

  if (result.status !== "draft") throw errors.PRECONDITION_FAILED()

  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  await db.delete(subjectScores).where(eq(subjectScores.id, input.id))

  return { success: true }
})

/**
 * UPDATE SUBJECT SCORE — teacher enters or updates CA and/or exam scores for a single subject row.
 *
 * Each CA score is validated against its slot ceiling from the snapshot
 * (scoreConfig.caMaxScores[i]). The exam score is validated against examMax.
 *
 * Scores can be edited on draft and submitted results. Published results are immutable (admin must
 * change status back to draft first).
 */
const updateSubjectScore = os.updateSubjectScore.handler(async ({ input, errors, context }) => {
  const user = requireSession(context)

  const score = await fetchSingleSubjectScore(input.id)
  if (!score) throw errors.NOT_FOUND()

  const scoresheet = await fetchSingleScoresheet(score.scoresheetId)
  const result = await fetchSingleResult(scoresheet!.resultId)
  if (!result) throw errors.NOT_FOUND()

  // Scores on published results are locked
  if (result.status === "published") throw errors.PRECONDITION_FAILED()

  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  const { scoreConfig } = result

  // Validate CA scores against per-slot ceilings from the snapshot
  if (input.caScores !== undefined) {
    // The incoming array must match the configured CA count exactly
    if (input.caScores.length !== scoreConfig.caCount) {
      throw errors.BAD_REQUEST({
        message: `Expected ${scoreConfig.caCount} CA scores, got ${input.caScores.length}`
      })
    }

    const badSlot = findExceedingCaSlot(input.caScores, scoreConfig.caMaxScores)
    if (badSlot !== -1) {
      throw errors.BAD_REQUEST({
        message: `CA${badSlot + 1} score exceeds the maximum of ${scoreConfig.caMaxScores[badSlot]}`
      })
    }
  }

  // Validate exam score against the snapshot ceiling
  if (
    input.exam !== null &&
    input.exam !== undefined &&
    (input.exam < 0 || input.exam > scoreConfig.examMax)
  ) {
    throw errors.BAD_REQUEST({
      message:
        input.exam < 0
          ? "Exam score cannot be negative"
          : `Exam score exceeds the maximum of ${scoreConfig.examMax}`
    })
  }

  const [updated] = await db
    .update(subjectScores)
    .set({
      ...(input.caScores !== undefined && { caScores: input.caScores }),
      ...(input.exam !== undefined && { exam: input.exam })
    })
    .where(eq(subjectScores.id, input.id))
    .returning()

  return updated!
})

/**
 * BULK UPDATE SUBJECT SCORES — saves all subject scores on a scoresheet in one round-trip. This is
 * the primary save operation from the score entry UI.
 *
 * The same ceiling checks as updateSubjectScore apply to every row. All rows are validated before
 * any DB writes — if one fails, nothing is saved.
 */
const bulkUpdateSubjectScores = os.bulkUpdateSubjectScores.handler(
  async ({ input, errors, context }) => {
    const user = requireSession(context)

    // Resolve the parent result via the scoresheet
    const scoresheet = await fetchSingleScoresheet(input.scoresheetId)
    if (!scoresheet) throw errors.NOT_FOUND()

    const result = await fetchSingleResult(scoresheet.resultId)
    if (!result) throw errors.NOT_FOUND()

    if (result.status === "published") throw errors.PRECONDITION_FAILED()

    if (user.role === "teacher" && result.classId !== user.classId) {
      throw errors.FORBIDDEN()
    }

    const { scoreConfig } = result

    // --- Validate ALL rows before writing anything ---
    for (const entry of input.scores) {
      if (entry.caScores !== undefined) {
        if (entry.caScores.length !== scoreConfig.caCount) {
          throw errors.BAD_REQUEST({
            message: `CA score array length mismatch on subject score ${entry.id}`
          })
        }
        const badSlot = findExceedingCaSlot(entry.caScores, scoreConfig.caMaxScores)
        if (badSlot !== -1) {
          throw errors.BAD_REQUEST({
            message: `CA${badSlot + 1} score exceeds the maximum of ${scoreConfig.caMaxScores[badSlot]} on subject score ${entry.id}`
          })
        }
      }
      if (
        entry.exam !== null &&
        entry.exam !== undefined &&
        (entry.exam < 0 || entry.exam > scoreConfig.examMax)
      ) {
        throw errors.BAD_REQUEST({
          message:
            entry.exam < 0
              ? `Exam score cannot be negative on subject score ${entry.id}`
              : `Exam score exceeds the maximum of ${scoreConfig.examMax} on subject score ${entry.id}`
        })
      }
    }

    // --- All valid — apply the updates with one statement per column, then read back. ---
    // Previously this issued one UPDATE per row (N sequential round trips on the connection);
    // a CASE update collapses that to at most two, and the read-back restores the returned rows.
    const ids = input.scores.map((entry) => entry.id)
    const caEntries = input.scores.filter((entry) => entry.caScores !== undefined)
    const examEntries = input.scores.filter((entry) => entry.exam !== undefined)

    const updated = await db.transaction(async (tx) => {
      if (caEntries.length > 0) {
        const cases = sql.join(
          caEntries.map(
            (entry) =>
              sql`when ${subjectScores.id} = ${entry.id} then ${JSON.stringify(entry.caScores)}`
          ),
          sql` `
        )
        await tx.run(
          sql`update ${subjectScores}
              set ca_scores = case ${cases} else ca_scores end
              where ${subjectScores.scoresheetId} = ${input.scoresheetId}
                and ${inArray(subjectScores.id, ids)}`
        )
      }

      if (examEntries.length > 0) {
        const cases = sql.join(
          examEntries.map((entry) => sql`when ${subjectScores.id} = ${entry.id} then ${entry.exam}`),
          sql` `
        )
        await tx.run(
          sql`update ${subjectScores}
              set exam = case ${cases} else exam end
              where ${subjectScores.scoresheetId} = ${input.scoresheetId}
                and ${inArray(subjectScores.id, ids)}`
        )
      }

      const rows = await tx.query.subjectScores.findMany({
        where: and(
          eq(subjectScores.scoresheetId, input.scoresheetId),
          inArray(subjectScores.id, ids)
        )
      })

      // Any id that does not belong to this scoresheet fails explicitly rather than
      // returning an undefined element that breaks the output schema.
      if (rows.length !== ids.length) {
        throw errors.NOT_FOUND({
          message: "One or more subject scores were not found on this scoresheet"
        })
      }

      return rows
    })

    return updated
  }
)

export const subjectScoreRouter = {
  addSubjectScore,
  removeSubjectScore,
  updateSubjectScore,
  bulkUpdateSubjectScores
}
