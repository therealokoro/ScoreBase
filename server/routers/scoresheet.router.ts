import { db } from "@nuxthub/db"
import { implement } from "@orpc/server"
import { inArray, and, eq } from "drizzle-orm"

import { type APiContext } from "../context"
import { scoresheetContract } from "../contracts/scoresheet.contract"
import { results, scoresheets, subjectScores } from "../db/schema"
import { fetchSingleResult, fetchSingleScoresheet } from "../queries/result.query"

const os = implement(scoresheetContract).$context<APiContext>()

/**
 * CREATE SCORESHEETS — bulk-creates one scoresheet per supplied student ID.
 *
 * The server resolves each student's current name and school-issued ID and snapshots them onto the
 * scoresheet row. It also pre-populates subject score rows from the class's subject list preset
 * (via the result's classId).
 *
 * Only allowed on a draft result — once submitted, the student list is locked.
 */
const createScoresheets = os.createScoresheets.handler(async ({ input, errors, context }) => {
  const user = context.session!.user

  const result = await fetchSingleResult(input.resultId)
  if (!result) throw errors.NOT_FOUND()

  // Scoresheets can only be added while the result is still being set up
  if (result.status !== "draft") throw errors.PRECONDITION_FAILED()

  // Teachers may only add scoresheets to results for their own class
  if (user.role === "teacher" && result.classId !== user.classId) {
    throw errors.FORBIDDEN()
  }

  // Fetch the student records we need for name/ID snapshots
  const studentRecords = await db.query.students.findMany({
    where: inArray(results.id, input.studentIds) // filters to the supplied IDs
  })

  // Verify all supplied IDs resolved to real students
  if (studentRecords.length !== input.studentIds.length) throw errors.NOT_FOUND()

  // Guard: none of these students should already have a scoresheet in this result
  const existingSheets = await db.query.scoresheets.findMany({
    where: and(
      eq(scoresheets.resultId, input.resultId),
      inArray(scoresheets.studentId, input.studentIds)
    ),
    columns: { id: true }
  })
  if (existingSheets.length > 0) throw errors.CONFLICT()

  // Fetch the class's subject list preset so we can pre-populate subject scores
  const classRecord = await db.query.classes.findFirst({
    where: eq(results.id, result.classId),
    with: { subjectList: true }
  })

  // caCount from the snapshot tells us how many CA slots to initialise as null
  const { caCount } = result.scoreConfig
  const emptyCaScores = Array<null>(caCount).fill(null)

  // Build and insert all scoresheets + their subject score rows in one transaction
  const createdScoresheets = await db.transaction(async (tx) => {
    const insertedSheets = await tx
      .insert(scoresheets)
      .values(
        studentRecords.map((student) => ({
          resultId: input.resultId,
          studentId: student.id
        }))
      )
      .returning()

    // Pre-populate subject scores from the class preset for every new scoresheet
    const presetSubjects = classRecord?.subjectList?.subjects ?? []

    if (presetSubjects.length > 0) {
      await tx.insert(subjectScores).values(
        insertedSheets.flatMap((sheet) =>
          presetSubjects.map((subject) => ({
            scoresheetId: sheet.id,
            subjectId: subject.id,
            subjectNameSnapshot: subject.name,
            // Initialise all CA slots as null — teacher fills them in later
            caScores: emptyCaScores,
            exam: null
          }))
        )
      )
    }

    return insertedSheets
  })

  return createdScoresheets
})

/**
 * GET ONE SCORESHEET — returns a scoresheet with its subject scores. Used by the teacher's score
 * entry view for a single student.
 */
const getOneScoresheet = os.getOneScoresheet.handler(async ({ input, errors, context }) => {
  const user = context.session!.user

  const scoresheet = await fetchSingleScoresheet(input.id)
  if (!scoresheet) throw errors.NOT_FOUND()

  // Resolve the parent result to enforce teacher scoping
  const result = await fetchSingleResult(scoresheet.resultId)
  if (user.role === "teacher" && result?.classId !== user.classId) {
    throw errors.NOT_FOUND()
  }

  return scoresheet
})

/**
 * UPDATE REMARKS — teacher updates their remark; admin updates the principal's remark. Both fields
 * are on the same row but guarded separately by role.
 */
const updateScoresheetRemarks = os.updateScoresheetRemarks.handler(
  async ({ input, errors, context }) => {
    const user = context.session!.user

    const scoresheet = await fetchSingleScoresheet(input.id)
    if (!scoresheet) throw errors.NOT_FOUND()

    // Resolve the parent result to check scope
    const result = await fetchSingleResult(scoresheet.resultId)
    if (!result) throw errors.NOT_FOUND()

    // Teacher can only update remarks on their own class's scoresheets
    if (user.role === "teacher" && result.classId !== user.classId) {
      throw errors.FORBIDDEN()
    }

    // Teachers may not set the principal's remark — that is admin-only
    if (user.role === "teacher" && input.principalRemark !== undefined) {
      throw errors.FORBIDDEN({ message: "Only admins can set the principal's remark" })
    }

    const [updated] = await db
      .update(scoresheets)
      .set({
        ...(input.teacherRemark !== undefined && { teacherRemark: input.teacherRemark }),
        ...(input.principalRemark !== undefined && { principalRemark: input.principalRemark })
      })
      .where(eq(scoresheets.id, input.id))
      .returning()

    return updated!
  }
)

export const scoresheetRouter = {
  createScoresheets,
  getOneScoresheet,
  updateScoresheetRemarks
}
