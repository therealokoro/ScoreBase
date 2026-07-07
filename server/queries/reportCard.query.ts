import { db } from "@nuxthub/db"
import { eq } from "drizzle-orm"
import { computeReportCard } from "~~/shared/utils/report-card"
import type { ScoresheetInput } from "~~/shared/utils/report-card"

import { scoresheets } from "../db/schema"
import { getResultSettings } from "../kv/result-settings"
import { fetchResultForReportCard } from "./result.query"

/**
 * Fetches everything needed to render a single student's report card: - The parent result (name,
 * term, class, frozen scoreConfig) - The target student's scoresheet - All classmates' scoresheets
 * (for position ranking) - Fresh grade boundaries + position settings from KV
 *
 * Returns null if the scoresheet or its parent result doesn't exist.
 *
 * NOTE: schoolName is not yet in SchoolSettings — add to the return value once a school profile
 * settings screen is built.
 */
export async function fetchReportCardData(scoresheetId: string) {
  // Resolve the scoresheet → its resultId without loading the full result yet
  const targetSheet = await db.query.scoresheets.findFirst({
    where: eq(scoresheets.id, scoresheetId),
    columns: { resultId: true }
  })
  if (!targetSheet) return null

  const [result, resultSettings] = await Promise.all([
    fetchResultForReportCard(targetSheet.resultId),
    getResultSettings()
  ])
  if (!result) return null

  // Shape all scoresheets into ScoresheetInput[] for the computation function.
  // subject.name falls back to "Unknown" when the subject row was soft-deleted
  // (subjectId set to null, subject relation resolves as null).
  const allScoresheets: ScoresheetInput[] = result.scoresheets.map((sheet) => ({
    scoresheetId: sheet.id,
    studentId: sheet.student.id,
    studentName: sheet.student.name,
    studentSchoolId: sheet.student.studentId,
    subjectScores: sheet.subjectScores.map((score) => ({
      id: score.id,
      subjectName: score.subject?.name ?? "Unknown",
      caScores: score.caScores,
      exam: score.exam
    }))
  }))

  const targetScoresheetInput = allScoresheets.find((s) => s.scoresheetId === scoresheetId)
  if (!targetScoresheetInput) return null

  // Needed for remarks, which are stored on the DB row — not in the computed output
  const targetSheetRaw = result.scoresheets.find((s) => s.id === scoresheetId)!

  const computed = computeReportCard(
    targetScoresheetInput,
    allScoresheets,
    result.scoreConfig,
    resultSettings.gradeBoundaries,
    resultSettings.positionDisplayMode,
    resultSettings.positionTopN
  )

  return {
    resultName: result.name,
    resultStatus: result.status,
    scoreConfig: result.scoreConfig,
    term: result.term,
    class: result.class,
    computed,
    teacherRemark: targetSheetRaw.teacherRemark ?? null,
    principalRemark: targetSheetRaw.principalRemark ?? null,
    totalStudents: result.scoresheets.length
  }
}

export type ReportCardData = NonNullable<Awaited<ReturnType<typeof fetchReportCardData>>>
